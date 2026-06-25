import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "nubixstore.settings")
django.setup()

from shop.models import Product, ProductVariant

try:
    product = Product.objects.get(slug="fortnite-crew-pack")
    print(f"Found product: {product.name_fa} (ID: {product.id})")
    
    variants_data = [
        {"title": "۱ ماهه", "price": 339000},
        {"title": "۳ ماهه", "price": 999000},
        {"title": "۶ ماهه", "price": 1950000},
        {"title": "۱۲ ماهه", "price": 3800000},
    ]
    
    for v_data in variants_data:
        variant, created = ProductVariant.objects.get_or_create(
            product=product,
            title=v_data["title"],
            defaults={"price": v_data["price"]}
        )
        if created:
            print(f"Created variant: {variant.title} - Price: {variant.price}")
        else:
            print(f"Variant already exists: {variant.title}")
            
except Product.DoesNotExist:
    print("Product fortnite-crew-pack not found!")
