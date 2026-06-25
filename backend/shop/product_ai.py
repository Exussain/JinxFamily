"""
AI-assisted product content drafting.

Reuses the same model chain and API client as the support chatbot
(``shop.ai_support``) so we share keys, fallbacks, and cooldown logic,
but with a dedicated system prompt and a constrained JSON output contract.
"""
import json
import logging
import re
from typing import Any

from . import ai_support

logger = logging.getLogger(__name__)


CATEGORY_HINTS = {
    "FORTNITE": "محصولات بازی فورتنایت (وی‌باکس، بتل‌پس، کروپک، استارترپک، V-Bucks). فعال‌سازی روی اکانت Epic Games.",
    "AI": "اشتراک سرویس‌های هوش مصنوعی (ChatGPT Plus، Gemini، Claude، Copilot و...). فعال‌سازی با ایمیل یا لینک دعوت.",
    "GIFTCARDS": "گیفت‌کارت دیجیتال (پلی‌استیشن، ایکس‌باکس، استیم، گوگل‌پلی، اپل/آیتونز). تحویل کد فوری.",
    "GAMES": "سرویس‌ها و اکانت‌های بازی. فعال‌سازی روی اکانت بازی.",
    "SUBSCRIPTIONS": "اشتراک سرویس‌های دیجیتال (Spotify، YouTube Premium، Netflix و...). فعال‌سازی با ایمیل یا لینک دعوت.",
}

SYSTEM_PROMPT = """تو یک کپی‌رایتر فارسی حرفه‌ای برای فروشگاه اینترنتی «نوبیکس‌شاپ» هستی.
وظیفه: برای یک محصول خاص، محتوای صفحهٔ محصول را به‌صورت ساختاریافته و JSON خروجی بده.

قوانین خروجی:
- فقط و فقط یک شیٔ JSON معتبر برگردان. هیچ متن اضافی قبل یا بعد از JSON ننویس.
- کلیدها: description, delivery_text, faq, custom_fields
- description: ۸ تا ۲۰ خط، فارسی روان، با ایموجی‌های مرتبط. شامل معرفی کوتاه، مزایا، شرایط، گارانتی. از Markdown heading استفاده نکن؛ فقط خط‌توضیح و bullet.
- delivery_text: ۳ تا ۵ مرحله، هر کدام یک خط کوتاه. مثال: "۱. ثبت سفارش و پرداخت\\n۲. ارسال اطلاعات اکانت\\n۳. فعال‌سازی توسط تیم طی ۱۵ دقیقه تا ۸ ساعت".
- faq: آرایهٔ ۲ تا ۵ آیتم، هر آیتم {q, a} فارسی. سوالات واقعی که مشتری می‌پرسد. جواب کوتاه و روان.
- custom_fields: آرایهٔ ۱ تا ۵ فیلد، هر آیتم {key, label, type, required, placeholder, options?}.
  - type یکی از: text, email, password, textarea, tel, number, select
  - key: انگلیسی و slug‌شده (snake_case)، یکتا
  - label: فارسی کوتاه، حداکثر ۶۰ کاراکتر
  - required: فقط برای فیلدهای واقعاً ضروری true باشد
  - placeholder: فارسی، اختیاری
  - options: فقط برای type=select، آرایهٔ رشته‌های فارسی
- اگر دسته محصول «گیفت‌کارت» است: custom_fields معمولاً فقط یک فیلد (مثلا ایمیل دریافت‌کننده) کافی است. delivery_text باید شامل «ارسال کد دیجیتال فوری پس از پرداخت» باشد.
- اگر دسته محصول «AI» یا «اشتراک» است: custom_fields معمولاً شامل «ایمیل اکانت» است.
- اگر دسته محصول «فورتنایت» است: custom_fields معمولاً شامل نوع پلتفرم (Epic/PSN/Xbox) و ایمیل و رمز است.
- هیچ‌گاه اطلاعات شخصی مشتری، شماره کارت، رمز واقعی یا کد 2FA را در محتوای محصول درخواست نکن.
"""


def _build_user_prompt(name_fa: str, category: str, hint: str = "") -> str:
    cat_label = category or "FORTNITE"
    hint_text = CATEGORY_HINTS.get(cat_label, CATEGORY_HOICES_DEFAULT)
    extra = f"\nنکتهٔ اضافی ادمین: {hint.strip()[:500]}" if hint and hint.strip() else ""
    return (
        f"نام محصول (فارسی): {name_fa.strip()}\n"
        f"دسته: {cat_label}\n"
        f"راهنمای دسته: {hint_text}{extra}\n\n"
        "خروجی JSON:"
    )


CATEGORY_HOICES_DEFAULT = "محصول دیجیتال. فعال‌سازی با ارسال اطلاعات اکانت مشتری."


def _safe_parse_json(text: str) -> dict | None:
    """Try hard to extract a JSON object from the model's reply."""
    if not text:
        return None
    # Strip markdown fences if present
    fenced = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", text, re.DOTALL)
    if fenced:
        text = fenced.group(1)
    # Find outermost { ... }
    start = text.find("{")
    end = text.rfind("}")
    if start == -1 or end == -1 or end <= start:
        return None
    candidate = text[start : end + 1]
    try:
        return json.loads(candidate)
    except Exception:
        pass
    # Last resort: remove trailing commas
    cleaned = re.sub(r",\s*([}\]])", r"\1", candidate)
    try:
        return json.loads(cleaned)
    except Exception as exc:
        logger.warning("product_ai: could not parse JSON: %s", exc)
        return None


