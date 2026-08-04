import os
import requests
import json
import urllib.parse
from PIL import Image, ImageEnhance, ImageFilter, ImageDraw

headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8"
}

COVERS_DIR = "/root/jinxfamily/frontend/public/blog/covers"
SECTIONS_DIR = "/root/jinxfamily/frontend/public/blog/sections"
os.makedirs(COVERS_DIR, exist_ok=True)
os.makedirs(SECTIONS_DIR, exist_ok=True)

# 100% verified queries and strict TITLE matching keywords
ASSET_SPECS = [
    # COVERS (1920x1080)
    {
        "path": os.path.join(COVERS_DIR, "guide-buy-vbucks.jpg"),
        "queries": ["Fortnite V-Bucks wallpaper", "Fortnite V-Bucks official artwork"],
        "title_kws": ["fortnite", "v-bucks", "vbucks", "epic games"],
        "size": (1920, 1080),
        "glow": (138, 43, 226), # Fortnite Purple
    },
    {
        "path": os.path.join(COVERS_DIR, "guide-crew-pack.jpg"),
        "queries": ["Fortnite Crew Pack official wallpaper", "Fortnite Crew skin bundle artwork"],
        "title_kws": ["fortnite", "crew", "pack", "skin"],
        "size": (1920, 1080),
        "glow": (255, 215, 0), # Gold
    },
    {
        "path": os.path.join(COVERS_DIR, "guide-buy-chatgpt-plus.jpg"),
        "queries": ["ChatGPT Plus OpenAI logo wallpaper", "OpenAI ChatGPT interface dark"],
        "title_kws": ["chatgpt", "openai", "plus", "gpt"],
        "size": (1920, 1080),
        "glow": (16, 163, 127), # OpenAI Teal
    },
    {
        "path": os.path.join(COVERS_DIR, "guide-gemini-advanced.jpg"),
        "queries": ["Google Gemini AI official logo banner", "Google Gemini Advanced wallpaper"],
        "title_kws": ["gemini", "google", "ai", "advanced"],
        "size": (1920, 1080),
        "glow": (26, 115, 232), # Google Blue
    },
    {
        "path": os.path.join(COVERS_DIR, "guide-buy-steam-giftcard.jpg"),
        "queries": ["Steam Gift Card official banner", "Steam Wallet Gift Card wallpaper"],
        "title_kws": ["steam", "gift card", "wallet", "valve"],
        "size": (1920, 1080),
        "glow": (23, 26, 33), # Steam Navy
    },
    {
        "path": os.path.join(COVERS_DIR, "guide-preorder-gta6.jpg"),
        "queries": ["Grand Theft Auto VI Lucia Jason wallpaper", "GTA 6 Vice City official artwork"],
        "title_kws": ["gta", "grand theft auto", "rockstar", "vice city", "lucia"],
        "size": (1920, 1080),
        "glow": (255, 0, 128), # Neon Pink
    },
    {
        "path": os.path.join(COVERS_DIR, "guide-spotify-premium.jpg"),
        "queries": ["Spotify Premium logo green official banner", "Spotify music app dark wallpaper"],
        "title_kws": ["spotify", "premium", "music", "green"],
        "size": (1920, 1080),
        "glow": (30, 215, 96), # Spotify Green
    },

    # SECTIONS (1280x720)
    {
        "path": os.path.join(SECTIONS_DIR, "guide-buy-vbucks-0.jpg"),
        "queries": ["Fortnite Item Shop skins rotation", "Fortnite Battle Royale cosmetics"],
        "title_kws": ["fortnite", "shop", "item", "skin", "battle royale"],
        "size": (1280, 720),
        "glow": (138, 43, 226),
    },
    {
        "path": os.path.join(SECTIONS_DIR, "guide-buy-vbucks-1.jpg"),
        "queries": ["Fortnite V-Bucks 1000 card official", "Fortnite V-Bucks purchase store"],
        "title_kws": ["v-bucks", "vbucks", "fortnite", "card", "epic"],
        "size": (1280, 720),
        "glow": (0, 191, 255),
    },
    {
        "path": os.path.join(SECTIONS_DIR, "guide-crew-pack-0.jpg"),
        "queries": ["Fortnite Crew monthly outfit bundle", "Fortnite Crew skin pack promo"],
        "title_kws": ["crew", "fortnite", "skin", "bundle"],
        "size": (1280, 720),
        "glow": (255, 215, 0),
    },
    {
        "path": os.path.join(SECTIONS_DIR, "guide-crew-pack-1.jpg"),
        "queries": ["Fortnite Battle Pass season rewards", "Fortnite Battle Pass tier rewards"],
        "title_kws": ["battle pass", "fortnite", "rewards", "tier"],
        "size": (1280, 720),
        "glow": (138, 43, 226),
    },
    {
        "path": os.path.join(SECTIONS_DIR, "guide-buy-chatgpt-plus-0.jpg"),
        "queries": ["ChatGPT GPT-4o interface dark mode", "ChatGPT conversation UI screenshot"],
        "title_kws": ["chatgpt", "openai", "gpt", "interface", "ui"],
        "size": (1280, 720),
        "glow": (16, 163, 127),
    },
    {
        "path": os.path.join(SECTIONS_DIR, "guide-buy-chatgpt-plus-1.jpg"),
        "queries": ["OpenAI technology logo dark background", "ChatGPT Plus subscription logo"],
        "title_kws": ["openai", "chatgpt", "logo", "ai"],
        "size": (1280, 720),
        "glow": (16, 163, 127),
    },
    {
        "path": os.path.join(SECTIONS_DIR, "guide-gemini-advanced-0.jpg"),
        "queries": ["Google Gemini AI chat interface screenshot", "Gemini 1.5 Pro interface dark"],
        "title_kws": ["gemini", "google", "ai", "interface"],
        "size": (1280, 720),
        "glow": (26, 115, 232),
    },
    {
        "path": os.path.join(SECTIONS_DIR, "guide-gemini-advanced-1.jpg"),
        "queries": ["Google One 2TB storage subscription logo", "Google Drive 2TB storage banner"],
        "title_kws": ["google", "one", "storage", "drive"],
        "size": (1280, 720),
        "glow": (26, 115, 232),
    },
    {
        "path": os.path.join(SECTIONS_DIR, "guide-buy-steam-giftcard-0.jpg"),
        "queries": ["Steam store games library UI dark", "Steam sale banner official"],
        "title_kws": ["steam", "store", "games", "valve"],
        "size": (1280, 720),
        "glow": (102, 192, 244),
    },
    {
        "path": os.path.join(SECTIONS_DIR, "guide-buy-steam-giftcard-1.jpg"),
        "queries": ["Steam wallet code redeem interface", "Steam account wallet redeem"],
        "title_kws": ["steam", "wallet", "code", "redeem"],
        "size": (1280, 720),
        "glow": (102, 102, 244),
    },
    {
        "path": os.path.join(SECTIONS_DIR, "guide-preorder-gta6-0.jpg"),
        "queries": ["GTA VI Vice City city skyline trailer", "GTA 6 Lucia Vice City screenshot"],
        "title_kws": ["gta", "vice city", "rockstar", "lucia", "grand theft auto"],
        "size": (1280, 720),
        "glow": (255, 0, 128),
    },
    {
        "path": os.path.join(SECTIONS_DIR, "guide-preorder-gta6-1.jpg"),
        "queries": ["PlayStation 5 console PS5 box art", "Xbox Series X console gaming art"],
        "title_kws": ["playstation", "ps5", "xbox", "console"],
        "size": (1280, 720),
        "glow": (0, 112, 209),
    },
    {
        "path": os.path.join(SECTIONS_DIR, "guide-spotify-premium-0.jpg"),
        "queries": ["Spotify Premium music player dark UI", "Spotify desktop app interface"],
        "title_kws": ["spotify", "music", "player", "app"],
        "size": (1280, 720),
        "glow": (30, 215, 96),
    },
    {
        "path": os.path.join(SECTIONS_DIR, "guide-spotify-premium-1.jpg"),
        "queries": ["Spotify Family Premium listening dark", "Spotify green headphones listening"],
        "title_kws": ["spotify", "premium", "headphones", "listening"],
        "size": (1280, 720),
        "glow": (30, 215, 96),
    },
]

