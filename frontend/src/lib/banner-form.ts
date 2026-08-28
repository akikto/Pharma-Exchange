export type BannerMediaType = 'IMAGE' | 'VIDEO';

export type BannerActionType =
  | 'NONE'
  | 'EXTERNAL_URL'
  | 'INTERNAL_PATH'
  | 'MEDICINE'
  | 'PHARMACY'
  | 'CATEGORY'
  | 'LISTING';

export type BannerType = 'ADMIN' | 'SELLER_AD';

export type BannerStatus =
  | 'DRAFT'
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'REJECTED'
  | 'ACTIVE'
  | 'PAUSED'
  | 'EXPIRED';

export type BannerTargetType = 'WORLDWIDE' | 'COUNTRY' | 'REGION' | 'CITY' | 'RADIUS';

export type HomeBanner = {
  id: string;
  title: string;
  subtitle: string | null;
  mediaUrl: string;
  mediaType: BannerMediaType;
  mediaAlt: string | null;
  ctaText: string | null;
  actionType: BannerActionType;
  actionTarget: string | null;
  bannerType?: BannerType;
  isSponsored?: boolean;
};

export type AdminHomeBanner = HomeBanner & {
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  bannerType: BannerType;
  status: BannerStatus;
  targetType: BannerTargetType;
  targetCountry: string | null;
  targetState: string | null;
  targetCity: string | null;
  targetLatitude: number | null;
  targetLongitude: number | null;
  radiusKm: number | null;
  startsAt: string | null;
  endsAt: string | null;
  priority: number;
  rejectionReason: string | null;
  advertiserPharmacyId: string | null;
  advertiserPharmacy?: {
    id: string;
    name: string;
    city: string;
    district: string;
    verificationStatus: string;
  } | null;
};

export type BannerFormValues = {
  title: string;
  subtitle: string;
  mediaUrl: string;
  mediaType: BannerMediaType;
  mediaAlt: string;
  ctaText: string;
  actionType: BannerActionType;
  actionTarget: string;
  isActive: boolean;
  sortOrder: string;
  bannerType: BannerType;
  targetType: BannerTargetType;
  targetCountry: string;
  targetState: string;
  targetCity: string;
  targetLatitude: string;
  targetLongitude: string;
  radiusKm: string;
  startsAt: string;
  endsAt: string;
  priority: string;
};

export type BannerFormErrors = Partial<Record<keyof BannerFormValues, string>>;

export const EMPTY_BANNER_FORM: BannerFormValues = {
  title: '',
  subtitle: '',
  mediaUrl: '',
  mediaType: 'IMAGE',
  mediaAlt: '',
  ctaText: '',
  actionType: 'NONE',
  actionTarget: '',
  isActive: true,
  sortOrder: '0',
  bannerType: 'ADMIN',
  targetType: 'WORLDWIDE',
  targetCountry: '',
  targetState: '',
  targetCity: '',
  targetLatitude: '',
  targetLongitude: '',
  radiusKm: '',
  startsAt: '',
  endsAt: '',
  priority: '0',
};

export const RADIUS_PRESETS_KM = [5, 10, 25, 50, 100] as const;

export const INTERNAL_BANNER_PATHS = [
  { value: '/', labelKey: 'admin.banners.internalPaths.home' },
  { value: '/search', labelKey: 'admin.banners.internalPaths.search' },
  { value: '/watchlist', labelKey: 'admin.banners.internalPaths.watchlist' },
  { value: '/cart', labelKey: 'admin.banners.internalPaths.cart' },
  { value: '/notifications', labelKey: 'admin.banners.internalPaths.notifications' },
  { value: '/profile', labelKey: 'admin.banners.internalPaths.profile' },
  { value: '/settings', labelKey: 'admin.banners.internalPaths.settings' },
] as const;

function toIsoOrUndefined(value: string): string | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const date = new Date(trimmed);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

