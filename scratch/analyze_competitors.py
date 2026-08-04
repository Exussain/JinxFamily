import os
import asyncio
import json
import time
import re
import urllib3

for k in ["HTTP_PROXY", "HTTPS_PROXY", "http_proxy", "https_proxy", "ALL_PROXY", "all_proxy"]:
    if k in os.environ:
        del os.environ[k]

import requests
from playwright.async_api import async_playwright

urllib3.disable_warnings()

COMPETITORS = [
    {
        "name": "Iranicard",
        "domain": "iranicard.ir",
        "urls": [
            "https://www.iranicard.ir/",
            "https://www.iranicard.ir/fortnite-vbucks/",
            "https://www.iranicard.ir/chatgpt-plus/",
            "https://www.iranicard.ir/about/"
        ]
    },
    {
        "name": "Dicard",
        "domain": "dicard.ir",
        "urls": [
            "https://dicard.ir/",
            "https://dicard.ir/vbucks",
            "https://dicard.ir/fortnite-battlepass"
        ]
    },
    {
        "name": "GimeStore",
        "domain": "gimestore.ir",
        "urls": [
            "https://gimestore.ir/",
            "https://gimestore.ir/product/fortnite-vbucks"
        ]
    }
]

async def analyze_site(context, comp):
    print(f"=== Analyzing {comp['name']} ({comp['domain']}) ===")
    results = {
        "name": comp["name"],
        "domain": comp["domain"],
        "pages": []
    }

    for url in comp["urls"]:
        print(f"Visiting {url} ...")
        page = await context.new_page()
        start_time = time.time()
        status = None
        title = ""
        meta_desc = ""
        viewport = ""
        schemas = []
        internal_links_count = 0
        text_length = 0
        has_trust_badges = False
        has_author = False
        
        try:
            response = await page.goto(url, wait_until="domcontentloaded", timeout=12000)
            await asyncio.sleep(2)
            load_time = time.time() - start_time
            if response:
                status = response.status
            
            title = await page.title()
            
            # Meta description
            meta_desc_el = await page.query_selector("meta[name='description']")
            if meta_desc_el:
                meta_desc = await meta_desc_el.get_attribute("content") or ""
            
            # Viewport
            viewport_el = await page.query_selector("meta[name='viewport']")
            if viewport_el:
                viewport = await viewport_el.get_attribute("content") or ""

            # JSON-LD Schemas
            schema_scripts = await page.query_selector_all("script[type='application/ld+json']")
            for script in schema_scripts:
                try:
                    txt = await script.inner_text()
                    parsed = json.loads(txt)
                    schemas.append(parsed)
                except Exception:
                    pass

            # Internal links
            links = await page.query_selector_all("a[href]")
            for link in links:
                href = await link.get_attribute("href")
                if href and (comp["domain"] in href or href.startswith("/")):
                    internal_links_count += 1

            # Text content depth
            body_text = await page.evaluate("() => document.body ? document.body.innerText : ''")
            words = body_text.split()
            text_length = len(words)

            # E-E-A-T signals
            page_content = await page.content()
            if "enemad" in page_content.lower() or "samandehi" in page_content.lower() or "نماد اعتماد" in page_content:
                has_trust_badges = True
            if "نویسنده" in page_content or "author" in page_content.lower() or "درباره ما" in page_content or "about" in url:
                has_author = True

            results["pages"].append({
                "url": url,
                "status": status,
                "load_time_sec": round(load_time, 2),
                "title": title,
                "meta_desc": meta_desc,
                "viewport": viewport,
                "schemas": schemas,
                "internal_links_count": internal_links_count,
                "word_count": text_length,
                "has_trust_badges": has_trust_badges,
                "has_author": has_author
            })

        except Exception as err:
            print(f"Error visiting {url}: {err}")
            results["pages"].append({
                "url": url,
                "error": str(err)
            })
        finally:
            await page.close()

    return results

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(
            executable_path="/usr/bin/google-chrome",
            headless=True,
            args=["--no-sandbox", "--disable-setuid-sandbox", "--ignore-certificate-errors"]
        )
        context = await browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            ignore_https_errors=True
        )
        
        all_results = []
        for i, comp in enumerate(COMPETITORS):
            if i > 0:
                print("Waiting 5 seconds rate limit between competitors...")
                await asyncio.sleep(5)
            comp_res = await analyze_site(context, comp)
            all_results.append(comp_res)
            
        await browser.close()
        
        with open("/root/jinxfamily/scratch/competitor_analysis_raw.json", "w", encoding="utf-8") as f:
            json.dump(all_results, f, ensure_ascii=False, indent=2)
        print("Analysis complete! Saved to /root/jinxfamily/scratch/competitor_analysis_raw.json")

if __name__ == "__main__":
    asyncio.run(main())
