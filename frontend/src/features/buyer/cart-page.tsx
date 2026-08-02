import { Link, useNavigate } from 'react-router-dom';
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
import type { CartItem } from '@/types';

export function CartPage() {
  const { data, isLoading, isError } = useCart();
  const removeItem = useRemoveFromCart();
  const startChat = useStartConversation();
  const qc = useQueryClient();
  const navigate = useNavigate();
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

  if (isLoading) return <div className="p-4"><ListSkeleton /></div>;
  if (isError) return <div className="p-4 text-center text-danger">Failed to load cart</div>;

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
        {error && <p className="text-sm text-danger text-center">{error}</p>}
        {sellerIds.map((sellerId) => {
          const items = grouped[sellerId];
          const subtotal = items.reduce((sum, i) => sum + Number(i.listing.finalPrice) * i.quantity, 0);
          return (
            <div key={sellerId} className="rounded-[var(--radius-md)] border border-border-subtle overflow-hidden">
              <div className="flex items-center justify-between p-3 bg-surface-raised">
                <span className="font-medium text-sm">{items[0].listing.pharmacy.name} ({items.length} items)</span>
                <Button variant="ghost" size="sm" aria-label="Message seller" onClick={() => handleChat(items)}>
                  <MessageCircle className="h-4 w-4" />
                </Button>
              </div>
              {items.map((item) => (
                <div key={item.id} className="flex items-center gap-3 p-3 border-t border-border-subtle">
                  <div className="h-12 w-12 rounded bg-surface-sunken flex items-center justify-center text-lg">💊</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.listing.medicine.name}</p>
                    <p className="text-xs text-text-secondary">Qty: {item.quantity} · {formatPrice(Number(item.listing.finalPrice) * item.quantity)}</p>
                  </div>
                  <button
                    className="p-2 text-text-secondary hover:text-danger"
                    aria-label="Remove item"
                    onClick={() => removeItem.mutate(item.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
              <div className="flex items-center justify-between p-3 border-t border-border-subtle bg-surface-raised">
                <span className="font-medium tabular-nums">Subtotal: {formatPrice(subtotal)}</span>
                <Button size="sm" loading={sending === sellerId} onClick={() => sendBuyRequest(sellerId, items)}>
                  Send Buy Request →
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
  const role = usePageRole();
  const { data, isLoading, isError } = useOrders(role);
  const title = role === 'seller' ? 'Seller Orders' : 'Order History';

  return (
    <div>
      <TopBar title={title} showBack />
      <div className="p-4">
        {isLoading ? <ListSkeleton /> : isError ? (
          <p className="text-center text-danger py-12">Failed to load orders</p>
        ) : data?.data.length === 0 ? (
          <p className="text-center text-text-secondary py-12">No orders yet</p>
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
  const role = usePageRole();
  const { data, isLoading, isError } = useBuyRequests(role);
  const title = role === 'seller' ? 'Incoming Requests' : 'Buy Requests';
  const basePath = role === 'seller' ? '/seller/requests' : '/buy-requests';

  return (
    <div>
      <TopBar title={title} showBack />
      <div className="p-4">
        {isLoading ? <ListSkeleton /> : isError ? (
          <p className="text-center text-danger py-12">Failed to load requests</p>
        ) : data?.data.length === 0 ? (
          <p className="text-center text-text-secondary py-12">
            {role === 'seller' ? 'No incoming requests' : "You haven't sent any requests"}
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
