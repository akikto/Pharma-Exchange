import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { TopBar } from '@/components/layout/top-bar';
import { Button } from '@/components/ui/button';
import { ListSkeleton } from '@/components/ui/skeleton';
import { NotificationListItem } from '@/components/notifications/notification-list-item';
import { useNotifications } from '@/hooks/use-api';
import { apiClient } from '@/lib/api';
import {
  markAllNotificationsReadInCache,
  markNotificationReadInCache,
} from '@/lib/notification-cache';
import { getNotificationRoute } from '@/lib/notification-routes';
import { useQueryClient } from '@tanstack/react-query';
import type { Notification } from '@/types';

export function NotificationsPage() {
  const { t } = useTranslation();
  const { data, isLoading } = useNotifications();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const unreadCount = data?.unreadCount ?? 0;

  const markAllRead = async () => {
    if (unreadCount === 0) return;

    markAllNotificationsReadInCache(queryClient);
    try {
      await apiClient.post('/notifications/read-all');
    } catch {
      void queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
  };

  const openNotification = async (notification: Notification) => {
    if (!notification.isRead) {
      markNotificationReadInCache(queryClient, notification.id);
      try {
        await apiClient.patch(`/notifications/${notification.id}/read`);
      } catch {
        void queryClient.invalidateQueries({ queryKey: ['notifications'] });
      }
    }

    const route = getNotificationRoute(notification.data);
    if (route) navigate(route);
  };

  return (
    <div>
      <TopBar
        title={t('notifications.title')}
        showBack
        showNotifications={false}
        actions={
          <Button
            variant="ghost"
            size="sm"
            onClick={markAllRead}
            disabled={unreadCount === 0}
            className={unreadCount === 0 ? 'text-text-disabled' : undefined}
          >
            {t('notifications.markAllRead')}
          </Button>
        }
      />
      <div className="p-4">
        {isLoading ? (
          <ListSkeleton />
        ) : !data?.data.length ? (
          <p className="py-12 text-center text-text-secondary">{t('notifications.empty')}</p>
        ) : (
          <div className="space-y-2">
            {data.data.map((notification) => (
              <NotificationListItem
                key={notification.id}
                notification={notification}
                onClick={() => openNotification(notification)}
                isClickable={Boolean(getNotificationRoute(notification.data))}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
