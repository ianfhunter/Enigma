import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { users } from '../api/client';

const SettingsContext = createContext(null);

const defaultSettings = {
  englishVariant: 'us',
  theme: 'dark',
  soundEnabled: true,
  disabledGames: [],
  gamePreferences: {},
};

export function SettingsProvider({ children }) {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [settings, setSettings] = useState(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch settings from API when authenticated
  useEffect(() => {
    if (authLoading) return;

    if (!isAuthenticated) {
      setSettings(defaultSettings);
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
    setSettings(prev => ({ ...prev, [key]: value }));

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
    setSettings(prev => ({ ...prev, ...updates }));

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
