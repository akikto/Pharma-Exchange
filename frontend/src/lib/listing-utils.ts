import type { Listing } from '@/types';
import { haversineKm } from '@/lib/geo';

/** Pharmacy UUID required by buy-request APIs — not the seller user id. */
export function getListingPharmacyId(listing: Listing): string {
  return listing.pharmacy.id;
}

export function getListingImageUrl(listing: Listing): string | undefined {
  return listing.imageUrl ?? listing.medicine.imageUrl ?? undefined;
}

export function getListingCompositionText(listing: Listing): string | null {
  const composition = listing.medicine.composition?.trim();
  if (composition) return composition;
  const genericName = listing.medicine.genericName?.trim();
  if (genericName) return genericName;
  return null;
}

function hasValidCoordinates(latitude: number, longitude: number): boolean {
  return Number.isFinite(latitude) && Number.isFinite(longitude);
}

export function getListingDistanceKm(
  listing: Listing,
  coords?: { latitude: number; longitude: number } | null,
): number | null {
  if (listing.distanceKm != null) return listing.distanceKm;
  if (!coords || !hasValidCoordinates(coords.latitude, coords.longitude)) return null;
  const { latitude, longitude } = listing.pharmacy;
  if (latitude == null || longitude == null || !hasValidCoordinates(latitude, longitude)) return null;
  return haversineKm(coords.latitude, coords.longitude, latitude, longitude);
}
