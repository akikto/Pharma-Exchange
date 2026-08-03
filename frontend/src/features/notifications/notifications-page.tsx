import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { TopBar } from '@/components/layout/top-bar';
import { Button } from '@/components/ui/button';
import { ListSkeleton } from '@/components/ui/skeleton';
import { useNotifications } from '@/hooks/use-api';
import { apiClient } from '@/lib/api';
import { getNotificationRoute } from '@/lib/notification-routes';
import { useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import type { Notification } from '@/types';

export function NotificationsPage() {
  const { t } = useTranslation();
  const { data, isLoading } = useNotifications();
  const qc = useQueryClient();
  const navigate = useNavigate();

  const markAllRead = async () => {
    await apiClient.post('/notifications/read-all');
    qc.invalidateQueries({ queryKey: ['notifications'] });
  };

  const openNotification = async (n: Notification) => {
    if (!n.isRead) {
      await apiClient.patch(`/notifications/${n.id}/read`);
      qc.invalidateQueries({ queryKey: ['notifications'] });
    }
    const route = getNotificationRoute(n.data);
    if (route) navigate(route);
  };

  return (
    <div>
      <TopBar title={t('notifications.title')} showBack showNotifications={false} actions={
        (data?.unreadCount ?? 0) > 0 ? <Button variant="ghost" size="sm" onClick={markAllRead}>{t('notifications.markAllRead')}</Button> : undefined
      } />
      <div className="p-4">
        {isLoading ? <ListSkeleton /> : !data?.data.length ? (
          <p className="text-center text-text-secondary py-12">{t('notifications.empty')}</p>
        ) : (
          <div className="space-y-2">
            {data.data.map((n) => (
              <button
                key={n.id}
                type="button"
                onClick={() => openNotification(n)}
                className={cn(
                  'w-full text-left p-3 rounded-[var(--radius-md)] border transition-colors',
                  n.isRead ? 'border-border-subtle' : 'border-primary/30 bg-primary-subtle/30',
                  getNotificationRoute(n.data) && 'hover:bg-surface-raised cursor-pointer',
                )}
              >
                <p className="font-medium text-sm">{n.title}</p>
                <p className="text-sm text-text-secondary mt-0.5">{n.body}</p>
                <p className="text-xs text-text-disabled mt-1">{new Date(n.createdAt).toLocaleString()}</p>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
