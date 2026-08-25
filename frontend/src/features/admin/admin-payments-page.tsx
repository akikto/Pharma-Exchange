import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { TopBar } from '@/components/layout/top-bar';
import { ListSkeleton } from '@/components/ui/skeleton';
import { StatusChip } from '@/components/ui/status-chip';
import { PaymentStatusChip } from '@/components/payments/payment-status-chip';
import { RefundPaymentButton } from '@/components/payments/refund-payment-button';
import { apiClient } from '@/lib/api';
import { formatPrice } from '@/lib/utils';
import { paymentAttemptChipVariant } from '@/lib/payment-utils';
import type { OrderPaymentRecord } from '@/lib/payments-api';
import { usePaymentConfig } from '@/hooks/use-payment-config';

type AdminPaymentRow = OrderPaymentRecord & {
  order: {
    id: string;
    orderNumber: string;
    paymentStatus: string;
    status: string;
    totalAmount: number | string;
    buyer: { id: string; firstName: string; lastName: string; email: string | null };
    seller: { id: string; name: string };
  };
};

export function AdminPaymentsPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const { data: paymentConfig } = usePaymentConfig();
  const paymentsEnabled = paymentConfig?.enabled ?? false;
  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin', 'payments'],
    queryFn: () => apiClient.get<{ data: AdminPaymentRow[] }>('/admin/payments'),
  });

  const refresh = () => qc.invalidateQueries({ queryKey: ['admin', 'payments'] });

  return (
    <div className="bg-surface-raised">
      <TopBar title={t('admin.payments')} showBack backTo="/admin" />
      <div className="p-4 space-y-3 max-w-4xl mx-auto">
        <p className="text-sm text-text-secondary">{t('admin.paymentsDesc')}</p>
        {isLoading ? <ListSkeleton /> : isError ? (
          <p className="text-center text-danger py-12">{t('payments.historyLoadError')}</p>
        ) : data?.data.length === 0 ? (
          <p className="text-center text-text-secondary py-12">{t('admin.paymentsEmpty')}</p>
        ) : data?.data.map((payment) => (
          <div key={payment.id} className="p-3 border border-border-subtle rounded-[var(--radius-md)] space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <Link to={`/orders/${payment.order.id}`} className="font-medium text-primary hover:underline">
                  {payment.order.orderNumber}
                </Link>
                <p className="text-xs text-text-secondary">
                  {payment.order.seller.name} · {payment.order.buyer.firstName} {payment.order.buyer.lastName}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <StatusChip
                  label={t(`payments.attemptStatus.${payment.status.toLowerCase()}`, { defaultValue: payment.status })}
                  variant={paymentAttemptChipVariant(payment.status)}
                />
                <PaymentStatusChip status={payment.order.paymentStatus} />
              </div>
            </div>
            <p className="text-sm tabular-nums">{formatPrice(payment.amount)} {payment.currency}</p>
            <p className="text-xs font-mono text-text-secondary truncate">{payment.providerOrderId}</p>
            {paymentsEnabled && payment.order.paymentStatus === 'PAID' && payment.status === 'CAPTURED' && (
              <RefundPaymentButton
                orderId={payment.order.id}
                orderTotal={Number(payment.order.totalAmount)}
                onSuccess={refresh}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
