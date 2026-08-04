import os
from PIL import Image, ImageOps

GAMES_DIR = "/root/jinxfamily/frontend/public/images/games"

def convert_images():
    print("Starting game images conversion...")
    for filename in os.listdir(GAMES_DIR):
        if not filename.endswith((".jpg", ".png", ".jpeg")):
            continue
        
        file_path = os.path.join(GAMES_DIR, filename)
        name_without_ext, _ = os.path.splitext(filename)
        output_path = os.path.join(GAMES_DIR, f"{name_without_ext}.webp")
        
        print(f"Processing {filename}...")
        try:
            with Image.open(file_path) as img:
                # Convert to RGB mode
                img = img.convert('RGB')
                # Fit / crop to 500x500 to maintain aspect ratio
                img_resized = ImageOps.fit(img, (500, 500), Image.Resampling.LANCZOS)
                # Save as WebP
                img_resized.save(output_path, 'WEBP', quality=85)
                print(f"Saved: {output_path}")
            
            # Remove original file
            os.remove(file_path)
            print(f"Removed original: {file_path}")
        except Exception as e:
            print(f"Error processing {filename}: {e}")

if __name__ == "__main__":
    convert_images()
