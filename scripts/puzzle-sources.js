// Puzzle source information for each game
// 'generator' - Algorithmic puzzle generation
// 'dataset' - Uses a dataset file (with source info)
// 'backend' - Fetches from backend API
// 'hybrid' - Uses both generator and dataset
// 'n/a' - Not applicable (user-driven, sandbox, etc.)

export const puzzleSources = {
  // Word Formation
  WordGuess: { type: 'hybrid', source: 'Word list with algorithmic validation' },
  WordWheel: { type: 'generator', source: 'Generated from word frequency lists' },
  WordLadder: { type: 'generator', source: 'Generated with word graph traversal' },
  Conundrum: { type: 'hybrid', source: 'Selected from 9-letter words in dictionary' },
  Hangman: { type: 'hybrid', source: 'Random word selection from word list' },
  Anagrams: { type: 'hybrid', source: 'Generated from dictionary words' },
  CountdownLetters: { type: 'generator', source: 'Random letter selection with word validation' },
  WordShuffle: { type: 'generator', source: 'Generated letter grid with valid word paths' },
  LongestWord: { type: 'generator', source: 'Generated seed patterns from dictionary' },
  Pyramid: { type: 'generator', source: 'Generated word pyramids from dictionary' },
  Shiritori: { type: 'dataset', source: '`datasets/shiritori_words.json` and `datasets/japaneseWords.js`' },
  WordTiles: { type: 'generator', source: 'Random tile generation with Scrabble-style distribution' },

  // Word Grids
  Crossword: { type: 'dataset', source: '`datasets/crossword_clues.json` - curated crossword clues' },
  Squarish: { type: 'generator', source: 'Generated valid word grids from dictionary' },
  LetterWeb: { type: 'generator', source: 'Algorithmically generated letter arrangements' },
  WordSearch: { type: 'generator', source: 'Generated grids with hidden word placement' },
  Threads: { type: 'dataset', source: '`datasets/wordCategories.js` - themed word groups' },
  Categories: { type: 'dataset', source: '`datasets/wordCategories.js` - categorized word groups' },
  FlipQuotes: { type: 'dataset', source: '`datasets/quotes.js` - curated famous quotes' },

  // Cipher & Decode
  Cryptogram: { type: 'dataset', source: '`datasets/quotes.js` - famous quotes for encoding' },
  PhraseGuess: { type: 'dataset', source: '`datasets/quotes.js` - common phrases and quotes' },
  CodeBreaker: { type: 'generator', source: 'Random code generation' },
  WordArithmetic: { type: 'generator', source: 'Algorithmically generated valid cryptarithms' },
  DropQuotes: { type: 'dataset', source: '`datasets/quotes.js` - quotes arranged as drop puzzles' },
  WordSnake: { type: 'generator', source: 'Generated word paths through grid' },

  // Sudoku Family
  Sudoku: { type: 'generator', source: 'Algorithmic generation with difficulty grading' },
  KillerSudoku: { type: 'generator', source: 'Uses `killer-sudoku-generator` npm package' },
  SandwichSudoku: { type: 'generator', source: 'Algorithmic generation with sandwich constraints' },
  Calcudoku: { type: 'generator', source: 'Generated with cage arithmetic constraints' },
  Kakuro: { type: 'backend', source: 'Puzzle API - pre-generated valid Kakuro grids' },
  Futoshiki: { type: 'generator', source: 'Generated with inequality constraints' },
  Str8ts: { type: 'backend', source: 'Puzzle API - pre-generated Str8ts puzzles' },
  Kropki: { type: 'generator', source: 'Generated with dot constraints' },
  Sujiko: { type: 'generator', source: 'Generated with sum constraints' },
  Skyscraper: { type: 'backend', source: 'Puzzle API - pre-generated visibility puzzles' },
  ABCEndView: { type: 'generator', source: 'Generated letter placement puzzles' },

  // Grid Shading
  Nonogram: { type: 'generator', source: 'Generated from patterns or random valid puzzles' },
  Minesweeper: { type: 'generator', source: 'Random mine placement with solvability check' },
  Nurikabe: { type: 'backend', source: 'Puzzle API - pre-generated island puzzles' },
  Hitori: { type: 'backend', source: 'Puzzle API - pre-generated duplicate elimination puzzles' },
  Aquarium: { type: 'generator', source: 'Generated tank layouts with water constraints' },
  StarBattle: { type: 'backend', source: 'Puzzle API - pre-generated star placement puzzles' },
  Campixu: { type: 'generator', source: 'Generated tent placement puzzles' },
  Takuzu: { type: 'generator', source: 'Algorithmic binary puzzle generation' },
  YinYang: { type: 'generator', source: 'Generated connectivity puzzles' },
  Creek: { type: 'generator', source: 'Generated corner-clue shading puzzles' },
  Kurotto: { type: 'generator', source: 'Generated sum-based shading puzzles' },
  Thermometers: { type: 'generator', source: 'Generated thermometer fill puzzles' },
  LightsOut: { type: 'generator', source: 'Random solvable light configurations' },
  Lightup: { type: 'generator', source: 'Generated bulb placement puzzles' },
  Mosaic: { type: 'generator', source: 'Generated numeric clue puzzles' },

  // Loop & Path
  Numberlink: { type: 'generator', source: 'Generated number pair path puzzles' },
  Hashi: { type: 'generator', source: 'Generated island bridge puzzles' },
  Loopy: { type: 'generator', source: 'Generated loop drawing puzzles' },
  Pearl: { type: 'generator', source: 'Generated pearl constraint loop puzzles' },
  Yajilin: { type: 'backend', source: 'Puzzle API - pre-generated arrow loop puzzles' },
  Slant: { type: 'generator', source: 'Generated diagonal placement puzzles' },
  GokigenNaname: { type: 'generator', source: 'Generated diagonal intersection puzzles' },
  HotaruBeam: { type: 'generator', source: 'Generated firefly beam puzzles' },
  Hidato: { type: 'generator', source: 'Generated consecutive number path puzzles' },
  Signpost: { type: 'generator', source: 'Generated arrow path puzzles' },
  Tracks: { type: 'generator', source: 'Generated railway track puzzles' },
  Maze: { type: 'generator', source: 'Algorithmic maze generation (recursive backtracking)' },
  Bag: { type: 'generator', source: 'Generated corral loop puzzles' },

  // Region Division
  Shikaku: { type: 'backend', source: 'Puzzle API - pre-generated rectangle division puzzles' },
  Fillomino: { type: 'backend', source: 'Puzzle API - pre-generated polyomino puzzles' },
  Galaxies: { type: 'dataset', source: '`datasets/galaxiesPuzzles_bundled.json` - pre-made galaxy puzzles' },
  Tatamibari: { type: 'backend', source: 'Puzzle API - pre-generated tatami puzzles' },
  LITS: { type: 'backend', source: 'Puzzle API - pre-generated tetromino puzzles' },
  Suguru: { type: 'dataset', source: '`datasets/suguruPuzzles_bundled.json` - pre-made Suguru puzzles' },
  Norinori: { type: 'generator', source: 'Generated domino shading puzzles' },
  InshiNoHeya: { type: 'generator', source: 'Generated room multiplication puzzles' },

  // Chess & Movement
  ChessPuzzle: { type: 'dataset', source: 'Lichess puzzle database - tactical chess positions' },
  KnightsTour: { type: 'n/a', source: 'User-driven knight movement puzzle' },
  NQueens: { type: 'n/a', source: 'User-driven queen placement puzzle' },
  ChessMaze: { type: 'generator', source: 'Generated chess piece maze puzzles' },
  TheseusMinotaur: { type: 'generator', source: 'Generated pursuit maze puzzles' },
  Pegs: { type: 'n/a', source: 'Classic peg solitaire - fixed starting positions' },
  Sokoban: { type: 'dataset', source: "DeepMind's Boxoban dataset (`/datasets/boxoban/`) - Apache 2.0" },
  Inertia: { type: 'generator', source: 'Generated ice sliding puzzles' },

  // Tile & Spatial
  Jigsaw: { type: 'generator', source: 'Generated from uploaded or sample images' },
  SlidingPuzzle: { type: 'generator', source: 'Scrambled from solved state with solvability check' },
  Congestion: { type: 'backend', source: 'Puzzle API - Rush Hour style puzzles' },
  TileSwap: { type: 'generator', source: 'Scrambled image tiles' },
  Cirkitz: { type: 'generator', source: 'Generated circuit connection puzzles' },
  PipePuzzle: { type: 'generator', source: 'Generated pipe rotation puzzles' },
  FloodIt: { type: 'generator', source: 'Random color grid generation' },
  ColorCube: { type: 'n/a', source: 'Classic 3×3×3 cube - user scrambles' },
  Entanglement: { type: 'generator', source: 'Random hex tile generation' },
  StainedGlass: { type: 'generator', source: 'Generated graph coloring puzzles' },
  TowerOfHanoi: { type: 'n/a', source: 'Classic Tower of Hanoi - configurable disk count' },
  Fifteen: { type: 'generator', source: 'Scrambled with solvability guarantee' },
  Sixteen: { type: 'generator', source: 'Scrambled tile arrangement' },
  Twiddle: { type: 'generator', source: 'Scrambled rotation puzzle' },
  Netgame: { type: 'generator', source: 'Generated network rotation puzzles' },
  Netslide: { type: 'generator', source: 'Generated network sliding puzzles' },
  Cube: { type: 'n/a', source: 'Classic cube puzzle - user controlled' },
  Untangle: { type: 'generator', source: 'Generated planar graph puzzles' },
  Samegame: { type: 'generator', source: 'Random color tile generation' },

  // Trivia & Knowledge
  FlagGuesser: { type: 'dataset', source: '`datasets/countries.js` - world country data' },
  CapitalGuesser: { type: 'dataset', source: '`datasets/capitals.js` - world capitals data' },
  WorldMapFill: { type: 'dataset', source: '`datasets/countries.js` - world geography data' },
  ProvincialMapFill: { type: 'dataset', source: '`datasets/provincialMapData.js` - regional geography data' },
  FamousPaintings: { type: 'backend', source: 'Art history database via API' },
  Trivia: { type: 'dataset', source: '`datasets/trivia_datasets/` - categorized trivia questions' },
  AnatomyQuiz: { type: 'dataset', source: '`src/data/anatomyData.js` - human anatomy data' },
  Constellations: { type: 'dataset', source: 'IAU constellation data with star positions' },
  PokemonQuiz: { type: 'dataset', source: 'Pokémon data embedded in component' },
  PokemonGenBlitz: { type: 'dataset', source: 'Pokémon data embedded in component' },
  PeriodicTableQuiz: { type: 'dataset', source: '`datasets/periodic_table.json` - element data' },
  LanguageQuiz: { type: 'dataset', source: '`datasets/languages.json` - world languages data' },
  CurrencyQuiz: { type: 'dataset', source: '`datasets/currencies.json` - world currencies data' },
  GodsQuiz: { type: 'dataset', source: '`datasets/gods.json` - mythology data' },
  ClassicalMusicQuiz: { type: 'dataset', source: '`datasets/classical-music-sources.json` - IMSLP audio files' },
  Map: { type: 'generator', source: 'Generated map coloring puzzles' },

  // Memory & Speed
  Sequence: { type: 'generator', source: 'Random sequence generation' },
  MemoryMatch: { type: 'generator', source: 'Random card pair placement' },

  // Classic Logic
  Einstein: { type: 'generator', source: 'Algorithmic zebra puzzle generation' },
  KnightsAndKnaves: { type: 'dataset', source: '`datasets/knights_and_knaves_puzzles.json` - logic puzzles' },
  CountdownMath: { type: 'generator', source: 'Random number selection with solution validation' },
  WaterPouring: { type: 'generator', source: 'Generated jug puzzle configurations' },
  Blackbox: { type: 'generator', source: 'Random atom placement' },
  Guess: { type: 'generator', source: 'Random target generation' },
  Dominosa: { type: 'generator', source: 'Generated domino placement puzzles' },
  Magnets: { type: 'generator', source: 'Generated magnet placement puzzles' },
  Range: { type: 'generator', source: 'Generated visibility puzzles' },
  Undead: { type: 'generator', source: 'Generated monster placement puzzles' },
  Shinro: { type: 'generator', source: 'Generated gem finding puzzles' },
  NavalBattle: { type: 'generator', source: 'Generated battleship placement puzzles' },
};
