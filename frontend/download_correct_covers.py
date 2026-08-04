import os
import requests
from bs4 import BeautifulSoup

PLAYSTORE_GAMES = {
    "cod-mobile": "com.activision.callofduty.shooter",
    "wild-rift": "com.riotgames.league.wildrift",
    "clash-royale": "com.supercell.clashroyale",
    "pubg": "com.tencent.ig",
    "coc": "com.supercell.clashofclans",
    "free-fire": "com.dts.freefireth",
    "ml": "com.mobile.legends",
    "brawl": "com.supercell.brawlstars",
    "xbox": "com.microsoft.xboxone.smartglass",
    "psn": "com.scee.psxandroid",
    "steam": "com.valvesoftware.android.steam.community"
}

OTHER_GAMES = {
    "fortnite": "https://cdn2.unrealengine.com/fortnite-og-social-1920x1080-a5adda66fab9.jpg"
}

headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36"
}

output_dir = "/root/jinxfamily/frontend/public/images/games"
os.makedirs(output_dir, exist_ok=True)

# 1. Download Play Store games icons
for key, package_id in PLAYSTORE_GAMES.items():
    print(f"Fetching Play Store icon for {key} ({package_id})...")
    url = f"https://play.google.com/store/apps/details?id={package_id}"
    try:
        r = requests.get(url, headers=headers, timeout=10)
        if r.status_code == 200:
            soup = BeautifulSoup(r.text, "html.parser")
            # Try to find the app icon image
            img = soup.find("img", {"alt": "Icon image"}) or soup.find("img", {"itemprop": "image"})
            img_url = None
            if img:
                img_url = img.get("src") or img.get("data-src")
            
            if img_url:
                # Force higher resolution thumbnail if needed
                if "=w" in img_url:
                    img_url = img_url.split("=")[0] + "=w512-h512"
                
                print(f"Downloading icon for {key} from {img_url}...")
                img_r = requests.get(img_url, headers=headers, timeout=10)
                if img_r.status_code == 200:
                    dest_path = os.path.join(output_dir, f"{key}.jpg")
                    with open(dest_path, "wb") as f:
                        f.write(img_r.content)
                    print(f"✓ Saved {key} icon ({len(img_r.content)} bytes)")
                else:
                    print(f"Failed to download icon from {img_url}")
            else:
                print(f"App icon image element not found on Play Store page for {key}")
        else:
            print(f"Play Store page failed with status {r.status_code}")
    except Exception as e:
        print(f"Error fetching Play Store icon for {key}: {e}")

# 2. Download other games covers/logos
for key, img_url in OTHER_GAMES.items():
    print(f"Downloading official image for {key} from {img_url}...")
    try:
        img_r = requests.get(img_url, headers=headers, timeout=15)
        if img_r.status_code == 200:
            dest_path = os.path.join(output_dir, f"{key}.jpg")
            with open(dest_path, "wb") as f:
                f.write(img_r.content)
            print(f"✓ Saved {key} image ({len(img_r.content)} bytes)")
        else:
            print(f"Failed to download {key} image, status {img_r.status_code}")
    except Exception as e:
        print(f"Error downloading {key} image: {e}")
