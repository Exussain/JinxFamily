import asyncio
import json
import urllib.parse
from bs4 import BeautifulSoup
from playwright.async_api import async_playwright

QUERIES = [
    {"query": "خرید وی باکس فورتنایت", "keyword": "خرید وی باکس", "target_url": "/vbucks"},
    {"query": "خرید بتل پس فورتنایت", "keyword": "خرید بتل پس", "target_url": "/product/fortnite-battle-pass"},
    {"query": "خرید کروپک فورتنایت", "keyword": "خرید کروپک", "target_url": "/crewpack"},
    {"query": "خرید اشتراک چت جی پی تی", "keyword": "خرید اشتراک چت جی پی تی", "target_url": "/product/chatgpt-subscription"},
    {"query": "خرید گیفت کارت استیم", "keyword": "خرید گیفت کارت استیم", "target_url": "/product/steam-giftcard"},
    {"query": "خرید پک لگو فورتنایت", "keyword": "خرید پک لگو", "target_url": "/lego"},
    {"query": "پیش خرید GTA 6", "keyword": "پیش خرید GTA 6", "target_url": "/gta6"},
    {"query": "خرید اشتراک جمینی", "keyword": "خرید اشتراک جمینی", "target_url": "/product/gemini-subscription"}
]

async def scrape_bing():
    async with async_playwright() as p:
        browser = await p.chromium.launch(
            executable_path='/opt/google/chrome/chrome',
            headless=True,
            args=['--no-sandbox', '--disable-setuid-sandbox']
        )
        context = await browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
            locale="fa-IR"
        )
        page = await context.new_page()

        search_results_data = []
        all_competitors_freq = {}
        keyword_to_url_map = []
        quick_wins = []
        missing_coverage = []

        for idx, item in enumerate(QUERIES):
            query = item["query"]
            keyword = item["keyword"]
            target_url = item["target_url"]

            if idx > 0:
                print(f"Waiting 5 seconds rate limit before search #{idx+1}...")
                await asyncio.sleep(5)

            search_url = f"https://www.bing.com/search?q={urllib.parse.quote(query)}&setlang=fa"
            print(f"[{idx+1}/{len(QUERIES)}] Searching Bing for: '{query}'")

            await page.goto(search_url, wait_until="domcontentloaded", timeout=30000)
            await asyncio.sleep(2)

            # Parse Bing search result items
            items_eval = """
            () => {
                const results = [];
                const blocks = document.querySelectorAll('li.b_algo');
                for (const b of blocks) {
                    const h2 = b.querySelector('h2');
                    const a = h2 ? h2.querySelector('a') : null;
                    const snippetEl = b.querySelector('div.b_caption p, p.b_algoSubTxt');
                    if (a && a.href) {
                        results.push({
                            title: h2.innerText.trim(),
                            url: a.href,
                            snippet: snippetEl ? snippetEl.innerText.trim() : ''
                        });
                    }
                }
                return results;
            }
            """
            raw_results = await page.evaluate(items_eval)

            top_10 = []
            jinxfamily_rank = None
            competitors_in_query = []

            for rank, res in enumerate(raw_results[:10], start=1):
                item_data = {
                    "rank": rank,
                    "title": res["title"],
                    "url": res["url"],
                    "snippet": res["snippet"]
                }
                top_10.append(item_data)

                parsed_domain = urllib.parse.urlparse(res["url"]).netloc.lower().replace("www.", "")
                
                if "jinxfamily.com" in parsed_domain or "jinxfamily.com" in res["url"].lower():
                    if jinxfamily_rank is None:
                        jinxfamily_rank = rank

                if parsed_domain and "jinxfamily.com" not in parsed_domain:
                    competitors_in_query.append(parsed_domain)
                    all_competitors_freq[parsed_domain] = all_competitors_freq.get(parsed_domain, 0) + 1

            transactional_keywords = ["خرید", "قیمت", "فروش", "سفارش", "تحویل", "ارزان", "تخفیف", "پک"]
            transactional_hits = sum(1 for r in top_10 if any(k in r["title"] for k in transactional_keywords))
            
            if len(top_10) > 0 and (transactional_hits / len(top_10)) >= 0.6:
                intent = "transactional"
            elif len(top_10) > 0 and (transactional_hits / len(top_10)) <= 0.3:
                intent = "informational"
            else:
                intent = "mixed"

            jinxfamily_in_top_10 = (jinxfamily_rank is not None)
            top_competitors_query = list(dict.fromkeys(competitors_in_query))[:5]

            search_results_data.append({
                "query": query,
                "intent": intent,
                "top_10": top_10,
                "jinxfamily_position": jinxfamily_rank,
                "jinxfamily_in_top_10": jinxfamily_in_top_10,
                "top_competitors": top_competitors_query
            })

            if jinxfamily_rank is None:
                gap_desc = "Not ranking in top 10"
                missing_coverage.append(keyword)
            elif jinxfamily_rank > 3:
                gap_desc = f"Position #{jinxfamily_rank} - Quick win opportunity for Top 3"
                quick_wins.append({
                    "keyword": keyword,
                    "current_rank": jinxfamily_rank,
                    "target_url": target_url
                })
            else:
                gap_desc = f"Strong ranking at #{jinxfamily_rank}"

            keyword_to_url_map.append({
                "keyword": keyword,
                "target_url": target_url,
                "current_rank": jinxfamily_rank,
                "gap": gap_desc
            })

            print(f"-> Bing Query '{query}': {len(top_10)} results found. JinxFamily position: {jinxfamily_rank or 'None'}. Intent: {intent}")

        await browser.close()

        final_output = {
            "captcha_logged": "Google search triggered automated traffic CAPTCHA (google.com/sorry/index) on server IP; Bing SERP data recorded.",
            "search_results": search_results_data,
            "keyword_to_url_map": keyword_to_url_map,
            "competitor_frequency": dict(sorted(all_competitors_freq.items(), key=lambda x: x[1], reverse=True)),
            "quick_win_keywords": quick_wins,
            "missing_keyword_coverage": missing_coverage
        }

        with open("/root/jinxfamily/search_results.json", "w", encoding="utf-8") as f:
            json.dump(final_output, f, ensure_ascii=False, indent=2)

        print("\nSUCCESS: All Bing searches completed and recorded to search_results.json")

if __name__ == "__main__":
    asyncio.run(scrape_bing())
