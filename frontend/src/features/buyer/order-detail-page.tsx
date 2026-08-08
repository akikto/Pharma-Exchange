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
import { PaymentMethodSelector } from '@/components/payments/payment-method-selector';
import { CodPaymentNotice } from '@/components/payments/cod-payment-notice';
import { PaymentStatusChip } from '@/components/payments/payment-status-chip';
import { PaymentHistoryPanel } from '@/components/payments/payment-history-panel';
import { CancelPaymentButton } from '@/components/payments/cancel-payment-button';
import { RefundPaymentButton } from '@/components/payments/refund-payment-button';
import { useOrder, useAddToCart, useStartConversation, useOrderPayments, useSetOrderPaymentMethod } from '@/hooks/use-api';
import { usePaymentConfig } from '@/hooks/use-payment-config';
import { canCancelPaymentAttempt, canRequestRefund, canSelectPaymentMethod, fulfillmentRequiresPayment, isCodOrder, showRazorpayPayButton } from '@/lib/payment-utils';
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
  const { data: paymentConfig } = usePaymentConfig();
  const { data: orderPayments, isLoading: paymentsLoading } = useOrderPayments(id);
  const setPaymentMethod = useSetOrderPaymentMethod();
  const paymentsEnabled = paymentConfig?.enabled ?? false;
  const addToCart = useAddToCart();
  const startChat = useStartConversation();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [trackOpen, setTrackOpen] = useState(false);

  const refreshOrder = () => {
    qc.invalidateQueries({ queryKey: ['order', id] });
    qc.invalidateQueries({ queryKey: ['order-payments', id] });
  };

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
      refreshOrder();
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
  const paymentBlocked = nextStatus
    ? fulfillmentRequiresPayment(paymentsEnabled, order.paymentStatus, nextStatus, order.paymentMethod)
    : false;
  const showPaymentSelector = role === 'buyer'
    && canSelectPaymentMethod(order.paymentStatus, order.status)
    && !order.paymentMethod;
  const codSelected = isCodOrder(order.paymentMethod);
  const showPayButton = showRazorpayPayButton(
    paymentsEnabled,
    order.paymentMethod,
    order.paymentStatus,
    order.status,
  );

  const handleSelectPaymentMethod = async (method: 'COD' | 'RAZORPAY') => {
    if (!order?.id || setPaymentMethod.isPending) return;
    try {
      await setPaymentMethod.mutateAsync({ orderId: order.id, method });
      toast({
        description: method === 'COD' ? t('payments.codTitle') : t('payments.methodOnline'),
      });
    } catch (e) {
      toast({ title: t('toast.error'), description: (e as Error).message, variant: 'destructive' });
    }
  };
  const counterparty =
    role === 'seller'
      ? `${order.buyer?.firstName ?? ''} ${order.buyer?.lastName ?? ''}`.trim()
      : (order.seller?.name ?? '');

  return (
    <div className="pb-8">
      <TopBar title={order.orderNumber} showBack />
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <StatusChip
              label={order.status}
              variant={order.status === 'DELIVERED' ? 'success' : order.status === 'CANCELLED' ? 'danger' : 'warning'}
            />
            <PaymentStatusChip status={order.paymentStatus} />
          </div>
          <span className="font-bold tabular-nums">{formatPrice(order.totalAmount)}</span>
        </div>

        <p className="text-sm text-text-secondary">
          {role === 'seller' ? t('buyRequest.buyer', { name: counterparty }) : t('buyRequest.seller', { name: counterparty })}
        </p>

        {order.paymentMethod && (
          <p className="text-sm text-text-secondary" data-testid="order-payment-method">
            {t('payments.methodLabel')}: {order.paymentMethod === 'COD' ? t('payments.methodCod') : t('payments.methodOnline')}
          </p>
        )}

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

        <PaymentHistoryPanel payments={orderPayments ?? []} loading={paymentsLoading} />

        {role === 'buyer' && showPaymentSelector && (
          <PaymentMethodSelector
            value={order.paymentMethod}
            paymentsEnabled={paymentsEnabled}
            loading={setPaymentMethod.isPending}
            onSelect={handleSelectPaymentMethod}
          />
        )}

        {role === 'buyer' && codSelected && order.paymentStatus === 'PENDING' && order.status !== 'CANCELLED' && (
          <CodPaymentNotice />
        )}

        {role === 'buyer' && showPayButton && (
          <p className="text-sm text-text-secondary rounded-[var(--radius-md)] border border-warning/30 bg-warning/5 p-3">
            {t('payments.pendingBuyerNotice')}
          </p>
        )}

        {role === 'seller' && codSelected && order.paymentStatus === 'PENDING' && order.status !== 'CANCELLED' && (
          <p className="text-sm text-text-secondary rounded-[var(--radius-md)] border border-border-subtle bg-surface-sunken p-3" data-testid="seller-cod-notice">
            {t('payments.codSellerNotice')}
          </p>
        )}

        {role === 'seller' && paymentBlocked && (
          <p className="text-sm text-text-secondary rounded-[var(--radius-md)] border border-warning/30 bg-warning/5 p-3" data-testid="seller-awaiting-payment-notice">
            {t('payments.awaitingBuyerPayment')}
          </p>
        )}

        {showPayButton && (
          <PayWithRazorpayButton
            orderId={order.id}
            orderNumber={order.orderNumber}
            buyer={order.buyer as { firstName?: string; lastName?: string; email?: string; phone?: string } | undefined}
            className="w-full"
            onSuccess={refreshOrder}
          />
        )}

        {role === 'buyer' && canCancelPaymentAttempt(order.paymentStatus, order.status, order.paymentMethod) && paymentsEnabled && (
          <CancelPaymentButton orderId={order.id} className="w-full" onSuccess={refreshOrder} />
        )}

        {canRequestRefund(order.paymentStatus, order.status, role) && paymentsEnabled && (
          <RefundPaymentButton
            orderId={order.id}
            orderTotal={Number(order.totalAmount)}
            className="w-full"
            onSuccess={refreshOrder}
          />
        )}

        {role === 'seller' && nextStatus && (
          <Button
            className="w-full"
            loading={loading}
            disabled={paymentBlocked}
            onClick={() => updateStatus(nextStatus)}
            data-testid="seller-fulfillment-button"
          >
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
        payments={orderPayments}
        open={receiptOpen}
        onClose={() => setReceiptOpen(false)}
      />
      <TrackingDialog order={order} open={trackOpen} onClose={() => setTrackOpen(false)} />
    </div>
  );
}
