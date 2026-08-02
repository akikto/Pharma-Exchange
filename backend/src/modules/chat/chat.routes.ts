import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { Router } from 'express';
import { MessageType } from '@prisma/client';
import { AuthRequest } from '../../shared/middleware/auth.middleware';
import { authenticate } from '../../shared/middleware/auth.middleware';
import { validate } from '../../shared/middleware/validate.middleware';
import { chatService } from './chat.service';
import { paginationMeta } from '../../shared/utils/helpers';
import { getSocketServer } from '../../socket/io';

const createConvSchema = z.object({
  participantId: z.string().uuid(),
  orderId: z.string().uuid().optional(),
  listingId: z.string().uuid().optional(),
});

const sendMsgSchema = z.object({
  content: z.string().min(1),
  type: z.nativeEnum(MessageType).default(MessageType.TEXT),
  mediaUrl: z.string().url().optional(),
});

class ChatController {
  async getConversations(req: AuthRequest, res: Response, next: NextFunction) {
    try { res.json(await chatService.getConversations(req.user!.userId)); } catch (err) { next(err); }
  }

  async createConversation(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { participantId, orderId, listingId } = req.body;
      res.status(201).json(await chatService.createConversation(req.user!.userId, participantId, orderId, listingId));
    } catch (err) { next(err); }
  }

  async getMessages(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { page = '1', limit = '50' } = req.query;
      const result = await chatService.getMessages(req.user!.userId, req.params.id as string, parseInt(String(page)), parseInt(String(limit)));
      res.json({ data: result.data, pagination: paginationMeta(result.page, result.limit, result.total) });
    } catch (err) { next(err); }
  }

  async sendMessage(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { content, type, mediaUrl } = req.body;
      const message = await chatService.sendMessage(req.user!.userId, req.params.id as string, content, type, mediaUrl);
      getSocketServer()?.to(`conversation:${req.params.id}`).emit('message:new', message);
      res.status(201).json(message);
    } catch (err) { next(err); }
  }

  async markAsRead(req: AuthRequest, res: Response, next: NextFunction) {
    try { res.json(await chatService.markAsRead(req.user!.userId, req.params.id as string)); } catch (err) { next(err); }
  }
}

const ctrl = new ChatController();
const router = Router();

router.get('/conversations', authenticate, ctrl.getConversations.bind(ctrl));
router.post('/conversations', authenticate, validate(createConvSchema), ctrl.createConversation.bind(ctrl));
router.get('/conversations/:id/messages', authenticate, ctrl.getMessages.bind(ctrl));
router.post('/conversations/:id/messages', authenticate, validate(sendMsgSchema), ctrl.sendMessage.bind(ctrl));
router.post('/conversations/:id/read', authenticate, ctrl.markAsRead.bind(ctrl));

export default router;
