import { describe, expect, it } from 'vitest';
import { getListingPharmacyId } from '@/lib/listing-utils';
import type { Listing } from '@/types';

function makeListing(overrides: Partial<Listing> = {}): Listing {
  return {
    id: 'listing-1',
    pharmacy: {
      id: 'pharmacy-uuid',
      userId: 'user-uuid',
      name: 'City Pharmacy',
      city: 'Dhaka',
      rating: 4.5,
      verificationStatus: 'APPROVED',
    },
    medicine: { id: 'med-1', name: 'Napa' },
    finalPrice: 100,
    moq: 10,
    availableQty: 50,
  } as Listing;
}

describe('getListingPharmacyId', () => {
  it('returns pharmacy.id not seller userId', () => {
    const listing = makeListing();
    expect(getListingPharmacyId(listing)).toBe('pharmacy-uuid');
    expect(getListingPharmacyId(listing)).not.toBe('user-uuid');
  });
});
