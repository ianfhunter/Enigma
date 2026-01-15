/**
 * Package Registry
 *
 * Defines official game packs that users can install/uninstall.
 * This file provides backward-compatible exports while delegating
 * to the new pack manifest system in src/packs/.
 *
 * Pack Types:
 * - 'official': Bundled games, verified by Enigma team
 * - 'community': External packs from community registry (future)
 * - 'custom': User-created packs with iframe games
 */

// Import from packs system
import {
  officialPacks as packsFromRegistry,
  getPackageById as getPackageByIdFromRegistry,
  getDefaultPackageIds as getDefaultPackageIdsFromRegistry,
  isManifestPack,
  COMMUNITY_REGISTRY_URL as REGISTRY_URL,
} from '../packs/registry';

import {
  getGamesForPack,
  getCategoriesForPack,
  getGamesForPackages as getGamesForPackagesFromLoader,
  getCategoriesForPackages,
  countGamesInPack as countGamesInPackFromLoader,
  getPackPreviewGames,
} from '../packs/PackLoader';

/**
 * Official packs - sourced from the packs registry
 */
export const officialPacks = packsFromRegistry;

/**
 * Community registry URL for future community pack support
 */
export const COMMUNITY_REGISTRY_URL = REGISTRY_URL;

/**
 * Get all official packs
 */
export const getOfficialPacks = () => officialPacks;

/**
 * Get pack IDs that should be installed by default
 */
export const getDefaultPackageIds = getDefaultPackageIdsFromRegistry;

/**
 * Get a specific pack by ID
 */
export const getPackageById = getPackageByIdFromRegistry;

/**
 * Get all category names included in a pack
 */
export const getPackageCategories = (packageId) => {
  const categories = getCategoriesForPack(packageId);
  return categories.map(c => c.name);
};

/**
 * Get all category names from multiple pack IDs
 */
export const getCategoriesFromPackages = (packageIds) => {
  const categorySet = new Set();
  for (const pkgId of packageIds) {
    const categoryNames = getPackageCategories(pkgId);
    categoryNames.forEach(cat => categorySet.add(cat));
  }
  return Array.from(categorySet);
};

/**
 * Get all games that should be shown for the given installed packages
 * @param {string[]} packageIds - Array of installed package IDs
 * @param {Array} _allCategories - Unused, kept for backward compatibility
 * @returns {Array} Array of game objects that should be shown
 */
export const getGamesForPackages = (packageIds, _allCategories) => {
  return getGamesForPackagesFromLoader(packageIds);
};

/**
 * Get categories with filtered games based on installed packages
 * @param {string[]} packageIds - Array of installed package IDs
 * @param {Array} _allCategories - Unused, kept for backward compatibility
 * @returns {Array} Categories with filtered games
 */
export const getFilteredCategories = (packageIds, _allCategories) => {
  return getCategoriesForPackages(packageIds);
};

/**
 * Count total games in a pack
 * @param {string} packageId - The pack ID
 * @param {Array} _allCategories - Unused, kept for backward compatibility
 * @returns {number} Number of games in the pack
 */
export const countGamesInPack = (packageId, _allCategories) => {
  return countGamesInPackFromLoader(packageId);
};

/**
 * Get preview games for a pack (first few games for display)
 * @param {string} packageId - The pack ID
 * @param {Array} _allCategories - Unused, kept for backward compatibility
 * @param {number} limit - Maximum number of games to return
 * @returns {Array} Array of game objects
 */
export const getPackagePreviewGames = (packageId, _allCategories, limit = 4) => {
  return getPackPreviewGames(packageId, limit);
};

// Re-export for convenience
export { isManifestPack };
