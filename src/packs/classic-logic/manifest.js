/**
 * Classic Logic Pack Manifest
 *
 * Contains pure deduction puzzles and memory/speed games.
 * Einstein puzzles, deduction games, and logic challenges.
 */

// Custom SVG icons used by games in this pack
import dominosaIcon from '../../assets/icons/dominosa.svg';
import countdownmathIcon from '../../assets/icons/countdownmath.svg';
import waterpouringIcon from '../../assets/icons/waterpouring.svg';
import blackboxIcon from '../../assets/icons/blackbox.svg';
import shinroIcon from '../../assets/icons/shinro.svg';
import rangeIcon from '../../assets/icons/range.svg';
import sequenceIcon from '../../assets/icons/sequence.svg';
import magnetsIcon from '../../assets/icons/magnets.svg';
import memorizeItemsIcon from '../../assets/icons/memorizeitems.svg';
import codebreakerIcon from '../../assets/icons/codebreaker.svg';
import memorymatchIcon from '../../assets/icons/memorymatch.svg';
import chimptestIcon from '../../assets/icons/chimptest.svg';
import navalbattleIcon from '../../assets/icons/navalbattle.svg';
import undeadIcon from '../../assets/icons/undead.svg';
import mapIcon from '../../assets/icons/map.svg';

/**
 * Pack metadata
 */
export const packInfo = {
  id: 'classic-logic',
  type: 'official',
  name: 'Classic Logic',
  description: 'Einstein puzzles, deduction games, and pure logic challenges.',
  icon: '🧠',
  color: '#8b5cf6',
  version: '1.0.0',
  default: true,
  removable: true,
};

/**
 * Categories included in this pack
 */
