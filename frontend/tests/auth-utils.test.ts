import { describe, expect, it } from 'vitest';
import { isApprovedSeller, getAppHomeRoute } from '@/lib/auth-utils';
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
    expect(getAppHomeRoute('seller')).toBe('/seller');
    expect(getAppHomeRoute('buyer')).toBe('/');
  });
});
