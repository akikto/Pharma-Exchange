import type { AppLocale } from '@/i18n';

/** Bengali uses left-to-right script; keep document LTR for correct punctuation and labels. */
export function getDocumentDirection(_locale: string): 'ltr' | 'rtl' {
  return 'ltr';
}

export function applyDocumentDirection(locale: AppLocale | string): void {
  document.documentElement.dir = getDocumentDirection(locale);
}
