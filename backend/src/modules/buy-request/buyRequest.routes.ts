import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { Router } from 'express';
import { AuthRequest } from '../../shared/middleware/auth.middleware';
import { authenticate } from '../../shared/middleware/auth.middleware';
import { validate } from '../../shared/middleware/validate.middleware';
import { buyRequestService } from './buyRequest.service';
import { paginationMeta } from '../../shared/utils/helpers';

const createSchema = z.object({
  sellerId: z.string().uuid(),
  listingIds: z.array(z.object({ listingId: z.string().uuid(), quantity: z.number().int().positive() })).min(1),
  note: z.string().optional(),
});

const respondSchema = z.object({
  action: z.enum(['accept', 'reject']),
  sellerNote: z.string().optional(),
});

class BuyRequestController {
  async list(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { role = 'buyer', status, page = '1', limit = '20' } = req.query;
      const result = await buyRequestService.list(
        req.user!.userId, String(role), status as never,
        parseInt(String(page)), parseInt(String(limit))
      );
      res.json({ data: result.data, pagination: paginationMeta(result.page, result.limit, result.total) });
    } catch (err) { next(err); }
  }

  async getById(req: AuthRequest, res: Response, next: NextFunction) {
    try { res.json(await buyRequestService.getById(req.params.id as string, req.user!.userId)); } catch (err) { next(err); }
  }

  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { sellerId, listingIds, note } = req.body;
      const result = await buyRequestService.create(req.user!.userId, sellerId, listingIds, note);
      res.status(201).json(result);
    } catch (err) { next(err); }
  }

  async respond(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { action, sellerNote } = req.body;
      res.json(await buyRequestService.respond(req.user!.userId, req.params.id as string, action, sellerNote));
    } catch (err) { next(err); }
  }
}

const ctrl = new BuyRequestController();
const router = Router();

router.get('/', authenticate, ctrl.list.bind(ctrl));
router.get('/:id', authenticate, ctrl.getById.bind(ctrl));
router.post('/', authenticate, validate(createSchema), ctrl.create.bind(ctrl));
router.post('/:id/respond', authenticate, validate(respondSchema), ctrl.respond.bind(ctrl));

export default router;
