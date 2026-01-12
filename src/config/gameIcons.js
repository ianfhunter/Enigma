// Re-export from centralized game registry for backwards compatibility
// New code should import directly from data/gameRegistry.js
export { getGameIcon, defaultIcon, getGameBySlug } from '../data/gameRegistry';

// Legacy export - maps slug to icon
// Deprecated: Use getGameIcon(slug) instead
import { allGames, defaultIcon as _defaultIcon } from '../data/gameRegistry';

export const gameIcons = Object.fromEntries(
  allGames.map(game => [game.slug, game.icon])
);
