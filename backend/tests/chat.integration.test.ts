import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';

describe('Chat API', () => {
  const app = createApp();
  let buyerToken = '';
  let sellerToken = '';
  let sellerUserId = '';
  let pharmacyId = '';
  let listingId = '';
  let listingMoq = 1;
  let conversationId = '';
  let buyRequestId = '';
  let orderId = '';

  beforeAll(async () => {
    const buyerLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'buyer@pharmex.bd', password: 'password123' });
    expect(buyerLogin.status).toBe(200);
    buyerToken = buyerLogin.body.accessToken;

    const sellerLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'seller@pharmex.bd', password: 'password123' });
    expect(sellerLogin.status).toBe(200);
    sellerToken = sellerLogin.body.accessToken;
    sellerUserId = sellerLogin.body.user.id;

    const sellerPharmacy = await request(app)
      .get('/api/v1/pharmacies/me')
      .set('Authorization', `Bearer ${sellerToken}`);
    expect(sellerPharmacy.status).toBe(200);
    pharmacyId = sellerPharmacy.body.id;

    const listings = await request(app).get(`/api/v1/listings/search?pharmacyId=${pharmacyId}&limit=20`);
    const pick = listings.body.data.find((l: { moq: number }) => l.moq <= 10) ?? listings.body.data[0];
    listingId = pick?.id;
    listingMoq = pick?.moq ?? 1;
    expect(listingId).toBeTruthy();
    expect(pharmacyId).toBeTruthy();
  });

  it('POST /chat/conversations creates thread and GET lists it', async () => {
    const create = await request(app)
      .post('/api/v1/chat/conversations')
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({ participantId: sellerUserId, listingId });
    expect(create.status).toBe(201);
    conversationId = create.body.id;
    expect(conversationId).toBeTruthy();

    const list = await request(app)
      .get('/api/v1/chat/conversations')
      .set('Authorization', `Bearer ${buyerToken}`);
    expect(list.status).toBe(200);
    expect(list.body.some((c: { id: string }) => c.id === conversationId)).toBe(true);
  });

  it('GET /chat/conversations/:id returns counterparty and context', async () => {
    const detail = await request(app)
      .get(`/api/v1/chat/conversations/${conversationId}`)
      .set('Authorization', `Bearer ${buyerToken}`);
    expect(detail.status).toBe(200);
    expect(detail.body.counterparty?.id).toBe(sellerUserId);
    expect(detail.body.members.length).toBe(2);
  });

  it('POST message and GET messages', async () => {
    const send = await request(app)
      .post(`/api/v1/chat/conversations/${conversationId}/messages`)
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({ content: 'Hello from integration test' });
    expect(send.status).toBe(201);

    const messages = await request(app)
      .get(`/api/v1/chat/conversations/${conversationId}/messages`)
      .set('Authorization', `Bearer ${buyerToken}`);
    expect(messages.status).toBe(200);
    expect(messages.body.data.some((m: { content: string }) => m.content.includes('integration test'))).toBe(true);
  });

  it('GET /chat/context-options returns orders and buy requests', async () => {
    const res = await request(app)
      .get('/api/v1/chat/context-options')
      .set('Authorization', `Bearer ${buyerToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.orders)).toBe(true);
    expect(Array.isArray(res.body.buyRequests)).toBe(true);
  });

  it('buy request flow posts SYSTEM message on seller reject', async () => {
    const createBr = await request(app)
      .post('/api/v1/buy-requests')
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({
        sellerId: pharmacyId,
        listingIds: [{ listingId, quantity: Math.max(listingMoq, 10) }],
        note: 'Chat integration test',
      });
    expect(createBr.status).toBe(201);
    buyRequestId = createBr.body.id;

    const conv = await request(app)
      .post('/api/v1/chat/conversations')
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({ participantId: sellerUserId, buyRequestId });
    expect(conv.status).toBe(201);

    const reject = await request(app)
      .post(`/api/v1/buy-requests/${buyRequestId}/respond`)
      .set('Authorization', `Bearer ${sellerToken}`)
      .send({ action: 'reject', sellerNote: 'Out of stock' });
    expect(reject.status).toBe(200);

    const filtered = await request(app)
      .get(`/api/v1/chat/conversations?buyRequestId=${buyRequestId}`)
      .set('Authorization', `Bearer ${buyerToken}`);
    expect(filtered.status).toBe(200);
    expect(filtered.body.length).toBeGreaterThan(0);

    const messages = await request(app)
      .get(`/api/v1/chat/conversations/${conv.body.id}/messages`)
      .set('Authorization', `Bearer ${buyerToken}`);
    expect(messages.status).toBe(200);
    expect(messages.body.data.some((m: { type: string }) => m.type === 'SYSTEM')).toBe(true);
  });

  it('order status update posts SYSTEM message', async () => {
    const createBr = await request(app)
      .post('/api/v1/buy-requests')
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({
        sellerId: pharmacyId,
        listingIds: [{ listingId, quantity: Math.max(listingMoq, 10) }],
      });
    expect(createBr.status).toBe(201);

    const accept = await request(app)
      .post(`/api/v1/buy-requests/${createBr.body.id}/respond`)
      .set('Authorization', `Bearer ${sellerToken}`)
      .send({ action: 'accept' });
    expect(accept.status).toBe(200);
    orderId = accept.body.order.id;

    const convList = await request(app)
      .get(`/api/v1/chat/conversations?orderId=${orderId}`)
      .set('Authorization', `Bearer ${buyerToken}`);
    expect(convList.status).toBe(200);
    const orderConvId = convList.body[0]?.id;
    expect(orderConvId).toBeTruthy();

    const pack = await request(app)
      .patch(`/api/v1/orders/${orderId}/status`)
      .set('Authorization', `Bearer ${sellerToken}`)
      .send({ status: 'PACKED' });
    expect(pack.status).toBe(200);

    const messages = await request(app)
      .get(`/api/v1/chat/conversations/${orderConvId}/messages`)
      .set('Authorization', `Bearer ${buyerToken}`);
    expect(messages.status).toBe(200);
    expect(messages.body.data.some((m: { type: string; content: string }) =>
      m.type === 'SYSTEM' && m.content.toLowerCase().includes('packed'),
    )).toBe(true);
  });
});
