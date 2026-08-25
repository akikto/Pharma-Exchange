import { useTranslation } from 'react-i18next';
import { Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Notification } from '@/types';

interface NotificationListItemProps {
  notification: Notification;
  onClick?: () => void;
  isClickable?: boolean;
  className?: string;
  selectionMode?: boolean;
  selected?: boolean;
  onToggleSelect?: () => void;
  onDelete?: () => void;
}

export function NotificationListItem({
  notification,
  onClick,
  isClickable = false,
  className,
  selectionMode = false,
  selected = false,
  onToggleSelect,
  onDelete,
}: NotificationListItemProps) {
  const { t } = useTranslation();
  const isUnread = !notification.isRead;

  return (
    <div
      className={cn(
        'relative w-full rounded-[var(--radius-md)] border text-left transition-colors',
        isUnread
          ? 'border-primary/20 border-l-4 border-l-primary bg-primary-subtle pl-2.5 pr-3 py-3'
          : 'border-border-subtle bg-surface-base p-3',
        className,
      )}
      data-testid="notification-list-item"
      data-read={notification.isRead}
    >
      <div className="flex items-start gap-2">
        {selectionMode && (
          <input
            type="checkbox"
            className="mt-1 h-4 w-4 shrink-0 accent-primary"
            checked={selected}
            aria-label={t('notifications.select')}
            data-testid={`notification-select-${notification.id}`}
            onChange={() => onToggleSelect?.()}
            onClick={(event) => event.stopPropagation()}
          />
        )}
        <button
          type="button"
          onClick={selectionMode ? onToggleSelect : onClick}
          disabled={!selectionMode && !onClick}
          className={cn(
            'min-w-0 flex-1 text-left',
            !selectionMode && isClickable && 'cursor-pointer',
            selectionMode && 'cursor-pointer',
          )}
        >
          <div className="flex items-start gap-2">
            {isUnread && !selectionMode && (
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
        {!selectionMode && onDelete && (
          <button
            type="button"
            className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-text-secondary hover:bg-surface-raised hover:text-error"
            aria-label={t('notifications.delete')}
            data-testid={`notification-delete-${notification.id}`}
            onClick={(event) => {
              event.stopPropagation();
              onDelete();
            }}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
