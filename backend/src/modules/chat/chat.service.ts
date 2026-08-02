import { MessageType, NotificationType } from '@prisma/client';
import prisma from '../../config/database';
import { AppError } from '../../shared/errors/AppError';
import { parsePagination } from '../../shared/utils/helpers';
import { NotificationService } from '../notification/notification.service';

const notificationService = new NotificationService();

export class ChatService {
  async getConversations(userId: string) {
    const memberships = await prisma.conversationMember.findMany({
      where: { userId },
      include: {
        conversation: {
          include: {
            members: { include: { user: { select: { id: true, firstName: true, lastName: true } } } },
            messages: { orderBy: { createdAt: 'desc' }, take: 1 },
          },
        },
      },
      orderBy: { conversation: { updatedAt: 'desc' } },
    });
    return memberships.map((m) => m.conversation);
  }

  async createConversation(userId: string, participantId: string, orderId?: string, listingId?: string) {
    const existing = await prisma.conversation.findFirst({
      where: {
        AND: [
          { members: { some: { userId } } },
          { members: { some: { userId: participantId } } },
          ...(orderId ? [{ orderId }] : []),
        ],
      },
      include: { members: { include: { user: { select: { id: true, firstName: true, lastName: true } } } } },
    });

    if (existing) return existing;

    return prisma.conversation.create({
      data: {
        orderId, listingId,
        members: { create: [{ userId }, { userId: participantId }] },
      },
      include: { members: { include: { user: { select: { id: true, firstName: true, lastName: true } } } } },
    });
  }

  async getMessages(userId: string, conversationId: string, page: number, limit: number) {
    const member = await prisma.conversationMember.findUnique({
      where: { conversationId_userId: { conversationId, userId } },
    });
    if (!member) throw AppError.forbidden('Not a member of this conversation');

    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      prisma.message.findMany({
        where: { conversationId },
        skip, take: limit, orderBy: { createdAt: 'asc' },
        include: { sender: { select: { id: true, firstName: true, lastName: true } } },
      }),
      prisma.message.count({ where: { conversationId } }),
    ]);

    return { data, total, page, limit };
  }

  async sendMessage(userId: string, conversationId: string, content: string, type: MessageType = MessageType.TEXT, mediaUrl?: string) {
    const member = await prisma.conversationMember.findUnique({
      where: { conversationId_userId: { conversationId, userId } },
    });
    if (!member) throw AppError.forbidden('Not a member of this conversation');

    return prisma.$transaction(async (tx) => {
      const message = await tx.message.create({
        data: { conversationId, senderId: userId, content, type, mediaUrl },
        include: { sender: { select: { id: true, firstName: true, lastName: true } } },
      });

      await tx.conversation.update({ where: { id: conversationId }, data: { updatedAt: new Date() } });

      const otherMembers = await tx.conversationMember.findMany({
        where: { conversationId, userId: { not: userId } },
      });

      for (const m of otherMembers) {
        await notificationService.create({
          userId: m.userId,
          type: NotificationType.CHAT_MESSAGE,
          title: 'New Message',
          body: content.slice(0, 100),
          data: { conversationId, messageId: message.id },
        });
      }

      return message;
    });
  }

  async markAsRead(userId: string, conversationId: string) {
    await prisma.conversationMember.update({
      where: { conversationId_userId: { conversationId, userId } },
      data: { lastReadAt: new Date() },
    });

    await prisma.message.updateMany({
      where: { conversationId, senderId: { not: userId }, isRead: false },
      data: { isRead: true },
    });

    return { message: 'Messages marked as read' };
  }
}

export const chatService = new ChatService();
