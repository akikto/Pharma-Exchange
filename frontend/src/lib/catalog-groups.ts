import type { Listing } from '@/types';

export interface CatalogGroup {
  medicineId: string;
  medicineName: string;
  company: string;
  packSize: string;
  listings: Listing[];
  sellerCount: number;
  bestPrice: number;
  bestListingId: string;
}

export function groupListingsByMedicine(listings: Listing[]): CatalogGroup[] {
  const map = new Map<string, Listing[]>();

  for (const listing of listings) {
    const key = listing.medicine.id;
    const existing = map.get(key) ?? [];
    existing.push(listing);
    map.set(key, existing);
  }

  return Array.from(map.entries()).map(([medicineId, groupListings]) => {
    const sorted = [...groupListings].sort(
      (a, b) => Number(a.finalPrice) - Number(b.finalPrice),
    );
    const best = sorted[0]!;
    return {
      medicineId,
      medicineName: best.medicine.name,
      company: best.medicine.company,
      packSize: best.medicine.packSize,
      listings: sorted,
      sellerCount: new Set(sorted.map((l) => l.pharmacy.id)).size,
      bestPrice: Number(best.finalPrice),
      bestListingId: best.id,
    };
  }).sort((a, b) => a.medicineName.localeCompare(b.medicineName));
}

export function filterListingsByQuery(listings: Listing[], query: string): Listing[] {
  const q = query.trim().toLowerCase();
  if (!q) return listings;
  return listings.filter((l) => {
    const m = l.medicine;
    return (
      m.name.toLowerCase().includes(q)
      || m.company.toLowerCase().includes(q)
      || (m.genericName?.toLowerCase().includes(q) ?? false)
      || (m.brandName?.toLowerCase().includes(q) ?? false)
    );
  });
}

export function filterListingsNearby(listings: Listing[], city?: string): Listing[] {
  if (!city) return listings;
  const normalized = city.toLowerCase();
  return listings.filter((l) => l.pharmacy.city?.toLowerCase() === normalized);
}
