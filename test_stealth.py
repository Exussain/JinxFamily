import asyncio
import json
import urllib.parse
from playwright.async_api import async_playwright

async def test_stealth_search():
    async with async_playwright() as p:
        browser = await p.chromium.launch(
            executable_path='/opt/google/chrome/chrome',
            headless=True,
            args=[
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-blink-features=AutomationControlled',
                '--disable-infobars',
                '--window-size=1920,1080'
            ]
        )
        context = await browser.new_context(
            viewport={"width": 1920, "height": 1080},
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
            locale="fa-IR",
            timezone_id="Asia/Tehran"
        )
        
        page = await context.new_page()
        # Pass webdriver test
        await page.add_init_script("""
            Object.defineProperty(navigator, 'webdriver', {get: () => undefined});
            Object.defineProperty(navigator, 'languages', {get: () => ['fa-IR', 'fa', 'en-US', 'en']});
            Object.defineProperty(navigator, 'plugins', {get: () => [1, 2, 3, 4, 5]});
        """)

        print("Navigating to google.com...")
        await page.goto("https://www.google.com/?hl=fa", wait_until="domcontentloaded")
        await asyncio.sleep(2)

        # Accept cookies if modal exists
        try:
            accept_btn = await page.query_selector("button:has-text('قبول')") or await page.query_selector("button:has-text('Accept')")
            if accept_btn:
                await accept_btn.click()
                await asyncio.sleep(1)
        except Exception:
            pass

        search_box = await page.query_selector("textarea[name='q'], input[name='q']")
        if not search_box:
            print("Search box not found! Page content sample:", (await page.content())[:500])
            await browser.close()
            return

        print("Typing search query...")
        query = "خرید وی باکس فورتنایت"
        await search_box.click()
        await search_box.type(query, delay=120)
        await page.keyboard.press("Enter")
        await page.wait_for_load_state("domcontentloaded")
        await asyncio.sleep(3)

        print("Current URL:", page.url)
        content = await page.content()
        if "sorry/index" in page.url or "recaptcha" in content.lower():
            print("CAPTCHA still detected!")
        else:
            print("SEARCH SUCCESSFUL!")
            h3s = await page.query_selector_all("h3")
            for h in h3s[:5]:
                print("-", await h.inner_text())

        await browser.close()

if __name__ == "__main__":
    asyncio.run(test_stealth_search())
