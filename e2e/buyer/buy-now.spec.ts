import { test, expect } from '@playwright/test';
import { loginBuyer } from '../helpers/auth';

test.describe('Buy Now sellerId', () => {
  test('buy request uses pharmacy id as sellerId', async ({ page }) => {
    await loginBuyer(page);

    let capturedSellerId = '';
    await page.route('**/api/v1/buy-requests', async (route) => {
      if (route.request().method() === 'POST') {
        const body = route.request().postDataJSON() as { sellerId?: string };
        capturedSellerId = body.sellerId ?? '';
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({ id: 'br-e2e-test' }),
        });
        return;
      }
      await route.continue();
    });

    const listingCard = page.locator('[data-testid^="listing-card-"]').first();
    await expect(listingCard).toBeVisible({ timeout: 20_000 });
    const listingId = (await listingCard.getAttribute('data-testid'))!.replace('listing-card-', '');

    const listingRes = await page.request.get(`http://localhost:3000/api/v1/listings/${listingId}`);
    expect(listingRes.ok()).toBeTruthy();
    const listing = await listingRes.json();
    const pharmacyId = listing.pharmacy.id as string;

    await listingCard.locator('a').first().click();
    await expect(page).toHaveURL(`/medicine/${listingId}`, { timeout: 15_000 });

    await page.getByRole('link', { name: /compare|তুলনা/i }).click();
    await expect(page.getByTestId('comparison-page')).toBeVisible({ timeout: 20_000 });

    await page
      .getByTestId(`compare-row-${listingId}`)
      .getByRole('button', { name: /buy now|এখনই কিনুন/i })
      .click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 10_000 });
    await dialog.getByRole('button', { name: /send request|অনুরোধ পাঠান/i }).click();

    await expect.poll(() => capturedSellerId, { timeout: 15_000 }).toBe(pharmacyId);
    if (listing.pharmacy.userId) {
      expect(capturedSellerId).not.toBe(listing.pharmacy.userId);
    }
  });
});
