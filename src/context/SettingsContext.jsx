import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { users } from '../api/client';

const SettingsContext = createContext(null);

const STORAGE_KEY = 'enigma-settings';

const defaultSettings = {
  englishVariant: 'us',
  theme: 'dark',
  soundEnabled: true,
  disabledGames: [],
  favouriteGames: [],
  gamePreferences: {},
  searchEngine: 'google',
  language: 'en', // Interface language
};

// Load settings from localStorage
function loadLocalSettings() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return { ...defaultSettings, ...parsed };
    }
  } catch (e) {
    console.error('Failed to load settings from localStorage:', e);
  }
  return defaultSettings;
}

// Save settings to localStorage
function saveLocalSettings(settings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save settings to localStorage:', e);
  }
}

export function SettingsProvider({ children }) {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [settings, setSettings] = useState(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch settings from API when authenticated, or load from localStorage
  useEffect(() => {
    if (authLoading) return;

    if (!isAuthenticated) {
      // Load from localStorage for unauthenticated users
      setSettings(loadLocalSettings());
      setLoading(false);
      return;
    }

    let mounted = true;

    async function fetchSettings() {
      try {
        const data = await users.getSettings();
        if (mounted) {
          setSettings(data);
          setError(null);
        }
      } catch (err) {
        console.error('Failed to fetch settings:', err);
        if (mounted) {
          setError(err.message);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    fetchSettings();

    return () => {
      mounted = false;
    };
  }, [isAuthenticated, authLoading]);

  // Apply theme to document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', settings.theme || 'dark');
  }, [settings.theme]);

  // Update a single setting
  const updateSetting = useCallback(async (key, value) => {
    // Optimistically update local state
    setSettings(prev => {
      const newSettings = { ...prev, [key]: value };
      // Save to localStorage for unauthenticated users
      if (!isAuthenticated) {
        saveLocalSettings(newSettings);
      }
      return newSettings;
    });

    // Persist to server if authenticated
    if (isAuthenticated) {
      try {
        await users.updateSettings({ [key]: value });
      } catch (err) {
        console.error('Failed to save setting:', err);
        // Optionally revert on error
      }
    }
  }, [isAuthenticated]);

  // Update multiple settings at once
  const updateSettings = useCallback(async (updates) => {
    // Optimistically update local state
    setSettings(prev => {
      const newSettings = { ...prev, ...updates };
      // Save to localStorage for unauthenticated users
      if (!isAuthenticated) {
        saveLocalSettings(newSettings);
      }
      return newSettings;
    });

    // Persist to server if authenticated
    if (isAuthenticated) {
      try {
        await users.updateSettings(updates);
      } catch (err) {
        console.error('Failed to save settings:', err);
      }
    }
  }, [isAuthenticated]);

  // Refresh settings from server
  const refreshSettings = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      const data = await users.getSettings();
      setSettings(data);
    } catch (err) {
      console.error('Failed to refresh settings:', err);
    }
  }, [isAuthenticated]);

  return (
    <SettingsContext.Provider value={{
      settings,
      loading,
      error,
      updateSetting,
      updateSettings,
      refreshSettings
    }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}

// Convenience hook for theme
export function useTheme() {
  const { settings, updateSetting } = useSettings();
  return {
    theme: settings.theme || 'dark',
    setTheme: (theme) => updateSetting('theme', theme),
    isDark: settings.theme !== 'light',
  };
}

// Convenience hook for sound
export function useSoundEnabled() {
  const { settings, updateSetting } = useSettings();
  return {
    soundEnabled: settings.soundEnabled ?? true,
    setSoundEnabled: (enabled) => updateSetting('soundEnabled', enabled),
  };
}

// Convenience hook for just getting the English variant
export function useEnglishVariant() {
  const { settings } = useSettings();
  return settings.englishVariant || 'us';
}

// Convenience hook for language setting
export function useLanguage() {
  const { settings, updateSetting } = useSettings();
  return {
    language: settings.language || 'en',
    setLanguage: (lang) => updateSetting('language', lang),
  };
}

// Convenience hook for favourites
export function useFavourites() {
  const { settings, updateSetting } = useSettings();
  const favourites = settings.favouriteGames || [];

  const isFavourite = (slug) => favourites.includes(slug);

  const addFavourite = (slug) => {
    if (!isFavourite(slug)) {
      updateSetting('favouriteGames', [...favourites, slug]);
    }
  };

  const removeFavourite = (slug) => {
    updateSetting('favouriteGames', favourites.filter(s => s !== slug));
  };

  const toggleFavourite = (slug) => {
    if (isFavourite(slug)) {
      removeFavourite(slug);
    } else {
      addFavourite(slug);
    }
  };

  return {
    favourites,
    isFavourite,
    addFavourite,
    removeFavourite,
    toggleFavourite,
  };
}
