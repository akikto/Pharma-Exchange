import { describe, it, expect, beforeAll, vi } from 'vitest';
import request from 'supertest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createApp } from '../src/app';
import prisma from '../src/config/database';
import { signAccessToken } from '../src/shared/middleware/auth.middleware';
import { notificationService } from '../src/modules/notification';
import { chatSystemService } from '../src/modules/chat/chatSystem.service';

async function isDatabaseAvailable() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

describe('Buy request respond API', () => {
  const app = createApp();
  let dbAvailable = false;
  let buyerToken = '';
  let sellerToken = '';
  let pharmacyId = '';
  let listingId = '';
  let requestQty = 1;

  beforeAll(async () => {
    dbAvailable = await isDatabaseAvailable();
    if (!dbAvailable) return;

    const buyer = await prisma.user.findUnique({ where: { email: 'buyer@pharmex.bd' } });
    const seller = await prisma.user.findUnique({ where: { email: 'seller@pharmex.bd' } });
    if (!buyer || !seller) return;

    buyerToken = signAccessToken({ userId: buyer.id, role: buyer.role });
    sellerToken = signAccessToken({ userId: seller.id, role: seller.role });

    const sellerPharmacy = await prisma.pharmacy.findUnique({ where: { userId: seller.id } });
    if (!sellerPharmacy) return;
    pharmacyId = sellerPharmacy.id;

    const listings = await request(app).get(`/api/v1/listings/search?pharmacyId=${pharmacyId}&limit=20`);
    const pick = listings.body.data.find(
      (l: { moq: number; availableQty: number }) => l.moq <= 10 && l.availableQty >= 10,
    ) ?? listings.body.data.find((l: { availableQty: number; moq: number }) => l.availableQty >= l.moq);
    listingId = pick?.id;
    requestQty = pick ? Math.min(Math.max(pick.moq, 1), pick.availableQty) : 1;
    expect(listingId).toBeTruthy();
  });

  it('POST /buy-requests/:id/respond accept creates order', async ({ skip }) => {
    if (!dbAvailable) skip();

    const createBr = await request(app)
      .post('/api/v1/buy-requests')
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({
        sellerId: pharmacyId,
        listingIds: [{ listingId, quantity: requestQty }],
      });
    expect(createBr.status).toBe(201);

    const accept = await request(app)
      .post(`/api/v1/buy-requests/${createBr.body.id}/respond`)
      .set('Authorization', `Bearer ${sellerToken}`)
      .send({ action: 'accept' });
    expect(accept.status).toBe(200);
    expect(accept.body.order?.id).toBeTruthy();
    expect(accept.body.buyRequest?.status).toBe('ACCEPTED');
  });

  it('accept succeeds when notification delivery is slow (regression)', async ({ skip }) => {
    if (!dbAvailable) skip();

    const createBr = await request(app)
      .post('/api/v1/buy-requests')
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({
        sellerId: pharmacyId,
        listingIds: [{ listingId, quantity: requestQty }],
      });
    expect(createBr.status).toBe(201);

    const originalCreate = notificationService.create.bind(notificationService);
    const createSpy = vi.spyOn(notificationService, 'create').mockImplementation(async (data) => {
      await sleep(6000);
      return originalCreate(data);
    });

    const startedAt = Date.now();
    const accept = await request(app)
      .post(`/api/v1/buy-requests/${createBr.body.id}/respond`)
      .set('Authorization', `Bearer ${sellerToken}`)
      .send({ action: 'accept' });
    const elapsedMs = Date.now() - startedAt;

    createSpy.mockRestore();

    expect(accept.status).toBe(200);
    expect(accept.body.order?.id).toBeTruthy();
    expect(elapsedMs).toBeGreaterThan(5000);
    expect(elapsedMs).toBeLessThan(15000);
  }, 20000);

  it('accept succeeds when chat side effects fail after order is created (regression)', async ({ skip }) => {
    if (!dbAvailable) skip();

    const createBr = await request(app)
      .post('/api/v1/buy-requests')
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({
        sellerId: pharmacyId,
        listingIds: [{ listingId, quantity: requestQty }],
      });
    expect(createBr.status).toBe(201);

    const chatSpy = vi.spyOn(chatSystemService, 'ensureOrderConversation')
      .mockRejectedValue(new Error('chat unavailable'));

    const accept = await request(app)
      .post(`/api/v1/buy-requests/${createBr.body.id}/respond`)
      .set('Authorization', `Bearer ${sellerToken}`)
      .send({ action: 'accept' });

    chatSpy.mockRestore();

    expect(accept.status).toBe(200);
    expect(accept.body.order?.id).toBeTruthy();
    expect(accept.body.buyRequest?.status).toBe('ACCEPTED');

    const persisted = await prisma.buyRequest.findUnique({
      where: { id: createBr.body.id },
      include: { order: true },
    });
    expect(persisted?.status).toBe('ACCEPTED');
    expect(persisted?.order?.id).toBe(accept.body.order.id);
  });

  it('keeps order.create outside the stock reservation transaction (regression)', () => {
    const source = readFileSync(
      join(process.cwd(), 'src/modules/buy-request/buyRequest.service.ts'),
      'utf8',
    );
    expect(source).not.toMatch(/tx\.order\.create/);
    expect(source).toMatch(/await prisma\.order\.create\(/);
  });
});
