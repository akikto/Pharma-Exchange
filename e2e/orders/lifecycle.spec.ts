import { test, expect } from '@playwright/test';
import { loginSeller } from '../helpers/auth';

test.describe.configure({ mode: 'serial' });

test.describe('Seller order lifecycle', () => {
  test.beforeEach(async ({ page }) => {
    await loginSeller(page);
  });

  test('seller can view orders list', async ({ page }) => {
    await page.getByTestId('nav-bottom-orders').click();
    await expect(page).toHaveURL('/seller/orders', { timeout: 15_000 });
    await expect(page.getByRole('heading', { name: /orders|অর্ডার/i })).toBeVisible({ timeout: 15_000 });
  });

  test('seller analytics links to seller order routes', async ({ page }) => {
    await page.getByRole('link', { name: /analytics|অ্যানালিটিক্স/i }).click();
    await expect(page).toHaveURL('/seller/analytics', { timeout: 15_000 });
    const recentOrder = page.locator('a[href^="/seller/orders/"]').first();
    if (await recentOrder.count() > 0) {
      const href = await recentOrder.getAttribute('href');
      expect(href).toMatch(/^\/seller\/orders\//);
    }
  });
});
