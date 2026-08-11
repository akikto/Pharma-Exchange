import { isRenderableListing } from '@/lib/catalog-groups';
import type { Listing } from '@/types';

export const FEATURED_DEALS_QUERY_PARAMS = {
  minDiscount: '1',
  sortBy: 'discount',
  sortOrder: 'desc',
  limit: 6,
} as const;

/** Only apply shop filter when the persisted id matches a current demo shop. */
export function resolveFeaturedShopFilter(
  activeShopId: string | null | undefined,
  demoShopIds: readonly string[],
): string | null {
  if (!activeShopId) return null;
  return demoShopIds.includes(activeShopId) ? activeShopId : null;
}

export function buildFeaturedDealsParams(validatedShopId?: string | null) {
  return {
    ...FEATURED_DEALS_QUERY_PARAMS,
    ...(validatedShopId ? { pharmacyId: validatedShopId } : {}),
  };
}

export function selectFeaturedDeals(listings: Listing[]): Listing[] {
  return listings
    .filter(isRenderableListing)
    .filter((listing) => Number(listing.discountPercent) > 0)
    .slice(0, 6);
}

/** Prefer shop-scoped featured deals; fall back to marketplace-wide when empty. */
export function resolveFeaturedDeals(
  validatedShopId: string | null,
  shopListings: Listing[],
  marketplaceListings: Listing[],
): Listing[] {
  if (validatedShopId) {
    const shopFeatured = selectFeaturedDeals(shopListings);
    if (shopFeatured.length > 0) return shopFeatured;
  }
  return selectFeaturedDeals(marketplaceListings);
}
