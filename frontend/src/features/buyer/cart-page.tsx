import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Trash2, MessageCircle } from 'lucide-react';
import { TopBar } from '@/components/layout/top-bar';
import { Button } from '@/components/ui/button';
import { StatusChip } from '@/components/ui/status-chip';
import { ListSkeleton } from '@/components/ui/skeleton';
import { useCart, useOrders, useBuyRequests, useRemoveFromCart, useStartConversation } from '@/hooks/use-api';
import { usePageRole } from '@/hooks/use-page-role';
import { apiClient } from '@/lib/api';
import { formatPrice } from '@/lib/utils';
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import type { CartItem } from '@/types';

export function CartPage() {
  const { t } = useTranslation();
  const { data, isLoading, isError } = useCart();
  const removeItem = useRemoveFromCart();
  const startChat = useStartConversation();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [error, setError] = useState('');
  const [sending, setSending] = useState<string | null>(null);
  const grouped = data?.groupedBySeller ?? {};

  const sendBuyRequest = async (sellerId: string, items: CartItem[]) => {
    setError('');
    setSending(sellerId);
    try {
      await apiClient.post('/buy-requests', {
        sellerId,
        listingIds: items.map((i) => ({ listingId: i.listing.id, quantity: i.quantity })),
      });
      qc.invalidateQueries({ queryKey: ['cart'] });
      toast({ description: t('toast.buyRequestSent') });
      navigate('/buy-requests');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSending(null);
    }
  };

  const handleChat = async (items: CartItem[]) => {
    const userId = items[0]?.listing.pharmacy.userId;
    if (!userId) return;
    const conv = await startChat.mutateAsync({ participantId: userId, listingId: items[0].listing.id });
    navigate(`/chat/${conv.id}`);
  };

  const handleRemove = (id: string) => {
    removeItem.mutate(id, {
      onSuccess: () => toast({ description: t('toast.removedFromCart') }),
    });
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

  return (
    <div>
      <TopBar title={t('cart.title')} />
      <div className="p-4 space-y-4">
        {error && <p className="text-sm text-danger text-center">{error}</p>}
        {sellerIds.map((sellerId) => {
          const items = grouped[sellerId];
          const subtotal = items.reduce((sum, i) => sum + Number(i.listing.finalPrice) * i.quantity, 0);
          return (
            <div key={sellerId} className="rounded-[var(--radius-md)] border border-border-subtle overflow-hidden">
              <div className="flex items-center justify-between p-3 bg-surface-raised">
                <span className="font-medium text-sm">{items[0].listing.pharmacy.name} ({t('common.items', { count: items.length })})</span>
                <Button variant="ghost" size="sm" aria-label={t('cart.messageSeller')} onClick={() => handleChat(items)}>
                  <MessageCircle className="h-4 w-4" />
                </Button>
              </div>
              {items.map((item) => (
                <div key={item.id} className="flex items-center gap-3 p-3 border-t border-border-subtle">
                  <div className="h-12 w-12 rounded bg-surface-sunken flex items-center justify-center text-lg">💊</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.listing.medicine.name}</p>
                    <p className="text-xs text-text-secondary">{item.quantity} · {formatPrice(Number(item.listing.finalPrice) * item.quantity)}</p>
                  </div>
                  <button
                    className="p-2 text-text-secondary hover:text-danger"
                    aria-label={t('cart.removeItem')}
                    onClick={() => handleRemove(item.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
              <div className="flex items-center justify-between p-3 border-t border-border-subtle bg-surface-raised">
                <span className="font-medium tabular-nums">{t('cart.subtotal', { amount: formatPrice(subtotal) })}</span>
                <Button size="sm" loading={sending === sellerId} onClick={() => sendBuyRequest(sellerId, items)}>
                  {t('cart.sendBuyRequest')} →
                </Button>
              </div>
            </div>
          );
        })}
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
