"""
اendpoint های پنل همکار (سلر/فروشنده).

مسیرها:
- POST /api/reseller/auth/token        ورود با توکن ۱۶ رقمی
- POST /api/reseller/logout            خروج
- GET  /api/reseller/me                اطلاعات پروفایل + موجودی کیف پول
- POST /api/reseller/profile           تکمیل/به‌روزرسانی پروفایل
- GET  /api/reseller/catalog           لیست محصول + پله‌های قیمت
- GET  /api/reseller/orders            لیست سفارش‌های همکار جاری
- POST /api/reseller/orders            ساخت سفارش جدید (پرداخت از کیف پول)
- GET  /api/reseller/orders/<tracking> جزئیات یک سفارش
- GET  /api/reseller/wallet            تراکنش‌های کیف پول
- POST /api/reseller/wallet/topup      شروع شارژ کیف پول (زرین‌پال)
- GET  /api/reseller/wallet/verify     callback زرین‌پال پس از پرداخت شارژ

اendpoint های ادمین:
- GET  /api/admin/resellers                       لیست همکاران
- POST /api/admin/resellers                       ساخت همکار جدید (صدور توکن)
- PATCH /api/admin/resellers/<id>                 تأیید/رد/ویرایش
- POST /api/admin/resellers/<id>/rotate-token     صدور توکن جدید
- POST /api/admin/resellers/<id>/wallet-adjust    تعدیل دستی موجودی
- POST /api/admin/resellers/<id>/channel-check    خواندن تعداد اعضای کانال
- GET  /api/admin/reseller-tiers                  لیست پله‌های قیمت
- PUT  /api/admin/reseller-tiers                  جایگزینی پله‌های یک محصول
"""

import hashlib
import json
import logging
import re
import secrets
import time
from datetime import datetime, timedelta
from decimal import Decimal

import requests
from django.contrib.auth import login, logout
from django.contrib.auth.models import User
from django.core.cache import cache
from django.db import transaction
from django.db.models import Count, Max, Q, Sum
from django.http import HttpResponseNotAllowed, JsonResponse
from django.shortcuts import get_object_or_404
from django.utils import timezone
from .telegram_channel_service import get_channel_members
from django.views.decorators.csrf import csrf_exempt

from .models import (
    Order,
    OrderItem,
    OrderItemAccount,
    Payment,
    Product,
    ProductVariant,
    ResellerPriceTier,
    ResellerProfile,
    ResellerWalletTxn,
    SiteSetting,
    UserProfile,
)
from .views import (
    _admin_order_dict,
    _is_admin_user,
    _verify_recaptcha,
    _captcha_required,
    _get_setting,
    RECAPTCHA_SITEKEY,
    HCAPTCHA_SITEKEY,
)
from .zarinpal_service import ZarinPalService

logger = logging.getLogger(__name__)


# -----------------------------------------------------------------------
# ثابت‌ها
# -----------------------------------------------------------------------
RESELLER_TIER_KEY = "reseller"
IRAN_NID_WEIGHTS = [10, 9, 8, 7, 6, 5, 4, 3, 2]
TELEGRAM_CHANNEL_RE = re.compile(r"(?:https?://)?(?:t\.me|telegram\.me)/([A-Za-z0-9_]+)/?$", re.IGNORECASE)
TELEGRAM_CHANNEL_HANDLE_RE = re.compile(r"@?([A-Za-z0-9_]{4,})")

# -----------------------------------------------------------------------
# قیمت‌گذاری لیر-محور کروپک (و قانون نوسان ۵٪)
# فرمول: قیمت پله = base × (نرخ لیر فعلی / نرخ مرجع)
# نرخ مرجع و قیمت‌های پایه در SiteSetting قابل بازنویسی هستند.
# -----------------------------------------------------------------------
CREW_SLUG = "fortnite-crew-pack"
VBUCKS_SLUG = "v-bucks"
DEFAULT_LIRA_REF_RATE = 3360        # نرخ لیر مرجع (تومان) که قیمت‌های پایه روی آن تعریف شده‌اند
DEFAULT_CREW_SINGLE_BASE = 459000   # قیمت پایه‌ی تک‌عددی در نرخ مرجع
DEFAULT_CREW_TEN_BASE = 429000      # قیمت پایه‌ی ۱۰+ در نرخ مرجع
DEFAULT_FLUCT_THRESHOLD = 5         # درصد مجاز نوسان لیر قبل از محاسبه ما‌به‌التفاوت
DEFAULT_CREW_BEHAVIOR_MAX_SINGLE = 529_000   # بیش‌ترین قیمت تک‌عددی (حداقل تخفیف)
DEFAULT_CREW_BEHAVIOR_MIN_SINGLE = 489_000   # کم‌ترین قیمت تک‌عددی (حداکثر تخفیف)
DEFAULT_CREW_BEHAVIOR_MAX_TEN = 515_000
DEFAULT_CREW_BEHAVIOR_MIN_TEN = 474_000
BEHAVIOR_PRICING_ENABLED_DEFAULT = True


def _setting_int(key: str, default: int) -> int:
    try:
        s = SiteSetting.objects.filter(key=key).first()
        if s and (s.value_text or "").strip():
            return int(s.value_text.strip())
    except Exception:
        pass
    return default


def _setting_bool(key: str, default: bool) -> bool:
    try:
        s = SiteSetting.objects.filter(key=key).first()
        if s and (s.value_text or "").strip():
            return s.value_text.strip().lower() in ("true", "1", "yes")
    except Exception:
        pass
    return default


def _lira_rate() -> int:
    # ابتدا بررسی کش که توسط views.currency_rates پر می‌شود
    rates = cache.get("currency_rates:last_good")
    if rates and isinstance(rates, dict) and "try" in rates:
        try:
            val = int(rates["try"])
            if val > 0:
                return int(round(val / 10.0))
        except Exception:
            pass

    # در صورت عدم وجود در کش، تلاش برای دریافت زنده از tgju.org (همانند views.currency_rates)
    try:
        session = requests.Session()
        session.trust_env = False
        session.proxies = {"http": "", "https": ""}
        response = session.get(
            "https://www.tgju.org/currency",
            timeout=6,
            headers={
                "User-Agent": "Mozilla/5.0 (compatible; NubixShopReseller/1.0)",
                "Accept": "text/html,application/xhtml+xml",
            },
        )
        if response.status_code == 200:
            html = response.text
            pattern = r'(?:data-market-row|data-market-nameslug)=["\']price_try["\'][\s\S]{0,5000}?data-price=["\']([^"\']+)["\']'
            match = re.search(pattern, html, re.IGNORECASE)
            if match:
                price_str = re.sub(r"[^\d]", "", match.group(1))
                if price_str:
                    val = int(price_str)
                    if val > 0:
                        # پر کردن کش برای استفاده‌های بعدی
                        pattern_usd = r'(?:data-market-row|data-market-nameslug)=["\']price_dollar_rl["\'][\s\S]{0,5000}?data-price=["\']([^"\']+)["\']'
                        match_usd = re.search(pattern_usd, html, re.IGNORECASE)
                        usd_val = 0
                        if match_usd:
                            usd_str = re.sub(r"[^\d]", "", match_usd.group(1))
                            if usd_str:
                                usd_val = int(usd_str)
                        
                        if usd_val > 0:
                            rates_to_cache = {
                                "usd": usd_val,
                                "try": val,
                                "source": "https://www.tgju.org/currency",
                                "fetchedAt": timezone.now().isoformat(),
                                "stale": False
                            }
                            cache.set("currency_rates:last_good", rates_to_cache, 86400)
                            cache.set("currency_rates:fresh", True, 600)
                        
                        return int(round(val / 10.0))
    except Exception:
        pass

    # فال‌بک به تنظیمات دیتابیس
    return _setting_int("lira_rate", 0)


def _crew_pricing_config() -> dict:
    return {
        "ref_rate": _setting_int("reseller_crew_ref_rate", DEFAULT_LIRA_REF_RATE),
        "single_base": _setting_int("reseller_crew_single_base", DEFAULT_CREW_SINGLE_BASE),
        "ten_base": _setting_int("reseller_crew_ten_base", DEFAULT_CREW_TEN_BASE),
        "fluct_threshold": _setting_int("reseller_fluct_threshold", DEFAULT_FLUCT_THRESHOLD),
        "lira_rate": _lira_rate(),
    }


def _round_toman(n: int) -> int:
    """گرد کردن به نزدیک‌ترین ۱,۰۰۰ تومان و کسر ۵,۰۰۰ تومان در صورت رند بودن روی مضرب ۱۰۰,۰۰۰."""
    val = int(round(n / 1000.0) * 1000)
    if val > 0 and val % 100000 == 0:
        val -= 5000
    return val


def _crew_tiers_for_rate(rate: int, cfg: dict | None = None) -> list:
    """پله‌های قیمت کروپک را بر اساس نرخ لیر فعلی محاسبه می‌کند.

    خروجی: [{"min_quantity":1,"price":..,"active":True},{"min_quantity":10,...}]
    """
    cfg = cfg or _crew_pricing_config()
    ref = cfg["ref_rate"] or 1
    if rate <= 0:
        rate = _lira_rate() or ref
    single = _round_toman(cfg["single_base"] * rate / ref)
    ten = _round_toman(cfg["ten_base"] * rate / ref)
    if ten >= single:
        ten = _round_toman(single * 0.94)
    return [
        {"min_quantity": 1, "price": single, "active": True},
        {"min_quantity": 10, "price": ten, "active": True},
    ]


def _crew_unit_price_for_quantity(qty: int, rate: int, cfg: dict | None = None) -> int:
    tiers = _crew_tiers_for_rate(rate, cfg)
    active = sorted([t for t in tiers if t["active"]], key=lambda t: -t["min_quantity"])
    for t in active:
        if qty >= t["min_quantity"]:
            return t["price"]
    return 0


def _lira_fluctuation(locked_rate: int, current_rate: int) -> dict:
    """محاسبه‌ی درصد نوسان و وضعیت عبور از آستانه‌ی ۵٪."""
    if not locked_rate or not current_rate:
        return {"pct": 0, "exceeded": False, "direction": "none"}
    pct = ((current_rate - locked_rate) / locked_rate) * 100
    cfg = _crew_pricing_config()
    threshold = cfg["fluct_threshold"]
    return {
        "pct": round(pct, 2),
        "exceeded": abs(pct) > threshold,
        "direction": "up" if pct > 0 else ("down" if pct < 0 else "none"),
        "threshold": threshold,
    }


