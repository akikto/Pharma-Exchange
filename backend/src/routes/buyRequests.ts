import { Router, Response } from 'express';
import { z } from 'zod';
import { BuyRequestStatus, ListingStatus, NotificationType, OrderStatus } from '@prisma/client';
import prisma from '../lib/prisma';
import { generateOrderNumber, generateRequestNumber } from '../lib/auth';
import { paramId } from '../lib/params';
import { AuthRequest, authenticate } from '../middleware/auth';

const router = Router();

const createBuyRequestSchema = z.object({
  sellerId: z.string().uuid(),
  listingIds: z.array(z.object({
    listingId: z.string().uuid(),
    quantity: z.number().int().positive(),
  })).min(1),
  note: z.string().optional(),
});

const respondSchema = z.object({
  action: z.enum(['accept', 'reject']),
  sellerNote: z.string().optional(),
});

// GET /api/buy-requests
router.get('/', authenticate, async (req: AuthRequest, res: Response, next) => {
  try {
    const { role = 'buyer', status, page = '1', limit = '20' } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const take = parseInt(limit as string);

    const pharmacy = await prisma.pharmacy.findUnique({ where: { userId: req.user!.userId } });

    const where = role === 'seller' && pharmacy
      ? { sellerId: pharmacy.id, ...(status && { status: status as BuyRequestStatus }) }
      : { buyerId: req.user!.userId, ...(status && { status: status as BuyRequestStatus }) };

    const [requests, total] = await Promise.all([
      prisma.buyRequest.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          items: { include: { listing: { include: { medicine: true } } } },
          buyer: { select: { id: true, firstName: true, lastName: true } },
          seller: { select: { id: true, name: true, city: true } },
        },
      }),
      prisma.buyRequest.count({ where }),
    ]);

    res.json({ data: requests, pagination: { page: parseInt(page as string), limit: take, total } });
  } catch (err) {
    next(err);
  }
});

// GET /api/buy-requests/:id
router.get('/:id', authenticate, async (req: AuthRequest, res: Response, next) => {
  try {
    const id = paramId(req.params.id);
    const request = await prisma.buyRequest.findUnique({
      where: { id },
      include: {
        items: { include: { listing: { include: { medicine: true } } } },
        buyer: { select: { id: true, firstName: true, lastName: true, phone: true } },
        seller: { select: { id: true, name: true, city: true, userId: true } },
        order: true,
      },
    });

    if (!request) {
      res.status(404).json({ error: 'Buy request not found' });
      return;
    }

    res.json(request);
  } catch (err) {
    next(err);
  }
});

// POST /api/buy-requests
router.post('/', authenticate, async (req: AuthRequest, res: Response, next) => {
  try {
    const data = createBuyRequestSchema.parse(req.body);

    const listings = await prisma.listing.findMany({
      where: {
        id: { in: data.listingIds.map((i) => i.listingId) },
        pharmacyId: data.sellerId,
        status: ListingStatus.ACTIVE,
      },
    });

    if (listings.length !== data.listingIds.length) {
      res.status(400).json({ error: 'One or more listings are unavailable' });
      return;
    }

    let totalAmount = 0;
    const items = data.listingIds.map((item) => {
      const listing = listings.find((l) => l.id === item.listingId)!;
      if (item.quantity < listing.moq) {
        throw new Error(`MOQ for ${listing.id} is ${listing.moq}`);
      }
      const subtotal = Number(listing.finalPrice) * item.quantity;
      totalAmount += subtotal;
      return {
        listingId: item.listingId,
        quantity: item.quantity,
        unitPrice: listing.finalPrice,
        subtotal,
      };
    });

    const buyRequest = await prisma.$transaction(async (tx) => {
      const request = await tx.buyRequest.create({
        data: {
          requestNumber: generateRequestNumber(),
          buyerId: req.user!.userId,
          sellerId: data.sellerId,
          totalAmount,
          note: data.note,
          expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
          items: { create: items },
        },
        include: {
          items: { include: { listing: { include: { medicine: true } } } },
          seller: true,
        },
      });

      await tx.cartItem.deleteMany({
        where: {
          userId: req.user!.userId,
          listingId: { in: data.listingIds.map((i) => i.listingId) },
        },
      });

      const seller = await tx.pharmacy.findUnique({ where: { id: data.sellerId } });
      if (seller) {
        await tx.notification.create({
          data: {
            userId: seller.userId,
            type: NotificationType.BUY_REQUEST,
            title: 'New Buy Request',
            body: `You have a new buy request (${request.requestNumber})`,
            data: { buyRequestId: request.id },
          },
        });
      }

      return request;
    });

    res.status(201).json(buyRequest);
  } catch (err) {
    next(err);
  }
});

