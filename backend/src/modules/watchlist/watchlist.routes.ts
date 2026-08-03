import { Response, NextFunction } from 'express';
import { Router } from 'express';
import { AuthRequest } from '../../shared/middleware/auth.middleware';
import { authenticate } from '../../shared/middleware/auth.middleware';
import { validate } from '../../shared/middleware/validate.middleware';
import { watchlistService } from './watchlist.service';
import { addWatchlistSchema } from './watchlist.validation';

class WatchlistController {
  async list(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      res.json({ data: await watchlistService.list(req.user!.userId) });
    } catch (err) { next(err); }
  }

  async getIds(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      res.json({ medicineIds: await watchlistService.getIds(req.user!.userId) });
    } catch (err) { next(err); }
  }

  async add(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const item = await watchlistService.add(req.user!.userId, req.body.medicineId);
      res.status(201).json(item);
    } catch (err) { next(err); }
  }

  async remove(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      res.json(await watchlistService.remove(req.user!.userId, req.params.medicineId as string));
    } catch (err) { next(err); }
  }
}

const ctrl = new WatchlistController();
const router = Router();

router.get('/', authenticate, ctrl.list.bind(ctrl));
router.get('/ids', authenticate, ctrl.getIds.bind(ctrl));
router.post('/', authenticate, validate(addWatchlistSchema), ctrl.add.bind(ctrl));
router.delete('/:medicineId', authenticate, ctrl.remove.bind(ctrl));

export default router;
