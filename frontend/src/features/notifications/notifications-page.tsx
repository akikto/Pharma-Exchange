import { useNavigate } from 'react-router-dom';
import { TopBar } from '@/components/layout/top-bar';
import { Button } from '@/components/ui/button';
import { ListSkeleton } from '@/components/ui/skeleton';
import { useNotifications } from '@/hooks/use-api';
import { apiClient } from '@/lib/api';
import { useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import type { Notification } from '@/types';

function getNotificationPath(n: Notification): string | null {
  const data = n.data ?? {};
  if (data.orderId) return `/orders/${data.orderId}`;
  if (data.conversationId) return `/chat/${data.conversationId}`;
  if (data.buyRequestId) return `/buy-requests/${data.buyRequestId}`;
  return null;
}

export function NotificationsPage() {
  const { data, isLoading } = useNotifications();
  const qc = useQueryClient();
  const navigate = useNavigate();

  const markAllRead = async () => {
    await apiClient.post('/notifications/read-all');
    qc.invalidateQueries({ queryKey: ['notifications'] });
  };

  const handleClick = async (n: Notification) => {
    if (!n.isRead) {
      await apiClient.post(`/notifications/${n.id}/read`);
      qc.invalidateQueries({ queryKey: ['notifications'] });
    }
    const path = getNotificationPath(n);
    if (path) navigate(path);
  };

  return (
    <div>
      <TopBar title="Notifications" showBack actions={
        (data?.unreadCount ?? 0) > 0 ? <Button variant="ghost" size="sm" onClick={markAllRead}>Mark all read</Button> : undefined
      } />
      <div className="p-4">
        {isLoading ? <ListSkeleton /> : !data?.data.length ? (
          <p className="text-center text-text-secondary py-12">No notifications</p>
        ) : (
          <div className="space-y-2">
            {data.data.map((n) => (
              <button
                key={n.id}
                type="button"
                onClick={() => handleClick(n)}
                className={cn('w-full text-left p-3 rounded-[var(--radius-md)] border', n.isRead ? 'border-border-subtle' : 'border-primary/30 bg-primary-subtle/30')}
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
