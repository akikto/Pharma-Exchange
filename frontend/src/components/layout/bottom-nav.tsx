import { useAuthStore } from '@/stores/auth-store';
import { useNavBadges } from '@/hooks/use-nav-badges';
import { getNavItems } from './nav-config';
import { NavLinkItem } from './nav-link';

export function BottomNav() {
  const mode = useAuthStore((s) => s.mode);
  const badges = useNavBadges();
  const nav = getNavItems(mode);

  const badgeFor = (key?: string) => {
    if (key === 'cart') return badges.cart;
    if (key === 'chat') return badges.chat;
    if (key === 'requests') return badges.requests;
    return 0;
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border-subtle bg-surface-base safe-bottom lg:hidden" aria-label="Main navigation" data-testid="bottom-nav">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
        {nav.map((item) => (
          <NavLinkItem key={item.to} item={item} variant="bottom" badgeCount={badgeFor(item.badgeKey)} />
        ))}
      </div>
    </nav>
  );
}
