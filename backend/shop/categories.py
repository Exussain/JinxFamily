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
    "AI": {
        "name": "هوش مصنوعی",
        "name_en": "AI",
        "image": "/categories/category_ai.webp",
        "description": "اشتراک ChatGPT، Gemini و سایر ابزارهای هوش مصنوعی",
        "icon": "🤖",
        "order": 2
    },
    "GIFTCARDS": {
        "name": "گیفت کارت‌ها",
        "name_en": "Gift Cards",
        "image": "/categories/category_giftcard.webp",
        "description": "گیفت کارت PlayStation، Xbox، Steam، Google Play و iTunes",
        "icon": "🎁",
        "order": 3
    },
    "GAMES": {
        "name": "بازی‌ها",
        "name_en": "Games",
        "image": "/categories/category_lol.png",
        "description": "League of Legends، Free Fire، Clash of Clans و سایر بازی‌ها",
        "icon": "🎯",
        "order": 4
    },
    "SUBSCRIPTIONS": {
        "name": "اشتراک‌ها",
        "name_en": "Subscriptions",
        "image": "/categories/category_steam.webp",
        "description": "اشتراک Spotify و سایر سرویس‌ها",
        "icon": "⭐",
        "order": 5
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
