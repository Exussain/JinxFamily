import os
import requests
from bs4 import BeautifulSoup
import json
import urllib.parse

# Define the download targets (covers and section images) for all 7 articles
CONFIGS = {
    # 1. guide-buy-vbucks
    "vbucks-cover": {
        "query": "Fortnite V-Bucks official cover art vertical OR poster",
        "keywords": ["fortnite", "vbuck", "v-buck", "epic"],
        "dest": "blog/covers/guide-buy-vbucks.jpg"
    },
    "vbucks-sec-0": {
        "query": "Fortnite in-game item shop skins v-bucks",
        "keywords": ["fortnite", "shop", "skins", "vbucks"],
        "dest": "blog/sections/guide-buy-vbucks-0.jpg"
    },
    "vbucks-sec-1": {
        "query": "Fortnite lobby screenshot lobby 3d",
        "keywords": ["fortnite", "lobby", "gameplay", "epic"],
        "dest": "blog/sections/guide-buy-vbucks-1.jpg"
    },

    # 2. guide-crew-pack
    "crewpack-cover": {
        "query": "Fortnite Crew Pack official art vertical OR poster",
        "keywords": ["fortnite", "crew", "pack"],
        "dest": "blog/covers/guide-crew-pack.jpg"
    },
    "crewpack-sec-0": {
        "query": "Fortnite Crew skin pack cosmetic set",
        "keywords": ["fortnite", "crew", "skin", "pack"],
        "dest": "blog/sections/guide-crew-pack-0.jpg"
    },
    "crewpack-sec-1": {
        "query": "Fortnite Battle Pass screen rewards list",
        "keywords": ["fortnite", "battle", "pass", "reward"],
        "dest": "blog/sections/guide-crew-pack-1.jpg"
    },

    # 3. guide-buy-chatgpt-plus
    "chatgpt-cover": {
        "query": "ChatGPT Plus official logo green vertical OR cover",
        "keywords": ["chatgpt", "openai", "plus"],
        "dest": "blog/covers/guide-buy-chatgpt-plus.jpg"
    },
    "chatgpt-sec-0": {
        "query": "ChatGPT GPT-4 interface screenshot browser",
        "keywords": ["chatgpt", "gpt-4", "openai", "gpt", "interface"],
        "dest": "blog/sections/guide-buy-chatgpt-plus-0.jpg"
    },
    "chatgpt-sec-1": {
        "query": "ChatGPT premium subscription upgrade workspace",
        "keywords": ["chatgpt", "plus", "openai", "subscription"],
        "dest": "blog/sections/guide-buy-chatgpt-plus-1.jpg"
    },

    # 4. guide-gemini-advanced
    "gemini-cover": {
        "query": "Google Gemini Advanced official logo cover vertical",
        "keywords": ["gemini", "google", "advanced"],
        "dest": "blog/covers/guide-gemini-advanced.jpg"
    },
    "gemini-sec-0": {
        "query": "Google Gemini Advanced interface workspace dark mode",
        "keywords": ["gemini", "google", "workspace", "ai"],
        "dest": "blog/sections/guide-gemini-advanced-0.jpg"
    },
    "gemini-sec-1": {
        "query": "Google Gemini Advanced app dashboard dashboard",
        "keywords": ["gemini", "google", "ai"],
        "dest": "blog/sections/guide-gemini-advanced-1.jpg"
    },

    # 5. guide-buy-steam-giftcard
    "steam-cover": {
        "query": "Steam Gift Card vertical cover official",
        "keywords": ["steam", "valve", "card"],
        "dest": "blog/covers/guide-buy-steam-giftcard.jpg"
    },
    "steam-sec-0": {
        "query": "Steam wallet store region checkout",
        "keywords": ["steam", "store", "wallet"],
        "dest": "blog/sections/guide-buy-steam-giftcard-0.jpg"
    },
    "steam-sec-1": {
        "query": "Steam redeem wallet code transaction screen",
        "keywords": ["steam", "redeem", "code", "wallet"],
        "dest": "blog/sections/guide-buy-steam-giftcard-1.jpg"
    },

    # 6. guide-preorder-gta6
    "gta6-cover": {
        "query": "GTA 6 official cover art vertical OR poster",
        "keywords": ["gta", "grand", "theft", "auto", "6", "vi"],
        "dest": "blog/covers/guide-preorder-gta6.jpg"
    },
    "gta6-sec-0": {
        "query": "GTA 6 vice city neon artwork background",
        "keywords": ["gta", "vice", "city", "artwork", "screenshot"],
        "dest": "blog/sections/guide-preorder-gta6-0.jpg"
    },
    "gta6-sec-1": {
        "query": "GTA 6 trailer official screenshot Lucia and Jason",
        "keywords": ["gta", "rockstar", "trailer", "screenshot"],
        "dest": "blog/sections/guide-preorder-gta6-1.jpg"
    },

    # 7. guide-spotify-premium
    "spotify-cover": {
        "query": "Spotify Premium official logo cover vertical or card",
        "keywords": ["spotify", "premium", "card"],
        "dest": "blog/covers/guide-spotify-premium.jpg"
    },
    "spotify-sec-0": {
        "query": "Spotify Premium mobile app player interface screenshot",
        "keywords": ["spotify", "player", "interface", "app"],
        "dest": "blog/sections/guide-spotify-premium-0.jpg"
    },
    "spotify-sec-1": {
        "query": "Spotify offline download music list playlist",
        "keywords": ["spotify", "premium", "music", "playlist"],
        "dest": "blog/sections/guide-spotify-premium-1.jpg"
    }
}

headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36"
}

public_dir = "/root/jinxfamily/frontend/public"
os.makedirs(os.path.join(public_dir, "blog/covers"), exist_ok=True)
os.makedirs(os.path.join(public_dir, "blog/sections"), exist_ok=True)

for key, config in CONFIGS.items():
    print(f"\n=== Searching for: {key} ===")
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
        if any(kw in url_lower for kw in keywords):
            filtered_urls.append(img_url)
    
    if not filtered_urls:
        print("No URLs matched keyword filters, using unfiltered URLs.")
        filtered_urls = img_urls

    print(f"Found {len(filtered_urls)} filtered URLs for {key}")

    downloaded = False
    for img_url in filtered_urls[:15]:
        try:
            print(f"Attempting download: {img_url}")
            img_r = requests.get(img_url, headers=headers, timeout=8)
            # Make sure it's an image and not too small
            if img_r.status_code == 200 and len(img_r.content) > 5000:
                dest_path = os.path.join(public_dir, config["dest"])
                with open(dest_path, "wb") as f:
                    f.write(img_r.content)
                print(f"✓ SUCCESSFULLY SAVED {key} to {dest_path}")
                downloaded = True
                break
            else:
                print(f"Failed status {img_r.status_code} or small size.")
        except Exception as err:
            print(f"Error downloading {img_url}: {err}")

    if not downloaded:
        print(f"⚠ FAILED to download any image for {key}.")
