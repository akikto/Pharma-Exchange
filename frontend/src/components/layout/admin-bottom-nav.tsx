import { useTranslation } from 'react-i18next';
import { adminBottomNav } from './nav-config';
import { AdminBottomNavLinkItem } from './nav-link';

export function AdminBottomNav() {
  const { t } = useTranslation();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-border-subtle glass-surface shadow-[0_-4px_24px_rgba(15,27,25,0.08)] safe-bottom md:hidden dark:shadow-[0_-4px_24px_rgba(0,0,0,0.35)]"
      aria-label={t('nav.adminMobileNavigation')}
      data-testid="admin-bottom-nav"
    >
      <div className="flex h-16 max-w-2xl mx-auto w-full items-center justify-around">
        {adminBottomNav.map((item) => (
          <AdminBottomNavLinkItem key={item.to} item={item} />
        ))}
      </div>
    </nav>
  );
}
