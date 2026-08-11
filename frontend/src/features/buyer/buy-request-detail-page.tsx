import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { MessageCircle } from 'lucide-react';
import { TopBar } from '@/components/layout/top-bar';
import { Button } from '@/components/ui/button';
import { StatusChip } from '@/components/ui/status-chip';
import { ListSkeleton } from '@/components/ui/skeleton';
import { StatusStepper } from '@/components/orders/status-stepper';
import { useBuyRequest, useStartConversation } from '@/hooks/use-api';
import { useRespondBuyRequest } from '@/hooks/use-chat-api';
import { usePageRole } from '@/hooks/use-page-role';
import { formatPrice } from '@/lib/utils';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

const BUY_REQUEST_STEPS = ['PENDING', 'ACCEPTED'] as const;

export function BuyRequestDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const role = usePageRole();
  const { data: request, isLoading, isError } = useBuyRequest(id);
  const startChat = useStartConversation();
  const respondRequest = useRespondBuyRequest();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [error, setError] = useState('');

  const pendingAction = respondRequest.isPending ? respondRequest.variables?.action ?? null : null;

  const stepLabels = {
    PENDING: t('buyRequest.steps.pending'),
    ACCEPTED: t('buyRequest.steps.accepted'),
    REJECTED: t('buyRequest.steps.rejected'),
    EXPIRED: t('buyRequest.steps.expired'),
  };

  const respond = async (action: 'accept' | 'reject') => {
    if (!id || respondRequest.isPending) return;
    setError('');
    try {
      const result = await respondRequest.mutateAsync({ id, action });
      toast({ description: action === 'accept' ? t('buyRequest.accepted') : t('buyRequest.rejected') });
      const order = (result as { order?: { id: string } }).order;
      if (order?.id) {
        const orderPath = role === 'seller' ? `/seller/orders/${order.id}` : `/orders/${order.id}`;
        navigate(orderPath);
      }
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const handleChat = async () => {
    const userId = role === 'seller' ? request?.buyer?.id : request?.seller?.userId;
    if (!userId) return;
    try {
      const conv = await startChat.mutateAsync({
        participantId: userId,
        listingId: request?.items[0]?.listing?.id,
        buyRequestId: request?.id,
      });
      navigate(`/chat/${conv.id}`);
    } catch (e) {
      toast({ title: t('toast.error'), description: (e as Error).message, variant: 'destructive' });
    }
  };

  if (isLoading) return <div className="p-4"><ListSkeleton /></div>;
  if (isError || !request) return <div className="p-4 text-center text-danger">{t('buyRequest.notFound')}</div>;

  const terminal =
    request.status === 'REJECTED' ? 'REJECTED' : request.status === 'EXPIRED' ? 'EXPIRED' : undefined;

  return (
    <div>
      <TopBar title={request.requestNumber} showBack />
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <StatusChip
            label={request.status}
            variant={request.status === 'ACCEPTED' ? 'success' : request.status === 'REJECTED' ? 'danger' : 'warning'}
          />
          <span className="font-bold tabular-nums">{formatPrice(request.totalAmount)}</span>
        </div>

        <p className="text-sm text-text-secondary">
          {role === 'seller'
            ? t('buyRequest.buyer', { name: `${request.buyer?.firstName} ${request.buyer?.lastName}` })
            : t('buyRequest.seller', { name: request.seller?.name ?? '' })}
        </p>

        <StatusStepper
          steps={BUY_REQUEST_STEPS}
          currentStatus={request.status === 'ACCEPTED' ? 'ACCEPTED' : 'PENDING'}
          labels={stepLabels}
          terminalStatus={terminal}
        />

        <div className="space-y-2">
          {request.items.map((item) => (
            <div key={item.id} className="p-3 rounded-[var(--radius-md)] border border-border-subtle">
              <p className="font-medium text-sm">{item.listing.medicine.name}</p>
              <p className="text-xs text-text-secondary">
                {t('buyRequest.quantity')}: {item.quantity} · {formatPrice(item.subtotal)}
              </p>
            </div>
          ))}
        </div>

        {request.note && (
          <p className="text-sm">
            <span className="font-medium">{t('buyRequest.note')}:</span> {request.note}
          </p>
        )}
        {request.sellerNote && (
          <p className="text-sm">
            <span className="font-medium">{t('buyRequest.sellerNote')}:</span> {request.sellerNote}
          </p>
        )}

        <Button variant="secondary" className="w-full" onClick={handleChat}>
          <MessageCircle className="h-4 w-4 mr-1" />
          {t('orders.chatCounterparty')}
        </Button>

        {request.status === 'ACCEPTED' && request.order?.id && (
          <Button className="w-full" asChild data-testid="buy-request-view-order">
            <Link to={role === 'seller' ? `/seller/orders/${request.order.id}` : `/orders/${request.order.id}`}>
              {t('orders.viewOrder')}
            </Link>
          </Button>
        )}

        {error && <p className="text-sm text-danger">{error}</p>}

        {role === 'seller' && request.status === 'PENDING' && (
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="destructive"
              loading={pendingAction === 'reject'}
              disabled={respondRequest.isPending}
              data-testid="buy-request-reject-button"
              onClick={() => void respond('reject')}
            >
              {t('buyRequest.reject')}
            </Button>
            <Button
              loading={pendingAction === 'accept'}
              disabled={respondRequest.isPending}
              data-testid="buy-request-accept-button"
              onClick={() => void respond('accept')}
            >
              {t('buyRequest.accept')}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
