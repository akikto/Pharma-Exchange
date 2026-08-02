import { describe, it, expect } from 'vitest';
import { formatPrice, getExpiryStatus, getExpiryLabel } from '@/lib/utils';

describe('formatPrice', () => {
  it('formats amounts without currency symbol', () => {
    expect(formatPrice(120)).toBe('120.00');
    expect(formatPrice(1500.5)).toBe('1,500.50');
  });
});

describe('getExpiryStatus', () => {
  it('returns danger for soon expiry', () => {
    const soon = new Date();
    soon.setDate(soon.getDate() + 15);
    expect(getExpiryStatus(soon.toISOString())).toBe('danger');
  });

  it('returns success for far expiry', () => {
    const far = new Date();
    far.setMonth(far.getMonth() + 12);
    expect(getExpiryStatus(far.toISOString())).toBe('safe');
  });
});

describe('getExpiryLabel', () => {
  it('returns months label', () => {
    const date = new Date();
    date.setMonth(date.getMonth() + 8);
    expect(getExpiryLabel(date.toISOString())).toMatch(/months/);
  });
});
