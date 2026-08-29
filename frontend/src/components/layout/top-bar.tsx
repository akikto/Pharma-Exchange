import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Bell, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Logo } from '@/components/brand/logo';
import { NavBadge } from '@/components/ui/nav-badge';
import { useNavBadges } from '@/hooks/use-nav-badges';

interface TopBarProps {
  title?: string;
  showBack?: boolean;
  backTo?: string;
  large?: boolean;
  showLogo?: boolean;
  showNotifications?: boolean;
  /** Mobile only: trailing control navigates to marketplace Home (`/`) instead of notifications. */
  mobileBackToMarketplace?: boolean;
  actions?: React.ReactNode;
}

export function TopBar({
  title,
  showBack,
  backTo,
  large,
  showLogo,
  showNotifications = true,
  mobileBackToMarketplace = false,
  actions,
}: TopBarProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const badges = useNavBadges();
  const notificationsPath = pathname.startsWith('/admin') ? '/admin/notifications' : '/notifications';

  return (
    <header
      className={cn(
        'app-header-premium sticky top-0 z-40',
        large ? 'px-4 pt-4 pb-2' : 'px-4 h-14 flex items-center gap-3',
      )}
    >
      {showBack && (
        <button
          type="button"
          aria-label={t('common.goBack')}
          className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-surface-raised"
          onClick={() => (backTo ? navigate(backTo) : navigate(-1))}
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
      )}
      {showLogo && <Logo size="sm" />}
      {title && (
        <h1 className={cn('font-bold flex-1', large ? 'text-2xl' : 'text-base')}>{title}</h1>
      )}
      <div className="flex items-center gap-1 ml-auto">
        {actions}
        {mobileBackToMarketplace && (
          <button
            type="button"
            data-testid="admin-dashboard-back-marketplace"
            aria-label={t('admin.backToMarketplace')}
            className="flex h-11 w-11 items-center justify-center rounded-full hover:bg-surface-raised md:hidden"
            onClick={() => navigate('/')}
          >
            <ArrowLeft className="h-5 w-5" aria-hidden />
          </button>
        )}
        {showNotifications && (
          <button
            type="button"
            aria-label={badges.notifications ? t('shell.notificationsUnread', { count: badges.notifications }) : t('shell.notifications')}
            className={cn(
              'relative flex h-10 w-10 items-center justify-center rounded-full hover:bg-surface-raised',
              mobileBackToMarketplace && 'hidden md:flex',
            )}
            onClick={() => navigate(notificationsPath)}
          >
            <Bell className="h-5 w-5" />
            <NavBadge count={badges.notifications} />
          </button>
        )}
      </div>
    </header>
  );
}
