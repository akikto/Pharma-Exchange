import { OrderPaymentMethod, PaymentStatus } from '@prisma/client';
import { isRazorpayConfigured } from '../../config/env';

/** Online Razorpay payment must be captured before fulfillment for non-COD orders. */
export function orderRequiresOnlinePaymentBeforeFulfillment(order: {
  paymentMethod: OrderPaymentMethod | null;
  paymentStatus: PaymentStatus;
}): boolean {
  if (order.paymentMethod === OrderPaymentMethod.COD) return false;
  return isRazorpayConfigured() && order.paymentStatus !== PaymentStatus.PAID;
}
