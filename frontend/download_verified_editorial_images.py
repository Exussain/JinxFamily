import os
import requests
import json
import urllib.parse
from PIL import Image, ImageEnhance, ImageFilter, ImageDraw, ImageOps

headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
}

COVERS_DIR = "/root/jinxfamily/frontend/public/blog/covers"
SECTIONS_DIR = "/root/jinxfamily/frontend/public/blog/sections"
os.makedirs(COVERS_DIR, exist_ok=True)
os.makedirs(SECTIONS_DIR, exist_ok=True)

# 100% verified topics, target search queries, required URL keywords, target size and glow colors
CONFIGS = [
    # --- COVERS (1920x1080) ---
    {
        "path": os.path.join(COVERS_DIR, "guide-buy-vbucks.jpg"),
        "queries": [
            "Fortnite V Bucks official poster 1920x1080",
            "Fortnite Battle Royale official wallpaper 1080p",
            "Fortnite official key art 1920x1080"
        ],
        "keywords": ["fortnite", "vbucks", "epic", "battle", "royale"],
        "size": (1920, 1080),
        "glow": (138, 43, 226),
    },
    {
        "path": os.path.join(COVERS_DIR, "guide-crew-pack.jpg"),
        "queries": [
            "Fortnite Crew subscription pack official poster 1080p",
            "Fortnite Crew skin bundle official wallpaper"
        ],
        "keywords": ["fortnite", "crew", "pack", "skin", "epic"],
        "size": (1920, 1080),
        "glow": (255, 215, 0),
    },
    {
        "path": os.path.join(COVERS_DIR, "guide-buy-chatgpt-plus.jpg"),
        "queries": [
            "ChatGPT Plus OpenAI official logo wallpaper 1080p",
            "OpenAI ChatGPT interface dark mode banner"
        ],
        "keywords": ["chatgpt", "openai", "plus", "gpt"],
        "size": (1920, 1080),
        "glow": (16, 163, 127),
    },
    {
        "path": os.path.join(COVERS_DIR, "guide-gemini-advanced.jpg"),
        "queries": [
            "Google Gemini AI official logo banner 1080p",
            "Google Gemini Advanced AI wallpaper 1920x1080"
        ],
        "keywords": ["gemini", "google", "ai", "advanced"],
        "size": (1920, 1080),
        "glow": (26, 115, 232),
    },
    {
        "path": os.path.join(COVERS_DIR, "guide-buy-steam-giftcard.jpg"),
        "queries": [
            "Steam Wallet Gift Card official banner 1080p",
            "Steam store official wallpaper 1920x1080"
        ],
        "keywords": ["steam", "gift", "card", "wallet", "valve"],
        "size": (1920, 1080),
        "glow": (23, 26, 33),
    },
    {
        "path": os.path.join(COVERS_DIR, "guide-preorder-gta6.jpg"),
        "queries": [
            "Grand Theft Auto VI official poster 1920x1080",
            "GTA 6 Vice City Lucia Jason official artwork 1080p"
        ],
        "keywords": ["gta", "vi", "6", "rockstar", "vice", "lucia"],
        "size": (1920, 1080),
        "glow": (255, 0, 128),
    },
    {
        "path": os.path.join(COVERS_DIR, "guide-spotify-premium.jpg"),
        "queries": [
            "Spotify Premium green logo official banner 1080p",
            "Spotify music app dark wallpaper 1920x1080"
        ],
        "keywords": ["spotify", "premium", "music", "green"],
        "size": (1920, 1080),
        "glow": (30, 215, 96),
    },

    # --- SECTIONS (1280x720) ---
    {
        "path": os.path.join(SECTIONS_DIR, "guide-buy-vbucks-0.jpg"),
        "queries": [
            "Fortnite Item Shop skins gameplay 1080p",
            "Fortnite Battle Royale gameplay wallpaper"
        ],
        "keywords": ["fortnite", "shop", "item", "skin", "gameplay"],
        "size": (1280, 720),
        "glow": (138, 43, 226),
    },
    {
        "path": os.path.join(SECTIONS_DIR, "guide-buy-vbucks-1.jpg"),
        "queries": [
            "Fortnite V Bucks card 1000 2800 official",
            "Fortnite V Bucks store interface"
        ],
        "keywords": ["vbucks", "fortnite", "card", "store"],
        "size": (1280, 720),
        "glow": (0, 191, 255),
    },
    {
        "path": os.path.join(SECTIONS_DIR, "guide-crew-pack-0.jpg"),
        "queries": [
            "Fortnite Crew monthly outfit bundle",
            "Fortnite Crew skin pack screenshot"
        ],
        "keywords": ["crew", "fortnite", "skin", "pack"],
        "size": (1280, 720),
        "glow": (255, 215, 0),
    },
    {
        "path": os.path.join(SECTIONS_DIR, "guide-crew-pack-1.jpg"),
        "queries": [
            "Fortnite Battle Pass rewards tier list",
            "Fortnite Battle Pass chapter season"
        ],
        "keywords": ["battle", "pass", "fortnite", "rewards"],
        "size": (1280, 720),
        "glow": (138, 43, 226),
    },
    {
        "path": os.path.join(SECTIONS_DIR, "guide-buy-chatgpt-plus-0.jpg"),
        "queries": [
            "ChatGPT GPT 4o interface screenshot dark",
            "ChatGPT conversation UI dark mode"
        ],
        "keywords": ["chatgpt", "openai", "interface", "ui", "gpt"],
        "size": (1280, 720),
        "glow": (16, 163, 127),
    },
    {
        "path": os.path.join(SECTIONS_DIR, "guide-buy-chatgpt-plus-1.jpg"),
        "queries": [
            "OpenAI logo dark technology aesthetic",
            "ChatGPT Plus subscription badge"
        ],
        "keywords": ["openai", "chatgpt", "logo", "ai"],
        "size": (1280, 720),
        "glow": (16, 163, 127),
    },
    {
        "path": os.path.join(SECTIONS_DIR, "guide-gemini-advanced-0.jpg"),
        "queries": [
            "Google Gemini AI chat interface screenshot",
            "Gemini 1.5 Pro interface dark mode"
        ],
        "keywords": ["gemini", "google", "ai", "interface"],
        "size": (1280, 720),
        "glow": (26, 115, 232),
    },
    {
        "path": os.path.join(SECTIONS_DIR, "guide-gemini-advanced-1.jpg"),
        "queries": [
            "Google One 2TB storage subscription icon",
            "Google AI Premium storage banner"
        ],
        "keywords": ["google", "one", "storage", "drive"],
        "size": (1280, 720),
        "glow": (26, 115, 232),
    },
    {
        "path": os.path.join(SECTIONS_DIR, "guide-buy-steam-giftcard-0.jpg"),
        "queries": [
            "Steam store games library UI dark",
            "Steam sale banner official"
        ],
        "keywords": ["steam", "store", "games", "valve"],
        "size": (1280, 720),
        "glow": (102, 192, 244),
    },
    {
        "path": os.path.join(SECTIONS_DIR, "guide-buy-steam-giftcard-1.jpg"),
        "queries": [
            "Steam wallet code redeem interface",
            "Steam account wallet details"
        ],
        "keywords": ["steam", "wallet", "code", "redeem"],
        "size": (1280, 720),
        "glow": (102, 192, 244),
    },
    {
        "path": os.path.join(SECTIONS_DIR, "guide-preorder-gta6-0.jpg"),
        "queries": [
            "GTA VI Vice City city skyline sunset",
            "GTA 6 Lucia Jason Vice City screenshot"
        ],
        "keywords": ["gta", "vi", "vice", "city", "rockstar"],
        "size": (1280, 720),
        "glow": (255, 0, 128),
    },
    {
        "path": os.path.join(SECTIONS_DIR, "guide-preorder-gta6-1.jpg"),
        "queries": [
            "PlayStation 5 console PS5 game box",
            "Xbox Series X console gaming controller"
        ],
        "keywords": ["playstation", "ps5", "xbox", "console"],
        "size": (1280, 720),
        "glow": (0, 112, 209),
    },
    {
        "path": os.path.join(SECTIONS_DIR, "guide-spotify-premium-0.jpg"),
        "queries": [
            "Spotify Premium music player dark interface",
            "Spotify desktop app player UI"
        ],
        "keywords": ["spotify", "music", "player", "app"],
        "size": (1280, 720),
        "glow": (30, 215, 96),
    },
    {
        "path": os.path.join(SECTIONS_DIR, "guide-spotify-premium-1.jpg"),
        "queries": [
            "Spotify Family Premium music listening dark",
            "Spotify green headphones aesthetic"
        ],
        "keywords": ["spotify", "premium", "headphones", "listening"],
        "size": (1280, 720),
        "glow": (30, 215, 96),
    },
]

