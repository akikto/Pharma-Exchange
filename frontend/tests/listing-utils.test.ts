import { describe, expect, it } from 'vitest';
import {
  getListingCompositionText,
  getListingDistanceKm,
  getListingImageUrl,
} from '@/lib/listing-utils';
import type { Listing } from '@/types';

const baseListing = {
  id: 'listing-1',
  batchNumber: 'B1',
  mfgDate: '2025-01-01',
  expiryDate: '2026-12-01',
  sellingPrice: 100,
  discountPercent: 20,
  finalPrice: 80,
  availableQty: 10,
  moq: 1,
  unit: 'strip',
  status: 'ACTIVE',
  medicine: {
    id: 'med-1',
    name: 'Napa',
    company: 'Beximco',
    dosageForm: 'TABLET',
    packSize: '10 tablets',
    category: 'Analgesic',
    composition: 'Paracetamol 500 mg',
    imageUrl: 'https://example.com/med.png',
  },
  pharmacy: {
    id: 'pharm-1',
    name: 'City Pharmacy',
    city: 'Dhaka',
    rating: 4.6,
    verificationStatus: 'APPROVED',
    latitude: 23.7461,
    longitude: 90.3742,
  },
} as Listing;

const userCoords = { latitude: 23.8103, longitude: 90.4125 };

describe('listing-utils', () => {
  it('prefers listing image over medicine image', () => {
    expect(getListingImageUrl({ ...baseListing, imageUrl: 'https://example.com/listing.png' }))
      .toBe('https://example.com/listing.png');
    expect(getListingImageUrl({ ...baseListing, imageUrl: undefined }))
      .toBe('https://example.com/med.png');
  });

  describe('getListingCompositionText', () => {
    it('returns composition when present', () => {
      expect(getListingCompositionText(baseListing)).toBe('Paracetamol 500 mg');
    });

    it('falls back to genericName when composition is missing', () => {
      const listing = {
        ...baseListing,
        medicine: { ...baseListing.medicine, composition: undefined, genericName: 'Paracetamol + Caffeine' },
      } as Listing;
      expect(getListingCompositionText(listing)).toBe('Paracetamol + Caffeine');
    });

    it('returns null when composition and genericName are missing', () => {
      const listing = {
        ...baseListing,
        medicine: { ...baseListing.medicine, composition: undefined, genericName: undefined },
      } as Listing;
      expect(getListingCompositionText(listing)).toBeNull();
    });
  });

  describe('getListingDistanceKm', () => {
    it('uses API distance when present', () => {
      expect(getListingDistanceKm({ ...baseListing, distanceKm: 2.4 }, null)).toBe(2.4);
    });

    it('computes Haversine distance from valid user and pharmacy coordinates', () => {
      const km = getListingDistanceKm(baseListing, userCoords);
      expect(km).not.toBeNull();
      expect(km!).toBeGreaterThan(0);
      expect(km!).toBeLessThan(20);
    });

    it('returns null without user coordinates', () => {
      expect(getListingDistanceKm(baseListing, null)).toBeNull();
      expect(getListingDistanceKm(baseListing, undefined)).toBeNull();
    });

    it('returns null when pharmacy coordinates are missing', () => {
      const listing = {
        ...baseListing,
        pharmacy: { ...baseListing.pharmacy, latitude: undefined, longitude: undefined },
      } as Listing;
      expect(getListingDistanceKm(listing, userCoords)).toBeNull();
    });
  });
});
