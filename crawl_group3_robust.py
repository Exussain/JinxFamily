import os
import shutil
import urllib.request
import urllib.parse
import re
from PIL import Image

categories = {
    'category_mobile_games': [
        'Google Play Games green gamepad logo icon',
        'com.google.android.play.games icon png',
        'Google Play Games app icon square'
    ],
    'category_ping': [
        'gaming ping speed wifi icon badge 3d',
        'low ping network speed icon gaming',
        'game ping indicator icon badge'
    ],
    'category_valorant': [
        'Valorant V logo emblem icon square',
        'Valorant emblem logo 4k png',
        'Valorant icon emblem square'
    ],
    'category_rainbow': [
        'Rainbow Six Siege 6 logo emblem square',
        'Rainbow Six Siege emblem icon png',
        'Rainbow Six Siege logo icon'
    ],
    'category_marvel_rivals': [
        'Marvel Rivals logo emblem icon square',
        'Marvel Rivals emblem logo png',
        'Marvel Rivals game icon square'
    ],
    'category_steam': [
        'Steam official logo icon dark blue square',
        'Steam app icon square blue',
        'Steam game icon dark blue gradient'
    ],
    'category_ai': [
        'ChatGPT official logo icon green teal square',
        'ChatGPT icon png transparent',
        'OpenAI ChatGPT logo icon square'
    ],
    'category_giftcard': [
        'Gift card voucher icon 3d badge square',
        'gift card icon square vibrant',
        'shopping gift card voucher icon png'
    ]
}

base_dir = '/tmp/candidates/group3'

def fetch_bing_urls(query, count=40):
    url = f'https://www.bing.com/images/async?q={urllib.parse.quote(query)}&first=0&count={count}'
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }
    try:
        req = urllib.request.Request(url, headers=headers)
        html = urllib.request.urlopen(req, timeout=10).read().decode('utf-8', errors='ignore')
        return re.findall(r'murl&quot;:&quot;(.*?)&quot;', html)
    except Exception as e:
        print(f"Error fetching search results for '{query}': {e}")
        return []

def download_image(url, save_path):
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }
    try:
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req, timeout=8) as resp:
            data = resp.read()
            if len(data) < 2000: # skip tiny icons/placeholders
                return False
            with open(save_path, 'wb') as f:
                f.write(data)
        # Verify image using Pillow
        with Image.open(save_path) as img:
            img.verify()
        return True
    except Exception:
        if os.path.exists(save_path):
            os.remove(save_path)
        return False

for cat, queries in categories.items():
    cat_dir = os.path.join(base_dir, cat)
    if os.path.exists(cat_dir):
        shutil.rmtree(cat_dir)
    os.makedirs(cat_dir, exist_ok=True)
    
    print(f"\n==========================================")
    print(f"Crawling candidates for category: {cat}")
    print(f"==========================================")
    
    seen_urls = set()
    candidate_idx = 1
    target_count = 15 # Ensure at least 10 valid images per category
    
    for q in queries:
        if candidate_idx > target_count:
            break
        print(f"Query: '{q}'")
        urls = fetch_bing_urls(q, count=40)
        for url in urls:
            if url in seen_urls:
                continue
            seen_urls.add(url)
            
            # Determine extension
            ext = '.png'
            if '.jpg' in url.lower() or '.jpeg' in url.lower():
                ext = '.jpg'
            elif '.webp' in url.lower():
                ext = '.webp'
                
            filename = f"candidate_{candidate_idx:02d}{ext}"
            filepath = os.path.join(cat_dir, filename)
            
            if download_image(url, filepath):
                # Double check with PIL open again to get dimensions
                try:
                    with Image.open(filepath) as img:
                        w, h = img.size
                        print(f"  [+] Saved {filename} ({w}x{h}, {img.format}) from {url[:60]}...")
                        candidate_idx += 1
                except Exception:
                    if os.path.exists(filepath):
                        os.remove(filepath)
            
            if candidate_idx > target_count:
                break
                
    print(f"Finished {cat}: {candidate_idx-1} valid candidates saved in {cat_dir}")

print("\nAll candidate crawling completed successfully!")
