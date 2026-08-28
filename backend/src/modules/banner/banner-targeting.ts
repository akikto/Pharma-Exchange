import { BannerStatus, BannerTargetType, HomeBanner } from '@prisma/client';
import { haversineKm } from '../../shared/utils/geo';

export type BannerUserLocation = {
  latitude?: number | null;
  longitude?: number | null;
  country?: string | null;
  state?: string | null;
  city?: string | null;
};

export type RankedBanner<T extends HomeBanner> = {
  banner: T;
  geoTier: number;
  distanceKm: number | null;
};

const GEO_TIER_RADIUS = 0;
const GEO_TIER_CITY = 1;
const GEO_TIER_REGION = 2;
const GEO_TIER_COUNTRY = 3;
const GEO_TIER_WORLDWIDE = 4;

function normalizeLocationToken(value?: string | null): string {
  return (value ?? '').trim().toLowerCase();
}

function hasValidCoordinates(latitude?: number | null, longitude?: number | null): boolean {
  return latitude != null && longitude != null && Number.isFinite(latitude) && Number.isFinite(longitude);
}

export function resolveBannerPublicStatus(banner: HomeBanner, now = new Date()): BannerStatus {
  if (banner.status === BannerStatus.EXPIRED || banner.status === BannerStatus.REJECTED) {
    return banner.status;
  }
  if (banner.endsAt && banner.endsAt < now) {
    return BannerStatus.EXPIRED;
  }
  if (banner.status === BannerStatus.APPROVED) {
    if (banner.startsAt && banner.startsAt > now) return BannerStatus.APPROVED;
    return BannerStatus.ACTIVE;
  }
  return banner.status;
}

export function isBannerPubliclyVisible(banner: HomeBanner, now = new Date()): boolean {
  const effectiveStatus = resolveBannerPublicStatus(banner, now);
  if (effectiveStatus !== BannerStatus.ACTIVE) return false;
  if (!banner.isActive) return false;
  if (banner.startsAt && banner.startsAt > now) return false;
  if (banner.endsAt && banner.endsAt < now) return false;
  return true;
}

function locationMatches(
  bannerValue: string | null | undefined,
  userValue: string | null | undefined,
): boolean {
  const bannerNorm = normalizeLocationToken(bannerValue);
  const userNorm = normalizeLocationToken(userValue);
  if (!bannerNorm || !userNorm) return false;
  return bannerNorm === userNorm;
}

export function getBannerDistanceKm(banner: HomeBanner, location: BannerUserLocation): number | null {
  if (banner.targetType !== BannerTargetType.RADIUS) return null;
  if (!hasValidCoordinates(location.latitude, location.longitude)) return null;
  if (!hasValidCoordinates(banner.targetLatitude, banner.targetLongitude)) return null;
  return haversineKm(
    location.latitude!,
    location.longitude!,
    banner.targetLatitude!,
    banner.targetLongitude!,
  );
}

export function isBannerGeographicallyEligible(
  banner: HomeBanner,
  location: BannerUserLocation,
): boolean {
  switch (banner.targetType) {
    case BannerTargetType.WORLDWIDE:
      return true;
    case BannerTargetType.COUNTRY:
      return locationMatches(banner.targetCountry, location.country);
    case BannerTargetType.REGION:
      return (
        locationMatches(banner.targetCountry, location.country)
        && locationMatches(banner.targetState, location.state)
      );
    case BannerTargetType.CITY:
      return (
        locationMatches(banner.targetCountry, location.country)
        && locationMatches(banner.targetState, location.state)
        && locationMatches(banner.targetCity, location.city)
      );
    case BannerTargetType.RADIUS: {
      const distanceKm = getBannerDistanceKm(banner, location);
      if (distanceKm == null || banner.radiusKm == null || banner.radiusKm <= 0) return false;
      return distanceKm <= banner.radiusKm;
    }
    default:
      return false;
  }
}

function getGeoTier(banner: HomeBanner): number {
  switch (banner.targetType) {
    case BannerTargetType.RADIUS:
      return GEO_TIER_RADIUS;
    case BannerTargetType.CITY:
      return GEO_TIER_CITY;
    case BannerTargetType.REGION:
      return GEO_TIER_REGION;
    case BannerTargetType.COUNTRY:
      return GEO_TIER_COUNTRY;
    case BannerTargetType.WORLDWIDE:
    default:
      return GEO_TIER_WORLDWIDE;
  }
}

export function filterAndRankBanners<T extends HomeBanner>(
  banners: T[],
  location: BannerUserLocation,
  now = new Date(),
): T[] {
  const ranked: RankedBanner<T>[] = [];

  for (const banner of banners) {
    if (!isBannerPubliclyVisible(banner, now)) continue;
    if (!isBannerGeographicallyEligible(banner, location)) continue;

    ranked.push({
      banner,
      geoTier: getGeoTier(banner),
      distanceKm: getBannerDistanceKm(banner, location),
    });
  }

  return ranked
    .sort((a, b) => {
      if (a.geoTier !== b.geoTier) return a.geoTier - b.geoTier;

      const aDistance = a.distanceKm ?? Number.POSITIVE_INFINITY;
      const bDistance = b.distanceKm ?? Number.POSITIVE_INFINITY;
      if (aDistance !== bDistance) return aDistance - bDistance;

      const priorityDiff = (b.banner.priority || 0) - (a.banner.priority || 0);
      if (priorityDiff !== 0) return priorityDiff;

      if (a.banner.sortOrder !== b.banner.sortOrder) return a.banner.sortOrder - b.banner.sortOrder;
      return a.banner.createdAt.getTime() - b.banner.createdAt.getTime();
    })
    .map((item) => item.banner);
}

export function buildLocationFallbackChain(location: BannerUserLocation): BannerUserLocation[] {
  const chain: BannerUserLocation[] = [];
  const hasCoords = hasValidCoordinates(location.latitude, location.longitude);
  const hasCity = Boolean(normalizeLocationToken(location.city));
  const hasState = Boolean(normalizeLocationToken(location.state));
  const hasCountry = Boolean(normalizeLocationToken(location.country));

  if (hasCoords || hasCity || hasState || hasCountry) {
    chain.push(location);
  }
  if (hasCountry && (hasCoords || hasCity || hasState)) {
    chain.push({
      country: location.country,
      state: null,
      city: null,
      latitude: null,
      longitude: null,
    });
  }
  chain.push({
    country: null,
    state: null,
    city: null,
    latitude: null,
    longitude: null,
  });
  return chain;
}

export function filterAndRankBannersWithFallback<T extends HomeBanner>(
  banners: T[],
  location: BannerUserLocation,
  now = new Date(),
): T[] {
  const chain = buildLocationFallbackChain(location);
  const seen = new Set<string>();
  const result: T[] = [];

  for (const loc of chain) {
    const eligible = filterAndRankBanners(banners, loc, now);
    for (const banner of eligible) {
      if (seen.has(banner.id)) continue;
      seen.add(banner.id);
      result.push(banner);
    }
  }

  return result;
}
