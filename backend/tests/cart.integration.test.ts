import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';
import prisma from '../src/config/database';

async function isDatabaseAvailable() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}

describe('Cart API', () => {
  const app = createApp();
  let dbAvailable = false;
  let token = '';
  let listingId = '';
  let listingMoq = 10;
  let cartItemId = '';

  beforeAll(async () => {
    dbAvailable = await isDatabaseAvailable();
    if (!dbAvailable) return;

    const login = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'buyer@pharmex.bd', password: 'password123' });
    expect(login.status).toBe(200);
    token = login.body.accessToken;

    const listings = await request(app).get('/api/v1/listings/search?limit=20');
    expect(listings.status).toBe(200);
    // Prefer listings with MOQ > 1 so below-MOQ tests are deterministic
    const pick = listings.body.data.find((l: { moq: number }) => l.moq > 1)
      ?? listings.body.data[0];
    listingId = pick?.id;
    listingMoq = pick?.moq ?? 10;
    expect(listingId).toBeTruthy();
    expect(listingMoq).toBeGreaterThan(1);
  });

  it('POST /api/v1/cart adds item and GET returns grouped cart with validationIssues', async ({ skip }) => {
    if (!dbAvailable || !token) skip();
    const addQty = Math.max(listingMoq, 10);
    const add = await request(app)
      .post('/api/v1/cart')
      .set('Authorization', `Bearer ${token}`)
      .send({ listingId, quantity: addQty });

    expect(add.status).toBe(201);
    cartItemId = add.body.id;

    const cart = await request(app)
      .get('/api/v1/cart')
      .set('Authorization', `Bearer ${token}`);

    expect(cart.status).toBe(200);
    expect(cart.body.items.length).toBeGreaterThan(0);
    expect(cart.body.groupedBySeller).toBeDefined();
    expect(Array.isArray(cart.body.validationIssues)).toBe(true);
    expect(cart.body.validationIssues).toHaveLength(0);
    const first = cart.body.items[0];
    expect(first.listing.pharmacy.userId).toBeDefined();
  });

  it('POST /api/v1/cart rejects quantity below MOQ', async ({ skip }) => {
    if (!dbAvailable || !token) skip();
    const res = await request(app)
      .post('/api/v1/cart')
      .set('Authorization', `Bearer ${token}`)
      .send({ listingId, quantity: listingMoq - 1 });

    expect(res.status).toBe(400);
    expect(res.body.details?.code ?? res.body.code).toBe('MOQ_VIOLATION');
  });

  it('PATCH /api/v1/cart/:id updates quantity with MOQ validation', async ({ skip }) => {
    if (!dbAvailable || !token || !cartItemId) skip();
    const res = await request(app)
      .patch(`/api/v1/cart/${cartItemId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ quantity: Math.max(listingMoq, 10) + 5 });

    expect(res.status).toBe(200);
    expect(res.body.quantity).toBe(Math.max(listingMoq, 10) + 5);
  });

  it('rejects quantity below MOQ on PATCH', async ({ skip }) => {
    if (!dbAvailable || !token || !cartItemId) skip();
    const belowMoq = listingMoq - 1;
    expect(belowMoq).toBeGreaterThan(0);
    expect(belowMoq).toBeLessThan(listingMoq);

    const res = await request(app)
      .patch(`/api/v1/cart/${cartItemId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ quantity: belowMoq });

    expect(res.status).toBe(400);
    expect(res.body.details?.code ?? res.body.code).toBe('MOQ_VIOLATION');
  });

  it('rejects quantity above available stock', async ({ skip }) => {
    if (!dbAvailable || !token || !cartItemId) skip();
    const cart = await request(app)
      .get('/api/v1/cart')
      .set('Authorization', `Bearer ${token}`);
    const item = cart.body.items.find((i: { id: string }) => i.id === cartItemId);
    const maxQty = item?.listing?.availableQty ?? 100;

    const res = await request(app)
      .patch(`/api/v1/cart/${cartItemId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ quantity: maxQty + 1 });

    expect(res.status).toBe(400);
    expect(res.body.details?.code ?? res.body.code).toBe('INSUFFICIENT_STOCK');
  });

  it('DELETE /api/v1/cart/:id removes item', async ({ skip }) => {
    if (!dbAvailable || !token || !cartItemId) skip();
    const res = await request(app)
      .delete(`/api/v1/cart/${cartItemId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
  });
});
