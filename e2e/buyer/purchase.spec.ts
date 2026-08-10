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
    await expect(page).toHaveURL(/\/medicine\//, { timeout: 15_000 });

    // Detail page defaults quantity to 1. Minus clamps quantity up to MOQ when below it.
    const actionBar = page.getByTestId('product-action-bar');
    await expect(actionBar).toBeVisible({ timeout: 15_000 });
    const moqLine = page.getByText(/MOQ \d+|ন্যূনতম অর্ডার \d+/);
    await expect(moqLine).toBeVisible();
    const moq = Number((await moqLine.textContent())?.match(/(\d+)/)?.[1]);
    const quantity = actionBar.locator('span.tabular-nums');
    await expect(quantity).toHaveText('1');
    await actionBar.getByLabel(/decrease quantity|পরিমাণ কমান/i).click();
    await expect(quantity).toHaveText(String(moq));

    await actionBar.getByRole('button', { name: /কার্টে যোগ|add to cart/i }).click();
    await page.getByTestId('nav-bottom-cart').click();
    await expect(page).toHaveURL('/cart', { timeout: 15_000 });
    await expect(page.getByTestId('cart-panel')).toBeVisible({ timeout: 15_000 });
  });

  test('cart hub orders tab accessible', async ({ page }) => {
    await page.getByTestId('nav-bottom-cart').click();
    await page.getByRole('tab', { name: /অর্ডার|orders/i }).click();
    await expect(page.getByRole('tab', { name: /অর্ডার|orders/i })).toHaveAttribute('aria-selected', 'true', { timeout: 15_000 });
  });

  test('watchlist nav entry works', async ({ page }) => {
    await page.getByTestId('nav-bottom-watchlist').click();
    await expect(page).toHaveURL('/watchlist');
  });

  test('orders tab accessible from cart hub', async ({ page }) => {
    await page.getByTestId('nav-bottom-cart').click();
    await expect(page.getByRole('tab', { name: /অর্ডার|orders/i })).toBeVisible({ timeout: 15_000 });
  });
});
