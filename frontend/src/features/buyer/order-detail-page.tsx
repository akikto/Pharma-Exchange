import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { MessageCircle, MapPin, Receipt, RotateCcw } from 'lucide-react';
import { TopBar } from '@/components/layout/top-bar';
import { Button } from '@/components/ui/button';
import { StatusChip } from '@/components/ui/status-chip';
import { ListSkeleton } from '@/components/ui/skeleton';
import { StatusStepper } from '@/components/orders/status-stepper';
import { OrderReceiptDialog } from '@/components/orders/order-receipt-dialog';
import { TrackingDialog } from '@/components/orders/tracking-dialog';
import { PayWithRazorpayButton } from '@/components/payments/pay-with-razorpay-button';
import { useOrder, useAddToCart, useStartConversation } from '@/hooks/use-api';
import { usePageRole } from '@/hooks/use-page-role';
import { apiClient } from '@/lib/api';
import { ORDER_FLOW_STEPS, canTrackOrder } from '@/lib/order-utils';
import { formatPrice } from '@/lib/utils';
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

const NEXT_STATUS: Record<string, string> = {
  CONFIRMED: 'PACKED',
  PACKED: 'SHIPPED',
  SHIPPED: 'DELIVERED',
};

export function OrderDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const role = usePageRole();
  const { data: order, isLoading, isError } = useOrder(id);
  const addToCart = useAddToCart();
  const startChat = useStartConversation();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [trackOpen, setTrackOpen] = useState(false);

  const stepLabels = {
    CREATED: t('orders.steps.created'),
    CONFIRMED: t('orders.steps.confirmed'),
    PACKED: t('orders.steps.packed'),
    SHIPPED: t('orders.steps.shipped'),
    DELIVERED: t('orders.steps.delivered'),
    CANCELLED: t('orders.steps.cancelled'),
  };

  const updateStatus = async (status: string) => {
    setLoading(true);
    try {
      await apiClient.patch(`/orders/${id}/status`, { status });
      qc.invalidateQueries({ queryKey: ['order', id] });
      toast({ description: t('orders.statusUpdated') });
    } catch (e) {
      toast({ title: t('toast.error'), description: (e as Error).message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const cancelOrder = async () => {
    setLoading(true);
    try {
      await apiClient.post(`/orders/${id}/cancel`, { reason: t('orders.cancelledByBuyer') });
      qc.invalidateQueries({ queryKey: ['order', id] });
      toast({ description: t('orders.cancelled') });
    } catch (e) {
      toast({ title: t('toast.error'), description: (e as Error).message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleReorder = async () => {
    if (!order) return;
    const items = order.items.filter((i) => i.listingId);
    if (items.length === 0) {
      toast({ title: t('toast.error'), description: t('orders.reorderUnavailable'), variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      for (const item of items) {
        await addToCart.mutateAsync({ listingId: item.listingId!, quantity: item.quantity });
      }
      toast({ description: t('orders.reorderSuccess') });
      navigate('/cart');
    } catch (e) {
      toast({ title: t('toast.error'), description: (e as Error).message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleChat = async () => {
    const userId = role === 'seller' ? order?.buyer?.id : order?.seller?.userId;
    if (!userId) {
      toast({ title: t('toast.error'), description: t('cart.chatUnavailable'), variant: 'destructive' });
      return;
    }
    try {
      const conv = await startChat.mutateAsync({ participantId: userId, orderId: order?.id });
      navigate(`/chat/${conv.id}`);
    } catch (e) {
      toast({ title: t('toast.error'), description: (e as Error).message, variant: 'destructive' });
    }
  };

  if (isLoading) return <div className="p-4"><ListSkeleton /></div>;
  if (isError || !order) return <div className="p-4 text-center text-danger">{t('orders.notFound')}</div>;

  const nextStatus = NEXT_STATUS[order.status];
  const counterparty =
    role === 'seller'
      ? `${order.buyer?.firstName ?? ''} ${order.buyer?.lastName ?? ''}`.trim()
      : (order.seller?.name ?? '');

  return (
    <div className="pb-8">
      <TopBar title={order.orderNumber} showBack />
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <StatusChip
            label={order.status}
            variant={order.status === 'DELIVERED' ? 'success' : order.status === 'CANCELLED' ? 'danger' : 'warning'}
          />
          <span className="font-bold tabular-nums">{formatPrice(order.totalAmount)}</span>
        </div>

        <p className="text-sm text-text-secondary">
          {role === 'seller' ? t('buyRequest.buyer', { name: counterparty }) : t('buyRequest.seller', { name: counterparty })}
        </p>

        <StatusStepper
          steps={ORDER_FLOW_STEPS}
          currentStatus={order.status}
          labels={stepLabels}
          terminalStatus={order.status === 'CANCELLED' ? 'CANCELLED' : undefined}
        />

        <div className="space-y-2">
          <h3 className="font-semibold text-sm">{t('orders.lineItems')}</h3>
          {order.items.map((item) => (
            <div key={item.id} className="p-3 rounded-[var(--radius-md)] border border-border-subtle">
              <p className="font-medium text-sm">{item.medicineName}</p>
              <p className="text-xs text-text-secondary">
                {t('buyRequest.quantity')}: {item.quantity} · {formatPrice(item.subtotal)}
              </p>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" size="sm" onClick={() => setReceiptOpen(true)}>
            <Receipt className="h-4 w-4 mr-1" />
            {t('orders.receipt')}
          </Button>
          {canTrackOrder(order.status) && (
            <Button variant="secondary" size="sm" onClick={() => setTrackOpen(true)}>
              <MapPin className="h-4 w-4 mr-1" />
              {t('orders.track')}
            </Button>
          )}
          <Button variant="secondary" size="sm" onClick={handleChat}>
            <MessageCircle className="h-4 w-4 mr-1" />
            {t('orders.chatCounterparty')}
          </Button>
        </div>

        {role === 'buyer' && order.paymentStatus === 'PENDING' && order.status !== 'CANCELLED' && (
          <PayWithRazorpayButton
            orderId={order.id}
            orderNumber={order.orderNumber}
            buyer={order.buyer as { firstName?: string; lastName?: string; email?: string; phone?: string } | undefined}
            className="w-full"
            label={t('orders.payNow', { defaultValue: 'Pay now' })}
            onSuccess={() => qc.invalidateQueries({ queryKey: ['order', id] })}
          />
        )}

        {role === 'seller' && nextStatus && (
          <Button className="w-full" loading={loading} onClick={() => updateStatus(nextStatus)}>
            {t('orders.markAs', { status: stepLabels[nextStatus as keyof typeof stepLabels] ?? nextStatus })}
          </Button>
        )}

        {role === 'buyer' && order.status === 'DELIVERED' && (
          <Button className="w-full" variant="secondary" loading={loading} onClick={handleReorder}>
            <RotateCcw className="h-4 w-4 mr-1" />
            {t('orders.reorder')}
          </Button>
        )}

        {role === 'buyer' && ['CREATED', 'CONFIRMED'].includes(order.status) && (
          <Button variant="destructive" className="w-full" loading={loading} onClick={cancelOrder}>
            {t('orders.cancelOrder')}
          </Button>
        )}
      </div>

      <OrderReceiptDialog
        order={order}
        counterpartyLabel={counterparty}
        open={receiptOpen}
        onClose={() => setReceiptOpen(false)}
      />
      <TrackingDialog order={order} open={trackOpen} onClose={() => setTrackOpen(false)} />
    </div>
  );
}