function toNumberOrUndefined(value: string): number | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function bannerToForm(banner: AdminHomeBanner): BannerFormValues {
  return {
    title: banner.title,
    subtitle: banner.subtitle ?? '',
    mediaUrl: banner.mediaUrl,
    mediaType: banner.mediaType,
    mediaAlt: banner.mediaAlt ?? '',
    ctaText: banner.ctaText ?? '',
    actionType: banner.actionType,
    actionTarget: banner.actionTarget ?? '',
    isActive: banner.isActive,
    sortOrder: String(banner.sortOrder),
    bannerType: banner.bannerType ?? 'ADMIN',
    targetType: banner.targetType ?? 'WORLDWIDE',
    targetCountry: banner.targetCountry ?? '',
    targetState: banner.targetState ?? '',
    targetCity: banner.targetCity ?? '',
    targetLatitude: banner.targetLatitude != null ? String(banner.targetLatitude) : '',
    targetLongitude: banner.targetLongitude != null ? String(banner.targetLongitude) : '',
    radiusKm: banner.radiusKm != null ? String(banner.radiusKm) : '',
    startsAt: banner.startsAt ? banner.startsAt.slice(0, 16) : '',
    endsAt: banner.endsAt ? banner.endsAt.slice(0, 16) : '',
    priority: String(banner.priority ?? banner.sortOrder ?? 0),
  };
}

