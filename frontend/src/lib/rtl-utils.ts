import type { AppLocale } from '@/i18n';

export function getDocumentDirection(locale: string): 'ltr' | 'rtl' {
  return locale.startsWith('bn') ? 'rtl' : 'ltr';
}

export function applyDocumentDirection(locale: AppLocale | string): void {
  document.documentElement.dir = getDocumentDirection(locale);
}
