import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import Layout from './components/Layout';
import Home from './pages/Home';
import Profile from './pages/Profile';
import Search from './pages/Search';
import GameStore from './pages/GameStore';
import IframeGame from './pages/IframeGame';
import NotFound from './pages/NotFound';
import { SettingsProvider } from './context/SettingsContext';
import { AuthProvider } from './context/AuthContext';
import { allGames } from './data/gameRegistry';
const logo = '/branding/logo.svg';
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
  'guess': 'Guess',
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
  'lights-out': 'LightsOut',
  'lightup': 'Lightup',
  'lits': 'LITS',
  'loopy': 'Loopy',
  'magnets': 'Magnets',
  'map': 'Map',
  'maze': 'Maze',
  'memory-match': 'MemoryMatch',
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
  'range': 'Range',
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
  'takuzu': 'Takuzu',
  'cirkitz': 'Cirkitz',
  'tatamibari': 'Tatamibari',
  'thermometers': 'Thermometers',
  'theseus-minotaur': 'TheseusMinotaur',
  'tile-swap': 'TileSwap',
  'tower-of-hanoi': 'TowerOfHanoi',
  'tracks': 'Tracks',
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
 */
function getGameComponent(slug) {
  const folder = slugToFolder[slug];
  if (!folder) {
    // Unknown game - return null (will show 404 via route handling)
    return null;
  }

  if (!componentCache[slug]) {
    componentCache[slug] = lazy(() => import(`./pages/${folder}/index.js`));
  }
  return componentCache[slug];
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

// Loading fallback component with spinning logo animation
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
      {/* Spinning logo container */}
      <div style={{
        position: 'relative',
        width: '100px',
        height: '100px',
        perspective: '600px',
      }}>
        {/* Outer glow ring */}
        <div style={{
          position: 'absolute',
          inset: '-15px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(139, 92, 246, 0.15) 0%, transparent 70%)',
          animation: 'pulseGlow 2s ease-in-out infinite',
        }} />

        {/* Logo wrapper with 3D rotation */}
        <div style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          animation: 'logoSpin 3s cubic-bezier(0.4, 0, 0.2, 1) infinite',
          transformStyle: 'preserve-3d',
        }}>
          <img
            src={logo}
            alt="Loading"
            style={{
              width: '80px',
              height: 'auto',
              filter: `
                drop-shadow(0 0 12px rgba(139, 92, 246, 0.8))
                drop-shadow(0 0 24px rgba(124, 58, 237, 0.5))
                drop-shadow(0 0 36px rgba(88, 28, 135, 0.3))
              `,
              animation: 'logoGlow 2s ease-in-out infinite',
            }}
          />
        </div>

        {/* Orbiting particle 1 */}
        <div style={{
          position: 'absolute',
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          background: '#a855f7',
          boxShadow: '0 0 10px #a855f7, 0 0 20px #a855f7',
          top: '50%',
          left: '50%',
          animation: 'orbit 2.5s linear infinite',
        }} />

        {/* Orbiting particle 2 */}
        <div style={{
          position: 'absolute',
          width: '4px',
          height: '4px',
          borderRadius: '50%',
          background: '#c084fc',
          boxShadow: '0 0 8px #c084fc, 0 0 16px #c084fc',
          top: '50%',
          left: '50%',
          animation: 'orbit 2.5s linear infinite reverse',
          animationDelay: '-0.8s',
        }} />
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
        @keyframes logoSpin {
          0% {
            transform: rotateY(0deg) rotateX(0deg);
          }
          25% {
            transform: rotateY(180deg) rotateX(10deg);
          }
          50% {
            transform: rotateY(360deg) rotateX(0deg);
          }
          75% {
            transform: rotateY(540deg) rotateX(-10deg);
          }
          100% {
            transform: rotateY(720deg) rotateX(0deg);
          }
        }
        @keyframes logoGlow {
          0%, 100% {
            filter:
              drop-shadow(0 0 12px rgba(139, 92, 246, 0.8))
              drop-shadow(0 0 24px rgba(124, 58, 237, 0.5))
              drop-shadow(0 0 36px rgba(88, 28, 135, 0.3));
          }
          50% {
            filter:
              drop-shadow(0 0 20px rgba(167, 139, 250, 1))
              drop-shadow(0 0 40px rgba(139, 92, 246, 0.7))
              drop-shadow(0 0 60px rgba(124, 58, 237, 0.5));
          }
        }
        @keyframes pulseGlow {
          0%, 100% {
            transform: scale(1);
            opacity: 0.5;
          }
          50% {
            transform: scale(1.2);
            opacity: 1;
          }
        }
        @keyframes orbit {
          0% {
            transform: rotate(0deg) translateX(55px) rotate(0deg);
          }
          100% {
            transform: rotate(360deg) translateX(55px) rotate(-360deg);
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
