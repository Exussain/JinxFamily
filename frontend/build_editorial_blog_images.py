import os
import requests
import json
import urllib.parse
from PIL import Image, ImageEnhance, ImageFilter, ImageDraw

headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36"
}

COVERS_DIR = "/root/jinxfamily/frontend/public/blog/covers"
SECTIONS_DIR = "/root/jinxfamily/frontend/public/blog/sections"
os.makedirs(COVERS_DIR, exist_ok=True)
os.makedirs(SECTIONS_DIR, exist_ok=True)

# Define queries with editorial theme colors
IMAGE_CONFIGS = [
    # COVERS (1920x1080)
    {
        "path": os.path.join(COVERS_DIR, "guide-buy-vbucks.jpg"),
        "query": "Fortnite V Bucks wallpaper HD 1080p",
        "size": (1920, 1080),
        "glow": (138, 43, 226), # Purple
    },
    {
        "path": os.path.join(COVERS_DIR, "guide-crew-pack.jpg"),
        "query": "Fortnite Crew subscription pack official wallpaper 4k",
        "size": (1920, 1080),
        "glow": (255, 215, 0), # Gold
    },
    {
        "path": os.path.join(COVERS_DIR, "guide-buy-chatgpt-plus.jpg"),
        "query": "OpenAI ChatGPT Plus GPT-5 dark mode interface wallpaper 4k",
        "size": (1920, 1080),
        "glow": (16, 163, 127), # OpenAI Teal
    },
    {
        "path": os.path.join(COVERS_DIR, "guide-gemini-advanced.jpg"),
        "query": "Google Gemini AI Advanced official dark gradient banner 4k",
        "size": (1920, 1080),
        "glow": (26, 115, 232), # Google Blue
    },
    {
        "path": os.path.join(COVERS_DIR, "guide-buy-steam-giftcard.jpg"),
        "query": "Steam Gift Card wallet official digital card banner 4k",
        "size": (1920, 1080),
        "glow": (23, 26, 33), # Steam Navy
    },
    {
        "path": os.path.join(COVERS_DIR, "guide-preorder-gta6.jpg"),
        "query": "GTA VI Vice City official artwork poster 4k",
        "size": (1920, 1080),
        "glow": (255, 0, 128), # Neon Pink
    },
    {
        "path": os.path.join(COVERS_DIR, "guide-spotify-premium.jpg"),
        "query": "Spotify Premium official dark green music banner 4k",
        "size": (1920, 1080),
        "glow": (30, 215, 96), # Spotify Green
    },

    # SECTIONS (1280x720)
    {
        "path": os.path.join(SECTIONS_DIR, "guide-buy-vbucks-0.jpg"),
        "query": "Fortnite Item Shop skins daily rotation 4k",
        "size": (1280, 720),
        "glow": (138, 43, 226),
    },
    {
        "path": os.path.join(SECTIONS_DIR, "guide-buy-vbucks-1.jpg"),
        "query": "Fortnite V Bucks card 1000 2800 official 4k",
        "size": (1280, 720),
        "glow": (0, 191, 255),
    },
    {
        "path": os.path.join(SECTIONS_DIR, "guide-crew-pack-0.jpg"),
        "query": "Fortnite Crew monthly skin outfit bundle",
        "size": (1280, 720),
        "glow": (255, 215, 0),
    },
    {
        "path": os.path.join(SECTIONS_DIR, "guide-crew-pack-1.jpg"),
        "query": "Fortnite Battle Pass Season rewards wallpaper HD",
        "size": (1280, 720),
        "glow": (138, 43, 226),
    },
    {
        "path": os.path.join(SECTIONS_DIR, "guide-buy-chatgpt-plus-0.jpg"),
        "query": "ChatGPT GPT 4o GPT 5 dark mode code editor",
        "size": (1280, 720),
        "glow": (16, 163, 127),
    },
    {
        "path": os.path.join(SECTIONS_DIR, "guide-buy-chatgpt-plus-1.jpg"),
        "query": "OpenAI logo dark technology background",
        "size": (1280, 720),
        "glow": (16, 163, 127),
    },
    {
        "path": os.path.join(SECTIONS_DIR, "guide-gemini-advanced-0.jpg"),
        "query": "Google Gemini 1.5 Pro AI interface laptop dark",
        "size": (1280, 720),
        "glow": (26, 115, 232),
    },
    {
        "path": os.path.join(SECTIONS_DIR, "guide-gemini-advanced-1.jpg"),
        "query": "Google One 2TB storage AI Premium icon",
        "size": (1280, 720),
        "glow": (26, 115, 232),
    },
    {
        "path": os.path.join(SECTIONS_DIR, "guide-buy-steam-giftcard-0.jpg"),
        "query": "Steam store PC gaming library games",
        "size": (1280, 720),
        "glow": (102, 192, 244),
    },
    {
        "path": os.path.join(SECTIONS_DIR, "guide-buy-steam-giftcard-1.jpg"),
        "query": "Steam wallet code redeem interface",
        "size": (1280, 720),
        "glow": (102, 192, 244),
    },
    {
        "path": os.path.join(SECTIONS_DIR, "guide-preorder-gta6-0.jpg"),
        "query": "GTA VI Lucia Jason Vice City sunset artwork",
        "size": (1280, 720),
        "glow": (255, 0, 128),
    },
    {
        "path": os.path.join(SECTIONS_DIR, "guide-preorder-gta6-1.jpg"),
        "query": "PlayStation 5 console PS5 game box",
        "size": (1280, 720),
        "glow": (0, 112, 209),
    },
    {
        "path": os.path.join(SECTIONS_DIR, "guide-spotify-premium-0.jpg"),
        "query": "Spotify Premium app music player dark interface",
        "size": (1280, 720),
        "glow": (30, 215, 96),
    },
    {
        "path": os.path.join(SECTIONS_DIR, "guide-spotify-premium-1.jpg"),
        "query": "Spotify headphones music listening dark aesthetic",
        "size": (1280, 720),
        "glow": (30, 215, 96),
    },
]

