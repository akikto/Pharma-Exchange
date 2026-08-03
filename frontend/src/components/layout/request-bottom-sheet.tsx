import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronUp, ChevronDown, ShoppingCart, Inbox } from 'lucide-react';
import { useNavBadges } from '@/hooks/use-nav-badges';
import { useShellStore } from '@/stores/shell-store';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function RequestBottomSheet() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const badges = useNavBadges();
  const expanded = useShellStore((s) => s.bottomSheetExpanded);
  const toggle = useShellStore((s) => s.toggleBottomSheet);

  const total = badges.cart + badges.requests;
  if (total === 0 && !expanded) return null;

  return (
    <div
      data-testid="request-bottom-sheet"
      className={cn(
        'fixed left-0 right-0 z-40 border-t border-border-subtle bg-surface-raised/95 backdrop-blur supports-[backdrop-filter]:bg-surface-raised/90',
        'lg:left-60',
        expanded ? 'bottom-16 lg:bottom-0' : 'bottom-16 lg:bottom-0',
      )}
    >
      <button
        type="button"
        className="flex w-full items-center justify-between gap-2 px-4 py-2 min-h-[44px]"
        onClick={toggle}
        aria-expanded={expanded}
        aria-label={expanded ? t('shell.collapse') : t('shell.expand')}
      >
        <div className="flex items-center gap-3 text-sm">
          <ShoppingCart className="h-4 w-4 text-primary shrink-0" />
          <span>{t('shell.cartItems', { count: badges.cart })}</span>
          {badges.requests > 0 && (
            <>
              <span className="text-text-disabled">·</span>
              <Inbox className="h-4 w-4 text-warning shrink-0" />
              <span>{t('shell.pendingRequests', { count: badges.requests })}</span>
            </>
          )}
        </div>
        {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
      </button>

      {expanded && (
        <div className="px-4 pb-3 flex flex-col gap-2 border-t border-border-subtle pt-2">
          <p className="text-xs text-text-secondary">
            {t('shell.requestSheetTitle')}
            <span className="block text-[10px] text-text-disabled">{t('shell.requestSheetSub')}</span>
          </p>
          <div className="flex gap-2">
            <Button size="sm" className="flex-1" variant="secondary" onClick={() => navigate('/cart')}>
              {t('shell.viewCart')}
            </Button>
            <Button size="sm" className="flex-1" onClick={() => navigate('/buy-requests')}>
              {t('shell.viewRequests')}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
