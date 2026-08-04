import requests
from bs4 import BeautifulSoup
import urllib.parse
import re

def search_ddg_image(query):
    # Use DuckDuckGo HTML search for images or standard search
    url = f"https://html.duckduckgo.com/html/?q={urllib.parse.quote_plus(query)}"
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36"
    }
    try:
        r = requests.get(url, headers=headers, timeout=10)
        if r.status_code == 200:
            soup = BeautifulSoup(r.text, "html.parser")
            # Parse search result links
            links = []
            for a in soup.find_all("a", class_="result__snippet"):
                href = a.get("href")
                if href:
                    links.append(href)
            print(f"Query: {query} | Links: {links[:3]}")
        else:
            print(f"Query: {query} | Status={r.status_code}")
    except Exception as e:
        print(f"Query: {query} | Error={e}")

search_ddg_image("fortnite game cover art")