# -----------------------------------------------------------------------
# تخفیف رفتاری همکار (Behaviour-based dynamic pricing)
# -----------------------------------------------------------------------
def _compute_behavior_discount(profile: ResellerProfile) -> dict:
    """محاسبه تخفیف رفتاری همکار بر اساس مجموع خرید، تعداد سفارش موفق، نرخ موفقیت و قدمت حساب.

    خروجی شامل loyalty_score (0-100)، قیمت‌های کروپک تک‌عددی و ۱۰+عددی، و درصد تخفیف.
    """
    now = timezone.now()

    spend_txn = ResellerWalletTxn.objects.filter(profile=profile, kind="order").aggregate(s=Sum("amount"))["s"] or 0
    wallet_spend = abs(int(spend_txn))
    orders_qs = Order.objects.filter(is_reseller_order=True, user_id=profile.user_id).exclude(
        status__in=["wallet_topup"]
    ).exclude(note__icontains="شارژ کیف پول")
    wallet_order_ids = ResellerWalletTxn.objects.filter(
        profile=profile, kind="order"
    ).values_list("related_order_id", flat=True)
    direct_order_ids = list(
        orders_qs.filter(payments__status="verified")
        .exclude(id__in=wallet_order_ids)
        .values_list("id", flat=True)
        .distinct()
    )
    direct_spend = Order.objects.filter(id__in=direct_order_ids).aggregate(s=Sum("amount"))["s"] or 0
    total_spend = wallet_spend + int(direct_spend)

    completed_statuses = ["paid", "registered", "processing", "completed"]
    completed_orders = orders_qs.filter(status__in=completed_statuses).count()
    total_orders = orders_qs.count()

    success_rate = round((completed_orders / total_orders) * 100) if total_orders else 0

    account_age_days = (now - profile.created_at).days if profile.created_at else 0

    spend_score = min(40, int((total_spend / 50_000_000) * 40)) if total_spend > 0 else 0
    order_score = min(30, int((completed_orders / 100) * 30)) if completed_orders > 0 else 0
    sr_score = 0
    if success_rate >= 90:
        sr_score = min(20, int(((success_rate - 90) / 10) * 20))
    age_score = min(10, int((account_age_days / 180) * 10)) if account_age_days > 0 else 0

    loyalty_score = min(100, spend_score + order_score + sr_score + age_score)

    max_single = _setting_int("reseller_behavior_max_single", DEFAULT_CREW_BEHAVIOR_MAX_SINGLE)
    min_single = _setting_int("reseller_behavior_min_single", DEFAULT_CREW_BEHAVIOR_MIN_SINGLE)
    max_ten = _setting_int("reseller_behavior_max_ten", DEFAULT_CREW_BEHAVIOR_MAX_TEN)
    min_ten = _setting_int("reseller_behavior_min_ten", DEFAULT_CREW_BEHAVIOR_MIN_TEN)

    crew_single = max_single - int((loyalty_score / 100) * (max_single - min_single))
    crew_ten = max_ten - int((loyalty_score / 100) * (max_ten - min_ten))

    crew_single = (crew_single // 1000) * 1000
    crew_ten = (crew_ten // 1000) * 1000

    return {
        "loyalty_score": loyalty_score,
        "crew_single": crew_single,
        "crew_ten": crew_ten,
        "discount_percent": loyalty_score,
    }


# -----------------------------------------------------------------------
# helper ها
# -----------------------------------------------------------------------
def _client_ip(request) -> str:
    forwarded = request.META.get("HTTP_X_FORWARDED_FOR", "")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.META.get("REMOTE_ADDR", "")


def _hash_token(raw_token: str) -> str:
    return hashlib.sha256(raw_token.strip().encode("utf-8")).hexdigest()


def _normalize_token(raw_token: str) -> str:
    """حذف فاصله و dash؛ فقط ارقام باقی می‌ماند."""
    return re.sub(r"[^0-9]", "", raw_token or "")


def _generate_raw_token() -> str:
    """تولید توکن ۱۶ رقمی تصادفی (صفر-leading مجاز، امن)."""
    return "".join(str(secrets.randbelow(10)) for _ in range(16))


def _generate_seller_code() -> str:
    """تولید seller_code یکتا به فرم NS-XXXX (4 رقم)."""
    for _ in range(40):
        code = f"NS-{secrets.randbelow(10000):04d}"
        if not ResellerProfile.objects.filter(seller_code=code).exists():
            return code
    raise RuntimeError("Could not generate a unique seller_code after 40 attempts")


def _reseller_rate_limit(ip: str, scope: str, max_attempts: int = 10, window_sec: int = 900) -> bool:
    """Rate limit ساده: True یعنی مجاز، False یعنی بلاک."""
    if not ip:
        return True
    key = f"reseller_rl:{scope}:{ip}"
    current = cache.get(key, 0)
    if current >= max_attempts:
        return False
    # set با TTL
    try:
        cache.add(key, current + 1, window_sec)
    except Exception:
        pass
    return True


def _is_reseller_user(user) -> bool:
    if not user or not user.is_authenticated:
        return False
    if user.is_staff:
        return False
    try:
        return user.profile.tier == "reseller"
    except Exception:
        return False


def _get_reseller_profile(user) -> ResellerProfile | None:
    try:
        return user.reseller_profile
    except ResellerProfile.DoesNotExist:
        return None


def _reseller_dict(profile: ResellerProfile) -> dict:
    return {
        "id": profile.id,
        "seller_code": profile.seller_code,
        "status": profile.status,
        "status_fa": dict(ResellerProfile.STATUS_CHOICES).get(profile.status, profile.status),
        "support_name": profile.support_name,
        "shop_link": profile.shop_link,
        "channel_link": profile.channel_link,
        "channel_members_estimated": profile.channel_members_estimated,
        "channel_checked_at": profile.channel_checked_at.isoformat() if profile.channel_checked_at else None,
        "legal_name": profile.legal_name,
        "national_id": profile.national_id,
        "contact_phone": profile.contact_phone,
        "email": profile.email,
        "bank_card_number": profile.bank_card_number,
        "bank_sheba": profile.bank_sheba,
        "bank_holder": profile.bank_holder,
        "wallet_balance": profile.wallet_balance,
        "low_balance_threshold": profile.low_balance_threshold,
        "referral_code": profile.seller_code,
        "referred_by_code": profile.referred_by.seller_code if profile.referred_by_id else None,
        "is_profile_complete": profile.is_profile_complete,
        "is_verified": profile.is_fully_verified,
        "verified_at": profile.verified_at.isoformat() if profile.verified_at else None,
        "updated_at": profile.updated_at.isoformat() if profile.updated_at else None,
        "last_login_at": profile.last_login_at.isoformat() if profile.last_login_at else None,
        "welcome_seen": profile.welcome_seen_at is not None,
        "welcome_seen_at": profile.welcome_seen_at.isoformat() if profile.welcome_seen_at else None,
        "rules_accepted_at": profile.rules_accepted_at.isoformat() if profile.rules_accepted_at else None,
    }


def _validate_iran_national_id(value: str) -> bool:
    if not value or len(value) != 10 or not value.isdigit():
        return False
    check = int(value[9])
    s = sum(int(value[i]) * IRAN_NID_WEIGHTS[i] for i in range(9))
    r = s % 11
    if r < 2:
        return check == r
    return check == 11 - r


def _validate_sheba(value: str) -> bool:
    if not value:
        return False
    s = value.strip().upper()
    if not re.fullmatch(r"IR[0-9]{24}", s):
        return False
    # الگوریتم checksum Mod-97
    rearranged = s[4:] + s[:4]
    expanded = "".join(str(int(ch, 36)) for ch in rearranged)
    return int(expanded) % 97 == 1


def _validate_card_number(value: str) -> bool:
    digits = re.sub(r"[^0-9]", "", value or "")
    if len(digits) != 16:
        return False
    # الگوریتم Luhn
    total = 0
    for i, ch in enumerate(reversed(digits)):
        n = int(ch)
        if i % 2 == 0:
            total += n
        else:
            n *= 2
            total += n - 9 if n > 9 else n
    return total % 10 == 0


def _parse_telegram_channel_username(channel_link: str) -> str | None:
    if not channel_link:
        return None
    s = channel_link.strip()
    m = TELEGRAM_CHANNEL_RE.match(s)
    if m:
        return m.group(1)
    m2 = TELEGRAM_CHANNEL_HANDLE_RE.match(s)
    if m2:
        return m2.group(1)
    return None


# -----------------------------------------------------------------------
# AUTH endpoints
# -----------------------------------------------------------------------
@csrf_exempt
def reseller_signup(request):
    """POST /api/reseller/signup — ثبت‌نام عمومی همکار پس از پذیرش قوانین.

    برخلاف admin_reseller_create (که فقط ادمین می‌تواند صدا بزند)، این
    endpoint عمومی است و خودِ متقاضی آن را با نام و شماره تماس و تیک
    «پذیرش قوانین» صدا می‌زند. حساب با status=draft ساخته می‌شود — دقیقاً
    همان مسیر حساب‌های ادمین‌ساز را طی می‌کند (ورود با توکن -> ویزارد
    onboarding -> در پایان به‌صورت خودکار pending_review می‌شود -> تایید
    نهایی با ادمین).
    """
    if request.method != "POST":
        return HttpResponseNotAllowed(["POST"])

    ip = _client_ip(request)
    if not _reseller_rate_limit(ip, "signup", max_attempts=8, window_sec=3600):
        return JsonResponse(
            {"message": "تعداد درخواست‌های ثبت‌نام زیاد است. کمی بعد دوباره تلاش کنید."},
            status=429,
        )

    try:
        payload = json.loads(request.body.decode("utf-8") or "{}")
    except Exception:
        return JsonResponse({"message": "JSON نامعتبر"}, status=400)

    support_name = (payload.get("support_name") or "").strip()
    if not support_name or len(support_name) < 2:
        return JsonResponse({"message": "نام یا نام فروشگاه الزامی است."}, status=400)

    phone = _normalize_phone(re.sub(r"\D", "", str(payload.get("phone") or "")))
    if phone and not PHONE_RE_FULL.match(phone):
        return JsonResponse({"message": "شماره موبایل نامعتبر است."}, status=400)

    if not payload.get("rules_accepted"):
        return JsonResponse({"message": "برای ثبت‌نام باید شرایط همکاری را بپذیرید."}, status=400)

    with transaction.atomic():
        for _ in range(5):
            seller_code = _generate_seller_code()
            try:
                username = f"reseller_{seller_code.replace('-', '')}"
                if User.objects.filter(username=username).exists():
                    continue
                user = User(
                    username=username,
                    email=f"{seller_code.lower().replace('-', '')}@reseller.nubixshop.ir",
                )
                user.set_unusable_password()
                user.save()
                UserProfile.objects.create(user=user, tier="reseller")

                raw_token = _generate_raw_token()
                profile = ResellerProfile.objects.create(
                    user=user,
                    seller_code=seller_code,
                    token_hash=_hash_token(raw_token),
                    token_prefix=raw_token[:4],
                    status="draft",
                    support_name=support_name,
                    contact_phone=phone,
                    rules_accepted_at=timezone.now(),
                )
                break
            except Exception:
                logger.exception("Reseller signup error")
                return JsonResponse({"message": "خطا در ثبت‌نام. دوباره تلاش کنید."}, status=500)
        else:
            return JsonResponse({"message": "خطا در تولید کد سلر یکتا."}, status=500)

    return JsonResponse(
        {
            "ok": True,
            "token": raw_token,
            "seller_code": seller_code,
            "warning": "این توکن فقط همین یک‌بار نمایش داده می‌شود. آن را ذخیره کنید — برای ورود به پنل همکاری لازم دارید.",
        },
        status=201,
    )


@csrf_exempt
def reseller_auth_token(request):
    """POST /api/reseller/auth/token — ورود با توکن ۱۶ رقمی."""
    if request.method != "POST":
        return HttpResponseNotAllowed(["POST"])

    ip = _client_ip(request)
    if not _reseller_rate_limit(ip, "auth", max_attempts=10, window_sec=900):
        return JsonResponse(
            {"detail": "تعداد تلاش‌های نامعتبر زیاد است. ۱۵ دقیقه دیگر تلاش کنید."},
            status=429,
        )

    try:
        payload = json.loads(request.body.decode("utf-8"))
    except Exception:
        return JsonResponse({"message": "JSON نامعتبر"}, status=400)

    raw_token = _normalize_token(payload.get("token", ""))
    if len(raw_token) != 16:
        return JsonResponse({"message": "توکن باید ۱۶ رقم باشد."}, status=400)

    token_hash = _hash_token(raw_token)
    profile = ResellerProfile.objects.filter(token_hash=token_hash).select_related("user").first()
    if not profile:
        return JsonResponse({"message": "توکن نامعتبر است."}, status=401)

    # لاگین کردن کاربر مرتبط
    login(request, profile.user, backend="django.contrib.auth.backends.ModelBackend")
    request.session.set_expiry(60 * 60 * 24 * 30)  # 30 روز

    # اطمینان از tier صحیح
    UserProfile.objects.update_or_create(
        user=profile.user,
        defaults={"tier": "reseller"},
    )

    profile.last_login_at = timezone.now()
    profile.save(update_fields=["last_login_at"])

    if profile.status == "draft":
        redirect_to = "onboarding"
    elif profile.status == "pending_review":
        redirect_to = "pending"
    else:
        redirect_to = "dashboard"

    return JsonResponse(
        {
            "ok": True,
            "redirect": redirect_to,
            "reseller": _reseller_dict(profile),
        }
    )


@csrf_exempt
def reseller_logout(request):
    if request.method != "POST":
        return HttpResponseNotAllowed(["POST"])
    logout(request)
    return JsonResponse({"ok": True})


# -----------------------------------------------------------------------
# PHONE VERIFICATION (onboarding — Kavenegar OTP, no session changes)
# -----------------------------------------------------------------------
PHONE_RE_FULL = re.compile(r"^09\d{9}$")

def _normalize_phone(raw: str) -> str:
    """Normalize phone to 11-digit 09 format."""
    digits = re.sub(r"\D", "", raw)
    if len(digits) == 10 and digits.startswith("9"):
        return "0" + digits
    return digits
RESELLER_OTP_SCOPE = "reseller_onboarding"


def _reseller_otp_cache_key(phone: str) -> str:
    return f"reseller_phone_otp:{phone}"


@csrf_exempt
def reseller_phone_verify(request):
    """
    POST /api/reseller/phone-verify
    Two-phase flow for the onboarding wizard:
      1) action="send"   → generate a 5-digit OTP, send via Kavenegar, store hash in cache (TTL 120s)
      2) action="verify" → check the OTP against the cache, on success mark phone on the reseller profile

    Body: {"phone": "0912...", "action": "send" | "verify", "otp_code": "12345"}
    """
    if request.method != "POST":
        return HttpResponseNotAllowed(["POST"])

    if not _is_reseller_user(request.user):
        return JsonResponse({"detail": "احراز هویت همکار لازم است."}, status=401)

    try:
        payload = json.loads(request.body.decode("utf-8"))
    except Exception:
        return JsonResponse({"message": "JSON نامعتبر"}, status=400)

    phone = re.sub(r"\D", "", str(payload.get("phone") or ""))
    phone = _normalize_phone(phone)
    action = (payload.get("action") or "").strip().lower()

    if not PHONE_RE_FULL.match(phone):
        return JsonResponse({"message": "شماره موبایل باید ۱۱ رقم (مثلاً ۰۹۱۲۳۴۵۶۷۸۹) یا ۱۰ رقم (مثلاً ۹۱۲۳۴۵۶۷۸۹) باشد."}, status=400)
    if action not in ("send", "verify"):
        return JsonResponse({"message": "action نامعتبر است."}, status=400)

    ip = _client_ip(request)
    cache_key = _reseller_otp_cache_key(phone)

    if action == "send":
        if not _reseller_rate_limit(ip, f"{RESELLER_OTP_SCOPE}:send", max_attempts=5, window_sec=600):
            return JsonResponse({"message": "تعداد درخواست‌ها زیاد است. کمی صبر کنید."}, status=429)

        # reCAPTCHA / hCaptcha gate (risk-based, same as main site)
        captcha_token = (payload.get("captcha_token") or payload.get("hcaptcha_token") or "").strip()
        provider = (_get_setting("captcha_provider", default="recaptcha").value_text or "").strip().lower()
        sitekey = HCAPTCHA_SITEKEY if provider == "hcaptcha" else RECAPTCHA_SITEKEY

        if captcha_token:
            if not _verify_recaptcha(captcha_token):
                return JsonResponse(
                    {
                        "message": "تایید کپچا ناموفق بود. لطفاً دوباره تلاش کنید.", 
                        "captcha_required": True,
                        "captcha_provider": provider,
                        "sitekey": sitekey
                    },
                    status=400,
                )
        elif _captcha_required(phone, ip):
            return JsonResponse(
                {
                    "message": "برای ادامه لطفاً کپچا را کامل کنید.", 
                    "captcha_required": True,
                    "captcha_provider": provider,
                    "sitekey": sitekey
                },
                status=400,
            )

        # throttle per phone: at most one valid OTP at a time
        existing = cache.get(cache_key)
        if existing and existing.get("expires_at", 0) > time.time():
            return JsonResponse({"message": "کد تایید قبلاً ارسال شده است. لطفاً صبر کنید."}, status=429)

        # 5-digit OTP (frontend expects 5 cells)
        otp_code = "".join(str(secrets.randbelow(10)) for _ in range(5))
        expires_at = int(time.time()) + 120
        cache.set(
            cache_key,
            {"code": otp_code, "expires_at": expires_at, "attempts": 0},
            timeout=180,
        )

        from .kavenegar_service import KavenegarService
        ok, msg = KavenegarService.send_verification_code(phone_number=phone, otp_code=otp_code)
        if not ok:
            cache.delete(cache_key)
            return JsonResponse({"message": f"خطا در ارسال پیامک: {msg}"}, status=500)

        return JsonResponse({"ok": True, "message": "کد تایید ارسال شد.", "expires_in": 120})

    # action == "verify"
    otp_input = re.sub(r"\D", "", str(payload.get("otp_code") or ""))
    if len(otp_input) != 5:
        return JsonResponse({"message": "کد تایید باید ۵ رقم باشد."}, status=400)

    record = cache.get(cache_key)
    if not record or record.get("expires_at", 0) <= time.time():
        cache.delete(cache_key)
        return JsonResponse({"message": "کد تایید منقضی شده است. لطفاً ارسال مجدد کنید."}, status=400)

    if record.get("attempts", 0) >= 5:
        cache.delete(cache_key)
        return JsonResponse({"message": "تعداد تلاش‌های نامعتبر زیاد است. لطفاً ارسال مجدد کنید."}, status=400)

    if str(record.get("code")) != otp_input:
        record["attempts"] = record.get("attempts", 0) + 1
        cache.set(cache_key, record, timeout=180)
        remaining = 5 - record["attempts"]
        return JsonResponse(
            {
                "message": f"کد تایید نادرست است. {max(remaining, 0)} تلاش باقی مانده.",
                "remaining_attempts": max(remaining, 0),
            },
            status=400,
        )

    # success: mark the phone on the reseller profile (so we don't lose it on tab close)
    profile = _get_reseller_profile(request.user)
    if profile is not None:
        profile.contact_phone = phone
        profile.save(update_fields=["contact_phone", "updated_at"])

    cache.delete(cache_key)
    return JsonResponse({"ok": True, "message": "شماره موبایل با موفقیت تایید شد."})


def reseller_me(request):
    if request.method != "GET":
        return HttpResponseNotAllowed(["GET"])
    if not _is_reseller_user(request.user):
        return JsonResponse({"detail": "احراز هویت همکار لازم است."}, status=401)
    profile = _get_reseller_profile(request.user)
    if not profile:
        return JsonResponse({"detail": "پروفایل همکار یافت نشد."}, status=404)
    return JsonResponse({"reseller": _reseller_dict(profile)})


@csrf_exempt
def reseller_welcome_ack(request):
    """POST /api/reseller/welcome/ack — ثبت مشاهده‌ی تور خوش‌آمدگویی و تایید قوانین.

    Body (همه اختیاری): {"rules_accepted": true}
    """
    if request.method != "POST":
        return HttpResponseNotAllowed(["POST"])
    if not _is_reseller_user(request.user):
        return JsonResponse({"detail": "احراز هویت همکار لازم است."}, status=401)
    profile = _get_reseller_profile(request.user)
    if not profile:
        return JsonResponse({"detail": "پروفایل همکار یافت نشد."}, status=404)

    rules_accepted = False
    try:
        payload = json.loads(request.body.decode("utf-8") or "{}")
        rules_accepted = bool(payload.get("rules_accepted"))
    except Exception:
        pass

    now = timezone.now()
    update_fields = ["welcome_seen_at", "updated_at"]
    profile.welcome_seen_at = now
    if rules_accepted:
        profile.rules_accepted_at = now
        update_fields.append("rules_accepted_at")
    profile.save(update_fields=update_fields)

    return JsonResponse({"ok": True, "reseller": _reseller_dict(profile)})


# -----------------------------------------------------------------------
# PROFILE
# -----------------------------------------------------------------------
@csrf_exempt
def reseller_profile_update(request):
    if request.method not in ("POST", "PATCH", "PUT"):
        return HttpResponseNotAllowed(["POST", "PATCH", "PUT"])
    if not _is_reseller_user(request.user):
        return JsonResponse({"detail": "احراز هویت همکار لازم است."}, status=401)
    profile = _get_reseller_profile(request.user)
    if not profile:
        return JsonResponse({"detail": "پروفایل همکار یافت نشد."}, status=404)

    try:
        payload = json.loads(request.body.decode("utf-8") or "{}")
    except Exception:
        return JsonResponse({"message": "JSON نامعتبر"}, status=400)

    editable_fields = [
        "support_name",
        "shop_link",
        "channel_link",
        "legal_name",
        "national_id",
        "contact_phone",
        "email",
        "channel_link",
        "bank_card_number",
        "bank_sheba",
        "bank_holder",
    ]
    for field in editable_fields:
        if field in payload:
            value = (payload.get(field) or "").strip()
            # Normalize phone to 09 format
            if field == "contact_phone" and value:
                value = _normalize_phone(value)
            setattr(profile, field, value)

    # آستانه هشدار موجودی کم (عدد)
    if "low_balance_threshold" in payload:
        try:
            profile.low_balance_threshold = max(0, int(payload.get("low_balance_threshold") or 0))
        except (TypeError, ValueError):
            profile.low_balance_threshold = 0

    # کد معرف (فقط یک‌بار و در صورت معتبر بودن قابل تنظیم است)
    ref_code = (payload.get("referred_by_code") or "").strip()
    if ref_code and not profile.referred_by_id:
        referrer = ResellerProfile.objects.filter(seller_code__iexact=ref_code).exclude(id=profile.id).first()
        if referrer:
            profile.referred_by = referrer

    # اعتبارسنجی
    errors = {}
    if profile.support_name and len(profile.support_name) < 2:
        errors["support_name"] = "نام پشتیبانی باید حداقل ۲ کاراکتر باشد."
    if profile.shop_link and not profile.shop_link.startswith(("http://", "https://")):
        errors["shop_link"] = "لینک شاپ نامعتبر است."
    if profile.channel_link and not profile.channel_link.startswith(("http://", "https://", "@")):
        errors["channel_link"] = "لینک کانال نامعتبر است."
    if profile.contact_phone and not re.fullmatch(r"09[0-9]{9}", profile.contact_phone):
        errors["contact_phone"] = "شماره تماس باید ۱۱ رقم (مثلاً ۰۹۱۲۳۴۵۶۷۸۹) یا ۱۰ رقم (مثلاً ۹۱۲۳۴۵۶۷۸۹) باشد."
    if profile.email and not re.fullmatch(r"[^@\s]+@[^@\s]+\.[^@\s]+", profile.email):
        errors["email"] = "ایمیل نامعتبر است."
    if profile.channel_link and not _parse_telegram_channel_username(profile.channel_link):
        errors["channel_link"] = "لینک کانال نامعتبر است (فرمت: t.me/<username> یا @<username>)."
    if profile.national_id and not _validate_iran_national_id(profile.national_id):
        errors["national_id"] = "کد ملی نامعتبر است."
    if profile.bank_card_number and not _validate_card_number(profile.bank_card_number):
        errors["bank_card_number"] = "شماره کارت نامعتبر است."
    if profile.bank_sheba and not _validate_sheba(profile.bank_sheba):
        errors["bank_sheba"] = "شماره شبا نامعتبر است (فرمت: IR + 24 رقم)."

    if errors:
        return JsonResponse({"message": "اطلاعات نامعتبر", "errors": errors}, status=400)

    # اگر فیلدهای ضروری فرم آنبوردینگ پر شد، به pending_review می‌رویم
    was_status = profile.status
    onboarding_fields_filled = all([
        profile.support_name,
        profile.shop_link,
        profile.contact_phone,
        profile.email,
        profile.channel_link,
        profile.bank_card_number,
        profile.bank_holder,
    ])
    if onboarding_fields_filled and profile.status in ("draft", "rejected", "suspended"):
        profile.status = "pending_review"
    elif profile.status == "verified" and any(
        payload.get(f) is not None
        for f in ["support_name", "shop_link", "channel_link", "legal_name",
                  "national_id", "contact_phone", "bank_card_number", "bank_sheba", "bank_holder"]
    ):
        # تغییر پس از تأیید => باید دوباره تأیید شود
        profile.status = "pending_review"

    profile.save()
    return JsonResponse(
        {
            "ok": True,
            "status_changed": profile.status != was_status,
            "reseller": _reseller_dict(profile),
        }
    )


# -----------------------------------------------------------------------
# PRICING (عمومی + override اختصاصی همکار)
# -----------------------------------------------------------------------
def _tiers_for_reseller(product_id: int, variant_id: int | None, profile) -> tuple[list, bool]:
    """پله‌های مؤثر یک محصول برای یک همکار.

    اگر همکار override اختصاصی فعال داشته باشد همان برمی‌گردد (قیمت‌های ثابت تومانی، بدون اسکیل نرخ
    لیر)؛ وگرنه پله‌های عمومی (reseller=None) برمی‌گردد. خروجی: (لیست پله‌ها, آیا override بود).
    """
    reseller_id = getattr(profile, "id", None)
    if reseller_id:
        override = list(
            ResellerPriceTier.objects.filter(
                product_id=product_id, variant_id=variant_id, reseller_id=reseller_id, active=True,
            ).order_by("min_quantity").values("min_quantity", "price", "active")
        )
        if override:
            return override, True
    global_tiers = list(
        ResellerPriceTier.objects.filter(
            product_id=product_id, variant_id=variant_id, reseller__isnull=True, active=True,
        ).order_by("min_quantity").values("min_quantity", "price", "active")
    )
    return global_tiers, False


def _uses_fixed_variant_tiers(product: Product | None, variant_id: int | None) -> bool:
    """VBucks variant tiers are entered as final Toman prices, not lira-scaled raw prices."""
    return bool(product and product.slug == VBUCKS_SLUG and variant_id)


# -----------------------------------------------------------------------
# CATALOG
# -----------------------------------------------------------------------
def reseller_catalog(request):
    if request.method != "GET":
        return HttpResponseNotAllowed(["GET"])
    if not _is_reseller_user(request.user):
        return JsonResponse({"detail": "احراز هویت همکار لازم است."}, status=401)

    profile = _get_reseller_profile(request.user)
    cfg = _crew_pricing_config()
    lira_rate = cfg["lira_rate"]

    # همه‌ی محصولاتی که حداقل یک پله‌ی عمومی فعال دارند (یا کروپک که لیر-محور است).
    # عضویت در کاتالوگ فقط از روی پله‌های عمومی تعیین می‌شود؛ override اختصاصی فقط قیمت را عوض می‌کند.
    crew = Product.objects.filter(slug=CREW_SLUG, active=True).first()
    product_ids_with_tiers = list(
        ResellerPriceTier.objects.filter(active=True, reseller__isnull=True)
        .values_list("product_id", flat=True)
        .distinct()
    )
    if crew and crew.id not in product_ids_with_tiers:
        product_ids_with_tiers.append(crew.id)

    # تعداد فروش هر محصول (بر اساس OrderItem سفارش‌های همکار، بدون لغو/مسترد/شارژ)
    sales_map = {
        row["product_id"]: int(row["qty"] or 0)
        for row in (
            OrderItem.objects.filter(
                product_id__in=product_ids_with_tiers,
                order__is_reseller_order=True,
            )
            .exclude(order__status__in=["canceled", "refunded", "wallet_topup"])
            .values("product_id")
            .annotate(qty=Sum("quantity"))
        )
    }

    raw_products = []
    for product in Product.objects.filter(id__in=product_ids_with_tiers, active=True).prefetch_related("variants"):
        is_crew = (product.slug == CREW_SLUG)
        crew_behavior = None
        ref = cfg["ref_rate"] or 1

        def _catalog_tiers_for_variant(variant_id: int) -> list:
            variant_tiers, variant_override = _tiers_for_reseller(product.id, variant_id, profile)
            if not variant_tiers:
                return []
            if product.price_lira > 0 and not variant_override and not _uses_fixed_variant_tiers(product, variant_id):
                return [
                    {
                        "min_quantity": t["min_quantity"],
                        "price": _round_toman(t["price"] * lira_rate / ref),
                        "active": t["active"],
                    }
                    for t in variant_tiers
                ]
            return variant_tiers

        if is_crew:
            crew_tiers, crew_override = _tiers_for_reseller(product.id, None, profile)
            tiers = crew_tiers if crew_override else _crew_tiers_for_rate(lira_rate, cfg)
            lira_priced = True
            behavior_enabled = _setting_bool("reseller_behavior_pricing_enabled", BEHAVIOR_PRICING_ENABLED_DEFAULT)
            if behavior_enabled and profile is not None:
                crew_behavior = _compute_behavior_discount(profile)
        elif product.price_lira > 0:
            base_tiers, is_override = _tiers_for_reseller(product.id, None, profile)
            if is_override:
                tiers = base_tiers  # قیمت دستی ثابت است، بدون اسکیل نرخ لیر
            else:
                tiers = [
                    {
                        "min_quantity": t["min_quantity"],
                        "price": _round_toman(t["price"] * lira_rate / ref),
                        "active": t["active"],
                    }
                    for t in base_tiers
                ]
            lira_priced = True
        else:
            tiers, _is_override = _tiers_for_reseller(product.id, None, profile)
            lira_priced = False
        if not tiers:
            continue
        base_price = tiers[0]["price"]
        sales = sales_map.get(product.id, 0)
        
        ordered_today_reseller = 0
        today_start = timezone.now().replace(hour=0, minute=0, second=0, microsecond=0)
        if getattr(product, "reseller_daily_order_limit", 0) > 0:
            ordered_today_reseller = OrderItem.objects.filter(
                product=product,
                order__created_at__gte=today_start,
                order__is_reseller_order=True,
            ).exclude(order__status__in=["canceled", "refunded"]).aggregate(total=Sum("quantity"))["total"] or 0

        ordered_today_total = 0
        if getattr(product, "daily_order_limit", 0) > 0:
            ordered_today_total = OrderItem.objects.filter(
                product=product,
                order__created_at__gte=today_start,
            ).exclude(order__status__in=["canceled", "refunded"]).aggregate(total=Sum("quantity"))["total"] or 0

        raw_products.append(
            {
                "id": product.id,
                "slug": product.slug,
                "name_fa": product.name_fa,
                "subtitle": product.subtitle,
                "image_url": product.image_url,
                "base_price": base_price,
                "original_price": product.price or int(base_price),
                "tiers": tiers,
                "sales_count": sales,
                "lira_priced": lira_priced,
                "price_lira": product.price_lira,
                "display_order": product.display_order,
                "ordering_disabled": getattr(product, "ordering_disabled", False),
                "reseller_ordering_disabled": getattr(product, "reseller_ordering_disabled", False),
                "reseller_daily_order_limit": getattr(product, "reseller_daily_order_limit", 0),
                "daily_order_limit": getattr(product, "daily_order_limit", 0),
                "ordered_today_reseller": ordered_today_reseller,
                "ordered_today_total": ordered_today_total,
                "behavior_pricing": crew_behavior if is_crew else None,
                "variants": [
                    {
                        "id": v.id,
                        "title": v.title,
                        "price_lira": v.original_price,
                        "tiers": _catalog_tiers_for_variant(v.id),
                    }
                    for v in product.variants.all()
                ] if product.variants.exists() else [],
            }
        )

    # مرتب‌سازی بر اساس پرفروش‌ترین (sales_count نزولی)؛ در صورت برابر بودن بر اساس ترتیب نمایش (display_order صعودی)
    raw_products.sort(key=lambda p: (-p["sales_count"], p["display_order"]))
    
    # رتبه فقط به محصولات دارای فروش اختصاص می‌یابد
    rank = 1
    for p in raw_products:
        if p["sales_count"] > 0:
            p["sales_rank"] = rank
            rank += 1
        else:
            p["sales_rank"] = 0

    return JsonResponse({
        "products": raw_products,
        "lira_rate": lira_rate,
        "crew_ref_rate": cfg["ref_rate"],
        "fluct_threshold": cfg["fluct_threshold"],
        "reserve_enabled": True,
    })


# -----------------------------------------------------------------------
# ORDERS (همکار)
# -----------------------------------------------------------------------
def _price_for_quantity(product_id: int, quantity: int, variant_id: int | None = None, profile=None) -> int:
    """قیمت واحد برای تعداد داده‌شده.

    اگر همکار override اختصاصی داشته باشد، قیمت ثابت تومانی همان override برمی‌گردد (بدون اسکیل نرخ
    لیر)؛ وگرنه رفتار عمومی قبلی: کروپک و محصولات لیر-محور از فرمول/اسکیل لیر استفاده می‌کنند.
    """
    product = Product.objects.filter(id=product_id).first()
    if not product:
        return 0
    override_tiers, is_override = _tiers_for_reseller(product_id, variant_id, profile)
    if is_override:
        matching = sorted(
            [t for t in override_tiers if t["active"] and t["min_quantity"] <= quantity],
            key=lambda t: -t["min_quantity"],
        )
        return int(matching[0]["price"]) if matching else 0
    if product.slug == CREW_SLUG:
        behavior_enabled = _setting_bool("reseller_behavior_pricing_enabled", BEHAVIOR_PRICING_ENABLED_DEFAULT)
        if behavior_enabled and profile is not None:
            behavior = _compute_behavior_discount(profile)
            if quantity >= 10:
                return behavior["crew_ten"]
            return behavior["crew_single"]
        return _crew_unit_price_for_quantity(quantity, _lira_rate())
    tier = (
        ResellerPriceTier.objects.filter(
            product_id=product_id,
            variant_id=variant_id,
            reseller__isnull=True,
            active=True,
            min_quantity__lte=quantity,
        )
        .order_by("-min_quantity")
        .first()
    )
    if not tier:
        return 0
    if product.price_lira > 0 and not _uses_fixed_variant_tiers(product, variant_id):
        cfg = _crew_pricing_config()
        ref = cfg["ref_rate"] or 1
        rate = _lira_rate() or ref
        return _round_toman(tier.price * rate / ref)
    return int(tier.price)


@csrf_exempt
def reseller_orders(request):
    if not _is_reseller_user(request.user):
        return JsonResponse({"detail": "احراز هویت همکار لازم است."}, status=401)
    profile = _get_reseller_profile(request.user)
    if not profile:
        return JsonResponse({"detail": "پروفایل همکار یافت نشد."}, status=404)

    if request.method == "GET":
        status_filter = request.GET.get("status", "all")
        qs = Order.objects.filter(
            is_reseller_order=True,
            user_id=request.user.id,
        ).exclude(status__in=["wallet_topup"]).exclude(note__icontains="شارژ کیف پول").select_related("user").prefetch_related("items", "items__product", "payments")
        
        if status_filter == "active":
            qs = qs.filter(status__in=["pending", "paid", "registered", "processing", "needs_2fa", "needs_tr_region", "invalid_info"])
        elif status_filter != "all":
            qs = qs.filter(status=status_filter)
            
        # latest 200
        orders = list(qs.order_by("-created_at")[:200])
        return JsonResponse({"results": [_reseller_order_dict(o) for o in orders]})

    if request.method == "POST":
        return _create_reseller_order(request, profile)

    return HttpResponseNotAllowed(["GET", "POST"])


def _reseller_order_dict(o: Order) -> dict:
    base = _admin_order_dict(o)
    items_payload = []
    for it in o.items.all():
        accounts = []
        for acc in it.accounts.all().order_by("index"):
            status_fa_map = {
                "pending": "در انتظار مشخصات",
                "filled": "آماده انجام",
                "completed": "انجام شده",
                "needs_2fa": "نیاز به 2FA",
                "invalid_info": "اطلاعات غلط",
                "needs_tr_region": "نیاز به ریجن",
            }
            accounts.append({
                "index": acc.index,
                "mode": acc.mode,
                "mode_fa": dict(OrderItemAccount.MODE_CHOICES).get(acc.mode, acc.mode),
                "account_type": acc.account_type,
                "account_email": acc.account_email,
                "account_password": acc.account_password,
                "xbox_email": acc.xbox_email,
                "xbox_password": acc.xbox_password,
                "status": acc.status,
                "status_fa": status_fa_map.get(acc.status, acc.status),
            })
        items_payload.append(
            {
                "id": it.id,
                "name": it.name,
                "quantity": it.quantity,
                "price": it.price,
                "price_lira": it.price_lira,
                "product_slug": it.product.slug if it.product else "",
                "account_type": getattr(it, "account_type", ""),
                "account_email": getattr(it, "account_email", ""),
                "account_password": getattr(it, "account_password", ""),
                "accounts": accounts,
                "accounts_filled": sum(1 for a in accounts if a["status"] in ("filled", "completed")),
                "accounts_pending": sum(1 for a in accounts if a["status"] in ("pending", "needs_2fa", "invalid_info", "needs_tr_region")),
            }
        )
    base["items"] = items_payload
    base["reserve_mode"] = o.reserve_mode
    base["lira_rate_at_order"] = o.lira_rate_at_order
    base["reserve_filled_at"] = o.reserve_filled_at.isoformat() if o.reserve_filled_at else None
    base["lira_diff_charged"] = o.lira_diff_charged
    # آیا رزرو است و هنوز اکانت‌هایی تکمیل نشده؟
    base["is_reservation"] = (o.reserve_mode == "later")
    base["reservation_needs_details"] = (
        o.reserve_mode == "later" and
        any(it["accounts_pending"] > 0 for it in items_payload)
    )
    return base


class _OrderValidationError(Exception):
    """خطای اعتبارسنجی پارامترهای سفارش همکار (با پاسخ JSON آماده)."""

    def __init__(self, response: JsonResponse):
        self.response = response


def _parse_reseller_order_payload(request, profile: ResellerProfile) -> dict:
    """پارامترهای مشترک سفارش همکار را اعتبارسنجی می‌کند (کیف پول یا درگاه).

    پشتیبانی از دو حالت:
    - reserve_mode='now'  : آرایه‌ی accounts به طول quantity با اطلاعات هر واحد
    - reserve_mode='later': رزرو در کیف پول؛ accounts خالی (بعداً تکمیل می‌شود)

    سازگاری با فاز قبلی: اگر accounts ارسال نشد ولی account_email/account_password
    داده شد، یک اکانت واحد از آن‌ها ساخته می‌شود.
    """
    if profile.status != "verified":
        raise _OrderValidationError(JsonResponse(
            {
                "detail": "پروفایل شما هنوز تأیید نشده است. پس از تأیید توسط ادمین می‌توانید سفارش ثبت کنید.",
                "code": "not_verified",
            },
            status=403,
        ))

    try:
        payload = json.loads(request.body.decode("utf-8") or "{}")
    except Exception:
        raise _OrderValidationError(JsonResponse({"message": "JSON نامعتبر"}, status=400))

    # تعیین محصول
    product = None
    product_id = payload.get("product_id")
    slug = (payload.get("slug") or "").strip()
    if product_id:
        try:
            product = Product.objects.filter(id=int(product_id), active=True).first()
        except (TypeError, ValueError):
            product = None
    elif slug:
        product = Product.objects.filter(slug=slug, active=True).first()
    else:
        product = Product.objects.filter(slug=CREW_SLUG, active=True).first()
    if not product:
        raise _OrderValidationError(JsonResponse({"message": "محصول یافت نشد."}, status=400))

    is_crew = (product.slug == CREW_SLUG)
    if not is_crew and not ResellerPriceTier.objects.filter(product=product, reseller__isnull=True, active=True).exists():
        raise _OrderValidationError(JsonResponse(
            {"message": "این محصول برای همکاران فعال نیست."}, status=400
        ))

    try:
        quantity = int(payload.get("quantity") or 1)
    except (TypeError, ValueError):
        raise _OrderValidationError(JsonResponse({"message": "تعداد نامعتبر است."}, status=400))
    if quantity < 1 or quantity > 100:
        raise _OrderValidationError(JsonResponse({"message": "تعداد باید بین ۱ تا ۱۰۰ باشد."}, status=400))

    if (getattr(product, "ordering_disabled", False) or getattr(product, "reseller_ordering_disabled", False)):
        raise _OrderValidationError(JsonResponse(
            {"message": f"ثبت سفارش همکار برای محصول «{product.name_fa}» غیرفعال است."},
            status=400
        ))

    from django.utils import timezone
    from django.db.models import Sum
    today_start = timezone.now().replace(hour=0, minute=0, second=0, microsecond=0)

    # 1. Check reseller-specific daily limit
    if getattr(product, "reseller_daily_order_limit", -1) >= 0:
        ordered_today_reseller = OrderItem.objects.filter(
            product=product,
            order__created_at__gte=today_start,
            order__is_reseller_order=True,
        ).exclude(order__status__in=["canceled", "refunded"]).aggregate(total=Sum("quantity"))["total"] or 0

        if ordered_today_reseller + quantity > product.reseller_daily_order_limit:
            remaining = max(0, product.reseller_daily_order_limit - ordered_today_reseller)
            raise _OrderValidationError(JsonResponse(
                {"message": f"ظرفیت سفارش همکاران برای محصول «{product.name_fa}» امروز به پایان رسیده است. (ظرفیت باقی‌مانده همکاران: {remaining} عدد)"},
                status=400
            ))

    # 2. Check general daily limit
    if getattr(product, "daily_order_limit", -1) >= 0:
        ordered_today = OrderItem.objects.filter(
            product=product,
            order__created_at__gte=today_start,
        ).exclude(order__status__in=["canceled", "refunded"]).aggregate(total=Sum("quantity"))["total"] or 0

        if ordered_today + quantity > product.daily_order_limit:
            remaining = max(0, product.daily_order_limit - ordered_today)
            raise _OrderValidationError(JsonResponse(
                {"message": f"ظرفیت ثبت سفارش برای محصول «{product.name_fa}» امروز به پایان رسیده است. (ظرفیت باقی‌مانده امروز: {remaining} عدد)"},
                status=400
            ))

    variant_id = payload.get("variant_id")
    variant = None
    if variant_id:
        try:
            variant = ProductVariant.objects.get(id=int(variant_id), product=product)
        except (ProductVariant.DoesNotExist, ValueError, TypeError):
            raise _OrderValidationError(JsonResponse({"message": "واریانت نامعتبر است."}, status=400))

    unit_price = _price_for_quantity(product.id, quantity, variant.id if variant else None, profile=profile)
    if unit_price <= 0:
        raise _OrderValidationError(JsonResponse(
            {"message": "پله قیمتی برای این تعداد تعریف نشده. با ادمین تماس بگیرید."},
            status=400,
        ))
    total = unit_price * quantity

    note = (payload.get("note") or "").strip()
    contact_phone = (payload.get("contact_phone") or profile.contact_phone or "").strip()

    reserve_mode = (payload.get("reserve_mode") or "now").strip().lower()
    if reserve_mode not in ("now", "later"):
        reserve_mode = "now"

    # ----- ساخت آرایه‌ی accounts -----
    accounts_raw = payload.get("accounts")
    # سازگاری با فاز قبلی: account_email/account_password تک‌عددی
    # در حالت legacy، یک اکانت برای همه‌ی واحدها استفاده می‌شود (N کپی از همان اکانت)
    if not accounts_raw and reserve_mode == "now":
        legacy_email = (payload.get("account_email") or "").strip()
        legacy_pass = (payload.get("account_password") or "").strip()
        legacy_type = (payload.get("account_type") or "epic").strip().lower()
        if legacy_email and legacy_pass:
            single = {
                "mode": "existing",
                "account_type": legacy_type if legacy_type in ("epic", "psn", "xbox") else "epic",
                "account_email": legacy_email,
                "account_password": legacy_pass,
                "xbox_email": (payload.get("xbox_email") or "").strip(),
                "xbox_password": (payload.get("xbox_password") or "").strip(),
            }
            accounts_raw = [dict(single, index=i) for i in range(1, quantity + 1)]

    accounts = []
    if reserve_mode == "now":
        if not isinstance(accounts_raw, list) or len(accounts_raw) != quantity:
            raise _OrderValidationError(JsonResponse(
                {"message": f"برای {quantity} واحد، دقیقاً {quantity} ردیف اطلاعات اکانت الزامی است.", "code": "accounts_count"},
                status=400,
            ))
        for i, a in enumerate(accounts_raw, start=1):
            if not isinstance(a, dict):
                raise _OrderValidationError(JsonResponse(
                    {"message": f"ردیف اکانت {i} نامعتبر است."}, status=400,
                ))
            mode = (a.get("mode") or "existing").strip().lower()
            if mode not in ("existing", "create_for_me"):
                mode = "existing"
            acc_type = (a.get("account_type") or "epic").strip().lower()
            if acc_type not in ("epic", "psn", "xbox"):
                acc_type = "epic"
            email = (a.get("account_email") or "").strip()
            password = (a.get("account_password") or "").strip()
            if not email or not password:
                raise _OrderValidationError(JsonResponse(
                    {"message": f"ردیف {i}: ایمیل و رمز اکانت {acc_type} الزامی است."}, status=400,
                ))
            accounts.append({
                "index": i,
                "mode": mode,
                "account_type": acc_type,
                "account_email": email,
                "account_password": password,
                "xbox_email": (a.get("xbox_email") or "").strip(),
                "xbox_password": (a.get("xbox_password") or "").strip(),
            })
    else:
        # reserve_mode == 'later' — placeholder rows (no account info yet)
        accounts = [{"index": i, "mode": "existing", "placeholder": True} for i in range(1, quantity + 1)]

    # نرخ لیر در زمان سفارش (برای کروپک و سایر محصولات لیر-محور)
    lira_rate = _lira_rate() if (is_crew or (product and product.price_lira > 0)) else 0

    epic_rules_accepted = bool(payload.get("epic_rules_accepted"))

    # اولین اکانت برای فیلدهای legacy OrderItem/Order (back-compat با ادمین/ویو‌های قدیم)
    first = accounts[0] if accounts else {}
    legacy_email = first.get("account_email", "")
    legacy_pass = first.get("account_password", "")
    legacy_type = first.get("account_type", "epic")

    return {
        "product": product,
        "variant": variant,
        "quantity": quantity,
        "unit_price": unit_price,
        "total": total,
        "note": note,
        "contact_phone": contact_phone,
        "reserve_mode": reserve_mode,
        "accounts": accounts,
        "lira_rate_at_order": lira_rate,
        "is_crew": is_crew,
        "epic_rules_accepted": epic_rules_accepted,
        # legacy (برای OrderItem/Order)
        "account_type": legacy_type,
        "account_email": legacy_email,
        "account_password": legacy_pass,
    }


def _build_reseller_order(request, profile: ResellerProfile, ctx: dict, status: str) -> Order:
    """ساخت Order + OrderItem + OrderItemAccount (به‌ازای هر واحد) از پارامترهای اعتبارسنجی‌شده."""
    reserve_mode = ctx.get("reserve_mode", "now")
    # در حالت رزرو (later) سفارش به‌جای 'paid' در وضعیت 'registered' ثبت می‌شود
    # تا نشان‌دهد اطلاعات اکانت‌ها هنوز تکمیل نشده.
    if reserve_mode == "later" and status == "paid":
        status = "registered"

    note = ctx["note"] or f"[سفارش همکار] seller_code={profile.seller_code}"
    if reserve_mode == "later":
        note = (ctx["note"] + " | " if ctx["note"] else "") + f"[رزرو در کیف پول — اطلاعات اکانت بعداً تکمیل می‌شود]"

    order = Order.objects.create(
        user=request.user,
        epic_username=ctx["account_email"] or f"reseller-{profile.seller_code}",
        phone=ctx["contact_phone"] or ctx["account_email"] or f"reseller-{profile.seller_code}",
        telegram=profile.support_name or "",
        note=note,
        amount=ctx["total"],
        is_reseller_order=True,
        reseller_seller_code=profile.seller_code,
        reserve_mode=reserve_mode,
        lira_rate_at_order=ctx.get("lira_rate_at_order", 0),
        status=status,
    )
    item = OrderItem.objects.create(
        order=order,
        product=ctx["product"],
        variant=ctx["variant"],
        name=ctx["variant"].title if ctx["variant"] else ctx["product"].name_fa,
        price=ctx["unit_price"],
        price_lira=ctx["product"].price_lira,
        quantity=ctx["quantity"],
        account_type=ctx["account_type"],
        account_email=ctx["account_email"],
        account_password=ctx["account_password"],
    )
    # ساخت ردیف‌های OrderItemAccount به‌ازای هر واحد
    for acc in ctx["accounts"]:
        OrderItemAccount.objects.create(
            item=item,
            index=acc["index"],
            mode=acc.get("mode", "existing"),
            account_type=acc.get("account_type", "epic"),
            account_email=acc.get("account_email", ""),
            account_password=acc.get("account_password", ""),
            xbox_email=acc.get("xbox_email", ""),
            xbox_password=acc.get("xbox_password", ""),
            status="pending" if acc.get("placeholder") else "filled",
        )
    return order


@transaction.atomic
def _create_reseller_order(request, profile: ResellerProfile):
    """ثبت سفارش با پرداخت از کیف پول."""
    try:
        ctx = _parse_reseller_order_payload(request, profile)
    except _OrderValidationError as e:
        return e.response

    has_xbox_account = any(
        acc.get("account_type") == "xbox" for acc in ctx["accounts"]
    )
    needs_epic_rules = ctx["is_crew"] or has_xbox_account
    if needs_epic_rules and not ctx.get("epic_rules_accepted"):
        return JsonResponse(
            {
                "code": "epic_rules_required",
                "message": "برای ثبت سفارش محصولات وابسته به اپیک گیمز / ایکس باکس، باید قوانین را مطالعه و تأیید کنید.",
            },
            status=400,
        )

    total = ctx["total"]
    if profile.wallet_balance < total:
        return JsonResponse(
            {
                "message": f"موجودی کیف پول کافی نیست. موجودی فعلی: {profile.wallet_balance:,} تومان — نیاز: {total:,} تومان.",
                "wallet_balance": profile.wallet_balance,
                "required": total,
                "code": "insufficient_balance",
            },
            status=400,
        )

    # کسر از موجودی + ثبت تراکنش + ساخت Order
    new_balance = profile.wallet_balance - total
    profile.wallet_balance = new_balance
    profile.save(update_fields=["wallet_balance"])

    order = _build_reseller_order(request, profile, ctx, status="paid")  # همکار از کیف پول پرداخت کرد

    ResellerWalletTxn.objects.create(
        profile=profile,
        kind="order",
        amount=-total,
        balance_after=new_balance,
        related_order=order,
        note=f"سفارش {order.tracking_code} ({ctx['quantity']} عدد)",
        created_by=request.user,
    )

    _maybe_pay_referral_reward(profile, request)

    return JsonResponse(
        {
            "ok": True,
            "order": _reseller_order_dict(order),
            "wallet_balance": new_balance,
        },
        status=201,
    )


def reseller_order_detail(request, tracking):
    if not _is_reseller_user(request.user):
        return JsonResponse({"detail": "احراز هویت همکار لازم است."}, status=401)
    order = get_object_or_404(Order, tracking_code=tracking, is_reseller_order=True, user_id=request.user.id)
    return JsonResponse({"order": _reseller_order_dict(order)})


def _reservation_diff(order: Order) -> dict:
    """محاسبه‌ی ما‌به‌التفاوت لیر برای یک سفارش رزروشده (در صورت وجود).

    فقط برای کروپک (lira_rate_at_order > 0). اگر نوسان از آستانه‌ی ۵٪ بیشتر باشد،
    ما‌به‌التفاوت قیمت = (قیمت جدید - قیمت قفل‌شده) × تعداد محاسبه می‌شود.
    """
    locked = order.lira_rate_at_order
    if not locked:
        return {"applicable": False}
    current = _lira_rate()
    if not current:
        return {"applicable": False, "locked_rate": locked, "current_rate": locked}
    fluct = _lira_fluctuation(locked, current)
    item = order.items.first()
    if not item:
        return {"applicable": False}
    qty = item.quantity
    profile = _get_reseller_profile(order.user)
    _tiers, is_override = _tiers_for_reseller(item.product_id, item.variant_id, profile)
    if is_override:
        # قیمت دستی همکار ثابت است و به نرخ لیر وابسته نیست؛ نوسان قابل اعمال نیست
        return {"applicable": False, "locked_rate": locked, "current_rate": current}
    if item.product.slug == CREW_SLUG:
        locked_unit = _crew_unit_price_for_quantity(qty, locked)
        current_unit = _crew_unit_price_for_quantity(qty, current)
    else:
        tier = (
            ResellerPriceTier.objects.filter(
                product=item.product,
                variant=item.variant,
                reseller__isnull=True,
                active=True,
                min_quantity__lte=qty,
            )
            .order_by("-min_quantity")
            .first()
        )
        base_price = tier.price if tier else 0
        cfg = _crew_pricing_config()
        ref = cfg["ref_rate"] or 1
        locked_unit = _round_toman(base_price * locked / ref)
        current_unit = _round_toman(base_price * current / ref)
    diff_unit = current_unit - locked_unit
    # کاهش تاثیر مابه‌التفاوت لیر همکار به ۸۰٪
    diff_total = _round_toman(diff_unit * qty * 0.80)
    return {
        "applicable": True,
        "locked_rate": locked,
        "current_rate": current,
        "fluct_pct": fluct["pct"],
        "threshold_pct": fluct["threshold"],
        "exceeded": fluct["exceeded"],
        "direction": fluct["direction"],
        "locked_unit_price": locked_unit,
        "current_unit_price": current_unit,
        "diff_unit": diff_unit,
        "diff_total": diff_total,
        "already_charged": order.lira_diff_charged,
        "due": max(0, diff_total - order.lira_diff_charged),
    }


@csrf_exempt
def reseller_order_diff(request, tracking):
    """GET /api/reseller/orders/<tracking>/lira-diff — محاسبه‌ی ما‌به‌التفاوت لیر رزرو."""
    if request.method != "GET":
        return HttpResponseNotAllowed(["GET"])
    if not _is_reseller_user(request.user):
        return JsonResponse({"detail": "احراز هویت همکار لازم است."}, status=401)
    order = get_object_or_404(Order, tracking_code=tracking, is_reseller_order=True, user_id=request.user.id)
    return JsonResponse({"diff": _reservation_diff(order)})


@csrf_exempt
def reseller_order_fill_accounts(request, tracking):
    """POST /api/reseller/orders/<tracking>/fill-accounts — تکمیل اطلاعات اکانت‌های رزروشده.

    Body: {"accounts": [{index, mode, account_type, account_email, account_password, xbox_email?, xbox_password?}, ...]}

    در صورت عبور نوسان لیر از ۵٪، ما‌به‌التفاوت از کیف پول کسر می‌شود (در صورت کافی
    بودن موجودی) و سفارش به وضعیت 'paid' منتقل می‌شود.
    """
    if request.method != "POST":
        return HttpResponseNotAllowed(["POST"])
    if not _is_reseller_user(request.user):
        return JsonResponse({"detail": "احراز هویت همکار لازم است."}, status=401)
    profile = _get_reseller_profile(request.user)
    if not profile:
        return JsonResponse({"detail": "پروفایل همکار یافت نشد."}, status=404)

    order = get_object_or_404(Order, tracking_code=tracking, is_reseller_order=True, user_id=request.user.id)
    if order.reserve_mode != "later":
        return JsonResponse({"message": "این سفارش رزروشده نیست."}, status=400)

    try:
        payload = json.loads(request.body.decode("utf-8") or "{}")
    except Exception:
        return JsonResponse({"message": "JSON نامعتبر"}, status=400)

    accounts_in = payload.get("accounts")
    if not isinstance(accounts_in, list):
        return JsonResponse({"message": "آرایه accounts الزامی است."}, status=400)

    # نگاشت ردیف‌ها
    items = list(order.items.all())
    if not items:
        return JsonResponse({"message": "آیتمی برای این سفارش وجود ندارد."}, status=400)
    # برای سادگی: فرض می‌کنیم سفارش همکار یک OrderItem دارد (مطابق ساختار فعلی)
    item = items[0]
    existing = {a.index: a for a in item.accounts.all()}

    # اعتبارسنجی — اکانت‌های خالی یا تکراری را رد نمی‌کنیم
    validated = []
    for a in accounts_in:
        if not isinstance(a, dict):
            return JsonResponse({"message": "ردیف اکانت نامعتبر است."}, status=400)
        try:
            idx = int(a.get("index"))
        except (TypeError, ValueError):
            return JsonResponse({"message": "index هر ردیف الزامی است."}, status=400)
        if idx not in existing:
            return JsonResponse({"message": f"ردیف {idx} متعلق به این سفارش نیست."}, status=400)
        # اکانتی که قبلاً تکمیل شده را رد می‌کنیم
        if existing[idx].status == "filled":
            continue
        email = (a.get("account_email") or "").strip()
        password = (a.get("account_password") or "").strip()
        if not email or not password:
            continue  # ردیف خالی در ارسال جزیی — رد نمی‌شود
        mode = (a.get("mode") or "existing").strip().lower()
        if mode not in ("existing", "create_for_me"):
            mode = "existing"
        acc_type = (a.get("account_type") or "epic").strip().lower()
        if acc_type not in ("epic", "psn", "xbox"):
            acc_type = "epic"
        validated.append({
            "index": idx, "mode": mode, "account_type": acc_type,
            "account_email": email, "account_password": password,
            "xbox_email": (a.get("xbox_email") or "").strip(),
            "xbox_password": (a.get("xbox_password") or "").strip(),
        })

    if not validated:
        return JsonResponse({"message": "اطلاعاتی برای ذخیره وجود ندارد."}, status=400)

    with transaction.atomic():
        # ثبت اطلاعات اکانت‌ها
        for v in validated:
            acc = existing[v["index"]]
            acc.mode = v["mode"]
            acc.account_type = v["account_type"]
            acc.account_email = v["account_email"]
            acc.account_password = v["account_password"]
            acc.xbox_email = v["xbox_email"]
            acc.xbox_password = v["xbox_password"]
            acc.status = "filled"
            acc.save(update_fields=["mode", "account_type", "account_email", "account_password",
                                    "xbox_email", "xbox_password", "status", "updated_at"])

        # به‌روزرسانی فیلدهای legacy روی OrderItem/Order (اولین اکانت تکمیل‌شده به ترتیب ایندکس)
        first_filled = item.accounts.filter(status="filled").order_by("index").first()
        if first_filled:
            item.account_type = first_filled.account_type
            item.account_email = first_filled.account_email
            item.account_password = first_filled.account_password
            item.save(update_fields=["account_type", "account_email", "account_password"])
            order.epic_username = first_filled.account_email
            order.save(update_fields=["epic_username"])

        # آیا همه اکانت‌ها تکمیل شده‌اند؟
        all_filled = item.accounts.filter(status="pending").count() == 0
        diff_info = _reservation_diff(order)
        due = 0

        if all_filled:
            # بررسی نوسان لیر و کسر ما‌به‌التفاوت
            if diff_info.get("applicable") and diff_info.get("exceeded") and diff_info.get("due", 0) > 0:
                due = diff_info["due"]
                if profile.wallet_balance < due:
                    return JsonResponse({
                        "message": f"نوسان لیر از {diff_info['threshold_pct']}٪ عبور کرده است. "
                                   f"ما‌به‌التفاوت payable: {due:,} تومان. موجودی کیف پول کافی نیست.",
                        "code": "insufficient_balance_for_diff",
                        "diff": diff_info,
                    }, status=400)
                new_balance = profile.wallet_balance - due
                profile.wallet_balance = new_balance
                profile.save(update_fields=["wallet_balance"])
                order.lira_diff_charged += due
                ResellerWalletTxn.objects.create(
                    profile=profile,
                    kind="adjust",
                    amount=-due,
                    balance_after=new_balance,
                    related_order=order,
                    note=f"ما‌به‌التفاوت نوسان لیر سفارش {order.tracking_code} (نرخ {diff_info['locked_rate']}→{diff_info['current_rate']})",
                    created_by=request.user,
                )

            order.reserve_filled_at = timezone.now()
            order.status = "paid"
            order.save(update_fields=["reserve_filled_at", "lira_diff_charged", "status"])

    return JsonResponse({
        "ok": True,
        "order": _reseller_order_dict(order),
        "diff": diff_info,
        "diff_paid": due,
        "all_filled": all_filled,
        "wallet_balance": profile.wallet_balance,
    })


@csrf_exempt
@transaction.atomic
def reseller_order_return_unit(request, tracking):
    """POST /api/reseller/orders/<tracking>/return-unit — مرجوع کردن یک واحد از سفارش به کیف پول.

    Body: {"index": <int>}
    """
    if request.method != "POST":
        return HttpResponseNotAllowed(["POST"])
    if not _is_reseller_user(request.user):
        return JsonResponse({"detail": "احراز هویت همکار لازم است."}, status=401)
    profile = _get_reseller_profile(request.user)
    if not profile:
        return JsonResponse({"detail": "پروفایل همکار یافت نشد."}, status=404)

    try:
        payload = json.loads(request.body.decode("utf-8") or "{}")
        index = int(payload.get("index"))
    except Exception:
        return JsonResponse({"message": "ایندکس واحد نامعتبر است."}, status=400)

    order = get_object_or_404(Order, tracking_code=tracking, is_reseller_order=True, user_id=request.user.id)

    if order.status in ("canceled", "refunded", "wallet_topup"):
        return JsonResponse({"message": "این سفارش قبلاً لغو یا مرجوع شده است."}, status=400)

    # حفاظت مالی: فقط سفارش‌هایی که واقعاً پرداخت شده‌اند قابل مرجوع کردن هستند.
    # وضعیت "pending" یعنی پرداخت هنوز تأیید نشده (مثلاً کاربر در درگاه انصراف داده) —
    # مرجوع کردن چنین سفارشی، کیف پول را بابت مبلغی که هرگز دریافت نشده شارژ می‌کند.
    PAID_STATUSES = {
        "paid", "registered", "processing", "completed",
        "needs_2fa", "needs_tr_region", "invalid_info",
    }
    if order.status not in PAID_STATUSES:
        return JsonResponse(
            {"message": "تنها سفارش‌های پرداخت‌شده قابل مرجوع کردن هستند."},
            status=400,
        )

    item = order.items.first()
    if not item:
        return JsonResponse({"message": "آیتمی برای این سفارش یافت نشد."}, status=400)

    try:
        acc = item.accounts.get(index=index)
    except OrderItemAccount.DoesNotExist:
        return JsonResponse({"message": f"واحد {index} یافت نشد."}, status=404)

    if acc.status == "completed":
        return JsonResponse({"message": "این واحد قبلاً انجام شده است و امکان مرجوع کردن آن وجود ندارد."}, status=400)

    unit_price = item.price
    profile = ResellerProfile.objects.select_for_update().get(id=profile.id)

    # 1. Credit reseller wallet
    new_balance = profile.wallet_balance + unit_price
    profile.wallet_balance = new_balance
    profile.save(update_fields=["wallet_balance"])

    # 2. Log wallet txn
    ResellerWalletTxn.objects.create(
        profile=profile,
        kind="refund",
        amount=unit_price,
        balance_after=new_balance,
        related_order=order,
        note=f"مرجوعی واحد {index} از سفارش {order.tracking_code}",
        created_by=request.user,
    )

    # 3. Delete the account unit
    acc.delete()

    # 4. Update order items quantity & total
    was_quantity = item.quantity
    item.quantity = max(0, was_quantity - 1)

    if item.quantity == 0:
        item.save(update_fields=["quantity"])
        order.amount = 0
        order.status = "refunded"
        order.save(update_fields=["amount", "status"])

        return JsonResponse({
            "ok": True,
            "order": _reseller_order_dict(order),
            "wallet_balance": new_balance,
            "message": "سفارش به طور کامل مرجوع شد."
        })

    # If quantity > 0:
    item.save(update_fields=["quantity"])
    order.amount = item.price * item.quantity

    # Re-index remaining accounts
    remaining = list(item.accounts.order_by("index"))
    for i, a in enumerate(remaining, start=1):
        if a.index != i:
            a.index = i
            a.save(update_fields=["index"])

    # Update legacy first_filled account if needed
    first_filled = item.accounts.filter(status="filled").order_by("index").first()
    if first_filled:
        item.account_type = first_filled.account_type
        item.account_email = first_filled.account_email
        item.account_password = first_filled.account_password
        item.save(update_fields=["account_type", "account_email", "account_password"])
        order.epic_username = first_filled.account_email
    else:
        # if no filled accounts left, reset legacy to first remaining or default
        first_rem = item.accounts.order_by("index").first()
        if first_rem:
            item.account_type = first_rem.account_type
            item.account_email = first_rem.account_email
            item.account_password = first_rem.account_password
            item.save(update_fields=["account_type", "account_email", "account_password"])
            order.epic_username = first_rem.account_email or f"reseller-{profile.seller_code}"

    # Check if all remaining accounts are filled
    all_filled = item.accounts.filter(status="pending").count() == 0
    diff_info = _reservation_diff(order)
    due = 0

    if all_filled and order.reserve_mode == "later":
        # Check lira diff
        if diff_info.get("applicable") and diff_info.get("exceeded") and diff_info.get("due", 0) > 0:
            due = diff_info["due"]
            if profile.wallet_balance < due:
                return JsonResponse({
                    "message": f"نوسان لیر از {diff_info['threshold_pct']}٪ عبور کرده است. "
                               f"ما‌به‌التفاوت قابل پرداخت: {due:,} تومان. موجودی کیف پول کافی نیست.",
                    "code": "insufficient_balance_for_diff",
                    "diff": diff_info,
                }, status=400)
            new_balance = profile.wallet_balance - due
            profile.wallet_balance = new_balance
            profile.save(update_fields=["wallet_balance"])
            order.lira_diff_charged += due
            ResellerWalletTxn.objects.create(
                profile=profile,
                kind="adjust",
                amount=-due,
                balance_after=new_balance,
                related_order=order,
                note=f"ما‌به‌التفاوت نوسان لیر سفارش {order.tracking_code} (نرخ {diff_info['locked_rate']}→{diff_info['current_rate']})",
                created_by=request.user,
            )
        order.reserve_filled_at = timezone.now()
        order.status = "paid"
        order.save(update_fields=["reserve_filled_at", "lira_diff_charged", "status", "amount", "epic_username"])
    else:
        order.save(update_fields=["amount", "epic_username"])

    return JsonResponse({
        "ok": True,
        "order": _reseller_order_dict(order),
        "wallet_balance": profile.wallet_balance,
        "message": f"واحد {index} مرجوع شد و مبلغ {unit_price:,} تومان به کیف پول بازگشت."
    })


# -----------------------------------------------------------------------
# ORDER CHECKOUT — پرداخت مستقیم از درگاه زرین‌پال (بدون کیف پول)
# -----------------------------------------------------------------------
def _reseller_order_callback_url(request) -> str:
    """callback پرداخت مستقیم سفارش؛ به همان صفحه‌ی callback کیف پول با type=order."""
    base = getattr(
        __import__("django.conf", fromlist=["settings"]).settings,
        "FRONTEND_URL",
        "https://nubixshop.ir",
    )
    host = request.META.get("HTTP_HOST", "")
    if "vip-reseller" in host:
        scheme = "https" if request.is_secure() else "http"
        return f"{scheme}://{host}/reseller/wallet/callback?type=order"
    return f"{base.rstrip('/')}/api/reseller/orders/verify"


@csrf_exempt
def reseller_order_checkout(request):
    """POST /api/reseller/orders/checkout — ثبت سفارش با پرداخت مستقیم از درگاه."""
    if request.method != "POST":
        return HttpResponseNotAllowed(["POST"])
    if not _is_reseller_user(request.user):
        return JsonResponse({"detail": "احراز هویت همکار لازم است."}, status=401)
    profile = _get_reseller_profile(request.user)
    if not profile:
        return JsonResponse({"detail": "پروفایل همکار یافت نشد."}, status=404)
    if profile.status == "suspended":
        return JsonResponse({"detail": "حساب شما تعلیق است."}, status=403)

    try:
        ctx = _parse_reseller_order_payload(request, profile)
    except _OrderValidationError as e:
        return e.response

    has_xbox_account = any(
        acc.get("account_type") == "xbox" for acc in ctx["accounts"]
    )
    needs_epic_rules = ctx["is_crew"] or has_xbox_account
    if needs_epic_rules and not ctx.get("epic_rules_accepted"):
        return JsonResponse(
            {
                "code": "epic_rules_required",
                "message": "برای ثبت سفارش محصولات وابسته به اپیک گیمز / ایکس باکس، باید قوانین را مطالعه و تأیید کنید.",
            },
            status=400,
        )

    total = ctx["total"]
    description = f"خرید مستقیم همکار {profile.seller_code} — {ctx['product'].name_fa} ×{ctx['quantity']}"
    zarinpal = ZarinPalService()
    try:
        success, data = zarinpal.create_payment_request(
            amount=total,
            description=description,
            callback_url=_reseller_order_callback_url(request),
            mobile=profile.contact_phone or "",
            email=profile.user.email or "",
            currency="IRT",
        )
    except Exception as e:
        logger.exception("Reseller order checkout: ZarinPal request failed")
        return JsonResponse({"message": f"خطا در اتصال به درگاه: {e}"}, status=502)

    if not success or not data.get("authority"):
        return JsonResponse(
            {"message": data.get("error", "درگاه پرداخت پاسخ نداد.")},
            status=502,
        )

    authority = data["authority"]
    fee = int(data.get("fee") or 0)
    fee_type = data.get("fee_type", "")

    with transaction.atomic():
        order = _build_reseller_order(request, profile, ctx, status="pending")  # تا تأیید پرداخت
        Payment.objects.create(
            order=order,
            authority=authority,
            amount=total,
            fee=fee,
            fee_type=fee_type,
        )

    return JsonResponse(
        {
            "ok": True,
            "authority": authority,
            "redirect_url": data.get("payment_url", ""),
            "amount": total,
            "order_tracking": order.tracking_code,
        }
    )


@csrf_exempt
def reseller_order_verify(request):
    """GET /api/reseller/orders/verify — callback زرین‌پال برای خرید مستقیم سفارش."""
    if request.method != "GET":
        return HttpResponseNotAllowed(["GET"])

    authority = (request.GET.get("Authority") or "").strip()
    status = (request.GET.get("Status") or "").strip()
    if not authority:
        return JsonResponse({"detail": "Authority نامعتبر"}, status=400)

    payment = Payment.objects.filter(authority=authority).select_related("order", "order__user").first()
    if not payment:
        return JsonResponse({"detail": "پرداخت یافت نشد."}, status=404)
    if payment.status in ("success", "verified"):
        return JsonResponse({"ok": True, "already": True, "order_tracking": payment.order.tracking_code})

    if status != "OK":
        payment.status = "failed"
        payment.save(update_fields=["status", "updated_at"])
        # سفارش ناموفق را لغو کن تا اطلاعات اکانت بلااستفاده نماند
        if payment.order.status == "pending":
            payment.order.status = "canceled"
            payment.order.save(update_fields=["status"])
        return JsonResponse({"detail": "پرداخت لغو شد.", "ok": False}, status=402)

    zarinpal = ZarinPalService()
    try:
        success, data = zarinpal.verify_payment(amount=payment.amount, authority=authority)
    except Exception as e:
        logger.exception("Reseller order verify failed")
        return JsonResponse({"message": f"خطا در تأیید پرداخت: {e}"}, status=502)

    if not success or not data.get("ref_id"):
        payment.status = "failed"
        payment.save(update_fields=["status", "updated_at"])
        return JsonResponse({"detail": "پرداخت تأیید نشد.", "raw": data}, status=402)

    with transaction.atomic():
        payment.status = "verified"
        payment.ref_id = str(data.get("ref_id") or "")
        payment.card_pan = data.get("card_pan") or ""
        payment.card_hash = data.get("card_hash") or ""
        payment.save()

        # سفارش مستقیماً پرداخت‌شده محسوب می‌شود (کیف پول دخیل نیست)
        payment.order.status = "paid"
        payment.order.save(update_fields=["status"])

    referee = _get_reseller_profile(payment.order.user)
    if referee:
        _maybe_pay_referral_reward(referee, request)

    return JsonResponse(
        {
            "ok": True,
            "order_tracking": payment.order.tracking_code,
            "ref_id": payment.ref_id,
            "amount": payment.amount,
        }
    )


# -----------------------------------------------------------------------
# WALLET
# -----------------------------------------------------------------------
def reseller_wallet(request):
    if request.method != "GET":
        return HttpResponseNotAllowed(["GET"])
    if not _is_reseller_user(request.user):
        return JsonResponse({"detail": "احراز هویت همکار لازم است."}, status=401)
    profile = _get_reseller_profile(request.user)
    if not profile:
        return JsonResponse({"detail": "پروفایل همکار یافت نشد."}, status=404)

    txns = list(
        ResellerWalletTxn.objects.filter(profile=profile)
        .select_related("related_order", "created_by")
        .order_by("-created_at")[:200]
    )
    return JsonResponse(
        {
            "wallet_balance": profile.wallet_balance,
            "txns": [
                {
                    "id": t.id,
                    "kind": t.kind,
                    "kind_fa": dict(ResellerWalletTxn.KIND_CHOICES).get(t.kind, t.kind),
                    "amount": t.amount,
                    "balance_after": t.balance_after,
                    "note": t.note,
                    "created_at": t.created_at.isoformat(),
                    "related_order_tracking": t.related_order.tracking_code if t.related_order else "",
                }
                for t in txns
            ],
        }
    )


# -----------------------------------------------------------------------
# WALLET TOPUP
# -----------------------------------------------------------------------
@csrf_exempt
def reseller_wallet_topup(request):
    if request.method != "POST":
        return HttpResponseNotAllowed(["POST"])
    if not _is_reseller_user(request.user):
        return JsonResponse({"detail": "احراز هویت همکار لازم است."}, status=401)
    profile = _get_reseller_profile(request.user)
    if not profile:
        return JsonResponse({"detail": "پروفایل همکار یافت نشد."}, status=404)
    if profile.status == "suspended":
        return JsonResponse({"detail": "حساب شما تعلیق است."}, status=403)

    if _setting_bool("reseller_topup_disabled", False):
        return JsonResponse({"message": "امکان شارژ کیف پول همکاران موقتاً غیرفعال است."}, status=400)

    try:
        payload = json.loads(request.body.decode("utf-8") or "{}")
    except Exception:
        return JsonResponse({"message": "JSON نامعتبر"}, status=400)

    try:
        amount = int(payload.get("amount") or 0)
    except (TypeError, ValueError):
        return JsonResponse({"message": "مبلغ نامعتبر"}, status=400)

    min_topup = _setting_int("reseller_min_topup", 100_000)
    max_topup = _setting_int("reseller_max_topup", 200_000_000)

    if amount < min_topup:
        return JsonResponse({"message": f"حداقل مبلغ شارژ {min_topup:,} تومان است."}, status=400)
    if amount > max_topup:
        return JsonResponse({"message": f"حداکثر مبلغ شارژ {max_topup:,} تومان است."}, status=400)

    description = f"شارژ کیف پول همکار {profile.seller_code}"
    zarinpal = ZarinPalService()
    try:
        success, data = zarinpal.create_payment_request(
            amount=amount,
            description=description,
            callback_url=_reseller_topup_callback_url(request),
            mobile=profile.contact_phone or "",
            email=profile.user.email or "",
            currency="IRT",
        )
    except Exception as e:
        logger.exception("Reseller topup: ZarinPal request failed")
        return JsonResponse({"message": f"خطا در اتصال به درگاه: {e}"}, status=502)

    if not success or not data.get("authority"):
        return JsonResponse(
            {"message": data.get("error", "درگاه پرداخت پاسخ نداد.")},
            status=502,
        )

    authority = data["authority"]
    fee = int(data.get("fee") or 0)
    fee_type = data.get("fee_type", "")

    with transaction.atomic():
        order = Order.objects.create(
            user=request.user,
            epic_username=profile.user.email or f"reseller-{profile.seller_code}",
            phone=profile.contact_phone or profile.user.username or "",
            telegram=profile.support_name or "",
            note=f"شارژ کیف پول همکار {profile.seller_code}",
            amount=amount,
            status="wallet_topup",
            is_reseller_order=True,
            reseller_seller_code=profile.seller_code,
        )
        payment = Payment.objects.create(
            order=order,
            authority=authority,
            amount=amount,
            fee=fee,
            fee_type=fee_type,
        )
        ResellerWalletTxn.objects.create(
            profile=profile,
            kind="topup_pending",
            amount=0,  # هنوز صفر تا تأیید شود
            balance_after=profile.wallet_balance,
            related_order=order,
            related_payment=payment,
            note=f"در انتظار پرداخت شارژ",
            created_by=request.user,
        )

    redirect_url = data.get("payment_url", "")
    return JsonResponse(
        {
            "ok": True,
            "authority": authority,
            "redirect_url": redirect_url,
            "amount": amount,
            "order_tracking": order.tracking_code,
        }
    )


def _reseller_topup_callback_url(request) -> str:
    base = getattr(
        __import__("django.conf", fromlist=["settings"]).settings,
        "FRONTEND_URL",
        "https://nubixshop.ir",
    )
    # اگر درخواست از ساب‌دامین همکار آمده، از همون استفاده کن
    host = request.META.get("HTTP_HOST", "")
    if "vip-reseller" in host:
        scheme = "https" if request.is_secure() else "http"
        return f"{scheme}://{host}/reseller/wallet/callback?from=api"
    return f"{base.rstrip('/')}/api/reseller/wallet/verify"


@csrf_exempt
def reseller_wallet_verify(request):
    """GET /api/reseller/wallet/verify — callback زرین‌پال."""
    if request.method != "GET":
        return HttpResponseNotAllowed(["GET"])

    authority = (request.GET.get("Authority") or "").strip()
    status = (request.GET.get("Status") or "").strip()
    if not authority:
        return JsonResponse({"detail": "Authority نامعتبر"}, status=400)

    payment = Payment.objects.filter(authority=authority).select_related("order", "order__user").first()
    if not payment:
        return JsonResponse({"detail": "پرداخت یافت نشد."}, status=404)
    if payment.status in ("success", "verified"):
        return JsonResponse({"ok": True, "already": True})

    if status != "OK":
        payment.status = "failed"
        payment.save(update_fields=["status", "updated_at"])
        return JsonResponse({"detail": "پرداخت لغو شد.", "ok": False}, status=402)

    zarinpal = ZarinPalService()
    try:
        success, data = zarinpal.verify_payment(amount=payment.amount, authority=authority)
    except Exception as e:
        logger.exception("Reseller topup verify failed")
        return JsonResponse({"message": f"خطا در تأیید پرداخت: {e}"}, status=502)

    if not success or not data.get("ref_id"):
        payment.status = "failed"
        payment.save(update_fields=["status", "updated_at"])
        return JsonResponse(
            {"detail": "پرداخت تأیید نشد.", "raw": data},
            status=402,
        )

    with transaction.atomic():
        # lock
        profile = ResellerProfile.objects.select_for_update().filter(user=payment.order.user).first()
        if not profile:
            return JsonResponse({"detail": "پروفایل همکار یافت نشد."}, status=404)

        payment.status = "verified"
        payment.ref_id = str(data.get("ref_id") or "")
        payment.card_pan = data.get("card_pan") or ""
        payment.card_hash = data.get("card_hash") or ""
        payment.save()

        payment.order.status = "completed"
        payment.order.completed_at = timezone.now()
        payment.order.save(update_fields=["status", "completed_at"])

        new_balance = profile.wallet_balance + payment.amount
        profile.wallet_balance = new_balance
        profile.save(update_fields=["wallet_balance"])

        # به‌روزرسانی تراکنش pending به topup واقعی
        ResellerWalletTxn.objects.filter(
            related_order=payment.order, kind="topup_pending"
        ).update(
            kind="topup",
            amount=payment.amount,
            balance_after=new_balance,
            note=f"شارژ موفق - کد پیگیری: {payment.ref_id}",
        )
        # اگر رکورد pending وجود نداشت (احتمال race)، یکی ایجاد کن
        if not ResellerWalletTxn.objects.filter(
            related_order=payment.order, kind="topup"
        ).exists():
            ResellerWalletTxn.objects.create(
                profile=profile,
                kind="topup",
                amount=payment.amount,
                balance_after=new_balance,
                related_order=payment.order,
                related_payment=payment,
                note=f"شارژ موفق - کد پیگیری: {payment.ref_id}",
                created_by=payment.order.user,
            )

    return JsonResponse(
        {
            "ok": True,
            "wallet_balance": new_balance,
            "ref_id": payment.ref_id,
            "amount": payment.amount,
        }
    )


# -----------------------------------------------------------------------
# STATS / VIP TIER / REFERRAL
# -----------------------------------------------------------------------
# سطوح VIP پیش‌فرض بر اساس مجموع خرید (تومان). از SiteSetting قابل بازنویسی است.
DEFAULT_VIP_TIERS = [
    {"key": "bronze", "name": "برنزی", "min_spend": 0},
    {"key": "silver", "name": "نقره‌ای", "min_spend": 20_000_000},
    {"key": "gold", "name": "طلایی", "min_spend": 80_000_000},
    {"key": "diamond", "name": "الماس", "min_spend": 200_000_000},
]


def _vip_tiers() -> list:
    """سطوح VIP را از SiteSetting (کلید reseller_tier_thresholds) یا پیش‌فرض می‌خواند."""
    try:
        s = SiteSetting.objects.filter(key="reseller_tier_thresholds").first()
        if s and s.value_text.strip():
            data = json.loads(s.value_text)
            if isinstance(data, list) and data:
                return sorted(data, key=lambda t: int(t.get("min_spend", 0)))
    except Exception:
        logger.warning("reseller_tier_thresholds نامعتبر است؛ استفاده از پیش‌فرض")
    return DEFAULT_VIP_TIERS


def _compute_vip_tier(total_spend: int) -> dict:
    tiers = _vip_tiers()
    current = tiers[0]
    nxt = None
    for i, t in enumerate(tiers):
        if total_spend >= int(t.get("min_spend", 0)):
            current = t
            nxt = tiers[i + 1] if i + 1 < len(tiers) else None
    progress = 100
    remaining = 0
    if nxt:
        span = int(nxt["min_spend"]) - int(current.get("min_spend", 0))
        done = total_spend - int(current.get("min_spend", 0))
        progress = int(min(100, max(0, (done / span) * 100))) if span > 0 else 0
        remaining = max(0, int(nxt["min_spend"]) - total_spend)
    return {
        "key": current.get("key"),
        "name": current.get("name"),
        "min_spend": int(current.get("min_spend", 0)),
        "next_name": nxt["name"] if nxt else None,
        "next_min_spend": int(nxt["min_spend"]) if nxt else None,
        "progress_percent": progress,
        "remaining_to_next": remaining,
    }


def _referral_reward_amount() -> int:
    """مبلغ پاداش معرفی (تومان) از SiteSetting reseller_referral_reward، پیش‌فرض ۵۰هزار."""
    try:
        s = SiteSetting.objects.filter(key="reseller_referral_reward").first()
        if s and s.value_text.strip():
            return max(0, int(s.value_text.strip()))
    except Exception:
        pass
    return 50_000


def _maybe_pay_referral_reward(referee: ResellerProfile, request) -> None:
    """در اولین خرید موفق یک همکارِ معرفی‌شده، پاداش را به معرف اعتبار می‌دهد."""
    if referee.referral_rewarded or not referee.referred_by_id:
        return
    reward = _referral_reward_amount()
    if reward <= 0:
        referee.referral_rewarded = True
        referee.save(update_fields=["referral_rewarded"])
        return
    with transaction.atomic():
        referrer = ResellerProfile.objects.select_for_update().get(id=referee.referred_by_id)
        new_balance = referrer.wallet_balance + reward
        referrer.wallet_balance = new_balance
        referrer.save(update_fields=["wallet_balance"])
        ResellerWalletTxn.objects.create(
            profile=referrer,
            kind="adjust",
            amount=reward,
            balance_after=new_balance,
            note=f"پاداش معرفی همکار {referee.seller_code}",
            created_by=getattr(request, "user", None) if getattr(request, "user", None) and request.user.is_authenticated else None,
        )
        referee.referral_rewarded = True
        referee.save(update_fields=["referral_rewarded"])


def reseller_stats(request):
    """GET /api/reseller/stats — آمار و سطح VIP همکار."""
    if request.method != "GET":
        return HttpResponseNotAllowed(["GET"])
    if not _is_reseller_user(request.user):
        return JsonResponse({"detail": "احراز هویت همکار لازم است."}, status=401)
    profile = _get_reseller_profile(request.user)
    if not profile:
        return JsonResponse({"detail": "پروفایل همکار یافت نشد."}, status=404)

    # سفارش‌های واقعی (به‌جز شارژ کیف پول)
    orders_qs = Order.objects.filter(
        is_reseller_order=True, user_id=request.user.id
    ).exclude(status__in=["wallet_topup"]).exclude(note__icontains="شارژ کیف پول")

    total_orders = orders_qs.count()
    completed_statuses = ["paid", "registered", "processing", "completed"]
    completed_orders = orders_qs.filter(status__in=completed_statuses).count()
    refunded_orders = orders_qs.filter(status__in=["refunded", "canceled"]).count()

    # هزینه کرد = مجموع تراکنش‌های خرید (مقدار منفی) + خریدهای مستقیم درگاه
    spend_txn = ResellerWalletTxn.objects.filter(profile=profile, kind="order").aggregate(s=Sum("amount"))["s"] or 0
    wallet_spend = abs(int(spend_txn))
    # خریدهای مستقیم درگاه از کیف پول کسر نمی‌شوند؛ مبلغ سفارش‌هایی که پرداخت تأییدشده دارند
    # ولی تراکنش کیف‌پولی ندارند را جداگانه می‌شماریم (id یکتا تا join دوباره‌حساب نکند).
    wallet_order_ids = ResellerWalletTxn.objects.filter(
        profile=profile, kind="order"
    ).values_list("related_order_id", flat=True)
    direct_order_ids = list(
        orders_qs.filter(payments__status="verified")
        .exclude(id__in=wallet_order_ids)
        .values_list("id", flat=True)
        .distinct()
    )
    direct_spend = Order.objects.filter(id__in=direct_order_ids).aggregate(s=Sum("amount"))["s"] or 0
    total_spend = wallet_spend + int(direct_spend)

    now = timezone.now()
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    month_spend = abs(int(
        ResellerWalletTxn.objects.filter(profile=profile, kind="order", created_at__gte=month_start)
        .aggregate(s=Sum("amount"))["s"] or 0
    ))

    total_topups = int(
        ResellerWalletTxn.objects.filter(profile=profile, kind="topup").aggregate(s=Sum("amount"))["s"] or 0
    )

    avg_order = int(total_spend / completed_orders) if completed_orders else 0
    success_rate = round((completed_orders / total_orders) * 100) if total_orders else 0

    # سری ۱۲ هفته‌ی اخیر هزینه‌کرد (برای اسپارک‌لاین)
    weekly = []
    for i in range(11, -1, -1):
        start = (now - timedelta(weeks=i + 1))
        end = (now - timedelta(weeks=i))
        amt = abs(int(
            ResellerWalletTxn.objects.filter(
                profile=profile, kind="order", created_at__gte=start, created_at__lt=end
            ).aggregate(s=Sum("amount"))["s"] or 0
        ))
        weekly.append(amt)

    # شکست وضعیت سفارش‌ها (برای نمودار دونات)
    status_breakdown = {
        row["status"]: row["c"]
        for row in orders_qs.values("status").annotate(c=Count("id"))
    }

    referral_count = ResellerProfile.objects.filter(referred_by=profile).count()
    referral_earned = int(
        ResellerWalletTxn.objects.filter(profile=profile, kind="adjust", note__startswith="پاداش معرفی")
        .aggregate(s=Sum("amount"))["s"] or 0
    )

    return JsonResponse({
        "wallet_balance": profile.wallet_balance,
        "total_orders": total_orders,
        "completed_orders": completed_orders,
        "refunded_orders": refunded_orders,
        "total_spend": total_spend,
        "month_spend": month_spend,
        "total_topups": total_topups,
        "avg_order": avg_order,
        "success_rate": success_rate,
        "weekly_spend": weekly,
        "status_breakdown": status_breakdown,
        "vip_tier": _compute_vip_tier(total_spend),
        "referral_count": referral_count,
        "referral_earned": referral_earned,
        "referral_reward": _referral_reward_amount(),
    })


def reseller_referrals(request):
    """GET /api/reseller/referrals — لیست همکاران معرفی‌شده + پاداش‌ها."""
    if request.method != "GET":
        return HttpResponseNotAllowed(["GET"])
    if not _is_reseller_user(request.user):
        return JsonResponse({"detail": "احراز هویت همکار لازم است."}, status=401)
    profile = _get_reseller_profile(request.user)
    if not profile:
        return JsonResponse({"detail": "پروفایل همکار یافت نشد."}, status=404)

    referees = ResellerProfile.objects.filter(referred_by=profile).order_by("-created_at")[:200]
    return JsonResponse({
        "referral_code": profile.seller_code,
        "reward_per_referral": _referral_reward_amount(),
        "total_earned": int(
            ResellerWalletTxn.objects.filter(profile=profile, kind="adjust", note__startswith="پاداش معرفی")
            .aggregate(s=Sum("amount"))["s"] or 0
        ),
        "referees": [
            {
                "seller_code": r.seller_code,
                "support_name": r.support_name,
                "status": r.status,
                "status_fa": dict(ResellerProfile.STATUS_CHOICES).get(r.status, r.status),
                "rewarded": r.referral_rewarded,
                "joined_at": r.created_at.isoformat() if r.created_at else None,
            }
            for r in referees
        ],
    })


# -----------------------------------------------------------------------
# ADMIN endpoints
# -----------------------------------------------------------------------
def admin_resellers(request):
    if request.method != "GET":
        return HttpResponseNotAllowed(["GET"])
    if not _is_admin_user(request.user):
        return JsonResponse({"detail": "forbidden"}, status=403)

    status_filter = request.GET.get("status", "all")
    search = (request.GET.get("search") or "").strip()

    qs = ResellerProfile.objects.select_related("user").annotate(
        order_count=Count("user__orders", filter=Q(user__orders__is_reseller_order=True), distinct=True),
        last_order_at=Max("user__orders__created_at", filter=Q(user__orders__is_reseller_order=True)),
    )
    if status_filter != "all":
        qs = qs.filter(status=status_filter)
    if search:
        qs = qs.filter(
            Q(seller_code__icontains=search)
            | Q(token_prefix__icontains=search)
            | Q(support_name__icontains=search)
            | Q(legal_name__icontains=search)
            | Q(national_id__icontains=search)
            | Q(contact_phone__icontains=search)
            | Q(bank_card_number__icontains=search)
            | Q(user__email__icontains=search)
        )

    qs = qs.order_by("-updated_at")[:300]
    results = []
    for p in qs:
        d = _reseller_dict(p)
        d["user_email"] = p.user.email or ""
        d["order_count"] = int(p.order_count or 0)
        d["last_order_at"] = p.last_order_at.isoformat() if p.last_order_at else None
        d["admin_note"] = p.admin_note
        d["token_prefix"] = p.token_prefix
        results.append(d)

    counts = ResellerProfile.objects.values("status").annotate(c=Count("id"))
    counts_map = {row["status"]: row["c"] for row in counts}

    return JsonResponse({"results": results, "counts": counts_map})


@csrf_exempt
def admin_reseller_create(request):
    if request.method != "POST":
        return HttpResponseNotAllowed(["POST"])
    if not _is_admin_user(request.user):
        return JsonResponse({"detail": "forbidden"}, status=403)

    try:
        payload = json.loads(request.body.decode("utf-8") or "{}")
    except Exception:
        return JsonResponse({"message": "JSON نامعتبر"}, status=400)

    support_name = (payload.get("support_name") or "").strip()
    if not support_name or len(support_name) < 2:
        return JsonResponse({"message": "نام پشتیبانی (نام نمایشی) الزامی است."}, status=400)

    with transaction.atomic():
        # یونیک بودن seller_code را تضمین می‌کنیم
        for _ in range(5):
            seller_code = _generate_seller_code()
            try:
                # ایجاد User مخفی
                username = f"reseller_{seller_code.replace('-', '')}"
                # اطمینان از یکتا بودن
                if User.objects.filter(username=username).exists():
                    continue
                user = User(
                    username=username,
                    email=f"{seller_code.lower().replace('-', '')}@reseller.nubixshop.ir",
                )
                user.set_unusable_password()
                user.save()
                # ثبت پروفایل کاربری
                UserProfile.objects.create(user=user, tier="reseller")

                raw_token = _generate_raw_token()
                profile = ResellerProfile.objects.create(
                    user=user,
                    seller_code=seller_code,
                    token_hash=_hash_token(raw_token),
                    token_prefix=raw_token[:4],
                    status="draft",
                    support_name=support_name,
                )
                break
            except Exception as e:
                logger.exception("Reseller create error")
                return JsonResponse({"message": f"خطا در ایجاد: {e}"}, status=500)
        else:
            return JsonResponse({"message": "خطا در تولید کد سلر یکتا."}, status=500)

    return JsonResponse(
        {
            "ok": True,
            "reseller": {
                **(_reseller_dict(profile)),
                "user_email": user.email,
                "order_count": 0,
                "token_prefix": profile.token_prefix,
                "admin_note": "",
            },
            "token": raw_token,
            "warning": "این توکن فقط اینجا نمایش داده می‌شود. ذخیره‌اش کنید.",
        },
        status=201,
    )


@csrf_exempt
def admin_reseller_update(request, reseller_id: int):
    if request.method not in ("POST", "PATCH", "PUT", "DELETE"):
        return HttpResponseNotAllowed(["POST", "PATCH", "PUT", "DELETE"])
    if not _is_admin_user(request.user):
        return JsonResponse({"detail": "forbidden"}, status=403)
    profile = get_object_or_404(ResellerProfile, id=reseller_id)

    if request.method == "DELETE":
        with transaction.atomic():
            user = profile.user
            profile.delete()
            user.delete()
        return JsonResponse({"ok": True, "deleted": True})

    try:
        payload = json.loads(request.body.decode("utf-8") or "{}")
    except Exception:
        return JsonResponse({"message": "JSON نامعتبر"}, status=400)

    new_status = (payload.get("status") or "").strip()
    if new_status:
        valid = {key for key, _ in ResellerProfile.STATUS_CHOICES}
        if new_status not in valid:
            return JsonResponse({"message": "وضعیت نامعتبر."}, status=400)
        profile.status = new_status
        if new_status == "verified":
            profile.verified_at = timezone.now()
            profile.verified_by = request.user
        elif new_status in ("draft", "pending_review"):
            profile.verified_at = None
            profile.verified_by = None

    if "admin_note" in payload:
        profile.admin_note = (payload.get("admin_note") or "").strip()

    profile.save()
    return JsonResponse({"ok": True, "reseller": _reseller_dict(profile)})


@csrf_exempt
def admin_reseller_rotate_token(request, reseller_id: int):
    if request.method != "POST":
        return HttpResponseNotAllowed(["POST"])
    if not _is_admin_user(request.user):
        return JsonResponse({"detail": "forbidden"}, status=403)
    profile = get_object_or_404(ResellerProfile, id=reseller_id)
    raw_token = _generate_raw_token()
    profile.token_hash = _hash_token(raw_token)
    profile.token_prefix = raw_token[:4]
    profile.save(update_fields=["token_hash", "token_prefix", "updated_at"])
    return JsonResponse(
        {
            "ok": True,
            "token": raw_token,
            "token_prefix": profile.token_prefix,
            "warning": "این توکن فقط اینجا نمایش داده می‌شود. ذخیره‌اش کنید.",
        }
    )


@csrf_exempt
def admin_reseller_wallet_adjust(request, reseller_id: int):
    if request.method != "POST":
        return HttpResponseNotAllowed(["POST"])
    if not _is_admin_user(request.user):
        return JsonResponse({"detail": "forbidden"}, status=403)
    profile = get_object_or_404(ResellerProfile, id=reseller_id)

    try:
        payload = json.loads(request.body.decode("utf-8") or "{}")
    except Exception:
        return JsonResponse({"message": "JSON نامعتبر"}, status=400)

    try:
        amount = int(payload.get("amount") or 0)
    except (TypeError, ValueError):
        return JsonResponse({"message": "مبلغ نامعتبر"}, status=400)
    
    mode = (payload.get("mode") or "add").strip()  # "add" or "set"
    note = (payload.get("note") or "").strip()
    
    if mode == "add":
        if amount == 0:
            return JsonResponse({"message": "مبلغ نمی‌تواند صفر باشد."}, status=400)
    elif mode == "set":
        if amount < 0:
            return JsonResponse({"message": "موجودی جدید نمی‌تواند منفی باشد."}, status=400)
    else:
        return JsonResponse({"message": "حالت نامعتبر"}, status=400)
        
    if not note:
        return JsonResponse({"message": "درج یادداشت برای تعدیل دستی الزامی است."}, status=400)

    with transaction.atomic():
        profile = ResellerProfile.objects.select_for_update().get(id=reseller_id)
        if mode == "add":
            new_balance = profile.wallet_balance + amount
            diff = amount
        else: # mode == "set"
            new_balance = amount
            diff = new_balance - profile.wallet_balance
            
        if new_balance < 0:
            return JsonResponse({"message": "موجودی نمی‌تواند منفی شود."}, status=400)
            
        profile.wallet_balance = new_balance
        profile.save(update_fields=["wallet_balance", "updated_at"])
        
        if diff != 0:
            ResellerWalletTxn.objects.create(
                profile=profile,
                kind="adjust",
                amount=diff,
                balance_after=new_balance,
                note=note,
                created_by=request.user,
            )

    return JsonResponse({"ok": True, "wallet_balance": new_balance})


@csrf_exempt
def admin_reseller_details(request, reseller_id: int):
    if request.method != "GET":
        return HttpResponseNotAllowed(["GET"])
    if not _is_admin_user(request.user):
        return JsonResponse({"detail": "forbidden"}, status=403)
    profile = get_object_or_404(ResellerProfile, id=reseller_id)

    # 1. Transactions
    txns = list(
        ResellerWalletTxn.objects.filter(profile=profile).order_by("-created_at")[:100]
    )
    txns_data = []
    for t in txns:
        txns_data.append({
            "id": t.id,
            "kind": t.kind,
            "kind_fa": dict(ResellerWalletTxn.KIND_CHOICES).get(t.kind, t.kind),
            "amount": t.amount,
            "balance_after": t.balance_after,
            "note": t.note,
            "created_by": t.created_by.username if t.created_by else "سیستم",
            "created_at": t.created_at.isoformat(),
        })

    # 2. Orders
    orders_qs = Order.objects.filter(
        is_reseller_order=True,
        user_id=profile.user_id,
    ).exclude(status__in=["wallet_topup"]).exclude(note__icontains="شارژ کیف پول").select_related("user").prefetch_related("items", "items__product", "payments").order_by("-created_at")[:100]
    
    orders_data = [_reseller_order_dict(o) for o in orders_qs]

    reseller_data = _reseller_dict(profile)
    reseller_data["user_email"] = profile.user.email or ""

    return JsonResponse({
        "ok": True,
        "reseller": reseller_data,
        "txns": txns_data,
        "orders": orders_data,
    })


@csrf_exempt
def reseller_channel_verify(request):
    """Reseller checks their own channel members after onboarding."""
    if request.method != "POST":
        return HttpResponseNotAllowed(["POST"])
    if not _is_reseller_user(request.user):
        return JsonResponse({"detail": "احراز هویت همکار لازم است."}, status=401)
    profile = _get_reseller_profile(request.user)
    if not profile:
        return JsonResponse({"detail": "پروفایل همکار یافت نشد."}, status=404)
    if not profile.channel_link:
        return JsonResponse({"detail": "لینک کانال ثبت نشده است."}, status=400)

    username = _parse_telegram_channel_username(profile.channel_link)
    if not username:
        return JsonResponse(
            {"detail": "لینک کانال نامعتبر است. فرمت مورد انتظار: t.me/<username> یا @<username>."},
            status=400,
        )

    members, error = get_channel_members(profile.channel_link, username=username)

    profile.channel_members_estimated = members
    profile.channel_checked_at = timezone.now()
    profile.save(update_fields=["channel_members_estimated", "channel_checked_at", "updated_at"])

    return JsonResponse({
        "ok": True,
        "channel_username": username,
        "members_estimated": members,
        "checked_at": profile.channel_checked_at.isoformat(),
        "error": error,
        "manual_required": members == 0 and not error,
    })


@csrf_exempt
def admin_reseller_channel_check(request, reseller_id: int):
    """بررسی تعداد اعضای کانال با Telethon (اولویت) یا اسکرپ t.me/s/"""
    if request.method != "POST":
        return HttpResponseNotAllowed(["POST"])
    if not _is_admin_user(request.user):
        return JsonResponse({"detail": "forbidden"}, status=403)
    profile = get_object_or_404(ResellerProfile, id=reseller_id)
    username = _parse_telegram_channel_username(profile.channel_link)
    if not username:
        return JsonResponse(
            {"detail": "لینک کانال نامعتبر است. فرمت مورد انتظار: t.me/<username> یا @<username>."},
            status=400,
        )

    members, error = get_channel_members(profile.channel_link)

    profile.channel_members_estimated = members
    profile.channel_checked_at = timezone.now()
    profile.save(update_fields=["channel_members_estimated", "channel_checked_at", "updated_at"])

    return JsonResponse(
        {
            "ok": True,
            "channel_username": username,
            "members_estimated": members_est,
            "checked_at": profile.channel_checked_at.isoformat(),
            "error": error,
            "manual_required": members_est == 0 and not error,
        }
    )


def _parse_int_with_suffix(s: str) -> int:
    s = s.replace(" ", "").replace(",", "").replace(".", "").replace("٬", "")
    m = re.match(r"(\d+)([KkMм]?)", s)
    if not m:
        return 0
    n = int(m.group(1))
    suffix = m.group(2).upper().replace("М", "M")
    if suffix == "K":
        return n * 1_000
    if suffix == "M":
        return n * 1_000_000
    return n


# -----------------------------------------------------------------------
# ADMIN Reseller Tiers
# -----------------------------------------------------------------------
def _parse_optional_int(raw) -> int | None:
    if raw in (None, "", "null", "0"):
        return None
    try:
        return int(raw)
    except (TypeError, ValueError):
        return None


def admin_reseller_tiers(request):
    """GET: پله‌های عمومی (پیش‌فرض) یا override یک همکار خاص برای یک محصول.

    query params: product_id (اختیاری), variant_id (اختیاری), reseller_id (اختیاری؛ غایب/۰ = پله‌های عمومی).
    """
    if request.method != "GET":
        return HttpResponseNotAllowed(["GET"])
    if not _is_admin_user(request.user):
        return JsonResponse({"detail": "forbidden"}, status=403)

    product_id = request.GET.get("product_id")
    variant_id = _parse_optional_int(request.GET.get("variant_id"))
    reseller_id = _parse_optional_int(request.GET.get("reseller_id"))
    qs = ResellerPriceTier.objects.select_related("product", "variant", "reseller").order_by(
        "product_id", "variant_id", "min_quantity"
    )
    if product_id:
        try:
            qs = qs.filter(product_id=int(product_id))
        except (TypeError, ValueError):
            pass
    qs = qs.filter(variant_id=variant_id) if variant_id is not None else qs.filter(variant__isnull=True)
    qs = qs.filter(reseller_id=reseller_id) if reseller_id else qs.filter(reseller__isnull=True)

    results = [
        {
            "id": t.id,
            "product_id": t.product_id,
            "product_name": t.product.name_fa,
            "product_slug": t.product.slug,
            "product_price_lira": t.product.price_lira,
            "variant_id": t.variant_id,
            "variant_title": t.variant.title if t.variant_id else "",
            "reseller_id": t.reseller_id,
            "min_quantity": t.min_quantity,
            "price": t.price,
            "active": t.active,
        }
        for t in qs
    ]
    cfg = _crew_pricing_config()
    response_data = {
        "results": results,
        "lira_rate": cfg["lira_rate"],
        "ref_rate": cfg["ref_rate"],
    }
    if product_id:
        product = get_object_or_404(Product, id=int(product_id))
        variants_qs = ProductVariant.objects.filter(product=product).order_by("sort_order", "id")
        response_data["variants"] = [
            {
                "id": v.id,
                "title": v.title,
                "price_lira": v.original_price,
            }
            for v in variants_qs
        ]
        price_lira_for_cost = product.price_lira
        if variant_id is not None:
            variant = variants_qs.filter(id=variant_id).first()
            if variant and variant.original_price > 0:
                price_lira_for_cost = variant.original_price
        if price_lira_for_cost > 0 and cfg["lira_rate"] > 0:
            cost_toman = price_lira_for_cost * cfg["lira_rate"]
            ideal_min_price = int(round(cost_toman * 1.125 / 1000.0) * 1000)
            response_data["product_price_lira"] = product.price_lira
            response_data["cost_toman"] = cost_toman
            response_data["ideal_min_price"] = ideal_min_price
            response_data["profit_pct"] = 12.5
            if variant_id is not None:
                response_data["variant_price_lira"] = price_lira_for_cost
    return JsonResponse(response_data)


@csrf_exempt
def admin_reseller_tiers_upsert(request):
    """PUT: جایگزینی پله‌های یک محصول (عمومی یا اختصاصی یک همکار).

    payload: {product_id, variant_id, reseller_id (اختیاری), tiers: [{min_quantity, price, active}]}
    reseller_id غایب/۰ = پله‌های عمومی؛ در غیر این صورت فقط override همان همکار جایگزین می‌شود (پله‌های
    عمومی و سایر همکاران دست‌نخورده می‌مانند).
    """
    if request.method not in ("PUT", "POST"):
        return HttpResponseNotAllowed(["PUT", "POST"])
    if not _is_admin_user(request.user):
        return JsonResponse({"detail": "forbidden"}, status=403)

    try:
        payload = json.loads(request.body.decode("utf-8") or "{}")
    except Exception:
        return JsonResponse({"message": "JSON نامعتبر"}, status=400)

    try:
        product_id = int(payload.get("product_id") or 0)
    except (TypeError, ValueError):
        return JsonResponse({"message": "product_id نامعتبر."}, status=400)
    if not product_id:
        return JsonResponse({"message": "product_id الزامی است."}, status=400)

    product = get_object_or_404(Product, id=product_id)
    variant_id = payload.get("variant_id") or None
    if variant_id:
        try:
            variant_id = int(variant_id)
        except (TypeError, ValueError):
            return JsonResponse({"message": "variant_id نامعتبر."}, status=400)

    reseller_id = _parse_optional_int(payload.get("reseller_id"))
    reseller = None
    if reseller_id:
        reseller = get_object_or_404(ResellerProfile, id=reseller_id)

    tiers = payload.get("tiers") or []
    if not isinstance(tiers, list) or not tiers:
        return JsonResponse({"message": "tiers نمی‌تواند خالی باشد."}, status=400)

    with transaction.atomic():
        # پاک کردن قبلی (فقط همین scope: عمومی یا همین همکار)
        ResellerPriceTier.objects.filter(
            product_id=product_id, variant_id=variant_id, reseller_id=reseller_id
        ).delete()
        # ایجاد جدید
        for t in tiers:
            try:
                min_q = int(t.get("min_quantity") or 0)
                price = int(t.get("price") or 0)
            except (TypeError, ValueError):
                return JsonResponse({"message": "مقادیر tier نامعتبر."}, status=400)
            if min_q < 1 or price < 0:
                return JsonResponse({"message": "مقادیر tier نامعتبر."}, status=400)
            ResellerPriceTier.objects.create(
                product=product,
                variant_id=variant_id,
                reseller=reseller,
                min_quantity=min_q,
                price=price,
                active=bool(t.get("active", True)),
            )

    return JsonResponse({"ok": True})


@csrf_exempt
def admin_reseller_tiers_clear_override(request):
    """POST: حذف override اختصاصی یک همکار برای یک محصول (بازگشت به قیمت عمومی).

    payload: {product_id, variant_id (اختیاری), reseller_id (الزامی)}
    """
    if request.method != "POST":
        return HttpResponseNotAllowed(["POST"])
    if not _is_admin_user(request.user):
        return JsonResponse({"detail": "forbidden"}, status=403)

    try:
        payload = json.loads(request.body.decode("utf-8") or "{}")
    except Exception:
        return JsonResponse({"message": "JSON نامعتبر"}, status=400)

    reseller_id = _parse_optional_int(payload.get("reseller_id"))
    if not reseller_id:
        return JsonResponse({"message": "reseller_id الزامی است."}, status=400)

    try:
        product_id = int(payload.get("product_id") or 0)
    except (TypeError, ValueError):
        return JsonResponse({"message": "product_id نامعتبر."}, status=400)
    if not product_id:
        return JsonResponse({"message": "product_id الزامی است."}, status=400)

    variant_id = payload.get("variant_id") or None
    if variant_id:
        try:
            variant_id = int(variant_id)
        except (TypeError, ValueError):
            return JsonResponse({"message": "variant_id نامعتبر."}, status=400)

    deleted, _ = ResellerPriceTier.objects.filter(
        product_id=product_id, variant_id=variant_id, reseller_id=reseller_id
    ).delete()
    return JsonResponse({"ok": True, "deleted": deleted})


def admin_reseller_price_overrides_summary(request):
    """GET ?reseller_id=X: لیست product_id هایی که این همکار override فعال دارد.
    GET ?product_id=Y&variant_id=V: لیست reseller_id هایی که برای این محصول/واریانت override فعال دارند.
    """
    if request.method != "GET":
        return HttpResponseNotAllowed(["GET"])
    if not _is_admin_user(request.user):
        return JsonResponse({"detail": "forbidden"}, status=403)

    reseller_id = _parse_optional_int(request.GET.get("reseller_id"))
    product_id = _parse_optional_int(request.GET.get("product_id"))
    variant_id = _parse_optional_int(request.GET.get("variant_id"))
    if not reseller_id and not product_id:
        return JsonResponse({"message": "reseller_id یا product_id الزامی است."}, status=400)

    if reseller_id:
        qs = ResellerPriceTier.objects.filter(reseller_id=reseller_id, active=True)
        qs = qs.filter(variant_id=variant_id) if variant_id is not None else qs.filter(variant__isnull=True)
        product_ids = list(qs.values_list("product_id", flat=True).distinct())
        return JsonResponse({"product_ids": product_ids})

    qs = ResellerPriceTier.objects.filter(product_id=product_id, active=True, reseller__isnull=False)
    qs = qs.filter(variant_id=variant_id) if variant_id is not None else qs.filter(variant__isnull=True)
    reseller_ids = list(qs.values_list("reseller_id", flat=True).distinct())
    return JsonResponse({"reseller_ids": reseller_ids})
