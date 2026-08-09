import { chromium } from 'playwright';
import fs from 'fs';

(async () => {
  console.log('Orchestrator X: Initializing Playwright Swarm (Sequential Mode)...');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  // 1. Fetch robots.txt
  console.log('Fetching robots.txt...');
  const robotsRes = await page.goto('https://jinxfamily.ir/robots.txt');
  const robotsText = await robotsRes.text();
  console.log('Robots.txt content length:', robotsText.length);

  // 2. Fetch sitemap.xml
  console.log('Fetching sitemap.xml...');
  const sitemapRes = await page.goto('https://jinxfamily.ir/sitemap.xml');
  const sitemapText = await sitemapRes.text();
  const urls = [...sitemapText.matchAll(/<loc>(.*?)<\/loc>/g)].map(m => m[1]);
  console.log(`Found ${urls.length} URLs in sitemap.`);

  // 3. Check some key revenue pages for prices and JSON-LD
  const targetUrls = [
    'https://jinxfamily.ir/vbucks',
    'https://jinxfamily.ir/crewpack',
    'https://jinxfamily.ir/product/fortnite-battle-pass',
    'https://jinxfamily.ir/product/chatgpt-subscription',
    'https://jinxfamily.ir/lego'
  ];

  const results = [];

  for (const url of targetUrls) {
    console.log(`Analyzing: ${url}`);
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    
    // Check JSON-LD
    const jsonLdScripts = await page.$$eval('script[type="application/ld+json"]', els => els.map(el => el.textContent));
    
    let schemaPrice = null;
    let schemaAvailability = null;
    for (const script of jsonLdScripts) {
      try {
        const data = JSON.parse(script);
        if (data['@type'] === 'Product' || data['@type'] === 'Offer') {
          if (data.offers) {
            schemaPrice = data.offers.price;
            schemaAvailability = data.offers.availability;
          }
        }
      } catch (e) {}
    }

    results.push({
      url,
      schemaPrice,
      schemaAvailability,
      jsonLdCount: jsonLdScripts.length
    });
    
    await page.waitForTimeout(500); // Small delay to avoid CPU spikes
  }

  console.log('Sample Results:', JSON.stringify(results, null, 2));

  await browser.close();
  console.log('Swarm Phase 1 complete.');
})();
