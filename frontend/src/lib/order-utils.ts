import type { BuyRequest, Order } from '@/types';
import { effectiveBuyRequestStatus } from '@/lib/buy-request-utils';

export const ORDER_FLOW_STEPS = ['CREATED', 'CONFIRMED', 'PACKED', 'SHIPPED', 'DELIVERED'] as const;

export const BUY_REQUEST_FLOW_STEPS = ['PENDING', 'ACCEPTED'] as const;

export type OrderFilter = 'ALL' | 'ACTIVE' | 'DELIVERED' | 'CANCELLED';

export type BuyRequestFilter = 'ALL' | 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED';

const ACTIVE_ORDER_STATUSES = new Set(['CREATED', 'CONFIRMED', 'PACKED', 'SHIPPED']);

export function isActiveOrder(status: string): boolean {
  return ACTIVE_ORDER_STATUSES.has(status);
}

export function orderStepIndex(status: string): number {
  if (status === 'CANCELLED') return -1;
  const idx = ORDER_FLOW_STEPS.indexOf(status as (typeof ORDER_FLOW_STEPS)[number]);
  return idx >= 0 ? idx : 0;
}

export function buyRequestStepIndex(status: string): number {
  if (status === 'REJECTED' || status === 'EXPIRED') return -1;
  if (status === 'ACCEPTED') return 1;
  return 0;
}

export function filterOrders(orders: Order[], filter: OrderFilter, query: string): Order[] {
  const q = query.trim().toLowerCase();
  return orders.filter((order) => {
    if (filter === 'ACTIVE' && !isActiveOrder(order.status)) return false;
    if (filter === 'DELIVERED' && order.status !== 'DELIVERED') return false;
    if (filter === 'CANCELLED' && order.status !== 'CANCELLED') return false;
    if (!q) return true;
    const haystack = [
      order.orderNumber,
      order.seller?.name,
      order.buyer?.firstName,
      order.buyer?.lastName,
      ...order.items.map((i) => i.medicineName),
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    return haystack.includes(q);
  });
}

export function filterBuyRequests(requests: BuyRequest[], filter: BuyRequestFilter, query: string): BuyRequest[] {
  const q = query.trim().toLowerCase();
  return requests.filter((req) => {
    const status = effectiveBuyRequestStatus(req);
    if (filter !== 'ALL' && status !== filter) return false;
    if (!q) return true;
    const haystack = [
      req.requestNumber,
      req.seller?.name,
      req.buyer?.firstName,
      req.buyer?.lastName,
      ...req.items.map((i) => i.listing.medicine.name),
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    return haystack.includes(q);
  });
}

export interface OrderStats {
  total: number;
  active: number;
  delivered: number;
  cancelled: number;
  totalSpent: number;
}

export function computeOrderStats(orders: Order[]): OrderStats {
  return orders.reduce<OrderStats>(
    (acc, order) => {
      acc.total += 1;
      if (isActiveOrder(order.status)) acc.active += 1;
      if (order.status === 'DELIVERED') {
        acc.delivered += 1;
        acc.totalSpent += Number(order.totalAmount);
      }
      if (order.status === 'CANCELLED') acc.cancelled += 1;
      return acc;
    },
    { total: 0, active: 0, delivered: 0, cancelled: 0, totalSpent: 0 },
  );
}

export function buildOrderReceiptText(
  order: Order,
  counterpartyLabel: string,
  payments?: Array<{ status: string; providerOrderId: string; providerPaymentId?: string | null }>,
): string {
  const lines = [
    `PharmEx — ${order.orderNumber}`,
    `${counterpartyLabel}`,
    `Status: ${order.status}`,
    `Payment: ${order.paymentStatus}`,
    `Date: ${new Date(order.createdAt).toLocaleString()}`,
    '',
    'Items:',
    ...order.items.map((i) => `  ${i.medicineName} × ${i.quantity} — ₹${Number(i.subtotal).toFixed(2)}`),
    '',
    `Total: ₹${Number(order.totalAmount).toFixed(2)}`,
  ];
  if (payments && payments.length > 0) {
    lines.push('', 'Payments:');
    for (const payment of payments) {
      lines.push(`  ${payment.status} · ${payment.providerOrderId}${payment.providerPaymentId ? ` · ${payment.providerPaymentId}` : ''}`);
    }
  }
  return lines.join('\n');
}

export function canTrackOrder(status: string): boolean {
  return ['PACKED', 'SHIPPED'].includes(status);
}

export function simulatedEtaHours(status: string): number {
  if (status === 'PACKED') return 48;
  if (status === 'SHIPPED') return 12;
  return 24;
}
