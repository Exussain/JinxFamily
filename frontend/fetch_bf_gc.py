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

def main():
    base_dir = "/tmp/category_candidates"
    
    # Battlefield queries
    bf_urls = search_bing_images('"Battlefield 2042" cover art square', limit=8)
    bf_urls += search_bing_images('Battlefield 2042 official logo icon 512x512', limit=8)
    bf_urls = list(dict.fromkeys(bf_urls))
    
    cat_dir = os.path.join(base_dir, "bf_refined")
    os.makedirs(cat_dir, exist_ok=True)
    c = 0
    for u in bf_urls:
        if c >= 5: break
        try:
            r = requests.get(u, headers=HEADERS, timeout=6)
            if r.status_code == 200 and len(r.content) > 3000:
                img = Image.open(io.BytesIO(r.content))
                if img.width >= 200 and img.height >= 200:
                    process_and_save(img, os.path.join(cat_dir, f"cand_{c+1}.webp"))
                    print(f"BF cand {c+1}: {u[:60]}")
                    c += 1
        except: pass

    # Giftcard queries
    gc_urls = search_bing_images('Playstation Xbox Steam gift card bundle 3d icon', limit=8)
    gc_urls += search_bing_images('digital gift cards vector icon square background', limit=8)
    gc_urls += search_bing_images('gift voucher card icon 3d square 512x512', limit=8)
    gc_urls = list(dict.fromkeys(gc_urls))
    
    cat_dir2 = os.path.join(base_dir, "gc_refined")
    os.makedirs(cat_dir2, exist_ok=True)
    c2 = 0
    for u in gc_urls:
        if c2 >= 5: break
        try:
            r = requests.get(u, headers=HEADERS, timeout=6)
            if r.status_code == 200 and len(r.content) > 3000:
                img = Image.open(io.BytesIO(r.content))
                if img.width >= 200 and img.height >= 200:
                    process_and_save(img, os.path.join(cat_dir2, f"cand_{c2+1}.webp"))
                    print(f"GC cand {c2+1}: {u[:60]}")
                    c2 += 1
        except: pass

if __name__ == "__main__":
    main()
