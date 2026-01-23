import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSettings } from '../context/SettingsContext';
import { getI18nCode } from '../i18n';

// localStorage key used by i18n-browser-languagedetector
const LANGUAGE_STORAGE_KEY = 'enigma-language';

/**
 * Hook that syncs the user's language preference with i18n
 * Should be used once at the app level (e.g., in Layout)
 *
 * Converts the full language code (e.g., 'en-US', 'en-GB', 'es') to
 * the i18n code (e.g., 'en', 'es') for translation lookups.
 *
 * Also saves to localStorage so i18n can pick it up on next page load
 * before the settings context initializes.
 */
export function useLanguageSync() {
  const { i18n } = useTranslation();
  const { settings } = useSettings();

  useEffect(() => {
    const userLanguage = settings?.language;
    if (userLanguage) {
      // Convert full language code to i18n code (e.g., 'en-US' -> 'en')
      const i18nCode = getI18nCode(userLanguage);
      if (i18n.language !== i18nCode) {
        i18n.changeLanguage(i18nCode);
        // Also save to localStorage for faster loading on next visit
        try {
          localStorage.setItem(LANGUAGE_STORAGE_KEY, i18nCode);
        } catch {
          // localStorage might be unavailable (e.g., private browsing)
        }
      }
    }
  }, [settings?.language, i18n]);
}

export default useLanguageSync;
