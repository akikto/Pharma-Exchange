import { test, expect } from '@playwright/test';
import { loginAdmin } from '../helpers/auth';

test.describe('Admin home banners', () => {
  test.beforeEach(async ({ page }) => {
    await loginAdmin(page);
  });

  test('admin can open banner management from navigation', async ({ page }) => {
    await page.locator('aside').getByTestId('nav-admin-banners').click();
    await expect(page).toHaveURL(/\/admin\/banners/, { timeout: 15_000 });
    await expect(page.getByTestId('admin-banners-page')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId('admin-banners-add-button')).toBeVisible();
  });
});
