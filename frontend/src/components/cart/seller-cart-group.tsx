import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown, ChevronUp, MessageCircle, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { QuantityStepper } from '@/components/cart/quantity-stepper';
import { cartGroupSubtotal } from '@/lib/cart-utils';
import { formatPrice } from '@/lib/utils';
import type { CartItem } from '@/types';

interface SellerCartGroupProps {
  sellerId: string;
  items: CartItem[];
  itemIssues?: Record<string, string>;
  note: string;
  onNoteChange: (note: string) => void;
  onQuantityChange: (cartItemId: string, quantity: number) => void;
  onRemove: (cartItemId: string) => void;
  onChat: () => void;
  onSendBuyRequest: () => void;
  sending?: boolean;
  updatingId?: string | null;
}

export function SellerCartGroup({
  items,
  itemIssues = {},
  note,
  onNoteChange,
  onQuantityChange,
  onRemove,
  onChat,
  onSendBuyRequest,
  sending,
  updatingId,
}: SellerCartGroupProps) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(true);
  const subtotal = cartGroupSubtotal(items);
  const pharmacy = items[0]?.listing.pharmacy;

  return (
    <div className="rounded-[var(--radius-md)] border border-border-subtle overflow-hidden">
      <button
        type="button"
        className="flex w-full items-center justify-between gap-2 p-3 bg-surface-raised min-h-[44px]"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
      >
        <div className="text-left min-w-0">
          <p className="font-medium text-sm truncate">{pharmacy?.name}</p>
          <p className="text-xs text-text-secondary">
            {pharmacy?.city} · {t('common.items', { count: items.length })}
          </p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Button
            variant="ghost"
            size="sm"
            aria-label={t('cart.messageSeller')}
            onClick={(e) => {
              e.stopPropagation();
              onChat();
            }}
          >
            <MessageCircle className="h-4 w-4" />
          </Button>
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </div>
      </button>

      {expanded && (
        <>
          {items.map((item) => {
            if (!item.listing?.id) return null;
            return (
            <article
              key={item.id}
              className="border-t border-border-subtle p-3 space-y-2"
              data-testid="cart-line-item"
            >
              <p
                className="w-full text-sm font-medium leading-snug break-words [overflow-wrap:anywhere]"
                data-testid="cart-item-medicine-name"
              >
                {item.listing.medicine?.name ?? '—'}
              </p>
              <p className="text-xs text-text-secondary tabular-nums">
                {formatPrice(Number(item.listing.finalPrice))} × {item.quantity} ={' '}
                {formatPrice(Number(item.listing.finalPrice) * item.quantity)}
              </p>
              {itemIssues[item.id] && (
                <p className="text-xs text-danger">{itemIssues[item.id]}</p>
              )}
              <div className="flex items-center justify-end gap-1 pt-1">
                <QuantityStepper
                  className="shrink-0"
                  value={item.quantity}
                  min={item.listing.moq}
                  max={item.listing.availableQty}
                  onChange={(qty) => onQuantityChange(item.id, qty)}
                  disabled={updatingId === item.id}
                  aria-label={t('cart.quantityFor', { name: item.listing.medicine?.name ?? '' })}
                />
                <button
                  type="button"
                  className="p-2 text-text-secondary hover:text-danger min-h-[44px] min-w-[44px] flex items-center justify-center shrink-0"
                  aria-label={t('cart.removeItem')}
                  onClick={() => onRemove(item.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </article>
            );
          })}

          <div className="p-3 border-t border-border-subtle space-y-3 bg-surface-raised/50">
            <div className="space-y-2">
              <Label htmlFor={`note-${pharmacy?.id}`}>{t('cart.note')}</Label>
              <Input
                id={`note-${pharmacy?.id}`}
                value={note}
                onChange={(e) => onNoteChange(e.target.value)}
                placeholder={t('cart.notePlaceholder')}
              />
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="font-medium tabular-nums text-sm">{t('cart.subtotal', { amount: formatPrice(subtotal) })}</span>
              <Button
                size="sm"
                loading={sending}
                disabled={items.some((item) => Boolean(itemIssues[item.id]))}
                onClick={onSendBuyRequest}
              >
                {t('cart.sendBuyRequest')} →
              </Button>
            </div>
            <p className="text-[10px] text-text-disabled">{t('cart.sendBuyRequestSub')}</p>
          </div>
        </>
      )}
    </div>
  );
}
