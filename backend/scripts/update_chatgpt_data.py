import os
import sys
import django

# Set up Django environment
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'jinxfamily.settings')
django.setup()

from shop.models import Product, ProductVariant

print("Updating ChatGPT product and setting up variants...")
try:
    p = Product.objects.get(slug='chatgpt-subscription')
    
    # 1. Update product base info
    p.price = 1995000
    p.original_price = 2490000
    p.save()
    
    # 2. Recreate variants
    # Delete old ones to avoid duplicates
    p.variants.all().delete()
    
    v1 = ProductVariant.objects.create(
        product=p,
        title="اکانت اختصاصی با دسترسی کامل (شخصی)",
        price=1995000,
        original_price=2490000,
        group_fa="نوع اشتراک",
        sort_order=1
    )
    
    v2 = ProductVariant.objects.create(
        product=p,
        title="شارژ حساب شخصی شما",
        price=0,  # Will be dynamically calculated on API fetch based on USD rate
        original_price=0,
        group_fa="نوع اشتراک",
        sort_order=2
    )
    
    print("Product and variants updated successfully in the database!")
    print(f"Variant 1: {v1.title} - Price: {v1.price}")
    print(f"Variant 2: {v2.title} - Price: {v2.price} (Will resolve dynamically)")
except Product.DoesNotExist:
    print("Error: chatgpt-subscription product not found in the database!")
    sys.exit(1)
except Exception as e:
    print(f"Error: {e}")
    sys.exit(1)
