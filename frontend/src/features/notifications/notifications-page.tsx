import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { TopBar } from '@/components/layout/top-bar';
import { Button } from '@/components/ui/button';
import { ListSkeleton } from '@/components/ui/skeleton';
import { NotificationListItem } from '@/components/notifications/notification-list-item';
import { useNotifications } from '@/hooks/use-api';
import { apiClient } from '@/lib/api';
import {
  clearNotificationsCache,
  markAllNotificationsReadInCache,
  markNotificationReadInCache,
  removeNotificationsFromCache,
} from '@/lib/notification-cache';
import { getNotificationRoute } from '@/lib/notification-routes';
import { useQueryClient } from '@tanstack/react-query';
import type { Notification } from '@/types';

export function NotificationsPage({
  backTo,
  embeddedInAdminShell = false,
}: {
  backTo?: string;
  embeddedInAdminShell?: boolean;
}) {
  const { t } = useTranslation();
  const { data, isLoading } = useNotifications();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());

  const notifications = data?.data ?? [];
  const unreadCount = data?.unreadCount ?? 0;
  const allSelected =
    notifications.length > 0 && selectedIds.size === notifications.length;

  const selectedCount = selectedIds.size;

  const exitSelectionMode = () => {
    setSelectionMode(false);
    setSelectedIds(new Set());
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    setSelectedIds(new Set(notifications.map((notification) => notification.id)));
  };

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

  const deleteOne = async (notification: Notification) => {
    if (!window.confirm(t('notifications.deleteOneConfirm'))) return;

    removeNotificationsFromCache(queryClient, [notification.id]);
    try {
      await apiClient.delete(`/notifications/${notification.id}`);
    } catch {
      void queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
  };

  const deleteSelected = async () => {
    if (selectedCount === 0) return;
    if (!window.confirm(t('notifications.deleteSelectedConfirm', { count: selectedCount }))) {
      return;
    }

    const ids = [...selectedIds];
    removeNotificationsFromCache(queryClient, ids);
    exitSelectionMode();
    try {
      await apiClient.post('/notifications/delete-bulk', { ids });
    } catch {
      void queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
  };

  const deleteAll = async () => {
    if (notifications.length === 0) return;
    if (!window.confirm(t('notifications.deleteAllConfirm'))) return;

    clearNotificationsCache(queryClient);
    exitSelectionMode();
    try {
      await apiClient.post('/notifications/delete-all');
    } catch {
      void queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
  };

  const topActions = selectionMode ? (
    <>
      <Button variant="ghost" size="sm" onClick={exitSelectionMode}>
        {t('notifications.cancelSelect')}
      </Button>
      <Button variant="ghost" size="sm" onClick={selectAll} disabled={allSelected}>
        {t('notifications.selectAll')}
      </Button>
    </>
  ) : (
    <>
      {notifications.length > 0 && (
        <>
          <Button variant="ghost" size="sm" onClick={() => setSelectionMode(true)}>
            {t('notifications.select')}
          </Button>
          <Button variant="ghost" size="sm" onClick={deleteAll}>
            {t('notifications.deleteAll')}
          </Button>
        </>
      )}
      <Button
        variant="ghost"
        size="sm"
        onClick={markAllRead}
        disabled={unreadCount === 0}
        className={unreadCount === 0 ? 'text-text-disabled' : undefined}
      >
        {t('notifications.markAllRead')}
      </Button>
    </>
  );

  return (
    <div className={embeddedInAdminShell ? 'pb-4' : 'pb-24'}>
      <TopBar
        title={t('notifications.title')}
        showBack
        backTo={backTo}
        showNotifications={false}
        actions={topActions}
      />
      <div className="p-4">
        {isLoading ? (
          <ListSkeleton />
        ) : !notifications.length ? (
          <p className="py-12 text-center text-text-secondary">{t('notifications.empty')}</p>
        ) : (
          <div className="space-y-2">
            {notifications.map((notification) => (
              <NotificationListItem
                key={notification.id}
                notification={notification}
                onClick={() => openNotification(notification)}
                isClickable={Boolean(getNotificationRoute(notification.data))}
                selectionMode={selectionMode}
                selected={selectedIds.has(notification.id)}
                onToggleSelect={() => toggleSelect(notification.id)}
                onDelete={() => deleteOne(notification)}
              />
            ))}
          </div>
        )}
      </div>
      {selectionMode && notifications.length > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-50 border-t border-border-subtle bg-surface-base p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <Button
            className="w-full"
            variant="destructive"
            disabled={selectedCount === 0}
            onClick={deleteSelected}
          >
            {t('notifications.deleteSelected')}
            {selectedCount > 0 ? ` (${selectedCount})` : ''}
          </Button>
        </div>
      )}
    </div>
  );
}
