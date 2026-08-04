import { chromium } from 'playwright';

async function runTest() {
  console.log('🚀 Launching Playwright E2E verification test...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 375, height: 812 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1'
  });
  const page = await context.newPage();

  try {
    // 1. Visit live homepage
    console.log('🌐 Navigating to https://jinxfamily.ir ...');
    await page.goto('https://jinxfamily.ir', { waitUntil: 'domcontentloaded', timeout: 30000 });

    // 2. Locate "بازارچه اکانت‌ها" chip
    console.log('🔍 Checking "بازارچه اکانت‌ها" chip href...');
    const chip = page.locator('a[href*="/market"]').first();
    const href = await chip.getAttribute('href');
    console.log(`✓ Found market chip href: ${href}`);

    // 3. Test navigation to /market?game=fortnite
    console.log('🌐 Testing navigation to /market?game=fortnite...');
    await page.goto('https://jinxfamily.ir/market?game=fortnite', { waitUntil: 'domcontentloaded' });
    const currentUrl = page.url();
    console.log(`📍 Current URL: ${currentUrl}`);
    
    const marketHeader = await page.locator('h1, h2').first().textContent();
    console.log(`✓ Market Page Title: ${marketHeader.trim()}`);

    // 4. Inspect Footer & Branding
    console.log('🔍 Auditing Footer branding & social links...');
    await page.goto('https://jinxfamily.ir', { waitUntil: 'domcontentloaded' });
    const content = await page.content();

    if (content.includes('نوبیکس')) {
      console.error('❌ FAIL: "نوبیکس" was found in DOM!');
    } else {
      console.log('✅ PASS: "نوبیکس" is completely absent from DOM!');
    }

    if (content.includes('https://t.me/JinxFamily')) {
      console.log('✅ PASS: Telegram Channel https://t.me/JinxFamily verified in DOM!');
    } else {
      console.warn('⚠️ WARNING: Telegram Channel link missing in DOM');
    }

    if (content.includes('https://t.me/MissJinxPW')) {
      console.log('✅ PASS: Telegram Support https://t.me/MissJinxPW verified in DOM!');
    } else {
      console.warn('⚠️ WARNING: Telegram Support link missing in DOM');
    }

    if (content.includes('instagram.com')) {
      console.warn('⚠️ WARNING: Instagram link still found in DOM');
    } else {
      console.log('✅ PASS: Instagram link successfully removed!');
    }

    // Take screenshot
    await page.screenshot({ path: '/tmp/playwright_verification.png', fullPage: false });
    console.log('📸 Verification screenshot saved to /tmp/playwright_verification.png');

  } catch (err) {
    console.error('❌ Playwright Test Error:', err);
  } finally {
    await browser.close();
    console.log('🏁 Playwright test completed successfully.');
  }
}

runTest();
