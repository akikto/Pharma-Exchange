import { Link, useLocation } from 'react-router-dom';
import type { NavItem, AdminNavItem, AdminBottomNavItem } from './nav-config';
import { isAdminBottomNavItemActive, isAdminNavItemActive, isNavItemActive } from './nav-config';
import { NavBadge } from '@/components/ui/nav-badge';
import { useNavLabel } from '@/hooks/use-nav-label';
import { cn } from '@/lib/utils';

interface NavLinkItemProps {
  item: NavItem;
  variant: 'bottom' | 'side';
  badgeCount?: number;
}

export function NavLinkItem({ item, variant, badgeCount = 0 }: NavLinkItemProps) {
  const { pathname } = useLocation();
  const { to, icon: Icon, labelKey } = item;
  const { primary, subtitle } = useNavLabel(labelKey);
  const active = isNavItemActive(pathname, item);

  if (variant === 'side') {
    return (
      <Link
        to={to}
        data-testid={`nav-side-${labelKey}`}
        className={cn(
          'flex items-center gap-3 rounded-[var(--radius-md)] px-3 py-2.5 text-sm font-medium transition-colors',
          active ? 'bg-primary-subtle text-primary ring-1 ring-primary/15' : 'text-text-secondary hover:bg-surface-sunken hover:text-text-primary',
        )}
      >
        <span className="relative">
          <Icon className={cn('h-5 w-5', active && 'text-primary')} />
          <NavBadge count={badgeCount} />
        </span>
        <span className="flex flex-col">
          <span>{primary}</span>
          {subtitle ? (
            <span className="text-[10px] font-normal text-text-disabled">{subtitle}</span>
          ) : null}
        </span>
      </Link>
    );
  }

  return (
    <Link
      to={to}
      data-testid={`nav-bottom-${labelKey}`}
      className={cn(
        'relative flex flex-col items-center gap-0.5 px-2 py-1 min-w-[56px] min-h-[48px] justify-center rounded-[var(--radius-md)] transition-colors',
        active ? 'text-primary' : 'text-text-disabled',
      )}
    >
      {active && (
        <span
          className="pointer-events-none absolute inset-x-1 top-1 bottom-1 rounded-[var(--radius-md)] bg-primary-subtle ring-1 ring-primary/15"
          aria-hidden
        />
      )}
      <span className="relative">
        <Icon className={cn('h-5 w-5', active ? 'text-primary fill-primary/25' : 'text-text-disabled')} />
        <NavBadge count={badgeCount} />
      </span>
      <span className={cn('relative text-[10px] font-medium leading-tight text-center', active ? 'text-primary' : 'text-text-disabled')}>
        {primary}
      </span>
      {subtitle ? (
        <span className={cn('relative text-[8px] leading-none', active ? 'text-primary/70' : 'text-text-disabled')}>
          {subtitle}
        </span>
      ) : null}
    </Link>
  );
}

export function AdminNavLinkItem({ item, variant = 'side' }: { item: AdminNavItem; variant?: 'side' | 'mobile' }) {
  const { pathname } = useLocation();
  const { to, icon: Icon, labelKey } = item;
  const { primary, subtitle } = useNavLabel(labelKey);
  const active = isAdminNavItemActive(pathname, item);

  if (variant === 'mobile') {
    return (
      <Link
        to={to}
        data-testid={`nav-admin-mobile-${labelKey}`}
        className={cn(
          'shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap',
          active
            ? 'border-primary bg-primary-subtle text-primary'
            : 'border-border-subtle bg-surface-raised text-text-secondary',
        )}
      >
        {primary}
      </Link>
    );
  }

  return (
    <Link
      to={to}
      data-testid={`nav-admin-${labelKey}`}
      className={cn(
        'flex items-center gap-3 rounded-[var(--radius-md)] px-3 py-2.5 text-sm font-medium transition-colors',
        active ? 'bg-primary-subtle text-primary' : 'text-text-secondary hover:bg-surface-raised hover:text-text-primary',
      )}
    >
      <Icon className={cn('h-5 w-5', active && 'text-primary')} />
      <span className="flex flex-col">
        <span>{primary}</span>
        {subtitle ? (
          <span className="text-[10px] font-normal text-text-disabled">{subtitle}</span>
        ) : null}
      </span>
    </Link>
  );
}

export function AdminBottomNavLinkItem({ item }: { item: AdminBottomNavItem }) {
  const { pathname } = useLocation();
  const { to, icon: Icon, labelKey } = item;
  const { primary } = useNavLabel(labelKey);
  const active = isAdminBottomNavItemActive(pathname, item);

  return (
    <Link
      to={to}
      data-testid={`nav-admin-bottom-${labelKey}`}
      className={cn(
        'relative flex min-h-[48px] min-w-[56px] flex-col items-center justify-center gap-0.5 rounded-[var(--radius-md)] px-2 py-1 transition-colors',
        active ? 'text-primary' : 'text-text-disabled',
      )}
    >
      {active && (
        <span
          className="pointer-events-none absolute inset-x-1 top-1 bottom-1 rounded-[var(--radius-md)] bg-primary-subtle ring-1 ring-primary/15"
          aria-hidden
        />
      )}
      <Icon className={cn('relative h-5 w-5', active ? 'text-primary fill-primary/25' : 'text-text-disabled')} />
      <span
        className={cn(
          'relative text-center text-[10px] font-medium leading-tight',
          active ? 'text-primary' : 'text-text-disabled',
        )}
      >
        {primary}
      </span>
    </Link>
  );
}