export const categories = [
  {
    name: 'Classic Logic',
    icon: '🧠',
    description: 'Pure deduction and reasoning puzzles',
    games: [
      {
        title: 'Einstein Puzzle',
        slug: 'einstein',
        aliases: ['Zebra Puzzle', 'Logic Grid Puzzle'],
        description: 'Use logical clues to deduce which items belong in each house. A classic zebra puzzle!',
        icon: '🧠',
        colors: { primary: '#c084fc', secondary: '#818cf8' },
        gradient: 'linear-gradient(135deg, #c084fc 0%, #818cf8 100%)',
        version: 'v1.0',
        component: () => import('../../pages/Einstein'),
      },
      {
        title: 'Knights & Knaves',
        slug: 'knights-and-knaves',
        aliases: ['Liars and Truth-Tellers', 'Truth and Lies'],
        description: 'Classic logic puzzles: decide who always tells the truth and who always lies.',
        icon: '🤥',
        colors: { primary: '#38bdf8', secondary: '#0284c7' },
        gradient: 'linear-gradient(135deg, #38bdf8 0%, #0284c7 100%)',
        version: 'v1.0',
        component: () => import('../../pages/KnightsAndKnaves'),
      },
      {
        title: 'Countdown Math',
        slug: 'countdown-math',
        description: 'Use six numbers and basic operations to reach the target number.',
        icon: countdownmathIcon,
        emojiIcon: '🧮',
        colors: { primary: '#f59e0b', secondary: '#d97706' },
        gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
        version: 'v1.0',
        component: () => import('../../pages/CountdownMath'),
      },
      {
        title: 'Water Pouring',
        slug: 'water-pouring',
        aliases: ['Water Jug Problem', 'Decanting Problem'],
        description: 'Measure exact amounts by pouring water between jugs of different sizes.',
        icon: waterpouringIcon,
        emojiIcon: '💧',
        colors: { primary: '#06b6d4', secondary: '#0891b2' },
        gradient: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
        version: 'v1.0',
        component: () => import('../../pages/WaterPouring'),
      },
      {
        title: 'Black Box',
        slug: 'blackbox',
        description: 'Shoot rays into a box to deduce where the hidden atoms are.',
        icon: blackboxIcon,
        emojiIcon: '⬛',
        colors: { primary: '#f59e0b', secondary: '#d97706' },
        gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
        version: 'v1.0',
        component: () => import('../../pages/Blackbox'),
      },
      {
        title: 'CodeBreaker',
        slug: 'code-breaker',
        aliases: ['Bulls and Cows', 'Cows and Bulls', 'Mastermind'],
        description: 'Crack the secret color code using logic and deduction.',
        icon: codebreakerIcon,
        emojiIcon: '🧠',
        colors: { primary: '#e879f9', secondary: '#d946ef' },
        gradient: 'linear-gradient(135deg, #e879f9 0%, #d946ef 100%)',
        version: 'v1.0',
        component: () => import('../../pages/CodeBreaker'),
      },
      {
        title: 'Dominosa',
        slug: 'dominosa',
        aliases: ['Domino Hunt', 'Domino Puzzle'],
        description: 'Place dominoes to cover the grid so each pair appears exactly once.',
        icon: dominosaIcon,
        emojiIcon: '🁢',
        colors: { primary: '#a855f7', secondary: '#9333ea' },
        gradient: 'linear-gradient(135deg, #a855f7 0%, #9333ea 100%)',
        version: 'v1.0',
        component: () => import('../../pages/Dominosa'),
      },
      {
        title: 'Magnets',
        slug: 'magnets',
        aliases: ['Plus and Minus', 'Magnetic Puzzle'],
        description: 'Place magnets with + and − poles so rows and columns match the counts.',
        icon: magnetsIcon,
        emojiIcon: '🧲',
        colors: { primary: '#ef4444', secondary: '#b91c1c' },
        gradient: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
        version: 'v1.0',
        component: () => import('../../pages/Magnets'),
      },
      {
        title: 'Range',
        slug: 'range',
        description: 'Use row/column clues to determine visibility and placement.',
        icon: rangeIcon,
        emojiIcon: '📏',
        colors: { primary: '#60a5fa', secondary: '#3b82f6' },
        gradient: 'linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)',
        version: 'v1.0',
        component: () => import('../../pages/Range'),
      },
      {
        title: 'Undead',
        slug: 'undead',
        description: 'Place ghosts and zombies so the line-of-sight clues are satisfied.',
        icon: undeadIcon,
        emojiIcon: '👻',
        colors: { primary: '#22c55e', secondary: '#16a34a' },
        gradient: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
        version: 'v1.0',
        component: () => import('../../pages/Undead'),
      },
      {
        title: 'Shinro',
        slug: 'shinro',
        description: 'Find hidden gems using arrow hints and row/column counts. A treasure hunt puzzle!',
        icon: shinroIcon,
        emojiIcon: '💎',
        colors: { primary: '#22d3ee', secondary: '#a855f7' },
        gradient: 'linear-gradient(135deg, #22d3ee 0%, #a855f7 100%)',
        version: 'v1.0',
        component: () => import('../../pages/Shinro'),
      },
      {
        title: 'Naval Battle',
        slug: 'naval-battle',
        description: 'Place ships on the grid using row/column clues. Ships cannot touch each other!',
        icon: navalbattleIcon,
        emojiIcon: '🚢',
        colors: { primary: '#0ea5e9', secondary: '#1e3a5f' },
        gradient: 'linear-gradient(135deg, #0ea5e9 0%, #1e3a5f 100%)',
        version: 'v1.0',
        component: () => import('../../pages/NavalBattle'),
      },
      {
        title: 'Map',
        slug: 'map',
        description: 'Color regions on a map so adjacent regions have different colors.',
        icon: mapIcon,
        emojiIcon: '🗺️',
        colors: { primary: '#22d3ee', secondary: '#06b6d4' },
        gradient: 'linear-gradient(135deg, #22d3ee 0%, #06b6d4 100%)',
        version: 'v1.0',
        component: () => import('../../pages/Map'),
      },
    ],
  },
  {
    name: 'Memory & Speed',
    icon: '⏱️',
    description: 'Test your memory and quick thinking',
    games: [
      {
        title: 'Sequence',
        slug: 'sequence',
        aliases: ['Memory Sequence', 'Color Sequence'],
        description: 'Watch, remember, repeat! How long a sequence can you memorize?',
        icon: sequenceIcon,
        emojiIcon: '🔴',
        colors: { primary: '#f43f5e', secondary: '#e11d48' },
        gradient: 'linear-gradient(135deg, #f43f5e 0%, #e11d48 100%)',
        version: 'v1.0',
        component: () => import('../../pages/Sequence'),
      },
      {
        title: 'Memory Match',
        slug: 'memory-match',
        aliases: ['Concentration', 'Pairs', 'Pelmanism', 'Match Match'],
        description: 'Flip cards to find matching pairs. Test your memory!',
        icon: memorymatchIcon,
        emojiIcon: '🃏',
        colors: { primary: '#fcd34d', secondary: '#fbbf24' },
        gradient: 'linear-gradient(135deg, #fcd34d 0%, #fbbf24 100%)',
        version: 'v1.0',
        component: () => import('../../pages/MemoryMatch'),
      },
      {
        title: 'Chimp Test',
        slug: 'chimp-test',
        description: 'Remember and click numbered boxes in order. The sequence gets longer each round!',
        icon: chimptestIcon,
        emojiIcon: '🦍',
        colors: { primary: '#8b5cf6', secondary: '#7c3aed' },
        gradient: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
        version: 'v1.0',
        component: () => import('../../pages/ChimpTest'),
      },
      {
        title: 'Memorize Items',
        slug: 'memorize-items',
        description: 'Study items shown briefly, then select all the items you remember from the scene!',
        icon: memorizeItemsIcon,
        emojiIcon: '🧠',
        colors: { primary: '#06b6d4', secondary: '#0891b2' },
        gradient: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
        version: 'v1.0',
        component: () => import('../../pages/MemorizeItems'),
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
