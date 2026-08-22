export type BannerMediaType = 'IMAGE' | 'VIDEO';

export type BannerActionType =
  | 'NONE'
  | 'EXTERNAL_URL'
  | 'INTERNAL_PATH'
  | 'MEDICINE'
  | 'PHARMACY'
  | 'CATEGORY';

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
};

export type AdminHomeBanner = HomeBanner & {
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
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
};

export const INTERNAL_BANNER_PATHS = [
  { value: '/', labelKey: 'admin.banners.internalPaths.home' },
  { value: '/search', labelKey: 'admin.banners.internalPaths.search' },
  { value: '/watchlist', labelKey: 'admin.banners.internalPaths.watchlist' },
  { value: '/cart', labelKey: 'admin.banners.internalPaths.cart' },
  { value: '/notifications', labelKey: 'admin.banners.internalPaths.notifications' },
  { value: '/profile', labelKey: 'admin.banners.internalPaths.profile' },
  { value: '/settings', labelKey: 'admin.banners.internalPaths.settings' },
] as const;

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
  };
}

export function formToUpdatePayload(values: BannerFormValues) {
  return formToCreatePayload(values);
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
    (values.actionType === 'MEDICINE' || values.actionType === 'PHARMACY' || values.actionType === 'CATEGORY') &&
    !values.actionTarget.trim()
  ) {
    errors.actionTarget = t('admin.banners.validation.targetRequired');
  }
  return errors;
}
