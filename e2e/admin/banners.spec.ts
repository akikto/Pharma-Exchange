import { test, expect } from '@playwright/test';
import { loginAdmin } from '../helpers/auth';

test.describe('Admin home banners', () => {
  test('admin can open banner management page', async ({ page }) => {
    await loginAdmin(page);
    await page.goto('/admin/banners');
    await expect(page.getByTestId('admin-banners-page')).toBeVisible();
    await expect(page.getByTestId('admin-banners-add-button')).toBeVisible();
  });
});
