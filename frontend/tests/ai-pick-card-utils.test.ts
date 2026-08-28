import { describe, expect, it } from 'vitest';
import {
  formatSellerLocation,
  getDaysUntilExpiry,
  showsAiPickAuthenticBadge,
  showsAiPickFastDeliveryBadge,
  sortAiPickMatchesByDistance,
} from '@/lib/ai-pick-card-utils';
import type { Listing } from '@/types';

const baseListing = {
  id: 'listing-1',
  batchNumber: 'B1',
  mfgDate: '2025-01-01',
  expiryDate: '2026-12-01',
  sellingPrice: 30,
  discountPercent: 0,
  finalPrice: 24,
  availableQty: 9,
  moq: 1,
  unit: 'strip',
  status: 'ACTIVE',
  medicine: {
    id: 'med-1',
    name: 'Nap 10',
    company: 'Acme',
    dosageForm: 'TABLET',
    strength: '500mg',
    packSize: '10',
    category: 'Analgesic',
    genericName: 'Naproxen',
  },
  pharmacy: {
    id: 'pharm-1',
    name: 'Toni Pharmacy',
    city: 'Berhampur',
    district: 'Odisha',
    rating: 4.8,
    verificationStatus: 'APPROVED',
  },
} as Listing;

describe('ai-pick-card-utils', () => {
  it('computes days until expiry from expiry date', () => {
    const now = new Date('2026-08-26T12:00:00Z').getTime();
    const expiry = '2026-10-15T00:00:00Z';
    const days = getDaysUntilExpiry(expiry, now);
    expect(days).toBeGreaterThan(40);
    expect(days).toBeLessThan(60);
  });

  it('formats seller location with district when present', () => {
    expect(formatSellerLocation(baseListing)).toBe('Berhampur, Odisha');
  });

  it('shows authentic badge for active listings from verified pharmacies', () => {
    expect(showsAiPickAuthenticBadge(baseListing)).toBe(true);
    expect(showsAiPickAuthenticBadge({ ...baseListing, status: 'PAUSED' })).toBe(false);
  });

  it('shows fast delivery when distance is known', () => {
    expect(showsAiPickFastDeliveryBadge(12)).toBe(true);
    expect(showsAiPickFastDeliveryBadge(30)).toBe(true);
    expect(showsAiPickFastDeliveryBadge(null)).toBe(false);
  });

  it('sorts AI picks by nearest distance with AI score as tie-breaker', () => {
    const userCoords = { latitude: 23.8, longitude: 90.4 };
    const makeListing = (id: string, lat: number, lng: number, distanceKm?: number): Listing => ({
      ...baseListing,
      id,
      distanceKm,
      pharmacy: {
        ...baseListing.pharmacy,
        latitude: lat,
        longitude: lng,
      },
    });

    const matches = [
      { id: 'far', score: 0.9, listing: makeListing('far', 24.5, 91.0) },
      { id: 'near', score: 0.7, listing: makeListing('near', 23.81, 90.41) },
      { id: 'mid', score: 0.8, listing: makeListing('mid', 24.0, 90.6) },
      { id: 'unknown', score: 0.95, listing: { ...baseListing, id: 'unknown', pharmacy: { ...baseListing.pharmacy, latitude: undefined, longitude: undefined } } },
    ];

    const sorted = sortAiPickMatchesByDistance(matches, userCoords);
    expect(sorted.map((match) => match.id)).toEqual(['near', 'mid', 'far', 'unknown']);
  });

  it('preserves AI order when no location is available', () => {
    const matches = [
      { id: 'a', score: 0.5, listing: baseListing },
      { id: 'b', score: 0.9, listing: { ...baseListing, id: 'listing-2' } },
    ];

    const sorted = sortAiPickMatchesByDistance(matches, null);
    expect(sorted.map((match) => match.id)).toEqual(['a', 'b']);
  });
});
