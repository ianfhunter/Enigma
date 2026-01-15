/**
 * Packs Module - Central export for all pack-related functionality
 *
 * Usage:
 *   import { getGamesForPackages, getPackageById } from '../packs';
 *   import wordGamesPack from '../packs/word-games/manifest';
 */

// Re-export everything from registry
export * from './registry';
export { default as packRegistry } from './registry';

// Re-export everything from PackLoader
export * from './PackLoader';
export { default as PackLoader } from './PackLoader';
