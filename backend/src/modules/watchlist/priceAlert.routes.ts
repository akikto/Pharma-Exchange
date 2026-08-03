import { Response, NextFunction } from 'express';
import { Router } from 'express';
import { AuthRequest } from '../../shared/middleware/auth.middleware';
import { authenticate } from '../../shared/middleware/auth.middleware';
import { validate } from '../../shared/middleware/validate.middleware';
import { priceAlertService } from './priceAlert.service';
import {
  upsertPriceAlertSchema,
  updatePriceAlertSchema,
  simulateAlertSchema,
} from './watchlist.validation';

class PriceAlertController {
  async list(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      res.json({ data: await priceAlertService.list(req.user!.userId) });
    } catch (err) { next(err); }
  }

  async upsert(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { medicineId, maxPrice } = req.body;
      res.json(await priceAlertService.upsert(req.user!.userId, medicineId, maxPrice));
    } catch (err) { next(err); }
  }

  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      res.json(await priceAlertService.update(req.user!.userId, req.params.id as string, req.body));
    } catch (err) { next(err); }
  }

  async remove(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      res.json(await priceAlertService.remove(req.user!.userId, req.params.id as string));
    } catch (err) { next(err); }
  }

  async listTriggered(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      res.json({ data: await priceAlertService.listTriggered(req.user!.userId) });
    } catch (err) { next(err); }
  }

  async dismiss(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      res.json(await priceAlertService.dismiss(req.user!.userId, req.params.id as string));
    } catch (err) { next(err); }
  }

  async simulate(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { medicineId, listingPrice } = req.body;
      res.status(201).json(await priceAlertService.simulate(req.user!.userId, medicineId, listingPrice));
    } catch (err) { next(err); }
  }
}

const ctrl = new PriceAlertController();
const router = Router();

router.get('/', authenticate, ctrl.list.bind(ctrl));
router.post('/', authenticate, validate(upsertPriceAlertSchema), ctrl.upsert.bind(ctrl));
router.patch('/:id', authenticate, validate(updatePriceAlertSchema), ctrl.update.bind(ctrl));
router.delete('/:id', authenticate, ctrl.remove.bind(ctrl));

router.get('/triggered', authenticate, ctrl.listTriggered.bind(ctrl));
router.post('/triggered/simulate', authenticate, validate(simulateAlertSchema), ctrl.simulate.bind(ctrl));
router.post('/triggered/:id/dismiss', authenticate, ctrl.dismiss.bind(ctrl));

export default router;
