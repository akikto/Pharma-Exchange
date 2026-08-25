import { BuyRequestStatus, ListingStatus, NotificationType, Order, OrderStatus, Prisma } from '@prisma/client';
import prisma from '../../config/database';
import { AppError } from '../../shared/errors/AppError';
import { generateOrderNumber, generateRequestNumber, parsePagination } from '../../shared/utils/helpers';
import { getPharmacyForUser } from '../../shared/middleware/pharmacy.middleware';
import { notificationService } from '../notification';
import { chatSystemService } from '../chat/chatSystem.service';
import { validateCartQuantity } from '../cart/cart.validation';
import { logger } from '../../shared/utils/logger';
import { BUY_REQUEST_SELLER_RESPONSE_MS } from './buyRequest.constants';
import {
  isBuyRequestPastExpiry,
  sellerCanRespondToBuyRequest,
} from './buyRequest.expiry';

type BuyRequestWithItems = Prisma.BuyRequestGetPayload<{
  include: { items: { include: { listing: { include: { medicine: true } } } } };
}>;

function listingMedicineName(item: BuyRequestWithItems['items'][number]): string {
  return item.listing.medicine?.name ?? 'Medicine';
}

export class BuyRequestService {
  private async markExpiredIfNeeded(
    request: { id: string; status: BuyRequestStatus; expiresAt: Date | null },
  ): Promise<BuyRequestStatus> {
    if (request.status !== BuyRequestStatus.PENDING || !isBuyRequestPastExpiry(request)) {
      return request.status;
    }
    await prisma.buyRequest.update({
      where: { id: request.id },
      data: { status: BuyRequestStatus.EXPIRED },
    });
    return BuyRequestStatus.EXPIRED;
  }

  private async markExpiredBatch(
    requests: { id: string; status: BuyRequestStatus; expiresAt: Date | null }[],
  ): Promise<void> {
    const ids = requests
      .filter((request) => request.status === BuyRequestStatus.PENDING && isBuyRequestPastExpiry(request))
      .map((request) => request.id);
    if (!ids.length) return;
    await prisma.buyRequest.updateMany({
      where: { id: { in: ids } },
      data: { status: BuyRequestStatus.EXPIRED },
    });
    for (const request of requests) {
      if (ids.includes(request.id)) request.status = BuyRequestStatus.EXPIRED;
    }
  }

  async list(userId: string, role: string, status?: BuyRequestStatus, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const pharmacy = role === 'seller' ? await prisma.pharmacy.findUnique({ where: { userId } }) : null;

    if (role === 'seller' && !pharmacy) {
      return { data: [], total: 0, page, limit };
    }

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

    await this.markExpiredBatch(data);

    return { data, total, page, limit };
  }

  async getById(id: string, userId: string) {
    const request = await prisma.buyRequest.findUnique({
      where: { id },
      include: {
        items: { include: { listing: { include: { medicine: true } } } },
        buyer: { select: { id: true, firstName: true, lastName: true } },
        seller: { select: { id: true, name: true, city: true, userId: true } },
        order: true,
      },
    });
    if (!request) throw AppError.notFound('Buy request not found');

    const pharmacy = await prisma.pharmacy.findUnique({ where: { userId } });
    const isBuyer = request.buyerId === userId;
    const isSeller = pharmacy && request.sellerId === pharmacy.id;
    if (!isBuyer && !isSeller) throw AppError.forbidden('Access denied');

    request.status = await this.markExpiredIfNeeded(request);

    return request;
  }

  async create(buyerId: string, sellerId: string, items: { listingId: string; quantity: number }[], note?: string) {
    const buyerPharmacy = await prisma.pharmacy.findUnique({ where: { userId: buyerId } });
    if (buyerPharmacy && buyerPharmacy.id === sellerId) {
      throw AppError.badRequest('Cannot create buy request for your own pharmacy');
    }

    const listings = await prisma.listing.findMany({
      where: { id: { in: items.map((i) => i.listingId) }, pharmacyId: sellerId, status: ListingStatus.ACTIVE },
      include: { medicine: true },
    });

    if (listings.length !== items.length) throw AppError.badRequest('One or more listings unavailable');

    let totalAmount = 0;
    const lineItems = items.map((item) => {
      const listing = listings.find((l) => l.id === item.listingId)!;
      const issue = validateCartQuantity(listing, item.quantity);
      if (issue) {
        const label = listing.medicine?.name ? `${listing.medicine.name}: ` : '';
        throw AppError.badRequest(`${label}${issue.message}`, {
          code: issue.code,
          listingId: listing.id,
          moq: issue.moq,
          availableQty: issue.availableQty,
        });
      }
      const subtotal = Number(listing.finalPrice) * item.quantity;
      totalAmount += subtotal;
      return { listingId: item.listingId, quantity: item.quantity, unitPrice: listing.finalPrice, subtotal, listing };
    });

    const request = await prisma.$transaction(async (tx) => {
      const created = await tx.buyRequest.create({
        data: {
          requestNumber: generateRequestNumber(),
          buyerId, sellerId, totalAmount, note,
          expiresAt: new Date(Date.now() + BUY_REQUEST_SELLER_RESPONSE_MS),
          items: { create: lineItems.map(({ listingId, quantity, unitPrice, subtotal }) => ({ listingId, quantity, unitPrice, subtotal })) },
        },
        include: { items: { include: { listing: { include: { medicine: true } } } }, seller: true },
      });

      await tx.cartItem.deleteMany({
        where: { userId: buyerId, listingId: { in: items.map((i) => i.listingId) } },
      });

      return created;
    });

    const seller = await prisma.pharmacy.findUnique({ where: { id: sellerId } });
    if (seller) {
      await notificationService.create({
        userId: seller.userId,
        type: NotificationType.BUY_REQUEST,
        title: 'New Buy Request',
        body: `New buy request ${request.requestNumber}`,
        data: { buyRequestId: request.id, role: 'seller' },
      });
    }

    return request;
  }

