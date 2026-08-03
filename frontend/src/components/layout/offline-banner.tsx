import { useTranslation } from 'react-i18next';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '@/hooks/use-online-status';
import { cn } from '@/lib/utils';

export function OfflineBanner({ className }: { className?: string }) {
  const { t } = useTranslation();
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      data-testid="offline-banner"
      className={cn(
        'flex items-center justify-center gap-2 bg-warning text-white px-4 py-2 text-sm font-medium',
        className,
      )}
    >
      <WifiOff className="h-4 w-4 shrink-0" aria-hidden />
      <span>{t('sync.offlineBanner')}</span>
    </div>
  );
}
