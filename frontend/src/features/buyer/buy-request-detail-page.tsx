import { useParams, useNavigate } from 'react-router-dom';
import { TopBar } from '@/components/layout/top-bar';
import { Button } from '@/components/ui/button';
import { StatusChip } from '@/components/ui/status-chip';
import { ListSkeleton } from '@/components/ui/skeleton';
import { useBuyRequest } from '@/hooks/use-api';
import { usePageRole } from '@/hooks/use-page-role';
import { apiClient } from '@/lib/api';
import { formatPrice } from '@/lib/utils';
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

export function BuyRequestDetailPage() {
  const { id } = useParams<{ id: string }>();
  const role = usePageRole();
  const { data: request, isLoading, isError } = useBuyRequest(id);
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const respond = async (action: 'accept' | 'reject') => {
    setLoading(true);
    setError('');
    try {
      const result = await apiClient.post<{ order?: { id: string } }>(`/buy-requests/${id}/respond`, { action });
      qc.invalidateQueries({ queryKey: ['buy-request', id] });
      if (result.order?.id) navigate(`/orders/${result.order.id}`);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  if (isLoading) return <div className="p-4"><ListSkeleton /></div>;
  if (isError || !request) return <div className="p-4 text-center text-danger">Request not found</div>;

  return (
    <div>
      <TopBar title={request.requestNumber} showBack />
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <StatusChip label={request.status} variant={request.status === 'ACCEPTED' ? 'success' : request.status === 'REJECTED' ? 'danger' : 'warning'} />
          <span className="font-bold tabular-nums">{formatPrice(request.totalAmount)}</span>
        </div>

        <p className="text-sm text-text-secondary">
          {role === 'seller'
            ? `Buyer: ${request.buyer?.firstName} ${request.buyer?.lastName}`
            : `Seller: ${request.seller?.name}`}
        </p>

        <div className="space-y-2">
          {request.items.map((item) => (
            <div key={item.id} className="p-3 rounded-[var(--radius-md)] border border-border-subtle">
              <p className="font-medium text-sm">{item.listing.medicine.name}</p>
              <p className="text-xs text-text-secondary">Qty {item.quantity} · {formatPrice(item.subtotal)}</p>
            </div>
          ))}
        </div>

        {request.note && <p className="text-sm"><span className="font-medium">Note:</span> {request.note}</p>}
        {request.sellerNote && <p className="text-sm"><span className="font-medium">Seller note:</span> {request.sellerNote}</p>}

        {error && <p className="text-sm text-danger">{error}</p>}

        {role === 'seller' && request.status === 'PENDING' && (
          <div className="grid grid-cols-2 gap-3">
            <Button variant="destructive" loading={loading} onClick={() => respond('reject')}>Reject</Button>
            <Button loading={loading} onClick={() => respond('accept')}>Accept</Button>
          </div>
        )}
      </div>
    </div>
  );
}
