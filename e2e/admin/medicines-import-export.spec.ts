import { test, expect } from '@playwright/test';
import { loginAdmin } from '../helpers/auth';

test.describe('Admin medicine import/export', () => {
  test.beforeEach(async ({ page }) => {
    await loginAdmin(page);
  });

  test('admin can open import/export from medicine management', async ({ page }) => {
    await page.goto('/admin/medicines');
    await expect(page.getByTestId('admin-medicines-page')).toBeVisible({ timeout: 20_000 });
    const importExport = page.getByTestId('admin-medicines-import-export-button');
    await expect(importExport).toBeVisible({ timeout: 20_000 });
    await importExport.click();
    await expect(page.getByRole('heading', { name: /medicine import \/ export/i })).toBeVisible({
      timeout: 10_000,
    });
  });
});
