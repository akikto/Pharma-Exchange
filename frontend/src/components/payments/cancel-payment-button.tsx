import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { paymentsApi } from '@/lib/payments-api';
import { useToast } from '@/hooks/use-toast';

interface CancelPaymentButtonProps {
  orderId: string;
  onSuccess?: () => void;
  className?: string;
}

export function CancelPaymentButton({ orderId, onSuccess, className }: CancelPaymentButtonProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleCancel = async () => {
    setLoading(true);
    try {
      await paymentsApi.cancel(orderId);
      toast({ description: t('payments.cancelSuccess') });
      onSuccess?.();
    } catch (err) {
      toast({
        title: t('toast.error'),
        description: (err as Error).message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant="secondary"
      className={className}
      loading={loading}
      onClick={handleCancel}
      data-testid="cancel-payment-button"
    >
      {t('payments.cancelAttempt')}
    </Button>
  );
}
