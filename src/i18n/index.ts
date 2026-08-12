import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './locales/en.json';
import ru from './locales/ru.json';

export const resources = {
  en: { translation: en },
  ru: { translation: ru },
} as const;

export type AppLanguage = keyof typeof resources;

export const SUPPORTED_LANGUAGES: AppLanguage[] = ['en', 'ru'];

const STORAGE_KEY = 'algebaran-language';

function isSupported(code: string | undefined | null): code is AppLanguage {
  return !!code && code in resources;
}

/**
 * English-first, i18n-ready: a saved choice wins, otherwise we follow the
 * browser's language when we support it. The choice is persisted here (not only
 * in the player store) so the correct language is available at init time,
 * before React renders.
 */
function initialLanguage(): AppLanguage {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (isSupported(saved)) return saved;
  const browser = navigator.language?.split('-')[0];
  return isSupported(browser) ? browser : 'en';
}

if (!i18n.isInitialized) {
  i18n.use(initReactI18next).init({
    resources,
    lng: initialLanguage(),
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
    returnNull: false,
  });
}

export function setLanguage(lang: AppLanguage): Promise<unknown> {
  localStorage.setItem(STORAGE_KEY, lang);
  document.documentElement.lang = lang;
  return i18n.changeLanguage(lang);
}

document.documentElement.lang = i18n.language;

export default i18n;
