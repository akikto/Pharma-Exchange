import { Prisma, PaymentAttemptStatus, PaymentStatus, RefundStatus, OrderStatus, NotificationType } from '@prisma/client';
import prisma from '../../config/database';
import { env } from '../../config/env';
import { AppError } from '../../shared/errors/AppError';
import { logger } from '../../shared/utils/logger';
import {
  RazorpayConfigError,
  RazorpayError,
  createOrder as rzpCreateOrder,
  createRefund as rzpCreateRefund,
  verifyCheckoutSignature,
  verifyWebhookSignature,
} from '../../shared/services/razorpay.service';
import { notificationService } from '../notification';

/**
 * Payments module (BL-02 · Razorpay).
 *
 *  1. `POST /payments/create-order`  — buyer starts a checkout for an existing
 *     Order. We create a Razorpay Order server-side and hand the client the
 *     public key + rzp order id.
 *  2. Frontend opens Razorpay Checkout with those options. On success,
 *     Razorpay calls the client with `{ razorpay_order_id, razorpay_payment_id,
 *     razorpay_signature }`.
 *  3. `POST /payments/verify` — backend verifies the HMAC signature, marks the
 *     Payment CAPTURED and the Order PAID + CONFIRMED. Idempotent.
 *  4. `POST /payments/webhook` — provider-driven callback with independent
 *     signature verification. Deduped by `x-razorpay-event-id`. Updates
 *     Payment / Refund / Order statuses.
 *  5. `POST /payments/:orderId/refund` — seller/admin issues a full or partial
 *     refund. Idempotent per Razorpay refund id from the response / webhook.
 *  6. `POST /payments/:orderId/cancel` — buyer cancels a payment that has not
 *     yet been captured (marks the Payment CANCELLED — the Order lifecycle
 *     itself is handled by the existing order module).
 *
 * Money is stored as `Decimal(12,2)` in the major unit; Razorpay expects
 * paise/cents (integer). All amount conversions happen at this boundary.
 */

function toMinorUnit(major: Prisma.Decimal | number | string): number {
  const asNumber = typeof major === 'number' ? major : Number(major.toString());
  return Math.round(asNumber * 100);
}

function toMajorUnit(minor: number): Prisma.Decimal {
  return new Prisma.Decimal(minor).dividedBy(100).toDecimalPlaces(2);
}

function mapProviderError(err: unknown): AppError {
  if (err instanceof RazorpayConfigError) return AppError.badRequest('Payment provider is not configured');
  if (err instanceof RazorpayError) {
    if (err.status >= 500) return new AppError(503, 'Payment provider unavailable', 'PAYMENT_PROVIDER_UNAVAILABLE');
    if (err.status === 429) return new AppError(429, 'Payment provider rate limited', 'PAYMENT_PROVIDER_RATE_LIMIT');
    return new AppError(502, err.providerDescription, 'PAYMENT_PROVIDER_ERROR');
  }
  logger.error(`Unexpected payment error: ${(err as Error)?.stack ?? err}`);
  return AppError.internal('Unexpected payment error');
}

function shortReceipt(orderNumber: string): string {
  // Razorpay caps receipt at 40 chars. Order numbers are ≤ 30 chars in this app.
  const suffix = Date.now().toString(36).slice(-6);
  return `${orderNumber.slice(0, 30)}-${suffix}`.slice(0, 40);
}

