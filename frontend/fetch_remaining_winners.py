import os
import json
import urllib.parse
import requests
from bs4 import BeautifulSoup
from PIL import Image
import io

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
}

def search_bing_images(query, limit=10):
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

def fetch_category(cat, queries):
    base_dir = "/tmp/category_candidates"
    cat_dir = os.path.join(base_dir, cat)
    os.makedirs(cat_dir, exist_ok=True)
    
    urls = []
    for q in queries:
        u = search_bing_images(q, limit=6)
        urls.extend(u)
    urls = list(dict.fromkeys(urls))
    
    count = 0
    for url in urls:
        if count >= 5:
            break
        try:
            resp = requests.get(url, headers=HEADERS, timeout=6)
            if resp.status_code != 200 or len(resp.content) < 4000:
                continue
            img = Image.open(io.BytesIO(resp.content))
            if img.width < 250 or img.height < 250:
                continue
            save_path = os.path.join(cat_dir, f"new_cand_{count+1}.webp")
            process_and_save(img, save_path)
            print(f"✓ {cat} new_cand_{count+1}: {url[:60]}")
            count += 1
        except Exception as e:
            continue

if __name__ == "__main__":
    fetch_category("fortnite", [
        "Fortnite official game icon square 512x512",
        "Fortnite logo F icon square",
        "Fortnite battle royale official logo square"
    ])
    fetch_category("battlefield6", [
        "Battlefield 2042 key art logo square 512x512",
        "Battlefield official game logo square",
        "Battlefield 2042 icon 1:1"
    ])
    fetch_category("giftcard", [
        "gaming gift cards psn xbox steam googleplay logo square",
        "gift cards bundle Playstation Xbox Steam icon square",
        "digital gift cards stack icon 3d"
    ])
