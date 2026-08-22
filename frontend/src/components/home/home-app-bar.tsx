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
      className="sticky top-0 z-40 flex h-14 items-center justify-between gap-1 border-b border-border-subtle glass-surface px-3 shadow-elevation-1"
      data-testid="home-app-bar"
    >
      <div className="flex items-center gap-1.5">
        <Logo size="xs" className="shrink-0" />
        <span className="whitespace-nowrap text-sm font-semibold leading-none tracking-tight text-text-primary">
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
          className="relative flex h-8 w-8 items-center justify-center rounded-full hover:bg-surface-raised"
          onClick={() => navigate('/notifications')}
        >
          <Bell className="h-4 w-4" />
          <NavBadge count={badges.notifications} />
        </button>
      </div>
    </header>
  );
}
