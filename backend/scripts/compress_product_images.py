import os
import requests
import io
import urllib.parse
from PIL import Image
import django

# Set up django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'jinxfamily.settings')
django.setup()

from shop.models import Product
from django.conf import settings

MEDIA_PRODUCTS_DIR = os.path.join(settings.MEDIA_ROOT, 'products')
os.makedirs(MEDIA_PRODUCTS_DIR, exist_ok=True)

def compress_to_webp_500(img_data, output_path):
    """
    Takes image bytes (or file-like object) and resizes/saves it to output_path
    as a 500x500 transparent padded WEBP image.
    """
    try:
        img = Image.open(img_data)
        
        # Convert to RGBA to preserve transparency/colors properly
        img = img.convert('RGBA')
        
        # Resize preserving aspect ratio (max dimension 500)
        img.thumbnail((500, 500), Image.Resampling.LANCZOS)
        
        # Create transparent background (500x500)
        background = Image.new("RGBA", (500, 500), (0, 0, 0, 0))
        
        # Paste the thumbnail in the center
        offset = ((500 - img.size[0]) // 2, (500 - img.size[1]) // 2)
        background.paste(img, offset)
        
        # Save the image to output_path in WEBP format
        background.save(output_path, format='WEBP', quality=80)
        print(f"  ✓ Compressed and saved to: {output_path}")
        return True
    except Exception as e:
        print(f"  ✗ Error compressing image to {output_path}: {e}")
        return False

def process_database_products():
    print("\n==================================================")
    print("STEP 1: Processing Database Product Images")
    print("==================================================")
    products = Product.objects.all()
    url_to_filename = {}
    
    for product in products:
        url = product.image_url
        if not url:
            continue
        
        # Check if it is a local media URL already
        if url.startswith('/media/products/'):
            filename = url.split('/')[-1]
            local_path = os.path.join(MEDIA_PRODUCTS_DIR, filename)
            if os.path.exists(local_path):
                # Check if it needs compression
                try:
                    with Image.open(local_path) as img:
                        if img.format == 'WEBP' and img.size == (500, 500):
                            # Already compressed
                            continue
                except Exception:
                    pass
                print(f"Compressing existing local media product {product.id} ({product.name_fa}) image: {local_path}")
                with open(local_path, 'rb') as f:
                    img_bytes = io.BytesIO(f.read())
                compress_to_webp_500(img_bytes, local_path)
            continue
        
        # If it is a remote URL
        if url.startswith('http://') or url.startswith('https://'):
            print(f"Processing product {product.id} ({product.name_fa}): {url}")
            if url in url_to_filename:
                # Already downloaded/processed in this run
                new_url = f"/media/products/{url_to_filename[url]}"
                product.image_url = new_url
                product.save()
                print(f"  ✓ Reused cached local image: {new_url}")
                continue
            
            clean_slug = product.slug if product.slug else f"product_{product.id}"
            clean_slug = clean_slug.replace('/', '_').replace('\\', '_')
            filename = f"{clean_slug}.webp"
            local_path = os.path.join(MEDIA_PRODUCTS_DIR, filename)
            
            print(f"  Downloading from {url}...")
            try:
                headers = {'User-Agent': 'Mozilla/5.0'}
                r = requests.get(url, headers=headers, timeout=15)
                if r.status_code == 200:
                    img_bytes = io.BytesIO(r.content)
                    success = compress_to_webp_500(img_bytes, local_path)
                    if success:
                        new_url = f"/media/products/{filename}"
                        product.image_url = new_url
                        product.save()
                        url_to_filename[url] = filename
                        print(f"  ✓ Updated DB product to local URL: {new_url}")
                    else:
                        print("  Failed to compress downloaded image.")
                else:
                    print(f"  Failed to download: HTTP status {r.status_code}")
            except Exception as e:
                print(f"  Error downloading or saving remote image: {e}")

def process_local_directory(directory_path, desc):
    print("\n==================================================")
    print(f"STEP: Processing {desc} in {directory_path}")
    print("==================================================")
    if not os.path.exists(directory_path):
        print(f"Directory {directory_path} does not exist. Skipping.")
        return
        
    for root, dirs, files in os.walk(directory_path):
        for file in files:
            if file.endswith('.bak'):
                continue
            ext = os.path.splitext(file)[1].lower()
            if ext in ['.webp', '.png', '.jpg', '.jpeg']:
                file_path = os.path.join(root, file)
                print(f"Processing local file: {file_path}")
                try:
                    with Image.open(file_path) as img:
                        if img.format == 'WEBP' and img.size == (500, 500):
                            print("  ✓ Already 500x500 webp. Skipping.")
                            continue
                            
                    with open(file_path, 'rb') as f:
                        img_bytes = io.BytesIO(f.read())
                    
                    if ext == '.webp':
                        compress_to_webp_500(img_bytes, file_path)
                    else:
                        # Convert to webp
                        new_file_path = os.path.splitext(file_path)[0] + '.webp'
                        # Write the webp file
                        success = compress_to_webp_500(img_bytes, new_file_path)
                        # To keep original filenames valid (so references in code don't break),
                        # we also write the webp bytes back to the original filename!
                        if success:
                            # Write webp bytes to original non-webp filename
                            with open(new_file_path, 'rb') as webp_f:
                                webp_bytes = webp_f.read()
                            with open(file_path, 'wb') as orig_f:
                                orig_f.write(webp_bytes)
                            print(f"  ✓ Saved webp bytes to original filename to keep links: {file_path}")
                except Exception as e:
                    print(f"  Error processing local file {file_path}: {e}")

if __name__ == '__main__':
    process_database_products()
    process_local_directory("/root/jinxfamily/frontend/public/products", "Frontend Product Files")
    process_local_directory("/root/jinxfamily/frontend/public/images/games", "Game Covers/Logos")
    print("\nCompression task finished successfully!")
