"""
APIهای مربوط به دسته‌بندی محصولات
"""
from django.http import JsonResponse, HttpResponseNotAllowed
from django.db.models import Q
from .models import Product, SubCategory
from .categories import CATEGORY_INFO, get_all_categories
from .g4a4_service import DEFAULT_MARKUP_PERCENT


# Every image in this map was visually reviewed against the product it
# represents.  Keep G4A4 catalogue artwork separate from the older generic
# game assets: a number of those assets are not actually for their filenames.
G4A4_PRODUCT_IMAGES = {
    "pubg-mobile": "/images/games/g4a4/pubg-mobile.png",
    "free-fire": "/images/games/g4a4/free-fire.png",
    "cod-cp": "/images/games/cod-mobile.webp",
    "valorant-points": "/images/games/g4a4/valorant.jpg",
    "roblox": "/images/games/g4a4/roblox.png",
    "mobile-legends": "/images/games/g4a4/mobile-legends.png",
    "fortnite": "/images/games/fortnite.webp",
    "overwatch-2": "/images/games/g4a4/overwatch-2.png",
    "battlenet": "/images/games/g4a4/battlenet.png",
    "genshin-impact": "/images/games/g4a4/genshin-impact-google.jpg",
    "supercell": "/images/games/coc.webp",
    "minecraft": "/images/games/g4a4/minecraft.png",
    "league-of-legends": "/images/games/g4a4/league-of-legends.png",
    "apex-legends": "/images/games/g4a4/apex-legends.png",
    "steam-gift-card": "/images/games/steam.webp",
    "playstation-games": "/products/gift_ps.webp",
    "xbox-games": "/products/gift_xbox.webp",
    "itunes": "/products/gift_itunes.webp",
    "google-play": "/products/gift_google.webp",
    "nintendo": "/images/games/g4a4/nintendo-eshop.jpg",
}


def _g4a4_image_url(g4_prod):
    """Return reviewed local artwork for a G4A4 product."""
    slug = (g4_prod.game_slug or "").lower()
    if slug in G4A4_PRODUCT_IMAGES:
        return G4A4_PRODUCT_IMAGES[slug]

    name = (g4_prod.name or "").lower()
    # These name fallbacks cover supplier naming changes while retaining an
    # image for the same product/platform only.
    if "battle.net" in name or "بتل نت" in name:
        return G4A4_PRODUCT_IMAGES["battlenet"]
    if "nintendo" in name or "نینتندو" in name:
        return G4A4_PRODUCT_IMAGES["nintendo"]
    if "playstation" in name or "پلی استیشن" in name or "پلی‌استیشن" in name:
        return G4A4_PRODUCT_IMAGES["playstation-games"]
    if "xbox" in name or "ایکس باکس" in name or "ایکس‌باکس" in name:
        return G4A4_PRODUCT_IMAGES["xbox-games"]
    return "/images/diamond_logo.webp"


def categories_list(request):
    """
    لیست تمام دسته‌بندی‌ها با اطلاعات کامل
    """
    if request.method != 'GET':
        return HttpResponseNotAllowed(['GET'])

    categories = []
    for code, info in get_all_categories():
        if code == 'ACCOUNTS':
            product_count = Product.objects.filter(category=code, active=True).count()
        else:
            product_count = Product.objects.filter(category=code, active=True).exclude(
                Q(name_fa__startswith='اکانت') |
                Q(name_fa__startswith='آگهی اکانت') |
                (Q(category='FORTNITE') & Q(name_fa__icontains='اکانت'))
            ).count()

        categories.append({
            "code": code,
            "name": info['name'],
            "name_en": info['name_en'],
            "image": info['image'],
            "description": info['description'],
            "icon": info['icon'],
            "order": info['order'],
            "product_count": product_count
        })

    response = JsonResponse({"results": categories})
    response["Cache-Control"] = "public, max-age=60, stale-while-revalidate=300"
    return response


def _g4a4_product_to_dict(g4_prod):
    vars_list = list(g4_prod.variations.filter(in_stock=True))
    variants_payload = []
    for v in vars_list:
        sell_price = v.sell_toman if v.sell_toman > 0 else int(round((v.cost_irt * (1 + DEFAULT_MARKUP_PERCENT / 100)) / 1000.0) * 1000)
        orig_price = int(round((sell_price * 1.15) / 1000.0) * 1000)
        variants_payload.append({
            "id": v.external_variation_id,
            "title": v.name,
            "group_fa": "تحویل سیستمی",
            "price": sell_price,
            "original_price": orig_price,
            "g4a4_variation_id": v.external_variation_id,
            "required_fields": v.required_fields
        })
    min_price = min((item["price"] for item in variants_payload), default=0)
    
    image_url = _g4a4_image_url(g4_prod)

    return {
        "id": f"g4a4_{g4_prod.external_product_id}",
        "name_fa": g4_prod.name,
        "slug": g4_prod.game_slug,
        "subtitle": f"تحویل آنی {g4_prod.category}",
        "category": "INGAME",
        "category_title": g4_prod.category,
        "sub": g4_prod.game_slug,
        "image_url": image_url,
        "images": [image_url],
        "price": min_price,
        "original_price": int(min_price * 1.15),
        "min_price": min_price,
        "variants": variants_payload,
        "purchasable": True,
        "is_g4a4": True
    }


