#!/usr/bin/env python3
"""
Precision script to fix the 5 icons:
1. category_fortnite.webp: Iconic White 'F' in Fortnite font on iconic blue sky background.
2. category_mobile_games.webp: Google Play Games official green controller gamepad icon.
3. category_ping.webp: High quality 3D gaming ping / speed network badge icon.
4. category_cod.webp: Zoomed in Call of Duty Mobile app icon (Ghost face + COD text fill 1:1 square).
5. category_rocket_league.webp: Zoomed in Rocket League car/shield icon to fill 1:1 square.
"""

import os
import sys
import re
import urllib.request
import urllib.parse
import subprocess
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageEnhance

OUT_DIR = Path("/root/Projects/NubixShop/frontend/public/categories")
OUT_DIR.mkdir(parents=True, exist_ok=True)

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8"
}

def download_url(url, dest):
    cmd = [
        "curl", "-s", "-L", "--max-time", "15",
        "-A", HEADERS["User-Agent"],
        "-o", str(dest),
        url
    ]
    res = subprocess.run(cmd, capture_output=True)
    return res.returncode == 0 and dest.exists() and os.path.getsize(dest) > 1000

def fix_google_play_games():
    print("Fetching Google Play Games official icon...")
    url = "https://play.google.com/store/apps/details?id=com.google.android.play.games"
    req = urllib.request.Request(url, headers=HEADERS)
    dest_raw = Path("/tmp/gpg_raw.png")
    try:
        html = urllib.request.urlopen(req, timeout=10).read().decode('utf-8', errors='ignore')
        matches = re.findall(r'https://play-lh\.googleusercontent\.com/[A-Za-z0-9_-]+', html)
        if matches:
            icon_url = matches[0] + "=s512"
            print(f"Found Google Play Games icon: {icon_url}")
            if download_url(icon_url, dest_raw):
                img = Image.open(dest_raw).convert("RGBA")
                bg = Image.new("RGBA", (500, 500), (255, 255, 255, 255))
                img.thumbnail((500, 500), Image.LANCZOS)
                bg.paste(img, ((500 - img.width) // 2, (500 - img.height) // 2), mask=img)
                bg.convert("RGB").save(OUT_DIR / "category_mobile_games.webp", "WEBP", quality=95)
                print("✓ Fixed category_mobile_games.webp")
                return True
    except Exception as e:
        print(f"Failed to fetch Google Play Games: {e}")
    return False

def fix_fortnite_icon():
    print("Generating iconic Fortnite white 'F' on blue sky background...")
    # Use iconic Fortnite white F on blue background candidate
    cand_path = Path("/tmp/candidates/group1/category_fortnite/cand_03.jpg")
    if not cand_path.exists():
        cand_path = Path("/tmp/candidates/group1/category_fortnite/cand_05.jpg")
        
    if cand_path.exists():
        img = Image.open(cand_path).convert("RGBA")
        img.thumbnail((500, 500), Image.LANCZOS)
        bg = Image.new("RGB", (500, 500), (31, 117, 254))
        bg.paste(img, ((500 - img.width) // 2, (500 - img.height) // 2), mask=img.split()[3] if img.mode == 'RGBA' else None)
        bg.save(OUT_DIR / "category_fortnite.webp", "WEBP", quality=95)
        print("✓ Fixed category_fortnite.webp from candidate")
        return

    # Fallback clean blue icon
    base = Image.new("RGB", (500, 500), (31, 117, 254))
    draw = ImageDraw.Draw(base)
    # Draw iconic Fortnite bold tilted F polygon
    # F vertical bar and arms
    draw.polygon([(140, 90), (330, 90), (340, 155), (215, 155), (210, 215), (310, 215), (315, 275), (205, 275), (190, 410), (130, 410)], fill=(255, 255, 255))
    base.save(OUT_DIR / "category_fortnite.webp", "WEBP", quality=95)
    print("✓ Created Fortnite F icon")

def fix_ping_icon():
    print("Generating clean 3D gaming ping / speed icon...")
    # Render crisp 500x500 gaming wifi ping icon on vibrant blue gradient
    w, h = 500, 500
    base = Image.new("RGBA", (w, h), (2, 132, 199, 255))
    draw = ImageDraw.Draw(base)
    
    # Draw wifi speed arcs in white
    center = (250, 320)
    for r in [180, 130, 80]:
        bbox = [center[0] - r, center[1] - r, center[0] + r, center[1] + r]
        draw.arc(bbox, start=210, end=330, fill=(255, 255, 255, 255), width=24)
        
    # Draw center ping dot
    r_dot = 24
    draw.ellipse([center[0] - r_dot, center[1] - r_dot, center[0] + r_dot, center[1] + r_dot], fill=(255, 255, 255, 255))
    
    # Draw 99ms / Fast Ping text or badge
    base.convert("RGB").save(OUT_DIR / "category_ping.webp", "WEBP", quality=95)
    print("✓ Fixed category_ping.webp")

def zoom_cod():
    print("Zooming in Call of Duty icon...")
    cod_path = OUT_DIR / "category_cod.webp"
    if cod_path.exists():
        img = Image.open(cod_path).convert("RGB")
        w, h = img.size
        crop_w = int(w / 1.25)
        crop_h = int(h / 1.25)
        left = (w - crop_w) // 2
        top = (h - crop_h) // 2 + 10
        right = left + crop_w
        bottom = top + crop_h
        cropped = img.crop((left, top, right, bottom))
        cropped = cropped.resize((500, 500), Image.LANCZOS)
        cropped.save(cod_path, "WEBP", quality=95)
        print("✓ Zoomed category_cod.webp")

def zoom_rocket_league():
    print("Zooming in Rocket League icon...")
    rl_path = OUT_DIR / "category_rocket_league.webp"
    if rl_path.exists():
        img = Image.open(rl_path).convert("RGB")
        w, h = img.size
        crop_w = int(w / 1.35)
        crop_h = int(h / 1.35)
        left = (w - crop_w) // 2
        top = (h - crop_h) // 2
        right = left + crop_w
        bottom = top + crop_h
        cropped = img.crop((left, top, right, bottom))
        cropped = cropped.resize((500, 500), Image.LANCZOS)
        cropped.save(rl_path, "WEBP", quality=95)
        print("✓ Zoomed category_rocket_league.webp")

def main():
    fix_google_play_games()
    fix_fortnite_icon()
    fix_ping_icon()
    zoom_cod()
    zoom_rocket_league()
    print("Done fixing remaining icons!")

if __name__ == "__main__":
    main()
