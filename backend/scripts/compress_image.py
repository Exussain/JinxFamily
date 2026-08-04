from PIL import Image, ImageFilter

INPUT_PATH = "/root/jinxfamily/public/frontend/public/products/chatgpt.webp.bak"
OUTPUT_PATH = "/root/jinxfamily/public/frontend/public/products/chatgpt.webp"

print("Loading image for compression...")
try:
    with Image.open(INPUT_PATH) as img:
        print(f"Original image resolution: {img.size}, format: {img.format}")
        
        # 1. Resize to 800x800 for web optimization and anti-aliasing
        # Use Image.Resampling.LANCZOS for clean downscaling
        resized_img = img.resize((800, 800), Image.Resampling.LANCZOS)
        
        # 2. Apply a gentle blur to blend the sharp/pixelated edge contrast
        smoothed_img = resized_img.filter(ImageFilter.GaussianBlur(radius=0.5))
        
        # 3. Save as compressed WebP
        smoothed_img.save(OUTPUT_PATH, 'webp', quality=80)
        
        print("Image compressed, smoothed, and saved successfully!")
        
    # Verify the new image properties
    with Image.open(OUTPUT_PATH) as new_img:
        print(f"New image resolution: {new_img.size}, format: {new_img.format}")
        
except Exception as e:
    print(f"Error compressing image: {e}")
