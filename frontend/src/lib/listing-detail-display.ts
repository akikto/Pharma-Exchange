import type { Listing } from '@/types';
import { getDaysUntilExpiry, resolveAiPickDistanceKm, showsAiPickAuthenticBadge, showsAiPickFastDeliveryBadge } from '@/lib/ai-pick-card-utils';

export type ItemDeliveryMode = 'BUYER_PICKUP' | 'SELLER_DELIVERS';

export function formatDistanceKmLabel(km: number): string {
  return km >= 100 ? km.toFixed(0) : km >= 10 ? km.toFixed(0) : km.toFixed(1);
}

export function resolveListingDistanceKm(
  listing: Listing,
  userCoords?: { latitude: number; longitude: number } | null,
): number | null {
  return resolveAiPickDistanceKm(listing, userCoords);
}

export function showsListingAuthenticBadge(listing: Listing): boolean {
  return showsAiPickAuthenticBadge(listing);
}

export function showsListingFastDeliveryBadge(listing: Listing, distanceKm: number | null): boolean {
  if (listing.deliveryMode === 'SELLER_DELIVERS') return true;
  return showsAiPickFastDeliveryBadge(distanceKm);
}

export function getListingExpiryDays(expiryDate: string): number {
  return getDaysUntilExpiry(expiryDate);
}

export function hasMedicineClinicalInfo(medicine: Listing['medicine']): boolean {
  return Boolean(
    medicine.indications?.trim()
    || medicine.dosageInstructions?.trim()
    || medicine.sideEffects?.trim(),
  );
}
