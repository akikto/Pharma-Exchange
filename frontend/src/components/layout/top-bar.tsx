import { Link } from 'react-router-dom';
import { Bell, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNotifications } from '@/hooks/use-api';

interface TopBarProps {
  title?: string;
  showBack?: boolean;
  large?: boolean;
  actions?: React.ReactNode;
}

export function TopBar({ title, showBack, large, actions }: TopBarProps) {
  const { data: notifications } = useNotifications();
  const unreadCount = notifications?.unreadCount ?? 0;

  return (
    <header className={cn(
      'sticky top-0 z-40 border-b border-border-subtle bg-surface-base/95 backdrop-blur supports-[backdrop-filter]:bg-surface-base/80',
      large ? 'px-4 pt-4 pb-2' : 'px-4 h-14 flex items-center gap-3'
    )}>
      {showBack && (
        <Link to={-1 as unknown as string} className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-surface-raised" onClick={(e) => { e.preventDefault(); history.back(); }}>
          <ArrowLeft className="h-5 w-5" />
        </Link>
      )}
      {title && (
        <h1 className={cn('font-bold flex-1', large ? 'text-2xl' : 'text-base')}>{title}</h1>
      )}
      <div className="flex items-center gap-1 ml-auto">
        {actions}
        <Link to="/notifications" className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-surface-raised relative" aria-label="Notifications">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold text-white">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </Link>
      </div>
    </header>
  );
}
