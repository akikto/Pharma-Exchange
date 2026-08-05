import { test, expect } from '@playwright/test';
import { loginBuyer } from '../helpers/auth';

const ORDERS_TAB = /অর্ডার|orders/i;

test.describe('Payment hardening', () => {
  test.beforeEach(async ({ page }) => {
    await loginBuyer(page);
  });

  test('buyer orders tab exposes payment status chips', async ({ page }) => {
    await page.getByTestId('nav-bottom-cart').click();
    await page.getByRole('tab', { name: ORDERS_TAB }).click();
    await expect(page.getByRole('tab', { name: ORDERS_TAB })).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByTestId('payment-status-pending').first()).toBeVisible({ timeout: 15_000 });
  });
});

test.describe('Payment checkout (mocked Razorpay)', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/v1/health', async (route) => {
      const response = await route.fetch();
      const json = await response.json();
      await route.fulfill({
        response,
        json: { ...json, payments: { provider: 'RAZORPAY', enabled: true, currency: 'INR' } },
      });
    });
    await page.addInitScript(() => {
      (window as unknown as { Razorpay?: new (opts: { handler: (r: unknown) => void }) => { open: () => void } }).Razorpay = class {
        handler: (r: unknown) => void;
        constructor(opts: { handler: (r: unknown) => void }) {
          this.handler = opts.handler;
        }
        open() {
          this.handler({
            razorpay_order_id: 'order_mock',
            razorpay_payment_id: 'pay_mock',
            razorpay_signature: 'mock_sig',
          });
        }
      };
    });
    await loginBuyer(page);
  });

  test('shows payment unavailable when provider disabled in health config', async ({ page }) => {
    await page.route('**/api/v1/health', async (route) => {
      await route.fulfill({
        json: {
          status: 'ok',
          payments: { provider: 'RAZORPAY', enabled: false, currency: 'INR' },
        },
      });
    });
    await page.getByTestId('nav-bottom-cart').click();
    await page.getByRole('tab', { name: ORDERS_TAB }).click();
    await page.getByRole('link', { name: /ORD-2026-000001/ }).click();
    await expect(page.getByTestId('payment-unavailable-notice')).toBeVisible({ timeout: 10_000 });
  });
});
