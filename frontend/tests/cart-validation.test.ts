import { describe, it, expect } from 'vitest';
import {
  formatCartIssueMessage,
  validateCartItem,
  validateSellerCartGroup,
} from '@/lib/cart-validation';
import type { CartItem } from '@/types';

const mockItem = (qty: number, moq = 10, availableQty = 100): CartItem => ({
  id: 'cart-1',
  quantity: qty,
  listing: {
    id: 'l1',
    batchNumber: 'B1',
    mfgDate: '2026-01-01',
    expiryDate: '2027-01-01',
    sellingPrice: 50,
    discountPercent: 0,
    finalPrice: 50,
    availableQty,
    moq,
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

describe('cart-validation', () => {
  it('accepts valid quantities', () => {
    expect(validateCartItem(mockItem(10))).toBeNull();
    expect(validateCartItem(mockItem(50))).toBeNull();
  });

  it('rejects quantity below seller MOQ', () => {
    const issue = validateCartItem(mockItem(5));
    expect(issue?.code).toBe('MOQ_VIOLATION');
    expect(issue?.moq).toBe(10);
  });

  it('rejects quantity above stock', () => {
    const issue = validateCartItem(mockItem(150, 10, 100));
    expect(issue?.code).toBe('INSUFFICIENT_STOCK');
  });

  it('validates seller cart group with multiple items', () => {
    const issues = validateSellerCartGroup([
      mockItem(10),
      mockItem(3, 5),
    ]);
    expect(issues).toHaveLength(1);
    expect(issues[0].code).toBe('MOQ_VIOLATION');
  });

  it('formats issue messages with medicine name', () => {
    const issue = validateCartItem(mockItem(2))!;
    expect(formatCartIssueMessage(issue)).toBe('Napa: Minimum order quantity is 10');
  });
});
