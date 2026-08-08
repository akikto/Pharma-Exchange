import { describe, it, expect, beforeAll, vi, afterEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';
import prisma from '../src/config/database';
import * as envModule from '../src/config/env';

async function isDatabaseAvailable() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}

describe('Cash on Delivery (COD)', () => {
  const app = createApp();
  let dbAvailable = false;
  let buyerToken = '';
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
    buyerToken = buyerLogin.body.accessToken;

    const listing = await prisma.listing.findFirst({ where: { pharmacyId, status: 'ACTIVE' } });
    expect(listing).toBeTruthy();
    listingId = listing!.id;

    const order = await prisma.order.create({
      data: {
        orderNumber: `ORD-COD-${Date.now()}`,
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
        statusHistory: { create: { status: 'CONFIRMED', note: 'cod test' } },
      },
    });
    orderId = order.id;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('buyer can select COD as payment method', async ({ skip }) => {
    if (!dbAvailable || !orderId) skip();

    const res = await request(app)
      .patch(`/api/v1/orders/${orderId}/payment-method`)
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({ method: 'COD' });

    expect(res.status).toBe(200);
    expect(res.body.paymentMethod).toBe('COD');
    expect(res.body.paymentStatus).toBe('PENDING');
  });

  it('COD order does not call Razorpay create-order', async ({ skip }) => {
    if (!dbAvailable || !orderId) skip();

    await prisma.order.update({
      where: { id: orderId },
      data: { paymentMethod: 'COD', paymentStatus: 'PENDING', status: 'CONFIRMED' },
    });

    const configuredSpy = vi.spyOn(envModule, 'isRazorpayConfigured').mockReturnValue(true);

    const res = await request(app)
      .post('/api/v1/payments/create-order')
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({ orderId });

    configuredSpy.mockRestore();

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/cash on delivery/i);
  });

  it('COD order is not blocked by Razorpay payment gate when packing', async ({ skip }) => {
    if (!dbAvailable || !orderId) skip();

    await prisma.order.update({
      where: { id: orderId },
      data: { paymentMethod: 'COD', paymentStatus: 'PENDING', status: 'CONFIRMED' },
    });

    const configuredSpy = vi.spyOn(envModule, 'isRazorpayConfigured').mockReturnValue(true);

    const res = await request(app)
      .patch(`/api/v1/orders/${orderId}/status`)
      .set('Authorization', `Bearer ${sellerToken}`)
      .send({ status: 'PACKED' });

    configuredSpy.mockRestore();

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('PACKED');
  });

  it('marks COD order as PAID when delivered', async ({ skip }) => {
    if (!dbAvailable || !orderId) skip();

    await prisma.order.update({
      where: { id: orderId },
      data: { paymentMethod: 'COD', paymentStatus: 'PENDING', status: 'SHIPPED' },
    });

    const res = await request(app)
      .patch(`/api/v1/orders/${orderId}/status`)
      .set('Authorization', `Bearer ${sellerToken}`)
      .send({ status: 'DELIVERED' });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('DELIVERED');
    expect(res.body.paymentStatus).toBe('PAID');
  });

  it('Razorpay orders still require payment before fulfillment when enabled', async ({ skip }) => {
    if (!dbAvailable || !orderId) skip();

    await prisma.order.update({
      where: { id: orderId },
      data: { paymentMethod: 'RAZORPAY', paymentStatus: 'PENDING', status: 'CONFIRMED' },
    });

    const configuredSpy = vi.spyOn(envModule, 'isRazorpayConfigured').mockReturnValue(true);

    const res = await request(app)
      .patch(`/api/v1/orders/${orderId}/status`)
      .set('Authorization', `Bearer ${sellerToken}`)
      .send({ status: 'PACKED' });

    configuredSpy.mockRestore();

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('PAYMENT_REQUIRED');
  });

  it('rejects online payment method when Razorpay is disabled', async ({ skip }) => {
    if (!dbAvailable || !orderId) skip();

    await prisma.order.update({
      where: { id: orderId },
      data: { paymentMethod: null, paymentStatus: 'PENDING', status: 'CONFIRMED' },
    });

    const configuredSpy = vi.spyOn(envModule, 'isRazorpayConfigured').mockReturnValue(false);

    const res = await request(app)
      .patch(`/api/v1/orders/${orderId}/payment-method`)
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({ method: 'RAZORPAY' });

    configuredSpy.mockRestore();

    expect(res.status).toBe(400);
  });
});