def _fallback_draft(name_fa: str, category: str) -> dict:
    """When the AI fails or is disabled, return a minimal but usable draft."""
    return {
        "description": f"{name_fa}\n\nمحصول دیجیتال نوبیکس‌شاپ با فعال‌سازی سریع و گارانتی اصالت.",
        "delivery_text": "۱. ثبت سفارش و پرداخت از درگاه امن\n۲. ارسال اطلاعات اکانت\n۳. فعال‌سازی توسط تیم طی ۱۵ دقیقه تا ۸ ساعت کاری",
        "faq": [
            {"q": "چگونه محصول را دریافت می‌کنم؟", "a": "پس از پرداخت، اطلاعات فعال‌سازی از طریق پنل کاربری، پیامک و ایمیل برای شما ارسال می‌شود."},
            {"q": "گارانتی محصول چگونه است؟", "a": "تمام محصولات نوبیکس‌شاپ دارای گارانتی اصالت و پشتیبانی کامل هستند."},
        ],
        "custom_fields": _fallback_custom_fields(category),
    }


def _fallback_custom_fields(category: str) -> list:
    if category == "GIFTCARDS":
        return [{"key": "recipient_email", "label": "ایمیل دریافت‌کننده کد", "type": "email", "required": True, "placeholder": "example@mail.com", "options": None}]
    if category in ("AI", "SUBSCRIPTIONS"):
        return [{"key": "account_email", "label": "ایمیل اکانت", "type": "email", "required": True, "placeholder": "example@mail.com", "options": None}]
    return [
        {"key": "account_email", "label": "ایمیل اکانت", "type": "email", "required": True, "placeholder": "example@mail.com", "options": None},
        {"key": "account_password", "label": "رمز عبور", "type": "password", "required": True, "placeholder": "••••••••", "options": None},
    ]


def generate_product_draft(name_fa: str, category: str, hint: str = "") -> dict:
    """Generate a structured product-content draft.

    Returns a dict with keys: description, delivery_text, faq, custom_fields.
    On any failure, returns a deterministic fallback so the form is never empty.
    """
    if not ai_support.is_enabled():
        return _fallback_draft(name_fa or "محصول", category or "FORTNITE")

    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": _build_user_prompt(name_fa or "محصول", category or "FORTNITE", hint)},
    ]
    raw = ai_support.chat_completion(messages, max_tokens=1500, temperature=0.5)
    parsed = _safe_parse_json(raw) if raw else None
    if not parsed:
        return _fallback_draft(name_fa or "محصول", category or "FORTNITE")

    return _normalize_draft(parsed, name_fa, category)


def _normalize_draft(parsed: dict, name_fa: str, category: str) -> dict:
    fallback = _fallback_draft(name_fa or "محصول", category or "FORTNITE")

    description = str(parsed.get("description") or "").strip()
    if len(description) < 20:
        description = fallback["description"]

    delivery_text = str(parsed.get("delivery_text") or "").strip()
    if len(delivery_text) < 10:
        delivery_text = fallback["delivery_text"]

    raw_faq = parsed.get("faq")
    faq: list[dict] = []
    if isinstance(raw_faq, list):
        for item in raw_faq:
            if not isinstance(item, dict):
                continue
            q = str(item.get("q") or item.get("question") or "").strip()[:200]
            a = str(item.get("a") or item.get("answer") or "").strip()[:2000]
            if q and a:
                faq.append({"q": q, "a": a})
    if not faq:
        faq = fallback["faq"]
    faq = faq[:8]

    raw_fields = parsed.get("custom_fields")
    custom_fields: list[dict] = []
    seen_keys: set[str] = set()
    if isinstance(raw_fields, list):
        for idx, raw in enumerate(raw_fields):
            if not isinstance(raw, dict):
                continue
            ftype = str(raw.get("type") or "text").strip().lower()
            if ftype not in {"text", "email", "password", "textarea", "tel", "number", "select"}:
                ftype = "text"
            key_raw = str(raw.get("key") or raw.get("label") or f"field_{idx + 1}").strip()
            key = re.sub(r"[^a-z0-9_]+", "_", key_raw.lower()).strip("_")[:40] or f"field_{idx + 1}"
            if key in seen_keys:
                key = f"{key}_{idx + 1}"
            seen_keys.add(key)
            label = str(raw.get("label") or key).strip()[:120] or key
            placeholder = str(raw.get("placeholder") or "").strip()[:120]
            required = bool(raw.get("required"))
            options = None
            if ftype == "select":
                opts = raw.get("options") or []
                if isinstance(opts, list):
                    options = [str(o).strip()[:80] for o in opts if str(o or "").strip()][:50]
            custom_fields.append({
                "key": key,
                "label": label,
                "type": ftype,
                "required": required,
                "placeholder": placeholder,
                "options": options,
            })
    if not custom_fields:
        custom_fields = fallback["custom_fields"]
    custom_fields = custom_fields[:10]

    return {
        "description": description[:8000],
        "delivery_text": delivery_text[:4000],
        "faq": faq,
        "custom_fields": custom_fields,
    }
