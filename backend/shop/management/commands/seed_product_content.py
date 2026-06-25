"""
One-shot seed for product content (description, delivery_text, faq, custom_fields, 2FA).

Also fixes the broken slug for the Telegram Premium product.

Usage: python manage.py seed_product_content
"""
from django.core.management.base import BaseCommand
from shop.models import Product

SEEDS: dict[str, dict] = {
    "v-bucks": {
        "description": (
            "💎 ویباکس (V-Bucks) ارز داخل بازی فورتنایت\n\n"
            "🎁 با ویباکس می‌توانید:\n"
            "• اسکین‌های انحصاری بخرید\n"
            "• امووت‌ها و رقص‌های جدید باز کنید\n"
            "• بتل‌پس فصل‌ها را فعال کنید\n"
            "• باندل‌های ویژه تهیه کنید\n\n"
            "⚡ تحویل سریع: ۱۵ تا ۴۵ دقیقه\n"
            "🔒 روش فعال‌سازی: ورود به حساب اپیک شما\n"
            "📧 نیاز به: ایمیل و رمز حساب Epic Games\n\n"
            "✅ گارانتی اصالت و پشتیبانی کامل"
        ),
        "delivery_text": "۱. ثبت سفارش و انتخاب پلتفرم\n۲. ورود به حساب اپیک شما\n۳. خرید و دریافت ویباکس (۱۵−۴۵ دقیقه)",
        "faq": [
            {"q": "چگونه ویباکس را دریافت می‌کنم؟", "a": "تیم ما با ورود به حساب اپیک شما، ویباکس را مستقیماً به حسابتان اضافه می‌کند."},
            {"q": "آیا نیاز به رمز عبور حساب دارید؟", "a": "بله، برای فعال‌سازی سریع نیاز به ایمیل و رمز حساب Epic Games داریم. اطلاعات شما کاملاً محرمانه می‌ماند."},
            {"q": "چقدر طول می‌کشد؟", "a": "تحویل ویباکس بین ۱۵ تا ۴۵ دقیقه انجام می‌شود."},
        ],
        "custom_fields": [
            {"key": "account_type", "label": "نوع حساب", "type": "select", "required": True, "placeholder": "انتخاب کنید", "options": ["Epic Games", "PSN", "Xbox"]},
            {"key": "account_email", "label": "ایمیل اکانت", "type": "email", "required": True, "placeholder": "example@mail.com"},
            {"key": "account_password", "label": "رمز عبور", "type": "password", "required": True, "placeholder": "••••••••"},
        ],
        "requires_2fa": True,
        "disable_2fa_text": "2FA را قبل از خرید خاموش کنید",
        "disable_2fa_color": "amber",
    },
    "1000-v-bucks": {
        "description": (
            "💎 ۱۰۰۰ ویباکس (V-Bucks)\n\n"
            "🎁 با ۱۰۰۰ ویباکس می‌توانید:\n"
            "• اسکین‌های معمولی و نادر بخرید\n"
            "• امووت‌ها و رقص‌های جدید باز کنید\n"
            "• آیتم‌های فروشگاه روزانه تهیه کنید\n\n"
            "⚡ تحویل سریع: ۱۵ تا ۴۵ دقیقه\n"
            "🔒 روش فعال‌سازی: ورود به حساب اپیک شما\n"
            "📧 نیاز به: ایمیل و رمز حساب Epic Games\n\n"
            "✅ گارانتی اصالت و پشتیبانی کامل"
        ),
        "delivery_text": "۱. ثبت سفارش و انتخاب پلتفرم\n۲. ورود به حساب اپیک شما\n۳. خرید و دریافت ویباکس (۱۵−۴۵ دقیقه)",
        "faq": [
            {"q": "چگونه ویباکس را دریافت می‌کنم؟", "a": "تیم ما با ورود به حساب اپیک شما، ویباکس را مستقیماً به حسابتان اضافه می‌کند."},
            {"q": "آیا نیاز به رمز عبور حساب دارید؟", "a": "بله، برای فعال‌سازی نیاز به ایمیل و رمز حساب داریم. اطلاعات شما کاملاً محرمانه می‌ماند."},
        ],
        "custom_fields": [
            {"key": "account_type", "label": "نوع حساب", "type": "select", "required": True, "placeholder": "انتخاب کنید", "options": ["Epic Games", "PSN", "Xbox"]},
            {"key": "account_email", "label": "ایمیل اکانت", "type": "email", "required": True, "placeholder": "example@mail.com"},
            {"key": "account_password", "label": "رمز عبور", "type": "password", "required": True, "placeholder": "••••••••"},
        ],
        "requires_2fa": True,
    },
    "fortnite-crew-pack": {
        "description": (
            "🌟 Fortnite Crew - اشتراک ماهانه فورتنایت\n\n"
            "📦 محتویات اشتراک کروپک:\n"
            "• 💎 ۱۰۰۰ ویباکس ماهانه\n"
            "• 🎭 اسکین انحصاری ماه (غیرقابل خرید)\n"
            "• 🎫 بتل‌پس رایگان فصل فعلی\n"
            "• 🎵 Music Pack ویژه\n"
            "• 🎒 Back Bling و Glider خاص\n\n"
            "⚡ زمان تحویل: فعال‌سازی فوری (۵ دقیقه تا ۲ ساعت)\n"
            "🔒 فعال‌سازی روی اکانت شما\n"
            "✅ تمدید خودکار نیست - مدت انتخابی شما اعمال می‌شود"
        ),
        "delivery_text": "۱. ثبت سفارش و انتخاب پلتفرم\n۲. ارسال اطلاعات حساب\n۳. تیم ما طی ۵ دقیقه تا ۲ ساعت اشتراک را فعال می‌کند",
        "faq": [
            {"q": "چگونه اشتراک Fortnite Crew را دریافت می‌کنم؟", "a": "پس از خرید و ارسال اطلاعات حساب، تیم ما طی ۵ دقیقه تا ۲ ساعت اشتراک را روی اکانت شما فعال می‌کند."},
            {"q": "آیا نیاز به رمز عبور حساب دارید؟", "a": "بله، برای فعال‌سازی سریع نیاز به رمز عبور حساب Epic Games، PSN یا Xbox داریم."},
            {"q": "چه زمانی وی‌باکس‌های ماهانه را دریافت می‌کنم؟", "a": "۱۰۰۰ وی‌باکس به صورت خودکار هر ماه به حساب شما اضافه می‌شود."},
            {"q": "آیا می‌توانم اشتراک را لغو کنم؟", "a": "این اشتراک یک‌ماهه بوده و به صورت خودکار تمدید نمی‌شود."},
        ],
        "custom_fields": [
            {"key": "account_type", "label": "نوع حساب", "type": "select", "required": True, "placeholder": "انتخاب کنید", "options": ["Epic Games", "PSN", "Xbox"]},
            {"key": "account_email", "label": "ایمیل اکانت", "type": "email", "required": True, "placeholder": "example@mail.com"},
            {"key": "account_password", "label": "رمز عبور", "type": "password", "required": True, "placeholder": "••••••••"},
        ],
        "requires_2fa": True,
    },
    "fortnite-battle-pass": {
        "description": (
            "🎫 Battle Pass - بتل‌پس فصل فعلی فورتنایت\n\n"
            "🎁 مزایای بتل‌پس:\n"
            "• 🎭 بیش از ۱۰۰ آیتم انحصاری\n"
            "• ✨ اسکین‌های لجندری فصل\n"
            "• 💎 امکان کسب ویباکس (تا ۱۵۰۰ V-Bucks)\n"
            "• 🎵 Music Packs و Emotes ویژه\n\n"
            "⚡ تحویل: ۱۵ تا ۴۵ دقیقه\n"
            "🔒 فعال‌سازی روی اکانت شما\n"
            "✅ بتل‌پس دائمی است و منقضی نمی‌شود"
        ),
        "delivery_text": "۱. ثبت سفارش\n۲. پرداخت امن\n۳. فعال‌سازی بتل‌پس طی ۱۵ تا ۴۵ دقیقه",
        "faq": [
            {"q": "آیا بتل‌پس دائمی است؟", "a": "بله، بتل‌پس خریداری شده برای همیشه در حساب شما باقی می‌ماند و منقضی نمی‌شود."},
            {"q": "چقدر طول می‌کشد؟", "a": "فعال‌سازی بتل‌پس بین ۱۵ تا ۴۵ دقیقه انجام می‌شود."},
        ],
        "custom_fields": [
            {"key": "account_type", "label": "نوع حساب", "type": "select", "required": True, "placeholder": "انتخاب کنید", "options": ["Epic Games", "PSN", "Xbox"]},
            {"key": "account_email", "label": "ایمیل اکانت", "type": "email", "required": True, "placeholder": "example@mail.com"},
            {"key": "account_password", "label": "رمز عبور", "type": "password", "required": True, "placeholder": "••••••••"},
        ],
        "requires_2fa": True,
    },
    "chatgpt-subscription": {
        "description": (
            "🤖 اشتراک ChatGPT Plus\n\n"
            "🎁 با ChatGPT Plus:\n"
            "• دسترسی به GPT-4o\n"
            "• اولویت دسترسی در زمان شلوغی\n"
            "• پاسخ‌دهی سریع‌تر\n"
            "• دسترسی به پلاگین‌ها و قابلیت‌های پیشرفته\n\n"
            "⚡ تحویل: ۱۵ دقیقه تا ۴ ساعت"
        ),
        "delivery_text": "۱. ثبت سفارش\n۲. ارسال ایمیل اکانت ChatGPT\n۳. فعال‌سازی با لینک دعوت طی ۱۵ دقیقه تا ۴ ساعت",
        "faq": [
            {"q": "چگونه اشتراک فعال می‌شود؟", "a": "از طریق لینک دعوت ایمیلی، اشتراک ChatGPT Plus روی حساب فعلی شما فعال می‌شود."},
        ],
        "custom_fields": [
            {"key": "account_email", "label": "ایمیل اکانت ChatGPT", "type": "email", "required": True, "placeholder": "example@mail.com"},
        ],
    },
    "gemini-subscription": {
        "description": (
            "🧠 اشتراک Gemini Advanced\n\n"
            "🎁 دسترسی به پیشرفته‌ترین مدل‌های هوش مصنوعی گوگل\n"
            "با Gemini Advanced از قابلیت‌های کامل هوش مصنوعی گوگل بهره‌مند شوید.\n\n"
            "⚡ تحویل: ۱۵ دقیقه تا ۴ ساعت"
        ),
        "delivery_text": "۱. ثبت سفارش\n۲. ارسال ایمیل اکانت گوگل\n۳. فعال‌سازی طی ۱۵ دقیقه تا ۴ ساعت",
        "faq": [],
        "custom_fields": [
            {"key": "account_email", "label": "ایمیل اکانت گوگل", "type": "email", "required": True, "placeholder": "example@gmail.com"},
        ],
    },
    "spotify-subscription": {
        "description": (
            "🎵 اشتراک Spotify Premium\n\n"
            "🎁 مزایا:\n"
            "• موسیقی بدون تبلیغات\n"
            "• دانلود آفلاین\n"
            "• پخش با کیفیت بالا\n"
            "• اسکیپ نامحدود\n\n"
            "⚡ تحویل: ۱۵ دقیقه تا ۴ ساعت"
        ),
        "delivery_text": "۱. ثبت سفارش\n۲. ارسال ایمیل اکانت Spotify\n۳. فعال‌سازی طی ۱۵ دقیقه تا ۴ ساعت",
        "faq": [
            {"q": "آیا روی اکانت فعلی من فعال می‌شود؟", "a": "بله، اشتراک روی اکانت فعلی شما از طریق لینک دعوت فعال می‌شود."},
        ],
        "custom_fields": [
            {"key": "account_email", "label": "ایمیل اکانت Spotify", "type": "email", "required": True, "placeholder": "example@mail.com"},
        ],
    },
}


