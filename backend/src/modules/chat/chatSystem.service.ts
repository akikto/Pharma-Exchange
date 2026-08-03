import { MessageType, OrderStatus } from '@prisma/client';
import prisma from '../../config/database';
import { getSocketIo } from '../../socket';

function formatOrderStatusMessage(status: OrderStatus | string, orderNumber: string): string {
  return `Order ${orderNumber} status updated to ${String(status).toLowerCase()}`;
}

function formatBuyRequestStatusMessage(status: string, requestNumber: string): string {
  const label = status === 'ACCEPTED' ? 'accepted' : status === 'REJECTED' ? 'rejected' : String(status).toLowerCase();
  return `Buy request ${requestNumber} was ${label}`;
}

export class ChatSystemService {
  async ensureOrderConversation(orderId: string, buyerId: string, sellerUserId: string) {
    const existing = await prisma.conversation.findFirst({ where: { orderId } });
    if (existing) return existing;

    return prisma.conversation.create({
      data: {
        orderId,
        members: { create: [{ userId: buyerId }, { userId: sellerUserId }] },
      },
    });
  }

  async ensureBuyRequestConversation(buyRequestId: string, buyerId: string, sellerUserId: string) {
    const existing = await prisma.conversation.findFirst({ where: { buyRequestId } });
    if (existing) return existing;

    return prisma.conversation.create({
      data: {
        buyRequestId,
        members: { create: [{ userId: buyerId }, { userId: sellerUserId }] },
      },
    });
  }

  private async postSystemMessage(conversationId: string, senderId: string, content: string) {
    const message = await prisma.$transaction(async (tx) => {
      const msg = await tx.message.create({
        data: { conversationId, senderId, content, type: MessageType.SYSTEM },
        include: { sender: { select: { id: true, firstName: true, lastName: true } } },
      });
      await tx.conversation.update({ where: { id: conversationId }, data: { updatedAt: new Date() } });
      return msg;
    });

    const io = getSocketIo();
    io?.to(`conversation:${conversationId}`).emit('message:new', message);

    return message;
  }

  async postOrderStatusMessage(
    orderId: string,
    actorUserId: string,
    status: OrderStatus | string,
    orderNumber: string,
  ) {
    let conversation = await prisma.conversation.findFirst({ where: { orderId } });
    if (!conversation) {
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: { seller: true },
      });
      if (!order?.seller) return null;
      conversation = await this.ensureOrderConversation(orderId, order.buyerId, order.seller.userId);
    }

    return this.postSystemMessage(
      conversation.id,
      actorUserId,
      formatOrderStatusMessage(status, orderNumber),
    );
  }

  async postBuyRequestStatusMessage(
    buyRequestId: string,
    actorUserId: string,
    status: string,
    requestNumber: string,
  ) {
    let conversation = await prisma.conversation.findFirst({ where: { buyRequestId } });
    if (!conversation) {
      const buyRequest = await prisma.buyRequest.findUnique({
        where: { id: buyRequestId },
        include: { seller: true },
      });
      if (!buyRequest?.seller) return null;
      conversation = await this.ensureBuyRequestConversation(
        buyRequestId,
        buyRequest.buyerId,
        buyRequest.seller.userId,
      );
    }

    return this.postSystemMessage(
      conversation.id,
      actorUserId,
      formatBuyRequestStatusMessage(status, requestNumber),
    );
  }
}

export const chatSystemService = new ChatSystemService();
