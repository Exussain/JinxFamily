import logging
from django.core.management.base import BaseCommand
from django.utils.text import slugify
from django.utils import timezone
from shop.models import G4A4Product, G4A4Variation, G4A4MarkupRule
from shop import g4a4_service

logger = logging.getLogger(__name__)

class Command(BaseCommand):
    help = "Syncs categories, products, and variations from G4A4 API"

    def add_arguments(self, parser):
        parser.add_argument(
            "--full",
            action="store_true",
            help="Perform a full catalog sync (slow: syncs all categories and products)",
        )

    def handle(self, *args, **options):
        is_full = options["full"]
        self.stdout.write(self.style.WARNING(f"Starting G4A4 Sync (Full={is_full})..."))
        
        if is_full:
            categories = g4a4_service.get_categories()
            if not categories or isinstance(categories, dict):
                # Do not replace the real supplier catalogue with the old
                # development seed when the API is unavailable.  That seed
                # contains illustrative, potentially stale prices and cannot
                # satisfy a catalogue reconciliation.
                self.stdout.write(self.style.ERROR("G4A4 catalogue could not be retrieved; existing products were left unchanged."))
            else:
                self.sync_full_catalog(categories)
        else:
            self.sync_active_variations()
            
        self.stdout.write(self.style.SUCCESS("G4A4 Sync complete!"))

    def get_cat_slugs_map(self):
        return {
            "آیتم های اورواچ ۲": "overwatch-2",
            "آیتم های بتل نت": "battlenet",
            "آیتم های دد بای دیلایت": "dead-by-daylight",
            "آیتم‌های پلاتو": "plato",
            "آیتم‌های دیابلو": "diablo",
            "آیتم‌های زنلس زون زیرو": "zenless-zone-zero",
            "آیتم‌های سوپرسل": "supercell",
            "آیتم‌های گنشین ایمپکت": "genshin-impact",
            "آیتم‌های ماینکرافت": "minecraft",
            "آیتم‌های های رایس": "highrise",
            "آیتم‌های وارتاندر": "war-thunder",
            "آیتم‌های وارزون": "warzone",
            "آیتم‌های وایلد ریفت": "wild-rift",
            "سی پی کالاف دیوتی": "cod-cp",
            "بازی های اورجینال": "original-games",
            "بازی‌های بتل نت": "battlenet-games",
            "بازی های یوبی‌سافت": "ubisoft-games",
            "بازی‌های پلی‌استیشن": "playstation-games",
            "بازی های ایکس باکس": "xbox-games",
            "بازی های اپیک گیمز": "epic-games",
            "بازی های اوریجین": "origin-games",
            "ولورانت پوینت": "valorant-points",
            "آیتم‌های لیگ آو لجندز": "league-of-legends",
            "آیتم‌های فورتنایت": "fortnite",
            "آیتم‌های اپکس لجندز": "apex-legends",
            "آیتم های Rainbow Six Siege": "rainbow-six",
            "محصولات ورلد آو وارکرفت": "world-of-warcraft",
            "گیفت کارت": "giftcards",
            "یوسی پابجی موبایل": "pubg-mobile",
            "الماس فری فایر": "free-fire",
            "الماس موبایل لجندز": "mobile-legends",
            "روباکس روبلاکس": "roblox",
            "گیفت کارت استیم": "steam-gift-card",
            "گیفت کارت پلی استیشن": "playstation-games",
            "گیفت کارت ایکس باکس": "xbox-games",
        }

    def sync_full_catalog(self, categories=None):
        """Slow: Fetch all categories, products, and variations from G4A4."""
        if not categories:
            categories = g4a4_service.get_categories()
        if not categories or isinstance(categories, dict):
            self.stdout.write(self.style.ERROR("No categories found or API error."))
            return
            
        self.stdout.write(f"Found {len(categories)} categories on G4A4.")
        cat_slugs = self.get_cat_slugs_map()
        
        # Save categories and products
        for cat in categories:
            cat_id = cat.get("id")
            cat_name = cat.get("name")
            if not cat_id or not cat_name:
                continue
                
            self.stdout.write(f"Syncing products for category: {cat_name} (ID: {cat_id})")
            
            G4A4MarkupRule.objects.get_or_create(
                category_name=cat_name,
                defaults={"markup_percent": g4a4_service.DEFAULT_MARKUP_PERCENT}
            )
            
            products = g4a4_service.get_products(category_id=cat_id)
            if not products or isinstance(products, dict):
                continue

            for prod in products:
                prod_id = prod.get("id")
                prod_name = prod.get("name")
                if not prod_id or not prod_name:
                    continue
                    
                slug = cat_slugs.get(cat_name)
                if not slug:
                    slug = slugify(cat_name)
                if not slug:
                    slug = f"g4a4-cat-{cat_id}"
                    
                g4a4_prod, created = G4A4Product.objects.update_or_create(
                    external_product_id=prod_id,
                    defaults={
                        "category": cat_name,
                        "name": prod_name,
                        "game_slug": slug,
                        "is_active": True
                    }
                )
                
                details = g4a4_service.get_product(prod_id)
                if not details or not isinstance(details, dict):
                    continue
                    
                variations = details.get("variations", [])
                if not isinstance(variations, list):
                    continue
                    
                for var in variations:
                    var_id = var.get("id")
                    var_name = var.get("name")
                    if not var_id or not var_name:
                        continue
                        
                    cost_irt = g4a4_service._g4a4_to_toman(var.get("price", 0))
                    sell_toman = g4a4_service.calculate_sell_price(cost_irt, cat_name)
                    in_stock = bool(var.get("in_stock", True))
                    delivery_type = var.get("delivery_type", "")
                    region = var.get("region", "")
                    required_fields = var.get("required_fields", [])
                    if not isinstance(required_fields, list):
                        required_fields = []
                    attributes = var.get("attributes", {})
                    if not isinstance(attributes, dict):
                        attributes = {}
                        
                    G4A4Variation.objects.update_or_create(
                        external_variation_id=var_id,
                        defaults={
                            "product": g4a4_prod,
                            "name": var_name,
                            "cost_irt": cost_irt,
                            "sell_toman": sell_toman,
                            "in_stock": in_stock,
                            "delivery_type": delivery_type,
                            "region": region,
                            "required_fields": required_fields,
                            "attributes": attributes,
                            "synced_at": timezone.now()
                        }
                    )

    def seed_g4a4_catalog(self):
        """Populate complete G4A4 product & variation catalog into DB."""
        SEED_DATA = [
            # PUBG Mobile
            {
                "product_id": 1001,
                "category": "یوسی پابجی موبایل",
                "game_slug": "pubg-mobile",
                "name": "یوسی پابجی موبایل (PUBG Mobile UC)",
                "variations": [
                    {"id": 10011, "name": "60 یوسی پابجی موبایل", "cost": 65000, "fields": ["player_id", "character_name"]},
                    {"id": 10012, "name": "120 یوسی پابجی موبایل", "cost": 130000, "fields": ["player_id", "character_name"]},
                    {"id": 10013, "name": "325 یوسی پابجی موبایل", "cost": 340000, "fields": ["player_id", "character_name"]},
                    {"id": 10014, "name": "660 یوسی پابجی موبایل", "cost": 680000, "fields": ["player_id", "character_name"]},
                    {"id": 10015, "name": "1800 یوسی پابجی موبایل", "cost": 1820000, "fields": ["player_id", "character_name"]},
                    {"id": 10016, "name": "3850 یوسی پابجی موبایل", "cost": 3850000, "fields": ["player_id", "character_name"]},
                    {"id": 10017, "name": "8100 یوسی پابجی موبایل", "cost": 7900000, "fields": ["player_id", "character_name"]},
                ]
            },
            # Free Fire
            {
                "product_id": 1002,
                "category": "الماس فری فایر",
                "game_slug": "free-fire",
                "name": "الماس فری فایر (Free Fire Diamonds)",
                "variations": [
                    {"id": 10021, "name": "100 الماس فری فایر", "cost": 75000, "fields": ["player_id"]},
                    {"id": 10022, "name": "210 الماس فری فایر", "cost": 155000, "fields": ["player_id"]},
                    {"id": 10023, "name": "530 الماس فری فایر", "cost": 390000, "fields": ["player_id"]},
                    {"id": 10024, "name": "1080 الماس فری فایر", "cost": 790000, "fields": ["player_id"]},
                    {"id": 10025, "name": "2200 الماس فری فایر", "cost": 1590000, "fields": ["player_id"]},
                ]
            },
            # Steam Gift Cards
            {
                "product_id": 1003,
                "category": "گیفت کارت استیم",
                "game_slug": "steam-gift-card",
                "name": "گیفت کارت استیم (Steam Gift Card)",
                "variations": [
                    {"id": 10031, "name": "گیفت کارت استیم ۵ دلاری گلوبال", "cost": 320000, "fields": []},
                    {"id": 10032, "name": "گیفت کارت استیم ۱۰ دلاری گلوبال", "cost": 640000, "fields": []},
                    {"id": 10033, "name": "گیفت کارت استیم ۲۰ دلاری گلوبال", "cost": 1280000, "fields": []},
                    {"id": 10034, "name": "گیفت کارت استیم ۵۰ لیر ترکیه", "cost": 190000, "fields": []},
                    {"id": 10035, "name": "گیفت کارت استیم ۱۰۰ لیر ترکیه", "cost": 380000, "fields": []},
                ]
            },
            # Call of Duty Mobile
            {
                "product_id": 1004,
                "category": "سی پی کالاف دیوتی",
                "game_slug": "cod-cp",
                "name": "سی پی کالاف دیوتی موبایل (CoD Mobile CP)",
                "variations": [
                    {"id": 10041, "name": "80 سی پی کالاف دیوتی", "cost": 70000, "fields": ["activision_email", "activision_password"]},
                    {"id": 10042, "name": "420 سی پی کالاف دیوتی", "cost": 350000, "fields": ["activision_email", "activision_password"]},
                    {"id": 10043, "name": "880 سی پی کالاف دیوتی", "cost": 690000, "fields": ["activision_email", "activision_password"]},
                    {"id": 10044, "name": "2400 سی پی کالاف دیوتی", "cost": 1850000, "fields": ["activision_email", "activision_password"]},
                    {"id": 10045, "name": "5000 سی پی کالاف دیوتی", "cost": 3750000, "fields": ["activision_email", "activision_password"]},
                ]
            },
            # Valorant Points
            {
                "product_id": 1005,
                "category": "ولورانت پوینت",
                "game_slug": "valorant-points",
                "name": "ولورانت پوینت (Valorant Points VP)",
                "variations": [
                    {"id": 10051, "name": "475 ولورانت پوینت (VP)", "cost": 330000, "fields": ["riot_username"]},
                    {"id": 10052, "name": "1000 ولورانت پوینت (VP)", "cost": 660000, "fields": ["riot_username"]},
                    {"id": 10053, "name": "2050 ولورانت پوینت (VP)", "cost": 1320000, "fields": ["riot_username"]},
                    {"id": 10054, "name": "3650 ولورانت پوینت (VP)", "cost": 2300000, "fields": ["riot_username"]},
                ]
            },
            # Roblox
            {
                "product_id": 1006,
                "category": "روباکس روبلاکس",
                "game_slug": "roblox",
                "name": "روباکس روبلاکس (Roblox Robux)",
                "variations": [
                    {"id": 10061, "name": "800 روباکس روبلاکس", "cost": 620000, "fields": ["roblox_username"]},
                    {"id": 10062, "name": "1000 روباکس روبلاکس", "cost": 780000, "fields": ["roblox_username"]},
                    {"id": 10063, "name": "2000 روباکس روبلاکس", "cost": 1550000, "fields": ["roblox_username"]},
                    {"id": 10064, "name": "4500 روباکس روبلاکس", "cost": 3400000, "fields": ["roblox_username"]},
                ]
            },
            # Mobile Legends
            {
                "product_id": 1007,
                "category": "الماس موبایل لجندز",
                "game_slug": "mobile-legends",
                "name": "الماس موبایل لجندز (Mobile Legends Diamonds)",
                "variations": [
                    {"id": 10071, "name": "86 الماس موبایل لجندز", "cost": 95000, "fields": ["user_id", "zone_id"]},
                    {"id": 10072, "name": "172 الماس موبایل لجندز", "cost": 190000, "fields": ["user_id", "zone_id"]},
                    {"id": 10073, "name": "257 الماس موبایل لجندز", "cost": 285000, "fields": ["user_id", "zone_id"]},
                    {"id": 10074, "name": "706 الماس موبایل لجندز", "cost": 770000, "fields": ["user_id", "zone_id"]},
                    {"id": 10075, "name": "کارت هفتگی Weekly Pass", "cost": 135000, "fields": ["user_id", "zone_id"]},
                ]
            },
            # Fortnite
            {
                "product_id": 1008,
                "category": "آیتم‌های فورتنایت",
                "game_slug": "fortnite",
                "name": "ویباکس فورتنایت (Fortnite V-Bucks)",
                "variations": [
                    {"id": 10081, "name": "1000 ویباکس فورتنایت", "cost": 550000, "fields": ["epic_email", "epic_password"]},
                    {"id": 10082, "name": "2800 ویباکس فورتنایت", "cost": 1350000, "fields": ["epic_email", "epic_password"]},
                    {"id": 10083, "name": "5000 ویباکس فورتنایت", "cost": 2350000, "fields": ["epic_email", "epic_password"]},
                    {"id": 10084, "name": "13500 ویباکس فورتنایت", "cost": 5900000, "fields": ["epic_email", "epic_password"]},
                    {"id": 10085, "name": "اشتراک کروپک فورتنایت (Fortnite Crew)", "cost": 720000, "fields": ["epic_email", "epic_password"]},
                ]
            },
            # Overwatch 2
            {
                "product_id": 1009,
                "category": "آیتم های اورواچ ۲",
                "game_slug": "overwatch-2",
                "name": "سکه‌های اورواچ ۲ (Overwatch 2 Coins)",
                "variations": [
                    {"id": 10091, "name": "500 کوین اورواچ ۲", "cost": 340000, "fields": ["battlenet_email", "battlenet_password"]},
                    {"id": 10092, "name": "1000 کوین اورواچ ۲", "cost": 680000, "fields": ["battlenet_email", "battlenet_password"]},
                    {"id": 10093, "name": "2200 کوین اورواچ ۲", "cost": 1360000, "fields": ["battlenet_email", "battlenet_password"]},
                ]
            },
            # Battle.net
            {
                "product_id": 1010,
                "category": "آیتم های بتل نت",
                "game_slug": "battlenet",
                "name": "شارژ بالانس بتل نت (Battle.net Balance)",
                "variations": [
                    {"id": 10101, "name": "گیفت کارت ۱۰ دلاری بتل نت", "cost": 650000, "fields": []},
                    {"id": 10102, "name": "گیفت کارت ۲۰ دلاری بتل نت", "cost": 1300000, "fields": []},
                    {"id": 10103, "name": "گیفت کارت ۵۰ دلاری بتل نت", "cost": 3250000, "fields": []},
                ]
            },
            # Genshin Impact
            {
                "product_id": 1011,
                "category": "آیتم‌های گنشین ایمپکت",
                "game_slug": "genshin-impact",
                "name": "کریستال گنشین ایمپکت (Genesis Crystals)",
                "variations": [
                    {"id": 10111, "name": "60 جنسیس کریستال", "cost": 69000, "fields": ["user_id", "server_id"]},
                    {"id": 10112, "name": "300 جنسیس کریستال", "cost": 340000, "fields": ["user_id", "server_id"]},
                    {"id": 10113, "name": "980 جنسیس کریستال", "cost": 1020000, "fields": ["user_id", "server_id"]},
                    {"id": 10114, "name": "اشتراک Welkin Moon", "cost": 340000, "fields": ["user_id", "server_id"]},
                ]
            },
            # Supercell
            {
                "product_id": 1012,
                "category": "آیتم‌های سوپرسل",
                "game_slug": "supercell",
                "name": "جم کلش اف کلنز و سوپرسل (Supercell Gems & Offers)",
                "variations": [
                    {"id": 10121, "name": "80 جم کلش اف کلنز", "cost": 69000, "fields": ["supercell_email"]},
                    {"id": 10122, "name": "500 جم کلش اف کلنز", "cost": 340000, "fields": ["supercell_email"]},
                    {"id": 10123, "name": "1200 جم کلش اف کلنز", "cost": 680000, "fields": ["supercell_email"]},
                    {"id": 10125, "name": "2500 جم کلش اف کلنز", "cost": 1360000, "fields": ["supercell_email"]},
                    {"id": 10126, "name": "6500 جم کلش اف کلنز", "cost": 3400000, "fields": ["supercell_email"]},
                    {"id": 10127, "name": "14000 جم کلش اف کلنز", "cost": 6800000, "fields": ["supercell_email"]},
                    {"id": 10124, "name": "بلیط طلایی Gold Pass", "cost": 420000, "fields": ["supercell_email"]},
                    {"id": 10128, "name": "بلیط الماس Event Pass / Event Offer", "cost": 680000, "fields": ["supercell_email"]},
                    {"id": 10129, "name": "آفر ویژه ۰.۹۹ دلاری کلش اف کلنز", "cost": 69000, "fields": ["supercell_email"]},
                    {"id": 10130, "name": "آفر ویژه ۲.۹۹ دلاری کلش اف کلنز", "cost": 204000, "fields": ["supercell_email"]},
                    {"id": 10131, "name": "آفر ویژه ۴.۹۹ دلاری کلش اف کلنز", "cost": 340000, "fields": ["supercell_email"]},
                    {"id": 10132, "name": "آفر ویژه ۹.۹۹ دلاری کلش اف کلنز", "cost": 680000, "fields": ["supercell_email"]},
                    {"id": 10133, "name": "آفر ویژه ۱۹.۹۹ دلاری کلش اف کلنز", "cost": 1360000, "fields": ["supercell_email"]},
                    {"id": 10134, "name": "آفر ویژه ۴۹.۹۹ دلاری کلش اف کلنز", "cost": 3400000, "fields": ["supercell_email"]},
                ]
            },
            # Minecraft
            {
                "product_id": 1013,
                "category": "آیتم‌های ماینکرافت",
                "game_slug": "minecraft",
                "name": "ماینکوینز ماینکرافت (Minecraft Minecoins)",
                "variations": [
                    {"id": 10131, "name": "1720 ماینکوین ماینکرافت", "cost": 680000, "fields": []},
                    {"id": 10132, "name": "3500 ماینکوین ماینکرافت", "cost": 1360000, "fields": []},
                ]
            },
            # League of Legends
            {
                "product_id": 1014,
                "category": "آیتم‌های لیگ آو لجندز",
                "game_slug": "league-of-legends",
                "name": "رایت پوینت لیگ آو لجندز (Riot Points RP)",
                "variations": [
                    {"id": 10141, "name": "575 رایت پوینت LoL", "cost": 340000, "fields": ["riot_username"]},
                    {"id": 10142, "name": "1380 رایت پوینت LoL", "cost": 680000, "fields": ["riot_username"]},
                    {"id": 10143, "name": "2800 رایت پوینت LoL", "cost": 1360000, "fields": ["riot_username"]},
                ]
            },
            # Apex Legends
            {
                "product_id": 1015,
                "category": "آیتم‌های اپکس لجندز",
                "game_slug": "apex-legends",
                "name": "سکه‌های اپکس لجندز (Apex Coins)",
                "variations": [
                    {"id": 10151, "name": "1000 سکه اپکس لجندز", "cost": 680000, "fields": ["ea_email", "ea_password"]},
                    {"id": 10152, "name": "2150 سکه اپکس لجندز", "cost": 1360000, "fields": ["ea_email", "ea_password"]},
                ]
            },
            # PlayStation Network Cards
            {
                "product_id": 1016,
                "category": "بازی‌های پلی‌استیشن",
                "game_slug": "playstation-games",
                "name": "گیفت کارت پلی استیشن (PSN Gift Cards)",
                "variations": [
                    {"id": 10161, "name": "گیفت کارت ۱۰ دلاری پلی استیشن آمریکا", "cost": 650000, "fields": []},
                    {"id": 10162, "name": "گیفت کارت ۲۵ دلاری پلی استیشن آمریکا", "cost": 1625000, "fields": []},
                    {"id": 10163, "name": "گیفت کارت ۵۰ دلاری پلی استیشن آمریکا", "cost": 3250000, "fields": []},
                    {"id": 10164, "name": "اشتراک ۱ ماهه پلی استیشن پلاس", "cost": 680000, "fields": []},
                ]
            },
            # Xbox / Game Pass
            {
                "product_id": 1017,
                "category": "بازی های ایکس باکس",
                "game_slug": "xbox-games",
                "name": "گیفت کارت ایکس باکس و گیم پاس (Xbox Gift Cards)",
                "variations": [
                    {"id": 10171, "name": "گیفت کارت ۱۰ دلاری ایکس باکس", "cost": 650000, "fields": []},
                    {"id": 10172, "name": "گیفت کارت ۲۵ دلاری ایکس باکس", "cost": 1625000, "fields": []},
                    {"id": 10173, "name": "اشتراک ۱ ماهه گیم پاس اولتیمیت", "cost": 890000, "fields": []},
                ]
            },
            # Apple iTunes
            {
                "product_id": 1018,
                "category": "گیفت کارت",
                "game_slug": "itunes",
                "name": "گیفت کارت اپل آیتونز (Apple iTunes Card)",
                "variations": [
                    {"id": 10181, "name": "گیفت کارت ۲ دلاری اپل آیکلود", "cost": 135000, "fields": []},
                    {"id": 10182, "name": "گیفت کارت ۵ دلاری اپل آیتونز", "cost": 330000, "fields": []},
                    {"id": 10183, "name": "گیفت کارت ۱۰ دلاری اپل آیتونز", "cost": 660000, "fields": []},
                ]
            },
            # Google Play
            {
                "product_id": 1019,
                "category": "گیفت کارت",
                "game_slug": "google-play",
                "name": "گیفت کارت گوگل پلی (Google Play Gift Card)",
                "variations": [
                    {"id": 10191, "name": "گیفت کارت ۵ دلاری گوگل پلی آمریکا", "cost": 340000, "fields": []},
                    {"id": 10192, "name": "گیفت کارت ۱۰ دلاری گوگل پلی آمریکا", "cost": 680000, "fields": []},
                ]
            },
            # Nintendo eShop
            {
                "product_id": 1020,
                "category": "گیفت کارت",
                "game_slug": "nintendo",
                "name": "گیفت کارت نینتندو (Nintendo eShop Card)",
                "variations": [
                    {"id": 10201, "name": "گیفت کارت ۱۰ دلاری نینتندو", "cost": 660000, "fields": []},
                    {"id": 10202, "name": "گیفت کارت ۲۰ دلاری نینتندو", "cost": 1320000, "fields": []},
                ]
            }
        ]

        for item in SEED_DATA:
            cat_name = item["category"]
            G4A4MarkupRule.objects.get_or_create(
                category_name=cat_name,
                defaults={"markup_percent": g4a4_service.DEFAULT_MARKUP_PERCENT}
            )

            prod, _ = G4A4Product.objects.update_or_create(
                external_product_id=item["product_id"],
                defaults={
                    "category": cat_name,
                    "name": item["name"],
                    "game_slug": item["game_slug"],
                    "is_active": True
                }
            )

            for var in item["variations"]:
                cost_irt = var["cost"]
                sell_toman = g4a4_service.calculate_sell_price(cost_irt, cat_name)
                G4A4Variation.objects.update_or_create(
                    external_variation_id=var["id"],
                    defaults={
                        "product": prod,
                        "name": var["name"],
                        "cost_irt": cost_irt,
                        "sell_toman": sell_toman,
                        "in_stock": True,
                        "delivery_type": "instant",
                        "region": "Global",
                        "required_fields": var.get("fields", []),
                        "synced_at": timezone.now()
                    }
                )
            self.stdout.write(f"Seeded product & variations for: {item['name']}")

    def sync_active_variations(self):
        """Fast: Sync variations only for products set to is_active=True."""
        active_products = G4A4Product.objects.filter(is_active=True)
        if not active_products.exists():
            self.stdout.write(self.style.WARNING("No active G4A4 products to sync. Seeding catalog..."))
            self.seed_g4a4_catalog()
            return
            
        self.stdout.write(f"Syncing variations for {active_products.count()} active products...")
        
        for prod in active_products:
            details = g4a4_service.get_product(prod.external_product_id)
            if not details or not isinstance(details, dict):
                continue
                
            variations = details.get("variations", [])
            if not isinstance(variations, list):
                continue
                
            for var in variations:
                var_id = var.get("id")
                var_name = var.get("name")
                if not var_id or not var_name:
                    continue
                    
                cost_irt = g4a4_service._g4a4_to_toman(var.get("price", 0))
                sell_toman = g4a4_service.calculate_sell_price(cost_irt, prod.category)
                in_stock = bool(var.get("in_stock", True))
                delivery_type = var.get("delivery_type", "")
                region = var.get("region", "")
                required_fields = var.get("required_fields", [])
                attributes = var.get("attributes", {})
                
                G4A4Variation.objects.update_or_create(
                    external_variation_id=var_id,
                    defaults={
                        "product": prod,
                        "name": var_name,
                        "cost_irt": cost_irt,
                        "sell_toman": sell_toman,
                        "in_stock": in_stock,
                        "delivery_type": delivery_type,
                        "region": region,
                        "required_fields": required_fields,
                        "attributes": attributes,
                        "synced_at": timezone.now()
                    }
                )
