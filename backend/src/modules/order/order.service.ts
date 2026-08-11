import { NotificationType, OrderPaymentMethod, OrderStatus, PaymentStatus } from '@prisma/client';
import prisma from '../../config/database';
import { isRazorpayConfigured } from '../../config/env';
import { AppError } from '../../shared/errors/AppError';
import { getPharmacyForUser } from '../../shared/middleware/pharmacy.middleware';
import { notificationService } from '../notification';
import { chatSystemService } from '../chat/chatSystem.service';
import { paymentsService } from '../payments/payments.service';
import { logger } from '../../shared/utils/logger';
import { orderRequiresOnlinePaymentBeforeFulfillment } from './order.payment-method';

const SELLER_TRANSITIONS: Partial<Record<OrderStatus, OrderStatus[]>> = {
  [OrderStatus.CONFIRMED]: [OrderStatus.PACKED, OrderStatus.CANCELLED],
  [OrderStatus.PACKED]: [OrderStatus.SHIPPED, OrderStatus.CANCELLED],
  [OrderStatus.SHIPPED]: [OrderStatus.DELIVERED],
};

const FULFILLMENT_STATUSES: OrderStatus[] = [
  OrderStatus.PACKED,
  OrderStatus.SHIPPED,
  OrderStatus.DELIVERED,
];

