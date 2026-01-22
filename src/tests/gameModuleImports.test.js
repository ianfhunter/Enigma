import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ===========================================
// Game Module Import Tests
//
// These tests verify that game modules can be imported
// without throwing errors. This catches:
// - Syntax errors
// - Missing dependencies
// - Invalid imports
// - Module resolution issues
// ===========================================

// List of all game modules to test
// Each entry maps slug to folder name
const GAME_MODULES = {
  'abc-end-view': 'ABCEndView',
  'anagrams': 'Anagrams',
  'anatomy-quiz': 'AnatomyQuiz',
  'aquarium': 'Aquarium',
  'bag': 'Bag',
  'blackbox': 'Blackbox',
  'calcudoku': 'Calcudoku',
  'campixu': 'Campixu',
  'capital-guesser': 'CapitalGuesser',
  'chess-maze': 'ChessMaze',
  'chess-puzzle': 'ChessPuzzle',
  'classical-music-quiz': 'ClassicalMusicQuiz',
  'national-anthem-quiz': 'NationalAnthemQuiz',
  'code-breaker': 'CodeBreaker',
  'color-cube': 'ColorCube',
  'categories': 'Categories',
  'constellations': 'Constellations',
  'conundrum': 'Conundrum',
  'countdown-letters': 'CountdownLetters',
  'countdown-math': 'CountdownMath',
  'creek': 'Creek',
  'crossword': 'Crossword',
  'cryptogram': 'Cryptogram',
  'cube': 'Cube',
  'currency-quiz': 'CurrencyQuiz',
  'dominosa': 'Dominosa',
  'drop-quotes': 'DropQuotes',
  'einstein': 'Einstein',
  'entanglement': 'Entanglement',
  'famous-paintings': 'FamousPaintings',
  'fifteen': 'Fifteen',
  'fillomino': 'Fillomino',
  'flag-guesser': 'FlagGuesser',
  'flipquotes': 'FlipQuotes',
  'flood-it': 'FloodIt',
  'futoshiki': 'Futoshiki',
  'galaxies': 'Galaxies',
  'gods-quiz': 'GodsQuiz',
  'gokigen-naname': 'GokigenNaname',
  'hangman': 'Hangman',
  'hashi': 'Hashi',
  'hidato': 'Hidato',
  'hitori': 'Hitori',
  'hotaru-beam': 'HotaruBeam',
  'inertia': 'Inertia',
  'inshi-no-heya': 'InshiNoHeya',
  'japanese-sums': 'JapaneseSums',
  'jigsaw': 'Jigsaw',
  'kakuro': 'Kakuro',
  'killer-sudoku': 'KillerSudoku',
  'knights-and-knaves': 'KnightsAndKnaves',
  'knights-tour': 'KnightsTour',
  'kropki': 'Kropki',
  'kurotto': 'Kurotto',
  'language-quiz': 'LanguageQuiz',
  'letter-web': 'LetterWeb',
  'letter-orbit': 'LetterOrbit',
  'lights-out': 'LightsOut',
  'lightup': 'Lightup',
  'lits': 'LITS',
  'loopy': 'Loopy',
  'magnets': 'Magnets',
  'map': 'Map',
  'maze': 'Maze',
  'memory-match': 'MemoryMatch',
  'chimp-test': 'ChimpTest',
  'memorize-items': 'MemorizeItems',
  'minesweeper': 'Minesweeper',
  'mochikoro': 'Mochikoro',
  'mosaic': 'Mosaic',
  'netgame': 'Netgame',
  'netslide': 'Netslide',
  'nonogram': 'Nonogram',
  'n-queens': 'NQueens',
  'numberlink': 'Numberlink',
  'nurikabe': 'Nurikabe',
  'pearl': 'Pearl',
  'pegs': 'Pegs',
  'pentomino': 'Pentomino',
  'periodic-table-quiz': 'PeriodicTableQuiz',
  'phrase-guess': 'PhraseGuess',
  'pipe-puzzle': 'PipePuzzle',
  'pokemon-gen-blitz': 'PokemonGenBlitz',
  'pokemon-quiz': 'PokemonQuiz',
  'provincial-map-fill': 'ProvincialMapFill',
  'pyramid': 'Pyramid',
  'pyramid-cards': 'PyramidCards',
  'riddles': 'Riddles',
  'range': 'Range',
  'ripple-effect': 'RippleEffect',
  'samegame': 'Samegame',
  'sandwich-sudoku': 'SandwichSudoku',
  'sequence': 'Sequence',
  'shakashaka': 'Shakashaka',
  'shikaku': 'Shikaku',
  'shinro': 'Shinro',
  'naval-battle': 'NavalBattle',
  'norinori': 'Norinori',
  'shiritori': 'Shiritori',
  'signpost': 'Signpost',
  'sixteen': 'Sixteen',
  'skyscraper': 'Skyscraper',
  'slant': 'Slant',
  'sliding-puzzle': 'SlidingPuzzle',
  'congestion': 'Congestion',
  'sokoban': 'Sokoban',
  'stained-glass': 'StainedGlass',
  'star-battle': 'StarBattle',
  'str8ts': 'Str8ts',
  'threads': 'Threads',
  'sudoku': 'Sudoku',
  'suguru': 'Suguru',
  'sujiko': 'Sujiko',
  'suko': 'Suko',
  'takuzu': 'Takuzu',
  'tapa': 'Tapa',
  'cirkitz': 'Cirkitz',
  'tatamibari': 'Tatamibari',
  'thermometers': 'Thermometers',
  'theseus-minotaur': 'TheseusMinotaur',
  'tile-swap': 'TileSwap',
  'tower-of-hanoi': 'TowerOfHanoi',
  'tracks': 'Tracks',
  'tri-peaks': 'TriPeaks',
  'trivia': 'Trivia',
  'twiddle': 'Twiddle',
  'undead': 'Undead',
  'untangle': 'Untangle',
  'squarish': 'Squarish',
  'water-pouring': 'WaterPouring',
  'word-arithmetic': 'WordArithmetic',
  'wordguess': 'WordGuess',
  'longest-word': 'LongestWord',
  'word-ladder': 'WordLadder',
  'word-search': 'WordSearch',
  'word-shuffle': 'WordShuffle',
  'word-snake': 'WordSnake',
  'word-tiles': 'WordTiles',
  'word-wheel': 'WordWheel',
  'world-map-fill': 'WorldMapFill',
  'yajilin': 'Yajilin',
  'yin-yang': 'YinYang',
  'eulero': 'Eulero',
};

