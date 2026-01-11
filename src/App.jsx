import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import Layout from './components/Layout';
import Home from './pages/Home';
import NotFound from './pages/NotFound';
import { allGames } from './data/gameRegistry';
import './index.css';

/**
 * Mapping from game slug to the folder name in src/pages/
 * This is needed because folder names are PascalCase while slugs use kebab-case
 */
const slugToFolder = {
  'abc-end-view': 'ABCEndView',
  'anagrams': 'Anagrams',
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
  'connections': 'Connections',
  'constellations': 'Constellations',
  'conundrum': 'Conundrum',
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
  'fliptogram': 'Fliptogram',
  'flood-it': 'FloodIt',
  'futoshiki': 'Futoshiki',
  'galaxies': 'Galaxies',
  'gods-quiz': 'GodsQuiz',
  'gokigen-naname': 'GokigenNaname',
  'guess': 'Guess',
  'hangman': 'Hangman',
  'hashi': 'Hashi',
  'heyawake': 'Heyawake',
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
  'letter-boxed': 'LetterBoxed',
  'lights-out': 'LightsOut',
  'lightup': 'Lightup',
  'lits': 'LITS',
  'loopy': 'Loopy',
  'magnets': 'Magnets',
  'mainarizumu': 'Mainarizumu',
  'map': 'Map',
  'maze': 'Maze',
  'memory-match': 'MemoryMatch',
  'minesweeper': 'Minesweeper',
  'mosaic': 'Mosaic',
  'nanro': 'Nanro',
  'netgame': 'Netgame',
  'netslide': 'Netslide',
  'nonogram': 'Nonogram',
  'n-queens': 'NQueens',
  'numberlink': 'Numberlink',
  'nurikabe': 'Nurikabe',
  'palisade': 'Palisade',
  'pearl': 'Pearl',
  'pegs': 'Pegs',
  'periodic-table-quiz': 'PeriodicTableQuiz',
  'phrase-guess': 'PhraseGuess',
  'pipe-puzzle': 'PipePuzzle',
  'pokemon-gen-blitz': 'PokemonGenBlitz',
  'pokemon-quiz': 'PokemonQuiz',
  'provincial-map-fill': 'ProvincialMapFill',
  'pyramid': 'Pyramid',
  'range': 'Range',
  'ripple-effect': 'RippleEffect',
  'samegame': 'Samegame',
  'sandwich-sudoku': 'SandwichSudoku',
  'sequence': 'Sequence',
  'shakashaka': 'Shakashaka',
  'shikaku': 'Shikaku',
  'shinro': 'Shinro',
  'shiritori': 'Shiritori',
  'signpost': 'Signpost',
  'sixteen': 'Sixteen',
  'skyscraper': 'Skyscraper',
  'slant': 'Slant',
  'sliding-puzzle': 'SlidingPuzzle',
  'sokoban': 'Sokoban',
  'stained-glass': 'StainedGlass',
  'star-battle': 'StarBattle',
  'str8ts': 'Str8ts',
  'strands': 'Strands',
  'sudoku': 'Sudoku',
  'suguru': 'Suguru',
  'sujiko': 'Sujiko',
  'takuzu': 'Takuzu',
  'tangram': 'Tangram',
  'tantrix': 'Tantrix',
  'tatamibari': 'Tatamibari',
  'tents': 'Tents',
  'thermometers': 'Thermometers',
  'theseus-minotaur': 'TheseusMinotaur',
  'tile-swap': 'TileSwap',
  'tower-of-hanoi': 'TowerOfHanoi',
  'towers': 'Skyscraper', // Alias
  'tracks': 'Tracks',
  'train-shunting': 'TrainShunting',
  'trivia': 'Trivia',
  'twiddle': 'Twiddle',
  'undead': 'Undead',
  'untangle': 'Untangle',
  'waffle': 'Waffle',
  'water-pouring': 'WaterPouring',
  'word-arithmetic': 'WordArithmetic',
  'wordguess': 'WordGuess',
  'wordiply': 'Wordiply',
  'word-ladder': 'WordLadder',
  'word-search': 'WordSearch',
  'word-shuffle': 'WordShuffle',
  'word-snake': 'WordSnake',
  'word-tiles': 'WordTiles',
  'word-wheel': 'WordWheel',
  'world-map-fill': 'WorldMapFill',
  'yajilin': 'Yajilin',
  'yajisan-kazusan': 'YajisanKazusan',
  'yin-yang': 'YinYang',
};

