import requests
from bs4 import BeautifulSoup
import urllib.parse
import re
import argparse

def search_google_images_retro(query):
    url = f"https://www.google.com/search?q={urllib.parse.quote_plus(query)}&tbm=isch"
    # MSIE 6.0 triggers Google's basic, zero-JS layout
    headers = {
        "User-Agent": "Mozilla/4.0 (compatible; MSIE 6.0; Windows NT 5.1; SV1)"
    }
    try:
        r = requests.get(url, headers=headers, timeout=10)
        if r.status_code == 200:
            soup = BeautifulSoup(r.text, "html.parser")
            images = []
            # In the basic layout, images are inside table cells and contain links like /imgres?imgurl=...
            for a in soup.find_all("a"):
                href = a.get("href", "")
                if "/imgres?imgurl=" in href:
                    # Extract the imgurl parameter
                    m = re.search(r'imgurl=(.*?)&', href)
                    if m:
                        img_url = urllib.parse.unquote(m.group(1))
                        images.append(img_url)
            print(f"Query '{query}' found {len(images)} images:")
            for img in images[:5]:
                print(f" - {img}")
        else:
            print(f"Query '{query}' failed with status {r.status_code}")
    except Exception as e:
        print(f"Error for query '{query}': {e}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Search Google Images' basic HTML results.")
    parser.add_argument("query", nargs="+", help="Image search query")
    args = parser.parse_args()
    search_google_images_retro(" ".join(args.query))
