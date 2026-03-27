import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import tr from './locales/tr.json';
import en from './locales/en.json';

const LANG_STORAGE_KEY = 'payonar_language';

function detectLanguage(): string {
  // 1. User's explicit choice (persisted)
  const stored = localStorage.getItem(LANG_STORAGE_KEY);
  if (stored && ['tr', 'en'].includes(stored)) return stored;

  // 2. Browser language
  const browserLang = navigator.language?.split('-')[0];
  if (browserLang === 'tr') return 'tr';

  // 3. Default: English for global markets
  return 'en';
}

i18n
  .use(initReactI18next)
  .init({
    resources: {
      tr: { translation: tr },
      en: { translation: en },
    },
    lng: detectLanguage(),
    fallbackLng: 'en',
    initImmediate: false, // synchronous init — ensures t() is ready before first render
    react: {
      useSuspense: false, // prevents Suspense boundary issues during init
    },
    interpolation: {
      escapeValue: false,
    },
  });

export function setLanguage(lang: string) {
  if (!['tr', 'en'].includes(lang)) return;
  localStorage.setItem(LANG_STORAGE_KEY, lang);
  void i18n.changeLanguage(lang);
  // Update document direction for RTL support
  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  document.documentElement.lang = lang;
}

export function getCurrentLanguage(): string {
  return i18n.language;
}

export const SUPPORTED_LANGUAGES = [
  { code: 'tr', label: 'Türkçe', flag: '🇹🇷' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
];

export default i18n;
