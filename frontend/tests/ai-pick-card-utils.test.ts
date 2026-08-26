import { describe, expect, it } from 'vitest';
import {
  formatSellerLocation,
  getDaysUntilExpiry,
  showsAiPickAuthenticBadge,
  showsAiPickFastDeliveryBadge,
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
});
