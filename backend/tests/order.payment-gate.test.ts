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

describe('Order payment gate', () => {
  const app = createApp();
  let dbAvailable = false;
  let sellerToken = '';
  let pharmacyId = '';
  let listingId = '';
  let buyerId = '';
  let orderId = '';

  beforeAll(async () => {
    dbAvailable = await isDatabaseAvailable();
    if (!dbAvailable) return;

    const sellerLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'seller@pharmex.bd', password: 'password123' });
    expect(sellerLogin.status).toBe(200);
    sellerToken = sellerLogin.body.accessToken;

    const pharmacy = await prisma.pharmacy.findUnique({ where: { userId: sellerLogin.body.user.id } });
    expect(pharmacy).toBeTruthy();
    pharmacyId = pharmacy!.id;

    const buyerLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'buyer@pharmex.bd', password: 'password123' });
    buyerId = buyerLogin.body.user.id;

    const listing = await prisma.listing.findFirst({ where: { pharmacyId, status: 'ACTIVE' } });
    expect(listing).toBeTruthy();
    listingId = listing!.id;

    const order = await prisma.order.create({
      data: {
        orderNumber: `ORD-PAY-GATE-${Date.now()}`,
        buyerId,
        sellerId: pharmacyId,
        status: 'CONFIRMED',
        paymentStatus: 'PENDING',
        totalAmount: 1000,
        items: {
          create: {
            listingId,
            medicineName: 'Test Med',
            batchNumber: listing!.batchNumber,
            quantity: 10,
            unitPrice: 100,
            subtotal: 1000,
          },
        },
        statusHistory: { create: { status: 'CONFIRMED', note: 'payment gate test' } },
      },
    });
    orderId = order.id;
  });

  it('blocks seller fulfillment when payment is not PAID', async ({ skip }) => {
    if (!dbAvailable || !orderId) skip();

    const res = await request(app)
      .patch(`/api/v1/orders/${orderId}/status`)
      .set('Authorization', `Bearer ${sellerToken}`)
      .send({ status: 'PACKED' });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('PAYMENT_REQUIRED');
  });

  it('allows seller fulfillment after payment is PAID', async ({ skip }) => {
    if (!dbAvailable || !orderId) skip();

    await prisma.order.update({
      where: { id: orderId },
      data: { paymentStatus: 'PAID' },
    });

    const res = await request(app)
      .patch(`/api/v1/orders/${orderId}/status`)
      .set('Authorization', `Bearer ${sellerToken}`)
      .send({ status: 'PACKED' });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('PACKED');
  });
});
