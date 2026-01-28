/**
 * Sorting utilities for the Home page
 */

/**
 * Sort options for games
 */
export const SORT_OPTIONS = {
  DEFAULT: 'default',
  ALPHABETICAL: 'alphabetical',
  RECENTLY_UPDATED: 'recentlyUpdated'
};

/**
 * Sort games by the specified option
 * @param {Array} games - Array of game objects
 * @param {string} sortOption - Sort option from SORT_OPTIONS
 * @param {string} sortOrder - Sort order ('normal' or 'reverse')
 * @returns {Array} - Sorted array of games
 */
export function sortGames(games, sortOption, sortOrder = 'normal') {
  const gamesCopy = [...games];

  switch (sortOption) {
    case SORT_OPTIONS.ALPHABETICAL:
      return gamesCopy.sort((a, b) => {
        const comparison = a.title.localeCompare(b.title, undefined, { sensitivity: 'base' });
        return sortOrder === 'reverse' ? -comparison : comparison;
      });

    case SORT_OPTIONS.RECENTLY_UPDATED:
      // Sort by file modification time (more recent files first)
      // If no modification time, treat as older
      return gamesCopy.sort((a, b) => {
        const timeA = a.lastModified || 0;
        const timeB = b.lastModified || 0;

        let result;
        // More recent first
        if (timeB !== timeA) {
          result = timeB - timeA;
        } else {
          // If modification times are the same, sort alphabetically
          result = a.title.localeCompare(b.title, undefined, { sensitivity: 'base' });
        }

        return sortOrder === 'reverse' ? -result : result;
      });

    case SORT_OPTIONS.DEFAULT:
    default:
      // Default sorting: disabled games last, then by title
      return gamesCopy.sort((a, b) => {
        // Disabled games go to the end
        if (a.disabled !== b.disabled) {
          return a.disabled ? 1 : -1;
        }

        // Then sort alphabetically
        const comparison = a.title.localeCompare(b.title, undefined, { sensitivity: 'base' });
        return sortOrder === 'reverse' ? -comparison : comparison;
      });
  }
}

/**
 * Sort categories and their games
 * @param {Array} categories - Array of category objects
 * @param {string} sortOption - Sort option from SORT_OPTIONS
 * @param {string} sortOrder - Sort order ('normal' or 'reverse')
 * @returns {Array} - Sorted array of categories with sorted games
 */
export function sortCategories(categories, sortOption, sortOrder = 'normal') {
  const categoriesCopy = categories.map(category => ({
    ...category,
    games: sortGames(category.games, sortOption, sortOrder)
  }));

  // Sort categories alphabetically by name
  return categoriesCopy.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
}
