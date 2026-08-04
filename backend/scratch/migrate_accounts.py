import os
import sys
import requests
import django
from django.core.files.base import ContentFile
from urllib.parse import urlparse

# Add backend base directory to sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'jinxfamily.settings')
django.setup()

from django.contrib.auth.models import User
from shop.models import Product
from shop.marketplace_models import AccountListing, ListingImage
from django.db import transaction

# Get the seller
seller = User.objects.filter(username='gameorbital').first() or User.objects.first()
if not seller:
    print("Error: No user found in database.")
    sys.exit(1)

print(f"Using seller: {seller.username} (ID: {seller.id})")

# Define the account filter
from django.db.models import Q
account_filter = Q(name_fa__startswith='اکانت') | Q(name_fa__startswith='آگهی اکانت') | (Q(category='FORTNITE') & Q(name_fa__icontains='اکانت'))

# Get deactivated account products
deactivated_products = Product.objects.filter(active=False).filter(account_filter)
print(f"Found {deactivated_products.count()} deactivated account products to migrate.")

success_count = 0
for idx, p in enumerate(deactivated_products):
    # Map game choice
    game = 'fortnite'
    title_lower = p.name_fa.lower()
    if 'وایلدریفت' in title_lower or 'wild-rift' in title_lower or 'wildrift' in title_lower:
        game = 'wild-rift'
    elif 'forza' in title_lower:
        game = 'xbox'
    elif 'کالاف' in title_lower or 'cod' in title_lower:
        game = 'cod-mobile'
    elif 'کلش' in title_lower:
        game = 'coc'
    elif 'پابجی' in title_lower or 'pubg' in title_lower:
        game = 'pubg'
    elif 'فری فایر' in title_lower or 'free fire' in title_lower:
        game = 'free-fire'
    elif 'استیم' in title_lower or 'steam' in title_lower:
        game = 'steam'
    
    # Map platform
    platform = 'pc'
    if 'ps5' in title_lower or 'ps4' in title_lower or 'playstation' in title_lower or 'psn' in title_lower:
        platform = 'ps'
    elif 'xbox' in title_lower:
        platform = 'xbox'
    elif 'موبایل' in title_lower or 'mobile' in title_lower or 'گوشی' in title_lower:
        platform = 'mobile'
    
    # Check if Listing already exists with this slug to avoid duplicates
    existing = AccountListing.objects.filter(slug=p.slug).exists()
    if existing:
        print(f"Skipping {p.name_fa} (slug {p.slug} already exists)")
        continue

    try:
        with transaction.atomic():
            # Create AccountListing
            listing = AccountListing.objects.create(
                seller=seller,
                game=game,
                title=p.name_fa,
                slug=p.slug,
                description=p.description or p.subtitle or p.name_fa,
                price=p.price,
                platform=platform,
                region='Iran',
                status='published',
                is_featured=False,
                created_at=p.created_at,
            )
            # Override auto_now_add/auto_now using update
            AccountListing.objects.filter(id=listing.id).update(created_at=p.created_at)
            
            # Download image if it exists
            if p.image_url:
                try:
                    resp = requests.get(p.image_url, timeout=10)
                    if resp.status_code == 200:
                        parsed = urlparse(p.image_url)
                        filename = os.path.basename(parsed.path) or 'image.jpg'
                        if not filename.endswith(('.jpg', '.jpeg', '.png', '.webp')):
                            filename += '.jpg'
                        
                        img_content = ContentFile(resp.content)
                        list_img = ListingImage(listing=listing)
                        list_img.image.save(filename, img_content, save=True)
                        print(f"[{idx+1}/{deactivated_products.count()}] Migrated {p.name_fa} with image.")
                    else:
                        print(f"[{idx+1}/{deactivated_products.count()}] Migrated {p.name_fa} (failed to fetch image: status {resp.status_code})")
                except Exception as img_err:
                    print(f"[{idx+1}/{deactivated_products.count()}] Migrated {p.name_fa} (image download failed: {img_err})")
            else:
                print(f"[{idx+1}/{deactivated_products.count()}] Migrated {p.name_fa} (no image).")
            
            success_count += 1
    except Exception as e:
        print(f"Failed to migrate {p.name_fa}: {e}")

print(f"Successfully migrated {success_count} accounts to AccountListing.")
