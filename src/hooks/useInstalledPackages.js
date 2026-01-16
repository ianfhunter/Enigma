import { useState, useEffect, useCallback } from 'react';
import { getDefaultPackageIds, getPackageById } from '../data/packageRegistry';
import { isCommunityPack } from '../packs/registry';
import { packs as packsApi } from '../api/client';

const STORAGE_KEY = 'enigma-installed-packages';

/**
 * Hook for managing installed game packages
 *
 * - Official packs: Always available, tracked in localStorage for UI filtering
 * - Community packs: Backend-managed, tracked in database
 *
 * When installing/uninstalling community packs, this hook:
 * 1. Updates localStorage for immediate UI response
 * 2. Calls the backend API to enable/disable the pack's backend plugin
 */
export function useInstalledPackages() {
  const [installedPackages, setInstalledPackages] = useState(() => {
    // Initialize from localStorage or use defaults
    if (typeof window === 'undefined') {
      return getDefaultPackageIds();
    }

    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Ensure defaults are always included
        const defaults = getDefaultPackageIds();
        const merged = [...new Set([...defaults, ...parsed])];
        return merged;
      } catch {
        return getDefaultPackageIds();
      }
    }
    return getDefaultPackageIds();
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Sync with backend on initial load
  useEffect(() => {
    async function syncWithBackend() {
      try {
        const response = await packsApi.getInstalled();
        if (response?.packs) {
          // Get IDs of installed community packs from backend
          const backendInstalledIds = response.packs
            .filter(p => p.pack_type === 'community')
            .map(p => p.pack_id);

          // Update local state to match backend for community packs
          setInstalledPackages(prev => {
            const defaults = getDefaultPackageIds();
            const officialInstalled = prev.filter(id => !isCommunityPack(id));
            const merged = [...new Set([...defaults, ...officialInstalled, ...backendInstalledIds])];
            return merged;
          });
        }
      } catch (err) {
        // Backend sync failure is not critical - we can still work with localStorage
        console.warn('Failed to sync with backend:', err);
      }
    }

    syncWithBackend();
  }, []);

  // Persist to localStorage when packages change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(installedPackages));
  }, [installedPackages]);

  /**
   * Install a package by ID
   * @param {string} packageId - The package ID to install
   * @returns {Promise<boolean>} - Whether installation was successful
   */
  const installPackage = useCallback(async (packageId) => {
    const pkg = getPackageById(packageId);
    if (!pkg) {
      console.warn(`Package not found: ${packageId}`);
      return false;
    }

    // Check if already installed
    if (installedPackages.includes(packageId)) {
      return true;
    }

    setError(null);
    setIsLoading(true);

    try {
      // For community packs, call the backend API to install
      if (isCommunityPack(packageId)) {
        console.log(`📦 Installing community pack: ${packageId}`);
        const result = await packsApi.install(packageId, 'community');

        if (!result.success && !result.alreadyInstalled) {
          throw new Error(result.error || 'Installation failed');
        }

        console.log(`✅ Backend installed pack: ${packageId}`);
      }

      // Update local state
      setInstalledPackages(prev => {
        if (prev.includes(packageId)) {
          return prev;
        }
        return [...prev, packageId];
      });

      return true;
    } catch (err) {
      console.error(`Failed to install pack ${packageId}:`, err);
      setError(err.message);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [installedPackages]);

  /**
   * Uninstall a package by ID
   * Returns false if package is not removable
   * @param {string} packageId - The package ID to uninstall
   * @returns {Promise<boolean>} - Whether uninstallation was successful
   */
  const uninstallPackage = useCallback(async (packageId) => {
    const pkg = getPackageById(packageId);
    if (!pkg) {
      console.warn(`Package not found: ${packageId}`);
      return false;
    }

    if (!pkg.removable) {
      console.warn(`Package ${packageId} is not removable`);
      return false;
    }

    setError(null);
    setIsLoading(true);

    try {
      // For community packs, call the backend API to uninstall
      if (isCommunityPack(packageId)) {
        console.log(`📦 Uninstalling community pack: ${packageId}`);
        const result = await packsApi.uninstall(packageId);

        if (!result.success) {
          throw new Error(result.error || 'Uninstallation failed');
        }

        console.log(`✅ Backend uninstalled pack: ${packageId}`);
      }

      // Update local state
      setInstalledPackages(prev => prev.filter(id => id !== packageId));

      return true;
    } catch (err) {
      console.error(`Failed to uninstall pack ${packageId}:`, err);
      setError(err.message);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Check if a package is installed
   */
  const isInstalled = useCallback((packageId) => {
    return installedPackages.includes(packageId);
  }, [installedPackages]);

  /**
   * Toggle package installation state
   * @param {string} packageId - The package ID to toggle
   * @returns {Promise<boolean>} - Whether the toggle was successful
   */
  const togglePackage = useCallback(async (packageId) => {
    if (isInstalled(packageId)) {
      return uninstallPackage(packageId);
    } else {
      return installPackage(packageId);
    }
  }, [isInstalled, installPackage, uninstallPackage]);

  /**
   * Reset to default packages only
   */
  const resetToDefaults = useCallback(async () => {
    // Uninstall all community packs from backend
    const communityPacks = installedPackages.filter(isCommunityPack);
    for (const packId of communityPacks) {
      try {
        await packsApi.uninstall(packId);
      } catch (err) {
        console.warn(`Failed to uninstall ${packId} from backend:`, err);
      }
    }

    setInstalledPackages(getDefaultPackageIds());
  }, [installedPackages]);

  return {
    installedPackages,
    installPackage,
    uninstallPackage,
    isInstalled,
    togglePackage,
    resetToDefaults,
    isLoading,
    error,
  };
}

export default useInstalledPackages;
