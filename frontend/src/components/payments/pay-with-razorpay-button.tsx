/**
 * BL-02 · Razorpay Standard Checkout button.
 *
 * Loads the hosted checkout script on demand, calls the backend to create a
 * Razorpay order, opens the checkout modal, and finalises the payment via
 * `/payments/verify`. No card data ever touches this bundle — Razorpay's
 * hosted UI collects it.
 */
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { paymentsApi } from '@/lib/payments-api';
import { useToast } from '@/hooks/use-toast';

// Minimal Razorpay Checkout typing — the full interface is documented at
// https://razorpay.com/docs/payments/payment-gateway/web-integration/standard/
type RazorpayHandlerResponse = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

type RazorpayOptions = {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description?: string;
  order_id: string;
  prefill?: { name?: string; email?: string; contact?: string };
  notes?: Record<string, string>;
  theme?: { color?: string };
  handler: (response: RazorpayHandlerResponse) => void;
  modal?: { ondismiss?: () => void };
};

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => { open: () => void };
  }
}

const CHECKOUT_SCRIPT = 'https://checkout.razorpay.com/v1/checkout.js';

async function loadCheckoutScript(): Promise<void> {
  if (window.Razorpay) return;
  await new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = CHECKOUT_SCRIPT;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Razorpay Checkout'));
    document.body.appendChild(script);
  });
}

export interface PayWithRazorpayButtonProps {
  orderId: string;
  orderNumber: string;
  buyer?: { firstName?: string; lastName?: string; email?: string; phone?: string };
  onSuccess?: () => void;
  className?: string;
  label?: string;
}

export function PayWithRazorpayButton({
  orderId, orderNumber, buyer, onSuccess, className, label,
}: PayWithRazorpayButtonProps) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const displayLabel = label ?? t('payments.payNow');

  const handlePay = async () => {
    setLoading(true);
    try {
      await loadCheckoutScript();
      if (!window.Razorpay) throw new Error('Razorpay Checkout is unavailable');

      const options = await paymentsApi.createOrder(orderId);

      const rzp = new window.Razorpay({
        key: options.keyId,
        amount: options.amount,
        currency: options.currency,
        name: 'Pharma-Exchange',
        description: `Order ${orderNumber}`,
        order_id: options.providerOrderId,
        prefill: {
          name: buyer ? `${buyer.firstName ?? ''} ${buyer.lastName ?? ''}`.trim() : undefined,
          email: buyer?.email,
          contact: buyer?.phone,
        },
        notes: { orderId, orderNumber },
        theme: { color: '#0F4C6E' },
        handler: async (response) => {
          try {
            await paymentsApi.verify(response);
            toast({ description: t('payments.verifySuccess') });
            onSuccess?.();
          } catch (err) {
            toast({
              title: t('payments.verifyFailedTitle'),
              description: (err as Error).message,
              variant: 'destructive',
            });
          } finally {
            setLoading(false);
          }
        },
        modal: {
          ondismiss: () => setLoading(false),
        },
      });
      rzp.open();
    } catch (err) {
      toast({
        title: t('payments.startFailedTitle'),
        description: (err as Error).message,
        variant: 'destructive',
      });
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={handlePay}
      loading={loading}
      className={className}
      data-testid="pay-with-razorpay-button"
    >
      {displayLabel}
    </Button>
  );
}
