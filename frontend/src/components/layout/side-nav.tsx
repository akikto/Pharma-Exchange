import { Link } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth-store';
import { useNavBadges } from '@/hooks/use-nav-badges';
import { Logo } from '@/components/brand/logo';
import { getNavItems } from './nav-config';
import { NavLinkItem } from './nav-link';
import { cn } from '@/lib/utils';

export function SideNav() {
  const mode = useAuthStore((s) => s.mode);
  const user = useAuthStore((s) => s.user);
  const badges = useNavBadges();
  const nav = getNavItems(mode);

  const badgeFor = (key?: string) => {
    if (key === 'cart') return badges.cart;
    if (key === 'chat') return badges.chat;
    if (key === 'requests') return badges.requests;
    if (key === 'watchlist') return badges.watchlist;
    return 0;
  };

  return (
    <aside className={cn('hidden lg:flex lg:flex-col lg:w-60 lg:shrink-0 lg:border-r lg:border-border-subtle lg:bg-surface-base lg:sticky lg:top-0 lg:h-screen lg:py-6 lg:px-4')}>
      <Link to={mode === 'seller' ? '/seller' : '/'} className="px-3 mb-6">
        <Logo size="sm" />
      </Link>

      <nav className="flex flex-col gap-1 flex-1" aria-label="Main navigation" data-testid="side-nav">
        {nav.map((item) => (
          <NavLinkItem key={item.to} item={item} variant="side" badgeCount={badgeFor(item.badgeKey)} />
        ))}
      </nav>

      {user && (
        <div className="mt-auto pt-4 border-t border-border-subtle px-3">
          <p className="text-sm font-medium truncate">{user.firstName} {user.lastName}</p>
          <p className="text-xs text-text-secondary truncate">{user.email || user.phone}</p>
        </div>
      )}
    </aside>
  );
}
