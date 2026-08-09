import json
import os
import logging
import hashlib
import hmac
import re
import requests
from datetime import timedelta, datetime, time
from urllib.parse import urljoin
from django.http import JsonResponse, HttpResponse, HttpResponseNotAllowed, HttpResponseRedirect
from django.views.decorators.csrf import csrf_exempt
from django.shortcuts import get_object_or_404
from django.contrib.auth import authenticate, login, logout, update_session_auth_hash
from django.contrib.auth.decorators import login_required
from django.contrib.auth.models import User
from django.db import transaction
from django.db.models import Q, Sum, Count, Max
from django.core.exceptions import MultipleObjectsReturned, ValidationError
from django.core.files.storage import default_storage
from django.conf import settings
from django.core.cache import cache
from django.utils.html import escape
from django.utils import timezone
from django.utils.dateparse import parse_datetime
from django.utils.http import url_has_allowed_host_and_scheme
from django.utils.text import slugify
from django.views.decorators.http import require_POST
from .models import (
    Product,
    ProductVariant,
    Order,
    OrderItem,
    OrderItemAccount,
    UserProfile,
    Payment,
    OTPVerification,
    DiscountCode,
    NotificationLog,
    SiteSetting,
    ProductComment,
    DiscordTicketChannel,
    DiscordTicketMessage,
    XboxAccount,
    ResellerProfile,
    ResellerWalletTxn,
    ResellerPriceTier,
    SettlementBatch,
    SubCategory,
    Referral,
    PointsTransaction,
    SpinResult,
    AccountingTransaction,
    AbandonedCart,
    G4A4Product,
    G4A4Variation,
    CustomerWalletTxn,
    WishlistItem,
)
from .zarinpal_service import ZarinPalService
from .email_service import (
    send_payment_success_email,
    send_admin_new_order_email,
    send_customer_order_created_email,
    send_status_update_email,
)
from .kavenegar_service import KavenegarService

SPECIAL_PRODUCT_LINKS = {
    "v-bucks": "/vbucks",
}
TGJU_CURRENCY_URL = "https://www.tgju.org/currency"

# Test user phone numbers - use sandbox payment and skip wallet rewards
TEST_USER_PHONES = getattr(settings, 'TEST_USER_PHONES', [])


def _is_test_user(user) -> bool:
    """Check if user is a test user (sandbox mode, no wallet rewards)"""
    if not user or not user.is_authenticated:
        return False
    try:
        phone = user.username  # username is phone number
        return phone in TEST_USER_PHONES
    except Exception:
        return False


def _is_test_user_by_phone(phone: str) -> bool:
    """Check if phone number belongs to a test user"""
    if not phone:
        return False
    # Normalize phone number
    normalized = phone.strip().replace(" ", "").replace("-", "")
    if normalized.startswith("+98"):
        normalized = "0" + normalized[3:]
    elif normalized.startswith("98") and len(normalized) > 10:
        normalized = "0" + normalized[2:]
    return normalized in TEST_USER_PHONES


def _safe_internal_redirect_target(request, target: str, fallback: str) -> str:
    candidate = (target or "").strip()
    if candidate and url_has_allowed_host_and_scheme(
        candidate,
        allowed_hosts={request.get_host()},
        require_https=request.is_secure(),
    ):
        return candidate
    return fallback


# Utility for discount code validation
def _get_discount_code_status(code: str, user=None):
    candidate = (code or "").strip().upper()
    if not candidate:
        return None, "کد تخفیف را وارد کنید."
    try:
        dc = DiscountCode.objects.get(code=candidate)
    except DiscountCode.DoesNotExist:
        return None, "کد تخفیف نامعتبر است."

    if not dc.active:
        return None, "کد تخفیف غیرفعال است."
    if dc.expires_at and dc.expires_at <= timezone.now():
        return None, "کد تخفیف منقضی شده است."
    # Single-user codes (spin / referral / milestone rewards) belong to one account.
    if dc.assigned_user_id:
        uid = getattr(user, "id", None) if user is not None else None
        if uid is None or dc.assigned_user_id != uid:
            return None, "این کد متعلق به حساب دیگری است."
    # Usage cap (single_use => 1, otherwise max_uses; null = unlimited).
    remaining = dc.remaining_uses()
    if remaining is not None and remaining <= 0:
        return None, "این کد قبلاً استفاده شده است."
    return dc, None


def _discount_nominal_amount(dc, gross_amount: int) -> tuple[int, int]:
    discount_percent = dc.percent if dc.percent else 0
    discount_amount = dc.amount if dc.amount else 0
    if discount_amount > 0:
        discount_amount = min(discount_amount, gross_amount)
    elif discount_percent > 0:
        discount_amount = int(gross_amount * discount_percent / 100)
    return discount_percent, discount_amount


def _discount_guardrail_warning(dc, line_items, gross_amount: int, discount_amount: int):
    discount_amount = max(0, int(discount_amount or 0))
    if dc.source == "milestone" or discount_amount <= 0:
        return None
    try:
        from .rewards import cap_discount_for_profit
        capped, total_cost, allowed = cap_discount_for_profit(line_items, gross_amount, discount_amount)
        if capped < discount_amount:
            return {
                "discount_amount": discount_amount,
                "safe_discount_amount": capped,
                "gross_amount": int(gross_amount or 0),
                "total_cost": total_cost,
                "allowed_discount": allowed,
            }
    except Exception:
        logger.exception("profit guardrail warning failed; discount still applied")
    return None


def _discount_preview_from_cart_payload(payload, dc, user=None):
    items_payload = payload.get("items") or []
    if not isinstance(items_payload, list) or not items_payload:
        return None

    gross_amount = 0
    line_items = []
    for item in items_payload:
        if not isinstance(item, dict):
            return None
        product_id = item.get("product_id")
        slug = (item.get("slug") or "").strip()
        product = None
        try:
            if product_id is not None:
                product = Product.objects.get(id=product_id, active=True)
        except (Product.DoesNotExist, ValueError, TypeError):
            product = None
        if product is None and slug:
            try:
                product = Product.objects.get(slug=slug, active=True)
            except Product.DoesNotExist:
                return None
        if product is None:
            return None

        variant = None
        price = product.min_price or product.price
        variant_id = item.get("variant_id")
        if variant_id:
            try:
                variant = ProductVariant.objects.get(id=variant_id, product=product)
                price = variant.price
            except (ProductVariant.DoesNotExist, ValueError, TypeError):
                return None
        try:
            qty = int(item.get("quantity") or 1)
        except (TypeError, ValueError):
            return None
        if qty < 1:
            return None
        gross_amount += int(price or 0) * qty
        line_items.append((product, variant, qty))

    try:
        rush_fee = int(payload.get("rush_fee") or 0)
    except (TypeError, ValueError):
        rush_fee = 0
    if payload.get("rush_order") and rush_fee > 0:
        gross_amount += rush_fee

    if dc:
        discount_percent, nominal_discount = _discount_nominal_amount(dc, gross_amount)
        warning = _discount_guardrail_warning(dc, line_items, gross_amount, nominal_discount)
    else:
        discount_percent, nominal_discount = 0, 0
        warning = None

    amount_after_code = max(gross_amount - nominal_discount, 0)

    # Calculate diamond discount based on dynamic profit guardrail
    diamonds_use = 0
    try:
        diamonds_use = int(payload.get("diamonds_use") or 0)
    except (TypeError, ValueError):
        pass
    diamonds_use = max(diamonds_use, 0)

    diamonds_applied = 0
    diamond_discount = 0
    diamonds_max = 0
    refund_credit_balance = 0
    refund_credit_max = 0
    refund_credit_applied = 0
    if user is not None and user.is_authenticated:
        try:
            is_reseller = user.profile.tier == "reseller"
        except Exception:
            is_reseller = False
        if not is_reseller:
            from .rewards import diamonds_to_toman, toman_to_diamonds_ceil, MIN_DIAMONDS_TO_REDEEM
            profile, _ = UserProfile.objects.get_or_create(user=user)
            try:
                from .rewards import line_items_cost
                total_cost = line_items_cost(line_items)
                allowed_diamond_discount = max(0, amount_after_code - total_cost)
            except Exception:
                logger.exception("profit guardrail for maximum diamonds failed in preview")
                allowed_diamond_discount = amount_after_code
            diamonds_max = min(
                int(profile.points_balance or 0),
                toman_to_diamonds_ceil(allowed_diamond_discount),
            )
            if diamonds_use >= MIN_DIAMONDS_TO_REDEEM:
                usable_diamonds = min(diamonds_use, diamonds_max)
                diamond_discount = min(diamonds_to_toman(usable_diamonds), amount_after_code)

                # Profit guardrail for diamonds: never sell below cost, but the
                # customer's own balance isn't subject to the promo profit floor
                # (see rewards.py "Wallet credit ... NOT capped here").
                try:
                    from .rewards import line_items_cost
                    total_cost = line_items_cost(line_items)

                    diamond_discount = min(diamond_discount, allowed_diamond_discount)
                except Exception:
                    logger.exception("profit guardrail for diamonds failed in preview")

                full_value = diamonds_to_toman(usable_diamonds)
                diamonds_applied = (
                    usable_diamonds if diamond_discount >= full_value
                    else toman_to_diamonds_ceil(diamond_discount)
                )

            refund_credit_balance = int(profile.refund_credit or 0)

    refund_credit_max = min(
        refund_credit_balance,
        max(0, amount_after_code - diamond_discount),
    )
    try:
        refund_credit_requested = max(0, int(payload.get("refund_credit_use") or 0))
    except (TypeError, ValueError):
        refund_credit_requested = 0
    refund_credit_applied = min(refund_credit_requested, refund_credit_max)

    return {
        "gross_amount": gross_amount,
        "percent": discount_percent,
        "nominal_amount": nominal_discount,
        "discount_amount": nominal_discount,
        "guardrail_warning": bool(warning),
        "guardrail": warning,
        "diamond_discount": diamond_discount,
        "diamonds_applied": diamonds_applied,
        "diamonds_max": diamonds_max,
        "refund_credit_balance": refund_credit_balance,
        "refund_credit_max": refund_credit_max,
        "refund_credit_applied": refund_credit_applied,
        "final_amount": max(0, amount_after_code - diamond_discount - refund_credit_applied),
    }

def _determine_account_type(category, slug, raw_type=""):
    t = (raw_type or "").strip().lower()
    cat = (category or "").strip().upper()
    slug_lc = (slug or "").strip().lower()
    
    if t in {"xbox", "xboxx"}:
        return "xbox"
    if t in {"psn", "playstation", "ps"}:
        return "psn"
    if t in {"epic", "epicgames"}:
        return "epic"
    if t in {"battlenet", "blizzard"}:
        return "battlenet"
    if t in {"riot", "valorant"}:
        return "riot"
    if t in {"activision", "cod"}:
        return "activision"
        
    if cat == "FORTNITE" or "fortnite" in slug_lc or "vbucks" in slug_lc:
        return "epic"
    elif "pubg" in slug_lc or "یوسی" in slug_lc:
        return "pubg_uid"
    elif "free-fire" in slug_lc or "فری فایر" in slug_lc:
        return "freefire_uid"
    elif "cod" in slug_lc or "کالاف" in slug_lc:
        return "activision"
    elif "valorant" in slug_lc or "league" in slug_lc or "ولورانت" in slug_lc:
        return "riot"
    elif "roblox" in slug_lc or "روبلاکس" in slug_lc:
        return "roblox"
    elif "mobile-legends" in slug_lc or "موبایل لجندز" in slug_lc:
        return "mlbb_uid"
    elif "overwatch" in slug_lc or "battlenet" in slug_lc:
        return "battlenet"
    elif cat == "GIFTCARDS" or "gift" in slug_lc:
        return "giftcard"
    elif cat == "SUBSCRIPTIONS" or "chatgpt" in slug_lc or "gemini" in slug_lc or "spotify" in slug_lc:
        return "direct"
    
    return t or "direct"

# Canonical identifiers for Fortnite Crew pack (used across capacity / limits)
CREW_SLUG = "fortnite-crew-pack"
# Minimum fake stock at which Epic method should be blocked (configurable)
CREW_DISPLAY_FLOOR_DEFAULT = 5

# Toggle to pause new order creation temporarily
ORDERING_PAUSED = False
ORDERING_PAUSED_MESSAGE = "ثبت سفارش موقتاً به دلیل حجم بالای سفارشات و پشتیبانی متوقف شده است. لطفاً دقایقی دیگر دوباره تلاش کنید."

# Canonical static product images (served by Next.js /frontend/public/products)
STATIC_IMAGE_MAP = {
    # Fortnite
    "fortnite-freediver": "/products/freediver.webp",
    "fortnite-crew-pack": "/products/crewpack.webp",
    "fortnite-starter-pack": "/products/starterpack.webp",
    "fortnite-battle-pass": "/products/battlepass.webp",
    "fortnite-music-pass": "/products/musicpass.webp",
    "gift-battle-pass": "/products/battlepass.webp",
    "fortnite-save-the-world": "/products/savetheworld.webp",
    "fortnite-glided-elite-pack": "/products/pack_glided_elites.webp",
    "v-bucks": "/products/product_vbucks.webp",
    "lego-starter-pack": "/products/lego_starter_pack.webp",
    "pack-agency-renegades": "/products/pack_agency_renegades.webp",
    "agency-renegades": "/products/pack_agency_renegades.webp",
    "pack-frozen-legends": "/products/pack_frozen_legends.webp",
    "frozen-legends": "/products/pack_frozen_legends.webp",
    "pack-polar-legends": "/products/pack_polar_legends.webp",
    "polar-legends": "/products/pack_polar_legends.webp",
    # Subscriptions / AI
    "spotify-subscription": "/products/spotify.webp",
    "chatgpt-subscription": "/products/chatgpt.webp",
    "gemini-subscription": "/products/gemini.webp",
    # Games
    "league-of-legends-rp": "/products/lol_rp.webp",
    # Gift cards (Persian slugs from DB)
    "گیفت-کارت-پلیاستیشن": "/products/gift_ps.webp",
    "گیفت-کارت-ایکسباکس": "/products/gift_xbox.webp",
    "گیفت-کارت-استیم": "/products/gift_steam.webp",
    "گیفت-کارت-گوگل-پلی": "/products/gift_google.webp",
    "گیفت-کارت-اپلآیتونز": "/products/gift_itunes.webp",
    "change-region-turkey": "/products/change-region-turkey.webp",
}

logger = logging.getLogger(__name__)


# In‑memory tracking for "current viewers" per product.
# Key: (product_slug, session_key) -> last_seen (timezone-aware datetime)
_PRODUCT_VIEWERS = {}
_VIEWER_TTL_SECONDS = 60

# Toggle to bypass OTP rate limits (useful in hotfix/dev mode)
OTP_RATE_LIMIT_DISABLED = False

# شماره‌هایی که محدودیت ارسال OTP روی آن‌ها اعمال نمی‌شود (در مواقع ضروری/پشتیبانی)
OTP_WHITELIST_NUMBERS = {
    "09339732325",
}

# ادمین‌های whitelisted بر اساس شماره
ADMIN_PHONE_WHITELIST = {
    "09339732325",
    "09123101634",
}

ADMIN_PANEL_CACHE_BUSTER = "20260607c"
ADMIN_PANEL_CACHE_BUST_PATH = f"/panel/admin?cb={ADMIN_PANEL_CACHE_BUSTER}"

# محدودیت ایجاد حساب از یک IP یا دستگاه (غیرفعال)
MAX_PANELS_PER_IDENTITY = None

RECAPTCHA_SECRET = getattr(settings, "RECAPTCHA_SECRET", "")
RECAPTCHA_SITEKEY = getattr(settings, "RECAPTCHA_SITEKEY", "6LdlQyEtAAAAAPmc8sJ-C_FxwUc2tgTJMvju1aTN")
HCAPTCHA_SECRET = getattr(settings, "HCAPTCHA_SECRET", "0x0000000000000000000000000000000000000000")
HCAPTCHA_SITEKEY = getattr(settings, "HCAPTCHA_SITEKEY", "10000000-ffff-ffff-ffff-ffffffffffff")

# Proxy dict for outbound calls to filtered hosts (reCAPTCHA, ipinfo, ...). None disables it.
_FILTER_BYPASS_PROXY = getattr(settings, "FILTER_BYPASS_PROXY", "") or ""
FILTER_BYPASS_PROXIES = (
    {"http": _FILTER_BYPASS_PROXY, "https": _FILTER_BYPASS_PROXY}
    if _FILTER_BYPASS_PROXY else None
)
CAPTCHA_RISK_ATTEMPTS = getattr(settings, "CAPTCHA_RISK_ATTEMPTS", 3)
CAPTCHA_RISK_WINDOW = getattr(settings, "CAPTCHA_RISK_WINDOW", 900)


def _update_product_viewers(product_slug, session_key):
    """
    Update heartbeat for a viewer and return current active viewer count
    for the given product_slug within the TTL window.
    Scaled down to look more realistic (5-12 range).
    """
    now = timezone.now()
    cutoff = now - timedelta(seconds=_VIEWER_TTL_SECONDS)

    # Record / update this viewer
    key = (product_slug, session_key)
    _PRODUCT_VIEWERS[key] = now

    # Prune stale entries
    stale_keys = [k for k, ts in _PRODUCT_VIEWERS.items() if ts < cutoff]
    for k in stale_keys:
        _PRODUCT_VIEWERS.pop(k, None)

    # Count active viewers for this product
    count = 0
    for (slug, _), ts in _PRODUCT_VIEWERS.items():
        if slug == product_slug and ts >= cutoff:
            count += 1

    # Scale down high numbers to a more realistic 5-12 range
    import hashlib
    import random
    seed = int(hashlib.md5(product_slug.encode()).hexdigest(), 16) % 1000
    rng = random.Random(seed)

    base = rng.randint(5, 10)
    # Add a bit of real activity weight but keep it capped
    final_count = base + min(2, count // 10)

    return final_count


def _resolve_product_image(p: Product):
    """
    Return a stable image URL for a product. This guarantees that well‑known
    items like Save the World و Glided Elite همیشه از فایل‌های موجود در
    frontend/public/products استفاده کنند، حتی اگر فیلد image_url در دیتابیس خالی باشد.
    """
    slug = (p.slug or "").strip().lower()
    name = (p.name_fa or "").strip().lower()

    # If DB already has a URL, keep it. Admin-uploaded covers must override
    # the built-in static fallback images.
    if p.image_url:
        return p.image_url

    # Canonical mapping by slug
    if slug in STATIC_IMAGE_MAP:
        return STATIC_IMAGE_MAP[slug]

    # Heuristics for products without slug/image_url
    if "crew" in slug or "crew" in name or "کرو" in name:
        return STATIC_IMAGE_MAP.get("fortnite-crew-pack", "")
    if "glided" in slug or "glided" in name or "gilded" in name:
        return STATIC_IMAGE_MAP.get("fortnite-glided-elite-pack", "")
    if "save-the-world" in slug or "savetheworld" in slug or "سیو" in name:
        return STATIC_IMAGE_MAP.get("fortnite-save-the-world", "")
    if "lego" in slug or "لگو" in name:
        return STATIC_IMAGE_MAP.get("lego-starter-pack", "")
    if "v-bucks" in slug or "ویباکس" in name or "vbuck" in slug:
        return STATIC_IMAGE_MAP.get("v-bucks", "")
    if "spotify" in slug or "اسپاتیفای" in name:
        return STATIC_IMAGE_MAP.get("spotify-subscription", "")
    if "chatgpt" in slug or "چت" in name:
        return STATIC_IMAGE_MAP.get("chatgpt-subscription", "")
    if "gemini" in slug or "جیمینی" in name:
        return STATIC_IMAGE_MAP.get("gemini-subscription", "")
    if "playstation" in slug or "پلی" in name:
        return STATIC_IMAGE_MAP.get("گیفت-کارت-پلیاستیشن", "")
    if "xbox" in slug or "ایکس" in name:
        return STATIC_IMAGE_MAP.get("گیفت-کارت-ایکسباکس", "")
    if "steam" in slug or "استیم" in name:
        return STATIC_IMAGE_MAP.get("گیفت-کارت-استیم", "")
    if "google" in slug or "گوگل" in name:
        return STATIC_IMAGE_MAP.get("گیفت-کارت-گوگل-پلی", "")
    if "itunes" in slug or "اپل" in name or "آیتونز" in name:
        return STATIC_IMAGE_MAP.get("گیفت-کارت-اپلآیتونز", "")

    return ""


_RECAPTCHA_VERIFY_ENDPOINTS = (
    "https://www.recaptcha.net/recaptcha/api/siteverify",  # Iran-reachable Google host
    "https://www.google.com/recaptcha/api/siteverify",     # fallback host
)


def _verify_recaptcha(token: str) -> bool:
    """
    Validate a Google reCAPTCHA v2 token or hCaptcha token based on captcha_provider setting.
    Validated via siteverify, routed through the filter-bypass proxy.
    """
    if not token:
        return False

    provider = (_get_setting("captcha_provider", default="recaptcha").value_text or "").strip().lower()

    if provider == "hcaptcha":
        secret = HCAPTCHA_SECRET or "0x0000000000000000000000000000000000000000"
        url = "https://hcaptcha.com/siteverify"
        last_exc = None
        for attempt in range(4):
            try:
                resp = requests.post(
                    url,
                    data={"secret": secret, "response": token},
                    timeout=6,
                    proxies=FILTER_BYPASS_PROXIES,
                )
                data = resp.json()
            except Exception as exc:
                last_exc = exc
                continue
            if data.get("success"):
                return True
            error_codes = data.get("error-codes") or []
            if isinstance(error_codes, str):
                error_codes = [error_codes]
            logger.warning("hCaptcha verification failed (%s)", error_codes)
            return False
        logger.error("hCaptcha unreachable after retries (%s); rejecting", last_exc)
        return False
    else:
        # Default: Google reCAPTCHA
        last_exc = None
        for attempt in range(4):
            url = _RECAPTCHA_VERIFY_ENDPOINTS[attempt % len(_RECAPTCHA_VERIFY_ENDPOINTS)]
            try:
                resp = requests.post(
                    url,
                    data={"secret": RECAPTCHA_SECRET, "response": token},
                    timeout=6,
                    proxies=FILTER_BYPASS_PROXIES,
                )
                data = resp.json()
            except Exception as exc:
                last_exc = exc
                continue
            if data.get("success"):
                return True
            error_codes = data.get("error-codes") or []
            if isinstance(error_codes, str):
                error_codes = [error_codes]
            logger.warning("reCAPTCHA verification failed (%s)", error_codes)
            return False
        logger.error("reCAPTCHA unreachable after retries (%s); rejecting", last_exc)
        return False


def _captcha_attempt_count(scope: str) -> int:
    """
    Increment and return the rolling count of tokenless auth attempts for a scope
    (an IP or a phone). Backed by the cache with a CAPTCHA_RISK_WINDOW TTL.
    """
    key = f"captcha_risk:{scope}"
    try:
        count = (cache.get(key) or 0) + 1
        cache.set(key, count, CAPTCHA_RISK_WINDOW)
        return count
    except Exception:
        return 0


def _captcha_required(phone_number: str, ip_address: str) -> bool:
    """
    Decide whether this attempt is suspicious enough to demand a captcha.
    Normal traffic is let through; once a phone or IP exceeds CAPTCHA_RISK_ATTEMPTS
    tokenless attempts inside the window, the captcha kicks in. A SiteSetting
    `captcha_mode` ("off" | "always") overrides the heuristic at runtime.
    """
    provider = (_get_setting("captcha_provider", default="recaptcha").value_text or "").strip().lower()
    if provider == "hcaptcha":
        if not HCAPTCHA_SECRET:
            return False
    else:
        if not RECAPTCHA_SECRET:
            return False

    mode = (_get_setting("captcha_mode", default="").value_text or "").strip().lower()
    if mode == "off":
        return False
    if mode == "always":
        return True
    ip_n = _captcha_attempt_count(f"ip:{ip_address}") if ip_address else 0
    ph_n = _captcha_attempt_count(f"ph:{phone_number}") if phone_number else 0
    return max(ip_n, ph_n) > CAPTCHA_RISK_ATTEMPTS


def _enforce_captcha(payload, phone_number, ip_address):
    """
    Risk-based captcha gate for auth endpoints. Returns a JsonResponse to
    short-circuit the request, or None to let it proceed.

    - A supplied reCAPTCHA/hCaptcha token is always validated (verified via the proxy).
    - With no token, the captcha is only demanded for suspicious attempts; the
      response carries `captcha_required: true` so the client can render the
      widget on demand.
    """
    token = (payload.get("captcha_token") or payload.get("hcaptcha_token") or "").strip()
    provider = (_get_setting("captcha_provider", default="recaptcha").value_text or "").strip().lower()
    sitekey = HCAPTCHA_SITEKEY if provider == "hcaptcha" else RECAPTCHA_SITEKEY

    if token:
        if _verify_recaptcha(token):
            return None
        return JsonResponse(
            {
                "message": "تایید کپچا ناموفق بود. لطفاً دوباره تلاش کنید.", 
                "captcha_required": True,
                "captcha_provider": provider,
                "sitekey": sitekey
            },
            status=400,
        )
    if _captcha_required(phone_number, ip_address):
        return JsonResponse(
            {
                "message": "برای ادامه لطفاً کپچا را کامل کنید.", 
                "captcha_required": True,
                "captcha_provider": provider,
                "sitekey": sitekey
            },
            status=400,
        )
    return None


def _normalize_login_identifier(value: str) -> str:
    """
    Normalize phone/email input for login:
    - Convert Persian and Arabic digits to English
    - Remove spaces, hyphens, zero-width characters
    - Normalize +98/0098/98 prefixes to 0
    - If 10-digit starting with 9, prefix 0
    """
    if value is None:
        return ""
    persian_digits = "۰۱۲۳۴۵۶۷۸۹"
    arabic_digits = "٠١٢٣٤٥٦٧٨٩"
    english_digits = "0123456789"
    trans_table = str.maketrans(persian_digits + arabic_digits, english_digits * 2)
    s = value.translate(trans_table)
    s = re.sub(r"[ \-\u200c\u200d]", "", s)
    if s.startswith("+98"):
        s = "0" + s[3:]
    if s.startswith("0098"):
        s = "0" + s[4:]
    if s.startswith("98") and len(s) == 12:
        s = "0" + s[2:]
    if re.fullmatch(r"9\d{9}", s):
        s = "0" + s
    return s.strip()


def _normalize_otp_code(code: str) -> str:
    """Normalize OTP input (convert Persian/Arabic digits, drop spaces)."""
    if code is None:
        return ""
    persian_digits = "۰۱۲۳۴۵۶۷۸۹"
    arabic_digits = "٠١٢٣٤٥٦٧٨٩"
    english_digits = "0123456789"
    trans_table = str.maketrans(persian_digits + arabic_digits, english_digits * 2)
    s = code.translate(trans_table)
    s = re.sub(r"\s+", "", s)
    return s.strip()

def _product_to_dict(p: Product, include_content=True):
    # Provide a stable slug even if DB field is blank by deriving from name
    name_lc = (p.name_fa or "").lower()
    if not p.slug and ("lego" in name_lc or "لگو" in name_lc):
        slug = "lego-starter-pack"
    else:
        slug = p.slug or slugify(p.name_fa or "")

    raw_variants = list(p.variants.all())
    variants_payload = []
    for v in raw_variants:
        v_price = v.price
        v_orig = getattr(v, "original_price", 0)
        
        # Check if this is the dynamic ChatGPT top-up variant
        if p.slug == 'chatgpt-subscription' and "شارژ" in v.title:
            try:
                rates = cache.get("currency_rates:last_good")
                usd_rate_rials = float(rates.get("usd", 650000)) if rates else 650000.0
            except Exception:
                usd_rate_rials = 650000.0
            
            usd_rate_tomans = usd_rate_rials / 10.0
            # Calculate final price: (Dollar * 20) + 20%
            v_price = int((usd_rate_tomans * 20) * 1.20)
            # Round to the nearest 1,000 Tomans
            v_price = int(round(v_price / 1000.0) * 1000)
            
            # Show a corresponding original price for discount display
            v_orig = int(round((v_price * 1.25) / 1000.0) * 1000)
            
        variants_payload.append({
            "id": v.id,
            "title": v.title,
            "group_fa": v.group_fa,
            "price": v_price,
            "original_price": v_orig
        })
        
    min_price = min((item["price"] for item in variants_payload), default=p.price)
    base_price = min_price if raw_variants else p.price
    main_img = _resolve_product_image(p)
    page_cust = getattr(p, "page_customization", {}) or {}
    cust_images = []
    if isinstance(page_cust, dict):
        cust_images = page_cust.get("images") or page_cust.get("gallery") or []

    images_list = []
    if main_img:
        images_list.append(main_img)
    if isinstance(cust_images, list):
        for img in cust_images:
            if img and isinstance(img, str) and img not in images_list:
                images_list.append(img)

    payload = {
        "id": p.id,
        "name_fa": p.name_fa,
        "slug": slug,
        "subtitle": p.subtitle,
        "category": p.category,
        "category_title": dict(Product.CATEGORY_CHOICES).get(p.category, p.category),
        "sub": p.subcategory or _giftcard_sub(p) if p.category == "GIFTCARDS" else "",
        "image_url": main_img,
        "images": images_list,
        "price": base_price,
        "original_price": getattr(p, "original_price", 0),
        "price_lira": p.price_lira,
        "min_price": min_price,
        "display_order": getattr(p, "display_order", 0) or 0,
        "requires_2fa": bool(getattr(p, "requires_2fa", False)),
        "disable_2fa_text": getattr(p, "disable_2fa_text", "") or "",
        "disable_2fa_color": getattr(p, "disable_2fa_color", "amber") or "amber",
        "jinx_image": getattr(p, "jinx_image", "") or "",
        "jinx_text": getattr(p, "jinx_text", "") or "",
        "page_customization": page_cust,
        "link": SPECIAL_PRODUCT_LINKS.get(p.slug),
        "variants": variants_payload,
        "sold_count": getattr(p, "sold_count", 0) or 0,
        # Product has no updated_at column (adding one needs a production DB
        # migration) — created_at is the honest lower bound for sitemap lastmod.
        "created_at": p.created_at.isoformat() if getattr(p, "created_at", None) else None,
        # True when customers can actually order right now — used by the
        # frontend for schema.org offer availability.
        "purchasable": not (
            bool(getattr(p, "ordering_disabled", False))
            or bool(getattr(p, "customer_ordering_disabled", False))
            or not bool(getattr(p, "active", True))
        ),
    }
    if include_content:
        payload.update({
            "description": p.description,
            "delivery_text": getattr(p, "delivery_text", "") or "",
            "faq": getattr(p, "faq", []) or [],
            "custom_fields": getattr(p, "custom_fields", []) or [],
        })
    return payload


def _product_card_dict(p: Product):
    """Compact, stable storefront payload for grids, menus, and live search."""
    full = _product_to_dict(p, include_content=False)
    original_price = int(full.get("original_price") or 0)
    current_price = int(full.get("price") or 0)
    discount_percent = (
        round((original_price - current_price) * 100 / original_price)
        if original_price > current_price > 0
        else 0
    )
    return {
        "id": full["id"],
        "slug": full["slug"],
        "name_fa": full["name_fa"],
        "subtitle": full["subtitle"],
        "category": full["category"],
        "category_title": full["category_title"],
        "sub": full["sub"],
        "image_url": full["image_url"],
        "images": full.get("images", []),
        "price": current_price,
        "min_price": int(full.get("min_price") or current_price),
        "original_price": original_price,
        "discount_percent": max(0, discount_percent),
        "purchasable": bool(full["purchasable"]),
        "display_order": int(full.get("display_order") or 0),
        "has_variants": bool(full.get("variants")),
        "has_required_custom_fields": any(
            isinstance(field, dict) and bool(field.get("required")) and bool(str(field.get("key") or "").strip())
            for field in (getattr(p, "custom_fields", []) or [])
        ),
        "link": full.get("link"),
    }


def _set_public_cache_headers(response, *, cacheable=True):
    if cacheable:
        response["Cache-Control"] = "public, max-age=60, stale-while-revalidate=300"
    else:
        response["Cache-Control"] = "no-store"
    return response


def _giftcard_sub(p: Product) -> str:
    """Map a gift-card product to its sub-category key used by the storefront
    sub-menu (ps / steam / xbox / itunes / googleplay). Derived from the
    product slug + name so no manual data entry / migration is needed."""
    hay = f"{p.slug or ''} {p.name_fa or ''} {p.subtitle or ''}".lower()
    # normalise Arabic vs Persian characters
    hay = hay.replace("ي", "ی").replace("ك", "ک")
    checks = [
        ("steam", ("steam", "استیم")),
        ("xbox", ("xbox", "ایکس")),
        ("googleplay", ("google", "گوگل")),
        ("itunes", ("itunes", "آیتونز", "ایتونز", "اپل", "apple")),
        ("ps", ("psn", "playstation", "پلی")),
    ]
    for key, needles in checks:
        if any(n in hay for n in needles):
            return key
    return ""


# Order statuses that count as a real sale for best-seller ranking
SOLD_ORDER_STATUSES = ["paid", "registered", "processing", "completed"]


def products_list(request):
    if request.method != 'GET':
        return HttpResponseNotAllowed(['GET'])
    view = (request.GET.get('view') or '').strip().lower()
    if view not in ('', 'card'):
        return JsonResponse({"error": "view نامعتبر است"}, status=400)

    limit = None
    raw_limit = (request.GET.get('limit') or '').strip()
    if raw_limit:
        try:
            limit = int(raw_limit)
        except (TypeError, ValueError):
            return JsonResponse({"error": "limit باید عدد صحیح باشد"}, status=400)
        if limit < 1 or limit > 100:
            return JsonResponse({"error": "limit باید بین ۱ و ۱۰۰ باشد"}, status=400)

    qs = Product.objects.filter(active=True).exclude(slug__in=['gift-battle-pass']).exclude(
        Q(name_fa__startswith='اکانت') |
        Q(name_fa__startswith='آگهی اکانت') |
        (Q(category='FORTNITE') & Q(name_fa__icontains='اکانت'))
    ).prefetch_related("variants")

    term = (request.GET.get('search') or request.GET.get('q') or '').strip()
    if term:
        qs = qs.filter(
            Q(name_fa__icontains=term)
            | Q(subtitle__icontains=term)
            | Q(slug__icontains=term)
            | Q(category__icontains=term)
            | Q(variants__title__icontains=term)
        ).distinct()

    cache_key = None
    if not term:
        cache_key = f"public-products:v2:{view or 'default'}:{limit or 'all'}"
        cached_payload = cache.get(cache_key)
        if cached_payload is not None:
            return _set_public_cache_headers(JsonResponse(cached_payload))

    # ترتیب: اولویت با فورتنایت، سپس بر اساس دسته‌بندی، سپس ID
    from django.db.models import Case, When, Value, IntegerField

    fortnite_priority_slugs = [
        "fortnite-crew-pack",
        "fortnite-starter-pack",
        "v-bucks",
        "fortnite-battle-pass",
        "lego-starter-pack",
        "agency-renegades",
        "fortnite-glided-elite-pack",
        "fortnite-save-the-world",
    ]

    lego_fallback = Q(slug__iexact='lego-starter-pack') | Q(name_fa__icontains='لگو استارتر') | Q(name_fa__icontains='lego')

    from django.db.models import OuterRef, Subquery

    sold_count_subquery = (
        OrderItem.objects.filter(
            product=OuterRef("pk"),
            order__is_test_order=False,
            order__status__in=SOLD_ORDER_STATUSES,
        )
        .values("product")
        .annotate(total=Sum("quantity"))
        .values("total")
    )

    qs = qs.annotate(
        sold_count=Subquery(sold_count_subquery, output_field=IntegerField()),
        category_order=Case(
            When(category='FORTNITE', then=Value(1)),
            When(category='ROCKET_LEAGUE', then=Value(2)),
            When(category='AI', then=Value(3)),
            When(category='GIFTCARDS', then=Value(4)),
            When(category='GAMES', then=Value(5)),
            When(category='SUBSCRIPTIONS', then=Value(6)),
            default=Value(7),
            output_field=IntegerField()
        ),
        slug_order=Case(
            *[
                When(slug=slug, then=Value(idx + 1))
                for idx, slug in enumerate(fortnite_priority_slugs)
            ],
            When(lego_fallback, then=Value(fortnite_priority_slugs.index("lego-starter-pack") + 1)),
            default=Value(9999),
            output_field=IntegerField()
        )
    ).order_by('display_order', 'category_order', 'slug_order', '-id')

    if limit is not None:
        qs = qs[:limit]

    serializer = _product_card_dict if view == 'card' else (
        lambda product: _product_to_dict(product, include_content=False)
    )
    data = [serializer(p) for p in qs]
    payload = {"results": data}
    if cache_key:
        cache.set(cache_key, payload, timeout=60)
    response = JsonResponse(payload)
    return _set_public_cache_headers(response, cacheable=not bool(term))


_SUPPLIER_FIELD_LABELS = {
    "roblox_username": "نام کاربری Roblox",
    "player_tag": "شناسه / تگ بازیکن",
    "game_email": "ایمیل اکانت بازی",
    "game_password": "رمز عبور اکانت بازی",
    "character_name": "نام کاراکتر در بازی",
    "backup_code": "کد بکاپ / 2FA",
}


def _public_required_field_schema(field):
    """Return field metadata that is safe to send back to a browser.

    Cart validation deliberately reports a schema and missing *keys* only.  It
    never reflects submitted customer values (in particular passwords).
    """
    if isinstance(field, dict):
        key = str(field.get("key") or "").strip()
        if not key:
            return None
        result = {
            "key": key,
            "label": str(field.get("label") or _SUPPLIER_FIELD_LABELS.get(key) or key.replace("_", " ")),
            "type": str(field.get("type") or ("password" if "password" in key or key.endswith("_pass") else "email" if "email" in key else "text")),
            "required": bool(field.get("required", True)),
        }
        # These are display-only constraints/options managed by the product
        # schema.  Do not copy arbitrary fields from the stored JSON.
        for name in ("placeholder", "options"):
            if name in field and isinstance(field[name], (str, list)):
                result[name] = field[name]
        return result
    key = str(field or "").strip()
    if not key:
        return None
    return {
        "key": key,
        "label": _SUPPLIER_FIELD_LABELS.get(key, key.replace("_", " ")),
        "type": "password" if "password" in key or key.endswith("_pass") else "email" if "email" in key else "text",
        "required": True,
    }


def _cart_item_custom_fields(item):
    values = item.get("custom_fields") or item.get("custom_fields_data") or {}
    return values if isinstance(values, dict) else {}


def _required_product_fields_for_items(items):
    """Resolve and validate required product fields for browser/order items.

    The returned entries are intentionally independent of price and stock
    validation, so both `/cart/validate` and `/orders` use exactly the same
    requirement logic.
    """
    normal_ids = set()
    normal_slugs = set()
    supplier_ids = set()
    for item in items:
        supplier_id = item.get("g4a4_variation_id") or item.get("g4a4_var_id")
        if supplier_id not in (None, ""):
            try:
                supplier_ids.add(int(supplier_id))
            except (TypeError, ValueError):
                continue
            continue
        try:
            if item.get("product_id") not in (None, ""):
                normal_ids.add(int(item.get("product_id")))
        except (TypeError, ValueError):
            pass
        slug = str(item.get("slug") or "").strip()
        if slug:
            normal_slugs.add(slug)

    products_by_id = {p.id: p for p in Product.objects.filter(id__in=normal_ids)}
    products_by_slug = {p.slug: p for p in Product.objects.filter(slug__in=normal_slugs)}
    variations = {
        v.external_variation_id: v
        for v in G4A4Variation.objects.filter(external_variation_id__in=supplier_ids).select_related("product")
    }

    results = []
    for index, item in enumerate(items):
        supplier_id = item.get("g4a4_variation_id") or item.get("g4a4_var_id")
        product = None
        supplier_variation = None
        if supplier_id not in (None, ""):
            try:
                supplier_variation = variations.get(int(supplier_id))
            except (TypeError, ValueError):
                supplier_variation = None
            raw_fields = supplier_variation.required_fields if supplier_variation and isinstance(supplier_variation.required_fields, list) else []
            name = f"{supplier_variation.product.name} - {supplier_variation.name}" if supplier_variation else str(item.get("name") or "")
        else:
            try:
                product = products_by_id.get(int(item.get("product_id")))
            except (TypeError, ValueError):
                product = None
            if product is None:
                product = products_by_slug.get(str(item.get("slug") or "").strip())
            raw_fields = product.custom_fields if product and isinstance(product.custom_fields, list) else []
            name = product.name_fa if product else str(item.get("name") or "")

        fields = [schema for schema in (_public_required_field_schema(field) for field in raw_fields) if schema]
        values = _cart_item_custom_fields(item)
        missing = [field["key"] for field in fields if field["required"] and not str(values.get(field["key"], "")).strip()]
        results.append({
            "index": index,
            "product_id": item.get("product_id"),
            "variant_id": item.get("variant_id"),
            "g4a4_variation_id": supplier_id if supplier_id not in (None, "") else None,
            "name": name,
            "required_fields": fields,
            "missing_field_keys": missing,
            "complete": not missing,
        })
    return results


def _required_product_fields_error(items):
    entries = _required_product_fields_for_items(items)
    incomplete = [entry for entry in entries if not entry["complete"]]
    if not incomplete:
        return None
    return {
        "code": "required_product_fields",
        "message": "اطلاعات مورد نیاز محصول کامل نیست. لطفاً سبد خرید را تکمیل کنید.",
        "items": incomplete,
    }


@csrf_exempt
def cart_validate(request):
    """Reconcile a browser cart against authoritative product/variant prices."""
    if request.method != 'POST':
        return HttpResponseNotAllowed(['POST'])
    try:
        payload = json.loads(request.body or b'{}')
    except (TypeError, ValueError, json.JSONDecodeError):
        return JsonResponse({"error": "بدنه درخواست JSON معتبر نیست"}, status=400)

    items = payload.get("items") if isinstance(payload, dict) else None
    if not isinstance(items, list) or not items or len(items) > 50:
        return JsonResponse({"error": "سبد باید شامل ۱ تا ۵۰ آیتم باشد"}, status=400)

    field_validation = _required_product_fields_for_items(items)
    field_validation_by_index = {entry["index"]: entry for entry in field_validation}
    normalized = []
    g4a4_items = []
    for index, item in enumerate(items):
        if not isinstance(item, dict):
            return JsonResponse({"error": f"آیتم {index + 1} نامعتبر است"}, status=400)
        g4a4_variation_id = item.get("g4a4_variation_id") or item.get("g4a4_var_id")
        if g4a4_variation_id:
            try:
                variation_id = int(g4a4_variation_id)
                quantity = int(item.get("quantity"))
            except (TypeError, ValueError):
                return JsonResponse({"error": f"شناسه یا تعداد آیتم {index + 1} نامعتبر است"}, status=400)
            if variation_id < 1 or quantity < 1 or quantity > 99:
                return JsonResponse({"error": f"مقادیر آیتم {index + 1} خارج از محدوده است"}, status=400)
            supplied_price = item.get("price")
            try:
                supplied_price = int(supplied_price) if supplied_price is not None else None
            except (TypeError, ValueError):
                return JsonResponse({"error": f"قیمت آیتم {index + 1} نامعتبر است"}, status=400)
            g4a4_items.append({
                "index": index,
                "product_id": item.get("product_id"),
                "variant_id": item.get("variant_id"),
                "g4a4_variation_id": variation_id,
                "quantity": quantity,
                "supplied_price": supplied_price,
            })
            continue
        try:
            product_id = int(item.get("product_id"))
            quantity = int(item.get("quantity"))
            variant_id = item.get("variant_id")
            variant_id = int(variant_id) if variant_id not in (None, "") else None
        except (TypeError, ValueError):
            return JsonResponse({"error": f"شناسه یا تعداد آیتم {index + 1} نامعتبر است"}, status=400)
        if product_id < 1 or quantity < 1 or quantity > 99 or (variant_id is not None and variant_id < 1):
            return JsonResponse({"error": f"مقادیر آیتم {index + 1} خارج از محدوده است"}, status=400)
        supplied_price = item.get("price")
        try:
            supplied_price = int(supplied_price) if supplied_price is not None else None
        except (TypeError, ValueError):
            return JsonResponse({"error": f"قیمت آیتم {index + 1} نامعتبر است"}, status=400)
        normalized.append((index, product_id, variant_id, quantity, supplied_price))

    product_ids = {item[1] for item in normalized}
    products = {
        product.id: product
        for product in Product.objects.filter(id__in=product_ids).prefetch_related("variants")
    }
    results = []
    total = 0
    for index, product_id, variant_id, quantity, supplied_price in normalized:
        product = products.get(product_id)
        if not product or not product.active:
            results.append({
                "product_id": product_id, "variant_id": variant_id, "quantity": quantity,
                "available": False, "reason": "product_unavailable",
            })
            result = results[-1]
            result.update(field_validation_by_index[index])
            continue

        serialized = _product_to_dict(product, include_content=False)
        variants = {variant["id"]: variant for variant in serialized.get("variants", [])}
        if variants and variant_id is None:
            results.append({
                "product_id": product_id, "variant_id": None, "quantity": quantity,
                "available": False, "reason": "variant_required",
            })
            result = results[-1]
            result.update(field_validation_by_index[index])
            continue
        if variant_id is not None and variant_id not in variants:
            results.append({
                "product_id": product_id, "variant_id": variant_id, "quantity": quantity,
                "available": False, "reason": "variant_unavailable",
            })
            result = results[-1]
            result.update(field_validation_by_index[index])
            continue

        available = bool(serialized["purchasable"])
        unit_price = int(variants[variant_id]["price"] if variant_id is not None else serialized["price"])
        line_total = unit_price * quantity
        if available:
            total += line_total
        result = {
            "product_id": product_id,
            "variant_id": variant_id,
            "quantity": quantity,
            "name": serialized["name_fa"],
            "available": available,
            "reason": None if available else "ordering_disabled",
            "unit_price": unit_price,
            "line_total": line_total,
            "price_changed": supplied_price is not None and supplied_price != unit_price,
        }
        if supplied_price is not None:
            result["previous_price"] = supplied_price
        result.update(field_validation_by_index[index])
        results.append(result)

    g4a4_variations = {
        variation.external_variation_id: variation
        for variation in G4A4Variation.objects.filter(
            external_variation_id__in={item["g4a4_variation_id"] for item in g4a4_items}
        ).select_related("product")
    }
    for item in g4a4_items:
        variation = g4a4_variations.get(item["g4a4_variation_id"])
        available = bool(variation and variation.in_stock and variation.product.is_active)
        unit_price = int(variation.sell_toman) if variation else 0
        if available:
            total += unit_price * item["quantity"]
        result = {
            "product_id": item["product_id"],
            "variant_id": item["variant_id"],
            "g4a4_variation_id": item["g4a4_variation_id"],
            "quantity": item["quantity"],
            "available": available,
            "reason": None if available else "product_unavailable",
            "unit_price": unit_price,
            "line_total": unit_price * item["quantity"],
            "price_changed": item["supplied_price"] is not None and item["supplied_price"] != unit_price,
        }
        if variation:
            result["name"] = f"{variation.product.name} - {variation.name}"
        if item["supplied_price"] is not None:
            result["previous_price"] = item["supplied_price"]
        result.update(field_validation_by_index[item["index"]])
        results.append(result)

    response = JsonResponse({
        "valid": all(item.get("available") and item.get("complete") for item in results),
        "items": results,
        "total": total,
        "changed_count": sum(1 for item in results if item.get("price_changed")),
    })
    response["Cache-Control"] = "no-store"
    return response


@csrf_exempt
def performance_vitals(request):
    """Sample anonymous web-vital measurements with a small per-IP rate limit."""
    if request.method != 'POST':
        return HttpResponseNotAllowed(['POST'])

    remote_addr = request.META.get("REMOTE_ADDR") or "unknown"
    digest = hashlib.sha256(remote_addr.encode("utf-8")).hexdigest()[:20]
    window = int(timezone.now().timestamp() // 60)
    rate_key = f"performance-vitals:{digest}:{window}"
    count = int(cache.get(rate_key, 0) or 0)
    limit = int(getattr(settings, "PERFORMANCE_VITALS_RATE_LIMIT", 30))
    if count >= limit:
        response = JsonResponse({"error": "rate_limited"}, status=429)
        response["Retry-After"] = "60"
        return response
    cache.set(rate_key, count + 1, timeout=70)

    try:
        payload = json.loads(request.body or b'{}')
    except (TypeError, ValueError, json.JSONDecodeError):
        return JsonResponse({"error": "بدنه درخواست JSON معتبر نیست"}, status=400)
    if not isinstance(payload, dict):
        return JsonResponse({"error": "داده نامعتبر است"}, status=400)

    name = str(payload.get("name") or "").upper()
    if name not in {"LCP", "CLS", "INP", "NAVIGATION"}:
        return JsonResponse({"error": "metric نامعتبر است"}, status=400)
    try:
        value = float(payload.get("value"))
    except (TypeError, ValueError):
        return JsonResponse({"error": "value نامعتبر است"}, status=400)
    if value < 0 or value > 3600000:
        return JsonResponse({"error": "value خارج از محدوده است"}, status=400)

    route = str(payload.get("route") or "/")[:160]
    if not route.startswith("/") or "?" in route or "#" in route:
        route = "/"
    logger.info("web_vital %s", json.dumps({
        "name": name,
        "value": round(value, 4),
        "route": route,
        "rating": str(payload.get("rating") or "")[:24],
    }, ensure_ascii=False, separators=(",", ":")))
    response = JsonResponse({"accepted": True}, status=202)
    response["Cache-Control"] = "no-store"
    return response


def product_detail(request, slug):
    if request.method != 'GET':
        return HttpResponseNotAllowed(['GET'])
    if slug == 'gift-battle-pass':
        return JsonResponse({"message": "محصول مورد نظر در دسترس نیست"}, status=404)
    cache_key = f"public-product:v2:{slug}"
    cached_payload = cache.get(cache_key)
    if cached_payload is not None:
        return _set_public_cache_headers(JsonResponse(cached_payload))
    try:
        p = Product.objects.prefetch_related("variants").get(slug=slug, active=True)
        payload = _product_to_dict(p)
    except Product.DoesNotExist:
        try:
            from .models import G4A4Product
            from .views_categories import _g4a4_product_to_dict
            g4_prod = G4A4Product.objects.prefetch_related("variations").get(game_slug=slug, is_active=True)
            payload = _g4a4_product_to_dict(g4_prod)
        except Exception:
            return JsonResponse({"error": "محصول مورد نظر یافت نشد"}, status=404)

    cache.set(cache_key, payload, timeout=60)
    return _set_public_cache_headers(JsonResponse(payload))


@csrf_exempt
def product_viewers(request, slug):
    """
    Lightweight endpoint to report approximate "current viewers"
    for a product detail page. It tracks unique Django sessions
    per product within a short TTL window.
    """
    if request.method not in ('GET', 'POST'):
        return HttpResponseNotAllowed(['GET', 'POST'])

    try:
        Product.objects.get(slug=slug)
    except Product.DoesNotExist:
        return JsonResponse({"viewers": 0})

    # Ensure the user has a session key so we can track unique viewers
    if not request.session.session_key:
        request.session.save()
    session_key = request.session.session_key

    viewers = _update_product_viewers(slug, session_key)
    return JsonResponse({"viewers": viewers})


def _collect_order_items_for_email(order):
    """
    Prepare minimal data for the email templates.
    """
    items = []
    for oi in order.items.select_related("variant").all():
        items.append({
            "name": oi.name or oi.product.name_fa if oi.product else oi.name,
            "quantity": oi.quantity,
            "price": oi.price,
            "platform": getattr(oi.variant, "title", "") if oi.variant else "",
            "account_type": getattr(oi, "account_type", ""),
            "account_email": getattr(oi, "account_email", ""),
            "account_password": getattr(oi, "account_password", ""),
        })
    return items


def _get_customer_contact_info(order):
    # For reseller orders, notify the reseller, not the end customer
    if order.is_reseller_order:
        try:
            profile = order.user.reseller_profile
            email = profile.email or ""
            name = profile.support_name or "همکار جینکس فمیلی"
            return email, name
        except ResellerProfile.DoesNotExist:
            pass
    customer_email = ""
    customer_name = ""
    if order.user:
        customer_email = order.user.email or ""
        customer_name = order.user.get_full_name() or order.user.username or ""
    if not customer_email and "@" in (order.epic_username or ""):
        customer_email = order.epic_username
    if not customer_name:
        customer_name = order.epic_username or "مشتری جینکس فمیلی"
    return customer_email, customer_name


def _get_order_customer_email(order):
    if not order:
        return ""
    epic_contact = (order.epic_username or "").strip()
    if "@" in epic_contact:
        return epic_contact
    if order.user and order.user.email:
        return order.user.email
    return epic_contact


def _order_notify_email(order):
    """Recipient address for order notification emails.

    For reseller orders the notification goes to the reseller's email
    (ResellerProfile.email), falling back to the order user's email if blank.
    For normal orders the existing customer-email resolution is used.
    """
    if not order:
        return ""
    if getattr(order, "is_reseller_order", False):
        try:
            profile = order.user.reseller_profile
            if profile.email:
                return profile.email
        except (ResellerProfile.DoesNotExist, AttributeError):
            pass
        if order.user and order.user.email:
            return order.user.email
    email, _name = _get_customer_contact_info(order)
    return email


def _order_notify_phone(order):
    """Phone for order notification SMS (reseller contact_phone for reseller orders)."""
    if not order:
        return ""
    if getattr(order, "is_reseller_order", False):
        try:
            phone = order.user.reseller_profile.contact_phone or ""
            if phone:
                return phone
        except (ResellerProfile.DoesNotExist, AttributeError):
            pass
    return order.phone or ""


def _notify_customer_payment_success(order, ref_id="", include_sms=True, items_for_email=None):
    _email_unused, customer_name = _get_customer_contact_info(order)
    customer_email = _order_notify_email(order)
    items = items_for_email or _collect_order_items_for_email(order)
    if customer_email and not getattr(order, "is_reseller_order", False):
        send_payment_success_email(
            customer_email,
            customer_name,
            order.tracking_code,
            ref_id,
            order.amount,
        )
        send_customer_order_created_email(
            customer_email,
            customer_name,
            order.tracking_code,
            items,
            order.amount,
        )
    if include_sms:
        phone_for_sms = _order_notify_phone(order)
        if phone_for_sms:
            try:
                KavenegarService.send_status_sms(
                    phone_number=phone_for_sms,
                    customer_name=customer_name,
                    status_fa="",
                    template_name="jinxfamily-shop-new-order",
                    include_status_token=False,
                )
            except Exception:
                logger.warning(f"Payment success SMS failed for {order.tracking_code}", exc_info=True)


def _send_purchase_points_sms(order, points_awarded: int):
    """Best-effort customer-club SMS after a paid order earns diamonds."""
    if not order or not order.user or not points_awarded:
        return False
    if getattr(order, "is_reseller_order", False):
        return False
    phone_for_sms = _order_notify_phone(order)
    if not phone_for_sms:
        return False
    try:
        profile, _ = UserProfile.objects.get_or_create(user=order.user)
        _email_unused, customer_name = _get_customer_contact_info(order)
        customer_name = customer_name or order.user.get_full_name() or order.user.username or "مشتری جینکس فمیلی"
        ok, msg = KavenegarService.send_club_points_sms(
            phone_number=phone_for_sms,
            customer_name=customer_name,
            points=int(points_awarded),
            balance=int(profile.points_balance or 0),
        )
        if not ok:
            logger.warning("Club points SMS failed for %s: %s", order.tracking_code, msg)
        return bool(ok)
    except Exception:
        logger.warning("Club points SMS failed for %s", getattr(order, "tracking_code", ""), exc_info=True)
        return False


def _payload_item_is_gta6(it: dict) -> bool:
    slug = (it.get("slug") or "").strip().lower()
    if slug == "gta6":
        return True
    product_id = it.get("product_id")
    if product_id:
        try:
            product_slug = Product.objects.filter(id=product_id).values_list("slug", flat=True).first()
            return (product_slug or "").strip().lower() == "gta6"
        except Exception:
            return False
    name = (it.get("name") or "").strip().lower()
    return "gta vi" in name or "gta 6" in name or "جی تی ای" in name


def _order_item_is_gta6(item) -> bool:
    try:
        product_slug = (item.product.slug if item.product else "") or ""
    except Exception:
        product_slug = ""
    if product_slug.strip().lower() == "gta6":
        return True
    name = (getattr(item, "name", "") or "").strip().lower()
    return "gta vi" in name or "gta 6" in name or "جی تی ای" in name


def _order_requires_created_xbox_account(order: Order) -> bool:
    if getattr(order, "xbox_account_creation_skipped", False):
        return False
    if not getattr(order, "xbox_create_account", False):
        return False
    xbox_items = list(order.items.filter(account_type="xbox").select_related("product"))
    if not xbox_items:
        return True
    if any(not _order_item_is_gta6(item) for item in xbox_items):
        return True
    return any(not (item.account_email and item.account_password) for item in xbox_items)


@csrf_exempt
def create_order(request):
    from .rewards import MIN_DIAMONDS_TO_REDEEM, diamonds_to_toman, toman_to_diamonds_ceil

    if request.method != 'POST':
        return HttpResponseNotAllowed(['POST'])
    try:
        payload = json.loads(request.body.decode('utf-8'))
    except Exception:
        return JsonResponse({"message": "JSON نامعتبر"}, status=400)

    if ORDERING_PAUSED:
        return JsonResponse({"message": ORDERING_PAUSED_MESSAGE}, status=503)

    user = getattr(request, "user", None)
    is_admin = _is_admin_user(user) if user and user.is_authenticated else False
    if not user or not user.is_authenticated:
        return JsonResponse({"message": "برای ثبت سفارش باید ثبت‌نام کرده و وارد شوید"}, status=401)

    items = payload.get('items') or []
    contact = payload.get('contact') or {}
    try:
        diamonds_use = int(payload.get('diamonds_use') or 0)
    except (TypeError, ValueError):
        return JsonResponse({"message": "مقدار کوین نامعتبر است."}, status=400)
    diamonds_use = max(diamonds_use, 0)
    if 0 < diamonds_use < MIN_DIAMONDS_TO_REDEEM:
        # Below the redeem threshold — silently ignore rather than failing the order.
        diamonds_use = 0
    rush_order = bool(payload.get('rush_order', False))
    rush_fee = 0  # server-enforced when applicable (do not trust client)
    user_note_raw = (contact.get('note', '') or '').strip()

    if not items:
        return JsonResponse({"message": "سبد خرید خالی است"}, status=400)
    if not isinstance(items, list):
        return JsonResponse({"message": "فرمت سبد خرید نامعتبر است."}, status=400)
    if any(not isinstance(it, dict) for it in items):
        return JsonResponse({"message": "آیتم‌های سبد خرید نامعتبر هستند."}, status=400)

    # Required product data is checked before *any* Order row is created (and
    # before cart-related side effects below).  This is the final authority
    # even when an old local cart or a hand-crafted API request bypasses the
    # checkout UI.
    required_fields_error = _required_product_fields_error(items)
    if required_fields_error:
        return JsonResponse(required_fields_error, status=400)

    # Limit: max N crew-pack per user in a 30-day window (both Epic و Xbox)
    CREW_SLUG = "fortnite-crew-pack"
    crew_qty_new = 0
    for it in items:
        try:
            qty = int(it.get('quantity') or 1)
        except (TypeError, ValueError):
            return JsonResponse({"message": "تعداد یکی از آیتم‌ها نامعتبر است."}, status=400)
        if qty < 1:
            return JsonResponse({"message": "تعداد یکی از آیتم‌ها نامعتبر است."}, status=400)
        slug = (it.get('slug') or "").strip().lower()
        product_id = it.get('product_id')
        variant_id = it.get('variant_id')

        # تشخیص این‌که این آیتم مربوط به کروپک است
        is_crew = False
        if slug == CREW_SLUG:
            is_crew = True
        elif product_id:
            try:
                p_slug = Product.objects.filter(id=product_id).values_list('slug', flat=True).first()
                if (p_slug or "").strip().lower() == CREW_SLUG:
                    is_crew = True
            except Exception:
                is_crew = False

        if is_crew:
            crew_qty_new += qty

    if rush_order:
        # Rush is available for ALL products. A general `rush_fee` setting takes
        # precedence; otherwise we fall back to the legacy crew-pack rush fee.
        rush_fee_setting = _get_setting("rush_fee", default="")
        if (rush_fee_setting.value_text or "").strip():
            rush_fee = int(rush_fee_setting.value_text)
        else:
            crew_rush_fee_setting = _get_setting("crew_rush_fee", default="89000")
            rush_fee = int(crew_rush_fee_setting.value_text)

    # Debug logging for rush_fee investigation
    logger.info(
        "Rush order debug: rush_order=%s, is_admin=%s, crew_qty_new=%s, rush_fee=%s, user=%s",
        rush_order, is_admin, crew_qty_new, rush_fee, user.username if user else None
    )

    # Check if crew pack is manually disabled by admin (برای هر دو روش)
    if crew_qty_new > 0 and not is_admin:
        crew_disabled_setting = _get_setting("crew_pack_disabled", default="false")
        if crew_disabled_setting.value_text.lower() == "true":
            user_name = user.username if user else "کاربر"
            return JsonResponse({
                "message": f"{user_name} عزیز، امکان ثبت سفارش این محصول برای حساب کاربری شما وجود ندارد، لطفا بعدا تلاش بفرمایید. برای راهنمایی بیشتر، <a href='https://t.me/JinxFamilyShop/24' target='_blank' style='color: #3b82f6; text-decoration: underline;'>اینجا</a> را کلیک کنید.",
                "message_html": True,
                "crew_disabled": True
            }, status=400)

    # All crew‑pack limits are gated behind crew_daily_limit_enabled.
    # Set this setting to "false" in the DB to disable all limits temporarily.
    _crew_limits_master = _get_setting("crew_daily_limit_enabled", default="true")
    _crew_limits_enabled = _crew_limits_master.value_text.lower() == "true"

    if _crew_limits_enabled and crew_qty_new > 0 and rush_order and not is_admin:
        rush_processing_count = Order.objects.filter(
            rush_order=True,
            status__in=['paid', 'registered', 'processing', 'needs_2fa', 'needs_tr_region', 'needs_xbox_info', 'invalid_info']
        ).count()
        if rush_processing_count >= 10:
            return JsonResponse({
                "message": f"⚠️ سفارش فوری موقتاً غیرفعال است. (سفارش‌های فوری فعال: {rush_processing_count})\n\nلطفاً بدون فوری ثبت کنید یا چند ساعت دیگر دوباره تلاش کنید.",
                "show_as_warning": True,
                "processing_overload": True
            }, status=400)

    if _crew_limits_enabled and crew_qty_new > 0 and user and not is_admin:
        import random
        from datetime import date
        visit_key = f"user_visits_{user.id}"
        visit_setting = _get_setting(visit_key, default="[]")
        try:
            visit_dates = json.loads(visit_setting.value_text)
            if not isinstance(visit_dates, list):
                visit_dates = []
        except:
            visit_dates = []
        today_str = date.today().isoformat()
        if today_str not in visit_dates:
            visit_dates.append(today_str)
            cutoff = (date.today() - timedelta(days=30)).isoformat()
            visit_dates = [d for d in visit_dates if d >= cutoff]
            visit_dates.sort()
            visit_setting.value_text = json.dumps(visit_dates)
            visit_setting.save()
        consecutive_days = 0
        if len(visit_dates) >= 2:
            visit_date_objs = [date.fromisoformat(d) for d in visit_dates]
            visit_date_objs.sort(reverse=True)
            consecutive_days = 1
            for i in range(len(visit_date_objs) - 1):
                diff = (visit_date_objs[i] - visit_date_objs[i + 1]).days
                if diff == 1:
                    consecutive_days += 1
                else:
                    break
        if consecutive_days >= 6 and random.randint(0, 99) >= 55:
            user_name = user.username if user else "کاربر"
            return JsonResponse({
                "message": f"{user_name} عزیز، امکان ثبت سفارش این محصول برای حساب کاربری شما وجود ندارد، لطفا بعدا تلاش بفرمایید. برای راهنمایی بیشتر، <a href='https://t.me/JinxFamilyShop/24' target='_blank' style='color: #3b82f6; text-decoration: underline;'>اینجا</a> را کلیک کنید.",
                "message_html": True,
                "smart_limit": True
            }, status=400)

    if _crew_limits_enabled and crew_qty_new > 0 and not is_admin:
        capacity_window_start = _get_crew_capacity_window_start()
        def _int_setting(key: str, default: int) -> int:
            s = _get_setting(key, default=str(default))
            try:
                value = int(s.value_text)
            except Exception:
                value = int(default)
            if value < 0:
                value = 0
            return value
        regular_limit = _int_setting("crew_regular_limit", 20)
        rush_limit = _int_setting("crew_rush_limit", 5)
        display_limit = _int_setting("crew_display_limit", 50)
        display_floor = _int_setting("crew_display_floor", CREW_DISPLAY_FLOOR_DEFAULT)
        today_regular_count = (
            Order.objects.filter(
                items__product__slug=CREW_SLUG,
                created_at__gte=capacity_window_start,
                rush_order=False,
            )
            .exclude(status__in=['canceled', 'refunded'])
            .distinct()
            .count()
        )
        today_rush_count = (
            Order.objects.filter(
                items__product__slug=CREW_SLUG,
                created_at__gte=capacity_window_start,
                rush_order=True,
            )
            .exclude(status__in=['canceled', 'refunded'])
            .distinct()
            .count()
        )
        total_capacity = max(regular_limit + rush_limit, regular_limit, 1)
        total_used = today_regular_count + today_rush_count
        ratio = display_limit / total_capacity if total_capacity > 0 else 1
        display_stock = int(max(0, display_limit - (total_used * ratio)))
        remaining_regular = max(0, regular_limit - today_regular_count)
        remaining_rush = max(0, rush_limit - today_rush_count)
        remaining_real_capacity = remaining_regular + remaining_rush
        fake_headroom = max(0, display_stock - display_floor)
        epic_available = remaining_real_capacity > 0 and display_stock > display_floor
        if not epic_available:
            return JsonResponse({
                "message": f"⚠️ ظرفیت فعال‌سازی فوری امروز تقریبا تمام شده است. فقط {fake_headroom} جای خالی نمایشی باقی مانده. لطفاً فردا ساعت ۱۵:۳۰ دوباره سر بزنید یا فوری را غیرفعال کنید و سفارش بدون فوری ثبت کنید.",
                "crew_limit_reached": True,
                "epic_display_exhausted": True,
            }, status=400)
        is_rush = bool(rush_order)
        if is_rush:
            if today_rush_count >= rush_limit:
                remaining_shown = max(0, display_stock)
                return JsonResponse({
                    "message": f"ظرفیت فعال‌سازی فوری کروپک امروز تکمیل شده است. لطفاً فوری را غیرفعال کنید و سفارش بدون فوری ثبت کنید. (ظرفیت روزانه: {remaining_shown} از {display_limit})",
                    "crew_limit_reached": True
                }, status=400)
        else:
            if today_regular_count >= regular_limit:
                remaining_shown = max(0, display_stock)
                return JsonResponse({
                    "message": f"⚠️ به دلیل محدودیت ظرفیت روزانه، روزانه {display_limit} سفارش کروپک پذیرفته می‌شود.\n\nظرفیت امروز تکمیل شده است. ({remaining_shown} سفارش باقیمانده)\n\nتوجه: تمام سفارشات به‌صورت کاملاً قانونی و با کارت‌های فروشگاه انجام می‌شوند.",
                    "crew_limit_reached": True
                }, status=400)

    # Get phone from user profile if not provided in contact
    phone = contact.get('phone', '')
    if not phone and user:
        try:
            profile = UserProfile.objects.get(user=user)
            phone = profile.phone_number or user.username
        except UserProfile.DoesNotExist:
            phone = user.username
    
    contact_email = (contact.get('email') or '').strip().lower()
    # Existing email flows use epic_username as the order-level fallback address.
    # For Xbox/PSN-only orders, keep the checkout contact email there so customer emails send.
    epic_username = contact.get('epic_username', '') or contact.get('epic_email', '') or contact_email
    
    # Build comprehensive note with all platform credentials
    note_parts = []
    if user_note_raw:
        note_parts.append(f"یادداشت کاربر: {user_note_raw}")
    
    # Epic Games credentials
    epic_email = contact.get('epic_email', '').strip()
    epic_pass = contact.get('epic_pass', '').strip()
    if epic_email or epic_pass:
        note_parts.append(f"--- Epic Games ---")
        if epic_email:
            note_parts.append(f"Email: {epic_email}")
        if epic_pass:
            note_parts.append(f"Password: {epic_pass}")
    
    # Xbox credentials
    xbox_email = contact.get('xbox_email', '').strip()
    xbox_pass = contact.get('xbox_pass', '').strip()
    xbox_section_added = False
    if xbox_email or xbox_pass:
        note_parts.append(f"--- Xbox ---")
        xbox_section_added = True
        if xbox_email:
            note_parts.append(f"Email: {xbox_email}")
        if xbox_pass:
            note_parts.append(f"Password: {xbox_pass}")
    xbox_create_account_raw = contact.get('xbox_create_account')
    xbox_create_account = str(xbox_create_account_raw).strip().lower() in {"1", "true", "yes", "on"}
    has_xbox_auto_create_item = any(
        (it.get('account_type') or '').strip().lower() in {"xbox", "xboxx"} and not _payload_item_is_gta6(it)
        for it in items
    )
    # Generic Xbox service orders still need admin account-creation follow-up.
    # GTA VI Xbox variants use the customer's existing Xbox credentials unless
    # the checkout explicitly requests account creation.
    xbox_create_account = xbox_create_account or has_xbox_auto_create_item
    if xbox_create_account:
        if not xbox_section_added:
            note_parts.append(f"--- Xbox ---")
        note_parts.append("درخواست ساخت اکانت Xbox توسط جینکس فمیلی.")
    
    # PSN credentials
    psn_email = contact.get('psn_email', '').strip()
    psn_pass = contact.get('psn_pass', '').strip()
    if psn_email or psn_pass:
        note_parts.append(f"--- PlayStation (PSN) ---")
        if psn_email:
            note_parts.append(f"Email: {psn_email}")
        if psn_pass:
            note_parts.append(f"Password: {psn_pass}")
    
    # Rush order info + activation path
    if rush_order and rush_fee > 0:
        if crew_qty_new > 0:
            note_parts.append(f"--- فوری ---")
            note_parts.append("🟦 Epic Games (لوگو)")
            note_parts.append("فعال‌سازی فوری از طریق Epic Games انجام می‌شود.")
            note_parts.append(f"هزینه اضافی: {rush_fee:,} تومان")
        else:
            note_parts.append(f"--- سفارش فوری ---")
            note_parts.append(f"هزینه اضافی: {rush_fee:,} تومان")
    
    full_note = "\n".join(note_parts)

    # Mark test user orders to exclude from financial reports
    is_test = _is_test_user(user)
    if is_test:
        logger.info("Creating test order for user: %s", user.username)

    order = Order(
        user=user,
        epic_username=epic_username,
        phone=phone,
        telegram=contact.get('telegram', ''),
        note=full_note,
        status='pending',
        xbox_create_account=xbox_create_account,
        is_test_order=is_test,
    )
    order.save()

    # mark any abandoned cart for this user, phone, or email as converted
    try:
        cart_filter = Q(user=user)
        if phone:
            normalized_phone = "".join(c for c in phone if c.isdigit())
            if len(normalized_phone) >= 10:
                last_10 = normalized_phone[-10:]
                cart_filter |= Q(phone__endswith=last_10)
        if contact_email:
            cart_filter |= Q(email__iexact=contact_email)

        AbandonedCart.objects.filter(
            cart_filter,
            converted_at__isnull=True
        ).update(converted_at=timezone.now())
    except Exception:
        pass

    amount = 0
    discount_code_raw = (payload.get('discount_code') or '').strip()
    discount_percent = 0
    discount_amount = 0
    for it in items:
        # Check if this is a G4A4 item
        g4a4_var_id = it.get('g4a4_variation_id') or it.get('g4a4_var_id')
        if g4a4_var_id:
            try:
                g4a4_var = G4A4Variation.objects.select_related('product').get(external_variation_id=g4a4_var_id)
                if not g4a4_var.in_stock or not g4a4_var.product.is_active:
                    order.delete()
                    return JsonResponse(
                        {"message": f"محصول «{g4a4_var.product.name}» موقتاً غیرفعال یا ناموجود است."},
                        status=400,
                    )
                
                price = g4a4_var.sell_toman
                name = f"{g4a4_var.product.name} - {g4a4_var.name}"
                
                try:
                    qty = int(it.get('quantity') or 1)
                except (TypeError, ValueError):
                    qty = 1
                qty = max(1, qty)
                
                custom_fields = _cart_item_custom_fields(it)
                    
                acc_type = _determine_account_type(g4a4_var.product.category, g4a4_var.product.game_slug, it.get('account_type'))
                created_item = OrderItem.objects.create(
                    order=order,
                    product=None,
                    variant=None,
                    name=name,
                    price=price,
                    price_lira=0,
                    quantity=qty,
                    account_type=acc_type,
                    g4a4_variation=g4a4_var,
                    g4a4_status="pending",
                    custom_fields_data=custom_fields
                )
                amount += price * qty
                continue # early continue for G4A4
            except G4A4Variation.DoesNotExist:
                order.delete()
                return JsonResponse(
                    {"message": "واریانت محصول کوین یافت نشد. لطفا سبد خرید را بازبینی کنید."},
                    status=400,
                )

        # Find product / variant price on server to prevent tampering
        product_id = it.get('product_id')
        slug = it.get('slug') or ''

        # Resolve product either by numeric ID or slug; if not found, fail with JSON
        p = None
        try:
            if product_id is not None:
                p = Product.objects.get(id=product_id, active=True)
        except (Product.DoesNotExist, ValueError, TypeError):
            p = None

        if p is None:
            slug_candidate = slug.strip()
            if not slug_candidate and isinstance(product_id, str):
                slug_candidate = product_id.strip()
            if slug_candidate:
                try:
                    p = Product.objects.get(slug=slug_candidate, active=True)
                except Product.DoesNotExist:
                    order.delete()
                    return JsonResponse(
                        {"message": "محصولی در سبد خرید یافت نشد. لطفاً سبد خرید را بازبینی کنید."},
                        status=400,
                    )
            else:
                order.delete()
                return JsonResponse(
                    {"message": "محصولی در سبد خرید یافت نشد. لطفاً سبد خرید را بازبینی کنید."},
                    status=400,
                )

        is_reseller = getattr(order, "is_reseller_order", False)

        # 1. Check ordering disabled
        if not is_admin:
            if getattr(p, "ordering_disabled", False):
                order.delete()
                return JsonResponse(
                    {"message": f"ثبت سفارش برای محصول «{p.name_fa}» موقتاً غیرفعال است."},
                    status=400,
                )
            if is_reseller and getattr(p, "reseller_ordering_disabled", False):
                order.delete()
                return JsonResponse(
                    {"message": f"ثبت سفارش همکار برای محصول «{p.name_fa}» غیرفعال است."},
                    status=400,
                )
            if not is_reseller and getattr(p, "customer_ordering_disabled", False):
                order.delete()
                return JsonResponse(
                    {"message": f"ثبت سفارش مشتری برای محصول «{p.name_fa}» غیرفعال است."},
                    status=400,
                )

        try:
            qty_chk = int(it.get('quantity') or 1)
        except (TypeError, ValueError):
            qty_chk = 1
        if qty_chk < 1:
            qty_chk = 1

        # 2. Check daily limits
        if not is_admin:
            from django.utils import timezone
            from django.db.models import Sum
            today_start = timezone.now().replace(hour=0, minute=0, second=0, microsecond=0)

            # Check reseller specific daily limit
            if is_reseller and getattr(p, "reseller_daily_order_limit", -1) > 0:
                ordered_today_reseller = OrderItem.objects.filter(
                    product=p,
                    order__created_at__gte=today_start,
                    order__is_reseller_order=True,
                ).exclude(order__status__in=["canceled", "refunded"]).aggregate(total=Sum("quantity"))["total"] or 0

                if ordered_today_reseller + qty_chk > p.reseller_daily_order_limit:
                    order.delete()
                    remaining = max(0, p.reseller_daily_order_limit - ordered_today_reseller)
                    return JsonResponse(
                        {"message": f"ظرفیت سفارش همکاران برای محصول «{p.name_fa}» امروز به پایان رسیده است. (ظرفیت باقی‌مانده همکاران: {remaining} عدد)"},
                        status=400,
                    )

            # Check customer specific daily limit
            if not is_reseller and getattr(p, "customer_daily_order_limit", -1) > 0:
                ordered_today_customer = OrderItem.objects.filter(
                    product=p,
                    order__created_at__gte=today_start,
                    order__is_reseller_order=False,
                ).exclude(order__status__in=["canceled", "refunded"]).aggregate(total=Sum("quantity"))["total"] or 0

                if ordered_today_customer + qty_chk > p.customer_daily_order_limit:
                    order.delete()
                    remaining = max(0, p.customer_daily_order_limit - ordered_today_customer)
                    return JsonResponse(
                        {"message": f"ظرفیت سفارش مشتریان برای محصول «{p.name_fa}» امروز به پایان رسیده است. (ظرفیت باقی‌مانده مشتریان: {remaining} عدد)"},
                        status=400,
                    )

            # Check general daily limit
            if getattr(p, "daily_order_limit", -1) > 0:
                ordered_today = OrderItem.objects.filter(
                    product=p,
                    order__created_at__gte=today_start,
                ).exclude(order__status__in=["canceled", "refunded"]).aggregate(total=Sum("quantity"))["total"] or 0

                if ordered_today + qty_chk > p.daily_order_limit:
                    order.delete()
                    remaining = max(0, p.daily_order_limit - ordered_today)
                    return JsonResponse(
                        {"message": f"ظرفیت ثبت سفارش برای محصول «{p.name_fa}» امروز به پایان رسیده است. (ظرفیت باقی‌مانده امروز: {remaining} عدد)"},
                        status=400,
                    )

        var_id = it.get('variant_id')
        price = None
        variant = None
        if var_id:
            try:
                variant = ProductVariant.objects.get(id=var_id, product=p)
                price = variant.price
                name = f"{p.name_fa} - {variant.title}"
            except (ProductVariant.DoesNotExist, ValueError, TypeError):
                order.delete()
                return JsonResponse(
                    {"message": "گزینه‌ی انتخاب‌شده برای یکی از محصولات نامعتبر است."},
                    status=400,
                )
        else:
            price = p.min_price or p.price
            name = p.name_fa

        try:
            qty = int(it.get('quantity') or 1)
        except (TypeError, ValueError):
            order.delete()
            return JsonResponse({"message": "تعداد یکی از آیتم‌ها نامعتبر است."}, status=400)
        if qty < 1:
            order.delete()
            return JsonResponse({"message": "تعداد یکی از آیتم‌ها نامعتبر است."}, status=400)
        price_lira = int(getattr(p, "price_lira", 0) or 0)
        custom_fields = _cart_item_custom_fields(it)
        account_type = (it.get('account_type') or '').strip().lower()
        account_email = (it.get('account_email') or '').strip()
        account_password = (it.get('account_password') or it.get('account_pass') or '').strip()

        if account_type in {"xbox", "xboxx"}:
            account_type = "xbox"
            account_email = account_email or xbox_email
            account_password = account_password or xbox_pass
        elif account_type in {"psn", "playstation", "ps"}:
            account_type = "psn"
            account_email = account_email or psn_email
            account_password = account_password or psn_pass
        else:
            account_type = _determine_account_type(p.category, p.slug, account_type)
            account_email = account_email or epic_email
            account_password = account_password or epic_pass

        created_item = OrderItem.objects.create(
            order=order,
            product=p,
            variant=variant,
            name=name,
            price=price,
            price_lira=price_lira,
            quantity=qty,
            account_type=account_type,
            account_email=account_email,
            account_password=account_password,
            custom_fields_data=custom_fields,
        )

        amount += price * qty

    # مالیات ثابت برای هر واحد کروپک
    # Add rush fee if applicable
    logger.info(
        "Rush fee calculation: rush_order=%s, rush_fee=%s, amount_before=%s",
        rush_order, rush_fee, amount
    )
    if rush_order:
        order.rush_order = True
        order.rush_fee = rush_fee
        if rush_fee > 0:
            amount += rush_fee
            logger.info("Rush fee added: new_amount=%s", amount)

    # Apply discount code (percent) on subtotal
    if discount_code_raw:
        dc, discount_error = _get_discount_code_status(discount_code_raw, user)
        if discount_error:
            order.delete()
            return JsonResponse({"message": discount_error}, status=400)
        discount_percent, nominal_discount = _discount_nominal_amount(dc, amount)
        cost_lines = [
            (it.product, it.variant, it.quantity)
            for it in order.items.select_related("product", "variant").all()
        ]
        discount_warning = _discount_guardrail_warning(dc, cost_lines, amount, nominal_discount)
        discount_amount = nominal_discount

        amount = max(amount - discount_amount, 0)
        order.discount_code = dc.code
        order.discount_percent = discount_percent
        order.discount_amount = discount_amount
        if discount_warning:
            logger.warning(
                "Discount guardrail warning: tracking=%s code=%s gross=%s discount=%s safe_discount=%s cost=%s allowed=%s",
                order.tracking_code,
                dc.code,
                discount_warning["gross_amount"],
                discount_warning["discount_amount"],
                discount_warning["safe_discount_amount"],
                discount_warning["total_cost"],
                discount_warning["allowed_discount"],
            )
            order.note = (
                f"{order.note}\n\n" if order.note else ""
            ) + (
                "هشدار سیستم: این کد تخفیف از کف سود عبور کرده اما طبق تنظیم فعلی اعمال شده است. "
                f"تخفیف اعمال‌شده: {discount_warning['discount_amount']:,} تومان؛ "
                f"تخفیف پیشنهادی سیستم: {discount_warning['safe_discount_amount']:,} تومان."
            )
        # Consume one use of the code.
        dc.used_count = (dc.used_count or 0) + 1
        dc.save(update_fields=["used_count"])
    
    # Apply coin (کوین) redemption — replaces the old wallet-cashback system.
    # Completely disabled for resellers.
    diamonds_applied = 0
    diamond_discount = 0
    if user is not None:
        try:
            is_reseller = user.profile.tier == "reseller"
        except Exception:
            is_reseller = False
        if not is_reseller:
            profile, _ = UserProfile.objects.get_or_create(user=user)
            if diamonds_use > 0:
                usable_diamonds = min(diamonds_use, profile.points_balance)
                diamond_discount = min(diamonds_to_toman(usable_diamonds), amount)
                
                # Profit guardrail for diamonds: never sell below cost, but the
                # customer's own balance isn't subject to the promo profit floor
                # (see rewards.py "Wallet credit ... NOT capped here").
                try:
                    from .rewards import line_items_cost
                    cost_lines = [
                        (it.product, it.variant, it.quantity)
                        for it in order.items.select_related("product", "variant").all()
                    ]
                    total_cost = line_items_cost(cost_lines)

                    allowed_diamond_discount = max(0, amount - total_cost)
                    diamond_discount = min(diamond_discount, allowed_diamond_discount)
                except Exception:
                    logger.exception("profit guardrail for diamonds failed")
                    
                full_value = diamonds_to_toman(usable_diamonds)
                # Never charge more diamonds than the (possibly amount-capped) discount needs.
                diamonds_applied = (
                    usable_diamonds if diamond_discount >= full_value
                    else toman_to_diamonds_ceil(diamond_discount)
                )
                if diamonds_applied > 0:
                    from .rewards import award_points
                    award_points(user, -diamonds_applied, "redeem", related_order=order, note="تبدیل کوین به تخفیف خرید")
    payable = amount - diamond_discount

    # Apply refund credit (اعتبار بازگشتی)
    refund_credit_used = 0
    if user is not None and not is_reseller:
        try:
            refund_credit_requested = max(0, int(payload.get('refund_credit_use') or 0))
        except (TypeError, ValueError):
            refund_credit_requested = 0

        if refund_credit_requested > 0 and payable > 0:
            from .rewards import spend_refund_credit
            refund_credit_used = spend_refund_credit(
                user,
                min(refund_credit_requested, payable),
                related_order=order,
                idempotency_key=f"spend:order:{order.pk}",
                note=f"مصرف اعتبار بازگشتی برای سفارش {order.tracking_code}",
            )
            payable = max(0, payable - refund_credit_used)

    # Apply wallet balance deduction
    use_wallet = bool(payload.get('use_wallet', False))
    wallet_applied = 0
    if use_wallet and user is not None and not is_reseller:
        profile, _ = UserProfile.objects.get_or_create(user=user)
        if profile.wallet_balance > 0:
            wallet_applied = min(profile.wallet_balance, payable)
            profile.wallet_balance -= wallet_applied
            profile.save(update_fields=['wallet_balance'])
            payable -= wallet_applied
            
            # Record customer wallet transaction
            CustomerWalletTxn.objects.create(
                profile=profile,
                kind="order",
                amount=-wallet_applied,
                balance_after=profile.wallet_balance,
                related_order=order,
                note=f"کسر از کیف پول برای سفارش {order.tracking_code}"
            )

    order.amount = payable
    order.wallet_used = wallet_applied
    order.diamonds_used = diamonds_applied
    order.refund_credit_used = refund_credit_used
    order.save()

    # Verify expected_amount matches calculated order.amount to prevent silent price mismatch
    expected_amount = payload.get('expected_amount')
    if expected_amount is not None:
        try:
            expected_amount = int(expected_amount)
            if abs(order.amount - expected_amount) > 10:  # allow tiny rounding difference
                # rollback point deduction if any
                if diamonds_applied > 0:
                    from .rewards import award_points
                    award_points(user, diamonds_applied, "adjust", note="بازگرداندن الماس به دلیل عدم ثبت سفارش")
                # rollback refund credit if any
                if refund_credit_used > 0:
                    from .rewards import credit_refund_credit
                    credit_refund_credit(
                        user, refund_credit_used,
                        related_order=order,
                        idempotency_key=f"restore:expected:{order.pk}",
                        kind="restore",
                        note="بازگرداندن اعتبار بازگشتی به دلیل عدم ثبت سفارش",
                    )
                # rollback wallet balance if any
                if wallet_applied > 0 and user is not None:
                    profile, _ = UserProfile.objects.get_or_create(user=user)
                    profile.wallet_balance += wallet_applied
                    profile.save(update_fields=['wallet_balance'])
                    CustomerWalletTxn.objects.create(
                        profile=profile,
                        kind="adjust",
                        amount=wallet_applied,
                        balance_after=profile.wallet_balance,
                        related_order=order,
                        note=f"بازگرداندن به کیف پول به دلیل عدم ثبت سفارش {order.tracking_code}"
                    )
                # rollback discount code used_count if any
                if order.discount_code:
                    try:
                        dc = DiscountCode.objects.get(code=order.discount_code)
                        dc.used_count = max(0, (dc.used_count or 0) - 1)
                        dc.save(update_fields=["used_count"])
                    except Exception:
                        pass
                # delete the order
                order.delete()
                return JsonResponse({"message": "مبلغ نهایی سفارش با سبد خرید شما همخوانی ندارد. لطفاً صفحه را مجدداً بارگذاری کنید."}, status=400)
        except (ValueError, TypeError):
            pass

    logger.info(
        "Order saved: tracking=%s, amount=%s, rush_order=%s, rush_fee=%s, diamonds_applied=%s, refund_credit_used=%s",
        order.tracking_code, order.amount, order.rush_order, order.rush_fee, diamonds_applied, refund_credit_used
    )

    # Send new order notification to contact@jinxfamily
    try:
        items_for_email = [
            {
                "name": oi.name,
                "quantity": oi.quantity,
                "price": oi.price,
                "platform": getattr(oi.variant, "title", "") if oi.variant else "",
                "account_type": getattr(oi, "account_type", ""),
                "account_email": getattr(oi, "account_email", ""),
                "account_password": getattr(oi, "account_password", ""),
            }
            for oi in order.items.all()
        ]

        customer_email = ""
        customer_name = ""
        if user:
            customer_email = user.email or ""
            customer_name = user.get_full_name() or user.username or ""
        if not customer_email and "@" in (order.epic_username or ""):
            customer_email = order.epic_username
        if not customer_name and order.epic_username:
            customer_name = order.epic_username

        from .email_service import _render_items_rows, _send_email
        rows = _render_items_rows(items_for_email)
        html = f"""
<!DOCTYPE html>
<html dir="rtl" lang="fa">
<head><meta charset="UTF-8"></head>
<body style="font-family:Tahoma,sans-serif;background:#0e1428;padding:20px;color:#fff">
<div style="max-width:720px;margin:0 auto;background:linear-gradient(135deg,#1f2a4d,#11182e);border-radius:14px;border:1px solid rgba(255,255,255,0.08);overflow:hidden">
<div style="background:linear-gradient(135deg,#4f7cff,#8f4bff);padding:20px 24px">
<h1 style="margin:0;font-size:20px">سفارش جدید ثبت شد</h1>
<div>کد پیگیری: <strong>{order.tracking_code}</strong></div>
</div>
<div style="padding:20px 24px">
<div style="padding:12px;background:rgba(255,255,255,0.04);border-radius:8px;line-height:1.8;margin-bottom:12px">
مبلغ قابل پرداخت: <strong>{order.amount:,} تومان</strong><br>
کیف پول استفاده شده: {order.wallet_used:,} تومان<br>
وضعیت فوری: {"بله" if order.rush_order else "خیر"}
</div>
<div style="padding:12px;background:rgba(255,255,255,0.04);border-radius:8px;line-height:1.8;margin-bottom:12px">
<div><strong>مشخصات خریدار</strong></div>
<div>نام: {customer_name or "نامشخص"}</div>
<div>ایمیل: {customer_email or "نامشخص"}</div>
<div>تلفن: {order.phone or "نامشخص"}</div>
<div>تلگرام: {order.telegram or "نامشخص"}</div>
</div>
<table style="width:100%;border-collapse:collapse;font-size:13px;background:rgba(255,255,255,0.02);border-radius:8px;margin-bottom:12px">
<thead><tr style="background:rgba(255,255,255,0.04)">
<th style="padding:10px;text-align:right;border-bottom:1px solid rgba(255,255,255,0.05)">محصول</th>
<th style="padding:10px;text-align:right;border-bottom:1px solid rgba(255,255,255,0.05)">تعداد</th>
<th style="padding:10px;text-align:right;border-bottom:1px solid rgba(255,255,255,0.05)">قیمت</th>
<th style="padding:10px;text-align:right;border-bottom:1px solid rgba(255,255,255,0.05)">پلتفرم</th>
<th style="padding:10px;text-align:right;border-bottom:1px solid rgba(255,255,255,0.05)">ایمیل ورود</th>
<th style="padding:10px;text-align:right;border-bottom:1px solid rgba(255,255,255,0.05)">رمز</th>
</tr></thead>
<tbody>{rows}</tbody>
</table>
<div style="padding:12px;background:rgba(255,255,255,0.04);border-radius:8px;line-height:1.8;margin-bottom:12px">
<div>توضیحات کاربر:</div>
<div style="white-space:pre-wrap;margin-top:6px">{order.note or "—"}</div>
</div>
<div style="padding:12px;background:rgba(255,255,255,0.04);border-radius:8px;line-height:1.8">
لینک سفارش: <a style="color:#f1c40f;text-decoration:none;font-weight:bold" href="https://jinxfamily.ir/track/{order.tracking_code}">track/{order.tracking_code}</a>
</div>
</div>
<div style="color:#b7bfd8;font-size:12px;padding:0 24px 20px 24px">این ایمیل به صورت خودکار ارسال شده است. لطفاً پاسخ ندهید.</div>
</div>
</body>
</html>
"""
        _send_email(
            ["contact.jinxfamily@gmail.com"],
            f"سفارش جدید ثبت شد - {order.tracking_code}",
            html,
        )

    except Exception as notify_err:
        logger.error(f"New order notification email error: {notify_err}")

    # Check if order contains crew pack to show special message
    has_crew_pack = crew_qty_new > 0
    success_message = "سفارش با موفقیت ثبت شد"
    if has_crew_pack:
        success_message = "✅ سفارش شما با موفقیت ثبت شد\n\n📧 تمام وضعیت سفارش شما به صورت ایمیل برای شما ارسال خواهد شد.\n\n⚠️ توجه مهم: هرگونه اسپم و پیام مکرر تنها باعث تضییع حق خودتان و عزیزان دیگر خواهد شد. لطفاً صبور باشید."

    return JsonResponse({
        "tracking_code": order.tracking_code,
        "status": order.status,
        "status_fa": dict(Order.STATUS_CHOICES)[order.status],
        "amount": order.amount,
        "discount_code": order.discount_code,
        "discount_percent": order.discount_percent,
        "discount_amount": order.discount_amount,
        "wallet_used": order.wallet_used,
        "diamonds_used": order.diamonds_used,
        "rush_order": order.rush_order,
        "rush_fee": order.rush_fee,
        "message": success_message
    }, status=201)


@csrf_exempt
def ipinfo_lookup(request):
    if request.method != 'GET':
        return HttpResponseNotAllowed(['GET'])
    token = getattr(settings, "IPINFO_TOKEN", "d7c4438140078c")
    if not token:
        return JsonResponse({"ok": False, "error": "token_missing"}, status=200)
    try:
        resp = requests.get(
            f"https://api.ipinfo.io/lite?token={token}",
            timeout=4,
            proxies=FILTER_BYPASS_PROXIES,
        )
        resp.raise_for_status()
        data = resp.json()
    except Exception:
        logger.warning("IP info lookup failed", exc_info=True)
        return JsonResponse({"ok": False}, status=200)
    return JsonResponse(
        {
            "ok": True,
            "ip": data.get("ip"),
            "country_code": data.get("country_code"),
            "region": data.get("region"),
            "city": data.get("city"),
        },
        status=200,
    )


def order_status(request, tracking):
    if request.method != 'GET':
        return HttpResponseNotAllowed(['GET'])
    order = get_object_or_404(Order, tracking_code=tracking)
    items = []
    for oi in order.items.all():
        image_url = ""
        try:
            if oi.product:
                image_url = _resolve_product_image(oi.product)
        except Exception:
            image_url = ""
        items.append({
            "name": oi.name,
            "quantity": oi.quantity,
            "price": oi.price,
            "line_total": oi.line_total(),
            "image_url": image_url,
        })
    latest_payment = order.payments.filter(status__in=['verified', 'success']).order_by('-created_at').first()
    
    # Check if created outside working hours (Tehran timezone 00:00 to 10:00 AM)
    is_outside_working_hours = False
    try:
        import zoneinfo
        tehran_tz = zoneinfo.ZoneInfo("Asia/Tehran")
        created_tehran = order.created_at.astimezone(tehran_tz) if timezone.is_aware(order.created_at) else order.created_at
        if 0 <= created_tehran.hour < 10:
            is_outside_working_hours = True
    except Exception:
        is_outside_working_hours = False

    # Estimate time remaining
    estimated_time = ""
    if order.status in ["paid", "registered", "processing"]:
        if is_outside_working_hours:
            estimated_time = "ثبت شده خارج از ساعت کاری (تکمیل در ساعت کاری ۱۰ تا ۲۴ با اولویت زمان ثبت)"
        elif order.rush_order:
            estimated_time = "تحویل در ساعت کاری (فوری)"
        else:
            estimated_time = "تحویل در ساعت کاری"
    elif order.status in ["needs_2fa", "invalid_info", "needs_tr_region", "needs_xbox_info"]:
        estimated_time = "متوقف شده (نیاز به اقدام کاربر برای رفع مشکل اکانت)"
    elif order.status == "pending":
        estimated_time = "در انتظار پرداخت (روند انجام پس از پرداخت آغاز می‌شود)"
    elif order.status == "completed":
        estimated_time = "تکمیل شده"
    else:
        estimated_time = "لغو شده / مسترد شده"

    return JsonResponse({
        "tracking_code": order.tracking_code,
        "status": order.status,
        "status_fa": dict(Order.STATUS_CHOICES)[order.status],
        "amount": order.amount,
        "wallet_used": order.wallet_used,
        "diamonds_used": order.diamonds_used,
        "rush_order": order.rush_order,
        "rush_fee": order.rush_fee,
        "created_at": order.created_at.isoformat(),
        "items": items,
        "payment_ref_id": latest_payment.ref_id if latest_payment and latest_payment.ref_id else "",
        "payment_card_pan": latest_payment.card_pan if latest_payment and latest_payment.card_pan else "",
        "estimated_time": estimated_time,
        "is_outside_working_hours": is_outside_working_hours,
    })


@csrf_exempt
def signup(request):
    if request.method != 'POST':
        return HttpResponseNotAllowed(['POST'])
    try:
        payload = json.loads(request.body.decode('utf-8'))
    except Exception:
        return JsonResponse({"message": "JSON نامعتبر"}, status=400)

    first_name = (payload.get('name') or '').strip()
    last_name = (payload.get('lastname') or '').strip()
    username_pref = (payload.get('username') or '').strip()
    email = (payload.get('email') or '').strip().lower()
    password = payload.get('password') or ''
    password2 = payload.get('password2') or password
    accept = bool(payload.get('accept_policies'))

    if not all([first_name, last_name, email, password]):
        return JsonResponse({"message": "لطفاً همه فیلدها را تکمیل کنید"}, status=400)
    if password != password2:
        return JsonResponse({"message": "رمز عبور و تکرار آن یکسان نیست"}, status=400)
    if not accept:
        return JsonResponse({"message": "برای ثبت‌نام باید قوانین و EULA را بپذیرید"}, status=400)
    if User.objects.filter(email=email).exists():
        return JsonResponse({"message": "ایمیل قبلاً ثبت شده است"}, status=400)

    username = username_pref or email.split('@')[0]
    base_username = username
    i = 1
    while User.objects.filter(username=username).exists():
        username = f"{base_username}{i}"
        i += 1

    user = User(username=username, first_name=first_name, last_name=last_name, email=email)
    user.set_password(password)
    user.save()

    try:
        profile, _ = UserProfile.objects.get_or_create(user=user)
    except MultipleObjectsReturned:
        profile = UserProfile.objects.filter(user=user).order_by('id').first()
    # Default tier is "user"; admins can be configured via Django admin.

    # Credit the referrer if this signup came through a referral link.
    try:
        from .rewards import process_referral
        process_referral(user, payload.get('ref') or payload.get('referral_code'))
    except Exception:
        logger.exception("referral processing failed for signup user %s", user.id)

    login(request, user)

    avatar_url = ""
    if getattr(profile, "avatar", None):
        try:
            avatar_url = request.build_absolute_uri(profile.avatar.url)
        except Exception:
            avatar_url = ""

    return JsonResponse({
        "id": user.id,
        "name": user.get_full_name() or user.username,
        "email": user.email,
        "is_admin": profile.tier == "admin" or user.is_staff,
        "wallet_balance": profile.wallet_balance,
        "avatar_url": avatar_url,
    }, status=201)


@csrf_exempt
def login_view(request):
    if request.method != 'POST':
        return HttpResponseNotAllowed(['POST'])
    try:
        payload = json.loads(request.body.decode('utf-8'))
    except Exception:
        return JsonResponse({"message": "JSON نامعتبر"}, status=400)

    identifier_raw = (payload.get('email') or payload.get('phone') or '').strip()
    identifier = _normalize_login_identifier(identifier_raw)
    email = identifier.lower()
    password = (payload.get('password') or '').strip()
    remember = bool(payload.get('remember'))

    if not email or not password:
        return JsonResponse({"message": "ایمیل/شماره و رمز عبور الزامی است"}, status=400)

    username = None
    # Resolve username from email (case-insensitive), but tolerate duplicate emails gracefully.
    # If multiple users share the same email, pick the first one instead of erroring.
    user_qs = User.objects.filter(email__iexact=email).order_by('id')
    if user_qs.exists():
        username = user_qs.first().username
    # If not found by email, try to locate a profile that matches the phone number.
    if not username and re.fullmatch(r"09\d{9}", identifier):
        profile_with_phone = UserProfile.objects.filter(phone_number=identifier).select_related("user").first()
        if profile_with_phone and profile_with_phone.user:
            username = profile_with_phone.user.username
    # Otherwise allow direct phone/username login (11-digit mobile) or fall back to the normalized input.
    if not username:
        if re.fullmatch(r"09\d{9}", identifier):
            username = identifier
        else:
            username = email

    user = authenticate(request, username=username, password=password)
    if user is None:
        return JsonResponse({"message": "شماره یا رمز عبور نادرست است"}, status=400)

    login(request, user)
    # Always use 31-day session to reduce SMS costs (ignore remember checkbox)
    request.session.set_expiry(60 * 60 * 24 * 31)  # 31 days

    try:
        profile, _ = UserProfile.objects.get_or_create(user=user)
    except MultipleObjectsReturned:
        profile = UserProfile.objects.filter(user=user).order_by('id').first()

    avatar_url = ""
    if getattr(profile, "avatar", None):
        try:
            avatar_url = request.build_absolute_uri(profile.avatar.url)
        except Exception:
            avatar_url = ""

    return JsonResponse({
        "id": user.id,
        "name": user.get_full_name() or user.username,
        "email": user.email,
        "phone_number": user.username,
        "phone": user.username,
        "is_admin": _is_admin_user(user),
        "wallet_balance": profile.wallet_balance,
        "points_balance": profile.points_balance,
        "refund_credit": profile.refund_credit,
        "avatar_url": avatar_url,
    })


@csrf_exempt
def logout_view(request):
    if request.method != 'POST':
        return HttpResponseNotAllowed(['POST'])
    logout(request)
    return JsonResponse({"success": True})


def me(request):
    if not request.user.is_authenticated:
        return JsonResponse({"detail": "authentication required"}, status=401)
    user = request.user
    try:
        profile, _ = UserProfile.objects.get_or_create(user=user)
    except MultipleObjectsReturned:
        profile = UserProfile.objects.filter(user=user).order_by('id').first()

    avatar_url = ""
    if getattr(profile, "avatar", None):
        try:
            avatar_url = request.build_absolute_uri(profile.avatar.url)
        except Exception:
            avatar_url = ""

    # Determine phone_number from profile or username
    phone_num = profile.phone_number if profile.phone_number else (user.username if user.username.startswith('09') else "")

    is_admin = _is_admin_user(user)
    data = {
        "id": user.id,
        "name": user.get_full_name() or user.username,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "email": user.email,
        "phone_number": phone_num,
        "phone": phone_num,
        "is_admin": is_admin,
        "wallet_balance": profile.wallet_balance,
        "points_balance": profile.points_balance,
        "refund_credit": profile.refund_credit,
        "avatar_url": avatar_url,
    }
    if is_admin:
        data["reseller_pricing_tour_seen"] = profile.reseller_pricing_tour_seen_at is not None
    return JsonResponse(data)


@csrf_exempt
def my_referral(request):
    """GET /api/me/referral — the signed-in user's referral code, link and stats."""
    if not request.user.is_authenticated:
        return JsonResponse({"detail": "authentication required"}, status=401)
    user = request.user
    from .rewards import (
        ensure_referral_code,
        REFERRAL_MILESTONE_COUNT,
        REFERRAL_MILESTONE_POINTS,
    )
    code = ensure_referral_code(user)
    referrals = Referral.objects.filter(referrer=user).order_by("created_at", "id")
    invites = referrals.count()
    profile, _ = UserProfile.objects.get_or_create(user=user)
    acknowledged_count = min(profile.referral_notified_count, invites)
    unseen_referrals = referrals[acknowledged_count:]
    unseen_count = len(unseen_referrals)
    unseen_diamonds = sum(referral.points_awarded for referral in unseen_referrals)
    points_earned = (
        PointsTransaction.objects.filter(user=user, reason="referral")
        .aggregate(s=Sum("amount"))["s"] or 0
    )
    base = (os.environ.get("PUBLIC_SITE_URL") or "https://jinxfamily.ir").rstrip("/")
    link = f"{base}/?ref={code}" if code else ""
    return JsonResponse({
        "referral_code": code,
        "link": link,
        "invites_count": invites,
        "points_earned": points_earned,
        "milestone": {
            "target": REFERRAL_MILESTONE_COUNT,
            "reached": invites >= REFERRAL_MILESTONE_COUNT,
            "reward_points": REFERRAL_MILESTONE_POINTS,
            "rewards": [],
        },
        "unseen": {
            "count": unseen_count,
            "diamonds": unseen_diamonds,
            "crossed_milestone": acknowledged_count < REFERRAL_MILESTONE_COUNT <= invites,
        },
    })


@csrf_exempt
def acknowledge_referrals(request):
    """Mark all referral activity currently visible to this user as acknowledged."""
    if request.method != "POST":
        return HttpResponseNotAllowed(["POST"])
    if not request.user.is_authenticated:
        return JsonResponse({"detail": "authentication required"}, status=401)

    with transaction.atomic():
        profile, _ = UserProfile.objects.get_or_create(user=request.user)
        profile = UserProfile.objects.select_for_update().get(pk=profile.pk)
        current_count = Referral.objects.filter(referrer=request.user).count()
        if profile.referral_notified_count != current_count:
            profile.referral_notified_count = current_count
            profile.save(update_fields=["referral_notified_count"])
    return JsonResponse({"acknowledged_count": current_count})


@csrf_exempt
def redeem_crewpack(request):
    """POST /api/me/redeem/crewpack — spend points for a free Crew Pack code."""
    if request.method != 'POST':
        return HttpResponseNotAllowed(['POST'])
    if not request.user.is_authenticated:
        return JsonResponse({"message": "ابتدا وارد شوید."}, status=401)
    user = request.user
    from .rewards import _setting_int, generate_discount_code
    cost = _setting_int("crewpack_redeem_points", 800)
    profile, _ = UserProfile.objects.get_or_create(user=user)
    if int(profile.points_balance or 0) < cost:
        return JsonResponse({"message": f"برای دریافت کروپک رایگان به {cost} امتیاز نیاز دارید."}, status=400)

    crew = Product.objects.filter(slug=CREW_SLUG).first()
    crew_value = int(getattr(crew, "price", 0) or 0) or _setting_int("crewpack_value", 0)
    if crew_value <= 0:
        return JsonResponse({"message": "بازخرید کروپک موقتاً در دسترس نیست."}, status=400)

    # Floor-exempt (source="milestone") single-use code worth a Crew Pack.
    code = generate_discount_code(
        amount=crew_value, assigned_user=user, single_use=True,
        source="milestone", prefix="CREW", expires_at=timezone.now() + timedelta(days=60),
    )
    from .rewards import award_points
    award_points(user, -cost, "milestone", note="بازخرید کروپک رایگان")
    return JsonResponse({"success": True, "code": code.code, "amount": crew_value, "points_left": profile.points_balance})


@csrf_exempt
def update_profile(request):
    if not request.user.is_authenticated:
        return JsonResponse({"detail": "authentication required"}, status=401)
    if request.method != 'POST':
        return HttpResponseNotAllowed(['POST'])

    try:
        payload = json.loads(request.body.decode('utf-8'))
    except Exception:
        return JsonResponse({"message": "JSON نامعتبر"}, status=400)

    user = request.user
    try:
        profile, _ = UserProfile.objects.get_or_create(user=user)
    except MultipleObjectsReturned:
        profile = UserProfile.objects.filter(user=user).order_by('id').first()

    name = (payload.get('name') or '').strip()
    requested_email = (payload.get('email') or '').strip().lower()
    password = payload.get('password') or ''
    password2 = (payload.get('password2') or password) if password else ''

    # Email is the account identifier and cannot be changed from the customer panel.
    # Accepting the unchanged value keeps older clients compatible, but never writes it.
    if requested_email and requested_email != (user.email or '').strip().lower():
        return JsonResponse({"message": "ایمیل حساب قابل تغییر نیست."}, status=400)

    if 'first_name' in payload or 'last_name' in payload:
        user.first_name = (payload.get('first_name') or '').strip()
        user.last_name = (payload.get('last_name') or '').strip()
    elif name:
        # Backward compatibility for older clients that submit one display-name field.
        user.first_name = name
        user.last_name = ''

    if password or password2:
        if password != password2:
            return JsonResponse({"message": "رمز عبور و تکرار آن یکسان نیست"}, status=400)
        if len(password) < 6:
            return JsonResponse({"message": "رمز عبور باید حداقل ۶ کاراکتر باشد"}, status=400)
        user.set_password(password)

    user.save()
    if password:
        # set_password changes the session hash; keep this authenticated request signed in.
        update_session_auth_hash(request, user)
    profile.save()
    profile_completion_award = 0
    try:
        from .rewards import award_profile_completion_points
        profile_completion_award = award_profile_completion_points(user)
        profile.refresh_from_db(fields=["points_balance"])
    except Exception:
        logger.exception("profile completion points failed for user %s", user.id)

    avatar_url = ""
    if getattr(profile, "avatar", None):
        try:
            avatar_url = request.build_absolute_uri(profile.avatar.url)
        except Exception:
            avatar_url = ""

    return JsonResponse({
        "id": user.id,
        "name": user.get_full_name() or user.username,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "phone_number": user.username,
        "phone": user.username,
        "email": user.email,
        "is_admin": profile.tier == "admin" or user.is_staff,
        "wallet_balance": profile.wallet_balance,
        "points_balance": profile.points_balance,
        "refund_credit": profile.refund_credit,
        "avatar_url": avatar_url,
        "profile_completion_award": profile_completion_award,
    })


@csrf_exempt
def upload_avatar(request):
    if not request.user.is_authenticated:
        return JsonResponse({"detail": "authentication required"}, status=401)
    if request.method != 'POST':
        return HttpResponseNotAllowed(['POST'])

    file = request.FILES.get('avatar') or request.FILES.get('file')
    if not file:
        return JsonResponse({"message": "فایل تصویر ارسال نشده است"}, status=400)

    # Optional: basic size limit (2MB)
    max_size = 2 * 1024 * 1024
    if file.size > max_size:
        return JsonResponse({"message": "حجم تصویر نباید بیشتر از ۲ مگابایت باشد"}, status=400)

    user = request.user
    try:
        profile, _ = UserProfile.objects.get_or_create(user=user)
    except MultipleObjectsReturned:
        profile = UserProfile.objects.filter(user=user).order_by('id').first()

    # Replace previous avatar if exists
    if getattr(profile, "avatar", None):
        try:
            profile.avatar.delete(save=False)
        except (OSError, ValueError, ValidationError):
            pass

    profile.avatar = file
    profile.save()
    profile_completion_award = 0
    try:
        from .rewards import award_profile_completion_points
        profile_completion_award = award_profile_completion_points(user)
        profile.refresh_from_db(fields=["points_balance"])
    except Exception:
        logger.exception("profile completion points failed for user %s", user.id)

    avatar_url = ""
    if getattr(profile, "avatar", None):
        try:
            avatar_url = request.build_absolute_uri(profile.avatar.url)
        except Exception:
            avatar_url = ""

    return JsonResponse({
        "avatar_url": avatar_url,
        "points_balance": profile.points_balance,
        "profile_completion_award": profile_completion_award,
    })


@csrf_exempt
def admin_reseller_pricing_tour_ack(request):
    """POST: ثبت این‌که ادمین تور آموزشی قیمت‌گذاری همکاران را دیده (فقط یک‌بار نمایش داده می‌شود)."""
    if request.method != "POST":
        return HttpResponseNotAllowed(["POST"])
    if not request.user.is_authenticated or not _is_admin_user(request.user):
        return JsonResponse({"detail": "forbidden"}, status=403)
    profile, _ = UserProfile.objects.get_or_create(user=request.user)
    profile.reseller_pricing_tour_seen_at = timezone.now()
    profile.save(update_fields=["reseller_pricing_tour_seen_at"])
    return JsonResponse({"ok": True})


def _is_admin_user(user):
    """
    تشخیص ادمین بودن: پروفایل با tier=admin یا کاربر staff
    یا شماره در لیست سفید ADMIN_PHONE_WHITELIST.
    """
    if not user or not user.is_authenticated:
        return False
    if user.is_staff:
        return True
    phone_num = ""
    try:
        profile = user.profile
        if profile.tier == "admin":
            return True
        phone_num = profile.phone_number or ""
    except Exception:
        phone_num = ""
    username_phone = user.username if user.username.startswith('09') else ""
    return phone_num in ADMIN_PHONE_WHITELIST or username_phone in ADMIN_PHONE_WHITELIST


def _parse_numeric_price(value):
    normalized = re.sub(r"[^\d]", "", str(value or ""))
    return int(normalized) if normalized else 0


def _extract_tgju_market_price(html, market_row):
    pattern = (
        rf"(?:data-market-row|data-market-nameslug)=[\"']{re.escape(market_row)}[\"']"
        rf"[\s\S]{{0,5000}}?data-price=[\"']([^\"']+)[\"']"
    )
    match = re.search(pattern, html or "", re.IGNORECASE)
    return _parse_numeric_price(match.group(1) if match else "")


def _parse_tgju_currency_rates(html):
    usd = _extract_tgju_market_price(html, "price_dollar_rl")
    try_rate = _extract_tgju_market_price(html, "price_try")
    if not usd or not try_rate:
        raise ValueError("Could not parse TGJU USD/TRY rates")
    return {"usd": usd, "try": try_rate}


def _bot_token_ok(request) -> bool:
    expected = os.environ.get("JINXFAMILY_BOT_WEBHOOK_TOKEN", "")
    if not expected:
        return False
    provided = request.headers.get("X-Bot-Token") or request.META.get("HTTP_X_BOT_TOKEN") or ""
    return hmac.compare_digest(provided.strip(), expected.strip())


def _is_admin_or_token_ok(request) -> bool:
    if _is_admin_user(request.user):
        return True
    return _bot_token_ok(request)


def _parse_iso_dt(value):
    if not value:
        return timezone.now()
    try:
        if isinstance(value, (int, float)):
            return datetime.fromtimestamp(value, tz=timezone.utc)
        raw = str(value).strip()
        if raw.endswith("Z"):
            raw = raw[:-1] + "+00:00"
        dt = datetime.fromisoformat(raw)
        if timezone.is_naive(dt):
            dt = timezone.make_aware(dt)
        return dt
    except Exception:
        return timezone.now()


def _truncate_text(value: str, limit: int = 4000) -> str:
    text = (value or "").strip()
    if len(text) <= limit:
        return text
    return text[:limit].rstrip() + "..."


@csrf_exempt
def discord_webhook_message(request):
    if request.method != "POST":
        return HttpResponseNotAllowed(["POST"])
    if not _bot_token_ok(request):
        return JsonResponse({"message": "forbidden"}, status=403)

    try:
        payload = json.loads(request.body.decode("utf-8"))
    except Exception:
        return JsonResponse({"message": "invalid_json"}, status=400)

    channel_id = int(payload.get("channel_id") or 0)
    if not channel_id:
        return JsonResponse({"message": "missing_channel_id"}, status=400)

    guild_id = int(payload.get("guild_id") or 0)
    category_id = int(payload.get("category_id") or 0)
    channel_name = (payload.get("channel_name") or "").strip() or f"channel-{channel_id}"
    channel_topic = (payload.get("channel_topic") or "").strip()

    message_id = str(payload.get("message_id") or "").strip()
    author_id = str(payload.get("author_id") or "").strip()
    author_name = (payload.get("author_name") or "").strip()
    author_avatar = (payload.get("author_avatar") or "").strip()
    author_is_bot = bool(payload.get("author_is_bot"))
    content = _truncate_text(payload.get("content") or "")
    created_at = _parse_iso_dt(payload.get("created_at"))

    priority = payload.get("priority") or {}
    needs_2fa = bool(payload.get("needs_2fa")) if payload.get("needs_2fa") is not None else None
    needs_sync = bool(payload.get("needs_sync")) if payload.get("needs_sync") is not None else None
    priority_score = priority.get("score")
    priority_label = (priority.get("label") or "").strip()
    summary_text = _truncate_text(priority.get("summary") or "", limit=1200)
    ai_at = _parse_iso_dt(priority.get("at")) if priority.get("at") else None

    channel_defaults = {
        "guild_id": guild_id,
        "category_id": category_id,
        "name": channel_name,
        "topic": channel_topic,
        "last_message_id": message_id,
        "last_message_at": created_at,
        "last_message_excerpt": content[:400],
    }

    if needs_2fa is not None:
        channel_defaults["needs_2fa"] = needs_2fa
    if needs_sync is not None:
        channel_defaults["needs_sync"] = needs_sync
    if isinstance(priority_score, (int, float)):
        channel_defaults["priority_score"] = max(0, min(int(priority_score), 100))
    if priority_label:
        channel_defaults["priority_label"] = priority_label[:32]
    if summary_text:
        channel_defaults["last_ai_summary"] = summary_text
        channel_defaults["last_ai_at"] = ai_at or timezone.now()

    channel, _ = DiscordTicketChannel.objects.update_or_create(
        channel_id=channel_id,
        defaults=channel_defaults,
    )

    DiscordTicketMessage.objects.create(
        channel=channel,
        message_id=message_id[:32],
        author_id=author_id[:32],
        author_name=author_name[:120],
        author_avatar=author_avatar[:300],
        author_is_bot=author_is_bot,
        content=content,
        direction="inbound" if not author_is_bot else "inbound",
        delivery_status="received",
        created_at=created_at,
    )

    return JsonResponse({"success": True})


@csrf_exempt
def discord_webhook_priority(request):
    if request.method != "POST":
        return HttpResponseNotAllowed(["POST"])
    if not _bot_token_ok(request):
        return JsonResponse({"message": "forbidden"}, status=403)

    try:
        payload = json.loads(request.body.decode("utf-8"))
    except Exception:
        return JsonResponse({"message": "invalid_json"}, status=400)

    channel_id = int(payload.get("channel_id") or 0)
    if not channel_id:
        return JsonResponse({"message": "missing_channel_id"}, status=400)

    summary_text = _truncate_text(payload.get("summary") or "", limit=1200)
    label = (payload.get("label") or "").strip()
    score = payload.get("score")
    needs_2fa = payload.get("needs_2fa")
    needs_sync = payload.get("needs_sync")
    ai_at = _parse_iso_dt(payload.get("at")) if payload.get("at") else timezone.now()

    updates = {
        "last_ai_summary": summary_text,
        "last_ai_at": ai_at,
    }
    if label:
        updates["priority_label"] = label[:32]
    if isinstance(score, (int, float)):
        updates["priority_score"] = max(0, min(int(score), 100))
    if needs_2fa is not None:
        updates["needs_2fa"] = bool(needs_2fa)
    if needs_sync is not None:
        updates["needs_sync"] = bool(needs_sync)

    DiscordTicketChannel.objects.update_or_create(
        channel_id=channel_id,
        defaults=updates,
    )

    return JsonResponse({"success": True})


@csrf_exempt
def discord_bot_outbox(request):
    if request.method != "GET":
        return HttpResponseNotAllowed(["GET"])
    if not _bot_token_ok(request):
        return JsonResponse({"message": "forbidden"}, status=403)

    limit = int(request.GET.get("limit") or 20)
    limit = max(1, min(limit, 100))
    with transaction.atomic():
        queued = (
            DiscordTicketMessage.objects.select_for_update()
            .filter(direction="outbound", delivery_status="queued")
            .order_by("created_at")[:limit]
        )

        data = []
        for m in queued:
            m.delivery_status = "sending"
            m.save(update_fields=["delivery_status"])
            data.append({
                "id": m.id,
                "channel_id": str(m.channel.channel_id),
                "content": m.content,
            })

    return JsonResponse({"results": data})


@csrf_exempt
def discord_bot_outbox_ack(request):
    if request.method != "POST":
        return HttpResponseNotAllowed(["POST"])
    if not _bot_token_ok(request):
        return JsonResponse({"message": "forbidden"}, status=403)

    try:
        payload = json.loads(request.body.decode("utf-8"))
    except Exception:
        return JsonResponse({"message": "invalid_json"}, status=400)

    message_id = payload.get("id") or payload.get("message_id")
    if not message_id:
        return JsonResponse({"message": "missing_id"}, status=400)

    status = (payload.get("status") or "sent").strip().lower()
    if status not in {"sent", "failed"}:
        return JsonResponse({"message": "invalid_status"}, status=400)

    discord_message_id = str(payload.get("discord_message_id") or "").strip()
    error = _truncate_text(payload.get("error") or "", limit=800)

    try:
        msg = DiscordTicketMessage.objects.get(id=message_id)
    except DiscordTicketMessage.DoesNotExist:
        return JsonResponse({"message": "not_found"}, status=404)

    msg.delivery_status = status
    if discord_message_id:
        msg.message_id = discord_message_id[:32]
    if error:
        msg.delivery_error = error
    msg.save(update_fields=["delivery_status", "message_id", "delivery_error"])

    return JsonResponse({"success": True})


RESOLVED_USERS_CACHE = {}

def _get_username_by_id(user_id):
    if user_id in RESOLVED_USERS_CACHE:
        return RESOLVED_USERS_CACHE[user_id]

    # Check database first
    name = DiscordTicketMessage.objects.filter(author_id=user_id).values_list('author_name', flat=True).first()
    if name:
        RESOLVED_USERS_CACHE[user_id] = name
        return name

    # Check Discord API
    token = os.environ.get("JINXFAMILY_BOT_WEBHOOK_TOKEN")
    if token:
        try:
            proxies = {
                'http': 'socks5h://127.0.0.1:10808',
                'https': 'socks5h://127.0.0.1:10808'
            }
            headers = {
                'Authorization': token,
                'User-Agent': 'Mozilla/5.0'
            }
            resp = requests.get(f"https://discord.com/api/v10/users/{user_id}", headers=headers, proxies=proxies, timeout=3)
            if resp.status_code == 200:
                name = resp.json().get("username")
                if name:
                    RESOLVED_USERS_CACHE[user_id] = name
                    return name
        except Exception:
            pass

    return None

def _resolve_discord_mentions(content):
    if not content:
        return ""

    # Resolve user mentions <@ID> or <@!ID>
    matches = re.findall(r'<@!?(\d+)>', content)
    for user_id in matches:
        name = _get_username_by_id(user_id)
        if name:
            content = content.replace(f"<@{user_id}>", f"@{name}").replace(f"<@!{user_id}>", f"@{name}")
        else:
            content = content.replace(f"<@{user_id}>", f"@{user_id}").replace(f"<@!{user_id}>", f"@{user_id}")

    # Resolve channel mentions <#ID>
    chan_matches = re.findall(r'<#(\d+)>', content)
    for chan_id in chan_matches:
        try:
            chan_name = DiscordTicketChannel.objects.get(channel_id=chan_id).name
            content = content.replace(f"<#{chan_id}>", f"#{chan_name}")
        except Exception:
            pass

    return content


@csrf_exempt
def discord_admin_channels(request):
    if request.method != "GET":
        return HttpResponseNotAllowed(["GET"])
    if not _is_admin_or_token_ok(request):
        return JsonResponse({"message": "forbidden"}, status=403)

    limit = int(request.GET.get("limit") or 200)
    limit = max(1, min(limit, 500))

    channels = (
        DiscordTicketChannel.objects.filter(is_archived=False)
        .order_by("-last_message_at", "-updated_at")[:limit]
    )

    data = []
    for c in channels:
        # Get the latest customer message for user profile details
        cust_msg = c.messages.filter(author_is_bot=False).order_by('-created_at').first()
        if not cust_msg:
            cust_msg = c.messages.order_by('-created_at').first()

        data.append({
            "channel_id": str(c.channel_id),
            "guild_id": str(c.guild_id),
            "category_id": str(c.category_id),
            "name": c.name,
            "topic": c.topic,
            "last_message_id": c.last_message_id,
            "last_message_at": c.last_message_at.isoformat() if c.last_message_at else None,
            "last_message_excerpt": _resolve_discord_mentions(c.last_message_excerpt),
            "priority_score": c.priority_score,
            "priority_label": c.priority_label,
            "needs_2fa": c.needs_2fa,
            "needs_sync": c.needs_sync,
            "last_ai_summary": c.last_ai_summary,
            "last_ai_at": c.last_ai_at.isoformat() if c.last_ai_at else None,
            "user_name": cust_msg.author_name if cust_msg else c.name,
            "user_avatar": cust_msg.author_avatar if cust_msg else "",
        })
    return JsonResponse({"results": data})


@csrf_exempt
def discord_admin_messages(request, channel_id: int):
    if request.method != "GET":
        return HttpResponseNotAllowed(["GET"])
    if not _is_admin_or_token_ok(request):
        return JsonResponse({"message": "forbidden"}, status=403)

    limit = int(request.GET.get("limit") or 200)
    limit = max(1, min(limit, 500))

    try:
        channel = DiscordTicketChannel.objects.get(channel_id=channel_id)
    except DiscordTicketChannel.DoesNotExist:
        return JsonResponse({"message": "channel_not_found"}, status=404)

    # Fetch fresh messages from Discord on-demand to ensure we have the full history (up to 50 messages)
    token = os.environ.get("JINXFAMILY_BOT_WEBHOOK_TOKEN")
    if token:
        try:
            proxies = {
                'http': 'socks5h://127.0.0.1:10808',
                'https': 'socks5h://127.0.0.1:10808'
            }
            headers = {
                'Authorization': token,
                'User-Agent': 'Mozilla/5.0'
            }
            # Fetch the latest 50 messages from Discord
            resp = requests.get(
                f"https://discord.com/api/v10/channels/{channel_id}/messages?limit=50",
                headers=headers,
                proxies=proxies,
                timeout=4
            )
            if resp.status_code == 200:
                from django.utils.dateparse import parse_datetime
                raw_messages = resp.json()
                for m in raw_messages:
                    author = m.get("author", {})
                    author_id = author.get("id", "")
                    author_name = author.get("username", "")

                    avatar_hash = author.get("avatar")
                    if avatar_hash:
                        author_avatar = f"https://cdn.discordapp.com/avatars/{author_id}/{avatar_hash}.png"
                    else:
                        author_avatar = ""

                    content = m.get("content", "")
                    msg_id = m.get("id", "")
                    timestamp_str = m.get("timestamp", "")
                    created_at = parse_datetime(timestamp_str)

                    # Direction
                    my_id = "543475404665520128" # Self bot user ID
                    direction = "outbound" if author_id == my_id else "inbound"

                    # update_or_create to sync DB
                    DiscordTicketMessage.objects.update_or_create(
                        channel=channel,
                        message_id=msg_id,
                        defaults={
                            "author_id": author_id,
                            "author_name": author_name,
                            "author_avatar": author_avatar,
                            "author_is_bot": author.get("bot", False),
                            "content": content,
                            "direction": direction,
                            "delivery_status": "sent",
                            "created_at": created_at,
                        }
                    )
        except Exception as e:
            print(f"Error fetching on-demand messages from Discord: {e}")

    messages = (
        DiscordTicketMessage.objects.filter(channel=channel)
        .order_by("-created_at")[:limit]
    )
    data = [
        {
            "id": m.id,
            "message_id": m.message_id,
            "author_id": m.author_id,
            "author_name": m.author_name,
            "author_avatar": m.author_avatar,
            "author_is_bot": m.author_is_bot,
            "content": _resolve_discord_mentions(m.content),
            "direction": m.direction,
            "delivery_status": m.delivery_status,
            "created_at": m.created_at.isoformat(),
        }
        for m in reversed(messages)
    ]
    return JsonResponse({"results": data})


@csrf_exempt
def discord_admin_send(request, channel_id: int):
    if request.method != "POST":
        return HttpResponseNotAllowed(["POST"])
    if not _is_admin_or_token_ok(request):
        return JsonResponse({"message": "forbidden"}, status=403)

    try:
        payload = json.loads(request.body.decode("utf-8"))
    except Exception:
        return JsonResponse({"message": "invalid_json"}, status=400)

    content = _truncate_text(payload.get("content") or "", limit=1800)
    if not content:
        return JsonResponse({"message": "empty_content"}, status=400)

    try:
        channel = DiscordTicketChannel.objects.get(channel_id=channel_id)
    except DiscordTicketChannel.DoesNotExist:
        return JsonResponse({"message": "channel_not_found"}, status=404)

    now = timezone.now()
    msg = DiscordTicketMessage.objects.create(
        channel=channel,
        message_id="",
        author_id=str(request.user.id),
        author_name=(request.user.get_full_name() or request.user.username)[:120],
        author_avatar="",
        author_is_bot=True,
        content=content,
        direction="outbound",
        delivery_status="queued",
        created_at=now,
    )

    channel.last_message_at = now
    channel.last_message_excerpt = content[:400]
    channel.save(update_fields=["last_message_at", "last_message_excerpt", "updated_at"])

    return JsonResponse({"success": True, "id": msg.id})


def _build_cart_data(order):
    """
    ساخت cart_data برای میان‌پی (صفحه چک‌اوت زرین‌پال)

    Args:
        order: نمونه Order

    Returns:
        dict: داده‌های سبد خرید
    """
    # Our order/pricing model stores amounts in toman, but ZarinPal cart_data
    # expects rial values. Convert everything here so the checkout view shows
    # the same discounted total that we actually charge.
    def to_rial(amount):
        return int(amount or 0) * 10

    items = []
    for order_item in order.items.all():
        items.append({
            "item_name": order_item.name,
            "item_amount": str(to_rial(order_item.price)),
            "item_count": str(order_item.quantity),
            "item_amount_sum": str(to_rial(order_item.line_total()))
        })

    # اضافه کردن هزینه فوری به عنوان آیتم جداگانه
    if order.rush_order and order.rush_fee > 0:
        items.append({
            "item_name": "تحویل فوری (۱۵ تا ۴۵ دقیقه)",
            "item_amount": str(to_rial(order.rush_fee)),
            "item_count": "1",
            "item_amount_sum": str(to_rial(order.rush_fee))
        })

    cart_data = {
        "items": items
    }

    # اضافه کردن تخفیفات (کد تخفیف + کیف پول/کوین)
    total_deductions = 0
    if order.discount_amount > 0:
        total_deductions += order.discount_amount
    if order.wallet_used > 0:
        total_deductions += order.wallet_used
    if order.diamonds_used > 0:
        from .rewards import diamonds_to_toman
        total_deductions += diamonds_to_toman(order.diamonds_used)

    if total_deductions > 0:
        cart_data["deductions"] = {
            "discount": str(to_rial(total_deductions))
        }

    return cart_data


def my_orders(request):
    if not request.user.is_authenticated:
        return JsonResponse({"detail": "authentication required"}, status=401)
    
    cutoff_time = timezone.now() - timedelta(hours=72)
    orders_qs = Order.objects.filter(user=request.user).exclude(status='canceled').filter(
        Q(status='completed') | Q(created_at__gte=cutoff_time)
    ).order_by('-created_at')

    def status_tag(code):
        return dict(Order.STATUS_CHOICES).get(code, code)

    # Define which statuses can be canceled
    cancelable_statuses = ['pending', 'payment_pending', 'payment_failed', 'processing']

    orders = []
    for o in orders_qs:
        first_item = o.items.first()
        image_url = ""
        try:
            if first_item and first_item.product:
                image_url = _resolve_product_image(first_item.product)
        except Exception:
            image_url = ""
        items_payload = []
        for item in o.items.select_related("product").all():
            items_payload.append({
                "name": item.name,
                "quantity": item.quantity,
                "price": item.price,
                "slug": item.product.slug if item.product else "",
                "g4a4_variation_id": item.g4a4_variation_id,
                "g4a4_order_id": item.g4a4_order_id,
                "g4a4_status": item.g4a4_status,
            })
        orders.append({
            "id": o.id,
            "tracking_code": o.tracking_code,
            "status": o.status,
            "status_fa": status_tag(o.status),
            "can_cancel": o.status in cancelable_statuses,
            "amount": o.amount,
            "wallet_used": o.wallet_used,
            "diamonds_used": o.diamonds_used,
            "refund_credit_used": o.refund_credit_used,
            "created_at": o.created_at.isoformat(),
            "first_item_name": first_item.name if first_item else "",
            "first_item_image": image_url,
            "first_item_slug": first_item.product.slug if first_item and first_item.product else "",
            "items": items_payload,
            "phone": o.phone,
            "telegram": o.telegram,
            "note": o.note,
            "epic_username": o.epic_username,
            "info_corrected": bool(getattr(o, "info_corrected", False)),
            "info_corrected_at": o.info_corrected_at.isoformat() if getattr(o, "info_corrected_at", None) else None,
            "can_edit_info": o.status in ["invalid_info", "needs_2fa", "needs_tr_region", "needs_xbox_info", "registered", "processing"],
        })
    return JsonResponse({"results": orders})


@csrf_exempt
def user_update_order_info(request, tracking):
    if not request.user.is_authenticated:
        return JsonResponse({"detail": "authentication required"}, status=401)
    if request.method != 'POST':
        return HttpResponseNotAllowed(['POST'])

    order = get_object_or_404(Order, tracking_code=tracking, user=request.user)

    try:
        payload = json.loads(request.body.decode('utf-8'))
    except Exception:
        return JsonResponse({"message": "JSON نامعتبر"}, status=400)

    xbox_email = (payload.get('xbox_email') or '').strip()
    xbox_password = (payload.get('xbox_password') or '').strip()
    epic_username = (payload.get('epic_username') or '').strip()
    phone = (payload.get('phone') or '').strip()
    telegram = (payload.get('telegram') or '').strip()
    note = (payload.get('note') or '').strip()

    update_fields = ['info_corrected', 'info_corrected_at']

    if xbox_email and xbox_password:
        existing_note = (order.note or '').strip()
        timestamp_str = timezone.now().strftime("%Y-%m-%d %H:%M")
        xbox_entry = f"🎮 [اطلاعات اکانت Xbox ارسالی کاربر - {timestamp_str}]: ایمیل: {xbox_email} | رمز عبور: {xbox_password}"
        if note and note not in xbox_entry:
            xbox_entry += f" | توضیحات: {note}"
        order.note = f"{existing_note}\n\n{xbox_entry}".strip() if existing_note else xbox_entry
        update_fields.append('note')
    elif note:
        existing_note = (order.note or '').strip()
        timestamp_str = timezone.now().strftime("%Y-%m-%d %H:%M")
        new_entry = f"🛠 [اصلاح اطلاعات کاربر - {timestamp_str}]: {note}"
        order.note = f"{existing_note}\n\n{new_entry}".strip() if existing_note else new_entry
        update_fields.append('note')

    if epic_username:
        order.epic_username = epic_username
        update_fields.append('epic_username')
    if phone:
        order.phone = phone
        update_fields.append('phone')
    if telegram:
        order.telegram = telegram
        update_fields.append('telegram')

    # Mark as corrected by user (PINNED for admin)
    order.info_corrected = True
    order.info_corrected_at = timezone.now()

    # If status was invalid_info, needs_2fa or needs_xbox_info, transition to processing so admin re-evaluates
    if order.status in ["invalid_info", "needs_2fa", "needs_tr_region", "needs_xbox_info"]:
        order.status = "processing"
        update_fields.append('status')

    order.save(update_fields=update_fields)

    # Create AI Evaluation Placeholder message (admin-only)
    try:
        ticket, _ = Ticket.objects.get_or_create(
            user=request.user,
            order=order,
            defaults={
                "subject": f"ارزیابی اطلاعات جدید سفارش #{order.tracking_code}",
                "status": "open",
            }
        )
        info_items = []
        if xbox_email: info_items.append(f"ایمیل Xbox: {xbox_email}")
        if xbox_password: info_items.append(f"رمز Xbox: {xbox_password}")
        if epic_username: info_items.append(f"اپیک گیمز: {epic_username}")
        if phone: info_items.append(f"تلفن: {phone}")
        if telegram: info_items.append(f"تلگرام: {telegram}")
        if note: info_items.append(f"توضیحات: {note}")

        summary = " | ".join(info_items) if info_items else "اطلاعات جدید ثبت گردید"

        TicketMessage.objects.create(
            ticket=ticket,
            sender_type="admin",
            sender_user=None,
            message=f"🤖 [پیش‌فرض ارزیابی هوش مصنوعی - فقط قابل مشاهده برای ادمین]\nاطلاعات جدید ثبت‌شده توسط کاربر:\n{summary}\n\nلطفاً با دکمه‌های اهرم اطمینان ادمین، صحت اطلاعات را تایید یا رد کنید.",
            is_admin_only=True,
        )
    except Exception as ai_err:
        logger.error(f"Error creating AI placeholder message: {ai_err}", exc_info=True)

    return JsonResponse({
        "success": True,
        "message": "اطلاعات سفارش با موفقیت بروزرسانی شد و سفارش در بالای لیست ادمین پین گردید.",
        "order": {
            "tracking_code": order.tracking_code,
            "status": order.status,
            "status_fa": dict(Order.STATUS_CHOICES).get(order.status, order.status),
            "epic_username": order.epic_username,
            "phone": order.phone,
            "telegram": order.telegram,
            "note": order.note,
            "info_corrected": order.info_corrected,
        }
    })


@csrf_exempt
def cancel_order(request, tracking):
    if request.method != 'POST':
        return JsonResponse({"message": "Method not allowed"}, status=405)
    if not request.user.is_authenticated:
        return JsonResponse({"message": "برای لغو سفارش باید وارد حساب شوید."}, status=401)

    try:
        order = Order.objects.get(tracking_code=tracking)
    except Order.DoesNotExist:
        return JsonResponse({"message": "سفارش یافت نشد."}, status=404)

    # Check if the order belongs to the current user
    if order.user != request.user:
        return JsonResponse({"message": "شما مجاز به لغو این سفارش نیستید."}, status=403)

    # Check if the order can be canceled
    cancelable_statuses = ['pending', 'payment_pending', 'payment_failed', 'processing']
    if order.status not in cancelable_statuses:
        return JsonResponse({"message": "این سفارش قابل لغو نیست."}, status=400)

    # Refund wallet if used (legacy orders only — wallet redemption is retired)
    if order.wallet_used > 0 and order.user:
        profile, _ = UserProfile.objects.get_or_create(user=order.user)
        profile.wallet_balance += order.wallet_used
        profile.save(update_fields=["wallet_balance"])

    # Refund diamonds if used (current redemption path)
    if order.diamonds_used > 0 and order.user:
        from .rewards import award_points
        award_points(
            order.user, order.diamonds_used, "redeem",
            related_order=order, note=f"بازگشت کوین سفارش لغوشده {order.tracking_code}",
        )

    # Refund refund-credit if used on the canceled order
    if order.refund_credit_used > 0 and order.user:
        from .rewards import credit_refund_credit
        credit_refund_credit(
            order.user, order.refund_credit_used,
            related_order=order,
            idempotency_key=f"restore:cancel:{order.pk}",
            kind="restore",
            note=f"بازگشت اعتبار بازگشتی سفارش لغوشده {order.tracking_code}",
        )

    # Permanently delete the canceled order (cascades to OrderItem + Payment)
    order.delete()

    return JsonResponse({"message": "سفارش با موفقیت لغو و حذف شد."}, status=200)


def _admin_order_dict(o: Order):
    first_item = o.items.first()
    latest_payment = o.payments.order_by("-created_at").first()
    items_payload = []
    requires_created_xbox_account = _order_requires_created_xbox_account(o)
    for oi in o.items.all():
        accounts = []
        for acc in oi.accounts.all().order_by("index"):
            accounts.append({
                "id": acc.id,
                "index": acc.index,
                "mode": acc.mode,
                "mode_fa": dict(OrderItemAccount.MODE_CHOICES).get(acc.mode, acc.mode),
                "account_type": acc.account_type,
                "account_email": acc.account_email,
                "account_password": acc.account_password,
                "xbox_email": acc.xbox_email,
                "xbox_password": acc.xbox_password,
                "status": acc.status,
                "status_fa": dict(OrderItemAccount.STATUS_CHOICES).get(acc.status, acc.status) if acc.status in ("pending", "filled") else acc.status,
            })
        items_payload.append({
            "id": oi.id,
            "name": oi.name,
            "quantity": oi.quantity,
            "price": oi.price,
            "price_lira": oi.price_lira,
            "product_slug": oi.product.slug if oi.product else "",
            "product_id": oi.product.id if oi.product else None,
            "account_type": getattr(oi, "account_type", ""),
            "account_email": getattr(oi, "account_email", ""),
            "account_password": getattr(oi, "account_password", ""),
            "accounts": accounts,
        })

    # Check for duplicate card usage
    has_duplicate_card = False
    duplicate_card_count = 0
    if latest_payment and latest_payment.card_hash:
        duplicate_card_count = Payment.objects.filter(
            card_hash=latest_payment.card_hash,
            status__in=['verified', 'success']
        ).exclude(id=latest_payment.id).count()
        has_duplicate_card = duplicate_card_count > 0

    return {
        "id": o.id,
        "tracking_code": o.tracking_code,
        "status": o.status,
        "status_fa": dict(Order.STATUS_CHOICES).get(o.status, o.status),
        "is_done": o.status == "completed",
        "amount": o.amount,
        "wallet_used": o.wallet_used,
        "diamonds_used": o.diamonds_used,
        "refund_credit_used": o.refund_credit_used,
        "refund_credit_granted_amount": o.refund_credit_granted_amount,
        "discount_code": o.discount_code,
        "discount_percent": o.discount_percent,
        "discount_amount": o.discount_amount,
        "created_at": o.created_at.isoformat(),
        "completed_at": o.completed_at.isoformat() if o.completed_at else None,
        "items": items_payload,
        "user_email": o.user.email if o.user else "",
        "epic_username": o.epic_username,
        "user_id": o.user.id if o.user else None,
        "first_item_name": first_item.name if first_item else "",
        "phone": o.phone,
        "telegram": o.telegram,
        "note": o.note,
        "xbox_create_account": o.xbox_create_account,
        "xbox_account_creation_skipped": o.xbox_account_creation_skipped,
        "requires_created_xbox_account": requires_created_xbox_account,
        "created_xbox_email": o.created_xbox_email,
        "created_xbox_pass": o.created_xbox_pass,
        "rush_order": o.rush_order,
        "rush_fee": o.rush_fee,
        "payment_ref_id": latest_payment.ref_id if latest_payment else "",
        "payment_authority": latest_payment.authority if latest_payment else "",
        "payment_card_pan": latest_payment.card_pan if latest_payment else "",
        "payment_card_hash": latest_payment.card_hash if latest_payment else "",
        "payment_status": latest_payment.status if latest_payment else "",
        "payment_amount": latest_payment.amount if latest_payment else 0,
        "payment_fee": latest_payment.fee if latest_payment else 0,
        "payment_fee_type": latest_payment.fee_type if latest_payment else "",
        "payment_created_at": latest_payment.created_at.isoformat() if (latest_payment and latest_payment.created_at) else None,
        "has_duplicate_card": has_duplicate_card,
        "duplicate_card_count": duplicate_card_count,
        "settled": o.settled,
        "settled_at": o.settled_at.isoformat() if o.settled_at else None,
        "is_test_order": bool(getattr(o, "is_test_order", False)),
        "is_reseller_order": bool(getattr(o, "is_reseller_order", False)),
        "reseller_seller_code": getattr(o, "reseller_seller_code", "") or "",
        "reseller_info_updated": bool(getattr(o, "reseller_info_updated", False)),
        "info_corrected": bool(getattr(o, "info_corrected", False)),
        "info_corrected_at": o.info_corrected_at.isoformat() if getattr(o, "info_corrected_at", None) else None,
    }

def _admin_product_dict(p: Product):
    return {
        "id": p.id,
        "name_fa": p.name_fa,
        "slug": p.slug,
        "subtitle": p.subtitle,
        "category": p.category,
        "image_url": p.image_url,
        "cover_16_9": p.cover_16_9,
        "price": p.price,
        "original_price": getattr(p, "original_price", 0),
        "price_lira": p.price_lira,
        "active": p.active,
        "ordering_disabled": bool(getattr(p, "ordering_disabled", False)),
        "daily_order_limit": int(getattr(p, "daily_order_limit", 0)),
        "reseller_ordering_disabled": bool(getattr(p, "reseller_ordering_disabled", False)),
        "customer_ordering_disabled": bool(getattr(p, "customer_ordering_disabled", False)),
        "reseller_daily_order_limit": int(getattr(p, "reseller_daily_order_limit", 0)),
        "customer_daily_order_limit": int(getattr(p, "customer_daily_order_limit", 0)),
        "description": getattr(p, "description", "") or "",
        "delivery_text": getattr(p, "delivery_text", "") or "",
        "faq": getattr(p, "faq", []) or [],
        "custom_fields": getattr(p, "custom_fields", []) or [],
        "requires_2fa": bool(getattr(p, "requires_2fa", False)),
        "disable_2fa_text": getattr(p, "disable_2fa_text", "") or "",
        "disable_2fa_color": getattr(p, "disable_2fa_color", "amber") or "amber",
        "jinx_image": getattr(p, "jinx_image", "") or "",
        "jinx_text": getattr(p, "jinx_text", "") or "",
        "page_customization": getattr(p, "page_customization", {}) or {},
        "display_order": getattr(p, "display_order", 0) or 0,
        "created_at": p.created_at.isoformat() if p.created_at else None,
        "variants": [
            {"id": v.id, "title": v.title, "group_fa": v.group_fa, "price": v.price, "original_price": getattr(v, "original_price", 0)}
            for v in p.variants.all().order_by("sort_order", "id")
        ],
    }


def _clean_product_text(value, max_length=None):
    cleaned = str(value or "").strip()
    if max_length and len(cleaned) > max_length:
        cleaned = cleaned[:max_length]
    return cleaned


def _clean_product_int(value, field_label):
    try:
        parsed = int(value or 0)
    except Exception:
        raise ValueError(f"{field_label} نامعتبر است")
    if parsed < 0:
        raise ValueError(f"{field_label} نمی‌تواند منفی باشد")
    return parsed


def _clean_daily_limit(value, field_label):
    """Accepts -1 (unlimited) or any non-negative integer."""
    try:
        parsed = int(value) if value is not None and value != "" else -1
    except Exception:
        raise ValueError(f"{field_label} نامعتبر است")
    if parsed < -1:
        raise ValueError(f"{field_label} نمی‌تواند منفی باشد")
    if parsed == 0:
        return -1
    return parsed


def _clean_product_category(value):
    category = str(value or "").strip().upper()
    allowed = {choice[0] for choice in Product.CATEGORY_CHOICES}
    if category not in allowed:
        raise ValueError("دسته‌بندی نامعتبر است")
    return category


def _build_product_updates(payload, require_name=False):
    updates = {}

    if "name_fa" in payload or require_name:
        name_fa = _clean_product_text(payload.get("name_fa"), 200)
        if not name_fa:
            raise ValueError("عنوان محصول الزامی است")
        updates["name_fa"] = name_fa
    if "slug" in payload:
        slug = slugify(_clean_product_text(payload.get("slug"), 220), allow_unicode=True)
        if slug:
            updates["slug"] = slug
    if "subtitle" in payload:
        updates["subtitle"] = _clean_product_text(payload.get("subtitle"), 220)
    if "subcategory" in payload:
        updates["subcategory"] = _clean_product_text(payload.get("subcategory"), 50)
    if "image_url" in payload:
        updates["image_url"] = _clean_product_text(payload.get("image_url"), 200)
    if "cover_16_9" in payload:
        updates["cover_16_9"] = _clean_product_text(payload.get("cover_16_9"), 200)
    if "category" in payload:
        updates["category"] = _clean_product_category(payload.get("category"))
    if "price" in payload:
        updates["price"] = _clean_product_int(payload.get("price"), "مبلغ")
    if "original_price" in payload:
        updates["original_price"] = _clean_product_int(payload.get("original_price"), "قیمت اصلی")
    if "price_lira" in payload:
        updates["price_lira"] = _clean_product_int(payload.get("price_lira"), "قیمت لیر")
    if "active" in payload:
        updates["active"] = bool(payload.get("active"))
    if "ordering_disabled" in payload:
        updates["ordering_disabled"] = bool(payload.get("ordering_disabled"))
    if "daily_order_limit" in payload:
        updates["daily_order_limit"] = _clean_daily_limit(payload.get("daily_order_limit"), "محدودیت سفارش روزانه")
    if "reseller_ordering_disabled" in payload:
        updates["reseller_ordering_disabled"] = bool(payload.get("reseller_ordering_disabled"))
    if "customer_ordering_disabled" in payload:
        updates["customer_ordering_disabled"] = bool(payload.get("customer_ordering_disabled"))
    if "reseller_daily_order_limit" in payload:
        updates["reseller_daily_order_limit"] = _clean_daily_limit(payload.get("reseller_daily_order_limit"), "محدودیت سفارش روزانه همکاران")
    if "customer_daily_order_limit" in payload:
        updates["customer_daily_order_limit"] = _clean_daily_limit(payload.get("customer_daily_order_limit"), "محدودیت سفارش روزانه مشتریان")
    if "description" in payload:
        updates["description"] = _clean_product_text(payload.get("description"), 8000)
    if "delivery_text" in payload:
        updates["delivery_text"] = _clean_product_text(payload.get("delivery_text"), 4000)
    if "faq" in payload:
        updates["faq"] = _clean_faq(payload.get("faq"))
    if "custom_fields" in payload:
        updates["custom_fields"] = _clean_custom_fields(payload.get("custom_fields"))
    if "requires_2fa" in payload:
        updates["requires_2fa"] = bool(payload.get("requires_2fa"))
    if "disable_2fa_text" in payload:
        updates["disable_2fa_text"] = _clean_product_text(payload.get("disable_2fa_text"), 200)
    if "disable_2fa_color" in payload:
        updates["disable_2fa_color"] = _clean_2fa_color(payload.get("disable_2fa_color"))
    if "jinx_image" in payload:
        updates["jinx_image"] = _clean_product_text(payload.get("jinx_image"), 500)
    if "jinx_text" in payload:
        updates["jinx_text"] = _clean_product_text(payload.get("jinx_text"), 2000)
    if "page_customization" in payload:
        page_customization = payload.get("page_customization")
        if not isinstance(page_customization, dict):
            raise ValueError("تنظیمات سفارشی‌سازی صفحه باید یک دیکشنری باشد")
        updates["page_customization"] = page_customization

    return updates


_ALLOWED_2FA_COLORS = {"amber", "blue", "gray", "red"}
_ALLOWED_FIELD_TYPES = {"text", "email", "password", "textarea", "select", "tel", "number"}


def _clean_2fa_color(value):
    color = str(value or "amber").strip().lower()
    if color not in _ALLOWED_2FA_COLORS:
        raise ValueError("رنگ بنر 2FA نامعتبر است (amber | blue | gray | red)")
    return color


def _slugify_field_key(value):
    import re as _re
    s = str(value or "").strip().lower()
    s = _re.sub(r"[^a-z0-9_]+", "_", s)
    s = _re.sub(r"_+", "_", s).strip("_")
    return s[:40] or "field"


def _clean_custom_fields(value):
    if value in (None, "", []):
        return []
    if not isinstance(value, list):
        raise ValueError("فیلدهای سفارشی باید آرایه باشند")
    out = []
    seen_keys = set()
    for idx, raw in enumerate(value):
        if not isinstance(raw, dict):
            continue
        key = _slugify_field_key(raw.get("key") or raw.get("label") or f"field_{idx + 1}")
        if not key or key in seen_keys:
            key = f"{key or 'field'}_{idx + 1}"
        seen_keys.add(key)
        ftype = str(raw.get("type") or "text").strip().lower()
        if ftype not in _ALLOWED_FIELD_TYPES:
            ftype = "text"
        label = str(raw.get("label") or raw.get("placeholder") or key).strip()[:120]
        if not label:
            label = key
        placeholder = str(raw.get("placeholder") or "").strip()[:120]
        required = bool(raw.get("required"))
        options = raw.get("options") if ftype == "select" else None
        if ftype == "select":
            if not isinstance(options, list):
                options = []
            options = [str(o).strip()[:80] for o in options if str(o or "").strip()][:50]
        else:
            options = None
        out.append({
            "key": key,
            "label": label,
            "type": ftype,
            "required": required,
            "placeholder": placeholder,
            "options": options,
        })
    return out[:20]


def _clean_faq(value):
    if value in (None, "", []):
        return []
    if not isinstance(value, list):
        raise ValueError("سوالات متداول باید آرایه باشند")
    out = []
    for raw in value:
        if not isinstance(raw, dict):
            continue
        q = str(raw.get("q") or raw.get("question") or "").strip()[:200]
        a = str(raw.get("a") or raw.get("answer") or "").strip()[:2000]
        if not q or not a:
            continue
        out.append({"q": q, "a": a})
    return out[:30]


def _product_cover_upload_path(product, uploaded_file):
    _, ext = os.path.splitext(uploaded_file.name or "")
    ext = ext.lower() if ext else ".webp"
    safe_exts = {".webp", ".png", ".jpg", ".jpeg", ".gif"}
    if ext not in safe_exts:
        raise ValueError("فرمت تصویر باید webp، png، jpg یا gif باشد")
    base = slugify(product.slug or product.name_fa) or f"product-{product.id}"
    stamp = timezone.now().strftime("%Y%m%d%H%M%S")
    return f"products/{base}-{stamp}{ext}"


def _get_setting(key: str, default=""):
    obj, _ = SiteSetting.objects.get_or_create(key=key, defaults={"value_text": str(default)})
    return obj


def _parse_crew_capacity_reset_time(value_text: str):
    raw = (value_text or "").strip()
    if not raw:
        return None
    try:
        return time.fromisoformat(raw)
    except Exception:
        return None


def _normalize_crew_capacity_reset_time(value_text: str):
    raw = (value_text or "").strip()
    if not raw:
        return ""
    parsed_time = _parse_crew_capacity_reset_time(raw)
    if not parsed_time:
        return None
    if parsed_time.second or parsed_time.microsecond:
        return parsed_time.strftime("%H:%M:%S")
    return parsed_time.strftime("%H:%M")


def _parse_crew_capacity_reset_at(value_text: str):
    raw = (value_text or "").strip()
    if not raw:
        return None
    try:
        reset_at = datetime.fromisoformat(raw)
    except Exception:
        return None
    if timezone.is_naive(reset_at):
        reset_at = timezone.make_aware(reset_at, timezone.get_default_timezone())
    return reset_at


def _get_crew_capacity_window_start(now=None):
    current_time = now or timezone.now()
    today_start = current_time.replace(hour=0, minute=0, second=0, microsecond=0)

    reset_time_setting = _get_setting("crew_capacity_reset_time", default="")
    reset_time = _parse_crew_capacity_reset_time(reset_time_setting.value_text)
    if reset_time:
        scheduled_start = current_time.replace(
            hour=reset_time.hour,
            minute=reset_time.minute,
            second=reset_time.second,
            microsecond=0,
        )
        if current_time < scheduled_start:
            scheduled_start -= timedelta(days=1)
    else:
        scheduled_start = today_start

    reset_at_setting = _get_setting("crew_capacity_reset_at", default="")
    reset_at = _parse_crew_capacity_reset_at(reset_at_setting.value_text)
    if reset_at and reset_at > scheduled_start and reset_at <= current_time:
        return reset_at
    return scheduled_start


def _load_announcement_setting():
    """
    Return (payload_dict, setting_obj) for the announcement bar.
    Stored as JSON inside SiteSetting to avoid new migrations.
    """
    default_payload = {
        "enabled": False,
        "text": "",
        "link_url": "",
        "bg_color": "#0f172a",
        "text_color": "#f8fafc",
        "speed": 52,
        "closable": True,
    }
    setting_obj = _get_setting("announcement_bar_json", default=json.dumps(default_payload, ensure_ascii=False))
    try:
        payload = json.loads(setting_obj.value_text or "{}")
    except Exception:
        payload = {}

    def _norm_str(val, max_len=500):
        if val is None:
            return ""
        return str(val).strip()[:max_len]

    normalized = {
        "enabled": bool(payload.get("enabled")),
        "text": _norm_str(payload.get("text")),
        "link_url": _norm_str(payload.get("link_url"), max_len=400),
        "bg_color": _norm_str(payload.get("bg_color") or "#0f172a", max_len=16),
        "text_color": _norm_str(payload.get("text_color") or "#f8fafc", max_len=16),
        "speed": max(12, min(int(payload.get("speed") or 52), 180)),
        "closable": bool(payload.get("closable", True)),
    }
    return normalized, setting_obj


def _increment_setting_int(key: str, delta: int = 1, default: int = 0) -> int:
    """
    Increase/decrease an integer SiteSetting by delta and return the new value.
    If the setting does not exist or is not an int, it will start from `default`.
    """
    obj = _get_setting(key, default=str(default))
    try:
        current = int(obj.value_text or "0")
    except Exception:
        current = int(default)
    current += int(delta)
    if current < 0:
        current = 0
    obj.value_text = str(current)
    obj.save(update_fields=["value_text", "updated_at"])
    return current


def public_stats(request):
    """
    Public, read‑only stats for the landing page.
    Currently exposes the total number of completed (successful) orders.
    """
    setting_obj = _get_setting("completed_orders_count", default="907")
    try:
        completed_orders = int(setting_obj.value_text or "907")
    except Exception:
        completed_orders = 907
    return JsonResponse({"completed_orders": completed_orders})


_PERSIAN_MONTHS = [
    "فروردین", "اردیبهشت", "خرداد",
    "تیر", "مرداد", "شهریور",
    "مهر", "آبان", "آذر",
    "دی", "بهمن", "اسفند",
]


def _to_jalali_approx(dt):
    """
    Convert a UTC datetime to an approximate Jalali (Solar Hijri) date string.
    Uses a lightweight algorithmic conversion without extra dependencies.
    Returns (day_str, month_name_fa).
    """
    from django.utils import timezone as tz
    # Convert to local time zone (Asia/Tehran)
    if dt.tzinfo is not None:
        dt = tz.localtime(dt)
    gy, gm, gd = dt.year, dt.month, dt.day

    g_d_m = [0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
    if (gy % 4 == 0 and gy % 100 != 0) or (gy % 400 == 0):
        g_d_m[2] = 29

    gy2 = gy - 1600
    g_day_no = 365 * gy2 + (gy2 + 3) // 4 - (gy2 + 99) // 100 + (gy2 + 399) // 400
    for i in range(1, gm):
        g_day_no += g_d_m[i]
    g_day_no += gd - 1

    j_day_no = g_day_no - 79
    j_np = j_day_no // 12053
    j_day_no %= 12053
    jy = 979 + 33 * j_np + 4 * (j_day_no // 1461)
    j_day_no %= 1461

    if j_day_no >= 366:
        jy += (j_day_no - 1) // 365
        j_day_no = (j_day_no - 1) % 365

    for i in range(11):
        days = 31 if i < 6 else 30
        if j_day_no < days:
            jm = i + 1
            jd = j_day_no + 1
            break
        j_day_no -= days
    else:
        jm = 12
        jd = j_day_no + 1

    return str(jd), _PERSIAN_MONTHS[jm - 1]


def public_testimonials(request):
    """
    GET /api/testimonials
    Returns the 20 most relevant approved ProductComments for the homepage
    slider. Ordering: real user reviews first, then any seed-marked rows,
    and within each group, 5★ → 1★, then by date desc. The "[seed]" prefix
    on `author_name` is stripped before returning so the UI never shows it.
    Each entry includes product slug so the frontend can deep-link to the review.
    """
    if request.method != "GET":
        return HttpResponseNotAllowed(["GET"])

    from django.db.models import Case, When, Value, IntegerField

    comments = (
        ProductComment.objects
        .filter(is_approved=True)
        .select_related("product", "user", "user__profile")
        .order_by("-created_at")[:30]
    )

    results = []
    for c in comments:
        day_str, month_name = _to_jalali_approx(c.created_at)
        # Strip the internal "[seed]" marker so it never leaks to the UI.
        display_name = c.author_name
        if display_name.startswith("[seed] "):
            display_name = display_name[len("[seed] "):]
        elif display_name.startswith("[seed]"):
            display_name = display_name[len("[seed]"):].lstrip()
        results.append({
            "id": c.id,
            "author_name": display_name,
            "product_name": c.product.name_fa,
            "product_slug": c.product.slug,
            "text": c.text,
            "rating": c.rating,
            "is_verified_purchase": c.is_verified_purchase,
            "date": {"day": day_str, "month": month_name},
        })

    return JsonResponse({"testimonials": results})


# Cached so we hit the upstream (tgju.org) at most once per CURRENCY_FRESH_TTL,
# not on every request. Last-good rates are kept far longer so a temporary
# upstream outage serves slightly-stale numbers (HTTP 200) instead of a 502.
CURRENCY_LAST_GOOD_KEY = "currency_rates:last_good"
CURRENCY_FRESH_KEY = "currency_rates:fresh"
CURRENCY_FRESH_TTL = 600        # 10 min — payload considered fresh, no refetch
CURRENCY_LAST_GOOD_TTL = 86400  # 24 h — stale fallback window


def currency_rates(request):
    if request.method != "GET":
        return HttpResponseNotAllowed(["GET"])

    last_good = cache.get(CURRENCY_LAST_GOOD_KEY)

    # Fast path: a recent successful fetch is still fresh — serve it, no network call.
    if last_good and cache.get(CURRENCY_FRESH_KEY):
        return JsonResponse(last_good)

    try:
        # tgju.org is a DOMESTIC (Iranian) site — it must NOT be routed through the
        # foreign xray proxy. Bypass the HTTP(S)_PROXY env entirely, same pattern as
        # zarinpal_service / kavenegar_service, otherwise the request is dragged out
        # through the proxy and times out.
        session = requests.Session()
        session.trust_env = False
        session.proxies = {"http": "", "https": ""}
        response = session.get(
            TGJU_CURRENCY_URL,
            timeout=6,
            headers={
                "User-Agent": "Mozilla/5.0 (compatible; JinxFamily/1.0)",
                "Accept": "text/html,application/xhtml+xml",
            },
        )
        response.raise_for_status()
        rates = _parse_tgju_currency_rates(response.text)
        rates.update({
            "source": TGJU_CURRENCY_URL,
            "fetchedAt": timezone.now().isoformat(),
            "stale": False,
        })
        cache.set(CURRENCY_LAST_GOOD_KEY, rates, CURRENCY_LAST_GOOD_TTL)
        cache.set(CURRENCY_FRESH_KEY, True, CURRENCY_FRESH_TTL)
        return JsonResponse(rates)
    except Exception as exc:
        # Upstream failed — serve last-known rates if we have any, so the widget
        # keeps working instead of erroring. Only 502 when we have nothing at all.
        if last_good:
            stale = dict(last_good)
            stale["stale"] = True
            return JsonResponse(stale)
        return JsonResponse(
            {
                "error": "currency_rates_unavailable",
                "message": str(exc),
            },
            status=502,
        )


@csrf_exempt
def admin_settings(request):
    if not request.user.is_authenticated:
        return JsonResponse({"detail": "authentication required"}, status=401)
    if not _is_admin_user(request.user):
        return JsonResponse({"detail": "forbidden"}, status=403)

    setting_key = "lira_rate"
    setting_obj = _get_setting(setting_key, default="0")

    if request.method == "GET":
        try:
            lira_rate = int(setting_obj.value_text or "0")
        except Exception:
            lira_rate = 0
        announcement_data, announcement_setting = _load_announcement_setting()
        # Load crew pack daily limit setting
        crew_limit_setting = _get_setting("crew_daily_limit_enabled", default="true")
        # Load crew pack disabled setting
        crew_disabled_setting = _get_setting("crew_pack_disabled", default="false")
        # Load reseller top-up settings
        reseller_topup_disabled_setting = _get_setting("reseller_topup_disabled", default="false")
        reseller_min_topup_setting = _get_setting("reseller_min_topup", default="10000")
        reseller_max_topup_setting = _get_setting("reseller_max_topup", default="200000000")
        # Load crew pack capacity numeric limits
        crew_regular_limit_setting = _get_setting("crew_regular_limit", default="20")
        crew_rush_limit_setting = _get_setting("crew_rush_limit", default="5")
        crew_display_limit_setting = _get_setting("crew_display_limit", default="50")
        crew_display_floor_setting = _get_setting("crew_display_floor", default=str(CREW_DISPLAY_FLOOR_DEFAULT))
        crew_display_override_setting = _get_setting("crew_display_override", default="-1")
        # Optional manual reset timestamp
        crew_capacity_reset_setting = _get_setting("crew_capacity_reset_at", default="")
        crew_capacity_reset_time_setting = _get_setting("crew_capacity_reset_time", default="")
        return JsonResponse({
            "lira_rate": lira_rate,
            "updated_at": setting_obj.updated_at.isoformat() if setting_obj.updated_at else None,
            "announcement_bar": announcement_data,
            "announcement_updated_at": announcement_setting.updated_at.isoformat() if announcement_setting.updated_at else None,
            "crew_daily_limit_enabled": crew_limit_setting.value_text,
            "crew_daily_limit_updated_at": crew_limit_setting.updated_at.isoformat() if crew_limit_setting.updated_at else None,
            "crew_pack_disabled": crew_disabled_setting.value_text,
            "crew_pack_disabled_updated_at": crew_disabled_setting.updated_at.isoformat() if crew_disabled_setting.updated_at else None,
            "reseller_topup_disabled": reseller_topup_disabled_setting.value_text,
            "reseller_min_topup": reseller_min_topup_setting.value_text,
            "reseller_max_topup": reseller_max_topup_setting.value_text,
            "crew_regular_limit": crew_regular_limit_setting.value_text,
            "crew_rush_limit": crew_rush_limit_setting.value_text,
            "crew_display_limit": crew_display_limit_setting.value_text,
            "crew_display_floor": crew_display_floor_setting.value_text,
            "crew_display_override": crew_display_override_setting.value_text,
            "crew_capacity_reset_at": crew_capacity_reset_setting.value_text or None,
            "crew_capacity_reset_time": crew_capacity_reset_time_setting.value_text or None,
        })

    if request.method == "POST":
        try:
            payload = json.loads(request.body.decode("utf-8"))
        except Exception:
            return JsonResponse({"message": "JSON نامعتبر"}, status=400)
        lira_rate_payload = payload.get("lira_rate", "__missing__")
        if lira_rate_payload != "__missing__":
            try:
                lira_rate = int(lira_rate_payload or 0)
            except Exception:
                return JsonResponse({"message": "مقدار لیر نامعتبر است"}, status=400)
            if lira_rate < 0:
                return JsonResponse({"message": "مقدار لیر نمی‌تواند منفی باشد"}, status=400)
            setting_obj.value_text = str(lira_rate)
            setting_obj.save(update_fields=["value_text", "updated_at"])
        else:
            try:
                lira_rate = int(setting_obj.value_text or "0")
            except Exception:
                lira_rate = 0

        # Optional: announcement bar settings
        announcement_payload = payload.get("announcement_bar")
        announcement_data = None
        announcement_updated_at = None
        if announcement_payload is not None:
            if not isinstance(announcement_payload, dict):
                return JsonResponse({"message": "تنظیمات نوار بالا نامعتبر است"}, status=400)
            announcement_data = _load_announcement_setting()[0]
            merged = {**announcement_data, **announcement_payload}
            # Normalize through helper to apply limits/defaults
            announcement_data, ann_setting_obj = _load_announcement_setting()
            announcement_data.update({
                "enabled": bool(merged.get("enabled", announcement_data["enabled"])),
                "text": (merged.get("text") or "").strip()[:500],
                "link_url": (merged.get("link_url") or "").strip()[:400],
                "bg_color": (merged.get("bg_color") or announcement_data["bg_color"]).strip()[:16],
                "text_color": (merged.get("text_color") or announcement_data["text_color"]).strip()[:16],
                "speed": max(12, min(int(merged.get("speed") or announcement_data["speed"]), 180)),
                "closable": bool(merged.get("closable", announcement_data["closable"])),
            })
            ann_setting_obj.value_text = json.dumps(announcement_data, ensure_ascii=False)
            ann_setting_obj.save(update_fields=["value_text", "updated_at"])
            announcement_updated_at = ann_setting_obj.updated_at.isoformat() if ann_setting_obj.updated_at else None
        else:
            announcement_data, ann_setting_obj = _load_announcement_setting()
            announcement_updated_at = ann_setting_obj.updated_at.isoformat() if ann_setting_obj.updated_at else None

        # Handle crew pack daily limit setting
        crew_limit_enabled = payload.get("crew_daily_limit_enabled")
        crew_limit_updated_at = None
        if crew_limit_enabled is not None:
            crew_limit_setting = _get_setting("crew_daily_limit_enabled", default="true")
            crew_limit_setting.value_text = str(crew_limit_enabled).lower()
            crew_limit_setting.save(update_fields=["value_text", "updated_at"])
            crew_limit_updated_at = crew_limit_setting.updated_at.isoformat() if crew_limit_setting.updated_at else None
        else:
            crew_limit_setting = _get_setting("crew_daily_limit_enabled", default="true")
            crew_limit_updated_at = crew_limit_setting.updated_at.isoformat() if crew_limit_setting.updated_at else None

        # Handle crew pack disabled setting
        crew_disabled = payload.get("crew_pack_disabled")
        crew_disabled_updated_at = None
        if crew_disabled is not None:
            crew_disabled_setting = _get_setting("crew_pack_disabled", default="false")
            crew_disabled_setting.value_text = str(crew_disabled).lower()
            crew_disabled_setting.save(update_fields=["value_text", "updated_at"])
            crew_disabled_updated_at = crew_disabled_setting.updated_at.isoformat() if crew_disabled_setting.updated_at else None
        else:
            crew_disabled_setting = _get_setting("crew_pack_disabled", default="false")
            crew_disabled_updated_at = crew_disabled_setting.updated_at.isoformat() if crew_disabled_setting.updated_at else None

        # Handle crew pack capacity numeric limits
        def _update_int_setting(setting_key: str, payload_key: str, default_value: int) -> str:
            raw = payload.get(payload_key, "__missing__")
            setting_obj = _get_setting(setting_key, default=str(default_value))
            if raw != "__missing__":
                try:
                    val = int(raw)
                except Exception:
                    raise ValueError(f"مقدار {payload_key} نامعتبر است")
                if payload_key not in ("crew_display_override", "reseller_min_topup", "reseller_max_topup") and val < 0:
                    raise ValueError(f"مقدار {payload_key} نمی‌تواند منفی باشد")
                if payload_key in ("reseller_min_topup", "reseller_max_topup") and val < 0:
                    raise ValueError(f"مقدار {payload_key} نمی‌تواند منفی باشد")
                if payload_key == "crew_display_override" and val < -1:
                    raise ValueError(f"مقدار {payload_key} باید -1 یا بزرگ‌تر باشد")
                setting_obj.value_text = str(val)
                setting_obj.save(update_fields=["value_text", "updated_at"])
            return setting_obj.value_text

        # Handle reseller wallet top-up settings
        reseller_topup_disabled = payload.get("reseller_topup_disabled")
        reseller_topup_disabled_value = _get_setting("reseller_topup_disabled", default="false").value_text
        if reseller_topup_disabled is not None:
            setting_obj = _get_setting("reseller_topup_disabled", default="false")
            setting_obj.value_text = str(reseller_topup_disabled).lower()
            setting_obj.save(update_fields=["value_text", "updated_at"])
            reseller_topup_disabled_value = setting_obj.value_text

        try:
            crew_regular_limit_value = _update_int_setting("crew_regular_limit", "crew_regular_limit", 20)
            crew_rush_limit_value = _update_int_setting("crew_rush_limit", "crew_rush_limit", 5)
            crew_display_limit_value = _update_int_setting("crew_display_limit", "crew_display_limit", 50)
            crew_display_floor_value = _update_int_setting("crew_display_floor", "crew_display_floor", CREW_DISPLAY_FLOOR_DEFAULT)
            crew_display_override_value = _update_int_setting("crew_display_override", "crew_display_override", -1)
            reseller_min_topup_value = _update_int_setting("reseller_min_topup", "reseller_min_topup", 10000)
            reseller_max_topup_value = _update_int_setting("reseller_max_topup", "reseller_max_topup", 200000000)
        except ValueError as e:
            return JsonResponse({"message": str(e)}, status=400)

        reset_time_raw = payload.get("crew_capacity_reset_time", "__missing__")
        crew_capacity_reset_time_setting = _get_setting("crew_capacity_reset_time", default="")
        if reset_time_raw != "__missing__":
            normalized_reset_time = _normalize_crew_capacity_reset_time(
                "" if reset_time_raw is None else str(reset_time_raw)
            )
            if normalized_reset_time is None:
                return JsonResponse({"message": "فرمت زمان ریست روزانه نامعتبر است"}, status=400)
            crew_capacity_reset_time_setting.value_text = normalized_reset_time
            crew_capacity_reset_time_setting.save(update_fields=["value_text", "updated_at"])
        crew_capacity_reset_time_value = crew_capacity_reset_time_setting.value_text or None

        # Optional manual reset for today's capacity window
        crew_capacity_reset_at = None
        reset_flag = payload.get("crew_capacity_reset")
        crew_capacity_reset_setting = _get_setting("crew_capacity_reset_at", default="")
        if reset_flag == "now":
            now = timezone.now()
            crew_capacity_reset_setting.value_text = now.isoformat()
            crew_capacity_reset_setting.save(update_fields=["value_text", "updated_at"])
            crew_capacity_reset_at = crew_capacity_reset_setting.value_text
        else:
            crew_capacity_reset_at = crew_capacity_reset_setting.value_text or None

        return JsonResponse({
            "lira_rate": lira_rate,
            "updated_at": setting_obj.updated_at.isoformat() if setting_obj.updated_at else None,
            "announcement_bar": announcement_data,
            "announcement_updated_at": announcement_updated_at,
            "crew_daily_limit_enabled": crew_limit_setting.value_text,
            "crew_daily_limit_updated_at": crew_limit_updated_at,
            "crew_pack_disabled": crew_disabled_setting.value_text,
            "crew_pack_disabled_updated_at": crew_disabled_updated_at,
            "reseller_topup_disabled": reseller_topup_disabled_value,
            "reseller_min_topup": reseller_min_topup_value,
            "reseller_max_topup": reseller_max_topup_value,
            "crew_regular_limit": crew_regular_limit_value,
            "crew_rush_limit": crew_rush_limit_value,
            "crew_display_limit": crew_display_limit_value,
            "crew_display_floor": crew_display_floor_value,
            "crew_display_override": crew_display_override_value,
            "crew_capacity_reset_at": crew_capacity_reset_at,
            "crew_capacity_reset_time": crew_capacity_reset_time_value,
        })

    return HttpResponseNotAllowed(["GET", "POST"])


def public_settings(request):
    """
    Public settings that do not require authentication.
    Exposes announcement bar content و چند تنظیم عمومی کروپک.
    """
    announcement_data, announcement_setting = _load_announcement_setting()
    crew_limit_setting = _get_setting("crew_daily_limit_enabled", default="true")
    crew_regular_limit_setting = _get_setting("crew_regular_limit", default="20")
    crew_rush_limit_setting = _get_setting("crew_rush_limit", default="5")
    crew_display_limit_setting = _get_setting("crew_display_limit", default="50")
    crew_display_floor_setting = _get_setting("crew_display_floor", default=str(CREW_DISPLAY_FLOOR_DEFAULT))
    crew_rush_fee_setting = _get_setting("crew_rush_fee", default="89000")
    rush_fee_setting = _get_setting("rush_fee", default="")
    crew_rush_fee_val = int(crew_rush_fee_setting.value_text)
    try:
        general_rush_fee = int(rush_fee_setting.value_text) if (rush_fee_setting.value_text or "").strip() else crew_rush_fee_val
    except (TypeError, ValueError):
        general_rush_fee = crew_rush_fee_val
    return JsonResponse({
        "announcement_bar": announcement_data,
        "announcement_updated_at": announcement_setting.updated_at.isoformat() if announcement_setting.updated_at else None,
        "crew_daily_limit_enabled": crew_limit_setting.value_text,
        "crew_regular_limit": crew_regular_limit_setting.value_text,
        "crew_rush_limit": crew_rush_limit_setting.value_text,
        "crew_display_limit": crew_display_limit_setting.value_text,
        "crew_display_floor": crew_display_floor_setting.value_text,
        "crew_rush_fee": crew_rush_fee_val,
        "rush_fee": general_rush_fee,
    })


# ---- GTA VI pre-order pricing config -------------------------------------
# In-site checkout uses real Product/ProductVariant rows (price is read from the
# DB to prevent tampering). This config maps each edition×capacity to its
# variant id, mirrors the price for the storefront, and holds the Xbox toggle.
GTA6_CONFIG_KEY = "gta6_config"
GTA6_PRODUCT_SLUG = "gta6"
GTA6_EDITIONS = ("standard", "ultimate")
# Capacity keys are unique across platforms: cap2/cap3/full_ps5 are PS5, home/switch/full are Xbox.
GTA6_CAPACITIES = ("cap2", "cap3", "full_ps5", "home", "switch", "full")


def _gta6_default_config():
    pricing = {
        edition: {
            cap: {"toman": 0, "originalToman": 0, "lira": 0, "cost_toman": 0, "variant_id": None}
            for cap in GTA6_CAPACITIES
        }
        for edition in GTA6_EDITIONS
    }
    return {
        "xbox_enabled": False,
        "product_id": None,
        "pricing": pricing,
        # فعال‌سازی فوری (instant activation) — flat add-on fee, charged via a
        # hidden add-on product so checkout stays anti-tamper safe.
        "instant_enabled": False,
        "instant_fee": 0,
        "instant_product_id": None,
    }


def _gta6_load_config():
    obj = _get_setting(GTA6_CONFIG_KEY, default="")
    config = _gta6_default_config()
    raw = (obj.value_text or "").strip()
    if raw:
        try:
            stored = json.loads(raw)
        except Exception:
            stored = {}
        if isinstance(stored, dict):
            config["xbox_enabled"] = bool(stored.get("xbox_enabled", False))
            config["product_id"] = stored.get("product_id")
            config["instant_enabled"] = bool(stored.get("instant_enabled", False))
            try:
                config["instant_fee"] = max(0, int(stored.get("instant_fee", 0) or 0))
            except Exception:
                config["instant_fee"] = 0
            config["instant_product_id"] = stored.get("instant_product_id")
            stored_pricing = stored.get("pricing") or {}
            for edition in GTA6_EDITIONS:
                ed = stored_pricing.get(edition) or {}
                for cap in GTA6_CAPACITIES:
                    cell = ed.get(cap) or {}
                    try:
                        toman = max(0, int(cell.get("toman", 0) or 0))
                    except Exception:
                        toman = 0
                    try:
                        original = max(0, int(cell.get("originalToman", 0) or 0))
                    except Exception:
                        original = 0
                    try:
                        lira = max(0, int(cell.get("lira", 0) or 0))
                    except Exception:
                        lira = 0
                    try:
                        cost_toman = max(0, int(cell.get("cost_toman", 0) or 0))
                    except Exception:
                        cost_toman = 0
                    config["pricing"][edition][cap] = {
                        "toman": toman,
                        "originalToman": original,
                        "lira": lira,
                        "cost_toman": cost_toman,
                        "variant_id": cell.get("variant_id"),
                    }
    return config, obj


def _gta6_sync_variant_prices(config):
    """Push the config's toman prices onto the mapped ProductVariant rows so
    server-side checkout charges the exact amount shown on the page."""
    for edition in GTA6_EDITIONS:
        for cap in GTA6_CAPACITIES:
            cell = config["pricing"][edition][cap]
            vid = cell.get("variant_id")
            if not vid:
                continue
            try:
                variant = ProductVariant.objects.get(id=vid)
            except ProductVariant.DoesNotExist:
                continue
            variant.price = int(cell.get("toman", 0) or 0)
            variant.original_price = int(cell.get("originalToman", 0) or 0)
            variant.save(update_fields=["price", "original_price"])
    # Keep the hidden instant-activation add-on product priced in sync.
    pid = config.get("instant_product_id")
    if pid:
        try:
            addon = Product.objects.get(id=pid)
            addon.price = int(config.get("instant_fee", 0) or 0)
            addon.save(update_fields=["price"])
        except Product.DoesNotExist:
            pass


@csrf_exempt
def gta6_config(request):
    """GET: public pricing config for the GTA VI page. POST: admin-only update."""
    config, obj = _gta6_load_config()

    if request.method == "GET":
        return JsonResponse({
            **config,
            "updated_at": obj.updated_at.isoformat() if obj.updated_at else None,
        })

    if request.method == "POST":
        if not request.user.is_authenticated:
            return JsonResponse({"detail": "authentication required"}, status=401)
        if not _is_admin_user(request.user):
            return JsonResponse({"detail": "forbidden"}, status=403)
        try:
            payload = json.loads(request.body.decode("utf-8"))
        except Exception:
            return JsonResponse({"message": "JSON نامعتبر"}, status=400)

        if "xbox_enabled" in payload:
            config["xbox_enabled"] = bool(payload.get("xbox_enabled"))
        if "instant_enabled" in payload:
            config["instant_enabled"] = bool(payload.get("instant_enabled"))
        if "instant_fee" in payload:
            try:
                config["instant_fee"] = max(0, int(payload.get("instant_fee", 0) or 0))
            except Exception:
                return JsonResponse({"message": "قیمت فعال‌سازی فوری نامعتبر است"}, status=400)
        incoming = payload.get("pricing") or {}
        for edition in GTA6_EDITIONS:
            ed = incoming.get(edition) or {}
            for cap in GTA6_CAPACITIES:
                if cap not in ed:
                    continue
                cell = ed.get(cap) or {}
                try:
                    toman = max(0, int(cell.get("toman", 0) or 0))
                except Exception:
                    return JsonResponse({"message": f"قیمت نامعتبر در {edition}/{cap}"}, status=400)
                try:
                    original = max(0, int(cell.get("originalToman", 0) or 0))
                except Exception:
                    original = 0
                try:
                    lira = max(0, int(cell.get("lira", 0) or 0))
                except Exception:
                    lira = 0
                try:
                    cost_toman = max(0, int(cell.get("cost_toman", 0) or 0))
                except Exception:
                    cost_toman = 0
                config["pricing"][edition][cap]["toman"] = toman
                config["pricing"][edition][cap]["originalToman"] = original
                config["pricing"][edition][cap]["lira"] = lira
                config["pricing"][edition][cap]["cost_toman"] = cost_toman

        _gta6_sync_variant_prices(config)
        obj.value_text = json.dumps(config, ensure_ascii=False)
        obj.save(update_fields=["value_text", "updated_at"])
        return JsonResponse({
            **config,
            "updated_at": obj.updated_at.isoformat() if obj.updated_at else None,
        })

    return HttpResponseNotAllowed(["GET", "POST"])


def crewpack_capacity(request):
    """
    Public endpoint for Fortnite Crew capacity (standard vs instant activation).
    Returns remaining real capacity و مقدار نمایشی برای بنر موجودی.
    """
    try:
        capacity_window_start = _get_crew_capacity_window_start()

        def _int_setting(key: str, default: int) -> int:
            s = _get_setting(key, default=str(default))
            try:
                value = int(s.value_text)
            except Exception:
                value = int(default)
            if key == "crew_display_override":
                # -1 یعنی غیرفعال؛ مقادیر کمتر از -1 را صفر می‌کنیم
                if value < -1:
                    value = -1
            else:
                if value < 0:
                    value = 0
            return value

        regular_limit = _int_setting("crew_regular_limit", 20)
        rush_limit = _int_setting("crew_rush_limit", 5)
        display_limit = _int_setting("crew_display_limit", 50)
        display_floor = _int_setting("crew_display_floor", CREW_DISPLAY_FLOOR_DEFAULT)
        display_override = _int_setting("crew_display_override", -1)

        today_regular_count = (
            Order.objects.filter(
                items__product__slug=CREW_SLUG,
                created_at__gte=capacity_window_start,
                rush_order=False,
            )
            .exclude(status__in=['canceled', 'refunded'])
            .distinct()
            .count()
        )

        today_rush_count = (
            Order.objects.filter(
                items__product__slug=CREW_SLUG,
                created_at__gte=capacity_window_start,
                rush_order=True,
            )
            .exclude(status__in=['canceled', 'refunded'])
            .distinct()
            .count()
        )

        remaining_regular = max(0, regular_limit - today_regular_count)
        remaining_rush = max(0, rush_limit - today_rush_count)
        total_used = today_regular_count + today_rush_count

        # Display decreases proportionally to مجموع ظرفیت واقعی (regular + instant)
        total_capacity = max(regular_limit + rush_limit, regular_limit, 1)
        ratio = display_limit / total_capacity if total_capacity > 0 else 1
        calculated_display = int(max(0, display_limit - (total_used * ratio)))
        display_stock = calculated_display

        # Manual override (admin)
        if display_override >= 0:
            display_stock = display_override

        # Remaining display capacity for admin panel (same as current display stock)
        remaining_display = max(0, display_stock)

        epic_available = (remaining_regular + remaining_rush) > 0 and display_stock > display_floor

        return JsonResponse({
            "success": True,
            "regular_limit": regular_limit,
            "rush_limit": rush_limit,
            "display_limit": display_limit,
            "display_floor": display_floor,
            "today_regular_count": today_regular_count,
            "today_rush_count": today_rush_count,
            "remaining_regular": remaining_regular,
            "remaining_rush": remaining_rush,
            "remaining_display": remaining_display,
            "display_stock": display_stock,
            "fake_headroom": max(0, display_stock - display_floor),
            "display_cutoff_reached": display_stock <= display_floor,
            "epic_available": epic_available,
            "display_override": display_override if display_override >= 0 else None,
        })
    except Exception as exc:
        return JsonResponse({
            "success": False,
            "message": "خطا در محاسبه ظرفیت کروپک",
            "error": str(exc),
        }, status=500)


def admin_orders(request):
    if not request.user.is_authenticated:
        return JsonResponse({"detail": "authentication required"}, status=401)
    if not _is_admin_user(request.user):
        return JsonResponse({"detail": "forbidden"}, status=403)
    if request.method != 'GET':
        return HttpResponseNotAllowed(['GET'])

    # Optional limit (for performance)
    try:
        limit = int(request.GET.get("limit") or 0)
    except (TypeError, ValueError):
        limit = 0
    if limit <= 0:
        limit = 200
    limit = max(1, min(limit, 1000))

    # Only active / in-progress orders; completed/refunded go to previous buckets, canceled auto-cleaned.
    # Sort by rush_order first (rush orders at the top), then by created_at
    base_qs = Order.objects.exclude(
        status__in=['completed', 'canceled', 'refunded', 'wallet_topup']
    )
    # type=reseller → فقط سفارش‌های همکار
    type_filter = (request.GET.get("type") or "").strip().lower()
    if type_filter == "reseller":
        base_qs = base_qs.filter(is_reseller_order=True)
    elif type_filter == "customer":
        base_qs = base_qs.filter(is_reseller_order=False)
    elif type_filter == "g4a4":
        base_qs = base_qs.filter(items__g4a4_variation__isnull=False).distinct()
    total_count = base_qs.count()
    orders_qs = base_qs.select_related('user').prefetch_related('payments', 'items', 'items__product').order_by('-info_corrected', '-rush_order', '-created_at')[:limit]
    data = [_admin_order_dict(o) for o in orders_qs]
    return JsonResponse({"results": data, "count": total_count})


@csrf_exempt
def admin_unpin_order(request, tracking):
    if not request.user.is_authenticated:
        return JsonResponse({"detail": "authentication required"}, status=401)
    if not _is_admin_user(request.user):
        return JsonResponse({"detail": "forbidden"}, status=403)
    if request.method != 'POST':
        return HttpResponseNotAllowed(['POST'])

    order = get_object_or_404(Order, tracking_code=tracking)
    order.info_corrected = False
    order.save(update_fields=['info_corrected'])
    return JsonResponse({"success": True, "message": "پین سفارش برداشته شد"})


def admin_previous_orders(request):
    if not request.user.is_authenticated:
        return JsonResponse({"detail": "authentication required"}, status=401)
    if not _is_admin_user(request.user):
        return JsonResponse({"detail": "forbidden"}, status=403)
    if request.method != 'GET':
        return HttpResponseNotAllowed(['GET'])

    try:
        limit = int(request.GET.get("limit") or 0)
    except (TypeError, ValueError):
        limit = 0
    if limit <= 0:
        limit = 200
    limit = max(1, min(limit, 1000))

    base_qs = Order.objects.filter(
        status='completed'
    ).exclude(note__icontains="شارژ کیف پول")
    total_count = base_qs.count()
    orders_qs = base_qs.select_related('user').prefetch_related('payments', 'items', 'items__product').order_by('-created_at')[:limit]
    data = [_admin_order_dict(o) for o in orders_qs]
    return JsonResponse({"results": data, "count": total_count})


def admin_refunded_orders(request):
    if not request.user.is_authenticated:
        return JsonResponse({"detail": "authentication required"}, status=401)
    if not _is_admin_user(request.user):
        return JsonResponse({"detail": "forbidden"}, status=403)
    if request.method != 'GET':
        return HttpResponseNotAllowed(['GET'])

    try:
        limit = int(request.GET.get("limit") or 0)
    except (TypeError, ValueError):
        limit = 0
    if limit <= 0:
        limit = 200
    limit = max(1, min(limit, 1000))

    base_qs = Order.objects.filter(
        status='refunded'
    )
    total_count = base_qs.count()
    orders_qs = base_qs.select_related('user').prefetch_related('payments', 'items', 'items__product').order_by('-created_at')[:limit]
    data = [_admin_order_dict(o) for o in orders_qs]
    return JsonResponse({"results": data, "count": total_count})


def admin_canceled_orders(request):
    if not request.user.is_authenticated:
        return JsonResponse({"detail": "authentication required"}, status=401)
    if not _is_admin_user(request.user):
        return JsonResponse({"detail": "forbidden"}, status=403)
    if request.method != 'GET':
        return HttpResponseNotAllowed(['GET'])

    try:
        limit = int(request.GET.get("limit") or 0)
    except (TypeError, ValueError):
        limit = 0
    if limit <= 0:
        limit = 200
    limit = max(1, min(limit, 1000))

    base_qs = Order.objects.filter(
        status='canceled'
    )
    total_count = base_qs.count()
    orders_qs = base_qs.select_related('user').prefetch_related('payments', 'items', 'items__product').order_by('-created_at')[:limit]
    data = [_admin_order_dict(o) for o in orders_qs]
    return JsonResponse({"results": data, "count": total_count})


@csrf_exempt
def admin_delete_order(request, tracking):
    if not request.user.is_authenticated:
        return JsonResponse({"detail": "authentication required"}, status=401)
    if not _is_admin_user(request.user):
        return JsonResponse({"detail": "forbidden"}, status=403)
    if request.method not in ('DELETE', 'POST'):
        return HttpResponseNotAllowed(['DELETE', 'POST'])

    order = get_object_or_404(Order, tracking_code=tracking)
    order.delete()
    return JsonResponse({"success": True, "message": "سفارش حذف شد"})


# ──────────────────────────────────────────────────────────────────────────
# Abandoned cart tracking (سبدهای رها‌شده)
# ──────────────────────────────────────────────────────────────────────────

def _abandoned_cart_dict(c):
    user_obj = c.user
    user_username = user_obj.username if user_obj else ""
    phone_val = c.phone or ""
    if not phone_val and user_obj and hasattr(user_obj, "profile"):
        try:
            phone_val = user_obj.profile.phone_number or ""
        except Exception:
            phone_val = ""
    email_val = c.email or (user_obj.email if user_obj else "")
    return {
        "id": c.id,
        "user_id": c.user_id,
        "user_email": user_obj.email if user_obj else "",
        "user_username": user_username,
        "phone": phone_val,
        "email": email_val,
        "items": c.items,
        "item_count": c.item_count,
        "total_value": c.total_value,
        "last_product_page": c.last_product_page,
        "last_seen_at": c.last_seen_at.isoformat() if c.last_seen_at else None,
        "created_at": c.created_at.isoformat() if c.created_at else None,
        "reminded_at": c.reminded_at.isoformat() if c.reminded_at else None,
        "reminder_count": c.reminder_count,
        "converted_at": c.converted_at.isoformat() if c.converted_at else None,
    }


@csrf_exempt
def cart_sync(request):
    """عمومی — کلاینت سبدش را با debounce اینجا می‌فرستد."""
    if request.method != "POST":
        return HttpResponseNotAllowed(["POST"])
    try:
        body = json.loads(request.body or b"{}")
    except Exception:
        return JsonResponse({"detail": "invalid json"}, status=400)

    items = body.get("items") or []
    session_id = (body.get("session_id") or "").strip()[:64]
    if not session_id:
        return JsonResponse({"detail": "session_id required"}, status=400)

    clean, total = [], 0
    for raw in items:
        if not isinstance(raw, dict):
            continue
        pid = raw.get("product_id")
        if not pid:
            continue
        try:
            qty = max(0, int(raw.get("quantity") or 0))
        except (TypeError, ValueError):
            continue
        if qty <= 0:
            continue
        try:
            price = max(0, int(raw.get("price") or 0))
        except (TypeError, ValueError):
            price = 0
        clean.append({
            "product_id": int(pid),
            "variant_id": raw.get("variant_id") or None,
            "slug": (raw.get("slug") or "")[:220],
            "name": (raw.get("name") or "")[:200],
            "image": (raw.get("image") or "")[:500],
            "price": price,
            "quantity": qty,
        })
        total += price * qty

    user = request.user if request.user.is_authenticated else None
    phone = (body.get("phone") or "").strip()[:15]
    email = (body.get("email") or "").strip()[:254]

    qs = AbandonedCart.objects.all()
    if user:
        qs = qs.filter(user=user)
    else:
        qs = qs.filter(user__isnull=True, session_id=session_id)
    cart = qs.first()

    if not clean:
        if cart:
            cart.delete()
        return JsonResponse({"ok": True, "deleted": bool(cart)})

    if cart is None:
        cart = AbandonedCart(user=user if user else None, session_id=session_id)

    cart.user = user if user else None
    if not user:
        cart.session_id = session_id
    if phone:
        cart.phone = phone
    if email:
        cart.email = email
    cart.items = clean
    cart.item_count = sum(i["quantity"] for i in clean)
    cart.total_value = total
    if body.get("last_product_page"):
        cart.last_product_page = str(body["last_product_page"])[:300]
    if request.META.get("HTTP_USER_AGENT"):
        cart.user_agent = request.META["HTTP_USER_AGENT"][:240]
    if request.META.get("REMOTE_ADDR"):
        try:
            cart.last_ip = request.META["REMOTE_ADDR"]
        except Exception:
            pass
    if cart.converted_at:
        return JsonResponse({"ok": True, "cart_id": cart.id, "already_converted": True})
    cart.save()
    return JsonResponse({"ok": True, "cart_id": cart.id})


@csrf_exempt
def admin_abandoned_carts(request):
    if not request.user.is_authenticated or not _is_admin_user(request.user):
        return JsonResponse({"detail": "forbidden"}, status=403)
    if request.method != "GET":
        return HttpResponseNotAllowed(["GET"])

    only_active = (request.GET.get("only_active") or "1") == "1"
    qs = AbandonedCart.objects.all()
    if only_active:
        qs = qs.filter(converted_at__isnull=True)

    search = (request.GET.get("q") or "").strip()
    if search:
        qs = qs.filter(
            Q(phone__icontains=search)
            | Q(email__icontains=search)
            | Q(user__username__icontains=search)
            | Q(user__email__icontains=search)
        )

    total = qs.count()
    try:
        limit = max(1, min(int(request.GET.get("limit") or 200), 1000))
    except ValueError:
        limit = 200
    rows = qs.select_related("user").order_by("-last_seen_at")[:limit]
    return JsonResponse({
        "results": [_abandoned_cart_dict(r) for r in rows],
        "count": total,
    })


@csrf_exempt
def admin_abandoned_cart_remind(request, cart_id):
    if not request.user.is_authenticated or not _is_admin_user(request.user):
        return JsonResponse({"detail": "forbidden"}, status=403)
    if request.method != "POST":
        return HttpResponseNotAllowed(["POST"])

    cart = get_object_or_404(AbandonedCart, id=cart_id)
    if cart.converted_at:
        return JsonResponse(
            {"ok": False, "message": "این سبد قبلاً به سفارش تبدیل شده."},
            status=400,
        )
    if cart.reminded_at:
        return JsonResponse(
            {"ok": False, "message": "برای این سبد قبلاً یادآوری ارسال شده."},
            status=429,
        )

    # resolve phone/email/name
    phone = (cart.phone or "").strip()
    if not phone and cart.user and hasattr(cart.user, "profile"):
        try:
            phone = (cart.user.profile.phone_number or "").strip()
        except Exception:
            phone = ""
    email = (cart.email or "").strip() or (cart.user.email if cart.user else "")

    if not phone and not email:
        return JsonResponse(
            {"ok": False, "message": "شماره و ایمیل هیچ‌کدام موجود نیست."},
            status=400,
        )

    site_url = getattr(settings, "SITE_URL", "https://jinxfamily.ir")

    name = ""
    if cart.user:
        name = (getattr(cart.user, "first_name", "") or "").strip()
        if not name:
            name = (getattr(cart.user, "username", "") or "").strip()

    sent = {"sms": False, "email": False, "sms_msg": "", "email_msg": ""}

    if phone:
        ok, msg = KavenegarService.send_abandoned_cart_sms(phone, name)
        sent["sms"] = ok
        sent["sms_msg"] = msg

    if email:
        ok = email_service.send_abandoned_cart_email(
            email, cart.items, cart.total_value, site_url
        )
        sent["email"] = bool(ok)
        sent["email_msg"] = "ارسال شد" if ok else "ناموفق"

    cart.reminded_at = timezone.now()
    cart.reminder_count = (cart.reminder_count or 0) + 1
    cart.save(update_fields=["reminded_at", "reminder_count"])

    return JsonResponse({"ok": True, **sent})


@csrf_exempt
def admin_abandoned_cart_delete(request, cart_id):
    if not request.user.is_authenticated or not _is_admin_user(request.user):
        return JsonResponse({"detail": "forbidden"}, status=403)
    if request.method not in ("DELETE", "POST"):
        return HttpResponseNotAllowed(["DELETE", "POST"])
    get_object_or_404(AbandonedCart, id=cart_id).delete()
    return JsonResponse({"ok": True})


@csrf_exempt
def admin_refund_notify(request, tracking):
    if not request.user.is_authenticated:
        return JsonResponse({"detail": "authentication required"}, status=401)
    if not _is_admin_user(request.user):
        return JsonResponse({"detail": "forbidden"}, status=403)
    if request.method != "POST":
        return HttpResponseNotAllowed(["POST"])

    order = get_object_or_404(Order, tracking_code=tracking)

    previous_status = order.status
    if previous_status != "refunded":
        order.status = "refunded"
        
        # 1. Update latest payment to refunded
        latest_payment = order.payments.order_by("-created_at").first()
        if latest_payment and latest_payment.status != "refunded":
            latest_payment.status = "refunded"
            latest_payment.save(update_fields=["status"])
            
        # 2. Refund the amount to the user as diamonds (wallet cash-back is retired)
        total_paid = (order.amount or 0)
        if total_paid > 0 and order.user:
            from .rewards import award_points, toman_to_diamonds_ceil
            award_points(
                order.user, toman_to_diamonds_ceil(total_paid), "adjust",
                related_order=order, note=f"استرداد سفارش {order.tracking_code} به کوین",
            )

        # 3. Maintain global completed orders counter
        if previous_status == "completed":
            _increment_setting_int("completed_orders_count", delta=-1, default=907)
            
        order.save(update_fields=["status"])

    # Prepare customer info
    customer_email = ""
    customer_name = ""
    latest_payment = order.payments.order_by("-created_at").first()
    if order.user:
        customer_email = order.user.email or ""
        customer_name = order.user.get_full_name() or order.user.username or ""
    if not customer_email and "@" in (order.epic_username or ""):
        customer_email = order.epic_username
    if not customer_name:
        customer_name = "مشتری جینکس فمیلی"
    # For reseller orders, route the notification to the reseller instead.
    customer_email = _order_notify_email(order) or customer_email

    # Email content
    email_subject = "اعتبار ریفاند به کیف پول شما اضافه شد"
    email_body_text = f"""{customer_name} عزیز،
مبلغ {refund_result.get('credit_added', 0):,} تومان بابت ریفاند سفارش {order.tracking_code} به اعتبار کیف پول شما اضافه شد.
این اعتبار در checkout قابل استفاده است و تا سقف مبلغ سفارش از پرداخت کم می‌شود.
"""
    email_body_html = f"""
    <div style="direction:rtl;font-family:Tahoma, Arial,sans-serif;">
      <p>{customer_name} عزیز،</p>
      <p>مبلغ <b>{refund_result.get('credit_added', 0):,} تومان</b> بابت ریفاند سفارش <b>{order.tracking_code}</b> به اعتبار کیف پول شما اضافه شد.</p>
      <p>این اعتبار در checkout قابل استفاده است و تا سقف مبلغ سفارش از پرداخت کم می‌شود.</p>
      <p style="margin-top:12px;font-size:13px;color:#64748b;">
        لطفاً از تماس یا مراجعه بی‌مورد به پشتیبانی خودداری کنید؛ این کار تنها باعث تعویق سفارش شما و سایرین خواهد شد.<br/>
        تیم جینکس فمیلی
      </p>
    </div>
    """
    email_sent = False
    email_error = ""
    if customer_email:
        sent = send_status_update_email(customer_email, email_subject, email_body_html, email_body_text)
        email_sent = bool(sent)
        if not sent:
            email_error = "ارسال ایمیل ناموفق بود."
    else:
        email_error = "ایمیل مشتری موجود نیست."

    # SMS via Kavenegar template jinxfamily-refund-request (توکن‌ها: %token = نام، %token2 = نام‌خانوادگی)
    sms_sent = False
    sms_error = ""
    phone = _order_notify_phone(order)
    if phone:
        customer_label = customer_name or "مشتری"
        need_text = ""
        ok, sms_msg = KavenegarService.send_status_sms(
            phone_number=phone,
            customer_name=customer_label,
            status_fa=need_text,
            template_name="jinxfamily-refund-request",
            include_status_token=False,
        )
        sms_sent = bool(ok)
        if not ok:
            sms_error = sms_msg
    else:
        sms_error = "شماره تماس ثبت نشده است."

    return JsonResponse({
        "tracking_code": order.tracking_code,
        "refund": refund_result,
        "email_sent": email_sent,
        "email_error": email_error,
        "sms_sent": sms_sent,
        "sms_error": sms_error,
    })


@csrf_exempt
def admin_create_custom_dollar_order(request):
    """
    Create a custom order for foreign customers paying in USD.
    Only accessible by admin user 09339732325.
    """
    if not request.user.is_authenticated:
        return JsonResponse({"detail": "authentication required"}, status=401)
    if not _is_admin_user(request.user):
        return JsonResponse({"detail": "forbidden"}, status=403)

    # Only allow specific admin to create dollar orders
    if request.user.username != "09339732325":
        return JsonResponse({"message": "فقط ادمین اصلی می‌تواند سفارش دلاری ثبت کند"}, status=403)

    if request.method != "POST":
        return HttpResponseNotAllowed(["POST"])

    try:
        payload = json.loads(request.body.decode("utf-8"))
    except Exception:
        return JsonResponse({"message": "JSON نامعتبر"}, status=400)

    dollar_amount = payload.get("dollar_amount")
    toman_amount = payload.get("toman_amount")
    dollar_rate = payload.get("dollar_rate")
    customer_name = payload.get("customer_name", "")
    customer_email = payload.get("customer_email", "")
    customer_phone = payload.get("customer_phone", "")
    description = payload.get("description", "")

    if not dollar_amount or not toman_amount or not description:
        return JsonResponse({"message": "مبلغ دلاری، معادل تومانی و توضیحات الزامی هستند"}, status=400)

    try:
        dollar_amount = float(dollar_amount)
        toman_amount = int(toman_amount)
        dollar_rate = int(dollar_rate) if dollar_rate else 0
    except (ValueError, TypeError):
        return JsonResponse({"message": "مقادیر عددی نامعتبر"}, status=400)

    if dollar_amount <= 0 or toman_amount <= 0:
        return JsonResponse({"message": "مبلغ باید بزرگتر از صفر باشد"}, status=400)

    # Create the order with status 'paid' (since payment was done externally in USD)
    order = Order(
        user=request.user,  # Admin user creates the order
        status="paid",
        epic_username=customer_email or customer_name or "Foreign Customer",
        phone=customer_phone or "USD Payment",
        telegram=customer_phone if customer_phone and "@" in customer_phone else "",
        note=f"💵 سفارش دلاری\nمبلغ: ${dollar_amount:.2f}\nنرخ تبدیل: {dollar_rate:,} تومان\nتوضیحات: {description}\nمشتری: {customer_name}\nایمیل: {customer_email}\nتماس: {customer_phone}",
        amount=toman_amount,
        wallet_used=0,
        is_test_order=False,
    )
    order.save()

    # Create a generic order item for the dollar payment
    from .models import Product

    # Try to find a generic product or create a placeholder item
    try:
        generic_product = Product.objects.filter(active=True).first()
        if generic_product:
            OrderItem.objects.create(
                order=order,
                product=generic_product,
                variant=None,
                name=f"سفارش دلاری - {description[:50]}",
                price=toman_amount,
                quantity=1,
            )
    except Exception as e:
        logging.warning(f"Could not create order item for custom dollar order: {e}")

    return JsonResponse({
        "success": True,
        "tracking_code": order.tracking_code,
        "message": f"سفارش دلاری با کد {order.tracking_code} ثبت شد",
        "dollar_amount": dollar_amount,
        "toman_amount": toman_amount,
    })


def admin_notifications(request):
    if not request.user.is_authenticated:
        return JsonResponse({"detail": "authentication required"}, status=401)
    if not _is_admin_user(request.user):
        return JsonResponse({"detail": "forbidden"}, status=403)

    try:
        limit = int(request.GET.get("limit") or 0)
    except (TypeError, ValueError):
        limit = 0
    try:
        offset = int(request.GET.get("offset") or 0)
    except (TypeError, ValueError):
        offset = 0
    search = (request.GET.get("search") or request.GET.get("q") or "").strip()
    if limit <= 0:
        limit = 200
    limit = max(1, min(limit, 1000))
    offset = max(0, offset)

    base_qs = NotificationLog.objects.all().order_by("-created_at", "-id")
    if search:
        base_qs = base_qs.filter(
            Q(channel__icontains=search)
            | Q(target__icontains=search)
            | Q(template__icontains=search)
            | Q(message__icontains=search)
            | Q(context__icontains=search)
        )
    total_count = base_qs.count()
    logs = list(base_qs[offset:offset + limit])
    results = [
        {
            "id": log.id,
            "channel": log.channel,
            "target": log.target,
            "template": log.template,
            "success": log.success,
            "message": log.message,
            "context": log.context,
            "created_at": log.created_at.isoformat(),
        }
        for log in logs
    ]
    return JsonResponse({
        "results": results,
        "count": total_count,
        "limit": limit,
        "offset": offset,
        "has_more": offset + limit < total_count,
        "search": search,
    })


def admin_kavenegar_health(request):
    """Return a read-only Kavenegar credential/service health result for admins."""
    if not request.user.is_authenticated:
        return JsonResponse({"detail": "authentication required"}, status=401)
    if not _is_admin_user(request.user):
        return JsonResponse({"detail": "forbidden"}, status=403)

    result = KavenegarService.health_check()
    result["provider"] = "kavenegar"
    result["checked_at"] = timezone.now().isoformat()
    return JsonResponse(result)


@csrf_exempt
def admin_products(request):
    if not request.user.is_authenticated:
        return JsonResponse({"detail": "authentication required"}, status=401)
    if not _is_admin_user(request.user):
        return JsonResponse({"detail": "forbidden"}, status=403)

    if request.method == 'GET':
        try:
            limit = int(request.GET.get("limit") or 0)
        except (TypeError, ValueError):
            limit = 0
        if limit <= 0:
            limit = 300
        limit = max(1, min(limit, 1000))

        products = Product.objects.prefetch_related('variants').order_by('-active', 'display_order', '-created_at')[:limit]
        data = [_admin_product_dict(p) for p in products]
        return JsonResponse({"results": data})

    if request.method == 'POST':
        try:
            payload = json.loads(request.body.decode('utf-8'))
        except Exception:
            return JsonResponse({"message": "JSON نامعتبر"}, status=400)

        try:
            updates = _build_product_updates(payload, require_name=True)
        except ValueError as exc:
            return JsonResponse({"message": str(exc)}, status=400)

        if not updates.get("slug"):
            updates["slug"] = slugify(updates["name_fa"], allow_unicode=True)
        if not updates.get("slug"):
            return JsonResponse({"message": "اسلاگ محصول نامعتبر است"}, status=400)
        if Product.objects.filter(slug=updates["slug"]).exists():
            return JsonResponse({"message": "اسلاگ محصول تکراری است"}, status=400)

        max_order = Product.objects.aggregate(models_max=Max("display_order"))["models_max"] or 0
        product = Product.objects.create(
            name_fa=updates["name_fa"],
            slug=updates["slug"],
            subtitle=updates.get("subtitle", ""),
            category=updates.get("category", "FORTNITE"),
            subcategory=updates.get("subcategory", ""),
            image_url=updates.get("image_url", ""),
            cover_16_9=updates.get("cover_16_9", ""),
            price=updates.get("price", 0),
            original_price=updates.get("original_price", 0),
            price_lira=updates.get("price_lira", 0),
            active=updates.get("active", True),
            ordering_disabled=updates.get("ordering_disabled", False),
            daily_order_limit=updates.get("daily_order_limit", 0),
            reseller_ordering_disabled=updates.get("reseller_ordering_disabled", False),
            customer_ordering_disabled=updates.get("customer_ordering_disabled", False),
            reseller_daily_order_limit=updates.get("reseller_daily_order_limit", 0),
            customer_daily_order_limit=updates.get("customer_daily_order_limit", 0),
            description=updates.get("description", ""),
            delivery_text=updates.get("delivery_text", ""),
            faq=updates.get("faq", []),
            custom_fields=updates.get("custom_fields", []),
            requires_2fa=updates.get("requires_2fa", False),
            disable_2fa_text=updates.get("disable_2fa_text", ""),
            disable_2fa_color=updates.get("disable_2fa_color", "amber"),
            jinx_image=updates.get("jinx_image", ""),
            jinx_text=updates.get("jinx_text", ""),
            display_order=int(max_order) + 1000,
        )
        return JsonResponse(_admin_product_dict(product), status=201)

    return HttpResponseNotAllowed(['GET', 'POST'])


@csrf_exempt
def admin_product_detail(request, product_id: int):
    if not request.user.is_authenticated:
        return JsonResponse({"detail": "authentication required"}, status=401)
    if not _is_admin_user(request.user):
        return JsonResponse({"detail": "forbidden"}, status=403)

    try:
        product = Product.objects.prefetch_related('variants').get(id=product_id)
    except Product.DoesNotExist:
        return JsonResponse({"message": "محصول یافت نشد"}, status=404)

    if request.method == 'PATCH':
        try:
            payload = json.loads(request.body.decode('utf-8'))
        except Exception:
            return JsonResponse({"message": "JSON نامعتبر"}, status=400)

        try:
            updates = _build_product_updates(payload)
        except ValueError as exc:
            return JsonResponse({"message": str(exc)}, status=400)

        if "slug" in updates and updates["slug"]:
            if Product.objects.filter(slug=updates["slug"]).exclude(id=product.id).exists():
                return JsonResponse({"message": "اسلاگ محصول تکراری است"}, status=400)

        variants_payload = payload.get("variants") or []
        variant_errors = []
        if variants_payload:
            for vp in variants_payload:
                try:
                    var_id = int(vp.get("id"))
                    new_price = int(vp.get("price") or 0)
                    new_original = int(vp.get("original_price") or 0)
                except Exception:
                    variant_errors.append("آیدی/مبلغ نامعتبر برای واریانت")
                    continue
                if new_price < 0:
                    variant_errors.append(f"مبلغ منفی برای واریانت {var_id}")
                    continue
                if new_original < 0:
                    variant_errors.append(f"قیمت اصلی منفی برای واریانت {var_id}")
                    continue
                try:
                    variant = product.variants.get(id=var_id)
                    variant.price = new_price
                    variant.original_price = new_original
                    update_fields = ["price", "original_price"]
                    if "title" in vp:
                        title = _clean_product_text(vp.get("title"), 120)
                        if not title:
                            variant_errors.append(f"عنوان خالی برای واریانت {var_id}")
                        else:
                            variant.title = title
                            update_fields.append("title")
                    if "group_fa" in vp:
                        variant.group_fa = _clean_product_text(vp.get("group_fa"), 120)
                        update_fields.append("group_fa")
                    if "sort_order" in vp:
                        try:
                            variant.sort_order = max(0, int(vp.get("sort_order") or 0))
                            update_fields.append("sort_order")
                        except Exception:
                            pass
                    variant.save(update_fields=update_fields)
                except ProductVariant.DoesNotExist:
                    variant_errors.append(f"واریانت {var_id} یافت نشد")

        for vp in payload.get("new_variants") or []:
            title = _clean_product_text(vp.get("title"), 120)
            if not title:
                variant_errors.append("عنوان واریانت جدید الزامی است")
                continue
            try:
                price = max(0, int(vp.get("price") or 0))
                original = max(0, int(vp.get("original_price") or 0))
                sort_order = max(0, int(vp.get("sort_order") or 0))
            except Exception:
                variant_errors.append(f"مبلغ نامعتبر برای واریانت جدید «{title}»")
                continue
            ProductVariant.objects.create(
                product=product,
                title=title,
                group_fa=_clean_product_text(vp.get("group_fa"), 120),
                price=price,
                original_price=original,
                sort_order=sort_order,
            )

        for raw_id in payload.get("deleted_variant_ids") or []:
            try:
                var_id = int(raw_id)
                variant = product.variants.get(id=var_id)
                variant.delete()
            except ProductVariant.DoesNotExist:
                continue
            except Exception:
                variant_errors.append(f"واریانت {raw_id} حذف نشد (سفارش ثبت‌شده دارد)")

        if updates:
            for k, v in updates.items():
                setattr(product, k, v)
            product.save(update_fields=list(updates.keys()))

        # The Crew Pack storefront always sells a selected duration variant.
        # Keep its default (one-month/first) variant in sync when an admin
        # changes the product's base price, including through the full editor.
        # Other variant-based products deliberately retain their own prices.
        if product.slug == CREW_SLUG and "price" in updates:
            default_variant = product.variants.order_by("sort_order", "id").first()
            if default_variant and default_variant.price != product.price:
                default_variant.price = product.price
                default_variant.save(update_fields=["price"])

        resp = _admin_product_dict(product)
        if variant_errors:
            resp["variant_errors"] = variant_errors
        return JsonResponse(resp)

    if request.method == 'DELETE':
        product.delete()
        return JsonResponse({"ok": True, "deleted_id": product_id})

    return HttpResponseNotAllowed(['PATCH', 'DELETE'])


@csrf_exempt
def admin_subcategories(request):
    if not request.user.is_authenticated:
        return JsonResponse({"detail": "authentication required"}, status=401)
    if not _is_admin_user(request.user):
        return JsonResponse({"detail": "forbidden"}, status=403)

    if request.method == 'GET':
        cat = (request.GET.get('category') or '').strip()
        qs = SubCategory.objects.all()
        if cat:
            qs = qs.filter(category=cat)
        data = [
            {
                "id": sc.id,
                "key": sc.key,
                "label": sc.label,
                "category": sc.category,
                "display_order": sc.display_order,
                "created_at": sc.created_at.isoformat(),
            }
            for sc in qs
        ]
        return JsonResponse({"results": data})

    if request.method == 'POST':
        try:
            payload = json.loads(request.body.decode('utf-8'))
        except Exception:
            return JsonResponse({"message": "JSON نامعتبر"}, status=400)

        key = _clean_product_text(payload.get("key"), 50)
        label = _clean_product_text(payload.get("label"), 100)
        category = _clean_product_category(payload.get("category"))
        if not key or not label:
            return JsonResponse({"message": "کلید و نام زیردسته الزامی است"}, status=400)

        sc, created = SubCategory.objects.get_or_create(
            key=key, category=category,
            defaults={"label": label, "display_order": payload.get("display_order", 0)},
        )
        if not created:
            return JsonResponse({"message": "این زیردسته قبلاً ثبت شده است"}, status=409)

        return JsonResponse({
            "id": sc.id, "key": sc.key, "label": sc.label,
            "category": sc.category, "display_order": sc.display_order,
        }, status=201)

    return HttpResponseNotAllowed(['GET', 'POST'])


@csrf_exempt
def admin_subcategory_detail(request, pk):
    if not request.user.is_authenticated:
        return JsonResponse({"detail": "authentication required"}, status=401)
    if not _is_admin_user(request.user):
        return JsonResponse({"detail": "forbidden"}, status=403)

    try:
        sc = SubCategory.objects.get(id=pk)
    except SubCategory.DoesNotExist:
        return JsonResponse({"message": "زیردسته یافت نشد"}, status=404)

    if request.method == 'PATCH':
        try:
            payload = json.loads(request.body.decode('utf-8'))
        except Exception:
            return JsonResponse({"message": "JSON نامعتبر"}, status=400)

        if "key" in payload:
            sc.key = _clean_product_text(payload["key"], 50) or sc.key
        if "label" in payload:
            sc.label = _clean_product_text(payload["label"], 100) or sc.label
        if "category" in payload:
            sc.category = _clean_product_category(payload.get("category"))
        if "display_order" in payload:
            sc.display_order = int(payload["display_order"])
        sc.save()

        return JsonResponse({
            "id": sc.id, "key": sc.key, "label": sc.label,
            "category": sc.category, "display_order": sc.display_order,
        })

    if request.method == 'DELETE':
        # Unset subcategory for products using this subcategory key
        Product.objects.filter(
            category=sc.category, subcategory=sc.key
        ).update(subcategory="")
        sc.delete()
        return JsonResponse({"ok": True, "deleted_id": pk})

    return HttpResponseNotAllowed(['PATCH', 'DELETE'])


@csrf_exempt
def admin_product_cover(request, product_id: int):
    if not request.user.is_authenticated:
        return JsonResponse({"detail": "authentication required"}, status=401)
    if not _is_admin_user(request.user):
        return JsonResponse({"detail": "forbidden"}, status=403)
    if request.method != 'POST':
        return HttpResponseNotAllowed(['POST'])

    product = get_object_or_404(Product, id=product_id)
    uploaded = request.FILES.get("cover") or request.FILES.get("image") or request.FILES.get("file")
    if not uploaded:
        return JsonResponse({"message": "فایل تصویر ارسال نشده است"}, status=400)

    max_size = 5 * 1024 * 1024
    if uploaded.size > max_size:
        return JsonResponse({"message": "حجم تصویر نباید بیشتر از ۵ مگابایت باشد"}, status=400)
    if uploaded.content_type and not uploaded.content_type.startswith("image/"):
        return JsonResponse({"message": "فایل انتخاب شده تصویر نیست"}, status=400)

    try:
        path = _product_cover_upload_path(product, uploaded)
    except ValueError as exc:
        return JsonResponse({"message": str(exc)}, status=400)

    saved_path = default_storage.save(path, uploaded)
    product.image_url = f"{settings.MEDIA_URL}{saved_path}".replace("//", "/")
    product.save(update_fields=["image_url"])

    return JsonResponse(_admin_product_dict(product))


@csrf_exempt
def admin_product_cover_16_9(request, product_id: int):
    if not request.user.is_authenticated:
        return JsonResponse({"detail": "authentication required"}, status=401)
    if not _is_admin_user(request.user):
        return JsonResponse({"detail": "forbidden"}, status=403)
    if request.method != 'POST':
        return HttpResponseNotAllowed(['POST'])

    product = get_object_or_404(Product, id=product_id)
    uploaded = request.FILES.get("cover") or request.FILES.get("image") or request.FILES.get("file")
    if not uploaded:
        return JsonResponse({"message": "فایل تصویر ارسال نشده است"}, status=400)

    max_size = 5 * 1024 * 1024
    if uploaded.size > max_size:
        return JsonResponse({"message": "حجم تصویر نباید بیشتر از ۵ مگابایت باشد"}, status=400)
    if uploaded.content_type and not uploaded.content_type.startswith("image/"):
        return JsonResponse({"message": "فایل انتخاب شده تصویر نیست"}, status=400)

    try:
        path = _product_cover_upload_path(product, uploaded)
    except ValueError as exc:
        return JsonResponse({"message": str(exc)}, status=400)

    saved_path = default_storage.save(path, uploaded)
    product.cover_16_9 = f"{settings.MEDIA_URL}{saved_path}".replace("//", "/")
    product.save(update_fields=["cover_16_9"])

    return JsonResponse(_admin_product_dict(product))


@csrf_exempt
def admin_products_reorder(request):
    """
    Bulk update the display_order of products for the homepage showcase.
    Accepts JSON body: {"order": [{"id": 12, "display_order": 0}, ...]}
    or {"order": [12, 7, 3, ...]} (list of IDs in the new order).
    """
    if not request.user.is_authenticated:
        return JsonResponse({"detail": "authentication required"}, status=401)
    if not _is_admin_user(request.user):
        return JsonResponse({"detail": "forbidden"}, status=403)
    if request.method != 'POST':
        return HttpResponseNotAllowed(['POST'])

    try:
        payload = json.loads(request.body.decode('utf-8'))
    except Exception:
        return JsonResponse({"message": "JSON نامعتبر"}, status=400)

    order = payload.get("order") if isinstance(payload, dict) else None
    if not isinstance(order, list) or not order:
        return JsonResponse({"message": "فیلد order باید آرایه‌ای غیرخالی باشد"}, status=400)

    base = 1000
    updates_count = 0
    with transaction.atomic():
        for index, item in enumerate(order):
            if isinstance(item, dict):
                try:
                    pid = int(item.get("id"))
                except (TypeError, ValueError):
                    continue
                desired_raw = item.get("display_order")
                try:
                    desired = int(desired_raw) if desired_raw is not None else (base + index)
                except (TypeError, ValueError):
                    desired = base + index
            else:
                try:
                    pid = int(item)
                except (TypeError, ValueError):
                    continue
                desired = base + index
            if not Product.objects.filter(id=pid).exists():
                continue
            Product.objects.filter(id=pid).update(display_order=max(0, int(desired)))
            updates_count += 1

    return JsonResponse({"ok": True, "updated": updates_count})


@csrf_exempt
def admin_product_ai_fill(request):
    """
    POST /api/admin/products/ai-fill
    Body: {name_fa, category, hint?}
    Returns a structured product-content draft via the AI service.
    """
    if not request.user.is_authenticated:
        return JsonResponse({"detail": "authentication required"}, status=401)
    if not _is_admin_user(request.user):
        return JsonResponse({"detail": "forbidden"}, status=403)
    if request.method != 'POST':
        return HttpResponseNotAllowed(['POST'])

    try:
        payload = json.loads(request.body.decode('utf-8'))
    except Exception:
        return JsonResponse({"message": "JSON نامعتبر"}, status=400)

    name_fa = str(payload.get("name_fa") or "").strip()
    if not name_fa:
        return JsonResponse({"message": "نام محصول الزامی است"}, status=400)
    category = str(payload.get("category") or "FORTNITE").strip().upper()
    if category not in {c[0] for c in Product.CATEGORY_CHOICES}:
        category = "FORTNITE"
    hint = str(payload.get("hint") or "").strip()

    from . import product_ai
    draft = product_ai.generate_product_draft(name_fa, category, hint)
    return JsonResponse({"ok": True, "draft": draft})


def _send_order_status_sms_if_changed(order, status, previous_status):
    """Sends SMS to the customer or reseller when order status changes."""
    if status == previous_status:
        return False, "Status not changed"

    if getattr(order, "is_reseller_order", False):
        try:
            phone = order.user.reseller_profile.contact_phone or ""
        except Exception:
            phone = ""
    else:
        phone = order.phone or ""

    if not phone:
        return False, "شماره تماس ثبت نشده است."

    customer_name = ""
    if getattr(order, "is_reseller_order", False):
        try:
            customer_name = order.user.reseller_profile.support_name or ""
        except Exception:
            pass
    if not customer_name and order.user:
        customer_name = order.user.get_full_name() or order.user.username or ""
    if not customer_name:
        customer_name = "مشتری جینکس فمیلی"

    ok = False
    sms_msg = ""

    if status == "completed":
        status_text = dict(Order.STATUS_CHOICES).get(status, status)
        ok, sms_msg = KavenegarService.send_status_sms(
            phone_number=phone,
            customer_name=customer_name,
            status_fa=status_text,
            template_name="jinxfamily-order-done",
            include_status_token=False,
        )
    elif status == "invalid_info":
        ok, sms_msg = KavenegarService.send_status_sms(
            phone_number=phone,
            customer_name=customer_name,
            status_fa="",
            template_name="jinxfamily-wrong-details",
            include_status_token=False,
        )
    elif status in ("needs_2fa", "needs_tr_region"):
        ok, sms_msg = KavenegarService.send_status_sms(
            phone_number=phone,
            customer_name=customer_name,
            status_fa="رسیدگی",
            template_name="jinxfamily-alert",
            include_status_token=True,
        )
    else:
        status_fa = dict(Order.STATUS_CHOICES).get(status, status)
        ok, sms_msg = KavenegarService.send_status_sms(
            phone_number=phone,
            customer_name=customer_name,
            status_fa=status_fa,
            template_name="jinxfamily-alert",
            include_status_token=True,
        )

    return ok, sms_msg


def _send_account_status_sms_if_changed(account, status, previous_status):
    """Sends SMS to the reseller when an account/unit status changes."""
    if status == previous_status:
        return False, "Status not changed"

    order = account.item.order
    # Only send to resellers
    if not getattr(order, "is_reseller_order", False):
        return False, "Not a reseller order"

    try:
        phone = order.user.reseller_profile.contact_phone or ""
    except Exception:
        phone = ""

    if not phone:
        return False, "شماره تماس ثبت نشده است."

    customer_name = ""
    try:
        customer_name = order.user.reseller_profile.support_name or ""
    except Exception:
        pass
    if not customer_name and order.user:
        customer_name = order.user.get_full_name() or order.user.username or ""
    if not customer_name:
        customer_name = "همکار گرامی"

    ok = False
    sms_msg = ""

    if status == "completed":
        ok, sms_msg = KavenegarService.send_status_sms(
            phone_number=phone,
            customer_name=customer_name,
            status_fa="",
            template_name="jinxfamily-order-done",
            include_status_token=False,
        )
    elif status == "invalid_info":
        ok, sms_msg = KavenegarService.send_status_sms(
            phone_number=phone,
            customer_name=customer_name,
            status_fa="",
            template_name="jinxfamily-wrong-details",
            include_status_token=False,
        )
    elif status in ("needs_2fa", "needs_tr_region"):
        ok, sms_msg = KavenegarService.send_status_sms(
            phone_number=phone,
            customer_name=customer_name,
            status_fa="رسیدگی",
            template_name="jinxfamily-alert",
            include_status_token=True,
        )
    else:
        ok, sms_msg = KavenegarService.send_status_sms(
            phone_number=phone,
            customer_name=customer_name,
            status_fa="رسیدگی",
            template_name="jinxfamily-alert",
            include_status_token=True,
        )

    return ok, sms_msg


@csrf_exempt
def admin_update_account_status(request, account_id: int):
    if not request.user.is_authenticated:
        return JsonResponse({"detail": "authentication required"}, status=401)
    if not _is_admin_user(request.user):
        return JsonResponse({"detail": "forbidden"}, status=403)
    if request.method != 'POST':
        return HttpResponseNotAllowed(['POST'])

    account = get_object_or_404(OrderItemAccount, id=account_id)
    try:
        payload = json.loads(request.body.decode("utf-8"))
        status = (payload.get("status") or "").strip().lower()
        if not status:
            return JsonResponse({"message": "وضعیت الزامی است."}, status=400)
        
        previous_status = account.status
        account.status = status[:16]
        
        # Save optional xbox_email and xbox_password if provided
        xbox_email = (payload.get("xbox_email") or "").strip()
        xbox_password = (payload.get("xbox_password") or "").strip()
        update_fields_acc = ["status", "updated_at"]
        if xbox_email:
            account.xbox_email = xbox_email
            update_fields_acc.append("xbox_email")
        if xbox_password:
            account.xbox_password = xbox_password
            update_fields_acc.append("xbox_password")
            
        account.save(update_fields=update_fields_acc)
        
        sms_sent = False
        sms_error = None
        
        # Unit states are independent from the overall reseller-order state.
        #
        # In particular, an exception on one unit (for example ``invalid_info``)
        # must not move the entire order to that exception state: the reseller
        # still needs to see and act on the affected unit, while the order stays
        # in its admin-managed workflow.  The only safe aggregate transition is
        # completion, and that can happen only after every unit is completed.
        order = account.item.order
        all_accounts = list(OrderItemAccount.objects.filter(item__order=order))
        all_units_completed = bool(all_accounts) and all(
            unit.status == "completed" for unit in all_accounts
        )
        if all_units_completed:
            was_status = order.status
            if order.status != "completed":
                order.status = "completed"
                order.completed_at = timezone.now()
                update_fields = ["status"]
                update_fields.append("completed_at")
                order.save(update_fields=update_fields)

                # The order is complete only when every unit is complete, so
                # this is an order-level completion notification.
                if getattr(order, "is_reseller_order", False):
                    try:
                        ok, msg = _send_order_status_sms_if_changed(order, order.status, was_status)
                        sms_sent = bool(ok)
                        if not ok:
                            sms_error = msg
                    except Exception as sms_err:
                        logger.error(f"Failed to send order status SMS: {sms_err}", exc_info=True)
                        sms_error = str(sms_err)
        # Any other status change is about this unit only.  It must not alter
        # the parent order's status or make its order-level notification claim
        # that every unit has invalid details.
        elif getattr(order, "is_reseller_order", False) and account.status != previous_status:
            try:
                ok, msg = _send_account_status_sms_if_changed(account, account.status, previous_status)
                sms_sent = bool(ok)
                if not ok:
                    sms_error = msg
            except Exception as sms_err:
                logger.error(f"Failed to send account status SMS: {sms_err}", exc_info=True)
                sms_error = str(sms_err)

        # Auto-archive the completed unit account details to reseller chest
        if account.status == "completed" and account.xbox_email and account.xbox_password:
            try:
                acc_obj, created_acc = XboxAccount.objects.get_or_create(email=account.xbox_email)
                acc_obj.password = account.xbox_password
                acc_obj.order = order
                acc_obj.status = "used"
                acc_obj.used_at = timezone.now()
                if not acc_obj.owner_phone and order.phone:
                    acc_obj.owner_phone = order.phone
                if not acc_obj.owner_label:
                    if getattr(order, "is_reseller_order", False):
                        acc_obj.owner_label = order.reseller_seller_code
                    elif order.user:
                        acc_obj.owner_label = order.user.get_full_name() or order.user.username
                acc_obj.save()

                # Also email Xbox credentials to the reseller if reseller order
                if getattr(order, "is_reseller_order", False):
                    reseller_email = _order_notify_email(order)
                    reseller_name = ""
                    try:
                        reseller_name = order.user.reseller_profile.support_name or ""
                    except Exception:
                        pass
                    if not reseller_name and order.user:
                        reseller_name = order.user.get_full_name() or order.user.username or ""
                    if not reseller_name:
                        reseller_name = "همکار جینکس فمیلی"

                    if reseller_email:
                        try:
                            from .email_service import send_xbox_account_email
                            send_xbox_account_email(
                                reseller_email,
                                reseller_name,
                                f"{order.tracking_code} (واحد {account.index})",
                                account.xbox_email,
                                account.xbox_password
                            )
                        except Exception as xbox_email_err:
                            logger.error(f"Failed to send Xbox account unit email: {xbox_email_err}")
            except Exception as archive_err:
                logger.error(f"Failed to archive completed reseller unit account: {archive_err}", exc_info=True)

        return JsonResponse({
            "ok": True,
            "status": account.status,
            "sms_sent": sms_sent,
            "sms_error": sms_error,
        })
    except Exception as e:
        return JsonResponse({"message": str(e)}, status=500)


@csrf_exempt
def admin_update_order_status(request, tracking):
    if not request.user.is_authenticated:
        return JsonResponse({"detail": "authentication required"}, status=401)
    if not _is_admin_user(request.user):
        return JsonResponse({"detail": "forbidden"}, status=403)
    if request.method != 'POST':
        return HttpResponseNotAllowed(['POST'])

    try:
        payload = json.loads(request.body.decode('utf-8'))
    except Exception:
        return JsonResponse({"message": "JSON نامعتبر"}, status=400)

    status = (payload.get('status') or '').strip()
    send_email = bool(payload.get('send_email'))
    send_sms = bool(payload.get('send_sms', True))
    email_subject = (payload.get('email_subject') or '').strip()
    email_body = (payload.get('email_body') or '').strip()

    # Xbox account credentials (when admin creates account for customer)
    created_xbox_email = (payload.get('created_xbox_email') or '').strip()
    created_xbox_pass = (payload.get('created_xbox_pass') or '').strip()
    skip_xbox_account_creation = bool(payload.get('skip_xbox_account_creation'))

    valid_statuses = {s for s, _ in Order.STATUS_CHOICES}
    if status not in valid_statuses:
        return JsonResponse({"message": "وضعیت نامعتبر است"}, status=400)

    order = get_object_or_404(Order, tracking_code=tracking)

    # For reseller orders, do not send email notifications unless completing with Xbox credentials, and always send SMS
    if getattr(order, "is_reseller_order", False):
        effective_xbox_email = created_xbox_email or order.created_xbox_email
        effective_xbox_pass = created_xbox_pass or order.created_xbox_pass
        if status == "completed" and effective_xbox_email and effective_xbox_pass:
            send_email = True
        else:
            send_email = False
        send_sms = True

    # An admin can explicitly confirm that no Xbox account was created.  This is
    # distinct from a missing value, which remains invalid for orders that need one.
    if skip_xbox_account_creation:
        order.xbox_account_creation_skipped = True

    created_xbox_required = _order_requires_created_xbox_account(order)
    previous_status = order.status
    order.status = status

    # Set completed_at timestamp when order is marked as completed
    update_fields = ['status']
    if skip_xbox_account_creation:
        update_fields.append('xbox_account_creation_skipped')
    if previous_status != "completed" and status == "completed":
        order.completed_at = timezone.now()
        update_fields.append('completed_at')

    # Save Xbox account credentials if provided
    if created_xbox_email and created_xbox_pass:
        order.created_xbox_email = created_xbox_email
        order.created_xbox_pass = created_xbox_pass
        order.xbox_account_creation_skipped = False
        update_fields.extend(['created_xbox_email', 'created_xbox_pass'])
        if 'xbox_account_creation_skipped' not in update_fields:
            update_fields.append('xbox_account_creation_skipped')

    if created_xbox_required and status == "completed":
        effective_xbox_email = created_xbox_email or order.created_xbox_email
        effective_xbox_pass = created_xbox_pass or order.created_xbox_pass
        if not send_email and not getattr(order, "is_reseller_order", False):
            return JsonResponse(
                {"message": "برای تکمیل سفارش Xbox باید ایمیل سفارش هم ارسال شود"},
                status=400,
            )
        if not effective_xbox_email or not effective_xbox_pass:
            return JsonResponse(
                {"message": "برای تکمیل سفارش Xbox باید ایمیل و رمز اکانت ساخته‌شده از ادمین ثبت شود"},
                status=400,
            )

    order.save(update_fields=update_fields)

    # Auto-archive order Xbox credentials to reseller chest when completed
    if status == "completed":
        effective_xbox_email = created_xbox_email or order.created_xbox_email
        effective_xbox_pass = created_xbox_pass or order.created_xbox_pass
        if effective_xbox_email and effective_xbox_pass:
            try:
                acc_obj, created_acc = XboxAccount.objects.get_or_create(email=effective_xbox_email)
                acc_obj.password = effective_xbox_pass
                acc_obj.order = order
                acc_obj.status = "used"
                acc_obj.used_at = timezone.now()
                if not acc_obj.owner_phone and order.phone:
                    acc_obj.owner_phone = order.phone
                if not acc_obj.owner_label:
                    if getattr(order, "is_reseller_order", False):
                        acc_obj.owner_label = order.reseller_seller_code
                    elif order.user:
                        acc_obj.owner_label = order.user.get_full_name() or order.user.username
                acc_obj.save()
            except Exception as archive_err:
                logger.error(f"Failed to archive completed order Xbox account: {archive_err}", exc_info=True)

    # Maintain a global counter of completed (successful) orders for the landing page.
    # Start from 907 (existing successful orders) and adjust only on status transitions.
    if previous_status != "completed" and status == "completed":
        _increment_setting_int("completed_orders_count", delta=1, default=907)
    elif previous_status == "completed" and status != "completed":
        _increment_setting_int("completed_orders_count", delta=-1, default=907)

    # اگر وضعیت به مسترد شده تغییر کرد:
    # ۱) آخرین پرداخت را refunded می‌کنیم
    # ۲) مبلغ سفارش به‌صورت کوین به کاربر برمی‌گردد (کش‌بک کیف پول حذف شده)
    if status == "refunded":
        latest_payment = order.payments.order_by("-created_at").first()
        if latest_payment and latest_payment.status != "refunded":
            latest_payment.status = "refunded"
            latest_payment.save(update_fields=["status"])
        total_paid = (order.amount or 0)
        if total_paid > 0 and order.user:
            from .rewards import award_points, toman_to_diamonds_ceil
            award_points(
                order.user, toman_to_diamonds_ceil(total_paid), "adjust",
                related_order=order, note=f"استرداد سفارش {order.tracking_code} به کوین",
            )

    paid_transitioned = previous_status != "paid" and status == "paid"
    email_sent = False
    email_error = ""
    sms_sent = False
    sms_error = ""
    ticket_created = False
    ticket_id = None
    if paid_transitioned:
        try:
            _notify_customer_payment_success(order, ref_id="")
        except Exception as notify_err:
            logger.error(f"Failed to notify customer after admin paid update: {notify_err}")
        points_awarded = 0
        try:
            from .rewards import award_purchase_points
            points_awarded = award_purchase_points(order)
        except Exception:
            logger.exception("purchase points failed for %s", order.tracking_code)
        _send_purchase_points_sms(order, points_awarded)

    if send_email:
        customer_email = ""
        customer_name = ""
        if order.is_reseller_order:
            _email_unused, customer_name = _get_customer_contact_info(order)
            customer_email = _order_notify_email(order)
        else:
            if order.user:
                customer_email = order.user.email or ""
                customer_name = order.user.get_full_name() or order.user.username or ""
            if not customer_email and "@" in (order.epic_username or ""):
                customer_email = order.epic_username
            if not customer_name:
                customer_name = "مشتری جینکس فمیلی"

        if not customer_email:
            email_error = "ایمیل کاربر موجود نیست."
        elif not email_subject or not email_body:
            email_error = "متن یا عنوان ایمیل خالی است."
        else:
            effective_xbox_email = created_xbox_email or order.created_xbox_email
            effective_xbox_pass = created_xbox_pass or order.created_xbox_pass
            if status == "completed" and created_xbox_required and (not effective_xbox_email or not effective_xbox_pass):
                email_error = "اطلاعات اکانت Xbox برای ارسال ایمیل کامل نیست."
                return JsonResponse({
                    "tracking_code": order.tracking_code,
                    "status": order.status,
                    "status_fa": dict(Order.STATUS_CHOICES).get(order.status, order.status),
                    "email_sent": False,
                    "email_error": email_error,
                    "sms_sent": sms_sent,
                    "sms_error": sms_error,
                }, status=400)

            # Check if Xbox credentials should be included
            xbox_section = ""
            if effective_xbox_email and effective_xbox_pass:
                xbox_section = f"""
                <div style="background: linear-gradient(135deg, #f0fdf4, #dcfce7); border: 2px solid #86efac; border-radius: 16px; padding: 20px; margin: 20px 0;">
                    <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
                        <div style="width: 48px; height: 48px; background: linear-gradient(135deg, #107c10, #0e7a0d); border-radius: 12px; display: flex; align-items: center; justify-content: center;">
                            <span style="font-size: 24px;">🎮</span>
                        </div>
                        <div>
                            <div style="font-weight: 800; font-size: 16px; color: #166534;">اکانت Xbox ساخته شده</div>
                            <div style="font-size: 13px; color: #15803d;">اطلاعات ورود به اکانت Xbox شما</div>
                        </div>
                    </div>
                    <div style="margin-bottom: 16px; background: #fef3c7; border: 1px solid #fcd34d; border-radius: 10px; padding: 14px 16px;">
                        <div style="font-weight: 800; color: #92400e; font-size: 14px; margin-bottom: 6px;">⚠️ هشدار مهم</div>
                        <div style="font-size: 13px; color: #a16207; line-height: 1.8;">
                            این اطلاعات را حتماً ذخیره کنید تا بعداً برای فعال‌سازی یا ورود مجدد دچار مشکل نشوید.
                            لطفاً آن را در جای امن نگهداری کنید.
                        </div>
                    </div>
                    <div style="background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #bbf7d0;">
                        <div style="display: flex; justify-content: space-between; align-items: center; padding: 14px 18px; border-bottom: 1px solid #bbf7d0;">
                            <span style="font-weight: 700; color: #166534; font-size: 14px;">ایمیل:</span>
                            <span style="font-weight: 800; color: #14532d; font-size: 15px; direction: ltr; font-family: monospace; background: #f0fdf4; padding: 6px 12px; border-radius: 6px;">{effective_xbox_email}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; align-items: center; padding: 14px 18px;">
                            <span style="font-weight: 700; color: #166534; font-size: 14px;">رمز عبور:</span>
                            <span style="font-weight: 800; color: #14532d; font-size: 15px; direction: ltr; font-family: monospace; background: #f0fdf4; padding: 6px 12px; border-radius: 6px;">{effective_xbox_pass}</span>
                        </div>
                    </div>
                    <div style="margin-top: 16px; background: #fef3c7; border: 1px solid #fcd34d; border-radius: 10px; padding: 14px 16px;">
                        <div style="font-weight: 700; color: #92400e; font-size: 13px; margin-bottom: 6px;">⚠️ نکات امنیتی:</div>
                        <ul style="margin: 0; padding-right: 16px; font-size: 12px; color: #a16207; line-height: 1.8;">
                            <li>این اطلاعات را حتماً ذخیره کنید تا بعداً دچار مشکل فعال‌سازی نشوید</li>
                            <li>رمز عبور را در اولین فرصت تغییر دهید</li>
                            <li>اطلاعات را در جای امنی ذخیره کنید</li>
                            <li>این اکانت با ریجن ترکیه ساخته شده است</li>
                        </ul>
                    </div>
                </div>
                """

            # قالب زیبای HTML با پشتیبانی از dark mode
            clean_body = (email_body or "").replace("\n", "<br/>")
            html_body = f"""
<!DOCTYPE html>
<html dir="rtl" lang="fa">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="color-scheme" content="light dark">
    <meta name="supported-color-schemes" content="light dark">
    <style>
        :root {{ color-scheme: light dark; supported-color-schemes: light dark; }}
        body {{ font-family: Tahoma, Arial, sans-serif; margin: 0; padding: 32px 16px; background-color: #f1f5f9 !important; }}
        @media (prefers-color-scheme: dark) {{
            body {{ background-color: #0f172a !important; }}
        }}
    </style>
</head>
<body style="font-family: Tahoma, Arial, sans-serif; background-color: #f1f5f9; margin: 0; padding: 32px 16px;">
    <div style="max-width: 640px; margin: 0 auto; background: #ffffff; border-radius: 20px; box-shadow: 0 20px 60px rgba(0,0,0,0.1); overflow: hidden;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #10b981, #059669); color: #ffffff; padding: 32px 28px; text-align: center;">
            <div style="width: 64px; height: 64px; margin: 0 auto 16px; background: rgba(255,255,255,0.2); border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                <span style="font-size: 32px;">✅</span>
            </div>
            <h1 style="margin: 0; font-size: 24px; font-weight: 900;">سفارش شما تکمیل شد!</h1>
            <div style="margin-top: 12px; font-size: 15px; opacity: 0.95;">
                کد پیگیری: <strong style="background: rgba(255,255,255,0.2); padding: 4px 12px; border-radius: 6px;">{order.tracking_code}</strong>
            </div>
        </div>

        <!-- Content -->
        <div style="padding: 28px; background-color: #ffffff;">
            <div style="font-size: 16px; color: #374151; line-height: 1.9; margin-bottom: 24px;">
                سلام <strong style="color: #10b981;">{customer_name}</strong> عزیز،<br/>
                {clean_body}
            </div>

            {xbox_section}

            <!-- Status Card -->
            <div style="background: linear-gradient(135deg, #f0fdf4, #dcfce7); border: 2px solid #86efac; border-radius: 14px; padding: 18px 20px; margin-bottom: 24px;">
                <div style="display: flex; align-items: center; gap: 14px;">
                    <div style="width: 48px; height: 48px; background: #22c55e; border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                        <span style="font-size: 24px;">🎉</span>
                    </div>
                    <div>
                        <div style="font-size: 15px; font-weight: 700; color: #166534;">وضعیت: {dict(Order.STATUS_CHOICES).get(order.status, order.status)}</div>
                        <div style="font-size: 13px; color: #15803d; margin-top: 4px;">سفارش شما با موفقیت تکمیل شد</div>
                    </div>
                </div>
            </div>

            <!-- CTA Button -->
            <a href="https://jinxfamily.ir/track/{order.tracking_code}" style="display: block; width: 100%; padding: 16px 24px; background: linear-gradient(135deg, #10b981, #059669); color: #ffffff; text-decoration: none; border-radius: 12px; font-size: 16px; font-weight: 800; text-align: center; box-sizing: border-box;">
                مشاهده جزئیات سفارش
            </a>
        </div>

        <!-- Footer -->
        <div style="background: #f8fafc; padding: 24px 28px; text-align: center; border-top: 1px solid #e2e8f0;">
            <div style="font-size: 13px; color: #64748b; line-height: 1.8;">
                از اعتماد شما به جینکس فمیلی سپاسگزاریم!<br/>
                لطفاً ما را به دوستان خود معرفی کنید 💜
            </div>
            <div style="margin-top: 16px;">
                <a href="https://t.me/jinxfamily" style="display: inline-block; margin: 0 8px; color: #10b981; text-decoration: none; font-weight: 700; font-size: 13px;">تلگرام</a>
                <span style="color: #cbd5e1;">|</span>
                <a href="https://jinxfamily.ir" style="display: inline-block; margin: 0 8px; color: #10b981; text-decoration: none; font-weight: 700; font-size: 13px;">وب‌سایت</a>
            </div>
        </div>
    </div>
</body>
</html>
            """
            sent = send_status_update_email(customer_email, email_subject, html_body, email_body)
            email_sent = bool(sent)
            if not sent:
                email_error = "ارسال ایمیل با خطا مواجه شد."

            # Also send dedicated Xbox account email if credentials provided
            if effective_xbox_email and effective_xbox_pass and email_sent:
                try:
                    from .email_service import send_xbox_account_email
                    send_xbox_account_email(customer_email, customer_name, order.tracking_code, effective_xbox_email, effective_xbox_pass)
                except Exception as xbox_email_err:
                    logger.error(f"Failed to send Xbox account email: {xbox_email_err}")

    if send_sms:
        if order.is_reseller_order:
            try:
                phone = order.user.reseller_profile.contact_phone or ""
            except Exception:
                phone = ""
        else:
            phone = order.phone or ""
        if not phone:
            sms_error = "شماره تماس ثبت نشده است."
        else:
            customer_name = ""
            if order.is_reseller_order:
                try:
                    customer_name = order.user.reseller_profile.support_name or ""
                except Exception:
                    pass
            if not customer_name and order.user:
                customer_name = order.user.get_full_name() or order.user.username or ""
            if not customer_name:
                customer_name = "مشتری جینکس فمیلی"

            # پیامک برای وضعیت تکمیل شده (فقط اگه وضعیت واقعاً تغییر کرده باشه)
            if status == "completed" and previous_status != "completed":
                status_text = dict(Order.STATUS_CHOICES).get(order.status, order.status)
                ok, sms_msg = KavenegarService.send_status_sms(
                    phone_number=phone,
                    customer_name=customer_name,
                    status_fa=status_text,
                    template_name="jinxfamily-order-done",
                    include_status_token=False,
                )
                sms_sent = bool(ok)
                if not ok:
                    sms_error = sms_msg

            # پیامک برای مسترد شدن (فقط اگه وضعیت واقعاً تغییر کرده باشه)
            elif status == "refunded" and previous_status != "refunded":
                # استفاده از قالب جدید با مبلغ
                refund_amount = refund_result.get("credit_added") or order.amount or 0
                ok, sms_msg = KavenegarService.send_refund_sms(
                    phone_number=phone,
                    amount=refund_amount,
                )
                sms_sent = bool(ok)
                if not ok:
                    sms_error = sms_msg

            # پیامک برای اطلاعات نادرست (فقط اگه وضعیت واقعاً تغییر کرده باشه)
            elif status == "invalid_info" and previous_status != "invalid_info":
                ok, sms_msg = KavenegarService.send_status_sms(
                    phone_number=phone,
                    customer_name=customer_name,
                    status_fa="",
                    template_name="jinxfamily-wrong-details",
                    include_status_token=False,
                )
                sms_sent = bool(ok)
                if not ok:
                    sms_error = sms_msg

            # پیامک برای نیاز به 2FA (فقط اگه وضعیت واقعاً تغییر کرده باشه)
            elif status == "needs_2fa" and previous_status != "needs_2fa":
                ok, sms_msg = KavenegarService.send_status_sms(
                    phone_number=phone,
                    customer_name=customer_name,
                    status_fa="رسیدگی",
                    template_name="jinxfamily-alert",
                    include_status_token=True,
                )
                sms_sent = bool(ok)
                if not ok:
                    sms_error = sms_msg

            # پیامک برای نیاز به تغییر ریجن (فقط اگه وضعیت واقعاً تغییر کرده باشه)
            elif status == "needs_tr_region" and previous_status != "needs_tr_region":
                ok, sms_msg = KavenegarService.send_status_sms(
                    phone_number=phone,
                    customer_name=customer_name,
                    status_fa="رسیدگی",
                    template_name="jinxfamily-alert",
                    include_status_token=True,
                )
                sms_sent = bool(ok)
                if not ok:
                    sms_error = sms_msg

            # پیامک و تیکت خودکار برای مشکل اکانت ایکس باکس (فقط اگه وضعیت واقعاً تغییر کرده باشه)
            elif status == "needs_xbox_info" and previous_status != "needs_xbox_info":
                ticket_url = "https://jinxfamily.com/panel/user?tab=tickets"
                if order.user:
                    try:
                        ticket, created_t = Ticket.objects.get_or_create(
                            user=order.user,
                            order=order,
                            is_auto_created=True,
                            defaults={
                                "subject": f"مشکل اکانت ایکس باکس سفارش #{order.tracking_code}",
                                "status": "open",
                            }
                        )
                        if created_t or not ticket.messages.exists():
                            cust_n = (order.user.get_full_name() or order.user.username or "کاربر").strip()
                            TicketMessage.objects.create(
                                ticket=ticket,
                                sender_type="admin",
                                sender_user=request.user if request.user.is_authenticated else None,
                                message=(
                                    f"سلام {cust_n} عزیز،\n"
                                    f"ما سفارشاتو با اپیک میزنیم کروپک قبلی شما از ایکس باکس تکمیل شده و اپیک گیمز اجازه خرید نمیده "
                                    f"لطف کنید اطلاعات اکانت ایکس باکس لینک به اپیک گیمزتون رو بفرستید و یا از اخرین فروشگاهی که خرید کردید بگیرید و برای پشتیبانی بفرستید"
                                )
                            )
                        ticket_url = f"https://jinxfamily.com/panel/user?tab=tickets&ticket_id={ticket.id}"
                        ticket_created = True
                        ticket_id = ticket.id
                    except Exception as t_err:
                        logger.error(f"Error auto-creating ticket for xbox order {order.tracking_code}: {t_err}", exc_info=True)

                if getattr(order, "is_reseller_order", False):
                    ok, sms_msg = KavenegarService.send_status_sms(
                        phone_number=phone,
                        customer_name=customer_name,
                        status_fa=order.tracking_code,
                        template_name="jinxfamily-re-wronginfo",
                        include_status_token=False,
                    )
                else:
                    ok, sms_msg = KavenegarService.send_status_sms(
                        phone_number=phone,
                        customer_name=customer_name,
                        status_fa=ticket_url,
                        template_name="jinxfamily-action-required",
                        include_status_token=False,
                    )
                sms_sent = bool(ok)
                if not ok:
                    sms_error = sms_msg

            # پیامک برای هر وضعیت دیگر (فقط اگه وضعیت واقعاً تغییر کرده باشه)
            elif status != previous_status:
                status_fa = dict(Order.STATUS_CHOICES).get(status, status)
                ok, sms_msg = KavenegarService.send_status_sms(
                    phone_number=phone,
                    customer_name=customer_name,
                    status_fa=status_fa,
                    template_name="jinxfamily-alert",
                    include_status_token=True,
                )
                sms_sent = bool(ok)
                if not ok:
                    sms_error = sms_msg

    response_payload = {
        "tracking_code": order.tracking_code,
        "status": order.status,
        "status_fa": dict(Order.STATUS_CHOICES).get(order.status, order.status),
        "refund": refund_result,
        "email_sent": email_sent,
        "email_error": email_error,
        "sms_sent": sms_sent,
        "sms_error": sms_error,
        "ticket_created": ticket_created,
        "ticket_id": ticket_id,
    }
    return JsonResponse(response_payload)


def admin_users(request):
    """
    دریافت لیست تمام کاربران برای ادمین
    """
    if not request.user.is_authenticated:
        return JsonResponse({"detail": "authentication required"}, status=401)
    if not _is_admin_user(request.user):
        return JsonResponse({"detail": "forbidden"}, status=403)
    if request.method != 'GET':
        return HttpResponseNotAllowed(['GET'])

    users_qs = (
        User.objects.select_related('profile')
        .annotate(
            # Exclude test orders and wallet top-ups from all statistics
            orders_count=Count('orders', filter=Q(orders__is_test_order=False) & ~Q(orders__note__icontains="شارژ کیف پول"), distinct=True),
            completed_orders=Count('orders', filter=Q(orders__status='completed', orders__is_test_order=False) & ~Q(orders__note__icontains="شارژ کیف پول"), distinct=True),
            total_spent=Sum('orders__amount', filter=Q(orders__status='completed', orders__is_test_order=False) & ~Q(orders__note__icontains="شارژ کیف پول")),
        )
        .order_by('-date_joined')
    )

    data = []
    for u in users_qs:
        orders_count = u.orders_count or 0
        completed_orders = u.completed_orders or 0
        total_spent = u.total_spent or 0

        # دریافت اطلاعات پروفایل
        phone = ""
        tier = "user"
        wallet = 0
        try:
            profile = u.profile
            phone = profile.phone_number or ""
            tier = profile.tier or "user"
            wallet = profile.wallet_balance or 0
            if tier == "reseller" or hasattr(u, "reseller_profile"):
                try:
                    wallet = u.reseller_profile.wallet_balance
                except Exception:
                    pass
        except Exception:
            pass

        data.append({
            "id": u.id,
            "username": u.username,
            "email": u.email,
            "name": u.get_full_name() or u.username,
            "phone": phone,
            "tier": tier,
            "wallet_balance": wallet,
            "is_staff": u.is_staff,
            "date_joined": u.date_joined.isoformat(),
            "last_login": u.last_login.isoformat() if u.last_login else None,
            "orders_count": orders_count,
            "completed_orders": completed_orders,
            "total_spent": total_spent,
        })

    return JsonResponse({"results": data})


@csrf_exempt
def admin_user_delete(request, user_id):
    if not request.user.is_authenticated:
        return JsonResponse({"detail": "authentication required"}, status=401)
    if not _is_admin_user(request.user):
        return JsonResponse({"detail": "forbidden"}, status=403)
    if request.method not in ('DELETE', 'POST'):
        return HttpResponseNotAllowed(['DELETE', 'POST'])

    from django.contrib.auth import get_user_model
    User = get_user_model()
    user = get_object_or_404(User, id=user_id)

    if user == request.user:
        return JsonResponse({"message": "نمی‌توانید خودتان را حذف کنید"}, status=400)
    if user.is_superuser:
        return JsonResponse({"message": "نمی‌توان سوپرمیوزر را حذف کرد"}, status=400)

    username = user.username
    user.delete()
    return JsonResponse({"success": True, "message": f"کاربر {username} با موفقیت حذف شد"})


@csrf_exempt
def admin_discounts(request):
    if not request.user.is_authenticated:
        return JsonResponse({"detail": "authentication required"}, status=401)
    if not _is_admin_user(request.user):
        return JsonResponse({"detail": "forbidden"}, status=403)

    def _parse_expires_at(value):
        if value in [None, ""]:
            return None
        try:
            dt = datetime.fromisoformat(str(value).replace("Z", "+00:00"))
        except Exception:
            raise ValueError("تاریخ انقضای نامعتبر است")
        if timezone.is_naive(dt):
            dt = timezone.make_aware(dt)
        return dt

    if request.method == 'GET':
        try:
            limit = int(request.GET.get("limit") or 0)
        except (TypeError, ValueError):
            limit = 0
        if limit <= 0:
            limit = 200
        limit = max(1, min(limit, 1000))

        codes = DiscountCode.objects.all().order_by('-created_at')[:limit]
        results = [
            {
                "id": c.id,
                "code": c.code,
                "percent": c.percent,
                "active": c.active,
                "created_at": c.created_at.isoformat(),
                "amount": c.amount,
                "expires_at": c.expires_at.isoformat() if c.expires_at else None,
            }
            for c in codes
        ]
        return JsonResponse({"results": results})

    if request.method == 'POST':
        try:
            payload = json.loads(request.body.decode('utf-8'))
        except Exception:
            return JsonResponse({"message": "JSON نامعتبر"}, status=400)

        code = (payload.get("code") or "").strip().upper()
        percent = int(payload.get("percent") or 0)
        amount = int(payload.get("amount") or 0)
        active = bool(payload.get("active", True))
        expires_at = None
        if "expires_at" in payload:
            try:
                expires_at = _parse_expires_at(payload.get("expires_at"))
            except ValueError as exc:
                return JsonResponse({"message": str(exc)}, status=400)
            if expires_at and expires_at <= timezone.now():
                return JsonResponse({"message": "تاریخ انقضا باید در آینده باشد"}, status=400)

        if not code:
            return JsonResponse({"message": "کد تخفیف خالی است"}, status=400)
        if percent < 0 or percent > 100:
            return JsonResponse({"message": "درصد باید بین ۰ تا ۱۰۰ باشد"}, status=400)
        if percent == 0 and amount <= 0:
            return JsonResponse({"message": "درصد یا مبلغ تخفیف را وارد کنید"}, status=400)
        if amount < 0:
            return JsonResponse({"message": "مبلغ تخفیف نمی‌تواند منفی باشد"}, status=400)

        obj, created = DiscountCode.objects.get_or_create(
            code=code,
            defaults={"percent": percent, "amount": amount, "active": active, "expires_at": expires_at},
        )
        if not created:
            obj.percent = percent
            obj.amount = amount
            obj.active = active
            fields_to_update = ["percent", "amount", "active"]
            if "expires_at" in payload:
                obj.expires_at = expires_at
                fields_to_update.append("expires_at")
            obj.save(update_fields=fields_to_update)
        return JsonResponse({
            "id": obj.id,
            "code": obj.code,
            "percent": obj.percent,
            "amount": obj.amount,
            "active": obj.active,
            "expires_at": obj.expires_at.isoformat() if obj.expires_at else None,
            "created": created,
        }, status=201 if created else 200)

    return HttpResponseNotAllowed(['GET', 'POST'])


@csrf_exempt
def admin_discount_detail(request, code: str):
    """
    مدیریت تکی کد تخفیف (فعالسازی/حذف)
    """
    if not request.user.is_authenticated:
        return JsonResponse({"detail": "authentication required"}, status=401)
    if not _is_admin_user(request.user):
        return JsonResponse({"detail": "forbidden"}, status=403)

    code_clean = (code or "").strip()
    try:
        dc = DiscountCode.objects.get(code__iexact=code_clean)
    except DiscountCode.DoesNotExist:
        return JsonResponse({"message": "کد یافت نشد"}, status=404)

    if request.method == 'PATCH':
        try:
            payload = json.loads(request.body.decode('utf-8'))
        except Exception:
            return JsonResponse({"message": "JSON نامعتبر"}, status=400)

        if "active" in payload:
            dc.active = bool(payload.get("active"))
            dc.save(update_fields=["active"])

        # Optional: allow updating amount/percent if provided
        if "percent" in payload or "amount" in payload:
            percent = int(payload.get("percent") or dc.percent)
            amount = int(payload.get("amount") or dc.amount)
            if percent < 0 or percent > 100:
                return JsonResponse({"message": "درصد باید بین ۰ تا ۱۰۰ باشد"}, status=400)
            if percent == 0 and amount <= 0:
                return JsonResponse({"message": "درصد یا مبلغ تخفیف را وارد کنید"}, status=400)
            if amount < 0:
                return JsonResponse({"message": "مبلغ تخفیف نمی‌تواند منفی باشد"}, status=400)
            dc.percent = percent
            dc.amount = amount
            dc.save(update_fields=["percent", "amount"])

        if "expires_at" in payload:
            try:
                expires_at_val = payload.get("expires_at")
                expires_at = None
                if expires_at_val not in [None, ""]:
                    expires_at = datetime.fromisoformat(str(expires_at_val).replace("Z", "+00:00"))
                    if timezone.is_naive(expires_at):
                        expires_at = timezone.make_aware(expires_at)
                if expires_at and expires_at <= timezone.now():
                    return JsonResponse({"message": "تاریخ انقضا باید در آینده باشد"}, status=400)
                dc.expires_at = expires_at
                dc.save(update_fields=["expires_at"])
            except Exception:
                return JsonResponse({"message": "تاریخ انقضای نامعتبر است"}, status=400)

        return JsonResponse({
            "id": dc.id,
            "code": dc.code,
            "percent": dc.percent,
            "amount": dc.amount,
            "active": dc.active,
            "expires_at": dc.expires_at.isoformat() if dc.expires_at else None,
        })

    if request.method == 'DELETE':
        dc.delete()
        return JsonResponse({"success": True, "message": "کد حذف شد"})

    return HttpResponseNotAllowed(['PATCH', 'DELETE'])


@csrf_exempt
def discount_validate(request):
    if request.method != 'POST':
        return HttpResponseNotAllowed(['POST'])
    try:
        payload = json.loads(request.body.decode('utf-8'))
    except Exception:
        return JsonResponse({"message": "JSON نامعتبر"}, status=400)
    code = (payload.get("code") or "").strip()
    req_user = request.user if request.user.is_authenticated else None
    
    dc = None
    if code:
        dc, error = _get_discount_code_status(code, req_user)
        if error:
            status_code = 400
            if error == "کد تخفیف نامعتبر است.":
                status_code = 404
            return JsonResponse({"message": error}, status=status_code)
            
    response = {
        "code": dc.code if dc else None,
        "percent": dc.percent if dc else 0,
        "amount": dc.amount if dc else 0,
        "expires_at": dc.expires_at.isoformat() if (dc and dc.expires_at) else None,
    }
    preview = _discount_preview_from_cart_payload(payload, dc, user=req_user)
    if preview is not None:
        response.update({
            "previewed": True,
            "gross_amount": preview["gross_amount"],
            "nominal_amount": preview["nominal_amount"],
            "discount_amount": preview["discount_amount"],
            "capped": False,
            "guardrail_warning": preview["guardrail_warning"],
            "guardrail": preview["guardrail"],
            "diamond_discount": preview["diamond_discount"],
            "diamonds_applied": preview["diamonds_applied"],
            "diamonds_max": preview["diamonds_max"],
            "refund_credit_balance": preview["refund_credit_balance"],
            "refund_credit_max": preview["refund_credit_max"],
            "refund_credit_applied": preview["refund_credit_applied"],
            "final_amount": preview["final_amount"],
        })
        response["applicable"] = (preview["discount_amount"] > 0) or (preview["diamond_discount"] > 0)
    return JsonResponse(response)


@csrf_exempt
def payment_request(request, tracking):
    """
    درخواست پرداخت برای یک سفارش
    """
    if request.method != 'POST':
        return HttpResponseNotAllowed(['POST'])

    order = get_object_or_404(Order, tracking_code=tracking)

    # Debug log for payment request
    logger.info(
        "Payment request: tracking=%s, order.amount=%s, order.rush_order=%s, order.rush_fee=%s",
        tracking, order.amount, order.rush_order, order.rush_fee
    )

    # بررسی اینکه سفارش قبلاً پرداخت نشده باشد
    if order.status != 'pending':
        return JsonResponse({"message": "این سفارش قبلاً پرداخت شده است"}, status=400)

    # اگر مبلغ صفر باشد، نیازی به پرداخت نیست
    if order.amount == 0:
        transitioned = order.status != 'paid'
        order.status = 'paid'
        order.save(update_fields=["status"])
        try:
            if transitioned:
                from .rewards import award_purchase_points
                award_purchase_points(order)
        except Exception:
            logger.exception("purchase points (zero-amount order) failed for %s", order.tracking_code)
        if transitioned:
            _notify_customer_payment_success(order, ref_id="")
        return JsonResponse({
            "success": True,
            "payment_required": False,
            "message": "سفارش بدون پرداخت ثبت شد (مبلغ صفر)",
            "tracking_code": order.tracking_code,
            "status": order.status
        })

    # آدرس بازگشت (callback) - باید با دامنه ثبت‌شده در زرین‌پال هم‌خوانی داشته باشد
    callback_base = getattr(settings, "PAYMENT_CALLBACK_BASE_URL", "").rstrip("/")
    if callback_base:
        callback_url = urljoin(f"{callback_base}/", f"payment/verify/{order.tracking_code}")
    else:
        callback_url = request.build_absolute_uri(f'/api/payment/verify/{order.tracking_code}')

    # توضیحات تراکنش
    description = f"پرداخت سفارش {order.tracking_code}"

    # ایجاد cart_data برای میان‌پی (صفحه چک‌اوت زرین‌پال)
    cart_data = _build_cart_data(order)

    # استفاده از سرویس ZarinPal - sandbox برای کاربران تست
    is_test = _is_test_user(order.user)
    if is_test:
        logger.info("Using sandbox mode for test user: %s", order.user.username if order.user else order.phone)
    zarinpal = ZarinPalService(force_sandbox=is_test)
    success, data = zarinpal.create_payment_request(
        amount=order.amount,
        description=description,
        callback_url=callback_url,
        mobile=order.phone,
        email=order.user.email if order.user else None,
        order_id=order.tracking_code,
        currency=settings.ZARINPAL_CURRENCY,  # استفاده از تنظیمات (IRT = تومان)
        cart_data=cart_data
    )

    if success:
        # ذخیره اطلاعات پرداخت
        payment = Payment.objects.create(
            order=order,
            authority=data['authority'],
            amount=order.amount,
            status='pending',
            fee=data.get('fee', 0),
            fee_type=data.get('fee_type', '')
        )

        return JsonResponse({
            "success": True,
            "payment_required": True,
            "payment_url": data['payment_url'],
            "authority": data['authority']
        })
    else:
        return JsonResponse({
            "success": False,
            "message": f"خطا در ایجاد درخواست پرداخت: {data.get('error', 'خطای ناشناخته')}"
        }, status=400)


@csrf_exempt
def payment_verify(request, tracking):
    """
    تایید پرداخت پس از بازگشت از درگاه
    """
    order = get_object_or_404(Order, tracking_code=tracking)

    # دریافت Authority و Status از query string
    authority = request.GET.get('Authority')
    status = request.GET.get('Status')

    frontend_url = settings.FRONTEND_URL

    # Idempotency guard: if already paid, redirect to success
    if order.status == 'paid':
        ref_id = order.payments.filter(status__in=['verified', 'success']).first()
        rid = ref_id.ref_id if ref_id else ''
        return HttpResponseRedirect(f"{frontend_url}/payment/success?tracking={tracking}&ref_id={rid}")

    if not authority:
        return HttpResponseRedirect(f"{frontend_url}/payment/failed?tracking={tracking}&error=no_authority")

    # بررسی وضعیت پرداخت
    if status != 'OK':
        # پرداخت ناموفق یا لغو شده توسط کاربر
        payment = Payment.objects.filter(authority=authority, order=order).first()
        if payment:
            payment.status = 'failed'
            payment.save()

        return HttpResponseRedirect(f"{frontend_url}/payment/failed?tracking={tracking}&error=cancelled")

    # استفاده از سرویس ZarinPal برای تایید - sandbox برای کاربران تست
    is_test = _is_test_user(order.user)
    zarinpal = ZarinPalService(force_sandbox=is_test)
    success, data = zarinpal.verify_payment(
        amount=order.amount,
        authority=authority
    )

    if success:
        # پرداخت موفق
        payment = Payment.objects.filter(authority=authority, order=order).first()
        if payment:
            payment.status = 'verified'
            payment.verified_at = payment.verified_at or timezone.now()
            payment.ref_id = str(data.get('ref_id', ''))
            payment.card_pan = data.get('card_pan', '')
            payment.card_hash = data.get('card_hash', '')
            payment.fee = data.get('fee', 0)
            payment.fee_type = data.get('fee_type', '')
            payment.save()

            # Check for duplicate card usage (anti-reseller measure) - Only for Crew Pack orders
            # Check if order contains crew pack
            has_crew_pack = order.items.filter(product__slug='fortnite-crew-pack').exists()

            if has_crew_pack:
                card_hash_value = payment.card_hash
                if card_hash_value:
                    # Find other successful payments with the same card (excluding this one)
                    duplicate_payments = Payment.objects.filter(
                        card_hash=card_hash_value,
                        status__in=['verified', 'success']
                    ).exclude(id=payment.id).select_related('order', 'order__user')

                    duplicate_count = duplicate_payments.count()

                    if duplicate_count > 0:
                        # Card has been used before - add concise AI hint for admin review
                        total_uses = duplicate_count + 1
                        warning_msg = (
                            "🤖 JinxFamily AI\n"
                            f"این کارت با هشت رقم آخر مشابه در {total_uses} پرداخت استفاده شده؛ احتمال حساب واسطه/دلالی."
                        )

                        # Log the warning
                        logger.warning(f"Duplicate card detected: {warning_msg}")

                        # Store warning in order note field
                        try:
                            current_note = order.note or ""
                            order.note = f"{current_note}\n\n{warning_msg}".strip()
                            order.save(update_fields=['note'])
                        except Exception as e:
                            logger.error(f"Failed to save duplicate card warning to order note: {e}")

        # تغییر وضعیت سفارش به پرداخت شده
        order.status = 'paid'
        order.save()

        # Account Listing Fee Payment Check
        try:
            from .marketplace_models import AccountListing
            from .email_service import send_admin_new_listing_email
            paid_listing = AccountListing.objects.filter(payment_order=order, status='payment_pending').first()
            if paid_listing:
                paid_listing.status = 'pending_review'
                paid_listing.save(update_fields=['status'])
                try:
                    send_admin_new_listing_email(paid_listing)
                except Exception as listing_email_err:
                    logger.error(f"Failed to send admin notification for paid listing {paid_listing.id}: {listing_email_err}")
                logger.info(f"Listing {paid_listing.id} status updated to pending_review after 80k listing fee payment.")
        except Exception as listing_err:
            logger.error(f"Error updating listing status on payment verify: {listing_err}")

        # Wallet Top-up Check
        wallet_item = order.items.filter(name="شارژ کیف پول").first()
        if wallet_item and order.user:
            profile, _ = UserProfile.objects.get_or_create(user=order.user)
            profile.wallet_balance += order.amount
            profile.save(update_fields=['wallet_balance'])
            
            CustomerWalletTxn.objects.create(
                profile=profile,
                kind="topup",
                amount=order.amount,
                balance_after=profile.wallet_balance,
                related_order=order,
                related_payment=payment if 'payment' in locals() else None,
                note="شارژ حساب با درگاه زرین‌پال"
            )
            
            order.status = 'completed'
            order.save(update_fields=['status'])
            logger.info(f"Wallet successfully charged for user {order.user.username} by {order.amount:,} Tomans.")

        # G4A4 Automatic Fulfillment
        try:
            from . import g4a4_service
            for item in order.items.filter(g4a4_variation__isnull=False):
                # Ensure idempotency: check if already sent/ordered on G4A4
                if not item.g4a4_order_id:
                    client_ref = f"JF-{order.id}-{item.id}"
                    cust_data = item.custom_fields_data or {}
                    
                    customer_info = {
                        "first_name": order.user.first_name if (order.user and order.user.first_name) else "مشتری",
                        "last_name": order.user.last_name if (order.user and order.user.last_name) else "جینکس",
                        "phone": order.phone,
                        "email": order.user.email if (order.user and order.user.email) else "no-reply@jinxfamily.shop"
                    }
                    
                    is_test_order = getattr(order, 'is_test_order', False) or (order.user and order.user.is_staff)
                    
                    res = g4a4_service.add_order(
                        client_reference=client_ref,
                        variation_id=item.g4a4_variation.external_variation_id,
                        quantity=item.quantity,
                        customer=customer_info,
                        data=cust_data,
                        test_mode=is_test_order
                    )
                    
                    if res and "order_id" in res:
                        item.g4a4_order_id = str(res["order_id"])
                        item.g4a4_status = "processing"
                        item.save(update_fields=['g4a4_order_id', 'g4a4_status'])
                        logger.info(f"G4A4 Auto-fulfillment triggered for item {item.id}, G4A4 Order ID: {item.g4a4_order_id}")
                    else:
                        logger.error(f"G4A4 Auto-fulfillment failed for item {item.id}: {res}")
        except Exception as g4_err:
            logger.error(f"G4A4 Auto-fulfillment critical error: {g4_err}")

        points_awarded = 0
        try:
            from .rewards import award_purchase_points
            points_awarded = award_purchase_points(order)
        except Exception:
            logger.exception("purchase points failed for %s", order.tracking_code)
        _send_purchase_points_sms(order, points_awarded)

        # ایمیل اطلاع‌رسانی پرداخت موفق
        try:
            items_for_email = [
                {
                    "name": oi.name,
                    "quantity": oi.quantity,
                    "price": oi.price,
                    "platform": getattr(oi.variant, "title", "") if oi.variant else "",
                    "account_type": getattr(oi, "account_type", ""),
                    "account_email": getattr(oi, "account_email", ""),
                    "account_password": getattr(oi, "account_password", ""),
                }
                for oi in order.items.select_related("variant").all()
            ]

            # اطلاع به ادمین فقط پس از پرداخت موفق
            try:
                customer_email = ""
                customer_name = ""
                if order.user:
                    customer_email = order.user.email or ""
                    customer_name = order.user.get_full_name() or order.user.username or ""
                # fallback به اپیک ایمیل/یوزرنیم اگر ایمیل ثبت نشده
                if not customer_email and "@" in (order.epic_username or ""):
                    customer_email = order.epic_username
                if not customer_name and order.epic_username:
                    customer_name = order.epic_username

                send_admin_new_order_email(
                    tracking_code=order.tracking_code,
                    order_items=items_for_email,
                    total_amount=order.amount,
                    phone=order.phone,
                    telegram=order.telegram,
                    note=order.note,
                    rush_order=False,
                    wallet_used=order.wallet_used,
                    customer_email=customer_email,
                    customer_name=customer_name or "مشتری جینکس فمیلی",
                )
            except Exception as admin_err:
                logger.error(f"Admin notification email error: {admin_err}")

            _notify_customer_payment_success(
                order,
                ref_id=data.get('ref_id', ''),
                items_for_email=items_for_email,
            )

            phone_for_sms = order.phone or ""
            if phone_for_sms:
                customer_name_sms = customer_name or "مشتری جینکس فمیلی"
                KavenegarService.send_status_sms(
                    phone_number=phone_for_sms,
                    customer_name=customer_name_sms,
                    status_fa="",
                    template_name="jinxfamily-shop-new-order",
                    include_status_token=False,
                )

            admin_sms_name = f"{tracking} {order.amount:,}"
            for admin_phone in ["09123101634", "09202440480"]:
                try:
                    KavenegarService.send_status_sms(
                        phone_number=admin_phone,
                        customer_name=admin_sms_name,
                        status_fa="",
                        template_name="new-order",
                        include_status_token=False,
                    )
                except Exception as sms_err:
                    logger.error(f"SMS notification error for {admin_phone}: {sms_err}")
        except Exception as e:
            logger.error(f"Payment success email error: {e}")

        ref_id = str(data.get('ref_id') or '')
        return HttpResponseRedirect(f"{frontend_url}/payment/success?tracking={tracking}&ref_id={ref_id}")
    else:
        # پرداخت ناموفق
        payment = Payment.objects.filter(authority=authority, order=order).first()
        if payment:
            payment.status = 'failed'
            payment.save()

        error_code = data.get('code', 'unknown')
        return HttpResponseRedirect(f"{frontend_url}/payment/failed?tracking={tracking}&error_code={error_code}")


@csrf_exempt
def payment_inquiry(request, tracking):
    """
    استعلام وضعیت پرداخت
    این متد فقط وضعیت تراکنش را بررسی می‌کند و برای تایید استفاده نمی‌شود
    """
    if request.method != 'GET':
        return HttpResponseNotAllowed(['GET'])

    order = get_object_or_404(Order, tracking_code=tracking)

    # یافتن آخرین پرداخت برای این سفارش
    payment = Payment.objects.filter(order=order).order_by('-created_at').first()

    if not payment:
        return JsonResponse({
            "success": False,
            "message": "هیچ پرداختی برای این سفارش یافت نشد"
        }, status=404)

    # استفاده از سرویس ZarinPal برای استعلام - sandbox برای کاربران تست
    is_test = _is_test_user(order.user)
    zarinpal = ZarinPalService(force_sandbox=is_test)
    success, data = zarinpal.inquiry_payment(authority=payment.authority)

    if success:
        payment_status = data.get('status', 'UNKNOWN')

        # نقشه بندی وضعیت‌های زرین‌پال به فارسی
        status_map = {
            'VERIFIED': 'تایید شده',
            'PAID': 'پرداخت شده (تایید نشده)',
            'IN_BANK': 'در حال پرداخت',
            'FAILED': 'ناموفق',
            'REVERSED': 'ریورس شده'
        }

        return JsonResponse({
            "success": True,
            "tracking_code": order.tracking_code,
            "authority": payment.authority,
            "amount": payment.amount,
            "status": payment_status,
            "status_fa": status_map.get(payment_status, payment_status),
            "payment_status": payment.status,
            "order_status": order.status,
            "ref_id": payment.ref_id if payment.ref_id else None,
            "created_at": payment.created_at.isoformat()
        })
    else:
        return JsonResponse({
            "success": False,
            "message": f"خطا در استعلام وضعیت: {data.get('error', 'خطای ناشناخته')}",
            "code": data.get('code', -1)
        }, status=400)


def _get_client_ip(request):
    """
    دریافت آدرس IP کاربر از request
    """
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0].strip()
    else:
        ip = request.META.get('REMOTE_ADDR', '')
    return ip


def _get_device_fingerprint(request):
    """
    Create a stable, non-PII fingerprint based on headers to approximate device identity.
    """
    ua = (request.META.get("HTTP_USER_AGENT") or "").strip()
    accept_lang = (request.META.get("HTTP_ACCEPT_LANGUAGE") or "").strip()
    raw = f"{ua}|{accept_lang}"
    if not raw.strip():
        return ""
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()[:32]


def _signup_identity_counts(ip_address, device_fingerprint):
    """
    Count how many accounts are tied to the given IP or device fingerprint.
    """
    ip_count = UserProfile.objects.filter(signup_ip=ip_address).count() if ip_address else 0
    device_count = (
        UserProfile.objects.filter(signup_device=device_fingerprint).count()
        if device_fingerprint else 0
    )
    return ip_count, device_count


@csrf_exempt
def send_otp_view(request):
    """
    ارسال کد OTP به شماره تلفن
    POST /api/auth/send-otp
    Body: {"phone_number": "09121234567"}
    """
    if request.method != 'POST':
        return HttpResponseNotAllowed(['POST'])

    try:
        payload = json.loads(request.body.decode('utf-8'))
    except Exception:
        return JsonResponse({"message": "JSON نامعتبر"}, status=400)

    phone_number = _normalize_login_identifier(payload.get('phone_number') or '')
    intent = (payload.get('intent') or '').strip().lower()

    # اعتبارسنجی شماره تلفن
    is_valid, result = KavenegarService.validate_phone_number(phone_number)
    if not is_valid:
        return JsonResponse({"message": result}, status=400)

    phone_number = result  # normalized phone number

    # دریافت IP کاربر
    ip_address = _get_client_ip(request)
    device_fingerprint = _get_device_fingerprint(request)

    # کپچا فقط برای درخواست‌های مشکوک (risk-based) لازم می‌شود
    captcha_response = _enforce_captcha(payload, phone_number, ip_address)
    if captcha_response is not None:
        return captcha_response

    # آیا کاربر با این شماره قبلا وجود دارد؟ (برای اینکه محدودیت فقط روی ثبت‌نام‌های جدید اعمال شود)
    user_exists = User.objects.filter(username=phone_number).exists() or UserProfile.objects.filter(phone_number=phone_number).exists()

    if intent == "signup" and user_exists:
        return JsonResponse({"message": "این شماره قبلاً ثبت‌نام شده است. لطفاً وارد شوید."}, status=400)
        
    if intent in ["login", "reset_password"] and not user_exists:
        return JsonResponse({"message": "کاربری با این شماره پیدا نشد. لطفاً ابتدا ثبت‌نام کنید."}, status=404)

    # محدودیت برای شماره‌ای که با IPهای متفاوت تلاش می‌کند (فقط برای ثبت‌نام جدید)
    if intent == "signup" and not user_exists:
        day_ago = timezone.now() - timedelta(hours=24)
        recent_ips = list(
            OTPVerification.objects.filter(
                phone_number=phone_number,
                created_at__gte=day_ago
            ).values_list('ip_address', flat=True).distinct()
        )
        # اگر IP جدید با IPهای ۲۴ ساعت گذشته متفاوت باشد، به جای خطا، کد قبلی را باطل می‌کنیم تا کاربر بتواند کد جدید بگیرد
        clean_recent_ips = [ip for ip in recent_ips if ip]
        if clean_recent_ips and ip_address and ip_address not in clean_recent_ips:
            OTPVerification.objects.filter(
                phone_number=phone_number,
                is_used=False,
                expires_at__gt=timezone.now()
            ).update(is_used=True, expires_at=timezone.now())

        # محدودیت حساب جدید بر اساس IP یا دستگاه
        ip_signups, device_signups = _signup_identity_counts(ip_address, device_fingerprint)
        if not OTP_RATE_LIMIT_DISABLED and MAX_PANELS_PER_IDENTITY:
            if ip_signups >= MAX_PANELS_PER_IDENTITY or device_signups >= MAX_PANELS_PER_IDENTITY:
                return JsonResponse({
                    "message": "امکان ایجاد بیش از ۲ حساب از این اتصال/دستگاه وجود ندارد."
                }, status=429)

    # بررسی محدودیت زمانی: حداقل فاصله ۲ دقیقه بین هر درخواست برای یک شماره تلفن
    two_minutes_ago = timezone.now() - timedelta(minutes=2)
    last_requested_otp = OTPVerification.objects.filter(
        phone_number=phone_number,
        created_at__gte=two_minutes_ago
    ).order_by('-created_at').first()
    if last_requested_otp and phone_number not in OTP_WHITELIST_NUMBERS and not OTP_RATE_LIMIT_DISABLED:
        remaining_seconds = int((last_requested_otp.created_at + timedelta(minutes=2) - timezone.now()).total_seconds())
        if remaining_seconds > 0:
            return JsonResponse({
                "message": f"لطفاً {remaining_seconds} ثانیه دیگر صبر کنید.",
                "remaining_seconds": remaining_seconds
            }, status=429)

    # محدودیت تعداد درخواست: حداکثر ۷ بار در ساعت برای هر شماره تلفن
    one_hour_ago = timezone.now() - timedelta(hours=1)
    hourly_count = OTPVerification.objects.filter(
        phone_number=phone_number,
        created_at__gte=one_hour_ago
    ).count()
    if hourly_count >= 7 and phone_number not in OTP_WHITELIST_NUMBERS and not OTP_RATE_LIMIT_DISABLED:
        return JsonResponse({
            "message": "تعداد درخواست‌های شما بیش از حد مجاز (۷ بار در ساعت) است. لطفاً یک ساعت دیگر تلاش کنید."
        }, status=429)

    # محدودیت روزانه برای جلوگیری از سوءاستفاده
    day_ago = timezone.now() - timedelta(hours=24)
    daily_count = OTPVerification.objects.filter(
        phone_number=phone_number,
        created_at__gte=day_ago
    ).count()

    DAILY_CAP = 20
    if daily_count >= DAILY_CAP and phone_number not in OTP_WHITELIST_NUMBERS and not OTP_RATE_LIMIT_DISABLED:
        return JsonResponse({
            "message": "محدودیت درخواست روزانه فعال شده است. لطفاً ۲۴ ساعت دیگر تلاش کنید."
        }, status=429)

    # بررسی محدودیت IP: حداکثر 3 درخواست در 10 دقیقه گذشته
    ten_minutes_ago = timezone.now() - timedelta(minutes=10)
    recent_requests = OTPVerification.objects.filter(
        ip_address=ip_address,
        created_at__gte=ten_minutes_ago
    ).count()

    if phone_number not in OTP_WHITELIST_NUMBERS and recent_requests >= 3 and not OTP_RATE_LIMIT_DISABLED:
        reuse = OTPVerification.get_latest_valid_otp(phone_number)
        if reuse and reuse.expires_at > timezone.now():
            reuse.expires_at = max(reuse.expires_at, timezone.now() + timedelta(minutes=2))
            reuse.save(update_fields=["expires_at"])
            return JsonResponse({
                "message": "تعداد درخواست‌ها زیاد است. لطفاً آخرین کد ارسال‌شده را وارد کنید.",
                "reuse_last_code": True,
                "expires_in": int((reuse.expires_at - timezone.now()).total_seconds())
            }, status=429)
        return JsonResponse({
            "message": "تعداد درخواست‌های شما از حد مجاز گذشته است. لطفاً بعداً تلاش کنید."
        }, status=429)

    # ایجاد کد OTP جدید
    otp = OTPVerification.create_otp(phone_number, ip_address)

    # ارسال کد از طریق Kavenegar
    success, message = KavenegarService.send_verification_code(
        phone_number=phone_number,
        otp_code=otp.otp_code
    )

    if not success:
        # در صورت شکست در ارسال، OTP را حذف می‌کنیم
        otp.delete()
        return JsonResponse({
            "message": f"خطا در ارسال کد تایید: {message}"
        }, status=500)

    return JsonResponse({
        "success": True,
        "message": "کد تایید با موفقیت ارسال شد",
        "expires_in": 120,  # 2 دقیقه
        "user_exists": user_exists  # آیا کاربر قبلا ثبت نام کرده
    })


@csrf_exempt
def reset_password_request(request):
    if request.method != 'POST':
        return HttpResponseNotAllowed(['POST'])
    try:
        payload = json.loads(request.body.decode('utf-8'))
    except Exception:
        return JsonResponse({"message": "JSON نامعتبر"}, status=400)

    phone_number = _normalize_login_identifier(payload.get('phone_number') or '')
    is_valid, result = KavenegarService.validate_phone_number(phone_number)
    if not is_valid:
        return JsonResponse({"message": result}, status=400)
    phone_number = result

    user_exists = User.objects.filter(username=phone_number).exists() or UserProfile.objects.filter(phone_number=phone_number).exists()
    if not user_exists:
        return JsonResponse({"message": "کاربری با این شماره پیدا نشد"}, status=404)

    ip_address = _get_client_ip(request)

    # کپچا فقط برای درخواست‌های مشکوک (risk-based) لازم می‌شود
    captcha_response = _enforce_captcha(payload, phone_number, ip_address)
    if captcha_response is not None:
        return captcha_response

    # بررسی محدودیت زمانی: حداقل فاصله ۲ دقیقه بین هر درخواست برای یک شماره تلفن
    two_minutes_ago = timezone.now() - timedelta(minutes=2)
    last_requested_otp = OTPVerification.objects.filter(
        phone_number=phone_number,
        created_at__gte=two_minutes_ago
    ).order_by('-created_at').first()
    if last_requested_otp and phone_number not in OTP_WHITELIST_NUMBERS and not OTP_RATE_LIMIT_DISABLED:
        remaining_seconds = int((last_requested_otp.created_at + timedelta(minutes=2) - timezone.now()).total_seconds())
        if remaining_seconds > 0:
            return JsonResponse({
                "message": f"لطفاً {remaining_seconds} ثانیه دیگر صبر کنید.",
                "remaining_seconds": remaining_seconds
            }, status=429)

    # محدودیت تعداد درخواست: حداکثر ۷ بار در ساعت برای هر شماره تلفن
    one_hour_ago = timezone.now() - timedelta(hours=1)
    hourly_count = OTPVerification.objects.filter(
        phone_number=phone_number,
        created_at__gte=one_hour_ago
    ).count()
    if hourly_count >= 7 and phone_number not in OTP_WHITELIST_NUMBERS and not OTP_RATE_LIMIT_DISABLED:
        return JsonResponse({
            "message": "تعداد درخواست‌های شما بیش از حد مجاز (۷ بار در ساعت) است. لطفاً یک ساعت دیگر تلاش کنید."
        }, status=429)

    # محدودیت روزانه برای جلوگیری از سوءاستفاده
    day_ago = timezone.now() - timedelta(hours=24)
    daily_count = OTPVerification.objects.filter(
        phone_number=phone_number,
        created_at__gte=day_ago
    ).count()

    DAILY_CAP = 20
    if daily_count >= DAILY_CAP and phone_number not in OTP_WHITELIST_NUMBERS and not OTP_RATE_LIMIT_DISABLED:
        return JsonResponse({
            "message": "محدودیت درخواست روزانه فعال شده است. لطفاً ۲۴ ساعت دیگر تلاش کنید."
        }, status=429)

    # محدودیت IP: حداکثر 3 درخواست در 10 دقیقه گذشته
    ten_minutes_ago = timezone.now() - timedelta(minutes=10)
    recent_requests = OTPVerification.objects.filter(
        ip_address=ip_address,
        created_at__gte=ten_minutes_ago
    ).count()
    if phone_number not in OTP_WHITELIST_NUMBERS and recent_requests >= 3 and not OTP_RATE_LIMIT_DISABLED:
        reuse = OTPVerification.get_latest_valid_otp(phone_number)
        if reuse and reuse.expires_at > timezone.now():
            reuse.expires_at = max(reuse.expires_at, timezone.now() + timedelta(minutes=2))
            reuse.save(update_fields=["expires_at"])
            return JsonResponse({
                "message": "تعداد درخواست‌ها زیاد است. لطفاً آخرین کد ارسال‌شده را وارد کنید.",
                "reuse_last_code": True,
                "expires_in": int((reuse.expires_at - timezone.now()).total_seconds())
            }, status=429)
        return JsonResponse({"message": "تعداد درخواست‌های شما از حد مجاز گذشته است. لطفاً بعداً تلاش کنید."}, status=429)

    otp = OTPVerification.create_otp(phone_number, ip_address)
    success, message = KavenegarService.send_verification_code(phone_number=phone_number, otp_code=otp.otp_code)
    if not success:
        otp.delete()
        return JsonResponse({"message": f"خطا در ارسال کد: {message}"}, status=500)

    return JsonResponse({"success": True, "message": "کد تایید برای بازیابی رمز ارسال شد", "expires_in": 120})


@csrf_exempt
def reset_password_confirm(request):
    if request.method != 'POST':
        return HttpResponseNotAllowed(['POST'])
    try:
        payload = json.loads(request.body.decode('utf-8'))
    except Exception:
        return JsonResponse({"message": "JSON نامعتبر"}, status=400)

    try:
        phone_number = _normalize_login_identifier(payload.get('phone_number') or '')
        otp_code = _normalize_otp_code(payload.get('otp_code') or '')
        new_password = (payload.get('password') or '').strip()

        if not phone_number or not otp_code or not new_password:
            return JsonResponse({"message": "شماره، کد و رمز جدید الزامی است"}, status=400)
        if len(new_password) < 6:
            return JsonResponse({"message": "رمز عبور باید حداقل ۶ کاراکتر باشد"}, status=400)

        is_valid, result = KavenegarService.validate_phone_number(phone_number)
        if not is_valid:
            return JsonResponse({"message": result}, status=400)
        phone_number = result

        profile_with_phone = UserProfile.objects.filter(phone_number=phone_number).select_related("user").first()
        if profile_with_phone and profile_with_phone.user:
            user = profile_with_phone.user
        else:
            user = User.objects.filter(username=phone_number).first()
        if not user:
            return JsonResponse({"message": "کاربری با این شماره پیدا نشد"}, status=404)

        now = timezone.now()
        otp = OTPVerification.objects.filter(
            phone_number=phone_number,
            is_used=False,
            expires_at__gt=now
        ).order_by('-created_at').first()
        if not otp:
            return JsonResponse({"message": "کد تایید منقضی شده یا یافت نشد."}, status=400)

        # محدودیت تلاش: 3 بار برای بازیابی رمز
        if otp.attempts >= 3:
            otp.is_used = True
            otp.save(update_fields=["is_used"])
            return JsonResponse({"message": "تعداد تلاش‌های نامعتبر از حد مجاز گذشته است. لطفاً کد جدیدی درخواست کنید."}, status=400)

        if otp.otp_code != otp_code:
            otp.increment_attempts()
            remaining_attempts = max(0, 3 - otp.attempts)
            return JsonResponse({"message": f"کد تایید نادرست است. {remaining_attempts} تلاش باقی‌مانده"}, status=400)

        otp.mark_as_verified()
        otp.mark_as_used()
        user.set_password(new_password)
        user.save()

        # پس از تغییر رمز، کاربر را لاگین می‌کنیم تا بدون وقفه وارد پنل شود
        login(request, user)
        request.session.set_expiry(60 * 60 * 24 * 31)  # 31 days to reduce SMS costs
        try:
            profile, _ = UserProfile.objects.get_or_create(user=user)
        except MultipleObjectsReturned:
            profile = UserProfile.objects.filter(user=user).order_by('id').first()

        return JsonResponse({
            "success": True,
            "message": "رمز عبور با موفقیت تغییر کرد",
            "user": {
                "id": user.id,
                "name": user.get_full_name() or user.username,
                "email": user.email,
                "phone": user.username,
                "is_admin": _is_admin_user(user),
                "wallet_balance": profile.wallet_balance if profile else 0,
            }
        })
    except Exception as exc:
        logger.exception("reset_password_confirm failed")
        return JsonResponse({"message": "خطای داخلی سرور", "error": str(exc)}, status=500)


@csrf_exempt
def verify_otp_view(request):
    """
    تایید کد OTP و ثبت‌نام/ورود کاربر
    POST /api/auth/verify-otp
    Body: {"phone_number": "09121234567", "otp_code": "123456", "email": "user@example.com", "password": "secret123"}
    """
    if request.method != 'POST':
        return HttpResponseNotAllowed(['POST'])

    try:
        payload = json.loads(request.body.decode('utf-8'))
    except Exception:
        return JsonResponse({"message": "JSON نامعتبر"}, status=400)

    phone_number = _normalize_login_identifier(payload.get('phone_number') or '')
    otp_code = _normalize_otp_code(payload.get('otp_code') or '')
    email = (payload.get('email') or '').strip()
    first_name = (payload.get('first_name') or '').strip()
    last_name = (payload.get('last_name') or '').strip()
    password = (payload.get('password') or '').strip()
    ip_address = _get_client_ip(request)
    device_fingerprint = _get_device_fingerprint(request)
    intent = (payload.get('intent') or '').strip().lower()
    phase = (payload.get('phase') or '').strip().lower()

    if not phone_number or not otp_code:
        return JsonResponse({"message": "شماره تلفن و کد تایید الزامی است"}, status=400)

    # اعتبارسنجی شماره تلفن
    is_valid, result = KavenegarService.validate_phone_number(phone_number)
    if not is_valid:
        return JsonResponse({"message": result}, status=400)

    phone_number = result  # normalized

    # یافتن آخرین کد معتبر
    now = timezone.now()
    otp = OTPVerification.objects.filter(
        phone_number=phone_number,
        is_used=False,
        expires_at__gt=now
    ).order_by('-created_at').first()

    if not otp:
        return JsonResponse({
            "message": "کد تایید منقضی شده یا یافت نشد. لطفاً کد جدیدی درخواست کنید."
        }, status=400)

    # بررسی تعداد تلاش‌های نامعتبر (حداکثر 5 بار)
    if not otp.is_verified:
        if otp.attempts >= 5:
            otp.is_used = True  # غیرفعال کردن کد
            otp.save()
            return JsonResponse({
                "message": "تعداد تلاش‌های نامعتبر از حد مجاز گذشته است. لطفاً کد جدیدی درخواست کنید."
            }, status=400)

        # بررسی صحت کد
        if otp.otp_code != otp_code:
            otp.increment_attempts()
            remaining_attempts = 5 - otp.attempts
            return JsonResponse({
                "message": f"کد تایید نادرست است. {remaining_attempts} تلاش باقیمانده",
                "remaining_attempts": remaining_attempts
            }, status=400)
    else:
        # اگر قبلا تایید شده، باید همان کد باشد
        if otp.otp_code != otp_code:
            return JsonResponse({"message": "کد تایید نادرست است."}, status=400)

    # کد صحیح است
    otp.mark_as_verified()

    # بررسی اینکه آیا کاربری با این شماره تلفن وجود دارد
    profile_with_phone = UserProfile.objects.filter(phone_number=phone_number).select_related("user").first()
    if profile_with_phone and profile_with_phone.user:
        user = profile_with_phone.user
    else:
        user = User.objects.filter(username=phone_number).first()

    if user:
        if intent == "signup":
            return JsonResponse({"message": "این شماره قبلاً ثبت‌نام شده است. لطفاً وارد شوید."}, status=400)
        # کاربر قبلاً وجود دارد، login می‌کنیم
        login(request, user)
        request.session.set_expiry(60 * 60 * 24 * 31)  # 31 days to reduce SMS costs
        otp.mark_as_used()

        try:
            profile, _ = UserProfile.objects.get_or_create(user=user)
        except MultipleObjectsReturned:
            profile = UserProfile.objects.filter(user=user).order_by('id').first()

        # Always update phone_number in profile to ensure it's current
        profile_dirty = False
        if profile.phone_number != phone_number:
            profile.phone_number = phone_number
            profile_dirty = True
        if not profile.signup_ip and ip_address:
            profile.signup_ip = ip_address
            profile_dirty = True
        if not profile.signup_device and device_fingerprint:
            profile.signup_device = device_fingerprint
            profile_dirty = True
        if profile_dirty:
            profile.save()

        # Update email and name if provided and user doesn't have them
        updated = False
        if email and not user.email:
            user.email = email
            updated = True
        if first_name and not user.first_name:
            user.first_name = first_name
            updated = True
        if last_name and not user.last_name:
            user.last_name = last_name
            updated = True
        if updated:
            user.save()

        avatar_url = ""
        if getattr(profile, "avatar", None):
            try:
                avatar_url = request.build_absolute_uri(profile.avatar.url)
            except Exception:
                avatar_url = ""

        return JsonResponse({
            "success": True,
            "message": "ورود موفقیت‌آمیز",
            "user": {
                "id": user.id,
                "name": user.get_full_name() or user.username,
                "email": user.email,
                "phone": phone_number,
                "is_admin": profile.tier == "admin" or user.is_staff,
                "wallet_balance": profile.wallet_balance,
                "avatar_url": avatar_url,
            }
        })
    else:
        # محدودیت ثبت‌نام در IPهای متفاوت یا ثبت‌نام سریالی
        if otp.ip_address and otp.ip_address != ip_address:
            # اجازه می‌دهیم کد روی IP جدید تایید شود و IP ذخیره‌شده را به‌روزرسانی می‌کنیم
            otp.ip_address = ip_address
            otp.save(update_fields=["ip_address"])

        ip_signups, device_signups = _signup_identity_counts(ip_address, device_fingerprint)
        if not OTP_RATE_LIMIT_DISABLED and MAX_PANELS_PER_IDENTITY:
            if ip_signups >= MAX_PANELS_PER_IDENTITY or device_signups >= MAX_PANELS_PER_IDENTITY:
                return JsonResponse(
                    {"message": "امکان ایجاد بیش از ۲ حساب از این اتصال/دستگاه وجود ندارد."},
                    status=429,
                )

        if intent == "signup" and phase == "otp-only":
            # فقط مرحله دوم را تایید می‌کنیم، کاربر بعداً با همین کد ثبت‌نام را کامل می‌کند
            otp.mark_as_verified()
            return JsonResponse({
                "success": True,
                "otp_verified": True,
                "message": "کد تایید شد. لطفاً اطلاعات ثبت‌نام را تکمیل کنید."
            })

        # کاربر جدید است، validation برای فیلدهای الزامی
        if not first_name:
            return JsonResponse({"message": "نام الزامی است (برای ثبت نام)"}, status=400)

        if not last_name:
            return JsonResponse({"message": "نام خانوادگی الزامی است (برای ثبت نام)"}, status=400)

        if not email:
            return JsonResponse({"message": "ایمیل الزامی است (برای ثبت نام)"}, status=400)

        # اعتبارسنجی ایمیل
        if '@' not in email:
            return JsonResponse({"message": "فرمت ایمیل نامعتبر است"}, status=400)

        # رمز عبور ساده اما ضروری
        if not password or len(password) < 6:
            return JsonResponse({"message": "رمز عبور باید حداقل ۶ کاراکتر باشد"}, status=400)

        # کاربر جدید است، ایجاد می‌کنیم
        # username = phone_number, برای سادگی
        user = User.objects.create(
            username=phone_number,
            email=email,
            first_name=first_name,
            last_name=last_name
        )
        user.set_password(password)
        user.save()

        profile, _ = UserProfile.objects.get_or_create(user=user)
        # Save phone_number in profile
        profile.phone_number = phone_number
        if ip_address:
            profile.signup_ip = ip_address
        if device_fingerprint:
            profile.signup_device = device_fingerprint
        profile.save()

        # Credit the referrer if this signup came through a referral link.
        try:
            from .rewards import process_referral
            process_referral(user, payload.get('ref') or payload.get('referral_code'))
        except Exception:
            logger.exception("referral processing failed for otp signup user %s", user.id)

        login(request, user)
        request.session.set_expiry(60 * 60 * 24 * 31)  # 31 days to reduce SMS costs
        otp.mark_as_used()

        return JsonResponse({
            "success": True,
            "message": "ثبت‌نام موفقیت‌آمیز",
            "user": {
                "id": user.id,
                "name": user.get_full_name() or user.username,
                "email": user.email,
                "phone": phone_number,
                "is_admin": False,
                "wallet_balance": 0,
                "avatar_url": "",
            }
        }, status=201)


# ==================== PRODUCT COMMENTS API ====================

@csrf_exempt
def product_comments(request, slug):
    """
    GET: Fetch all approved comments for a product
    POST: Create a new comment for a product
    """
    product = get_object_or_404(Product, slug=slug)

    if request.method == "GET":
        # Fetch all approved comments
        comments = ProductComment.objects.filter(
            product=product,
            is_approved=True
        ).select_related('user', 'user__profile', 'reply_user').order_by('-created_at')

        comments_data = []
        for comment in comments:
            # Determine role badges for author / reply (admin vs moderator vs user)
            author_role = "user"
            if comment.user and comment.user.is_authenticated:
                try:
                    tier = getattr(getattr(comment.user, "profile", None), "tier", "")
                except Exception:
                    tier = ""
                if getattr(comment.user, "is_staff", False) and tier == "admin":
                    author_role = "admin"
                elif getattr(comment.user, "is_staff", False):
                    author_role = "moderator"
                elif _is_admin_user(comment.user):
                    author_role = "admin"

            reply_role = None
            if comment.reply_user and comment.reply_user.is_authenticated:
                try:
                    reply_tier = getattr(getattr(comment.reply_user, "profile", None), "tier", "")
                except Exception:
                    reply_tier = ""
                if getattr(comment.reply_user, "is_staff", False) and reply_tier == "admin":
                    reply_role = "admin"
                elif getattr(comment.reply_user, "is_staff", False):
                    reply_role = "moderator"
                elif _is_admin_user(comment.reply_user):
                    reply_role = "admin"
                else:
                    reply_role = "user"

            phone_mask = ""
            if comment.user and hasattr(comment.user, "profile") and comment.user.profile.phone_number:
                raw = comment.user.profile.phone_number
                digits = "".join(ch for ch in raw if ch.isdigit())
                if len(digits) >= 7:
                    phone_mask = f"{digits[:3]}***{digits[-3:]}"
            avatar_url = ""
            if comment.user and hasattr(comment.user, "profile") and getattr(comment.user.profile, "avatar", None):
                try:
                    avatar_url = request.build_absolute_uri(comment.user.profile.avatar.url)
                except Exception:
                    avatar_url = ""
            display_name = comment.author_name
            if display_name.startswith("[seed] "):
                display_name = display_name[len("[seed] "):]
            elif display_name.startswith("[seed]"):
                display_name = display_name[len("[seed]"):].lstrip()
            comments_data.append({
                "id": comment.id,
                "author_name": display_name,
                "author_role": author_role,
                "rating": comment.rating,
                "text": comment.text,
                "is_verified_purchase": comment.is_verified_purchase,
                "created_at": comment.created_at.isoformat(),
                "user_id": comment.user.id if comment.user else None,
                "phone_mask": phone_mask,
                "avatar_url": avatar_url,
                "reply": {
                    "text": comment.reply_text,
                    "author": (comment.reply_user.get_full_name() or comment.reply_user.username) if comment.reply_user else "",
                    "role": reply_role,
                    "created_at": comment.reply_created_at.isoformat() if comment.reply_created_at else None,
                } if comment.reply_text else None,
            })

        # Calculate rating statistics
        total_comments = comments.count()
        if total_comments > 0:
            avg_rating = sum(c.rating for c in comments) / total_comments
            rating_counts = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
            for comment in comments:
                rating_counts[comment.rating] += 1
        else:
            avg_rating = 0
            rating_counts = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}

        return JsonResponse({
            "success": True,
            "comments": comments_data,
            "stats": {
                "total": total_comments,
                "average_rating": round(avg_rating, 1),
                "rating_counts": rating_counts,
            }
        })

    elif request.method == "POST":
        try:
            data = json.loads(request.body)
        except json.JSONDecodeError:
            return JsonResponse({"success": False, "message": "Invalid JSON"}, status=400)

        # Validate required fields
        author_name = data.get("author_name", "").strip()
        rating = data.get("rating")
        text = data.get("text", "").strip()

        if not author_name:
            return JsonResponse({"success": False, "message": "نام نویسنده الزامی است"}, status=400)

        if not rating or not isinstance(rating, int) or rating < 1 or rating > 5:
            return JsonResponse({"success": False, "message": "امتیاز باید عددی بین ۱ تا ۵ باشد"}, status=400)

        if not text:
            return JsonResponse({"success": False, "message": "متن نظر الزامی است"}, status=400)

        if len(text) < 10:
            return JsonResponse({"success": False, "message": "متن نظر باید حداقل ۱۰ کاراکتر باشد"}, status=400)

        if len(text) > 2000:
            return JsonResponse({"success": False, "message": "متن نظر نمی‌تواند بیش از ۲۰۰۰ کاراکتر باشد"}, status=400)

        # Get current user if authenticated
        if not request.user.is_authenticated:
            return JsonResponse({"success": False, "message": "برای ثبت نظر باید وارد حساب کاربری شوید"}, status=401)
        user = request.user
        had_comment_for_product = ProductComment.objects.filter(product=product, user=user).exists()

        # Create the comment
        # Model has max_length=100; accept longer inputs but truncate safely.
        if len(author_name) > 100:
            author_name = author_name[:100]
        comment = ProductComment.objects.create(
            product=product,
            user=user,
            author_name=author_name,
            rating=rating,
            text=text,
            is_approved=True,  # Auto-approve for now, can add moderation later
        )
        points_awarded = 0
        points_balance = None
        if not had_comment_for_product:
            try:
                from .rewards import award_comment_points
                points_awarded = award_comment_points(user, product)
                profile, _ = UserProfile.objects.get_or_create(user=user)
                points_balance = profile.points_balance
            except Exception:
                logger.exception("comment points failed for user %s product %s", user.id, product.id)

        return JsonResponse({
            "success": True,
            "message": "نظر شما با موفقیت ثبت شد",
            "points_awarded": points_awarded,
            "points_balance": points_balance,
            "comment": {
                "id": comment.id,
                "author_name": comment.author_name,
                "rating": comment.rating,
                "text": comment.text,
                "is_verified_purchase": comment.is_verified_purchase,
                "created_at": comment.created_at.isoformat(),
                "phone_mask": "",
                "user_id": comment.user.id if comment.user else None,
                "avatar_url": "",
                "reply": None,
            }
        }, status=201)

    else:
        return HttpResponseNotAllowed(["GET", "POST"])


@csrf_exempt
@login_required
def delete_comment(request, comment_id):
    """
    DELETE: Delete a comment (only by the comment author or admin)
    """
    if request.method != "DELETE":
        return HttpResponseNotAllowed(["DELETE"])

    comment = get_object_or_404(ProductComment, id=comment_id)

    # Check if user is the author or admin
    is_admin = request.user.is_staff or (
        hasattr(request.user, 'profile') and request.user.profile.tier == "admin"
    )

    if comment.user != request.user and not is_admin:
        return JsonResponse({
            "success": False,
            "message": "شما مجاز به حذف این نظر نیستید"
        }, status=403)

    comment.delete()

    return JsonResponse({
        "success": True,
        "message": "نظر با موفقیت حذف شد"
    })


@csrf_exempt
@login_required
def reply_comment(request, comment_id):
    """
    POST: Reply to a comment (any authenticated user می‌تواند پاسخ ثبت کند).
    """
    if request.method != "POST":
        return HttpResponseNotAllowed(["POST"])

    comment = get_object_or_404(ProductComment, id=comment_id)

    try:
        payload = json.loads(request.body.decode("utf-8"))
    except Exception:
        return JsonResponse({"success": False, "message": "JSON نامعتبر"}, status=400)

    reply_text = (payload.get("reply_text") or "").strip()
    if not reply_text:
        return JsonResponse({"success": False, "message": "متن پاسخ نمی‌تواند خالی باشد"}, status=400)
    if len(reply_text) > 2000:
        return JsonResponse({"success": False, "message": "حداکثر ۲۰۰۰ کاراکتر مجاز است"}, status=400)

    comment.reply_text = reply_text
    comment.reply_user = request.user
    comment.reply_created_at = timezone.now()
    comment.save(update_fields=["reply_text", "reply_user", "reply_created_at", "updated_at"])

    phone_mask = ""
    if comment.user and hasattr(comment.user, "profile") and comment.user.profile.phone_number:
        raw = comment.user.profile.phone_number
        digits = "".join(ch for ch in raw if ch.isdigit())
        if len(digits) >= 7:
            phone_mask = f"{digits[:3]}***{digits[-3:]}"

    return JsonResponse({
        "success": True,
        "comment": {
            "id": comment.id,
            "author_name": comment.author_name,
            "rating": comment.rating,
            "text": comment.text,
            "is_verified_purchase": comment.is_verified_purchase,
            "created_at": comment.created_at.isoformat(),
            "user_id": comment.user.id if comment.user else None,
            "phone_mask": phone_mask,
            "reply": {
                "text": comment.reply_text,
                "author": (comment.reply_user.get_full_name() or comment.reply_user.username) if comment.reply_user else "",
                "created_at": comment.reply_created_at.isoformat() if comment.reply_created_at else None,
            },
        }
    })


def _xbox_account_owner_info(acc: XboxAccount):
    """Resolve per-person owner grouping info for an Xbox archive account.

    Owner is DERIVED from the linked order when present; otherwise it falls back
    to the manual owner_label / owner_phone fields on the account itself.
    Returns a dict with the exact keys the admin UI depends on.
    """
    order = acc.order
    if order is not None:
        if getattr(order, "is_reseller_order", False):
            seller_code = (order.reseller_seller_code or "").strip()
            reseller_email = _order_notify_email(order)
            reseller_name = seller_code or "همکار"
            try:
                profile = order.user.reseller_profile
                reseller_name = profile.support_name or seller_code or "همکار"
            except (ResellerProfile.DoesNotExist, AttributeError):
                pass
            return {
                "owner_key": f"reseller:{seller_code}" if seller_code else "reseller:",
                "owner_label": reseller_name,
                "owner_phone": (order.phone or "").strip(),
                "owner_email": reseller_email or "",
                "is_reseller": True,
                "seller_code": seller_code,
            }
        phone = (order.phone or "").strip()
        # Customer display name
        name = ""
        if order.user:
            name = (order.user.get_full_name() or order.user.username or "").strip()
        if not name:
            epic = (order.epic_username or "").strip()
            name = epic or phone
        email = _get_order_customer_email(order)
        if phone:
            owner_key = f"phone:{phone}"
        else:
            owner_key = "none"
        return {
            "owner_key": owner_key,
            "owner_label": name or phone or "بدون مالک",
            "owner_phone": phone,
            "owner_email": email or "",
            "is_reseller": False,
            "seller_code": "",
        }

    # No linked order — fall back to manual fields.
    manual_phone = (acc.owner_phone or "").strip()
    manual_label = (acc.owner_label or "").strip()

    # Check if this manual owner is a verified reseller profile
    reseller = None
    if manual_phone:
        reseller = ResellerProfile.objects.filter(contact_phone=manual_phone, status="verified").first()
    if not reseller and manual_label:
        reseller = ResellerProfile.objects.filter(Q(seller_code=manual_label) | Q(support_name=manual_label), status="verified").first()

    if reseller:
        return {
            "owner_key": f"reseller:{reseller.seller_code}",
            "owner_label": reseller.support_name or reseller.seller_code,
            "owner_phone": reseller.contact_phone or manual_phone,
            "owner_email": reseller.email or "",
            "is_reseller": True,
            "seller_code": reseller.seller_code,
        }

    if manual_phone:
        owner_key = f"phone:{manual_phone}"
    elif manual_label:
        owner_key = f"label:{manual_label}"
    else:
        owner_key = "none"
    return {
        "owner_key": owner_key,
        "owner_label": manual_label or "بدون مالک",
        "owner_phone": manual_phone,
        "owner_email": "",
        "is_reseller": False,
        "seller_code": "",
    }


def _admin_xbox_account_dict(acc: XboxAccount):
    order_data = None
    if acc.order:
        customer_email = _get_order_customer_email(acc.order)
        order_data = {
            "id": acc.order.id,
            "tracking_code": acc.order.tracking_code,
            "status": acc.order.status,
            "status_fa": dict(Order.STATUS_CHOICES).get(acc.order.status, acc.order.status),
            "phone": acc.order.phone,
            "epic_username": acc.order.epic_username,
            "telegram": acc.order.telegram,
            "customer_email": customer_email,
        }

    owner = _xbox_account_owner_info(acc)

    return {
        "id": acc.id,
        "email": acc.email,
        "password": acc.password,
        "status": acc.status,
        "status_display": dict(XboxAccount.STATUS_CHOICES).get(acc.status, acc.status),
        "note": acc.note,
        "order_id": acc.order_id,
        "order": order_data,
        "owner_key": owner["owner_key"],
        "owner_label": owner["owner_label"],
        "owner_phone": owner["owner_phone"],
        "owner_email": owner["owner_email"],
        "is_reseller": owner["is_reseller"],
        "seller_code": owner["seller_code"],
        "created_at": acc.created_at.isoformat(),
        "updated_at": acc.updated_at.isoformat() if acc.updated_at else acc.created_at.isoformat(),
        "used_at": acc.used_at.isoformat() if acc.used_at else None,
    }


@csrf_exempt
def admin_xbox_accounts(request):
    """
    GET: لیست اکانت‌های Xbox
    POST: افزودن اکانت جدید
    """
    if not request.user.is_authenticated:
        return JsonResponse({"detail": "authentication required"}, status=401)
    if not _is_admin_user(request.user):
        return JsonResponse({"detail": "forbidden"}, status=403)

    if request.method == 'GET':
        search = request.GET.get("search", "").strip()
        accounts = XboxAccount.objects.select_related("order", "order__user").order_by("-updated_at", "-created_at")
        
        if search:
            accounts = accounts.filter(
                Q(email__icontains=search)
                | Q(order__tracking_code__icontains=search)
                | Q(order__phone__icontains=search)
                | Q(order__epic_username__icontains=search)
                | Q(order__telegram__icontains=search)
                | Q(order__user__email__icontains=search)
                | Q(note__icontains=search)
            )
            if search.isdigit():
                accounts = accounts.filter(Q(order__id=int(search)) | Q(id=int(search)))

        results = [_admin_xbox_account_dict(acc) for acc in accounts[:200]]
        return JsonResponse({"results": results})

    if request.method == 'POST':
        try:
            payload = json.loads(request.body.decode('utf-8'))
        except Exception:
            return JsonResponse({"message": "JSON نامعتبر"}, status=400)

        email = (payload.get("email") or "").strip()
        password = (payload.get("password") or "").strip()
        note = (payload.get("note") or "").strip()
        owner_label = (payload.get("owner_label") or "").strip()
        owner_phone = (payload.get("owner_phone") or "").strip()
        order_id = payload.get("order_id")
        order_tracking_code = (payload.get("order_tracking_code") or "").strip()
        status = (payload.get("status") or "").strip().lower()

        if not email or not password:
            return JsonResponse({"message": "ایمیل و رمز عبور الزامی است"}, status=400)

        order = None
        if order_id not in (None, ""):
            try:
                resolved_order_id = int(order_id)
            except (TypeError, ValueError):
                return JsonResponse({"message": "شناسه سفارش نامعتبر است"}, status=400)
            order = Order.objects.select_related("user").filter(id=resolved_order_id).first()
            if not order:
                return JsonResponse({"message": "سفارش مرتبط یافت نشد"}, status=404)
        elif order_tracking_code:
            order = Order.objects.select_related("user").filter(tracking_code=order_tracking_code).first()
            if not order:
                return JsonResponse({"message": "سفارش مرتبط یافت نشد"}, status=404)

        valid_statuses = {key for key, _ in XboxAccount.STATUS_CHOICES}
        if status and status not in valid_statuses:
            return JsonResponse({"message": "وضعیت نامعتبر است"}, status=400)
        if not status:
            status = "used" if order else "available"

        acc = XboxAccount.objects.filter(email__iexact=email).first()
        created = acc is None
        if acc is None:
            acc = XboxAccount(email=email)

        acc.email = email
        acc.password = password
        acc.order = order
        acc.status = status
        acc.note = note
        acc.owner_label = owner_label
        acc.owner_phone = owner_phone
        if status == "used" and not acc.used_at:
            acc.used_at = timezone.now()
        acc.save()

        response_data = _admin_xbox_account_dict(acc)
        response_data["message"] = "اکانت با موفقیت اضافه شد" if created else "اکانت بروزرسانی شد"
        return JsonResponse(response_data, status=201 if created else 200)

    return HttpResponseNotAllowed(['GET', 'POST'])


@csrf_exempt
def admin_cache_bust(request):
    if request.method != "GET":
        return HttpResponseNotAllowed(["GET"])

    requested_next = request.GET.get("next", "")
    target = _safe_internal_redirect_target(request, requested_next, ADMIN_PANEL_CACHE_BUST_PATH)

    html_target = escape(target)
    response = HttpResponse(
        f"""<!doctype html>
<html lang="fa">
<head>
  <meta charset="utf-8">
  <meta http-equiv="refresh" content="0;url={html_target}">
  <meta name="robots" content="noindex,nofollow">
  <title>Refreshing admin cache</title>
</head>
<body>
  <p>Refreshing admin cache...</p>
  <noscript><a href="{html_target}">Continue</a></noscript>
  <script>window.location.replace({json.dumps(target)});</script>
</body>
</html>""",
        status=200,
        content_type="text/html; charset=utf-8",
    )
    response["Refresh"] = f"0; url={target}"
    response["Cache-Control"] = "private, no-cache, no-store, max-age=0, must-revalidate"
    response["Clear-Site-Data"] = '"cache"'
    return response


@csrf_exempt
def admin_xbox_account_detail(request, account_id: int):
    """
    PATCH: ویرایش اکانت Xbox
    DELETE: حذف اکانت
    """
    if not request.user.is_authenticated:
        return JsonResponse({"detail": "authentication required"}, status=401)
    if not _is_admin_user(request.user):
        return JsonResponse({"detail": "forbidden"}, status=403)

    try:
        acc = XboxAccount.objects.get(id=account_id)
    except XboxAccount.DoesNotExist:
        return JsonResponse({"message": "اکانت یافت نشد"}, status=404)

    if request.method == 'PATCH':
        try:
            payload = json.loads(request.body.decode('utf-8'))
        except Exception:
            return JsonResponse({"message": "JSON نامعتبر"}, status=400)

        if "email" in payload:
            acc.email = payload["email"].strip()
        if "password" in payload:
            acc.password = payload["password"].strip()
        if "order_id" in payload:
            raw_order_id = payload.get("order_id")
            if raw_order_id in (None, ""):
                acc.order = None
            else:
                try:
                    resolved_order_id = int(raw_order_id)
                except (TypeError, ValueError):
                    return JsonResponse({"message": "شناسه سفارش نامعتبر است"}, status=400)
                order = Order.objects.select_related("user").filter(id=resolved_order_id).first()
                if not order:
                    return JsonResponse({"message": "سفارش مرتبط یافت نشد"}, status=404)
                acc.order = order
        if "order_tracking_code" in payload:
            raw_tracking_code = (payload.get("order_tracking_code") or "").strip()
            if not raw_tracking_code:
                acc.order = None
            else:
                order = Order.objects.select_related("user").filter(tracking_code=raw_tracking_code).first()
                if not order:
                    return JsonResponse({"message": "سفارش مرتبط یافت نشد"}, status=404)
                acc.order = order
        if "status" in payload:
            new_status = (payload["status"] or "").strip()
            if new_status not in {key for key, _ in XboxAccount.STATUS_CHOICES}:
                return JsonResponse({"message": "وضعیت نامعتبر است"}, status=400)
            acc.status = new_status
            if acc.status == "used" and not acc.used_at:
                acc.used_at = timezone.now()
        if "note" in payload:
            acc.note = payload["note"].strip()
        if "owner_label" in payload:
            acc.owner_label = (payload.get("owner_label") or "").strip()
        if "owner_phone" in payload:
            acc.owner_phone = (payload.get("owner_phone") or "").strip()

        acc.save()
        response_data = _admin_xbox_account_dict(acc)
        response_data["message"] = "اکانت بروزرسانی شد"
        return JsonResponse(response_data)

    if request.method == 'DELETE':
        acc.delete()
        return JsonResponse({"message": "اکانت حذف شد"})

    return HttpResponseNotAllowed(['PATCH', 'DELETE'])


def _get_usd_rate_toman():
    # 1. Try cache
    last_good = cache.get("currency_rates:last_good")
    if last_good and "usd" in last_good:
        try:
            return int(last_good["usd"]) // 10
        except Exception:
            pass

    # 2. If not in cache, let's scrape tgju
    try:
        session = requests.Session()
        session.trust_env = False
        session.proxies = {"http": "", "https": ""}
        response = session.get(
            TGJU_CURRENCY_URL,
            timeout=4,
            headers={
                "User-Agent": "Mozilla/5.0 (compatible; JinxFamily/1.0)",
                "Accept": "text/html,application/xhtml+xml",
            },
        )
        response.raise_for_status()
        rates = _parse_tgju_currency_rates(response.text)
        if rates and "usd" in rates:
            rates.update({
                "source": TGJU_CURRENCY_URL,
                "fetchedAt": timezone.now().isoformat(),
                "stale": False,
            })
            cache.set("currency_rates:last_good", rates, 86400)
            cache.set("currency_rates:fresh", True, 600)
            return int(rates["usd"]) // 10
    except Exception:
        pass

    return 65000  # Fallback Toman rate if everything fails


FINANCIAL_COSTS_SETTING_KEY = "financial_monthly_fixed_costs"
FINANCIAL_COST_PAYERS_SETTING_KEY = "financial_fixed_cost_payers"
FINANCIAL_OPEN_ORDER_STATUSES = ("paid", "registered", "processing", "needs_2fa", "needs_tr_region", "needs_xbox_info", "invalid_info")
FINANCIAL_PAID_PAYMENT_STATUSES = ("success", "verified", "refunded")


def _financial_config():
    """Return monthly fixed costs and their configured payment sources."""
    defaults = {"kavenegar": 0, "server": 0, "cloud": 0}
    raw = _get_setting(FINANCIAL_COSTS_SETTING_KEY, default=json.dumps(defaults, ensure_ascii=False)).value_text
    try:
        parsed = json.loads(raw or "{}")
    except (TypeError, ValueError):
        parsed = {}
    costs = {}
    for key in defaults:
        try:
            costs[key] = max(0, int(parsed.get(key, 0) or 0))
        except (TypeError, ValueError):
            costs[key] = 0

    payer_defaults = {
        "kavenegar": {"source": "main", "label": "حساب اصلی"},
        "server": {"source": "main", "label": "حساب اصلی"},
        "cloud": {"source": "external", "label": "ایلیا"},
    }
    raw_payers = _get_setting(
        FINANCIAL_COST_PAYERS_SETTING_KEY,
        default=json.dumps(payer_defaults, ensure_ascii=False),
    ).value_text
    try:
        parsed_payers = json.loads(raw_payers or "{}")
    except (TypeError, ValueError):
        parsed_payers = {}
    payers = {}
    for key, default in payer_defaults.items():
        raw_payer = parsed_payers.get(key, {})
        if not isinstance(raw_payer, dict):
            raw_payer = {}
        source = raw_payer.get("source")
        if source not in ("main", "external"):
            source = default["source"]
        label = str(raw_payer.get("label") or default["label"]).strip()[:80]
        payers[key] = {"source": source, "label": label}
    return costs, payers


def _financial_bounds(start_date, end_date):
    tz = timezone.get_current_timezone()
    start = timezone.make_aware(datetime.combine(start_date, time.min), tz)
    end = timezone.make_aware(datetime.combine(end_date, time.max), tz)
    return start, end


def _financial_lira_and_cost(order, lira_rate, gta_variant_cost):
    total_lira = 0.0
    total_cost = 0
    for item in order.items.all():
        qty = item.quantity or 1
        line_lira = float(item.price_lira or (item.product.price_lira if item.product else 0) or 0) * qty
        total_lira += line_lira
        variant_cost = gta_variant_cost.get(str(item.variant_id)) if item.variant_id else None
        total_cost += int(variant_cost * qty) if variant_cost else int(line_lira * lira_rate)
    return total_lira, total_cost


def _financial_gta_variant_costs():
    config, _ = _gta6_load_config()
    costs = {}
    for edition in config.get("pricing", {}).values():
        for cell in edition.values():
            variant_id = cell.get("variant_id")
            cost = int(cell.get("cost_toman", 0) or 0)
            if variant_id and cost > 0:
                costs[str(variant_id)] = cost
    return costs


def _hidden_accounting_fee(amount_toman):
    """Third-party accounting fee. This value must never be exposed in the site UI."""
    amount = max(0, int(amount_toman or 0))
    if amount < 1_000_000:
        return 0
    if amount <= 5_000_000:
        return 500_000
    if amount <= 10_000_000:
        return 800_000
    if amount <= 20_000_000:
        return 1_000_000
    if amount <= 30_000_000:
        return 1_500_000
    if amount <= 40_000_000:
        return 2_000_000
    return 3_000_000


def _zarinpal_datetime(value):
    parsed = parse_datetime(str(value or ""))
    if parsed and timezone.is_naive(parsed):
        parsed = timezone.make_aware(parsed)
    return parsed


def _zarinpal_amount_toman(value):
    try:
        amount = max(0, int(value or 0))
    except (TypeError, ValueError):
        amount = 0
    currency = getattr(settings, "ZARINPAL_RECONCILIATION_CURRENCY", "IRT").upper()
    return round(amount / 10) if currency == "IRR" else amount


def _sync_zarinpal_reconciliations(start_date, end_date):
    service = ZarinPalService()
    if not service.accounting_api_configured:
        return {
            "configured": False,
            "success": False,
            "error": "توکن Bearer زرین‌پال روی سرور تنظیم نشده است.",
        }
    try:
        terminal_id, rows = service.fetch_reconciliations(start_date, end_date)
        synced = 0
        with transaction.atomic():
            for row in rows:
                external_id = str(row.get("id") or "").strip()
                if not external_id:
                    continue
                amount = _zarinpal_amount_toman(row.get("amount"))
                ZarinpalReconciliation.objects.update_or_create(
                    external_id=external_id,
                    defaults={
                        "terminal_id": terminal_id,
                        "status": str(row.get("status") or "UNKNOWN").upper(),
                        "amount": amount,
                        "payable_at": _zarinpal_datetime(row.get("payable_at")),
                        "reconciled_at": _zarinpal_datetime(row.get("reconciled_at")),
                        "reference_id": str(row.get("reference_id") or "")[:160],
                        "hidden_accounting_fee": _hidden_accounting_fee(amount),
                        "raw_payload": row,
                    },
                )
                synced += 1
        return {"configured": True, "success": True, "synced": synced, "error": ""}
    except Exception as exc:
        logger.exception("ZarinPal reconciliation sync failed")
        return {
            "configured": True,
            "success": False,
            "error": str(exc) or "همگام‌سازی تسویه زرین‌پال ناموفق بود.",
        }


def _financial_reconciliation_totals(start_date, end_date):
    start, end = _financial_bounds(start_date, end_date)
    paid = ZarinpalReconciliation.objects.filter(
        status="PAID",
        reconciled_at__gte=start,
        reconciled_at__lte=end,
    )
    aggregate = paid.aggregate(
        amount=Sum("amount"),
        hidden_fee=Sum("hidden_accounting_fee"),
        count=Count("id"),
    )
    latest = paid.order_by("-reconciled_at").first()
    in_progress = ZarinpalReconciliation.objects.filter(status="IN_PROGRESS").aggregate(
        amount=Sum("amount"),
        count=Count("id"),
    )
    return {
        "amount": int(aggregate["amount"] or 0),
        "hidden_fee": int(aggregate["hidden_fee"] or 0),
        "count": int(aggregate["count"] or 0),
        "latest_at": latest.reconciled_at if latest else None,
        "latest_reference_id": latest.reference_id if latest else "",
        "pending_amount": int(in_progress["amount"] or 0),
        "pending_count": int(in_progress["count"] or 0),
    }


def _financial_period_totals(start_date, end_date, lira_rate):
    start, end = _financial_bounds(start_date, end_date)
    payments = list(
        Payment.objects.filter(
            verified_at__gte=start,
            verified_at__lte=end,
            status__in=FINANCIAL_PAID_PAYMENT_STATUSES,
            order__is_test_order=False,
        )
        .exclude(order__note__icontains="شارژ کیف پول")
        .exclude(order__status="wallet_topup")
        .select_related("order")
    )
    order_ids = {payment.order_id for payment in payments}
    orders = list(
        Order.objects.filter(id__in=order_ids)
        .prefetch_related("items", "items__product")
    )
    gta_costs = _financial_gta_variant_costs()
    gross_revenue = sum(int(payment.amount or 0) for payment in payments)
    gateway_fees = sum(int(payment.fee or 0) for payment in payments)
    purchase_cost = 0
    total_lira = 0.0
    for order in orders:
        if order.status in ("canceled", "refunded"):
            continue
        lira, cost = _financial_lira_and_cost(order, lira_rate, gta_costs)
        purchase_cost += cost
        total_lira += lira

    refunds = int(
        Order.objects.filter(
            is_test_order=False,
            refund_confirmed=True,
            refund_date__gte=start,
            refund_date__lte=end,
        ).aggregate(total=Sum("refund_amount"))["total"] or 0
    )
    transactions = AccountingTransaction.objects.filter(created_at__gte=start, created_at__lte=end)
    usd_rate = _get_usd_rate_toman()
    other_expenses = other_income = 0
    for txn in transactions:
        value = int(float(txn.amount or 0) * (usd_rate if txn.currency == "usd" else 1))
        if txn.entry_type == "expense":
            other_expenses += value
        else:
            other_income += value
    return {
        "order_count": len(orders),
        "gross_revenue": gross_revenue,
        "gateway_fees": gateway_fees,
        "refunds": refunds,
        "purchase_cost": purchase_cost,
        "total_lira": round(total_lira, 2),
        "other_expenses": other_expenses,
        "other_income": other_income,
    }


def admin_daily_lira_purchase(request):
    """Compact daily lira plan backed by exact ZarinPal reconciliation data."""
    if not request.user.is_authenticated:
        return JsonResponse({"detail": "authentication required"}, status=401)
    if not _is_admin_user(request.user):
        return JsonResponse({"detail": "forbidden"}, status=403)
    if request.method != "GET":
        return HttpResponseNotAllowed(["GET"])

    today = timezone.localdate()
    _, today_end = _financial_bounds(today, today)
    try:
        lira_rate = max(0, int(_get_setting("lira_rate", default="0").value_text or 0))
    except (TypeError, ValueError):
        lira_rate = 0
    gta_costs = _financial_gta_variant_costs()

    open_orders = list(
        Order.objects.filter(is_test_order=False, status__in=FINANCIAL_OPEN_ORDER_STATUSES)
        .exclude(note__icontains="شارژ کیف پول")
        .prefetch_related("items", "items__product")
        .order_by("created_at")
    )
    open_summary = {status: {"count": 0, "lira": 0.0} for status in FINANCIAL_OPEN_ORDER_STATUSES}
    open_rows = []
    for order in open_orders:
        lira, cost = _financial_lira_and_cost(order, lira_rate, gta_costs)
        if lira <= 0:
            continue
        open_summary[order.status]["count"] += 1
        open_summary[order.status]["lira"] += lira
        open_rows.append({
            "tracking_code": order.tracking_code,
            "status": order.status,
            "status_fa": dict(Order.STATUS_CHOICES).get(order.status, order.status),
            "created_at": order.created_at.isoformat(),
            "lira": round(lira, 2),
            "purchase_cost": cost,
        })

    history_start = today - timedelta(days=30)
    history_start_at = _financial_bounds(history_start, today)[0]
    history_payments = list(
        Payment.objects.filter(
            verified_at__gte=history_start_at,
            verified_at__lte=today_end,
            status__in=FINANCIAL_PAID_PAYMENT_STATUSES,
            order__is_test_order=False,
        )
        .exclude(order__note__icontains="شارژ کیف پول")
        .exclude(order__status="wallet_topup")
        .select_related("order")
        .order_by("verified_at")
    )
    paid_dates = {}
    for payment in history_payments:
        paid_dates.setdefault(payment.order_id, timezone.localtime(payment.verified_at).date())
    history_orders = list(
        Order.objects.filter(id__in=paid_dates)
        .exclude(status__in=("canceled", "refunded"))
        .prefetch_related("items", "items__product")
    )
    daily_lira = {history_start + timedelta(days=i): 0.0 for i in range(31)}
    product_daily = {}
    for order in history_orders:
        order_day = paid_dates[order.id]
        for item in order.items.all():
            qty = item.quantity or 1
            lira = float(item.price_lira or (item.product.price_lira if item.product else 0) or 0) * qty
            if lira <= 0:
                continue
            daily_lira[order_day] = daily_lira.get(order_day, 0.0) + lira
            key = str(item.variant_id or item.product_id or item.name)
            values = product_daily.setdefault(
                key,
                {history_start + timedelta(days=i): 0.0 for i in range(31)},
            )
            values[order_day] = values.get(order_day, 0.0) + lira
    yesterday_lira = daily_lira.get(today - timedelta(days=1), 0.0)
    recent_avg = sum(daily_lira.values()) / max(len(daily_lira), 1)
    same_weekday = [value for date, value in daily_lira.items() if date.weekday() == today.weekday()]
    same_weekday_avg = sum(same_weekday) / len(same_weekday) if same_weekday else recent_avg
    # Weekly sine adjustment is bounded so a thin data day cannot create an extreme buy plan.
    import math
    sine_factor = 1 + 0.15 * math.sin((2 * math.pi * today.weekday()) / 7)
    weekday_factor = same_weekday_avg / recent_avg if recent_avg else 1
    seasonal_factor = min(1.3, max(0.7, sine_factor * weekday_factor))
    forecast_lira = sum(
        (0.8 * values.get(today - timedelta(days=1), 0.0) * seasonal_factor)
        + (0.2 * (sum(values.values()) / max(len(values), 1)))
        for values in product_daily.values()
    )

    costs, payers = _financial_config()
    monthly_fixed_cost = sum(costs.values())
    weekly_fixed_cost = round(monthly_fixed_cost * 12 / 52)
    main_monthly_fixed_cost = sum(
        amount for key, amount in costs.items() if payers[key]["source"] == "main"
    )
    main_account_reserve = round(main_monthly_fixed_cost * 12 / 52)
    saturday_offset = (today.weekday() - 5) % 7
    week_start = today - timedelta(days=saturday_offset)
    sync = _sync_zarinpal_reconciliations(week_start, today + timedelta(days=1))
    today_reconciliation = _financial_reconciliation_totals(today, today)
    week_reconciliation = _financial_reconciliation_totals(week_start, today)
    week_totals = _financial_period_totals(week_start, today, lira_rate)
    net_profit = (
        week_totals["gross_revenue"]
        - week_totals["refunds"]
        - week_totals["purchase_cost"]
        - week_totals["gateway_fees"]
        - weekly_fixed_cost
        - week_reconciliation["hidden_fee"]
        - week_totals["other_expenses"]
        + week_totals["other_income"]
    )
    available_purchase_cash = max(
        0,
        week_reconciliation["amount"]
        - week_totals["refunds"]
        - main_account_reserve
        - week_reconciliation["hidden_fee"],
    )
    latest_closure = FinancialWeekClosure.objects.order_by("-week_start").first()

    return JsonResponse({
        "today": today.isoformat(),
        "lira_rate": lira_rate,
        "open_lira": {
            "count": len(open_rows),
            "total_lira": round(sum(row["lira"] for row in open_rows), 2),
            "purchase_cost": sum(row["purchase_cost"] for row in open_rows),
            "registered_count": open_summary["registered"]["count"],
            "registered_lira": round(open_summary["registered"]["lira"], 2),
            "by_status": [{"status": status, "status_fa": dict(Order.STATUS_CHOICES).get(status, status), "count": value["count"], "lira": round(value["lira"], 2)} for status, value in open_summary.items() if value["count"]],
            "orders": open_rows,
        },
        "forecast": {
            "lira": round(forecast_lira, 2), "confidence": 80, "yesterday_lira": round(yesterday_lira, 2),
            "monthly_daily_average": round(recent_avg, 2), "seasonal_factor": round(seasonal_factor, 3),
            "method": "مدل ۸۰/۲۰: الگوی محصولی دیروز با ضریب سینوسی هفتگی + میانگین تکرار ۳۰ روز اخیر.",
        },
        "zarinpal_payout": {
            "configured": sync["configured"],
            "sync_ok": sync["success"],
            "error": sync["error"],
            "settled_today": today_reconciliation["amount"] if sync["success"] else None,
            "settlement_count": today_reconciliation["count"] if sync["success"] else 0,
            "last_reconciled_at": today_reconciliation["latest_at"].isoformat() if today_reconciliation["latest_at"] else None,
            "latest_reference_id": today_reconciliation["latest_reference_id"] if sync["success"] else "",
            "pending_amount": week_reconciliation["pending_amount"] if sync["success"] else None,
            "pending_count": week_reconciliation["pending_count"] if sync["success"] else 0,
        },
        "weekly": {
            "week_start": week_start.isoformat(),
            "week_end": today.isoformat(),
            "fixed_costs": costs,
            "fixed_cost_payers": payers,
            "monthly_fixed_cost": monthly_fixed_cost,
            "weekly_fixed_cost": weekly_fixed_cost,
            "main_account_reserve": main_account_reserve,
            "available_purchase_cash": available_purchase_cash if sync["success"] else None,
            "net_profit": net_profit if sync["success"] else None,
            "can_close": today.weekday() == 5 and sync["success"],
            "latest_closure": {
                "week_start": latest_closure.week_start.isoformat(),
                "closed_at": latest_closure.closed_at.isoformat(),
            } if latest_closure else None,
        },
    })


@csrf_exempt
def admin_financial_config(request):
    if not request.user.is_authenticated:
        return JsonResponse({"detail": "authentication required"}, status=401)
    if not _is_admin_user(request.user):
        return JsonResponse({"detail": "forbidden"}, status=403)
    if request.method != "POST":
        return HttpResponseNotAllowed(["POST"])
    try:
        payload = json.loads(request.body or "{}")
        raw_costs = payload.get("fixed_costs", {})
        costs = {key: max(0, int(raw_costs.get(key, 0) or 0)) for key in ("kavenegar", "server", "cloud")}
        raw_payers = payload.get("fixed_cost_payers", {})
        payers = {}
        default_labels = {"kavenegar": "حساب اصلی", "server": "حساب اصلی", "cloud": "ایلیا"}
        for key in costs:
            raw_payer = raw_payers.get(key, {})
            source = raw_payer.get("source")
            if source not in ("main", "external"):
                raise ValueError("invalid payer")
            label = str(raw_payer.get("label") or default_labels[key]).strip()[:80]
            payers[key] = {"source": source, "label": label}
    except (TypeError, ValueError, json.JSONDecodeError):
        return JsonResponse({"detail": "هزینه یا پرداخت‌کننده نامعتبر است"}, status=400)
    SiteSetting.objects.update_or_create(
        key=FINANCIAL_COSTS_SETTING_KEY,
        defaults={"value_text": json.dumps(costs, ensure_ascii=False)},
    )
    SiteSetting.objects.update_or_create(
        key=FINANCIAL_COST_PAYERS_SETTING_KEY,
        defaults={"value_text": json.dumps(payers, ensure_ascii=False)},
    )
    return JsonResponse({"success": True, "fixed_costs": costs, "fixed_cost_payers": payers})


@csrf_exempt
def admin_close_financial_week(request):
    if not request.user.is_authenticated:
        return JsonResponse({"detail": "authentication required"}, status=401)
    if not _is_admin_user(request.user):
        return JsonResponse({"detail": "forbidden"}, status=403)
    if request.method != "POST":
        return HttpResponseNotAllowed(["POST"])
    today = timezone.localdate()
    if today.weekday() != 5:
        return JsonResponse({"detail": "بستن پرونده فقط روز شنبه فعال است؛ دوره شنبه تا جمعه بسته می‌شود."}, status=400)
    week_end = today - timedelta(days=1)
    week_start = week_end - timedelta(days=6)
    sync = _sync_zarinpal_reconciliations(week_start, today)
    if not sync["success"]:
        return JsonResponse({
            "detail": "تا همگام‌سازی موفق تسویه‌های زرین‌پال، بستن پرونده مجاز نیست.",
        }, status=503)
    try:
        lira_rate = max(0, int(_get_setting("lira_rate", default="0").value_text or 0))
    except (TypeError, ValueError):
        lira_rate = 0
    with transaction.atomic():
        if FinancialWeekClosure.objects.select_for_update().filter(week_start=week_start).exists():
            return JsonResponse({"detail": "پرونده مالی این هفته قبلاً بسته شده است."}, status=409)
        costs, payers = _financial_config()
        totals = _financial_period_totals(week_start, week_end, lira_rate)
        fixed_cost_share = round(sum(costs.values()) * 12 / 52)
        main_account_reserve = round(
            sum(amount for key, amount in costs.items() if payers[key]["source"] == "main") * 12 / 52
        )
        reconciliations = _financial_reconciliation_totals(week_start, week_end)
        special_profit = totals["gross_revenue"] - totals["refunds"] - totals["purchase_cost"]
        net_profit = (
            special_profit
            - totals["gateway_fees"]
            - fixed_cost_share
            - reconciliations["hidden_fee"]
            - totals["other_expenses"]
            + totals["other_income"]
        )
        available_purchase_cash = max(
            0,
            reconciliations["amount"]
            - totals["refunds"]
            - main_account_reserve
            - reconciliations["hidden_fee"],
        )
        closure = FinancialWeekClosure.objects.create(
            week_start=week_start,
            week_end=week_end,
            gross_revenue=totals["gross_revenue"],
            refunds=totals["refunds"],
            purchase_cost=totals["purchase_cost"],
            fixed_cost_share=fixed_cost_share,
            other_expenses=totals["other_expenses"],
            other_income=totals["other_income"],
            special_profit=special_profit,
            net_profit=net_profit,
            lira_rate=lira_rate,
            settled_cash=reconciliations["amount"],
            gateway_fees=totals["gateway_fees"],
            hidden_accounting_fee=reconciliations["hidden_fee"],
            main_account_reserve=main_account_reserve,
            available_purchase_cash=available_purchase_cash,
            closed_by=request.user,
            snapshot={
                "total_lira": totals["total_lira"],
                "fixed_costs": costs,
                "fixed_cost_payers": payers,
                "hidden_accounting_fee": reconciliations["hidden_fee"],
                "zarinpal_settlement_count": reconciliations["count"],
                "order_count": totals["order_count"],
            },
        )
    return JsonResponse({"success": True, "message": "پرونده مالی هفته با موفقیت بسته شد.", "closure": {"id": closure.id, "week_start": week_start.isoformat(), "week_end": week_end.isoformat(), "net_profit": net_profit}})


def admin_accounting(request):
    """
    API برای گزارش حسابداری سفارشات تکمیل شده در بازه زمانی مشخص
    پارامترها:
    - from_date: تاریخ شروع (ISO format)
    - to_date: تاریخ پایان (ISO format)
    - status: فیلتر وضعیت (اختیاری، پیش‌فرض: completed)
    """
    if not request.user.is_authenticated:
        return JsonResponse({"detail": "authentication required"}, status=401)
    if not _is_admin_user(request.user):
        return JsonResponse({"detail": "forbidden"}, status=403)
    if request.method != 'GET':
        return HttpResponseNotAllowed(['GET'])

    from_date_str = request.GET.get("from_date")
    to_date_str = request.GET.get("to_date")
    status_filter = request.GET.get("status", "completed")

    if not from_date_str or not to_date_str:
        return JsonResponse({"detail": "from_date و to_date الزامی هستند"}, status=400)

    try:
        from datetime import datetime
        from django.utils import timezone as tz

        # Parse dates - support both ISO format and simple date format
        if "T" in from_date_str:
            from_date = datetime.fromisoformat(from_date_str.replace("Z", "+00:00"))
        else:
            from_date = datetime.strptime(from_date_str, "%Y-%m-%d")

        if "T" in to_date_str:
            to_date = datetime.fromisoformat(to_date_str.replace("Z", "+00:00"))
        else:
            to_date = datetime.strptime(to_date_str, "%Y-%m-%d")
            # اگر فقط تاریخ باشد، پایان روز را در نظر بگیریم
            to_date = to_date.replace(hour=23, minute=59, second=59)

        # Make timezone aware if naive
        if from_date.tzinfo is None:
            from_date = tz.make_aware(from_date)
        if to_date.tzinfo is None:
            to_date = tz.make_aware(to_date)

    except (ValueError, TypeError) as e:
        return JsonResponse({"detail": f"فرمت تاریخ نامعتبر است: {str(e)}"}, status=400)

    # Build query based on status
    if status_filter == "all":
        orders_qs = Order.objects.filter(
            created_at__gte=from_date,
            created_at__lte=to_date,
            is_test_order=False
        ).exclude(status__in=['pending', 'canceled'])
    elif status_filter == "paid_completed":
        orders_qs = Order.objects.filter(
            status__in=['paid', 'completed', 'registered'],
            created_at__gte=from_date,
            created_at__lte=to_date,
            is_test_order=False
        )
    else:
        orders_qs = Order.objects.filter(
            status=status_filter,
            created_at__gte=from_date,
            created_at__lte=to_date,
            is_test_order=False
        )
    orders_qs = orders_qs.exclude(note__icontains="شارژ کیف پول").exclude(status="wallet_topup")

    orders_qs = orders_qs.select_related('user').prefetch_related('payments', 'items', 'items__product', 'items__accounts').order_by('-created_at')

    # Calculate totals
    from django.db.models import Sum, Count

    aggregates = orders_qs.aggregate(
        total_amount=Sum('amount'),
        total_wallet_used=Sum('wallet_used'),
        total_discount_amount=Sum('discount_amount'),
        total_rush_fee=Sum('rush_fee'),
        total_refund=Sum('refund_amount'),
        order_count=Count('id')
    )

    total_amount = aggregates['total_amount'] or 0
    total_wallet_used = aggregates['total_wallet_used'] or 0
    total_discount_amount = aggregates['total_discount_amount'] or 0
    total_rush_fee = aggregates['total_rush_fee'] or 0
    total_refund = aggregates['total_refund'] or 0
    order_count = aggregates['order_count'] or 0

    # محاسبه درآمد خالص (پرداخت شده + کیف پول - استرداد)
    net_revenue = total_amount + total_wallet_used - total_refund

    # محاسبه مبلغ اصلی (قبل از تخفیف)
    original_amount = total_amount + total_wallet_used + total_discount_amount

    # Build GTA6 variant_id → cost_toman lookup for accurate profit calculation
    gta6_config_data, _ = _gta6_load_config()
    gta6_variant_cost = {}
    for ed_cells in gta6_config_data.get("pricing", {}).values():
        for cell in ed_cells.values():
            vid = cell.get("variant_id")
            ct = int(cell.get("cost_toman", 0) or 0)
            if vid and ct > 0:
                gta6_variant_cost[str(vid)] = ct

    # Build order list
    orders_data = []
    for o in orders_qs:
        items_list = list(o.items.all())
        first_item = items_list[0] if items_list else None
        item_count = len(items_list)
        lira_val = 0
        qty_val = 1
        if first_item:
            lira_val = first_item.price_lira or (first_item.product.price_lira if first_item.product else 0) or 0
            qty_val = first_item.quantity or 1

        total_lira = sum(
            (it.price_lira or (it.product.price_lira if it.product else 0) or 0) * (it.quantity or 1)
            for it in items_list
        )

        # اگر آیتم‌های سفارش از واریانت‌های GTA6 با cost_toman مشخص باشن، هزینه خرید به تومن محاسبه می‌شه
        total_cost_toman = 0
        for it in items_list:
            vid = str(it.variant_id) if it.variant_id else None
            if vid and vid in gta6_variant_cost:
                total_cost_toman += gta6_variant_cost[vid] * (it.quantity or 1)

        items_names = [
            {
                "name": it.name,
                "quantity": it.quantity or 1,
            }
            for it in items_list
        ]

        latest_payment = o.payments.order_by("-created_at").first()

        # Unit breakdown for reseller orders
        units = []
        for item in items_list:
            for acc in item.accounts.all():
                units.append({
                    "id": acc.id,
                    "index": acc.index,
                    "unit_tracking": acc.unit_tracking,
                    "account_type": acc.account_type,
                    "account_email": acc.account_email or "",
                    "mode": acc.mode,
                    "mode_fa": dict(OrderItemAccount.MODE_CHOICES).get(acc.mode, acc.mode),
                    "status": acc.status,
                    "status_fa": dict(OrderItemAccount.STATUS_CHOICES).get(acc.status, acc.status) if acc.status in ("pending", "filled") else acc.status,
                    "settled": acc.settled,
                    "settled_at": acc.settled_at.isoformat() if acc.settled_at else None,
                    "name": item.name,
                })

        orders_data.append({
            "id": o.id,
            "tracking_code": o.tracking_code,
            "status": o.status,
            "status_fa": dict(Order.STATUS_CHOICES).get(o.status, o.status),
            "amount": o.amount,
            "wallet_used": o.wallet_used,
            "diamonds_used": o.diamonds_used,
            "discount_amount": o.discount_amount,
            "rush_fee": o.rush_fee,
            "refund_amount": o.refund_amount,
            "created_at": o.created_at.isoformat(),
            "completed_at": o.completed_at.isoformat() if o.completed_at else None,
            "first_item_name": first_item.name if first_item else "",
            "first_item_lira": lira_val,
            "first_item_quantity": qty_val,
            "total_lira": total_lira,
            "total_cost_toman": total_cost_toman,
            "item_count": item_count,
            "items_names": items_names,
            "user_email": o.user.email if o.user else "",
            "payment_amount": latest_payment.amount if latest_payment else 0,
            "payment_ref_id": latest_payment.ref_id if latest_payment else "",
            "settled": o.settled,
            "settled_at": o.settled_at.isoformat() if o.settled_at else None,
            "has_units": len(units) > 0,
            "units": units,
        })

    # Fetch and calculate custom transactions for the same period
    usd_rate = _get_usd_rate_toman()
    txns = AccountingTransaction.objects.filter(created_at__gte=from_date, created_at__lte=to_date)

    total_expenses_toman_created = 0
    total_expenses_toman_current = 0
    total_profits_toman_created = 0
    total_profits_toman_current = 0
    total_expenses_usd = 0.0
    total_profits_usd = 0.0

    txns_list = []
    for t in txns:
        toman_amount_created = 0
        toman_amount_current = 0
        toman_diff = 0

        if t.currency == "usd":
            toman_amount_created = int(t.amount * t.created_rate)
            toman_amount_current = int(t.amount * usd_rate)
            toman_diff = toman_amount_current - toman_amount_created

            if t.entry_type == 'expense':
                total_expenses_usd += float(t.amount)
                total_expenses_toman_created += toman_amount_created
                total_expenses_toman_current += toman_amount_current
            else:
                total_profits_usd += float(t.amount)
                total_profits_toman_created += toman_amount_created
                total_profits_toman_current += toman_amount_current
        else:
            toman_amount_created = int(t.amount)
            toman_amount_current = int(t.amount)
            toman_diff = 0

            if t.entry_type == 'expense':
                total_expenses_toman_created += toman_amount_created
                total_expenses_toman_current += toman_amount_current
            else:
                total_profits_toman_created += toman_amount_created
                total_profits_toman_current += toman_amount_current

        txns_list.append({
            "id": t.id,
            "title": t.title,
            "entry_type": t.entry_type,
            "entry_type_fa": dict(AccountingTransaction.TRANSACTION_TYPE_CHOICES).get(t.entry_type, t.entry_type),
            "currency": t.currency,
            "amount": float(t.amount),
            "created_rate": t.created_rate,
            "current_rate": usd_rate if t.currency == "usd" else 0,
            "toman_amount_created": toman_amount_created,
            "toman_amount_current": toman_amount_current,
            "toman_diff": toman_diff,
            "created_at": t.created_at.isoformat(),
            "note": t.note or "",
        })

    return JsonResponse({
        "summary": {
            "order_count": order_count,
            "total_amount": total_amount,
            "total_wallet_used": total_wallet_used,
            "total_discount_amount": total_discount_amount,
            "total_rush_fee": total_rush_fee,
            "total_refund": total_refund,
            "original_amount": original_amount,
            "net_revenue": net_revenue,
        },
        "custom_summary": {
            "total_expenses_toman_created": total_expenses_toman_created,
            "total_expenses_toman_current": total_expenses_toman_current,
            "total_profits_toman_created": total_profits_toman_created,
            "total_profits_toman_current": total_profits_toman_current,
            "total_expenses_usd": total_expenses_usd,
            "total_profits_usd": total_profits_usd,
            "current_usd_rate": usd_rate,
        },
        "custom_transactions": txns_list,
        "from_date": from_date.isoformat(),
        "to_date": to_date.isoformat(),
        "status_filter": status_filter,
        "orders": orders_data
    })


@csrf_exempt
def admin_accounting_transactions(request):
    if not request.user.is_authenticated:
        return JsonResponse({"detail": "authentication required"}, status=401)
    if not _is_admin_user(request.user):
        return JsonResponse({"detail": "forbidden"}, status=403)

    if request.method == "GET":
        from_date_str = request.GET.get("from_date")
        to_date_str = request.GET.get("to_date")

        txns = AccountingTransaction.objects.all()

        if from_date_str and to_date_str:
            try:
                # Same parsing logic as admin_accounting
                if "T" in from_date_str:
                    from_date = datetime.fromisoformat(from_date_str.replace("Z", "+00:00"))
                else:
                    from_date = datetime.strptime(from_date_str, "%Y-%m-%d")

                if "T" in to_date_str:
                    to_date = datetime.fromisoformat(to_date_str.replace("Z", "+00:00"))
                else:
                    to_date = datetime.strptime(to_date_str, "%Y-%m-%d")
                    to_date = to_date.replace(hour=23, minute=59, second=59)

                if from_date.tzinfo is None:
                    from_date = timezone.make_aware(from_date)
                if to_date.tzinfo is None:
                    to_date = timezone.make_aware(to_date)

                txns = txns.filter(created_at__gte=from_date, created_at__lte=to_date)
            except Exception as e:
                return JsonResponse({"detail": f"فرمت تاریخ نامعتبر است: {str(e)}"}, status=400)

        usd_rate = _get_usd_rate_toman()

        txns_list = []
        for t in txns:
            toman_amount_created = 0
            toman_amount_current = 0
            toman_diff = 0

            if t.currency == "usd":
                toman_amount_created = int(t.amount * t.created_rate)
                toman_amount_current = int(t.amount * usd_rate)
                toman_diff = toman_amount_current - toman_amount_created
            else:
                toman_amount_created = int(t.amount)
                toman_amount_current = int(t.amount)
                toman_diff = 0

            txns_list.append({
                "id": t.id,
                "title": t.title,
                "entry_type": t.entry_type,
                "entry_type_fa": dict(AccountingTransaction.TRANSACTION_TYPE_CHOICES).get(t.entry_type, t.entry_type),
                "currency": t.currency,
                "amount": float(t.amount),
                "created_rate": t.created_rate,
                "current_rate": usd_rate if t.currency == "usd" else 0,
                "toman_amount_created": toman_amount_created,
                "toman_amount_current": toman_amount_current,
                "toman_diff": toman_diff,
                "created_at": t.created_at.isoformat(),
                "note": t.note or "",
            })

        return JsonResponse({"transactions": txns_list, "current_usd_rate": usd_rate})

    elif request.method == "POST":
        try:
            payload = json.loads(request.body)
        except Exception:
            return JsonResponse({"detail": "invalid json"}, status=400)

        title = payload.get("title")
        entry_type = payload.get("entry_type")
        currency = payload.get("currency")
        amount = payload.get("amount")
        created_rate_override = payload.get("created_rate")
        note = payload.get("note", "")

        if not title or not entry_type or not currency or amount is None:
            return JsonResponse({"detail": "تمامی فیلدها الزامی هستند"}, status=400)

        try:
            amount = float(amount)
        except ValueError:
            return JsonResponse({"detail": "مبلغ نامعتبر است"}, status=400)

        if entry_type not in ['expense', 'profit']:
            return JsonResponse({"detail": "نوع تراکنش نامعتبر است"}, status=400)

        if currency not in ['toman', 'usd']:
            return JsonResponse({"detail": "واحد پولی نامعتبر است"}, status=400)

        usd_rate = _get_usd_rate_toman()
        created_rate = usd_rate
        if currency == "usd" and created_rate_override is not None:
            try:
                created_rate = int(created_rate_override)
            except ValueError:
                pass

        txn = AccountingTransaction.objects.create(
            title=title,
            entry_type=entry_type,
            currency=currency,
            amount=amount,
            created_rate=created_rate if currency == "usd" else 0,
            note=note
        )

        return JsonResponse({
            "success": True,
            "message": "تراکنش با موفقیت ثبت شد",
            "transaction_id": txn.id
        })

    return HttpResponseNotAllowed(['GET', 'POST'])


@csrf_exempt
def admin_accounting_transaction_detail(request, txn_id):
    if not request.user.is_authenticated:
        return JsonResponse({"detail": "authentication required"}, status=401)
    if not _is_admin_user(request.user):
        return JsonResponse({"detail": "forbidden"}, status=403)

    txn = get_object_or_404(AccountingTransaction, id=txn_id)

    if request.method == "DELETE":
        txn.delete()
        return JsonResponse({"success": True, "message": "تراکنش حذف شد"})

    return HttpResponseNotAllowed(['DELETE'])


@csrf_exempt
def admin_settle_order(request, tracking):
    """تسویه کردن سفارش"""
    if not request.user.is_authenticated:
        return JsonResponse({"detail": "authentication required"}, status=401)
    if not _is_admin_user(request.user):
        return JsonResponse({"detail": "forbidden"}, status=403)
    if request.method != "POST":
        return HttpResponseNotAllowed(["POST"])

    order = get_object_or_404(Order, tracking_code=tracking)

    try:
        payload = json.loads(request.body) if request.body else {}
    except json.JSONDecodeError:
        payload = {}

    settled = payload.get("settled", True)

    if settled:
        order.settled = True
        order.settled_at = timezone.now()
    else:
        order.settled = False
        order.settled_at = None

    order.save()

    return JsonResponse({
        "success": True,
        "message": "تسویه شد" if settled else "تسویه برداشته شد",
        "settled": order.settled,
        "settled_at": order.settled_at.isoformat() if order.settled_at else None,
    })


@csrf_exempt
def admin_settle_bulk(request):
    """تسویه کردن چند سفارش به صورت گروهی"""
    if not request.user.is_authenticated:
        return JsonResponse({"detail": "authentication required"}, status=401)
    if not _is_admin_user(request.user):
        return JsonResponse({"detail": "forbidden"}, status=403)
    if request.method != "POST":
        return HttpResponseNotAllowed(["POST"])

    try:
        payload = json.loads(request.body) if request.body else {}
    except json.JSONDecodeError:
        return JsonResponse({"detail": "Invalid JSON"}, status=400)

    tracking_codes = payload.get("tracking_codes", [])
    settled = payload.get("settled", True)

    if not tracking_codes:
        return JsonResponse({"detail": "tracking_codes الزامی است"}, status=400)

    now = timezone.now()

    if settled:
        orders_to_settle = list(Order.objects.filter(tracking_code__in=tracking_codes, settled=False).prefetch_related('items', 'items__product'))
        if orders_to_settle:
            total_amount = sum(o.amount for o in orders_to_settle)
            total_lira = 0.0
            for o in orders_to_settle:
                for it in o.items.all():
                    total_lira += float((it.price_lira or (it.product.price_lira if it.product else 0) or 0) * (it.quantity or 1))
            
            batch = SettlementBatch.objects.create(
                total_amount=total_amount,
                total_lira=total_lira,
                order_count=len(orders_to_settle)
            )
            batch.orders.set(orders_to_settle)
            
            count = Order.objects.filter(id__in=[o.id for o in orders_to_settle]).update(
                settled=True,
                settled_at=now
            )
        else:
            count = 0
    else:
        count = Order.objects.filter(tracking_code__in=tracking_codes).update(
            settled=False,
            settled_at=None
        )

    return JsonResponse({
        "success": True,
        "message": f"{count} سفارش تسویه شد" if settled else f"{count} سفارش از تسویه خارج شد",
        "count": count,
    })


@csrf_exempt
def admin_unit_settle(request):
    """تسویه کردن واحدهای یک سفارش (تک تک)"""
    if not request.user.is_authenticated:
        return JsonResponse({"detail": "authentication required"}, status=401)
    if not _is_admin_user(request.user):
        return JsonResponse({"detail": "forbidden"}, status=403)
    if request.method != "POST":
        return HttpResponseNotAllowed(["POST"])

    try:
        payload = json.loads(request.body) if request.body else {}
    except json.JSONDecodeError:
        return JsonResponse({"detail": "Invalid JSON"}, status=400)

    unit_tracking = payload.get("unit_tracking")
    tracking_code = payload.get("tracking_code")
    settled = payload.get("settled", True)

    if unit_tracking:
        accounts = OrderItemAccount.objects.filter(unit_tracking=unit_tracking)
    elif tracking_code:
        # Settle all units of an order
        accounts = OrderItemAccount.objects.filter(item__order__tracking_code=tracking_code)
    else:
        return JsonResponse({"detail": "unit_tracking یا tracking_code الزامی است"}, status=400)

    now = timezone.now()
    if settled:
        count = accounts.update(settled=True, settled_at=now)
    else:
        count = accounts.update(settled=False, settled_at=None)

    return JsonResponse({
        "success": True,
        "message": f"{count} واحد تسویه شد" if settled else f"{count} واحد از تسویه خارج شد",
        "count": count,
    })


def admin_oldest_unsettled(request):
    """قدیمی‌ترین تاریخ سفارش تسویه نشده"""
    if not request.user.is_authenticated:
        return JsonResponse({"detail": "authentication required"}, status=401)
    if not _is_admin_user(request.user):
        return JsonResponse({"detail": "forbidden"}, status=403)
    if request.method != 'GET':
        return HttpResponseNotAllowed(['GET'])

    oldest = Order.objects.filter(
        settled=False,
        is_test_order=False,
    ).exclude(
        status__in=['pending', 'canceled', 'wallet_topup']
    ).exclude(
        note__icontains="شارژ کیف پول"
    ).order_by('created_at').first()

    return JsonResponse({
        "date": oldest.created_at.isoformat() if oldest else None,
        "tracking_code": oldest.tracking_code if oldest else None,
    })


@csrf_exempt
def exchange_points(request):
    if not request.user.is_authenticated:
        return JsonResponse({"detail": "authentication required"}, status=401)
    try:
        is_reseller = request.user.profile.tier == "reseller"
    except Exception:
        is_reseller = False
    if is_reseller:
        return JsonResponse({"error": "همکاران امکان استفاده از سیستم کوین را ندارند."}, status=403)
    if request.method != "POST":
        return JsonResponse({"error": "Method not allowed"}, status=405)
        
    try:
        data = json.loads(request.body)
        diamonds_count = data.get("diamonds_count")
        
        if diamonds_count is not None:
            try:
                diamonds_count = int(diamonds_count)
            except (TypeError, ValueError):
                return JsonResponse({"error": "مقدار کوین نامعتبر است."}, status=400)
            if diamonds_count < 350:
                return JsonResponse({"error": "حداقل کوین برای تبدیل ۳۵۰ عدد است."}, status=400)
        else:
            reward_type = data.get("reward_type")
            if reward_type == "cash_110":
                diamonds_count = 350
            else:
                return JsonResponse({"error": "نوع جایزه نامعتبر است."}, status=400)
            
        profile, _ = UserProfile.objects.get_or_create(user=request.user)
        
        if profile.points_balance < diamonds_count:
            return JsonResponse({"error": "کوین کافی برای این تبدیل ندارید."}, status=400)
            
        # Deduct points
        from .rewards import award_points, generate_discount_code
        award_points(request.user, -diamonds_count, "exchange", note=f"تبدیل {diamonds_count} کوین")
        
        # Reload profile to get accurate balance after award_points
        profile.refresh_from_db()
        
        # Calculate amount: 350 diamonds = 110,000 Tomans
        amount = (diamonds_count * 110000) // 350
        
        # Generate discount code
        code_obj = generate_discount_code(amount=amount, assigned_user=request.user, source="points_exchange")
            
        return JsonResponse({
            "success": True,
            "message": "جایزه با موفقیت دریافت شد.",
            "code": code_obj.code if code_obj else "",
            "points_balance": profile.points_balance
        })
        
    except Exception as e:
        import logging
        logging.getLogger(__name__).error(f"Error exchanging points: {e}")
        return JsonResponse({"error": "خطای داخلی رخ داد."}, status=500)


def admin_settlement_history(request):
    """لیست تاریخچه تسویه‌ها"""
    if not request.user.is_authenticated:
        return JsonResponse({"detail": "authentication required"}, status=401)
    if not _is_admin_user(request.user):
        return JsonResponse({"detail": "forbidden"}, status=403)
    if request.method != 'GET':
        return HttpResponseNotAllowed(['GET'])

    batches = SettlementBatch.objects.prefetch_related('orders').order_by('-created_at')[:100]
    
    data = []
    for b in batches:
        data.append({
            "id": b.id,
            "created_at": b.created_at.isoformat(),
            "total_amount": b.total_amount,
            "total_lira": b.total_lira,
            "order_count": b.order_count,
            "orders": [
                {
                    "tracking_code": o.tracking_code,
                    "amount": o.amount,
                    "completed_at": o.completed_at.isoformat() if o.completed_at else None,
                }
                for o in b.orders.all()
            ]
        })
        
    return JsonResponse({"settlements": data})


@csrf_exempt
def admin_delete_settlement_batch(request, batch_id):
    """حذف پرونده تسویه و بازگرداندن سفارش‌ها به حالت تسویه نشده"""
    if not request.user.is_authenticated:
        return JsonResponse({"detail": "authentication required"}, status=401)
    if not _is_admin_user(request.user):
        return JsonResponse({"detail": "forbidden"}, status=403)
    if request.method != 'DELETE':
        return HttpResponseNotAllowed(['DELETE'])

    try:
        batch = SettlementBatch.objects.get(id=batch_id)
    except SettlementBatch.DoesNotExist:
        return JsonResponse({"detail": "پرونده یافت نشد"}, status=404)

    # Mark all orders in the batch as unsettled
    batch.orders.all().update(settled=False, settled_at=None)
    batch.delete()

    return JsonResponse({
        "success": True, 
        "message": "پرونده تسویه حذف شد و سفارش‌ها به حالت تسویه نشده بازگشتند."
    })


@csrf_exempt
def my_notifications(request):
    if not request.user.is_authenticated:
        return JsonResponse({"detail": "authentication required"}, status=401)
        
    if request.method == 'GET':
        from .models import SiteNotification, SiteNotificationRead
        # Fetch global notifications and personal notifications
        notifs = SiteNotification.objects.filter(
            Q(is_global=True) | Q(user=request.user)
        ).order_by('-created_at')[:50]
        
        # Get list of read global notification IDs for this user
        read_global_ids = set(
            SiteNotificationRead.objects.filter(user=request.user)
            .values_list('notification_id', flat=True)
        )
        
        data = []
        for n in notifs:
            read_status = n.is_read if not n.is_global else (n.id in read_global_ids)
            data.append({
                "id": n.id,
                "title": n.title,
                "message": n.message,
                "is_global": n.is_global,
                "is_read": read_status,
                "created_at": n.created_at.isoformat()
            })
        return JsonResponse({"notifications": data})
        
    elif request.method == 'POST':
        # Mark as read
        try:
            payload = json.loads(request.body)
            notif_id = payload.get("notification_id")
            mark_all = payload.get("all", False)
            
            from .models import SiteNotification, SiteNotificationRead
            
            if mark_all:
                # Mark all personal as read
                SiteNotification.objects.filter(user=request.user, is_read=False).update(is_read=True)
                
                # Mark all unread global as read
                unread_globals = SiteNotification.objects.filter(is_global=True).exclude(
                    id__in=SiteNotificationRead.objects.filter(user=request.user).values_list('notification_id', flat=True)
                )
                reads = [
                    SiteNotificationRead(user=request.user, notification=n)
                    for n in unread_globals
                ]
                SiteNotificationRead.objects.bulk_create(reads, ignore_conflicts=True)
                
                return JsonResponse({"success": True, "message": "همه اعلانات خوانده شدند."})
            
            if notif_id:
                try:
                    n = SiteNotification.objects.get(id=notif_id)
                except SiteNotification.DoesNotExist:
                    return JsonResponse({"error": "اعلان یافت نشد."}, status=404)
                    
                if n.is_global:
                    SiteNotificationRead.objects.get_or_create(user=request.user, notification=n)
                else:
                    if n.user_id == request.user.id:
                        n.is_read = True
                        n.save(update_fields=['is_read'])
                    else:
                        return JsonResponse({"error": "عدم دسترسی"}, status=403)
                return JsonResponse({"success": True})
            
            return JsonResponse({"error": "پارامترهای نامعتبر"}, status=400)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)
            
    return HttpResponseNotAllowed(['GET', 'POST'])


@csrf_exempt
def admin_site_notifications(request):
    if not request.user.is_authenticated:
        return JsonResponse({"detail": "authentication required"}, status=401)
    if not _is_admin_user(request.user):
        return JsonResponse({"detail": "forbidden"}, status=403)
        
    if request.method == 'GET':
        from .models import SiteNotification
        notifs = SiteNotification.objects.all().order_by('-created_at')[:100]
        data = []
        for n in notifs:
            data.append({
                "id": n.id,
                "title": n.title,
                "message": n.message,
                "is_global": n.is_global,
                "user_username": n.user.username if n.user else "همه کاربران",
                "created_at": n.created_at.isoformat()
            })
        return JsonResponse({"notifications": data})
        
    elif request.method == 'POST':
        try:
            payload = json.loads(request.body)
            title = payload.get("title")
            message = payload.get("message")
            is_global = payload.get("is_global", True)
            target_username = payload.get("username")
            
            if not title or not message:
                return JsonResponse({"error": "عنوان و متن الزامی است."}, status=400)
                
            target_user = None
            if not is_global and target_username:
                try:
                    target_user = User.objects.get(username=target_username)
                except User.DoesNotExist:
                    return JsonResponse({"error": f"کاربر با نام کاربری {target_username} یافت نشد."}, status=404)
            
            from .models import SiteNotification
            SiteNotification.objects.create(
                user=target_user,
                title=title,
                message=message,
                is_global=is_global
            )
            return JsonResponse({"success": True, "message": "اعلان با موفقیت ایجاد شد."})
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)
            
    elif request.method == 'DELETE':
        # Delete notification
        try:
            payload = json.loads(request.body)
            notif_id = payload.get("notification_id")
            if not notif_id:
                return JsonResponse({"error": "شناسه اعلان الزامی است."}, status=400)
            from .models import SiteNotification
            SiteNotification.objects.filter(id=notif_id).delete()
            return JsonResponse({"success": True, "message": "اعلان حذف شد."})
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)

    return HttpResponseNotAllowed(['GET', 'POST', 'DELETE'])


@csrf_exempt
def create_product_request(request):
    if request.method != 'POST':
        return HttpResponseNotAllowed(['POST'])
    try:
        payload = json.loads(request.body)
        product_name = payload.get("product_name", "").strip()
        contact_info = payload.get("contact_info", "").strip()
        
        if not product_name:
            return JsonResponse({"error": "نام محصول درخواستی الزامی است."}, status=400)
        if not contact_info:
            return JsonResponse({"error": "اطلاعات تماس الزامی است."}, status=400)
            
        user = request.user if request.user.is_authenticated else None
        
        from .models import ProductRequest
        ProductRequest.objects.create(
            product_name=product_name,
            contact_info=contact_info,
            user=user
        )
        return JsonResponse({"success": True, "message": "درخواست شما با موفقیت ثبت شد."})
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)


@csrf_exempt
def admin_product_requests(request):
    if not request.user.is_authenticated:
        return JsonResponse({"detail": "authentication required"}, status=401)
    if not _is_admin_user(request.user):
        return JsonResponse({"detail": "forbidden"}, status=403)
    
    if request.method == 'GET':
        from .models import ProductRequest
        reqs = ProductRequest.objects.all().order_by('-created_at')
        data = []
        for r in reqs:
            data.append({
                "id": r.id,
                "product_name": r.product_name,
                "contact_info": r.contact_info,
                "username": r.user.username if r.user else "مهمان",
                "status": r.status,
                "created_at": r.created_at.isoformat(),
                "admin_note": r.admin_note
            })
        return JsonResponse({"requests": data})
        
    elif request.method == 'POST':
        try:
            payload = json.loads(request.body)
            req_id = payload.get("id")
            status = payload.get("status")
            admin_note = payload.get("admin_note")
            
            if not req_id:
                return JsonResponse({"error": "شناسه درخواست الزامی است."}, status=400)
                
            from .models import ProductRequest
            try:
                req_obj = ProductRequest.objects.get(id=req_id)
            except ProductRequest.DoesNotExist:
                return JsonResponse({"error": "درخواست یافت نشد."}, status=404)
                
            if status is not None:
                req_obj.status = status
            if admin_note is not None:
                req_obj.admin_note = admin_note
            req_obj.save()
            
            return JsonResponse({"success": True, "message": "درخواست با موفقیت بروزرسانی شد."})
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)
            
    elif request.method == 'DELETE':
        try:
            payload = json.loads(request.body)
            req_id = payload.get("id")
            if not req_id:
                return JsonResponse({"error": "شناسه درخواست الزامی است."}, status=400)
            from .models import ProductRequest
            ProductRequest.objects.filter(id=req_id).delete()
            return JsonResponse({"success": True, "message": "درخواست حذف شد."})
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)
            
    return HttpResponseNotAllowed(['GET', 'POST', 'DELETE'])


def coins_games_list(request):
    """
    GET /api/coins/games
    Returns distinct list of active games (G4A4Product)
    """
    if request.method != 'GET':
        return HttpResponseNotAllowed(['GET'])
        
    games = G4A4Product.objects.filter(is_active=True).values('game_slug', 'category').annotate(
        product_count=Count('id')
    )
    
    result = []
    seen_slugs = set()
    for g in games:
        slug = g['game_slug']
        if slug not in seen_slugs:
            seen_slugs.add(slug)
            prod_name = G4A4Product.objects.filter(game_slug=slug, is_active=True).first()
            name = prod_name.category if prod_name else g['category']
            result.append({
                "slug": slug,
                "name": name,
                "category": g['category']
            })
            
    return JsonResponse(result, safe=False)


def coins_game_detail(request, game_slug):
    """
    GET /api/coins/<game_slug>
    Returns all active products and variations for this game
    """
    if request.method != 'GET':
        return HttpResponseNotAllowed(['GET'])
        
    products = G4A4Product.objects.filter(game_slug=game_slug, is_active=True).prefetch_related('variations')
    if not products.exists():
        return JsonResponse({"message": "بازی مورد نظر یافت نشد."}, status=404)
        
    result = []
    for prod in products:
        prod_data = {
            "id": prod.id,
            "external_product_id": prod.external_product_id,
            "name": prod.name,
            "category": prod.category,
            "game_slug": prod.game_slug,
            "variations": []
        }
        
        for var in prod.variations.filter(in_stock=True).order_by('sell_toman'):
            prod_data["variations"].append({
                "id": var.id,
                "external_variation_id": var.external_variation_id,
                "name": var.name,
                "cost_irt": var.cost_irt,
                "sell_toman": var.sell_toman,
                "delivery_type": var.delivery_type,
                "region": var.region,
                "required_fields": var.required_fields,
                "attributes": var.attributes
            })
            
        if prod_data["variations"]:
            result.append(prod_data)
            
    return JsonResponse(result, safe=False)


def wallet_details(request):
    """
    GET /api/me/wallet
    Returns wallet balance and history of transactions
    """
    if request.method != 'GET':
        return HttpResponseNotAllowed(['GET'])
        
    if not request.user.is_authenticated:
        return JsonResponse({"message": "وارد شوید"}, status=401)
        
    profile, _ = UserProfile.objects.get_or_create(user=request.user)
    txns = CustomerWalletTxn.objects.filter(profile=profile).order_by('-created_at')
    
    txn_list = []
    for t in txns:
        txn_list.append({
            "id": t.id,
            "kind": t.kind,
            "kind_display": t.get_kind_display(),
            "amount": t.amount,
            "balance_after": t.balance_after,
            "note": t.note,
            "created_at": t.created_at.isoformat()
        })
        
    return JsonResponse({
        "balance": profile.wallet_balance,
        "transactions": txn_list
    })


@csrf_exempt
def wallet_topup(request):
    """
    POST /api/me/wallet/topup
    Request body: { amount }
    Creates a wallet top-up order and payments, returns ZarinPal link
    """
    if request.method != 'POST':
        return HttpResponseNotAllowed(['POST'])
        
    if not request.user.is_authenticated:
        return JsonResponse({"message": "وارد شوید"}, status=401)
        
    try:
        payload = json.loads(request.body.decode('utf-8'))
        amount = int(payload.get('amount', 0))
    except Exception:
        return JsonResponse({"message": "مبلغ نامعتبر است"}, status=400)
        
    if amount < 5000:
        return JsonResponse({"message": "حداقل مبلغ شارژ ۵,۰۰۰ تومان است."}, status=400)
        
    profile, _ = UserProfile.objects.get_or_create(user=request.user)
    
    # Create top-up order
    order = Order.objects.create(
        user=request.user,
        phone=profile.phone_number or request.user.username,
        amount=amount,
        status="pending",
        note="شارژ کیف پول",
        is_test_order=_is_test_user(request.user)
    )
    
    # Create OrderItem
    OrderItem.objects.create(
        order=order,
        product=None,
        name="شارژ کیف پول",
        price=amount,
        quantity=1,
    )
    
    # Generate payment authority using ZarinPal service
    callback_base = getattr(settings, "PAYMENT_CALLBACK_BASE_URL", "").rstrip("/")
    if callback_base:
        callback_url = urljoin(f"{callback_base}/", f"payment/verify/{order.tracking_code}")
    else:
        callback_url = request.build_absolute_uri(f'/api/payment/verify/{order.tracking_code}')
        
    is_test = _is_test_user(request.user)
    zarinpal = ZarinPalService(force_sandbox=is_test)
    success, data = zarinpal.create_payment_request(
        amount=amount,
        description=f"شارژ کیف پول {request.user.username}",
        callback_url=callback_url,
        mobile=profile.phone_number,
        email=request.user.email,
        order_id=order.tracking_code,
        currency=settings.ZARINPAL_CURRENCY
    )
    
    if success:
        Payment.objects.create(
            order=order,
            authority=data.get("authority"),
            amount=amount,
            status="pending"
        )
        return JsonResponse({
            "success": True,
            "redirect_url": data.get("redirect_url")
        })
    else:
        order.delete()
        return JsonResponse({"message": "خطا در ایجاد درخواست پرداخت در درگاه"}, status=500)


def wishlist_list(request):
    """
    GET /api/me/wishlist
    Returns wishlist items for logged in user
    """
    if request.method != 'GET':
        return HttpResponseNotAllowed(['GET'])
        
    if not request.user.is_authenticated:
        return JsonResponse({"message": "وارد شوید"}, status=401)
        
    items = WishlistItem.objects.filter(user=request.user).select_related('product', 'g4a4_product')
    
    result = []
    for item in items:
        if item.product:
            result.append({
                "id": item.id,
                "type": "catalog",
                "product_id": item.product.id,
                "name": item.product.name_fa,
                "slug": item.product.slug,
                "price": item.product.price,
                "image": item.product.image_url
            })
        elif item.g4a4_product:
            result.append({
                "id": item.id,
                "type": "coins",
                "g4a4_product_id": item.g4a4_product.id,
                "name": item.g4a4_product.name,
                "slug": item.g4a4_product.game_slug,
                "price": 0,
                "image": ""
            })
            
    return JsonResponse(result, safe=False)


@csrf_exempt
def wishlist_toggle(request):
    """
    POST /api/me/wishlist/toggle
    Request body: { product_id?, g4a4_product_id? }
    Adds or removes item from wishlist
    """
    if request.method != 'POST':
        return HttpResponseNotAllowed(['POST'])
        
    if not request.user.is_authenticated:
        return JsonResponse({"message": "وارد شوید"}, status=401)
        
    try:
        payload = json.loads(request.body.decode('utf-8'))
        prod_id = payload.get('product_id')
        g4a4_prod_id = payload.get('g4a4_product_id')
    except Exception:
        return JsonResponse({"message": "JSON نامعتبر"}, status=400)
        
    if not prod_id and not g4a4_prod_id:
        return JsonResponse({"message": "شناسه محصول الزامی است."}, status=400)
        
    if prod_id:
        product = get_object_or_404(Product, id=prod_id)
        w_item = WishlistItem.objects.filter(user=request.user, product=product)
        if w_item.exists():
            w_item.delete()
            return JsonResponse({"status": "removed", "message": "محصول از لیست علاقه‌مندی‌ها حذف شد."})
        else:
            WishlistItem.objects.create(user=request.user, product=product)
            return JsonResponse({"status": "added", "message": "محصول به لیست علاقه‌مندی‌ها اضافه شد."})
            
    if g4a4_prod_id:
        g4a4_prod = get_object_or_404(G4A4Product, id=g4a4_prod_id)
        w_item = WishlistItem.objects.filter(user=request.user, g4a4_product=g4a4_prod)
        if w_item.exists():
            w_item.delete()
            return JsonResponse({"status": "removed", "message": "بازی از لیست علاقه‌مندی‌ها حذف شد."})
        else:
            WishlistItem.objects.create(user=request.user, g4a4_product=g4a4_prod)
            return JsonResponse({"status": "added", "message": "بازی به لیست علاقه‌مندی‌ها اضافه شد."})


@csrf_exempt
def verify_identity(request):
    if not request.user.is_authenticated:
        return JsonResponse({"message": "وارد شوید"}, status=401)
        
    profile, _ = UserProfile.objects.get_or_create(user=request.user)
    
    if request.method == 'GET':
        return JsonResponse({
            "national_code": profile.national_code,
            "verification_status": profile.verification_status,
            "verification_reject_reason": profile.verification_reject_reason,
            "national_card_image": profile.national_card_image.url if profile.national_card_image else None
        })
        
    elif request.method == 'POST':
        national_code = request.POST.get("national_code", "").strip()
        card_image = request.FILES.get("national_card_image")
        
        if not national_code or len(national_code) != 10 or not national_code.isdigit():
            return JsonResponse({"message": "کد ملی ۱۰ رقمی معتبر الزامی است."}, status=400)
            
        if not card_image and not profile.national_card_image:
            return JsonResponse({"message": "تصویر کارت ملی الزامی است."}, status=400)
            
        profile.national_code = national_code
        if card_image:
            profile.national_card_image = card_image
        profile.verification_status = 'pending'
        profile.verification_reject_reason = ""
        profile.save()
        
        return JsonResponse({
            "status": "pending",
            "message": "مدارک شما ثبت شد و در انتظار تایید ادمین قرار گرفت."
        })
        
    return HttpResponseNotAllowed(['GET', 'POST'])


def admin_verification_list(request):
    if not request.user.is_authenticated or not _is_admin_user(request.user):
        return JsonResponse({"detail": "forbidden"}, status=403)
        
    if request.method != 'GET':
        return HttpResponseNotAllowed(['GET'])
        
    status_filter = request.GET.get("status", "pending")
    profiles = UserProfile.objects.filter(verification_status=status_filter)
    
    results = []
    for p in profiles:
        results.append({
            "profile_id": p.id,
            "username": p.user.username,
            "email": p.user.email,
            "phone_number": p.phone_number,
            "national_code": p.national_code,
            "verification_status": p.verification_status,
            "national_card_image": p.national_card_image.url if p.national_card_image else None
        })
        
    return JsonResponse({"results": results})


@csrf_exempt
def admin_approve_verification(request, profile_id):
    if not request.user.is_authenticated or not _is_admin_user(request.user):
        return JsonResponse({"detail": "forbidden"}, status=403)
        
    if request.method != 'POST':
        return HttpResponseNotAllowed(['POST'])
        
    profile = get_object_or_404(UserProfile, id=profile_id)
    profile.verification_status = 'verified'
    profile.verification_reject_reason = ""
    profile.save()
    
    return JsonResponse({"message": "مدارک هویت کاربر با موفقیت تایید شد."})


@csrf_exempt
def admin_reject_verification(request, profile_id):
    if not request.user.is_authenticated or not _is_admin_user(request.user):
        return JsonResponse({"detail": "forbidden"}, status=403)
        
    if request.method != 'POST':
        return HttpResponseNotAllowed(['POST'])
        
    profile = get_object_or_404(UserProfile, id=profile_id)
    
    try:
        payload = json.loads(request.body.decode('utf-8'))
        reason = payload.get('reason', '').strip()
    except Exception:
        reason = ""
        
    profile.verification_status = 'rejected'
    profile.verification_reject_reason = reason
    profile.save()
    
    return JsonResponse({"message": "مدارک هویت کاربر رد صلاحیت شد."})


@csrf_exempt
def admin_send_direct_chat(request, tracking):
    return JsonResponse({"success": False, "detail": "Not implemented"}, status=501)


@csrf_exempt
def admin_create_emergency_ticket(request, tracking):
    return JsonResponse({"success": False, "detail": "Not implemented"}, status=501)


@csrf_exempt
def admin_verify_ai_info(request, tracking):
    return JsonResponse({"success": False, "detail": "Not implemented"}, status=501)

