import { describe, it, expect } from 'vitest';
import { formatPharmacyAddress, resolveActiveShop } from '@/lib/shop-utils';

describe('shop-utils', () => {
  const shops = [
    { id: 'a', name: 'City Pharmacy', city: 'Dhaka', verificationStatus: 'APPROVED', rating: 4.5 },
    { id: 'b', name: 'Green Care', city: 'Chattogram', verificationStatus: 'APPROVED', rating: 4.2 },
  ];

  it('resolveActiveShop picks demo shop when activeShopId set', () => {
    expect(resolveActiveShop(shops, 'b', null)?.name).toBe('Green Care');
  });

  it('resolveActiveShop falls back to own pharmacy', () => {
    expect(resolveActiveShop(shops, null, { id: 'own', name: 'My Shop', verificationStatus: 'APPROVED' })?.name).toBe('My Shop');
  });

  it('formatPharmacyAddress joins address parts', () => {
    expect(formatPharmacyAddress({
      address: '123 Road',
      city: 'Dhaka',
      district: 'Dhaka',
      postalCode: '1205',
    })).toBe('123 Road, Dhaka, Dhaka, 1205');
  });
});