// POST /api/buy-requests/:id/respond
router.post('/:id/respond', authenticate, async (req: AuthRequest, res: Response, next) => {
  try {
    const data = respondSchema.parse(req.body);

    const pharmacy = await prisma.pharmacy.findUnique({ where: { userId: req.user!.userId } });
    if (!pharmacy) {
      res.status(403).json({ error: 'Pharmacy registration required' });
      return;
    }

    const id = paramId(req.params.id);
    const buyRequest = await prisma.buyRequest.findFirst({
      where: { id, sellerId: pharmacy.id, status: BuyRequestStatus.PENDING },
      include: { items: { include: { listing: true } } },
    });

    if (!buyRequest) {
      res.status(404).json({ error: 'Buy request not found or already responded' });
      return;
    }

    if (data.action === 'reject') {
      const updated = await prisma.$transaction(async (tx) => {
        const request = await tx.buyRequest.update({
          where: { id: buyRequest.id },
          data: {
            status: BuyRequestStatus.REJECTED,
            sellerNote: data.sellerNote,
            respondedAt: new Date(),
          },
        });

        await tx.notification.create({
          data: {
            userId: buyRequest.buyerId,
            type: NotificationType.BUY_REQUEST,
            title: 'Buy Request Rejected',
            body: `Your buy request ${buyRequest.requestNumber} was rejected`,
            data: { buyRequestId: buyRequest.id },
          },
        });

        return request;
      });

      res.json(updated);
      return;
    }

    // Accept: validate stock and create order
    for (const item of buyRequest.items) {
      if (item.quantity > item.listing.availableQty) {
        res.status(400).json({ error: `Insufficient stock for listing ${item.listingId}` });
        return;
      }
    }

    const result = await prisma.$transaction(async (tx) => {
      const request = await tx.buyRequest.update({
        where: { id: buyRequest.id },
        data: {
          status: BuyRequestStatus.ACCEPTED,
          sellerNote: data.sellerNote,
          respondedAt: new Date(),
        },
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
          buyRequestId: buyRequest.id,
          buyerId: buyRequest.buyerId,
          sellerId: buyRequest.sellerId,
          totalAmount: buyRequest.totalAmount,
          status: OrderStatus.CONFIRMED,
          items: {
            create: buyRequest.items.map((item) => ({
              listingId: item.listingId,
              medicineName: '',
              batchNumber: item.listing.batchNumber,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              subtotal: item.subtotal,
            })),
          },
          statusHistory: { create: { status: OrderStatus.CONFIRMED, note: 'Order created from accepted buy request' } },
        },
        include: { items: true },
      });

      await tx.notification.create({
        data: {
          userId: buyRequest.buyerId,
          type: NotificationType.ORDER_UPDATE,
          title: 'Buy Request Accepted',
          body: `Your buy request was accepted. Order ${order.orderNumber} created.`,
          data: { orderId: order.id, buyRequestId: buyRequest.id },
        },
      });

      return { buyRequest: request, order };
    });

    res.json(result);
  } catch (err) {
    next(err);
  }
});

export default router;
