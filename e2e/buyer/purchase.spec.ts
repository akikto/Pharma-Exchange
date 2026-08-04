import { test, expect } from '@playwright/test';
import { loginBuyer } from '../helpers/auth';

test.describe.configure({ mode: 'serial' });

test.describe('Buyer purchase flow', () => {
  test.beforeEach(async ({ page }) => {
    await loginBuyer(page);
  });

  test('browse listings, add to cart, view cart', async ({ page }) => {
    const listing = page.locator('[data-testid^="listing-card-"]').first();
    await expect(listing).toBeVisible({ timeout: 20_000 });
    await listing.locator('a').first().click();

    await page.getByRole('button', { name: /কার্টে যোগ|add to cart/i }).click();
    await expect(page.getByText(/কার্টে যোগ হয়েছে|added to cart/i)).toBeVisible({ timeout: 10_000 });

    await page.goto('/cart');
    await expect(page.getByTestId('cart-panel').or(page.getByTestId('cart-empty'))).toBeVisible();
  });

  test('cart hub orders tab accessible', async ({ page }) => {
    await page.goto('/cart?tab=orders');
    await expect(page.getByRole('tab', { name: /অর্ডার|orders/i })).toHaveAttribute('aria-selected', 'true', { timeout: 15_000 });
  });

  test('watchlist nav entry works', async ({ page }) => {
    await page.getByTestId('nav-bottom-watchlist').click();
    await expect(page).toHaveURL('/watchlist');
  });

  test('orders tab accessible from cart hub', async ({ page }) => {
    await page.goto('/cart?tab=orders');
    await expect(page.getByRole('tab', { name: /অর্ডার|orders/i })).toBeVisible({ timeout: 15_000 });
  });
});
