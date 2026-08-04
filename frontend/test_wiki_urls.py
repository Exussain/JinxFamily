import os
import requests

WIKI_URLS = {
    "fortnite": "https://upload.wikimedia.org/wikipedia/en/b/b1/Fortnite_Battle_Royale_cover.jpeg",
    "cod-mobile": "https://upload.wikimedia.org/wikipedia/en/e/ed/Call_of_Duty_Mobile_logo.png",
    "wild-rift": "https://upload.wikimedia.org/wikipedia/en/5/51/League_of_Legends_Wild_Rift_logo.png",
    "clash-royale": "https://upload.wikimedia.org/wikipedia/en/b/b3/Clash_Royale_logo.png",
    "pubg": "https://upload.wikimedia.org/wikipedia/en/c/c8/PUBG_Mobile_logo.png",
    "coc": "https://upload.wikimedia.org/wikipedia/en/1/1d/Clash_of_Clans_logo.png",
    "free-fire": "https://upload.wikimedia.org/wikipedia/en/c/c2/Garena_Free_Fire_cover.jpg",
    "ml": "https://upload.wikimedia.org/wikipedia/en/5/50/Mobile_Legends_Bang_Bang_logo.png",
    "brawl": "https://upload.wikimedia.org/wikipedia/en/1/1a/Brawl_Stars_logo.png",
    "steam": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/83/Steam_icon_logo.svg/512px-Steam_icon_logo.svg.png",
    "xbox": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e5/Xbox_Logo.svg/512px-Xbox_Logo.svg.png",
    "psn": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Playstation_logo_colour.svg/512px-Playstation_logo_colour.svg.png"
}

headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36"
}

for name, url in WIKI_URLS.items():
    try:
        r = requests.head(url, headers=headers, timeout=10)
        print(f"{name}: URL={url} | Status={r.status_code} | Size={r.headers.get('Content-Length')} bytes")
    except Exception as e:
        print(f"{name}: Error={e}")