export class PaymentsService {
  /** Buyer starts checkout for an existing PENDING order. */
  async createCheckoutOrder(userId: string, orderId: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true, orderNumber: true, buyerId: true, totalAmount: true,
        status: true, paymentStatus: true,
      },
    });
    if (!order) throw AppError.notFound('Order not found');
    if (order.buyerId !== userId) throw AppError.forbidden('Only the buyer can pay for this order');
    if (order.paymentStatus === PaymentStatus.PAID) throw AppError.badRequest('Order is already paid');
    if (order.paymentStatus === PaymentStatus.REFUNDED) throw AppError.badRequest('Order has already been refunded');
    if (order.status === OrderStatus.CANCELLED) throw AppError.badRequest('Order is cancelled');

    // Reuse an outstanding CREATED payment attempt when present so refreshes
    // and retries don't spam Razorpay with orders.
    const existing = await prisma.payment.findFirst({
      where: { orderId, status: PaymentAttemptStatus.CREATED },
      orderBy: { createdAt: 'desc' },
    });
    if (existing) {
      return this.buildCheckoutOptions(existing);
    }

    const receipt = shortReceipt(order.orderNumber);
    const amountMinor = toMinorUnit(order.totalAmount);

    let rzpOrder;
    try {
      rzpOrder = await rzpCreateOrder({
        amount: amountMinor,
        currency: env.RAZORPAY_CURRENCY,
        receipt,
        notes: { orderId: order.id, orderNumber: order.orderNumber, buyerId: order.buyerId },
      });
    } catch (err) {
      throw mapProviderError(err);
    }

    const payment = await prisma.payment.create({
      data: {
        orderId: order.id,
        userId,
        provider: 'RAZORPAY',
        providerOrderId: rzpOrder.id,
        amount: order.totalAmount,
        currency: env.RAZORPAY_CURRENCY,
        status: PaymentAttemptStatus.CREATED,
        receipt,
      },
    });
    return this.buildCheckoutOptions(payment);
  }

  private buildCheckoutOptions(payment: { providerOrderId: string; amount: Prisma.Decimal | number | string; currency: string; orderId: string; id: string }) {
    return {
      paymentId: payment.id,
      orderId: payment.orderId,
      keyId: env.RAZORPAY_KEY_ID!,
      providerOrderId: payment.providerOrderId,
      amount: toMinorUnit(payment.amount),
      currency: payment.currency,
    };
  }

  /**
   * Called after the client-side Razorpay Checkout succeeds. Verifies the
   * HMAC signature; on success marks the payment CAPTURED and the order
   * PAID / CONFIRMED. Idempotent — repeated calls with the same body return
   * the same result.
   */
  async verifyCheckout(userId: string, input: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }) {
    const payment = await prisma.payment.findUnique({ where: { providerOrderId: input.razorpay_order_id } });
    if (!payment) throw AppError.notFound('Payment not found for this Razorpay order');
    if (payment.userId !== userId) throw AppError.forbidden('Not your payment');

    if (payment.status === PaymentAttemptStatus.CAPTURED) {
      // Idempotent replay.
      return this.summarize(payment.id);
    }

    let valid: boolean;
    try {
      valid = verifyCheckoutSignature({
        razorpayOrderId: input.razorpay_order_id,
        razorpayPaymentId: input.razorpay_payment_id,
        razorpaySignature: input.razorpay_signature,
      });
    } catch (err) {
      throw mapProviderError(err);
    }
    if (!valid) {
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: PaymentAttemptStatus.FAILED,
          providerPaymentId: input.razorpay_payment_id,
          failedAt: new Date(),
          errorCode: 'SIGNATURE_MISMATCH',
          errorDescription: 'HMAC signature did not match',
        },
      });
      throw AppError.badRequest('Invalid payment signature');
    }

    await this.markCaptured(payment.id, input.razorpay_payment_id);
    return this.summarize(payment.id);
  }

  /** Cancel the latest outstanding CREATED payment for an order (internal coordination). */
  async cancelOutstandingForOrder(orderId: string) {
    const payment = await prisma.payment.findFirst({
      where: { orderId, status: PaymentAttemptStatus.CREATED },
      orderBy: { createdAt: 'desc' },
    });
    if (!payment) return { cancelled: false as const };
    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: PaymentAttemptStatus.CANCELLED, cancelledAt: new Date() },
    });
    return { cancelled: true as const, paymentId: payment.id };
  }

  /** Buyer cancels an unpaid payment attempt (before capture). */
  async cancelPayment(userId: string, orderId: string) {
    const payment = await prisma.payment.findFirst({
      where: { orderId, userId, status: PaymentAttemptStatus.CREATED },
      orderBy: { createdAt: 'desc' },
    });
    if (!payment) throw AppError.badRequest('No cancellable payment for this order');
    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: PaymentAttemptStatus.CANCELLED, cancelledAt: new Date() },
    });
    return { paymentId: payment.id, status: PaymentAttemptStatus.CANCELLED };
  }

  /**
   * Issue a full or partial refund. Callable by the buyer (self) or by
   * the seller/admin. The Order's payment status is updated once Razorpay
   * confirms via webhook (`refund.processed`), but a synchronous update also
   * happens here for the common "refund created immediately" case.
   */
  async refund(actorUserId: string, actorRole: string, orderId: string, input: { amount?: number; reason?: string }) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { seller: { select: { userId: true } } },
    });
    if (!order) throw AppError.notFound('Order not found');

    const isBuyer = order.buyerId === actorUserId;
    const isSeller = order.seller.userId === actorUserId;
    const isAdmin = actorRole === 'ADMIN';
    if (!isBuyer && !isSeller && !isAdmin) throw AppError.forbidden('Not allowed to refund this order');

    if (order.paymentStatus !== PaymentStatus.PAID) {
      throw AppError.badRequest('Only paid orders can be refunded');
    }

    const payment = await prisma.payment.findFirst({
      where: { orderId, status: PaymentAttemptStatus.CAPTURED },
      orderBy: { createdAt: 'desc' },
    });
    if (!payment || !payment.providerPaymentId) {
      throw AppError.badRequest('No captured payment to refund');
    }

    const amountMinor = input.amount !== undefined ? Math.round(input.amount * 100) : toMinorUnit(payment.amount);
    if (amountMinor <= 0) throw AppError.badRequest('Refund amount must be positive');
    if (amountMinor > toMinorUnit(payment.amount)) {
      throw AppError.badRequest('Refund amount exceeds captured amount');
    }

    let refundResult;
    try {
      refundResult = await rzpCreateRefund({
        paymentId: payment.providerPaymentId,
        amount: amountMinor,
        notes: {
          orderId: order.id,
          reason: input.reason ?? 'buyer_or_seller_initiated',
          initiator: isBuyer ? 'buyer' : isSeller ? 'seller' : 'admin',
        },
      });
    } catch (err) {
      throw mapProviderError(err);
    }

    const refund = await prisma.refund.create({
      data: {
        paymentId: payment.id,
        providerRefundId: refundResult.id,
        amount: toMajorUnit(refundResult.amount),
        status: refundResult.status === 'processed' ? RefundStatus.PROCESSED
              : refundResult.status === 'failed'    ? RefundStatus.FAILED
              : RefundStatus.PENDING,
        reason: input.reason,
        processedAt: refundResult.status === 'processed' ? new Date() : null,
      },
    });

    // Full refund → immediately mark order REFUNDED. Partial refunds keep the
    // order as PAID until Razorpay confirms — the webhook will finalise.
    if (amountMinor === toMinorUnit(payment.amount)) {
      await prisma.$transaction([
        prisma.payment.update({
          where: { id: payment.id },
          data: { status: PaymentAttemptStatus.REFUNDED },
        }),
        prisma.order.update({
          where: { id: order.id },
          data: { paymentStatus: PaymentStatus.REFUNDED },
        }),
      ]);
    }

    return { refundId: refund.id, providerRefundId: refund.providerRefundId, status: refund.status };
  }

  // ─── Webhook handling ────────────────────────────────────────────────────

  async handleWebhook(rawBody: string | Buffer, headers: Record<string, string | string[] | undefined>) {
    const signature = String(headers['x-razorpay-signature'] ?? '');
    const eventId = String(headers['x-razorpay-event-id'] ?? '');
    if (!signature) throw AppError.unauthorized('Missing webhook signature');

    let valid: boolean;
    try {
      valid = verifyWebhookSignature(rawBody, signature);
    } catch (err) {
      throw mapProviderError(err);
    }
    if (!valid) throw AppError.unauthorized('Invalid webhook signature');

    let event: { event: string; payload: Record<string, unknown>; id?: string };
    try {
      const parsed = JSON.parse(Buffer.isBuffer(rawBody) ? rawBody.toString('utf8') : rawBody);
      event = parsed;
    } catch {
      throw AppError.badRequest('Invalid webhook payload');
    }

    const dedupeKey = eventId || `${event.event}:${event.id ?? ''}:${Date.now()}`;
    // Idempotent write: unique(eventId) enforces dedupe.
    try {
      await prisma.paymentWebhookEvent.create({
        data: {
          provider: 'RAZORPAY',
          eventId: dedupeKey,
          eventType: event.event,
          signature,
          payload: event as unknown as Prisma.InputJsonValue,
        },
      });
    } catch (err) {
      if ((err as { code?: string }).code === 'P2002') {
        // Duplicate delivery — quietly succeed. Razorpay retries on 5xx / no ack.
        return { received: true, duplicate: true };
      }
      throw err;
    }

    try {
      await this.dispatch(event.event, event.payload);
      await prisma.paymentWebhookEvent.update({
        where: { eventId: dedupeKey },
        data: { processedAt: new Date() },
      });
    } catch (err) {
      await prisma.paymentWebhookEvent.update({
        where: { eventId: dedupeKey },
        data: { errorMessage: (err as Error).message },
      });
      throw err;
    }

    return { received: true };
  }

  private async dispatch(eventType: string, payload: Record<string, unknown>): Promise<void> {
    const paymentEntity = (payload.payment as { entity?: Record<string, unknown> })?.entity;
    const refundEntity  = (payload.refund  as { entity?: Record<string, unknown> })?.entity;

    switch (eventType) {
      case 'order.paid':
      case 'payment.captured': {
        if (!paymentEntity) return;
        await this.markCapturedByProvider(String(paymentEntity.order_id), String(paymentEntity.id), paymentEntity);
        return;
      }
      case 'payment.failed': {
        if (!paymentEntity) return;
        await this.markFailedByProvider(String(paymentEntity.order_id), paymentEntity);
        return;
      }
      case 'refund.created':
      case 'refund.processed':
      case 'refund.failed': {
        if (!refundEntity) return;
        await this.syncRefundFromProvider(refundEntity);
        return;
      }
      default:
        // Unhandled events are stored but not acted upon.
        logger.info(`Razorpay webhook ignored: ${eventType}`);
    }
  }

  private async markCapturedByProvider(providerOrderId: string, providerPaymentId: string, entity: Record<string, unknown>) {
    const payment = await prisma.payment.findUnique({ where: { providerOrderId } });
    if (!payment) {
      logger.warn(`Webhook capture for unknown order ${providerOrderId}`);
      return;
    }
    if (payment.status === PaymentAttemptStatus.CAPTURED) return;
    await this.markCaptured(payment.id, providerPaymentId, entity.method ? String(entity.method) : undefined);
  }

  private async markCaptured(paymentId: string, providerPaymentId: string, method?: string) {
    await prisma.$transaction(async (tx) => {
      const payment = await tx.payment.update({
        where: { id: paymentId },
        data: {
          status: PaymentAttemptStatus.CAPTURED,
          providerPaymentId,
          method,
          capturedAt: new Date(),
        },
      });

      await tx.order.update({
        where: { id: payment.orderId },
        data: {
          paymentStatus: PaymentStatus.PAID,
          // Advance CREATED → CONFIRMED; do not touch orders already
          // shipped/delivered/cancelled.
          ...(await needsConfirm(tx, payment.orderId) ? { status: OrderStatus.CONFIRMED } : {}),
        },
      });

      await tx.orderStatusHistory.create({
        data: { orderId: payment.orderId, status: OrderStatus.CONFIRMED, note: 'Payment captured' },
      }).catch(() => undefined);
    });

    const paymentRow = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: { order: { select: { orderNumber: true, buyerId: true } } },
    });
    if (paymentRow) {
      await notificationService.create({
        userId: paymentRow.order.buyerId,
        type: NotificationType.ORDER_UPDATE,
        title: 'Payment successful',
        body: `Payment for order ${paymentRow.order.orderNumber} was received.`,
        data: { orderId: paymentRow.orderId, paymentId: paymentRow.id },
      });
    }
  }

  private async markFailedByProvider(providerOrderId: string, entity: Record<string, unknown>) {
    const payment = await prisma.payment.findUnique({
      where: { providerOrderId },
      include: { order: { select: { orderNumber: true, buyerId: true } } },
    });
    if (!payment) return;
    if (payment.status === PaymentAttemptStatus.CAPTURED) return;
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: PaymentAttemptStatus.FAILED,
        providerPaymentId: entity.id ? String(entity.id) : payment.providerPaymentId,
        failedAt: new Date(),
        errorCode: entity.error_code ? String(entity.error_code) : undefined,
        errorDescription: entity.error_description ? String(entity.error_description) : undefined,
      },
    });

    await notificationService.create({
      userId: payment.order.buyerId,
      type: NotificationType.ORDER_UPDATE,
      title: 'Payment failed',
      body: `Payment for order ${payment.order.orderNumber} could not be completed.`,
      data: { orderId: payment.orderId, paymentId: payment.id, paymentStatus: 'FAILED' },
    });
  }

  private async syncRefundFromProvider(entity: Record<string, unknown>) {
    const providerRefundId = String(entity.id);
    const status: RefundStatus =
      entity.status === 'processed' ? RefundStatus.PROCESSED
      : entity.status === 'failed'  ? RefundStatus.FAILED
      : RefundStatus.PENDING;

    // Refund may have been recorded synchronously via /refund or arrive
    // fresh from the webhook.
    const existing = await prisma.refund.findUnique({ where: { providerRefundId } });
    let refund;
    if (existing) {
      refund = await prisma.refund.update({
        where: { providerRefundId },
        data: {
          status,
          processedAt: status === RefundStatus.PROCESSED ? new Date() : existing.processedAt,
          failedAt: status === RefundStatus.FAILED ? new Date() : existing.failedAt,
          errorDescription: entity.error_description ? String(entity.error_description) : undefined,
        },
      });
    } else {
      const providerPaymentId = String(entity.payment_id);
      const payment = await prisma.payment.findUnique({ where: { providerPaymentId } });
      if (!payment) {
        logger.warn(`Refund webhook for unknown payment ${providerPaymentId}`);
        return;
      }
      refund = await prisma.refund.create({
        data: {
          paymentId: payment.id,
          providerRefundId,
          amount: toMajorUnit(Number(entity.amount)),
          status,
          processedAt: status === RefundStatus.PROCESSED ? new Date() : null,
          failedAt: status === RefundStatus.FAILED ? new Date() : null,
          errorDescription: entity.error_description ? String(entity.error_description) : undefined,
        },
      });
    }

    if (refund.status === RefundStatus.PROCESSED) {
      const payment = await prisma.payment.findUnique({
        where: { id: refund.paymentId },
        include: { order: { select: { orderNumber: true, buyerId: true } } },
      });
      if (!payment) return;
      const totalRefunded = await prisma.refund.aggregate({
        where: { paymentId: payment.id, status: RefundStatus.PROCESSED },
        _sum: { amount: true },
      });
      const refunded = Number(totalRefunded._sum.amount ?? 0);
      const captured = Number(payment.amount);
      if (refunded + 0.001 >= captured) {
        await prisma.$transaction([
          prisma.payment.update({
            where: { id: payment.id },
            data: { status: PaymentAttemptStatus.REFUNDED },
          }),
          prisma.order.update({
            where: { id: payment.orderId },
            data: { paymentStatus: PaymentStatus.REFUNDED },
          }),
        ]);
      }

      await notificationService.create({
        userId: payment.order.buyerId,
        type: NotificationType.ORDER_UPDATE,
        title: 'Refund processed',
        body: `A refund for order ${payment.order.orderNumber} has been processed.`,
        data: { orderId: payment.orderId, paymentId: payment.id, refundId: refund.id },
      });
    }
  }

  private async summarize(paymentId: string) {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        order: { select: { id: true, orderNumber: true, status: true, paymentStatus: true, totalAmount: true } },
        refunds: { orderBy: { createdAt: 'desc' } },
      },
    });
    if (!payment) throw AppError.notFound('Payment not found');
    return payment;
  }

  async listForAdmin(page = 1, limit = 20, status?: PaymentAttemptStatus) {
    const skip = (page - 1) * limit;
    const where = status ? { status } : {};
    const [data, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          order: {
            select: {
              id: true,
              orderNumber: true,
              paymentStatus: true,
              status: true,
              totalAmount: true,
              buyer: { select: { id: true, firstName: true, lastName: true, email: true } },
              seller: { select: { id: true, name: true } },
            },
          },
          refunds: { orderBy: { createdAt: 'desc' } },
        },
      }),
      prisma.payment.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  async getForOrder(userId: string, actorRole: string, orderId: string) {
    let order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { seller: { select: { userId: true } } },
    });
    if (!order) {
      order = await prisma.order.findUnique({
        where: { orderNumber: orderId },
        include: { seller: { select: { userId: true } } },
      });
    }
    if (!order) throw AppError.notFound('Order not found');
    const isBuyer = order.buyerId === userId;
    const isSeller = order.seller.userId === userId;
    const isAdmin = actorRole === 'ADMIN';
    if (!isBuyer && !isSeller && !isAdmin) throw AppError.forbidden('Access denied');
    return prisma.payment.findMany({
      where: { orderId },
      orderBy: { createdAt: 'desc' },
      include: { refunds: { orderBy: { createdAt: 'desc' } } },
    });
  }
}

async function needsConfirm(tx: Prisma.TransactionClient, orderId: string): Promise<boolean> {
  const order = await tx.order.findUnique({ where: { id: orderId }, select: { status: true } });
  return order?.status === OrderStatus.CREATED;
}

export const paymentsService = new PaymentsService();
