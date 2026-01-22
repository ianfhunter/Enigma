import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';

// ===========================================
// Game Component Smoke Tests
//
// These tests verify that game components can be rendered
// without throwing errors. This catches:
// - Missing hook calls (e.g., useTranslation not called)
// - Undefined variable references
// - Runtime initialization errors
// - Missing context providers
//
// Unlike import tests, these actually call the component
// function to detect runtime errors.
// ===========================================

// All game modules to test (slug -> folder name)
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
  'longest-word': 'LongestWord',
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

// Mock browser APIs
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

  // Mock fetch
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
    ok: true,
    json: vi.fn().mockResolvedValue({}),
    text: vi.fn().mockResolvedValue(''),
  }));

  // Mock window.location for URL parsing
  vi.stubGlobal('location', {
    search: '',
    pathname: '/',
    href: 'http://localhost:3000/',
  });

  // Mock navigator
  vi.stubGlobal('navigator', {
    userAgent: 'vitest',
    language: 'en-US',
    languages: ['en-US', 'en'],
  });

  // Mock document APIs used by some games
  if (typeof document !== 'undefined') {
    vi.spyOn(document, 'elementFromPoint').mockReturnValue(null);
  }
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.resetAllMocks();
});

// Mock React hooks that require context providers
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key,
    i18n: {
      language: 'en',
      changeLanguage: vi.fn(),
    },
  }),
  Trans: ({ children }) => children,
  initReactI18next: {
    type: '3rdParty',
    init: vi.fn(),
  },
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    useLocation: () => ({ pathname: '/', search: '', hash: '' }),
    useParams: () => ({}),
    useSearchParams: () => [new URLSearchParams(), vi.fn()],
    Link: ({ children, to }) => React.createElement('a', { href: to }, children),
  };
});

// Mock context providers
vi.mock('../context/SettingsContext', () => ({
  useSettings: () => ({
    soundEnabled: false,
    theme: 'dark',
    toggleSound: vi.fn(),
    toggleTheme: vi.fn(),
  }),
  useTheme: () => ({
    theme: 'dark',
    setTheme: vi.fn(),
    toggleTheme: vi.fn(),
  }),
}));

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: null,
    isAuthenticated: false,
    login: vi.fn(),
    logout: vi.fn(),
  }),
}));

// ===========================================
// Smoke Tests - Verify Components Render Without Errors
// ===========================================
describe('Game Component Smoke Tests - No Runtime Errors', () => {
  const gameEntries = Object.entries(GAME_MODULES);

  // Test all games
  for (const [slug, folder] of gameEntries) {
    it(`${folder} (${slug}) should import and render without errors`, async () => {
      // Import the module
      const module = await import(`../pages/${folder}/index.js`);
      expect(module.default).toBeDefined();

      // Verify the default export is a function (React component)
      expect(typeof module.default).toBe('function');

      // Actually render the component using server-side rendering - this catches
      // runtime errors like "t is not defined" that React.createElement alone
      // won't catch (createElement just creates an element descriptor, it doesn't
      // invoke the component function until render)
      let error = null;

      try {
        renderToString(React.createElement(module.default));
      } catch (e) {
        error = e;
      }

      // Should not throw when rendering the component
      if (error) {
        // Provide helpful error message
        throw new Error(`${folder} component threw error on render: ${error.message}`);
      }
    }, 10000); // 10 second timeout for slower imports
  }
});

// ===========================================
// Summary Test - Ensure All Games Are Covered
// ===========================================
describe('Game Coverage', () => {
  it('should test a reasonable number of games', () => {
    const gameCount = Object.keys(GAME_MODULES).length;
    // We should be testing at least 100 games
    expect(gameCount).toBeGreaterThan(100);
  });
});
