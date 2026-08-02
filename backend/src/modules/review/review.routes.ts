import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { Router } from 'express';
import { AuthRequest } from '../../shared/middleware/auth.middleware';
import { authenticate } from '../../shared/middleware/auth.middleware';
import { validate } from '../../shared/middleware/validate.middleware';
import { reviewService } from './review.service';
import { paginationMeta } from '../../shared/utils/helpers';

const createSchema = z.object({
  orderId: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().optional(),
});

class ReviewController {
  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { orderId, rating, comment } = req.body;
      res.status(201).json(await reviewService.create(req.user!.userId, orderId, rating, comment));
    } catch (err) { next(err); }
  }

  async getPharmacyReviews(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { page = '1', limit = '20' } = req.query;
      const result = await reviewService.getPharmacyReviews(req.params.pharmacyId as string, parseInt(String(page)), parseInt(String(limit)));
      res.json({ data: result.data, pagination: paginationMeta(result.page, result.limit, result.total) });
    } catch (err) { next(err); }
  }
}

const ctrl = new ReviewController();
const router = Router();

router.post('/', authenticate, validate(createSchema), ctrl.create.bind(ctrl));
router.get('/pharmacy/:pharmacyId', ctrl.getPharmacyReviews.bind(ctrl));

export default router;
