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

describe('packageRegistry', () => {
  describe('officialPacks', () => {
    it('should have 9 packs defined', () => {
      expect(officialPacks.length).toBe(9);
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

    it('should have a word-games pack', () => {
      const wordGamesPack = officialPacks.find(p => p.id === 'word-games');
      expect(wordGamesPack).toBeDefined();
      expect(wordGamesPack.categories).toContain('Word Formation');
    });

    it('should have a sudoku-family pack', () => {
      const sudokuPack = officialPacks.find(p => p.id === 'sudoku-family');
      expect(sudokuPack).toBeDefined();
      expect(sudokuPack.categories).toContain('Sudoku Family');
    });

    it('should have an international-words pack with includeGames', () => {
      const intlPack = officialPacks.find(p => p.id === 'international-words');
      expect(intlPack).toBeDefined();
      expect(intlPack.includeGames).toContain('shiritori');
      expect(intlPack.categories).toEqual([]);
    });

    it('word-games pack should exclude shiritori', () => {
      const wordPack = officialPacks.find(p => p.id === 'word-games');
      expect(wordPack.excludeGames).toContain('shiritori');
    });

    it('all packs should have required fields', () => {
      for (const pack of officialPacks) {
        expect(pack.id).toBeDefined();
        expect(pack.name).toBeDefined();
        expect(pack.description).toBeDefined();
        expect(pack.icon).toBeDefined();
        expect(pack.categories).toBeDefined();
        expect(Array.isArray(pack.categories)).toBe(true);
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

    it('should return undefined for unknown ID', () => {
      const pack = getPackageById('nonexistent');
      expect(pack).toBeUndefined();
    });
  });

  describe('getPackageCategories', () => {
    it('should return categories for a valid pack', () => {
      const cats = getPackageCategories('word-games');
      expect(Array.isArray(cats)).toBe(true);
      expect(cats.length).toBeGreaterThan(0);
    });

    it('should return empty array for pack with only includeGames', () => {
      const cats = getPackageCategories('international-words');
      expect(cats).toEqual([]);
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
    it('should count games in the word-games pack', () => {
      const count = countGamesInPack('word-games', categories);
      expect(count).toBeGreaterThan(10);
    });

    it('should count games in sudoku-family pack', () => {
      const count = countGamesInPack('sudoku-family', categories);
      expect(count).toBeGreaterThan(5);
    });

    it('should count includeGames in international-words pack', () => {
      const count = countGamesInPack('international-words', categories);
      expect(count).toBe(1); // Just shiritori
    });

    it('should return 0 for invalid pack', () => {
      const count = countGamesInPack('nonexistent', categories);
      expect(count).toBe(0);
    });

    it('should exclude games listed in excludeGames', () => {
      // word-games excludes shiritori from Word Formation
      const wordGamesCount = countGamesInPack('word-games', categories);

      // Get total count of games in the categories without exclusions
      const wordPack = getPackageById('word-games');
      let totalWithoutExclusion = 0;
      for (const cat of categories) {
        if (wordPack.categories.includes(cat.name)) {
          totalWithoutExclusion += cat.games.length;
        }
      }

      // The count should be less because shiritori is excluded
      expect(wordGamesCount).toBe(totalWithoutExclusion - 1);
    });
  });

  describe('getPackagePreviewGames', () => {
    it('should return preview games for a pack', () => {
      const games = getPackagePreviewGames('word-games', categories, 4);
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

    it('should return included games for international-words', () => {
      const games = getPackagePreviewGames('international-words', categories, 4);
      expect(games.some(g => g.slug === 'shiritori')).toBe(true);
    });

    it('should return empty array for invalid pack', () => {
      const games = getPackagePreviewGames('nonexistent', categories);
      expect(games).toEqual([]);
    });
  });

  describe('getFilteredCategories', () => {
    it('should filter categories based on installed packages', () => {
      const filtered = getFilteredCategories(['sudoku-family'], categories);
      expect(filtered.length).toBe(1);
      expect(filtered[0].name).toBe('Sudoku Family');
    });

    it('should return empty for no installed packages', () => {
      const filtered = getFilteredCategories([], categories);
      expect(filtered.length).toBe(0);
    });

    it('should include games from includeGames', () => {
      const filtered = getFilteredCategories(['international-words'], categories);
      // Should have one category (Word Formation) with just shiritori
      expect(filtered.length).toBe(1);
      expect(filtered[0].games.some(g => g.slug === 'shiritori')).toBe(true);
    });

    it('should exclude games from excludeGames', () => {
      const filtered = getFilteredCategories(['word-games'], categories);
      const wordFormation = filtered.find(c => c.name === 'Word Formation');
      // shiritori should NOT be in the filtered Word Formation
      expect(wordFormation.games.some(g => g.slug === 'shiritori')).toBe(false);
    });

    it('should handle both include and exclude correctly', () => {
      // If both word-games and international-words are installed,
      // shiritori should appear (included by international-words)
      const filtered = getFilteredCategories(['word-games', 'international-words'], categories);
      const wordFormation = filtered.find(c => c.name === 'Word Formation');
      // shiritori is excluded by word-games BUT included by international-words
      // Since includeGames adds it explicitly, it should appear
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

    it('should return games with categoryName attached', () => {
      const games = getGamesForPackages(['sudoku-family'], categories);
      for (const game of games) {
        expect(game.categoryName).toBe('Sudoku Family');
      }
    });
  });

  describe('category mapping', () => {
    it('all categories referenced in packs should exist in gameRegistry', () => {
      const registryCategoryNames = categories.map(c => c.name);

      for (const pack of officialPacks) {
        for (const catName of pack.categories) {
          expect(registryCategoryNames).toContain(catName);
        }
      }
    });

    it('all categories in gameRegistry should be covered by some pack', () => {
      const allPackCategories = new Set();
      for (const pack of officialPacks) {
        pack.categories.forEach(c => allPackCategories.add(c));
      }

      for (const category of categories) {
        expect(allPackCategories.has(category.name)).toBe(true);
      }
    });

    it('all games referenced in includeGames should exist', () => {
      const allGameSlugs = categories.flatMap(c => c.games.map(g => g.slug));

      for (const pack of officialPacks) {
        for (const slug of pack.includeGames || []) {
          expect(allGameSlugs).toContain(slug);
        }
      }
    });

    it('all games referenced in excludeGames should exist', () => {
      const allGameSlugs = categories.flatMap(c => c.games.map(g => g.slug));

      for (const pack of officialPacks) {
        for (const slug of pack.excludeGames || []) {
          expect(allGameSlugs).toContain(slug);
        }
      }
    });
  });
});
