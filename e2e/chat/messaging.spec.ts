import { test, expect } from '@playwright/test';
import { loginBuyer, CREDENTIALS } from '../helpers/auth';

const API = 'http://localhost:3000/api/v1';

async function apiLogin(
  request: { post: (url: string, options?: object) => Promise<{ json: () => Promise<unknown>; ok: () => boolean }> },
  email: string,
  password: string,
) {
  const res = await request.post(`${API}/auth/login`, { data: { email, password } });
  expect(res.ok()).toBeTruthy();
  const body = (await res.json()) as { accessToken: string };
  return body.accessToken;
}

async function openConversation(page: import('@playwright/test').Page, conversationId: string) {
  await page.getByTestId('nav-bottom-chat').click();
  await expect(page).toHaveURL('/chat', { timeout: 15_000 });
  await page.locator(`a[href="/chat/${conversationId}"]`).click();
  await expect(page.getByTestId('chat-thread')).toBeVisible({ timeout: 20_000 });
}

test.describe('Real-time chat', () => {
  test('buyer sends a message and sees it without reload', async ({ page }) => {
    const buyerToken = await apiLogin(page.request, CREDENTIALS.buyer.email, CREDENTIALS.buyer.password);
    const sellerToken = await apiLogin(page.request, CREDENTIALS.seller.email, CREDENTIALS.seller.password);

    const sellerProfile = (await (
      await page.request.get(`${API}/auth/me`, {
        headers: { Authorization: `Bearer ${sellerToken}` },
      })
    ).json()) as { id: string };

    const listings = (await (await page.request.get(`${API}/listings/search?limit=1`)).json()) as {
      data: { id: string }[];
    };
    expect(listings.data.length).toBeGreaterThan(0);

    const conversation = (await (
      await page.request.post(`${API}/chat/conversations`, {
        headers: { Authorization: `Bearer ${buyerToken}` },
        data: { participantId: sellerProfile.id, listingId: listings.data[0]!.id },
      })
    ).json()) as { id: string };

    await loginBuyer(page);
    await openConversation(page, conversation.id);

    const uniqueMessage = `E2E chat ${Date.now()}`;
    await page.getByPlaceholder(/type a message|বার্তা/i).fill(uniqueMessage);
    await page.getByRole('button', { name: /send|পাঠান/i }).click();

    await expect(page.getByText(uniqueMessage)).toBeVisible({ timeout: 10_000 });
    await expect(page).toHaveURL(`/chat/${conversation.id}`);
  });
});
