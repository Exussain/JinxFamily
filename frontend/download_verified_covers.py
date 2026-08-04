import os
import requests
from bs4 import BeautifulSoup
import json
import urllib.parse

GAME_QUERIES = {
    "fortnite": "Fortnite official cover art vertical",
    "cod-mobile": "Call of Duty Mobile official cover art vertical",
    "wild-rift": "League of Legends Wild Rift cover art vertical",
    "clash-royale": "Clash Royale official cover art vertical",
    "pubg": "PUBG Mobile game cover art vertical",
    "coc": "Clash of Clans official cover art vertical",
    "free-fire": "Garena Free Fire cover art vertical",
    "ml": "Mobile Legends Bang Bang cover art vertical",
    "brawl": "Brawl Stars game cover art vertical",
    "xbox": "Xbox Series X console vertical cover",
    "psn": "PlayStation 5 console vertical cover",
    "steam": "Steam game launcher library cover vertical",
}

headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36"
}

output_dir = "/root/jinxfamily/frontend/public/images/games"
os.makedirs(output_dir, exist_ok=True)

for key, query in GAME_QUERIES.items():
    print(f"=== Searching covers for: {key} ===")
    url = f"https://www.bing.com/images/search?q={urllib.parse.quote_plus(query)}"
    
    img_urls = []
    try:
        r = requests.get(url, headers=headers, timeout=10)
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
        else:
            print(f"Bing search failed for {key} with status {r.status_code}")
    except Exception as e:
        print(f"Error searching for {key}: {e}")

    # Now attempt to download the first working URL
    downloaded = False
    for img_url in img_urls[:6]:
        try:
            print(f"Trying to download: {img_url}")
            img_r = requests.get(img_url, headers=headers, timeout=8)
            if img_r.status_code == 200 and len(img_r.content) > 5000:
                dest_path = os.path.join(output_dir, f"{key}.jpg")
                with open(dest_path, "wb") as f:
                    f.write(img_r.content)
                print(f"✓ SUCCESSFULLY SAVED {key} cover to {dest_path}")
                downloaded = True
                break
            else:
                print(f"Failed status {img_r.status_code} or small size.")
        except Exception as err:
            print(f"Error downloading {img_url}: {err}")

    if not downloaded:
        print(f"⚠ FAILED to download any verified image for {key}.")
