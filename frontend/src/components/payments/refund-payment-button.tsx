import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { paymentsApi } from '@/lib/payments-api';
import { useToast } from '@/hooks/use-toast';
import { formatPrice } from '@/lib/utils';

interface RefundPaymentButtonProps {
  orderId: string;
  orderTotal: number;
  onSuccess?: () => void;
  className?: string;
}

export function RefundPaymentButton({ orderId, orderTotal, onSuccess, className }: RefundPaymentButtonProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [reason, setReason] = useState('');

  const handleRefund = async () => {
    setLoading(true);
    try {
      await paymentsApi.refund(orderId, { reason: reason.trim() || undefined });
      toast({ description: t('payments.refundSuccess') });
      setOpen(false);
      setReason('');
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
    <>
      <Button
        variant="secondary"
        className={className}
        onClick={() => setOpen(true)}
        data-testid="refund-payment-button"
      >
        {t('payments.requestRefund')}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('payments.refundTitle')}</DialogTitle>
            <DialogDescription>
              {t('payments.refundDesc', { amount: formatPrice(orderTotal) })}
            </DialogDescription>
          </DialogHeader>
          <Input
            placeholder={t('payments.refundReasonPlaceholder')}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            maxLength={500}
          />
          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="secondary" onClick={() => setOpen(false)} disabled={loading}>
              {t('common.cancel')}
            </Button>
            <Button loading={loading} onClick={handleRefund}>
              {t('payments.confirmRefund')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
