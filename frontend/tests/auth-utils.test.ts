import { describe, expect, it } from 'vitest';
import { isApprovedSeller, getPostLoginRoute } from '@/lib/auth-utils';
import type { User } from '@/types';

const approvedSeller: User = {
  id: '1',
  email: 'seller@test.com',
  firstName: 'Seller',
  lastName: 'Test',
  role: 'USER',
  pharmacy: {
    id: 'p1',
    name: 'City Pharmacy',
    verificationStatus: 'APPROVED',
  },
};

describe('auth-utils', () => {
  it('detects approved seller', () => {
    expect(isApprovedSeller(approvedSeller)).toBe(true);
    expect(isApprovedSeller({ ...approvedSeller, pharmacy: { ...approvedSeller.pharmacy!, verificationStatus: 'PENDING' } })).toBe(false);
  });

  it('returns home route by mode', () => {
    expect(getPostLoginRoute(null, 'seller')).toBe('/');
    expect(getPostLoginRoute(null, 'buyer')).toBe('/');
  });

  it('routes admin to /admin', () => {
    const admin = { ...approvedSeller, role: 'ADMIN' as const, pharmacy: undefined };
    expect(getPostLoginRoute(admin, 'buyer')).toBe('/admin');
  });

  it('routes approved seller to /seller when in seller mode', () => {
    expect(getPostLoginRoute(approvedSeller, 'seller')).toBe('/seller');
    expect(getPostLoginRoute(approvedSeller, 'buyer')).toBe('/');
  });
});
