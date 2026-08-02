import { Router, Response } from 'express';
import { z } from 'zod';
import { VerificationStatus } from '@prisma/client';
import prisma from '../lib/prisma';
import { paramId } from '../lib/params';
import { AuthRequest, authenticate } from '../middleware/auth';

const router = Router();

const registerPharmacySchema = z.object({
  name: z.string().min(2),
  licenseNumber: z.string().min(1),
  address: z.string().min(5),
  city: z.string().min(2),
  district: z.string().min(2),
  postalCode: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  description: z.string().optional(),
});

const documentSchema = z.object({
  type: z.enum(['PHARMACY_LICENSE', 'GST_CERTIFICATE', 'PAN_CARD', 'OTHER']),
  fileUrl: z.string().url(),
  fileName: z.string(),
});

// POST /api/pharmacies/register
router.post('/register', authenticate, async (req: AuthRequest, res: Response, next) => {
  try {
    const data = registerPharmacySchema.parse(req.body);

    const existing = await prisma.pharmacy.findUnique({ where: { userId: req.user!.userId } });
    if (existing) {
      res.status(409).json({ error: 'Pharmacy already registered for this account' });
      return;
    }

    const licenseTaken = await prisma.pharmacy.findUnique({
      where: { licenseNumber: data.licenseNumber },
    });
    if (licenseTaken) {
      res.status(409).json({ error: 'License number already registered' });
      return;
    }

    const pharmacy = await prisma.pharmacy.create({
      data: {
        userId: req.user!.userId,
        ...data,
        verificationStatus: VerificationStatus.PENDING,
      },
    });

    res.status(201).json(pharmacy);
  } catch (err) {
    next(err);
  }
});

// POST /api/pharmacies/documents
router.post('/documents', authenticate, async (req: AuthRequest, res: Response, next) => {
  try {
    const data = documentSchema.parse(req.body);

    const pharmacy = await prisma.pharmacy.findUnique({ where: { userId: req.user!.userId } });
    if (!pharmacy) {
      res.status(404).json({ error: 'Pharmacy not found. Register first.' });
      return;
    }

    const document = await prisma.pharmacyDocument.create({
      data: {
        pharmacyId: pharmacy.id,
        type: data.type,
        fileUrl: data.fileUrl,
        fileName: data.fileName,
      },
    });

    res.status(201).json(document);
  } catch (err) {
    next(err);
  }
});

// GET /api/pharmacies/me
router.get('/me', authenticate, async (req: AuthRequest, res: Response, next) => {
  try {
    const pharmacy = await prisma.pharmacy.findUnique({
      where: { userId: req.user!.userId },
      include: { documents: true },
    });

    if (!pharmacy) {
      res.status(404).json({ error: 'Pharmacy not found' });
      return;
    }

    res.json(pharmacy);
  } catch (err) {
    next(err);
  }
});

// GET /api/pharmacies/:id
router.get('/:id', async (req, res, next) => {
  try {
    const id = paramId(req.params.id);
    const pharmacy = await prisma.pharmacy.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        city: true,
        district: true,
        description: true,
        logoUrl: true,
        rating: true,
        ratingCount: true,
        verificationStatus: true,
        latitude: true,
        longitude: true,
        createdAt: true,
      },
    });

    if (!pharmacy) {
      res.status(404).json({ error: 'Pharmacy not found' });
      return;
    }

    res.json(pharmacy);
  } catch (err) {
    next(err);
  }
});

export default router;
