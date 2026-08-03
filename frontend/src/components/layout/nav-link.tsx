import { Link, useLocation } from 'react-router-dom';
import type { NavItem } from './nav-config';
import { NavBadge } from '@/components/ui/nav-badge';
import { cn } from '@/lib/utils';

interface NavLinkItemProps {
  item: NavItem;
  variant: 'bottom' | 'side';
  badgeCount?: number;
}

export function NavLinkItem({ item, variant, badgeCount = 0 }: NavLinkItemProps) {
  const { pathname } = useLocation();
  const { to, icon: Icon, label } = item;
  const active = pathname === to || (to !== '/' && pathname.startsWith(to));

  if (variant === 'side') {
    return (
      <Link
        to={to}
        className={cn(
          'flex items-center gap-3 rounded-[var(--radius-md)] px-3 py-2.5 text-sm font-medium transition-colors',
          active ? 'bg-primary-subtle text-primary' : 'text-text-secondary hover:bg-surface-raised hover:text-text-primary',
        )}
      >
        <span className="relative">
          <Icon className={cn('h-5 w-5', active && 'text-primary')} />
          <NavBadge count={badgeCount} />
        </span>
        {label}
      </Link>
    );
  }

  return (
    <Link
      to={to}
      className={cn(
        'relative flex flex-col items-center gap-0.5 px-3 py-1 min-w-[64px] min-h-[48px] justify-center',
        active ? 'text-primary' : 'text-text-secondary',
      )}
    >
      <span className="relative">
        <Icon className={cn('h-5 w-5', active && 'fill-primary/20')} />
        <NavBadge count={badgeCount} />
      </span>
      <span className="text-[10px] font-medium">{label}</span>
    </Link>
  );
}
