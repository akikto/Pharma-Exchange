import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { ListSkeleton } from '@/components/ui/skeleton';
import { SellerCartGroup } from '@/components/cart/seller-cart-group';
import { useCart, useRemoveFromCart, useStartConversation, useUpdateCartItem } from '@/hooks/use-api';
import { apiClient } from '@/lib/api';
import { cartGrandTotal } from '@/lib/cart-utils';
import {
  formatCartIssueMessage,
  findCartItemIssue,
  validateSellerCartGroup,
  type CartItemIssue,
} from '@/lib/cart-validation';
import { formatPrice } from '@/lib/utils';
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import type { CartItem } from '@/types';

export function CartTabPanel() {
  const { t } = useTranslation();
  const { data, isLoading, isError } = useCart();
  const removeItem = useRemoveFromCart();
  const updateItem = useUpdateCartItem();
  const startChat = useStartConversation();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [error, setError] = useState('');
  const [sending, setSending] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const grouped = data?.groupedBySeller ?? {};
  const serverIssues: CartItemIssue[] = data?.validationIssues ?? [];

  const sendBuyRequest = async (sellerId: string, items: CartItem[]) => {
    setError('');
    const clientIssues = validateSellerCartGroup(items);
    if (clientIssues.length > 0) {
      const message = formatCartIssueMessage(clientIssues[0]);
      setError(message);
      toast({ title: t('toast.error'), description: message, variant: 'destructive' });
      return;
    }

    setSending(sellerId);
    try {
      const result = await apiClient.post<{ id: string }>('/buy-requests', {
        sellerId,
        listingIds: items
          .filter((i) => i.listing?.id)
          .map((i) => ({ listingId: i.listing!.id, quantity: i.quantity })),
        note: notes[sellerId]?.trim() || undefined,
      });
      qc.invalidateQueries({ queryKey: ['cart'] });
      qc.invalidateQueries({ queryKey: ['buy-requests'] });
      toast({ description: t('toast.buyRequestSent') });
      navigate(`/buy-requests/${result.id}`);
    } catch (e) {
      const message = (e as Error).message;
      setError(message);
      toast({ title: t('toast.error'), description: message, variant: 'destructive' });
    } finally {
      setSending(null);
    }
  };

  const handleChat = async (items: CartItem[]) => {
    const userId = items[0]?.listing?.pharmacy?.userId;
    const listingId = items[0]?.listing?.id;
    if (!userId || !listingId) {
      toast({ title: t('toast.error'), description: t('cart.chatUnavailable'), variant: 'destructive' });
      return;
    }
    try {
      const conv = await startChat.mutateAsync({ participantId: userId, listingId });
      navigate(`/chat/${conv.id}`);
    } catch (e) {
      toast({ title: t('toast.error'), description: (e as Error).message, variant: 'destructive' });
    }
  };

  if (isLoading) return <ListSkeleton />;
  if (isError) return <p className="text-center text-danger py-8">{t('cart.loadError')}</p>;

  const sellerIds = Object.keys(grouped);
  if (sellerIds.length === 0) {
    return (
      <div className="text-center py-12 px-4" data-testid="cart-empty">
        <p className="text-lg font-medium">{t('cart.empty')}</p>
        <p className="text-text-secondary text-sm mt-1">{t('cart.emptyHint')}</p>
        <Link to="/search"><Button className="mt-4">{t('cart.browseMedicines')}</Button></Link>
      </div>
    );
  }

  const grandTotal = cartGrandTotal(grouped);

  return (
    <div className="space-y-4 pb-20" data-testid="cart-panel">
      <p className="text-xs text-text-secondary">{t('cart.checkoutHint')}</p>
      {error && <p className="text-sm text-danger text-center">{error}</p>}
      {sellerIds.map((sellerId) => (
        <SellerCartGroup
          key={sellerId}
          sellerId={sellerId}
          items={grouped[sellerId]}
          itemIssues={Object.fromEntries(
            grouped[sellerId]
              .map((item) => {
                const issue = findCartItemIssue(serverIssues, item.id)
                  ?? validateSellerCartGroup([item])[0];
                return issue ? [item.id, formatCartIssueMessage(issue)] as const : null;
              })
              .filter((entry): entry is [string, string] => entry !== null),
          )}
          note={notes[sellerId] ?? ''}
          onNoteChange={(note) => setNotes((prev) => ({ ...prev, [sellerId]: note }))}
          onQuantityChange={(cartItemId, quantity) => {
            setUpdatingId(cartItemId);
            updateItem.mutate(
              { id: cartItemId, quantity },
              {
                onSuccess: () => toast({ description: t('cart.quantityUpdated') }),
                onError: (e) => toast({ title: t('toast.error'), description: e.message, variant: 'destructive' }),
                onSettled: () => setUpdatingId(null),
              },
            );
          }}
          onRemove={(id) => removeItem.mutate(id, { onSuccess: () => toast({ description: t('toast.removedFromCart') }) })}
          onChat={() => handleChat(grouped[sellerId])}
          onSendBuyRequest={() => sendBuyRequest(sellerId, grouped[sellerId])}
          sending={sending === sellerId}
          updatingId={updatingId}
        />
      ))}
      <div className="rounded-[var(--radius-md)] border border-border-subtle bg-surface-raised p-3 flex justify-between items-center">
        <div>
          <p className="text-xs text-text-secondary">{t('cart.grandTotalLabel')}</p>
          <p className="text-lg font-bold tabular-nums">{formatPrice(grandTotal)}</p>
        </div>
        <span className="text-xs text-text-secondary">{t('cart.sellerGroups', { count: sellerIds.length })}</span>
      </div>
    </div>
  );
}