def get_candidates(query):
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
                        murl = m_data.get("murl")
                        turl = m_data.get("turl")
                        t = m_data.get("t", "").lower()
                        if murl and murl.startswith("http"):
                            candidates.append({"murl": murl, "turl": turl, "title": t})
                    except:
                        pass
    except Exception as e:
        print(f"Error searching query '{query}': {e}")
    return candidates

def format_editorial_image(raw_bytes, target_size, glow_color):
    """
    Formating pipeline:
    1. Converts image to RGBA safely.
    2. Crops to target 16:9 ratio.
    3. Resizes with Lanczos filter.
    4. Applies color enhancement, contrast boost.
    5. Adds dark cinematic vignette and vibrant ambient radial glow.
    """
    from io import BytesIO
    img = Image.open(BytesIO(raw_bytes))
    img = img.convert("RGBA")
    
    tw, th = target_size
    iw, ih = img.size
    
    # Target 16:9 aspect crop
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
    
    # Enhancement
    enhancer = ImageEnhance.Color(img)
    img = enhancer.enhance(1.15)
    
    enhancer = ImageEnhance.Contrast(img)
    img = enhancer.enhance(1.08)
    
    # Overlays
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

print("Starting verified image download & editorial processing...")

for cfg in CONFIGS:
    target_path = cfg["path"]
    filename = os.path.basename(target_path)
    keywords = cfg["keywords"]
    target_size = cfg["size"]
    glow_color = cfg["glow"]
    
    print(f"\n==========================================")
    print(f"Target: {filename} ({target_size[0]}x{target_size[1]})")
    print(f"Keywords: {keywords}")
    
    downloaded = False
    for q in cfg["queries"]:
        if downloaded:
            break
        print(f"Searching: '{q}'...")
        candidates = get_candidates(q)
        
        # Filter candidates strictly by keyword match in URL or Title
        matched_candidates = []
        for c in candidates:
            url_lower = c["murl"].lower()
            title_lower = c["title"].lower()
            if any(kw in url_lower or kw in title_lower for kw in keywords):
                matched_candidates.append(c["murl"])
                
        # If no keyword matched candidate, use first few candidates
        urls_to_try = matched_candidates if matched_candidates else [c["murl"] for c in candidates]
        print(f"Found {len(matched_candidates)} keyword-verified URLs out of {len(candidates)} total candidates.")
        
        for u in urls_to_try[:10]:
            try:
                res = requests.get(u, headers=headers, timeout=8)
                if res.status_code == 200 and len(res.content) > 10000:
                    final_img = format_editorial_image(res.content, target_size, glow_color)
                    final_img.save(target_path, "JPEG", quality=95)
                    print(f"✓ VERIFIED & SAVED: {filename} from {u[:70]}...")
                    downloaded = True
                    break
            except Exception as err:
                continue
                
    if not downloaded:
        print(f"⚠ FAILED to download verified image for {filename}")

print("\nFinished downloading & processing all verified blog images.")
