export type PaymentStatusValue = 'PENDING' | 'PAID' | 'REFUNDED' | string;

const FULFILLMENT_STATUSES = new Set(['PACKED', 'SHIPPED', 'DELIVERED']);

/** When Razorpay is enabled, seller fulfillment steps require a captured payment. */
export function fulfillmentRequiresPayment(
  paymentsEnabled: boolean,
  paymentStatus: PaymentStatusValue,
  nextOrderStatus: string,
): boolean {
  return paymentsEnabled
    && FULFILLMENT_STATUSES.has(nextOrderStatus)
    && paymentStatus !== 'PAID';
}

export type PaymentAttemptStatusValue =
  | 'CREATED'
  | 'CAPTURED'
  | 'FAILED'
  | 'CANCELLED'
  | 'REFUNDED'
  | string;

export function paymentStatusChipVariant(status: PaymentStatusValue): 'success' | 'warning' | 'danger' | 'neutral' {
  switch (status) {
    case 'PAID':
      return 'success';
    case 'REFUNDED':
      return 'neutral';
    case 'PENDING':
    default:
      return 'warning';
  }
}

export function paymentAttemptChipVariant(status: PaymentAttemptStatusValue): 'success' | 'warning' | 'danger' | 'neutral' {
  switch (status) {
    case 'CAPTURED':
      return 'success';
    case 'FAILED':
      return 'danger';
    case 'CANCELLED':
    case 'REFUNDED':
      return 'neutral';
    case 'CREATED':
    default:
      return 'warning';
  }
}

export function canCancelPaymentAttempt(paymentStatus: PaymentStatusValue, orderStatus: string): boolean {
  return paymentStatus === 'PENDING' && orderStatus !== 'CANCELLED';
}

export function canRequestRefund(
  paymentStatus: PaymentStatusValue,
  orderStatus: string,
  role: 'buyer' | 'seller' | 'admin',
): boolean {
  if (paymentStatus !== 'PAID') return false;
  if (orderStatus === 'CANCELLED') return false;
  return role === 'buyer' || role === 'seller' || role === 'admin';
}
