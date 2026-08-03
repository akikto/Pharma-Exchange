import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import bn from './locales/bn.json';
import en from './locales/en.json';

export const LOCALE_STORAGE_KEY = 'pharmex-locale';
export const SUPPORTED_LOCALES = ['bn', 'en'] as const;
export type AppLocale = (typeof SUPPORTED_LOCALES)[number];

const languageDetector = new LanguageDetector();
languageDetector.addDetector({
  name: 'pharmexStorage',
  lookup() {
    try {
      const stored = localStorage.getItem(LOCALE_STORAGE_KEY);
      if (stored === 'bn' || stored === 'en') return stored;
    } catch {
      /* ignore */
    }
    return undefined;
  },
  cacheUserLanguage(lng: string) {
    try {
      localStorage.setItem(LOCALE_STORAGE_KEY, lng);
    } catch {
      /* ignore */
    }
  },
});

void i18n
  .use(languageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      bn: { translation: bn },
      en: { translation: en },
    },
    fallbackLng: 'en',
    lng: 'bn',
    defaultNS: 'translation',
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['pharmexStorage', 'navigator'],
      caches: ['pharmexStorage'],
    },
    pluralSeparator: '_',
    returnEmptyString: false,
  });

i18n.on('languageChanged', (lng) => {
  document.documentElement.lang = lng === 'bn' ? 'bn' : 'en';
});

document.documentElement.lang = i18n.language === 'bn' ? 'bn' : 'en';

export default i18n;
