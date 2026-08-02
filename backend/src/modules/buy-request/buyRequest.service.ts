import { BuyRequestStatus, ListingStatus, NotificationType, OrderStatus } from '@prisma/client';
import prisma from '../../config/database';
import { AppError } from '../../shared/errors/AppError';
import { generateOrderNumber, generateRequestNumber, parsePagination } from '../../shared/utils/helpers';
import { getPharmacyForUser } from '../../shared/middleware/pharmacy.middleware';
import { NotificationService } from '../notification/notification.service';

const notificationService = new NotificationService();

export class BuyRequestService {
  async list(userId: string, role: string, status?: BuyRequestStatus, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const pharmacy = role === 'seller' ? await prisma.pharmacy.findUnique({ where: { userId } }) : null;

    const where = role === 'seller' && pharmacy
      ? { sellerId: pharmacy.id, ...(status && { status }) }
      : { buyerId: userId, ...(status && { status }) };

    const [data, total] = await Promise.all([
      prisma.buyRequest.findMany({
        where, skip, take: limit, orderBy: { createdAt: 'desc' },
        include: {
          items: { include: { listing: { include: { medicine: true } } } },
          buyer: { select: { id: true, firstName: true, lastName: true } },
          seller: { select: { id: true, name: true, city: true } },
        },
      }),
      prisma.buyRequest.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async getById(id: string) {
    const request = await prisma.buyRequest.findUnique({
      where: { id },
      include: {
        items: { include: { listing: { include: { medicine: true } } } },
        buyer: { select: { id: true, firstName: true, lastName: true, phone: true } },
        seller: { select: { id: true, name: true, city: true, userId: true } },
        order: true,
      },
    });
    if (!request) throw AppError.notFound('Buy request not found');
    return request;
  }

  async create(buyerId: string, sellerId: string, items: { listingId: string; quantity: number }[], note?: string) {
    const listings = await prisma.listing.findMany({
      where: { id: { in: items.map((i) => i.listingId) }, pharmacyId: sellerId, status: ListingStatus.ACTIVE },
      include: { medicine: true },
    });

    if (listings.length !== items.length) throw AppError.badRequest('One or more listings unavailable');

    let totalAmount = 0;
    const lineItems = items.map((item) => {
      const listing = listings.find((l) => l.id === item.listingId)!;
      if (item.quantity < listing.moq) throw AppError.badRequest(`MOQ for listing is ${listing.moq}`);
      if (item.quantity > listing.availableQty) throw AppError.badRequest('Insufficient stock');
      const subtotal = Number(listing.finalPrice) * item.quantity;
      totalAmount += subtotal;
      return { listingId: item.listingId, quantity: item.quantity, unitPrice: listing.finalPrice, subtotal, listing };
    });

    return prisma.$transaction(async (tx) => {
      const request = await tx.buyRequest.create({
        data: {
          requestNumber: generateRequestNumber(),
          buyerId, sellerId, totalAmount, note,
          expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
          items: { create: lineItems.map(({ listingId, quantity, unitPrice, subtotal }) => ({ listingId, quantity, unitPrice, subtotal })) },
        },
        include: { items: { include: { listing: { include: { medicine: true } } } }, seller: true },
      });

      await tx.cartItem.deleteMany({
        where: { userId: buyerId, listingId: { in: items.map((i) => i.listingId) } },
      });

      const seller = await tx.pharmacy.findUnique({ where: { id: sellerId } });
      if (seller) {
        await notificationService.create({
          userId: seller.userId,
          type: NotificationType.BUY_REQUEST,
          title: 'New Buy Request',
          body: `New buy request ${request.requestNumber}`,
          data: { buyRequestId: request.id },
        });
      }

      return request;
    });
  }

  async respond(sellerUserId: string, requestId: string, action: 'accept' | 'reject', sellerNote?: string) {
    const pharmacy = await getPharmacyForUser(sellerUserId);
    const buyRequest = await prisma.buyRequest.findFirst({
      where: { id: requestId, sellerId: pharmacy.id, status: BuyRequestStatus.PENDING },
      include: { items: { include: { listing: { include: { medicine: true } } } } },
    });

    if (!buyRequest) throw AppError.notFound('Buy request not found or already responded');

    if (action === 'reject') {
      const updated = await prisma.buyRequest.update({
        where: { id: requestId },
        data: { status: BuyRequestStatus.REJECTED, sellerNote, respondedAt: new Date() },
      });
      await notificationService.create({
        userId: buyRequest.buyerId,
        type: NotificationType.BUY_REQUEST,
        title: 'Buy Request Rejected',
        body: `Request ${buyRequest.requestNumber} was rejected`,
        data: { buyRequestId: requestId },
      });
      return { buyRequest: updated };
    }

    for (const item of buyRequest.items) {
      if (item.quantity > item.listing.availableQty) {
        throw AppError.badRequest(`Insufficient stock for ${item.listing.medicine.name}`);
      }
    }

    return prisma.$transaction(async (tx) => {
      const request = await tx.buyRequest.update({
        where: { id: requestId },
        data: { status: BuyRequestStatus.ACCEPTED, sellerNote, respondedAt: new Date() },
      });

      for (const item of buyRequest.items) {
        await tx.listing.update({
          where: { id: item.listingId },
          data: { availableQty: { decrement: item.quantity } },
        });
      }

      const order = await tx.order.create({
        data: {
          orderNumber: generateOrderNumber(),
          buyRequestId: requestId,
          buyerId: buyRequest.buyerId,
          sellerId: buyRequest.sellerId,
          totalAmount: buyRequest.totalAmount,
          status: OrderStatus.CONFIRMED,
          items: {
            create: buyRequest.items.map((item) => ({
              listingId: item.listingId,
              medicineName: item.listing.medicine.name,
              batchNumber: item.listing.batchNumber,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              subtotal: item.subtotal,
            })),
          },
          statusHistory: { create: { status: OrderStatus.CONFIRMED, note: 'Created from accepted buy request' } },
        },
        include: { items: true },
      });

      await notificationService.create({
        userId: buyRequest.buyerId,
        type: NotificationType.ORDER_UPDATE,
        title: 'Buy Request Accepted',
        body: `Order ${order.orderNumber} created`,
        data: { orderId: order.id, buyRequestId: requestId },
      });

      return { buyRequest: request, order };
    });
  }
}

export const buyRequestService = new BuyRequestService();
