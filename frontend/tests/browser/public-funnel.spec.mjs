import { expect, test } from '@playwright/test';

test('mobile menu renders its lightweight drawer only after interaction', async ({ page }) => {
  await page.goto('/');
  const menu = page.getByRole('button', { name: 'باز کردن منو' });
  await expect(page.locator('.nav-drawer')).toHaveCount(0);
  await menu.click();
  await expect(page.locator('.nav-drawer')).toBeVisible();
  await expect(page.locator('.nav-drawer img')).toHaveCount(0);
});

test('live search uses compact card mode', async ({ page }) => {
  let compactRequest = false;
  page.on('request', (request) => {
    const url = new URL(request.url());
    if (url.pathname === '/api/products' && url.searchParams.get('view') === 'card') compactRequest = true;
  });
  await page.goto('/products');
  await page.getByRole('button', { name: 'جستجو' }).click();
  await page.getByRole('textbox', { name: 'جستجوی محصول' }).fill('فورتنایت');
  await page.waitForTimeout(500);
  expect(compactRequest).toBeTruthy();
});

test('support client is not mounted until the trigger is tapped', async ({ page }) => {
  await page.goto('/faq');
  await expect(page.locator('.live-chat-wrapper')).toHaveCount(0);
  await page.getByRole('button', { name: 'چت با پشتیبانی' }).click();
  await expect(page.locator('.live-chat-wrapper')).toBeVisible();
});

test('reduced motion and canonical origin are respected', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/products');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://jinxfamily.ir/products');
  await expect(page.locator('canvas[aria-hidden="true"]')).toHaveCount(0);
});

test('cart survives a reload and is reconciled on checkout entry', async ({ page }) => {
  let validated = false;
  await page.route('**/api/cart/validate', async (route) => {
    validated = true;
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        valid: true, total: 42, changed_count: 1,
        items: [{ product_id: 1, variant_id: null, quantity: 1, available: true, unit_price: 42, price_changed: true }],
      }),
    });
  });
  await page.addInitScript(() => localStorage.setItem('jinx_cart_v1', JSON.stringify([{
    product_id: 1, quantity: 1, price: 1, name: 'محصول تست', slug: 'test-product',
  }])));
  await page.goto('/checkout');
  await expect.poll(() => validated).toBeTruthy();
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('jinx_cart_v1') || '[]')[0]?.price)).toBe(42);
});
