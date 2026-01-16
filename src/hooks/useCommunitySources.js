import { useState, useEffect, useCallback } from 'react';
import { communitySources as api } from '../api/client';

/**
 * Hook for managing community pack sources (GitHub repositories)
 *
 * Provides:
 * - List of configured community sources
 * - Add/remove sources
 * - Install/uninstall/update packs
 * - Check for updates
 */
export function useCommunitySources() {
  const [sources, setSources] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [gitAvailable, setGitAvailable] = useState(null);

  /**
   * Fetch all community sources from backend
   */
  const fetchSources = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await api.getAll();
      setSources(response.sources || []);
    } catch (err) {
      console.error('Failed to fetch community sources:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Check if git is available on the server
   */
  const checkGitStatus = useCallback(async () => {
    try {
      const response = await api.checkGitStatus();
      setGitAvailable(response.gitAvailable);
      return response.gitAvailable;
    } catch (err) {
      console.error('Failed to check git status:', err);
      setGitAvailable(false);
      return false;
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchSources();
    checkGitStatus();
  }, [fetchSources, checkGitStatus]);

  /**
   * Add a new community source (GitHub repository URL)
   */
  const addSource = useCallback(async (url) => {
    setError(null);

    try {
      const response = await api.add(url);

      if (response.success) {
        // Refresh sources list
        await fetchSources();
        return { success: true, source: response.source };
      }

      return { success: false, error: response.error };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    }
  }, [fetchSources]);

  /**
   * Remove a community source
   */
  const removeSource = useCallback(async (sourceId) => {
    setError(null);

    try {
      const response = await api.remove(sourceId);

      if (response.success) {
        // Update local state immediately
        setSources(prev => prev.filter(s => s.id !== sourceId));
        return { success: true };
      }

      return { success: false, error: response.error };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    }
  }, []);

  /**
   * Install a pack from a community source
   */
  const installPack = useCallback(async (sourceId, version = null) => {
    setError(null);

    try {
      const response = await api.install(sourceId, version);

      if (response.success) {
        // Refresh to update install status
        await fetchSources();
        return { success: true, version: response.version };
      }

      return { success: false, error: response.error };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    }
  }, [fetchSources]);

  /**
   * Uninstall a pack from a community source
   */
  const uninstallPack = useCallback(async (sourceId, deleteData = true) => {
    setError(null);

    try {
      const response = await api.uninstall(sourceId, deleteData);

      if (response.success) {
        // Refresh to update install status
        await fetchSources();
        return { success: true };
      }

      return { success: false, error: response.error };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    }
  }, [fetchSources]);

  /**
   * Update an installed pack to a newer version
   */
  const updatePack = useCallback(async (sourceId, version = null) => {
    setError(null);

    try {
      const response = await api.update(sourceId, version);

      if (response.success) {
        // Refresh to update version info
        await fetchSources();
        return { success: true, newVersion: response.newVersion };
      }

      return { success: false, error: response.error };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    }
  }, [fetchSources]);

  /**
   * Check a single source for updates
   */
  const checkSourceUpdate = useCallback(async (sourceId) => {
    try {
      const response = await api.checkUpdate(sourceId);

      // Update local state with new info
      setSources(prev => prev.map(s => {
        if (s.id === sourceId) {
          return {
            ...s,
            latest_version: response.latestVersion,
            available_version: response.updateAvailable ? response.latestVersion : null,
          };
        }
        return s;
      }));

      return {
        success: true,
        updateAvailable: response.updateAvailable,
        latestVersion: response.latestVersion,
      };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }, []);

  /**
   * Check all sources for updates
   */
  const checkAllUpdates = useCallback(async () => {
    setError(null);

    try {
      const response = await api.checkAllUpdates();

      // Refresh to get updated version info
      await fetchSources();

      return {
        success: true,
        updatesAvailable: response.updatesAvailable,
        results: response.results,
      };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    }
  }, [fetchSources]);

  /**
   * Get available versions for a source
   */
  const getVersions = useCallback(async (sourceId) => {
    try {
      const response = await api.getVersions(sourceId);
      return { success: true, versions: response.versions };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }, []);

  /**
   * Refresh manifest metadata for a source
   */
  const refreshManifest = useCallback(async (sourceId) => {
    try {
      const response = await api.refreshManifest(sourceId);

      if (response.success) {
        // Update local state
        setSources(prev => prev.map(s =>
          s.id === sourceId ? response.source : s
        ));
        return { success: true };
      }

      return { success: false, error: response.error };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }, []);

  // Computed values
  const installedSources = sources.filter(s => s.is_installed);
  const availableUpdates = sources.filter(s => s.available_version);
  const hasUpdates = availableUpdates.length > 0;

  return {
    // State
    sources,
    isLoading,
    error,
    gitAvailable,

    // Computed
    installedSources,
    availableUpdates,
    hasUpdates,

    // Actions
    fetchSources,
    addSource,
    removeSource,
    installPack,
    uninstallPack,
    updatePack,
    checkSourceUpdate,
    checkAllUpdates,
    getVersions,
    refreshManifest,
    checkGitStatus,
  };
}

export default useCommunitySources;
