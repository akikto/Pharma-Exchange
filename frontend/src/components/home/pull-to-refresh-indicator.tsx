import { useTranslation } from 'react-i18next';
import { RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PullToRefreshIndicatorProps {
  pullDistance: number;
  isRefreshing: boolean;
  isTriggered: boolean;
  threshold?: number;
}

export function PullToRefreshIndicator({
  pullDistance,
  isRefreshing,
  isTriggered,
  threshold = 72,
}: PullToRefreshIndicatorProps) {
  const { t } = useTranslation();
  const visible = pullDistance > 0 || isRefreshing;
  const progress = Math.min(pullDistance / threshold, 1);

  if (!visible) return null;

  return (
    <div
      className="flex items-center justify-center py-2 text-text-secondary"
      data-testid="pull-to-refresh-indicator"
      aria-live="polite"
    >
      <RefreshCw
        className={cn('h-5 w-5 mr-2', isRefreshing && 'animate-spin')}
        style={{ transform: !isRefreshing ? `rotate(${progress * 180}deg)` : undefined }}
      />
      <span className="text-xs">
        {isRefreshing
          ? t('home.refreshing')
          : isTriggered
            ? t('home.releaseToRefresh')
            : t('home.pullToRefresh')}
      </span>
    </div>
  );
}
