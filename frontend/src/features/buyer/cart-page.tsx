import { Link } from 'react-router-dom';
import { Trash2, MessageCircle } from 'lucide-react';
import { TopBar } from '@/components/layout/top-bar';
import { Button } from '@/components/ui/button';
import { StatusChip } from '@/components/ui/status-chip';
import { ListSkeleton } from '@/components/ui/skeleton';
import { useCart, useOrders, useBuyRequests } from '@/hooks/use-api';
import { apiClient } from '@/lib/api';
import { formatPrice } from '@/lib/utils';
import { useQueryClient } from '@tanstack/react-query';
import type { CartItem } from '@/types';

export function CartPage() {
  const { data, isLoading } = useCart();
  const qc = useQueryClient();
  const grouped = data?.groupedBySeller ?? {};

  const sendBuyRequest = async (sellerId: string, items: CartItem[]) => {
    await apiClient.post('/buy-requests', {
      sellerId,
      listingIds: items.map((i) => ({ listingId: i.listing.id, quantity: i.quantity })),
    });
    qc.invalidateQueries({ queryKey: ['cart'] });
  };

  if (isLoading) return <div className="p-4"><ListSkeleton /></div>;

  const sellerIds = Object.keys(grouped);
  if (sellerIds.length === 0) {
    return (
      <div>
        <TopBar title="Cart" />
        <div className="text-center py-16 px-4">
          <p className="text-lg font-medium">Your cart is empty</p>
          <p className="text-text-secondary text-sm mt-1">Browse medicines to get started</p>
          <Link to="/search"><Button className="mt-4">Browse Medicines</Button></Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <TopBar title="Cart" />
      <div className="p-4 space-y-4">
        {sellerIds.map((sellerId) => {
          const items = grouped[sellerId];
          const subtotal = items.reduce((sum, i) => sum + Number(i.listing.finalPrice) * i.quantity, 0);
          return (
            <div key={sellerId} className="rounded-[var(--radius-md)] border border-border-subtle overflow-hidden">
              <div className="flex items-center justify-between p-3 bg-surface-raised">
                <span className="font-medium text-sm">{items[0].listing.pharmacy.name} ({items.length} items)</span>
                <Button variant="ghost" size="sm"><MessageCircle className="h-4 w-4" /></Button>
              </div>
              {items.map((item) => (
                <div key={item.id} className="flex items-center gap-3 p-3 border-t border-border-subtle">
                  <div className="h-12 w-12 rounded bg-surface-sunken flex items-center justify-center text-lg">💊</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.listing.medicine.name}</p>
                    <p className="text-xs text-text-secondary">Qty: {item.quantity} · {formatPrice(Number(item.listing.finalPrice) * item.quantity)}</p>
                  </div>
                  <button className="p-2 text-text-secondary hover:text-danger"><Trash2 className="h-4 w-4" /></button>
                </div>
              ))}
              <div className="flex items-center justify-between p-3 border-t border-border-subtle bg-surface-raised">
                <span className="font-medium tabular-nums">Subtotal: {formatPrice(subtotal)}</span>
                <Button size="sm" onClick={() => sendBuyRequest(sellerId, items)}>Send Buy Request →</Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function OrdersPage() {
  const { data, isLoading } = useOrders('buyer');
  return (
    <div>
      <TopBar title="Order History" showBack />
      <div className="p-4">
        {isLoading ? <ListSkeleton /> : (
          <div className="space-y-3">
            {data?.data.map((order) => (
              <Link key={order.id} to={`/orders/${order.id}`} className="block p-3 rounded-[var(--radius-md)] border border-border-subtle">
                <div className="flex justify-between"><span className="font-medium text-sm">{order.orderNumber}</span><StatusChip label={order.status} variant={order.status === 'DELIVERED' ? 'success' : 'warning'} /></div>
                <p className="text-sm text-text-secondary mt-1">{order.seller?.name} · {formatPrice(order.totalAmount)}</p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function BuyRequestsPage() {
  const { data, isLoading } = useBuyRequests('buyer');
  return (
    <div>
      <TopBar title="Buy Requests" showBack />
      <div className="p-4">
        {isLoading ? <ListSkeleton /> : data?.data.length === 0 ? (
          <p className="text-center text-text-secondary py-12">You haven't sent any requests</p>
        ) : (
          <div className="space-y-3">
            {data?.data.map((req) => (
              <div key={req.id} className="p-3 rounded-[var(--radius-md)] border border-border-subtle">
                <div className="flex justify-between"><span className="font-medium text-sm">{req.requestNumber}</span><StatusChip label={req.status} variant={req.status === 'ACCEPTED' ? 'success' : req.status === 'REJECTED' ? 'danger' : 'warning'} /></div>
                <p className="text-sm text-text-secondary">{req.seller?.name} · {formatPrice(req.totalAmount)}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

