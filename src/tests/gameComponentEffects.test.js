/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react';

// ===========================================
// Game Component Effects Tests
//
// These tests verify that game components can be rendered
// CLIENT-SIDE with effects running. This catches bugs that
// the SSR smoke tests miss, such as:
// - Undefined variable references in useEffect callbacks
// - Bugs in saved state restoration paths
// - Async initialization errors
//
// Uses jsdom environment to enable client-side rendering.
// ===========================================

// All game modules to test (slug -> folder name)
// Same list as smoke tests for consistency
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
let container;
let root;
let consoleErrors = [];
let originalConsoleError;

beforeEach(() => {
  mockStorage = {};
  consoleErrors = [];

  // Capture console.error to detect React errors
  originalConsoleError = console.error;
  console.error = (...args) => {
    consoleErrors.push(args.join(' '));
    // Still log to console for debugging
    originalConsoleError.apply(console, args);
  };

  // Create container for rendering
  container = document.createElement('div');
  document.body.appendChild(container);

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

  // Mock fetch - return empty data that won't cause null errors
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
    ok: true,
    json: vi.fn().mockResolvedValue({ puzzles: [], data: [], words: [] }),
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
  document.elementFromPoint = vi.fn().mockReturnValue(null);

  // Mock canvas context for games that use canvas (e.g., TileSwap)
  HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue({
    fillRect: vi.fn(),
    clearRect: vi.fn(),
    getImageData: vi.fn(() => ({ data: new Array(4) })),
    putImageData: vi.fn(),
    createImageData: vi.fn(() => []),
    setTransform: vi.fn(),
    drawImage: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    scale: vi.fn(),
    rotate: vi.fn(),
    translate: vi.fn(),
    transform: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    closePath: vi.fn(),
    stroke: vi.fn(),
    fill: vi.fn(),
    arc: vi.fn(),
    rect: vi.fn(),
    clip: vi.fn(),
    quadraticCurveTo: vi.fn(),
    bezierCurveTo: vi.fn(),
    fillText: vi.fn(),
    strokeText: vi.fn(),
    measureText: vi.fn(() => ({ width: 0 })),
    createLinearGradient: vi.fn(() => ({
      addColorStop: vi.fn(),
    })),
    createRadialGradient: vi.fn(() => ({
      addColorStop: vi.fn(),
    })),
    canvas: { width: 100, height: 100 },
  });
});

afterEach(() => {
  // Cleanup React root
  if (root) {
    act(() => {
      root.unmount();
    });
    root = null;
  }

  // Remove container
  if (container) {
    document.body.removeChild(container);
    container = null;
  }

  // Restore console.error
  console.error = originalConsoleError;

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
  useSoundEnabled: () => false,
}));

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: null,
    isAuthenticated: false,
    login: vi.fn(),
    logout: vi.fn(),
  }),
}));

// Helper to wait for async effects
const waitForEffects = () => new Promise(resolve => setTimeout(resolve, 100));

// ===========================================
// Client-Side Render Tests - Verify Effects Don't Throw
// ===========================================
describe('Game Component Effects Tests - Client-Side Rendering', () => {
  const gameEntries = Object.entries(GAME_MODULES);

  // Test all games with client-side rendering
  for (const [slug, folder] of gameEntries) {
    it(`${folder} (${slug}) should render client-side without effect errors`, async () => {
      // Import the module
      const module = await import(`../pages/${folder}/index.js`);
      expect(module.default).toBeDefined();
      expect(typeof module.default).toBe('function');

      let renderError = null;

      try {
        // Use act() to properly handle React updates and effects
        await act(async () => {
          root = createRoot(container);
          root.render(React.createElement(module.default));
        });

        // Wait for async effects (like fetch calls) to complete
        await act(async () => {
          await waitForEffects();
        });
      } catch (e) {
        renderError = e;
      }

      // Check for render errors
      if (renderError) {
        throw new Error(`${folder} component threw error during client-side render: ${renderError.message}`);
      }

      // Check for React errors logged to console (e.g., from error boundaries)
      const criticalErrors = consoleErrors.filter(err =>
        err.includes('ReferenceError') ||
        err.includes('TypeError') ||
        err.includes('is not defined') ||
        err.includes('Cannot read properties of')
      );

      if (criticalErrors.length > 0) {
        throw new Error(`${folder} component logged errors during effects: ${criticalErrors[0]}`);
      }
    }, 15000); // 15 second timeout for slower components
  }
});

// ===========================================
// Saved State Restoration Tests
//
// These tests specifically verify that components handle
// saved state restoration correctly - a common source of bugs
// where typos in variable names only manifest when localStorage
// has data.
// ===========================================
describe('Game Component Saved State Tests', () => {
  // Test a subset of games that use persisted state
  const gamesWithPersistedState = [
    'Suko',
    'Sudoku',
    'Minesweeper',
    'Nonogram',
    'Crossword',
  ];

  for (const folder of gamesWithPersistedState) {
    it(`${folder} should handle saved state restoration without errors`, async () => {
      // Set up mock saved state in localStorage
      // Use a date string that matches today
      const today = new Date().toISOString().split('T')[0];

      // Create a generic saved state structure
      const savedState = {
        date: today,
        gameState: 'playing',
        seed: 12345,
      };

      // Try common storage key patterns
      const storageKeys = [
        `${folder.toLowerCase()}-game-state`,
        `${folder.toLowerCase()}-state`,
        `enigma-${folder.toLowerCase()}`,
      ];

      for (const key of storageKeys) {
        mockStorage[key] = JSON.stringify(savedState);
      }

      // Import and render the module
      const module = await import(`../pages/${folder}/index.js`);
      let renderError = null;

      try {
        await act(async () => {
          root = createRoot(container);
          root.render(React.createElement(module.default));
        });

        await act(async () => {
          await waitForEffects();
        });
      } catch (e) {
        renderError = e;
      }

      // Should not throw during render with saved state
      if (renderError) {
        throw new Error(`${folder} threw error with saved state: ${renderError.message}`);
      }

      // Check for reference errors (like the saved.seed vs savedState.seed bug)
      const referenceErrors = consoleErrors.filter(err =>
        err.includes('is not defined') ||
        err.includes('ReferenceError')
      );

      if (referenceErrors.length > 0) {
        throw new Error(`${folder} has reference error in saved state path: ${referenceErrors[0]}`);
      }
    }, 15000);
  }
});

// ===========================================
// Summary Test
// ===========================================
describe('Effects Test Coverage', () => {
  it('should test a reasonable number of games', () => {
    const gameCount = Object.keys(GAME_MODULES).length;
    expect(gameCount).toBeGreaterThan(100);
  });
});
