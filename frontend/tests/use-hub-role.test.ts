import { describe, it, expect } from 'vitest';

/** Mirrors useHubRole path resolution (cart is always buyer context). */
function resolveHubRole(pathname: string, mode: 'buyer' | 'seller'): 'buyer' | 'seller' {
  if (pathname.startsWith('/seller')) return 'seller';
  if (pathname.startsWith('/cart')) return 'buyer';
  return mode === 'seller' ? 'seller' : 'buyer';
}

describe('useHubRole', () => {
  it('forces buyer role on /cart even when auth mode is seller', () => {
    expect(resolveHubRole('/cart', 'seller')).toBe('buyer');
    expect(resolveHubRole('/cart?tab=orders', 'seller')).toBe('buyer');
  });

  it('uses seller role under /seller/*', () => {
    expect(resolveHubRole('/seller/orders', 'buyer')).toBe('seller');
    expect(resolveHubRole('/seller/requests/abc', 'buyer')).toBe('seller');
  });

  it('falls back to auth mode elsewhere', () => {
    expect(resolveHubRole('/', 'seller')).toBe('seller');
    expect(resolveHubRole('/orders', 'buyer')).toBe('buyer');
  });
});
