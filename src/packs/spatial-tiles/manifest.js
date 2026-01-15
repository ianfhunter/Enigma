/**
 * Spatial & Tiles Pack Manifest
 *
 * Contains tile manipulation and spatial puzzles.
 * Jigsaws, sliding puzzles, rotation puzzles, and more.
 */

// Custom SVG icons used by games in this pack
import pipePuzzleIcon from '../../assets/icons/pipe-puzzle.svg';
import stainedGlassIcon from '../../assets/icons/stained-glass.svg';
import towerOfHanoiIcon from '../../assets/icons/tower-of-hanoi.svg';
import CirkitzIcon from '../../pages/Cirkitz/CirkitzIcon';

/**
 * Pack metadata
 */
export const packInfo = {
  id: 'spatial-tiles',
  type: 'official',
  name: 'Spatial & Tiles',
  description: 'Jigsaws, sliding puzzles, and tile manipulation games.',
  icon: '🧩',
  color: '#f97316',
  version: '1.0.0',
  default: true,
  removable: true,
};

/**
 * Categories included in this pack
 */
export const categories = [
  {
    name: 'Tile & Spatial',
    icon: '🧩',
    description: 'Manipulate tiles, pieces, and spatial puzzles',
    games: [
      {
        title: 'Jigsaw',
        slug: 'jigsaw',
        description: 'Drag and drop interlocking pieces to complete the picture puzzle!',
        icon: '🧩',
        colors: { primary: '#fb923c', secondary: '#f97316' },
        gradient: 'linear-gradient(135deg, #fb923c 0%, #f97316 100%)',
        version: 'v1.0',
        component: () => import('../../pages/Jigsaw'),
      },
      {
        title: 'Sliding Puzzle',
        slug: 'sliding-puzzle',
        description: 'Slide tiles to complete the image. A classic brain teaser!',
        icon: '🔲',
        colors: { primary: '#14b8a6', secondary: '#0d9488' },
        gradient: 'linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)',
        version: 'v1.0',
        component: () => import('../../pages/SlidingPuzzle'),
      },
      {
        title: 'Congestion',
        slug: 'congestion',
        aliases: ['Traffic Jam', 'Sliding Block Puzzle'],
        description: 'Slide cars and trucks to free the red car from the traffic jam!',
        icon: '🚗',
        colors: { primary: '#ef4444', secondary: '#dc2626' },
        gradient: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
        version: 'v1.0',
        component: () => import('../../pages/Congestion'),
      },
      {
        title: 'Tile Swap',
        slug: 'tile-swap',
        description: 'Swap tiles to reassemble the scrambled image.',
        icon: '🔄',
        colors: { primary: '#818cf8', secondary: '#6366f1' },
        gradient: 'linear-gradient(135deg, #818cf8 0%, #6366f1 100%)',
        version: 'v1.0',
        component: () => import('../../pages/TileSwap'),
      },
      {
        title: 'Cirkitz',
        slug: 'cirkitz',
        description: 'Rotate hexagonal tiles so all adjacent circuit wedges connect.',
        icon: CirkitzIcon,
        colors: { primary: '#38bdf8', secondary: '#f472b6' },
        gradient: 'linear-gradient(135deg, #f472b6 0%, #38bdf8 33%, #fbbf24 66%, #34d399 100%)',
        version: 'v1.0',
        component: () => import('../../pages/Cirkitz'),
      },
      {
        title: 'Pipe Puzzle',
        slug: 'pipe-puzzle',
        description: 'Rotate pipe segments to create a continuous flow from start to end.',
        icon: pipePuzzleIcon,
        emojiIcon: '🔧',
        colors: { primary: '#2dd4bf', secondary: '#14b8a6' },
        gradient: 'linear-gradient(135deg, #2dd4bf 0%, #14b8a6 100%)',
        version: 'v1.0',
        component: () => import('../../pages/PipePuzzle'),
      },
      {
        title: 'Flood It',
        slug: 'flood-it',
        aliases: ['Color Flood', 'Floodfill'],
        description: 'Fill the board with one color in limited moves. Start from the corner!',
        icon: '🌊',
        colors: { primary: '#38bdf8', secondary: '#0ea5e9' },
        gradient: 'linear-gradient(135deg, #38bdf8 0%, #0ea5e9 100%)',
        version: 'v1.0',
        component: () => import('../../pages/FloodIt'),
      },
      {
        title: 'Color Cube 3×3×3',
        slug: 'color-cube',
        description: 'Scramble and solve a classic 3×3×3 color cube using standard moves (U/D/L/R/F/B).',
        icon: '🧊',
        colors: { primary: '#22c55e', secondary: '#3b82f6' },
        gradient: 'linear-gradient(135deg, #22c55e 0%, #3b82f6 100%)',
        version: 'v1.0',
        component: () => import('../../pages/ColorCube'),
      },
      {
        title: 'Entanglement',
        slug: 'entanglement',
        description: 'Place and rotate hex tiles to extend the path as far as possible without escaping the board.',
        icon: '🕸️',
        colors: { primary: '#22d3ee', secondary: '#a855f7' },
        gradient: 'linear-gradient(135deg, #22d3ee 0%, #a855f7 100%)',
        version: 'v1.0',
        component: () => import('../../pages/Entanglement'),
      },
      {
        title: 'Stained Glass',
        slug: 'stained-glass',
        description: 'Color each region so no two adjacent regions share the same color.',
        icon: stainedGlassIcon,
        emojiIcon: '🎨',
        colors: { primary: '#f472b6', secondary: '#c084fc' },
        gradient: 'linear-gradient(135deg, #f472b6 0%, #c084fc 50%, #60a5fa 100%)',
        version: 'v1.0',
        component: () => import('../../pages/StainedGlass'),
      },
      {
        title: 'Tower of Hanoi',
        slug: 'tower-of-hanoi',
        aliases: ['Tower of Brahma', 'Lucas Tower'],
        description: "Move the disk stack to another peg. Larger disks can't go on smaller ones!",
        icon: towerOfHanoiIcon,
        emojiIcon: '🗼',
        colors: { primary: '#84cc16', secondary: '#65a30d' },
        gradient: 'linear-gradient(135deg, #84cc16 0%, #65a30d 100%)',
        version: 'v1.0',
        component: () => import('../../pages/TowerOfHanoi'),
      },
      {
        title: 'Fifteen',
        slug: 'fifteen',
        aliases: ['15 Puzzle', 'Gem Puzzle', 'Boss Puzzle', 'Game of Fifteen'],
        description: 'Classic 15-puzzle: slide tiles to put them in order.',
        icon: '1️⃣',
        colors: { primary: '#22c55e', secondary: '#16a34a' },
        gradient: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
        version: 'v1.0',
        component: () => import('../../pages/Fifteen'),
      },
      {
        title: 'Sixteen',
        slug: 'sixteen',
        description: 'Classic 16-tile sliding puzzle variant.',
        icon: '🔢',
        colors: { primary: '#06b6d4', secondary: '#0891b2' },
        gradient: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
        version: 'v1.0',
        component: () => import('../../pages/Sixteen'),
      },
      {
        title: 'Twiddle',
        slug: 'twiddle',
        description: 'Rotate tiles to match a target arrangement.',
        icon: '🌀',
        colors: { primary: '#14b8a6', secondary: '#0d9488' },
        gradient: 'linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)',
        version: 'v1.0',
        component: () => import('../../pages/Twiddle'),
      },
      {
        title: 'Netgame',
        slug: 'netgame',
        description: 'Rotate tiles to connect the entire network.',
        icon: '🕸️',
        colors: { primary: '#10b981', secondary: '#059669' },
        gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
        version: 'v1.0',
        component: () => import('../../pages/Netgame'),
      },
      {
        title: 'Netslide',
        slug: 'netslide',
        description: 'Slide tiles to connect the entire network.',
        icon: '🧩',
        colors: { primary: '#4ade80', secondary: '#22c55e' },
        gradient: 'linear-gradient(135deg, #4ade80 0%, #22c55e 100%)',
        version: 'v1.0',
        component: () => import('../../pages/Netslide'),
      },
      {
        title: 'Cube',
        slug: 'cube',
        description: 'Solve a cube puzzle by rotating faces to restore order.',
        icon: '🧊',
        colors: { primary: '#38bdf8', secondary: '#0ea5e9' },
        gradient: 'linear-gradient(135deg, #38bdf8 0%, #0ea5e9 100%)',
        version: 'v1.0',
        component: () => import('../../pages/Cube'),
      },
      {
        title: 'Untangle',
        slug: 'untangle',
        description: 'Move points so the lines stop crossing.',
        icon: '🕸️',
        colors: { primary: '#fbbf24', secondary: '#f59e0b' },
        gradient: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
        version: 'v1.0',
        component: () => import('../../pages/Untangle'),
      },
      {
        title: 'Samegame',
        slug: 'samegame',
        description: 'Remove groups of adjacent tiles to clear the board efficiently.',
        icon: '🧩',
        colors: { primary: '#f97316', secondary: '#ea580c' },
        gradient: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
        version: 'v1.0',
        component: () => import('../../pages/Samegame'),
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
