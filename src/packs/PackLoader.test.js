import { describe, it, expect } from 'vitest';
import {
  getGamesForPack,
  getCategoriesForPack,
  getGamesForPackages,
  getCategoriesForPackages,
  getGameBySlug,
  getGameComponent,
  countGamesInPack,
  getPackPreviewGames,
  isGameInPacks,
} from './PackLoader';
import { isManifestPack, getPackageById } from './registry';
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

describe('PackLoader', () => {
  describe('manifest pack detection', () => {
    it('should identify word-games as a manifest pack', () => {
      expect(isManifestPack('word-games')).toBe(true);
    });

    it('should identify trivia-knowledge as a manifest pack', () => {
      expect(isManifestPack('trivia-knowledge')).toBe(true);
    });

    it('should return false for non-existent pack', () => {
      expect(isManifestPack('nonexistent')).toBe(false);
    });
  });

  describe('getGamesForPack', () => {
    it('should return games from manifest pack (word-games)', () => {
      const games = getGamesForPack('word-games');
      expect(games.length).toBeGreaterThan(20);
      expect(games.some(g => g.slug === 'wordguess')).toBe(true);
      expect(games.some(g => g.slug === 'crossword')).toBe(true);
      expect(games.some(g => g.slug === 'cryptogram')).toBe(true);
    });

    it('should return games from manifest pack (trivia-knowledge)', () => {
      const games = getGamesForPack('trivia-knowledge');
      expect(games.length).toBe(17);
      expect(games.some(g => g.slug === 'flag-guesser')).toBe(true);
      expect(games.some(g => g.slug === 'trivia')).toBe(true);
    });

    it('should return empty array for invalid pack', () => {
      const games = getGamesForPack('nonexistent');
      expect(games).toEqual([]);
    });

    it('should include categoryName for each game', () => {
      const games = getGamesForPack('word-games');
      for (const game of games) {
        expect(game.categoryName).toBeDefined();
      }
    });

    it('manifest pack games should have component loaders', () => {
      const games = getGamesForPack('word-games');
      const wordguess = games.find(g => g.slug === 'wordguess');
      expect(wordguess.component).toBeDefined();
      expect(typeof wordguess.component).toBe('function');
    });
  });

  describe('getCategoriesForPack', () => {
    it('should return categories from manifest pack', () => {
      const categories = getCategoriesForPack('word-games');
      expect(categories.length).toBe(3); // Word Formation, Word Grids, Cipher & Decode
      expect(categories.some(c => c.name === 'Word Formation')).toBe(true);
      expect(categories.some(c => c.name === 'Word Grids')).toBe(true);
      expect(categories.some(c => c.name === 'Cipher & Decode')).toBe(true);
    });

    it('should return categories from legacy pack', () => {
      const categories = getCategoriesForPack('sudoku-family');
      expect(categories.length).toBe(1);
      expect(categories[0].name).toBe('Sudoku Family');
    });

    it('should return empty array for invalid pack', () => {
      const categories = getCategoriesForPack('nonexistent');
      expect(categories).toEqual([]);
    });

    it('each category should have games', () => {
      const categories = getCategoriesForPack('word-games');
      for (const category of categories) {
        expect(category.games.length).toBeGreaterThan(0);
      }
    });
  });

  describe('getGamesForPackages', () => {
    it('should combine games from multiple packs', () => {
      const games = getGamesForPackages(['word-games', 'sudoku-family']);
      expect(games.some(g => g.slug === 'wordguess')).toBe(true);
      expect(games.some(g => g.slug === 'sudoku')).toBe(true);
    });

    it('should deduplicate games by slug', () => {
      const games = getGamesForPackages(['word-games', 'word-games']);
      const slugs = games.map(g => g.slug);
      const uniqueSlugs = [...new Set(slugs)];
      expect(slugs.length).toBe(uniqueSlugs.length);
    });

    it('should attach packId to each game', () => {
      const games = getGamesForPackages(['word-games', 'sudoku-family']);
      for (const game of games) {
        expect(game.packId).toBeDefined();
      }
    });

    it('should return empty array for empty input', () => {
      const games = getGamesForPackages([]);
      expect(games).toEqual([]);
    });
  });

  describe('getCategoriesForPackages', () => {
    it('should combine categories from multiple packs', () => {
      const categories = getCategoriesForPackages(['word-games', 'sudoku-family']);
      expect(categories.some(c => c.name === 'Word Formation')).toBe(true);
      expect(categories.some(c => c.name === 'Sudoku Family')).toBe(true);
    });

    it('should merge games from same category', () => {
      // If two packs reference the same category, games should be merged
      const categories = getCategoriesForPackages(['word-games']);
      const wordFormation = categories.find(c => c.name === 'Word Formation');
      expect(wordFormation.games.length).toBeGreaterThan(5);
    });

    it('should return empty array for empty input', () => {
      const categories = getCategoriesForPackages([]);
      expect(categories).toEqual([]);
    });
  });

  describe('getGameBySlug', () => {
    it('should find a game from manifest pack', () => {
      const game = getGameBySlug('wordguess', ['word-games']);
      expect(game).toBeDefined();
      expect(game.title).toBe('WordGuess');
      expect(game.packId).toBe('word-games');
    });

    it('should find a game from trivia-knowledge manifest pack', () => {
      const game = getGameBySlug('flag-guesser', ['trivia-knowledge']);
      expect(game).toBeDefined();
      expect(game.title).toBe('Flag Guesser');
      expect(game.packId).toBe('trivia-knowledge');
    });

    it('should return null for game not in installed packs', () => {
      const game = getGameBySlug('wordguess', ['sudoku-family']);
      expect(game).toBeNull();
    });

    it('should return null for non-existent slug', () => {
      const game = getGameBySlug('nonexistent', ['word-games']);
      expect(game).toBeNull();
    });
  });

  describe('getGameComponent', () => {
    it('should return component loader for manifest pack game', () => {
      const component = getGameComponent('wordguess', ['word-games']);
      expect(component).toBeDefined();
      expect(typeof component).toBe('function');
    });

    it('should return component loader for trivia-knowledge manifest pack game', () => {
      const component = getGameComponent('flag-guesser', ['trivia-knowledge']);
      expect(component).toBeDefined();
      expect(typeof component).toBe('function');
    });

    it('should return null for non-existent game', () => {
      const component = getGameComponent('nonexistent', ['word-games']);
      expect(component).toBeNull();
    });
  });

  describe('countGamesInPack', () => {
    it('should count games in manifest pack', () => {
      const count = countGamesInPack('word-games');
      expect(count).toBe(wordGamesPack.gameCount);
      expect(count).toBeGreaterThan(20);
    });

    it('should count games in legacy pack', () => {
      const count = countGamesInPack('sudoku-family');
      expect(count).toBeGreaterThan(5);
    });

    it('should return 0 for invalid pack', () => {
      const count = countGamesInPack('nonexistent');
      expect(count).toBe(0);
    });
  });

  describe('getPackPreviewGames', () => {
    it('should return limited preview games', () => {
      const preview = getPackPreviewGames('word-games', 4);
      expect(preview.length).toBe(4);
    });

    it('should return all games if limit exceeds total', () => {
      const preview = getPackPreviewGames('international-words', 10);
      expect(preview.length).toBeLessThanOrEqual(10);
    });

    it('should return games with required properties', () => {
      const preview = getPackPreviewGames('word-games', 3);
      for (const game of preview) {
        expect(game.title).toBeDefined();
        expect(game.slug).toBeDefined();
      }
    });

    it('should return empty array for invalid pack', () => {
      const preview = getPackPreviewGames('nonexistent', 4);
      expect(preview).toEqual([]);
    });
  });

  describe('isGameInPacks', () => {
    it('should return true for game in manifest pack', () => {
      expect(isGameInPacks('wordguess', ['word-games'])).toBe(true);
    });

    it('should return true for game in trivia-knowledge manifest pack', () => {
      expect(isGameInPacks('flag-guesser', ['trivia-knowledge'])).toBe(true);
    });

    it('should return false for game not in packs', () => {
      expect(isGameInPacks('wordguess', ['sudoku-family'])).toBe(false);
    });

    it('should return false for non-existent game', () => {
      expect(isGameInPacks('nonexistent', ['word-games'])).toBe(false);
    });
  });

  describe('word-games manifest pack structure', () => {
    it('should have correct pack info', () => {
      expect(wordGamesPack.id).toBe('word-games');
      expect(wordGamesPack.name).toBe('Word Games');
      expect(wordGamesPack.type).toBe('official');
      expect(wordGamesPack.default).toBe(true);
      expect(wordGamesPack.removable).toBe(true);
    });

    it('should have version field', () => {
      expect(wordGamesPack.version).toBeDefined();
    });

    it('should have 3 categories', () => {
      expect(wordGamesPack.categories.length).toBe(3);
    });

    it('should have allGames flat list', () => {
      expect(Array.isArray(wordGamesPack.allGames)).toBe(true);
      expect(wordGamesPack.allGames.length).toBe(wordGamesPack.gameCount);
    });

    it('should have getGameBySlug function', () => {
      const game = wordGamesPack.getGameBySlug('crossword');
      expect(game).toBeDefined();
      expect(game.title).toBe('Crossword');
    });

    it('all games should have required fields', () => {
      for (const game of wordGamesPack.allGames) {
        expect(game.title).toBeDefined();
        expect(game.slug).toBeDefined();
        expect(game.description).toBeDefined();
        expect(game.icon).toBeDefined();
        expect(game.colors).toBeDefined();
        expect(game.gradient).toBeDefined();
        expect(game.component).toBeDefined();
        expect(game.categoryName).toBeDefined();
      }
    });
  });

  describe('shading-puzzles manifest pack structure', () => {
    it('should identify shading-puzzles as a manifest pack', () => {
      expect(isManifestPack('shading-puzzles')).toBe(true);
    });

    it('should have correct pack info', () => {
      expect(shadingPuzzlesPack.id).toBe('shading-puzzles');
      expect(shadingPuzzlesPack.name).toBe('Shading Puzzles');
      expect(shadingPuzzlesPack.type).toBe('official');
      expect(shadingPuzzlesPack.default).toBe(true);
      expect(shadingPuzzlesPack.removable).toBe(true);
    });

    it('should have version field', () => {
      expect(shadingPuzzlesPack.version).toBeDefined();
    });

    it('should have 1 category (Grid Shading)', () => {
      expect(shadingPuzzlesPack.categories.length).toBe(1);
      expect(shadingPuzzlesPack.categories[0].name).toBe('Grid Shading');
    });

    it('should have 17 games', () => {
      expect(shadingPuzzlesPack.gameCount).toBe(17);
      expect(shadingPuzzlesPack.allGames.length).toBe(17);
    });

    it('should have expected games', () => {
      const slugs = shadingPuzzlesPack.allGames.map(g => g.slug);
      expect(slugs).toContain('nonogram');
      expect(slugs).toContain('minesweeper');
      expect(slugs).toContain('nurikabe');
      expect(slugs).toContain('hitori');
      expect(slugs).toContain('star-battle');
      expect(slugs).toContain('yin-yang');
      expect(slugs).toContain('lights-out');
      expect(slugs).toContain('lightup');
      expect(slugs).toContain('mosaic');
    });

    it('should have getGameBySlug function', () => {
      const game = shadingPuzzlesPack.getGameBySlug('nonogram');
      expect(game).toBeDefined();
      expect(game.title).toBe('Nonogram');
    });

    it('all games should have required fields', () => {
      for (const game of shadingPuzzlesPack.allGames) {
        expect(game.title).toBeDefined();
        expect(game.slug).toBeDefined();
        expect(game.description).toBeDefined();
        expect(game.icon).toBeDefined();
        expect(game.colors).toBeDefined();
        expect(game.gradient).toBeDefined();
        expect(game.component).toBeDefined();
        expect(game.categoryName).toBe('Grid Shading');
      }
    });

    it('should return games via PackLoader', () => {
      const games = getGamesForPack('shading-puzzles');
      expect(games.length).toBe(17);
      expect(games.some(g => g.slug === 'nonogram')).toBe(true);
      expect(games.some(g => g.slug === 'minesweeper')).toBe(true);
    });

    it('should return component loaders', () => {
      const component = getGameComponent('nonogram', ['shading-puzzles']);
      expect(component).toBeDefined();
      expect(typeof component).toBe('function');
    });
  });

  describe('paths-regions manifest pack structure', () => {
    it('should identify paths-regions as a manifest pack', () => {
      expect(isManifestPack('paths-regions')).toBe(true);
    });

    it('should have correct pack info', () => {
      expect(pathsRegionsPack.id).toBe('paths-regions');
      expect(pathsRegionsPack.name).toBe('Paths & Regions');
      expect(pathsRegionsPack.type).toBe('official');
      expect(pathsRegionsPack.default).toBe(true);
      expect(pathsRegionsPack.removable).toBe(true);
    });

    it('should have version field', () => {
      expect(pathsRegionsPack.version).toBeDefined();
    });

    it('should have 2 categories', () => {
      expect(pathsRegionsPack.categories.length).toBe(2);
      expect(pathsRegionsPack.categories[0].name).toBe('Loop & Path');
      expect(pathsRegionsPack.categories[1].name).toBe('Region Division');
    });

    it('should have 22 games total (13 + 9)', () => {
      expect(pathsRegionsPack.gameCount).toBe(22);
      expect(pathsRegionsPack.allGames.length).toBe(22);
    });

    it('should have expected Loop & Path games', () => {
      const slugs = pathsRegionsPack.allGames.map(g => g.slug);
      expect(slugs).toContain('numberlink');
      expect(slugs).toContain('hashi');
      expect(slugs).toContain('loopy');
      expect(slugs).toContain('pearl');
      expect(slugs).toContain('maze');
      expect(slugs).toContain('hidato');
    });

    it('should have expected Region Division games', () => {
      const slugs = pathsRegionsPack.allGames.map(g => g.slug);
      expect(slugs).toContain('shikaku');
      expect(slugs).toContain('fillomino');
      expect(slugs).toContain('galaxies');
      expect(slugs).toContain('lits');
      expect(slugs).toContain('suguru');
    });

    it('should have getGameBySlug function', () => {
      const game = pathsRegionsPack.getGameBySlug('hashi');
      expect(game).toBeDefined();
      expect(game.title).toBe('Hashi');
    });

    it('all games should have required fields', () => {
      for (const game of pathsRegionsPack.allGames) {
        expect(game.title).toBeDefined();
        expect(game.slug).toBeDefined();
        expect(game.description).toBeDefined();
        expect(game.icon).toBeDefined();
        expect(game.colors).toBeDefined();
        expect(game.gradient).toBeDefined();
        expect(game.component).toBeDefined();
        expect(game.categoryName).toBeDefined();
      }
    });

    it('should return games via PackLoader', () => {
      const games = getGamesForPack('paths-regions');
      expect(games.length).toBe(22);
      expect(games.some(g => g.slug === 'numberlink')).toBe(true);
      expect(games.some(g => g.slug === 'shikaku')).toBe(true);
    });

    it('should return component loaders', () => {
      const component = getGameComponent('hashi', ['paths-regions']);
      expect(component).toBeDefined();
      expect(typeof component).toBe('function');
    });
  });

  describe('spatial-tiles manifest pack structure', () => {
    it('should identify spatial-tiles as a manifest pack', () => {
      expect(isManifestPack('spatial-tiles')).toBe(true);
    });

    it('should have correct pack info', () => {
      expect(spatialTilesPack.id).toBe('spatial-tiles');
      expect(spatialTilesPack.name).toBe('Spatial & Tiles');
      expect(spatialTilesPack.type).toBe('official');
      expect(spatialTilesPack.default).toBe(true);
      expect(spatialTilesPack.removable).toBe(true);
    });

    it('should have version field', () => {
      expect(spatialTilesPack.version).toBeDefined();
    });

    it('should have 1 category (Tile & Spatial)', () => {
      expect(spatialTilesPack.categories.length).toBe(1);
      expect(spatialTilesPack.categories[0].name).toBe('Tile & Spatial');
    });

    it('should have 20 games', () => {
      expect(spatialTilesPack.gameCount).toBe(20);
      expect(spatialTilesPack.allGames.length).toBe(20);
    });

    it('should have expected games', () => {
      const slugs = spatialTilesPack.allGames.map(g => g.slug);
      expect(slugs).toContain('jigsaw');
      expect(slugs).toContain('sliding-puzzle');
      expect(slugs).toContain('congestion');
      expect(slugs).toContain('cirkitz');
      expect(slugs).toContain('pipe-puzzle');
      expect(slugs).toContain('tower-of-hanoi');
      expect(slugs).toContain('fifteen');
      expect(slugs).toContain('untangle');
      expect(slugs).toContain('samegame');
    });

    it('should have getGameBySlug function', () => {
      const game = spatialTilesPack.getGameBySlug('jigsaw');
      expect(game).toBeDefined();
      expect(game.title).toBe('Jigsaw');
    });

    it('all games should have required fields', () => {
      for (const game of spatialTilesPack.allGames) {
        expect(game.title).toBeDefined();
        expect(game.slug).toBeDefined();
        expect(game.description).toBeDefined();
        expect(game.icon).toBeDefined();
        expect(game.colors).toBeDefined();
        expect(game.gradient).toBeDefined();
        expect(game.component).toBeDefined();
        expect(game.categoryName).toBe('Tile & Spatial');
      }
    });

    it('should return games via PackLoader', () => {
      const games = getGamesForPack('spatial-tiles');
      expect(games.length).toBe(20);
      expect(games.some(g => g.slug === 'jigsaw')).toBe(true);
      expect(games.some(g => g.slug === 'pipe-puzzle')).toBe(true);
    });

    it('should return component loaders', () => {
      const component = getGameComponent('jigsaw', ['spatial-tiles']);
      expect(component).toBeDefined();
      expect(typeof component).toBe('function');
    });
  });

  describe('strategy-movement manifest pack structure', () => {
    it('should identify strategy-movement as a manifest pack', () => {
      expect(isManifestPack('strategy-movement')).toBe(true);
    });

    it('should have correct pack info', () => {
      expect(strategyMovementPack.id).toBe('strategy-movement');
      expect(strategyMovementPack.name).toBe('Strategy & Movement');
      expect(strategyMovementPack.type).toBe('official');
      expect(strategyMovementPack.default).toBe(true);
      expect(strategyMovementPack.removable).toBe(true);
    });

    it('should have version field', () => {
      expect(strategyMovementPack.version).toBeDefined();
    });

    it('should have 1 category (Chess & Movement)', () => {
      expect(strategyMovementPack.categories.length).toBe(1);
      expect(strategyMovementPack.categories[0].name).toBe('Chess & Movement');
    });

    it('should have 8 games', () => {
      expect(strategyMovementPack.gameCount).toBe(8);
      expect(strategyMovementPack.allGames.length).toBe(8);
    });

    it('should have expected games', () => {
      const slugs = strategyMovementPack.allGames.map(g => g.slug);
      expect(slugs).toContain('chess-puzzle');
      expect(slugs).toContain('knights-tour');
      expect(slugs).toContain('n-queens');
      expect(slugs).toContain('chess-maze');
      expect(slugs).toContain('sokoban');
      expect(slugs).toContain('pegs');
      expect(slugs).toContain('inertia');
    });

    it('should have getGameBySlug function', () => {
      const game = strategyMovementPack.getGameBySlug('sokoban');
      expect(game).toBeDefined();
      expect(game.title).toBe('Sokoban');
    });

    it('all games should have required fields', () => {
      for (const game of strategyMovementPack.allGames) {
        expect(game.title).toBeDefined();
        expect(game.slug).toBeDefined();
        expect(game.description).toBeDefined();
        expect(game.icon).toBeDefined();
        expect(game.colors).toBeDefined();
        expect(game.gradient).toBeDefined();
        expect(game.component).toBeDefined();
        expect(game.categoryName).toBe('Chess & Movement');
      }
    });

    it('should return games via PackLoader', () => {
      const games = getGamesForPack('strategy-movement');
      expect(games.length).toBe(8);
      expect(games.some(g => g.slug === 'chess-puzzle')).toBe(true);
      expect(games.some(g => g.slug === 'sokoban')).toBe(true);
    });

    it('should return component loaders', () => {
      const component = getGameComponent('sokoban', ['strategy-movement']);
      expect(component).toBeDefined();
      expect(typeof component).toBe('function');
    });
  });

  describe('classic-logic manifest pack structure', () => {
    it('should identify classic-logic as a manifest pack', () => {
      expect(isManifestPack('classic-logic')).toBe(true);
    });

    it('should have correct pack info', () => {
      expect(classicLogicPack.id).toBe('classic-logic');
      expect(classicLogicPack.name).toBe('Classic Logic');
      expect(classicLogicPack.type).toBe('official');
      expect(classicLogicPack.default).toBe(true);
      expect(classicLogicPack.removable).toBe(true);
    });

    it('should have version field', () => {
      expect(classicLogicPack.version).toBeDefined();
    });

    it('should have 2 categories', () => {
      expect(classicLogicPack.categories.length).toBe(2);
      expect(classicLogicPack.categories[0].name).toBe('Classic Logic');
      expect(classicLogicPack.categories[1].name).toBe('Memory & Speed');
    });

    it('should have 20 games total (16 + 4)', () => {
      expect(classicLogicPack.gameCount).toBe(20);
      expect(classicLogicPack.allGames.length).toBe(20);
    });

    it('should have expected Classic Logic games', () => {
      const slugs = classicLogicPack.allGames.map(g => g.slug);
      expect(slugs).toContain('einstein');
      expect(slugs).toContain('knights-and-knaves');
      expect(slugs).toContain('countdown-math');
      expect(slugs).toContain('water-pouring');
      expect(slugs).toContain('dominosa');
      expect(slugs).toContain('shinro');
      expect(slugs).toContain('map');
    });

    it('should have expected Memory & Speed games', () => {
      const slugs = classicLogicPack.allGames.map(g => g.slug);
      expect(slugs).toContain('sequence');
      expect(slugs).toContain('memory-match');
    });

    it('should have getGameBySlug function', () => {
      const game = classicLogicPack.getGameBySlug('einstein');
      expect(game).toBeDefined();
      expect(game.title).toBe('Einstein Puzzle');
    });

    it('all games should have required fields', () => {
      for (const game of classicLogicPack.allGames) {
        expect(game.title).toBeDefined();
        expect(game.slug).toBeDefined();
        expect(game.description).toBeDefined();
        expect(game.icon).toBeDefined();
        expect(game.colors).toBeDefined();
        expect(game.gradient).toBeDefined();
        expect(game.component).toBeDefined();
        expect(game.categoryName).toBeDefined();
      }
    });

    it('should return games via PackLoader', () => {
      const games = getGamesForPack('classic-logic');
      expect(games.length).toBe(20);
      expect(games.some(g => g.slug === 'einstein')).toBe(true);
      expect(games.some(g => g.slug === 'memory-match')).toBe(true);
    });

    it('should return component loaders', () => {
      const component = getGameComponent('einstein', ['classic-logic']);
      expect(component).toBeDefined();
      expect(typeof component).toBe('function');
    });
  });

  describe('sudoku-family manifest pack structure', () => {
    it('should identify sudoku-family as a manifest pack', () => {
      expect(isManifestPack('sudoku-family')).toBe(true);
    });

    it('should have correct pack info', () => {
      expect(sudokuFamilyPack.id).toBe('sudoku-family');
      expect(sudokuFamilyPack.name).toBe('Sudoku Family');
      expect(sudokuFamilyPack.type).toBe('official');
      expect(sudokuFamilyPack.default).toBe(true);
      expect(sudokuFamilyPack.removable).toBe(true);
    });

    it('should have version field', () => {
      expect(sudokuFamilyPack.version).toBeDefined();
    });

    it('should have 1 category (Sudoku Family)', () => {
      expect(sudokuFamilyPack.categories.length).toBe(1);
      expect(sudokuFamilyPack.categories[0].name).toBe('Sudoku Family');
    });

    it('should have 14 games', () => {
      expect(sudokuFamilyPack.gameCount).toBe(14);
      expect(sudokuFamilyPack.allGames.length).toBe(14);
    });

    it('should have expected games', () => {
      const slugs = sudokuFamilyPack.allGames.map(g => g.slug);
      expect(slugs).toContain('sudoku');
      expect(slugs).toContain('killer-sudoku');
      expect(slugs).toContain('sandwich-sudoku');
      expect(slugs).toContain('calcudoku');
      expect(slugs).toContain('kakuro');
      expect(slugs).toContain('futoshiki');
      expect(slugs).toContain('skyscraper');
    });

    it('should have getGameBySlug function', () => {
      const game = sudokuFamilyPack.getGameBySlug('sudoku');
      expect(game).toBeDefined();
      expect(game.title).toBe('Sudoku');
    });

    it('all games should have required fields', () => {
      for (const game of sudokuFamilyPack.allGames) {
        expect(game.title).toBeDefined();
        expect(game.slug).toBeDefined();
        expect(game.description).toBeDefined();
        expect(game.icon).toBeDefined();
        expect(game.colors).toBeDefined();
        expect(game.gradient).toBeDefined();
        expect(game.component).toBeDefined();
        expect(game.categoryName).toBe('Sudoku Family');
      }
    });

    it('should return games via PackLoader', () => {
      const games = getGamesForPack('sudoku-family');
      expect(games.length).toBe(14);
      expect(games.some(g => g.slug === 'sudoku')).toBe(true);
      expect(games.some(g => g.slug === 'killer-sudoku')).toBe(true);
    });

    it('should return component loaders', () => {
      const component = getGameComponent('sudoku', ['sudoku-family']);
      expect(component).toBeDefined();
      expect(typeof component).toBe('function');
    });
  });

  describe('trivia-knowledge manifest pack structure', () => {
    it('should identify trivia-knowledge as a manifest pack', () => {
      expect(isManifestPack('trivia-knowledge')).toBe(true);
    });

    it('should have correct pack info', () => {
      expect(triviaKnowledgePack.id).toBe('trivia-knowledge');
      expect(triviaKnowledgePack.name).toBe('Trivia & Knowledge');
      expect(triviaKnowledgePack.type).toBe('official');
      expect(triviaKnowledgePack.default).toBe(true);
      expect(triviaKnowledgePack.removable).toBe(true);
    });

    it('should have version field', () => {
      expect(triviaKnowledgePack.version).toBeDefined();
    });

    it('should have 1 category (Trivia & Knowledge)', () => {
      expect(triviaKnowledgePack.categories.length).toBe(1);
      expect(triviaKnowledgePack.categories[0].name).toBe('Trivia & Knowledge');
    });

    it('should have 17 games', () => {
      expect(triviaKnowledgePack.gameCount).toBe(17);
      expect(triviaKnowledgePack.allGames.length).toBe(17);
    });

    it('should have expected games', () => {
      const slugs = triviaKnowledgePack.allGames.map(g => g.slug);
      expect(slugs).toContain('flag-guesser');
      expect(slugs).toContain('capital-guesser');
      expect(slugs).toContain('world-map-fill');
      expect(slugs).toContain('trivia');
      expect(slugs).toContain('anatomy-quiz');
      expect(slugs).toContain('constellations');
      expect(slugs).toContain('pokemon-quiz');
      expect(slugs).toContain('periodic-table-quiz');
      expect(slugs).toContain('classical-music-quiz');
    });

    it('should have getGameBySlug function', () => {
      const game = triviaKnowledgePack.getGameBySlug('flag-guesser');
      expect(game).toBeDefined();
      expect(game.title).toBe('Flag Guesser');
    });

    it('all games should have required fields', () => {
      for (const game of triviaKnowledgePack.allGames) {
        expect(game.title).toBeDefined();
        expect(game.slug).toBeDefined();
        expect(game.description).toBeDefined();
        expect(game.icon).toBeDefined();
        expect(game.colors).toBeDefined();
        expect(game.gradient).toBeDefined();
        expect(game.component).toBeDefined();
        expect(game.categoryName).toBe('Trivia & Knowledge');
      }
    });

    it('should return games via PackLoader', () => {
      const games = getGamesForPack('trivia-knowledge');
      expect(games.length).toBe(17);
      expect(games.some(g => g.slug === 'flag-guesser')).toBe(true);
      expect(games.some(g => g.slug === 'trivia')).toBe(true);
    });

    it('should return component loaders', () => {
      const component = getGameComponent('flag-guesser', ['trivia-knowledge']);
      expect(component).toBeDefined();
      expect(typeof component).toBe('function');
    });
  });

  describe('international-words manifest pack structure', () => {
    it('should identify international-words as a manifest pack', () => {
      expect(isManifestPack('international-words')).toBe(true);
    });

    it('should have correct pack info', () => {
      expect(internationalWordsPack.id).toBe('international-words');
      expect(internationalWordsPack.name).toBe('International Word Games');
      expect(internationalWordsPack.type).toBe('official');
      expect(internationalWordsPack.default).toBe(true);
      expect(internationalWordsPack.removable).toBe(true);
    });

    it('should have version field', () => {
      expect(internationalWordsPack.version).toBeDefined();
    });

    it('should have 1 category (International Word Games)', () => {
      expect(internationalWordsPack.categories.length).toBe(1);
      expect(internationalWordsPack.categories[0].name).toBe('International Word Games');
    });

    it('should have 1 game (shiritori)', () => {
      expect(internationalWordsPack.gameCount).toBe(1);
      expect(internationalWordsPack.allGames.length).toBe(1);
    });

    it('should have shiritori game', () => {
      const slugs = internationalWordsPack.allGames.map(g => g.slug);
      expect(slugs).toContain('shiritori');
    });

    it('should have getGameBySlug function', () => {
      const game = internationalWordsPack.getGameBySlug('shiritori');
      expect(game).toBeDefined();
      expect(game.title).toBe('しりとり');
    });

    it('all games should have required fields', () => {
      for (const game of internationalWordsPack.allGames) {
        expect(game.title).toBeDefined();
        expect(game.slug).toBeDefined();
        expect(game.description).toBeDefined();
        expect(game.icon).toBeDefined();
        expect(game.colors).toBeDefined();
        expect(game.gradient).toBeDefined();
        expect(game.component).toBeDefined();
        expect(game.categoryName).toBe('International Word Games');
      }
    });

    it('should return games via PackLoader', () => {
      const games = getGamesForPack('international-words');
      expect(games.length).toBe(1);
      expect(games.some(g => g.slug === 'shiritori')).toBe(true);
    });

    it('should return component loaders', () => {
      const component = getGameComponent('shiritori', ['international-words']);
      expect(component).toBeDefined();
      expect(typeof component).toBe('function');
    });
  });

  describe('card-games manifest pack structure', () => {
    it('should identify card-games as a manifest pack', () => {
      expect(isManifestPack('card-games')).toBe(true);
    });

    it('should have correct pack info', () => {
      expect(cardGamesPack.id).toBe('card-games');
      expect(cardGamesPack.name).toBe('Card Games');
      expect(cardGamesPack.type).toBe('official');
      expect(cardGamesPack.default).toBe(true);
      expect(cardGamesPack.removable).toBe(true);
    });

    it('should have version field', () => {
      expect(cardGamesPack.version).toBeDefined();
    });

    it('should have 1 category (Card Games)', () => {
      expect(cardGamesPack.categories.length).toBe(1);
      expect(cardGamesPack.categories[0].name).toBe('Card Games');
    });

    it('should have 2 games (pyramid-cards and tri-peaks)', () => {
      expect(cardGamesPack.gameCount).toBe(2);
      expect(cardGamesPack.allGames.length).toBe(2);
    });

    it('should have pyramid-cards and tri-peaks games', () => {
      const slugs = cardGamesPack.allGames.map(g => g.slug);
      expect(slugs).toContain('pyramid-cards');
      expect(slugs).toContain('tri-peaks');
    });

    it('should have getGameBySlug function', () => {
      const game = cardGamesPack.getGameBySlug('pyramid-cards');
      expect(game).toBeDefined();
      expect(game.title).toBe('Pyramid Cards');
    });

    it('all games should have required fields', () => {
      for (const game of cardGamesPack.allGames) {
        expect(game.title).toBeDefined();
        expect(game.slug).toBeDefined();
        expect(game.description).toBeDefined();
        expect(game.icon).toBeDefined();
        expect(game.colors).toBeDefined();
        expect(game.gradient).toBeDefined();
        expect(game.component).toBeDefined();
        expect(game.categoryName).toBe('Card Games');
      }
    });

    it('should return games via PackLoader', () => {
      const games = getGamesForPack('card-games');
      expect(games.length).toBe(2);
      expect(games.some(g => g.slug === 'pyramid-cards')).toBe(true);
      expect(games.some(g => g.slug === 'tri-peaks')).toBe(true);
    });

    it('should return component loaders', () => {
      const component = getGameComponent('pyramid-cards', ['card-games']);
      expect(component).toBeDefined();
      expect(typeof component).toBe('function');
    });
  });

  describe('pack count', () => {
    it('should have 10 official packs', async () => {
      const { officialPacks } = await import('./registry');
      expect(officialPacks.length).toBe(10);
    });
  });
});
