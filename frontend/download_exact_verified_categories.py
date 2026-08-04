import os
import requests
from PIL import Image, ImageDraw, ImageFilter
import io

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
}

def process_and_save(img, save_path):
    if img.mode in ("RGBA", "LA") or (img.mode == "P" and "transparency" in img.info):
        bg = Image.new("RGBA", img.size, (18, 12, 45, 255)) # #120C2D
        bg.paste(img, (0, 0), img.convert("RGBA"))
        img = bg.convert("RGB")
    elif img.mode != "RGB":
        img = img.convert("RGB")
    
    w, h = img.size
    min_dim = min(w, h)
    left = (w - min_dim) // 2
    top = (h - min_dim) // 2
    right = left + min_dim
    bottom = top + min_dim
    img_cropped = img.crop((left, top, right, bottom))
    img_resized = img_cropped.resize((512, 512), Image.Resampling.LANCZOS)
    
    os.makedirs(os.path.dirname(save_path), exist_ok=True)
    img_resized.save(save_path, "WEBP", quality=95)

def fetch_steam_app(appid, cat_name):
    # Try library_600x900_2x.jpg first
    urls = [
        f"https://cdn.akamai.steamstatic.com/steam/apps/{appid}/library_600x900_2x.jpg",
        f"https://cdn.akamai.steamstatic.com/steam/apps/{appid}/header.jpg",
        f"https://cdn.cloudflare.steamstatic.com/steam/apps/{appid}/page_bg_generated_v6.jpg"
    ]
    for url in urls:
        try:
            r = requests.get(url, headers=HEADERS, timeout=8)
            if r.status_code == 200 and len(r.content) > 5000:
                img = Image.open(io.BytesIO(r.content))
                save_path = f"/tmp/category_candidates/{cat_name}/steam_cand.webp"
                process_and_save(img, save_path)
                print(f"✓ Steam app {appid} saved to {save_path}")
                return save_path
        except Exception as e:
            print(f"Failed Steam url {url}: {e}")
    return None

def create_giftcard_composite():
    # Load platform icons from frontend/public/images/platforms/
    ps_path = "/root/jinxfamily/frontend/public/images/platforms/playstation.webp"
    xbox_path = "/root/jinxfamily/frontend/public/images/platforms/xbox.webp"
    steam_path = "/root/jinxfamily/frontend/public/images/platforms/steam.webp"
    
    # Create 512x512 canvas with dark gradient background #120C2D -> #1E1B4B
    base = Image.new("RGBA", (512, 512), (18, 12, 45, 255))
    draw = ImageDraw.Draw(base)
    
    # Radial glow in center
    glow = Image.new("RGBA", (512, 512), (0, 0, 0, 0))
    glow_draw = ImageDraw.Draw(glow)
    glow_draw.ellipse((50, 50, 462, 462), fill=(245, 158, 11, 40)) # Amber/Gold glow
    glow = glow.filter(ImageFilter.GaussianBlur(40))
    base.paste(glow, (0, 0), glow)
    
    if os.path.exists(ps_path) and os.path.exists(xbox_path) and os.path.exists(steam_path):
        ps_img = Image.open(ps_path).convert("RGBA").resize((140, 140), Image.Resampling.LANCZOS)
        xbox_img = Image.open(xbox_path).convert("RGBA").resize((140, 140), Image.Resampling.LANCZOS)
        steam_img = Image.open(steam_path).convert("RGBA").resize((140, 140), Image.Resampling.LANCZOS)
        
        # Position 3 cards/logos in a triangle layout
        base.paste(ps_img, (80, 130), ps_img)
        base.paste(xbox_img, (290, 130), xbox_img)
        base.paste(steam_img, (185, 280), steam_img)
        
    out_img = base.convert("RGB")
    save_path = "/tmp/category_candidates/giftcard/composite_cand.webp"
    os.makedirs(os.path.dirname(save_path), exist_ok=True)
    out_img.save(save_path, "WEBP", quality=95)
    print(f"✓ Giftcard composite saved to {save_path}")
    return save_path

if __name__ == "__main__":
    fetch_steam_app(1517290, "battlefield6") # Battlefield 2042
    create_giftcard_composite()
