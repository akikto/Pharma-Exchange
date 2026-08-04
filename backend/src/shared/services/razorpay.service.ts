/**
 * Razorpay REST client wrapper (BL-02).
 *
 * All Razorpay traffic is routed through this file so the SDK can be mocked
 * once during tests and so key/secret material never leaks into higher
 * layers. This module intentionally has no business logic — it only knows
 * how to talk to Razorpay.
 *
 * See docs/BL-02-RAZORPAY.md for the operator setup checklist.
 */
import crypto from 'crypto';
import Razorpay from 'razorpay';
import { env, isRazorpayConfigured } from '../../config/env';
import { logger } from '../utils/logger';

export class RazorpayConfigError extends Error {
  code = 'PAYMENT_PROVIDER_UNCONFIGURED';
  constructor() {
    super('Razorpay is not configured');
    this.name = 'RazorpayConfigError';
  }
}

export class RazorpayError extends Error {
  constructor(
    public status: number,
    public providerCode: string,
    public providerDescription: string,
  ) {
    super(providerDescription || `Razorpay error (${status})`);
    this.name = 'RazorpayError';
  }
}

let cachedClient: Razorpay | undefined;

function client(): Razorpay {
  if (!isRazorpayConfigured()) throw new RazorpayConfigError();
  if (!cachedClient) {
    cachedClient = new Razorpay({
      key_id: env.RAZORPAY_KEY_ID!,
      key_secret: env.RAZORPAY_KEY_SECRET!,
    });
  }
  return cachedClient;
}

/** Reset the memoised client — test-only helper. */
export function __resetRazorpayClient(): void {
  cachedClient = undefined;
}

function mapSdkError(err: unknown): RazorpayError {
  const anyErr = err as { statusCode?: number; error?: { code?: string; description?: string } };
  const status = anyErr?.statusCode ?? 502;
  const code = anyErr?.error?.code ?? 'PROVIDER_ERROR';
  const description = anyErr?.error?.description ?? (err as Error)?.message ?? 'Razorpay error';
  logger.warn(`Razorpay SDK error status=${status} code=${code}`);
  return new RazorpayError(status, code, description);
}

// ─── Orders ─────────────────────────────────────────────────────────────────

export interface CreateOrderInput {
  amount: number;        // In the smallest currency unit (paise for INR)
  currency: string;
  receipt: string;       // <=40 char idempotency key
  notes?: Record<string, string>;
}

export interface CreateOrderResult {
  id: string;            // rzp_order_xxx
  amount: number;
  currency: string;
  receipt: string;
  status: string;
}

export async function createOrder(input: CreateOrderInput): Promise<CreateOrderResult> {
  try {
    const result = await client().orders.create({
      amount: input.amount,
      currency: input.currency,
      receipt: input.receipt,
      notes: input.notes,
      payment_capture: true,
    });
    return {
      id: String(result.id),
      amount: Number(result.amount),
      currency: String(result.currency),
      receipt: String(result.receipt ?? input.receipt),
      status: String(result.status),
    };
  } catch (err) {
    throw mapSdkError(err);
  }
}

// ─── Signature verification ─────────────────────────────────────────────────

/**
 * Verify the checkout callback signature: HMAC-SHA256 of `${order_id}|${payment_id}`
 * using the account secret.
 */
export function verifyCheckoutSignature(input: {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}): boolean {
  if (!isRazorpayConfigured()) throw new RazorpayConfigError();
  const expected = crypto
    .createHmac('sha256', env.RAZORPAY_KEY_SECRET!)
    .update(`${input.razorpayOrderId}|${input.razorpayPaymentId}`)
    .digest('hex');
  return timingSafeEqual(expected, input.razorpaySignature);
}

/** Verify a webhook body against the shared webhook secret. */
export function verifyWebhookSignature(rawBody: string | Buffer, signature: string): boolean {
  if (!isRazorpayConfigured()) throw new RazorpayConfigError();
  const body = Buffer.isBuffer(rawBody) ? rawBody.toString('utf8') : rawBody;
  const expected = crypto
    .createHmac('sha256', env.RAZORPAY_WEBHOOK_SECRET!)
    .update(body)
    .digest('hex');
  return timingSafeEqual(expected, signature);
}

function timingSafeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a, 'utf8');
  const bufB = Buffer.from(b, 'utf8');
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

// ─── Refunds ────────────────────────────────────────────────────────────────

export interface CreateRefundInput {
  paymentId: string;    // rzp_pay_xxx
  amount?: number;      // paise; omit for full refund
  notes?: Record<string, string>;
  speed?: 'normal' | 'optimum';
}

export interface CreateRefundResult {
  id: string;           // rzp_rfnd_xxx
  amount: number;
  status: string;       // pending | processed | failed
}

export async function createRefund(input: CreateRefundInput): Promise<CreateRefundResult> {
  try {
    // Razorpay SDK exposes payments.refund(paymentId, payload)
    const payload: Record<string, unknown> = {};
    if (input.amount !== undefined) payload.amount = input.amount;
    if (input.notes) payload.notes = input.notes;
    if (input.speed) payload.speed = input.speed;
    // Deterministic idempotency: SDK accepts the "receipt" field, plus a
    // recommended `x-payment-idempotency-key` header via requestOptions.
    const result = await client().payments.refund(input.paymentId, payload as never);
    return {
      id: String(result.id),
      amount: Number(result.amount),
      status: String(result.status),
    };
  } catch (err) {
    throw mapSdkError(err);
  }
}

// ─── Fetchers (for reconciliation & audit) ──────────────────────────────────

export async function fetchPayment(paymentId: string): Promise<{ id: string; status: string; amount: number; order_id: string; method?: string }> {
  try {
    const p = await client().payments.fetch(paymentId);
    return {
      id: String(p.id),
      status: String(p.status),
      amount: Number(p.amount),
      order_id: String(p.order_id),
      method: p.method ? String(p.method) : undefined,
    };
  } catch (err) {
    throw mapSdkError(err);
  }
}

export const razorpay = {
  createOrder,
  createRefund,
  fetchPayment,
  verifyCheckoutSignature,
  verifyWebhookSignature,
};
