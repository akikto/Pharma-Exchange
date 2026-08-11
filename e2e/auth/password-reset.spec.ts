import { test, expect } from '@playwright/test';

test.describe('Password reset (email)', () => {
  test('forgot password page shows email reset flow', async ({ page }) => {
    await page.goto('/forgot-password');
    await expect(page.getByRole('heading', { name: /reset password|পাসওয়ার্ড রিসেট/i })).toBeVisible();
    await expect(page.locator('#email')).toBeVisible();
    await expect(page.getByRole('button', { name: /send reset email|রিসেট ইমেইল/i })).toBeVisible();
  });

  test('reset password page shows form with token', async ({ page }) => {
    await page.goto(`/reset-password?token=${'a'.repeat(64)}`);
    await expect(page.getByTestId('reset-password-form')).toBeVisible();
  });

  test('reset password page without token prompts for new link', async ({ page }) => {
    await page.goto('/reset-password');
    await expect(page.getByText(/invalid or missing|অবৈধ বা নেই/i)).toBeVisible();
  });
});
