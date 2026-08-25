import { describe, it, expect } from 'vitest';
import {
  filterOrders,
  filterBuyRequests,
  computeOrderStats,
  isActiveOrder,
  canTrackOrder,
  buildOrderReceiptText,
} from '@/lib/order-utils';
import type { Order, BuyRequest } from '@/types';

const baseOrder = (overrides: Partial<Order>): Order => ({
  id: '1',
  orderNumber: 'ORD-001',
  status: 'CONFIRMED',
  paymentStatus: 'PENDING',
  totalAmount: 1000,
  createdAt: '2026-08-01T00:00:00Z',
  items: [{ id: 'i1', listingId: 'l1', medicineName: 'Napa', quantity: 10, unitPrice: '100', subtotal: '1000' }],
  seller: { id: 'p1', name: 'City Pharmacy', city: 'Dhaka', rating: 4.5, verificationStatus: 'APPROVED' },
  ...overrides,
});

const baseRequest = (overrides: Partial<BuyRequest>): BuyRequest => ({
  id: '1',
  requestNumber: 'BR-001',
  status: 'PENDING',
  totalAmount: 500,
  createdAt: '2026-08-01T00:00:00Z',
  items: [],
  seller: { id: 'p1', name: 'MedPlus', city: 'Dhaka', rating: 4, verificationStatus: 'APPROVED' },
  ...overrides,
});

describe('order-utils', () => {
  it('identifies active orders', () => {
    expect(isActiveOrder('SHIPPED')).toBe(true);
    expect(isActiveOrder('DELIVERED')).toBe(false);
  });

  it('filters orders by status and search', () => {
    const orders = [
      baseOrder({ status: 'DELIVERED', orderNumber: 'ORD-A' }),
      baseOrder({ id: '2', status: 'CANCELLED', orderNumber: 'ORD-B' }),
    ];
    expect(filterOrders(orders, 'DELIVERED', '').length).toBe(1);
    expect(filterOrders(orders, 'ALL', 'ord-b').length).toBe(1);
  });

  it('computes buyer order stats', () => {
    const stats = computeOrderStats([
      baseOrder({ status: 'DELIVERED', totalAmount: 2000 }),
      baseOrder({ id: '2', status: 'SHIPPED' }),
    ]);
    expect(stats.delivered).toBe(1);
    expect(stats.active).toBe(1);
    expect(stats.totalSpent).toBe(2000);
  });

  it('filters buy requests', () => {
    const requests = [
      baseRequest({ status: 'PENDING' }),
      baseRequest({ id: '2', status: 'REJECTED', requestNumber: 'BR-002' }),
      baseRequest({
        id: '3',
        status: 'PENDING',
        requestNumber: 'BR-003',
        expiresAt: '2020-01-01T00:00:00.000Z',
      }),
    ];
    expect(filterBuyRequests(requests, 'PENDING', '').length).toBe(1);
    expect(filterBuyRequests(requests, 'EXPIRED', '').length).toBe(1);
  });

  it('can track packed/shipped orders', () => {
    expect(canTrackOrder('PACKED')).toBe(true);
    expect(canTrackOrder('DELIVERED')).toBe(false);
  });

  it('builds receipt text', () => {
    const text = buildOrderReceiptText(baseOrder({}), 'City Pharmacy');
    expect(text).toContain('ORD-001');
    expect(text).toContain('Napa');
  });

  it('includes payment provider ids in receipt when provided', () => {
    const text = buildOrderReceiptText(baseOrder({}), 'City Pharmacy', [
      { status: 'CAPTURED', providerOrderId: 'order_abc', providerPaymentId: 'pay_xyz' },
    ]);
    expect(text).toContain('order_abc');
    expect(text).toContain('pay_xyz');
  });
});
