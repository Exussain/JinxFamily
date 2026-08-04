import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MARVEL_RIVALS_SVG_URL = 'https://upload.wikimedia.org/wikipedia/commons/4/4f/Logo_Marvel_Rivals.svg';
const OUT_PNG = path.join(__dirname, '../public/categories/category_marvel_rivals.png');

async function renderMarvelRivals() {
  console.log('Fetching official Marvel Rivals SVG logo...');
  const res = await fetch(MARVEL_RIVALS_SVG_URL, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  const svgText = await res.text();

  console.log('Rendering Marvel Rivals via Playwright to 500x500 transparent PNG...');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 500, height: 500 }, deviceScaleFactor: 2 });

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body, html {
          margin: 0;
          padding: 0;
          width: 500px;
          height: 500px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: transparent;
        }
        svg {
          width: 380px;
          height: 380px;
          object-fit: contain;
          filter: drop-shadow(0 4px 14px rgba(225, 29, 72, 0.45));
        }
      </style>
    </head>
    <body>
      ${svgText}
    </body>
    </html>
  `;

  await page.setContent(html);
  await page.waitForTimeout(500);

  await page.screenshot({ path: OUT_PNG, omitBackground: true });
  await browser.close();

  console.log(`Saved transparent Marvel Rivals logo to ${OUT_PNG}`);
}

renderMarvelRivals().catch(console.error);
