import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import { applyDocumentDirection } from '@/lib/rtl-utils';

/** @deprecated Bengali locale retained on disk only; app UI is English-only. */
export const LOCALE_STORAGE_KEY = 'pharmex-locale';
export const SUPPORTED_LOCALES = ['en'] as const;
export type AppLocale = (typeof SUPPORTED_LOCALES)[number];

const EN_ONLY: AppLocale = 'en';

void i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
  },
  lng: EN_ONLY,
  fallbackLng: EN_ONLY,
  supportedLngs: [EN_ONLY],
  nonExplicitSupportedLngs: false,
  defaultNS: 'translation',
  interpolation: {
    escapeValue: false,
  },
  pluralSeparator: '_',
  /** Empty *Sub keys must resolve to '' so nav subtitles stay hidden (English-only). */
  returnEmptyString: true,
});

try {
  localStorage.setItem(LOCALE_STORAGE_KEY, EN_ONLY);
} catch {
  /* ignore */
}

i18n.on('languageChanged', (lng) => {
  document.documentElement.lang = 'en';
  applyDocumentDirection(lng);
});

document.documentElement.lang = 'en';
applyDocumentDirection(EN_ONLY);

export default i18n;
