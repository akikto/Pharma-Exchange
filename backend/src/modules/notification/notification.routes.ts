import { Response, NextFunction } from 'express';
import { Router } from 'express';
import { AuthRequest } from '../../shared/middleware/auth.middleware';
import { authenticate } from '../../shared/middleware/auth.middleware';
import { notificationService } from './notification.service';
import { paginationMeta } from '../../shared/utils/helpers';
import { deleteNotificationsBulkSchema } from './notification.validation';
import { AppError } from '../../shared/errors/AppError';

class NotificationController {
  async list(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { unreadOnly, page = '1', limit = '20' } = req.query;
      const result = await notificationService.list(
        req.user!.userId, unreadOnly === 'true',
        parseInt(String(page)), parseInt(String(limit))
      );
      res.json({ data: result.data, unreadCount: result.unreadCount, pagination: paginationMeta(result.page, result.limit, result.total) });
    } catch (err) { next(err); }
  }

  async markRead(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await notificationService.markRead(req.user!.userId, req.params.id as string);
      res.json({ message: 'Marked as read' });
    } catch (err) { next(err); }
  }

  async markAllRead(req: AuthRequest, res: Response, next: NextFunction) {
    try { res.json(await notificationService.markAllRead(req.user!.userId)); } catch (err) { next(err); }
  }

  async deleteOne(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      res.json(await notificationService.deleteOne(req.user!.userId, req.params.id as string));
    } catch (err) { next(err); }
  }

  async deleteBulk(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const parsed = deleteNotificationsBulkSchema.safeParse(req.body);
      if (!parsed.success) throw AppError.badRequest('Invalid notification ids', parsed.error.flatten());
      res.json(await notificationService.deleteMany(req.user!.userId, parsed.data.ids));
    } catch (err) { next(err); }
  }

  async deleteAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      res.json(await notificationService.deleteAll(req.user!.userId));
    } catch (err) { next(err); }
  }
}

const ctrl = new NotificationController();
const router = Router();

router.get('/', authenticate, ctrl.list.bind(ctrl));
router.patch('/:id/read', authenticate, ctrl.markRead.bind(ctrl));
router.post('/read-all', authenticate, ctrl.markAllRead.bind(ctrl));
router.post('/delete-bulk', authenticate, ctrl.deleteBulk.bind(ctrl));
router.post('/delete-all', authenticate, ctrl.deleteAll.bind(ctrl));
router.delete('/:id', authenticate, ctrl.deleteOne.bind(ctrl));

export default router;
