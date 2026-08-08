import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';

async function isDatabaseAvailable() {
  try {
    const { default: prisma } = await import('../src/config/database');
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}

describe('Order access API', () => {
  const app = createApp();
  let dbAvailable = false;
  let buyerToken = '';
  let sellerToken = '';
  let otherBuyerToken = '';
  let buyerUserId = '';
  let pharmacyId = '';
  let listingId = '';
  let requestQty = 1;
  let orderId = '';
  let orderNumber = '';

  beforeAll(async () => {
    dbAvailable = await isDatabaseAvailable();
    if (!dbAvailable) return;

    const buyerLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'buyer@pharmex.bd', password: 'password123' });
    expect(buyerLogin.status).toBe(200);
    buyerToken = buyerLogin.body.accessToken;
    buyerUserId = buyerLogin.body.user.id;

    const sellerLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'seller@pharmex.bd', password: 'password123' });
    expect(sellerLogin.status).toBe(200);
    sellerToken = sellerLogin.body.accessToken;

    const otherLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'buyer2@pharmex.bd', password: 'password123' });
    if (otherLogin.status === 200) {
      otherBuyerToken = otherLogin.body.accessToken;
    }

    const sellerPharmacy = await request(app)
      .get('/api/v1/pharmacies/me')
      .set('Authorization', `Bearer ${sellerToken}`);
    expect(sellerPharmacy.status).toBe(200);
    pharmacyId = sellerPharmacy.body.id;

    const listings = await request(app).get(`/api/v1/listings/search?pharmacyId=${pharmacyId}&limit=20`);
    const pick = listings.body.data.find(
      (l: { moq: number; availableQty: number }) => l.moq <= 10 && l.availableQty >= 10,
    ) ?? listings.body.data.find((l: { availableQty: number; moq: number }) => l.availableQty >= l.moq);
    listingId = pick?.id;
    requestQty = pick ? Math.min(Math.max(pick.moq, 1), pick.availableQty) : 1;
    expect(listingId).toBeTruthy();

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
    orderId = accept.body.order.id;
    orderNumber = accept.body.order.orderNumber;
    expect(accept.body.order.buyerId).toBe(buyerUserId);
  });

  it('buyer can GET their own order by UUID', async ({ skip }) => {
    if (!dbAvailable || !orderId) skip();

    const res = await request(app)
      .get(`/api/v1/orders/${orderId}`)
      .set('Authorization', `Bearer ${buyerToken}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(orderId);
    expect(res.body.buyerId).toBe(buyerUserId);
  });

  it('seller can GET the same order by UUID', async ({ skip }) => {
    if (!dbAvailable || !orderId) skip();

    const res = await request(app)
      .get(`/api/v1/orders/${orderId}`)
      .set('Authorization', `Bearer ${sellerToken}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(orderId);
  });

  it('buyer order list includes the order with the same id', async ({ skip }) => {
    if (!dbAvailable || !orderId) skip();

    const res = await request(app)
      .get('/api/v1/orders?role=buyer')
      .set('Authorization', `Bearer ${buyerToken}`);
    expect(res.status).toBe(200);
    const match = res.body.data.find((o: { id: string }) => o.id === orderId);
    expect(match).toBeTruthy();
    expect(match.orderNumber).toBe(orderNumber);
  });

  it('unauthorized user cannot GET another buyer order', async ({ skip }) => {
    if (!dbAvailable || !orderId || !otherBuyerToken) skip();

    const res = await request(app)
      .get(`/api/v1/orders/${orderId}`)
      .set('Authorization', `Bearer ${otherBuyerToken}`);
    expect(res.status).toBe(403);
  });

  it('buyer can GET their own order by orderNumber', async ({ skip }) => {
    if (!dbAvailable || !orderNumber) skip();

    const res = await request(app)
      .get(`/api/v1/orders/${orderNumber}`)
      .set('Authorization', `Bearer ${buyerToken}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(orderId);
    expect(res.body.orderNumber).toBe(orderNumber);
  });

  it('GET by orderNumber returns 404 for unknown number', async ({ skip }) => {
    if (!dbAvailable) skip();

    const res = await request(app)
      .get('/api/v1/orders/ORD-2026-999999')
      .set('Authorization', `Bearer ${buyerToken}`);
    expect(res.status).toBe(404);
  });
});
