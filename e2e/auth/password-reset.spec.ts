import { test, expect } from '@playwright/test';

test.describe('Password reset (OTP)', () => {
  test('forgot password page shows phone OTP flow', async ({ page }) => {
    await page.goto('/forgot-password');
    await expect(page.getByRole('heading', { name: /reset password|পাসওয়ার্ড রিসেট/i })).toBeVisible();
    await expect(page.locator('#phone')).toBeVisible();
    await expect(page.getByRole('button', { name: /send reset code|রিসেট কোড পাঠান/i })).toBeVisible();
  });
});