def seed_products():
    updated = 0
    for slug, data in SEEDS.items():
        try:
            p = Product.objects.get(slug=slug)
        except Product.DoesNotExist:
            continue
        changed = False
        mapping: dict[str, dict] = {
            "description": "description",
            "delivery_text": "delivery_text",
            "faq": "faq",
            "custom_fields": "custom_fields",
            "requires_2fa": "requires_2fa",
            "disable_2fa_text": "disable_2fa_text",
            "disable_2fa_color": "disable_2fa_color",
        }
        update_fields = []
        for db_field, seed_key in mapping.items():
            if not seed_key:
                continue
            new_val = data.get(seed_key)
            if new_val is None:
                continue
            old_val = getattr(p, db_field)
            if old_val != new_val:
                setattr(p, db_field, new_val)
                update_fields.append(db_field)
                changed = True
        if changed:
            p.save(update_fields=update_fields)
            updated += 1

    return updated


def fix_telegram_slug():
    bad = "nubixshopirproductstelegram-premium-3"
    good = "telegram-premium"
    try:
        p = Product.objects.get(slug=bad)
    except Product.DoesNotExist:
        return None
    if Product.objects.filter(slug=good).exists():
        return f"cannot rename {bad} → {good}: target slug already taken"

    p.slug = good
    p.custom_fields = [
        {"key": "telegram_id", "label": "آيدي تلگرام", "type": "text", "required": True, "placeholder": "@username یا ID عددی"},
    ]
    p.requires_2fa = False
    p.description = (
        "✈️ اشتراک تلگرام پرمیوم\n\n"
        "🎁 مزایای تلگرام پرمیوم:\n"
        "• آپلود فایل تا ۴ گیگابایت\n"
        "• دانلود با سرعت بالاتر\n"
        "• استیکر و ایموجی اختصاصی\n"
        "• تبدیل ویس به متن\n"
        "• بدون تبلیغات\n"
        "• پوشه‌های پیشرفته و مدیریت بهتر چت‌ها\n\n"
        "⚡ تحویل: ۱ تا ۱۲ ساعت\n"
        "🔒 روش فعال‌سازی: ارسال اکانت به سرور رسمی تلگرام\n\n"
        "✅ گارانتی اصالت و پشتیبانی کامل"
    )
    p.delivery_text = "۱. ثبت سفارش و پرداخت\n۲. ارسال آيدي تلگرام\n۳. فعال‌سازی طی ۱ تا ۱۲ ساعت کاری"
    p.faq = [
        {"q": "چگونه اشتراک تلگرام پرمیوم را دریافت می‌کنم؟", "a": "پس از خرید و ارسال آيدي تلگرام، تیم ما اشتراک را طی ۱ تا ۱۲ ساعت روی اکانت شما فعال می‌کند."},
        {"q": "آیا نیاز به رمز عبور یا کد تأیید دارید؟", "a": "خیر، فقط آيدي تلگرام شما کافی است. بدون نیاز به رمز یا کد ورود."},
        {"q": "آیا اشتراک دائمی است؟", "a": "مدت اشتراک طبق پلن انتخابی شماست و پس از اتمام باید تمدید شود."},
    ]
    p.save(update_fields=["slug", "custom_fields", "requires_2fa", "description", "delivery_text", "faq"])
    return f"renamed {bad} → {good} + seeded content"


class Command(BaseCommand):
    help = "Seed product descriptions, FAQs, custom fields, and fix the Telegram slug."

    def handle(self, *args, **options):
        count = seed_products()
        self.stdout.write(self.style.SUCCESS(f"Seeded content for {count} product(s)."))
        result = fix_telegram_slug()
        if result:
            self.stdout.write(self.style.SUCCESS(result))
        else:
            self.stdout.write(self.style.WARNING("No slug fix needed (bad slug not found or already fixed)."))
