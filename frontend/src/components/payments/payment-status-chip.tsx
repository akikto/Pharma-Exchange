import { useTranslation } from 'react-i18next';
import { StatusChip } from '@/components/ui/status-chip';
import { paymentStatusChipVariant } from '@/lib/payment-utils';

interface PaymentStatusChipProps {
  status: string;
  className?: string;
}

export function PaymentStatusChip({ status, className }: PaymentStatusChipProps) {
  const { t } = useTranslation();
  const key = `payments.status.${status.toLowerCase()}`;
  const label = t(key, { defaultValue: status });
  return (
    <span data-testid={`payment-status-${status.toLowerCase()}`}>
      <StatusChip
        label={label}
        variant={paymentStatusChipVariant(status)}
        className={className}
      />
    </span>
  );
}
