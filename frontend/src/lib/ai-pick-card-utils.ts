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

export interface AiPickMatchSortable {
  id: string;
  score: number;
  listing: Listing | null;
}

/** Nearest listings first when location is available; AI score breaks ties; no-distance listings keep relative order after. */
export function sortAiPickMatchesByDistance<T extends AiPickMatchSortable>(
  matches: T[],
  userCoords?: { latitude: number; longitude: number } | null,
): T[] {
  if (matches.length <= 1) return matches;

  const ranked = matches.map((match, index) => ({
    match,
    index,
    score: match.score,
    distanceKm: match.listing ? resolveAiPickDistanceKm(match.listing, userCoords) : null,
  }));

  const hasAnyDistance = ranked.some((item) => item.distanceKm != null);
  if (!hasAnyDistance) return matches;

  return ranked
    .sort((a, b) => {
      const aHas = a.distanceKm != null;
      const bHas = b.distanceKm != null;

      if (aHas && bHas) {
        const distanceDiff = a.distanceKm! - b.distanceKm!;
        if (distanceDiff !== 0) return distanceDiff;
        if (b.score !== a.score) return b.score - a.score;
        return a.index - b.index;
      }
      if (aHas !== bHas) return aHas ? -1 : 1;
      return a.index - b.index;
    })
    .map((item) => item.match);
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
