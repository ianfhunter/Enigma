/**
 * Pack Registry
 *
 * Central registry that imports all pack manifests and provides a unified interface.
 * This serves as the source of truth for pack metadata and game lookups.
 *
 * Pack Types:
 * - 'official': Bundled packs with native components (loaded from manifest files)
 * - 'community': Remote packs from community registry (future - loaded via URL)
 * - 'custom': User-created packs with iframe games (managed by useCustomPacks hook)
 */

// Import official pack manifests
import wordGamesPack from './word-games/manifest';
import shadingPuzzlesPack from './shading-puzzles/manifest';
import pathsRegionsPack from './paths-regions/manifest';
import spatialTilesPack from './spatial-tiles/manifest';
import strategyMovementPack from './strategy-movement/manifest';
import classicLogicPack from './classic-logic/manifest';
import sudokuFamilyPack from './sudoku-family/manifest';
import triviaKnowledgePack from './trivia-knowledge/manifest';
import internationalWordsPack from './international-words/manifest';
import cardGamesPack from './card-games/manifest';

// Import installed community packs (auto-generated)
// Run `node scripts/generate-community-packs.js` to regenerate
// Use dynamic import with fallback to handle missing file in test environments
let installedCommunityPacks = [];
try {
  const communityPacksModule = await import('./installedCommunityPacks.js');
  installedCommunityPacks = communityPacksModule.installedCommunityPacks || [];
} catch (error) {
  // File doesn't exist yet (e.g., in test environments)
  // This is expected and handled gracefully
  console.warn('installedCommunityPacks.js not found, using empty array');
}

/**
 * All official packs loaded from their manifest files
 */
export const officialPacks = [
  wordGamesPack,
  shadingPuzzlesPack,
  pathsRegionsPack,
  spatialTilesPack,
  strategyMovementPack,
  classicLogicPack,
  sudokuFamilyPack,
  triviaKnowledgePack,
  internationalWordsPack,
  cardGamesPack,
];

/**
 * Community packs with backend support
 * ⚠️ These packs run server-side code!
 *
 * Community packs are automatically loaded from .plugins/ directory.
 * They are registered by running: node scripts/generate-community-packs.js
 *
 * The generation script is triggered automatically when:
 * - A pack is installed via the Game Store
 * - A pack is uninstalled
 * - A pack is updated
 */
export const communityPacks = installedCommunityPacks.map(pack => ({
  ...pack,
  type: 'community',
}));

/**
 * All available packs (official + community)
 */
export const allPacks = [...officialPacks, ...communityPacks];

/**
 * Get all official packs
 */
export const getOfficialPacks = () => officialPacks;

/**
 * Get all community packs
 */
export const getCommunityPacks = () => communityPacks;

/**
 * Get all packs (official + community)
 */
export const getAllPacks = () => allPacks;

/**
 * Get pack IDs that should be installed by default
 */
export const getDefaultPackageIds = () =>
  allPacks.filter(p => p.default).map(p => p.id);

/**
 * Get a specific pack by ID
 */
export const getPackageById = (id) =>
  allPacks.find(p => p.id === id);

/**
 * Check if a pack exists
 */
export const isManifestPack = (packId) => {
  return getPackageById(packId) !== undefined;
};

/**
 * Check if a pack is a community pack (has backend)
 */
export const isCommunityPack = (packId) => {
  const pack = getPackageById(packId);
  return pack?.type === 'community' || pack?.hasBackend === true;
};

/**
 * Get games from a pack
 */
export const getGamesFromPack = (packId) => {
  const pack = allPacks.find(p => p.id === packId);
  return pack?.allGames || null;
};

/**
 * Get categories from a pack
 */
export const getCategoriesFromPack = (packId) => {
  const pack = allPacks.find(p => p.id === packId);
  return pack?.categories || null;
};

/**
 * Get all games from all packs
 */
export const getAllGames = () => {
  return allPacks.flatMap(pack => pack.allGames || []);
};

/**
 * Get a game by slug from any pack
 */
export const getGameBySlug = (slug) => {
  for (const pack of allPacks) {
    const game = pack.getGameBySlug?.(slug);
    if (game) return { ...game, packId: pack.id };
  }
  return null;
};

/**
 * Community registry URL for future community pack support
 */
export const COMMUNITY_REGISTRY_URL =
  'https://raw.githubusercontent.com/ianfhunter/enigma-community-packs/main/registry.json';

export default {
  officialPacks,
  communityPacks,
  allPacks,
  getOfficialPacks,
  getCommunityPacks,
  getAllPacks,
  getDefaultPackageIds,
  getPackageById,
  isManifestPack,
  isCommunityPack,
  getGamesFromPack,
  getCategoriesFromPack,
  getAllGames,
  getGameBySlug,
  COMMUNITY_REGISTRY_URL,
};
