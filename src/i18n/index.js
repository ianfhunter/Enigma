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
export const supportedLanguages = [
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'es', name: 'Español (Alpha)', flag: '🇪🇸' },
  // Add more languages here as translations become available
  // { code: 'fr', name: 'Français', flag: '🇫🇷' },
  // { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  // { code: 'ja', name: '日本語', flag: '🇯🇵' },
];

// Get supported language codes for validation
const supportedCodes = supportedLanguages.map(l => l.code);

// Default language from environment variable (Docker/build-time config)
// Falls back to 'en' if not set or invalid
const envDefaultLanguage = import.meta.env.VITE_DEFAULT_LANGUAGE;
const defaultLanguage = supportedCodes.includes(envDefaultLanguage) ? envDefaultLanguage : 'en';

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
    fallbackLng: defaultLanguage,

    // Detection options - check localStorage first, then browser settings
    // If nothing is set, fallbackLng (configured above) will be used
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
