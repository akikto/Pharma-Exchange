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
    await expect(page).toHaveURL(/\/admin\/verifications/, { timeout: 15_000 });
    await expect(page.getByTestId('admin-verifications-page')).toBeVisible();
    await expect(page.getByTestId('admin-sellers-table')).toBeVisible();
  });

  test('admin bottom nav Home returns to dashboard from sellers', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/admin/sellers');
    await expect(page.getByTestId('admin-sellers-page')).toBeVisible({ timeout: 15_000 });
    await page.getByTestId('nav-admin-bottom-adminHome').click();
    await expect(page).toHaveURL(/\/admin\/?$/, { timeout: 15_000 });
    await expect(page.getByRole('heading', { name: 'Admin Dashboard' })).toBeVisible();
  });

  test('admin reports page loads', async ({ page }) => {
    await page.getByRole('link', { name: /reports/i }).click();
    await expect(page).toHaveURL('/admin/reports', { timeout: 15_000 });
  });
});
