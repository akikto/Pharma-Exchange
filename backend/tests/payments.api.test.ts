import crypto from 'crypto';
import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';
import request from 'supertest';
import bcrypt from 'bcryptjs';

// Mock only the network-hitting Razorpay operations. Signature helpers keep
// their real crypto implementation so signing tests still exercise them.
const ordersCreate = vi.fn();
const paymentsRefund = vi.fn();
const paymentsFetch = vi.fn();

vi.mock('../src/shared/services/razorpay.service', async () => {
  const actual = await vi.importActual<typeof import('../src/shared/services/razorpay.service')>(
    '../src/shared/services/razorpay.service',
  );
  return {
    ...actual,
    createOrder: (input: Parameters<typeof actual.createOrder>[0]) => ordersCreate(input),
    createRefund: (input: Parameters<typeof actual.createRefund>[0]) => paymentsRefund(input),
    fetchPayment: (id: string) => paymentsFetch(id),
  };
});

import { createApp } from '../src/app';
import prisma from '../src/config/database';
import { signAccessToken } from '../src/shared/middleware/auth.middleware';

/** Unique-per-invocation id helper — prevents collisions with persisted DB
 *  rows from earlier test runs (there is no test DB reset). */
let counter = 0;
function uid(prefix: string) {
  counter += 1;
  return `${prefix}_${Date.now()}_${counter}_${Math.random().toString(36).slice(2, 8)}`;
}

function signCheckout(orderId: string, paymentId: string) {
  return crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');
}

function signWebhook(body: string) {
  return crypto
    .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET!)
    .update(body)
    .digest('hex');
}

