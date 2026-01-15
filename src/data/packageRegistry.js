/**
 * Package Registry
 *
 * Defines official game packs that users can install/uninstall.
 * Each pack contains one or more categories of games from gameRegistry.js
 *
 * Pack Types:
 * - 'official': Bundled games, verified by Enigma team
 * - 'community': External packs from community registry (future)
 * - 'custom': User-created packs with iframe games (future)
 */

export const officialPacks = [
  {
    id: 'word-games',
    type: 'official',
    name: 'Word Games',
    description: 'Create, guess, and decode words. From Wordle-likes to crosswords to cryptograms.',
    icon: '📝',
    color: '#22c55e',
    default: true,
    removable: true,
    categories: ['Word Formation', 'Word Grids', 'Cipher & Decode'],
    // Exclude games that belong to other packs
    excludeGames: ['shiritori'],
  },
  {
    id: 'shading-puzzles',
    type: 'official',
    name: 'Shading Puzzles',
    description: 'Shade cells to reveal pictures or satisfy clues. Nonogram, Minesweeper, Nurikabe, and more.',
    icon: '⬛',
    color: '#f472b6',
    default: true,
    removable: true,
    categories: ['Grid Shading'],
  },
  {
    id: 'paths-regions',
    type: 'official',
    name: 'Paths & Regions',
    description: 'Draw loops, connect paths, and divide grids. Hashi, Loopy, Numberlink, Shikaku, and more.',
    icon: '🔗',
    color: '#a855f7',
    default: true,
    removable: true,
    categories: ['Loop & Path', 'Region Division'],
  },
  {
    id: 'spatial-tiles',
    type: 'official',
    name: 'Spatial & Tiles',
    description: 'Jigsaws, sliding puzzles, and tile manipulation games.',
    icon: '🧩',
    color: '#f97316',
    default: true,
    removable: true,
    categories: ['Tile & Spatial'],
  },
  {
    id: 'strategy-movement',
    type: 'official',
    name: 'Strategy & Movement',
    description: 'Chess puzzles, Sokoban, and strategic pathfinding challenges.',
    icon: '♟️',
    color: '#6366f1',
    default: true,
    removable: true,
    categories: ['Chess & Movement'],
  },
  {
    id: 'classic-logic',
    type: 'official',
    name: 'Classic Logic',
    description: 'Einstein puzzles, deduction games, and pure logic challenges.',
    icon: '🧠',
    color: '#8b5cf6',
    default: true,
    removable: true,
    categories: ['Classic Logic', 'Memory & Speed'],
  },
  {
    id: 'sudoku-family',
    type: 'official',
    name: 'Sudoku Family',
    description: 'Sudoku and all its brilliant variants - Killer Sudoku, Sandwich Sudoku, Calcudoku, and more.',
    icon: '🔢',
    color: '#3b82f6',
    default: true,
    removable: true,
    categories: ['Sudoku Family'],
  },
  {
    id: 'trivia-knowledge',
    type: 'official',
    name: 'Trivia & Knowledge',
    description: 'Test your knowledge! Geography, flags, capitals, science, history, and more.',
    icon: '🌍',
    color: '#10b981',
    default: true,
    removable: true,
    categories: ['Trivia & Knowledge'],
  },
  {
    id: 'international-words',
    type: 'official',
    name: 'International Word Games',
    description: 'Word games from around the world. Currently featuring Shiritori (しりとり) - the Japanese word chain game.',
    icon: '🌐',
    color: '#dc2626',
    default: true,
    removable: true,
    categories: [],
    // Include specific games regardless of category
    includeGames: ['shiritori'],
  },
  {
    id: 'card-games',
    type: 'official',
    name: 'Card Games',
    description: 'Classic solitaire and card-based puzzles. Clear the pyramid, build foundations, and more.',
    icon: '🃏',
    color: '#16a34a',
    default: true,
    removable: true,
    categories: ['Card Games'],
  },
];

/**
 * Community registry URL for future community pack support
 * This would be a JSON file hosted on GitHub containing community-submitted packs
 */
export const COMMUNITY_REGISTRY_URL =
  'https://raw.githubusercontent.com/ianfhunter/enigma-community-packs/main/registry.json';

/**
 * Get all official packs
 */
export const getOfficialPacks = () => officialPacks;

/**
 * Get pack IDs that should be installed by default
 */
export const getDefaultPackageIds = () =>
  officialPacks.filter(p => p.default).map(p => p.id);

/**
 * Get a specific pack by ID
 */
export const getPackageById = (id) =>
  officialPacks.find(p => p.id === id);

/**
 * Get all category names included in a pack
 */
export const getPackageCategories = (packageId) => {
  const pkg = getPackageById(packageId);
  return pkg?.categories || [];
};

/**
 * Get all category names from multiple pack IDs
 */
