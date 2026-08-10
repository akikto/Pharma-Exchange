import { isRenderableListing } from '@/lib/catalog-groups';
import type { Listing } from '@/types';

export const FEATURED_DEALS_QUERY_PARAMS = {
  minDiscount: '1',
  sortBy: 'discount',
  sortOrder: 'desc',
  limit: 6,
} as const;

export function buildFeaturedDealsParams(activeShopId?: string | null) {
  return {
    ...FEATURED_DEALS_QUERY_PARAMS,
    ...(activeShopId ? { pharmacyId: activeShopId } : {}),
  };
}

export function selectFeaturedDeals(listings: Listing[]): Listing[] {
  return listings
    .filter(isRenderableListing)
    .filter((listing) => listing.discountPercent > 0)
    .slice(0, 6);
}
