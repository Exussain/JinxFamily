import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const VALORANT_SVG_URL = 'https://upload.wikimedia.org/wikipedia/commons/4/44/Valorant_logo.svg';
const OUT_PNG = path.join(__dirname, '../public/categories/category_valorant.png');

async function renderValorant() {
  console.log('Fetching official Valorant SVG logo...');
  const res = await fetch(VALORANT_SVG_URL, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  const svgText = await res.text();

  console.log('Rendering via Playwright to 500x500 transparent PNG...');
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
          width: 360px;
          height: 360px;
          object-fit: contain;
          filter: drop-shadow(0 4px 12px rgba(255, 70, 85, 0.4));
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

  console.log(`Saved transparent Valorant logo to ${OUT_PNG}`);
}

renderValorant().catch(console.error);
