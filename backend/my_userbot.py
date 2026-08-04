import os
import sys
import time
import asyncio
import random
import json
import re
import logging
from logging.handlers import RotatingFileHandler
from openai import OpenAI
from telethon import TelegramClient, events
from urllib.parse import urlparse

# --- 0. DJANGO SETUP (برای دسترسی به دیتابیس) ---
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'jinxfamily.settings')
sys.path.insert(0, '/var/www/public/backend')
import django
django.setup()

from django.db.models import Q, Case, When, Value, IntegerField
from django.db import connections, close_old_connections
from shop.models import Order, Product, ProductVariant, UserProfile, DiscountCode
from django.contrib.auth.models import User
from asgiref.sync import sync_to_async

# --- DATABASE HELPER FUNCTIONS ---
STATUS_FA = {
    "pending": "در انتظار پرداخت",
    "paid": "پرداخت شده",
    "registered": "ثبت شده",
    "processing": "در حال انجام",
    "completed": "انجام شده ✅",
    "needs_2fa": "نیاز به کد 2FA ❗",
    "needs_tr_region": "نیاز به تغییر ریجن به ترکیه ❗",
    "needs_xbox_info": "مشکل ایکس باکس ❌",
    "invalid_info": "اطلاعات غلط/ناقص ❌",
    "canceled": "لغو شده",
    "refunded": "مسترد شده",
}

@sync_to_async
def lookup_order(tracking_code: str) -> dict | None:
    """جستجوی سفارش با کد پیگیری"""
    tracking_code = tracking_code.strip().lstrip('#')
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
    """تحلیل آزاد متن برای پیدا کردن محصول وقتی سوال قیمت واضح نیست"""
    normalized = re.sub(r'[^\w\u0600-\u06FF\s-]', ' ', text).lower()
    terms = [t for t in normalized.split() if len(t) >= 3]
    if not terms:
        return []

    query = Q()
    for term in terms:
        query |= Q(name_fa__icontains=term) | Q(slug__icontains=term)

    close_old_connections()
    products = Product.objects.filter(query, active=True).distinct()[:5]
    return [_format_product_entry(p) for p in products]

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
    """استخراج کد پیگیری از متن"""
    # الگوهای مختلف کد پیگیری
    patterns = [
        r'#(\d{4,6})',           # #1234
        r'کد[:\s]*(\d{4,6})',    # کد: 1234 یا کد 1234
        r'پیگیری[:\s]*(\d{4,6})', # پیگیری: 1234
        r'\b(\d{4})\b',          # عدد 4 رقمی تنها
    ]
    matches = []
    for pattern in patterns:
        matches.extend(re.findall(pattern, text))
    return matches[-1] if matches else None

