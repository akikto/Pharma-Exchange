import { describe, it, expect } from 'vitest';
import { cartGrandTotal, cartGroupSubtotal, cartItemLineTotal, cartItemCount } from '@/lib/cart-utils';
import type { CartItem } from '@/types';

const mockItem = (price: number, qty: number): CartItem => ({
  id: '1',
  quantity: qty,
  listing: {
    id: 'l1',
    batchNumber: 'B1',
    mfgDate: '2026-01-01',
    expiryDate: '2027-01-01',
    sellingPrice: price,
    discountPercent: 0,
    finalPrice: price,
    availableQty: 100,
    moq: 1,
    unit: 'strip',
    status: 'ACTIVE',
    medicine: {
      id: 'm1',
      name: 'Napa',
      company: 'Beximco',
      dosageForm: 'TABLET',
      packSize: '10 tabs',
      category: 'ANALGESIC',
    },
    pharmacy: { id: 'p1', name: 'City Pharmacy', city: 'Dhaka', rating: 4.5, verificationStatus: 'APPROVED' },
  },
});

describe('cart-utils', () => {
  it('computes line total', () => {
    expect(cartItemLineTotal(mockItem(50, 3))).toBe(150);
  });

  it('computes group subtotal', () => {
    const items = [mockItem(50, 2), mockItem(30, 1)];
    expect(cartGroupSubtotal(items)).toBe(130);
  });

  it('computes grand total across sellers', () => {
    const grouped = {
      s1: [mockItem(100, 1)],
      s2: [mockItem(50, 2)],
    };
    expect(cartGrandTotal(grouped)).toBe(200);
  });

  it('counts item quantities', () => {
    expect(cartItemCount([mockItem(10, 2), mockItem(10, 3)])).toBe(5);
  });
});
