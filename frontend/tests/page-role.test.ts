import { describe, it, expect } from 'vitest';

describe('usePageRole logic', () => {
  function getRole(pathname: string): 'buyer' | 'seller' {
    return pathname.startsWith('/seller') ? 'seller' : 'buyer';
  }

  it('detects seller routes', () => {
    expect(getRole('/seller/orders')).toBe('seller');
    expect(getRole('/seller/requests/abc')).toBe('seller');
  });

  it('detects buyer routes', () => {
    expect(getRole('/orders')).toBe('buyer');
    expect(getRole('/buy-requests')).toBe('buyer');
  });
});
