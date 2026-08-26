import { test, expect } from '@playwright/test';
import { loginAdmin } from '../helpers/auth';

test.describe('Admin medicine import/export', () => {
  test.beforeEach(async ({ page }) => {
    await loginAdmin(page);
  });

  test('admin can open import/export from medicine management', async ({ page }) => {
    await page.goto('/admin/medicines');
    await expect(page.getByTestId('admin-medicines-page')).toBeVisible({ timeout: 15_000 });
    await page.getByTestId('admin-medicines-import-export-button').click();
    await expect(page.getByTestId('medicine-import-export-dialog')).toBeVisible();
    await expect(page.getByTestId('medicine-download-template')).toBeVisible();
    await expect(page.getByTestId('medicine-export-xlsx')).toBeVisible();
  });
});
