import os
import requests
from bs4 import BeautifulSoup
import json
import urllib.parse

GAME_CONFIGS = {
    "fortnite": {
        "query": "Fortnite official cover art vertical OR poster",
        "keywords": ["fortnite", "fn"]
    },
    "cod-mobile": {
        "query": "Call of Duty Mobile official cover art vertical OR poster",
        "keywords": ["cod", "call", "duty", "mobile"]
    },
    "wild-rift": {
        "query": "League of Legends Wild Rift cover art vertical OR poster",
        "keywords": ["rift", "wild", "league", "lol"]
    },
    "clash-royale": {
        "query": "Clash Royale official cover art vertical OR poster",
        "keywords": ["royale", "clash", "supercell"]
    },
    "pubg": {
        "query": "PUBG Mobile game cover art vertical OR poster",
        "keywords": ["pubg", "mobile", "playerunknown"]
    },
    "coc": {
        "query": "Clash of Clans official cover art vertical OR poster",
        "keywords": ["clans", "clash", "supercell"]
    },
    "free-fire": {
        "query": "Garena Free Fire cover art vertical OR poster",
        "keywords": ["free", "fire", "garena"]
    },
    "ml": {
        "query": "Mobile Legends Bang Bang cover art vertical OR poster",
        "keywords": ["legends", "mobile", "mlbb", "bang"]
    },
    "brawl": {
        "query": "Brawl Stars game cover art vertical OR poster",
        "keywords": ["brawl", "stars", "supercell"]
    },
    "xbox": {
        "query": "Xbox Series X green box cover art vertical OR logo",
        "keywords": ["xbox", "microsoft", "green"]
    },
    "psn": {
        "query": "PlayStation 5 blue box cover art vertical OR logo",
        "keywords": ["playstation", "sony", "ps5", "ps4", "psn"]
    },
    "steam": {
        "query": "Steam game library cover vertical OR logo",
        "keywords": ["steam", "valve", "launcher"]
    },
}

headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36"
}

output_dir = "/root/jinxfamily/frontend/public/images/games"
os.makedirs(output_dir, exist_ok=True)

for key, config in GAME_CONFIGS.items():
    print(f"\n=== Searching covers for: {key} ===")
    url = f"https://www.bing.com/images/search?q={urllib.parse.quote_plus(config['query'])}"
    
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

    # Filter URLs based on keywords
    filtered_urls = []
    keywords = config["keywords"]
    for img_url in img_urls:
        url_lower = img_url.lower()
        # Check if any keyword matches
        if any(kw in url_lower for kw in keywords):
            filtered_urls.append(img_url)
    
    # If no URL matched the keywords, fallback to all URLs
    if not filtered_urls:
        print("No URLs matched keyword filters, using unfiltered URLs.")
        filtered_urls = img_urls

    print(f"Found {len(filtered_urls)} filtered URLs for {key}")

    downloaded = False
    for img_url in filtered_urls[:15]:
        try:
            print(f"Attempting download: {img_url}")
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
