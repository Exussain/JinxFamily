import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const LOGO_TARGETS = [
  { name: 'category_fortnite', search: 'Fortnite logo' },
  { name: 'category_pubg', search: 'PUBG logo' },
  { name: 'category_cod', search: 'Call of Duty logo' },
  { name: 'category_clash_royal', search: 'Clash Royale logo' },
  { name: 'category_coc', search: 'Clash of Clans logo' },
  { name: 'category_brawl_stars', search: 'Brawl Stars logo' },
  { name: 'category_freefire', search: 'Free Fire logo' },
  { name: 'category_valorant', search: 'Valorant logo' },
  { name: 'category_rainbow', search: 'Rainbow Six Siege logo' },
  { name: 'category_rocket_league', search: 'Rocket League logo' },
  { name: 'category_mobile_games', search: 'Mobile game logo' }
];

const OUTPUT_DIR = path.join(__dirname, '../public/categories');
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function searchWikimediaLogo(query) {
  const apiUrl = `https://commons.wikimedia.org/w/api.php?action=query&format=json&generator=search&gsrsearch=${encodeURIComponent(query)}&gsrnamespace=6&prop=imageinfo&iiprop=url`;
  try {
    const res = await fetch(apiUrl, { headers: { 'User-Agent': 'NubixShopBot/1.0' } });
    if (!res.ok) return null;
    const data = await res.json();
    const pages = data?.query?.pages || {};
    for (const pid of Object.keys(pages)) {
      const info = pages[pid]?.imageinfo || [];
      if (info.length && info[0].url) {
        const url = info[0].url;
        if (url.endsWith('.svg') || url.endsWith('.png') || url.endsWith('.webp') || url.endsWith('.jpg')) {
          return url;
        }
      }
    }
  } catch (e) {
    console.error(`Wikimedia search error for ${query}:`, e.message);
  }
  return null;
}

async function main() {
  console.log('Launching Playwright for logo rendering...');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 500, height: 500 }, deviceScaleFactor: 2 });

  for (const target of LOGO_TARGETS) {
    console.log(`\nProcessing ${target.name} (${target.search})...`);
    let imgUrl = await searchWikimediaLogo(target.search);
    
    if (!imgUrl) {
      console.log(`No Wikimedia logo found for ${target.search}, skipping.`);
      continue;
    }

    console.log(`Found logo URL: ${imgUrl}`);

    try {
      if (imgUrl.endsWith('.svg')) {
        const svgRes = await fetch(imgUrl, { headers: { 'User-Agent': 'NubixShopBot/1.0' } });
        const svgContent = await svgRes.text();

        const html = `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body, html { margin: 0; padding: 0; width: 500px; height: 500px; display: flex; align-items: center; justify-content: center; background: transparent; }
              svg { max-width: 440px; max-height: 440px; width: auto; height: auto; }
            </style>
          </head>
          <body>
            ${svgContent}
          </body>
          </html>
        `;
        await page.setContent(html);
        await page.waitForTimeout(500);

        const outPngPath = path.join(OUTPUT_DIR, `${target.name}.png`);
        await page.screenshot({ path: outPngPath, omitBackground: true });
        console.log(`Rendered SVG to 500x500 PNG: ${outPngPath}`);
      } else {
        const imgRes = await fetch(imgUrl, { headers: { 'User-Agent': 'NubixShopBot/1.0' } });
        const buf = await imgRes.buffer();
        const html = `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body, html { margin: 0; padding: 0; width: 500px; height: 500px; display: flex; align-items: center; justify-content: center; background: transparent; }
              img { max-width: 440px; max-height: 440px; object-fit: contain; }
            </style>
          </head>
          <body>
            <img src="data:image/png;base64,${buf.toString('base64')}" />
          </body>
          </html>
        `;
        await page.setContent(html);
        await page.waitForTimeout(500);

        const outPngPath = path.join(OUTPUT_DIR, `${target.name}.png`);
        await page.screenshot({ path: outPngPath, omitBackground: true });
        console.log(`Rendered PNG image to 500x500 PNG: ${outPngPath}`);
      }
    } catch (e) {
      console.error(`Error rendering logo for ${target.name}:`, e.message);
    }
  }

  await browser.close();
  console.log('\nPlaywright SVG & logo rendering complete!');
}

main().catch(console.error);
