import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Bell } from 'lucide-react';
import { Logo } from '@/components/brand/logo';
import { NavBadge } from '@/components/ui/nav-badge';
import { useNavBadges } from '@/hooks/use-nav-badges';
import { HomeHeaderActions } from '@/components/home/home-header-actions';

export function HomeAppBar() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const badges = useNavBadges();

  return (
    <header
      className="sticky top-0 z-40 flex h-14 items-center justify-between gap-3 border-b border-border-subtle bg-surface-base/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-surface-base/80"
      data-testid="home-app-bar"
    >
      <div className="flex min-w-0 items-center gap-2.5">
        <Logo size="sm" className="shrink-0" />
        <span className="truncate text-base font-semibold tracking-tight text-text-primary">
          {t('common.appName')}
        </span>
      </div>

      <div className="flex shrink-0 items-center">
        <HomeHeaderActions />
        <button
          type="button"
          aria-label={
            badges.notifications
              ? t('shell.notificationsUnread', { count: badges.notifications })
              : t('shell.notifications')
          }
          className="relative flex h-10 w-10 items-center justify-center rounded-full hover:bg-surface-raised"
          onClick={() => navigate('/notifications')}
        >
          <Bell className="h-5 w-5" />
          <NavBadge count={badges.notifications} />
        </button>
      </div>
    </header>
  );
}
