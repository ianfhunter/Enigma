import { describe, it, expect } from 'vitest';
import { categories } from './gameRegistry';
import {
  officialPacks,
  getOfficialPacks,
  getDefaultPackageIds,
  getPackageById,
  getPackageCategories,
  getCategoriesFromPackages,
  countGamesInPack,
  getPackagePreviewGames,
  getFilteredCategories,
  getGamesForPackages,
} from './packageRegistry';
import { isManifestPack } from '../packs/registry';

describe('packageRegistry', () => {
  describe('officialPacks', () => {
    it('should have at least 9 packs defined', () => {
      expect(officialPacks.length).toBeGreaterThanOrEqual(9);
    });

    it('should have all packs as default', () => {
      for (const pack of officialPacks) {
        expect(pack.default).toBe(true);
      }
    });

    it('should have all packs as removable', () => {
      for (const pack of officialPacks) {
        expect(pack.removable).toBe(true);
      }
    });

    it('should have a word-games pack (manifest format)', () => {
      const wordGamesPack = officialPacks.find(p => p.id === 'word-games');
      expect(wordGamesPack).toBeDefined();
      expect(isManifestPack('word-games')).toBe(true);
    });

    it('should have a sudoku-family pack (manifest format)', () => {
      const sudokuPack = officialPacks.find(p => p.id === 'sudoku-family');
      expect(sudokuPack).toBeDefined();
      expect(isManifestPack('sudoku-family')).toBe(true);
    });

    it('should have a trivia-knowledge pack (manifest format)', () => {
      const triviaPack = officialPacks.find(p => p.id === 'trivia-knowledge');
      expect(triviaPack).toBeDefined();
      expect(isManifestPack('trivia-knowledge')).toBe(true);
    });

    it('should have an international-words pack (manifest format)', () => {
      const intlPack = officialPacks.find(p => p.id === 'international-words');
      expect(intlPack).toBeDefined();
      expect(isManifestPack('international-words')).toBe(true);
    });

    it('word-games pack should NOT include shiritori', () => {
      // In manifest format, we don't include shiritori rather than excluding it
      const wordGames = getGamesForPackages(['word-games'], categories);
      expect(wordGames.some(g => g.slug === 'shiritori')).toBe(false);
    });

    it('all packs should have required fields', () => {
      for (const pack of officialPacks) {
        expect(pack.id).toBeDefined();
        expect(pack.name).toBeDefined();
        expect(pack.description).toBeDefined();
        expect(pack.icon).toBeDefined();
        // categories is optional for manifest packs (they embed games directly)
        if (!isManifestPack(pack.id)) {
          expect(pack.categories).toBeDefined();
          expect(Array.isArray(pack.categories)).toBe(true);
        }
      }
    });
  });

  describe('getOfficialPacks', () => {
    it('should return all official packs', () => {
      const packs = getOfficialPacks();
      expect(packs).toEqual(officialPacks);
    });
  });

  describe('getDefaultPackageIds', () => {
    it('should return all package IDs since all are default', () => {
      const defaults = getDefaultPackageIds();
      expect(defaults.length).toBe(officialPacks.length);
      for (const pack of officialPacks) {
        expect(defaults).toContain(pack.id);
      }
    });

    it('should return an array', () => {
      const defaults = getDefaultPackageIds();
      expect(Array.isArray(defaults)).toBe(true);
    });
  });

  describe('getPackageById', () => {
    it('should find a pack by ID', () => {
      const pack = getPackageById('word-games');
      expect(pack).toBeDefined();
      expect(pack.id).toBe('word-games');
    });

    it('should find legacy pack by ID', () => {
      const pack = getPackageById('sudoku-family');
      expect(pack).toBeDefined();
      expect(pack.id).toBe('sudoku-family');
    });

    it('should return undefined for unknown ID', () => {
      const pack = getPackageById('nonexistent');
      expect(pack).toBeUndefined();
    });
  });

  describe('getPackageCategories', () => {
    it('should return categories for manifest pack (word-games)', () => {
      const cats = getPackageCategories('word-games');
      expect(Array.isArray(cats)).toBe(true);
      expect(cats.length).toBe(3);
      expect(cats).toContain('Word Formation');
      expect(cats).toContain('Word Grids');
      expect(cats).toContain('Cipher & Decode');
    });

    it('should return categories for legacy pack', () => {
      const cats = getPackageCategories('sudoku-family');
      expect(Array.isArray(cats)).toBe(true);
      expect(cats).toContain('Sudoku Family');
    });

    it('should return categories for international-words manifest pack', () => {
      const cats = getPackageCategories('international-words');
      expect(cats.length).toBe(1);
      expect(cats[0]).toBe('International Word Games');
    });

    it('should return empty array for invalid pack', () => {
      const cats = getPackageCategories('nonexistent');
      expect(cats).toEqual([]);
    });
  });

  describe('getCategoriesFromPackages', () => {
    it('should combine categories from multiple packs', () => {
      const cats = getCategoriesFromPackages(['word-games', 'sudoku-family']);
      expect(cats).toContain('Word Formation');
      expect(cats).toContain('Sudoku Family');
    });

    it('should not have duplicates', () => {
      const cats = getCategoriesFromPackages(['word-games', 'word-games']);
      const uniqueCats = [...new Set(cats)];
      expect(cats.length).toBe(uniqueCats.length);
    });
  });

  describe('countGamesInPack', () => {
    it('should count games in manifest pack (word-games)', () => {
      const count = countGamesInPack('word-games', categories);
      expect(count).toBeGreaterThan(20);
    });

    it('should count games in legacy pack (sudoku-family)', () => {
      const count = countGamesInPack('sudoku-family', categories);
      expect(count).toBeGreaterThan(5);
    });

    it('should count games in international-words manifest pack', () => {
      const count = countGamesInPack('international-words', categories);
      expect(count).toBe(1); // Just shiritori
    });

    it('should return 0 for invalid pack', () => {
      const count = countGamesInPack('nonexistent', categories);
      expect(count).toBe(0);
    });
  });

  describe('getPackagePreviewGames', () => {
    it('should return preview games for manifest pack', () => {
      const games = getPackagePreviewGames('word-games', categories, 4);
      expect(games.length).toBeLessThanOrEqual(4);
      expect(games.length).toBeGreaterThan(0);
    });

    it('should return preview games for legacy pack', () => {
      const games = getPackagePreviewGames('sudoku-family', categories, 4);
      expect(games.length).toBeLessThanOrEqual(4);
      expect(games.length).toBeGreaterThan(0);
    });

    it('should return games with required properties', () => {
      const games = getPackagePreviewGames('sudoku-family', categories, 2);
      for (const game of games) {
        expect(game.title).toBeDefined();
        expect(game.slug).toBeDefined();
      }
    });

    it('should return games for international-words manifest pack', () => {
      const games = getPackagePreviewGames('international-words', categories, 4);
      expect(games.some(g => g.slug === 'shiritori')).toBe(true);
    });

    it('should return empty array for invalid pack', () => {
      const games = getPackagePreviewGames('nonexistent', categories);
      expect(games).toEqual([]);
    });
  });

  describe('getFilteredCategories', () => {
    it('should filter categories based on manifest pack', () => {
      const filtered = getFilteredCategories(['word-games'], categories);
      expect(filtered.length).toBe(3);
      expect(filtered.some(c => c.name === 'Word Formation')).toBe(true);
      expect(filtered.some(c => c.name === 'Word Grids')).toBe(true);
      expect(filtered.some(c => c.name === 'Cipher & Decode')).toBe(true);
    });

    it('should filter categories based on legacy pack', () => {
      const filtered = getFilteredCategories(['sudoku-family'], categories);
      expect(filtered.length).toBe(1);
      expect(filtered[0].name).toBe('Sudoku Family');
    });

    it('should return empty for no installed packages', () => {
      const filtered = getFilteredCategories([], categories);
      expect(filtered.length).toBe(0);
    });

    it('should include games from international-words manifest pack', () => {
      const filtered = getFilteredCategories(['international-words'], categories);
      // Should have one category (International Word Games) with shiritori
      expect(filtered.length).toBe(1);
      expect(filtered[0].name).toBe('International Word Games');
      expect(filtered[0].games.some(g => g.slug === 'shiritori')).toBe(true);
    });

    it('should NOT include shiritori in word-games (manifest pack)', () => {
      const filtered = getFilteredCategories(['word-games'], categories);
      const wordFormation = filtered.find(c => c.name === 'Word Formation');
      // shiritori should NOT be in the filtered Word Formation (not in manifest)
      expect(wordFormation.games.some(g => g.slug === 'shiritori')).toBe(false);
    });

    it('should have shiritori when international-words manifest pack is installed', () => {
      const filtered = getFilteredCategories(['word-games', 'international-words'], categories);
      const allGameSlugs = filtered.flatMap(c => c.games.map(g => g.slug));
      expect(allGameSlugs.includes('shiritori')).toBe(true);
    });
  });

  describe('getGamesForPackages', () => {
    it('should return all games for all packages', () => {
      const allPackIds = officialPacks.map(p => p.id);
      const games = getGamesForPackages(allPackIds, categories);

      // Should have all games from all categories
      const totalGames = categories.reduce((sum, cat) => sum + cat.games.length, 0);
      expect(games.length).toBe(totalGames);
    });

    it('should return games from manifest pack with categoryName', () => {
      const games = getGamesForPackages(['word-games'], categories);
      for (const game of games) {
        expect(game.categoryName).toBeDefined();
      }
    });

    it('should return games from legacy pack with categoryName', () => {
      const games = getGamesForPackages(['sudoku-family'], categories);
      for (const game of games) {
        expect(game.categoryName).toBe('Sudoku Family');
      }
    });
  });

  describe('category mapping', () => {
    it('all categories referenced in legacy packs should exist in gameRegistry', () => {
      const registryCategoryNames = categories.map(c => c.name);

      for (const pack of officialPacks) {
        // Skip manifest packs - they don't reference categories by name
        if (isManifestPack(pack.id)) continue;

        for (const catName of pack.categories || []) {
          expect(registryCategoryNames).toContain(catName);
        }
      }
    });

    it('all categories in gameRegistry should be covered by some pack', () => {
      // Get categories from all packs (both manifest and legacy)
      const allPackIds = officialPacks.map(p => p.id);
      const allCoveredCategories = new Set(getCategoriesFromPackages(allPackIds));

      for (const category of categories) {
        expect(allCoveredCategories.has(category.name)).toBe(true);
      }
    });

    it('all games referenced in includeGames should exist', () => {
      const allGameSlugs = categories.flatMap(c => c.games.map(g => g.slug));

      for (const pack of officialPacks) {
        // Skip manifest packs
        if (isManifestPack(pack.id)) continue;

        for (const slug of pack.includeGames || []) {
          expect(allGameSlugs).toContain(slug);
        }
      }
    });

    it('all games referenced in excludeGames should exist', () => {
      const allGameSlugs = categories.flatMap(c => c.games.map(g => g.slug));

      for (const pack of officialPacks) {
        // Skip manifest packs
        if (isManifestPack(pack.id)) continue;

        for (const slug of pack.excludeGames || []) {
          expect(allGameSlugs).toContain(slug);
        }
      }
    });
  });

  describe('manifest pack integration', () => {
    it('word-games manifest pack should have correct game count', () => {
      const count = countGamesInPack('word-games', categories);
      // Word Formation (10) + Word Grids (7) + Cipher & Decode (6) + Categories (1) = 24
      // But shiritori is not included, so it should be less than total in those categories
      expect(count).toBe(24);
    });

    it('word-games should include expected games', () => {
      const games = getGamesForPackages(['word-games'], categories);
      const slugs = games.map(g => g.slug);

      // Check some expected games are present
      expect(slugs).toContain('wordguess');
      expect(slugs).toContain('crossword');
      expect(slugs).toContain('cryptogram');
      expect(slugs).toContain('hangman');
      expect(slugs).toContain('word-wheel');

      // shiritori should NOT be present
      expect(slugs).not.toContain('shiritori');
    });
  });
});
