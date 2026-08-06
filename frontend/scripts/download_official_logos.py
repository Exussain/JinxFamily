#!/usr/bin/env python3
"""
Download official 1:1 game logos using curl with browser headers.
Uses PIL (Pillow) for image processing instead of ImageMagick.
"""

import os
import sys
import subprocess
import time
import shutil
from pathlib import Path
from PIL import Image, ImageOps
import io

OUTPUT_DIR = Path("/root/Projects/JinxFamily/frontend/public/categories")
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
TMP_DIR = Path("/tmp/logo_dl3")
TMP_DIR.mkdir(exist_ok=True)

CURL_HEADERS = [
    "-A", "Mozilla/5.0 (X11; Linux x86_64; rv:127.0) Gecko/20100101 Firefox/127.0",
    "-H", "Accept: image/webp,image/avif,image/*,*/*;q=0.8",
    "-H", "Accept-Language: en-US,en;q=0.9",
    "-H", "Referer: https://commons.wikimedia.org/",
    "-H", "Connection: keep-alive",
]

# Confirmed-working Wikimedia URLs with valid thumbnail sizes
# Game logos only - official brand logos, not character art
LOGOS = [
    ("category_valorant", [
        "https://upload.wikimedia.org/wikipedia/commons/thumb/f/fc/Valorant_logo_-_pink_color_version.svg/960px-Valorant_logo_-_pink_color_version.svg.png",
    ]),
    ("category_fortnite", [
        "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6e/Fortnite_wordmark.svg/960px-Fortnite_wordmark.svg.png",
        "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6e/Fortnite_wordmark.svg/330px-Fortnite_wordmark.svg.png",
    ]),
    ("category_pubg", [
        "https://upload.wikimedia.org/wikipedia/en/thumb/7/7c/PUBG_MOBILE_English_Logo.png/320px-PUBG_MOBILE_English_Logo.png",
    ]),
    ("category_cod", [
        "https://upload.wikimedia.org/wikipedia/en/thumb/5/5a/Call_of_Duty_Mobile_logo.png/320px-Call_of_Duty_Mobile_logo.png",
    ]),
    ("category_clash_royal", [
        "https://upload.wikimedia.org/wikipedia/en/thumb/f/fb/Clash_Royale_Logo.png/320px-Clash_Royale_Logo.png",
    ]),
    ("category_coc", [
        "https://upload.wikimedia.org/wikipedia/en/thumb/7/7f/Clash_of_Clans_Logo.png/320px-Clash_of_Clans_Logo.png",
    ]),
    ("category_brawl_stars", [
        "https://upload.wikimedia.org/wikipedia/en/thumb/6/6d/Brawl_Stars_Logo.png/320px-Brawl_Stars_Logo.png",
    ]),
    ("category_freefire", [
        "https://upload.wikimedia.org/wikipedia/en/thumb/c/cf/Free_Fire_logo.png/320px-Free_Fire_logo.png",
    ]),
    ("category_rainbow", [
        "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5c/Rainbow6siegelogo.svg/960px-Rainbow6siegelogo.svg.png",
        "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5c/Rainbow6siegelogo.svg/330px-Rainbow6siegelogo.svg.png",
    ]),
    ("category_marvel_rivals", [
        # Marvel Rivals official logo from English Wikipedia
        "https://upload.wikimedia.org/wikipedia/en/thumb/3/3e/Marvel_Rivals_logo.png/320px-Marvel_Rivals_logo.png",
    ]),
    ("category_rocket_league", [
        "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d4/Rocket_League_logo_%28new%29.svg/960px-Rocket_League_logo_%28new%29.svg.png",
        "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d4/Rocket_League_logo_%28new%29.svg/330px-Rocket_League_logo_%28new%29.svg.png",
    ]),
    ("category_lol", [
        "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d8/League_of_Legends_2019_vector.svg/960px-League_of_Legends_2019_vector.svg.png",
        "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d8/League_of_Legends_2019_vector.svg/330px-League_of_Legends_2019_vector.svg.png",
    ]),
    ("category_steam", [
        "https://upload.wikimedia.org/wikipedia/commons/thumb/8/83/Steam_icon_logo.svg/960px-Steam_icon_logo.svg.png",
        "https://upload.wikimedia.org/wikipedia/commons/thumb/8/83/Steam_icon_logo.svg/330px-Steam_icon_logo.svg.png",
    ]),
    ("category_giftcard", [
        # Amazon Gift Card logo
        "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a9/Amazon_logo.svg/960px-Amazon_logo.svg.png",
        "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a9/Amazon_logo.svg/330px-Amazon_logo.svg.png",
    ]),
    ("category_ping", [
        # Speedtest / network icon
        "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cf/Network-client.svg/960px-Network-client.svg.png",
        "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cf/Network-client.svg/330px-Network-client.svg.png",
    ]),
    ("category_mobile_games", [
        # Google Play logo
        "https://upload.wikimedia.org/wikipedia/commons/thumb/7/78/Google_Play_Store_badge_EN.svg/960px-Google_Play_Store_badge_EN.svg.png",
        "https://upload.wikimedia.org/wikipedia/commons/thumb/7/78/Google_Play_Store_badge_EN.svg/330px-Google_Play_Store_badge_EN.svg.png",
    ]),
    ("category_ai", [
        # ChatGPT / OpenAI logo
        "https://upload.wikimedia.org/wikipedia/commons/thumb/0/04/ChatGPT_logo.svg/960px-ChatGPT_logo.svg.png",
        "https://upload.wikimedia.org/wikipedia/commons/thumb/0/04/ChatGPT_logo.svg/330px-ChatGPT_logo.svg.png",
    ]),
    ("category_subscriptions", [
        # Netflix logo
        "https://upload.wikimedia.org/wikipedia/commons/thumb/0/08/Netflix_2015_logo.svg/960px-Netflix_2015_logo.svg.png",
        "https://upload.wikimedia.org/wikipedia/commons/thumb/0/08/Netflix_2015_logo.svg/330px-Netflix_2015_logo.svg.png",
    ]),
]


