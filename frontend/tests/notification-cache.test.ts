import { describe, expect, it } from 'vitest';
import { QueryClient } from '@tanstack/react-query';
import {
  clearNotificationsCache,
  markAllNotificationsReadInCache,
  markNotificationReadInCache,
  NOTIFICATIONS_QUERY_KEY,
  removeNotificationsFromCache,
  type NotificationsData,
} from '@/lib/notification-cache';
import type { Notification } from '@/types';

const sampleNotifications: Notification[] = [
  {
    id: 'n1',
    type: 'ORDER',
    title: 'Order shipped',
    body: 'Your order is on the way',
    isRead: false,
    createdAt: '2026-08-10T00:00:00.000Z',
  },
  {
    id: 'n2',
    type: 'CHAT',
    title: 'New message',
    body: 'Seller replied to your inquiry',
    isRead: false,
    createdAt: '2026-08-09T00:00:00.000Z',
  },
  {
    id: 'n3',
    type: 'PROMO',
    title: 'Weekly deals',
    body: 'Check out this week offers',
    isRead: true,
    createdAt: '2026-08-08T00:00:00.000Z',
  },
];

function seedNotifications(queryClient: QueryClient, data: NotificationsData) {
  queryClient.setQueryData(NOTIFICATIONS_QUERY_KEY, data);
}

describe('notification-cache', () => {
  it('marks a single notification as read and decrements unread count', () => {
    const queryClient = new QueryClient();
    seedNotifications(queryClient, { data: sampleNotifications, unreadCount: 2 });

    markNotificationReadInCache(queryClient, 'n1');

    const next = queryClient.getQueryData<NotificationsData>(NOTIFICATIONS_QUERY_KEY);
    expect(next?.unreadCount).toBe(1);
    expect(next?.data.find((notification) => notification.id === 'n1')?.isRead).toBe(true);
    expect(next?.data.find((notification) => notification.id === 'n2')?.isRead).toBe(false);
  });

  it('marks all notifications as read and clears unread count', () => {
    const queryClient = new QueryClient();
    seedNotifications(queryClient, { data: sampleNotifications, unreadCount: 2 });

    markAllNotificationsReadInCache(queryClient);

    const next = queryClient.getQueryData<NotificationsData>(NOTIFICATIONS_QUERY_KEY);
    expect(next?.unreadCount).toBe(0);
    expect(next?.data.every((notification) => notification.isRead)).toBe(true);
  });

  it('does not change cache when marking an already-read notification', () => {
    const queryClient = new QueryClient();
    seedNotifications(queryClient, { data: sampleNotifications, unreadCount: 2 });

    markNotificationReadInCache(queryClient, 'n3');

    const next = queryClient.getQueryData<NotificationsData>(NOTIFICATIONS_QUERY_KEY);
    expect(next?.unreadCount).toBe(2);
  });

  it('removes notifications and adjusts unread count', () => {
    const queryClient = new QueryClient();
    seedNotifications(queryClient, { data: sampleNotifications, unreadCount: 2 });

    removeNotificationsFromCache(queryClient, ['n1', 'n3']);

    const next = queryClient.getQueryData<NotificationsData>(NOTIFICATIONS_QUERY_KEY);
    expect(next?.data.map((n) => n.id)).toEqual(['n2']);
    expect(next?.unreadCount).toBe(1);
  });

  it('clears all notifications from cache', () => {
    const queryClient = new QueryClient();
    seedNotifications(queryClient, { data: sampleNotifications, unreadCount: 2 });

    clearNotificationsCache(queryClient);

    const next = queryClient.getQueryData<NotificationsData>(NOTIFICATIONS_QUERY_KEY);
    expect(next?.data).toEqual([]);
    expect(next?.unreadCount).toBe(0);
  });
});
