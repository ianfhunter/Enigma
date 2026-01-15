/**
 * Strategy & Movement Pack Manifest
 *
 * Contains chess-based puzzles and strategic movement games.
 * Chess puzzles, Sokoban, and pathfinding challenges.
 */

// Custom SVG icons used by games in this pack
import pegsIcon from '../../assets/icons/pegs.svg';

/**
 * Pack metadata
 */
export const packInfo = {
  id: 'strategy-movement',
  type: 'official',
  name: 'Strategy & Movement',
  description: 'Chess puzzles, Sokoban, and strategic pathfinding challenges.',
  icon: '♟️',
  color: '#6366f1',
  version: '1.0.0',
  default: true,
  removable: true,
};

/**
 * Categories included in this pack
 */
export const categories = [
  {
    name: 'Chess & Movement',
    icon: '♟️',
    description: 'Chess-based puzzles and strategic movement',
    games: [
      {
        title: 'Chess Puzzles',
        slug: 'chess-puzzle',
        description: 'Solve tactical chess puzzles! Find the best move to checkmate or win material.',
        icon: '♟️',
        colors: { primary: '#b58863', secondary: '#8b6914' },
        gradient: 'linear-gradient(135deg, #b58863 0%, #8b6914 100%)',
        version: 'v1.0',
        component: () => import('../../pages/ChessPuzzle'),
      },
      {
        title: "Knight's Tour",
        slug: 'knights-tour',
        aliases: ['Knights Tour', 'Knight Tour Puzzle'],
        description: 'Move the knight to visit every square exactly once. A classic chess puzzle!',
        icon: '♞',
        colors: { primary: '#6366f1', secondary: '#4f46e5' },
        gradient: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
        version: 'v1.0',
        component: () => import('../../pages/KnightsTour'),
      },
      {
        title: 'N-Queens',
        slug: 'n-queens',
        aliases: ['Eight Queens', 'Queens Problem', '8 Queens Puzzle'],
        description: 'Place queens so none can attack each other. A classic combinatorial puzzle!',
        icon: '👑',
        colors: { primary: '#ec4899', secondary: '#db2777' },
        gradient: 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)',
        version: 'v1.0',
        component: () => import('../../pages/NQueens'),
      },
      {
        title: 'Chess Maze',
        slug: 'chess-maze',
        description: 'Navigate your piece to the goal without getting captured by enemy pieces!',
        icon: '🏰',
        colors: { primary: '#10b981', secondary: '#059669' },
        gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
        version: 'v1.0',
        component: () => import('../../pages/ChessMaze'),
      },
      {
        title: 'Theseus & the Minotaur',
        slug: 'theseus-minotaur',
        description: 'Guide Theseus to the exit while the Minotaur chases! Classic logic maze puzzle.',
        icon: '🐂',
        colors: { primary: '#f59e0b', secondary: '#dc2626' },
        gradient: 'linear-gradient(135deg, #f59e0b 0%, #dc2626 100%)',
        version: 'v1.0',
        component: () => import('../../pages/TheseusMinotaur'),
      },
      {
        title: 'Pegs',
        slug: 'pegs',
        aliases: ['Peg Solitaire', 'Solo Noble'],
        description: 'Classic peg solitaire: jump pegs to leave as few as possible.',
        icon: pegsIcon,
        emojiIcon: '📍',
        colors: { primary: '#f472b6', secondary: '#ec4899' },
        gradient: 'linear-gradient(135deg, #f472b6 0%, #ec4899 100%)',
        version: 'v1.0',
        component: () => import('../../pages/Pegs'),
      },
      {
        title: 'Sokoban',
        slug: 'sokoban',
        aliases: ['Warehouse Keeper', 'Box Pusher'],
        description: 'Push boxes onto targets with classic Sokoban rules. Includes Boxoban level packs.',
        icon: '📦',
        colors: { primary: '#22d3ee', secondary: '#0ea5e9' },
        gradient: 'linear-gradient(135deg, #22d3ee 0%, #0ea5e9 100%)',
        version: 'v1.0',
        component: () => import('../../pages/Sokoban'),
      },
      {
        title: 'Inertia',
        slug: 'inertia',
        description: 'Slide around an arena with momentum to reach the goal.',
        icon: '🧲',
        colors: { primary: '#0ea5e9', secondary: '#0284c7' },
        gradient: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)',
        version: 'v1.0',
        component: () => import('../../pages/Inertia'),
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
