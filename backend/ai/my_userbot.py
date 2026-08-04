import os
import sys
import time
import asyncio
import random
import json
import re
import base64
import shutil
import tempfile
import subprocess
import httpx
import difflib
import hashlib
import logging
import sqlite3
from logging.handlers import RotatingFileHandler
from openai import OpenAI
try:
    from cachetools import TTLCache
except Exception:
    TTLCache = None
from telethon import TelegramClient, events
from telethon.sessions.sqlite import SQLiteSession
from urllib.parse import urlparse

# --- 0. DJANGO SETUP (برای دسترسی به دیتابیس) ---
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'jinxfamily.settings')
sys.path.insert(0, '/var/www/public/backend')
import django
django.setup()

from django.db.models import Q, Case, When, Value, IntegerField
from django.db import connections, close_old_connections
from django.utils import timezone
from shop.models import Order, Product, ProductVariant, UserProfile, DiscountCode, OrderBotUpdate, SiteSetting
from django.contrib.auth.models import User
from asgiref.sync import sync_to_async

# --- DATABASE HELPER FUNCTIONS ---
STATUS_FA = {
    "pending": "منتظر تایید پرداختیم",
    "paid": "پرداخت شده",
    "registered": "ثبت شده",
    "processing": "داره انجام میشه",
    "completed": "انجام شد",
    "needs_2fa": "کد دو مرحله‌ای میخواد",
    "needs_tr_region": "باید ریجن ترکیه باشه",
    "invalid_info": "اطلاعات اشتباهه",
    "canceled": "لغو شده",
    "refunded": "مبلغ برگشت خورد",
}

_PERSIAN_DIGITS = "۰۱۲۳۴۵۶۷۸۹"
_ARABIC_INDIC_DIGITS = "٠١٢٣٤٥٦٧٨٩"
_ASCII_DIGITS = "0123456789"
_DIGIT_TRANSLATION = {
    **{ord(p): a for p, a in zip(_PERSIAN_DIGITS, _ASCII_DIGITS)},
    **{ord(p): a for p, a in zip(_ARABIC_INDIC_DIGITS, _ASCII_DIGITS)},
}

def normalize_digits_to_ascii(text: str) -> str:
    """Convert Persian/Arabic-Indic digits to ASCII digits."""
    return (text or "").translate(_DIGIT_TRANSLATION)

def normalize_tracking_code(code: str) -> str:
    """Normalize tracking code for database lookups (digits + case)."""
    c = normalize_digits_to_ascii(code or "")
    c = c.strip().lstrip("#").strip()
    return c.lower()

def _json_dumps_safe(payload: object) -> str:
    return json.dumps(payload, ensure_ascii=False, default=str)

@sync_to_async
def lookup_order(tracking_code: str) -> dict | None:
    """جستجوی سفارش با کد پیگیری"""
    tracking_code = normalize_tracking_code(tracking_code)
    try:
        close_old_connections()
        order = Order.objects.select_related('user').prefetch_related('items__product').get(tracking_code=tracking_code)
        items = [f"• {item.name} ({item.quantity}x)" for item in order.items.all()]
        return {
            "found": True,
            "tracking_code": order.tracking_code,
            "status": order.status,
            "status_fa": STATUS_FA.get(order.status, order.status),
            "epic_username": order.epic_username,
            "phone": order.phone[-4:] if order.phone else "",  # فقط ۴ رقم آخر
            "amount": f"{order.amount:,}",
            "items": items,
            "rush_order": order.rush_order,
            "created_at": order.created_at.strftime("%Y/%m/%d %H:%M"),
            "created_at_raw": order.created_at,
            "completed_at": order.completed_at.strftime("%Y/%m/%d %H:%M") if order.completed_at else None,
        }
    except Order.DoesNotExist:
        return {"found": False, "tracking_code": tracking_code}
    except Exception as e:
        logger.exception("Order lookup error for %s", tracking_code)
        return None

def build_order_context_message(order_info: dict | None, tracking_code: str) -> str:
    """Build a short system context line based on DB order data."""
    tracking_code = normalize_tracking_code(tracking_code)
    if order_info is None:
        return (
            "Fact Block (قطعی از دیتابیس): "
            f"برای کد پیگیری {tracking_code} خطا در اتصال یا پاسخ نامعتبر ثبت شد."
        )
    if not order_info.get("found"):
        return (
            "Fact Block (قطعی از دیتابیس): "
            f"برای کد پیگیری {tracking_code} سفارشی یافت نشد."
        )
    status = (order_info.get("status") or "").strip()
    status_fa = (order_info.get("status_fa") or status).strip()
    created_at = (order_info.get("created_at") or "").strip()
    created_at_raw = order_info.get("created_at_raw")
    hours_since = None
    if created_at_raw:
        try:
            delta = timezone.now() - created_at_raw
            hours_since = round(delta.total_seconds() / 3600, 1)
        except Exception:
            hours_since = None
    items = order_info.get("items") or []
    items_text = "، ".join([i.replace("• ", "").strip() for i in items if i]) if items else ""
    rush_text = "بله" if order_info.get("rush_order") else "خیر"
    amount_text = (order_info.get("amount") or "").strip()
    parts = [
        "Fact Block (قطعی از دیتابیس): این اطلاعات قطعی از دیتابیس ماست.",
        f"کد پیگیری {tracking_code}.",
        f"وضعیت: {status} ({status_fa}).",
        f"سفارش فوری: {rush_text}.",
        "اگر ادعای کاربر با این وضعیت متفاوت بود، محترمانه راهنمایی کن و هرگز اطلاعات متناقض نده.",
    ]
    if created_at:
        parts.append(f"زمان ثبت: {created_at}.")
    if hours_since is not None:
        parts.append(f"مدت گذشته از ثبت: {hours_since} ساعت.")
    if items_text:
        parts.append(f"محصولات: {items_text}.")
    if amount_text:
        parts.append(f"مبلغ سفارش: {amount_text} تومان.")
    if status == "needs_2fa":
        parts.append(
            "وضعیت سفارش نیاز به 2FA است. ابتدا بررسی کن آیا متن کاربر شامل کد ۶ رقمی یا تایید خاموش کردن 2FA است. "
            "اگر بود، اعلام کن اطلاعات برای تست به بخش فنی ارسال شد و درخواست کد را تکرار نکن."
        )
    return " ".join(parts)

def _normalize_tg_handle(value: str | None) -> str:
    return (value or "").strip().lstrip("@").lower()

def _extract_phone_last4(value: str | None) -> str:
    digits = re.sub(r"\D", "", normalize_digits_to_ascii(value or ""))
    return digits[-4:] if len(digits) >= 4 else ""

def _normalize_phone_for_order(value: str | None) -> str:
    """Normalize Iranian mobile formats to a consistent digits string (prefers leading 0)."""
    digits = re.sub(r"\D", "", normalize_digits_to_ascii(value or ""))
    if not digits:
        return ""
    if digits.startswith("0098"):
        digits = digits[4:]
    if digits.startswith("98") and len(digits) >= 12:
        digits = digits[2:]
    if digits.startswith("9") and len(digits) == 10:
        digits = "0" + digits
    return digits

def parse_order_corrections(text: str) -> dict:
    """
    Extract likely order/account corrections from free-form user text.
    Returns keys: epic_username, phone, password, region, twofa_code, platform, twofa_disabled.
    """
    raw = (text or "").strip()
    t = normalize_digits_to_ascii(raw)
    out: dict = {
        "epic_username": None,
        "phone": None,
        "password": None,
        "region": None,
        "twofa_code": None,
        "platform": None,
        "twofa_disabled": False,
    }
    if not t:
        return out

    # Email / Epic username
    emails = EMAIL_REGEX.findall(t)
    if emails:
        out["epic_username"] = (emails[-1] or "").strip()

    # Phone (Iran mobile)
    phones = MOBILE_REGEX.findall(t)
    if phones:
        out["phone"] = _normalize_phone_for_order(phones[-1])

    # Password (keyword-based)
    m = re.search(r"(?i)\b(password|pass|پسورد|رمز)\b\s*[:：]?\s*(\S+)", t)
    if m:
        out["password"] = (m.group(2) or "").strip()

    # Username if explicitly provided (fallback when no email)
    if not out["epic_username"]:
        m_user = re.search(r"(?i)\b(username|user|یوزرنیم|نام\s*کاربری|یوزر)\b\s*[:：]?\s*(\S+)", t)
        if m_user:
            candidate = (m_user.group(2) or "").strip()
            if candidate and not EMAIL_REGEX.search(candidate):
                out["epic_username"] = candidate[:150]

    # Region hints
    lowered = t.lower()
    if ("ترکیه" in lowered) or ("turkey" in lowered) or re.search(r"(?i)\btr\b", lowered):
        out["region"] = "TR"
    elif ("آمریکا" in lowered) or ("usa" in lowered) or re.search(r"(?i)\bus\b", lowered):
        out["region"] = "US"

    # 2FA code (only when hinted)
    if TWO_FA_HINT_REGEX.search(t):
        m_code = re.search(r"(?<!\d)(\d{6})(?!\d)", t)
        if m_code:
            out["twofa_code"] = m_code.group(1)

    platform = detect_platform(raw)
    if not platform:
        email = (out.get("epic_username") or "").lower()
        domain = email.split("@")[-1] if "@" in email else ""
        if domain in {"outlook.com", "hotmail.com", "live.com", "msn.com", "hotmail.co.uk", "outlook.co.uk"}:
            platform = "Xbox/Microsoft"
    if not platform:
        lowered = t.lower()
        if "epic" in lowered or "fortnite" in lowered:
            platform = "Epic Games"
    if platform:
        out["platform"] = platform

    if is_twofa_disabled_message(raw):
        out["twofa_disabled"] = True

    return out

def extract_identity_hints(text: str) -> dict:
    """Extract identity hints for verifying ownership of an order."""
    t = normalize_digits_to_ascii((text or "").strip())
    if not t:
        return {"email": None, "phone": None, "name": None, "last4": None}

    email = None
    emails = EMAIL_REGEX.findall(t)
    if emails:
        email = (emails[-1] or "").strip()

    phone = None
    phones = MOBILE_REGEX.findall(t)
    if phones:
        phone = _normalize_phone_for_order(phones[-1])

    name = None
    m_name = re.search(r"(?:اسم|نام(?:\s*و\s*نام\s*خانوادگی)?|name)\s*[:：]?\s*([^\n]{2,80})", t, flags=re.IGNORECASE)
    if m_name:
        name = re.sub(r"\s+", " ", (m_name.group(1) or "").strip())

    last4 = None
    if re.fullmatch(r"\d{4}", t):
        last4 = t
    elif re.search(r"(?:موبایل|شماره|آخر\s*شماره|last\s*4)", t, flags=re.IGNORECASE):
        last4 = extract_last4_digits(t)

    return {"email": email, "phone": phone, "name": name, "last4": last4}

def build_bot_admin_note_block(sender, combined_text: str, parsed: dict) -> str:
    """
    A clean, admin-friendly block for Order.note (can include sensitive values).
    """
    name = (getattr(sender, "first_name", "") or "").strip()
    username = getattr(sender, "username", None)
    user_part = f"@{username}" if username else (name or "نامشخص")
    ts = tehran_now_str()

    lines = [
        "╔══════════════════════════════════════╗",
        "║   🤖✨ BOT AUTO-FIX | اصلاح خودکار    ║",
        "╚══════════════════════════════════════╝",
        f"Time: {ts}",
        f"From: {user_part}",
    ]
    if parsed.get("epic_username"):
        lines.append(f"Epic/Email: {parsed['epic_username']}")
    if parsed.get("password"):
        lines.append(f"Password: {parsed['password']}")
    if parsed.get("twofa_code"):
        lines.append(f"2FA Code: {parsed['twofa_code']}")
    if parsed.get("twofa_disabled"):
        lines.append("2FA Disabled: yes")
    if parsed.get("region"):
        lines.append(f"Region: {parsed['region']}")
    if parsed.get("phone"):
        lines.append(f"Phone: {parsed['phone']}")
    if parsed.get("platform"):
        lines.append(f"Platform: {parsed['platform']}")

    body = (combined_text or "").strip()
    if body:
        if len(body) > 800:
            body = body[:800] + "…"
        lines.append("— User Message —")
        lines.append(body)

    return "\n".join([l for l in lines if l]).strip()

@sync_to_async
def apply_bot_order_note_update(
    tracking_code: str,
    telegram_user_id: str,
    telegram_username: str | None,
    source_message_id: str | int | None,
    update_block: str,
    last4_digits: str | None = None,
    field_updates: dict | None = None,
    verify_email: str | None = None,
    verify_phone: str | None = None,
    verify_name: str | None = None,
) -> dict:
    """
    Append customer-provided corrected info into Order.note + log an OrderBotUpdate.
    امنیت: برای ثبت، یا باید تلگرام سفارش با یوزرنیم فرستنده یکی باشد، یا ۴ رقم آخر موبایل تطبیق داده شود.
    """
    tracking_code = normalize_tracking_code(tracking_code)
    try:
        close_old_connections()
        order = Order.objects.get(tracking_code=tracking_code)
    except Order.DoesNotExist:
        return {"ok": False, "reason": "not_found", "tracking_code": tracking_code}
    except Exception:
        logger.exception("Order lookup failed for update: %s", tracking_code)
        return {"ok": False, "reason": "db_error", "tracking_code": tracking_code}

    sender_handle = _normalize_tg_handle(telegram_username)
    order_handle = _normalize_tg_handle(order.telegram)

    authorized = False

    handle_match = bool(sender_handle and order_handle and sender_handle == order_handle)

    phone_last4 = _extract_phone_last4(order.phone)
    last4 = normalize_digits_to_ascii(str(last4_digits or "")).strip()
    last4_match = bool(phone_last4 and last4 and last4 == phone_last4)

    v_phone = _normalize_phone_for_order(verify_phone)
    o_phone = _normalize_phone_for_order(order.phone)
    phone_match = bool(v_phone and o_phone and (_extract_phone_last4(v_phone) == _extract_phone_last4(o_phone)))

    v_email = (verify_email or "").strip().lower()
    email_candidates = set()
    if (order.epic_username or "").strip():
        email_candidates.add((order.epic_username or "").strip().lower())
    try:
        if getattr(order, "user", None) and (order.user.email or "").strip():
            email_candidates.add((order.user.email or "").strip().lower())
    except Exception:
        pass
    email_match = bool(v_email and v_email in email_candidates)

    name_match = False
    if verify_name:
        try:
            full = ""
            if getattr(order, "user", None):
                full = (order.user.get_full_name() or "").strip()
            v_name = re.sub(r"\s+", " ", (verify_name or "").strip()).lower()
            o_name = re.sub(r"\s+", " ", full).lower()
            name_match = bool(v_name and o_name and v_name == o_name)
        except Exception:
            name_match = False

    if handle_match:
        authorized = True
    elif last4_match or phone_match:
        authorized = True
    elif name_match and email_match:
        authorized = True

    if not authorized:
        provided_any = bool(last4_digits or verify_email or verify_phone or verify_name)
        return {
            "ok": False,
            "reason": "invalid_identity" if provided_any else "need_identity",
            "tracking_code": tracking_code,
        }

    fields_changed: list[str] = []
    old_epic = (order.epic_username or "").strip()
    old_phone = _normalize_phone_for_order(order.phone)
    old_tg = (order.telegram or "").strip()

    updates = field_updates or {}
    if isinstance(updates, dict):
        new_epic = (updates.get("epic_username") or "").strip()
        if new_epic and new_epic != (order.epic_username or "").strip():
            order.epic_username = new_epic[:150]
            fields_changed.append("epic_username")

        new_phone = _normalize_phone_for_order(updates.get("phone"))
        if new_phone and new_phone != _normalize_phone_for_order(order.phone):
            order.phone = new_phone[:30]
            fields_changed.append("phone")

    if sender_handle and not (order.telegram or "").strip():
        order.telegram = f"@{sender_handle}"
        fields_changed.append("telegram")

    old_note = (order.note or "").strip()
    block = (update_block or "").strip()
    if not block:
        return {"ok": False, "reason": "empty_update", "tracking_code": tracking_code}

    if any(k in fields_changed for k in ("epic_username", "phone", "telegram")):
        change_lines = ["— BOT Applied Changes —"]
        if "epic_username" in fields_changed:
            change_lines.append(f"epic_username: {old_epic}  →  {(order.epic_username or '').strip()}")
        if "phone" in fields_changed:
            change_lines.append(f"phone: {old_phone}  →  {_normalize_phone_for_order(order.phone)}")
        if "telegram" in fields_changed:
            change_lines.append(f"telegram: {old_tg}  →  {(order.telegram or '').strip()}")
        block = ("\n".join(change_lines) + "\n\n" + block).strip()

    new_note = (old_note + "\n\n" + block).strip() if old_note else block
    if new_note != (order.note or ""):
        order.note = new_note
        fields_changed.append("note")

    # وقتی بات اطلاعات را اصلاح می‌کند، سفارش به انتهای صف برود
    # اگر سفارش در وضعیت نیاز به اطلاعات تکمیلی بود، به «ثبت‌شده» برگردد (صف انجام).
    followup_statuses = {"needs_2fa", "invalid_info", "needs_tr_region"}
    if order.status not in ("completed", "canceled", "refunded"):
        if order.status in followup_statuses and order.status != "registered":
            order.status = "registered"
            fields_changed.append("status")
        order.created_at = timezone.now()
        fields_changed.append("created_at")

    if fields_changed:
        order.save(update_fields=fields_changed)

    kinds: list[str] = []
    if EMAIL_REGEX.search(block):
        kinds.append("email")
    if PASSWORD_KEYWORD_REGEX.search(block) or _looks_like_password_token(block):
        kinds.append("password")
    if REGION_KEYWORD_REGEX.search(block):
        kinds.append("region")
    if USERNAME_KEYWORD_REGEX.search(block):
        kinds.append("username")
    kind_str = ", ".join(kinds) if kinds else "details"
    summary = f"AUTO-FIX ✅ ({kind_str})"

    try:
        OrderBotUpdate.objects.create(
            order=order,
            source="telegram",
            telegram_user_id=str(telegram_user_id or ""),
            telegram_username=("@"+sender_handle) if sender_handle else "",
            source_message_id=str(source_message_id or ""),
            fields_changed=fields_changed or ["note"],
            summary=summary,
        )
    except Exception:
        logger.exception("Failed to create OrderBotUpdate for %s", tracking_code)

    return {
        "ok": True,
        "tracking_code": tracking_code,
        "fields_changed": fields_changed or ["note"],
        "status": order.status,
    }

