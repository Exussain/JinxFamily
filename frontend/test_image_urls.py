import os
import requests

GAME_URLS = {
    "fortnite": "https://cdn2.unrealengine.com/fortnite-battle-royale-key-art-1920x1080-872938475.jpg",
    "cod-mobile": "https://www.callofduty.com/content/dam/atvi/callofduty/cod-touchpoint/kronos/navigation/sub-nav/mobile-subnav.jpg",
    "wild-rift": "https://images.contentstack.io/v3/assets/blt370612137be49027/blt6d510f274ea547fe/5f6baf30ca246e495b719468/Wild_Rift_Key_Art.jpg",
    "clash-royale": "https://supercell.com/images/1547/cr_og_image.8bcbe93a.jpg",
    "pubg": "https://images.igdb.com/igdb/image/upload/t_cover_big/co1r75.png",
    "coc": "https://supercell.com/images/1381/coc_og_image.41a9b9a6.jpg",
    "free-fire": "https://images.igdb.com/igdb/image/upload/t_cover_big/co2kch.png",
    "ml": "https://images.igdb.com/igdb/image/upload/t_cover_big/co49h5.png",
    "brawl": "https://supercell.com/images/1429/brawlstars_og.e0f065ba.jpg",
    "steam": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/83/Steam_icon_logo.svg/512px-Steam_icon_logo.svg.png",
    "xbox": "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f9/Xbox_one_logo.svg/512px-Xbox_one_logo.svg.png",
    "psn": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/00/PlayStation_logo.svg/512px-PlayStation_logo.svg.png"
}

headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36"
}

for name, url in GAME_URLS.items():
    try:
        r = requests.head(url, headers=headers, timeout=5)
        print(f"{name}: URL={url} | Status={r.status_code} | Content-Type={r.headers.get('Content-Type')}")
    except Exception as e:
        print(f"{name}: Error={e}")
