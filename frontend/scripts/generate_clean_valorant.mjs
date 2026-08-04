import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const OUT_PNG = path.join(__dirname, '../public/categories/category_valorant.png');

// Clean, precise vector SVG of the official Valorant V logo (#FF4655)
const VALORANT_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="500" height="500">
  <defs>
    <filter id="glow" x="-30%" y="-30%" width="160%" height="160%">
      <feDropShadow dx="0" dy="6" stdDeviation="6" flood-color="#FF4655" flood-opacity="0.6"/>
    </filter>
  </defs>
  <g filter="url(#glow)">
    <!-- Right long diagonal -->
    <path d="M 67.5 18 L 87.5 18 L 50 82 L 30 82 Z" fill="#FF4655" />
    <!-- Left top floating shape -->
    <path d="M 12.5 18 L 36.5 18 L 47.5 37.5 L 23.5 37.5 Z" fill="#FF4655" />
  </g>
</svg>
`;

async function main() {
  console.log('Rendering local official Valorant SVG via Playwright...');
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
        }
      </style>
    </head>
    <body>
      ${VALORANT_SVG}
    </body>
    </html>
  `;

  await page.setContent(html);
  await page.waitForTimeout(300);

  await page.screenshot({ path: OUT_PNG, omitBackground: true });
  await browser.close();

  console.log(`Rendered clean Valorant logo to ${OUT_PNG}`);
}

main().catch(console.error);
