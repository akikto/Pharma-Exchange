import { test, expect } from '@playwright/test';
import { loginBuyer, loginSeller, loginAdmin, CREDENTIALS, clearAppState } from '../helpers/auth';

test.describe('Authentication', () => {
  test('buyer login lands on home', async ({ page }) => {
    await loginBuyer(page);
    await expect(page.getByTestId('bottom-nav')).toBeVisible();
  });

  test('seller login lands on seller dashboard', async ({ page }) => {
    await loginSeller(page);
    await expect(page.getByTestId('seller-auth-pill')).toBeVisible();
  });

  test('admin login lands on admin dashboard', async ({ page }) => {
    await loginAdmin(page);
    await expect(page.getByRole('heading', { name: 'Admin Dashboard' })).toBeVisible();
  });

  test('invalid credentials show error', async ({ page }) => {
    await clearAppState(page);
    await page.goto('/login');
    await page.locator('#identifier').fill(CREDENTIALS.buyer.email);
    await page.locator('#password').fill('wrong-password-xyz');
    await page.getByTestId('login-form').locator('button[type="submit"]').click();
    await expect(page.getByTestId('login-form').locator('.text-danger')).toBeVisible({ timeout: 10_000 });
  });

  test('OTP login page loads', async ({ page }) => {
    await page.goto('/otp');
    await expect(page.getByText('OTP Login')).toBeVisible();
    await expect(page.getByPlaceholder('+8801XXXXXXXXX')).toBeVisible();
  });
});
