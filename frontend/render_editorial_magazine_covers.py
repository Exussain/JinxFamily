import os
import math
from PIL import Image, ImageDraw, ImageFilter, ImageFont, ImageEnhance

COVERS_DIR = "/root/jinxfamily/frontend/public/blog/covers"
SECTIONS_DIR = "/root/jinxfamily/frontend/public/blog/sections"
os.makedirs(COVERS_DIR, exist_ok=True)
os.makedirs(SECTIONS_DIR, exist_ok=True)

# Helper function to create smooth radial gradient
def create_radial_gradient(size, inner_color, outer_color):
    w, h = size
    base = Image.new("RGBA", (w, h), outer_color)
    glow = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    draw = ImageDraw.Draw(glow)
    
    cx, cy = w // 2, h // 2
    max_r = math.sqrt(cx**2 + cy**2)
    
    r_in, g_in, b_in, a_in = inner_color
    r_out, g_out, b_out, a_out = outer_color
    
    # Draw soft radial circle in center
    rx, ry = int(w * 0.45), int(h * 0.45)
    draw.ellipse([cx - rx, cy - ry, cx + rx, cy + ry], fill=inner_color)
    glow = glow.filter(ImageFilter.GaussianBlur(int(min(w, h) * 0.25)))
    
    return Image.alpha_composite(base, glow)

def draw_grid_pattern(img, grid_size=60, line_color=(255, 255, 255, 12)):
    draw = ImageDraw.Draw(img)
    w, h = img.size
    for x in range(0, w, grid_size):
        draw.line([(x, 0), (x, h)], fill=line_color, width=1)
    for y in range(0, h, grid_size):
        draw.line([(0, y), (w, y)], fill=line_color, width=1)
    return img

