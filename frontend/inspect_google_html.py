import requests
from bs4 import BeautifulSoup
import urllib.parse

url = "https://www.google.com/search?q=fortnite+game+cover+art&tbm=isch"
headers = {
    "User-Agent": "Mozilla/4.0 (compatible; MSIE 6.0; Windows NT 5.1; SV1)"
}
r = requests.get(url, headers=headers, timeout=10)
soup = BeautifulSoup(r.text, "html.parser")

# Print all <a> tags with their hrefs
print("A tags:")
a_count = 0
for a in soup.find_all("a"):
    href = a.get("href", "")
    if "url?" in href or "imgres" in href or "google" not in href:
        print(f" - {href[:100]}")
        a_count += 1
        if a_count > 10:
            break

# Print all <img> tags
print("\nImg tags:")
img_count = 0
for img in soup.find_all("img"):
    src = img.get("src", "")
    print(f" - {src[:100]}")
    img_count += 1
    if img_count > 10:
        break
