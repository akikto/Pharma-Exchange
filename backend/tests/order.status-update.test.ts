import { describe, it, expect, beforeAll, vi } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';
import prisma from '../src/config/database';
import * as envModule from '../src/config/env';
import { notificationService } from '../src/modules/notification';

async function isDatabaseAvailable() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}

describe('Order status update', () => {
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
        orderNumber: `ORD-STATUS-${Date.now()}`,
        buyerId,
        sellerId: pharmacyId,
        status: 'CONFIRMED',
        paymentStatus: 'PAID',
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
        statusHistory: { create: { status: 'CONFIRMED', note: 'status update test' } },
      },
    });
    orderId = order.id;
  });

  it('transitions to PACKED on the first request', async ({ skip }) => {
    if (!dbAvailable || !orderId) skip();

    const res = await request(app)
      .patch(`/api/v1/orders/${orderId}/status`)
      .set('Authorization', `Bearer ${sellerToken}`)
      .send({ status: 'PACKED' });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('PACKED');
  });

  it('is idempotent when the same status is requested again', async ({ skip }) => {
    if (!dbAvailable || !orderId) skip();

    const res = await request(app)
      .patch(`/api/v1/orders/${orderId}/status`)
      .set('Authorization', `Bearer ${sellerToken}`)
      .send({ status: 'PACKED' });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('PACKED');
  });

  it('transitions to DELIVERED on the first request after SHIPPED', async ({ skip }) => {
    if (!dbAvailable || !orderId) skip();

    await prisma.order.update({
      where: { id: orderId },
      data: { status: 'SHIPPED' },
    });

    const res = await request(app)
      .patch(`/api/v1/orders/${orderId}/status`)
      .set('Authorization', `Bearer ${sellerToken}`)
      .send({ status: 'DELIVERED' });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('DELIVERED');
  });

  it('returns 400 for invalid status transitions', async ({ skip }) => {
    if (!dbAvailable || !orderId) skip();

    const invalidOrder = await prisma.order.create({
      data: {
        orderNumber: `ORD-STATUS-INVALID-${Date.now()}`,
        buyerId,
        sellerId: pharmacyId,
        status: 'SHIPPED',
        paymentStatus: 'PAID',
        totalAmount: 1000,
        items: {
          create: {
            listingId,
            medicineName: 'Test Med',
            batchNumber: 'BATCH-3',
            quantity: 10,
            unitPrice: 100,
            subtotal: 1000,
          },
        },
        statusHistory: { create: { status: 'SHIPPED', note: 'invalid transition test' } },
      },
    });

    const res = await request(app)
      .patch(`/api/v1/orders/${invalidOrder.id}/status`)
      .set('Authorization', `Bearer ${sellerToken}`)
      .send({ status: 'CONFIRMED' });

    expect(res.status).toBe(400);
    expect(String(res.body.error ?? res.body.message)).toMatch(/cannot transition/i);
  });

  it('still succeeds when notification creation fails', async ({ skip }) => {
    if (!dbAvailable || !orderId) skip();

    const freshOrder = await prisma.order.create({
      data: {
        orderNumber: `ORD-STATUS-NOTIF-${Date.now()}`,
        buyerId,
        sellerId: pharmacyId,
        status: 'CONFIRMED',
        paymentStatus: 'PAID',
        totalAmount: 1000,
        items: {
          create: {
            listingId,
            medicineName: 'Test Med',
            batchNumber: 'BATCH-1',
            quantity: 10,
            unitPrice: 100,
            subtotal: 1000,
          },
        },
        statusHistory: { create: { status: 'CONFIRMED', note: 'notification failure test' } },
      },
    });

    const createSpy = vi.spyOn(notificationService, 'create').mockRejectedValueOnce(new Error('notification failed'));

    const res = await request(app)
      .patch(`/api/v1/orders/${freshOrder.id}/status`)
      .set('Authorization', `Bearer ${sellerToken}`)
      .send({ status: 'PACKED' });

    createSpy.mockRestore();

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('PACKED');
  });

  it('returns 400 with PAYMENT_REQUIRED when payment is pending and Razorpay is configured', async ({ skip }) => {
    if (!dbAvailable || !orderId) skip();

    const pendingOrder = await prisma.order.create({
      data: {
        orderNumber: `ORD-STATUS-PAY-${Date.now()}`,
        buyerId,
        sellerId: pharmacyId,
        status: 'CONFIRMED',
        paymentStatus: 'PENDING',
        paymentMethod: 'RAZORPAY',
        totalAmount: 1000,
        items: {
          create: {
            listingId,
            medicineName: 'Test Med',
            batchNumber: 'BATCH-2',
            quantity: 10,
            unitPrice: 100,
            subtotal: 1000,
          },
        },
        statusHistory: { create: { status: 'CONFIRMED', note: 'payment gate test' } },
      },
    });

    const configuredSpy = vi.spyOn(envModule, 'isRazorpayConfigured').mockReturnValue(true);

    const res = await request(app)
      .patch(`/api/v1/orders/${pendingOrder.id}/status`)
      .set('Authorization', `Bearer ${sellerToken}`)
      .send({ status: 'PACKED' });

    configuredSpy.mockRestore();

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('PAYMENT_REQUIRED');
  });
});
