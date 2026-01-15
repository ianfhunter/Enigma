/**
 * PackLoader - Unified interface for loading games from packs
 *
 * Handles:
 * - Official packs: Manifest-based packs with embedded component loaders
 * - Community packs: Remote packs loaded from URLs (future)
 * - Custom packs: User-created iframe-based packs
 */

import {
  getPackageById,
  getGamesFromPack as getGamesFromPackRegistry,
  getCategoriesFromPack as getCategoriesFromPackRegistry,
  officialPacks,
} from './registry';

/**
 * Get all games for a specific pack
 *
 * @param {string} packId - The pack ID
 * @returns {Array} Array of game objects
 */
export function getGamesForPack(packId) {
  return getGamesFromPackRegistry(packId) || [];
}

/**
 * Get categories for a specific pack
 *
 * @param {string} packId - The pack ID
 * @returns {Array} Array of category objects with games
 */
export function getCategoriesForPack(packId) {
  return getCategoriesFromPackRegistry(packId) || [];
}

/**
 * Get all games from multiple packs
 *
 * @param {string[]} packageIds - Array of pack IDs
 * @returns {Array} Array of game objects (deduplicated by slug)
 */
export function getGamesForPackages(packageIds) {
  const gamesMap = new Map();

  for (const packId of packageIds) {
    const games = getGamesForPack(packId);
    for (const game of games) {
      // Use slug as key to deduplicate
      if (!gamesMap.has(game.slug)) {
        gamesMap.set(game.slug, { ...game, packId });
      }
    }
  }

  return Array.from(gamesMap.values());
}

/**
 * Get categories from multiple packs, merged and deduplicated
 *
 * @param {string[]} packageIds - Array of pack IDs
 * @returns {Array} Array of category objects with merged games
 */
export function getCategoriesForPackages(packageIds) {
  const categoryMap = new Map();

  for (const packId of packageIds) {
    const categories = getCategoriesForPack(packId);
    for (const category of categories) {
      if (categoryMap.has(category.name)) {
        // Merge games into existing category
        const existing = categoryMap.get(category.name);
        const existingSlugs = new Set(existing.games.map(g => g.slug));
        const newGames = category.games.filter(g => !existingSlugs.has(g.slug));
        existing.games = [...existing.games, ...newGames];
      } else {
        categoryMap.set(category.name, { ...category, games: [...category.games] });
      }
    }
  }

  return Array.from(categoryMap.values());
}

/**
 * Get a specific game by slug from any installed pack
 *
 * @param {string} slug - The game slug
 * @param {string[]} packageIds - Array of installed pack IDs
 * @returns {Object|null} Game object or null if not found
 */
export function getGameBySlug(slug, packageIds) {
  for (const packId of packageIds) {
    const games = getGamesForPack(packId);
    const game = games.find(g => g.slug === slug);
    if (game) {
      return { ...game, packId };
    }
  }
  return null;
}

/**
 * Get the component loader for a game
 *
 * @param {string} slug - The game slug
 * @param {string[]} packageIds - Array of installed pack IDs
 * @returns {Function|null} Component loader function or null
 */
export function getGameComponent(slug, packageIds) {
  const game = getGameBySlug(slug, packageIds);
  if (!game) return null;

  if (game.component && typeof game.component === 'function') {
    return game.component;
  }

  return null;
}

/**
 * Count total games in a pack
 *
 * @param {string} packId - The pack ID
 * @returns {number} Number of games
 */
export function countGamesInPack(packId) {
  return getGamesForPack(packId).length;
}

/**
 * Get preview games for a pack (first few games for display)
 *
 * @param {string} packId - The pack ID
 * @param {number} limit - Maximum number of games to return
 * @returns {Array} Array of game objects
 */
export function getPackPreviewGames(packId, limit = 4) {
  return getGamesForPack(packId).slice(0, limit);
}

/**
 * Check if a game belongs to any of the given packs
 *
 * @param {string} slug - The game slug
 * @param {string[]} packageIds - Array of pack IDs to check
 * @returns {boolean} True if game is in any of the packs
 */
export function isGameInPacks(slug, packageIds) {
  return getGameBySlug(slug, packageIds) !== null;
}

export default {
  getGamesForPack,
  getCategoriesForPack,
  getGamesForPackages,
  getCategoriesForPackages,
  getGameBySlug,
  getGameComponent,
  countGamesInPack,
  getPackPreviewGames,
  isGameInPacks,
};