describe('Payments API (BL-02 · Razorpay)', () => {
  const app = createApp();

  let buyerId: string;
  let sellerUserId: string;
  let pharmacyId: string;
  let buyerToken: string;
  let sellerToken: string;
  let listingId: string;

  beforeAll(async () => {
    const buyer = await prisma.user.create({
      data: {
        email: `pay-buyer-${Date.now()}@example.com`,
        passwordHash: await bcrypt.hash('password123', 4),
        firstName: 'Pay', lastName: 'Buyer',
        role: 'USER', authProvider: 'email',
      },
    });
    buyerId = buyer.id;
    buyerToken = signAccessToken({ userId: buyer.id, role: buyer.role });

    const sellerUser = await prisma.user.create({
      data: {
        email: `pay-seller-${Date.now()}@example.com`,
        passwordHash: await bcrypt.hash('password123', 4),
        firstName: 'Pay', lastName: 'Seller',
        role: 'USER', authProvider: 'email',
      },
    });
    sellerUserId = sellerUser.id;
    sellerToken = signAccessToken({ userId: sellerUser.id, role: sellerUser.role });

    const pharmacy = await prisma.pharmacy.create({
      data: {
        userId: sellerUserId,
        name: `Pay Pharmacy ${Date.now()}`,
        licenseNumber: `LIC-${Date.now()}`,
        address: '123 Test', city: 'Dhaka', district: 'Dhaka',
        verificationStatus: 'APPROVED',
      },
    });
    pharmacyId = pharmacy.id;

    const medicine = await prisma.medicine.create({
      data: {
        name: `Med-${Date.now()}`,
        genericName: 'test', company: 'Test Pharma',
        dosageForm: 'TABLET', strength: '500mg',
        packSize: '10x10', category: 'Generic',
      },
    });
    const listing = await prisma.listing.create({
      data: {
        medicineId: medicine.id, pharmacyId,
        batchNumber: `BATCH-${Date.now()}`,
        mfgDate: new Date(),
        expiryDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        sellingPrice: 90, purchasePrice: 80, finalPrice: 90,
        availableQty: 100, status: 'ACTIVE',
      },
    });
    listingId = listing.id;
  });

  beforeEach(() => {
    ordersCreate.mockReset();
    paymentsRefund.mockReset();
    paymentsFetch.mockReset();
  });

  async function makeOrder(overrides: { paymentStatus?: 'PENDING' | 'PAID' } = {}) {
    const orderNumber = `BR-${String(Math.floor(Math.random() * 1e6)).padStart(6, '0')}-${counter++}`;
    return prisma.order.create({
      data: {
        orderNumber,
        buyerId, sellerId: pharmacyId,
        totalAmount: 500,
        status: 'CREATED',
        paymentStatus: overrides.paymentStatus ?? 'PENDING',
        items: {
          create: [{
            listingId, medicineName: 'Test Medicine', batchNumber: 'BATCH-1',
            quantity: 5, unitPrice: 100, subtotal: 500,
          }],
        },
        statusHistory: { create: { status: 'CREATED', note: 'Test order' } },
      },
    });
  }

  it('POST /payments/create-order → creates a Razorpay order and stores a Payment row', async () => {
    const order = await makeOrder();
    const rzpOrderId = uid('order_rzp');
    ordersCreate.mockResolvedValueOnce({
      id: rzpOrderId, amount: 50000, currency: 'INR', receipt: 'r', status: 'created',
    });

    const res = await request(app)
      .post('/api/v1/payments/create-order')
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({ orderId: order.id });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      keyId: process.env.RAZORPAY_KEY_ID,
      providerOrderId: rzpOrderId,
      amount: 50000, currency: 'INR', orderId: order.id,
    });
    expect(ordersCreate).toHaveBeenCalledWith(expect.objectContaining({
      amount: 50000, currency: 'INR', receipt: expect.any(String),
    }));
    const stored = await prisma.payment.findUnique({ where: { providerOrderId: rzpOrderId } });
    expect(stored?.status).toBe('CREATED');
    expect(stored?.userId).toBe(buyerId);
  });

  it('POST /payments/create-order → is idempotent for outstanding CREATED payments', async () => {
    const order = await makeOrder();
    const rzpOrderId = uid('order_idem');
    ordersCreate.mockResolvedValueOnce({
      id: rzpOrderId, amount: 50000, currency: 'INR', receipt: 'r', status: 'created',
    });

    const first = await request(app)
      .post('/api/v1/payments/create-order')
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({ orderId: order.id });
    expect(first.status).toBe(201);

    const second = await request(app)
      .post('/api/v1/payments/create-order')
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({ orderId: order.id });
    expect(second.status).toBe(201);
    expect(second.body.providerOrderId).toBe(rzpOrderId);
    expect(ordersCreate).toHaveBeenCalledTimes(1);
  });

  it('POST /payments/create-order → rejects a non-owner', async () => {
    const order = await makeOrder();
    const res = await request(app)
      .post('/api/v1/payments/create-order')
      .set('Authorization', `Bearer ${sellerToken}`)
      .send({ orderId: order.id });
    expect(res.status).toBe(403);
  });

  it('POST /payments/verify → verifies signature, marks CAPTURED and Order PAID+CONFIRMED', async () => {
    const order = await makeOrder();
    const rzpOrderId = uid('order_verify');
    ordersCreate.mockResolvedValueOnce({
      id: rzpOrderId, amount: 50000, currency: 'INR', receipt: 'r', status: 'created',
    });
    await request(app)
      .post('/api/v1/payments/create-order')
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({ orderId: order.id })
      .expect(201);

    const paymentId = uid('pay_verify');
    const signature = signCheckout(rzpOrderId, paymentId);

    const res = await request(app)
      .post('/api/v1/payments/verify')
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({ razorpay_order_id: rzpOrderId, razorpay_payment_id: paymentId, razorpay_signature: signature });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('CAPTURED');
    expect(res.body.providerPaymentId).toBe(paymentId);
    expect(res.body.order.paymentStatus).toBe('PAID');
    expect(res.body.order.status).toBe('CONFIRMED');

    const replay = await request(app)
      .post('/api/v1/payments/verify')
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({ razorpay_order_id: rzpOrderId, razorpay_payment_id: paymentId, razorpay_signature: signature });
    expect(replay.status).toBe(200);
    expect(replay.body.status).toBe('CAPTURED');
  });

  it('POST /payments/verify → rejects tampered signatures and marks payment FAILED', async () => {
    const order = await makeOrder();
    const rzpOrderId = uid('order_bad');
    ordersCreate.mockResolvedValueOnce({
      id: rzpOrderId, amount: 50000, currency: 'INR', receipt: 'r', status: 'created',
    });
    await request(app)
      .post('/api/v1/payments/create-order')
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({ orderId: order.id })
      .expect(201);

    const res = await request(app)
      .post('/api/v1/payments/verify')
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({
        razorpay_order_id: rzpOrderId,
        razorpay_payment_id: uid('pay_hack'),
        razorpay_signature: 'not-the-right-hmac',
      });

    expect(res.status).toBe(400);
    const stored = await prisma.payment.findUnique({ where: { providerOrderId: rzpOrderId } });
    expect(stored?.status).toBe('FAILED');
    expect(stored?.errorCode).toBe('SIGNATURE_MISMATCH');
  });

  it('POST /payments/webhook → dedupes on eventId and processes payment.captured', async () => {
    const order = await makeOrder();
    const rzpOrderId = uid('order_wh');
    ordersCreate.mockResolvedValueOnce({
      id: rzpOrderId, amount: 50000, currency: 'INR', receipt: 'r', status: 'created',
    });
    await request(app)
      .post('/api/v1/payments/create-order')
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({ orderId: order.id })
      .expect(201);

    const paymentId = uid('pay_wh');
    const eventId = uid('evt_wh');
    const event = {
      event: 'payment.captured',
      payload: {
        payment: {
          entity: {
            id: paymentId, order_id: rzpOrderId, amount: 50000, status: 'captured', method: 'upi',
          },
        },
      },
    };
    const rawBody = JSON.stringify(event);
    const sig = signWebhook(rawBody);

    const first = await request(app)
      .post('/api/v1/payments/webhook')
      .set('content-type', 'application/json')
      .set('x-razorpay-signature', sig)
      .set('x-razorpay-event-id', eventId)
      .send(rawBody);
    expect(first.status).toBe(200);
    expect(first.body.received).toBe(true);

    // Duplicate delivery — same event id.
    const second = await request(app)
      .post('/api/v1/payments/webhook')
      .set('content-type', 'application/json')
      .set('x-razorpay-signature', sig)
      .set('x-razorpay-event-id', eventId)
      .send(rawBody);
    expect(second.status).toBe(200);
    expect(second.body.duplicate).toBe(true);

    const payment = await prisma.payment.findUnique({ where: { providerOrderId: rzpOrderId } });
    expect(payment?.status).toBe('CAPTURED');
    const updatedOrder = await prisma.order.findUnique({ where: { id: order.id } });
    expect(updatedOrder?.paymentStatus).toBe('PAID');
    expect(updatedOrder?.status).toBe('CONFIRMED');
  });

  it('POST /payments/webhook → rejects an invalid signature', async () => {
    const rawBody = JSON.stringify({ event: 'payment.captured', payload: {} });
    const res = await request(app)
      .post('/api/v1/payments/webhook')
      .set('content-type', 'application/json')
      .set('x-razorpay-signature', 'garbage')
      .set('x-razorpay-event-id', uid('evt_bad'))
      .send(rawBody);
    expect(res.status).toBe(401);
  });

  it('POST /payments/webhook → processes refund.processed to move order to REFUNDED', async () => {
    const order = await makeOrder();
    const rzpOrderId = uid('order_wh_rf');
    ordersCreate.mockResolvedValueOnce({
      id: rzpOrderId, amount: 50000, currency: 'INR', receipt: 'r', status: 'created',
    });
    await request(app)
      .post('/api/v1/payments/create-order')
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({ orderId: order.id })
      .expect(201);

    const paymentId = uid('pay_wh_rf');
    const captureEvent = {
      event: 'payment.captured',
      payload: { payment: { entity: {
        id: paymentId, order_id: rzpOrderId, amount: 50000, status: 'captured',
      } } },
    };
    const captureBody = JSON.stringify(captureEvent);
    await request(app)
      .post('/api/v1/payments/webhook')
      .set('content-type', 'application/json')
      .set('x-razorpay-signature', signWebhook(captureBody))
      .set('x-razorpay-event-id', uid('evt_cap'))
      .send(captureBody)
      .expect(200);

    const refundEvent = {
      event: 'refund.processed',
      payload: { refund: { entity: {
        id: uid('rfnd_wh'), payment_id: paymentId, amount: 50000, status: 'processed',
      } } },
    };
    const refundBody = JSON.stringify(refundEvent);
    await request(app)
      .post('/api/v1/payments/webhook')
      .set('content-type', 'application/json')
      .set('x-razorpay-signature', signWebhook(refundBody))
      .set('x-razorpay-event-id', uid('evt_rf'))
      .send(refundBody)
      .expect(200);

    const updated = await prisma.order.findUnique({ where: { id: order.id } });
    expect(updated?.paymentStatus).toBe('REFUNDED');
  });

  it('POST /payments/:id/refund → creates a refund via Razorpay and flips full-refund to REFUNDED', async () => {
    const order = await makeOrder();
    const rzpOrderId = uid('order_rf');
    ordersCreate.mockResolvedValueOnce({
      id: rzpOrderId, amount: 50000, currency: 'INR', receipt: 'r', status: 'created',
    });
    await request(app)
      .post('/api/v1/payments/create-order')
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({ orderId: order.id })
      .expect(201);

    const paymentId = uid('pay_rf');
    await request(app)
      .post('/api/v1/payments/verify')
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({
        razorpay_order_id: rzpOrderId,
        razorpay_payment_id: paymentId,
        razorpay_signature: signCheckout(rzpOrderId, paymentId),
      })
      .expect(200);

    const refundId = uid('rfnd_created');
    paymentsRefund.mockResolvedValueOnce({ id: refundId, amount: 50000, status: 'processed' });

    const res = await request(app)
      .post(`/api/v1/payments/${order.id}/refund`)
      .set('Authorization', `Bearer ${sellerToken}`)
      .send({ reason: 'Out of stock' });

    expect(res.status).toBe(201);
    expect(res.body.providerRefundId).toBe(refundId);
    expect(paymentsRefund).toHaveBeenCalledWith(expect.objectContaining({
      paymentId, amount: 50000,
    }));

    const updated = await prisma.order.findUnique({ where: { id: order.id } });
    expect(updated?.paymentStatus).toBe('REFUNDED');
  });

  it('POST /payments/:id/refund → rejects refund on unpaid orders', async () => {
    const order = await makeOrder({ paymentStatus: 'PENDING' });
    const res = await request(app)
      .post(`/api/v1/payments/${order.id}/refund`)
      .set('Authorization', `Bearer ${sellerToken}`)
      .send({});
    expect(res.status).toBe(400);
  });

  it('POST /payments/:id/cancel → cancels an outstanding CREATED payment', async () => {
    const order = await makeOrder();
    ordersCreate.mockResolvedValueOnce({
      id: uid('order_cancel'), amount: 50000, currency: 'INR', receipt: 'r', status: 'created',
    });
    await request(app)
      .post('/api/v1/payments/create-order')
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({ orderId: order.id })
      .expect(201);

    const res = await request(app)
      .post(`/api/v1/payments/${order.id}/cancel`)
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({});
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('CANCELLED');
  });
});