def extract_product_query(text: str) -> str | None:
    """استخراج نام محصول از سوال قیمت"""
    patterns = [
        r'قیمت\s+(.+?)[\s؟?]*$',
        r'(.+?)\s+چند[ه]?[\s؟?]*$',
        r'(.+?)\s+قیمت',
        r'(.+?)\s+دارید[؟?]*$',
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
    """فرمت کردن پاسخ سفارش به صورت انسانی"""
    if not order_data.get("found"):
        return f"سلام{' ' + customer_name if customer_name else ''} عزیز، سفارشی با کد {order_data.get('tracking_code', '')} پیدا نکردم 🤔 کد رو یه بار دیگه چک کن لطفاً."

    time_ago = format_time_ago(order_data.get('created_at_raw') or order_data['created_at'])
    name_part = f" {customer_name}" if customer_name else ""
    status = order_data['status']

    # اطلاعات اکانت برای تأیید
    epic = order_data.get('epic_username', '')
    phone_last4 = order_data.get('phone', '')
    items = order_data.get('items', [])

    # ساخت خط اطلاعات
    account_info = ""
    if epic:
        account_info = f"📋 اکانت: {epic}"
        if phone_last4:
            account_info += f" | موبایل: ***{phone_last4}"

    # پاسخ طبیعی بر اساس وضعیت
    if status == 'completed':
        response = f"سلام{name_part} عزیز، بله سفارشت که {time_ago} ثبت کردی تکمیل شده ✅\n"
        response += f"اکانت {epic} فعال شد، چک کن ببین 🎮"
        if account_info:
            response += f"\n{account_info}"

    elif status == 'processing':
        response = f"سلام{name_part} عزیز، بله سفارشت رو دیدم که {time_ago} ثبت کردی 👀\n"
        if account_info:
            response += f"{account_info}\n"
        response += f"الان تو صف انجامه، یکم صبر کن تکمیل میشه 🙏"
        if order_data['rush_order']:
            response += "\n🚀 سفارش فوری هم زدی، اولویت داری."

    elif status == 'needs_2fa':
        response = f"سلام{name_part} عزیز، سفارشت که {time_ago} ثبت کردی نیاز به کد داره ❗\n"
        if account_info:
            response += f"{account_info}\n"
        response += f"کد تأیید دو مرحله‌ای اکانت {epic} رو برام بفرست."

    elif status == 'needs_tr_region':
        response = f"سلام{name_part} عزیز، سفارشت که {time_ago} ثبت کردی یه مشکل داره ❗\n"
        if account_info:
            response += f"{account_info}\n"
        response += f"ریجن اکانت {epic} باید ترکیه باشه. تو سایت راهنماش هست."

    elif status == 'invalid_info':
        response = f"سلام{name_part} عزیز، سفارشت که {time_ago} ثبت کردی اطلاعاتش مشکل داره ❌\n"
        if account_info:
            response += f"{account_info}\n"
        response += f"ایمیل و رمز صحیح اکانت رو برام بفرست لطفاً."

    elif status == 'paid' or status == 'registered':
        response = f"سلام{name_part} عزیز، بله سفارشت رو دیدم که {time_ago} ثبت کردی ✅\n"
        if account_info:
            response += f"{account_info}\n"
        if items:
            response += f"🛒 {' | '.join(items)}\n"
        response += f"پرداخت شده و تو صف قرار گرفته، بزودی انجام میشه 🙏"

    elif status == 'pending':
        response = f"سلام{name_part} عزیز، سفارشت که {time_ago} ثبت کردی هنوز پرداخت نشده 💳\n"
        if account_info:
            response += f"{account_info}\n"
        response += f"اگه پرداخت کردی رسید رو بفرست چک کنم."

    elif status == 'canceled':
        response = f"سلام{name_part} عزیز، سفارشت که {time_ago} ثبت کردی لغو شده ❌"
        if account_info:
            response += f"\n{account_info}"

    elif status == 'refunded':
        response = f"سلام{name_part} عزیز، سفارشت که {time_ago} ثبت کردی برگشت خورده و مبلغش برگردونده شد ✅"
        if account_info:
            response += f"\n{account_info}"

    else:
        response = f"سلام{name_part} عزیز، سفارشت رو دیدم که {time_ago} ثبت کردی.\n"
        if account_info:
            response += f"{account_info}\n"
        response += f"وضعیت: {order_data['status_fa']}"

    return response

# --- 1. CONFIGURATION & CREDENTIALS ---
API_ID = 23078041
API_HASH = 'b2c8461fa3cfce1a201aeb9257e1996e'
SESSION_NAME = 'arshia_session'

# OpenRouter / AI Config
OPENROUTER_API_KEY = "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"
MODEL_NAME = "x-ai/grok-4.1-fast"  # main chat model for JinxFamily bot
APP_NAME = "JinxFamily AI"
SITE_URL = "https://jinxfamily.shop"

import python_socks

# --- FIXED PROXY CONFIGURATION ---
PROXY_PORT = 10809
PROXY_URL = f"http://127.0.0.1:{PROXY_PORT}"

# Apply to Environment (for OpenRouter)
os.environ["http_proxy"] = PROXY_URL
os.environ["https_proxy"] = PROXY_URL

# Apply to Telegram
TELEGRAM_PROXY = {
    'proxy_type': 'http',
    'addr': '127.0.0.1',
    'port': PROXY_PORT
}
print(f"🌐 Proxy Configured: 127.0.0.1:{PROXY_PORT}")

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
CHAT_LOG_DIR = os.path.join("logs", "chat_logs")
CHAT_LOG_FILE = os.path.join(CHAT_LOG_DIR, "arshia_chat_logs.jsonl")
LLM_LOG_FILE = os.path.join(CHAT_LOG_DIR, "llm_requests.jsonl")
PENDING_TTL_SECONDS = 600
MAX_TRACKING_RETRIES = 3

# Greeting throttling / sanitization helpers
GREET_KEYWORDS = ("سلام", "درود", "خسته نباشید", "hi", "hey")
GREET_PREFIXES = ("سلام", "سلام وقتتون بخیر", "درود", "درود وقت بخیر")
# فقط علائم پایان جمله که لحن رو سرد/رباتی میکنه حذف بشه
END_PUNCTUATION_REGEX = re.compile(r"[\\.!…]+")
EMOJI_REGEX = re.compile(r"[\U0001F300-\U0001FAFF\U00002700-\U000027BF]+")
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

def load_memory():
    if os.path.exists(MEMORY_FILE):
        try:
            with open(MEMORY_FILE, 'r', encoding='utf-8') as f:
                return json.load(f)
        except:
            return {}
    return {}

def save_memory(history_data):
    try:
        with open(MEMORY_FILE, 'w', encoding='utf-8') as f:
            json.dump(history_data, f, ensure_ascii=False, indent=2)
    except Exception as e:
        logger.exception("Error saving memory")

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

def is_greeting(text: str) -> bool:
    lowered = text.strip().lower()
    return any(key in lowered for key in GREET_KEYWORDS)

def strip_leading_greeting(text: str) -> str:
    for prefix in GREET_PREFIXES:
        if text.startswith(prefix):
            return text[len(prefix):].lstrip()
    return text

def normalize_style(text: str) -> str:
    """Make text less repetitive/emoji-heavy, brand it as JinxFamily, drop internal notes."""
    if not text:
        return text
    # drop internal note part if present (only for internal history / AI, نه پیام کاربر)
    if "\n(یادداشت:" in text:
        text = text.split("\n(یادداشت:")[0].rstrip()
    # rename old persona name to brand
    text = text.replace("عرشیا", "جینکس فمیلی")
    text = text.replace("Arshia", "Jinx Family")
    # سبک نوشتار رو طبیعی نگه دار؛ ایموجی و کلمات صمیمی رو کامل حذف نکن
    text = re.sub(r"[ ]{2,}", " ", text).strip()
    return text

def apply_assistant_tone_rules(text: str) -> str:
    """Remove botty slang and keep tone warm."""
    if not text:
        return text
    replacements = {
        "مشتی": "عزیز",
        "مُشتی": "عزیز",
        "جینکس": "",
        "jinx": "",
    }
    for bad, good in replacements.items():
        text = text.replace(bad, good)
    # تمیزکاری فاصله‌ها
    text = re.sub(r"[ ]{2,}", " ", text).strip()
    return text

def sanitize_reply(text: str) -> str:
    cleaned = END_PUNCTUATION_REGEX.sub(" ", text)
    # بازگرداندن آدرس سایت به شکل قابل کلیک
    cleaned = cleaned.replace("JinxFamily.shop", "JinxFamily.shop")
    cleaned = re.sub(r"[ ]{2,}", " ", cleaned).strip()
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
            content = item.get("content", "")
            item["content"] = normalize_style(content)
            cleaned.append(item)
        history_data[uid] = cleaned[-(MAX_HISTORY + 5):]
    return history_data

# Load existing memory on startup
user_histories = normalize_history_style(load_memory())
user_state = {}

def get_user_state(user_id: str) -> dict:
    state = user_state.setdefault(user_id, {"last_greet": 0.0, "pending": {}})
    if "pending" not in state:
        state["pending"] = {}
    return state

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

# Message batching system - جمع کردن پیام‌های پشت سرهم
message_buffer = {}  # user_id -> list of messages
buffer_timers = {}   # user_id -> asyncio.Task
DEBOUNCE_SECONDS = 3  # چند ثانیه صبر کنه تا پیام‌های بعدی بیاد

# Human takeover - وقتی خودت داری چت می‌کنی، بات دخالت نکنه
human_active_chats = {}  # user_id -> last_human_message_time
HUMAN_TAKEOVER_SECONDS = 60  # pause duration after human sends message before bot resumes

GOLDEN_EXAMPLES = """
User: سلام خسته نباشید
Jinx: سلام در خدمتم، خوش اومدی به جینکس فمیلی، چی لازم داری
---
User: کروپک چنده؟
Jinx: قیمت دقیق تو سایت هست، همین الان میتونی چک کنی
jinxfamily.shop
---
User: داداش کی سفارش من انجام میشه؟ ۳ ساعت شد
Jinx: حق داری نگران شی، بابت تاخیر معذرت میخوام، سفارشات به ترتیب دارن انجام میشن، اگه کد پیگیری داری بفرست تا دقیق بگم کجاست
---
User: اکانتم بن نشه؟
Jinx: خیالت راحت، خریدها کاملا قانونی و مستقیم از Epic انجام میشه
---
User: کد پیگیری: 2990 چرا انجام نشده؟
Jinx: کد رو گرفتم، الان چک میکنم، اگه لازمه اطلاعات اکانت رو دوباره بفرست
---
User: داداش این کد تخفیف کار نمیکنه
Jinx: بذار بررسی کنم، کد درستش JINX-FAMILY هست
---
User: سفارش من تکمیل شد؟
Jinx: بله سفارش انجام شده، اگه چیزی جا مونده بهم بگو تا پیگیری کنم
---
User: شماره کارت میدی کارت به کارت کنم؟
Jinx: پرداخت فقط از طریق سایت ممکنه، درگاه امن فعاله
jinxfamily.shop
---
User: من ایکس باکس ندارم مشکلی نیست؟
Jinx: نه مشکلی نیست، با اپیک هم فعال میکنیم
"""

SYSTEM_PROMPT = """
You are a customer support assistant for a Persian-speaking Fortnite item store.
The store sells and activates Fortnite items (V-Bucks, skins, bundles, etc.) for customers, mostly via Telegram and website chat.

STORE FACTS (use when user asks about اعتبار/قانونی بودن):
- فروشگاه جینکس فمیلی دفتر فعال در ازمیر ترکیه و دفتر رسمی ثبت‌شده در تهران (منطقه ۸) دارد
- سفارش‌ها مستقیم از Epic Games ثبت می‌شوند و حساب‌ها احراز هویت‌شده هستند
- اینماد فعال و درگاه زرین‌پال امن داریم و رضایت مشتری‌ها بالاست
- آدرس سایت: jinxfamily.shop

IDENTITY & HONESTY:
- If the user asks "انسانی؟ رباتی؟", reply with: "من دستیار هوشمند فروشگاهم 😊 کارم اینه سریع به سوالای معمولی جواب بدم. هر جا نیاز به بررسی خاص یا تصمیم‌گیری باشه، همکار انسانی‌مون میاد تو چت و ادامه رو اون پیگیری می‌کنه."
- Never claim to be a human. Never use phrases like "I am a large language model". Always call yourself "دستیار هوشمند".

ESCALATION RULES:
- Escalate to a human when:
  - کاربر ۲–۳ بار پشت‌سرهم بگه «ادمین واقعی / پشتیبان انسانی / با مدیر کار دارم».
  - کاربر عصبانی / فحش / تهدید به شکایت.
  - سوال درباره مبالغ سنگین، شکایت جدی، ریفاند / برگشت پول، مشکل حقوقی، امنیتی، یا اکانت بن شده.
  - مکالمه طولانی شد و جواب نگرفت (مثلاً ۸–۱۰ پیام رفت‌وبرگشت و هنوز حل نشده).
- When escalating, say: "این مورد نیاز به بررسی دستی داره. الان تیکتت رو برای همکار انسانی ثبت کردم ✅ زمان تقریبی پاسخ: حدود X دقیقه / ساعت. تا وقتی جواب بدن اگر سوال دیگه‌ای داری من در خدمتم." (replace X with the team’s ETA).

TELEGRAM UX:
- در اولین پیام یک منو با دکمه‌ها پیشنهاد بده:
  🛒 خرید و فعال‌سازی جدید
  📦 پیگیری سفارش قبلی
  ⏱ زمان تحویل و موجودی
  💳 روش‌های پرداخت
  👨‍💻 ارتباط با پشتیبان انسانی
- همیشه تا حد ممکن با دکمه جواب بده نه فقط متن، تا حس نظم بده.

RULES:
- Always reply in NATURAL, CASUAL PERSIAN (FARSI), not English.
- Write like a friendly young gamer from Iran, but keep it respectful.
- Use simple sentences, small emojis sometimes (😊⚡🎮), but not after every line.
- Keep answers short and clear. 1–4 sentences in most replies.
- If you need info (order ID, username, screenshot), ask only ONE clear question at a time.
- If the user is angry, stay calm, apologize once clearly, and focus on solving the problem.
- Never lie. If you don’t know something or it depends on a human, say that a human teammate will check it.
- Do NOT use slang like "مشتی" or "جینکس". Use warm words مثل "عزیز" یا "جناب" در صورت نیاز.
- If user فقط سلام یا احوالپرسی خالی گفت، جواب بده: "سلام در خدمتم".
- Avoid ending sentences with "." or "!" unless really needed; keep text طبیعی و صمیمی.

ABOUT YOUR IDENTITY:
- If the user asks if you are a bot or human, say you are an AI assistant (دستیار هوشمند) for the store.
- Emphasize that you help them get faster answers to common questions, and that a human can join for special cases.
- Do NOT claim to be a human. Do NOT make up fake human names or stories.

WHEN TO ESCALATE TO A HUMAN:
- The user repeatedly asks for a human (e.g., 'ادمین واقعی', 'پشتیبان انسانی', 'با مدیر کار دارم') 2 or more times.
- The user is very angry, using insults, or threatens complaints.
- Questions about refunds, big payment issues, account bans, legal/serious complaints.
- The conversation is going in circles for more than 8–10 messages without solution.
When escalation is needed, say in Persian that you will create a ticket for a human teammate, give an approximate response time, and ask if they have any extra info to add.

TOPICS YOU CAN SAFELY ANSWER:
- What products we sell (Fortnite V-Bucks, skins, bundles, giftcards, etc.).
- Approximate delivery/activation times, tracking the status if user gives order details.
- Basic troubleshooting (e.g., user gave wrong Epic ID, needs to send screenshot).
- General questions about how the process works.
- Explaining that we respect rules, need correct information, and parental permission for underage buyers, etc.

STYLE:
- Always be polite.
- Use informal 'تو' style for normal chats, unless the customer is clearly very formal.
- Avoid long paragraphs. Use line breaks if needed.
- If there's any risk of misunderstanding, repeat the key detail (price, delivery time, platform, etc.) clearly.

Now wait for the user's message and answer in Persian only.
"""

# --- 4. TELEGRAM & BOT LOGIC ---
print(f"🚀 Initializing JinxFamily AI (JinxFamily Persona)...")

try:
    ai_client = OpenAI(
        base_url="https://openrouter.ai/api/v1",
        api_key=OPENROUTER_API_KEY,
    )
    client = TelegramClient(SESSION_NAME, API_ID, API_HASH, proxy=TELEGRAM_PROXY)
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
            content = msg.text.strip()
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

async def process_buffered_messages(user_id, chat_id, sender):
    """پردازش همه پیام‌های جمع شده برای یک کاربر"""
    global message_buffer, buffer_timers

    last_event = None
    last_message_id = None

    try:
        await asyncio.sleep(DEBOUNCE_SECONDS)

        if user_id not in message_buffer or not message_buffer[user_id]:
            return

        messages = message_buffer[user_id]
        message_buffer[user_id] = []

        all_texts = [m["text"] for m in messages if m["text"]]
        if not all_texts:
            return

        combined_text = "\n".join(all_texts) if len(all_texts) > 1 else all_texts[0]
        last_message_id = messages[-1]["message_id"]
        last_event = messages[-1]["event"]

        print(f"📦 Processing {len(messages)} batched messages from {sender.first_name}: {combined_text[:100]}...")

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
            },
        )

        state = get_user_state(user_id)
        recently_greeted = (now - state["last_greet"]) < 75

        # === پردازش محلی (بدون LLM) برای صرفه‌جویی ===

        # 0. سلام/احوالپرسی خالی
        if is_greeting(combined_text):
            remaining = strip_leading_greeting(combined_text).strip()
            if not remaining:
                greeting_reply = "در خدمتم" if recently_greeted else "سلام در خدمتم"
                async with client.action(chat_id, 'typing'):
                    await asyncio.sleep(0.2)
                    sent_message = await last_event.reply(greeting_reply)
                state["last_greet"] = now
                log_chat_event(user_id, "assistant", greeting_reply, {
                    "in_reply_to": last_message_id,
                    "message_id": getattr(sent_message, "id", None),
                    "source": "local_greeting",
                    "latency_ms": int((time.time() - now) * 1000),
                })
                return

        # 1. چک کردن کد پیگیری (با حافظه کوتاه‌مدت)
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

            print(f"🔍 Found tracking code: {tracking_code} (attempt {pending['attempts']})")
            order_data = await lookup_order(tracking_code)
            if order_data is None:
                logger.error("Order lookup failed or returned None for %s (attempt %s)", tracking_code, pending["attempts"])
                if pending["attempts"] >= MAX_TRACKING_RETRIES:
                    error_reply = (
                        f"سلام، کد {tracking_code} رو دارم ولی اتصال به دیتابیس سایت هنوز باز نشد. "
                        "لطفاً اسکرین‌شات سفارش رو بفرست تا دستی چک کنم."
                    )
                else:
                    error_reply = (
                        f"سلام، کد {tracking_code} رو گرفتم ولی الان به دیتابیس وصل نشدم. "
                        "یه لحظه صبر کن دوباره تست می‌کنم؛ اگه عجله داری اسکرین‌شات سفارش رو بفرست."
                    )
                async with client.action(chat_id, 'typing'):
                    await asyncio.sleep(0.3)
                    sent_message = await last_event.reply(error_reply)
                    log_chat_event(user_id, "assistant", error_reply, {
                        "in_reply_to": last_message_id,
                        "message_id": getattr(sent_message, "id", None),
                        "source": "database_error",
                        "latency_ms": int((time.time() - now) * 1000),
                        "tracking_code": tracking_code,
                        "attempt": pending["attempts"],
                    })
                return

            if order_data.get("found"):
                clear_pending(state)
                customer_name = (getattr(sender, "first_name", "") or "").strip()
                reply = format_order_response(order_data, customer_name)
                async with client.action(chat_id, 'typing'):
                    await asyncio.sleep(0.5)
                    sent_message = await last_event.reply(reply)
                    print(f"📤 [LOCAL] Order status: {reply[:80]}...")
                    log_chat_event(user_id, "assistant", reply, {
                        "in_reply_to": last_message_id,
                        "message_id": getattr(sent_message, "id", None),
                        "source": "database",
                        "latency_ms": int((time.time() - now) * 1000),
                        "tracking_code": tracking_code,
                    })
                return
            else:
                clear_pending(state)
                not_found_reply = f"سلام، کد {tracking_code} رو پیدا نکردم. لطفاً چک کن یا اسکرین‌شات سفارش رو بفرست."
                async with client.action(chat_id, 'typing'):
                    await asyncio.sleep(0.3)
                    sent_message = await last_event.reply(not_found_reply)
                    log_chat_event(user_id, "assistant", not_found_reply, {
                        "in_reply_to": last_message_id,
                        "message_id": getattr(sent_message, "id", None),
                        "source": "database_not_found",
                        "latency_ms": int((time.time() - now) * 1000),
                        "tracking_code": tracking_code,
                    })
                return

        # 2. چک کردن سوال قیمت
        product_query = extract_product_query(combined_text)
        list_request = wants_product_list(combined_text)
        if product_query or list_request:
            print(f"🔍 Product intent detected: {product_query or 'list'}")
            results = []
            if product_query:
                results = await search_product(product_query)
                if not results:
                    results = await find_products_in_text(combined_text)
            if not results and list_request:
                results = await list_top_products(limit=6)

            if results:
                if len(results) == 1:
                    p = results[0]
                    reply = (
                        f"💰 {p['name']}: {p['price']} تومان\n"
                        f"🔗 لینک مستقیم: {p['url']}\n"
                        "🛒 خرید: JinxFamily.shop"
                    )
                else:
                    lines = []
                    for p in results:
                        lines.append(f"• {p['name']}: {p['price']} تومان – {p['url']}")
                    reply = "💰 چند گزینه پیدا کردم:\n" + "\n".join(lines) + "\n\n🛒 خرید: JinxFamily.shop"

                async with client.action(chat_id, 'typing'):
                    await asyncio.sleep(0.3)
                    sent_message = await last_event.reply(reply)
                    print(f"📤 [LOCAL] Product price/list: {reply[:80]}...")
                    log_chat_event(user_id, "assistant", reply, {
                        "in_reply_to": last_message_id,
                        "message_id": getattr(sent_message, "id", None),
                        "source": "database",
                        "latency_ms": int((time.time() - now) * 1000),
                    })
                return

        # === اگه پردازش محلی نشد، برو سراغ LLM ===

        # مدیریت حافظه
        if user_id not in user_histories or not user_histories[user_id]:
            user_histories[user_id] = await fetch_telegram_history(user_id)

        normalized_text = normalize_style(combined_text)
        current_list = user_histories[user_id]
        if not current_list or current_list[-1].get('content') != normalized_text:
            user_histories[user_id].append({"role": "user", "content": normalized_text})

        pacing_hint = (
            "یادآوری لحن و محدوده: تو پشتیبان جینکس فمیلی هستی و کاربر رو مهربون و راضی نگه دار. "
            "فقط به سوالات مرتبط با فروشگاه، فورتنایت، سفارش، پرداخت و اکانت جواب بده. "
            "اگه سوال بی‌ربط پرسید، خیلی محترمانه و کوتاه بگو که فقط درباره خرید و سفارش کمک میکنی و بعد بپرس چه کمکی از دستت برمیاد. "
            "از کلمات «مشتی» استفاده نکن. "
            "جواب‌ها کوتاه و جمع‌بندی‌شده باشه، مخصوصا وقتی چند پیام پشت سرهم اومده."
        )

        messages_payload = [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "system", "content": pacing_hint},
        ] + user_histories[user_id][-MAX_HISTORY:]

        req_body = {
            "model": MODEL_NAME,
            "messages": messages_payload,
            "extra_headers": {"HTTP-Referer": SITE_URL, "X-Title": APP_NAME},
            "metadata": {"user_id": user_id},
        }

        try:
            # درخواست به هوش مصنوعی
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
            reply = trim_reply(sanitize_reply(reply))
            if recently_greeted and is_greeting(reply):
                reply = strip_leading_greeting(reply) or reply
            if not reply:
                reply = "باشه، در خدمتم."
            if is_greeting(reply):
                state["last_greet"] = now

            # فیلتر کردن پاسخ‌های IGNORE و NO_REPLY
            reply_upper = reply.strip().upper()

            # NO_REPLY = پیام نیاز به جواب نداره، فقط ری‌اکت قلب بزن
            if reply_upper == "NO_REPLY":
                print(f"❤️ Reacting with heart to: {combined_text[:50]}...")
                log_chat_event(
                    user_id,
                    "system",
                    "heart_reaction",
                    {"reason": "no_reply_needed", "original_text": combined_text},
                )
                try:
                    await client.send_reaction(chat_id, last_message_id, "❤️")
                except Exception as e:
                    logger.exception("Failed to send reaction for NO_REPLY")
                return

            # IGNORE = نفهمیده یا نامناسب
            if reply_upper == "IGNORE" or "I'm sorry" in reply or is_refusal(reply):
                logger.info("Unknown or irrelevant request from %s, forwarding", user_id)
                try:
                    if last_message_id is not None:
                        await client.send_reaction(chat_id, last_message_id, "❤️")
                except Exception as e:
                    logger.exception("Failed to send reaction before forwarding")
                log_chat_event(
                    user_id,
                    "system",
                    "forwarded_to_saved_messages",
                    {"reason": "ignore_or_refusal", "original_reply": reply},
                )
                await last_event.forward_to('me')
                return

            # آپدیت حافظه
            user_histories[user_id].append({"role": "assistant", "content": reply})
            if len(user_histories[user_id]) > MAX_HISTORY + 5:
                user_histories[user_id] = user_histories[user_id][-(MAX_HISTORY+5):]
            save_memory(user_histories)

            # ارسال پاسخ
            async with client.action(chat_id, 'typing'):
                base_delay = 0.2 + (len(reply) * 0.01) + random.uniform(0.0, 0.3)
                await asyncio.sleep(min(base_delay, 2.0))

                sent_message = await last_event.reply(reply)
                print(f"📤 JinxFamily: {reply}")
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
                
        except Exception as e:
            logger.exception("Unhandled error while processing message for %s", user_id)
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
            log_chat_event(
                user_id,
                "system",
                "error",
                {"error": str(e)},
            )
            try:
                await last_event.forward_to('me')
            except:
                pass

    except Exception:
        logger.exception("process_buffered_messages crashed for %s", user_id)
        if last_event is not None:
            try:
                fallback_reply = "یه خطای داخلی پیش اومد، دوباره دارم پیام‌تون رو بررسی می‌کنم."
                async with client.action(chat_id, 'typing'):
                    await asyncio.sleep(0.3)
                    sent_message = await last_event.reply(fallback_reply)
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
    """وقتی خودت پیام میدی، بات رو برای اون چت غیرفعال کن"""
    user_id = str(event.chat_id)
    human_active_chats[user_id] = time.time()
    print(f"👤 Human takeover for {user_id} - bot paused for {HUMAN_TAKEOVER_SECONDS}s")


