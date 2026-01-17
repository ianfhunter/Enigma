/**
 * Game Registry
 *
 * This file provides backward-compatible exports for components that
 * still import from gameRegistry.js. All data is sourced from the
 * pack manifest system in src/packs/.
 *
 * For new code, prefer importing directly from src/packs/registry.js
 */

import {
  officialPacks,
  getAllGames,
  getGameBySlug as getGameBySlugFromPacks,
} from '../packs/registry';

/**
 * All categories from all packs
 * Each category contains its games with categoryName added
 */
export const categories = officialPacks.flatMap(pack =>
  pack.categories.map(cat => ({
    ...cat,
    games: cat.games.map(game => ({ ...game, categoryName: cat.name })),
  }))
);

/**
 * Flatten all games for easy access
 */
export const allGames = getAllGames();

/**
 * Get only enabled games (non-disabled)
 */
export const enabledGames = allGames.filter(game => !game.disabled);

/**
 * Get a game by slug
 */
export function getGameBySlug(slug) {
  return allGames.find(game => game.slug === slug);
}

/**
 * Get game colors by slug
 */
export function getGameColors(slug) {
  const game = getGameBySlug(slug);
  return game?.colors || { primary: '#666', secondary: '#555' };
}

/**
 * Get game icon by slug
 */
export function getGameIcon(slug) {
  const game = getGameBySlug(slug);
  return game?.icon || '🎮';
}

/**
 * Get emoji icon for favicon (fallback for SVG icons)
 */
export function getGameEmojiIcon(slug) {
  const game = getGameBySlug(slug);
  // Use emojiIcon if defined, otherwise use icon if it's a string (emoji)
  if (game?.emojiIcon) return game.emojiIcon;
  if (typeof game?.icon === 'string' && !game.icon.endsWith('.svg')) return game.icon;
  return '🎮';
}

/**
 * Get game gradient by slug
 */
export function getGameGradient(slug) {
  const game = getGameBySlug(slug);
  return game?.gradient || 'linear-gradient(135deg, #a855f7 0%, #6366f1 100%)';
}

/**
 * Default icon for unknown games
 */
export const defaultIcon = '🎮';
