import { describe, expect, it } from 'vitest';
import { BannerStatus, BannerTargetType, BannerType } from '@prisma/client';
import {
  filterAndRankBanners,
  getBannerDistanceKm,
  isBannerGeographicallyEligible,
  isBannerPubliclyVisible,
} from '../src/modules/banner/banner-targeting';
import { haversineKm } from '../src/shared/utils/geo';

const now = new Date('2026-08-28T12:00:00Z');

function makeBanner(overrides: Record<string, unknown> = {}) {
  return {
    id: 'banner-1',
    title: 'Test',
    subtitle: null,
    mediaUrl: 'https://example.com/a.jpg',
    mediaType: 'IMAGE',
    mediaAlt: null,
    ctaText: null,
    actionType: 'NONE',
    actionTarget: null,
    isActive: true,
    sortOrder: 0,
    bannerType: BannerType.ADMIN,
    advertiserPharmacyId: null,
    status: BannerStatus.ACTIVE,
    targetType: BannerTargetType.WORLDWIDE,
    targetCountry: null,
    targetState: null,
    targetCity: null,
    targetLatitude: null,
    targetLongitude: null,
    radiusKm: null,
    startsAt: null,
    endsAt: null,
    priority: 0,
    rejectionReason: null,
    approvedById: null,
    approvedAt: null,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  } as never;
}

describe('banner-targeting', () => {
  it('shows worldwide banners globally', () => {
    const banner = makeBanner();
    expect(isBannerGeographicallyEligible(banner, {})).toBe(true);
  });

  it('hides country-targeted banners for another country', () => {
    const banner = makeBanner({
      targetType: BannerTargetType.COUNTRY,
      targetCountry: 'India',
    });
    expect(isBannerGeographicallyEligible(banner, { country: 'Bangladesh' })).toBe(false);
    expect(isBannerGeographicallyEligible(banner, { country: 'India' })).toBe(true);
  });

  it('includes radius banners only when user is inside radius', () => {
    const banner = makeBanner({
      targetType: BannerTargetType.RADIUS,
      targetCountry: 'Bangladesh',
      targetState: 'Dhaka',
      targetCity: 'Dhaka',
      targetLatitude: 23.7461,
      targetLongitude: 90.3742,
      radiusKm: 25,
    });
    expect(
      isBannerGeographicallyEligible(banner, { latitude: 23.75, longitude: 90.38 }),
    ).toBe(true);
    expect(
      isBannerGeographicallyEligible(banner, { latitude: 25.5, longitude: 91.0 }),
    ).toBe(false);
  });

  it('includes buyers exactly on the radius boundary', () => {
    const centerLat = 24.1;
    const centerLon = 88.25;
    const radiusKm = 20;
    const banner = makeBanner({
      targetType: BannerTargetType.RADIUS,
      targetLatitude: centerLat,
      targetLongitude: centerLon,
      radiusKm,
    });

    let testLon = centerLon + 0.2;
    for (let i = 0; i < 24; i += 1) {
      const distance = haversineKm(centerLat, centerLon, centerLat, testLon);
      if (distance > radiusKm) {
        testLon -= 0.01;
        break;
      }
      testLon += 0.01;
    }

    const boundaryDistance = getBannerDistanceKm(banner, { latitude: centerLat, longitude: testLon });
    expect(boundaryDistance).not.toBeNull();
    expect(boundaryDistance!).toBeLessThanOrEqual(radiusKm);
    expect(
      isBannerGeographicallyEligible(banner, { latitude: centerLat, longitude: testLon }),
    ).toBe(true);
  });

  it('excludes radius banners when buyer coordinates are missing', () => {
    const banner = makeBanner({
      targetType: BannerTargetType.RADIUS,
      targetLatitude: 24.1,
      targetLongitude: 88.25,
      radiusKm: 25,
    });
    expect(isBannerGeographicallyEligible(banner, {})).toBe(false);
    expect(getBannerDistanceKm(banner, {})).toBeNull();
  });

  it('hides pending and rejected banners from public visibility', () => {
    expect(isBannerPubliclyVisible(makeBanner({ status: BannerStatus.PENDING_APPROVAL }), now)).toBe(false);
    expect(isBannerPubliclyVisible(makeBanner({ status: BannerStatus.REJECTED }), now)).toBe(false);
    expect(isBannerPubliclyVisible(makeBanner({ status: BannerStatus.ACTIVE }), now)).toBe(true);
  });

  it('hides future and expired banners', () => {
    expect(
      isBannerPubliclyVisible(
        makeBanner({ startsAt: new Date('2026-09-01T00:00:00Z') }),
        now,
      ),
    ).toBe(false);
    expect(
      isBannerPubliclyVisible(
        makeBanner({ endsAt: new Date('2026-08-01T00:00:00Z') }),
        now,
      ),
    ).toBe(false);
  });

  it('ranks local radius ads before country and worldwide', () => {
    const local = makeBanner({
      id: 'local',
      targetType: BannerTargetType.RADIUS,
      targetLatitude: 24.1,
      targetLongitude: 88.25,
      radiusKm: 25,
      priority: 1,
    });
    const country = makeBanner({
      id: 'country',
      targetType: BannerTargetType.COUNTRY,
      targetCountry: 'India',
      priority: 100,
    });
    const worldwide = makeBanner({ id: 'world', priority: 200 });

    const ranked = filterAndRankBanners(
      [worldwide, country, local],
      { latitude: 24.12, longitude: 88.27, country: 'India' },
      now,
    );
    expect(ranked.map((b) => b.id)).toEqual(['local', 'country', 'world']);
  });
});
