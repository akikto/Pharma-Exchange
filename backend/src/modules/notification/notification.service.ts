import { NotificationType } from '@prisma/client';
import prisma from '../../config/database';
import { getFirebaseMessaging } from '../../config/firebase';
import { logger } from '../../shared/utils/logger';
import { parsePagination } from '../../shared/utils/helpers';

export class NotificationService {
  async create(data: {
    userId: string;
    type: NotificationType | string;
    title: string;
    body: string;
    data?: Record<string, unknown>;
  }) {
    const notification = await prisma.notification.create({
      data: {
        userId: data.userId,
        type: data.type as NotificationType,
        title: data.title,
        body: data.body,
        data: data.data ? (data.data as object) : undefined,
      },
    });

    await this.sendPush(data.userId, data.title, data.body, data.data);
    return notification;
  }

  async sendPush(userId: string, title: string, body: string, data?: Record<string, unknown>) {
    const tokens = await prisma.fcmToken.findMany({ where: { userId } });
    if (!tokens.length) return;

    const messaging = getFirebaseMessaging();
    if (!messaging) {
      logger.info(`[DEV FCM] Push to ${userId}: ${title} - ${body}`);
      return;
    }

    try {
      await messaging.sendEachForMulticast({
        tokens: tokens.map((t) => t.token),
        notification: { title, body },
        data: data ? Object.fromEntries(Object.entries(data).map(([k, v]) => [k, String(v)])) : undefined,
      });
    } catch (err) {
      logger.error('FCM send failed', { error: (err as Error).message });
    }
  }

  async list(userId: string, unreadOnly: boolean, page: number, limit: number) {
    const skip = (page - 1) * limit;
    const where = { userId, ...(unreadOnly && { isRead: false }) };

    const [data, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
      prisma.notification.count({ where }),
      prisma.notification.count({ where: { userId, isRead: false } }),
    ]);

    return { data, total, unreadCount, page, limit };
  }

  async markRead(userId: string, id: string) {
    return prisma.notification.updateMany({
      where: { id, userId },
      data: { isRead: true },
    });
  }

  async markAllRead(userId: string) {
    await prisma.notification.updateMany({ where: { userId, isRead: false }, data: { isRead: true } });
    return { message: 'All notifications marked as read' };
  }
}

export const notificationService = new NotificationService();
