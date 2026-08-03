import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { TopBar } from '@/components/layout/top-bar';
import { Button } from '@/components/ui/button';
import { StatusChip } from '@/components/ui/status-chip';
import { ListSkeleton } from '@/components/ui/skeleton';
import { SellerCartGroup } from '@/components/cart/seller-cart-group';
import {
  useCart,
  useOrders,
  useBuyRequests,
  useRemoveFromCart,
  useStartConversation,
  useUpdateCartItem,
} from '@/hooks/use-api';
import { usePageRole } from '@/hooks/use-page-role';
import { apiClient } from '@/lib/api';
import { cartGrandTotal } from '@/lib/cart-utils';
import { formatPrice } from '@/lib/utils';
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import type { CartItem } from '@/types';

export function CartPage() {
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

  const sendBuyRequest = async (sellerId: string, items: CartItem[]) => {
    setError('');
    setSending(sellerId);
    try {
      const result = await apiClient.post<{ id: string }>('/buy-requests', {
        sellerId,
        listingIds: items.map((i) => ({ listingId: i.listing.id, quantity: i.quantity })),
        note: notes[sellerId]?.trim() || undefined,
      });
      qc.invalidateQueries({ queryKey: ['cart'] });
      qc.invalidateQueries({ queryKey: ['buy-requests'] });
      toast({ description: t('toast.buyRequestSent') });
      navigate(`/buy-requests/${result.id}`);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSending(null);
    }
  };

  const handleChat = async (items: CartItem[]) => {
    const userId = items[0]?.listing.pharmacy.userId;
    if (!userId) {
      toast({ title: t('toast.error'), description: t('cart.chatUnavailable'), variant: 'destructive' });
      return;
    }
    try {
      const conv = await startChat.mutateAsync({ participantId: userId, listingId: items[0].listing.id });
      navigate(`/chat/${conv.id}`);
    } catch (e) {
      toast({ title: t('toast.error'), description: (e as Error).message, variant: 'destructive' });
    }
  };

  const handleRemove = (id: string) => {
    removeItem.mutate(id, {
      onSuccess: () => toast({ description: t('toast.removedFromCart') }),
    });
  };

  const handleQuantityChange = (cartItemId: string, quantity: number) => {
    setUpdatingId(cartItemId);
    updateItem.mutate(
      { id: cartItemId, quantity },
      {
        onSuccess: () => toast({ description: t('cart.quantityUpdated') }),
        onError: (e) => toast({ title: t('toast.error'), description: e.message, variant: 'destructive' }),
        onSettled: () => setUpdatingId(null),
      },
    );
  };

  if (isLoading) return <div className="p-4"><ListSkeleton /></div>;
  if (isError) return <div className="p-4 text-center text-danger">{t('cart.loadError')}</div>;

  const sellerIds = Object.keys(grouped);
  if (sellerIds.length === 0) {
    return (
      <div>
        <TopBar title={t('cart.title')} />
        <div className="text-center py-16 px-4">
          <p className="text-lg font-medium">{t('cart.empty')}</p>
          <p className="text-text-secondary text-sm mt-1">{t('cart.emptyHint')}</p>
          <Link to="/search"><Button className="mt-4">{t('cart.browseMedicines')}</Button></Link>
        </div>
      </div>
    );
  }

  const grandTotal = cartGrandTotal(grouped);

  return (
    <div className="pb-28">
      <TopBar title={t('cart.title')} />
      <div className="p-4 space-y-4">
        <p className="text-xs text-text-secondary">{t('cart.checkoutHint')}</p>
        {error && <p className="text-sm text-danger text-center">{error}</p>}
        {sellerIds.map((sellerId) => (
          <SellerCartGroup
            key={sellerId}
            sellerId={sellerId}
            items={grouped[sellerId]}
            note={notes[sellerId] ?? ''}
            onNoteChange={(note) => setNotes((prev) => ({ ...prev, [sellerId]: note }))}
            onQuantityChange={handleQuantityChange}
            onRemove={handleRemove}
            onChat={() => handleChat(grouped[sellerId])}
            onSendBuyRequest={() => sendBuyRequest(sellerId, grouped[sellerId])}
            sending={sending === sellerId}
            updatingId={updatingId}
          />
        ))}
      </div>

      <div className="fixed bottom-16 left-0 right-0 lg:left-60 z-30 border-t border-border-subtle bg-surface-raised/95 backdrop-blur px-4 py-3">
        <div className="flex items-center justify-between max-w-3xl mx-auto">
          <div>
            <p className="text-xs text-text-secondary">{t('cart.grandTotalLabel')}</p>
            <p className="text-lg font-bold tabular-nums">{formatPrice(grandTotal)}</p>
            <p className="text-[10px] text-text-disabled">{t('cart.grandTotalHint')}</p>
          </div>
          <span className="text-xs text-text-secondary">{t('cart.sellerGroups', { count: sellerIds.length })}</span>
        </div>
      </div>
    </div>
  );
}

export function OrdersPage() {
  const { t } = useTranslation();
  const role = usePageRole();
  const { data, isLoading, isError } = useOrders(role);
  const title = role === 'seller' ? t('orders.sellerTitle') : t('orders.title');

  return (
    <div>
      <TopBar title={title} showBack />
      <div className="p-4">
        {isLoading ? <ListSkeleton /> : isError ? (
          <p className="text-center text-danger py-12">{t('orders.loadError')}</p>
        ) : data?.data.length === 0 ? (
          <p className="text-center text-text-secondary py-12">{t('orders.noOrders')}</p>
        ) : (
          <div className="space-y-3">
            {data?.data.map((order) => (
              <Link key={order.id} to={`/orders/${order.id}`} className="block p-3 rounded-[var(--radius-md)] border border-border-subtle">
                <div className="flex justify-between">
                  <span className="font-medium text-sm">{order.orderNumber}</span>
                  <StatusChip label={order.status} variant={order.status === 'DELIVERED' ? 'success' : 'warning'} />
                </div>
                <p className="text-sm text-text-secondary mt-1">
                  {role === 'seller' ? `${order.buyer?.firstName} ${order.buyer?.lastName}` : order.seller?.name} · {formatPrice(order.totalAmount)}
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function BuyRequestsPage() {
  const { t } = useTranslation();
  const role = usePageRole();
  const { data, isLoading, isError } = useBuyRequests(role);
  const title = role === 'seller' ? t('buyRequest.incomingTitle') : t('buyRequest.title');
  const basePath = role === 'seller' ? '/seller/requests' : '/buy-requests';

  return (
    <div>
      <TopBar title={title} showBack />
      <div className="p-4">
        {isLoading ? <ListSkeleton /> : isError ? (
          <p className="text-center text-danger py-12">{t('buyRequest.loadError')}</p>
        ) : data?.data.length === 0 ? (
          <p className="text-center text-text-secondary py-12">
            {role === 'seller' ? t('seller.noPending') : t('buyRequest.noSent')}
          </p>
        ) : (
          <div className="space-y-3">
            {data?.data.map((req) => (
              <Link key={req.id} to={`${basePath}/${req.id}`} className="block p-3 rounded-[var(--radius-md)] border border-border-subtle">
                <div className="flex justify-between">
                  <span className="font-medium text-sm">{req.requestNumber}</span>
                  <StatusChip label={req.status} variant={req.status === 'ACCEPTED' ? 'success' : req.status === 'REJECTED' ? 'danger' : 'warning'} />
                </div>
                <p className="text-sm text-text-secondary">
                  {role === 'seller' ? `${req.buyer?.firstName} ${req.buyer?.lastName}` : req.seller?.name} · {formatPrice(req.totalAmount)}
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
