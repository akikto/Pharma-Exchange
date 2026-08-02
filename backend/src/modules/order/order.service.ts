import { NotificationType, OrderStatus } from '@prisma/client';
import prisma from '../../config/database';
import { AppError } from '../../shared/errors/AppError';
import { parsePagination } from '../../shared/utils/helpers';
import { getPharmacyForUser } from '../../shared/middleware/pharmacy.middleware';
import { notificationService } from '../notification';

export class OrderService {
  async list(userId: string, role: string, status?: OrderStatus, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const pharmacy = role === 'seller' ? await prisma.pharmacy.findUnique({ where: { userId } }) : null;

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
    const order = await prisma.order.findFirst({ where: { id: orderId, sellerId: pharmacy.id } });
    if (!order) throw AppError.notFound('Order not found');

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

      await notificationService.create({
        userId: order.buyerId,
        type: NotificationType.ORDER_UPDATE,
        title: 'Order Status Updated',
        body: `Order ${order.orderNumber} is now ${status.toLowerCase()}`,
        data: { orderId, status },
      });

      return updated;
    });
  }

  async cancel(buyerId: string, orderId: string, reason?: string) {
    const order = await prisma.order.findFirst({
      where: { id: orderId, buyerId, status: { in: [OrderStatus.CREATED, OrderStatus.CONFIRMED] } },
    });
    if (!order) throw AppError.badRequest('Order cannot be cancelled');

    return this.updateStatusByBuyer(orderId, OrderStatus.CANCELLED, reason);
  }

  private async updateStatusByBuyer(orderId: string, status: OrderStatus, note?: string) {
    return prisma.$transaction(async (tx) => {
      const updated = await tx.order.update({
        where: { id: orderId },
        data: { status, cancelledAt: new Date(), cancelReason: note },
      });
      await tx.orderStatusHistory.create({ data: { orderId, status, note } });
      return updated;
    });
  }
}

export const orderService = new OrderService();
