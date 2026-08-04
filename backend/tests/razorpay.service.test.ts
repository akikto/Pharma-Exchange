import crypto from 'crypto';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const ordersCreate = vi.fn();
const paymentsRefund = vi.fn();
const paymentsFetch = vi.fn();

// Mock the razorpay SDK before importing anything that uses it.
vi.mock('razorpay', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      orders: { create: ordersCreate },
      payments: { refund: paymentsRefund, fetch: paymentsFetch },
    })),
  };
});

import {
  __resetRazorpayClient,
  createOrder,
  createRefund,
  fetchPayment,
  verifyCheckoutSignature,
  verifyWebhookSignature,
  RazorpayError,
} from '../src/shared/services/razorpay.service';

describe('razorpay service', () => {
  beforeEach(() => {
    __resetRazorpayClient();
    ordersCreate.mockReset();
    paymentsRefund.mockReset();
    paymentsFetch.mockReset();
  });

  afterEach(() => {
    __resetRazorpayClient();
  });

  describe('createOrder', () => {
    it('creates an order with amount, currency, receipt and notes', async () => {
      ordersCreate.mockResolvedValueOnce({
        id: 'order_ABC123',
        amount: 50000,
        currency: 'INR',
        receipt: 'BR-2026-000001-abc',
        status: 'created',
      });

      const result = await createOrder({
        amount: 50000,
        currency: 'INR',
        receipt: 'BR-2026-000001-abc',
        notes: { orderId: 'internal-1' },
      });

      expect(result).toEqual({
        id: 'order_ABC123',
        amount: 50000,
        currency: 'INR',
        receipt: 'BR-2026-000001-abc',
        status: 'created',
      });
      expect(ordersCreate).toHaveBeenCalledWith({
        amount: 50000,
        currency: 'INR',
        receipt: 'BR-2026-000001-abc',
        notes: { orderId: 'internal-1' },
        payment_capture: true,
      });
    });

    it('wraps SDK errors as RazorpayError with mapped status/code', async () => {
      ordersCreate.mockRejectedValueOnce({
        statusCode: 400,
        error: { code: 'BAD_REQUEST_ERROR', description: 'currency not supported' },
      });

      await expect(
        createOrder({ amount: 1, currency: 'XYZ', receipt: 'r' }),
      ).rejects.toBeInstanceOf(RazorpayError);
    });
  });

  describe('verifyCheckoutSignature', () => {
    it('accepts a valid signature and rejects a tampered one', () => {
      const orderId = 'order_ABC123';
      const paymentId = 'pay_XYZ789';
      const good = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
        .update(`${orderId}|${paymentId}`)
        .digest('hex');

      expect(verifyCheckoutSignature({
        razorpayOrderId: orderId,
        razorpayPaymentId: paymentId,
        razorpaySignature: good,
      })).toBe(true);

      expect(verifyCheckoutSignature({
        razorpayOrderId: orderId,
        razorpayPaymentId: paymentId,
        razorpaySignature: 'a'.repeat(good.length),
      })).toBe(false);
    });

    it('is timing-safe against length differences', () => {
      expect(verifyCheckoutSignature({
        razorpayOrderId: 'o', razorpayPaymentId: 'p', razorpaySignature: 'short',
      })).toBe(false);
    });
  });

  describe('verifyWebhookSignature', () => {
    it('validates the HMAC of the raw body against the webhook secret', () => {
      const body = JSON.stringify({ event: 'payment.captured' });
      const good = crypto
        .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET!)
        .update(body)
        .digest('hex');
      expect(verifyWebhookSignature(body, good)).toBe(true);
      expect(verifyWebhookSignature(Buffer.from(body), good)).toBe(true);
      expect(verifyWebhookSignature(body, `0${good.slice(1)}`)).toBe(false);
    });
  });

  describe('createRefund', () => {
    it('POSTs to /payments/:id/refund with amount and notes', async () => {
      paymentsRefund.mockResolvedValueOnce({ id: 'rfnd_1', amount: 25000, status: 'processed' });

      const res = await createRefund({
        paymentId: 'pay_1',
        amount: 25000,
        notes: { orderId: 'o1', reason: 'partial' },
      });

      expect(res).toEqual({ id: 'rfnd_1', amount: 25000, status: 'processed' });
      expect(paymentsRefund).toHaveBeenCalledWith('pay_1', {
        amount: 25000,
        notes: { orderId: 'o1', reason: 'partial' },
      });
    });

    it('supports full refund (amount omitted)', async () => {
      paymentsRefund.mockResolvedValueOnce({ id: 'rfnd_2', amount: 50000, status: 'pending' });
      const res = await createRefund({ paymentId: 'pay_2' });
      expect(res.status).toBe('pending');
      expect(paymentsRefund).toHaveBeenCalledWith('pay_2', {});
    });

    it('propagates SDK errors as RazorpayError', async () => {
      paymentsRefund.mockRejectedValueOnce({
        statusCode: 400,
        error: { code: 'BAD_REQUEST_ERROR', description: 'The refund amount is greater' },
      });
      await expect(createRefund({ paymentId: 'pay_1', amount: 999999 }))
        .rejects.toBeInstanceOf(RazorpayError);
    });
  });

  describe('fetchPayment', () => {
    it('returns a normalised payment shape', async () => {
      paymentsFetch.mockResolvedValueOnce({
        id: 'pay_1', status: 'captured', amount: 50000, order_id: 'order_1', method: 'card',
      });
      const res = await fetchPayment('pay_1');
      expect(res).toEqual({ id: 'pay_1', status: 'captured', amount: 50000, order_id: 'order_1', method: 'card' });
    });
  });
});
