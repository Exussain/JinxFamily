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
            "🤖 **راهنمای جامع خرید اشتراک ChatGPT Plus (چت جی پی تی پلاس) با جدیدترین نسل هوش مصنوعی GPT-5.6 و امکانات سال ۲۰۲۶**\n\n"
            "اشتراک **ChatGPT Plus** دروازه ورود به قدرتمندترین اکوسیستم هوش مصنوعی جهان از شرکت OpenAI است. با معرفی نسل جدید **GPT-5.6** و مدل پرچم‌دار **Sol**، داشتن اکانت پلاس دیگر فقط یک ابزار چت ساده نیست؛ بلکه یک دستیار هوشمند و همکار تمام‌عیار برای استدلال سنگین، برنامه‌نویسی تخصصی، تحقیقات عمیق (Deep Research) و انجام خودکار کارهای پیچیده در محیط **Agent Mode** و **ChatGPT Work** است.\n\n"
            "--- \n\n"
            "### 🌟 **ویژگی‌ها و قابلیت‌های نسل جدید ChatGPT Plus (۲۰۲۶)**\n"
            "• **دسترسی به نسل جدید GPT-5.6 (مدل Sol & Terra)**: استفاده بدون محدودیت از جدیدترین و هوشمندترین مدل استدلالی و عامل‌محور (Agentic) OpenAI با قدرت پردازش بی‌نظیر.\n"
            "• **ابزار تحقیقات عمیق (Deep Research)**: جستجوی هوشمند در صدها منبع وب و سند، تحلیل خودکار داده‌ها و ارائه گزارش‌های جامع و ارجاع‌دار در کمتر از چند دقیقه.\n"
            "• **حالت عامل هوشمند (Agent Mode & Operator)**: اجرای خودکار فرآیندهای چندمرحله‌ای، مرور وب در مرورگر مجازی، ویرایش فایل‌ها و کدنویسی تعاملی.\n"
            "• **محیط کاری ChatGPT Work**: ادغام عمیق با ابزارهای سازمانی نظیر Google Drive، Notion و Slack جهت تولید سند، اسلاید و فایل‌های اکسل آماده.\n"
            "• **مکالمه صوتی زنده (Advanced Voice Mode)**: گفتگوی صوتی بی‌درنگ و طبیعی بدون تاخیر با لحن‌های کاملاً انسانی و قابلیت قطع کلام.\n"
            "• **محیط تعاملی Canvas & DALL-E 3**: تولید تصویر با کیفیت ۴K و ویرایش کدهای برنامه‌نویسی و متون طولانی در محیط اختصاصی Canvas.\n\n"
            "--- \n\n"
            "### ⚖️ **مقایسه ChatGPT Plus با سایر سرویس‌های هوش مصنوعی (۲۰۲۶)**\n"
            "۱. **در برابر نسخه رایگان**: مدل‌های قدیمی (مانند GPT-4.5 یا o3) بازنشسته شده‌اند. نسخه رایگان محدودیت بسیار شدیدی داشته و فاقد قابلیت‌های Deep Research، Agent Mode و GPT-5.6 Sol است.\n"
            "۲. **در برابر Google Gemini (Gemini 3.1 Pro)**: اگرچه جمینای ۳.۱ پرو در اکوسیستم گوگل قدرتمند است، اما ChatGPT Plus با مدل GPT-5.6 Sol در استدلال پیچیده، برنامه‌نویسی اختصاصی، ابزارهای عامل (Agentic) و محیط Canvas برتری قاطعانه‌ای دارد.\n"
            "۳. **در برابر Claude 3.5 Sonnet**: چت جی پی تی پلاس با داشتن ابزار صوتی زنده، Deep Research و ChatGPT Work امکانات بسیار جامع‌تری ارائه می‌دهد.\n\n"
            "--- \n\n"
            "### 🛡️ **چرا فعال‌سازی در جینکس فمیلی ۱۰۰٪ قانونی و امن است؟**\n"
            "برخلاف فروشگاه‌های غیرمجاز که اکانت‌های هکی یا کرک‌شده با ریسک مسدودی می‌فروشند، اشتراک ChatGPT Plus در جینکس فمیلی **به صورت ۱۰۰٪ قانونی و اختصاصی روی ایمیل شخصی خودتان** فعال می‌شود. اطلاعات و تاریخچه گفتگوهای شما کاملاً محرمانه مانده و تا آخرین روز دارای پشتیبانی و ضمانت کامل است.\n\n"
            "⚡ **زمان تحویل**: ۱۵ دقیقه تا ۴ ساعت کاری  \n"
            "🔒 **روش فعال‌سازی**: پرداخت قانونی روی ایمیل شخصی بدون نیاز به پسورد  \n"
            "💳 **روش پرداخت**: ریالی با تومان از طریق درگاه امن شتاب"
        ),
        "delivery_text": (
            "ثبت سفارش و پرداخت آنلاین در سایت جینکس فمیلی\n"
            "ارسال ایمیل اکانت خود برای فعال‌سازی بدون نیاز به پسورد\n"
            "دریافت لینک دعوت رسمی و فعال‌سازی قانونی در کمتر از ۴ ساعت"
        ),
        "faq": [
            {
                "q": "خرید اکانت ChatGPT Plus چقدر زمان میبرد؟",
                "a": "بین ۱۵ دقیقه تا ۴ ساعت! فعال‌سازی اشتراک ChatGPT Plus در جینکس فمیلی به صورت قانونی و با کارت‌های اعتباری معتبر انجام می‌شود و بلافاصله پس از فعال‌سازی با پیامک اطلاع‌رسانی می‌گردد."
            },
            {
                "q": "آیا به جدیدترین مدل‌های GPT-5.6 و Deep Research دسترسی خواهم داشت؟",
                "a": "بله! با خرید اشتراک Plus، به جدیدترین نسخه GPT-5.6 (شامل مدل‌های Sol و Terra)، قابلیت Deep Research، Agent Mode و Advanced Voice Mode به همراه تمام آپدیت‌های سال ۲۰۲۶ دسترسی کامل خواهید داشت."
            },
            {
                "q": "تفاوت این اشتراک با اکانت‌های رایگان یا قدیمی چیست؟",
                "a": "مدل‌های قدیمی نظیر GPT-4 و GPT-4.5 توسط OpenAI بازنشسته شده‌اند. در پلن Plus شما به پرچم‌دار GPT-5.6 Sol دسترسی دارید که سرعت و هوش استدلالی آن چندین برابر نسخه رایگان است و محدودیت قطعی در ساعات شلوغی ندارد."
            },
            {
                "q": "آیا فعال‌سازی روی ایمیل شخصی خودم انجام می‌شود؟",
                "a": "بله! اشتراک دقیقاً روی ایمیل و اکانت شخصی شما فعال می‌شود. هیچ شخص دیگری به چت‌ها و داده‌های شما دسترسی ندارد و مالکیت اکانت ۱۰۰٪ متعلق به خودتان است."
            },
            {
                "q": "آیا برای استفاده نیاز به VPN دائمی وجود دارد؟",
                "a": "پس از فعال‌سازی اکانت، می‌توانید بدون مشکل تحریم از سرویس استفاده کنید. پلاگین و راهنمای اتصال اختصاصی جینکس فمیلی نیز جهت سهولت استفاده در اختیار شما قرار می‌گیرد."
            }
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
            "price": "price",
            "original_price": "original_price",
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
    bad = "jinxfamilyirproductstelegram-premium-3"
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
