import { describe, expect, it } from 'vitest';
import {
  buildFeaturedDealsParams,
  resolveFeaturedDeals,
  resolveFeaturedShopFilter,
  selectFeaturedDeals,
} from '@/lib/home-feed';
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
  },
  pharmacy: {
    id: 'pharm-1',
    name: 'City Pharmacy',
    city: 'Dhaka',
    rating: 4.6,
    verificationStatus: 'APPROVED',
  },
} as Listing;

describe('home-feed', () => {
  it('builds featured deals query params without feed filters', () => {
    expect(buildFeaturedDealsParams()).toEqual({
      minDiscount: '1',
      sortBy: 'discount',
      sortOrder: 'desc',
      limit: 6,
    });
    expect(buildFeaturedDealsParams()).not.toHaveProperty('maxExpiryDays');
    expect(buildFeaturedDealsParams()).not.toHaveProperty('latitude');
  });

  it('ignores stale activeShopId values that are not current demo shops', () => {
    const demoShopIds = ['pharm-1', 'pharm-2'];

    expect(resolveFeaturedShopFilter('pharm-1', demoShopIds)).toBe('pharm-1');
    expect(resolveFeaturedShopFilter('stale-shop-id', demoShopIds)).toBeNull();
    expect(buildFeaturedDealsParams(resolveFeaturedShopFilter('stale-shop-id', demoShopIds))).toEqual({
      minDiscount: '1',
      sortBy: 'discount',
      sortOrder: 'desc',
      limit: 6,
    });
  });

  it('keeps only discounted renderable featured deals', () => {
    const featured = selectFeaturedDeals([
      { ...baseListing, id: 'featured-1', discountPercent: 25 },
      { ...baseListing, id: 'featured-2', discountPercent: 10 },
      { ...baseListing, id: 'plain-1', discountPercent: 0 },
      { ...baseListing, id: 'broken-1', discountPercent: 30, medicine: undefined } as unknown as Listing,
    ]);

    expect(featured.map((listing) => listing.id)).toEqual(['featured-1', 'featured-2']);
  });

  it('returns featured deals even when the main feed list is empty', () => {
    const featured = selectFeaturedDeals([
      { ...baseListing, id: 'featured-only', discountPercent: 15 },
    ]);

    expect(featured).toHaveLength(1);
    expect(featured[0]?.id).toBe('featured-only');
  });

  it('prefers shop featured deals when the selected shop has discounts', () => {
    const shopListing = { ...baseListing, id: 'shop-featured', pharmacy: { ...baseListing.pharmacy, id: 'pharm-2' } };
    const marketplaceListing = { ...baseListing, id: 'market-featured' };

    const featured = resolveFeaturedDeals('pharm-2', [shopListing], [marketplaceListing]);

    expect(featured.map((listing) => listing.id)).toEqual(['shop-featured']);
  });

  it('falls back to marketplace featured deals when the selected shop has none', () => {
    const marketplaceListing = { ...baseListing, id: 'market-featured' };

    const featured = resolveFeaturedDeals('pharm-2', [], [marketplaceListing]);

    expect(featured.map((listing) => listing.id)).toEqual(['market-featured']);
  });

  it('uses marketplace featured deals when no shop is selected', () => {
    const marketplaceListing = { ...baseListing, id: 'market-featured' };

    const featured = resolveFeaturedDeals(null, [], [marketplaceListing]);

    expect(featured.map((listing) => listing.id)).toEqual(['market-featured']);
  });
});
