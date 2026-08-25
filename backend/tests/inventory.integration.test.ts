import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';

describe('Seller Inventory API', () => {
  const app = createApp();
  let token = '';
  let listingId = '';

  beforeAll(async () => {
    const login = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'seller@pharmex.bd', password: 'password123' });
    expect(login.status).toBe(200);
    token = login.body.accessToken;

    const inventory = await request(app)
      .get('/api/v1/listings/inventory')
      .set('Authorization', `Bearer ${token}`);
    expect(inventory.status).toBe(200);
    listingId = inventory.body.data[0]?.id;
    expect(listingId).toBeTruthy();
  });

  it('GET /inventory/stats returns counts', async () => {
    const res = await request(app)
      .get('/api/v1/listings/inventory/stats')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      active: expect.any(Number),
      paused: expect.any(Number),
      soldOut: expect.any(Number),
      lowStock: expect.any(Number),
      total: expect.any(Number),
      maxActiveListings: 50,
    });
  });

  it('GET /inventory supports search query', async () => {
    const res = await request(app)
      .get('/api/v1/listings/inventory?q=para')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('POST /:id/restock increases quantity', async () => {
    const before = await request(app)
      .get(`/api/v1/listings/${listingId}`)
      .set('Authorization', `Bearer ${token}`);
    const qtyBefore = before.body.availableQty;

    const res = await request(app)
      .post(`/api/v1/listings/${listingId}/restock`)
      .set('Authorization', `Bearer ${token}`)
      .send({ amount: 50 });

    expect(res.status).toBe(200);
    expect(res.body.availableQty).toBe(qtyBefore + 50);
  });

  it('POST /:id/sold-out marks listing sold out', async () => {
    const res = await request(app)
      .post(`/api/v1/listings/${listingId}/sold-out`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('SOLD_OUT');
    expect(res.body.availableQty).toBe(0);
  });

  it('POST /:id/activate reactivates listing', async () => {
    const res = await request(app)
      .post(`/api/v1/listings/${listingId}/activate`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ACTIVE');
  });

  it('GET /inventory/export returns CSV', async () => {
    const res = await request(app)
      .get('/api/v1/listings/inventory/export')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/text\/csv/);
    expect(res.text).toContain('Medicine,Generic,Company,Batch');
  });
});
