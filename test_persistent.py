import asyncio
import json
import os
from playwright.async_api import async_playwright

USER_DATA_DIR = "/root/jinxfamily/chrome_user_data"

async def test_persistent_context():
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

        print("Navigating to Google...")
        await page.goto("https://www.google.com/?hl=fa", wait_until="domcontentloaded")
        await asyncio.sleep(2)

        # Search query 1
        query = "خرید وی باکس فورتنایت"
        search_box = await page.query_selector("textarea[name='q'], input[name='q']")
        if search_box:
            await search_box.fill(query)
            await page.keyboard.press("Enter")
            await page.wait_for_load_state("domcontentloaded")
            await asyncio.sleep(3)

        print("URL:", page.url)
        content = await page.content()
        if "sorry/index" in page.url or "captcha" in content.lower():
            print("CAPTCHA detected!")
        else:
            print("SUCCESS! No CAPTCHA!")
            h3s = await page.query_selector_all("h3")
            for h in h3s[:5]:
                print("Result:", await h.inner_text())

        await context.close()

if __name__ == "__main__":
    asyncio.run(test_persistent_context())
