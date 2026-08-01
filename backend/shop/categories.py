"""
تنظیمات دسته‌بندی محصولات
"""

CATEGORY_INFO = {
    "FORTNITE": {
        "name": "فورتنایت",
        "name_en": "Fortnite",
        "image": "/categories/category_fortnite.webp",
        "description": "خرید ویباکس، کروپک، بتل پس و پک‌های فورتنایت",
        "icon": "🎮",
        "order": 1
    },
    "PUBG": {
        "name": "پابجی",
        "name_en": "PUBG Mobile",
        "image": "/categories/category_pubg.webp",
        "description": "خرید یوسی، رویال پس و آفر‌های پابجی موبایل",
        "icon": "🔫",
        "order": 2
    },
    "COD_MOBILE": {
        "name": "کالاف دیوتی",
        "name_en": "Call of Duty Mobile",
        "image": "/categories/category_cod.webp",
        "description": "خرید سی پی، بتل پس و استارترپک کالاف دیوتی موبایل",
        "icon": "💥",
        "order": 3
    },
    "CLASH_ROYALE": {
        "name": "کلش رویال",
        "name_en": "Clash Royale",
        "image": "/categories/category_clash_royal.webp",
        "description": "خرید رویال پس و آفرهای کلش رویال",
        "icon": "👑",
        "order": 4
    },
    "CLASH_OF_CLANS": {
        "name": "کلش اف کلنز",
        "name_en": "Clash of Clans",
        "image": "/categories/category_coc.webp",
        "description": "خرید بلیت طلایی و جم کلش اف کلنز",
        "icon": "⚔️",
        "order": 5
    },
    "BRAWL_STARS": {
        "name": "براول استارز",
        "name_en": "Brawl Stars",
        "image": "/categories/category_brawl_stars.webp",
        "description": "خرید براول پس و جم براول استارز",
        "icon": "⭐",
        "order": 6
    },
    "FREE_FIRE": {
        "name": "فری فایر",
        "name_en": "Free Fire",
        "image": "/categories/category_freefire.webp",
        "description": "خرید جم و آفرهای فری فایر",
        "icon": "🔥",
        "order": 7
    },
    "VALORANT": {
        "name": "ولورانت",
        "name_en": "Valorant",
        "image": "/categories/category_valorant.webp",
        "description": "خرید ولورانت پوینت (VP) و آیتم‌های ولورانت",
        "icon": "🎯",
        "order": 8
    },
    "RAINBOW_SIX": {
        "name": "رینبو سیکس",
        "name_en": "Rainbow Six",
        "image": "/categories/category_rainbow.webp",
        "description": "خرید ممبرشیپ و کردیت رینبو سیکس سیج",
        "icon": "🛡️",
        "order": 9
    },
    "MARVEL_RIVALS": {
        "name": "مارول ریوالز",
        "name_en": "Marvel Rivals",
        "image": "/categories/category_marvel_rivals.webp",
        "description": "خرید لاتیس و آیتم‌های مارول ریوالز",
        "icon": "⚡",
        "order": 10
    },
    "PING_REDUCTION": {
        "name": "سرویس کاهش پینگ",
        "name_en": "Ping Reduction",
        "image": "/categories/category_ping.webp",
        "description": "خرید اشتراک سرویس کاهش پینگ و بهبود اینترنت آنلاین",
        "icon": "🚀",
        "order": 11
    },
    "MOBILE_GAMES": {
        "name": "بازی‌های موبایل",
        "name_en": "Mobile Games",
        "image": "/categories/category_mobile_games.webp",
        "description": "خرید جم، سکه و آیتم کلیه بازی‌های موبایلی",
        "icon": "📱",
        "order": 12
    },
    "ROCKET_LEAGUE": {
        "name": "راکت لیگ",
        "name_en": "Rocket League",
        "image": "/categories/category_rocket_league.webp",
        "description": "خرید کردیت راکت لیگ برای Rocket Pass، Blueprint و آیتم‌های بازی",
        "icon": "🚗",
        "order": 13
    },
    "AI": {
        "name": "هوش مصنوعی",
        "name_en": "AI",
        "image": "/categories/category_ai.webp",
        "description": "اشتراک ChatGPT، Gemini و سایر ابزارهای هوش مصنوعی",
        "icon": "🤖",
        "order": 14
    },
    "GIFTCARDS": {
        "name": "گیفت کارت‌ها",
        "name_en": "Gift Cards",
        "image": "/categories/category_giftcard.webp",
        "description": "گیفت کارت PlayStation، Xbox، Steam، Google Play و iTunes",
        "icon": "🎁",
        "order": 15
    },
    "GAMES": {
        "name": "بازی‌ها",
        "name_en": "Games",
        "image": "/products/gta6/ps5-standard.webp",
        "description": "پیش‌خرید GTA VI و سایر بازی‌های روز",
        "icon": "🎮",
        "order": 16
    },
    "SUBSCRIPTIONS": {
        "name": "اشتراک‌ها",
        "name_en": "Subscriptions",
        "image": "/categories/category_steam.webp",
        "description": "اشتراک Spotify و سایر سرویس‌ها",
        "icon": "⭐",
        "order": 17
    }
}

def get_category_info(category_code):
    """دریافت اطلاعات یک دسته‌بندی"""
    return CATEGORY_INFO.get(category_code, {})

def get_all_categories():
    """دریافت تمام دسته‌بندی‌ها به ترتیب"""
    return sorted(
        CATEGORY_INFO.items(),
        key=lambda x: x[1]['order']
    )