def render_magazine_cover(target_path, size, theme_config):
    """
    Renders an ultra-premium editorial magazine cover image (16:9).
    theme_config:
      - bg_colors: (inner_rgba, outer_rgba)
      - title: Main title text (e.g. "FORTNITE V-BUCKS")
      - subtitle: Subtitle text (e.g. "COMPLETE BUYING & SAFETY GUIDE")
      - badge: Top pill badge text (e.g. "JINX FAMILY • OFFICIAL GUIDE")
      - accent_color: RGB tuple for accents
      - icon_symbol: Central graphic motif (e.g. "V", "⚡", "VI", "♫", "✦", "🎮", "⌘")
    """
    w, h = size
    inner_c, outer_c = theme_config["bg_colors"]
    accent_rgb = theme_config["accent_color"]
    
    # 1. Base gradient background
    bg = create_radial_gradient(size, inner_c, outer_c)
    bg = draw_grid_pattern(bg, grid_size=70 if w >= 1920 else 50, line_color=(255, 255, 255, 10))
    
    draw = ImageDraw.Draw(bg)
    
    # 2. Glowing central orb ring
    cx, cy = w // 2, int(h * 0.45)
    ring_r = int(min(w, h) * 0.22)
    
    ring_img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    r_draw = ImageDraw.Draw(ring_img)
    
    ar, ag, ab = accent_rgb
    r_draw.ellipse([cx - ring_r, cy - ring_r, cx + ring_r, cy + ring_r], outline=(ar, ag, ab, 180), width=4)
    r_draw.ellipse([cx - ring_r - 15, cy - ring_r - 15, cx + ring_r + 15, cy + ring_r + 15], outline=(ar, ag, ab, 60), width=2)
    ring_img = ring_img.filter(ImageFilter.GaussianBlur(10))
    bg = Image.alpha_composite(bg, ring_img)
    
    draw = ImageDraw.Draw(bg)
    
    # 3. Draw Central Icon Symbol / Emblem
    symbol = theme_config.get("icon_symbol", "✦")
    try:
        # Load default system font or large render
        symbol_font_size = int(min(w, h) * 0.28)
        font_symbol = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", symbol_font_size)
    except:
        font_symbol = ImageFont.load_default()
        
    try:
        bbox = font_symbol.getbbox(symbol)
        sw, sh = bbox[2] - bbox[0], bbox[3] - bbox[1]
    except:
        sw, sh = 100, 100
        
    draw.text((cx - sw//2, cy - sh//2 - 10), symbol, fill=(255, 255, 255, 240), font=font_symbol)
    
    # 4. Top Pill Badge (e.g. JINX FAMILY • GUIDES)
    badge_text = theme_config.get("badge", "JINX FAMILY • OFFICIAL GUIDE")
    try:
        font_badge = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", int(h * 0.028))
    except:
        font_badge = ImageFont.load_default()
        
    try:
        bbox_b = font_badge.getbbox(badge_text)
        bw, bh = bbox_b[2] - bbox_b[0], bbox_b[3] - bbox_b[1]
    except:
        bw, bh = 200, 20
        
    b_padding_x, b_padding_y = 20, 8
    bx1 = cx - bw//2 - b_padding_x
    by1 = int(h * 0.12)
    bx2 = cx + bw//2 + b_padding_x
    by2 = by1 + bh + b_padding_y * 2
    
    # Glassmorphism pill background
    pill_img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    p_draw = ImageDraw.Draw(pill_img)
    p_draw.rounded_rectangle([bx1, by1, bx2, by2], radius=16, fill=(15, 23, 42, 180), outline=(ar, ag, ab, 200), width=2)
    bg = Image.alpha_composite(bg, pill_img)
    
    draw = ImageDraw.Draw(bg)
    draw.text((cx - bw//2, by1 + b_padding_y), badge_text, fill=(ar, ag, ab, 255), font=font_badge)
    
    # 5. Main Title & Subtitle at Bottom
    title_text = theme_config.get("title", "")
    subtitle_text = theme_config.get("subtitle", "")
    
    try:
        font_title = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", int(h * 0.065))
        font_sub = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", int(h * 0.032))
    except:
        font_title = ImageFont.load_default()
        font_sub = ImageFont.load_default()
        
    # Bottom vignette for text backdrop
    vig = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    v_draw = ImageDraw.Draw(vig)
    for y in range(int(h * 0.65), h):
        alpha = int(240 * ((y - h * 0.65) / (h * 0.35)))
        v_draw.line([(0, y), (w, y)], fill=(8, 12, 20, alpha))
    bg = Image.alpha_composite(bg, vig)
    
    draw = ImageDraw.Draw(bg)
    
    # Title
    try:
        bbox_t = font_title.getbbox(title_text)
        tw, th_t = bbox_t[2] - bbox_t[0], bbox_t[3] - bbox_t[1]
    except:
        tw, th_t = 300, 40
    draw.text((cx - tw//2, int(h * 0.76)), title_text, fill=(255, 255, 255, 255), font=font_title)
    
    # Subtitle
    try:
        bbox_sub = font_sub.getbbox(subtitle_text)
        subw, subh = bbox_sub[2] - bbox_sub[0], bbox_sub[3] - bbox_sub[1]
    except:
        subw, subh = 200, 20
    draw.text((cx - subw//2, int(h * 0.86)), subtitle_text, fill=(180, 195, 220, 255), font=font_sub)
    
    # Outer Border Frame
    draw.rectangle([0, 0, w-1, h-1], outline=(ar, ag, ab, 120), width=3)
    
    # Convert to RGB JPEG
    bg.convert("RGB").save(target_path, "JPEG", quality=95)
    print(f"✓ RENDERED EDITORIAL GRAPHIC: {os.path.basename(target_path)} ({w}x{h})")

# 7 COVERS & 14 SECTIONS CONFIGURATIONS
TASKS = [
    # COVERS (1920x1080)
    {
        "path": os.path.join(COVERS_DIR, "guide-buy-vbucks.jpg"),
        "size": (1920, 1080),
        "config": {
            "bg_colors": ((138, 43, 226, 120), (12, 10, 24, 255)),
            "accent_color": (0, 240, 255), # Cyan
            "badge": "JINX FAMILY • FORTNITE GUIDE",
            "title": "FORTNITE V-BUCKS BUYING GUIDE",
            "subtitle": "BEST PRICES • FAST DELIVERY • 100% SAFE ACCOUNT ACTIVATION",
            "icon_symbol": "💎"
        }
    },
    {
        "path": os.path.join(COVERS_DIR, "guide-crew-pack.jpg"),
        "size": (1920, 1080),
        "config": {
            "bg_colors": ((255, 180, 0, 110), (15, 12, 24, 255)),
            "accent_color": (255, 215, 0), # Gold
            "badge": "JINX FAMILY • SUBSCRIPTION REVIEW",
            "title": "FORTNITE CREW PACK REVIEW",
            "subtitle": "MONTHLY SKINS • 1000 V-BUCKS • BATTLE PASS VALUE BREAKDOWN",
            "icon_symbol": "👑"
        }
    },
    {
        "path": os.path.join(COVERS_DIR, "guide-buy-chatgpt-plus.jpg"),
        "size": (1920, 1080),
        "config": {
            "bg_colors": ((16, 163, 127, 120), (10, 20, 18, 255)),
            "accent_color": (16, 230, 160), # OpenAI Teal
            "badge": "JINX FAMILY • AI SUBSCRIPTION GUIDE",
            "title": "CHATGPT PLUS & GPT-5.6 MASTER GUIDE",
            "subtitle": "GPT-5.6 SOL • DEEP RESEARCH • AGENT MODE • ADVANCED VOICE",
            "icon_symbol": "🤖"
        }
    },
    {
        "path": os.path.join(COVERS_DIR, "guide-gemini-advanced.jpg"),
        "size": (1920, 1080),
        "config": {
            "bg_colors": ((26, 115, 232, 120), (8, 16, 32, 255)),
            "accent_color": (66, 133, 244), # Google Blue
            "badge": "JINX FAMILY • GOOGLE AI GUIDE",
            "title": "GOOGLE GEMINI ADVANCED & AI PRO",
            "subtitle": "GEMINI 3.1 PRO • 2TB GOOGLE ONE STORAGE • DEEP RESEARCH",
            "icon_symbol": "✨"
        }
    },
    {
        "path": os.path.join(COVERS_DIR, "guide-buy-steam-giftcard.jpg"),
        "size": (1920, 1080),
        "config": {
            "bg_colors": ((102, 192, 244, 90), (23, 26, 33, 255)),
            "accent_color": (102, 192, 244), # Steam Cyan
            "badge": "JINX FAMILY • STEAM WALLET GUIDE",
            "title": "STEAM GIFT CARD & REGION GUIDE",
            "subtitle": "INSTANT DIGITAL REDEEM • REGION SELECTION • STEAM STORE SALES",
            "icon_symbol": "🎮"
        }
    },
    {
        "path": os.path.join(COVERS_DIR, "guide-preorder-gta6.jpg"),
        "size": (1920, 1080),
        "config": {
            "bg_colors": ((255, 0, 128, 120), (20, 8, 24, 255)),
            "accent_color": (255, 0, 180), # Neon Pink
            "badge": "JINX FAMILY • GAME PRE-ORDER",
            "title": "GRAND THEFT AUTO VI PRE-ORDER",
            "subtitle": "VICE CITY • LUCIA & JASON • PS5 & XBOX SERIES X/S LAUNCH",
            "icon_symbol": "🌴"
        }
    },
    {
        "path": os.path.join(COVERS_DIR, "guide-spotify-premium.jpg"),
        "size": (1920, 1080),
        "config": {
            "bg_colors": ((30, 215, 96, 110), (10, 24, 14, 255)),
            "accent_color": (30, 230, 110), # Spotify Green
            "badge": "JINX FAMILY • MUSIC SUBSCRIPTION",
            "title": "SPOTIFY PREMIUM LEGAL GUIDE",
            "subtitle": "AD-FREE MUSIC • HIGH QUALITY 320KBPS • OFFLINE DOWNLOADS",
            "icon_symbol": "🎧"
        }
    },

    # SECTIONS (1280x720)
    {
        "path": os.path.join(SECTIONS_DIR, "guide-buy-vbucks-0.jpg"),
        "size": (1280, 720),
        "config": {
            "bg_colors": ((138, 43, 226, 100), (12, 10, 24, 255)),
            "accent_color": (0, 240, 255),
            "badge": "SECTION 01 • FORTNITE STORE",
            "title": "ITEM SHOP & COSMETICS",
            "subtitle": "EXPLORE DAILY SKINS, PICKAXES & EMOTES",
            "icon_symbol": "🛍️"
        }
    },
    {
        "path": os.path.join(SECTIONS_DIR, "guide-buy-vbucks-1.jpg"),
        "size": (1280, 720),
        "config": {
            "bg_colors": ((0, 191, 255, 100), (10, 16, 28, 255)),
            "accent_color": (0, 240, 255),
            "badge": "SECTION 02 • SAFETY & PRICING",
            "title": "LEGAL V-BUCKS ACTIVATION",
            "subtitle": "1000, 2800, 5000 & 13500 V-BUCKS PACKS",
            "icon_symbol": "🔒"
        }
    },
    {
        "path": os.path.join(SECTIONS_DIR, "guide-crew-pack-0.jpg"),
        "size": (1280, 720),
        "config": {
            "bg_colors": ((255, 215, 0, 100), (20, 16, 10, 255)),
            "accent_color": (255, 215, 0),
            "badge": "SECTION 01 • CREW REWARDS",
            "title": "MONTHLY EXCLUSIVE BUNDLE",
            "subtitle": "EXCLUSIVE OUTFIT, BACK BLING & PICKAXE",
            "icon_symbol": "🎁"
        }
    },
    {
        "path": os.path.join(SECTIONS_DIR, "guide-crew-pack-1.jpg"),
        "size": (1280, 720),
        "config": {
            "bg_colors": ((138, 43, 226, 100), (16, 10, 24, 255)),
            "accent_color": (255, 215, 0),
            "badge": "SECTION 02 • VALUE ANALYSIS",
            "title": "BATTLE PASS & 1000 V-BUCKS",
            "subtitle": "ECONOMICAL SUBSCRIPTION MATH & SAVINGS",
            "icon_symbol": "📊"
        }
    },
    {
        "path": os.path.join(SECTIONS_DIR, "guide-buy-chatgpt-plus-0.jpg"),
        "size": (1280, 720),
        "config": {
            "bg_colors": ((16, 163, 127, 100), (10, 20, 18, 255)),
            "accent_color": (16, 230, 160),
            "badge": "SECTION 01 • MODEL FEATURES",
            "title": "GPT-5.6 SOL & DEEP RESEARCH",
            "subtitle": "AUTONOMOUS AGENT MODE & CHATGPT WORK",
            "icon_symbol": "⚡"
        }
    },
    {
        "path": os.path.join(SECTIONS_DIR, "guide-buy-chatgpt-plus-1.jpg"),
        "size": (1280, 720),
        "config": {
            "bg_colors": ((16, 163, 127, 100), (10, 20, 18, 255)),
            "accent_color": (16, 230, 160),
            "badge": "SECTION 02 • ACCOUNT SAFETY",
            "title": "100% PRIVATE EMAIL ACTIVATION",
            "subtitle": "PERSONAL ACCOUNT OWNERSHIP & GUARANTEE",
            "icon_symbol": "🛡️"
        }
    },
    {
        "path": os.path.join(SECTIONS_DIR, "guide-gemini-advanced-0.jpg"),
        "size": (1280, 720),
        "config": {
            "bg_colors": ((26, 115, 232, 100), (8, 16, 32, 255)),
            "accent_color": (66, 133, 244),
            "badge": "SECTION 01 • GEMINI 3.1 PRO",
            "title": "1M CONTEXT & DEEP REASONING",
            "subtitle": "LARGE FILE ANALYSIS & CODE PROCESSSING",
            "icon_symbol": "🧠"
        }
    },
    {
        "path": os.path.join(SECTIONS_DIR, "guide-gemini-advanced-1.jpg"),
        "size": (1280, 720),
        "config": {
            "bg_colors": ((26, 115, 232, 100), (8, 16, 32, 255)),
            "accent_color": (66, 133, 244),
            "badge": "SECTION 02 • GOOGLE ONE",
            "title": "2TB CLOUD STORAGE INCLUDED",
            "subtitle": "FULL GOOGLE ECOSYSTEM INTEGRATION",
            "icon_symbol": "☁️"
        }
    },
    {
        "path": os.path.join(SECTIONS_DIR, "guide-buy-steam-giftcard-0.jpg"),
        "size": (1280, 720),
        "config": {
            "bg_colors": ((102, 192, 244, 100), (23, 26, 33, 255)),
            "accent_color": (102, 192, 244),
            "badge": "SECTION 01 • REGION GUIDE",
            "title": "STEAM REGION & CURRENCY",
            "subtitle": "TURKEY, US, EURO & GLOBAL WALLET CARDS",
            "icon_symbol": "🌐"
        }
    },
    {
        "path": os.path.join(SECTIONS_DIR, "guide-buy-steam-giftcard-1.jpg"),
        "size": (1280, 720),
        "config": {
            "bg_colors": ((102, 192, 244, 100), (23, 26, 33, 255)),
            "accent_color": (102, 192, 244),
            "badge": "SECTION 02 • REDEEM STEPS",
            "title": "HOW TO REDEEM STEAM CODE",
            "subtitle": "STEP-BY-STEP STEAM WALLET CHARGING",
            "icon_symbol": "🔑"
        }
    },
    {
        "path": os.path.join(SECTIONS_DIR, "guide-preorder-gta6-0.jpg"),
        "size": (1280, 720),
        "config": {
            "bg_colors": ((255, 0, 128, 100), (20, 8, 24, 255)),
            "accent_color": (255, 0, 180),
            "badge": "SECTION 01 • GAME WORLD",
            "title": "VICE CITY & LEONIDA STATE",
            "subtitle": "LUCIA & JASON STORYLINE & OPEN WORLD",
            "icon_symbol": "🌆"
        }
    },
    {
        "path": os.path.join(SECTIONS_DIR, "guide-preorder-gta6-1.jpg"),
        "size": (1280, 720),
        "config": {
            "bg_colors": ((0, 112, 209, 100), (10, 16, 32, 255)),
            "accent_color": (0, 180, 255),
            "badge": "SECTION 02 • PLATFORMS",
            "title": "PS5 & XBOX SERIES X/S",
            "subtitle": "DAY ONE PRE-ORDER & DIGITAL ACTIVATION",
            "icon_symbol": "🎮"
        }
    },
    {
        "path": os.path.join(SECTIONS_DIR, "guide-spotify-premium-0.jpg"),
        "size": (1280, 720),
        "config": {
            "bg_colors": ((30, 215, 96, 100), (10, 24, 14, 255)),
            "accent_color": (30, 230, 110),
            "badge": "SECTION 01 • PREMIUM FEATURES",
            "title": "HIGH QUALITY AUDIO & NO ADS",
            "subtitle": "320KBPS BITRATE & UNLIMITED SKIPS",
            "icon_symbol": "🎵"
        }
    },
    {
        "path": os.path.join(SECTIONS_DIR, "guide-spotify-premium-1.jpg"),
        "size": (1280, 720),
        "config": {
            "bg_colors": ((30, 215, 96, 100), (10, 24, 14, 255)),
            "accent_color": (30, 230, 110),
            "badge": "SECTION 02 • ACTIVATION",
            "title": "FAMILY PORTAL & PLAYLIST SAFE",
            "subtitle": "PRESERVE YOUR PLAYLISTS WITH FULL GUARANTEE",
            "icon_symbol": "🔊"
        }
    },
]

print("Rendering 21 custom editorial magazine blog images...")
for task in TASKS:
    render_magazine_cover(task["path"], task["size"], task["config"])

print("\nDone rendering all 21 editorial magazine blog images!")