@sync_to_async
def search_product(query: str) -> list[dict]:
    """جستجوی محصول با نام"""
    query = query.strip()
    close_old_connections()
    products = Product.objects.filter(
        Q(name_fa__icontains=query) | Q(slug__icontains=query),
        active=True
    )[:5]

    return [_format_product_entry(p) for p in products]

@sync_to_async
def list_top_products(limit: int = 5) -> list[dict]:
    """برگشت لیست کوتاه محصولات پرتقاضا"""
    close_old_connections()
    fortnite_priority_slugs = [
        "fortnite-crew-pack",
        "fortnite-starter-pack",
        "v-bucks",
        "lego-starter-pack",
        "fortnite-battle-pass",
        "agency-renegades",
        "fortnite-glided-elite-pack",
        "fortnite-save-the-world",
    ]
    lego_fallback = Q(slug__iexact='lego-starter-pack') | Q(name_fa__icontains='لگو استارتر') | Q(name_fa__icontains='lego')

    qs = (
        Product.objects.filter(active=True)
        .annotate(
            category_order=Case(
                When(category='FORTNITE', then=Value(1)),
                When(category='AI', then=Value(2)),
                When(category='GIFTCARDS', then=Value(3)),
                When(category='GAMES', then=Value(4)),
                When(category='SUBSCRIPTIONS', then=Value(5)),
                default=Value(6),
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
        )
        .order_by('category_order', 'slug_order', '-id')[:limit]
    )
    return [_format_product_entry(p) for p in qs]

@sync_to_async
def find_products_in_text(text: str) -> list[dict]:
    """تحلیل آزاد متن برای پیدا کردن محصول با مرتب‌سازی هوشمند بر اساس شباهت نام."""
    normalized = re.sub(r'[^\w\u0600-\u06FF\s-]', ' ', text).lower()
    terms = [t for t in normalized.split() if len(t) >= 3]
    if not terms:
        return []

    query = Q()
    for term in terms:
        query |= Q(name_fa__icontains=term) | Q(slug__icontains=term)

    close_old_connections()
    # Fetch more candidates to sort by relevance in Python
    # We fetch up to 30 to ensure the best match isn't cut off if the DB order is bad
    products = list(Product.objects.filter(query, active=True).distinct()[:30])

    def score_p(p):
        # Score based on similarity of product name/slug to the user's query
        n_fa = (p.name_fa or "").lower()
        slug = (p.slug or "").lower().replace("-", " ")
        q_clean = normalized.strip()
        
        s1 = difflib.SequenceMatcher(None, q_clean, n_fa).ratio()
        s2 = difflib.SequenceMatcher(None, q_clean, slug).ratio()
        
        # Bonus: if all user terms are present in the product name
        all_terms_hit = all((t in n_fa or t in slug) for t in terms)
        bonus = 0.2 if all_terms_hit else 0.0
        
        return max(s1, s2) + bonus

    products.sort(key=score_p, reverse=True)
    return [_format_product_entry(p) for p in products[:5]]

def _format_product_entry(p: Product) -> dict:
    variants = list(p.variants.all())
    if variants:
        price_range = f"{min(v.price for v in variants):,} - {max(v.price for v in variants):,}"
    else:
        price_range = f"{p.price:,}"

    return {
        "name": p.name_fa,
        "slug": p.slug,
        "category": p.get_category_display(),
        "price": price_range,
        "has_variants": len(variants) > 0,
        "url": f"{SITE_URL}/products/{p.slug}",
    }

async def get_product_price(product_name: str) -> str | None:
    """دریافت قیمت یک محصول"""
    results = await search_product(product_name)
    if results:
        p = results[0]
        return f"{p['name']}: {p['price']} تومان"
    return None

def extract_tracking_code(text: str) -> str | None:
    """استخراج هوشمند کد پیگیری با فیلتر کردن مقادیر ویباکس و قیمت."""
    t = normalize_digits_to_ascii(text or "").strip()
    if not t:
        return None

    BLACKLIST_NUMBERS = {
        "1000", "600", "2800", "5000", "13500", "200", "50", "299", "300"
    }

    # حالت «فقط کد» (۴ تا ۱۰ رقم) - اما اعداد رایج قیمت/ویباکس و کدهای ۶ رقمی 2FA را نادیده بگیر
    only_code = re.match(r"^#?(\d{4,10})$", t)
    if only_code:
        code = only_code.group(1)
        if len(code) == 6:
            return None
        if code in BLACKLIST_NUMBERS:
            return None
        return normalize_tracking_code(code)

    # الگوهای صریح: «کد/شماره/سفارش/پیگیری: 1234»
    explicit_patterns = [
        r"(?i)(?:کد|شماره|سفارش|پیگیری|code|order)\s*[:#\-]?\s*(\d{4,10})",
        r"(?i)#\s*(\d{4,10})",
    ]
    for pattern in explicit_patterns:
        matches = re.findall(pattern, t)
        if matches:
            return normalize_tracking_code(matches[-1])

    # حذف اعداد چسبیده به کلمات قیمت/ویباکس تا برداشت اشتباه نشود
    t_cleaned = re.sub(
        r"(?i)(\d+)\s*(?:ویباکس|vbuck|v-buck|vbucks|تومان|تومن|ریال|لیر|دلار|price|amount)",
        "",
        t,
    )

    # جستجوی آخرین عدد ۴ تا ۱۰ رقمی باقی‌مانده
    nums = re.findall(r"(?<!\d)(\d{4,10})(?!\d)", t_cleaned)
    if len(nums) == 1:
        candidate = nums[0]
        if len(candidate) == 6:
            return None
        if candidate not in BLACKLIST_NUMBERS:
            return normalize_tracking_code(candidate)

    return None

PASSWORD_KEYWORD_REGEX = re.compile(r"(?i)\bpassword\b|\bpass\b|پسورد|رمز")
REGION_KEYWORD_REGEX = re.compile(r"(?i)\bregion\b|ریجن")
USERNAME_KEYWORD_REGEX = re.compile(r"(?i)\busername\b|\bgamertag\b|یوزرنیم|نام\s*کاربری")

ORDER_TIME_WORDS = ("زمان", "چقدر", "کی", "چه موقع", "تحویل", "تکمیل", "انجام", "صف", "پردازش", "processing")
ORDER_TIME_RANGE_REGEX = re.compile(
    r"(?i)(?:ظرف|بین|حدوداً|حدودا|تقریباً|تقريبا)?\s*([۰-۹0-9]{1,3})\s*(?:تا|الی|-|—|ـ)\s*([۰-۹0-9]{1,3})\s*(?:ساعت|hour)\b"
)

def local_policy_reply(text: str) -> str | None:
    """
    پاسخ‌های قطعی و تکرارشونده که نباید به LLM سپرده شوند (برای جلوگیری از تناقض).
    """
    t = (text or "").strip()
    if not t:
        return None

    t_norm = normalize_digits_to_ascii(t).lower().replace("‌", " ")

    # سوال مبهم درباره تعداد ویباکس (ارجاع به «این ... ویب میده؟») بدون نام/لینک محصول
    if ("این" in t_norm) and re.search(r"(?i)(ویباکس|ویب|vbuck|v-buck|vbucks)", t_norm) and re.search(r"(?<!\d)(\d{2,4})(?!\d)", t_norm):
        return "برای اعلام دقیق تعداد ویباکس، لطفاً نام دقیق محصول یا لینک همان صفحه محصول در jinxfamily.shop را ارسال کنید."

    # پیام‌های صرفاً ۶ رقمی معمولاً کد تایید دو مرحله‌ای هستند، نه کد پیگیری
    if re.fullmatch(r"\d{6}", t_norm) and not any(k in t_norm for k in ("کد", "پیگیری", "سفارش", "order", "tracking")):
        return "کدهای ۶ رقمی کد تأیید دو مرحله‌ای ورود به اکانت هستند، نه کد پیگیری."

    # پیام صرفاً عددی طولانی (احتمالاً شماره تراکنش/کارت) نه کد پیگیری ۴ رقمی
    if re.fullmatch(r"\d{7,}", t_norm) and not any(k in t_norm for k in ("کد", "پیگیری", "سفارش", "order", "tracking")):
        return (
            "کد پیگیری سفارش ۴ رقمی است و در پنل سایت قابل مشاهده است. "
            "اگر این شماره تراکنش بانکی است، لطفاً تصویر رسید پرداخت را ارسال کنید."
        )

    # تغییر ریجن US به TR
    mentions_us = bool(re.search(r"\bus\b|\busa\b|امریکا|آمریکا", t_norm))
    mentions_tr = bool(re.search(r"\btr\b|ترکیه", t_norm))
    if any(k in t_norm for k in ("ریجن", "region", "تغییر", "تبدیل")) and mentions_us and mentions_tr:
        return (
            "اگر سفارش اپیک گیمز با هزینه بیشتر از سایت ثبت شده باشد، ریجن اپیک در صورت داشتن قابلیت تغییر، "
            "به‌صورت رایگان تغییر می‌شود. اگر هزینه کروپک کمتر (اکانت Xbox) پرداخت شده و ریجن شما ترکیه نباشد، "
            "برای شما اکانت جدید با ریجن ترکیه ساخته می‌شود."
        )

    # فعال‌سازی فوری و کارت‌به‌کارت
    if any(k in t_norm for k in ("کارت به کارت", "کارت‌به‌کارت", "کارت بهکارت")) and "فوری" in t_norm:
        return (
            "خیر. انتخاب «فوری» باید قبل از پرداخت انجام شود و پرداخت فقط از طریق سایت امکان‌پذیر است. "
            "ظرفیت سفارش فوری روزانه محدود است و هر روز صبح راس ساعت ۱۰ مجدد شارژ می‌شود."
        )

    # فعال‌سازی محصولات از طریق Epic
    if any(k in t_norm for k in ("اپیک", "اپیم", "epic")) and any(k in t_norm for k in ("فعال", "فعال سازی", "فعال‌سازی")):
        return (
            "بله، تمامی محصولات فروشگاه از طریق Epic Games به‌صورت قانونی فعال می‌شوند. "
            "کروپک در حالت عادی با اکانت Xbox فعال می‌شود و در صورت انتخاب گزینه فوری/VIP، از درگاه اپیک بین ۱۵ تا ۴۵ دقیقه انجام می‌شود. "
            "اگر اکانت Xbox نداشته باشید، به‌صورت رایگان برای شما ساخته می‌شود."
        )

    # ساخت اکانت Xbox / Microsoft
    asks_account_creation = any(k in t_norm for k in ("اکانت", "account")) and any(
        k in t_norm for k in ("بساز", "ساخت", "میساز", "ایجاد", "create", "make")
    )
    if detect_platform(t) == "Xbox" and asks_account_creation:
        return (
            "سلام.\n"
            "بله، امکان ساخت اکانت Xbox/Microsoft وجود دارد.\n"
            "لطفاً کد پیگیری سفارش را ارسال نمایید تا مراحل بعدی و اطلاعات موردنیاز اعلام شود."
        )

    # تبدیل سفارش به «فوری» (راهنمایی برگشت به کیف پول و ثبت دوباره)
    if any(k in t_norm for k in ("فوری", "rush", "عجله", "اولویت", "زودتر")) and any(
        k in t_norm for k in ("هزینه", "مابه", "مابه‌التفاوت", "پرداخت", "چقدر", "امکان", "می شود", "می‌شود")
    ):
        return (
            "عزیز اگر قصد تغییر به فوری دارین، می‌تونین برید داخل سایت درخواست برگشت به کیف پول بدین. "
            "توی پنل کاربری‌تون https://jinxfamily.shop/checkout لیست سفارشات > برگشت به کیف پول رو بزنید "
            "بعد مجدد گزینه فوری رو خریداری کنید."
        )

    return None

def enforce_store_policies(
    reply: str,
    user_text: str | None = None,
    has_verified_order: bool | None = None,
) -> str:
    """
    محافظ پس‌پردازشی برای جلوگیری از ادعاهای متناقض/نامعتبر در خروجی مدل.
    """
    r = (reply or "").strip()
    if not r:
        return r

    r_norm = normalize_digits_to_ascii(r).lower().replace("‌", " ")

    # اگر پاسخ مدل به‌اشتباه گفت «اکانت Xbox نمی‌سازیم»، اصلاح کن (طبق سیاست جدید)
    mentions_xbox = ("xbox" in r_norm) or ("ایکس باکس" in r_norm) or ("اکس باکس" in r_norm)
    if mentions_xbox and any(k in r_norm for k in ("نمی‌سازیم", "نمی سازیم", "نمی‌کنیم", "نمی کنیم")) and "اکانت" in r_norm:
        return (
            "سلام.\n"
            "بله، امکان ساخت اکانت Xbox/Microsoft وجود دارد.\n"
            "لطفاً کد پیگیری سفارش را ارسال نمایید تا مراحل بعدی و اطلاعات موردنیاز اعلام شود."
        )

    # جلوگیری از ادعای تبدیل سفارش به «فوری» با مابه‌التفاوت (راهنمایی مسیر درست)
    mabeh_phrase = bool(re.search(r"ما\s*به\s*تفاوت|مابه\s*تفاوت", r_norm))
    if any(k in r_norm for k in ("فوری", "rush", "اولویت")) and (
        any(k in r_norm for k in ("مابه", "مابه‌التفاوت", "تبدیل سفارش", "تبدیل", "پرداخت اضافه"))
        or mabeh_phrase
    ):
        return (
            "عزیز اگر قصد تغییر به فوری دارین، می‌تونین برید داخل سایت درخواست برگشت به کیف پول بدین. "
            "توی پنل کاربری‌تون https://jinxfamily.shop/checkout لیست سفارشات > برگشت به کیف پول رو بزنید "
            "بعد مجدد گزینه فوری رو خریداری کنید."
        )

    return r.strip()

def _looks_like_password_token(token: str) -> bool:
    t = (token or "").strip()
    if not (8 <= len(t) <= 80):
        return False
    if any(ch.isspace() for ch in t):
        return False
    if EMAIL_REGEX.search(t):
        return False
    if re.search(r"(?i)https?://", t):
        return False
    if not re.search(r"[A-Za-z]", t):
        return False
    if not (re.search(r"\d", t) or re.search(r"[^A-Za-z0-9]", t)):
        return False
    return True

def is_order_info_update_message(text: str) -> bool:
    """Heuristic: customer is sending corrected account/order details (email/pass/region/username)."""
    t = (text or "").strip()
    if not t:
        return False
    if EMAIL_REGEX.search(t):
        return True
    if PASSWORD_KEYWORD_REGEX.search(t):
        return True
    if REGION_KEYWORD_REGEX.search(t):
        return True
    if USERNAME_KEYWORD_REGEX.search(t):
        return True
    if _looks_like_password_token(t):
        return True
    return False

COMPLEX_FINANCIAL_KEYWORDS = (
    "اختلاف",
    "مغایرت",
    "عدم تطابق",
    "اشتباه",
    "کسر",
    "کسر شده",
    "کم شده",
    "بیشتر",
    "دوبار",
    "دو بار",
    "تراکنش",
    "پرداخت",
    "رسید",
    "بانک",
    "واریز",
    "برگشت وجه",
    "بازگشت وجه",
    "استرداد",
    "refund",
    "chargeback",
    "dispute",
)

def should_use_medium_thinking(text: str) -> bool:
    """Detect financial dispute/complex cases for higher reasoning effort."""
    t = normalize_digits_to_ascii(text or "").lower().replace("‌", " ")
    return any(k in t for k in COMPLEX_FINANCIAL_KEYWORDS)

def tehran_now_str() -> str:
    from datetime import datetime, timezone, timedelta
    tehran_tz = timezone(timedelta(hours=3, minutes=30))
    return datetime.now(tehran_tz).strftime("%Y/%m/%d %H:%M")

def build_order_note_update_block(sender, combined_text: str) -> str:
    name = (getattr(sender, "first_name", "") or "").strip()
    username = getattr(sender, "username", None)
    user_part = f"@{username}" if username else (name or "نامشخص")
    ts = tehran_now_str()
    body = (combined_text or "").strip()
    if len(body) > 1500:
        body = body[:1500] + "…"
    return (
        f"--- اصلاح اطلاعات توسط مشتری (تلگرام) | {ts} | {user_part} ---\n"
        f"{body}"
    ).strip()

def extract_product_query(text: str) -> str | None:
    """استخراج نام محصول از سوال قیمت"""
    patterns = [
        r'قیمت\s+(.+?)[\s؟?]*$',
        r'(.+?)\s+چند[ه]?[\s؟?]*$',
        r'(.+?)\s+قیمت',
        r'(.+?)\s+دارید[؟?]*$',
        r'(.+?)\s+می\s*خواستم[\s؟?]*$',
        r'(.+?)\s+می\s*خوام[\s؟?]*$',
        r'(.+?)\s+می\s*خواهم[\s؟?]*$',
    ]
    for pattern in patterns:
        match = re.search(pattern, text.strip())
        if match:
            return match.group(1).strip()
    return None

def wants_product_list(text: str) -> bool:
    lowered = text.replace("‌", " ").lower()
    keywords = [
        "لیست محصولات",
        "قیمت محصولات",
        "لیست قیمت",
        "قیمت ها رو",
        "محصولات رو بفرست",
        "لیستتون",
    ]
    return any(kw in lowered for kw in keywords)

def format_time_ago(created_at) -> str:
    """تبدیل زمان به فرمت 'x ساعت/دقیقه پیش'"""
    from datetime import datetime, timezone, timedelta
    tehran_tz = timezone(timedelta(hours=3, minutes=30))
    now = datetime.now(tehran_tz)

    if created_at is None:
        return "نامشخص"

    if isinstance(created_at, str):
        created = datetime.strptime(created_at, "%Y/%m/%d %H:%M")
        created = created.replace(tzinfo=tehran_tz)
    else:
        # created_at باید datetime باشد؛ تبدیل به تایم‌زون تهران
        created = created_at.astimezone(tehran_tz) if getattr(created_at, "tzinfo", None) else created_at.replace(tzinfo=tehran_tz)

    diff = now - created
    minutes = int(diff.total_seconds() / 60)
    hours = int(minutes / 60)
    days = int(hours / 24)

    if days > 0:
        return f"{days} روز پیش"
    elif hours > 0:
        return f"{hours} ساعت پیش"
    elif minutes > 0:
        return f"{minutes} دقیقه پیش"
    else:
        return "همین الان"

def format_order_response(order_data: dict, customer_name: str = "") -> str:
    """فرمت کردن پاسخ پیگیری سفارش با لحن محترمانه و انسانی."""

    def _mask_email(value: str) -> str:
        if not value or "@" not in value:
            return value
        local, domain = value.split("@", 1)
        if len(local) <= 2:
            masked_local = (local[:1] + "*") if local else "*"
        else:
            masked_local = local[:2] + "*" * max(len(local) - 3, 1) + local[-1:]
        return f"{masked_local}@{domain}"

    customer_part = f" {customer_name}" if customer_name else ""
    greeting = f"سلام{customer_part}"

    if not order_data.get("found"):
        tracking = order_data.get("tracking_code", "")
        return (
            f"{greeting}\n"
            f"این کدی که فرستادید {tracking} توی سیستم نیست\n"
            "اگر اشتباه تایپ شده اصلاحش را بفرستید\n"
            "اگر پرداخت کرده‌اید تصویر رسید را بفرستید تا دستی بررسی شود"
        )

    time_ago = format_time_ago(order_data.get("created_at_raw") or order_data.get("created_at"))
    status = order_data.get("status", "")
    tracking = order_data.get("tracking_code", "")
    status_fa = order_data.get("status_fa", status)

    epic = (order_data.get("epic_username") or "").strip()
    phone_last4 = (order_data.get("phone") or "").strip()
    items = order_data.get("items") or []

    lines = [
        greeting,
        f"سفارش با کد پیگیری {tracking} پیدا شد",
        f"وضعیت الان {status_fa}",
    ]
    if time_ago:
        lines.append(f"زمان ثبت {time_ago}")

    if items:
        lines.append("اقلام سفارش")
        lines.extend(items)

    account_bits = []
    if epic:
        account_bits.append(f"اکانت: {_mask_email(epic)}")
    if phone_last4:
        account_bits.append(f"شماره موبایل: ***{phone_last4}")
    if account_bits:
        lines.append(" | ".join(account_bits))

    if status == "completed":
        lines.append("اگر هنوز مشکلی دارید خلاصه بفرستید تا بررسی کنم")
    elif status == "processing":
        lines.append("سفارش در حال انجام است اگر نیاز به ورود باشد اطلاع می‌دهیم")
        if order_data.get("rush_order"):
            lines.append("این سفارش فوری است و در اولویت قرار دارد")
    elif status == "needs_2fa":
        lines.append("برای ادامه کار کد تایید دو مرحله‌ای را ارسال کنید")
    elif status == "needs_tr_region":
        lines.append("ریجن اکانت باید روی ترکیه باشد اگر نیاز دارید راهنمای تغییر ریجن در سایت هست")
    elif status == "invalid_info":
        lines.append("اطلاعات اکانت ناقص یا نادرست است اطلاعات درست را بفرستید تا سفارش انجام شود")
    elif status in ("paid", "registered"):
        lines.append("پرداخت تایید شده و سفارش در صف انجام است")
    elif status == "pending":
        lines.append("اگر مبلغ از حساب شما کم شده به‌روزرسانی بانک ممکن است ۵ تا ۱۰ دقیقه زمان ببرد")
        lines.append("چند دقیقه بعد دوباره کد پیگیری را بفرستید یا تصویر رسید پرداخت را ارسال کنید")
    elif status == "canceled":
        lines.append("این سفارش لغو شده است")
    elif status == "refunded":
        lines.append("این سفارش مسترد شده و مبلغ آن برگشته است")

    return "\n".join([l for l in lines if l]).strip()

def format_order_response_short(order_data: dict) -> str:
    """پاسخ کوتاه و دقیق برای پیگیری سفارش با لحن انسانی."""
    if not isinstance(order_data, dict):
        return "یه مشکلی پیش اومد، چند دقیقه دیگه دوباره امتحان کن."

    tracking = order_data.get("tracking_code", "") or ""
    if order_data.get("error") == "lookup_failed":
        return "الان دسترسی به سیستم سفارشات ندارم. چند دقیقه دیگه چک کن عزیزم."

    if not order_data.get("found"):
        if tracking:
            return f"کد {tracking} رو پیدا نکردم. مطمئنی درست تایپ کردی؟ (باید ۴ رقمی باشه)"
        return "کدی پیدا نکردم. لطفاً کد ۴ رقمی سفارشت رو بفرست."

    status = (order_data.get("status") or "").strip()
    status_fa = (order_data.get("status_fa") or status).strip()
    
    # Extract details
    items = order_data.get("items", [])
    rush = order_data.get("rush_order", False)
    
    items_str = ""
    if items:
        # Clean up items (remove bullets)
        clean_items = [i.replace("• ", "").strip() for i in items]
        items_str = "، ".join(clean_items)

    # Build the base sentence
    rush_tag = " (فوری/VIP) ⚡️" if rush else ""
    base = f"سفارش {tracking} شما{rush_tag}"
    
    if items_str:
        if len(items_str) > 50:
            items_str = items_str[:50] + "..."
        base += f" شامل «{items_str}»"

    # Map statuses to friendly messages
    action_map = {
        "completed": f"با موفقیت انجام شد ✅ مبارکت باشه عزیزم.",
        "processing": f"داره انجام میشه ⏳ الان توی صف هست و بزودی تکمیل میشه.",
        "needs_2fa": f"نیاز به کد تایید دو مرحله‌ای داره 🔐 لطفاً کد رو همینجا بفرست.",
        "needs_tr_region": f"باید ریجن اکانتت ترکیه باشه 🇹🇷",
        "invalid_info": f"اطلاعات اکانتت اشتباهه ❌ لطفاً ایمیل و رمز صحیح رو بفرست.",
        "paid": f"پرداختت تایید شده و رفته توی صف انجام 🛍️",
        "registered": f"ثبت شده و منتظر انجام هست.",
        "pending": f"هنوز تایید پرداخت نشده. اگه مبلغ کم شده ۱۰ دقیقه دیگه چک کن.",
        "canceled": f"لغو شده.",
        "refunded": f"مبلغش برگشت خورده.",
    }
    
    action = action_map.get(status, f"وضعیت فعلی: {status_fa}")
    
    return f"{base}.\n{action}".strip()

# --- 1. CONFIGURATION & CREDENTIALS ---
API_ID = 23078041
API_HASH = 'b2c8461fa3cfce1a201aeb9257e1996e'
SESSION_NAME = 'arshia_session'
SESSION_DB_BUSY_TIMEOUT = 20.0  # seconds to wait for sqlite locks
SQLITE_BUSY_RETRY_ATTEMPTS = 5
SQLITE_BUSY_RETRY_DELAY = 0.2

class BusySQLiteSession(SQLiteSession):
    """Extend the default session to add a longer busy timeout."""

    def __init__(self, session_id=None, timeout=SESSION_DB_BUSY_TIMEOUT):
        self._busy_timeout = timeout
        self._pragma_applied = False
        super().__init__(session_id)

    def _cursor(self):
        if self._conn is None:
            self._conn = sqlite3.connect(
                self.filename,
                check_same_thread=False,
                timeout=self._busy_timeout,
            )
            self._apply_sqlite_pragmas()
        elif not self._pragma_applied:
            self._apply_sqlite_pragmas()
        return self._conn.cursor()

    def _apply_sqlite_pragmas(self):
        try:
            self._conn.execute("PRAGMA journal_mode=WAL;")
            self._conn.execute("PRAGMA synchronous=NORMAL;")
            self._conn.execute(f"PRAGMA busy_timeout={int(self._busy_timeout * 1000)};")
            self._pragma_applied = True
        except Exception:
            self._pragma_applied = False

    def _execute(self, stmt, *values):
        delay = SQLITE_BUSY_RETRY_DELAY
        for attempt in range(SQLITE_BUSY_RETRY_ATTEMPTS):
            try:
                return super()._execute(stmt, *values)
            except sqlite3.OperationalError as e:
                if "database is locked" not in str(e).lower():
                    raise
                if attempt >= SQLITE_BUSY_RETRY_ATTEMPTS - 1:
                    raise
                time.sleep(delay)
                delay = min(delay * 2, 1.0)

# OpenRouter / AI Config
OPENROUTER_API_KEY = "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"
MODEL_NAME = "google/gemini-3-flash-preview"  # main chat model for JinxFamily bot
MODEL_ROUTER = "xiaomi/mimo-v2-flash:free"
MODEL_GENERATOR = "google/gemini-3-flash-preview"
APP_NAME = "JinxFamily AI"
SITE_URL = "https://jinxfamily.shop"
MAX_IMAGE_DIMENSION = 1024



# --- LOGGING CONFIGURATION ---
LOG_DIR = "logs"
ERROR_LOG_FILE = os.path.join(LOG_DIR, "my_userbot_errors.log")
os.makedirs(LOG_DIR, exist_ok=True)

logger = logging.getLogger("jinxfamily_bot")
logger.setLevel(logging.INFO)
if not logger.handlers:
    file_handler = RotatingFileHandler(
        ERROR_LOG_FILE,
        maxBytes=1_500_000,
        backupCount=3,
        encoding="utf-8",
    )
    file_handler.setFormatter(logging.Formatter("%(asctime)s [%(levelname)s] %(message)s"))
    logger.addHandler(file_handler)
logger.propagate = False

# --- 2. MEMORY SYSTEM (Storage & Fetch) ---
MEMORY_FILE = "arshia_memory.json"
MAX_HISTORY = 20 
MAX_HISTORY_CONTENT_CHARS = 600
CHAT_LOG_DIR = os.path.join("logs", "chat_logs")
CHAT_LOG_FILE = os.path.join(CHAT_LOG_DIR, "arshia_chat_logs.jsonl")
LLM_LOG_FILE = os.path.join(CHAT_LOG_DIR, "llm_requests.jsonl")
PROFILE_FILE = "arshia_user_profiles.json"
PENDING_TTL_SECONDS = 600
TRACE_LOG_FILE = os.path.join(CHAT_LOG_DIR, "debug_trace.jsonl")
ENABLE_DEBUG_TRACE = True
ENABLE_INTERNAL_MEDIA_TRACE = True
TRACE_INCLUDE_SYSTEM_PROMPT = False
PENDING_UPDATE_TTL_SECONDS = 600
MAX_TRACKING_RETRIES = 3
# Human review routing (Telegram channel/group)
HUMAN_REVIEW_CHAT = os.getenv("HUMAN_REVIEW_CHAT", "https://t.me/+Hvu6b8uPIJc3N2Q0")
HUMAN_REVIEW_ETA = os.getenv("HUMAN_REVIEW_ETA", "۱۵ تا ۳۰ دقیقه")
ESCALATION_COOLDOWN_SECONDS = 600
HUMAN_REQUEST_RESET_SECONDS = 900
HUMAN_SILENCE_DURATION = 1800  # ۳۰ دقیقه سکوت بعد از ارجاع به انسان
# کاربرانی که نباید با پیام انسانی/ارجاع در سکوت قرار بگیرند
BYPASS_SILENCE_USERS = {"7891675319"}  # @PedDevIR

# Anti-spam / rate limiting
SPAM_WINDOW_SECONDS = 30
SPAM_MAX_MESSAGES = 10
SPAM_COOLDOWN_SECONDS = 300
SPAM_WARN_COOLDOWN_SECONDS = 60
PENDING_ACCESS_TTL_SECONDS = 600
VERIFIED_ORDER_ACCESS_TTL_SECONDS = 900  # keep verified order access for follow-ups (seconds)

# Escalation detection keywords (Persian/English mix)
HUMAN_REQUEST_KEYWORDS = (
    "پشتیبان انسانی",
    "ادمین",
    "مدیر",
    "اپراتور",
    "کارشناس",
    "پشتیبان واقعی",
    "انسانی",
)
REFUND_KEYWORDS = (
    "ریفاند",
    "بازگشت وجه",
    "برگشت پول",
    "استرداد",
    "مسترد",
    "کنسل",
    "لغو",
    "پس گرفتن پول",
)
COMPLAINT_KEYWORDS = (
    "شکایت",
    "کلاهبرداری",
    "کلاهبردار",
    "دادگاه",
    "پلیس",
    "تعزیرات",
    "اینماد",
    "نماد اعتماد",
    "زرین پال",
    "زرین‌پال",
    "zarinpal",
)
SECURITY_KEYWORDS = (
    "بن",
    "banned",
    "ban",
    "هک",
    "هک شد",
    "نفوذ",
    "دزدیده",
    "سرقت",
    "scam",
)
SELF_HARM_KEYWORDS = (
    "خودکشی",
    "خودمو بکشم",
    "خودمو میکشم",
    "خودم را بکشم",
    "خودم را میکشم",
    "خودم رو بکشم",
    "خودم رو میکشم",
)

# Greeting throttling / sanitization helpers
GREET_KEYWORDS = ("سلام", "درود", "خسته نباشید", "hi", "hey")
GREET_PREFIXES = ("سلام", "سلام وقتتون بخیر", "درود", "درود وقت بخیر")
# حذف ایموجی‌ها از پاسخ‌های خروجی (طبق سیاست لحن رسمی)
EMOJI_REGEX = re.compile(
    "["
    "\U0001F1E6-\U0001F1FF"  # flags
    "\U0001F300-\U0001FAFF"  # symbols & pictographs
    "\U00002600-\U000026FF"  # misc symbols
    "\U00002700-\U000027BF"  # dingbats
    "\u200d"                 # zero-width joiner
    "\uFE0F"                 # variation selector-16
    "]+"
)
JINXFAMILY_DOMAIN_REGEX = re.compile(r"(?i)(?:https?://)?(?:www\.)?jinxfamily\s*(?:\.|\s)\s*ir")
REFUSAL_KEYWORDS = (
    "متاسفانه نمی توانم کمک کنم",
    "متأسفانه نمی توانم کمک کنم",
    "متاسفانه نمیتوانم کمک کنم",
    "متأسفانه نمیتوانم کمک کنم",
    "نمی توانم کمک",
    "نمی تونم کمک",
    "cannot help",
    "can not help",
    "unable to help",
)
AVAILABILITY_KEYWORDS = (
    "موجود",
    "ناموجود",
    "شارژ",
    "تمام شد",
    "تموم شد",
    "کی موجود",
    "کی شارژ",
)

EMAIL_REGEX = re.compile(r"(?i)\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b")
MOBILE_REGEX = re.compile(r"\b(?:\+?98|0)?9\d{9}\b")
PASSWORD_LIKE_REGEX = re.compile(r"(?i)\b(password|pass|پسورد|رمز)\b\s*[:：]?\s*\S+")
TWO_FA_HINT_REGEX = re.compile(r"(?i)\b2fa\b|دو\s*مرحله|تأیید\s*دو\s*مرحله|تا\s*یید\s*دو\s*مرحله")

def redact_sensitive(text: str) -> str:
    """Redact obvious sensitive tokens before persisting/sending to LLM."""
    if not text:
        return text
    redacted = EMAIL_REGEX.sub("<EMAIL>", text)
    redacted = PASSWORD_LIKE_REGEX.sub(lambda m: f"{m.group(1)}: <REDACTED>", redacted)
    redacted = MOBILE_REGEX.sub(lambda m: f"***{m.group(0)[-4:]}", redacted)
    if TWO_FA_HINT_REGEX.search(redacted):
        redacted = re.sub(r"\b\d{6}\b", "<CODE>", redacted)
    return redacted

def detect_platform(text: str) -> str | None:
    lowered = (text or "").lower().replace("‌", " ")
    if any(k in lowered for k in ("xbox", "ایکس باکس", "اکس باکس", "ایکس‌باکس", "اکس‌باکس")):
        return "Xbox"
    if any(k in lowered for k in ("ps", "پلی استیشن", "پلی‌استیشن", "پلی‌استیشن", "پلیستیشن")):
        return "PlayStation"
    if any(k in lowered for k in ("pc", "پیسی", "کامپیوتر", "رایانه", "لپتاپ")):
        return "PC"
    if any(k in lowered for k in ("switch", "نینتندو", "سوییچ")):
        return "Nintendo Switch"
    return None

def is_twofa_disabled_message(text: str) -> bool:
    t = normalize_digits_to_ascii(text or "").lower().replace("‌", " ")
    if not t:
        return False
    if not TWO_FA_HINT_REGEX.search(t):
        return False
    disable_words = ("خاموش", "غیرفعال", "برداشتم", "برداشته", "disable", "off", "turn off")
    return any(word in t for word in disable_words)

def load_memory():
    if os.path.exists(MEMORY_FILE):
        try:
            with open(MEMORY_FILE, 'r', encoding='utf-8') as f:
                return json.load(f)
        except:
            return {}
    return {}

def load_profiles():
    if os.path.exists(PROFILE_FILE):
        try:
            with open(PROFILE_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)
                return data if isinstance(data, dict) else {}
        except Exception:
            return {}
    return {}

def save_memory(history_data):
    try:
        with open(MEMORY_FILE, 'w', encoding='utf-8') as f:
            json.dump(dict(history_data), f, ensure_ascii=False, indent=2)
    except Exception as e:
        logger.exception("Error saving memory")

def save_profiles(profile_data: dict):
    try:
        with open(PROFILE_FILE, "w", encoding="utf-8") as f:
            json.dump(profile_data, f, ensure_ascii=False, indent=2)
    except Exception:
        logger.exception("Error saving profiles")

def log_chat_event(user_id: str, direction: str, text: str, meta=None):
    """Append a single chat event to a JSONL log for later analysis."""
    from datetime import datetime, timezone, timedelta
    tehran_tz = timezone(timedelta(hours=3, minutes=30))
    now_tehran = datetime.now(tehran_tz)
    entry = {
        "timestamp": now_tehran.strftime("%Y-%m-%dT%H:%M:%S+03:30"),
        "user_id": user_id,
        "memory_key": user_id,
        "direction": direction,  # 'user', 'assistant', or 'system'
        "text": text,
    }
    if meta:
        entry.update(meta)
    try:
        os.makedirs(CHAT_LOG_DIR, exist_ok=True)
        with open(CHAT_LOG_FILE, "a", encoding="utf-8") as f:
            json.dump(entry, f, ensure_ascii=False)
            f.write("\n")
    except Exception as e:
        logger.exception("Error writing chat log")

def log_llm_request(
    payload: dict,
    response=None,
    error: str | None = None,
    user_id: str | None = None,
    user_profile: dict | None = None,
    memory_key: str | None = None,
):
    """Log full OpenRouter request/response for offline comparison, tagged by user/memory."""
    from datetime import datetime, timezone, timedelta
    tehran_tz = timezone(timedelta(hours=3, minutes=30))
    now_tehran = datetime.now(tehran_tz)
    entry = {
        "timestamp": now_tehran.strftime("%Y-%m-%dT%H:%M:%S+03:30"),
        "user_id": user_id,
        "memory_key": memory_key or user_id,
        "request": payload,
    }
    if user_profile:
        entry["user_profile"] = user_profile
    try:
        if response is not None:
            if hasattr(response, "model_dump"):
                entry["response"] = response.model_dump()
            elif hasattr(response, "to_dict"):
                entry["response"] = response.to_dict()
            else:
                entry["response"] = str(response)
    except Exception as e:
        entry["response"] = f"<serialization_error: {e}>"
    if error:
        entry["error"] = error
    try:
        os.makedirs(CHAT_LOG_DIR, exist_ok=True)
        with open(LLM_LOG_FILE, "a", encoding="utf-8") as f:
            json.dump(entry, f, ensure_ascii=False, default=str)
            f.write("\n")
    except Exception as e:
        logger.exception("Error writing LLM log")

def log_debug_trace(entry: dict):
    """Append a structured debug trace event for internal analysis."""
    from datetime import datetime, timezone, timedelta
    tehran_tz = timezone(timedelta(hours=3, minutes=30))
    now_tehran = datetime.now(tehran_tz)
    payload = {"timestamp": now_tehran.strftime("%Y-%m-%dT%H:%M:%S+03:30")}
    payload.update(entry or {})
    try:
        os.makedirs(CHAT_LOG_DIR, exist_ok=True)
        with open(TRACE_LOG_FILE, "a", encoding="utf-8") as f:
            json.dump(payload, f, ensure_ascii=False, default=str)
            f.write("\n")
    except Exception:
        logger.exception("Error writing debug trace log")

def is_greeting(text: str) -> bool:
    lowered = text.strip().lower()
    return any(key in lowered for key in GREET_KEYWORDS)

def strip_leading_greeting(text: str) -> str:
    for prefix in GREET_PREFIXES:
        if text.startswith(prefix):
            return text[len(prefix):].lstrip()
    return text

def normalize_style(text: str) -> str:
    """Normalize for storage/sending (remove internal notes, unify brand naming)."""
    if not text:
        return text
    # drop internal note part if present (only for internal history / AI, نه پیام کاربر)
    if "\n(یادداشت:" in text:
        text = text.split("\n(یادداشت:")[0].rstrip()
    # rename old persona name to brand
    text = text.replace("عرشیا", "جینکس فمیلی")
    text = text.replace("Arshia", "جینکس فمیلی")
    text = re.sub(r"[ ]{2,}", " ", text).strip()
    return text

def apply_assistant_tone_rules(text: str) -> str:
    """Light touch to avoid breaking natural wording."""
    if not text:
        return text
    return re.sub(r"[ ]{2,}", " ", text).strip()

def strip_emojis(text: str) -> str:
    if not text:
        return text
    return EMOJI_REGEX.sub("", text)

def normalize_jinxfamily_links(text: str) -> str:
    if not text:
        return text
    return JINXFAMILY_DOMAIN_REGEX.sub(SITE_URL, text)

def sanitize_reply(text: str) -> str:
    cleaned = strip_emojis(text)
    cleaned = normalize_jinxfamily_links(cleaned)
    cleaned = re.sub(r"[ ]{2,}", " ", cleaned).strip()
    cleaned = re.sub(r"\n{3,}", "\n\n", cleaned).strip()
    return cleaned

def trim_reply(text: str) -> str:
    """Light post-processing on replies (whitespace only)."""
    if not isinstance(text, str):
        return text
    return text.strip()

def is_refusal(text: str) -> bool:
    lowered = text.lower()
    return any(key in lowered for key in REFUSAL_KEYWORDS)

def normalize_history_style(history_data):
    """Normalize stored history texts to new style constraints."""
    if not isinstance(history_data, dict):
        return {}
    for uid, msgs in history_data.items():
        if not isinstance(msgs, list):
            continue
        cleaned = []
        for item in msgs:
            if not isinstance(item, dict):
                continue
            role = item.get("role") or "user"
            content = item.get("content", "")
            normalized = normalize_style(content)
            normalized = redact_sensitive(normalized)
            if role == "assistant":
                normalized = apply_assistant_tone_rules(normalized)
                normalized = sanitize_reply(normalized)
            item["role"] = role
            item["content"] = normalized.strip()
            cleaned.append({"role": item["role"], "content": item["content"]})
        history_data[uid] = cleaned[-(MAX_HISTORY + 5):]
    return history_data

# Load existing memory on startup
_loaded_histories = normalize_history_style(load_memory())
user_profiles = load_profiles()

HISTORY_CACHE_MAXSIZE = 1000
HISTORY_CACHE_TTL_SECONDS = 12 * 60 * 60
STATE_CACHE_MAXSIZE = 1000
STATE_CACHE_TTL_SECONDS = 12 * 60 * 60

if TTLCache:
    user_histories = TTLCache(maxsize=HISTORY_CACHE_MAXSIZE, ttl=HISTORY_CACHE_TTL_SECONDS)
    user_histories.update(_loaded_histories)
    user_state = TTLCache(maxsize=STATE_CACHE_MAXSIZE, ttl=STATE_CACHE_TTL_SECONDS)
else:
    user_histories = _loaded_histories
    user_state = {}

def normalize_for_history(role: str, content: str) -> str:
    text = normalize_style(content or "")
    text = redact_sensitive(text)
    if role == "assistant":
        text = apply_assistant_tone_rules(text)
        text = sanitize_reply(text)
    return text.strip()

async def detect_user_intent(user_text: str) -> str:
    """Route user intent using a lightweight model."""
    if not user_text or len(user_text.strip()) < 2:
        return "CHIT_CHAT"

    router_prompt = """
Classify the user's Persian message into exactly ONE of these categories:
TRACKING_QUERY
PRODUCT_QUERY
ACCOUNT_ISSUE
PAYMENT_ISSUE
HUMAN_REQUEST
CHIT_CHAT

User Message: "{text}"

Reply ONLY with the category name.
"""
    try:
        response = ai_client.chat.completions.create(
            model=MODEL_ROUTER,
            messages=[{"role": "user", "content": router_prompt.format(text=user_text)}],
            temperature=0.0,
            max_tokens=10,
        )
        intent = (response.choices[0].message.content or "").strip().upper()
        for valid in ("TRACKING_QUERY", "PRODUCT_QUERY", "ACCOUNT_ISSUE", "PAYMENT_ISSUE", "HUMAN_REQUEST", "CHIT_CHAT"):
            if valid in intent:
                return valid
        return "CHIT_CHAT"
    except Exception as e:
        logger.exception("Router error: %s", e)
        return "CHIT_CHAT"

def _is_similar_text(a: str, b: str, threshold: float = 0.92) -> bool:
    if not a or not b:
        return False
    if a == b:
        return True
    if len(a) < 12 or len(b) < 12:
        return False
    return difflib.SequenceMatcher(a=a, b=b).ratio() >= threshold

def append_to_history(user_id: str, role: str, content: str, has_media: bool = False, media_label: str | None = None):
    """Append a message to per-user memory with safety redaction and trimming."""
    if not content and not has_media:
        return
    history = user_histories.setdefault(user_id, [])
    normalized = normalize_for_history(role, content) if content else ""
    if has_media:
        label = media_label or "رسانه ارسال شد"
        if normalized:
            normalized = f"{normalized}\n[{label}]"
        else:
            normalized = f"[{label}]"
    if normalized and len(normalized) > MAX_HISTORY_CONTENT_CHARS:
        normalized = normalized[:MAX_HISTORY_CONTENT_CHARS].rstrip() + "..."
    if not normalized:
        return
    # جلوگیری از تکرار پشت‌سرهم
    if history and history[-1].get("role") == role:
        last_content = history[-1].get("content") or ""
        if _is_similar_text(last_content, normalized):
            return
    history.append({"role": role, "content": normalized})
    if len(history) > MAX_HISTORY + 5:
        user_histories[user_id] = history[-(MAX_HISTORY + 5):]

def update_user_profile(user_id: str, sender=None, text: str | None = None, tracking_code: str | None = None, product_query: str | None = None):
    profile = user_profiles.setdefault(user_id, {})
    profile["last_seen_ts"] = int(time.time())
    if sender is not None:
        name = (getattr(sender, "first_name", "") or "").strip()
        username = getattr(sender, "username", None)
        if name:
            profile["name"] = name
        if username:
            profile["username"] = username
    if tracking_code:
        profile["last_tracking_code"] = tracking_code
    if product_query:
        profile["last_product_query"] = product_query[:80]
    if text:
        platform = detect_platform(text)
        if platform:
            profile["platform"] = platform

def build_profile_hint(user_id: str) -> str | None:
    profile = user_profiles.get(user_id) or {}
    bits = []
    if profile.get("name"):
        bits.append(f"- نام: {profile['name']}")
    if profile.get("username"):
        bits.append(f"- نام کاربری تلگرام: @{profile['username']}")
    if profile.get("platform"):
        bits.append(f"- پلتفرم: {profile['platform']}")
    if profile.get("last_tracking_code"):
        bits.append(f"- آخرین کد پیگیری مشاهده‌شده: {profile['last_tracking_code']}")
    if profile.get("last_product_query"):
        bits.append(f"- آخرین محصول/درخواست: {profile['last_product_query']}")
    if not bits:
        return None
    return "اطلاعات شناخته‌شده از این مشتری (در صورت مرتبط بودن استفاده شود):\n" + "\n".join(bits)

def get_user_state(user_id: str) -> dict:
    state = user_state.setdefault(
        user_id,
        {
            "last_greet": 0.0,
            "pending": {},
            "pending_update": {},
            "human_request_count": 0,
            "last_human_request_ts": 0.0,
            "last_escalation_ts": 0.0,
            "silence_until": 0.0,
            "msg_times": [],
            "spam_until": 0.0,
            "spam_warned_at": 0.0,
            "verified_orders": {},
        },
    )
    if "pending" not in state:
        state["pending"] = {}
    if "pending_update" not in state:
        state["pending_update"] = {}
    if "human_request_count" not in state:
        state["human_request_count"] = 0
    if "last_human_request_ts" not in state:
        state["last_human_request_ts"] = 0.0
    if "last_escalation_ts" not in state:
        state["last_escalation_ts"] = 0.0
    if "silence_until" not in state:
        state["silence_until"] = 0.0
    if "msg_times" not in state:
        state["msg_times"] = []
    if "spam_until" not in state:
        state["spam_until"] = 0.0
    if "spam_warned_at" not in state:
        state["spam_warned_at"] = 0.0
    if "pending_access" not in state:
        state["pending_access"] = {}
    if "verified_orders" not in state:
        state["verified_orders"] = {}
    return state

def is_user_silenced(user_id: str) -> bool:
    """آیا کاربر در حالت سکوت (انتظار برای انسان) است؟"""
    if str(user_id) in BYPASS_SILENCE_USERS:
        return False
    state = get_user_state(user_id)
    silence_until = float(state.get("silence_until") or 0.0)
    return time.time() < silence_until

def activate_silence(user_id: str, duration: float = HUMAN_SILENCE_DURATION):
    """فعال کردن سکوت پس از ارجاع به انسان یا پاسخ ادمین."""
    if str(user_id) in BYPASS_SILENCE_USERS:
        return 0.0
    state = get_user_state(user_id)
    state["silence_until"] = time.time() + float(duration)
    return state["silence_until"]

def deactivate_silence(user_id: str):
    """لغو سکوت در صورت درخواست مستقیم از بات."""
    state = get_user_state(user_id)
    state["silence_until"] = 0.0
    return state["silence_until"]

def spam_guard_hit(user_id: str) -> tuple[bool, bool]:
    """
    Returns (is_blocked, should_warn_now).
    Updates per-user state msg_times/spam_until.
    """
    state = get_user_state(user_id)
    now = time.time()
    spam_until = float(state.get("spam_until") or 0.0)
    if now < spam_until:
        warned_at = float(state.get("spam_warned_at") or 0.0)
        return True, (now - warned_at) > SPAM_WARN_COOLDOWN_SECONDS

    times = [float(t) for t in (state.get("msg_times") or []) if (now - float(t)) <= SPAM_WINDOW_SECONDS]
    times.append(now)
    state["msg_times"] = times[-50:]

    if len(times) > SPAM_MAX_MESSAGES:
        state["spam_until"] = now + SPAM_COOLDOWN_SECONDS
        warned_at = float(state.get("spam_warned_at") or 0.0)
        return True, (now - warned_at) > SPAM_WARN_COOLDOWN_SECONDS

    return False, False

def remember_pending_order_access(state: dict, tracking_code: str) -> dict:
    pending_access = {
        "type": "verify_order_access",
        "tracking_code": normalize_tracking_code(tracking_code),
        "ts": time.time(),
    }
    state["pending_access"] = pending_access
    return pending_access

def get_pending_order_access(state: dict) -> dict | None:
    pending_access = state.get("pending_access") or {}
    if pending_access.get("type") == "verify_order_access":
        ts = float(pending_access.get("ts") or 0.0)
        if time.time() - ts <= PENDING_ACCESS_TTL_SECONDS:
            return pending_access
    return None

def clear_pending_order_access(state: dict):
    state["pending_access"] = {}

def remember_verified_order_access(state: dict, tracking_code: str, identity: dict | None = None) -> dict:
    """Cache that this user has verified access to an order for a short time (avoid re-asking identity)."""
    verified_orders = state.get("verified_orders") or {}
    code = normalize_tracking_code(tracking_code)
    safe_identity = {}
    if isinstance(identity, dict):
        for k in ("last4", "email", "phone", "name"):
            v = identity.get(k)
            if v:
                safe_identity[k] = v
    verified_orders[code] = {
        "tracking_code": code,
        "ts": time.time(),
        "until": time.time() + VERIFIED_ORDER_ACCESS_TTL_SECONDS,
        "identity": safe_identity,
    }
    state["verified_orders"] = verified_orders
    return verified_orders[code]

def get_cached_verified_order_identity(state: dict, tracking_code: str) -> dict | None:
    """Return cached identity dict if verification is still valid; otherwise None."""
    verified_orders = state.get("verified_orders") or {}
    code = normalize_tracking_code(tracking_code)
    entry = verified_orders.get(code)
    if not isinstance(entry, dict):
        return None
    until = float(entry.get("until") or 0.0)
    if time.time() >= until:
        verified_orders.pop(code, None)
        state["verified_orders"] = verified_orders
        return None
    # Sliding TTL while the conversation continues
    entry["until"] = time.time() + VERIFIED_ORDER_ACCESS_TTL_SECONDS
    verified_orders[code] = entry
    state["verified_orders"] = verified_orders
    ident = entry.get("identity")
    return ident if isinstance(ident, dict) else {}

@sync_to_async
def verify_order_access_and_fetch(
    tracking_code: str,
    telegram_username: str | None,
    identity: dict,
) -> dict:
    """
    Verify order ownership and return serialized order data if allowed.
    Security policy:
      - Telegram handle match (when order.telegram is set) OR
      - phone match (full phone or last4) OR
      - (name match AND email match)
    Email alone is NOT sufficient.
    """
    tracking_code = normalize_tracking_code(tracking_code)
    try:
        close_old_connections()
        order = (
            Order.objects.select_related("user")
            .prefetch_related("items__product")
            .get(tracking_code=tracking_code)
        )
    except Order.DoesNotExist:
        return {"ok": False, "reason": "not_found", "tracking_code": tracking_code}
    except Exception:
        logger.exception("Order lookup failed for access verification: %s", tracking_code)
        return {"ok": False, "reason": "db_error", "tracking_code": tracking_code}

    sender_handle = _normalize_tg_handle(telegram_username)
    order_handle = _normalize_tg_handle(order.telegram)

    id_email = (identity or {}).get("email")
    id_phone = (identity or {}).get("phone")
    id_name = (identity or {}).get("name")
    id_last4 = (identity or {}).get("last4")

    phone_last4 = _extract_phone_last4(order.phone)
    v_last4 = normalize_digits_to_ascii(str(id_last4 or "")).strip()
    last4_match = bool(v_last4 and phone_last4 and v_last4 == phone_last4)

    v_phone = _normalize_phone_for_order(id_phone)
    o_phone = _normalize_phone_for_order(order.phone)
    phone_match = bool(v_phone and o_phone and (_extract_phone_last4(v_phone) == _extract_phone_last4(o_phone)))

    v_email = (id_email or "").strip().lower()
    email_candidates = set()
    if (order.epic_username or "").strip():
        email_candidates.add((order.epic_username or "").strip().lower())
    try:
        if getattr(order, "user", None) and (order.user.email or "").strip():
            email_candidates.add((order.user.email or "").strip().lower())
    except Exception:
        pass
    email_match = bool(v_email and v_email in email_candidates)

    name_match = False
    try:
        full = ""
        if getattr(order, "user", None):
            full = (order.user.get_full_name() or "").strip()
        v_name = re.sub(r"\s+", " ", (id_name or "").strip()).lower()
        o_name = re.sub(r"\s+", " ", full).lower()
        name_match = bool(v_name and o_name and v_name == o_name)
    except Exception:
        name_match = False

    handle_match = bool(sender_handle and order_handle and sender_handle == order_handle)

    authorized = False
    if handle_match:
        authorized = True
    elif last4_match or phone_match:
        authorized = True
    elif name_match and email_match:
        authorized = True

    if not authorized:
        provided_any = bool(v_last4 or v_phone or v_email or (id_name or "").strip())
        return {"ok": False, "reason": "invalid_identity" if provided_any else "need_identity", "tracking_code": tracking_code}

    # bind telegram handle for future if empty (doesn't weaken security because it's after verification)
    if sender_handle and not (order.telegram or "").strip():
        try:
            order.telegram = f"@{sender_handle}"
            order.save(update_fields=["telegram"])
            try:
                OrderBotUpdate.objects.create(
                    order=order,
                    source="telegram",
                    telegram_user_id="",
                    telegram_username=f"@{sender_handle}",
                    source_message_id="",
                    fields_changed=["telegram"],
                    summary="AUTO-BIND ✅ (telegram)",
                )
            except Exception:
                pass
        except Exception:
            logger.exception("Failed to bind telegram handle to order %s", tracking_code)

    items = [f"• {item.name} ({item.quantity}x)" for item in order.items.all()]
    return {
        "ok": True,
        "order_data": {
            "found": True,
            "tracking_code": order.tracking_code,
            "status": order.status,
            "status_fa": STATUS_FA.get(order.status, order.status),
            "epic_username": order.epic_username,
            "phone": order.phone[-4:] if order.phone else "",
            "amount": f"{order.amount:,}",
            "items": items,
            "rush_order": order.rush_order,
            "created_at": order.created_at.strftime("%Y/%m/%d %H:%M"),
            "created_at_raw": order.created_at,
            "completed_at": order.completed_at.strftime("%Y/%m/%d %H:%M") if order.completed_at else None,
        },
        "tracking_code": tracking_code,
    }

@sync_to_async
def get_site_setting_value(key: str, default: str = "") -> str:
    try:
        close_old_connections()
        row = SiteSetting.objects.filter(key=key).values_list("value_text", flat=True).first()
        return (row or default or "").strip()
    except Exception:
        logger.exception("Failed to read SiteSetting %s", key)
        return (default or "").strip()

async def get_rush_capacity_snapshot() -> dict:
    """
    Rush capacity is controlled via SiteSetting:
      - rush_enabled: "1"/"0" (default 1)
      - rush_daily_capacity: integer (default 9999)
    """
    enabled_raw = await get_site_setting_value("rush_enabled", "1")
    cap_raw = await get_site_setting_value("rush_daily_capacity", "9999")
    enabled = enabled_raw.strip().lower() not in ("0", "false", "no", "off")
    try:
        capacity = max(int(cap_raw), 0)
    except Exception:
        capacity = 9999

    from datetime import timedelta
    now = timezone.localtime(timezone.now())
    start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    end = start + timedelta(days=1)

    try:
        close_old_connections()
        used = (
            Order.objects.filter(rush_order=True, created_at__gte=start, created_at__lt=end)
            .exclude(status__in=["canceled", "refunded"])
            .count()
        )
    except Exception:
        logger.exception("Failed to compute rush usage")
        used = 0

    remaining = max(capacity - used, 0)
    return {"enabled": enabled, "capacity": capacity, "used": used, "remaining": remaining}

@sync_to_async
def search_products_any(query: str, limit: int = 5) -> list[dict]:
    """Search products including inactive ones (for availability checks)."""
    query = (query or "").strip()
    if not query:
        return []
    close_old_connections()
    products = Product.objects.filter(Q(name_fa__icontains=query) | Q(slug__icontains=query)).order_by("-id")[:limit]
    out = []
    for p in products:
        entry = _format_product_entry(p)
        entry["active"] = bool(getattr(p, "active", True))
        out.append(entry)
    return out

@sync_to_async
def find_products_any_in_text(text: str, limit: int = 5) -> list[dict]:
    """Free-text product matching including inactive products, sorted by relevance."""
    normalized = re.sub(r'[^\w\u0600-\u06FF\s-]', ' ', (text or "")).lower()
    terms = [t for t in normalized.split() if len(t) >= 3]
    if not terms:
        return []

    query = Q()
    for term in terms:
        query |= Q(name_fa__icontains=term) | Q(slug__icontains=term)
    
    close_old_connections()
    # Fetch more candidates (30) to sort by relevance in Python
    products = list(Product.objects.filter(query).distinct()[:30])

    def score_p(p):
        n_fa = (p.name_fa or "").lower()
        slug = (p.slug or "").lower().replace("-", " ")
        q_clean = normalized.strip()
        
        s1 = difflib.SequenceMatcher(None, q_clean, n_fa).ratio()
        s2 = difflib.SequenceMatcher(None, q_clean, slug).ratio()
        
        all_terms_hit = all((t in n_fa or t in slug) for t in terms)
        bonus = 0.2 if all_terms_hit else 0.0
        
        return max(s1, s2) + bonus

    products.sort(key=score_p, reverse=True)
    
    out = []
    for p in products[:limit]:
        entry = _format_product_entry(p)
        entry["active"] = bool(getattr(p, "active", True))
        out.append(entry)
    return out

def register_human_request(state: dict) -> int:
    now = time.time()
    last_ts = float(state.get("last_human_request_ts") or 0.0)
    if now - last_ts > HUMAN_REQUEST_RESET_SECONDS:
        state["human_request_count"] = 0
    state["human_request_count"] = int(state.get("human_request_count") or 0) + 1
    state["last_human_request_ts"] = now
    return state["human_request_count"]

def contains_any(text: str, keywords: tuple[str, ...]) -> bool:
    t = (text or "").lower()
    return any(k.lower() in t for k in keywords)

def reply_implies_human_review(reply: str) -> bool:
    t = (reply or "")
    return ("ارجاع" in t) or ("نیاز به بررسی" in t) or ("بررسی دستی" in t)

def assess_human_review_need(text: str, state: dict) -> dict | None:
    """Return escalation package {reason, help_needed, user_request_info} or None."""
    t = (text or "").strip()
    if not t:
        return None

    if contains_any(t, SELF_HARM_KEYWORDS):
        return {
            "reason": "موضوع ایمنی (اظهار تمایل به آسیب به خود)",
            "help_needed": "لطفاً یک همکار انسانی با لحن حمایتی پیگیری کند و در صورت تشخیص خطر فوری، توصیه تماس با ۱۱۵ یا ۱۲۳ را تکرار نماید.",
            "user_request_info": "در صورت امکان، لطفاً تأیید کنید آیا در حال حاضر در خطر فوری هستید یا خیر.",
            "user_reply": (
                "متأسفم که چنین فشاری را تجربه می‌کنید. "
                "من نمی‌توانم درباره روش‌های آسیب‌زدن به خود راهنمایی کنم.\n"
                "اگر در خطر فوری هستید، لطفاً همین حالا با اورژانس ۱۱۵ یا اورژانس اجتماعی ۱۲۳ تماس بگیرید. "
                "همچنین اگر امکان دارد، همین الان با یک فرد قابل اعتماد (یکی از نزدیکان) صحبت کنید.\n"
                "این گفتگو برای پیگیری انسانی نیز ارجاع شد. "
                "در صورت تمایل، می‌توانید کوتاه بفرمایید چه اتفاقی افتاده است."
            ),
        }

    if contains_any(t, REFUND_KEYWORDS):
        return {
            "reason": "درخواست بازگشت وجه/استرداد",
            "help_needed": "بررسی وضعیت سفارش و امکان استرداد وجه، سپس پاسخ‌گویی رسمی به مشتری.",
            "user_request_info": "لطفاً کد پیگیری سفارش و تصویر رسید پرداخت را ارسال نمایید.",
        }

    if contains_any(t, COMPLAINT_KEYWORDS):
        return {
            "reason": "شکایت/تهدید به پیگیری رسمی",
            "help_needed": "پاسخ‌گویی رسمی و مدیریت نارضایتی مشتری با بررسی وضعیت سفارش/پرداخت.",
            "user_request_info": "لطفاً کد پیگیری سفارش یا تصویر رسید/خطا را ارسال نمایید.",
        }

    if contains_any(t, SECURITY_KEYWORDS):
        return {
            "reason": "موضوع امنیتی/بن شدن اکانت",
            "help_needed": "بررسی دقیق مورد (بن/هک/خطا) و ارائه راهنمایی تخصصی یا پیگیری دستی.",
            "user_request_info": "لطفاً اسکرین‌شات خطا/بن و کد پیگیری (در صورت وجود) را ارسال نمایید.",
        }

    if contains_any(t, HUMAN_REQUEST_KEYWORDS):
        count = register_human_request(state)
        if count >= 2:
            return {
                "reason": "درخواست پشتیبان انسانی (تکرار شده)",
                "help_needed": "ورود پشتیبان انسانی به گفتگو و پیگیری مورد.",
                "user_request_info": "لطفاً موضوع دقیق و در صورت وجود کد پیگیری/اسکرین‌شات را ارسال نمایید.",
            }

    return None

INVITE_HASH_REGEX = re.compile(r"(?:t\.me/(?:\+|joinchat/))([A-Za-z0-9_-]+)")
_human_review_entity = None
_human_review_lock = asyncio.Lock()

def _extract_invite_hash(link: str) -> str | None:
    m = INVITE_HASH_REGEX.search(link or "")
    return m.group(1) if m else None

async def get_human_review_entity():
    global _human_review_entity
    if _human_review_entity is not None:
        return _human_review_entity
    async with _human_review_lock:
        if _human_review_entity is not None:
            return _human_review_entity
        target = (HUMAN_REVIEW_CHAT or "").strip()
        if not target:
            _human_review_entity = None
            return None
        try:
            _human_review_entity = await client.get_entity(target)
            return _human_review_entity
        except Exception:
            pass

        invite_hash = _extract_invite_hash(target)
        if invite_hash:
            try:
                from telethon.tl.functions.messages import ImportChatInviteRequest
                result = await client(ImportChatInviteRequest(invite_hash))
                chat = getattr(result, "chat", None)
                if chat is not None:
                    _human_review_entity = chat
                    return _human_review_entity
                chats = getattr(result, "chats", None) or []
                if chats:
                    _human_review_entity = chats[0]
                    return _human_review_entity
            except Exception:
                logger.exception("Failed to import/join human review chat via invite link")

        try:
            _human_review_entity = await client.get_entity(target)
            return _human_review_entity
        except Exception:
            logger.exception("Failed to resolve human review chat entity")
            _human_review_entity = None
            return None

def build_human_review_summary(user_id: str, sender, reason: str, help_needed: str, combined_text: str) -> str:
    name = (getattr(sender, "first_name", "") or "").strip()
    username = getattr(sender, "username", None)
    profile = user_profiles.get(user_id) or {}

    lines = [
        "ارجاع به پشتیبانی",
        f"شناسه: {user_id}",
        f"لینک: tg://user?id={user_id}",
    ]
    if name:
        lines.append(f"نام: {name}")
    if username:
        lines.append(f"یوزرنیم: @{username}")
    if profile.get("platform"):
        lines.append(f"پلتفرم: {profile['platform']}")
    if profile.get("last_tracking_code"):
        lines.append(f"آخرین کد پیگیری: {profile['last_tracking_code']}")

    lines.append(f"دلیل: {reason}")
    if help_needed:
        lines.append(f"اقدام مورد نیاز: {help_needed}")

    safe_text = redact_sensitive(combined_text or "").strip()
    if safe_text:
        if len(safe_text) > 600:
            safe_text = safe_text[:600] + "…"
        lines.append(f"آخرین پیام مشتری: {safe_text}")

    history = user_histories.get(user_id) or []
    snippet = history[-4:]
    if snippet:
        lines.append("آخرین پیام‌ها:")
        for msg in snippet:
            role = msg.get("role")
            label = "مشتری" if role == "user" else "بات"
            content = msg.get("content", "")
            if content:
                if len(content) > 220:
                    content = content[:220] + "…"
                lines.append(f"{label}: {content}")

    out = "\n".join([l for l in lines if l]).strip()
    # Telegram text limit safety
    if len(out) > 2000:
        out = out[:2000] + "\n…"
    return out

async def send_human_review_report(events_to_forward: list, summary_text: str):
    """Send a summary + forward selected events to the human review channel."""
    entity = await get_human_review_entity()
    if entity is None:
        logger.error("Human review chat is not available; falling back to Saved Messages.")
        try:
            await client.send_message("me", summary_text)
        except Exception:
            logger.exception("Failed to send fallback summary to Saved Messages")
        for ev in (events_to_forward or []):
            if ev is None:
                continue
            try:
                await ev.forward_to("me")
            except Exception:
                logger.exception("Failed to forward event to Saved Messages fallback")
        return

    try:
        await client.send_message(entity, summary_text)
    except Exception:
        logger.exception("Failed to send summary to human review channel")

    for ev in (events_to_forward or []):
        if ev is None:
            continue
        try:
            await ev.forward_to(entity)
        except Exception:
            logger.exception("Failed to forward event to human review channel")

async def escalate_to_human(user_id: str, chat_id, sender, events_to_forward: list, combined_text: str, package: dict, last_message_id=None, last_event=None, now_ts: float | None = None):
    """Notify user + report to human review channel, throttled to avoid spamming."""
    state = get_user_state(user_id)
    now = now_ts or time.time()

    # Throttle summary spam; still forward latest user message(s) for context
    should_send_summary = (now - float(state.get("last_escalation_ts") or 0.0)) > ESCALATION_COOLDOWN_SECONDS
    state["last_escalation_ts"] = now

    reason = package.get("reason", "نیازمند بررسی انسانی")
    help_needed = package.get("help_needed", "")
    user_request_info = package.get("user_request_info", "")

    user_reply = (package.get("user_reply") or "").strip()
    if not user_reply:
        user_reply = (
            "یک لحظه لطفاً. پیام شما را برای همکارم می‌فرستم.\n"
            f"برای اینکه سریع‌تر بررسی شود، لطفاً {user_request_info}\n"
            f"زمان پاسخ معمولاً حدود {HUMAN_REVIEW_ETA} است."
        ).strip()

    if last_event is not None:
        try:
            async with client.action(chat_id, "typing"):
                await asyncio.sleep(0.3)
                sent_message = await bot_reply(last_event, user_reply)
            append_to_history(user_id, "assistant", user_reply)
            save_memory(user_histories)
            save_profiles(user_profiles)
            meta = {
                "in_reply_to": last_message_id,
                "message_id": getattr(sent_message, "id", None),
                "source": "human_escalation",
            }
            if now_ts is not None:
                meta["latency_ms"] = int((time.time() - now_ts) * 1000)
            log_chat_event(user_id, "assistant", user_reply, meta)
        except Exception:
            logger.exception("Failed to notify user about human escalation")

    if should_send_summary:
        summary_text = build_human_review_summary(user_id, sender, reason, help_needed, combined_text)
        await send_human_review_report(events_to_forward, summary_text)
        log_chat_event(
            user_id,
            "system",
            "escalated_to_human",
            {"reason": reason, "help_needed": help_needed},
        )
    else:
        # Still forward latest message(s) to keep humans updated (without full summary spam)
        short_text = redact_sensitive(combined_text or "").strip()
        if len(short_text) > 800:
            short_text = short_text[:800] + "…"
        note = (
            "پیام تکمیلی برای مورد ارجاع‌شده\n"
            f"شناسه کاربر/چت: {user_id}\n"
            f"متن مشتری: {short_text}"
        ).strip()
        await send_human_review_report(events_to_forward, note)

    activate_silence(user_id)

def remember_tracking_code(state: dict, tracking_code: str, reset_attempts: bool = False) -> dict:
    pending = state.get("pending") or {}
    if reset_attempts or pending.get("tracking_code") != tracking_code:
        pending = {"type": "tracking", "tracking_code": tracking_code, "attempts": 0}
    pending["ts"] = time.time()
    state["pending"] = pending
    return pending

def get_pending_tracking_code(state: dict) -> str | None:
    pending = state.get("pending") or {}
    if pending.get("type") == "tracking":
        ts = pending.get("ts", 0)
        if time.time() - ts <= PENDING_TTL_SECONDS:
            return pending.get("tracking_code")
    return None

def clear_pending(state: dict):
    state["pending"] = {}

def remember_pending_order_update(state: dict, tracking_code: str, combined_text: str) -> dict:
    pending_update = {
        "type": "verify_order_update",
        "tracking_code": tracking_code,
        "combined_text": combined_text,
        "ts": time.time(),
    }
    state["pending_update"] = pending_update
    return pending_update

def get_pending_order_update(state: dict) -> dict | None:
    pending_update = state.get("pending_update") or {}
    if pending_update.get("type") == "verify_order_update":
        ts = float(pending_update.get("ts") or 0.0)
        if time.time() - ts <= PENDING_UPDATE_TTL_SECONDS:
            return pending_update
    return None

def clear_pending_order_update(state: dict):
    state["pending_update"] = {}

def extract_last4_digits(text: str) -> str | None:
    t = normalize_digits_to_ascii(text or "")
    nums = re.findall(r"(?<!\d)(\d{4})(?!\d)", t)
    return nums[-1] if nums else None

# Message batching system - جمع کردن پیام‌های پشت سرهم
message_buffer = {}  # user_id -> list of messages (may include image/audio base64)
buffer_timers = {}   # user_id -> asyncio.Task
user_locks = {}  # user_id -> asyncio.Lock
DEBOUNCE_SECONDS = 3  # چند ثانیه صبر کنه تا پیام‌های بعدی بیاد

# Human takeover - وقتی خودت داری چت می‌کنی، بات دخالت نکنه
human_active_chats = {}  # user_id -> last_human_message_time
HUMAN_TAKEOVER_SECONDS = 60  # pause duration after human sends message before bot resumes

# When THIS script sends a message, we must NOT treat it as "human takeover".
# We keep a short-lived mark to let the outgoing handler ignore programmatic sends.
BOT_OUTGOING_MARK_TTL_SECONDS = 120
_bot_sending_depth: dict[str, int] = {}  # chat_id -> nested send depth
_bot_outgoing_marks: dict[tuple[str, int], float] = {}  # (chat_id, msg_id) -> ts
last_bot_reply_ts = {}  # user_id -> last bot reply timestamp

def _bot_send_enter(chat_id: str):
    cid = str(chat_id or "")
    if not cid:
        return
    _bot_sending_depth[cid] = int(_bot_sending_depth.get(cid) or 0) + 1

def _bot_send_exit(chat_id: str):
    cid = str(chat_id or "")
    if not cid:
        return
    depth = int(_bot_sending_depth.get(cid) or 0)
    if depth <= 1:
        _bot_sending_depth.pop(cid, None)
    else:
        _bot_sending_depth[cid] = depth - 1

def mark_bot_outgoing_message(message):
    try:
        chat_id = str(getattr(message, "chat_id", "") or "")
        msg_id = getattr(message, "id", None)
        if not chat_id or msg_id is None:
            return
        _bot_outgoing_marks[(chat_id, int(msg_id))] = time.time()
    except Exception:
        return

def is_bot_outgoing_event(chat_id: str, msg_id: int | None) -> bool:
    cid = str(chat_id or "")
    if not cid or msg_id is None:
        return False

    if int(_bot_sending_depth.get(cid) or 0) > 0:
        return True

    key = (cid, int(msg_id))
    ts = _bot_outgoing_marks.get(key)
    if ts and (time.time() - float(ts)) <= BOT_OUTGOING_MARK_TTL_SECONDS:
        _bot_outgoing_marks.pop(key, None)
        return True

    # best-effort cleanup
    if len(_bot_outgoing_marks) > 2500:
        cutoff = time.time() - BOT_OUTGOING_MARK_TTL_SECONDS
        stale = [k for k, v in _bot_outgoing_marks.items() if float(v) < cutoff]
        for k in stale[:2000]:
            _bot_outgoing_marks.pop(k, None)

    return False

async def bot_reply(ev, text: str, **kwargs):
    chat_id = str(getattr(ev, "chat_id", "") or "")
    kwargs.setdefault("link_preview", False)
    _bot_send_enter(chat_id)
    try:
        msg = await ev.reply(text, **kwargs)
    finally:
        _bot_send_exit(chat_id)
    mark_bot_outgoing_message(msg)
    if chat_id:
        last_bot_reply_ts[chat_id] = time.time()
    return msg

async def bot_respond(ev, text: str, **kwargs):
    chat_id = str(getattr(ev, "chat_id", "") or "")
    kwargs.setdefault("link_preview", False)
    _bot_send_enter(chat_id)
    try:
        msg = await ev.respond(text, **kwargs)
    finally:
        _bot_send_exit(chat_id)
    mark_bot_outgoing_message(msg)
    if chat_id:
        last_bot_reply_ts[chat_id] = time.time()
    return msg

SYSTEM_PROMPT = """
شما پشتیبان ارشد جینکس فمیلی هستید
مخاطب شما گیمرها و مشتریان جوان هستند
شخصیت شما صبور کاربلد و محترم است

اصول لحن و نگارش
صمیمی اما با احترام باشید
از کلمات سخیف استفاده نکنید
می‌توانید با نام کوچک صدا بزنید اگر در پروفایل بود
جملات کوتاه و شمرده باشند
اگر متن طولانی شد آن را در چند خط کوتاه جدا کنید
از جملات کلیشه‌ای رباتی دوری کنید
اگر موضوع زمان‌بر است همدلانه بگویید یکم زمان می‌برد اما پیگیری می‌کنید

جایگزین‌های طبیعی
به جای چگونه می‌توانم کمک کنم بگویید در خدمتم
به جای متوجه شدم بگویید چشم یا درسته
اگر کاربر ناراحت بود کوتاه و آرام جواب بدهید

قوانین قرمز
هرگز نگویید هوش مصنوعی هستید اگر پرسیدند بگویید دستیار جینکس فمیلی هستید
در مسائل مالی دقیق باشید و چیزی حدسی نگویید
اگر کاربر عصبانی بود گارد نگیرید بگویید حق دارد ناراحت باشد و بررسی می‌کنید

اطلاعات فروشگاه
ثبت سفارش فقط از طریق وب‌سایت رسمی انجام می‌شود https://jinxfamily.shop
پرداخت فقط آنلاین و از طریق درگاه وب‌سایت است و کارت‌به‌کارت نداریم
پشتیبانی تلگرام فروشگاه فقط این آیدی است @JinxFamilySupport
شماره تماس پشتیبانی فنی 02191694759
اگر درباره تماس تلفنی پرسیدند بگو در خصوص سفارشات خاص که نیاز به پشتیبانی تلفنی دارند اصلا نگران نباشید، به نوبت تماس‌ها انجام می‌شود
سفارشات عادی معمولاً بین ۲ تا ۷۲ ساعت انجام می‌شوند
تمامی محصولات از اپیک گیمز فعال می‌شوند جز «کروپک معمولی» که از طریق ایکس‌باکس زده می‌شود. اما «کروپک فوری/VIP» از طریق اپیک گیمز و بین ۱۵ تا ۴۵ دقیقه انجام می‌شود
سفارش فوری معمولاً بین ۱۵ تا ۴۵ دقیقه تکمیل می‌شود
ظرفیت سفارش فوری محدود است و هر روز صبح راس ساعت ۱۰ مجدد شارژ می‌شود (به مشتری بگو آن موقع چک کند)
اگر مشتری پرسید تا زمان انجام سفارش می‌توانم وارد بازی شوم، بگو مشکلی ندارد می‌توانید وارد شوید عزیزم
اگر پرسیدند می‌توانم برای دیگران هم کروپک سفارش دهم، بگو مشکلی ندارد ولی عزیزم خودشون ثبت کنن بهتره
کد پیگیری سفارش ۴ رقمی است و در پنل سایت هست اگر عدد طولانی فرستادند بگویید کد ۴ رقمی را بفرستند
موجودی کالاها را بر اساس سایت چک کنید اگر محصول را پیدا نکردید لینک یا نام دقیق بخواهید
اگر درباره زمان انجام پرسیدند اول وضعیت سفارش را چک کنید اگر processing بود بگویید در صف انجام است
سفارش فوری فقط موقع ثبت سفارش در سایت قابل انتخاب است و ظرفیتش محدود است
این قوانین قطعی هستند و نباید خلاف آن‌ها چیزی بگویید

احراز هویت
اگر اطلاعات امنیتی با دیتابیس نخواند دوستانه بگویید اطلاعات یکی نیست و تصویر رسید یا مشخصات دقیق‌تر بخواهید
اگر مشتری اطلاعات جدید اکانت (ایمیل یا رمز) را برای اصلاح سفارش فرستاد، حتماً تشکر کن و بگو "اطلاعات شما دریافت و برای بررسی مجدد ثبت شد". هرگز نگو "اینجا امن نیست" یا "نفرست". ما به این اطلاعات برای انجام سفارش نیاز داریم و سیستم امنیت آن را تامین می‌کند.

ارجاع به پشتیبان
در موارد شکایت دعوا درخواست پول یا مشکل پیچیده بگویید الان به همکارم می‌گویم چک کند

ایمنی
اگر بحث خودکشی بود هیچ راهکاری ندهید و فقط بگویید با ۱۱۵ یا ۱۲۳ تماس بگیرند

حافظه
از حرف‌های قبلی کاربر استفاده کنید و سوال تکراری نپرسید
اگر اطلاعات در دیتابیس بود همان را ملاک قرار دهید

الان فقط به پیام کاربر و به زبان فارسی پاسخ بدهید
"""

# --- 4. TELEGRAM & BOT LOGIC ---
print(f"🚀 Initializing JinxFamily AI (JinxFamily Persona)...")

session = BusySQLiteSession(SESSION_NAME, timeout=SESSION_DB_BUSY_TIMEOUT)

try:
    ai_client = OpenAI(
        base_url="https://openrouter.ai/api/v1",
        api_key=OPENROUTER_API_KEY,
        http_client=httpx.Client(timeout=60.0),
    )
    client = TelegramClient(session, API_ID, API_HASH)
except Exception:
    logger.exception("Initialization error")
    sys.exit(1)

# تابع دریافت تاریخچه از تلگرام (برای کاربرانی که در فایل نیستند)
async def fetch_telegram_history(user_id, limit=10):
    """Downloads recent messages from Telegram servers for context."""
    print(f"📥 Fetching history for user {user_id} from Telegram...")
    history = []
    try:
        msgs = await client.get_messages(int(user_id), limit=limit)
        for msg in reversed(msgs):
            if not msg.text: continue
            role = "assistant" if msg.out else "user"
            content = normalize_for_history(role, msg.text.strip())
            if content:
                history.append({"role": role, "content": content})
    except Exception as e:
        logger.exception("Failed to fetch Telegram history for %s", user_id)
    return history

def get_media_type(event):
    """Detect the type of media in a message."""
    msg = event.message
    if msg.photo:
        return "photo"
    if msg.video:
        return "video"
    if msg.voice:
        return "voice"
    if msg.video_note:
        return "video_note"
    if msg.sticker:
        return "sticker"
    if msg.gif:
        return "gif"
    if msg.document:
        return "document"
    if msg.audio:
        return "audio"
    if msg.contact:
        return "contact"
    if msg.geo:
        return "location"
    return None

def is_image_media(event) -> bool:
    """Detect whether message contains an image suitable for vision models."""
    msg = event.message
    if msg.photo:
        return True
    file_obj = getattr(msg, "file", None)
    mime_type = getattr(file_obj, "mime_type", None) if file_obj else None
    if mime_type and mime_type.startswith("image/"):
        return True
    doc = getattr(msg, "document", None)
    doc_mime = getattr(doc, "mime_type", None) if doc else None
    return bool(doc_mime and doc_mime.startswith("image/"))

def is_audio_media(event) -> bool:
    """Detect whether message contains a voice note or audio file."""
    msg = event.message
    return bool(msg.voice or msg.audio)

def encode_image_base64(data: bytes) -> str:
    """Encode raw image bytes to base64 ASCII string."""
    return base64.b64encode(data).decode("ascii")

def encode_audio_base64(data: bytes) -> str:
    """Encode raw audio bytes to base64 ASCII string."""
    return base64.b64encode(data).decode("ascii")

def _mime_from_pil_format(fmt: str | None) -> str | None:
    if not fmt:
        return None
    fmt_upper = fmt.upper()
    return {
        "JPEG": "image/jpeg",
        "JPG": "image/jpeg",
        "PNG": "image/png",
        "WEBP": "image/webp",
        "GIF": "image/gif",
        "BMP": "image/bmp",
        "TIFF": "image/tiff",
    }.get(fmt_upper)

def downscale_image_bytes(data: bytes, max_dim: int, mime_hint: str | None = None) -> tuple[bytes, str | None]:
    """Downscale large images before base64 to control payload size (optional PIL)."""
    try:
        from io import BytesIO
        from PIL import Image
    except Exception:
        return data, mime_hint

def _audio_format_from_mime(mime_type: str | None) -> str | None:
    if not mime_type:
        return None
    mime = mime_type.lower()
    if "wav" in mime:
        return "wav"
    if "mpeg" in mime or "mp3" in mime:
        return "mp3"
    if "ogg" in mime or "opus" in mime:
        return "ogg"
    if "m4a" in mime or "mp4" in mime:
        return "m4a"
    return None

def transcode_audio_bytes(data: bytes, mime_hint: str | None = None) -> tuple[bytes, str | None, str | None]:
    """Best-effort audio transcode to WAV (requires ffmpeg)."""
    source_format = _audio_format_from_mime(mime_hint)
    if source_format in ("wav", "mp3"):
        return data, mime_hint, source_format
    if not shutil.which("ffmpeg"):
        return data, mime_hint, source_format
    try:
        with tempfile.TemporaryDirectory() as tmpdir:
            in_ext = source_format or "ogg"
            in_path = os.path.join(tmpdir, f"input.{in_ext}")
            out_path = os.path.join(tmpdir, "output.wav")
            with open(in_path, "wb") as f:
                f.write(data)
            subprocess.run(
                ["ffmpeg", "-y", "-i", in_path, "-ac", "1", "-ar", "16000", out_path],
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
                check=False,
            )
            if os.path.exists(out_path):
                with open(out_path, "rb") as f:
                    out_bytes = f.read()
                return out_bytes, "audio/wav", "wav"
    except Exception:
        return data, mime_hint, source_format
    return data, mime_hint, source_format

def _sha256_bytes(data: bytes | None) -> str | None:
    if not data:
        return None
    return hashlib.sha256(data).hexdigest()

def split_trace_line(text: str) -> tuple[str | None, str]:
    """Split internal trace line from model output if present."""
    if not text:
        return None, ""
    lines = text.strip().splitlines()
    if lines and lines[0].startswith("[[TRACE]]"):
        trace_line = lines[0][len("[[TRACE]]"):].strip()
        remaining = "\n".join(lines[1:]).strip()
        return trace_line, remaining
    return None, text.strip()
    try:
        with Image.open(BytesIO(data)) as img:
            width, height = img.size
            if max(width, height) <= max_dim:
                return data, mime_hint or _mime_from_pil_format(img.format)
            img.thumbnail((max_dim, max_dim))
            out = BytesIO()
            img_format = (img.format or "").upper()
            if img_format in ("JPEG", "JPG"):
                img = img.convert("RGB")
                img.save(out, format="JPEG", quality=85, optimize=True)
                return out.getvalue(), "image/jpeg"
            if img_format == "PNG":
                img.save(out, format="PNG", optimize=True)
                return out.getvalue(), "image/png"
            if img_format == "WEBP":
                img.save(out, format="WEBP", quality=85, method=6)
                return out.getvalue(), "image/webp"
            img.save(out, format=img_format or "JPEG")
            return out.getvalue(), mime_hint or _mime_from_pil_format(img_format)
    except Exception:
        return data, mime_hint

async def process_buffered_messages(user_id, chat_id, sender):
    """پردازش همه پیام‌های جمع شده برای یک کاربر"""
    global message_buffer, buffer_timers, user_locks

    last_event = None
    last_message_id = None

    if user_id not in user_locks:
        user_locks[user_id] = asyncio.Lock()

    try:
        await asyncio.sleep(DEBOUNCE_SECONDS)
    except asyncio.CancelledError:
        return

    async with user_locks[user_id]:
        try:
            # اگر پیام از طرف خود اکانت ارسال شده، سکوت فعال شود و پردازش نشود
            if getattr(sender, "is_self", False):
                message_buffer.pop(user_id, None)
                timer = buffer_timers.pop(user_id, None)
                if timer:
                    timer.cancel()
                activate_silence(user_id)
                print(f"🤫 Skipping self-sent message for {user_id}; silence activated.")
                return

            if user_id not in message_buffer or not message_buffer[user_id]:
                return

            messages = message_buffer[user_id]
            message_buffer[user_id] = []

            image_payloads = []
            audio_payloads = []
            for m in messages:
                img_b64 = m.get("image_base64")
                if img_b64:
                    image_payloads.append({
                        "mime_type": m.get("image_mime") or "image/jpeg",
                        "base64": img_b64,
                        "original_len": m.get("image_original_len"),
                        "original_sha": m.get("image_original_sha"),
                        "resized_len": m.get("image_resized_len"),
                        "resized_sha": m.get("image_resized_sha"),
                    })
                audio_b64 = m.get("audio_base64")
                if audio_b64:
                    audio_payloads.append({
                        "mime_type": m.get("audio_mime"),
                        "format": m.get("audio_format"),
                        "base64": audio_b64,
                        "original_len": m.get("audio_original_len"),
                        "original_sha": m.get("audio_original_sha"),
                        "transcoded_len": m.get("audio_transcoded_len"),
                        "transcoded_sha": m.get("audio_transcoded_sha"),
                    })

            all_texts = [m.get("text") for m in messages if m.get("text")]
            if not all_texts and not image_payloads and not audio_payloads:
                return

            combined_text = "\n".join(all_texts) if len(all_texts) > 1 else (all_texts[0] if all_texts else "")
            
            # Token Safety: Cap total input length for LLM
            if len(combined_text) > 2500:
                combined_text = combined_text[:2500] + "\n...(پیام کوتاه شد)"
            
            llm_text = combined_text
            last_message_id = messages[-1]["message_id"]
            last_event = messages[-1]["event"]

            if combined_text:
                preview = combined_text
            elif image_payloads:
                preview = "[image]"
            else:
                preview = "[audio]"
            print(f"📦 Processing {len(messages)} batched messages from {sender.first_name}: {preview}...")

            now = time.time()
            log_chat_event(
                user_id,
                "user",
                combined_text,
                {
                    "message_id": last_message_id,
                    "name": (getattr(sender, "first_name", "") or "").strip(),
                    "username": getattr(sender, "username", None),
                    "batched_count": len(messages),
                    "has_media": bool(image_payloads or audio_payloads),
                },
            )

            state = get_user_state(user_id)
            # state loaded for downstream routing and updates

            # === حافظه و پروفایل کاربر (برای تمام شاخه‌ها، حتی پاسخ‌های لوکال) ===
            if user_id not in user_histories or not user_histories[user_id]:
                user_histories[user_id] = await fetch_telegram_history(user_id)

            update_user_profile(user_id, sender=sender, text=combined_text)
            media_label = None
            if image_payloads and audio_payloads:
                media_label = "تصویر و صوت ارسال شد"
            elif image_payloads:
                media_label = "تصویر ارسال شد"
            elif audio_payloads:
                media_label = "پیام صوتی ارسال شد"
            append_to_history(user_id, "user", combined_text, has_media=bool(image_payloads or audio_payloads), media_label=media_label)

            # شکستن/اعمال سکوت بعد از ارجاع به انسان
            force_wake_words = ["بات", "bot", "ربات", "start", "/start", "منو"]
            lowered_text = (combined_text or "").lower()
            if any(w in lowered_text for w in force_wake_words):
                deactivate_silence(user_id)

            if is_user_silenced(user_id):
                print(f"User {user_id} is silenced (awaiting human). Ignoring message.")
                save_memory(user_histories)
                save_profiles(user_profiles)
                return

            # === Router + Generator flow (no local canned responses) ===
            router_intent = "MULTIMODAL_QUERY" if (image_payloads or audio_payloads) else await detect_user_intent(combined_text)
            print(f"🧠 Intent: {router_intent} | User: {sender.first_name}")
    
            db_context_str = ""
    
            tracking_code = extract_tracking_code(combined_text)
            tracking_source = "new" if tracking_code else None
            if not tracking_code:
                pending_code = get_pending_tracking_code(state)
                if pending_code:
                    tracking_code = pending_code
                    tracking_source = "pending"
    
            if tracking_code:
                pending = remember_tracking_code(state, tracking_code, reset_attempts=(tracking_source == "new"))
                pending["attempts"] = pending.get("attempts", 0) + 1
                pending["last_attempt_at"] = time.time()
                state["pending"] = pending
    
            twofa_disabled = is_twofa_disabled_message(combined_text)
            info_update = is_order_info_update_message(combined_text)
            parsed_update = parse_order_corrections(combined_text) if (twofa_disabled or info_update) else {}
    
            if (twofa_disabled or info_update) and tracking_code:
                update_block = build_bot_admin_note_block(sender, combined_text, parsed_update)
                cached_identity = get_cached_verified_order_identity(state, tracking_code) or {}
                result = await apply_bot_order_note_update(
                    tracking_code=tracking_code,
                    telegram_user_id=str(user_id),
                    telegram_username=getattr(sender, "username", None),
                    source_message_id=last_message_id,
                    update_block=update_block,
                    last4_digits=cached_identity.get("last4"),
                    verify_email=cached_identity.get("email") or parsed_update.get("epic_username"),
                    verify_phone=cached_identity.get("phone") or parsed_update.get("phone"),
                    verify_name=cached_identity.get("name"),
                    field_updates={
                        "epic_username": parsed_update.get("epic_username"),
                        "phone": parsed_update.get("phone"),
                    },
                )
                if result.get("ok"):
                    clear_pending_order_update(state)
                    action_reply = (
                        f"اطلاعات جدید شما برای سفارش {tracking_code} دریافت و ثبت شد\n"
                        "سفارش شما مجدداً در صف بررسی قرار گرفت"
                    )
                    if twofa_disabled:
                        action_reply = (
                            f"متوجه شدم\n"
                            f"وضعیت سفارش {tracking_code} به تایید دو مرحله‌ای خاموش تغییر یافت\n"
                            "همکارانم مجدداً برای ورود تلاش خواهند کرد"
                        )
                    elif not parsed_update.get("platform"):
                        action_reply = (
                            f"{action_reply}\n"
                            "نوع اکانت را هم ارسال کنید\nEpic یا Xbox یا PSN"
                        )
                    db_context_str = f"ACTION_RESULT: OK\nREPLY_HINT:\n{action_reply}"
                else:
                    reason = result.get("reason")
                    if reason in ("need_identity", "invalid_identity"):
                        remember_pending_order_update(state, tracking_code, combined_text)
                        db_context_str = (
                            "ACTION_RESULT: NEED_IDENTITY\n"
                            f"ORDER_CODE: {tracking_code}\n"
                            "REPLY_HINT:\n"
                            "برای ثبت اطلاعات لطفاً یکی از این موارد را بفرستید\n"
                            "۴ رقم آخر موبایل ثبت سفارش\n"
                            "ایمیل یا یوزرنیم ثبت سفارش\n"
                            "نام و نام خانوادگی ثبت سفارش"
                        )
                    elif reason == "not_found":
                        clear_pending(state)
                        clear_pending_order_update(state)
                        db_context_str = (
                            "ACTION_RESULT: NOT_FOUND\n"
                            f"ORDER_CODE: {tracking_code}\n"
                            "REPLY_HINT:\n"
                            "سفارشی با این کد پیدا نشد\nکد را دوباره بررسی کنید"
                        )
                    else:
                        db_context_str = (
                            "ACTION_RESULT: ERROR\n"
                            "REPLY_HINT:\n"
                            "خطای فنی پیش آمد\nچند دقیقه بعد دوباره بفرستید"
                        )
    
            if not db_context_str and router_intent == "TRACKING_QUERY":
                if tracking_code:
                    order_info = await lookup_order(tracking_code)
                    if order_info is None:
                        order_info = {
                            "found": False,
                            "tracking_code": normalize_tracking_code(tracking_code),
                            "error": "lookup_failed",
                        }
                    short_reply = format_order_response_short(order_info)
                    reply = normalize_style(short_reply)
                    reply = apply_assistant_tone_rules(reply)
                    reply = enforce_store_policies(reply, llm_text, has_verified_order=bool(tracking_code))
                    reply = trim_reply(sanitize_reply(reply))
                    if not reply:
                        reply = "متوجه شدم"

                    append_to_history(user_id, "assistant", reply)
                    save_memory(user_histories)
                    save_profiles(user_profiles)

                    async with client.action(chat_id, 'typing'):
                        # Human-like typing logic for tracking
                        reading_time = max(len(combined_text or "") * 0.04, 0.8)
                        thinking_time = random.uniform(0.8, 1.5) # DB lookup is fast but needs "human" pause
                        typing_duration = len(reply) * 0.07
                        
                        total_delay = min(reading_time + thinking_time + typing_duration, 8.0)
                        total_delay *= random.uniform(0.9, 1.1)

                        await asyncio.sleep(total_delay)

                        sent_message = await bot_reply(last_event, reply)
                        log_chat_event(
                            user_id,
                            "assistant",
                            reply,
                            {
                                "in_reply_to": last_message_id,
                                "message_id": getattr(sent_message, "id", None),
                                "source": "order_tracking_short",
                                "latency_ms": int((time.time() - now) * 1000),
                            },
                        )
                    return
                else:
                    db_context_str = "TRACKING_CONTEXT:\nکاربر پیگیری سفارش دارد اما کد ۴ رقمی را نفرستاده است"

            if not db_context_str and router_intent == "PRODUCT_QUERY":
                products = await find_products_any_in_text(combined_text, limit=5)
                if products:
                    db_context_str = f"PRODUCTS_CONTEXT:\n{_json_dumps_safe(products)}"
                else:
                    db_context_str = "PRODUCTS_CONTEXT:\nمحصولی پیدا نشد از کاربر نام دقیق یا لینک بخواهید"
    
            if not db_context_str and router_intent == "HUMAN_REQUEST":
                db_context_str = "HUMAN_CONTEXT:\nکاربر درخواست پشتیبان انسانی یا شکایت دارد با لحن آرام پاسخ بده و بگو ارجاع میدم"
    
            if not db_context_str:
                db_context_str = "GENERAL_CONTEXT:\nپاسخ کوتاه و انسانی بده و گفت‌وگو را جلو ببر"
    
            profile_hint = build_profile_hint(user_id)
    
            messages_payload = [{"role": "system", "content": SYSTEM_PROMPT}]
            messages_payload.append({"role": "system", "content": db_context_str})
            if profile_hint:
                messages_payload.append({"role": "system", "content": profile_hint})
            messages_payload += user_histories[user_id][-8:]
    
            if image_payloads or audio_payloads:
                content_parts = []
                if llm_text:
                    content_parts.append({"type": "text", "text": llm_text})
                else:
                    placeholder = "تصویر پیوست شد" if image_payloads else "پیام صوتی ارسال شد"
                    content_parts.append({"type": "text", "text": placeholder})
                for image in image_payloads:
                    content_parts.append({
                        "type": "image_url",
                        "image_url": {"url": f"data:{image['mime_type']};base64,{image['base64']}"},
                    })
                for audio in audio_payloads:
                    audio_format = audio.get("format") or _audio_format_from_mime(audio.get("mime_type")) or "ogg"
                    content_parts.append({
                        "type": "input_audio",
                        "input_audio": {"data": audio["base64"], "format": audio_format},
                    })
                messages_payload.append({"role": "user", "content": content_parts})
            else:
                messages_payload.append({"role": "user", "content": llm_text})
    
            if image_payloads and not audio_payloads and not (combined_text or "").strip():
                try:
                    preview_reply = "یه لحظه رسید رو چک میکنم"
                    async with client.action(chat_id, 'typing'):
                        await asyncio.sleep(0.2)
                        preview_msg = await bot_reply(last_event, preview_reply)
                    append_to_history(user_id, "assistant", preview_reply)
                    save_memory(user_histories)
                    save_profiles(user_profiles)
                    log_chat_event(
                        user_id,
                        "assistant",
                        preview_reply,
                        {
                            "in_reply_to": last_message_id,
                            "message_id": getattr(preview_msg, "id", None),
                            "source": "media_preview_notice",
                        },
                    )
                except Exception:
                    logger.exception("Failed to send media preview notice for %s", user_id)
    
            req_body = {
                "model": MODEL_GENERATOR,
                "messages": messages_payload,
                "extra_headers": {"HTTP-Referer": SITE_URL, "X-Title": APP_NAME},
                "metadata": {"user_id": user_id},
            }
    
            try:
                response = ai_client.chat.completions.create(**req_body)
                log_llm_request(
                    req_body,
                    response=response,
                    user_id=user_id,
                    user_profile={
                        "name": (getattr(sender, "first_name", "") or "").strip(),
                        "username": getattr(sender, "username", None),
                        "chat_id": user_id,
                    },
                    memory_key=user_id,
                )
                reply = response.choices[0].message.content.strip()
                reply = normalize_style(reply)
                reply = apply_assistant_tone_rules(reply)
                reply = enforce_store_policies(reply, llm_text, has_verified_order=bool(tracking_code))
                reply = trim_reply(sanitize_reply(reply))
                if not reply:
                    reply = "متوجه شدم"
    
                append_to_history(user_id, "assistant", reply)
                save_memory(user_histories)
                save_profiles(user_profiles)
    
                async with client.action(chat_id, 'typing'):
                    # Human-like typing simulation
                    # Base read time: 0.04s per char of user input, min 1s
                    reading_time = max(len(combined_text or "") * 0.04, 1.0)
                    
                    # Thinking time: 1-2s normally, 2-3s for DB/check tasks
                    thinking_time = random.uniform(1.0, 2.0)
                    if "بررسی" in reply or "دیتابیس" in reply or "لحظه" in reply:
                        thinking_time += 1.5

                    # Typing speed: ~0.07s per char (approx 850 CPM), plus variance
                    typing_duration = len(reply) * 0.07
                    
                    # Cap max delay to avoid user frustration (max 8-10s)
                    total_delay = min(reading_time + thinking_time + typing_duration, 10.0)
                    
                    # Add noise
                    total_delay *= random.uniform(0.9, 1.1)

                    await asyncio.sleep(total_delay)
    
                    sent_message = await bot_reply(last_event, reply)
                    log_chat_event(
                        user_id,
                        "assistant",
                        reply,
                        {
                            "in_reply_to": last_message_id,
                            "message_id": getattr(sent_message, "id", None),
                            "latency_ms": int((time.time() - now) * 1000),
                        },
                    )
                return
            except Exception as e:
                logger.exception("Router/Generator flow error for %s", user_id)
                log_llm_request(
                    req_body,
                    response=None,
                    error=str(e),
                    user_id=user_id,
                    user_profile={
                        "name": (getattr(sender, "first_name", "") or "").strip(),
                        "username": getattr(sender, "username", None),
                        "chat_id": user_id,
                    },
                    memory_key=user_id,
                )
                try:
                    fallback_reply = "یه اختلالی پیش اومد چند دقیقه بعد دوباره بفرستید"
                    async with client.action(chat_id, 'typing'):
                        await asyncio.sleep(0.3)
                        sent_message = await bot_reply(last_event, fallback_reply)
                    append_to_history(user_id, "assistant", fallback_reply)
                    save_memory(user_histories)
                    save_profiles(user_profiles)
                    log_chat_event(
                        user_id,
                        "assistant",
                        fallback_reply,
                        {
                            "in_reply_to": last_message_id,
                            "message_id": getattr(sent_message, "id", None),
                            "source": "router_generator_error",
                        },
                    )
                except Exception:
                    logger.exception("Failed to send router/generator fallback for %s", user_id)
                return
    
        except Exception:
            logger.exception("process_buffered_messages crashed for %s", user_id)
            if last_event is not None:
                try:
                    fallback_reply = "یک خطای داخلی رخ داد. لطفاً پیام خود را یک بار دیگر ارسال نمایید."
                    async with client.action(chat_id, 'typing'):
                        await asyncio.sleep(0.3)
                        sent_message = await bot_reply(last_event, fallback_reply)
                    append_to_history(user_id, "assistant", fallback_reply)
                    save_memory(user_histories)
                    save_profiles(user_profiles)
                    meta = {
                        "in_reply_to": last_message_id,
                        "message_id": getattr(sent_message, "id", None),
                        "source": "handler_error",
                    }
                    if 'now' in locals():
                        meta["latency_ms"] = int((time.time() - now) * 1000)
                    log_chat_event(user_id, "assistant", fallback_reply, meta)
                except Exception:
                    logger.exception("Failed to send fallback reply after crash for %s", user_id)


@client.on(events.NewMessage(outgoing=True, func=lambda e: e.is_private))
async def handle_outgoing_message(event):
    """وقتی خودت پیام میدی، بات را برای آن چت موقتاً ساکت کن (به‌جز کاربران مستثنی‌شده)."""
    global message_buffer, buffer_timers
    user_id = str(event.chat_id)
    now_ts = time.time()

    # If the bot just replied, ignore this outgoing event to avoid double-counting.
    if user_id in last_bot_reply_ts and (now_ts - last_bot_reply_ts[user_id]) < 3.0:
        return

    message_id = getattr(event, "id", None) or getattr(getattr(event, "message", None), "id", None)
    if is_bot_outgoing_event(user_id, message_id):
        return

    if user_id in BYPASS_SILENCE_USERS:
        message_buffer.pop(user_id, None)
        timer = buffer_timers.pop(user_id, None)
        if timer:
            timer.cancel()
        print(f"👤 Human message to bypassed user {user_id}; bot remains active.")
        return

    outgoing_text = (event.raw_text or "").strip()
    if outgoing_text:
        log_chat_event(
            user_id,
            "assistant",
            outgoing_text,
            {
                "message_id": message_id,
                "source": "human_outgoing",
            },
        )
        append_to_history(user_id, "assistant", outgoing_text)
        save_memory(user_histories)
        save_profiles(user_profiles)

    human_active_chats[user_id] = time.time()
    message_buffer.pop(user_id, None)
    timer = buffer_timers.pop(user_id, None)
    if timer:
        timer.cancel()
    print(f"👤 Human takeover for {user_id} - bot paused for {HUMAN_TAKEOVER_SECONDS}s")


@client.on(events.NewMessage(incoming=True, func=lambda e: e.is_private))
async def handle_new_message(event):
    """دریافت پیام و اضافه کردن به بافر"""
    global message_buffer, buffer_timers

    sender = await event.get_sender()
    if sender.bot or sender.is_self:
        return

    user_id = str(event.chat_id)
    bypass_silence = user_id in BYPASS_SILENCE_USERS
    user_text = (event.raw_text or "").strip()

    # 1. Text Length Cap (Token Saver)
    if len(user_text) > 2500:
        user_text = user_text[:2500]

    # فرمان پاک‌سازی ویژه @PedDevIR
    if bypass_silence and user_text.lower().startswith("/clear"):
        # حذف حافظه/پروفایل/صف‌ها
        user_histories.pop(user_id, None)
        save_memory(user_histories)
        user_profiles.pop(user_id, None)
        save_profiles(user_profiles)
        user_state.pop(user_id, None)
        message_buffer.pop(user_id, None)
        timer = buffer_timers.pop(user_id, None)
        if timer:
            timer.cancel()
        human_active_chats.pop(user_id, None)

        # تلاش برای پاک‌کردن پیام‌های قبلی در چت (به‌صورت best-effort)
        try:
            msgs = await client.get_messages(int(user_id), limit=500)
            ids = [m.id for m in msgs if m and m.id]
            if ids:
                await client.delete_messages(int(user_id), ids)
        except Exception:
            logger.exception("Failed to delete chat history for /clear user %s", user_id)

        reply_clear = "حافظه من پاک شد قربان، می‌توانید به تست من ادامه دهید."
        async with client.action(user_id, "typing"):
            await asyncio.sleep(0.2)
            await bot_respond(event, reply_clear)
        log_chat_event(
            user_id,
            "assistant",
            reply_clear,
            {"source": "clear_command", "in_reply_to": getattr(event, "id", None)},
        )
        return

    media_type = get_media_type(event)
    is_image = bool(media_type and is_image_media(event))
    is_audio = bool(media_type and is_audio_media(event))

    # 2. Audio/Voice Size Limit (Max 3MB ~ 5 mins)
    if is_audio:
        f = getattr(event.message, "file", None)
        if f and f.size > 3 * 1024 * 1024:
            print(f"🚫 Ignoring large audio from {sender.first_name} ({f.size} bytes)")
            return

    # 3. Anxious Customer Detection (Anti-Spam Bypass)
    # اگر مشتری نگران است (کلمات کلیدی نگرانی)، حتی اگر تندتند پیام داد، اسپم تلقی نشود.
    anxious_keywords = ("چرا", "کی", "انجام", "نگران", "استرس", "پول", "واریز", "دیر", "نشده", "خبری نیست", "جواب", "کنسل")
    is_anxious = any(k in user_text for k in anxious_keywords)

    # آیا پیام حاوی کد پیگیری/سوال محصول است؟ (در این حالت سکوت انسانی را نادیده بگیر)
    user_text = user_text or ""
    priority_intent = bool(
        extract_tracking_code(user_text)
        or extract_product_query(user_text)
        or wants_product_list(user_text)
        or is_anxious
        or is_image
        or is_audio
    )

    # Anti-spam: block bursty users (except priority intents)
    blocked, should_warn = spam_guard_hit(user_id)
    if blocked and not priority_intent:
        return

    message_id = getattr(event, "id", None) or getattr(getattr(event, "message", None), "id", None)

    # چک کن که آیا خودت داری با این کاربر چت می‌کنی
    if not bypass_silence and user_id in human_active_chats:
        last_human_msg = human_active_chats[user_id]
        if time.time() - last_human_msg < HUMAN_TAKEOVER_SECONDS and not priority_intent:
            print(f"🤫 Bot silent - human active in chat {user_id}")
            suppressed_text = user_text
            if media_type and not suppressed_text:
                suppressed_text = f"[{media_type.upper()}]"
            log_chat_event(
                user_id,
                "user",
                suppressed_text,
                {
                    "message_id": message_id,
                    "name": (getattr(sender, "first_name", "") or "").strip(),
                    "username": getattr(sender, "username", None),
                    "batched_count": 1,
                    "has_media": bool(media_type),
                    "media_type": media_type,
                    "caption": user_text[:200] if user_text else "",
                    "ignored": True,
                    "ignored_reason": "human_takeover",
                },
            )
            update_user_profile(user_id, sender=sender, text=user_text)
            if suppressed_text:
                append_to_history(user_id, "user", suppressed_text)
            save_memory(user_histories)
            save_profiles(user_profiles)
            return  # بات ساکت بمونه، تو داری جواب میدی
        else:
            # تایم اوت شده، بات دوباره فعال
            del human_active_chats[user_id]

    image_base64 = None
    image_mime = None
    image_original_len = None
    image_original_sha = None
    image_resized_len = None
    image_resized_sha = None
    audio_base64 = None
    audio_mime = None
    audio_format = None
    audio_original_len = None
    audio_original_sha = None
    audio_transcoded_len = None
    audio_transcoded_sha = None

    # مدیای غیرقابل پردازش
    if media_type and not is_image and not is_audio:
        print(f"📎 Media ({media_type}) from {sender.first_name} - unsupported type")
        log_chat_event(
            user_id,
            "user",
            f"[{media_type.upper()}]",
            {"message_id": message_id, "name": sender.first_name, "media_type": media_type, "caption": user_text[:200] if user_text else ""},
        )

        try:
            notice = "این نوع فایل قابل پردازش نیست. لطفاً مشکل را به‌صورت متنی ارسال نمایید."
            async with client.action(event.chat_id, "typing"):
                await asyncio.sleep(0.3)
                sent = await bot_reply(event, notice)
            append_to_history(user_id, "assistant", notice)
            save_memory(user_histories)
            save_profiles(user_profiles)
            log_chat_event(
                user_id,
                "assistant",
                notice,
                {"in_reply_to": message_id, "message_id": getattr(sent, "id", None), "source": "media_notice"},
            )
        except Exception:
            logger.exception("Failed to send media notice to user %s", user_id)
        return

    # تصویر قابل پردازش
    if is_image:
        print(f"📎 Image from {sender.first_name} - downloading for vision")
        log_chat_event(
            user_id,
            "user",
            "[IMAGE]",
            {"message_id": message_id, "name": sender.first_name, "media_type": media_type or "image", "caption": user_text[:200] if user_text else ""},
        )
        try:
            file_obj = getattr(event.message, "file", None)
            image_mime = getattr(file_obj, "mime_type", None) if file_obj else None
            if not image_mime or not image_mime.startswith("image/"):
                image_mime = "image/jpeg"
            media_bytes = await event.download_media(file=bytes)
            if media_bytes:
                image_original_len = len(media_bytes)
                image_original_sha = _sha256_bytes(media_bytes)
                resized_bytes, resized_mime = downscale_image_bytes(
                    media_bytes,
                    max_dim=MAX_IMAGE_DIMENSION,
                    mime_hint=image_mime,
                )
                image_resized_len = len(resized_bytes)
                image_resized_sha = _sha256_bytes(resized_bytes)
                if resized_mime:
                    image_mime = resized_mime
                image_base64 = encode_image_base64(resized_bytes)
        except Exception:
            logger.exception("Failed to download image for user %s", user_id)
            if not user_text:
                try:
                    notice = "در دریافت تصویر مشکلی رخ داد. لطفاً دوباره ارسال نمایید یا توضیح متنی بفرستید."
                    async with client.action(event.chat_id, "typing"):
                        await asyncio.sleep(0.3)
                        sent = await bot_reply(event, notice)
                    append_to_history(user_id, "assistant", notice)
                    save_memory(user_histories)
                    save_profiles(user_profiles)
                    log_chat_event(
                        user_id,
                        "assistant",
                        notice,
                        {"in_reply_to": message_id, "message_id": getattr(sent, "id", None), "source": "media_download_error"},
                    )
                except Exception:
                    logger.exception("Failed to send media download error notice to user %s", user_id)
                return

    # صوت قابل پردازش
    if is_audio:
        print(f"🎧 Audio from {sender.first_name} - downloading for speech")
        log_chat_event(
            user_id,
            "user",
            "[AUDIO]",
            {"message_id": message_id, "name": sender.first_name, "media_type": media_type or "audio", "caption": user_text[:200] if user_text else ""},
        )
        try:
            file_obj = getattr(event.message, "file", None)
            audio_mime = getattr(file_obj, "mime_type", None) if file_obj else None
            media_bytes = await event.download_media(file=bytes)
            if media_bytes:
                audio_original_len = len(media_bytes)
                audio_original_sha = _sha256_bytes(media_bytes)
                audio_bytes, audio_mime, audio_format = transcode_audio_bytes(media_bytes, mime_hint=audio_mime)
                audio_transcoded_len = len(audio_bytes)
                audio_transcoded_sha = _sha256_bytes(audio_bytes)
                audio_base64 = encode_audio_base64(audio_bytes)
        except Exception:
            logger.exception("Failed to download audio for user %s", user_id)
            if not user_text:
                try:
                    notice = "در دریافت پیام صوتی مشکلی رخ داد. لطفاً دوباره ارسال نمایید یا متن را بنویسید."
                    async with client.action(event.chat_id, "typing"):
                        await asyncio.sleep(0.3)
                        sent = await bot_reply(event, notice)
                    append_to_history(user_id, "assistant", notice)
                    save_memory(user_histories)
                    save_profiles(user_profiles)
                    log_chat_event(
                        user_id,
                        "assistant",
                        notice,
                        {"in_reply_to": message_id, "message_id": getattr(sent, "id", None), "source": "audio_download_error"},
                    )
                except Exception:
                    logger.exception("Failed to send audio download error notice to user %s", user_id)
                return

    # ایموجی تکراری spam - نادیده بگیر
    if user_text and len(user_text) < 20 and all(c in "🤣😂😅😆😁😄😃😀🙂😊😇🥰😍🤩😘😗☺😚😙🥲😋😛😜🤪😝❤️💜💙💚💛🧡🤎🖤🤍💔❤️‍🔥💯👍👎✅❌🔥💀😭😈" for c in user_text.replace(" ", "")):
        # فقط ایموجی - اگه قبلاً هم ایموجی فرستاده بود، نادیده بگیر
        if user_id in message_buffer and message_buffer[user_id]:
            last_msg = message_buffer[user_id][-1]["text"]
            if last_msg and all(c in "🤣😂😅😆😁😄😃😀🙂😊😇🥰😍🤩😘😗☺😚😙🥲😋😛😜🤪😝❤️💜💙💚💛🧡🤎🖤🤍💔❤️‍🔥💯👍👎✅❌🔥💀😭😈" for c in last_msg.replace(" ", "")):
                print(f"🚫 Ignoring spam emoji from {sender.first_name}")
                return

    print(f"📩 Buffering from {sender.first_name}: {user_text}...")

    # اضافه کردن به بافر
    if user_id not in message_buffer:
        message_buffer[user_id] = []

    message_buffer[user_id].append({
        "text": user_text,
        "message_id": message_id,
        "event": event,
        "image_base64": image_base64,
        "image_mime": image_mime,
        "image_original_len": image_original_len,
        "image_original_sha": image_original_sha,
        "image_resized_len": image_resized_len,
        "image_resized_sha": image_resized_sha,
        "audio_base64": audio_base64,
        "audio_mime": audio_mime,
        "audio_format": audio_format,
        "audio_original_len": audio_original_len,
        "audio_original_sha": audio_original_sha,
        "audio_transcoded_len": audio_transcoded_len,
        "audio_transcoded_sha": audio_transcoded_sha,
        "has_media": bool(image_base64 or audio_base64),
    })

    # کنسل کردن تایمر قبلی اگه هست
    if user_id in buffer_timers and buffer_timers[user_id]:
        buffer_timers[user_id].cancel()

    # شروع تایمر جدید
    buffer_timers[user_id] = asyncio.create_task(
        process_buffered_messages(user_id, event.chat_id, sender)
    )


if __name__ == '__main__':
    print("✅ JinxFamily Bot is Online & Ready.")
    print(f"📂 Memory loaded: {len(user_histories)} chats.")
    print(f"⏱️ Message batching: {DEBOUNCE_SECONDS}s debounce")
    client.start()
    client.run_until_disconnected()
