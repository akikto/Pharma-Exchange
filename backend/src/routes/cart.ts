import { Router, Response } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { paramId } from '../lib/params';
import { AuthRequest, authenticate } from '../middleware/auth';

const router = Router();

const addToCartSchema = z.object({
  listingId: z.string().uuid(),
  quantity: z.number().int().positive(),
});

const updateCartSchema = z.object({
  quantity: z.number().int().positive(),
});

// GET /api/cart
router.get('/', authenticate, async (req: AuthRequest, res: Response, next) => {
  try {
    const items = await prisma.cartItem.findMany({
      where: { userId: req.user!.userId },
      include: {
        listing: {
          include: {
            medicine: { select: { id: true, name: true, company: true, packSize: true } },
            pharmacy: { select: { id: true, name: true, city: true } },
          },
        },
      },
      orderBy: { listing: { pharmacy: { name: 'asc' } } },
    });

    const grouped = items.reduce<Record<string, typeof items>>((acc, item) => {
      const sellerId = item.listing.pharmacy.id;
      if (!acc[sellerId]) acc[sellerId] = [];
      acc[sellerId].push(item);
      return acc;
    }, {});

    res.json({ items, groupedBySeller: grouped });
  } catch (err) {
    next(err);
  }
});

// POST /api/cart
router.post('/', authenticate, async (req: AuthRequest, res: Response, next) => {
  try {
    const data = addToCartSchema.parse(req.body);

    const listing = await prisma.listing.findUnique({ where: { id: data.listingId } });
    if (!listing || listing.status !== 'ACTIVE') {
      res.status(404).json({ error: 'Listing not available' });
      return;
    }
    if (data.quantity < listing.moq) {
      res.status(400).json({ error: `Minimum order quantity is ${listing.moq}` });
      return;
    }
    if (data.quantity > listing.availableQty) {
      res.status(400).json({ error: 'Insufficient stock' });
      return;
    }

    const item = await prisma.cartItem.upsert({
      where: { userId_listingId: { userId: req.user!.userId, listingId: data.listingId } },
      create: { userId: req.user!.userId, listingId: data.listingId, quantity: data.quantity },
      update: { quantity: data.quantity },
      include: { listing: { include: { medicine: true, pharmacy: true } } },
    });

    res.status(201).json(item);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/cart/:id
router.patch('/:id', authenticate, async (req: AuthRequest, res: Response, next) => {
  try {
    const data = updateCartSchema.parse(req.body);

    const id = paramId(req.params.id);
    const existing = await prisma.cartItem.findFirst({
      where: { id, userId: req.user!.userId },
      include: { listing: true },
    });
    if (!existing) {
      res.status(404).json({ error: 'Cart item not found' });
      return;
    }

    if (data.quantity < existing.listing.moq) {
      res.status(400).json({ error: `Minimum order quantity is ${existing.listing.moq}` });
      return;
    }

    const item = await prisma.cartItem.update({
      where: { id },
      data: { quantity: data.quantity },
      include: { listing: { include: { medicine: true, pharmacy: true } } },
    });

    res.json(item);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/cart/:id
router.delete('/:id', authenticate, async (req: AuthRequest, res: Response, next) => {
  try {
    const id = paramId(req.params.id);
    const existing = await prisma.cartItem.findFirst({
      where: { id, userId: req.user!.userId },
    });
    if (!existing) {
      res.status(404).json({ error: 'Cart item not found' });
      return;
    }

    await prisma.cartItem.delete({ where: { id } });
    res.json({ message: 'Item removed from cart' });
  } catch (err) {
    next(err);
  }
});

export default router;
