import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "jinxfamilystore.settings")
django.setup()

from shop.models import Product, ProductVariant

def run():
    products = Product.objects.all()
    updated_count = 0
    for p in products:
        # Check if it's Fortnite Crew Pack or similar crew products
        is_crew = "crew" in (p.slug or "").lower() or "کروپک" in (p.name_fa or "")
        markup = 95000 if is_crew else 79000
        
        old_price = p.price or 0
        new_price = old_price + markup
        p.price = new_price
        p.save()
        
        # Update first variant if exists for consistency
        variants = ProductVariant.objects.filter(product=p).order_by('id')
        variant_msg = ""
        if variants.exists():
            first_variant = variants.first()
            old_v_price = first_variant.price or 0
            new_v_price = old_v_price + markup
            first_variant.price = new_v_price
            first_variant.save()
            variant_msg = f" | First Variant '{first_variant.title}' price: {old_v_price} -> {new_v_price}"
            
        print(f"Product '{p.name_fa or p.slug}': {old_price} -> {new_price}{variant_msg}")
        updated_count += 1

    print(f"Successfully updated {updated_count} products in database.")

if __name__ == "__main__":
    run()
