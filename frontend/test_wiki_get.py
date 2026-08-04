import os
import requests
import hashlib

def get_wikimedia_url(filename, is_commons=True):
    # Replace spaces with underscores
    filename = filename.replace(" ", "_")
    m = hashlib.md5(filename.encode("utf-8")).hexdigest()
    path = f"{m[0]}/{m[:2]}/{filename}"
    if is_commons:
        return f"https://upload.wikimedia.org/wikipedia/commons/{path}"
    else:
        return f"https://upload.wikimedia.org/wikipedia/en/{path}"

# Let's define the filenames on Wikipedia for each game
FILES = {
    "fortnite": ("Fortnite Game Logo.svg", False),  # Wikipedia /en
    "cod-mobile": ("Call of Duty Mobile Logo.png", True),  # Commons
    "wild-rift": ("League of Legends Wild Rift logo.png", False), # /en
    "clash-royale": ("Clash Royale logo.png", False), # /en
    "pubg": ("PUBG Mobile logo.png", False), # /en
    "coc": ("Clash of Clans logo.png", False), # /en
    "free-fire": ("Garena Free Fire cover.jpg", False), # /en
    "ml": ("Mobile Legends Bang Bang logo.png", False), # /en
    "brawl": ("Brawl Stars logo.png", False), # /en
    "steam": ("Steam icon logo.svg", True), # Commons
    "xbox": ("Xbox Logo.svg", True), # Commons
    "psn": ("Playstation logo colour.svg", True) # Commons
}

headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36"
}

for name, (file, is_commons) in FILES.items():
    url = get_wikimedia_url(file, is_commons)
    
    # If it is SVG, get the PNG thumbnail URL
    if file.endswith(".svg"):
        # For commons SVGs, the thumbnail URL is /wikipedia/commons/thumb/h/hs/name.svg/512px-name.svg.png
        filename_under = file.replace(" ", "_")
        m = hashlib.md5(filename_under.encode("utf-8")).hexdigest()
        path = f"{m[0]}/{m[:2]}/{filename_under}"
        if is_commons:
            url = f"https://upload.wikimedia.org/wikipedia/commons/thumb/{path}/512px-{filename_under}.png"
        else:
            url = f"https://upload.wikimedia.org/wikipedia/en/thumb/{path}/512px-{filename_under}.png"

    try:
        r = requests.get(url, headers=headers, timeout=10)
        print(f"{name}: URL={url} | Status={r.status_code} | Length={len(r.content)}")
    except Exception as e:
        print(f"{name}: Error={e}")
