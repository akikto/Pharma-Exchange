import { Response, NextFunction } from 'express';
import { Router } from 'express';
import { AuthRequest } from '../../shared/middleware/auth.middleware';
import { authenticate } from '../../shared/middleware/auth.middleware';
import { aiMatchService } from './aiMatch.service';

class AiMatchController {
  async list(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const role = req.query.role ? String(req.query.role) : undefined;
      res.json(await aiMatchService.getMatchesForUser(req.user!.userId, role));
    } catch (err) { next(err); }
  }
}

const ctrl = new AiMatchController();
const router = Router();

router.get('/', authenticate, ctrl.list.bind(ctrl));

export default router;
