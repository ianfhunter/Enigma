/**
 * Sudoku Family Pack Manifest
 *
 * Contains Sudoku and all its brilliant variants.
 * Killer Sudoku, Sandwich Sudoku, Calcudoku, and more.
 */

// Custom SVG icons used by games in this pack
import sudokuIcon from '../../assets/icons/sudoku.svg';

/**
 * Pack metadata
 */
export const packInfo = {
  id: 'sudoku-family',
  type: 'official',
  name: 'Sudoku Family',
  description: 'Sudoku and all its brilliant variants - Killer Sudoku, Sandwich Sudoku, Calcudoku, and more.',
  icon: '🔢',
  color: '#3b82f6',
  version: '1.0.0',
  default: true,
  removable: true,
};

/**
 * Categories included in this pack
 */
export const categories = [
  {
    name: 'Sudoku Family',
    icon: '🔢',
    description: 'Sudoku and number placement puzzles',
    games: [
      {
        title: 'Sudoku',
        slug: 'sudoku',
        aliases: ['Number Place', 'Su Doku'],
        description: 'Fill the 9×9 grid so each row, column, and box contains 1-9.',
        icon: sudokuIcon,
        emojiIcon: '🔢',
        colors: { primary: '#3b82f6', secondary: '#2563eb' },
        gradient: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
        version: 'v1.0',
        component: () => import('../../pages/Sudoku'),
      },
      {
        title: 'Killer Sudoku',
        slug: 'killer-sudoku',
        description: 'Sudoku with cage sums. Numbers in dotted cages must sum to the clue.',
        icon: '💀',
        colors: { primary: '#8b5cf6', secondary: '#ec4899' },
        gradient: 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)',
        version: 'v1.0',
        component: () => import('../../pages/KillerSudoku'),
      },
      {
        title: 'Sandwich Sudoku',
        slug: 'sandwich-sudoku',
        description: 'Sudoku where clues show the sum of digits sandwiched between 1 and 9. A 0 means they are adjacent.',
        icon: '🥪',
        colors: { primary: '#f59e0b', secondary: '#84cc16' },
        gradient: 'linear-gradient(135deg, #f59e0b 0%, #84cc16 100%)',
        version: 'v1.0',
        component: () => import('../../pages/SandwichSudoku'),
      },
      {
        title: 'Calcudoku',
        slug: 'calcudoku',
        aliases: ['Mathdoku', 'Square Wisdom'],
        description: 'Fill the grid using math clues. Like Sudoku meets arithmetic!',
        icon: '➕',
        colors: { primary: '#8b5cf6', secondary: '#7c3aed' },
        gradient: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
        version: 'v1.0',
        component: () => import('../../pages/Calcudoku'),
      },
      {
        title: 'Kakuro',
        slug: 'kakuro',
        aliases: ['Cross Sums', 'Kakro'],
        description: 'Fill in numbers that add up to the clues. A crossword with math!',
        icon: '➗',
        colors: { primary: '#06b6d4', secondary: '#0891b2' },
        gradient: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
        version: 'v1.0',
        component: () => import('../../pages/Kakuro'),
      },
      {
        title: 'Futoshiki',
        slug: 'futoshiki',
        aliases: ['More or Less', 'Hutosiki', 'Unequal'],
        description: 'Fill the grid following inequalities. Like Sudoku with greater-than clues!',
        icon: '⚖️',
        colors: { primary: '#fb7185', secondary: '#f43f5e' },
        gradient: 'linear-gradient(135deg, #fb7185 0%, #f43f5e 100%)',
        version: 'v1.0',
        component: () => import('../../pages/Futoshiki'),
      },
      {
        title: 'Str8ts',
        slug: 'str8ts',
        description: 'Fill white cells with 1-9. Compartments must form consecutive sequences!',
        icon: '🔢',
        colors: { primary: '#60a5fa', secondary: '#3b82f6' },
        gradient: 'linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)',
        version: 'v1.0',
        component: () => import('../../pages/Str8ts'),
      },
      {
        title: 'Kropki',
        slug: 'kropki',
        description: 'Fill the grid with numbers. White dots = consecutive, black dots = double.',
        icon: '⚫',
        colors: { primary: '#64748b', secondary: '#334155' },
        gradient: 'linear-gradient(135deg, #64748b 0%, #334155 100%)',
        version: 'v1.0',
        component: () => import('../../pages/Kropki'),
      },
      {
        title: 'Sujiko',
        slug: 'sujiko',
        description: 'Fill the 3×3 grid with 1-9. Circle clues show the sum of surrounding cells.',
        icon: '⭕',
        colors: { primary: '#fbbf24', secondary: '#f59e0b' },
        gradient: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
        version: 'v1.0',
        component: () => import('../../pages/Sujiko'),
      },
      {
        title: 'Skyscraper',
        slug: 'skyscraper',
        description: 'Fill the grid with building heights. Edge clues show how many buildings are visible.',
        icon: '🏙️',
        colors: { primary: '#6366f1', secondary: '#4f46e5' },
        gradient: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
        version: 'v1.0',
        component: () => import('../../pages/Skyscraper'),
      },
      {
        title: 'ABC End View',
        slug: 'abc-end-view',
        description: 'Place letters so clues show which letter is seen first from each edge.',
        icon: '🔤',
        colors: { primary: '#22c55e', secondary: '#16a34a' },
        gradient: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
        version: 'v1.0',
        component: () => import('../../pages/ABCEndView'),
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
