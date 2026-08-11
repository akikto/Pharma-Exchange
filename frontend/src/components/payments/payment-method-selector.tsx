import { useTranslation } from 'react-i18next';
import { Banknote, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { OrderPaymentMethodValue } from '@/lib/payment-utils';

interface PaymentMethodSelectorProps {
  value: OrderPaymentMethodValue;
  paymentsEnabled: boolean;
  loading?: boolean;
  onSelect: (method: 'COD' | 'RAZORPAY') => void;
  className?: string;
}

export function PaymentMethodSelector({
  value,
  paymentsEnabled,
  loading,
  onSelect,
  className,
}: PaymentMethodSelectorProps) {
  const { t } = useTranslation();

  const options: Array<{ method: 'COD' | 'RAZORPAY'; icon: typeof Banknote; label: string; description: string }> = [
    {
      method: 'COD',
      icon: Banknote,
      label: t('payments.methodCod'),
      description: t('payments.methodCodDesc'),
    },
    ...(paymentsEnabled ? [{
      method: 'RAZORPAY' as const,
      icon: CreditCard,
      label: t('payments.methodOnline'),
      description: t('payments.methodOnlineDesc'),
    }] : []),
  ];

  return (
    <div className={cn('space-y-2', className)} data-testid="payment-method-selector">
      <p className="text-sm font-medium">{t('payments.methodLabel')}</p>
      <div className="grid gap-2">
        {options.map((option) => {
          const Icon = option.icon;
          const selected = value === option.method;
          return (
            <Button
              key={option.method}
              type="button"
              variant={selected ? 'primary' : 'secondary'}
              className="h-auto w-full justify-start gap-3 py-3 px-3 text-left"
              loading={loading && selected}
              disabled={loading}
              data-testid={`payment-method-${option.method.toLowerCase()}`}
              onClick={() => onSelect(option.method)}
            >
              <Icon className="h-4 w-4 shrink-0" aria-hidden />
              <span className="min-w-0">
                <span className="block font-medium text-sm">{option.label}</span>
                <span className={cn('block text-xs mt-0.5', selected ? 'text-primary-foreground/80' : 'text-text-secondary')}>
                  {option.description}
                </span>
              </span>
            </Button>
          );
        })}
      </div>
    </div>
  );
}
