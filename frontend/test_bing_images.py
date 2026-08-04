import requests
from bs4 import BeautifulSoup
import json
import urllib.parse
import re

def search_bing_images(query):
    url = f"https://www.bing.com/images/search?q={urllib.parse.quote_plus(query)}"
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36"
    }
    try:
        r = requests.get(url, headers=headers, timeout=10)
        if r.status_code == 200:
            soup = BeautifulSoup(r.text, "html.parser")
            images = []
            for a in soup.find_all("a", class_="iusc"):
                m_attr = a.get("m", "")
                if m_attr:
                    try:
                        m_data = json.loads(m_attr)
                        murl = m_data.get("murl")
                        if murl:
                            images.append(murl)
                    except Exception:
                        pass
            print(f"Query '{query}' found {len(images)} images:")
            for img in images[:5]:
                print(f" - {img}")
        else:
            print(f"Query '{query}' failed with status {r.status_code}")
    except Exception as e:
        print(f"Error for query '{query}': {e}")

search_bing_images("fortnite game cover art vertical")
