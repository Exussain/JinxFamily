import os
import requests
import urllib.parse
import json

headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
}

COVERS_DIR = "/root/jinxfamily/frontend/public/blog/covers"
SECTIONS_DIR = "/root/jinxfamily/frontend/public/blog/sections"
os.makedirs(COVERS_DIR, exist_ok=True)
os.makedirs(SECTIONS_DIR, exist_ok=True)

TARGETS = {
    os.path.join(COVERS_DIR, "guide-buy-vbucks.jpg"): "Fortnite V Bucks official currency coins wallpaper hd",
    os.path.join(COVERS_DIR, "guide-crew-pack.jpg"): "Fortnite Crew Pack official art wallpaper hd",
    os.path.join(COVERS_DIR, "guide-buy-chatgpt-plus.jpg"): "ChatGPT Plus OpenAI official dark logo wallpaper hd",
    os.path.join(COVERS_DIR, "guide-gemini-advanced.jpg"): "Google Gemini Advanced AI official logo wallpaper hd",
    os.path.join(COVERS_DIR, "guide-buy-steam-giftcard.jpg"): "Steam Gift Card official card wallpaper hd",
    os.path.join(COVERS_DIR, "guide-preorder-gta6.jpg"): "GTA 6 Grand Theft Auto VI official logo wallpaper hd",
    os.path.join(COVERS_DIR, "guide-spotify-premium.jpg"): "Spotify Premium official green music wallpaper hd",
    
    os.path.join(SECTIONS_DIR, "guide-buy-vbucks-0.jpg"): "Fortnite Item Shop skins high resolution wallpaper",
    os.path.join(SECTIONS_DIR, "guide-buy-vbucks-1.jpg"): "Fortnite V Bucks 1000 card official",
    os.path.join(SECTIONS_DIR, "guide-crew-pack-0.jpg"): "Fortnite Crew skin bundle art",
    os.path.join(SECTIONS_DIR, "guide-crew-pack-1.jpg"): "Fortnite Battle Pass rewards wallpaper",
    os.path.join(SECTIONS_DIR, "guide-buy-chatgpt-plus-0.jpg"): "ChatGPT GPT 4o interface dark mode UI",
    os.path.join(SECTIONS_DIR, "guide-buy-chatgpt-plus-1.jpg"): "OpenAI ChatGPT Plus logo dark",
    os.path.join(SECTIONS_DIR, "guide-gemini-advanced-0.jpg"): "Google Gemini AI interface dark",
    os.path.join(SECTIONS_DIR, "guide-gemini-advanced-1.jpg"): "Google One 2TB storage AI Premium badge",
    os.path.join(SECTIONS_DIR, "guide-buy-steam-giftcard-0.jpg"): "Steam store games library wallpaper",
    os.path.join(SECTIONS_DIR, "guide-buy-steam-giftcard-1.jpg"): "Steam wallet redeem code interface",
    os.path.join(SECTIONS_DIR, "guide-preorder-gta6-0.jpg"): "GTA VI Lucia Jason Vice City screenshot wallpaper",
    os.path.join(SECTIONS_DIR, "guide-preorder-gta6-1.jpg"): "PlayStation 5 GTA 6 pre order art",
    os.path.join(SECTIONS_DIR, "guide-spotify-premium-0.jpg"): "Spotify Premium music player dark UI",
    os.path.join(SECTIONS_DIR, "guide-spotify-premium-1.jpg"): "Spotify Family Premium music app logo"
}

def fetch_image_bing(query):
    url = f"https://www.bing.com/images/search?q={urllib.parse.quote_plus(query)}&form=HDRSC2"
    img_urls = []
    try:
        r = requests.get(url, headers=headers, timeout=10)
        if r.status_code == 200:
            from bs4 import BeautifulSoup
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
        print(f"Error fetching for query '{query}': {e}")
    return img_urls

print("Starting image download for blog covers and sections...")
for target_path, query in TARGETS.items():
    filename = os.path.basename(target_path)
    print(f"\nProcessing {filename} with query: '{query}'")
    urls = fetch_image_bing(query)
    downloaded = False
    for u in urls[:10]:
        try:
            res = requests.get(u, headers=headers, timeout=8)
            if res.status_code == 200 and len(res.content) > 10000:
                with open(target_path, "wb") as f:
                    f.write(res.content)
                print(f"✓ Saved {filename} ({len(res.content)} bytes)")
                downloaded = True
                break
        except Exception as err:
            continue
    if not downloaded:
        print(f"⚠ Failed to download image for {filename}")

print("\nDone downloading blog images.")
