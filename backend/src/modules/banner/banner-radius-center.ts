import { BannerActionType, Pharmacy, VerificationStatus } from '@prisma/client';
import prisma from '../../config/database';
import { AppError } from '../../shared/errors/AppError';

const DEFAULT_TARGET_COUNTRY = 'Bangladesh';

export type RadiusCenter = {
  targetLatitude: number;
  targetLongitude: number;
  targetCity: string | null;
  targetState: string | null;
  targetCountry: string | null;
};

function radiusCenterFromPharmacyCoords(pharmacy: Pick<Pharmacy, 'latitude' | 'longitude' | 'city' | 'district'>): RadiusCenter {
  if (pharmacy.latitude == null || pharmacy.longitude == null) {
    throw AppError.badRequest('Pharmacy location coordinates are required for radius targeting');
  }
  return {
    targetLatitude: pharmacy.latitude,
    targetLongitude: pharmacy.longitude,
    targetCity: pharmacy.city,
    targetState: pharmacy.district,
    targetCountry: DEFAULT_TARGET_COUNTRY,
  };
}

export function radiusCenterFromVerifiedPharmacy(pharmacy: Pharmacy): RadiusCenter {
  if (pharmacy.verificationStatus !== VerificationStatus.APPROVED) {
    throw AppError.badRequest('Verified pharmacy location is required for radius targeting');
  }
  return radiusCenterFromPharmacyCoords(pharmacy);
}

export async function resolveAdminRadiusCenter(
  actionType: BannerActionType,
  actionTarget: string | null | undefined,
  existing?: Partial<RadiusCenter> | null,
): Promise<RadiusCenter> {
  const target = actionTarget?.trim();
  if (actionType === BannerActionType.PHARMACY && target) {
    const pharmacy = await prisma.pharmacy.findUnique({ where: { id: target } });
    if (!pharmacy) throw AppError.badRequest('Pharmacy not found for radius center');
    return radiusCenterFromPharmacyCoords(pharmacy);
  }
  if (actionType === BannerActionType.LISTING && target) {
    const listing = await prisma.listing.findUnique({
      where: { id: target },
      include: { pharmacy: true },
    });
    if (!listing?.pharmacy) throw AppError.badRequest('Listing not found for radius center');
    return radiusCenterFromPharmacyCoords(listing.pharmacy);
  }
  if (
    existing?.targetLatitude != null
    && existing?.targetLongitude != null
    && Number.isFinite(existing.targetLatitude)
    && Number.isFinite(existing.targetLongitude)
  ) {
    return {
      targetLatitude: existing.targetLatitude,
      targetLongitude: existing.targetLongitude,
      targetCity: existing.targetCity ?? null,
      targetState: existing.targetState ?? null,
      targetCountry: existing.targetCountry ?? null,
    };
  }
  throw AppError.badRequest('Select a shop or shop item to set the radius center');
}
