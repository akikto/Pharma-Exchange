import { NotificationType } from '@prisma/client';
import prisma from '../../config/database';
import { AppError } from '../../shared/errors/AppError';
import { getFirebaseMessaging } from '../../config/firebase';
import { logger } from '../../shared/utils/logger';
import {
  normalizeNotificationPrefs,
  shouldDeliverPush,
} from './notificationPrefs';

const FCM_MAX_RETRIES = 3;
const FCM_RETRY_BASE_MS = 500;

const INVALID_TOKEN_CODES = new Set([
  'messaging/registration-token-not-registered',
  'messaging/invalid-registration-token',
  'messaging/invalid-argument',
]);

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryableFcmError(code?: string) {
  return code === 'messaging/server-unavailable'
    || code === 'messaging/internal-error'
    || code === 'messaging/quota-exceeded';
}

export class NotificationService {
  async create(data: {
    userId: string;
    type: NotificationType | string;
    title: string;
    body: string;
    data?: Record<string, unknown>;
    /** Skip preference check (e.g. critical verification). */
    forcePush?: boolean;
  }) {
    const type = data.type as NotificationType;
    const notification = await prisma.notification.create({
      data: {
        userId: data.userId,
        type,
        title: data.title,
        body: data.body,
        data: data.data ? (data.data as object) : undefined,
      },
    });

    await this.sendPush(data.userId, type, data.title, data.body, data.data, {
      force: data.forcePush,
    });
    return notification;
  }

  private async getUserPrefs(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { notificationPrefs: true },
    });
    return normalizeNotificationPrefs(user?.notificationPrefs);
  }

  async sendPush(
    userId: string,
    type: NotificationType,
    title: string,
    body: string,
    data?: Record<string, unknown>,
    options?: { force?: boolean },
  ) {
    const prefs = await this.getUserPrefs(userId);
    if (!shouldDeliverPush(type, prefs, options)) {
      logger.info(`[FCM] Skipped push for ${userId} (${type}) — user preference disabled`);
      return;
    }

    const tokens = await prisma.fcmToken.findMany({ where: { userId } });
    if (!tokens.length) return;

    const messaging = getFirebaseMessaging();
    if (!messaging) {
      logger.info(`[DEV FCM] Push to ${userId}: ${title} - ${body}`);
      return;
    }

    const payload = {
      tokens: tokens.map((t) => t.token),
      notification: { title, body },
      data: data
        ? Object.fromEntries(Object.entries(data).map(([k, v]) => [k, String(v)]))
        : undefined,
    };

    await this.sendWithRetry(messaging, payload, tokens.map((t) => t.token));
  }

  private async sendWithRetry(
    messaging: NonNullable<ReturnType<typeof getFirebaseMessaging>>,
    payload: { tokens: string[]; notification: { title: string; body: string }; data?: Record<string, string> },
    tokenList: string[],
    attempt = 0,
  ) {
    try {
      const response = await messaging.sendEachForMulticast(payload);
      const staleTokens: string[] = [];

      response.responses.forEach((result, index) => {
        if (result.success) return;
        const code = result.error?.code;
        if (code && INVALID_TOKEN_CODES.has(code)) {
          staleTokens.push(tokenList[index]);
        } else if (code) {
          logger.warn('FCM delivery failed', { code, message: result.error?.message, tokenIndex: index });
        }
      });

      if (staleTokens.length) {
        await prisma.fcmToken.deleteMany({ where: { token: { in: staleTokens } } });
        logger.info(`Removed ${staleTokens.length} stale FCM token(s)`);
      }

      const retryable = response.responses.some(
        (r) => !r.success && isRetryableFcmError(r.error?.code),
      );
      if (retryable && attempt < FCM_MAX_RETRIES) {
        const delay = FCM_RETRY_BASE_MS * 2 ** attempt;
        logger.warn(`FCM transient failure — retry ${attempt + 1}/${FCM_MAX_RETRIES} in ${delay}ms`);
        await sleep(delay);
        await this.sendWithRetry(messaging, payload, tokenList, attempt + 1);
      }
    } catch (err) {
      if (attempt < FCM_MAX_RETRIES) {
        const delay = FCM_RETRY_BASE_MS * 2 ** attempt;
        logger.warn(`FCM send error — retry ${attempt + 1}/${FCM_MAX_RETRIES}`, { error: (err as Error).message });
        await sleep(delay);
        await this.sendWithRetry(messaging, payload, tokenList, attempt + 1);
        return;
      }
      logger.error('FCM send failed after retries', { error: (err as Error).message });
    }
  }

  async broadcast(data: {
    title: string;
    body: string;
    userIds?: string[];
    data?: Record<string, unknown>;
  }) {
    const where = data.userIds?.length
      ? { id: { in: data.userIds }, isActive: true }
      : { isActive: true };

    const users = await prisma.user.findMany({
      where,
      select: { id: true },
      orderBy: { createdAt: 'asc' },
    });

    let sent = 0;
    for (const user of users) {
      await this.create({
        userId: user.id,
        type: NotificationType.SYSTEM,
        title: data.title,
        body: data.body,
        data: { ...data.data, broadcast: true },
      });
      sent += 1;
    }

    return { sent, total: users.length };
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

  async deleteOne(userId: string, id: string) {
    const result = await prisma.notification.deleteMany({ where: { id, userId } });
    if (result.count === 0) throw AppError.notFound('Notification not found');
    return { message: 'Notification deleted' };
  }

  async deleteMany(userId: string, ids: string[]) {
    const result = await prisma.notification.deleteMany({
      where: { userId, id: { in: ids } },
    });
    return { deleted: result.count };
  }

  async deleteAll(userId: string) {
    const result = await prisma.notification.deleteMany({ where: { userId } });
    return { deleted: result.count };
  }
}

export const notificationService = new NotificationService();
