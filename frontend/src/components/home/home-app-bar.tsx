import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Bell } from 'lucide-react';
import { Logo } from '@/components/brand/logo';
import { NavBadge } from '@/components/ui/nav-badge';
import { useNavBadges } from '@/hooks/use-nav-badges';
import { HomeHeaderActions } from '@/components/home/home-header-actions';
import { HOME_GUTTER_CLASS } from '@/components/home/home-layout';
import { cn } from '@/lib/utils';

export function HomeAppBar() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const badges = useNavBadges();

  return (
    <header
      className={cn(
        'app-header-premium sticky top-0 z-40 flex h-14 items-center justify-between gap-1',
        HOME_GUTTER_CLASS,
      )}
      data-testid="home-app-bar"
    >
      <div className="flex items-center gap-2">
        <Logo size="xs" className="shrink-0" />
        <span className="whitespace-nowrap text-sm font-bold leading-none tracking-tight text-secondary">
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
          className="relative flex h-8 w-8 items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-primary-subtle hover:text-primary"
          onClick={() => navigate('/notifications')}
        >
          <Bell className="h-4 w-4" />
          <NavBadge count={badges.notifications} />
        </button>
      </div>
    </header>
  );
}
