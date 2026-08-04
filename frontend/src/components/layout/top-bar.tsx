import { useNavigate } from 'react-router-dom';
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
  actions?: React.ReactNode;
}

export function TopBar({
  title,
  showBack,
  backTo,
  large,
  showLogo,
  showNotifications = true,
  actions,
}: TopBarProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const badges = useNavBadges();

  return (
    <header
      className={cn(
        'sticky top-0 z-40 border-b border-border-subtle bg-surface-base/95 backdrop-blur supports-[backdrop-filter]:bg-surface-base/80',
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
        {showNotifications && (
          <button
            type="button"
            aria-label={badges.notifications ? t('shell.notificationsUnread', { count: badges.notifications }) : t('shell.notifications')}
            className="relative flex h-10 w-10 items-center justify-center rounded-full hover:bg-surface-raised"
            onClick={() => navigate('/notifications')}
          >
            <Bell className="h-5 w-5" />
            <NavBadge count={badges.notifications} />
          </button>
        )}
      </div>
    </header>
  );
}