// Mock browser APIs that games might use at import time
let mockStorage = {};
beforeEach(() => {
  mockStorage = {};

  // Mock localStorage
  vi.stubGlobal('localStorage', {
    getItem: vi.fn((key) => mockStorage[key] || null),
    setItem: vi.fn((key, value) => { mockStorage[key] = value; }),
    removeItem: vi.fn((key) => { delete mockStorage[key]; }),
    clear: vi.fn(() => { mockStorage = {}; }),
  });

  // Mock sessionStorage
  vi.stubGlobal('sessionStorage', {
    getItem: vi.fn((key) => null),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  });

  // Mock matchMedia
  vi.stubGlobal('matchMedia', vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })));

  // Mock Audio
  vi.stubGlobal('Audio', vi.fn().mockImplementation(() => ({
    play: vi.fn().mockResolvedValue(undefined),
    pause: vi.fn(),
    volume: 1,
    currentTime: 0,
  })));

  // Mock ResizeObserver
  vi.stubGlobal('ResizeObserver', vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  })));

  // Mock IntersectionObserver
  vi.stubGlobal('IntersectionObserver', vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  })));

  // Mock fetch for games that might fetch data
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
    ok: true,
    json: vi.fn().mockResolvedValue({}),
    text: vi.fn().mockResolvedValue(''),
  }));
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.resetAllMocks();
});

// ===========================================
// Dynamic Import Tests - Verify No Import Errors
// ===========================================
describe('Game Module Imports - No Import Errors', () => {
  // Test a selection of games to verify imports work
  // We test a representative sample to keep test time reasonable

  const SAMPLE_GAMES = [
    'Sudoku',
    'Minesweeper',
    'Nonogram',
    'Kakuro',
    'Takuzu',
    'Hitori',
    'Slant',
  ];

  for (const folder of SAMPLE_GAMES) {
    // Nonogram loads many images at import time, so needs more time
    const timeout = folder === 'Nonogram' ? 15000 : 5000;

    it(`should import ${folder} without errors`, async () => {
      // Dynamic import the game module
      const importPromise = import(`../pages/${folder}/index.js`);

      // Should not throw during import
      await expect(importPromise).resolves.toBeDefined();

      // Should have a default export (the component)
      const module = await importPromise;
      expect(module.default).toBeDefined();
    }, timeout);
  }
});

// ===========================================
// useGameState Hook Import Test
// ===========================================
describe('useGameState Hook - Import and Initial Values', () => {
  it('should export useGameState hook', async () => {
    const module = await import('../hooks/useGameState.js');
    expect(module.useGameState).toBeDefined();
    expect(typeof module.useGameState).toBe('function');
  });
});

// ===========================================
// GameResult Component Import Test
// ===========================================
describe('GameResult Component - Import Test', () => {
  it('should export GameResult component', async () => {
    const module = await import('../components/GameResult/GameResult.jsx');
    expect(module.default).toBeDefined();
  });
});

// ===========================================
// GiveUpButton Component Import Test
// ===========================================
describe('GiveUpButton Component - Import Test', () => {
  it('should export GiveUpButton component', async () => {
    const module = await import('../components/GiveUpButton/GiveUpButton.jsx');
    expect(module.default).toBeDefined();
  });
});

// ===========================================
// Game Registry - All Games Defined
// ===========================================
describe('Game Registry - Games Are Defined', () => {
  it('should export allGames array', async () => {
    const module = await import('../data/gameRegistry.js');
    expect(module.allGames).toBeDefined();
    expect(Array.isArray(module.allGames)).toBe(true);
    expect(module.allGames.length).toBeGreaterThan(0);
  });

  it('should have games with required properties', async () => {
    const module = await import('../data/gameRegistry.js');

    for (const game of module.allGames.slice(0, 10)) { // Test first 10
      expect(game.slug).toBeDefined();
      expect(typeof game.slug).toBe('string');
      expect(game.title).toBeDefined();
    }
  });

  it('should not have duplicate slugs', async () => {
    const module = await import('../data/gameRegistry.js');
    const slugs = module.allGames.map(g => g.slug);
    const uniqueSlugs = new Set(slugs);
    expect(slugs.length).toBe(uniqueSlugs.size);
  });
});

// ===========================================
// Utility Imports - Generator Utils
// ===========================================
describe('Generator Utils - Import Test', () => {
  it('should export grid creation utilities', async () => {
    const module = await import('../utils/generatorUtils.js');
    expect(module.createGrid).toBeDefined();
    expect(module.cloneGrid).toBeDefined();
  });
});

// ===========================================
// Word Utils - Import Test
// ===========================================
describe('Word Utils - Import Test', () => {
  it('should export seeding utilities', async () => {
    const module = await import('../data/wordUtils.js');
    expect(module.createSeededRandom).toBeDefined();
    expect(module.stringToSeed).toBeDefined();
    expect(module.getTodayDateString).toBeDefined();
  });
});