@client.on(events.NewMessage(incoming=True, func=lambda e: e.is_private))
async def handle_new_message(event):
    """دریافت پیام و اضافه کردن به بافر"""
    global message_buffer, buffer_timers

    sender = await event.get_sender()
    if sender.bot or sender.is_self:
        return

    user_id = str(event.chat_id)

    # آیا پیام حاوی کد پیگیری/سوال محصول است؟ (در این حالت سکوت انسانی را نادیده بگیر)
    user_text = event.raw_text.strip()
    priority_intent = bool(
        extract_tracking_code(user_text)
        or extract_product_query(user_text)
        or wants_product_list(user_text)
    )

    # چک کن که آیا خودت داری با این کاربر چت می‌کنی
    if user_id in human_active_chats:
        last_human_msg = human_active_chats[user_id]
        if time.time() - last_human_msg < HUMAN_TAKEOVER_SECONDS and not priority_intent:
            print(f"🤫 Bot silent - human active in chat {user_id}")
            return  # بات ساکت بمونه، تو داری جواب میدی
        else:
            # تایم اوت شده، بات دوباره فعال
            del human_active_chats[user_id]

    media_type = get_media_type(event)
    message_id = getattr(event, "id", None) or getattr(getattr(event, "message", None), "id", None)

    # مدیا بدون متن - فقط فوروارد کن
    if media_type and not user_text:
        print(f"📎 Media-only ({media_type}) from {sender.first_name} - skipping")
        log_chat_event(
            user_id, "user", f"[{media_type.upper()}]",
            {"message_id": message_id, "name": sender.first_name, "media_type": media_type, "skipped": True}
        )
        await event.forward_to('me')
        return

    # ایموجی تکراری spam - نادیده بگیر
    if user_text and len(user_text) < 20 and all(c in "🤣😂😅😆😁😄😃😀🙂😊😇🥰😍🤩😘😗☺😚😙🥲😋😛😜🤪😝❤️💜💙💚💛🧡🤎🖤🤍💔❤️‍🔥💯👍👎✅❌🔥💀😭😈" for c in user_text.replace(" ", "")):
        # فقط ایموجی - اگه قبلاً هم ایموجی فرستاده بود، نادیده بگیر
        if user_id in message_buffer and message_buffer[user_id]:
            last_msg = message_buffer[user_id][-1]["text"]
            if last_msg and all(c in "🤣😂😅😆😁😄😃😀🙂😊😇🥰😍🤩😘😗☺😚😙🥲😋😛😜🤪😝❤️💜💙💚💛🧡🤎🖤🤍💔❤️‍🔥💯👍👎✅❌🔥💀😭😈" for c in last_msg.replace(" ", "")):
                print(f"🚫 Ignoring spam emoji from {sender.first_name}")
                return

    print(f"📩 Buffering from {sender.first_name}: {user_text[:50]}...")

    # اضافه کردن به بافر
    if user_id not in message_buffer:
        message_buffer[user_id] = []

    message_buffer[user_id].append({
        "text": user_text,
        "message_id": message_id,
        "event": event,
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
