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

def fetch_itunes_icon(term):
    url = f"https://itunes.apple.com/search?term={urllib.parse.quote_plus(term)}&entity=software&limit=5"
    try:
        r = requests.get(url, headers=HEADERS, timeout=10)
        if r.status_code == 200:
            data = r.json()
            results = data.get("results", [])
            urls = []
            for res in results:
                art = res.get("artworkUrl512") or res.get("artworkUrl100")
                if art:
                    # Upgrade resolution if possible
                    art_512 = art.replace("100x100bb", "512x512bb").replace("512x512bb", "512x512bb")
                    urls.append(art_512)
            return urls
    except Exception as e:
        print(f"Error fetching iTunes icon for {term}: {e}")
    return []

def search_bing_exact(query, limit=5):
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

def main():
    base_dir = "/tmp/category_candidates"
    
    targets = {
        "fortnite": {
            "itunes": ["Fortnite"],
            "queries": [
                "Fortnite official app icon 512x512 png",
                "Fortnite Epic Games official logo icon square",
                "Fortnite battle Royale logo 1:1 icon"
            ]
        },
        "coc": {
            "itunes": ["Clash of Clans"],
            "queries": [
                "Clash of Clans official app icon 512x512",
                "Clash of Clans Supercell logo icon square"
            ]
        },
        "clash_royal": {
            "itunes": ["Clash Royale"],
            "queries": [
                "Clash Royale official app icon 512x512",
                "Clash Royale Supercell logo icon square"
            ]
        },
        "cod": {
            "itunes": ["Call of Duty Mobile"],
            "queries": [
                "Call of Duty Mobile official app icon 512x512",
                "COD Mobile official Ghost app icon square"
            ]
        },
        "battlefield6": {
            "itunes": ["Battlefield"],
            "queries": [
                "Battlefield 2042 official logo icon square 512x512",
                "Battlefield Electronic Arts game logo icon square",
                "Battlefield V logo icon square"
            ]
        },
        "giftcard": {
            "itunes": [],
            "queries": [
                "gaming gift cards icon 3d square 512x512",
                "Playstation Xbox Steam gift card icon square",
                "gift card bundle vector icon square"
            ]
        }
    }

    for cat, cfg in targets.items():
        print(f"\nFetching candidates for {cat}...")
        cat_dir = os.path.join(base_dir, cat)
        os.makedirs(cat_dir, exist_ok=True)
        
        candidate_urls = []
        for term in cfg["itunes"]:
            urls = fetch_itunes_icon(term)
            print(f"iTunes API for '{term}' found {len(urls)} URLs")
            candidate_urls.extend(urls)
            
        for q in cfg["queries"]:
            urls = search_bing_exact(q, limit=4)
            candidate_urls.extend(urls)
            
        candidate_urls = list(dict.fromkeys(candidate_urls))
        
        count = 0
        for i, url in enumerate(candidate_urls):
            if count >= 4:
                break
            try:
                resp = requests.get(url, headers=HEADERS, timeout=6)
                if resp.status_code != 200 or len(resp.content) < 3000:
                    continue
                img = Image.open(io.BytesIO(resp.content))
                if img.width < 100 or img.height < 100:
                    continue
                save_path = os.path.join(cat_dir, f"candidate_{count+1}.webp")
                process_and_save(img, save_path)
                print(f"  ✓ Saved candidate {count+1}: {save_path} ({url[:60]})")
                count += 1
            except Exception as e:
                print(f"  x Failed candidate url #{i}: {e}")
                continue

if __name__ == "__main__":
    main()
