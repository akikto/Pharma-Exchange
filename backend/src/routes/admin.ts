import { Router, Response } from 'express';
import { z } from 'zod';
import { ReportStatus, ReportTargetType, VerificationStatus } from '@prisma/client';
import prisma from '../lib/prisma';
import { paramId } from '../lib/params';
import { AuthRequest, authenticate, requireAdmin } from '../middleware/auth';

const router = Router();

router.use(authenticate, requireAdmin);

const verifyPharmacySchema = z.object({
  action: z.enum(['approve', 'reject']),
  rejectionReason: z.string().optional(),
});

const resolveReportSchema = z.object({
  status: z.enum(['RESOLVED', 'DISMISSED']),
  resolution: z.string().optional(),
});

// GET /api/admin/dashboard
router.get('/dashboard', async (_req, res, next) => {
  try {
    const [
      totalPharmacies,
      pendingVerifications,
      openReports,
      totalOrders,
      activeListings,
    ] = await Promise.all([
      prisma.pharmacy.count({ where: { verificationStatus: VerificationStatus.APPROVED } }),
      prisma.pharmacy.count({ where: { verificationStatus: { in: [VerificationStatus.PENDING, VerificationStatus.UNDER_REVIEW] } } }),
      prisma.report.count({ where: { status: ReportStatus.OPEN } }),
      prisma.order.count(),
      prisma.listing.count({ where: { status: 'ACTIVE' } }),
    ]);

    res.json({
      activePharmacies: totalPharmacies,
      pendingVerifications,
      openReports,
      totalOrders,
      activeListings,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/verifications
router.get('/verifications', async (req, res, next) => {
  try {
    const { status = 'PENDING', page = '1', limit = '20' } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const take = parseInt(limit as string);

    const where = { verificationStatus: status as VerificationStatus };

    const [pharmacies, total] = await Promise.all([
      prisma.pharmacy.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'asc' },
        include: {
          documents: true,
          user: { select: { id: true, email: true, phone: true, firstName: true, lastName: true } },
        },
      }),
      prisma.pharmacy.count({ where }),
    ]);

    res.json({ data: pharmacies, pagination: { page: parseInt(page as string), limit: take, total } });
  } catch (err) {
    next(err);
  }
});

// POST /api/admin/verifications/:id
router.post('/verifications/:id', async (req: AuthRequest, res: Response, next) => {
  try {
    const data = verifyPharmacySchema.parse(req.body);

    const id = paramId(req.params.id);
    const pharmacy = await prisma.pharmacy.findUnique({ where: { id } });
    if (!pharmacy) {
      res.status(404).json({ error: 'Pharmacy not found' });
      return;
    }

    const updated = await prisma.pharmacy.update({
      where: { id },
      data: {
        verificationStatus: data.action === 'approve' ? VerificationStatus.APPROVED : VerificationStatus.REJECTED,
        rejectionReason: data.action === 'reject' ? data.rejectionReason : null,
      },
    });

    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/reports
router.get('/reports', async (req, res, next) => {
  try {
    const { status = 'OPEN', page = '1', limit = '20' } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const take = parseInt(limit as string);

    const where = { status: status as ReportStatus };

    const [reports, total] = await Promise.all([
      prisma.report.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'asc' },
        include: { reporter: { select: { id: true, firstName: true, lastName: true } } },
      }),
      prisma.report.count({ where }),
    ]);

    res.json({ data: reports, pagination: { page: parseInt(page as string), limit: take, total } });
  } catch (err) {
    next(err);
  }
});

// POST /api/admin/reports/:id/resolve
router.post('/reports/:id/resolve', async (req: AuthRequest, res: Response, next) => {
  try {
    const data = resolveReportSchema.parse(req.body);

    const id = paramId(req.params.id);
    const report = await prisma.report.update({
      where: { id },
      data: {
        status: data.status as ReportStatus,
        resolution: data.resolution,
        reviewedById: req.user!.userId,
      },
    });

    res.json(report);
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/users
router.get('/users', async (req, res, next) => {
  try {
    const { page = '1', limit = '20', q } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const take = parseInt(limit as string);

    const where = q ? {
      OR: [
        { firstName: { contains: q as string, mode: 'insensitive' as const } },
        { lastName: { contains: q as string, mode: 'insensitive' as const } },
        { email: { contains: q as string, mode: 'insensitive' as const } },
        { phone: { contains: q as string } },
      ],
    } : {};

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true, email: true, phone: true, firstName: true, lastName: true,
          role: true, isActive: true, createdAt: true,
          pharmacy: { select: { id: true, name: true, verificationStatus: true } },
        },
      }),
      prisma.user.count({ where }),
    ]);

    res.json({ data: users, pagination: { page: parseInt(page as string), limit: take, total } });
  } catch (err) {
    next(err);
  }
});

export default router;