def curl_download(url, dest_path):
    """Download image using curl with full browser headers."""
    cmd = ["curl", "-L", "-s", "--max-time", "20", "--retry", "2"] + CURL_HEADERS + ["-o", str(dest_path), url]
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=35)
        if result.returncode == 0 and dest_path.exists():
            size = os.path.getsize(dest_path)
            if size > 500:
                print(f"    ✓ {size//1024}KB from: {url[-50:]}")
                return True
        print(f"    ✗ curl failed (rc={result.returncode}): {url[-50:]}")
        return False
    except Exception as e:
        print(f"    ✗ Exception: {e}")
        return False


def process_to_webp(src_path, dest_path, target_size=500):
    """
    Open image, place on white square canvas (padding), save as WebP.
    Maintains original aspect ratio, pads with white to square.
    """
    try:
        img = Image.open(src_path).convert("RGBA")
        
        # Create white background
        bg = Image.new("RGBA", img.size, (255, 255, 255, 255))
        bg.paste(img, mask=img.split()[3])  # Use alpha channel as mask
        img = bg.convert("RGB")
        
        # Resize maintaining aspect ratio
        img.thumbnail((target_size, target_size), Image.LANCZOS)
        
        # Pad to exact square
        square = Image.new("RGB", (target_size, target_size), (255, 255, 255))
        offset_x = (target_size - img.width) // 2
        offset_y = (target_size - img.height) // 2
        square.paste(img, (offset_x, offset_y))
        
        # Save as WebP
        square.save(str(dest_path), "WEBP", quality=92, method=6)
        final_size = os.path.getsize(dest_path)
        print(f"    ✓ Saved WebP: {dest_path.name} ({final_size//1024}KB)")
        return True
    except Exception as e:
        print(f"    ✗ PIL error: {e}")
        return False


def main():
    print("=" * 60)
    print("Official Game Logo Downloader v3 (PIL + curl)")
    print("=" * 60)
    
    results = {}
    
    for logo_key, urls in LOGOS:
        print(f"\n▶ {logo_key}")
        dest_webp = OUTPUT_DIR / f"{logo_key}.webp"
        downloaded = False
        
        for i, url in enumerate(urls):
            tmp_file = TMP_DIR / f"{logo_key}_{i}.png"
            time.sleep(1.0)  # polite rate limiting
            
            if curl_download(url, tmp_file):
                if process_to_webp(tmp_file, dest_webp):
                    downloaded = True
                    results[logo_key] = "✓ success"
                    break
        
        if not downloaded:
            results[logo_key] = "✗ FAILED"
            print(f"  → All sources failed for {logo_key}")
    
    print("\n" + "=" * 60)
    print("FINAL RESULTS")
    print("=" * 60)
    success = sum(1 for v in results.values() if "success" in v)
    for k, v in results.items():
        print(f"  {v}: {k}")
    print(f"\n{success}/{len(results)} logos downloaded successfully")
    return 0 if success >= len(results) * 0.8 else 1


if __name__ == "__main__":
    sys.exit(main())
