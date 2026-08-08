import { test, expect } from '@playwright/test';
import { loginBuyer } from '../helpers/auth';
import { openDemoPendingOrder, resetDemoPendingOrder } from '../helpers/orders';

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

  test('shows COD and online payment options when Razorpay is enabled in health config', async ({ page }) => {
    resetDemoPendingOrder();
    await openDemoPendingOrder(page);

    await expect(page.getByTestId('payment-method-selector')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByTestId('payment-method-cod')).toBeVisible();
    await expect(page.getByTestId('payment-method-razorpay')).toBeVisible();
    await expect(page.getByTestId('pay-with-razorpay-button')).toHaveCount(0);
  });
});

test.describe('Payment when Razorpay disabled', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/v1/health', async (route) => {
      await route.fulfill({
        json: {
          status: 'ok',
          payments: { provider: 'RAZORPAY', enabled: false, currency: 'INR' },
        },
      });
    });
    await loginBuyer(page);
  });

  test('buyer can select COD without starting Razorpay checkout', async ({ page }) => {
    resetDemoPendingOrder();

    let createOrderPosts = 0;
    page.on('request', (request) => {
      if (request.method() === 'POST' && request.url().includes('/api/v1/payments/create-order')) {
        createOrderPosts += 1;
      }
    });

    await openDemoPendingOrder(page);

    await expect(page.getByTestId('payment-method-selector')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByTestId('payment-method-cod')).toBeVisible();
    await expect(page.getByTestId('payment-method-razorpay')).toHaveCount(0);
    await expect(page.getByTestId('payment-unavailable-notice')).toHaveCount(0);
    await expect(page.getByTestId('pay-with-razorpay-button')).toHaveCount(0);

    await page.getByTestId('payment-method-cod').click();

    await expect(page.getByTestId('cod-payment-notice')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByTestId('payment-method-selector')).toHaveCount(0);
    await expect(page.getByTestId('pay-with-razorpay-button')).toHaveCount(0);
    expect(createOrderPosts).toBe(0);
  });
});
