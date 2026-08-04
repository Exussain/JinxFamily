import requests
import json
import urllib.parse
import re

def search_ddg_images(query):
    # DuckDuckGo image search API endpoint
    url = "https://duckduckgo.com/d.js"
    params = {
        "q": query,
        "t": "A",
        "iax": "images",
        "ia": "images",
        "f": ",,,",
        "p": "1"
    }
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
        "Referer": "https://duckduckgo.com/"
    }
    try:
        r = requests.get(url, params=params, headers=headers, timeout=10)
        # DDG returns Javascript that contains JSON in a function call
        match = re.search(r'DDG\.pageeffects\.show\((.*?)\);', r.text, re.DOTALL)
        if not match:
            # Try to search for JSON-like structure
            match = re.search(r'vdir\s*=\s*(\[.*?\]);', r.text)
        if match:
            data = json.loads(match.group(1))
            print(f"Found results for {query}:")
            for item in data[:3]:
                print(f" - {item.get('image')} (Title: {item.get('title')})")
        else:
            # Let's print the first 500 chars of response to inspect
            print(f"Query {query} | Response length: {len(r.text)} | First 200 chars: {r.text[:200]}")
    except Exception as e:
        print(f"Error for {query}: {e}")

search_ddg_images("fortnite cover art")
