import { useTranslation } from 'react-i18next';
import { CreditCard } from 'lucide-react';

export function PaymentUnavailableNotice() {
  const { t } = useTranslation();
  return (
    <div
      className="rounded-[var(--radius-md)] border border-border-subtle bg-surface-sunken p-4 text-sm text-text-secondary"
      data-testid="payment-unavailable-notice"
    >
      <div className="flex items-start gap-2">
        <CreditCard className="h-4 w-4 mt-0.5 shrink-0" aria-hidden />
        <div>
          <p className="font-medium text-text-primary">{t('payments.unavailableTitle')}</p>
          <p className="mt-1">{t('payments.unavailableBody')}</p>
        </div>
      </div>
    </div>
  );
}
