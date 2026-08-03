import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';

describe('Cart API', () => {
  const app = createApp();
  let token = '';
  let listingId = '';
  let cartItemId = '';

  beforeAll(async () => {
    const login = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'buyer@pharmex.bd', password: 'password123' });
    expect(login.status).toBe(200);
    token = login.body.accessToken;

    const listings = await request(app).get('/api/v1/listings/search?limit=1');
    listingId = listings.body.data[0]?.id;
    expect(listingId).toBeTruthy();
  });

  it('POST /api/v1/cart adds item and GET returns grouped cart with seller userId', async () => {
    const add = await request(app)
      .post('/api/v1/cart')
      .set('Authorization', `Bearer ${token}`)
      .send({ listingId, quantity: 10 });

    expect(add.status).toBe(201);
    cartItemId = add.body.id;

    const cart = await request(app)
      .get('/api/v1/cart')
      .set('Authorization', `Bearer ${token}`);

    expect(cart.status).toBe(200);
    expect(cart.body.items.length).toBeGreaterThan(0);
    expect(cart.body.groupedBySeller).toBeDefined();
    const first = cart.body.items[0];
    expect(first.listing.pharmacy.userId).toBeDefined();
  });

  it('PATCH /api/v1/cart/:id updates quantity with MOQ validation', async () => {
    const res = await request(app)
      .patch(`/api/v1/cart/${cartItemId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ quantity: 15 });

    expect(res.status).toBe(200);
    expect(res.body.quantity).toBe(15);
  });

  it('rejects quantity below MOQ', async () => {
    const res = await request(app)
      .patch(`/api/v1/cart/${cartItemId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ quantity: 1 });

    expect(res.status).toBe(400);
  });

  it('DELETE /api/v1/cart/:id removes item', async () => {
    const res = await request(app)
      .delete(`/api/v1/cart/${cartItemId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
  });
});
