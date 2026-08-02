import { Link } from 'react-router-dom';
import { Bell, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TopBarProps {
  title?: string;
  showBack?: boolean;
  large?: boolean;
  actions?: React.ReactNode;
}

export function TopBar({ title, showBack, large, actions }: TopBarProps) {
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
        <Link to="/notifications" className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-surface-raised relative">
          <Bell className="h-5 w-5" />
        </Link>
      </div>
    </header>
  );
}
