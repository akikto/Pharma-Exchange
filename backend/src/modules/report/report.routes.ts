import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { Router } from 'express';
import { ReportStatus, ReportTargetType } from '@prisma/client';
import { AuthRequest } from '../../shared/middleware/auth.middleware';
import { authenticate } from '../../shared/middleware/auth.middleware';
import { validate } from '../../shared/middleware/validate.middleware';
import { reportService } from './report.service';

const submitSchema = z.object({
  targetType: z.nativeEnum(ReportTargetType),
  targetId: z.string().uuid(),
  reason: z.string().min(1),
  description: z.string().optional(),
});

class ReportController {
  async submit(req: AuthRequest, res: Response, next: NextFunction) {
    try { res.status(201).json(await reportService.submit(req.user!.userId, req.body)); } catch (err) { next(err); }
  }
}

const ctrl = new ReportController();
const router = Router();

router.post('/', authenticate, validate(submitSchema), ctrl.submit.bind(ctrl));

export default router;
