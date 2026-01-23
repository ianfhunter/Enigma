import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import en from './locales/en.json';
import es from './locales/es.json';

/**
 * i18n configuration for Enigma
 *
 * Supports:
 * - Automatic browser language detection
 * - Configurable default language via VITE_DEFAULT_LANGUAGE env variable
 * - Fallback to English
 * - Integration with React via hooks
 *
 * Usage in components:
 *   import { useTranslation } from 'react-i18next';
 *   const { t } = useTranslation();
 *   <span>{t('common.giveUp')}</span>
 *
 * To add a new language:
 * 1. Create a new JSON file in src/i18n/locales/ (e.g., fr.json)
 * 2. Import it here and add to resources
 * 3. Add the language option to the Profile language selector
 *
 * Docker configuration:
 *   Set VITE_DEFAULT_LANGUAGE=es (or other language code) in your
 *   docker-compose.yml or .env file to change the default language
 *   for new users who haven't set a preference yet.
 */

// Available languages configuration
// Language codes include English variant for word games (e.g., en-US, en-GB)
export const supportedLanguages = [
  { code: 'en-US', name: 'EN (US)', flag: '🇺🇸', i18nCode: 'en', englishVariant: 'us' },
  { code: 'en-GB', name: 'EN (GB)', flag: '🇬🇧', i18nCode: 'en', englishVariant: 'uk' },
  { code: 'es', name: 'ES', flag: '🇪🇸', i18nCode: 'es', englishVariant: 'us' },
  // Add more languages here as translations become available
  // { code: 'fr', name: 'Français', flag: '🇫🇷', i18nCode: 'fr', englishVariant: 'us' },
];

// Helper to get the i18n code from a language setting
export function getI18nCode(languageCode) {
  const lang = supportedLanguages.find(l => l.code === languageCode);
  return lang?.i18nCode || 'en';
}

// Helper to get the English variant from a language setting
export function getEnglishVariant(languageCode) {
  const lang = supportedLanguages.find(l => l.code === languageCode);
  return lang?.englishVariant || 'us';
}

// Get supported language codes for validation
const supportedCodes = supportedLanguages.map(l => l.code);

// Default language from environment variable (Docker/build-time config)
// Falls back to 'en-US' if not set or invalid
const envDefaultLanguage = import.meta.env.VITE_DEFAULT_LANGUAGE;
const defaultLanguage = supportedCodes.includes(envDefaultLanguage) ? envDefaultLanguage : 'en-US';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      es: { translation: es },
      // Add more languages here:
      // fr: { translation: fr },
    },
    // Always fallback to English (US) for missing translations
    fallbackLng: 'en',

    // Detection options - check localStorage first, then browser settings
    // Note: The actual language code (en-US, en-GB, es) is managed by SettingsContext,
    // but the i18n code (en, es) is what i18next uses internally
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'enigma-language',
      caches: ['localStorage'],
    },

    interpolation: {
      escapeValue: false, // React already escapes by default
    },

    // Return key if translation is missing (useful for development)
    returnEmptyString: false,
  });

export default i18n;
