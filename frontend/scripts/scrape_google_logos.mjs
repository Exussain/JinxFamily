import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CATEGORY_SEARCHES = [
  { key: 'category_fortnite', query: 'Fortnite official logo png transparent' },
  { key: 'category_pubg', query: 'PUBG Mobile official logo png transparent' },
  { key: 'category_cod', query: 'Call of Duty Mobile official logo png transparent' },
  { key: 'category_clash_royal', query: 'Clash Royale official logo png transparent' },
  { key: 'category_coc', query: 'Clash of Clans official logo png transparent' },
  { key: 'category_brawl_stars', query: 'Brawl Stars official logo png transparent' },
  { key: 'category_freefire', query: 'Garena Free Fire official logo png transparent' },
  { key: 'category_valorant', query: 'Valorant official logo png transparent' },
  { key: 'category_rainbow', query: 'Rainbow Six Siege official logo png transparent' },
  { key: 'category_marvel_rivals', query: 'Marvel Rivals official logo png transparent' },
  { key: 'category_rocket_league', query: 'Rocket League official logo png transparent' },
  { key: 'category_ping', query: 'GearUp Booster logo png transparent' },
  { key: 'category_mobile_games', query: 'Mobile Gaming icon logo png transparent' }
];

const BASE_SCRAPE_DIR = '/tmp/scraped_logos';
if (!fs.existsSync(BASE_SCRAPE_DIR)) {
  fs.mkdirSync(BASE_SCRAPE_DIR, { recursive: true });
}

async function scrapeLogos() {
  console.log('Launching Playwright Chromium for Google & Bing Image Scraping...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    locale: 'en-US'
  });
  const page = await context.newPage();

  for (const item of CATEGORY_SEARCHES) {
    console.log(`\n==================================================`);
    console.log(`Scraping candidates for ${item.key} ("${item.query}")`);

    const catDir = path.join(BASE_SCRAPE_DIR, item.key);
    if (!fs.existsSync(catDir)) {
      fs.mkdirSync(catDir, { recursive: true });
    }

    let candidateIdx = 1;
    let savedCount = 0;

    // Strategy 1: Bing Images Search (High reliability for transparent PNG logos)
    try {
      const bingUrl = `https://www.bing.com/images/search?q=${encodeURIComponent(item.query)}&qft=+filterui:photo-png`;
      await page.goto(bingUrl, { waitUntil: 'domcontentloaded', timeout: 12000 });
      await page.waitForTimeout(1500);

      const imageUrls = await page.evaluate(() => {
        const results = [];
        const imgs = Array.from(document.querySelectorAll('img.mimg, img.cimg, a.iusc'));
        for (const el of imgs) {
          if (el.tagName === 'A') {
            try {
              const m = JSON.parse(el.getAttribute('m') || '{}');
              if (m.murl) results.push(m.murl);
            } catch (e) {}
          } else {
            const src = el.src || el.getAttribute('data-src') || '';
            if (src && src.startsWith('http')) results.push(src);
          }
        }
        return results;
      });

      console.log(`Bing found ${imageUrls.length} candidate URLs for ${item.key}`);

      for (const url of imageUrls) {
        if (savedCount >= 10) break;
        try {
          const res = await context.request.get(url, { timeout: 7000 });
          if (res.ok()) {
            const buffer = await res.body();
            if (buffer.length > 2500) {
              const ext = url.includes('.png') ? 'png' : 'jpg';
              const filePath = path.join(catDir, `candidate_${candidateIdx}.${ext}`);
              fs.writeFileSync(filePath, buffer);
              console.log(`Saved candidate ${candidateIdx} (${buffer.length} bytes) to ${filePath}`);
              candidateIdx++;
              savedCount++;
            }
          }
        } catch (e) {
          continue;
        }
      }
    } catch (e) {
      console.error(`Bing scrape error for ${item.key}:`, e.message);
    }

    // Strategy 2: Google Images Search fallback
    if (savedCount < 10) {
      try {
        const googleUrl = `https://www.google.com/search?q=${encodeURIComponent(item.query)}&tbm=isch`;
        await page.goto(googleUrl, { waitUntil: 'domcontentloaded', timeout: 12000 });
        await page.waitForTimeout(1500);

        const googleImgUrls = await page.evaluate(() => {
          const results = [];
          const imgs = Array.from(document.querySelectorAll('img'));
          for (const img of imgs) {
            const src = img.src || img.getAttribute('data-src') || '';
            if (src && (src.startsWith('data:image/') || src.startsWith('http'))) {
              results.push(src);
            }
          }
          return results;
        });

        for (const src of googleImgUrls) {
          if (savedCount >= 10) break;
          try {
            if (src.startsWith('data:image/')) {
              const matches = src.match(/^data:image\/([a-zA-Z0-9]+);base64,(.+)$/);
              if (matches) {
                const ext = matches[1] === 'jpeg' ? 'jpg' : matches[1];
                const buffer = Buffer.from(matches[2], 'base64');
                if (buffer.length > 1500) {
                  const filePath = path.join(catDir, `candidate_${candidateIdx}.${ext}`);
                  fs.writeFileSync(filePath, buffer);
                  console.log(`Saved Google candidate ${candidateIdx} (${buffer.length} bytes)`);
                  candidateIdx++;
                  savedCount++;
                }
              }
            }
          } catch (e) {
            continue;
          }
        }
      } catch (e) {
        console.error(`Google scrape error for ${item.key}:`, e.message);
      }
    }

    console.log(`Total candidates saved for ${item.key}: ${savedCount}`);
  }

  await browser.close();
  console.log('\nPlaywright Multi-Source Image Scraper completed!');
}

scrapeLogos().catch(console.error);
