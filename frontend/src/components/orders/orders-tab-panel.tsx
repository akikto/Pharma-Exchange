import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Search, MapPin, Receipt, RotateCcw } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { StatusChip } from '@/components/ui/status-chip';
import { ListSkeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { OrderReceiptDialog } from '@/components/orders/order-receipt-dialog';
import { TrackingDialog } from '@/components/orders/tracking-dialog';
import { useOrders, useAddToCart } from '@/hooks/use-api';
import { useHubRole } from '@/hooks/use-hub-role';
import { useToast } from '@/hooks/use-toast';
import {
  type OrderFilter,
  filterOrders,
  computeOrderStats,
  canTrackOrder,
} from '@/lib/order-utils';
import { formatPrice } from '@/lib/utils';
import type { Order } from '@/types';

const ORDER_FILTERS: OrderFilter[] = ['ALL', 'ACTIVE', 'DELIVERED', 'CANCELLED'];

export function OrdersTabPanel() {
  const { t } = useTranslation();
  const role = useHubRole();
  const { data, isLoading, isError } = useOrders(role);
  const addToCart = useAddToCart();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<OrderFilter>('ALL');
  const [query, setQuery] = useState('');
  const [receiptOrder, setReceiptOrder] = useState<Order | null>(null);
  const [trackOrder, setTrackOrder] = useState<Order | null>(null);
  const [reorderingId, setReorderingId] = useState<string | null>(null);

  const orders = data?.data ?? [];
  const filtered = filterOrders(orders, filter, query);
  const stats = role === 'buyer' ? computeOrderStats(orders) : null;
  const orderBasePath = role === 'seller' ? '/seller/orders' : '/orders';

  const counterparty = (order: Order) =>
    role === 'seller'
      ? `${order.buyer?.firstName ?? ''} ${order.buyer?.lastName ?? ''}`.trim()
      : (order.seller?.name ?? '');

  const handleReorder = async (order: Order) => {
    const itemsWithListing = order.items.filter((i) => i.listingId);
    if (itemsWithListing.length === 0) {
      toast({ title: t('toast.error'), description: t('orders.reorderUnavailable'), variant: 'destructive' });
      return;
    }
    setReorderingId(order.id);
    try {
      for (const item of itemsWithListing) {
        await addToCart.mutateAsync({ listingId: item.listingId!, quantity: item.quantity });
      }
      toast({ description: t('orders.reorderSuccess') });
      navigate('/cart');
    } catch (e) {
      toast({ title: t('toast.error'), description: (e as Error).message, variant: 'destructive' });
    } finally {
      setReorderingId(null);
    }
  };

  if (isLoading) return <ListSkeleton />;
  if (isError) return <p className="text-center text-danger py-12">{t('orders.loadError')}</p>;

  return (
    <div className="space-y-4">
      {stats && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Card><CardContent className="p-3"><p className="text-[10px] text-text-secondary">{t('orders.statsActive')}</p><p className="text-lg font-bold tabular-nums">{stats.active}</p></CardContent></Card>
          <Card><CardContent className="p-3"><p className="text-[10px] text-text-secondary">{t('orders.statsDelivered')}</p><p className="text-lg font-bold tabular-nums">{stats.delivered}</p></CardContent></Card>
          <Card><CardContent className="p-3"><p className="text-[10px] text-text-secondary">{t('orders.statsTotal')}</p><p className="text-lg font-bold tabular-nums">{stats.total}</p></CardContent></Card>
          <Card><CardContent className="p-3"><p className="text-[10px] text-text-secondary">{t('orders.statsSpent')}</p><p className="text-lg font-bold tabular-nums">{formatPrice(stats.totalSpent)}</p></CardContent></Card>
        </div>
      )}

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-secondary" />
        <Input
          className="pl-9"
          placeholder={t('orders.searchPlaceholder')}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {ORDER_FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium border min-h-[36px] ${
              filter === f ? 'bg-primary text-primary-foreground border-primary' : 'border-border-subtle'
            }`}
          >
            {t(`orders.filter.${f.toLowerCase()}`)}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="text-center text-text-secondary py-12">{t('orders.noOrders')}</p>
      ) : (
        <div className="space-y-3">
          {filtered.map((order) => (
            <div key={order.id} className="rounded-[var(--radius-md)] border border-border-subtle p-3 space-y-2">
              <Link to={`${orderBasePath}/${order.id}`} className="block">
                <div className="flex justify-between items-start gap-2">
                  <span className="font-medium text-sm">{order.orderNumber}</span>
                  <StatusChip
                    label={order.status}
                    variant={order.status === 'DELIVERED' ? 'success' : order.status === 'CANCELLED' ? 'danger' : 'warning'}
                  />
                </div>
                <p className="text-sm text-text-secondary mt-1">
                  {counterparty(order)} · {formatPrice(order.totalAmount)}
                </p>
                <p className="text-xs text-text-disabled">{new Date(order.createdAt).toLocaleDateString()}</p>
              </Link>
              <div className="flex flex-wrap gap-2">
                {role === 'buyer' && order.status === 'DELIVERED' && (
                  <Button size="sm" variant="secondary" loading={reorderingId === order.id} onClick={() => handleReorder(order)}>
                    <RotateCcw className="h-3 w-3 mr-1" />
                    {t('orders.reorder')}
                  </Button>
                )}
                {canTrackOrder(order.status) && (
                  <Button size="sm" variant="secondary" onClick={() => setTrackOrder(order)}>
                    <MapPin className="h-3 w-3 mr-1" />
                    {t('orders.track')}
                  </Button>
                )}
                <Button size="sm" variant="ghost" onClick={() => setReceiptOrder(order)}>
                  <Receipt className="h-3 w-3 mr-1" />
                  {t('orders.receipt')}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {receiptOrder && (
        <OrderReceiptDialog
          order={receiptOrder}
          counterpartyLabel={counterparty(receiptOrder)}
          open={!!receiptOrder}
          onClose={() => setReceiptOrder(null)}
        />
      )}
      {trackOrder && (
        <TrackingDialog order={trackOrder} open={!!trackOrder} onClose={() => setTrackOrder(null)} />
      )}
    </div>
  );
}
