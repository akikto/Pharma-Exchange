import { type Page, expect } from '@playwright/test';

export const CREDENTIALS = {
  buyer: { email: 'buyer@pharmex.bd', password: 'password123' },
  seller: { email: 'seller@pharmex.bd', password: 'password123' },
  admin: { email: 'admin@pharmex.bd', password: 'password123' },
} as const;

export async function clearAppState(page: Page) {
  await page.goto('/login');
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
    localStorage.setItem('pharmex-locale', 'en');
  });
}

export async function waitForAuthenticatedApp(page: Page) {
  await page.waitForFunction(() => {
    const refresh = localStorage.getItem('pharmex_refresh');
    const auth = localStorage.getItem('pharmex-auth');
    return Boolean(refresh && auth);
  }, { timeout: 15_000 });
  await page.waitForURL((url) => !url.pathname.startsWith('/login'), { timeout: 30_000 });
}

export async function login(page: Page, email: string, password: string) {
  await clearAppState(page);
  await page.goto('/login');
  await page.getByTestId('login-form').waitFor();
  await page.locator('#identifier').fill(email);
  await page.locator('#password').fill(password);
  await page.getByTestId('login-form').locator('button[type="submit"]').click();
  await page.getByTestId('auth-welcome-card').waitFor({ timeout: 20_000 });
  await page.getByTestId('auth-welcome-card').getByRole('button').click();
  await page.waitForURL((url) => !url.pathname.startsWith('/login'), { timeout: 20_000 });
}

export async function loginBuyer(page: Page) {
  await login(page, CREDENTIALS.buyer.email, CREDENTIALS.buyer.password);
  await expect(page).toHaveURL('/');
}

export async function loginSeller(page: Page) {
  await login(page, CREDENTIALS.seller.email, CREDENTIALS.seller.password);
  await expect(page).toHaveURL(/\/seller/);
}

export async function loginAdmin(page: Page) {
  await login(page, CREDENTIALS.admin.email, CREDENTIALS.admin.password);
  await expect(page).toHaveURL(/\/admin/);
}
