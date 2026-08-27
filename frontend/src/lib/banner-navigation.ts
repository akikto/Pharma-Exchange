import type { BannerActionType } from '@/lib/banner-form';

export function resolveBannerDestination(
  actionType: BannerActionType,
  actionTarget: string | null | undefined,
): string | null {
  const target = actionTarget?.trim() ?? '';
  switch (actionType) {
    case 'NONE':
      return null;
    case 'EXTERNAL_URL':
      return target || null;
    case 'INTERNAL_PATH':
      return target || null;
    case 'MEDICINE':
      return target ? `/medicine/${target}` : null;
    case 'LISTING':
      return target ? `/medicine/${target}` : null;
    case 'PHARMACY':
      return target ? `/pharmacy/${target}` : null;
    case 'CATEGORY':
      return target ? `/search?category=${encodeURIComponent(target)}` : null;
    default:
      return null;
  }
}

export function openBannerDestination(href: string) {
  if (href.startsWith('http://') || href.startsWith('https://')) {
    window.open(href, '_blank', 'noopener,noreferrer');
    return;
  }
  return href;
}