  async respond(sellerUserId: string, requestId: string, action: 'accept' | 'reject', sellerNote?: string) {
    const pharmacy = await getPharmacyForUser(sellerUserId);
    const buyRequest = await prisma.buyRequest.findFirst({
      where: { id: requestId, sellerId: pharmacy.id, status: BuyRequestStatus.PENDING },
      include: { items: { include: { listing: { include: { medicine: true } } } } },
    });

    if (!buyRequest) throw AppError.notFound('Buy request not found or already responded');

    if (!sellerCanRespondToBuyRequest(buyRequest)) {
      if (buyRequest.status === BuyRequestStatus.PENDING) {
        await prisma.buyRequest.update({
          where: { id: requestId },
          data: { status: BuyRequestStatus.EXPIRED },
        });
      }
      throw AppError.badRequest('Buy request has expired');
    }

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
      await chatSystemService.postBuyRequestStatusMessage(requestId, sellerUserId, 'REJECTED', buyRequest.requestNumber);
      return { buyRequest: updated };
    }

    for (const item of buyRequest.items) {
      if (item.quantity > item.listing.availableQty) {
        throw AppError.badRequest(`Insufficient stock for ${listingMedicineName(item)}`);
      }
    }

    const request = await prisma.$transaction(async (tx) => {
      const updatedRequest = await tx.buyRequest.update({
        where: { id: requestId },
        data: { status: BuyRequestStatus.ACCEPTED, sellerNote, respondedAt: new Date() },
      });

      for (const item of buyRequest.items) {
        const updated = await tx.listing.updateMany({
          where: { id: item.listingId, availableQty: { gte: item.quantity } },
          data: { availableQty: { decrement: item.quantity } },
        });
        if (updated.count === 0) {
          throw AppError.badRequest(`Insufficient stock for ${listingMedicineName(item)}`);
        }
      }

      return updatedRequest;
    });

    let order: Order & { items: Prisma.OrderItemGetPayload<object>[] };
    try {
      order = await prisma.order.create({
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
              medicineName: listingMedicineName(item),
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
    } catch (error) {
      await this.revertAcceptedBuyRequest(requestId, buyRequest.items);
      throw error;
    }

    await this.runAcceptSideEffects(buyRequest, requestId, sellerUserId, order);

    return { buyRequest: request, order };
  }

  async resend(buyerId: string, requestId: string) {
    const existing = await prisma.buyRequest.findFirst({
      where: { id: requestId, buyerId },
      include: { items: true },
    });
    if (!existing) throw AppError.notFound('Buy request not found');

    const status = await this.markExpiredIfNeeded(existing);
    if (status !== BuyRequestStatus.EXPIRED) {
      throw AppError.badRequest('Only expired buy requests can be resent');
    }

    return this.create(
      buyerId,
      existing.sellerId,
      existing.items.map((item) => ({ listingId: item.listingId, quantity: item.quantity })),
      existing.note ?? undefined,
    );
  }

  private async revertAcceptedBuyRequest(
    requestId: string,
    items: BuyRequestWithItems['items'],
  ) {
    await prisma.$transaction(async (tx) => {
      await tx.buyRequest.update({
        where: { id: requestId },
        data: { status: BuyRequestStatus.PENDING, sellerNote: null, respondedAt: null },
      });

      for (const item of items) {
        await tx.listing.update({
          where: { id: item.listingId },
          data: { availableQty: { increment: item.quantity } },
        });
      }
    });
  }

  private async runAcceptSideEffects(
    buyRequest: BuyRequestWithItems,
    requestId: string,
    sellerUserId: string,
    order: Order,
  ) {
    try {
      await notificationService.create({
        userId: buyRequest.buyerId,
        type: NotificationType.ORDER_UPDATE,
        title: 'Buy Request Accepted',
        body: `Order ${order.orderNumber} created`,
        data: { orderId: order.id, buyRequestId: requestId },
      });
    } catch (error) {
      logger.error('Buy request accept notification failed', {
        buyRequestId: requestId,
        orderId: order.id,
        error: error instanceof Error ? error.message : String(error),
      });
    }

    try {
      await chatSystemService.ensureOrderConversation(order.id, buyRequest.buyerId, sellerUserId);
      await chatSystemService.postBuyRequestStatusMessage(
        requestId,
        sellerUserId,
        'ACCEPTED',
        buyRequest.requestNumber,
      );
      await chatSystemService.postOrderStatusMessage(
        order.id,
        sellerUserId,
        OrderStatus.CONFIRMED,
        order.orderNumber,
      );
    } catch (error) {
      logger.error('Buy request accept chat side effects failed', {
        buyRequestId: requestId,
        orderId: order.id,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
}

export const buyRequestService = new BuyRequestService();
