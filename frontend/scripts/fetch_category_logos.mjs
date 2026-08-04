import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CATEGORIES = [
  { name: 'category_pubg', query: 'PUBG Mobile transparent logo png' },
  { name: 'category_cod', query: 'Call of Duty Mobile transparent logo png' },
  { name: 'category_clash_royal', query: 'Clash Royale logo transparent png' },
  { name: 'category_coc', query: 'Clash of Clans logo transparent png' },
  { name: 'category_brawl_stars', query: 'Brawl Stars logo transparent png' },
  { name: 'category_freefire', query: 'Garena Free Fire logo transparent png' },
  { name: 'category_valorant', query: 'Valorant logo transparent png' },
  { name: 'category_rainbow', query: 'Rainbow Six Siege logo transparent png' },
  { name: 'category_marvel_rivals', query: 'Marvel Rivals logo transparent png' },
  { name: 'category_mobile_games', query: 'Mobile Gaming icon transparent logo' },
  { name: 'category_fortnite', query: 'Fortnite logo transparent png' },
  { name: 'category_rocket_league', query: 'Rocket League logo transparent png' },
  { name: 'category_ping', query: 'Gaming Ping Boost logo icon png' }
];

const OUTPUT_DIR = path.join(__dirname, '../public/categories');
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function fetchLogos() {
  console.log('Launching Playwright Chromium browser...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  });
  const page = await context.newPage();

  for (const item of CATEGORIES) {
    console.log(`\n-----------------------------------------`);
    console.log(`Playwright navigating for: ${item.name} ("${item.query}")`);
    
    try {
      const searchUrl = `https://duckduckgo.com/?q=${encodeURIComponent(item.query)}&iax=images&ia=images`;
      await page.goto(searchUrl, { waitUntil: 'networkidle', timeout: 15000 });
      await page.waitForTimeout(1500);

      // Extract image tile URLs
      const imgUrls = await page.evaluate(() => {
        const imgs = Array.from(document.querySelectorAll('img'));
        const results = [];
        for (const img of imgs) {
          const src = img.src || img.getAttribute('data-src') || '';
          if (src.includes('duckduckgo.com/iu/') || src.startsWith('http')) {
            results.push(src);
          }
        }
        return results;
      });

      console.log(`Found ${imgUrls.length} candidate logo images for ${item.name}`);

      let saved = false;
      for (const url of imgUrls.slice(0, 8)) {
        try {
          const res = await context.request.get(url, { timeout: 8000 });
          if (res.ok()) {
            const buf = await res.body();
            if (buf.length > 2500) {
              const rawPath = path.join(OUTPUT_DIR, `${item.name}_raw.png`);
              fs.writeFileSync(rawPath, buf);
              console.log(`Successfully downloaded ${item.name} logo (${buf.length} bytes) to ${rawPath}`);
              saved = true;
              break;
            }
          }
        } catch (e) {
          continue;
        }
      }

      if (!saved) {
        console.log(`Warning: Fallback strategy for ${item.name}`);
      }
    } catch (err) {
      console.error(`Error fetching logo for ${item.name}: ${err.message}`);
    }
  }

  await browser.close();
  console.log('\nPlaywright category logo fetch completed!');
}

fetchLogos().catch(console.error);
