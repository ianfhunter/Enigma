import { useState, useEffect, useCallback } from 'react';
import { getDefaultPackageIds, getPackageById } from '../data/packageRegistry';

const STORAGE_KEY = 'enigma-installed-packages';

/**
 * Hook for managing installed game packages
 * Persists to localStorage and provides install/uninstall functionality
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

  // Persist to localStorage when packages change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(installedPackages));
  }, [installedPackages]);

  /**
   * Install a package by ID
   */
  const installPackage = useCallback((packageId) => {
    const pkg = getPackageById(packageId);
    if (!pkg) {
      console.warn(`Package not found: ${packageId}`);
      return false;
    }

    setInstalledPackages(prev => {
      if (prev.includes(packageId)) {
        return prev; // Already installed
      }
      return [...prev, packageId];
    });
    return true;
  }, []);

  /**
   * Uninstall a package by ID
   * Returns false if package is not removable
   */
  const uninstallPackage = useCallback((packageId) => {
    const pkg = getPackageById(packageId);
    if (!pkg) {
      console.warn(`Package not found: ${packageId}`);
      return false;
    }

    if (!pkg.removable) {
      console.warn(`Package ${packageId} is not removable`);
      return false;
    }

    setInstalledPackages(prev => prev.filter(id => id !== packageId));
    return true;
  }, []);

  /**
   * Check if a package is installed
   */
  const isInstalled = useCallback((packageId) => {
    return installedPackages.includes(packageId);
  }, [installedPackages]);

  /**
   * Toggle package installation state
   */
  const togglePackage = useCallback((packageId) => {
    if (isInstalled(packageId)) {
      return uninstallPackage(packageId);
    } else {
      return installPackage(packageId);
    }
  }, [isInstalled, installPackage, uninstallPackage]);

  /**
   * Reset to default packages only
   */
  const resetToDefaults = useCallback(() => {
    setInstalledPackages(getDefaultPackageIds());
  }, []);

  return {
    installedPackages,
    installPackage,
    uninstallPackage,
    isInstalled,
    togglePackage,
    resetToDefaults,
  };
}

export default useInstalledPackages;
