import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import type { Notification } from '@/types';

interface NotificationListItemProps {
  notification: Notification;
  onClick?: () => void;
  isClickable?: boolean;
  className?: string;
}

export function NotificationListItem({
  notification,
  onClick,
  isClickable = false,
  className,
}: NotificationListItemProps) {
  const { t } = useTranslation();
  const isUnread = !notification.isRead;

  return (
    <button
      type="button"
      onClick={onClick}
      data-testid="notification-list-item"
      data-read={notification.isRead}
      aria-label={isUnread ? `${t('notifications.unread')}: ${notification.title}` : notification.title}
      className={cn(
        'relative w-full rounded-[var(--radius-md)] border text-left transition-colors',
        isUnread
          ? 'border-primary/20 border-l-4 border-l-primary bg-primary-subtle pl-2.5 pr-3 py-3'
          : 'border-border-subtle bg-surface-base p-3',
        isClickable && 'cursor-pointer hover:bg-surface-raised',
        isUnread && isClickable && 'hover:bg-primary-subtle/80',
        className,
      )}
    >
      <div className="flex items-start gap-2">
        {isUnread && (
          <span
            className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary"
            aria-hidden="true"
            data-testid="notification-unread-dot"
          />
        )}
        <div className="min-w-0 flex-1">
          <p
            className={cn(
              'text-sm',
              isUnread ? 'font-semibold text-text-primary' : 'font-medium text-text-primary',
            )}
          >
            {notification.title}
          </p>
          <p
            className={cn(
              'mt-0.5 text-sm',
              isUnread ? 'text-text-primary' : 'text-text-secondary',
            )}
          >
            {notification.body}
          </p>
          <p
            className={cn(
              'mt-1 text-xs',
              isUnread ? 'text-text-secondary' : 'text-text-disabled',
            )}
          >
            {new Date(notification.createdAt).toLocaleString()}
          </p>
        </div>
      </div>
    </button>
  );
}
