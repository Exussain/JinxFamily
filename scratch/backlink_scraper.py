import asyncio
import json
import os
import re
import urllib.parse
from playwright.async_api import async_playwright

USER_DATA_DIR = "/root/jinxfamily/chrome_user_data_scraper"

QUERIES = [
    {"id": "site_search", "query": "site:nubixshop.ir"},
    {"id": "brand_fa", "query": "\"نوبیکس شاپ\""},
    {"id": "brand_en", "query": "\"nubixshop\""},
    {"id": "directories", "query": "\"nubixshop\" OR \"نوبیکس شاپ\" site:enamad.ir OR site:zarinpal.com OR site:persiantools.com"},
    {"id": "gaming_news", "query": "\"نوبیکس شاپ\" site:zoomg.ir OR site:vigiato.net OR site:gamefa.com OR site:bazicenter.com"}
]

async def check_captcha(page):
    url = page.url
    if "google.com/sorry" in url or "captcha" in url.lower():
        return True
    captcha_elem = await page.query_selector("iframe[src*='recaptcha'], #captcha-form, div.g-recaptcha")
    if captcha_elem:
        return True
    return False

async def parse_stats(page):
    try:
        stats_elem = await page.query_selector("#result-stats")
        if stats_elem:
            return await stats_elem.inner_text()
    except Exception as e:
        pass
    return ""

async def parse_results(page):
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
            if (!href || !href.startsWith('http') || href.includes('google.com') || href.includes('webcache.google')) {
                continue;
            }
            
            let container = h3.closest('div.g') || h3.closest('div[data-sokoban-container]') || h3.closest('div.MjjYud') || h3.parentElement;
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

async def main():
    os.makedirs(USER_DATA_DIR, exist_ok=True)
    results = {}
    
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
        
        for idx, item in enumerate(QUERIES):
            if idx > 0:
                print("Waiting 5s rate limit...")
                await asyncio.sleep(5)
                
            q = item["query"]
            print(f"[{idx+1}/{len(QUERIES)}] Querying: {q}")
            url = f"https://www.google.com/search?q={urllib.parse.quote(q)}&hl=fa"
            
            try:
                await page.goto(url, wait_until="networkidle", timeout=15000)
            except Exception as e:
                print(f"Navigation error: {e}")
                try:
                    await page.goto(url, wait_until="domcontentloaded", timeout=10000)
                except Exception as e2:
                    print(f"Fallback navigation error: {e2}")
            
            if await check_captcha(page):
                print("CAPTCHA detected! Stopping search.")
                results["captcha_detected"] = True
                break
                
            stats = await parse_stats(page)
            serp_items = await parse_results(page)
            
            results[item["id"]] = {
                "query": q,
                "stats": stats,
                "items": serp_items
            }
            
        await context.close()
        
    with open("/root/jinxfamily/scratch/backlink_search_output.json", "w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    print("Scraping completed. Saved to backlink_search_output.json")

if __name__ == "__main__":
    asyncio.run(main())
