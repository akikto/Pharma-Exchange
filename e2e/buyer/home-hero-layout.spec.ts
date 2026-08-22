import { test, expect } from '@playwright/test';
import { loginBuyer } from '../helpers/auth';

const mockBanner = {
  id: 'banner-layout-test',
  title: 'Promo',
  subtitle: 'Test',
  mediaUrl: 'https://placehold.co/800x400/png',
  mediaType: 'IMAGE',
  mediaAlt: 'Promo',
  ctaText: 'Go',
  actionType: 'NONE',
  actionTarget: null,
};

test.describe('Home hero layout', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/v1/banners', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: [mockBanner] }),
      });
    });
    await loginBuyer(page);
    await page.goto('/');
    await expect(page.getByTestId('home-banner-carousel')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId('shop-header')).toBeVisible();
  });

  test('promo banner and shop card share horizontal alignment and gap', async ({ page }) => {
    const metrics = await page.evaluate(() => {
      const banner = document.querySelector('[data-testid="home-banner-carousel"]');
      const shop = document.querySelector('[data-testid="shop-header"]');
      if (!banner || !shop) return null;
      const b = banner.getBoundingClientRect();
      const s = shop.getBoundingClientRect();
      return {
        bannerLeft: b.left,
        bannerRight: b.right,
        bannerWidth: b.width,
        shopLeft: s.left,
        shopRight: s.right,
        shopWidth: s.width,
        verticalGap: s.top - b.bottom,
      };
    });

    expect(metrics).not.toBeNull();
    expect(metrics!.bannerWidth).toBeCloseTo(metrics!.shopWidth, 0);
    expect(metrics!.bannerLeft).toBeCloseTo(metrics!.shopLeft, 0);
    expect(metrics!.bannerRight).toBeCloseTo(metrics!.shopRight, 0);
    expect(metrics!.verticalGap).toBeGreaterThanOrEqual(8);
    expect(metrics!.verticalGap).toBeLessThanOrEqual(14);
  });
});
