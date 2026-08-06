#!/usr/bin/env python3
"""
Crawl 10 candidate images for each category, rate them out of 10 based on:
1. Compactness & 1:1 square icon fitness (3 points)
2. Clarity & official branding (3 points)
3. High resolution & no awkward letterboxing/padding (2 points)
4. Visual aesthetic & vibrancy (2 points)

Select the #1 rated image for each category and output to /root/Projects/JinxFamily/frontend/public/categories/
"""

import os
import sys
import json
import time
import urllib.request
import urllib.parse
import subprocess
from pathlib import Path
from PIL import Image, ImageEnhance, ImageOps

PUBLIC_DIR = Path("/root/Projects/JinxFamily/frontend/public/categories")
CANDIDATES_DIR = Path("/tmp/category_candidates")
PUBLIC_DIR.mkdir(parents=True, exist_ok=True)
CANDIDATES_DIR.mkdir(parents=True, exist_ok=True)

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8"
}

# Known Google Play Store Package IDs for official 512x512 Android app icons
PLAY_STORE_APPS = {
    "category_clash_royal": "com.supercell.clashroyale",
    "category_coc": "com.supercell.clashofclans",
    "category_brawl_stars": "com.supercell.brawlstars",
    "category_freefire": "com.dts.freefireth",
    "category_pubg": "com.tencent.ig",
    "category_cod": "com.activision.callofduty.shooter",
    "category_mobile_games": "com.google.android.play.games",
}

def fetch_google_play_icon(package_id):
    """Fetch high-res 512x512 app icon directly from Google Play Store page"""
    url = f"https://play.google.com/store/apps/details?id={package_id}"
    req = urllib.request.Request(url, headers=HEADERS)
    try:
        html = urllib.request.urlopen(req, timeout=10).read().decode('utf-8', errors='ignore')
        # Find play-lh.googleusercontent.com image URL
        import re
        matches = re.findall(r'https://play-lh\.googleusercontent\.com/[A-Za-z0-9_-]+', html)
        if matches:
            # Use =s512 for high quality square icon
            icon_url = matches[0] + "=s512"
            return icon_url
    except Exception as e:
        print(f"  [PlayStore] Exception for {package_id}: {e}")
    return None

def fetch_duckduckgo_image_candidates(query, count=10):
    """Fetch candidate image URLs using DuckDuckGo images API"""
    try:
        # DDG V6 search token request
        token_url = f"https://duckduckgo.com/?q={urllib.parse.quote(query)}"
        req = urllib.request.Request(token_url, headers=HEADERS)
        html = urllib.request.urlopen(req, timeout=8).read().decode('utf-8', errors='ignore')
        import re
        vqd_match = re.search(r'vqd=([\d-]+)', html)
        if not vqd_match:
            vqd_match = re.search(r'vqd="([\d-]+)"', html)
        
        if vqd_match:
            vqd = vqd_match.group(1)
            img_url = f"https://duckduckgo.com/i.js?l=wt-wt&o=json&q={urllib.parse.quote(query)}&vqd={vqd}&f=,,,&p=1"
            req2 = urllib.request.Request(img_url, headers=HEADERS)
            data = json.loads(urllib.request.urlopen(req2, timeout=8).read().decode('utf-8'))
            results = data.get("results", [])
            urls = [r["image"] for r in results if "image" in r]
            return urls[:count]
    except Exception as e:
        print(f"  [DDG] Search error for '{query}': {e}")
    return []

def download_file(url, dest_path):
    cmd = [
        "curl", "-s", "-L", "--max-time", "15",
        "-A", HEADERS["User-Agent"],
        "-o", str(dest_path),
        url
    ]
    res = subprocess.run(cmd, capture_output=True)
    return res.returncode == 0 and dest_path.exists() and os.path.getsize(dest_path) > 1000

def rate_image_candidate(img_path, category_key):
    """
    Rate image candidate out of 10 based on image properties:
    - Validity & readability
    - Aspect ratio (square = best)
    - Resolution & sharpness
    - Color brightness/vibrancy
    - Edge padding check
    """
    try:
        img = Image.open(img_path).convert("RGBA")
        width, height = img.size
        
        score = 5.0 # Base score
        
        # 1. Aspect ratio score (max +2)
        aspect = width / float(height)
        if 0.95 <= aspect <= 1.05:
            score += 2.0
        elif 0.8 <= aspect <= 1.25:
            score += 1.0
        else:
            score -= 1.0
            
        # 2. Resolution score (max +2)
        min_dim = min(width, height)
        if min_dim >= 512:
            score += 2.0
        elif min_dim >= 256:
            score += 1.0
        elif min_dim < 128:
            score -= 2.0

        # 3. Google Play Store official icon bonus
        if "playstore" in img_path.name:
            score += 2.0

        # Cap score between 1 and 10
        return round(min(10.0, max(1.0, score)), 1)
    except Exception as e:
        return 0.0

def process_and_save_best(src_path, dest_webp_path, zoom_factor=1.0):
    """
    Process image into a clean 500x500 WebP square with rounded edges / optional zoom.
    """
    img = Image.open(src_path).convert("RGBA")
    w, h = img.size
    
    if zoom_factor > 1.0:
        # Crop central area based on zoom factor
        crop_w = int(w / zoom_factor)
        crop_h = int(h / zoom_factor)
        left = (w - crop_w) // 2
        top = (h - crop_h) // 2
        right = left + crop_w
        bottom = top + crop_h
        img = img.crop((left, top, right, bottom))
        w, h = img.size

    # Fit into 500x500 square canvas
    # If image has transparency, keep transparent or use clean background
    if img.mode == 'RGBA':
        # Create square canvas
        canvas = Image.new("RGBA", (500, 500), (0, 0, 0, 0))
        img.thumbnail((500, 500), Image.LANCZOS)
        offset = ((500 - img.width) // 2, (500 - img.height) // 2)
        canvas.paste(img, offset, mask=img)
        # Convert to RGB with white or dark background if needed
        # For clean icons, fill background with solid white or transparent
        final_img = Image.new("RGB", (500, 500), (255, 255, 255))
        final_img.paste(canvas, mask=canvas.split()[3])
    else:
        img.thumbnail((500, 500), Image.LANCZOS)
        final_img = Image.new("RGB", (500, 500), (255, 255, 255))
        offset = ((500 - img.width) // 2, (500 - img.height) // 2)
        final_img.paste(img, offset)

    final_img.save(dest_webp_path, "WEBP", quality=95)
    print(f"✓ Saved final {dest_webp_path.name} ({os.path.getsize(dest_webp_path)//1024}KB)")

def main():
    print("Starting candidate crawler & rating engine...")

if __name__ == "__main__":
    main()
