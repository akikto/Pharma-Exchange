import { Router, Response } from 'express';
import { z } from 'zod';
import { NotificationType, OrderStatus } from '@prisma/client';
import prisma from '../lib/prisma';
import { paramId } from '../lib/params';
import { AuthRequest, authenticate } from '../middleware/auth';

const router = Router();

const updateStatusSchema = z.object({
  status: z.nativeEnum(OrderStatus),
  note: z.string().optional(),
});

// GET /api/orders
router.get('/', authenticate, async (req: AuthRequest, res: Response, next) => {
  try {
    const { role = 'buyer', status, page = '1', limit = '20' } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const take = parseInt(limit as string);

    const pharmacy = await prisma.pharmacy.findUnique({ where: { userId: req.user!.userId } });

    const where = role === 'seller' && pharmacy
      ? { sellerId: pharmacy.id, ...(status && { status: status as OrderStatus }) }
      : { buyerId: req.user!.userId, ...(status && { status: status as OrderStatus }) };

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          items: true,
          seller: { select: { id: true, name: true, city: true } },
          buyer: { select: { id: true, firstName: true, lastName: true } },
        },
      }),
      prisma.order.count({ where }),
    ]);

    res.json({ data: orders, pagination: { page: parseInt(page as string), limit: take, total } });
  } catch (err) {
    next(err);
  }
});

// GET /api/orders/:id
router.get('/:id', authenticate, async (req: AuthRequest, res: Response, next) => {
  try {
    const id = paramId(req.params.id);
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: { include: { listing: { include: { medicine: true } } } },
        seller: { select: { id: true, name: true, city: true, user: { select: { phone: true } } } },
        buyer: { select: { id: true, firstName: true, lastName: true, phone: true } },
        statusHistory: { orderBy: { createdAt: 'asc' } },
        review: true,
      },
    });

    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }

    res.json(order);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/orders/:id/status
router.patch('/:id/status', authenticate, async (req: AuthRequest, res: Response, next) => {
  try {
    const data = updateStatusSchema.parse(req.body);

    const pharmacy = await prisma.pharmacy.findUnique({ where: { userId: req.user!.userId } });
    if (!pharmacy) {
      res.status(403).json({ error: 'Pharmacy registration required' });
      return;
    }

    const id = paramId(req.params.id);
    const order = await prisma.order.findFirst({
      where: { id, sellerId: pharmacy.id },
    });
    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }

    const updated = await prisma.$transaction(async (tx) => {
      const result = await tx.order.update({
        where: { id: order.id },
        data: {
          status: data.status,
          ...(data.status === OrderStatus.DELIVERED && { deliveredAt: new Date() }),
          ...(data.status === OrderStatus.CANCELLED && { cancelledAt: new Date(), cancelReason: data.note }),
        },
        include: { statusHistory: true },
      });

      await tx.orderStatusHistory.create({
        data: { orderId: order.id, status: data.status, note: data.note },
      });

      await tx.notification.create({
        data: {
          userId: order.buyerId,
          type: NotificationType.ORDER_UPDATE,
          title: 'Order Status Updated',
          body: `Order ${order.orderNumber} is now ${data.status.toLowerCase()}`,
          data: { orderId: order.id, status: data.status },
        },
      });

      return result;
    });

    res.json(updated);
  } catch (err) {
    next(err);
  }
});

export default router;
