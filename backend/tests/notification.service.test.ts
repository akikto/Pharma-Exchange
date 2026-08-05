import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NotificationType } from '@prisma/client';

const {
  findUnique,
  findMany,
  deleteMany,
  create,
  updateMany,
  sendEachForMulticast,
  getFirebaseMessaging,
} = vi.hoisted(() => ({
  findUnique: vi.fn(),
  findMany: vi.fn(),
  deleteMany: vi.fn(),
  create: vi.fn(),
  updateMany: vi.fn(),
  sendEachForMulticast: vi.fn(),
  getFirebaseMessaging: vi.fn(),
}));

vi.mock('../src/config/database', () => ({
  default: {
    user: { findUnique, findMany },
    fcmToken: { findMany, deleteMany },
    notification: { create, findMany, count: vi.fn(), updateMany },
  },
}));

vi.mock('../src/config/firebase', () => ({
  getFirebaseMessaging: () => getFirebaseMessaging(),
}));

vi.mock('../src/shared/utils/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

import { NotificationService } from '../src/modules/notification/notification.service';

describe('NotificationService', () => {
  const service = new NotificationService();

  beforeEach(() => {
    vi.clearAllMocks();
    findUnique.mockResolvedValue({ notificationPrefs: { orders: true, promotions: false } });
    create.mockResolvedValue({ id: 'n1' });
    findMany.mockResolvedValue([]);
  });

  it('skips push when user preference is disabled', async () => {
    findUnique.mockResolvedValue({ notificationPrefs: { orders: false } });
    getFirebaseMessaging.mockReturnValue({ sendEachForMulticast });

    await service.sendPush('user-1', NotificationType.ORDER_UPDATE, 'Title', 'Body');

    expect(sendEachForMulticast).not.toHaveBeenCalled();
  });

  it('sends push when preference is enabled', async () => {
    findMany.mockResolvedValue([{ token: 'tok-1' }]);
    getFirebaseMessaging.mockReturnValue({ sendEachForMulticast });
    sendEachForMulticast.mockResolvedValue({
      responses: [{ success: true }],
    });

    await service.sendPush('user-1', NotificationType.ORDER_UPDATE, 'Title', 'Body');

    expect(sendEachForMulticast).toHaveBeenCalledOnce();
  });

  it('removes stale FCM tokens from responses', async () => {
    findMany.mockResolvedValue([{ token: 'stale-tok' }]);
    getFirebaseMessaging.mockReturnValue({ sendEachForMulticast });
    sendEachForMulticast.mockResolvedValue({
      responses: [{
        success: false,
        error: { code: 'messaging/registration-token-not-registered' },
      }],
    });
    deleteMany.mockResolvedValue({ count: 1 });

    await service.sendPush('user-1', NotificationType.CHAT_MESSAGE, 'Hi', 'New message');

    expect(deleteMany).toHaveBeenCalledWith({ where: { token: { in: ['stale-tok'] } } });
  });

  it('retries on transient FCM errors', async () => {
    vi.useFakeTimers();
    findMany.mockResolvedValue([{ token: 'tok-1' }]);
    getFirebaseMessaging.mockReturnValue({ sendEachForMulticast });
    sendEachForMulticast
      .mockResolvedValueOnce({
        responses: [{ success: false, error: { code: 'messaging/server-unavailable' } }],
      })
      .mockResolvedValueOnce({
        responses: [{ success: true }],
      });

    const promise = service.sendPush('user-1', NotificationType.ORDER_UPDATE, 'T', 'B');
    await vi.runAllTimersAsync();
    await promise;

    expect(sendEachForMulticast).toHaveBeenCalledTimes(2);
    vi.useRealTimers();
  });

  it('broadcasts to active users', async () => {
    findMany.mockImplementation((args: { where?: { isActive?: boolean } }) => {
      if (args?.where?.isActive !== undefined) return [{ id: 'u1' }, { id: 'u2' }];
      return [];
    });
    create.mockResolvedValue({ id: 'n1' });
    getFirebaseMessaging.mockReturnValue(null);

    const result = await service.broadcast({ title: 'Hello', body: 'World' });

    expect(result).toEqual({ sent: 2, total: 2 });
    expect(create).toHaveBeenCalledTimes(2);
  });
});
