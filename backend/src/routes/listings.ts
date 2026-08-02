import { Router, Response } from 'express';
import { z } from 'zod';
import { ListingStatus } from '@prisma/client';
import prisma from '../lib/prisma';
import { paramId } from '../lib/params';
import { AuthRequest, authenticate } from '../middleware/auth';

const router = Router();

const createListingSchema = z.object({
  medicineId: z.string().uuid(),
  batchNumber: z.string().min(1),
  mfgDate: z.string().datetime(),
  expiryDate: z.string().datetime(),
  purchasePrice: z.number().positive(),
  sellingPrice: z.number().positive(),
  discountPercent: z.number().min(0).max(100).default(0),
  availableQty: z.number().int().positive(),
  moq: z.number().int().positive().default(1),
  unit: z.string().default('strip'),
  imageUrl: z.string().url().optional(),
  status: z.nativeEnum(ListingStatus).default(ListingStatus.DRAFT),
});

function computeFinalPrice(sellingPrice: number, discountPercent: number): number {
  return sellingPrice * (1 - discountPercent / 100);
}

// GET /api/listings
router.get('/', async (req, res, next) => {
  try {
    const {
      q, category, minPrice, maxPrice, city, sortBy = 'createdAt',
      sortOrder = 'desc', page = '1', limit = '20', status = 'ACTIVE',
    } = req.query;

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const take = parseInt(limit as string);

    const where = {
      status: status as ListingStatus,
      ...(minPrice || maxPrice) && {
        finalPrice: {
          ...(minPrice && { gte: parseFloat(minPrice as string) }),
          ...(maxPrice && { lte: parseFloat(maxPrice as string) }),
        },
      },
      ...(city && { pharmacy: { city: { equals: city as string, mode: 'insensitive' as const } } }),
      ...(q || category) && {
        medicine: {
          isActive: true,
          ...(q && {
            OR: [
              { name: { contains: q as string, mode: 'insensitive' as const } },
              { genericName: { contains: q as string, mode: 'insensitive' as const } },
            ],
          }),
          ...(category && { category: category as string }),
        },
      },
    };

    const orderBy = sortBy === 'price'
      ? { finalPrice: sortOrder as 'asc' | 'desc' }
      : sortBy === 'expiry'
        ? { expiryDate: sortOrder as 'asc' | 'desc' }
        : { createdAt: sortOrder as 'asc' | 'desc' };

    const [listings, total] = await Promise.all([
      prisma.listing.findMany({
        where,
        skip,
        take,
        orderBy,
        include: {
          medicine: { select: { id: true, name: true, company: true, dosageForm: true, packSize: true, category: true } },
          pharmacy: { select: { id: true, name: true, city: true, rating: true, verificationStatus: true, latitude: true, longitude: true } },
        },
      }),
      prisma.listing.count({ where }),
    ]);

    res.json({
      data: listings,
      pagination: { page: parseInt(page as string), limit: take, total },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/listings/:id
router.get('/:id', async (req, res, next) => {
  try {
    const id = paramId(req.params.id);
    const listing = await prisma.listing.findUnique({
      where: { id },
      include: {
        medicine: true,
        pharmacy: {
          select: { id: true, name: true, city: true, district: true, rating: true, ratingCount: true, verificationStatus: true, logoUrl: true },
        },
      },
    });

    if (!listing) {
      res.status(404).json({ error: 'Listing not found' });
      return;
    }

    res.json(listing);
  } catch (err) {
    next(err);
  }
});

// POST /api/listings
router.post('/', authenticate, async (req: AuthRequest, res: Response, next) => {
  try {
    const data = createListingSchema.parse(req.body);

    const pharmacy = await prisma.pharmacy.findUnique({ where: { userId: req.user!.userId } });
    if (!pharmacy) {
      res.status(403).json({ error: 'Pharmacy registration required' });
      return;
    }

    const finalPrice = computeFinalPrice(data.sellingPrice, data.discountPercent);

    const listing = await prisma.listing.create({
      data: {
        pharmacyId: pharmacy.id,
        medicineId: data.medicineId,
        batchNumber: data.batchNumber,
        mfgDate: new Date(data.mfgDate),
        expiryDate: new Date(data.expiryDate),
        purchasePrice: data.purchasePrice,
        sellingPrice: data.sellingPrice,
        discountPercent: data.discountPercent,
        finalPrice,
        availableQty: data.availableQty,
        moq: data.moq,
        unit: data.unit,
        imageUrl: data.imageUrl,
        status: data.status,
      },
      include: { medicine: true },
    });

    res.status(201).json(listing);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/listings/:id
router.patch('/:id', authenticate, async (req: AuthRequest, res: Response, next) => {
  try {
    const pharmacy = await prisma.pharmacy.findUnique({ where: { userId: req.user!.userId } });
    if (!pharmacy) {
      res.status(403).json({ error: 'Pharmacy registration required' });
      return;
    }

    const id = paramId(req.params.id);
    const existing = await prisma.listing.findFirst({
      where: { id, pharmacyId: pharmacy.id },
    });
    if (!existing) {
      res.status(404).json({ error: 'Listing not found' });
      return;
    }

    const updateSchema = createListingSchema.partial();
    const data = updateSchema.parse(req.body);

    const finalPrice = data.sellingPrice !== undefined || data.discountPercent !== undefined
      ? computeFinalPrice(
          data.sellingPrice ?? Number(existing.sellingPrice),
          data.discountPercent ?? existing.discountPercent
        )
      : undefined;

    const listing = await prisma.listing.update({
      where: { id },
      data: {
        ...data,
        ...(data.mfgDate && { mfgDate: new Date(data.mfgDate) }),
        ...(data.expiryDate && { expiryDate: new Date(data.expiryDate) }),
        ...(finalPrice !== undefined && { finalPrice }),
      },
      include: { medicine: true },
    });

    res.json(listing);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/listings/:id
router.delete('/:id', authenticate, async (req: AuthRequest, res: Response, next) => {
  try {
    const pharmacy = await prisma.pharmacy.findUnique({ where: { userId: req.user!.userId } });
    if (!pharmacy) {
      res.status(403).json({ error: 'Pharmacy registration required' });
      return;
    }

    const id = paramId(req.params.id);
    const existing = await prisma.listing.findFirst({
      where: { id, pharmacyId: pharmacy.id },
    });
    if (!existing) {
      res.status(404).json({ error: 'Listing not found' });
      return;
    }

    await prisma.listing.update({
      where: { id },
      data: { status: ListingStatus.PAUSED },
    });

    res.json({ message: 'Listing paused' });
  } catch (err) {
    next(err);
  }
});

export default router;
