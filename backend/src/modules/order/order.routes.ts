import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { Router } from 'express';
import { OrderStatus } from '@prisma/client';
import { AuthRequest } from '../../shared/middleware/auth.middleware';
import { authenticate } from '../../shared/middleware/auth.middleware';
import { validate } from '../../shared/middleware/validate.middleware';
import { orderService } from './order.service';
import { paginationMeta } from '../../shared/utils/helpers';

const statusSchema = z.object({ status: z.nativeEnum(OrderStatus), note: z.string().optional() });
const cancelSchema = z.object({ reason: z.string().optional() });

class OrderController {
  async list(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { role = 'buyer', status, page = '1', limit = '20' } = req.query;
      const result = await orderService.list(req.user!.userId, String(role), status as OrderStatus, parseInt(String(page)), parseInt(String(limit)));
      res.json({ data: result.data, pagination: paginationMeta(result.page, result.limit, result.total) });
    } catch (err) { next(err); }
  }

  async getById(req: AuthRequest, res: Response, next: NextFunction) {
    try { res.json(await orderService.getById(req.params.id as string, req.user!.userId)); } catch (err) { next(err); }
  }

  async updateStatus(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { status, note } = req.body;
      res.json(await orderService.updateStatus(req.user!.userId, req.params.id as string, status, note));
    } catch (err) { next(err); }
  }

  async cancel(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      res.json(await orderService.cancel(req.user!.userId, req.params.id as string, req.body.reason));
    } catch (err) { next(err); }
  }
}

const ctrl = new OrderController();
const router = Router();

router.get('/', authenticate, ctrl.list.bind(ctrl));
router.get('/:id', authenticate, ctrl.getById.bind(ctrl));
router.patch('/:id/status', authenticate, validate(statusSchema), ctrl.updateStatus.bind(ctrl));
router.post('/:id/cancel', authenticate, validate(cancelSchema), ctrl.cancel.bind(ctrl));

export default router;
