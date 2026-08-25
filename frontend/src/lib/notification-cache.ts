import type { QueryClient } from '@tanstack/react-query';
import type { Notification } from '@/types';

export const NOTIFICATIONS_QUERY_KEY = ['notifications'] as const;

export type NotificationsData = { data: Notification[]; unreadCount: number };

export function markNotificationReadInCache(
  queryClient: QueryClient,
  notificationId: string,
): void {
  queryClient.setQueryData<NotificationsData>(NOTIFICATIONS_QUERY_KEY, (prev) => {
    if (!prev) return prev;

    const target = prev.data.find((notification) => notification.id === notificationId);
    if (!target || target.isRead) return prev;

    return {
      unreadCount: Math.max(0, prev.unreadCount - 1),
      data: prev.data.map((notification) =>
        notification.id === notificationId
          ? { ...notification, isRead: true }
          : notification,
      ),
    };
  });
}

export function markAllNotificationsReadInCache(queryClient: QueryClient): void {
  queryClient.setQueryData<NotificationsData>(NOTIFICATIONS_QUERY_KEY, (prev) => {
    if (!prev || prev.unreadCount === 0) return prev;

    return {
      unreadCount: 0,
      data: prev.data.map((notification) =>
        notification.isRead ? notification : { ...notification, isRead: true },
      ),
    };
  });
}

function unreadDeltaForRemoved(
  removed: Notification[],
): number {
  return removed.filter((notification) => !notification.isRead).length;
}

export function removeNotificationsFromCache(
  queryClient: QueryClient,
  ids: string[],
): void {
  if (ids.length === 0) return;
  const idSet = new Set(ids);

  queryClient.setQueryData<NotificationsData>(NOTIFICATIONS_QUERY_KEY, (prev) => {
    if (!prev) return prev;

    const removed = prev.data.filter((notification) => idSet.has(notification.id));
    if (removed.length === 0) return prev;

    return {
      unreadCount: Math.max(0, prev.unreadCount - unreadDeltaForRemoved(removed)),
      data: prev.data.filter((notification) => !idSet.has(notification.id)),
    };
  });
}

export function clearNotificationsCache(queryClient: QueryClient): void {
  queryClient.setQueryData<NotificationsData>(NOTIFICATIONS_QUERY_KEY, (prev) => {
    if (!prev) return prev;
    return { unreadCount: 0, data: [] };
  });
}
