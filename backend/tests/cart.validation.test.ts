import { describe, it, expect } from 'vitest';
import {
  collectCartIssues,
  validateCartQuantity,
  validateCartItem,
} from '../src/modules/cart/cart.validation';

const listing = {
  id: 'listing-1',
  moq: 10,
  availableQty: 100,
  status: 'ACTIVE',
  medicine: { name: 'Napa' },
};

describe('cart.validation', () => {
  it('accepts quantity at MOQ and within stock', () => {
    expect(validateCartQuantity(listing, 10)).toBeNull();
    expect(validateCartQuantity(listing, 50)).toBeNull();
  });

  it('rejects quantity below seller MOQ', () => {
    const issue = validateCartQuantity(listing, 5);
    expect(issue?.code).toBe('MOQ_VIOLATION');
    expect(issue?.moq).toBe(10);
  });

  it('rejects quantity above available stock', () => {
    const issue = validateCartQuantity(listing, 150);
    expect(issue?.code).toBe('INSUFFICIENT_STOCK');
    expect(issue?.availableQty).toBe(100);
  });

  it('rejects inactive listings', () => {
    const issue = validateCartQuantity({ ...listing, status: 'PAUSED' }, 20);
    expect(issue?.code).toBe('LISTING_UNAVAILABLE');
  });

  it('validates cart items with medicine name in issue', () => {
    const issue = validateCartItem({
      id: 'cart-1',
      quantity: 3,
      listing,
    });
    expect(issue?.cartItemId).toBe('cart-1');
    expect(issue?.medicineName).toBe('Napa');
    expect(issue?.code).toBe('MOQ_VIOLATION');
  });

  it('collects issues across multiple seller listings', () => {
    const issues = collectCartIssues([
      { id: 'c1', quantity: 10, listing },
      { id: 'c2', quantity: 2, listing: { ...listing, id: 'listing-2', moq: 5 } },
      { id: 'c3', quantity: 20, listing: { ...listing, id: 'listing-3', availableQty: 15 } },
    ]);
    expect(issues).toHaveLength(2);
    expect(issues.map((i) => i.code).sort()).toEqual(['INSUFFICIENT_STOCK', 'MOQ_VIOLATION']);
  });
});
