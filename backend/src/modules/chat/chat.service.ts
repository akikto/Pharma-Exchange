import { MessageType, NotificationType } from '@prisma/client';
import prisma from '../../config/database';
import { AppError } from '../../shared/errors/AppError';
import { notificationService } from '../notification';

const memberInclude = {
  members: {
    include: {
      user: { select: { id: true, firstName: true, lastName: true, phone: true } },
    },
  },
};

export class ChatService {
  async getConversations(userId: string, filters?: { orderId?: string; buyRequestId?: string }) {
    const memberships = await prisma.conversationMember.findMany({
      where: {
        userId,
        conversation: {
          ...(filters?.orderId ? { orderId: filters.orderId } : {}),
          ...(filters?.buyRequestId ? { buyRequestId: filters.buyRequestId } : {}),
        },
      },
      include: {
        conversation: {
          include: {
            ...memberInclude,
            messages: {
              orderBy: { createdAt: 'desc' },
              take: 1,
              include: { sender: { select: { id: true, firstName: true, lastName: true } } },
            },
          },
        },
      },
      orderBy: { conversation: { updatedAt: 'desc' } },
    });
    return memberships.map((m) => m.conversation);
  }

  async getConversation(userId: string, conversationId: string) {
    const member = await prisma.conversationMember.findUnique({
      where: { conversationId_userId: { conversationId, userId } },
    });
    if (!member) throw AppError.forbidden('Not a member of this conversation');

    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        ...memberInclude,
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: { sender: { select: { id: true, firstName: true, lastName: true } } },
        },
      },
    });
    if (!conversation) throw AppError.notFound('Conversation not found');

    let order = null;
    let buyRequest = null;

    if (conversation.orderId) {
      order = await prisma.order.findUnique({
        where: { id: conversation.orderId },
        select: {
          id: true, orderNumber: true, status: true, totalAmount: true,
          buyerId: true, sellerId: true,
          seller: { select: { id: true, name: true, userId: true } },
          buyer: { select: { id: true, firstName: true, lastName: true } },
        },
      });
    }

    if (conversation.buyRequestId) {
      buyRequest = await prisma.buyRequest.findUnique({
        where: { id: conversation.buyRequestId },
        select: {
          id: true, requestNumber: true, status: true, totalAmount: true,
          buyerId: true, sellerId: true,
          seller: { select: { id: true, name: true, userId: true } },
        },
      });
    }

    const counterparty = conversation.members.find((m) => m.userId !== userId)?.user ?? null;

    return { ...conversation, order, buyRequest, counterparty };
  }

  async getContextOptions(userId: string) {
    const pharmacy = await prisma.pharmacy.findUnique({ where: { userId } });

    const [buyerOrders, sellerOrders, buyerRequests, sellerRequests] = await Promise.all([
      prisma.order.findMany({
        where: { buyerId: userId },
        select: { id: true, orderNumber: true, status: true },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
      pharmacy
        ? prisma.order.findMany({
          where: { sellerId: pharmacy.id },
          select: { id: true, orderNumber: true, status: true },
          orderBy: { createdAt: 'desc' },
          take: 20,
        })
        : Promise.resolve([]),
      prisma.buyRequest.findMany({
        where: { buyerId: userId },
        select: { id: true, requestNumber: true, status: true },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
      pharmacy
        ? prisma.buyRequest.findMany({
          where: { sellerId: pharmacy.id },
          select: { id: true, requestNumber: true, status: true },
          orderBy: { createdAt: 'desc' },
          take: 20,
        })
        : Promise.resolve([]),
    ]);

    return {
      orders: [...buyerOrders, ...sellerOrders],
      buyRequests: [...buyerRequests, ...sellerRequests],
    };
  }

  async createConversation(
    userId: string,
    participantId: string,
    orderId?: string,
    listingId?: string,
    buyRequestId?: string,
  ) {
    const existing = await prisma.conversation.findFirst({
      where: {
        AND: [
          { members: { some: { userId } } },
          { members: { some: { userId: participantId } } },
          ...(orderId ? [{ orderId }] : []),
          ...(buyRequestId ? [{ buyRequestId }] : []),
        ],
      },
      include: memberInclude,
    });

    if (existing) return existing;

    return prisma.conversation.create({
      data: {
        orderId,
        listingId,
        buyRequestId,
        members: { create: [{ userId }, { userId: participantId }] },
      },
      include: memberInclude,
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