export const getCategoriesFromPackages = (packageIds) => {
  const categorySet = new Set();
  for (const pkgId of packageIds) {
    const pkg = getPackageById(pkgId);
    if (pkg?.categories) {
      pkg.categories.forEach(cat => categorySet.add(cat));
    }
  }
  return Array.from(categorySet);
};

/**
 * Get all games that should be shown for the given installed packages
 * Handles category-based inclusion plus game-level includes/excludes
 * @param {string[]} packageIds - Array of installed package IDs
 * @param {Array} allCategories - Categories array from gameRegistry
 * @returns {Array} Array of game objects that should be shown
 */
export const getGamesForPackages = (packageIds, allCategories) => {
  const includedGames = new Set();
  const excludedGames = new Set();
  const includedCategories = new Set();

  for (const pkgId of packageIds) {
    const pkg = getPackageById(pkgId);
    if (!pkg) continue;

    // Add categories
    pkg.categories?.forEach(cat => includedCategories.add(cat));

    // Add explicit includes
    pkg.includeGames?.forEach(slug => includedGames.add(slug));

    // Add explicit excludes
    pkg.excludeGames?.forEach(slug => excludedGames.add(slug));
  }

  // Build final game list
  // Explicit includes override excludes
  const games = [];
  for (const category of allCategories) {
    for (const game of category.games || []) {
      const inCategory = includedCategories.has(category.name);
      const explicitlyIncluded = includedGames.has(game.slug);
      const explicitlyExcluded = excludedGames.has(game.slug);

      // Include if: explicitly included, OR (in an included category AND not excluded)
      if (explicitlyIncluded || (inCategory && !explicitlyExcluded)) {
        games.push({ ...game, categoryName: category.name });
      }
    }
  }

  return games;
};

/**
 * Get categories with filtered games based on installed packages
 * This maintains the category structure but filters games
 * @param {string[]} packageIds - Array of installed package IDs
 * @param {Array} allCategories - Categories array from gameRegistry
 * @returns {Array} Categories with filtered games
 */
export const getFilteredCategories = (packageIds, allCategories) => {
  const includedGames = new Set();
  const excludedGames = new Set();
  const includedCategories = new Set();

  for (const pkgId of packageIds) {
    const pkg = getPackageById(pkgId);
    if (!pkg) continue;

    pkg.categories?.forEach(cat => includedCategories.add(cat));
    pkg.includeGames?.forEach(slug => includedGames.add(slug));
    pkg.excludeGames?.forEach(slug => excludedGames.add(slug));
  }

  // Filter categories and their games
  return allCategories
    .map(category => {
      // If category is included, filter its games
      if (includedCategories.has(category.name)) {
        const filteredGames = category.games.filter(game => {
          // Explicit includes override excludes
          const explicitlyIncluded = includedGames.has(game.slug);
          const explicitlyExcluded = excludedGames.has(game.slug);
          return explicitlyIncluded || !explicitlyExcluded;
        });
        return { ...category, games: filteredGames };
      }

      // If category is not included, check for explicitly included games
      const explicitGames = category.games.filter(game =>
        includedGames.has(game.slug)
      );

      if (explicitGames.length > 0) {
        return { ...category, games: explicitGames };
      }

      // Category not included and no explicit games
      return null;
    })
    .filter(cat => cat !== null && cat.games.length > 0);
};

/**
 * Count total games in a pack
 * Requires categories from gameRegistry to be passed in
 */
export const countGamesInPack = (packageId, allCategories) => {
  const pkg = getPackageById(packageId);
  if (!pkg) return 0;

  let count = 0;

  // Count games from included categories
  for (const category of allCategories) {
    if (pkg.categories?.includes(category.name)) {
      // Count all games in category minus excluded ones
      const excludedCount = (category.games || []).filter(
        game => pkg.excludeGames?.includes(game.slug)
      ).length;
      count += (category.games?.length || 0) - excludedCount;
    }
  }

  // Add explicitly included games
  count += pkg.includeGames?.length || 0;

  return count;
};

/**
 * Get preview games for a pack (first few games for display)
 */
export const getPackagePreviewGames = (packageId, allCategories, limit = 4) => {
  const pkg = getPackageById(packageId);
  if (!pkg) return [];

  const games = [];

  // Get games from included categories (excluding excluded games)
  for (const category of allCategories) {
    if (pkg.categories?.includes(category.name)) {
      const validGames = (category.games || []).filter(
        game => !pkg.excludeGames?.includes(game.slug)
      );
      games.push(...validGames);
    }
  }

  // Add explicitly included games
  if (pkg.includeGames?.length > 0) {
    for (const category of allCategories) {
      for (const game of category.games || []) {
        if (pkg.includeGames.includes(game.slug) && !games.find(g => g.slug === game.slug)) {
          games.push(game);
        }
      }
    }
  }

  return games.slice(0, limit);
};
