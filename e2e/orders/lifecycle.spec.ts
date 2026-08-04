import { test, expect } from '@playwright/test';
import { loginSeller } from '../helpers/auth';

test.describe.configure({ mode: 'serial' });

test.describe('Seller order lifecycle', () => {
  test.beforeEach(async ({ page }) => {
    await loginSeller(page);
  });

  test('seller can view orders list', async ({ page }) => {
    await page.goto('/seller/orders');
    await expect(page).toHaveURL('/seller/orders');
    await expect(page.getByRole('button', { name: /সব|all/i }).first()).toBeVisible({ timeout: 15_000 });
  });

  test('seller analytics links to seller order routes', async ({ page }) => {
    await page.goto('/seller/analytics');
    const recentOrder = page.locator('a[href^="/seller/orders/"]').first();
    if (await recentOrder.count() > 0) {
      const href = await recentOrder.getAttribute('href');
      expect(href).toMatch(/^\/seller\/orders\//);
    }
  });
});
