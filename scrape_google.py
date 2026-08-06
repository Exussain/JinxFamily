import asyncio
import json
import os
import urllib.parse
from playwright.async_api import async_playwright

USER_DATA_DIR = "/root/jinxfamily/chrome_user_data_scraper"

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

async def parse_google_results(page):
    eval_script = """
    () => {
        const items = [];
        const h3Elements = Array.from(document.querySelectorAll('h3'));
        
        for (const h3 of h3Elements) {
            let anchor = h3.closest('a');
            if (!anchor) {
                const parent = h3.parentElement;
                anchor = parent ? parent.querySelector('a') : null;
            }
            if (!anchor) continue;
            
            const href = anchor.href || '';
            if (!href || !href.startsWith('http') || href.includes('google.com') || href.includes('youtube.com') || href.includes('webcache.google')) {
                continue;
            }
            
            let container = h3.closest('div.g') || h3.closest('div[data-sokoban-container]') || h3.closest('div.MjjYud') || h3.parentElement.parentElement;
            let snippet = '';
            if (container) {
                const snippetEl = container.querySelector('div.VwiC3b, div.yD8wfc, div[style*="line-clamp"], div.N692ie, span.aCOpRe');
                if (snippetEl) {
                    snippet = snippetEl.innerText.trim();
                } else {
                    const text = container.innerText || '';
                    snippet = text.replace(h3.innerText, '').trim().slice(0, 200);
                }
            }
            
            items.push({
                title: h3.innerText.trim(),
                url: href,
                snippet: snippet.replace(/\\n+/g, ' ')
            });
        }
        
        const seen = new Set();
        const uniqueItems = [];
        for (const item of items) {
            if (!seen.has(item.url)) {
                seen.add(item.url);
                uniqueItems.push(item);
            }
        }
        return uniqueItems;
    }
    """
    return await page.evaluate(eval_script)

async def run_scraper():
    os.makedirs(USER_DATA_DIR, exist_ok=True)
    async with async_playwright() as p:
        context = await p.chromium.launch_persistent_context(
            user_data_dir=USER_DATA_DIR,
            executable_path='/opt/google/chrome/chrome',
            headless=True,
            args=[
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-blink-features=AutomationControlled',
                '--window-size=1920,1080',
                '--lang=fa-IR,fa'
            ],
            locale="fa-IR",
            user_agent="Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36"
        )
        
        page = context.pages[0] if context.pages else await context.new_page()
        await page.add_init_script("""
            Object.defineProperty(navigator, 'webdriver', {get: () => undefined});
        """)

        print("Initial navigation to Google...")
        await page.goto("https://www.google.com/?hl=fa", wait_until="domcontentloaded")
        await asyncio.sleep(2)

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
                print(f"RATE LIMIT: Waiting 5 seconds before search #{idx+1}...")
                await asyncio.sleep(5)

            print(f"\n[{idx+1}/{len(QUERIES)}] Navigating to search for: '{query}'")

            search_url = f"https://www.google.com/search?q={urllib.parse.quote(query)}&hl=fa&gl=ir"
            try:
                await page.goto(search_url, wait_until="domcontentloaded", timeout=30000)
                await asyncio.sleep(4)

                current_url = page.url
                content = await page.content()

                if "sorry/index" in current_url or "captcha" in content.lower() or "recaptcha" in content.lower():
                    print(f"CRITICAL: CAPTCHA detected on query '{query}'. Stopping search.")
                    break

                raw_results = await parse_google_results(page)
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

                # Intent classification
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

                print(f"-> Query '{query}': {len(top_10)} results found. JinxFamily position: {jinxfamily_rank or 'Not in Top 10'}. Intent: {intent}")

            except Exception as err:
                print(f"Error during search '{query}': {err}")

        await context.close()

        final_output = {
            "search_results": search_results_data,
            "keyword_to_url_map": keyword_to_url_map,
            "competitor_frequency": dict(sorted(all_competitors_freq.items(), key=lambda x: x[1], reverse=True)),
            "quick_win_keywords": quick_wins,
            "missing_keyword_coverage": missing_coverage
        }

        with open("/root/jinxfamily/search_results.json", "w", encoding="utf-8") as f:
            json.dump(final_output, f, ensure_ascii=False, indent=2)

        print("\nSUCCESS: All searches finished. Saved to /root/jinxfamily/search_results.json")

if __name__ == "__main__":
    asyncio.run(run_scraper())
