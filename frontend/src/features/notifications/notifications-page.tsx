import { TopBar } from '@/components/layout/top-bar';
import { Button } from '@/components/ui/button';
import { ListSkeleton } from '@/components/ui/skeleton';
import { useNotifications } from '@/hooks/use-api';
import { apiClient } from '@/lib/api';
import { useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils';

export function NotificationsPage() {
  const { data, isLoading } = useNotifications();
  const qc = useQueryClient();

  const markAllRead = async () => {
    await apiClient.post('/notifications/read-all');
    qc.invalidateQueries({ queryKey: ['notifications'] });
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
              <div key={n.id} className={cn('p-3 rounded-[var(--radius-md)] border', n.isRead ? 'border-border-subtle' : 'border-primary/30 bg-primary-subtle/30')}>
                <p className="font-medium text-sm">{n.title}</p>
                <p className="text-sm text-text-secondary mt-0.5">{n.body}</p>
                <p className="text-xs text-text-disabled mt-1">{new Date(n.createdAt).toLocaleString()}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
