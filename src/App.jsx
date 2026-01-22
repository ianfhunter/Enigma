import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import Layout from './components/Layout';
import Home from './pages/Home';
import Profile from './pages/Profile';
import Search from './pages/Search';
import GameStore from './pages/GameStore';
import IframeGame from './pages/IframeGame';
import CommunityGame from './pages/CommunityGame';
import NotFound from './pages/NotFound';
import { SettingsProvider } from './context/SettingsContext';
import { AuthProvider } from './context/AuthContext';
import { allGames } from './data/gameRegistry';
import { getGameBySlug } from './packs/registry';
const logo = '/branding/logo-animated-e.svg';
import './index.css';

/**
 * Mapping from game slug to the folder name in src/pages/
 * This is needed because folder names are PascalCase while slugs use kebab-case
 */
const slugToFolder = {
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
  'mosaic': 'Mosaic',
  'netgame': 'Netgame',
  'netslide': 'Netslide',
  'nonogram': 'Nonogram',
  'n-queens': 'NQueens',
  'numberlink': 'Numberlink',
  'nurikabe': 'Nurikabe',
  'pearl': 'Pearl',
  'pegs': 'Pegs',
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
};

// Cache for lazy-loaded components
const componentCache = {};

/**
 * Get or create a lazy-loaded component for a game
 *
 * First checks the slugToFolder mapping for built-in pages,
 * then falls back to pack manifest component loaders for community packs.
 */
function getGameComponent(slug) {
  // Check if we already have a cached component
  if (componentCache[slug]) {
    return componentCache[slug];
  }

  // First, try the built-in slugToFolder mapping
  const folder = slugToFolder[slug];
  if (folder) {
    componentCache[slug] = lazy(() => import(`./pages/${folder}/index.js`));
    return componentCache[slug];
  }

  // Fall back to pack manifests (for community packs and packs with custom paths)
  const game = getGameBySlug(slug);
  if (game?.component) {
    componentCache[slug] = lazy(() => game.component().then(m => ({ default: m.default })));
    return componentCache[slug];
  }

  // Unknown game - return null (will show 404 via route handling)
  return null;
}

// Fun loading phrases
const LOADING_PHRASES = [
  "Scheming",
  "Concocting Dastardly Plans",
  "Thinking",
  "Churning",
  "Consulting the Oracle",
  "Summoning Pixels",
  "Weaving Magic",
  "Plotting",
  "Arranging the Universe",
  "Channeling Spirits",
  "Brewing Chaos",
  "Warming Up",
];

// Loading fallback component with animated logo
const animatedLogo = '/branding/logo-animated-e.svg';

function GameLoading() {
  const phrase = LOADING_PHRASES[Math.floor(Math.random() * LOADING_PHRASES.length)];

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '50vh',
      gap: '2rem',
    }}>
      {/* Animated logo */}
      <div style={{
        position: 'relative',
        width: '120px',
        height: '120px',
      }}>
        {/* Outer glow ring */}
        <div style={{
          position: 'absolute',
          inset: '-20px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(139, 92, 246, 0.2) 0%, transparent 70%)',
          animation: 'pulseGlow 2s ease-in-out infinite',
        }} />

        <img
          src={animatedLogo}
          alt="Loading"
          style={{
            width: '120px',
            height: '120px',
            filter: `
              drop-shadow(0 0 12px rgba(139, 92, 246, 0.8))
              drop-shadow(0 0 24px rgba(124, 58, 237, 0.5))
            `,
          }}
        />
      </div>

      {/* Mysterious loading text */}
      <div style={{
        fontSize: '0.9rem',
        fontWeight: 600,
        letterSpacing: '0.1em',
        color: 'rgba(196, 181, 253, 0.7)',
        textTransform: 'uppercase',
        fontStyle: 'italic',
        textShadow: '0 2px 10px rgba(139, 92, 246, 0.3)',
        animation: 'textFade 2s ease-in-out infinite',
      }}>
        {phrase}
      </div>

      {/* Keyframe animations */}
      <style>{`
        @keyframes pulseGlow {
          0%, 100% {
            transform: scale(1);
            opacity: 0.5;
          }
          50% {
            transform: scale(1.15);
            opacity: 1;
          }
        }
        @keyframes textFade {
          0%, 100% {
            opacity: 0.7;
          }
          50% {
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}

// Wrapper for lazy-loaded game components
function GameRoute({ component: Component }) {
  return (
    <Suspense fallback={<GameLoading />}>
      <Component />
    </Suspense>
  );
}

// Generate routes from game registry
function generateGameRoutes() {
  const routes = [];
  const seenSlugs = new Set();

  // Add routes for all games in the registry
  for (const game of allGames) {
    if (!seenSlugs.has(game.slug)) {
      seenSlugs.add(game.slug);
      const Component = getGameComponent(game.slug);
      routes.push(
        <Route
          key={game.slug}
          path={game.slug}
          element={<GameRoute component={Component} />}
        />
      );
    }
  }

  return routes;
}

function App() {
  return (
    <AuthProvider>
      <SettingsProvider>
        <BrowserRouter future={{ v7_startTransition: true }}>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<Home />} />
              <Route path="search" element={<Search />} />
              <Route path="store" element={<GameStore />} />
              <Route path="profile" element={<Profile />} />
              <Route path="custom/:packId/:gameId" element={<IframeGame />} />
              <Route path="community/:packId/:gameSlug" element={<CommunityGame />} />
              {generateGameRoutes()}
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </SettingsProvider>
    </AuthProvider>
  );
}

export default App;
