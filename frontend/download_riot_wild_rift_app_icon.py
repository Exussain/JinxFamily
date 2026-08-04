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

# Targeted URLs from official Riot / App Store / Play Store / Fandom
specific_urls = [
    # Official Play Store / App Store Wild Rift icons
    "https://play-lh.googleusercontent.com/V7cZ0sVd35p63V7V2S2XmJ45_H21_K83_T9n9M19p7J8",
    "https://static.wikia.nocookie.net/leagueoflegends/images/c/c8/Wild_Rift_icon.png",
    "https://static.wikia.nocookie.net/leagueoflegends/images/6/6f/Jinx_Wild_Rift_Render.png",
    "https://static.wikia.nocookie.net/leagueoflegends/images/8/87/Jinx_OriginalSquare_WR.png",
    "https://static.wikia.nocookie.net/leagueoflegends/images/a/a2/Jinx_ArcaneSquare.png",
    "https://images.contentstack.io/v3/assets/blt370612313166d96f/blt05a8d4a9f9c065f4/602d8479e0f6eb132a265ecb/Wild_Rift_Logo.png"
]

# Query Google / Bing specifically for "site:wikia.nocookie.net/leagueoflegends Jinx Wild Rift icon" or "site:play-lh.googleusercontent.com wild rift jinx"
search_terms = [
    "site:wikia.nocookie.net Jinx Wild Rift square",
    "site:wikia.nocookie.net/leagueoflegends Wild Rift Jinx icon",
    "League of Legends Wild Rift icon com.riotgames.league.wildrift",
    "Wild Rift Jinx app icon 512x512 PNG"
]

for st in search_terms:
    b_url = f"https://www.bing.com/images/search?q={urllib.parse.quote_plus(st)}&form=HDRSC2&first=1"
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
                            specific_urls.append(murl)
                    except:
                        pass
    except Exception as e:
        print(f"Error {st}: {e}")

specific_urls = list(dict.fromkeys(specific_urls))
print(f"Total targeted Wild Rift Jinx URLs collected: {len(specific_urls)}")

saved_count = 0
for i, url in enumerate(specific_urls):
    if saved_count >= 10:
        break
    try:
        resp = requests.get(url, headers=HEADERS, timeout=6)
        if resp.status_code != 200 or len(resp.content) < 3000:
            continue
        
        img = Image.open(io.BytesIO(resp.content))
        w, h = img.size
        min_dim = min(w, h)
        if min_dim < 120:
            continue
        
        # Crop square
        left = (w - min_dim) // 2
        top = (h - min_dim) // 2
        sq = img.crop((left, top, left + min_dim, top + min_dim))
        sq_512 = sq.resize((512, 512), Image.Resampling.LANCZOS)
        
        # Save as RGBA/RGB webp
        if sq_512.mode in ("RGBA", "LA") or (sq_512.mode == "P" and "transparency" in sq_512.info):
            # Create dark gradient background for transparent PNG icons
            bg = Image.new("RGB", (512, 512), (18, 12, 45))
            bg.paste(sq_512, (0, 0), sq_512.convert("RGBA"))
            final_img = bg
        else:
            final_img = sq_512.convert("RGB")

        out_path = f"/tmp/wildrift_jinx_{saved_count + 1}.webp"
        final_img.save(out_path, "WEBP", quality=95)
        print(f"Saved Candidate #{saved_count + 1}: {out_path} (Origin: {url[:70]}...)")
        saved_count += 1
    except Exception as e:
        print(f"Skipped {url[:60]}: {e}")
        continue

print(f"Finished saving {saved_count} candidates for visual inspection.")
