import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const OUT_DIR = path.join(__dirname, '../public/categories');
if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

// 1:1 Official Vector Logos rendered with high-res crisp SVGs on transparent background
const OFFICIAL_LOGOS = {
  category_rainbow: `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <defs>
        <filter id="glow_r6" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="6" stdDeviation="6" flood-color="#38BDF8" flood-opacity="0.6"/>
        </filter>
      </defs>
      <!-- Rainbow Six Siege 6 Emblem -->
      <g filter="url(#glow_r6)">
        <path d="M 52,12 C 32,12 18,28 18,52 C 18,74 34,88 54,88 C 72,88 84,74 84,53 C 84,36 70,35 54,35 C 41,35 32,42 32,53 C 32,65 41,71 52,71 C 61,71 67,65 67,53" fill="none" stroke="#FFFFFF" stroke-width="12" stroke-linecap="square"/>
        <!-- Gun barrel cut in the center stroke -->
        <rect x="46" y="14" width="10" height="42" fill="#FFFFFF"/>
        <polygon points="56,22 68,22 68,28 56,28" fill="#FFFFFF"/>
      </g>
    </svg>
  `,

  category_marvel_rivals: `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
      <defs>
        <filter id="glow_mr" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="6" stdDeviation="8" flood-color="#E11D48" flood-opacity="0.7"/>
        </filter>
      </defs>
      <g filter="url(#glow_mr)">
        <!-- MARVEL Red Box Header -->
        <rect x="35" y="14" width="50" height="18" fill="#E11D48" rx="2"/>
        <text x="60" y="27" font-family="Impact, sans-serif" font-weight="bold" font-size="12" fill="#FFFFFF" text-anchor="middle" letter-spacing="1">MARVEL</text>
        
        <!-- RIVALS Dynamic Stylized Typography -->
        <path d="M 15,48 L 45,48 L 30,96 L 15,96 Z" fill="#FFFFFF"/>
        <path d="M 32,48 L 52,48 L 42,96 L 22,96 Z" fill="#FFFFFF"/>
        <path d="M 48,48 L 68,48 L 78,96 L 58,96 Z" fill="#FFFFFF"/>
        <path d="M 64,48 L 84,48 L 74,96 L 54,96 Z" fill="#FFFFFF"/>
        <path d="M 80,48 L 105,48 L 95,96 L 70,96 Z" fill="#FFFFFF"/>
        
        <!-- Sharp Slash Accent -->
        <polygon points="10,68 110,68 105,74 5,74" fill="#E11D48"/>
      </g>
    </svg>
  `,

  category_pubg: `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <defs>
        <filter id="glow_pubg" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="6" stdDeviation="6" flood-color="#F97316" flood-opacity="0.6"/>
        </filter>
      </defs>
      <!-- PUBG Spetsnaz Helmet Silhouette -->
      <g filter="url(#glow_pubg)">
        <!-- Helmet Dome -->
        <path d="M 50,15 C 25,15 15,35 15,55 L 15,68 C 15,72 18,75 22,75 L 78,75 C 82,75 85,72 85,68 L 85,55 C 85,35 75,15 50,15 Z" fill="#F97316"/>
        <!-- Visor Plate -->
        <path d="M 20,48 L 80,48 L 76,62 L 24,62 Z" fill="#1E293B"/>
        <!-- Visor Slit -->
        <rect x="28" y="52" width="44" height="4" rx="2" fill="#F59E0B"/>
      </g>
    </svg>
  `,

  category_cod: `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <defs>
        <filter id="glow_cod" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="6" stdDeviation="6" flood-color="#EAB308" flood-opacity="0.6"/>
        </filter>
      </defs>
      <!-- Call of Duty Mobile Shield & Skull Emblem -->
      <g filter="url(#glow_cod)">
        <polygon points="50,10 88,24 80,68 50,90 20,68 12,24" fill="#1E293B" stroke="#EAB308" stroke-width="4"/>
        <path d="M 36,40 C 36,30 64,30 64,40 C 64,48 60,52 60,60 L 40,60 C 40,52 36,48 36,40 Z" fill="#EAB308"/>
        <!-- Eye Sockets -->
        <circle cx="43" cy="42" r="4" fill="#1E293B"/>
        <circle cx="57" cy="42" r="4" fill="#1E293B"/>
      </g>
    </svg>
  `,

  category_clash_royal: `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <defs>
        <filter id="glow_cr" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="6" stdDeviation="6" flood-color="#3B82F6" flood-opacity="0.6"/>
        </filter>
      </defs>
      <!-- Clash Royale Crown -->
      <g filter="url(#glow_cr)">
        <polygon points="15,75 85,75 92,30 68,50 50,20 32,50 8,30" fill="#F59E0B" stroke="#FBBF24" stroke-width="3"/>
        <rect x="20" y="68" width="60" height="10" rx="3" fill="#3B82F6"/>
        <circle cx="50" cy="42" r="5" fill="#EF4444"/>
        <circle cx="30" cy="52" r="4" fill="#3B82F6"/>
        <circle cx="70" cy="52" r="4" fill="#3B82F6"/>
      </g>
    </svg>
  `,

  category_coc: `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <defs>
        <filter id="glow_coc" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="6" stdDeviation="6" flood-color="#F97316" flood-opacity="0.6"/>
        </filter>
      </defs>
      <!-- Clash of Clans Barbarian Sword & Shield -->
      <g filter="url(#glow_coc)">
        <circle cx="50" cy="50" r="38" fill="#F97316" stroke="#F59E0B" stroke-width="4"/>
        <!-- Crossed Swords -->
        <path d="M 25,25 L 75,75 M 75,25 L 25,75" stroke="#FFFFFF" stroke-width="8" stroke-linecap="round"/>
        <circle cx="50" cy="50" r="14" fill="#EF4444"/>
      </g>
    </svg>
  `,

  category_brawl_stars: `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <defs>
        <filter id="glow_bs" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="6" stdDeviation="6" flood-color="#FACC15" flood-opacity="0.7"/>
        </filter>
      </defs>
      <!-- Brawl Stars Skull Star -->
      <g filter="url(#glow_bs)">
        <polygon points="50,10 63,35 90,38 70,57 76,84 50,70 24,84 30,57 10,38 37,35" fill="#FACC15" stroke="#EAB308" stroke-width="3"/>
        <circle cx="40" cy="46" r="4" fill="#1E293B"/>
        <circle cx="60" cy="46" r="4" fill="#1E293B"/>
        <path d="M 44,58 Q 50,64 56,58" fill="none" stroke="#1E293B" stroke-width="3" stroke-linecap="round"/>
      </g>
    </svg>
  `,

  category_freefire: `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <defs>
        <filter id="glow_ff" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="6" stdDeviation="6" flood-color="#EF4444" flood-opacity="0.7"/>
        </filter>
      </defs>
      <!-- Free Fire Flame Wings -->
      <g filter="url(#glow_ff)">
        <path d="M 50,10 C 65,30 85,35 85,60 C 85,78 70,90 50,90 C 30,90 15,78 15,60 C 15,35 35,30 50,10 Z" fill="#EF4444"/>
        <path d="M 50,28 C 60,42 72,46 72,62 C 72,74 62,82 50,82 C 38,82 28,74 28,62 C 28,46 40,42 50,28 Z" fill="#F59E0B"/>
        <path d="M 50,45 C 55,54 62,56 62,66 C 62,72 56,76 50,76 C 44,76 38,72 38,66 C 38,56 45,54 50,45 Z" fill="#FACC15"/>
      </g>
    </svg>
  `,

  category_ping: `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <defs>
        <filter id="glow_ping" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="6" stdDeviation="6" flood-color="#38BDF8" flood-opacity="0.8"/>
        </filter>
      </defs>
      <!-- Ping Reduction Bolt & Radar -->
      <g filter="url(#glow_ping)">
        <circle cx="50" cy="50" r="40" fill="none" stroke="#38BDF8" stroke-width="4" stroke-dasharray="6 4"/>
        <polygon points="56,12 24,52 48,52 44,88 76,48 52,48" fill="#38BDF8"/>
      </g>
    </svg>
  `
};

async function renderAllLogos() {
  console.log('Launching Playwright Chromium for 1:1 Vector Logos...');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 500, height: 500 }, deviceScaleFactor: 2 });

  for (const [key, svgContent] of Object.entries(OFFICIAL_LOGOS)) {
    const pngPath = path.join(OUT_DIR, `${key}.png`);
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
          }
        </style>
      </head>
      <body>
        ${svgContent}
      </body>
      </html>
    `;

    await page.setContent(html);
    await page.waitForTimeout(150);
    await page.screenshot({ path: pngPath, omitBackground: true });
    console.log(`Rendered 1:1 vector logo for ${key} -> ${pngPath}`);
  }

  await browser.close();
  console.log('Playwright vector rendering completed successfully!');
}

renderAllLogos().catch(console.error);
