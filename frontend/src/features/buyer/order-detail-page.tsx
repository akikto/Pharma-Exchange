import { useParams, useNavigate } from 'react-router-dom';
import { MessageCircle, Star } from 'lucide-react';
import { TopBar } from '@/components/layout/top-bar';
import { Button } from '@/components/ui/button';
import { StatusChip } from '@/components/ui/status-chip';
import { Input } from '@/components/ui/input';
import { ListSkeleton } from '@/components/ui/skeleton';
import { useOrder, useStartConversation } from '@/hooks/use-api';
import { usePageRole } from '@/hooks/use-page-role';
import { apiClient } from '@/lib/api';
import { formatPrice } from '@/lib/utils';
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

const ORDER_STEPS = ['CREATED', 'CONFIRMED', 'PACKED', 'SHIPPED', 'DELIVERED'];
const NEXT_STATUS: Record<string, string> = {
  CONFIRMED: 'PACKED',
  PACKED: 'SHIPPED',
  SHIPPED: 'DELIVERED',
};

export function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const role = usePageRole();
  const { data: order, isLoading, isError } = useOrder(id);
  const startChat = useStartConversation();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [showReview, setShowReview] = useState(false);

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
      const reason = role === 'seller' ? 'Cancelled by seller' : 'Cancelled by buyer';
      await apiClient.post(`/orders/${id}/cancel`, { reason });
      qc.invalidateQueries({ queryKey: ['order', id] });
    } finally {
      setLoading(false);
    }
  };

  const handleChat = async () => {
    const participantId = role === 'seller' ? order?.buyer?.id : order?.seller?.userId;
    if (!participantId) return;
    const conv = await startChat.mutateAsync({ participantId, orderId: order?.id });
    navigate(`/chat/${conv.id}`);
  };

  const submitReview = async () => {
    if (!order?.seller?.id) return;
    setLoading(true);
    try {
      await apiClient.post('/reviews', {
        orderId: order.id,
        rating: reviewRating,
        comment: reviewComment,
      });
      setShowReview(false);
    } finally {
      setLoading(false);
    }
  };

  if (isLoading) return <div className="p-4"><ListSkeleton /></div>;
  if (isError || !order) return <div className="p-4 text-center text-danger">Order not found</div>;

  const nextStatus = NEXT_STATUS[order.status];
  const currentStep = ORDER_STEPS.indexOf(order.status);

  return (
    <div>
      <TopBar title={order.orderNumber} showBack />
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <StatusChip label={order.status} variant={order.status === 'DELIVERED' ? 'success' : order.status === 'CANCELLED' ? 'danger' : 'warning'} />
          <span className="font-bold tabular-nums">{formatPrice(order.totalAmount)}</span>
        </div>

        {order.status !== 'CANCELLED' && (
          <div className="flex items-center justify-between gap-1">
            {ORDER_STEPS.map((step, i) => (
              <div key={step} className="flex-1 text-center">
                <div className={`h-2 rounded-full mb-1 ${i <= currentStep ? 'bg-primary' : 'bg-border-subtle'}`} />
                <p className="text-[10px] text-text-secondary">{step}</p>
              </div>
            ))}
          </div>
        )}

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

        <Button variant="secondary" className="w-full" onClick={handleChat}>
          <MessageCircle className="h-4 w-4" /> Chat with {role === 'seller' ? 'Buyer' : 'Seller'}
        </Button>

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

        {role === 'buyer' && order.status === 'DELIVERED' && !showReview && (
          <Button variant="secondary" className="w-full" onClick={() => setShowReview(true)}>
            <Star className="h-4 w-4" /> Leave Review
          </Button>
        )}

        {showReview && (
          <div className="space-y-3 p-3 border border-border-subtle rounded-[var(--radius-md)]">
            <p className="font-medium text-sm">Rate this seller</p>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((r) => (
                <button key={r} type="button" onClick={() => setReviewRating(r)} className={r <= reviewRating ? 'text-warning' : 'text-border-subtle'}>
                  <Star className="h-6 w-6 fill-current" />
                </button>
              ))}
            </div>
            <Input placeholder="Comment (optional)" value={reviewComment} onChange={(e) => setReviewComment(e.target.value)} />
            <Button className="w-full" loading={loading} onClick={submitReview}>Submit Review</Button>
          </div>
        )}
      </div>
    </div>
  );
}