function optionalField(value: string): string | undefined {
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

export function formToCreatePayload(values: BannerFormValues) {
  return {
    title: values.title.trim(),
    subtitle: optionalField(values.subtitle),
    mediaUrl: values.mediaUrl.trim(),
    mediaType: values.mediaType,
    mediaAlt: optionalField(values.mediaAlt),
    ctaText: optionalField(values.ctaText),
    actionType: values.actionType,
    actionTarget: values.actionType === 'NONE' ? undefined : values.actionTarget.trim(),
    isActive: values.isActive,
    sortOrder: Number.parseInt(values.sortOrder, 10) || 0,
    bannerType: values.bannerType,
    targetType: values.targetType,
    targetCountry: optionalField(values.targetCountry),
    targetState: optionalField(values.targetState),
    targetCity: optionalField(values.targetCity),
    targetLatitude: toNumberOrUndefined(values.targetLatitude),
    targetLongitude: toNumberOrUndefined(values.targetLongitude),
    radiusKm: toNumberOrUndefined(values.radiusKm),
    startsAt: toIsoOrUndefined(values.startsAt),
    endsAt: toIsoOrUndefined(values.endsAt),
    priority: Number.parseInt(values.priority, 10) || 0,
  };
}

export function formToUpdatePayload(values: BannerFormValues) {
  return formToCreatePayload(values);
}

export function formToSellerAdvertisementPayload(values: BannerFormValues) {
  const payload = formToCreatePayload(values);
  return {
    title: payload.title,
    subtitle: payload.subtitle,
    mediaUrl: payload.mediaUrl,
    mediaType: payload.mediaType,
    mediaAlt: payload.mediaAlt,
    ctaText: payload.ctaText,
    actionType: payload.actionType,
    actionTarget: payload.actionTarget,
    targetType: payload.targetType,
    targetCountry: payload.targetCountry,
    targetState: payload.targetState,
    targetCity: payload.targetCity,
    targetLatitude: payload.targetLatitude,
    targetLongitude: payload.targetLongitude,
    radiusKm: payload.radiusKm,
    startsAt: payload.startsAt,
    endsAt: payload.endsAt,
    priority: payload.priority,
  };
}

import type { TFunction } from 'i18next';
import { isValidBannerMediaHttpUrl } from '@/lib/banner-media-url';

export function validateBannerForm(
  values: BannerFormValues,
  t: TFunction,
): BannerFormErrors {
  const errors: BannerFormErrors = {};
  if (!values.title.trim()) errors.title = t('admin.banners.validation.titleRequired');
  if (!values.mediaUrl.trim()) errors.mediaUrl = t('admin.banners.validation.mediaRequired');
  else if (!isValidBannerMediaHttpUrl(values.mediaUrl)) {
    errors.mediaUrl = t('admin.banners.validation.invalidMediaUrl');
  }
  if (values.actionType === 'EXTERNAL_URL') {
    try {
      const url = new URL(values.actionTarget.trim());
      if (url.protocol !== 'http:' && url.protocol !== 'https:') {
        errors.actionTarget = t('admin.banners.validation.invalidUrl');
      }
    } catch {
      errors.actionTarget = t('admin.banners.validation.invalidUrl');
    }
  }
  if (values.actionType === 'INTERNAL_PATH' && !INTERNAL_BANNER_PATHS.some((p) => p.value === values.actionTarget)) {
    errors.actionTarget = t('admin.banners.validation.internalPathRequired');
  }
  if (
    (values.actionType === 'MEDICINE'
      || values.actionType === 'PHARMACY'
      || values.actionType === 'CATEGORY'
      || values.actionType === 'LISTING') &&
    !values.actionTarget.trim()
  ) {
    errors.actionTarget = t('admin.banners.validation.targetRequired');
  }

  if (values.startsAt && values.endsAt) {
    const start = new Date(values.startsAt).getTime();
    const end = new Date(values.endsAt).getTime();
    if (!Number.isNaN(start) && !Number.isNaN(end) && start >= end) {
      errors.endsAt = t('admin.banners.validation.endAfterStart');
    }
  }

  if (values.targetType === 'COUNTRY' && !values.targetCountry.trim()) {
    errors.targetCountry = t('admin.banners.validation.countryRequired');
  }
  if (values.targetType === 'REGION') {
    if (!values.targetCountry.trim()) errors.targetCountry = t('admin.banners.validation.countryRequired');
    if (!values.targetState.trim()) errors.targetState = t('admin.banners.validation.stateRequired');
  }
  if (values.targetType === 'CITY') {
    if (!values.targetCountry.trim()) errors.targetCountry = t('admin.banners.validation.countryRequired');
    if (!values.targetState.trim()) errors.targetState = t('admin.banners.validation.stateRequired');
    if (!values.targetCity.trim()) errors.targetCity = t('admin.banners.validation.cityRequired');
  }
  if (values.targetType === 'RADIUS') {
    if (!values.targetCountry.trim()) errors.targetCountry = t('admin.banners.validation.countryRequired');
    if (!values.targetState.trim()) errors.targetState = t('admin.banners.validation.stateRequired');
    if (!values.targetCity.trim()) errors.targetCity = t('admin.banners.validation.cityRequired');
    if (!values.targetLatitude.trim() || !values.targetLongitude.trim()) {
      errors.targetLatitude = t('admin.banners.validation.coordinatesRequired');
    }
    const radius = Number(values.radiusKm);
    if (!values.radiusKm.trim() || !Number.isFinite(radius) || radius <= 0) {
      errors.radiusKm = t('admin.banners.validation.radiusRequired');
    }
  }

  return errors;
}

export function formatBannerTargetSummary(banner: AdminHomeBanner, t: TFunction): string {
  switch (banner.targetType) {
    case 'WORLDWIDE':
      return t('admin.banners.targetTypes.worldwide');
    case 'COUNTRY':
      return banner.targetCountry ?? t('admin.banners.targetTypes.country');
    case 'REGION':
      return [banner.targetState, banner.targetCountry].filter(Boolean).join(', ')
        || t('admin.banners.targetTypes.region');
    case 'CITY':
      return [banner.targetCity, banner.targetState, banner.targetCountry].filter(Boolean).join(', ')
        || t('admin.banners.targetTypes.city');
    case 'RADIUS':
      return t('admin.banners.targetRadiusSummary', {
        city: banner.targetCity ?? '',
        radius: banner.radiusKm ?? 0,
      });
    default:
      return '';
  }
}
