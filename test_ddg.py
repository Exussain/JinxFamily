import urllib.request
import urllib.parse
import json
from bs4 import BeautifulSoup

def search_ddg(query):
    url = f"https://html.duckduckgo.com/html/?q={urllib.parse.quote(query)}"
    req = urllib.request.Request(
        url,
        headers={
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
            "Accept-Language": "fa-IR,fa;q=0.9,en;q=0.8"
        }
    )
    try:
        html = urllib.request.urlopen(req, timeout=10).read().decode("utf-8")
        soup = BeautifulSoup(html, "html.parser")
        results = []
        for a in soup.find_all("a", class_="result__url"):
            href = a.get("href", "")
            title_elem = a.find_parent("div", class_="result__body")
            title = ""
            snippet = ""
            if title_elem:
                t_el = title_elem.find("a", class_="result__a")
                s_el = title_elem.find("a", class_="result__snippet")
                if t_el:
                    title = t_el.get_text(strip=True)
                if s_el:
                    snippet = s_el.get_text(strip=True)
            if href and href.startswith("http"):
                results.append({"title": title, "url": href, "snippet": snippet})
        return results
    except Exception as e:
        print("DDG Error:", e)
        return []

if __name__ == "__main__":
    res = search_ddg("خرید وی باکس فورتنایت")
    print("Found DDG results count:", len(res))
    for r in res[:5]:
        print("-", r["title"], "->", r["url"])
