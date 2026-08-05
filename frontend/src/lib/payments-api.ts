/**
 * Payments API client (BL-02 · Razorpay).
 *
 * These helpers talk to /api/v1/payments and are consumed by
 * `PayWithRazorpayButton`.
 */
import { apiClient } from '@/lib/api';

export interface CreatePaymentOrderResult {
  paymentId: string;
  orderId: string;
  keyId: string;
  providerOrderId: string;
  amount: number;   // minor unit (paise/cents)
  currency: string;
}

export interface VerifyPaymentInput {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export interface VerifiedPayment {
  id: string;
  status: string;
  providerPaymentId: string | null;
  order: { id: string; paymentStatus: string; status: string };
}

export interface RefundResult {
  refundId: string;
  providerRefundId: string;
  status: 'PENDING' | 'PROCESSED' | 'FAILED';
}

export interface OrderPaymentRecord {
  id: string;
  status: string;
  amount: number | string;
  currency: string;
  providerOrderId: string;
  providerPaymentId?: string | null;
  method?: string | null;
  capturedAt?: string | null;
  createdAt: string;
  refunds?: Array<{
    id: string;
    status: string;
    amount: number | string;
    providerRefundId: string;
  }>;
}

export const paymentsApi = {
  createOrder: (orderId: string) =>
    apiClient.post<CreatePaymentOrderResult>('/payments/create-order', { orderId }),

  verify: (input: VerifyPaymentInput) =>
    apiClient.post<VerifiedPayment>('/payments/verify', input),

  cancel: (orderId: string) =>
    apiClient.post<{ paymentId: string; status: string }>(`/payments/${orderId}/cancel`, {}),

  refund: (orderId: string, body: { amount?: number; reason?: string }) =>
    apiClient.post<RefundResult>(`/payments/${orderId}/refund`, body),

  listForOrder: (orderId: string) =>
    apiClient.get<{ data: OrderPaymentRecord[] }>(`/payments/order/${orderId}`),
};
