/**
 * Word Games Pack Manifest
 *
 * Contains all word-based puzzles: word formation, word grids, and cipher/decode games.
 * This is a self-contained pack definition with all game metadata and component loaders.
 */

// Custom SVG icons used by games in this pack
import wordguessIcon from '../../assets/icons/wordguess.svg';
import categoriesIcon from '../../assets/icons/categories.svg';
import crosswordIcon from '../../assets/icons/crossword.svg';
import squarishIcon from '../../assets/icons/squarish.svg';
import wordladderIcon from '../../assets/icons/wordladder.svg';
import wordwheelIcon from '../../assets/icons/wordwheel.svg';
import anagramsIcon from '../../assets/icons/anagrams.svg';
import conundrumIcon from '../../assets/icons/conundrum.svg';
import hangmanIcon from '../../assets/icons/hangman.svg';
import countdownLettersIcon from '../../assets/icons/countdown-letters.svg';
import wordshuffleIcon from '../../assets/icons/wordshuffle.svg';
import longestWordIcon from '../../assets/icons/longest-word.svg';
import pyramidIcon from '../../assets/icons/pyramid.svg';
import wordtilesIcon from '../../assets/icons/wordtiles.svg';
import letterwebIcon from '../../assets/icons/letterweb.svg';
import letterorbitIcon from '../../assets/icons/letter-orbit.svg';
import flipquotesIcon from '../../assets/icons/flipquotes.svg';
import cryptogramIcon from '../../assets/icons/cryptogram.svg';
import phraseguessIcon from '../../assets/icons/phraseguess.svg';
import wordarithmeticIcon from '../../assets/icons/wordarithmetic.svg';
import dropquotesIcon from '../../assets/icons/dropquotes.svg';
import wordsnakeIcon from '../../assets/icons/wordsnake.svg';
import wordsearchIcon from '../../assets/icons/wordsearch.svg';
import threadsIcon from '../../assets/icons/threads.svg';

/**
 * Pack metadata
 */
export const packInfo = {
  id: 'word-games',
  type: 'official',
  name: 'Word Games',
  description: 'Create, guess, and decode words. From Wordle-likes to crosswords to cryptograms.',
  icon: '📝',
  color: '#22c55e',
  version: '1.0.0',
  default: true,
  removable: true,
};

/**
 * Categories included in this pack
 */
