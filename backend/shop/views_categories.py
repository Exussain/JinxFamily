"""
APIهای مربوط به دسته‌بندی محصولات
"""
from django.http import JsonResponse, HttpResponseNotAllowed
from .models import Product, SubCategory
from .categories import CATEGORY_INFO, get_all_categories


def categories_list(request):
    """
    لیست تمام دسته‌بندی‌ها با اطلاعات کامل
    """
    if request.method != 'GET':
        return HttpResponseNotAllowed(['GET'])

    categories = []
    for code, info in get_all_categories():
        product_count = Product.objects.filter(category=code, active=True).count()

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

    return JsonResponse({"results": categories})


def category_products(request, category_code):
    """
    محصولات یک دسته‌بندی خاص
    """
    if request.method != 'GET':
        return HttpResponseNotAllowed(['GET'])

    # بررسی وجود دسته‌بندی
    if category_code not in CATEGORY_INFO:
        return JsonResponse({"error": "دسته‌بندی یافت نشد"}, status=404)

    # دریافت محصولات
    products = Product.objects.filter(category=category_code, active=True).order_by('-id')

    # تبدیل به dict
    from .views import _product_to_dict
    data = [_product_to_dict(p) for p in products]

    # اطلاعات دسته‌بندی
    category_info = CATEGORY_INFO[category_code]

    return JsonResponse({
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
