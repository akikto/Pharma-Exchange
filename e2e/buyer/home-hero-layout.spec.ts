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
    await page.route('**/api/v1/banners**', async (route) => {
      if (route.request().method() !== 'GET') {
        await route.continue();
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: [mockBanner] }),
      });
    });
    await loginBuyer(page);
    await page.evaluate(() => {
      localStorage.setItem('pharmex-bulk-banner-dismissed', '1');
    });
    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('home-banner-carousel')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId('shop-header')).toBeVisible();
  });

  test('promo banner and shop card share horizontal alignment and gap', async ({ page }) => {
    const metrics = await page.evaluate(() => {
      const stack = document.querySelector('[data-testid="home-hero-stack"]');
      const banner = document.querySelector('[data-testid="home-banner-carousel"]');
      const shop = document.querySelector('[data-testid="shop-header"]');
      if (!stack || !banner || !shop) return null;
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
        stackWidth: stack.getBoundingClientRect().width,
      };
    });

    expect(metrics).not.toBeNull();
    const m = metrics!;
    expect(Math.abs(m.bannerWidth - m.shopWidth)).toBeLessThanOrEqual(2);
    expect(Math.abs(m.bannerLeft - m.shopLeft)).toBeLessThanOrEqual(2);
    expect(Math.abs(m.bannerRight - m.shopRight)).toBeLessThanOrEqual(2);
    expect(m.bannerWidth).toBeLessThanOrEqual(m.stackWidth + 1);
    expect(m.verticalGap).toBeGreaterThanOrEqual(6);
    expect(m.verticalGap).toBeLessThanOrEqual(16);
  });
});
