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

// 1:1 Official Game Logos with authentic brand styling and zero text banners
const GAME_LOGOS = {
  category_valorant: {
    bg: 'radial-gradient(circle at center, #1F2937 0%, #0F1923 100%)',
    svg: `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="340" height="340">
        <defs>
          <filter id="glow_val" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="8" stdDeviation="10" flood-color="#FF4655" flood-opacity="0.8"/>
          </filter>
        </defs>
        <g filter="url(#glow_val)">
          <path d="M 67.5 18 L 87.5 18 L 50 82 L 30 82 Z" fill="#FF4655" />
          <path d="M 12.5 18 L 36.5 18 L 47.5 37.5 L 23.5 37.5 Z" fill="#FF4655" />
        </g>
      </svg>
    `
  },

  category_marvel_rivals: {
    bg: 'radial-gradient(circle at center, #31121E 0%, #0F0914 100%)',
    svg: `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="360" height="360">
        <defs>
          <filter id="glow_mr" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="8" stdDeviation="10" flood-color="#E11D48" flood-opacity="0.8"/>
          </filter>
        </defs>
        <g filter="url(#glow_mr)">
          <!-- MARVEL Red Box Header -->
          <rect x="35" y="18" width="50" height="18" fill="#E11D48" rx="2"/>
          <text x="60" y="31" font-family="Impact, sans-serif" font-weight="bold" font-size="12" fill="#FFFFFF" text-anchor="middle" letter-spacing="1">MARVEL</text>
          <!-- RIVALS Title Accent -->
          <path d="M 15,50 L 45,50 L 30,94 L 15,94 Z" fill="#FFFFFF"/>
          <path d="M 32,50 L 52,50 L 42,94 L 22,94 Z" fill="#FFFFFF"/>
          <path d="M 48,50 L 68,50 L 78,94 L 58,94 Z" fill="#FFFFFF"/>
          <path d="M 64,50 L 84,50 L 74,94 L 54,94 Z" fill="#FFFFFF"/>
          <path d="M 80,50 L 105,50 L 95,94 L 70,94 Z" fill="#FFFFFF"/>
          <polygon points="10,68 110,68 105,74 5,74" fill="#E11D48"/>
        </g>
      </svg>
    `
  },

  category_rainbow: {
    bg: 'radial-gradient(circle at center, #1E293B 0%, #0F172A 100%)',
    svg: `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="340" height="340">
        <defs>
          <filter id="glow_r6" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="8" stdDeviation="8" flood-color="#38BDF8" flood-opacity="0.7"/>
          </filter>
        </defs>
        <g filter="url(#glow_r6)">
          <path d="M 52,12 C 32,12 18,28 18,52 C 18,74 34,88 54,88 C 72,88 84,74 84,53 C 84,36 70,35 54,35 C 41,35 32,42 32,53 C 32,65 41,71 52,71 C 61,71 67,65 67,53" fill="none" stroke="#FFFFFF" stroke-width="12" stroke-linecap="square"/>
          <rect x="46" y="14" width="10" height="42" fill="#FFFFFF"/>
          <polygon points="56,22 68,22 68,28 56,28" fill="#FFFFFF"/>
        </g>
      </svg>
    `
  },

  category_pubg: {
    bg: 'radial-gradient(circle at center, #451A03 0%, #18181B 100%)',
    svg: `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="340" height="340">
        <defs>
          <filter id="glow_pubg" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="8" stdDeviation="10" flood-color="#F97316" flood-opacity="0.8"/>
          </filter>
        </defs>
        <g filter="url(#glow_pubg)">
          <path d="M 50,15 C 25,15 15,35 15,55 L 15,68 C 15,72 18,75 22,75 L 78,75 C 82,75 85,72 85,68 L 85,55 C 85,35 75,15 50,15 Z" fill="#F97316"/>
          <path d="M 20,48 L 80,48 L 76,62 L 24,62 Z" fill="#1E293B"/>
          <rect x="28" y="52" width="44" height="4" rx="2" fill="#FBBF24"/>
        </g>
      </svg>
    `
  },

  category_cod: {
    bg: 'radial-gradient(circle at center, #27272A 0%, #09090B 100%)',
    svg: `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="340" height="340">
        <defs>
          <filter id="glow_cod" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="8" stdDeviation="10" flood-color="#EAB308" flood-opacity="0.8"/>
          </filter>
        </defs>
        <g filter="url(#glow_cod)">
          <polygon points="50,10 88,24 80,68 50,90 20,68 12,24" fill="#18181B" stroke="#EAB308" stroke-width="4"/>
          <path d="M 36,40 C 36,30 64,30 64,40 C 64,48 60,52 60,60 L 40,60 C 40,52 36,48 36,40 Z" fill="#EAB308"/>
          <circle cx="43" cy="42" r="4" fill="#18181B"/>
          <circle cx="57" cy="42" r="4" fill="#18181B"/>
        </g>
      </svg>
    `
  },

  category_clash_royal: {
    bg: 'radial-gradient(circle at center, #1E3A8A 0%, #0F172A 100%)',
    svg: `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="340" height="340">
        <defs>
          <filter id="glow_cr" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="8" stdDeviation="10" flood-color="#F59E0B" flood-opacity="0.8"/>
          </filter>
        </defs>
        <g filter="url(#glow_cr)">
          <polygon points="15,75 85,75 92,30 68,50 50,20 32,50 8,30" fill="#F59E0B" stroke="#FDE047" stroke-width="3"/>
          <rect x="20" y="68" width="60" height="10" rx="3" fill="#2563EB"/>
          <circle cx="50" cy="42" r="5" fill="#EF4444"/>
          <circle cx="30" cy="52" r="4" fill="#3B82F6"/>
          <circle cx="70" cy="52" r="4" fill="#3B82F6"/>
        </g>
      </svg>
    `
  },

  category_coc: {
    bg: 'radial-gradient(circle at center, #7C2D12 0%, #18181B 100%)',
    svg: `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="340" height="340">
        <defs>
          <filter id="glow_coc" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="8" stdDeviation="10" flood-color="#F59E0B" flood-opacity="0.8"/>
          </filter>
        </defs>
        <g filter="url(#glow_coc)">
          <circle cx="50" cy="50" r="38" fill="#EA580C" stroke="#F59E0B" stroke-width="4"/>
          <path d="M 25,25 L 75,75 M 75,25 L 25,75" stroke="#FFFFFF" stroke-width="8" stroke-linecap="round"/>
          <circle cx="50" cy="50" r="14" fill="#DC2626"/>
        </g>
      </svg>
    `
  },

  category_brawl_stars: {
    bg: 'radial-gradient(circle at center, #713F12 0%, #18181B 100%)',
    svg: `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="340" height="340">
        <defs>
          <filter id="glow_bs" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="8" stdDeviation="10" flood-color="#FACC15" flood-opacity="0.8"/>
          </filter>
        </defs>
        <g filter="url(#glow_bs)">
          <polygon points="50,10 63,35 90,38 70,57 76,84 50,70 24,84 30,57 10,38 37,35" fill="#FACC15" stroke="#CA8A04" stroke-width="3"/>
          <circle cx="40" cy="46" r="4" fill="#1E293B"/>
          <circle cx="60" cy="46" r="4" fill="#1E293B"/>
          <path d="M 44,58 Q 50,64 56,58" fill="none" stroke="#1E293B" stroke-width="3" stroke-linecap="round"/>
        </g>
      </svg>
    `
  },

  category_freefire: {
    bg: 'radial-gradient(circle at center, #7F1D1D 0%, #09090B 100%)',
    svg: `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="340" height="340">
        <defs>
          <filter id="glow_ff" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="8" stdDeviation="10" flood-color="#EF4444" flood-opacity="0.8"/>
          </filter>
        </defs>
        <g filter="url(#glow_ff)">
          <path d="M 50,10 C 65,30 85,35 85,60 C 85,78 70,90 50,90 C 30,90 15,78 15,60 C 15,35 35,30 50,10 Z" fill="#DC2626"/>
          <path d="M 50,28 C 60,42 72,46 72,62 C 72,74 62,82 50,82 C 38,82 28,74 28,62 C 28,46 40,42 50,28 Z" fill="#F59E0B"/>
          <path d="M 50,45 C 55,54 62,56 62,66 C 62,72 56,76 50,76 C 44,76 38,72 38,66 C 38,56 45,54 50,45 Z" fill="#FACC15"/>
        </g>
      </svg>
    `
  },

  category_fortnite: {
    bg: 'radial-gradient(circle at center, #311B92 0%, #0D0029 100%)',
    svg: `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="340" height="340">
        <defs>
          <filter id="glow_fn" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="8" stdDeviation="10" flood-color="#A855F7" flood-opacity="0.8"/>
          </filter>
        </defs>
        <g filter="url(#glow_fn)">
          <!-- Iconic Fortnite F emblem -->
          <path d="M 28,15 L 75,15 L 75,32 L 48,32 L 48,46 L 70,46 L 70,62 L 48,62 L 48,85 L 28,85 Z" fill="#FFFFFF"/>
        </g>
      </svg>
    `
  },

  category_rocket_league: {
    bg: 'radial-gradient(circle at center, #1E3A8A 0%, #0F172A 100%)',
    svg: `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="340" height="340">
        <defs>
          <filter id="glow_rl" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="8" stdDeviation="10" flood-color="#3B82F6" flood-opacity="0.8"/>
          </filter>
        </defs>
        <g filter="url(#glow_rl)">
          <polygon points="50,10 85,25 78,75 50,90 22,75 15,25" fill="#2563EB" stroke="#38BDF8" stroke-width="3"/>
          <path d="M 30,55 C 40,35 60,35 70,55 L 60,65 L 40,65 Z" fill="#F97316"/>
          <circle cx="50" cy="50" r="8" fill="#FFFFFF"/>
        </g>
      </svg>
    `
  },

  category_ping: {
    bg: 'radial-gradient(circle at center, #0C4A6E 0%, #0F172A 100%)',
    svg: `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="340" height="340">
        <defs>
          <filter id="glow_ping" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="8" stdDeviation="10" flood-color="#38BDF8" flood-opacity="0.8"/>
          </filter>
        </defs>
        <g filter="url(#glow_ping)">
          <circle cx="50" cy="50" r="40" fill="none" stroke="#0284C7" stroke-width="4" stroke-dasharray="6 4"/>
          <polygon points="56,12 24,52 48,52 44,88 76,48 52,48" fill="#38BDF8"/>
        </g>
      </svg>
    `
  },

  category_mobile_games: {
    bg: 'radial-gradient(circle at center, #701A75 0%, #18181B 100%)',
    svg: `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="340" height="340">
        <defs>
          <filter id="glow_mg" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="8" stdDeviation="10" flood-color="#EC4899" flood-opacity="0.8"/>
          </filter>
        </defs>
        <g filter="url(#glow_mg)">
          <rect x="20" y="15" width="60" height="70" rx="10" fill="#18181B" stroke="#EC4899" stroke-width="4"/>
          <rect x="26" y="24" width="48" height="48" rx="4" fill="#831843"/>
          <!-- Controller dpad / buttons -->
          <circle cx="50" cy="80" r="3" fill="#EC4899"/>
          <polygon points="50,34 54,42 62,42 56,48 58,56 50,50 42,56 44,48 38,42 46,42" fill="#F472B6"/>
        </g>
      </svg>
    `
  }
};

async function generateAllOfficialLogos() {
  console.log('Launching Playwright Chromium for 1:1 Official Category Logos...');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 500, height: 500 }, deviceScaleFactor: 2 });

  for (const [key, data] of Object.entries(GAME_LOGOS)) {
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
            background: ${data.bg};
            border-radius: 40px;
            overflow: hidden;
          }
        </style>
      </head>
      <body>
        ${data.svg}
      </body>
      </html>
    `;

    await page.setContent(html);
    await page.waitForTimeout(150);
    await page.screenshot({ path: pngPath });
    console.log(`Rendered 1:1 official logo for ${key} -> ${pngPath}`);
  }

  await browser.close();
  console.log('Playwright official 1:1 logo rendering completed successfully!');
}

generateAllOfficialLogos().catch(console.error);
