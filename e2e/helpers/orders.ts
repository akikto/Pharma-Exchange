import { execSync } from 'node:child_process';
import { expect, type Page } from '@playwright/test';

export const DEMO_PENDING_ORDER_ID = '00000000-0000-0000-0003-000000000001';
export const DEMO_PENDING_ORDER_NUMBER = /ORD-2026-000001/;

/** Reset seeded demo order to a clean pending state for payment E2E. */
export function resetDemoPendingOrder() {
  execSync('npx tsx e2e/scripts/reset-demo-pending-order.ts', {
    cwd: process.cwd(),
    stdio: 'pipe',
    env: process.env,
  });
}

export async function openDemoPendingOrder(page: Page) {
  const orderPath = `/orders/${DEMO_PENDING_ORDER_ID}`;
  // Client-side navigation keeps the in-memory access token after login.
  await page.evaluate((path) => {
    window.history.pushState(null, '', path);
    window.dispatchEvent(new PopStateEvent('popstate'));
  }, orderPath);
  await page.waitForURL(new RegExp(orderPath.replace(/\//g, '\\/')), { timeout: 15_000 });
  await expect(page.getByText(DEMO_PENDING_ORDER_NUMBER)).toBeVisible({ timeout: 15_000 });
}
