import { Router } from 'express';
import { z } from 'zod';
import { DosageForm } from '@prisma/client';
import prisma from '../lib/prisma';
import { paramId } from '../lib/params';
import { authenticate } from '../middleware/auth';

const router = Router();

const createMedicineSchema = z.object({
  name: z.string().min(1),
  genericName: z.string().optional(),
  brandName: z.string().optional(),
  company: z.string().min(1),
  dosageForm: z.nativeEnum(DosageForm),
  strength: z.string().optional(),
  packSize: z.string().min(1),
  category: z.string().min(1),
  scheduleClass: z.string().optional(),
  composition: z.string().optional(),
  imageUrl: z.string().url().optional(),
});

// GET /api/medicines
router.get('/', async (req, res, next) => {
  try {
    const { q, category, company, page = '1', limit = '20' } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const take = parseInt(limit as string);

    const where = {
      isActive: true,
      ...(q && {
        OR: [
          { name: { contains: q as string, mode: 'insensitive' as const } },
          { genericName: { contains: q as string, mode: 'insensitive' as const } },
          { brandName: { contains: q as string, mode: 'insensitive' as const } },
        ],
      }),
      ...(category && { category: category as string }),
      ...(company && { company: { contains: company as string, mode: 'insensitive' as const } }),
    };

    const [medicines, total] = await Promise.all([
      prisma.medicine.findMany({ where, skip, take, orderBy: { name: 'asc' } }),
      prisma.medicine.count({ where }),
    ]);

    res.json({
      data: medicines,
      pagination: { page: parseInt(page as string), limit: take, total },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/medicines/:id
router.get('/:id', async (req, res, next) => {
  try {
    const id = paramId(req.params.id);
    const medicine = await prisma.medicine.findUnique({ where: { id } });
    if (!medicine) {
      res.status(404).json({ error: 'Medicine not found' });
      return;
    }
    res.json(medicine);
  } catch (err) {
    next(err);
  }
});

// POST /api/medicines
router.post('/', authenticate, async (req, res, next) => {
  try {
    const data = createMedicineSchema.parse(req.body);
    const medicine = await prisma.medicine.create({ data });
    res.status(201).json(medicine);
  } catch (err) {
    next(err);
  }
});

export default router;
