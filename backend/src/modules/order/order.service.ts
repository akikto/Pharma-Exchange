import { NotificationType, OrderStatus, PaymentStatus } from '@prisma/client';
import prisma from '../../config/database';
import { AppError } from '../../shared/errors/AppError';
import { getPharmacyForUser } from '../../shared/middleware/pharmacy.middleware';
import { notificationService } from '../notification';
import { chatSystemService } from '../chat/chatSystem.service';
import { paymentsService } from '../payments/payments.service';
import { logger } from '../../shared/utils/logger';

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
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: { include: { listing: { include: { medicine: true } } } },
        seller: { select: { id: true, name: true, city: true, userId: true } },
        buyer: { select: { id: true, firstName: true, lastName: true } },
        statusHistory: { orderBy: { createdAt: 'asc' } },
        review: true,
      },
    });
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

    const allowed = SELLER_TRANSITIONS[order.status];
    if (!allowed?.includes(status)) {
      throw AppError.badRequest(`Cannot transition from ${order.status} to ${status}`);
    }

    if (FULFILLMENT_STATUSES.includes(status) && order.paymentStatus !== PaymentStatus.PAID) {
      throw new AppError(400, 'Payment must be completed before order fulfillment', 'PAYMENT_REQUIRED');
    }

    if (status === OrderStatus.CANCELLED) {
      await this.coordinatePaymentOnCancel(order, sellerUserId, 'USER', note);
    }

    return prisma.$transaction(async (tx) => {
      const updated = await tx.order.update({
        where: { id: orderId },
        data: {
          status,
          ...(status === OrderStatus.DELIVERED && { deliveredAt: new Date() }),
          ...(status === OrderStatus.CANCELLED && { cancelledAt: new Date(), cancelReason: note }),
        },
      });

      await tx.orderStatusHistory.create({ data: { orderId, status, note } });

      if (status === OrderStatus.CANCELLED) {
        await this.restoreInventory(tx, order.items);
      }

      await notificationService.create({
        userId: order.buyerId,
        type: NotificationType.ORDER_UPDATE,
        title: 'Order Status Updated',
        body: `Order ${order.orderNumber} is now ${status.toLowerCase()}`,
        data: { orderId, status },
      });

      const seller = await tx.pharmacy.findUnique({ where: { id: order.sellerId } });
      if (seller) {
        await chatSystemService.ensureOrderConversation(orderId, order.buyerId, seller.userId);
        await chatSystemService.postOrderStatusMessage(orderId, sellerUserId, status, order.orderNumber);
      }

      return updated;
    });
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

  private async coordinatePaymentOnCancel(
    order: { id: string; buyerId: string; paymentStatus: PaymentStatus },
    actorUserId: string,
    actorRole: string,
    reason?: string,
  ) {
    if (order.paymentStatus === PaymentStatus.PENDING) {
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