export const categories = [
  {
    name: 'Word Formation',
    icon: '📝',
    description: 'Create and guess words from letters',
    games: [
      {
        title: 'WordGuess',
        slug: 'wordguess',
        aliases: ['Five Letter Word'],
        description: 'Guess the 5-letter word in 6 tries. Colors show how close you are!',
        icon: wordguessIcon,
        emojiIcon: '🟩',
        colors: { primary: '#22c55e', secondary: '#16a34a' },
        gradient: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
        version: 'v1.0',
        component: () => import('../../pages/WordGuess'),
      },
      {
        title: 'Word Wheel',
        slug: 'word-wheel',
        aliases: ['9 Letter Word', 'Center Letter'],
        description: 'Find words using letters from the wheel. Every word must include the center letter!',
        icon: wordwheelIcon,
        emojiIcon: '🎯',
        colors: { primary: '#ff6b6b', secondary: '#ee5a5a' },
        gradient: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a5a 100%)',
        version: 'v1.0',
        component: () => import('../../pages/WordWheel'),
      },
      {
        title: 'Word Ladder',
        slug: 'word-ladder',
        aliases: ['Doublets', 'Word Golf', 'Laddergrams'],
        description: 'Transform one word into another by changing one letter at a time.',
        icon: wordladderIcon,
        emojiIcon: '🪜',
        colors: { primary: '#4ecdc4', secondary: '#3dbdb5' },
        gradient: 'linear-gradient(135deg, #4ecdc4 0%, #3dbdb5 100%)',
        version: 'v1.0',
        component: () => import('../../pages/WordLadder'),
      },
      {
        title: 'Conundrum',
        slug: 'conundrum',
        description: 'Unscramble the nine letters to find the hidden word.',
        icon: conundrumIcon,
        emojiIcon: '🔮',
        colors: { primary: '#a855f7', secondary: '#9333ea' },
        gradient: 'linear-gradient(135deg, #a855f7 0%, #9333ea 100%)',
        version: 'v1.0',
        component: () => import('../../pages/Conundrum'),
      },
      {
        title: 'Hangman',
        slug: 'hangman',
        description: 'Guess the hidden word one letter at a time before running out of chances.',
        icon: hangmanIcon,
        emojiIcon: '☠️',
        colors: { primary: '#64748b', secondary: '#475569' },
        gradient: 'linear-gradient(135deg, #64748b 0%, #475569 100%)',
        version: 'v1.0',
        component: () => import('../../pages/Hangman'),
      },
      {
        title: 'Anagrams',
        slug: 'anagrams',
        description: 'Rearrange all the letters to form as many words as possible.',
        icon: anagramsIcon,
        emojiIcon: '🔀',
        colors: { primary: '#ec4899', secondary: '#db2777' },
        gradient: 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)',
        version: 'v1.0',
        component: () => import('../../pages/Anagrams'),
      },
      {
        title: 'Countdown Letters',
        slug: 'countdown-letters',
        description: 'Pick vowels and consonants, then find the longest word in 30 seconds!',
        icon: countdownLettersIcon,
        emojiIcon: '⏱️',
        colors: { primary: '#3b82f6', secondary: '#2563eb' },
        gradient: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
        version: 'v1.0',
        component: () => import('../../pages/CountdownLetters'),
      },
      {
        title: 'WordShuffle',
        slug: 'word-shuffle',
        description: 'Connect adjacent letters to form words before time runs out!',
        icon: wordshuffleIcon,
        emojiIcon: '🎲',
        colors: { primary: '#f97316', secondary: '#ea580c' },
        gradient: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
        version: 'v1.0',
        component: () => import('../../pages/WordShuffle'),
      },
      {
        title: 'Longest Word',
        slug: 'longest-word',
        description: 'Find the longest word containing the seed letters in order.',
        icon: longestWordIcon,
        emojiIcon: '📏',
        colors: { primary: '#7dd3fc', secondary: '#38bdf8' },
        gradient: 'linear-gradient(135deg, #7dd3fc 0%, #38bdf8 100%)',
        version: 'v1.0',
        component: () => import('../../pages/LongestWord'),
      },
      {
        title: 'Pyramid',
        slug: 'pyramid',
        description: 'Build words in a pyramid shape, adding one letter per row from clues.',
        icon: pyramidIcon,
        emojiIcon: '🐪',
        colors: { primary: '#c084fc', secondary: '#a855f7' },
        gradient: 'linear-gradient(135deg, #c084fc 0%, #a855f7 100%)',
        version: 'v1.0',
        component: () => import('../../pages/Pyramid'),
      },
      {
        title: 'WordTiles',
        slug: 'word-tiles',
        description: 'Score big with random tiles! Place a double word bonus strategically to maximize points.',
        icon: wordtilesIcon,
        emojiIcon: '🎯',
        colors: { primary: '#b45309', secondary: '#92400e' },
        gradient: 'linear-gradient(135deg, #b45309 0%, #92400e 100%)',
        version: 'v1.0',
        component: () => import('../../pages/WordTiles'),
      },
    ],
  },
  {
    name: 'Word Grids',
    icon: '🧇',
    description: 'Word puzzles on grids and boards',
    games: [
      {
        title: 'Crossword',
        slug: 'crossword',
        description: 'Solve the classic crossword puzzle! Fill in the grid using across and down clues.',
        icon: crosswordIcon,
        emojiIcon: '📰',
        colors: { primary: '#1e88e5', secondary: '#1565c0' },
        gradient: 'linear-gradient(135deg, #1e88e5 0%, #1565c0 100%)',
        version: 'v1.0',
        component: () => import('../../pages/Crossword'),
      },
      {
        title: 'Squar-ish',
        slug: 'squarish',
        description: 'Swap letters on the grid to form valid words in all directions.',
        icon: squarishIcon,
        emojiIcon: '🧇',
        colors: { primary: '#fbbf24', secondary: '#f59e0b' },
        gradient: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
        version: 'v1.0',
        component: () => import('../../pages/Squarish'),
      },
      {
        title: 'Letter Web',
        slug: 'letter-web',
        description: 'Use letters on box edges to spell connected words. Use all letters!',
        icon: letterwebIcon,
        emojiIcon: '📦',
        colors: { primary: '#6366f1', secondary: '#4f46e5' },
        gradient: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
        version: 'v1.0',
        component: () => import('../../pages/LetterWeb'),
      },
      {
        title: 'Letter Orbit',
        slug: 'letter-orbit',
        description: 'Form words using letters from 4 concentric orbit rings. Find words that span all orbits for bonus points!',
        icon: letterorbitIcon,
        emojiIcon: '🌀',
        colors: { primary: '#667eea', secondary: '#764ba2' },
        gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        version: 'v1.0',
        component: () => import('../../pages/LetterOrbit'),
      },
      {
        title: 'Word Search',
        slug: 'word-search',
        description: 'Find hidden words in a grid of letters. Words can go any direction!',
        icon: wordsearchIcon,
        emojiIcon: '🔍',
        colors: { primary: '#10b981', secondary: '#059669' },
        gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
        version: 'v1.0',
        component: () => import('../../pages/WordSearch'),
      },
      {
        title: 'Threads',
        slug: 'threads',
        description: 'Find themed words by connecting adjacent letters. Discover the MegaThread that ties them all together!',
        icon: threadsIcon,
        emojiIcon: '🧵',
        colors: { primary: '#a78bfa', secondary: '#6366f1' },
        gradient: 'linear-gradient(135deg, #a78bfa 0%, #6366f1 100%)',
        version: 'v1.0',
        component: () => import('../../pages/Threads'),
      },
      {
        title: 'Categories',
        slug: 'categories',
        aliases: ['Word Groups', 'Group Finder'],
        description: 'Find groups of four words that share a hidden connection. Four categories, four chances!',
        icon: categoriesIcon,
        emojiIcon: '🔗',
        colors: { primary: '#f9df6d', secondary: '#ba81c5' },
        gradient: 'linear-gradient(135deg, #f9df6d 0%, #a0c35a 33%, #b0c4ef 66%, #ba81c5 100%)',
        version: 'v1.0',
        component: () => import('../../pages/Categories'),
      },
      {
        title: 'FlipQuotes',
        slug: 'flipquotes',
        description: 'Flip letter tiles up or down to reveal the hidden quote. A satisfying twist on word puzzles!',
        icon: flipquotesIcon,
        emojiIcon: '🔄',
        colors: { primary: '#f472b6', secondary: '#a855f7' },
        gradient: 'linear-gradient(135deg, #f472b6 0%, #a855f7 100%)',
        version: 'v1.0',
        component: () => import('../../pages/FlipQuotes'),
      },
    ],
  },
  {
    name: 'Cipher & Decode',
    icon: '🔐',
    description: 'Crack codes and decrypt messages',
    games: [
      {
        title: 'Cryptogram',
        slug: 'cryptogram',
        aliases: ['Cipher Puzzle', 'Substitution Cipher'],
        description: 'Decode the secret message by cracking the letter substitution cipher!',
        icon: cryptogramIcon,
        emojiIcon: '🔐',
        colors: { primary: '#fbbf24', secondary: '#f59e0b' },
        gradient: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
        version: 'v1.0',
        component: () => import('../../pages/Cryptogram'),
      },
      {
        title: 'PhraseGuess',
        slug: 'phrase-guess',
        description: 'Guess letters to reveal the hidden phrase before you run out of chances!',
        icon: phraseguessIcon,
        emojiIcon: '🎡',
        colors: { primary: '#34d399', secondary: '#10b981' },
        gradient: 'linear-gradient(135deg, #34d399 0%, #10b981 100%)',
        version: 'v1.0',
        component: () => import('../../pages/PhraseGuess'),
      },
      {
        title: 'Word Arithmetic',
        slug: 'word-arithmetic',
        description: 'Assign digits to letters so the equation works. Classic SEND+MORE=MONEY puzzles!',
        icon: wordarithmeticIcon,
        emojiIcon: '🧮',
        colors: { primary: '#f59e0b', secondary: '#d97706' },
        gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
        version: 'v1.0',
        component: () => import('../../pages/WordArithmetic'),
      },
      {
        title: 'Drop Quotes',
        slug: 'drop-quotes',
        description: 'Letters drop down from columns to form a hidden quote. Arrange them correctly!',
        icon: dropquotesIcon,
        emojiIcon: '📜',
        colors: { primary: '#a78bfa', secondary: '#8b5cf6' },
        gradient: 'linear-gradient(135deg, #a78bfa 0%, #8b5cf6 100%)',
        version: 'v1.0',
        component: () => import('../../pages/DropQuotes'),
      },
      {
        title: 'Word Snake',
        slug: 'word-snake',
        description: 'Find the hidden word by tracing a continuous path through adjacent cells.',
        icon: wordsnakeIcon,
        emojiIcon: '🐍',
        colors: { primary: '#22c55e', secondary: '#16a34a' },
        gradient: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
        version: 'v1.0',
        component: () => import('../../pages/WordSnake'),
      },
    ],
  },
];

/**
 * Flatten all games from categories for easy access
 */
export const allGames = categories.flatMap(cat =>
  cat.games.map(game => ({ ...game, categoryName: cat.name }))
);

/**
 * Get a game by slug
 */
export function getGameBySlug(slug) {
  return allGames.find(game => game.slug === slug);
}

/**
 * Get game count for this pack
 */
export const gameCount = allGames.length;

/**
 * Default export includes everything needed
 */
export default {
  ...packInfo,
  categories,
  allGames,
  gameCount,
  getGameBySlug,
};
