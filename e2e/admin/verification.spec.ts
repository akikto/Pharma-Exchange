import { test, expect } from '@playwright/test';
import { loginAdmin } from '../helpers/auth';

test.describe.configure({ mode: 'serial' });

test.describe('Admin verification flow', () => {
  test.beforeEach(async ({ page }) => {
    await loginAdmin(page);
  });

  test('admin dashboard shows metrics', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Admin Dashboard' })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText('Pending Verifications')).toBeVisible();
  });

  test('verification queue page loads', async ({ page }) => {
    await page.getByRole('link', { name: /verification queue/i }).click();
    await expect(page).toHaveURL('/admin/verifications', { timeout: 15_000 });
  });

  test('admin reports page loads', async ({ page }) => {
    await page.goto('/admin/reports');
    await expect(page).toHaveURL('/admin/reports', { timeout: 15_000 });
  });
});
