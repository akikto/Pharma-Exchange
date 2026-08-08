import { describe, expect, it } from 'vitest';
import {
  canCancelPaymentAttempt,
  canRequestRefund,
  fulfillmentRequiresPayment,
  paymentAttemptChipVariant,
  paymentStatusChipVariant,
} from '@/lib/payment-utils';

describe('payment-utils', () => {
  it('maps payment status chip variants', () => {
    expect(paymentStatusChipVariant('PAID')).toBe('success');
    expect(paymentStatusChipVariant('PENDING')).toBe('warning');
    expect(paymentStatusChipVariant('REFUNDED')).toBe('neutral');
  });

  it('maps attempt status chip variants', () => {
    expect(paymentAttemptChipVariant('CAPTURED')).toBe('success');
    expect(paymentAttemptChipVariant('FAILED')).toBe('danger');
    expect(paymentAttemptChipVariant('CREATED')).toBe('warning');
  });

  it('allows cancel only for pending non-cancelled orders', () => {
    expect(canCancelPaymentAttempt('PENDING', 'CONFIRMED')).toBe(true);
    expect(canCancelPaymentAttempt('PAID', 'CONFIRMED')).toBe(false);
    expect(canCancelPaymentAttempt('PENDING', 'CANCELLED')).toBe(false);
  });

  it('allows refund for paid orders by buyer seller admin', () => {
    expect(canRequestRefund('PAID', 'CONFIRMED', 'buyer')).toBe(true);
    expect(canRequestRefund('PAID', 'CONFIRMED', 'seller')).toBe(true);
    expect(canRequestRefund('PAID', 'CONFIRMED', 'admin')).toBe(true);
    expect(canRequestRefund('PENDING', 'CONFIRMED', 'buyer')).toBe(false);
    expect(canRequestRefund('PAID', 'CANCELLED', 'buyer')).toBe(false);
  });

  it('requires payment before fulfillment only when Razorpay is enabled', () => {
    expect(fulfillmentRequiresPayment(true, 'PENDING', 'PACKED')).toBe(true);
    expect(fulfillmentRequiresPayment(true, 'PAID', 'PACKED')).toBe(false);
    expect(fulfillmentRequiresPayment(false, 'PENDING', 'PACKED')).toBe(false);
    expect(fulfillmentRequiresPayment(true, 'PENDING', 'CANCELLED')).toBe(false);
  });
});
