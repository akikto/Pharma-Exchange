import { describe, expect, it } from 'vitest';
import {
  listingCardToneClasses,
  marketplaceCardShellClasses,
  resolveListingCardTone,
} from '@/lib/listing-card-tone';
import type { Listing } from '@/types';

const baseListing = {
  id: 'l1',
  batchNumber: 'B1',
  mfgDate: '2025-01-01',
  expiryDate: new Date(Date.now() + 400 * 24 * 60 * 60 * 1000).toISOString(),
  sellingPrice: 100,
  discountPercent: 0,
  finalPrice: 100,
  availableQty: 100,
  moq: 1,
  unit: 'strip',
  status: 'ACTIVE',
  medicine: {
    id: 'm1',
    name: 'Napa',
    company: 'Beximco',
    dosageForm: 'TABLET',
    packSize: '10 tablets',
    category: 'Analgesic',
  },
  pharmacy: {
    id: 'p1',
    name: 'City Pharmacy',
    city: 'Dhaka',
    rating: 4.5,
    verificationStatus: 'APPROVED',
  },
} as Listing;

describe('listing-card-tone', () => {
  it('respects explicit tone over listing urgency', () => {
    const shortExpiry = {
      ...baseListing,
      expiryDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
    };
    expect(resolveListingCardTone(shortExpiry, 'featured')).toBe('featured');
  });

  it('derives danger and warning from expiry and stock', () => {
    const danger = {
      ...baseListing,
      expiryDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    };
    expect(resolveListingCardTone(danger)).toBe('danger');

    const warning = {
      ...baseListing,
      expiryDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
    };
    expect(resolveListingCardTone(warning)).toBe('warning');

    const lowStock = { ...baseListing, availableQty: 1, moq: 5 };
    expect(resolveListingCardTone(lowStock)).toBe('warning');
  });

  it('maps four tones to distinct border classes', () => {
    expect(listingCardToneClasses('default')).toContain('border-border-subtle');
    expect(listingCardToneClasses('featured')).toContain('border-primary');
    expect(listingCardToneClasses('warning')).toContain('border-warning');
    expect(listingCardToneClasses('danger')).toContain('border-danger');
  });

  it('builds marketplace shell with elevation and optional interactivity', () => {
    const shell = marketplaceCardShellClasses('featured', true);
    expect(shell).toContain('shadow-elevation-1');
    expect(shell).toContain('listing-card-interactive');
    expect(shell).toContain('border-primary');
  });
});
