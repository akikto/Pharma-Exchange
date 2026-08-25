import { NotificationsPage } from '@/features/notifications/notifications-page';

export function AdminNotificationsPage() {
  return (
    <div data-testid="admin-notifications-page">
      <NotificationsPage backTo="/admin" embeddedInAdminShell />
    </div>
  );
}
