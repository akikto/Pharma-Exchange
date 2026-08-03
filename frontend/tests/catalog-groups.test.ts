import { describe, expect, it } from 'vitest';
import {
  groupListingsByMedicine,
  filterListingsByQuery,
  filterListingsNearby,
  isRenderableListing,
} from '@/lib/catalog-groups';
import type { Listing } from '@/types';

const baseListing = (overrides: Partial<Listing> & { id: string; medicineId: string; medicineName: string; pharmacyId: string; price: number }): Listing => ({
  id: overrides.id,
  batchNumber: 'B1',
  mfgDate: '2025-01-01',
  expiryDate: '2026-12-01',
  sellingPrice: overrides.price,
  discountPercent: 0,
  finalPrice: overrides.price,
  availableQty: 100,
  moq: 1,
  unit: 'box',
  status: 'ACTIVE',
  medicine: {
    id: overrides.medicineId,
    name: overrides.medicineName,
    company: 'Square',
    dosageForm: 'TABLET',
    packSize: '10 tabs',
    category: 'PAIN',
  },
  pharmacy: {
    id: overrides.pharmacyId,
    name: `Pharmacy ${overrides.pharmacyId}`,
    city: 'Dhaka',
    rating: 4.5,
    verificationStatus: 'APPROVED',
  },
});

describe('catalog-groups', () => {
  it('groups listings by medicine and picks best price', () => {
    const listings = [
      baseListing({ id: '1', medicineId: 'm1', medicineName: 'Napa', pharmacyId: 'p1', price: 120 }),
      baseListing({ id: '2', medicineId: 'm1', medicineName: 'Napa', pharmacyId: 'p2', price: 100 }),
    ];
    const groups = groupListingsByMedicine(listings);
    expect(groups).toHaveLength(1);
    expect(groups[0]?.sellerCount).toBe(2);
    expect(groups[0]?.bestPrice).toBe(100);
    expect(groups[0]?.bestListingId).toBe('2');
  });

  it('filters by search query', () => {
    const listings = [
      baseListing({ id: '1', medicineId: 'm1', medicineName: 'Napa', pharmacyId: 'p1', price: 120 }),
      baseListing({ id: '2', medicineId: 'm2', medicineName: 'Ace', pharmacyId: 'p1', price: 80 }),
    ];
    expect(filterListingsByQuery(listings, 'napa')).toHaveLength(1);
  });

  it('filters by city for nearby', () => {
    const l1 = baseListing({ id: '1', medicineId: 'm1', medicineName: 'Napa', pharmacyId: 'p1', price: 120 });
    const l2 = { ...baseListing({ id: '2', medicineId: 'm2', medicineName: 'Ace', pharmacyId: 'p2', price: 80 }), pharmacy: { ...l1.pharmacy, id: 'p2', city: 'Chittagong' } };
    expect(filterListingsNearby([l1, l2], 'Dhaka')).toHaveLength(1);
  });

  it('skips listings missing medicine or pharmacy relations', () => {
    const valid = baseListing({ id: '1', medicineId: 'm1', medicineName: 'Napa', pharmacyId: 'p1', price: 120 });
    const missingMedicine = { ...valid, medicine: undefined } as unknown as Listing;
    const missingPharmacy = { ...valid, pharmacy: undefined } as unknown as Listing;
    expect(isRenderableListing(missingMedicine)).toBe(false);
    expect(isRenderableListing(missingPharmacy)).toBe(false);
    expect(groupListingsByMedicine([valid, missingMedicine, missingPharmacy])).toHaveLength(1);
  });
});
