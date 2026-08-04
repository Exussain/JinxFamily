import os
import requests
import json
import urllib.parse
from bs4 import BeautifulSoup
from PIL import Image
import io

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36"
}

queries = [
    "League of Legends Wild Rift app icon Jinx face",
    "Wild Rift logo Jinx head face official Riot Games",
    "League of Legends Wild Rift Jinx icon avatar PNG",
    "Wild Rift Jinx portrait icon 512x512 square"
]

urls = []
for q in queries:
    b_url = f"https://www.bing.com/images/search?q={urllib.parse.quote_plus(q)}&form=HDRSC2&first=1"
    try:
        r = requests.get(b_url, headers=HEADERS, timeout=8)
        if r.status_code == 200:
            soup = BeautifulSoup(r.text, "html.parser")
            for a in soup.find_all("a", class_="iusc"):
                m_attr = a.get("m", "")
                if m_attr:
                    try:
                        m_data = json.loads(m_attr)
                        murl = m_data.get("murl")
                        if murl and murl.startswith("http"):
                            urls.append(murl)
                    except:
                        pass
    except Exception as e:
        print(f"Error {q}: {e}")

# Deduplicate
urls = list(dict.fromkeys(urls))
print(f"Found {len(urls)} total URLs across queries.")

saved_count = 0
for i, url in enumerate(urls):
    if saved_count >= 12:
        break
    try:
        resp = requests.get(url, headers=HEADERS, timeout=5)
        if resp.status_code != 200 or len(resp.content) < 5000:
            continue
        
        img = Image.open(io.BytesIO(resp.content))
        w, h = img.size
        min_dim = min(w, h)
        if min_dim < 150:
            continue
        
        # Square crop
        left = (w - min_dim) // 2
        top = (h - min_dim) // 2
        sq = img.crop((left, top, left + min_dim, top + min_dim))
        sq_512 = sq.resize((512, 512), Image.Resampling.LANCZOS)
        
        out_path = f"/tmp/jinx_candidate_{saved_count + 1}.webp"
        sq_512.save(out_path, "WEBP", quality=95)
        print(f"Saved Candidate #{saved_count + 1}: {out_path} (Origin: {url[:70]}...)")
        saved_count += 1
    except Exception as e:
        continue

print(f"Total candidates saved for visual inspection: {saved_count}")