def category_products(request, category_code):
    """
    محصولات یک دسته‌بندی خاص
    """
    if request.method != 'GET':
        return HttpResponseNotAllowed(['GET'])

    if category_code not in CATEGORY_INFO:
        return JsonResponse({"error": "دسته‌بندی یافت نشد"}, status=404)

    # دریافت محصولات
    if category_code == 'ACCOUNTS':
        products = Product.objects.filter(category=category_code, active=True).prefetch_related('variants').order_by('-id')
    else:
        products = Product.objects.filter(category=category_code, active=True).exclude(
            Q(name_fa__startswith='اکانت') |
            Q(name_fa__startswith='آگهی اکانت') |
            (Q(category='FORTNITE') & Q(name_fa__icontains='اکانت'))
        ).prefetch_related('variants').order_by('-id')

    from .views import _product_to_dict
    data = [_product_to_dict(p, include_content=False) for p in products]

    # Include G4A4 items for INGAME, BATTLENET, GIFTCARDS, GAMES
    if category_code in ('INGAME', 'BATTLENET', 'GIFTCARDS', 'GAMES'):
        from .models import G4A4Product
        g4_prods = G4A4Product.objects.filter(is_active=True).prefetch_related('variations')
        if category_code == 'INGAME':
            g4_prods = g4_prods.filter(
                Q(game_slug__in=['pubg-mobile', 'free-fire', 'cod-cp', 'valorant-points', 'roblox', 'mobile-legends', 'supercell', 'genshin-impact', 'overwatch-2', 'league-of-legends', 'apex-legends', 'minecraft'])
            )
        elif category_code == 'BATTLENET':
            g4_prods = g4_prods.filter(
                Q(game_slug__in=['battlenet', 'overwatch-2', 'diablo']) | Q(category__icontains='بتل نت')
            )
        elif category_code == 'GIFTCARDS':
            g4_prods = g4_prods.filter(
                Q(game_slug__in=['steam-gift-card', 'google-play', 'nintendo', 'itunes', 'playstation-games', 'xbox-games']) | Q(category__icontains='گیفت')
            )
        
        g4_data = [_g4a4_product_to_dict(gp) for gp in g4_prods]
        data = g4_data + data

    # Popularity rank map (lower number = higher popularity in database)
    GAME_POPULARITY_RANK = {
        'fortnite': 1,
        'pubg-mobile': 2,
        'cod-cp': 3,
        'free-fire': 4,
        'supercell': 5,
        'roblox': 6,
        'valorant-points': 7,
        'mobile-legends': 8,
        'genshin-impact': 9,
        'steam-gift-card': 10,
        'overwatch-2': 11,
        'battlenet': 12,
        'minecraft': 13,
        'league-of-legends': 14,
        'apex-legends': 15,
        'playstation-games': 16,
        'xbox-games': 17,
        'google-play': 18,
        'nintendo': 19,
        'itunes': 20,
    }

    def _get_item_popularity(item):
        slug = (item.get("slug") or "").lower()
        if slug in GAME_POPULARITY_RANK:
            return GAME_POPULARITY_RANK[slug]
        return item.get("display_order") or 999

    data.sort(key=_get_item_popularity)

    category_info = CATEGORY_INFO[category_code]

    response = JsonResponse({
        "category": {
            "code": category_code,
            "name": category_info['name'],
            "name_en": category_info['name_en'],
            "image": category_info['image'],
            "description": category_info['description'],
            "icon": category_info['icon'],
        },
        "products": data,
        "count": len(data)
    })
    response["Cache-Control"] = "public, max-age=60, stale-while-revalidate=300"
    return response


def category_subcategories(request, category_code):
    """
    زیردسته‌های یک دسته‌بندی خاص
    """
    if request.method != 'GET':
        return HttpResponseNotAllowed(['GET'])

    subs = SubCategory.objects.filter(category=category_code).order_by('display_order', 'id')
    data = [
        {
            "id": sc.id,
            "key": sc.key,
            "label": sc.label,
            "category": sc.category,
            "display_order": sc.display_order,
        }
        for sc in subs
    ]
    return JsonResponse({"results": data})
