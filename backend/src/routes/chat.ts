import { Router, Response } from 'express';
import { z } from 'zod';
import { MessageType, NotificationType } from '@prisma/client';
import prisma from '../lib/prisma';
import { paramId } from '../lib/params';
import { AuthRequest, authenticate } from '../middleware/auth';

const router = Router();

const sendMessageSchema = z.object({
  content: z.string().min(1),
  type: z.nativeEnum(MessageType).default(MessageType.TEXT),
  mediaUrl: z.string().url().optional(),
});

const createConversationSchema = z.object({
  participantId: z.string().uuid(),
  orderId: z.string().uuid().optional(),
  listingId: z.string().uuid().optional(),
});

// GET /api/chat/conversations
router.get('/conversations', authenticate, async (req: AuthRequest, res: Response, next) => {
  try {
    const memberships = await prisma.conversationMember.findMany({
      where: { userId: req.user!.userId },
      include: {
        conversation: {
          include: {
            members: {
              include: { user: { select: { id: true, firstName: true, lastName: true } } },
            },
            messages: {
              orderBy: { createdAt: 'desc' },
              take: 1,
            },
          },
        },
      },
      orderBy: { conversation: { updatedAt: 'desc' } },
    });

    res.json(memberships.map((m) => m.conversation));
  } catch (err) {
    next(err);
  }
});

// POST /api/chat/conversations
router.post('/conversations', authenticate, async (req: AuthRequest, res: Response, next) => {
  try {
    const data = createConversationSchema.parse(req.body);

    const conversation = await prisma.conversation.create({
      data: {
        orderId: data.orderId,
        listingId: data.listingId,
        members: {
          create: [
            { userId: req.user!.userId },
            { userId: data.participantId },
          ],
        },
      },
      include: { members: { include: { user: { select: { id: true, firstName: true, lastName: true } } } } },
    });

    res.status(201).json(conversation);
  } catch (err) {
    next(err);
  }
});

// GET /api/chat/conversations/:id/messages
router.get('/conversations/:id/messages', authenticate, async (req: AuthRequest, res: Response, next) => {
  try {
    const { page = '1', limit = '50' } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const take = parseInt(limit as string);

    const conversationId = paramId(req.params.id);
    const member = await prisma.conversationMember.findUnique({
      where: { conversationId_userId: { conversationId, userId: req.user!.userId } },
    });
    if (!member) {
      res.status(403).json({ error: 'Not a member of this conversation' });
      return;
    }

    const [messages, total] = await Promise.all([
      prisma.message.findMany({
        where: { conversationId },
        skip,
        take,
        orderBy: { createdAt: 'asc' },
        include: { sender: { select: { id: true, firstName: true, lastName: true } } },
      }),
      prisma.message.count({ where: { conversationId } }),
    ]);

    res.json({ data: messages, pagination: { page: parseInt(page as string), limit: take, total } });
  } catch (err) {
    next(err);
  }
});

// POST /api/chat/conversations/:id/messages
router.post('/conversations/:id/messages', authenticate, async (req: AuthRequest, res: Response, next) => {
  try {
    const data = sendMessageSchema.parse(req.body);

    const conversationId = paramId(req.params.id);
    const member = await prisma.conversationMember.findUnique({
      where: { conversationId_userId: { conversationId, userId: req.user!.userId } },
    });
    if (!member) {
      res.status(403).json({ error: 'Not a member of this conversation' });
      return;
    }

    const message = await prisma.$transaction(async (tx) => {
      const msg = await tx.message.create({
        data: {
          conversationId,
          senderId: req.user!.userId,
          content: data.content,
          type: data.type,
          mediaUrl: data.mediaUrl,
        },
        include: { sender: { select: { id: true, firstName: true, lastName: true } } },
      });

      await tx.conversation.update({
        where: { id: conversationId },
        data: { updatedAt: new Date() },
      });

      const otherMembers = await tx.conversationMember.findMany({
        where: { conversationId, userId: { not: req.user!.userId } },
      });

      for (const m of otherMembers) {
        await tx.notification.create({
          data: {
            userId: m.userId,
            type: NotificationType.CHAT_MESSAGE,
            title: 'New Message',
            body: data.content.slice(0, 100),
            data: { conversationId, messageId: msg.id },
          },
        });
      }

      return msg;
    });

    res.status(201).json(message);
  } catch (err) {
    next(err);
  }
});

export default router;
