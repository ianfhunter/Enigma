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

// Loading fallback component with mysterious eye animation
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
      {/* Mysterious eye container */}
      <div style={{
        position: 'relative',
        width: '120px',
        height: '80px',
      }}>
        {/* Eye outline */}
        <div style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          borderRadius: '50%',
          border: '3px solid rgba(139, 92, 246, 0.6)',
          background: 'rgba(30, 0, 60, 0.3)',
          boxShadow: `
            0 0 30px rgba(139, 92, 246, 0.4),
            inset 0 0 20px rgba(88, 28, 135, 0.2)
          `,
          overflow: 'hidden',
        }}>
          {/* Eye blink overlay */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'rgba(5, 5, 16, 0.95)',
            borderRadius: '50%',
            animation: 'eyeBlink 3s ease-in-out infinite',
            zIndex: 3,
          }} />
          
          {/* Pupil container */}
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: '40px',
            height: '40px',
            transform: 'translate(-50%, -50%)',
            animation: 'lookAround 4s ease-in-out infinite',
          }}>
            {/* Pupil */}
            <div style={{
              width: '100%',
              height: '100%',
              borderRadius: '50%',
              background: 'radial-gradient(circle, #a855f7 0%, #7c3aed 50%, #5b21b6 100%)',
              boxShadow: `
                0 0 20px rgba(139, 92, 246, 0.8),
                0 0 40px rgba(124, 58, 237, 0.5),
                inset 0 0 10px rgba(0, 0, 0, 0.5)
              `,
              position: 'relative',
            }}>
              {/* Pupil highlight */}
              <div style={{
                position: 'absolute',
                top: '20%',
                left: '30%',
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.6)',
                boxShadow: '0 0 8px rgba(255, 255, 255, 0.8)',
              }} />
            </div>
          </div>
        </div>
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
      }}>
        {phrase}
      </div>
      
      {/* Keyframe animations */}
      <style>{`
        @keyframes lookAround {
          0%, 100% {
            transform: translate(-50%, -50%) translate(0, 0);
          }
          10% {
            transform: translate(-50%, -50%) translate(-15px, -10px);
          }
          20% {
            transform: translate(-50%, -50%) translate(15px, -8px);
          }
          30% {
            transform: translate(-50%, -50%) translate(-10px, 12px);
          }
          40% {
            transform: translate(-50%, -50%) translate(18px, 10px);
          }
          50% {
            transform: translate(-50%, -50%) translate(-20px, -5px);
          }
          60% {
            transform: translate(-50%, -50%) translate(12px, -15px);
          }
          70% {
            transform: translate(-50%, -50%) translate(-8px, 8px);
          }
          80% {
            transform: translate(-50%, -50%) translate(20px, 5px);
          }
          90% {
            transform: translate(-50%, -50%) translate(-12px, -12px);
          }
        }
        @keyframes eyeBlink {
          0%, 90%, 100% {
            height: 0;
            top: 50%;
          }
          92%, 94% {
            height: 100%;
            top: 0;
          }
          96% {
            height: 0;
            top: 50%;
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
