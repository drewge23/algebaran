/* eslint-disable import/no-named-as-default-member -- i18next's default export intentionally exposes .use()/.changeLanguage() */
import { getLocales } from 'expo-localization';
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

/**
 * English-first, i18n-ready: the UI defaults to English but respects a device
 * set to a language we support (currently Russian). All user-facing chrome is
 * routed through these resource files so adding a language is drop-in.
 */
function initialLanguage(): AppLanguage {
  const device = getLocales()[0]?.languageCode;
  return device && device in resources ? (device as AppLanguage) : 'en';
}

if (!i18n.isInitialized) {
  i18n.use(initReactI18next).init({
    resources,
    lng: initialLanguage(),
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
    returnNull: false,
    compatibilityJSON: 'v4',
  });
}

export function setLanguage(lang: AppLanguage): Promise<unknown> {
  return i18n.changeLanguage(lang);
}

export default i18n;
