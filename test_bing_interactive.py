import asyncio
import json
import urllib.parse
from playwright.async_api import async_playwright

QUERIES = [
    "خرید وی باکس فورتنایت",
    "خرید بتل پس فورتنایت",
    "خرید کروپک فورتنایت",
    "خرید اشتراک چت جی پی تی",
    "خرید گیفت کارت استیم",
    "خرید پک لگو فورتنایت",
    "پیش خرید GTA 6",
    "خرید اشتراک جمینی"
]

async def test_bing_interactive():
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

        await page.goto("https://www.bing.com/?setlang=fa", wait_until="domcontentloaded")
        await asyncio.sleep(2)

        for idx, q in enumerate(QUERIES):
            if idx > 0:
                print("Waiting 5s delay...")
                await asyncio.sleep(5)

            search_box = await page.query_selector("input#sb_form_q, textarea#sb_form_q, input[name='q']")
            if not search_box:
                await page.goto(f"https://www.bing.com/search?q={urllib.parse.quote(q)}&setlang=fa")
                search_box = await page.query_selector("input#sb_form_q, textarea#sb_form_q, input[name='q']")

            if search_box:
                await search_box.fill("")
                await search_box.fill(q)
                await page.keyboard.press("Enter")
                await page.wait_for_load_state("domcontentloaded")
                await asyncio.sleep(2)

            # Evaluate organic results
            eval_js = """
            () => {
                const items = [];
                const blocks = document.querySelectorAll('li.b_algo');
                for (const b of blocks) {
                    const h2 = b.querySelector('h2');
                    const a = h2 ? h2.querySelector('a') : null;
                    const snippetEl = b.querySelector('div.b_caption p, p.b_algoSubTxt, div.b_snippet');
                    if (a && a.href && a.href.startsWith('http')) {
                        items.push({
                            title: h2.innerText.trim(),
                            url: a.href,
                            snippet: snippetEl ? snippetEl.innerText.trim() : ''
                        });
                    }
                }
                return items;
            }
            """
            results = await page.evaluate(eval_js)
            print(f"[{idx+1}/{len(QUERIES)}] Query '{q}': Found {len(results)} items")
            if results:
                print("   Top #1:", results[0]["title"], "->", results[0]["url"][:60])

        await browser.close()

if __name__ == "__main__":
    asyncio.run(test_bing_interactive())