def search_bing_urls(query):
    url = f"https://www.bing.com/images/search?q={urllib.parse.quote_plus(query)}&form=HDRSC2"
    img_urls = []
    try:
        r = requests.get(url, headers=headers, timeout=10)
        if r.status_code == 200:
            from bs4 import BeautifulSoup
            soup = BeautifulSoup(r.text, "html.parser")
            for a in soup.find_all("a", class_="iusc"):
                m_attr = a.get("m", "")
                if m_attr:
                    try:
                        m_data = json.loads(m_attr)
                        murl = m_data.get("murl")
                        if murl and murl.startswith("http"):
                            img_urls.append(murl)
                    except:
                        pass
    except Exception as e:
        print(f"Error searching for '{query}': {e}")
    return img_urls

def process_to_editorial_blog_image(raw_bytes, target_size, glow_color):
    """
    Transforms raw image into a high-end editorial blog image:
    1. Crops & resizes to exact 16:9 ratio with cover fill.
    2. Adds subtle contrast/color enhancement.
    3. Adds editorial dark vignette and subtle themed ambient glow overlay.
    """
    from io import BytesIO
    img = Image.open(BytesIO(raw_bytes))
    if img.mode != "RGBA":
        img = img.convert("RGBA")
    
    tw, th = target_size
    iw, ih = img.size
    
    # 1. Crop to target aspect ratio (center crop)
    target_aspect = tw / th
    img_aspect = iw / ih
    
    if img_aspect > target_aspect:
        # Image is wider: crop sides
        new_w = int(ih * target_aspect)
        offset = (iw - new_w) // 2
        img = img.crop((offset, 0, offset + new_w, ih))
    else:
        # Image is taller: crop top/bottom
        new_h = int(iw / target_aspect)
        offset = (ih - new_h) // 2
        img = img.crop((0, offset, iw, offset + new_h))
        
    img = img.resize((tw, th), Image.Resampling.LANCZOS)
    
    # 2. Color & Sharpness enhancement for blog vibrancy
    enhancer = ImageEnhance.Color(img)
    img = enhancer.enhance(1.15)
    
    enhancer = ImageEnhance.Contrast(img)
    img = enhancer.enhance(1.08)
    
    # 3. Create ambient dark vignette & theme glow overlay
    overlay = Image.new("RGBA", (tw, th), (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)
    
    # Add subtle bottom-up dark gradient for text readability & editorial look
    for y in range(int(th * 0.4), th):
        alpha = int(220 * ((y - th * 0.4) / (th * 0.6)))
        draw.line([(0, y), (tw, y)], fill=(12, 16, 24, alpha))
        
    # Add ambient glow in top-right corner
    glow_overlay = Image.new("RGBA", (tw, th), (0, 0, 0, 0))
    glow_draw = ImageDraw.Draw(glow_overlay)
    gr, gg, gb = glow_color
    glow_draw.ellipse([tw - int(tw*0.4), -int(th*0.3), tw + int(tw*0.2), int(th*0.6)], fill=(gr, gg, gb, 40))
    glow_overlay = glow_overlay.filter(ImageFilter.GaussianBlur(80))
    
    # Composite layers
    img_rgba = img.convert("RGBA")
    img_rgba = Image.alpha_composite(img_rgba, glow_overlay)
    img_rgba = Image.alpha_composite(img_rgba, overlay)
    
    return img_rgba.convert("RGB")

print("Processing editorial blog images...")
for item in IMAGE_CONFIGS:
    target_path = item["path"]
    query = item["query"]
    target_size = item["size"]
    glow_color = item["glow"]
    filename = os.path.basename(target_path)
    
    print(f"\nProcessing {filename} ({target_size[0]}x{target_size[1]}) -> '{query}'")
    urls = search_bing_urls(query)
    
    success = False
    for u in urls[:12]:
        try:
            res = requests.get(u, headers=headers, timeout=8)
            if res.status_code == 200 and len(res.content) > 15000:
                final_img = process_to_editorial_blog_image(res.content, target_size, glow_color)
                final_img.save(target_path, "JPEG", quality=95)
                print(f"✓ SUCCESSFULLY CREATED EDITORIAL IMAGE: {filename} ({target_size[0]}x{target_size[1]})")
                success = True
                break
        except Exception as err:
            continue
            
    if not success:
        print(f"⚠ Failed for {filename}")

print("\nAll editorial blog images build complete!")
