import { useTranslation } from 'react-i18next';
import { StatusChip } from '@/components/ui/status-chip';
import { paymentAttemptChipVariant } from '@/lib/payment-utils';
import { formatPrice } from '@/lib/utils';
import type { OrderPaymentRecord } from '@/lib/payments-api';

interface PaymentHistoryPanelProps {
  payments: OrderPaymentRecord[];
  loading?: boolean;
}

export function PaymentHistoryPanel({ payments, loading }: PaymentHistoryPanelProps) {
  const { t } = useTranslation();

  if (loading) {
    return <p className="text-sm text-text-secondary">{t('payments.historyLoading')}</p>;
  }

  if (payments.length === 0) {
    return <p className="text-sm text-text-secondary">{t('payments.historyEmpty')}</p>;
  }

  return (
    <div className="space-y-3" data-testid="payment-history-panel">
      <h3 className="font-semibold text-sm">{t('payments.historyTitle')}</h3>
      {payments.map((payment) => (
        <div key={payment.id} className="rounded-[var(--radius-md)] border border-border-subtle p-3 space-y-2 text-sm">
          <div className="flex items-center justify-between gap-2">
            <StatusChip
              label={t(`payments.attemptStatus.${payment.status.toLowerCase()}`, { defaultValue: payment.status })}
              variant={paymentAttemptChipVariant(payment.status)}
            />
            <span className="font-medium tabular-nums">{formatPrice(payment.amount)} {payment.currency}</span>
          </div>
          <dl className="grid gap-1 text-xs text-text-secondary">
            <div className="flex justify-between gap-2">
              <dt>{t('payments.providerOrderId')}</dt>
              <dd className="font-mono truncate max-w-[55%]">{payment.providerOrderId}</dd>
            </div>
            {payment.providerPaymentId && (
              <div className="flex justify-between gap-2">
                <dt>{t('payments.providerPaymentId')}</dt>
                <dd className="font-mono truncate max-w-[55%]">{payment.providerPaymentId}</dd>
              </div>
            )}
            {payment.method && (
              <div className="flex justify-between gap-2">
                <dt>{t('payments.method')}</dt>
                <dd>{payment.method}</dd>
              </div>
            )}
          </dl>
          {payment.refunds && payment.refunds.length > 0 && (
            <div className="pt-2 border-t border-border-subtle space-y-1">
              <p className="text-xs font-medium">{t('payments.refundsTitle')}</p>
              {payment.refunds.map((refund) => (
                <div key={refund.id} className="flex justify-between gap-2 text-xs">
                  <span>{t(`payments.refundStatus.${refund.status.toLowerCase()}`, { defaultValue: refund.status })}</span>
                  <span className="tabular-nums">{formatPrice(refund.amount)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
