import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronUp, ChevronDown, ShoppingCart, Inbox } from 'lucide-react';
import { useNavBadges } from '@/hooks/use-nav-badges';
import { useCart } from '@/hooks/use-api';
import { useShellStore } from '@/stores/shell-store';
import { Button } from '@/components/ui/button';
import { cartGrandTotal } from '@/lib/cart-utils';
import { formatPrice } from '@/lib/utils';
import { cn } from '@/lib/utils';

const PREVIEW_LIMIT = 3;

export function RequestBottomSheet() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const badges = useNavBadges();
  const { data: cart } = useCart();
  const expanded = useShellStore((s) => s.bottomSheetExpanded);
  const toggle = useShellStore((s) => s.toggleBottomSheet);

  const grouped = cart?.groupedBySeller ?? {};
  const sellerIds = Object.keys(grouped);
  const grandTotal = cartGrandTotal(grouped);
  const previewItems = cart?.items?.slice(0, PREVIEW_LIMIT) ?? [];

  const total = badges.cart + badges.requests;
  if (total === 0 && !expanded) return null;

  return (
    <div
      data-testid="request-bottom-sheet"
      className={cn(
        'fixed left-0 right-0 z-40 border-t border-border-subtle bg-surface-raised/95 backdrop-blur supports-[backdrop-filter]:bg-surface-raised/90',
        'shell-above-bottom-nav lg:left-60 lg:bottom-0',
      )}
    >
      <button
        type="button"
        className="flex w-full items-center justify-between gap-2 shell-gutter-x py-2 min-h-[44px]"
        onClick={toggle}
        aria-expanded={expanded}
        aria-label={expanded ? t('shell.collapse') : t('shell.expand')}
      >
        <div className="flex items-center gap-3 text-sm min-w-0">
          <ShoppingCart className="h-4 w-4 text-primary shrink-0" />
          <span className="truncate">{t('shell.cartItems', { count: badges.cart })}</span>
          {badges.cart > 0 && (
            <span className="text-xs font-medium text-primary tabular-nums shrink-0">{formatPrice(grandTotal)}</span>
          )}
          {badges.requests > 0 && (
            <>
              <span className="text-text-disabled">·</span>
              <Inbox className="h-4 w-4 text-warning shrink-0" />
              <span>{t('shell.pendingRequests', { count: badges.requests })}</span>
            </>
          )}
        </div>
        {expanded ? <ChevronDown className="h-4 w-4 shrink-0" /> : <ChevronUp className="h-4 w-4 shrink-0" />}
      </button>

      {expanded && (
        <div className="shell-gutter-x pb-3 flex flex-col gap-2 border-t border-border-subtle pt-2">
          <p className="text-xs text-text-secondary">
            {t('shell.requestSheetTitle')}
            {t('shell.requestSheetSub') ? (
              <span className="block text-[10px] text-text-disabled">{t('shell.requestSheetSub')}</span>
            ) : null}
          </p>

          {previewItems.length > 0 && (
            <ul className="text-xs space-y-1 max-h-24 overflow-y-auto">
              {previewItems.map((item) => (
                <li key={item.id} className="flex justify-between gap-2 text-text-secondary">
                  <span className="truncate">{item.listing.medicine.name}</span>
                  <span className="tabular-nums shrink-0">×{item.quantity}</span>
                </li>
              ))}
              {(cart?.items?.length ?? 0) > PREVIEW_LIMIT && (
                <li className="text-text-disabled">{t('shell.moreCartItems', { count: (cart?.items?.length ?? 0) - PREVIEW_LIMIT })}</li>
              )}
            </ul>
          )}

          {sellerIds.length > 0 && (
            <p className="text-sm font-medium tabular-nums">
              {t('cart.grandTotalLabel')}: {formatPrice(grandTotal)}
            </p>
          )}

          <div className="flex gap-2">
            <Button size="sm" className="flex-1" variant="secondary" onClick={() => navigate('/cart')}>
              {t('shell.viewCart')}
            </Button>
            <Button size="sm" className="flex-1" variant="secondary" onClick={() => navigate('/cart?tab=orders')}>
              {t('shell.viewOrders')}
            </Button>
            <Button size="sm" className="flex-1" onClick={() => navigate('/cart?tab=requests')}>
              {t('shell.viewRequests')}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
