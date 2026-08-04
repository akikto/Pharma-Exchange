import { test, expect } from '@playwright/test';
import { loginSeller } from '../helpers/auth';

test.describe.configure({ mode: 'serial' });

test.describe('Seller inventory flow', () => {
  test.beforeEach(async ({ page }) => {
    await loginSeller(page);
  });

  test('inventory page shows listings with inline edit fields', async ({ page }) => {
    await page.goto('/seller/inventory');
    await expect(page).toHaveURL(/\/seller\/inventory/);
    await expect(page.getByTestId('inventory-search')).toBeVisible({ timeout: 15_000 });

    const row = page.locator('[data-testid^="inventory-row-"]').first();
    await expect(row).toBeVisible({ timeout: 15_000 });

    const listingId = await row.getAttribute('data-testid');
    const id = listingId?.replace('inventory-row-', '') ?? '';
    await expect(page.getByTestId(`inventory-inline-${id}`)).toBeVisible();
  });

  test('seller orders page stays in seller area', async ({ page }) => {
    await page.goto('/seller');
    await page.getByTestId('nav-bottom-orders').click();
    await expect(page).toHaveURL('/seller/orders');
    await expect(page).not.toHaveURL(/\/cart/);
  });

  test('seller requests page loads', async ({ page }) => {
    await page.goto('/seller/requests');
    await expect(page).toHaveURL('/seller/requests', { timeout: 15_000 });
  });
});