/**
 * Aliases for alternate route paths (e.g., Simon Tatham puzzle names)
 * Maps alias slug -> primary slug
 */
const routeAliases = {
  'solo': 'sudoku',
  'mines': 'minesweeper',
  'keen': 'calcudoku',
  'flip': 'lights-out',
  'flood': 'flood-it',
  'unequal': 'futoshiki',
  'singles': 'hitori',
  'unruly': 'takuzu',
  'bridges': 'hashi',
  'rect': 'shikaku',
  'filling': 'fillomino',
  'pattern': 'nonogram',
  'hakyuu': 'ripple-effect',
  'hidoku': 'hidato',
  'factor-rooms': 'inshi-no-heya',
  'corral': 'bag',
  'cryptarithmetic': 'word-arithmetic',
};

// Cache for lazy-loaded components
const componentCache = {};

/**
 * Get or create a lazy-loaded component for a game
 */
function getGameComponent(slug) {
  const folder = slugToFolder[slug];
  if (!folder) {
    // Fallback to DevPlaceholder for unknown games
    if (!componentCache['__dev__']) {
      componentCache['__dev__'] = lazy(() => import('./pages/DevPlaceholder'));
    }
    return componentCache['__dev__'];
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

// Loading fallback component with playful game-themed animation
function GameLoading() {
  const colors = ['#22c55e', '#3b82f6', '#f59e0b', '#ec4899', '#a855f7'];
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
      {/* Bouncing blocks container */}
      <div style={{
        display: 'flex',
        gap: '8px',
        alignItems: 'flex-end',
        height: '60px',
      }}>
        {colors.map((color, i) => (
          <div
            key={i}
            style={{
              width: '16px',
              height: '16px',
              borderRadius: '4px',
              backgroundColor: color,
              boxShadow: `0 0 20px ${color}40`,
              animation: `bounce 0.6s ease-in-out infinite`,
              animationDelay: `${i * 0.1}s`,
            }}
          />
        ))}
      </div>
      {/* Playful loading text */}
      <div style={{
        display: 'flex',
        gap: '2px',
        fontSize: '1rem',
        fontWeight: 600,
        letterSpacing: '0.02em',
      }}>
        {phrase.split('').map((char, i) => (
          <span
            key={i}
            style={{
              color: char === ' ' ? 'transparent' : colors[i % colors.length],
              animation: 'wave 1.2s ease-in-out infinite',
              animationDelay: `${i * 0.08}s`,
              display: 'inline-block',
              width: char === ' ' ? '0.3em' : 'auto',
            }}
          >
            {char}
          </span>
        ))}
        <span style={{
          color: 'rgba(255,255,255,0.6)',
          animation: 'blink 1s step-end infinite',
        }}>...</span>
      </div>
      {/* Keyframe animations */}
      <style>{`
        @keyframes bounce {
          0%, 100% {
            transform: translateY(0) scale(1);
          }
          50% {
            transform: translateY(-30px) scale(1.1);
          }
        }
        @keyframes wave {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-4px);
          }
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
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

  // Add alias routes
  for (const [alias, primarySlug] of Object.entries(routeAliases)) {
    const Component = getGameComponent(primarySlug);
    routes.push(
      <Route
        key={alias}
        path={alias}
        element={<GameRoute component={Component} />}
      />
    );
  }

  return routes;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          {generateGameRoutes()}
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
