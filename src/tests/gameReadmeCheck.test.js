import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { getAllGames } from '../packs/registry.js';

// Get the directory of this file
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ===========================================
// Game README Check Tests
//
// These tests verify that all game pages have
// a README.md file documenting the game.
// ===========================================

describe('Game README Files', () => {
  const allGames = getAllGames();

  // Map slug to folder name using the slugToFolder mapping from App.jsx
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
    'japanese-sums': 'JapaneseSums',
    'jigsaw': 'Jigsaw',
    'kakuro': 'Kakuro',
    'kakurasu': 'Kakurasu',
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
    'sets': 'Sets',
    'shikaku': 'Shikaku',
    'shinro': 'Shinro',
    'naval-battle': 'NavalBattle',
    'norinori': 'Norinori',
    'shiritori': 'Shiritori',
    'shisen-sho': 'ShisenSho',
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
    'tetravex': 'Tetravex',
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

  // Folders that are not actual game pages and should be excluded
  const excludedFolders = [
    'Home',
    'GameStore',
    'Profile',
    'Search',
    'NotFound',
    'CommunityGame',
    'IframeGame',
  ];

  it('should have README.md in all game directories', () => {
    const missingReadmes = [];
    const gamesChecked = [];

    // Check each game
    for (const game of allGames) {
      const folderName = slugToFolder[game.slug];

      if (!folderName) {
        // Skip games not in slugToFolder mapping (might be disabled or special)
        continue;
      }

      if (excludedFolders.includes(folderName)) {
        // Skip non-game pages
        continue;
      }

      gamesChecked.push({ slug: game.slug, folder: folderName });

      // Construct path to README
      const readmePath = join(__dirname, '..', 'pages', folderName, 'README.md');

      if (!existsSync(readmePath)) {
        missingReadmes.push({
          slug: game.slug,
          folder: folderName,
          expectedPath: readmePath
        });
      }
    }

    // Report results
    if (missingReadmes.length > 0) {
      const missingList = missingReadmes.map(g => `  - ${g.folder} (${g.slug})`).join('\n');
      throw new Error(
        `${missingReadmes.length} game(s) are missing README.md files:\n${missingList}\n\n` +
        `Checked ${gamesChecked.length} games total.`
      );
    }

    // Verify we checked a reasonable number of games
    expect(gamesChecked.length).toBeGreaterThan(100);
  });

  it('should have non-empty README.md files', () => {
    const emptyReadmes = [];
    const tooShortReadmes = [];

    for (const game of allGames) {
      const folderName = slugToFolder[game.slug];

      if (!folderName || excludedFolders.includes(folderName)) {
        continue;
      }

      const readmePath = join(__dirname, '..', 'pages', folderName, 'README.md');

      if (existsSync(readmePath)) {
        const content = readFileSync(readmePath, 'utf-8').trim();

        if (content.length === 0) {
          emptyReadmes.push({ slug: game.slug, folder: folderName });
        } else if (content.length < 50) {
          // README should have at least 50 characters of content
          tooShortReadmes.push({
            slug: game.slug,
            folder: folderName,
            length: content.length
          });
        }
      }
    }

    // Report empty READMEs
    if (emptyReadmes.length > 0) {
      const emptyList = emptyReadmes.map(g => `  - ${g.folder} (${g.slug})`).join('\n');
      throw new Error(
        `${emptyReadmes.length} game(s) have empty README.md files:\n${emptyList}`
      );
    }

    // Report too-short READMEs
    if (tooShortReadmes.length > 0) {
      const shortList = tooShortReadmes.map(g => `  - ${g.folder} (${g.slug}) - ${g.length} chars`).join('\n');
      throw new Error(
        `${tooShortReadmes.length} game(s) have very short README.md files (< 50 chars):\n${shortList}`
      );
    }
  });

  it('should have README.md with proper markdown structure', () => {
    const badStructure = [];

    for (const game of allGames) {
      const folderName = slugToFolder[game.slug];

      if (!folderName || excludedFolders.includes(folderName)) {
        continue;
      }

      const readmePath = join(__dirname, '..', 'pages', folderName, 'README.md');

      if (existsSync(readmePath)) {
        const content = readFileSync(readmePath, 'utf-8');

        // Check for at least one header
        const hasHeader = /^#+ /m.test(content);

        if (!hasHeader) {
          badStructure.push({
            slug: game.slug,
            folder: folderName,
            issue: 'No markdown headers found'
          });
        }
      }
    }

    if (badStructure.length > 0) {
      const badList = badStructure.map(g => `  - ${g.folder} (${g.slug}): ${g.issue}`).join('\n');
      throw new Error(
        `${badStructure.length} game(s) have README.md files with poor structure:\n${badList}`
      );
    }
  });
});
