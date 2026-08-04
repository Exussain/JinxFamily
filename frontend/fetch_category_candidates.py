import os
import sys
import json
import urllib.parse
import requests
from bs4 import BeautifulSoup
from PIL import Image, ImageOps
import io

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
}

CATEGORIES = {
    "fortnite": [
        "Fortnite official app icon 512x512",
        "Fortnite logo icon square",
        "Fortnite Chapter 5 season key art square",
        "Fortnite icon square"
    ],
    "coc": [
        "Clash of Clans official app icon 512x512",
        "Clash of Clans icon square",
        "Clash of Clans Barbarian King icon square"
    ],
    "clash_royal": [
        "Clash Royale official app icon 512x512",
        "Clash Royale King icon square",
        "Clash Royale logo icon square"
    ],
    "cod": [
        "Call of Duty Mobile app icon 512x512",
        "COD Mobile Ghost icon square",
        "Call of Duty Mobile logo icon square"
    ],
    "battlefield6": [
        "Battlefield official logo icon square 512x512",
        "Battlefield 2042 icon square",
        "Battlefield game logo icon square"
    ],
    "giftcard": [
        "Gaming gift cards icon 3d square 512x512",
        "Gift card icon square gaming",
        "Gift card bundle logo icon square"
    ]
}

def search_bing_images(query, limit=8):
    url = f"https://www.bing.com/images/search?q={urllib.parse.quote_plus(query)}&form=HDRSC2&first=1"
    img_urls = []
    try:
        r = requests.get(url, headers=HEADERS, timeout=10)
        if r.status_code == 200:
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
        print(f"Error searching Bing for '{query}': {e}")
    return img_urls[:limit]

def process_and_save(img, save_path):
    # Convert RGBA to RGB with sleek dark background #120C2D
    if img.mode in ("RGBA", "LA") or (img.mode == "P" and "transparency" in img.info):
        bg = Image.new("RGBA", img.size, (18, 12, 45, 255)) # #120C2D
        bg.paste(img, (0, 0), img.convert("RGBA"))
        img = bg.convert("RGB")
    elif img.mode != "RGB":
        img = img.convert("RGB")
    
    # 1:1 center crop
    w, h = img.size
    min_dim = min(w, h)
    left = (w - min_dim) // 2
    top = (h - min_dim) // 2
    right = left + min_dim
    bottom = top + min_dim
    img_cropped = img.crop((left, top, right, bottom))
    
    # Resize to 512x512
    img_resized = img_cropped.resize((512, 512), Image.Resampling.LANCZOS)
    
    os.makedirs(os.path.dirname(save_path), exist_ok=True)
    img_resized.save(save_path, "WEBP", quality=95)

def main():
    base_dir = "/tmp/category_candidates"
    os.makedirs(base_dir, exist_ok=True)
    
    for cat, queries in CATEGORIES.items():
        print(f"\n==========================================")
        print(f"Fetching candidates for: {cat}")
        print(f"==========================================")
        cat_dir = os.path.join(base_dir, cat)
        os.makedirs(cat_dir, exist_ok=True)
        
        all_urls = []
        for q in queries:
            urls = search_bing_images(q, limit=6)
            all_urls.extend(urls)
        
        # Deduplicate
        all_urls = list(dict.fromkeys(all_urls))
        print(f"Total candidate URLs for {cat}: {len(all_urls)}")
        
        count = 0
        for i, url in enumerate(all_urls):
            if count >= 4:
                break
            try:
                resp = requests.get(url, headers=HEADERS, timeout=6)
                if resp.status_code != 200 or len(resp.content) < 3000:
                    continue
                img = Image.open(io.BytesIO(resp.content))
                if img.width < 150 or img.height < 150:
                    continue
                save_path = os.path.join(cat_dir, f"candidate_{count+1}.webp")
                process_and_save(img, save_path)
                print(f"Saved candidate {count+1} for {cat}: {save_path} (from {url[:60]})")
                count += 1
            except Exception as e:
                print(f"Failed url #{i}: {e}")
                continue

if __name__ == "__main__":
    main()
