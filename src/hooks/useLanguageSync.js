import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSettings } from '../context/SettingsContext';

// localStorage key used by i18n-browser-languagedetector
const LANGUAGE_STORAGE_KEY = 'enigma-language';

/**
 * Hook that syncs the user's language preference with i18n
 * Should be used once at the app level (e.g., in Layout)
 *
 * Also saves to localStorage so i18n can pick it up on next page load
 * before the settings context initializes.
 */
export function useLanguageSync() {
  const { i18n } = useTranslation();
  const { settings } = useSettings();

  useEffect(() => {
    const userLanguage = settings?.language;
    if (userLanguage && i18n.language !== userLanguage) {
      i18n.changeLanguage(userLanguage);
      // Also save to localStorage for faster loading on next visit
      try {
        localStorage.setItem(LANGUAGE_STORAGE_KEY, userLanguage);
      } catch {
        // localStorage might be unavailable (e.g., private browsing)
      }
    }
  }, [settings?.language, i18n]);
}

export default useLanguageSync;