export class OrderService {
  async list(userId: string, role: string, status?: OrderStatus, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const pharmacy = role === 'seller' ? await prisma.pharmacy.findUnique({ where: { userId } }) : null;

    if (role === 'seller' && !pharmacy) {
      return { data: [], total: 0, page, limit };
    }

    const where = role === 'seller' && pharmacy
      ? { sellerId: pharmacy.id, ...(status && { status }) }
      : { buyerId: userId, ...(status && { status }) };

    const [data, total] = await Promise.all([
      prisma.order.findMany({
        where, skip, take: limit, orderBy: { createdAt: 'desc' },
        include: {
          items: true,
          seller: { select: { id: true, name: true, city: true } },
          buyer: { select: { id: true, firstName: true, lastName: true } },
        },
      }),
      prisma.order.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async getById(id: string, userId: string) {
    const include = {
      items: { include: { listing: { include: { medicine: true } } } },
      seller: { select: { id: true, name: true, city: true, userId: true } },
      buyer: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
      statusHistory: { orderBy: { createdAt: 'asc' } },
      review: true,
    } as const;

    let order = await prisma.order.findUnique({ where: { id }, include });
    if (!order) {
      order = await prisma.order.findUnique({ where: { orderNumber: id }, include });
    }
    if (!order) throw AppError.notFound('Order not found');

    const pharmacy = await prisma.pharmacy.findUnique({ where: { userId } });
    const isBuyer = order.buyerId === userId;
    const isSeller = pharmacy && order.sellerId === pharmacy.id;
    if (!isBuyer && !isSeller) throw AppError.forbidden('Access denied');

    return order;
  }

  async updateStatus(sellerUserId: string, orderId: string, status: OrderStatus, note?: string) {
    const pharmacy = await getPharmacyForUser(sellerUserId);
    const order = await prisma.order.findFirst({
      where: { id: orderId, sellerId: pharmacy.id },
      include: { items: true },
    });
    if (!order) throw AppError.notFound('Order not found');

    if (order.status === status) {
      return order;
    }

    const allowed = SELLER_TRANSITIONS[order.status];
    if (!allowed?.includes(status)) {
      throw AppError.badRequest(`Cannot transition from ${order.status} to ${status}`);
    }

    if (
      FULFILLMENT_STATUSES.includes(status)
      && orderRequiresOnlinePaymentBeforeFulfillment(order)
    ) {
      throw new AppError(400, 'Payment must be completed before order fulfillment', 'PAYMENT_REQUIRED');
    }

    if (status === OrderStatus.CANCELLED) {
      await this.coordinatePaymentOnCancel(order, sellerUserId, 'USER', note);
    }

    const previousStatus = order.status;

    const updated = await prisma.$transaction(async (tx) => {
      const result = await tx.order.updateMany({
        where: { id: orderId, status: previousStatus },
        data: {
          status,
          ...(status === OrderStatus.DELIVERED && {
            deliveredAt: new Date(),
            ...(order.paymentMethod === OrderPaymentMethod.COD && order.paymentStatus === PaymentStatus.PENDING
              ? { paymentStatus: PaymentStatus.PAID }
              : {}),
          }),
          ...(status === OrderStatus.CANCELLED && { cancelledAt: new Date(), cancelReason: note }),
        },
      });

      if (result.count === 0) {
        const current = await tx.order.findUnique({ where: { id: orderId } });
        if (!current) throw AppError.notFound('Order not found');
        if (current.status === status) return current;
        throw AppError.badRequest(`Cannot transition from ${current.status} to ${status}`);
      }

      const fresh = await tx.order.findUnique({ where: { id: orderId } });
      if (!fresh) throw AppError.notFound('Order not found');

      await tx.orderStatusHistory.create({ data: { orderId, status, note } });

      if (status === OrderStatus.CANCELLED) {
        await this.restoreInventory(tx, order.items);
      }

      return fresh;
    });

    await this.dispatchOrderStatusSideEffects({
      orderId,
      buyerId: order.buyerId,
      sellerId: order.sellerId,
      orderNumber: order.orderNumber,
      status,
      actorUserId: sellerUserId,
    });

    return updated;
  }

  private async dispatchOrderStatusSideEffects(params: {
    orderId: string;
    buyerId: string;
    sellerId: string;
    orderNumber: string;
    status: OrderStatus;
    actorUserId: string;
  }) {
    try {
      await notificationService.create({
        userId: params.buyerId,
        type: NotificationType.ORDER_UPDATE,
        title: 'Order Status Updated',
        body: `Order ${params.orderNumber} is now ${params.status.toLowerCase()}`,
        data: { orderId: params.orderId, status: params.status },
      });
    } catch (err) {
      logger.warn(`Order status notification failed for ${params.orderId}: ${(err as Error).message}`);
    }

    try {
      const seller = await prisma.pharmacy.findUnique({ where: { id: params.sellerId } });
      if (!seller) return;

      await chatSystemService.ensureOrderConversation(params.orderId, params.buyerId, seller.userId);
      await chatSystemService.postOrderStatusMessage(
        params.orderId,
        params.actorUserId,
        params.status,
        params.orderNumber,
      );
    } catch (err) {
      logger.warn(`Order status chat side effect failed for ${params.orderId}: ${(err as Error).message}`);
    }
  }

  async cancel(buyerId: string, orderId: string, reason?: string) {
    const order = await prisma.order.findFirst({
      where: { id: orderId, buyerId, status: { in: [OrderStatus.CREATED, OrderStatus.CONFIRMED] } },
      include: { items: true },
    });
    if (!order) throw AppError.badRequest('Order cannot be cancelled');

    await this.coordinatePaymentOnCancel(order, buyerId, 'USER', reason);

    const updated = await prisma.$transaction(async (tx) => {
      const result = await tx.order.update({
        where: { id: orderId },
        data: { status: OrderStatus.CANCELLED, cancelledAt: new Date(), cancelReason: reason },
      });
      await tx.orderStatusHistory.create({ data: { orderId, status: OrderStatus.CANCELLED, note: reason } });
      await this.restoreInventory(tx, order.items);

      const seller = await tx.pharmacy.findUnique({ where: { id: order.sellerId } });
      if (seller) {
        await notificationService.create({
          userId: seller.userId,
          type: NotificationType.ORDER_UPDATE,
          title: 'Order Cancelled',
          body: `Order ${order.orderNumber} was cancelled by buyer`,
          data: { orderId, role: 'seller' },
        });
      }

      return result;
    });

    const seller = await prisma.pharmacy.findUnique({ where: { id: order.sellerId } });
    if (seller) {
      await chatSystemService.ensureOrderConversation(orderId, order.buyerId, seller.userId);
      await chatSystemService.postOrderStatusMessage(orderId, buyerId, OrderStatus.CANCELLED, order.orderNumber);
    }

    return updated;
  }

  async setPaymentMethod(buyerId: string, orderId: string, method: OrderPaymentMethod) {
    const order = await prisma.order.findFirst({
      where: { id: orderId, buyerId },
    });
    if (!order) throw AppError.notFound('Order not found');
    if (order.paymentStatus === PaymentStatus.PAID) throw AppError.badRequest('Order is already paid');
    if (order.paymentStatus === PaymentStatus.REFUNDED) throw AppError.badRequest('Order has been refunded');
    if (order.status === OrderStatus.CANCELLED) throw AppError.badRequest('Order is cancelled');
    if (method === OrderPaymentMethod.RAZORPAY && !isRazorpayConfigured()) {
      throw AppError.badRequest('Online payment is not available');
    }
    if (method === OrderPaymentMethod.COD && order.paymentMethod === OrderPaymentMethod.RAZORPAY) {
      try {
        await paymentsService.cancelOutstandingForOrder(orderId);
      } catch (err) {
        logger.warn(`Failed to cancel outstanding payment when switching to COD for order ${orderId}: ${(err as Error).message}`);
      }
    }

    return prisma.order.update({
      where: { id: orderId },
      data: { paymentMethod: method },
    });
  }

  private async coordinatePaymentOnCancel(
    order: { id: string; buyerId: string; paymentStatus: PaymentStatus; paymentMethod?: OrderPaymentMethod | null },
    actorUserId: string,
    actorRole: string,
    reason?: string,
  ) {
    if (order.paymentStatus === PaymentStatus.PENDING) {
      if (order.paymentMethod === OrderPaymentMethod.COD) return;
      try {
        await paymentsService.cancelOutstandingForOrder(order.id);
      } catch (err) {
        logger.warn(`Failed to cancel outstanding payment for order ${order.id}: ${(err as Error).message}`);
      }
      return;
    }
    if (order.paymentStatus === PaymentStatus.PAID) {
      try {
        await paymentsService.refund(actorUserId, actorRole, order.id, {
          reason: reason ?? 'order_cancelled',
        });
      } catch (err) {
        logger.warn(`Failed to refund paid order ${order.id} on cancel: ${(err as Error).message}`);
        throw err;
      }
    }
  }

  private async restoreInventory(
    tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
    items: { listingId: string; quantity: number }[]
  ) {
    for (const item of items) {
      await tx.listing.update({
        where: { id: item.listingId },
        data: { availableQty: { increment: item.quantity } },
      });
    }
  }
}

export const orderService = new OrderService();
