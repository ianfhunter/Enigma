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
 * Check if a pack exists (all packs are manifest packs now)
 */
export const isManifestPack = (packId) => {
  return getPackageById(packId) !== undefined;
};

/**
 * Get games from a pack
 */
export const getGamesFromPack = (packId) => {
  const pack = officialPacks.find(p => p.id === packId);
  return pack?.allGames || null;
};

/**
 * Get categories from a pack
 */
export const getCategoriesFromPack = (packId) => {
  const pack = officialPacks.find(p => p.id === packId);
  return pack?.categories || null;
};

/**
 * Get all games from all packs
 */
export const getAllGames = () => {
  return officialPacks.flatMap(pack => pack.allGames || []);
};

/**
 * Get a game by slug from any pack
 */
export const getGameBySlug = (slug) => {
  for (const pack of officialPacks) {
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
  getOfficialPacks,
  getDefaultPackageIds,
  getPackageById,
  isManifestPack,
  getGamesFromPack,
  getCategoriesFromPack,
  getAllGames,
  getGameBySlug,
  COMMUNITY_REGISTRY_URL,
};
