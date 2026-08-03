import type { Pharmacy } from '@/types';

export function resolveActiveShop(
  demoShops: Pharmacy[] | undefined,
  activeShopId: string | null,
  ownPharmacy?: { id: string; name: string; city?: string; verificationStatus?: string } | null,
): Pharmacy | null {
  if (activeShopId) {
    const picked = demoShops?.find((s) => s.id === activeShopId);
    if (picked) return picked;
  }
  if (ownPharmacy) {
    return {
      id: ownPharmacy.id,
      name: ownPharmacy.name,
      city: ownPharmacy.city ?? '',
      verificationStatus: ownPharmacy.verificationStatus ?? 'PENDING',
      rating: 0,
    };
  }
  return null;
}

export function formatPharmacyAddress(profile: {
  address?: string;
  city?: string;
  district?: string;
  postalCode?: string | null;
}): string {
  return [profile.address, profile.city, profile.district, profile.postalCode]
    .filter(Boolean)
    .join(', ');
}
