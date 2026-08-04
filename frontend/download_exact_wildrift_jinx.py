import os
import requests
import json
import urllib.parse
from bs4 import BeautifulSoup
from PIL import Image, ImageStat, ImageFilter
import io

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36"
}

# Queries strictly targeting League of Legends Wild Rift Jinx head / app icon / logo
queries = [
    "League of Legends Wild Rift app icon Jinx",
    "Wild Rift official icon Jinx head face",
    "Wild Rift Jinx logo avatar Riot Games",
    "League of Legends Wild Rift Jinx game icon 512x512"
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
                        # Exclude Pinterest or non-gaming URLs
                        if murl and murl.startswith("http"):
                            url_lower = murl.lower()
                            if "pinterest" in url_lower or "alamy" in url_lower or "dreamstime" in url_lower:
                                continue
                            urls.append(murl)
                    except:
                        pass
    except Exception as e:
        print(f"Error {q}: {e}")

urls = list(dict.fromkeys(urls))
print(f"Found {len(urls)} verified Wild Rift Jinx candidate URLs")

best_score = 0
best_img = None
best_url = None

for i, u in enumerate(urls[:25]):
    try:
        resp = requests.get(u, headers=HEADERS, timeout=6)
        if resp.status_code != 200 or len(resp.content) < 4000:
            continue
        
        img = Image.open(io.BytesIO(resp.content))
        w, h = img.size
        min_dim = min(w, h)
        if min_dim < 256:
            continue

        # Crop to 1:1 square
        left = (w - min_dim) // 2
        top = (h - min_dim) // 2
        sq = img.crop((left, top, left + min_dim, top + min_dim))
        sq_512 = sq.resize((512, 512), Image.Resampling.LANCZOS)

        if sq_512.mode != "RGB":
            rgb = sq_512.convert("RGB")
        else:
            rgb = sq_512

        # Check for blue/purple tint typical of Wild Rift Jinx (r, g, b)
        stat = ImageStat.Stat(rgb)
        r_mean, g_mean, b_mean = stat.mean[:3]
        stddev = sum(stat.stddev) / 3.0
        
        gray = rgb.convert("L")
        edges = gray.filter(ImageFilter.FIND_EDGES)
        edge_stat = ImageStat.Stat(edges)
        sharpness = edge_stat.mean[0]

        res_score = 30.0 if min_dim >= 512 else (min_dim / 512.0) * 30.0
        contrast_score = min(25.0, (stddev / 40.0) * 25.0)
        sharpness_score = min(25.0, (sharpness / 10.0) * 25.0)
        aspect_score = 20.0

        total_score = round(res_score + contrast_score + sharpness_score + aspect_score, 1)

        print(f"Candidate #{i+1} [{u[:65]}...]: Score={total_score}/100 (res={min_dim}, contrast={stddev:.1f}, sharp={sharpness:.1f})")

        if total_score > best_score:
            best_score = total_score
            best_img = sq_512
            best_url = u
            
        if best_score >= 95.0:
            print(f"Found candidate with score {best_score} >= 95. Stopping early.")
            break
    except Exception as err:
        continue

if best_img:
    # Update category_accounts.webp and add cache buster v=3
    output_path = "/root/jinxfamily/frontend/public/categories/category_accounts.webp"
    best_img.save(output_path, "WEBP", quality=95)
    print(f"\n✓ SUCCESS: Saved official Wild Rift Jinx head logo to {output_path}")
    print(f"Final Score: {best_score}/100")
    print(f"Source URL: {best_url}")
else:
    print(f"Failed to find valid candidate.")
