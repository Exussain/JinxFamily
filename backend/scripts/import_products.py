#!/usr/bin/env python3
import os
import sys
import json
import re
import urllib.parse
from PIL import Image

# Setup Django environment
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'nubixstore.settings')

import django
django.setup()

from shop.models import Product, ProductVariant, SubCategory

IMPORT_JSON = '/root/Projects/NubixShop/import-products/products.json'
COVERS_DIR = '/root/Projects/NubixShop/import-products/covers'
MEDIA_PRODUCTS_DIR = '/root/Projects/NubixShop/backend/media/products'

os.makedirs(MEDIA_PRODUCTS_DIR, exist_ok=True)

def replace_aghagame(text):
    if not text:
        return text
    if isinstance(text, str):
        res = text.replace('aghagame.ir', 'nubixshop.ir')
        res = res.replace('AGHAGAME.IR', 'nubixshop.ir')
        res = res.replace('aghagame', 'nubixshop')
        res = res.replace('AghaGame', 'NubixShop')
        res = res.replace('AGHAGAME', 'NUBIXSHOP')
        res = res.replace('آقاگیم', 'نوبیکس شاپ')
        res = res.replace('آقا گیم', 'نوبیکس شاپ')
        return res
    if isinstance(text, list):
        return [replace_aghagame(item) for item in text]
    if isinstance(text, dict):
        return {k: replace_aghagame(v) for k, v in text.items()}
    return text

def extract_toman_price(price_str):
    if not price_str:
        return 0
    if isinstance(price_str, (int, float)):
        return int(price_str)
    
    clean_str = str(price_str).replace(',', '').replace('،', '')
    digits = re.findall(r'\d+', clean_str)
    if not digits:
        return 0
    
    nums = [int(d) for d in digits if int(d) > 0]
    if nums:
        return min(nums)
    return 0

def map_category_and_subcat(categories_list):
    cats = [c.strip() for c in categories_list if c]
    cat_str = ' '.join(cats)
    
    if 'فورتنایت' in cat_str:
        return 'FORTNITE', ''
    elif 'پابجی' in cat_str:
        return 'PUBG', 'pubg'
    elif 'کالاف دیوتی' in cat_str:
        return 'COD_MOBILE', 'cod_mobile'
    elif 'کلش رویال' in cat_str:
        return 'CLASH_ROYALE', 'clash_royale'
    elif 'کلش اف کلنز' in cat_str:
        return 'CLASH_OF_CLANS', 'clash_of_clans'
    elif 'براول استارز' in cat_str:
        return 'BRAWL_STARS', 'brawl_stars'
    elif 'فری فایر' in cat_str:
        return 'FREE_FIRE', 'free_fire'
    elif 'کاهش پینگ' in cat_str:
        return 'PING_REDUCTION', 'ping_reduction'
    elif 'بازی های موبایل' in cat_str or 'موبایل' in cat_str:
        return 'MOBILE_GAMES', 'mobile_games'
    elif 'رینبو' in cat_str:
        return 'RAINBOW_SIX', 'rainbow_six'
    elif 'ریوالز' in cat_str or 'مارول' in cat_str:
        return 'MARVEL_RIVALS', 'marvel_rivals'
    elif 'ولورانت' in cat_str:
        return 'VALORANT', 'valorant'
    else:
        return 'GAMES', ''

def convert_purchase_fields(pfields):
    if not pfields or not isinstance(pfields, list):
        return []
    
    custom_fields = []
    for idx, pf in enumerate(pfields):
        if not isinstance(pf, dict):
            continue
        
        raw_type = pf.get('type', 'text')
        fieldType = 'text'
        if raw_type == 'select':
            fieldType = 'select'
        elif raw_type == 'textarea':
            fieldType = 'textarea'
        
        label = pf.get('placeholder') or pf.get('name') or f"فیلد {idx + 1}"
        label = replace_aghagame(label)
        
        if any(w in label for w in ['ایمیل', 'email', 'جیمیل', 'gmail']):
            fieldType = 'email'
        elif any(w in label for w in ['رمز', 'password', 'پسورد', 'pass']):
            fieldType = 'password'
            
        options = None
        if fieldType == 'select' and pf.get('values'):
            options = [replace_aghagame(v.get('label', '')) for v in pf['values'] if v.get('label')]
            
        key = f"field_{idx + 1}"
        if 'ایمیل' in label or 'email' in label:
            key = 'account_email'
        elif 'رمز' in label or 'pass' in label:
            key = 'account_password'
        elif 'نوع' in label or 'حساب' in label:
            key = 'account_type'
        elif 'آیدی' in label or 'uid' in label.lower():
            key = 'account_uid'
            
        custom_fields.append({
            'key': key,
            'label': label,
            'type': fieldType,
            'required': bool(pf.get('required', True)),
            'placeholder': label,
            'options': options
        })
        
    return custom_fields

