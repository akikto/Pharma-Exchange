import { describe, it, expect } from 'vitest';
import { OrderPaymentMethod, PaymentStatus } from '@prisma/client';
import { orderRequiresOnlinePaymentBeforeFulfillment } from '../src/modules/order/order.payment-method.js';
import * as envModule from '../src/config/env';
import { vi } from 'vitest';

describe('orderRequiresOnlinePaymentBeforeFulfillment', () => {
  it('never requires online payment for COD orders', () => {
    vi.spyOn(envModule, 'isRazorpayConfigured').mockReturnValue(true);
    expect(orderRequiresOnlinePaymentBeforeFulfillment({
      paymentMethod: OrderPaymentMethod.COD,
      paymentStatus: PaymentStatus.PENDING,
    })).toBe(false);
    vi.restoreAllMocks();
  });

  it('requires online payment for Razorpay orders when configured', () => {
    vi.spyOn(envModule, 'isRazorpayConfigured').mockReturnValue(true);
    expect(orderRequiresOnlinePaymentBeforeFulfillment({
      paymentMethod: OrderPaymentMethod.RAZORPAY,
      paymentStatus: PaymentStatus.PENDING,
    })).toBe(true);
    vi.restoreAllMocks();
  });
});
