import { test, expect } from '@playwright/test';
import { loginAdmin } from '../helpers/auth';

test.describe('Admin payments reconciliation', () => {
  test.beforeEach(async ({ page }) => {
    await loginAdmin(page);
  });

  test('admin payments reconciliation page loads', async ({ page }) => {
    await page.getByRole('link', { name: /payments|পেমেন্ট/i }).click();
    await expect(page).toHaveURL('/admin/payments', { timeout: 15_000 });
    await expect(page.getByText(/Razorpay payment|Razorpay পেমেন্ট/i)).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId('payment-status-paid').first()).toBeVisible({ timeout: 15_000 });
  });
});