def process_cover_image(cover_rel_file, clean_slug):
    cover_src_path = os.path.join('/root/Projects/NubixShop/import-products', cover_rel_file)
    if not os.path.exists(cover_src_path):
        cover_src_path = os.path.join(COVERS_DIR, os.path.basename(cover_rel_file))
        
    if not os.path.exists(cover_src_path):
        print(f"Warning: Cover image not found for {clean_slug} at {cover_src_path}")
        return "", ""
    
    dst_500_name = f"{clean_slug}-500.webp"
    dst_cover_name = f"{clean_slug}-cover.webp"
    
    dst_500_path = os.path.join(MEDIA_PRODUCTS_DIR, dst_500_name)
    dst_cover_path = os.path.join(MEDIA_PRODUCTS_DIR, dst_cover_name)
    
    try:
        with Image.open(cover_src_path) as img:
            if img.mode in ('RGBA', 'LA') or (img.mode == 'P' and 'transparency' in img.info):
                img_rgb = img.convert('RGBA')
            else:
                img_rgb = img.convert('RGB')
                
            # 500x500 high resolution WebP for crisp product cards
            img_500 = img_rgb.resize((500, 500), Image.Resampling.LANCZOS)
            img_500.save(dst_500_path, 'WEBP', quality=92, optimize=True)
            
            # Full detail cover image
            img_rgb.save(dst_cover_path, 'WEBP', quality=95, optimize=True)
            
        return f"/media/products/{dst_500_name}", f"/media/products/{dst_cover_name}"
    except Exception as e:
        print(f"Error processing image {cover_src_path}: {e}")
        return "", ""

def run_import():
    print(f"Loading products from {IMPORT_JSON}...")
    with open(IMPORT_JSON, 'r', encoding='utf-8') as f:
        catalog = json.load(f)
        
    raw_products = catalog.get('products', [])
    print(f"Total raw products to import: {len(raw_products)}")
    
    imported_count = 0
    updated_count = 0
    
    for idx, p_raw in enumerate(raw_products, start=1):
        p_clean = replace_aghagame(p_raw)
        title = p_clean.get('title', '').strip()
        if not title:
            continue
            
        cover_info = p_raw.get('generated_cover', {})
        cover_filename = cover_info.get('filename', '')
        
        clean_slug = re.sub(r'^\d+-', '', cover_filename).replace('.png', '').strip()
        if not clean_slug:
            clean_slug = f"product-{idx}"
            
        categories_list = p_clean.get('categories', [])
        category_code, subcategory_code = map_category_and_subcat(categories_list)
        
        # Image processing (500x500 WebP)
        cover_rel_file = cover_info.get('file', f"covers/{cover_filename}")
        image_500_url, cover_16_9_url = process_cover_image(cover_rel_file, clean_slug)
        
        pricing_data = p_clean.get('pricing', {})
        display_text = pricing_data.get('display_text', '')
        pricing_variations = pricing_data.get('variations', [])
        
        main_price = 0
        if display_text:
            main_price = extract_toman_price(display_text)
            
        var_prices = []
        if pricing_variations:
            for pv in pricing_variations:
                p_val = pv.get('display_price_toman') or extract_toman_price(pv.get('price_text'))
                if p_val > 0:
                    var_prices.append(p_val)
                    
        if var_prices:
            min_var_price = min(var_prices)
            if main_price == 0 or min_var_price < main_price:
                main_price = min_var_price
                
        subtitle = p_clean.get('subtitle', '')
        if not subtitle:
            if category_code == 'FORTNITE':
                subtitle = "تحویل سریع و فعال‌سازی قانونی فورتنایت"
            elif category_code == 'MOBILE_GAMES':
                subtitle = "تحویل سریع و شارژ فوری اکانت"
            elif category_code == 'SUBSCRIPTIONS':
                subtitle = "فعال‌سازی قانونی و تضمینی"
            else:
                subtitle = "تحویل سریع و پشتیبانی ۲۴/۷"
                
        description = p_clean.get('description', '') or f"<p>خرید آنلاین {title} با تحویل سریع، فعال‌سازی قانونی و پشتیبانی ۲۴/۷ در نوبیکس شاپ.</p>"
        
        pfields = p_clean.get('options', {}).get('purchase_fields', [])
        custom_fields = convert_purchase_fields(pfields)
        
        product, created = Product.objects.get_or_create(
            slug=clean_slug,
            defaults={
                'name_fa': title,
                'subtitle': subtitle,
                'category': category_code,
                'subcategory': subcategory_code,
                'image_url': image_500_url,
                'cover_16_9': cover_16_9_url,
                'price': main_price,
                'original_price': 0,
                'active': True,
                'description': description,
                'custom_fields': custom_fields,
                'display_order': 100 + idx
            }
        )
        
        # Always update image_url to 500x500 high-res WebP
        product.image_url = image_500_url
        if cover_16_9_url:
            product.cover_16_9 = cover_16_9_url
        product.name_fa = title
        product.subtitle = subtitle
        product.category = category_code
        if subcategory_code:
            product.subcategory = subcategory_code
        if main_price > 0:
            product.price = main_price
        product.active = True
        if description:
            product.description = description
        if custom_fields:
            product.custom_fields = custom_fields
        product.save()
        
        if created:
            imported_count += 1
        else:
            updated_count += 1
            
        if pricing_variations:
            product.variants.all().delete()
            for v_idx, pv in enumerate(pricing_variations, start=1):
                attrs = pv.get('attributes', {})
                v_title_parts = [str(val) for val in attrs.values() if val]
                v_title = " · ".join(v_title_parts) if v_title_parts else f"گزینه {v_idx}"
                v_title = replace_aghagame(v_title)
                
                v_price = pv.get('display_price_toman') or extract_toman_price(pv.get('price_text')) or main_price
                v_reg_price = pv.get('display_regular_price_toman') or 0
                v_orig = v_reg_price if v_reg_price > v_price else 0
                
                ProductVariant.objects.create(
                    product=product,
                    title=v_title,
                    price=v_price,
                    original_price=v_orig,
                    sort_order=v_idx
                )

    print(f"\nImport and 500x500 image generation finished successfully!")
    print(f"Newly created products: {imported_count}")
    print(f"Updated products (with 500x500 WebP): {updated_count}")
    print(f"Total products in DB now: {Product.objects.count()}")

if __name__ == '__main__':
    run_import()
