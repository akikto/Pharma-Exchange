import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/stores/auth-store';
import { useNavBadges } from '@/hooks/use-nav-badges';
import { getNavItems } from './nav-config';
import { NavLinkItem } from './nav-link';

export function BottomNav() {
  const { t } = useTranslation();
  const mode = useAuthStore((s) => s.mode);
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
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border-subtle/80 glass-surface shadow-[0_-4px_20px_rgba(12,24,22,0.07)] safe-bottom lg:hidden dark:shadow-[0_-4px_24px_rgba(0,0,0,0.35)]" aria-label={t('nav.mobileNavigation')} data-testid="bottom-nav">
      <div className="flex items-center justify-around h-16 max-w-2xl mx-auto w-full">
        {nav.map((item) => (
          <NavLinkItem key={item.to} item={item} variant="bottom" badgeCount={badgeFor(item.badgeKey)} />
        ))}
      </div>
    </nav>
  );
}
