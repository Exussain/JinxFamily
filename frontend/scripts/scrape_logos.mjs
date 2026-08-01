import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CATEGORIES_TO_SCRAPE = [
  { name: 'category_pubg', query: 'PUBG Mobile logo png transparent' },
  { name: 'category_cod', query: 'Call of Duty Mobile logo png transparent' },
  { name: 'category_clash_royal', query: 'Clash Royale logo png transparent' },
  { name: 'category_coc', query: 'Clash of Clans logo png transparent' },
  { name: 'category_brawl_stars', query: 'Brawl Stars logo png transparent' },
  { name: 'category_freefire', query: 'Free Fire logo png transparent' },
  { name: 'category_valorant', query: 'Valorant logo png transparent' },
  { name: 'category_rainbow', query: 'Rainbow Six Siege logo png transparent' },
  { name: 'category_mobile_games', query: 'Mobile Gaming logo png transparent' },
  { name: 'category_fortnite', query: 'Fortnite logo png transparent' },
  { name: 'category_rocket_league', query: 'Rocket League logo png transparent' },
  { name: 'category_marvel_rivals', query: 'Marvel Rivals logo png transparent' }
];

const OUTPUT_DIR = path.join(__dirname, '../public/categories');
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function scrapeLogos() {
  console.log('Launching Playwright browser...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  });
  const page = await context.newPage();

  for (const item of CATEGORIES_TO_SCRAPE) {
    console.log(`\nScraping logo for: ${item.name} (query: "${item.query}")...`);
    try {
      const googleUrl = `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(item.query)}`;
      await page.goto(googleUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });
      await page.waitForTimeout(2000);

      // Find image candidates
      const imageUrls = await page.evaluate(() => {
        const imgs = Array.from(document.querySelectorAll('img'));
        const urls = [];
        for (const img of imgs) {
          const src = img.src || img.getAttribute('data-src');
          if (src && (src.startsWith('http://') || src.startsWith('https://') || src.startsWith('data:image/'))) {
            if (img.naturalWidth > 60 || img.width > 60) {
              urls.push(src);
            }
          }
        }
        return urls;
      });

      console.log(`Found ${imageUrls.length} candidate images for ${item.name}`);
      
      let downloaded = false;
      for (const url of imageUrls.slice(0, 5)) {
        try {
          if (url.startsWith('data:image/')) {
            const matches = url.match(/^data:image\/([a-zA-Z0-9+\-+]+);base64,(.+)$/);
            if (matches) {
              const ext = matches[1].includes('png') ? 'png' : 'jpg';
              const buffer = Buffer.from(matches[2], 'base64');
              const rawPath = path.join(OUTPUT_DIR, `${item.name}_raw.${ext}`);
              fs.writeFileSync(rawPath, buffer);
              console.log(`Saved base64 image to ${rawPath}`);
              downloaded = true;
              break;
            }
          } else {
            const response = await context.request.get(url, { timeout: 8000 });
            if (response.ok()) {
              const buffer = await response.body();
              if (buffer.length > 2000) {
                const rawPath = path.join(OUTPUT_DIR, `${item.name}_raw.png`);
                fs.writeFileSync(rawPath, buffer);
                console.log(`Downloaded image from ${url.slice(0, 60)}... (${buffer.length} bytes)`);
                downloaded = true;
                break;
              }
            }
          }
        } catch (err) {
          continue;
        }
      }

      if (!downloaded) {
        console.log(`Could not download image from search results for ${item.name}, trying click strategy...`);
        // Try clicking first result
        const firstThumb = page.locator('img').nth(2);
        if (await firstThumb.isVisible()) {
          await firstThumb.click();
          await page.waitForTimeout(1500);
          const largeImgSrc = await page.evaluate(() => {
            const largeImgs = Array.from(document.querySelectorAll('img[src^="http"]'));
            for (const img of largeImgs) {
              if (img.naturalWidth > 150 && !img.src.includes('google')) {
                return img.src;
              }
            }
            return null;
          });
          if (largeImgSrc) {
            const resp = await context.request.get(largeImgSrc, { timeout: 8000 });
            if (resp.ok()) {
              const buf = await resp.body();
              const rawPath = path.join(OUTPUT_DIR, `${item.name}_raw.png`);
              fs.writeFileSync(rawPath, buf);
              console.log(`Downloaded large image for ${item.name}`);
              downloaded = true;
            }
          }
        }
      }
    } catch (err) {
      console.error(`Error scraping ${item.name}: ${err.message}`);
    }
  }

  await browser.close();
  console.log('\nPlaywright scraping completed!');
}

scrapeLogos().catch(console.error);
