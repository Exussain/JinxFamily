import { chromium } from 'playwright';

async function verifyStorefront() {
  console.log('Launching Playwright Chromium for Marvel Rivals & Rainbow Six pages...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1.5,
  });
  const page = await context.newPage();

  // 1. Marvel Rivals Category Route
  console.log('Navigating to http://localhost:3002/product-category/marvel-rivals ...');
  await page.goto('http://localhost:3002/product-category/marvel-rivals', { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: '/tmp/verify_marvel_seo.png' });
  console.log('Saved /tmp/verify_marvel_seo.png');

  // 2. Rainbow Six Category Route
  console.log('Navigating to http://localhost:3002/product-category/rainbow-six ...');
  await page.goto('http://localhost:3002/product-category/rainbow-six', { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: '/tmp/verify_rainbow_seo.png' });
  console.log('Saved /tmp/verify_rainbow_seo.png');

  await browser.close();
  console.log('Verification Finished!');
}

verifyStorefront().catch(console.error);
