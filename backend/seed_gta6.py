"""Seed/refresh the GTA VI pre-order product, its variants, and the gta6_config.

Idempotent: safe to run multiple times. Run with:
    .venv/bin/python manage.py shell -c "exec(open('seed_gta6.py').read())"
"""
import json
from shop.models import Product, ProductVariant, SiteSetting, ProductComment

# Capacity keys are unique per platform: cap2/cap3 → PS5, home/switch/full → Xbox.
# Xbox switch mirrors PS cap3, Xbox home mirrors PS cap2, Xbox full is the premium tier.
PRICES = {
    "standard": {"cap2": 7887000, "cap3": 5258000, "home": 7887000, "switch": 5258000, "full": 13599000},
    "ultimate": {"cap2": 9600000, "cap3": 6407000, "home": 9600000, "switch": 6407000, "full": 16215000},
}
EDITION_FA = {"standard": "استاندارد ادیشن", "ultimate": "آلتیمیت ادیشن"}
CAP_FA = {
    "cap2": "ظرفیت ۲", "cap3": "ظرفیت ۳",
    "home": "ظرفیت هوم", "switch": "ظرفیت سوییچ", "full": "ظرفیت کامل",
}
CAP_PLATFORM = {"cap2": "PS5", "cap3": "PS5", "home": "Xbox", "switch": "Xbox", "full": "Xbox"}
EDITIONS = ("standard", "ultimate")
CAPS = ("cap2", "cap3", "home", "switch", "full")

product, _ = Product.objects.get_or_create(
    slug="gta6",
    defaults={
        "name_fa": "پیش‌خرید GTA VI",
        "category": "GAMES",
        "active": True,
    },
)
product.name_fa = "پیش‌خرید GTA VI (Grand Theft Auto VI)"
product.category = "GAMES"
product.subtitle = "نسخه استاندارد و آلتیمیت — PS5 و Xbox — ظرفیت‌های متنوع"
product.image_url = "/products/gta6/ps5-ultimate.jpg"
product.active = True
product.save()

# Rebuild variants cleanly so the config mapping is authoritative.
product.variants.all().delete()

config_pricing = {}
sort = 0
for edition in EDITIONS:
    config_pricing[edition] = {}
    for cap in CAPS:
        sort += 1
        price = PRICES[edition][cap]
        v = ProductVariant.objects.create(
            product=product,
            title=f"{EDITION_FA[edition]} · {CAP_FA[cap]} · {CAP_PLATFORM[cap]}",
            group_fa=EDITION_FA[edition],
            price=price,
            original_price=0,
            sort_order=sort,
        )
        config_pricing[edition][cap] = {"toman": price, "originalToman": 0, "variant_id": v.id}

# Hidden add-on product representing the optional instant-activation fee.
# It is excluded from the product listing and only added to the cart when the
# buyer opts into "فعال‌سازی فوری" on the GTA page.
INSTANT_FEE_DEFAULT = 299000
instant, _ = Product.objects.get_or_create(
    slug="gta6-instant",
    defaults={"name_fa": "فعال‌سازی فوری GTA VI", "category": "GAMES", "active": True},
)
instant.name_fa = "فعال‌سازی فوری GTA VI"
instant.category = "GAMES"
instant.active = True
if instant.price <= 0:
    instant.price = INSTANT_FEE_DEFAULT
instant.save()

# Preserve existing instant settings if the config already exists.
prev = SiteSetting.objects.filter(key="gta6_config").first()
prev_data = {}
if prev and (prev.value_text or "").strip():
    try:
        prev_data = json.loads(prev.value_text)
    except Exception:
        prev_data = {}

config = {
    "xbox_enabled": bool(prev_data.get("xbox_enabled", True)),
    "product_id": product.id,
    "pricing": config_pricing,
    "instant_enabled": bool(prev_data.get("instant_enabled", False)),
    "instant_fee": int(prev_data.get("instant_fee", instant.price) or instant.price),
    "instant_product_id": instant.id,
}
obj, _ = SiteSetting.objects.get_or_create(key="gta6_config", defaults={"value_text": ""})
obj.value_text = json.dumps(config, ensure_ascii=False)
obj.save()
print("Instant add-on product id:", instant.id, "price:", instant.price)

print("Seeded product id:", product.id)
print("Variants:", list(product.variants.values_list("id", "title", "price")))
print("Config:", obj.value_text)

# --- Imported Telegram comments (real buyers, not previously on the website) ---
from datetime import datetime
from django.utils import timezone as _tz

TELEGRAM_COMMENTS = [
    # 3 تیر، 4 تیر، 4 تیر ۱۴۰۵ (به ترتیب)
    {"name": "محمد", "text": "پشمام بالاخره", "rating": 5, "date": "2026-06-24 12:30"},
    {"name": "سینا", "text": "مرسی از پشتیبانی", "rating": 5, "date": "2026-06-25 09:00"},
    {"name": "علیرضا", "text": "مرسی از نوبیکس، امیدوارم هر چه سریعتر به دستم برسه", "rating": 5, "date": "2026-06-25 11:00"},
]

for c in TELEGRAM_COMMENTS:
    existing = product.comments.filter(author_name=c["name"], text=c["text"]).first()
    if existing:
        comment = existing
    else:
        comment = ProductComment.objects.create(
            product=product,
            author_name=c["name"],
            rating=c["rating"],
            text=c["text"],
            is_approved=True,
            is_verified_purchase=True,
        )
    # created_at uses auto_now_add, so override it with a raw update.
    naive = datetime.strptime(c["date"], "%Y-%m-%d %H:%M")
    aware = _tz.make_aware(naive, _tz.get_current_timezone())
    ProductComment.objects.filter(id=comment.id).update(
        created_at=aware, is_verified_purchase=True, is_approved=True
    )

print("Comments:", list(product.comments.values_list("author_name", "text", "created_at")))
