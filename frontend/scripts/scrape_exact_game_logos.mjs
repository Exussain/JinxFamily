import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const EXACT_LOGOS = [
  { key: 'category_marvel_rivals', query: 'Marvel Rivals 2024 game logo png' },
  { key: 'category_rainbow', query: 'Rainbow Six Siege game logo png' },
  { key: 'category_valorant', query: 'Valorant game logo png' },
  { key: 'category_pubg', query: 'PUBG Mobile game logo png' },
  { key: 'category_cod', query: 'Call of Duty Mobile game logo png' },
  { key: 'category_clash_royal', query: 'Clash Royale game logo png' },
  { key: 'category_coc', query: 'Clash of Clans game logo png' },
  { key: 'category_brawl_stars', query: 'Brawl Stars game logo png' },
  { key: 'category_freefire', query: 'Free Fire game logo png' },
  { key: 'category_fortnite', query: 'Fortnite game logo png' },
  { key: 'category_rocket_league', query: 'Rocket League game logo png' },
  { key: 'category_ping', query: 'ExitLag logo png' }
];

const OUT_DIR = path.join(__dirname, '../public/categories');

async function scrapeExactLogos() {
  console.log('Launching Playwright Chromium for Exact Official Game Logos...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
  });
  const page = await context.newPage();

  for (const item of EXACT_LOGOS) {
    console.log(`\n------------------------------------------------`);
    console.log(`Scraping exact logo for ${item.key} ("${item.query}")`);

    try {
      const searchUrl = `https://www.bing.com/images/search?q=${encodeURIComponent(item.query)}&qft=+filterui:photo-png`;
      await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 12000 });
      await page.waitForTimeout(1500);

      const imageUrls = await page.evaluate(() => {
        const results = [];
        const anchors = Array.from(document.querySelectorAll('a.iusc'));
        for (const a of anchors) {
          try {
            const m = JSON.parse(a.getAttribute('m') || '{}');
            if (m.murl && (m.murl.endsWith('.png') || m.murl.endsWith('.webp') || m.murl.endsWith('.jpg'))) {
              results.push(m.murl);
            }
          } catch (e) {}
        }
        return results;
      });

      console.log(`Found ${imageUrls.length} exact candidate URLs for ${item.key}`);

      let downloaded = false;
      for (const url of imageUrls.slice(0, 10)) {
        try {
          const res = await context.request.get(url, { timeout: 8000 });
          if (res.ok()) {
            const buf = await res.body();
            if (buf.length > 3000) {
              const rawPath = path.join(OUT_DIR, `${item.key}_exact.png`);
              fs.writeFileSync(rawPath, buf);
              console.log(`Successfully downloaded exact logo (${buf.length} bytes) to ${rawPath}`);
              downloaded = true;
              break;
            }
          }
        } catch (e) {
          continue;
        }
      }

      if (!downloaded) {
        console.log(`Warning: Fallback strategy for ${item.key}`);
      }
    } catch (err) {
      console.error(`Error for ${item.key}:`, err.message);
    }
  }

  await browser.close();
  console.log('\nExact logo scrape finished!');
}

scrapeExactLogos().catch(console.error);
