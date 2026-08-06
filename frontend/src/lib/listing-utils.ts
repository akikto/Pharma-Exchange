import type { Listing } from '@/types';

/** Pharmacy UUID required by buy-request APIs — not the seller user id. */
export function getListingPharmacyId(listing: Listing): string {
  return listing.pharmacy.id;
}
