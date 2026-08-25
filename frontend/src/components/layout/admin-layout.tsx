import { Link, Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Logo } from '@/components/brand/logo';
import { adminNav } from './nav-config';
import { AdminNavLinkItem } from './nav-link';
import { AdminBottomNav } from './admin-bottom-nav';

export function AdminLayout() {
  const { t } = useTranslation();

  return (
    <div className="fixed inset-0 z-0 flex h-[100dvh] max-h-[100dvh] min-h-0 w-full max-w-full overflow-hidden bg-surface-raised edge-to-edge">
      <a
        href="#admin-main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-[var(--radius-md)] focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground focus:outline-none"
      >
        {t('a11y.skipToContent')}
      </a>
      <aside className="hidden md:flex md:flex-col md:w-56 lg:w-60 shrink-0 border-r border-border-subtle bg-surface-base sticky top-0 h-[100dvh] py-6 px-4">
        <Link to="/admin" className="px-3 mb-6">
          <Logo size="sm" />
          <p className="text-xs text-text-secondary mt-1">{t('admin.dashboardSub')}</p>
        </Link>
        <nav className="flex flex-col gap-1" aria-label="Admin navigation">
          {adminNav.map((item) => (
            <AdminNavLinkItem key={item.to} item={item} />
          ))}
        </nav>
        <Link to="/" className="mt-auto px-3 text-sm text-primary hover:underline">
          ← {t('nav.marketplace')}
        </Link>
      </aside>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <header className="md:hidden shrink-0 sticky top-0 z-40 border-b border-border-subtle bg-surface-base">
          <div className="px-4 h-14 flex items-center gap-3">
            <Logo size="sm" />
            <span className="font-semibold text-sm">{t('admin.dashboard')}</span>
          </div>
        </header>
        <main
          id="admin-main-content"
          className="app-scroll-region flex-1 min-h-0 overflow-y-auto overscroll-y-contain pb-[var(--shell-bottom-nav-height)] md:pb-0"
          tabIndex={-1}
        >
          <Outlet />
        </main>
        <AdminBottomNav />
      </div>
    </div>
  );
}
