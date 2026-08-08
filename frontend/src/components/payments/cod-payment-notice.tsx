import { useTranslation } from 'react-i18next';
import { Banknote } from 'lucide-react';

export function CodPaymentNotice() {
  const { t } = useTranslation();
  return (
    <div
      className="rounded-[var(--radius-md)] border border-border-subtle bg-surface-sunken p-4 text-sm text-text-secondary"
      data-testid="cod-payment-notice"
    >
      <div className="flex items-start gap-2">
        <Banknote className="h-4 w-4 mt-0.5 shrink-0" aria-hidden />
        <div>
          <p className="font-medium text-text-primary">{t('payments.codTitle')}</p>
          <p className="mt-1">{t('payments.codBody')}</p>
          <p className="mt-1 text-xs text-text-disabled">{t('payments.codStatusPending')}</p>
        </div>
      </div>
    </div>
  );
}
