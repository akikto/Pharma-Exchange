import { formatDate } from '@/lib/utils';
import { getListingDistanceKm } from '@/lib/listing-utils';
import type { Listing } from '@/types';

const MS_PER_DAY = 1000 * 60 * 60 * 24;

/** Whole days from now until expiry (0 if already expired). */
export function getDaysUntilExpiry(expiryDate: string, now = Date.now()): number {
  const expiryMs = new Date(expiryDate).getTime();
  if (!Number.isFinite(expiryMs)) return 0;
  const diff = expiryMs - now;
  if (diff <= 0) return 0;
  return Math.ceil(diff / MS_PER_DAY);
}

export function formatAiPickExpiryDate(expiryDate: string): string {
  return formatDate(expiryDate);
}

export function resolveAiPickDistanceKm(
  listing: Listing,
  userCoords?: { latitude: number; longitude: number } | null,
): number | null {
  return getListingDistanceKm(listing, userCoords);
}

/** Verified pharmacy listings are treated as platform-authentic offers. */
export function showsAiPickAuthenticBadge(listing: Listing): boolean {
  return listing.pharmacy.verificationStatus === 'APPROVED' && listing.status === 'ACTIVE';
}

/** Fast delivery when distance is known for the listing (shown with the km-away pill). */
export function showsAiPickFastDeliveryBadge(distanceKm: number | null): boolean {
  return distanceKm != null;
}

export function formatSellerLocation(listing: Listing): string {
  const { city, district } = listing.pharmacy;
  if (district?.trim()) return `${city}, ${district.trim()}`;
  return city;
}

export function formatGenericStrengthLine(listing: Listing, compositionText: string | null): string {
  const parts = [compositionText, listing.medicine.strength?.trim()].filter(Boolean);
  return parts.join(' ').trim();
}
