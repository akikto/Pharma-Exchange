import { Response, NextFunction } from 'express';
import { Router } from 'express';
import { z } from 'zod';
import { ReportStatus, PaymentAttemptStatus } from '@prisma/client';
import { AuthRequest } from '../../shared/middleware/auth.middleware';
import { authenticate, requireAdmin } from '../../shared/middleware/auth.middleware';
import { validate } from '../../shared/middleware/validate.middleware';
import { analyticsService } from '../analytics/analytics.service';
import { pharmacyService } from '../pharmacy/pharmacy.service';
import { reportService } from '../report/report.service';
import { paginationMeta } from '../../shared/utils/helpers';
import prisma from '../../config/database';
import { notificationService } from '../notification';
import { broadcastSchema } from '../notification/notification.validation';
import { adminBannerRouter } from '../banner/banner.routes';

const verifySchema = z.object({
  action: z.enum(['approve', 'reject']),
  rejectionReason: z.string().optional(),
});

const resolveSchema = z.object({
  status: z.enum(['RESOLVED', 'DISMISSED']),
  resolution: z.string().optional(),
});

class AnalyticsController {
  async getSellerAnalytics(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await analyticsService.getSellerAnalytics(req.user!.userId);
      res.json(data);
    } catch (err) { next(err); }
  }
}

class AdminController {
  async dashboard(_req: AuthRequest, res: Response, next: NextFunction) {
    try { res.json(await analyticsService.getPlatformAnalytics()); } catch (err) { next(err); }
  }

  async verifications(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { status = 'PENDING', page = '1', limit = '20' } = req.query;
      const p = parseInt(String(page)), l = parseInt(String(limit));
      const result = await pharmacyService.getVerificationQueue(status as never, p, l, (p - 1) * l);
      res.json({ data: result.data, pagination: paginationMeta(p, l, result.total) });
    } catch (err) { next(err); }
  }

  async verifyPharmacy(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { action, rejectionReason } = req.body;
      res.json(await pharmacyService.adminVerify(req.params.id as string, action, rejectionReason));
    } catch (err) { next(err); }
  }

  async reports(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { status = 'OPEN', page = '1', limit = '20' } = req.query;
      const p = parseInt(String(page)), l = parseInt(String(limit));
      const result = await reportService.list(status as ReportStatus, p, l);
      res.json({ data: result.data, pagination: paginationMeta(p, l, result.total) });
    } catch (err) { next(err); }
  }

  async resolveReport(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { status, resolution } = req.body;
      res.json(await reportService.resolve(req.params.id as string, req.user!.userId, status as ReportStatus, resolution));
    } catch (err) { next(err); }
  }

  async broadcastNotification(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { title, body, userIds, data } = req.body;
      const result = await notificationService.broadcast({ title, body, userIds, data });
      res.json({ message: 'Broadcast sent', ...result });
    } catch (err) { next(err); }
  }

  async users(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { page = '1', limit = '20', q } = req.query;
      const p = parseInt(String(page)), l = parseInt(String(limit)), skip = (p - 1) * l;
      const where = q ? {
        OR: [
          { firstName: { contains: String(q), mode: 'insensitive' as const } },
          { lastName: { contains: String(q), mode: 'insensitive' as const } },
          { email: { contains: String(q), mode: 'insensitive' as const } },
          { phone: { contains: String(q) } },
        ],
      } : {};
      const [data, total] = await Promise.all([
        prisma.user.findMany({
          where, skip, take: l, orderBy: { createdAt: 'desc' },
          select: {
            id: true, email: true, phone: true, firstName: true, lastName: true,
            role: true, isActive: true, createdAt: true,
            pharmacy: { select: { id: true, name: true, verificationStatus: true } },
          },
        }),
        prisma.user.count({ where }),
      ]);
      res.json({ data, pagination: paginationMeta(p, l, total) });
    } catch (err) { next(err); }
  }

  async payments(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { page = '1', limit = '20', status } = req.query;
      const p = parseInt(String(page)), l = parseInt(String(limit));
      const result = await paymentsService.listForAdmin(
        p,
        l,
        status ? (String(status) as PaymentAttemptStatus) : undefined,
      );
      res.json({ data: result.data, pagination: paginationMeta(p, l, result.total) });
    } catch (err) { next(err); }
  }
}

const analyticsCtrl = new AnalyticsController();
const adminCtrl = new AdminController();

const analyticsRouter = Router();
analyticsRouter.get('/seller', authenticate, analyticsCtrl.getSellerAnalytics.bind(analyticsCtrl));

const adminRouter = Router();
adminRouter.use(authenticate, requireAdmin);
adminRouter.get('/dashboard', adminCtrl.dashboard.bind(adminCtrl));
adminRouter.get('/verifications', adminCtrl.verifications.bind(adminCtrl));
adminRouter.post('/verifications/:id', validate(verifySchema), adminCtrl.verifyPharmacy.bind(adminCtrl));
adminRouter.get('/reports', adminCtrl.reports.bind(adminCtrl));
adminRouter.post('/reports/:id/resolve', validate(resolveSchema), adminCtrl.resolveReport.bind(adminCtrl));
adminRouter.get('/users', adminCtrl.users.bind(adminCtrl));
adminRouter.get('/payments', adminCtrl.payments.bind(adminCtrl));
adminRouter.post('/notifications/broadcast', validate(broadcastSchema), adminCtrl.broadcastNotification.bind(adminCtrl));
adminRouter.use('/banners', adminBannerRouter);

export { analyticsRouter, adminRouter };
