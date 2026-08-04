import os
import requests
import json
import urllib.parse
from PIL import Image, ImageDraw, ImageFilter
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
        print(f"Error searching Bing: {e}")
    return img_urls[:limit]

from bs4 import BeautifulSoup

def main():
    queries = [
        "Playstation Xbox Steam gift card 3d png",
        "gift card stack gaming 3d icon square",
        "digital gift cards Playstation Steam Google Play icon"
    ]
    urls = []
    for q in queries:
        urls.extend(search_bing_images(q, limit=6))
    urls = list(dict.fromkeys(urls))
    
    out_dir = "/tmp/category_candidates/giftcard_stack"
    os.makedirs(out_dir, exist_ok=True)
    
    c = 0
    for u in urls:
        if c >= 6: break
        try:
            r = requests.get(u, headers=HEADERS, timeout=6)
            if r.status_code == 200 and len(r.content) > 4000:
                img = Image.open(io.BytesIO(r.content))
                if img.width >= 200 and img.height >= 200:
                    # Save as 512x512
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
                    
                    save_p = os.path.join(out_dir, f"stack_{c+1}.webp")
                    sq_512.save(save_p, "WEBP", quality=95)
                    print(f"✓ Saved stack_{c+1}: {u[:60]}")
                    c += 1
        except Exception as e:
            pass

if __name__ == "__main__":
    main()
