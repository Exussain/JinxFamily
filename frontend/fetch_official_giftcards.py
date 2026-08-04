import os
import requests
import json
import urllib.parse
from PIL import Image, ImageDraw, ImageFilter
import io

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
}

def search_bing(q):
    url = f"https://www.bing.com/images/search?q={urllib.parse.quote_plus(q)}&form=HDRSC2"
    img_urls = []
    try:
        r = requests.get(url, headers=HEADERS, timeout=10)
        if r.status_code == 200:
            soup = BeautifulSoup(r.text, "html.parser")
            for a in soup.find_all("a", class_="iusc"):
                m = a.get("m", "")
                if m:
                    try:
                        data = json.loads(m)
                        murl = data.get("murl")
                        if murl and ("gift" in murl.lower() or "card" in murl.lower() or "playstation" in murl.lower() or "steam" in murl.lower()):
                            img_urls.append(murl)
                    except: pass
    except: pass
    return img_urls

from bs4 import BeautifulSoup

def main():
    urls = search_bing("PlayStation Store gift card official card 512x512")
    urls += search_bing("Steam gift card official card")
    urls = list(dict.fromkeys(urls))
    
    out_dir = "/tmp/category_candidates/giftcard_official"
    os.makedirs(out_dir, exist_ok=True)
    
    c = 0
    for u in urls:
        if c >= 5: break
        try:
            r = requests.get(u, headers=HEADERS, timeout=6)
            if r.status_code == 200 and len(r.content) > 3000:
                img = Image.open(io.BytesIO(r.content))
                if img.width >= 200 and img.height >= 200:
                    w, h = img.size
                    min_dim = min(w, h)
                    left = (w - min_dim) // 2
                    top = (h - min_dim) // 2
                    sq = img.crop((left, top, left + min_dim, top + min_dim))
                    sq_512 = sq.resize((512, 512), Image.Resampling.LANCZOS)
                    
                    if sq_512.mode != "RGB":
                        bg = Image.new("RGBA", (512, 512), (18, 12, 45, 255))
                        bg.paste(sq_512, (0, 0), sq_512.convert("RGBA"))
                        sq_512 = bg.convert("RGB")
                    
                    p = os.path.join(out_dir, f"card_{c+1}.webp")
                    sq_512.save(p, "WEBP", quality=95)
                    print(f"✓ Saved card_{c+1}: {u[:60]}")
                    c += 1
        except: pass

if __name__ == "__main__":
    main()
