import { describe, expect, it } from 'vitest';
import { BannerActionType, VerificationStatus } from '@prisma/client';
import {
  radiusCenterFromVerifiedPharmacy,
  resolveAdminRadiusCenter,
} from '../src/modules/banner/banner-radius-center';

describe('banner-radius-center', () => {
  const pharmacy = {
    id: 'pharmacy-1',
    userId: 'user-1',
    name: 'City Pharmacy',
    licenseNumber: 'LIC-1',
    address: '123 Road',
    city: 'Dhaka',
    district: 'Dhaka',
    postalCode: '1205',
    latitude: 23.7461,
    longitude: 90.3742,
    description: null,
    logoUrl: null,
    rating: 4.5,
    ratingCount: 10,
    verificationStatus: VerificationStatus.APPROVED,
    rejectionReason: null,
    businessHours: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  it('uses verified pharmacy coordinates for seller radius center', () => {
    const center = radiusCenterFromVerifiedPharmacy(pharmacy);
    expect(center.targetLatitude).toBe(23.7461);
    expect(center.targetLongitude).toBe(90.3742);
    expect(center.targetCity).toBe('Dhaka');
  });

  it('preserves existing coordinates when admin action cannot resolve a new center', async () => {
    const center = await resolveAdminRadiusCenter(BannerActionType.NONE, null, {
      targetLatitude: 24.1,
      targetLongitude: 88.25,
      targetCity: 'Berhampore',
      targetState: 'West Bengal',
      targetCountry: 'Bangladesh',
    });
    expect(center.targetLatitude).toBe(24.1);
    expect(center.targetLongitude).toBe(88.25);
  });
});