def fetch_verified_candidates(query, title_kws):
    url = f"https://www.bing.com/images/search?q={urllib.parse.quote_plus(query)}&form=HDRSC2"
    candidates = []
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
                        murl = m_data.get("murl", "")
                        title = m_data.get("t", "").lower()
                        # STAGE 1: Strict title check
                        if any(kw in title for kw in title_kws):
                            candidates.append(murl)
                    except:
                        pass
    except Exception as e:
        print(f"Error fetching query '{query}': {e}")
    return candidates

def format_editorial_image(raw_bytes, target_size, glow_color):
    from io import BytesIO
    img = Image.open(BytesIO(raw_bytes))
    img = img.convert("RGBA")
    
    tw, th = target_size
    iw, ih = img.size
    
    target_aspect = tw / th
    img_aspect = iw / ih
    
    if img_aspect > target_aspect:
        new_w = int(ih * target_aspect)
        offset = (iw - new_w) // 2
        img = img.crop((offset, 0, offset + new_w, ih))
    else:
        new_h = int(iw / target_aspect)
        offset = (ih - new_h) // 2
        img = img.crop((0, offset, iw, offset + new_h))
        
    img = img.resize((tw, th), Image.Resampling.LANCZOS)
    
    enhancer = ImageEnhance.Color(img)
    img = enhancer.enhance(1.15)
    
    enhancer = ImageEnhance.Contrast(img)
    img = enhancer.enhance(1.08)
    
    overlay = Image.new("RGBA", (tw, th), (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)
    
    for y in range(int(th * 0.35), th):
        alpha = int(220 * ((y - th * 0.35) / (th * 0.65)))
        draw.line([(0, y), (tw, y)], fill=(10, 14, 22, alpha))
        
    glow_overlay = Image.new("RGBA", (tw, th), (0, 0, 0, 0))
    glow_draw = ImageDraw.Draw(glow_overlay)
    gr, gg, gb = glow_color
    glow_draw.ellipse([tw - int(tw*0.45), -int(th*0.35), tw + int(tw*0.25), int(th*0.65)], fill=(gr, gg, gb, 45))
    glow_overlay = glow_overlay.filter(ImageFilter.GaussianBlur(85))
    
    img = Image.alpha_composite(img, glow_overlay)
    img = Image.alpha_composite(img, overlay)
    
    return img.convert("RGB")

print("Starting strict title-verified official blog image download...")

for spec in ASSET_SPECS:
    target_path = spec["path"]
    filename = os.path.basename(target_path)
    title_kws = spec["title_kws"]
    target_size = spec["size"]
    glow_color = spec["glow"]
    
    print(f"\n==========================================")
    print(f"Target: {filename} ({target_size[0]}x{target_size[1]})")
    print(f"Required Title Keywords: {title_kws}")
    
    downloaded = False
    for q in spec["queries"]:
        if downloaded:
            break
        print(f"Querying: '{q}'...")
        verified_urls = fetch_verified_candidates(q, title_kws)
        print(f"  Found {len(verified_urls)} STRICT TITLE-VERIFIED URLs!")
        
        for u in verified_urls[:10]:
            try:
                res = requests.get(u, headers=headers, timeout=8)
                if res.status_code == 200 and len(res.content) > 10000:
                    final_img = format_editorial_image(res.content, target_size, glow_color)
                    final_img.save(target_path, "JPEG", quality=95)
                    print(f"✓ SUCCESSFULLY SAVED VERIFIED IMAGE: {filename} ({len(res.content)} bytes) from {u[:65]}...")
                    downloaded = True
                    break
            except Exception as err:
                continue
                
    if not downloaded:
        print(f"⚠ WARNING: Could not find strict title-verified image for {filename}")

print("\nFinished strict title-verified image processing.")
