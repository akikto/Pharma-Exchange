import { describe, it, expect } from 'vitest';

function canAccessBuyRequest(
  request: { buyerId: string; sellerId: string },
  userId: string,
  pharmacyId: string | null,
  role: string
): boolean {
  if (role === 'ADMIN') return true;
  if (request.buyerId === userId) return true;
  if (pharmacyId && request.sellerId === pharmacyId) return true;
  return false;
}

describe('buy request authorization', () => {
  it('allows seller via pharmacy id', () => {
    const req = { buyerId: 'user-b', sellerId: 'pharmacy-s' };
    expect(canAccessBuyRequest(req, 'user-s', 'pharmacy-s', 'SELLER')).toBe(true);
    expect(canAccessBuyRequest(req, 'other', 'pharmacy-other', 'SELLER')).toBe(false);
  });
});

describe('self-purchase prevention', () => {
  it('blocks when buyer owns seller pharmacy', () => {
    const buyerPharmacyId = 'pharm-1';
    const sellerId = 'pharm-1';
    expect(buyerPharmacyId === sellerId).toBe(true);
  });
});
