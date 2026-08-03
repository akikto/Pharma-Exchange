import { Response, NextFunction } from 'express';
import { Router } from 'express';
import { AuthRequest } from '../../shared/middleware/auth.middleware';
import { authenticate } from '../../shared/middleware/auth.middleware';
import { requireVerifiedPharmacy } from '../../shared/middleware/pharmacy.middleware';
import { validate } from '../../shared/middleware/validate.middleware';
import { paginationMeta } from '../../shared/utils/helpers';
import { bulkRequestService } from './bulkRequest.service';
import { bulkRequestListSchema, createBulkRequestSchema } from './bulkRequest.validation';

class BulkRequestController {
  async list(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { data, total, page, limit } = await bulkRequestService.list(req.user!.userId, req.query);
      res.json({ data, pagination: paginationMeta(page, limit, total) });
    } catch (err) { next(err); }
  }

  async getById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      res.json(await bulkRequestService.getById(req.user!.userId, req.params.id as string));
    } catch (err) { next(err); }
  }

  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await bulkRequestService.create(req.user!.userId, req.body);
      res.status(201).json(result);
    } catch (err) { next(err); }
  }
}

const ctrl = new BulkRequestController();
const router = Router();

router.get('/', authenticate, requireVerifiedPharmacy, validate(bulkRequestListSchema, 'query'), ctrl.list.bind(ctrl));
router.get('/:id', authenticate, requireVerifiedPharmacy, ctrl.getById.bind(ctrl));
router.post('/', authenticate, requireVerifiedPharmacy, validate(createBulkRequestSchema), ctrl.create.bind(ctrl));

export default router;
