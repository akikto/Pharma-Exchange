import { useParams, useNavigate } from 'react-router-dom';
import { TopBar } from '@/components/layout/top-bar';
import { Button } from '@/components/ui/button';
import { StatusChip } from '@/components/ui/status-chip';
import { ListSkeleton } from '@/components/ui/skeleton';
import { useOrder } from '@/hooks/use-api';
import { usePageRole } from '@/hooks/use-page-role';
import { apiClient } from '@/lib/api';
import { formatPrice } from '@/lib/utils';
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

const NEXT_STATUS: Record<string, string> = {
  CONFIRMED: 'PACKED',
  PACKED: 'SHIPPED',
  SHIPPED: 'DELIVERED',
};

export function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const role = usePageRole();
  const { data: order, isLoading, isError } = useOrder(id);
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const updateStatus = async (status: string) => {
    setLoading(true);
    try {
      await apiClient.patch(`/orders/${id}/status`, { status });
      qc.invalidateQueries({ queryKey: ['order', id] });
    } finally {
      setLoading(false);
    }
  };

  const cancelOrder = async () => {
    setLoading(true);
    try {
      await apiClient.post(`/orders/${id}/cancel`, { reason: 'Cancelled by buyer' });
      qc.invalidateQueries({ queryKey: ['order', id] });
    } finally {
      setLoading(false);
    }
  };

  if (isLoading) return <div className="p-4"><ListSkeleton /></div>;
  if (isError || !order) return <div className="p-4 text-center text-danger">Order not found</div>;

  const nextStatus = NEXT_STATUS[order.status];

  return (
    <div>
      <TopBar title={order.orderNumber} showBack />
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <StatusChip label={order.status} variant={order.status === 'DELIVERED' ? 'success' : order.status === 'CANCELLED' ? 'danger' : 'warning'} />
          <span className="font-bold tabular-nums">{formatPrice(order.totalAmount)}</span>
        </div>

        <div className="space-y-2">
          {order.items.map((item) => (
            <div key={item.id} className="p-3 rounded-[var(--radius-md)] border border-border-subtle">
              <p className="font-medium text-sm">{item.medicineName}</p>
              <p className="text-xs text-text-secondary">Qty {item.quantity} · {formatPrice(item.subtotal)}</p>
            </div>
          ))}
        </div>

        {order.statusHistory && order.statusHistory.length > 0 && (
          <div>
            <h3 className="font-semibold text-sm mb-2">Status History</h3>
            <div className="space-y-2">
              {order.statusHistory.map((h, i) => (
                <div key={i} className="text-sm text-text-secondary">
                  {h.status} — {new Date(h.createdAt).toLocaleString()}
                  {h.note && <span className="block text-xs">{h.note}</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {role === 'seller' && nextStatus && (
          <Button className="w-full" loading={loading} onClick={() => updateStatus(nextStatus)}>
            Mark as {nextStatus}
          </Button>
        )}

        {role === 'buyer' && ['CREATED', 'CONFIRMED'].includes(order.status) && (
          <Button variant="destructive" className="w-full" loading={loading} onClick={cancelOrder}>
            Cancel Order
          </Button>
        )}

        <Button variant="secondary" className="w-full" onClick={() => navigate(-1)}>Back</Button>
      </div>
    </div>
  );
}
