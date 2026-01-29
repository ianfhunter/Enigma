/**
 * Shading Puzzles Pack Manifest
 *
 * Contains all grid shading puzzles: Nonogram, Minesweeper, Nurikabe, and more.
 * These puzzles involve shading or filling cells based on clues.
 */

// Custom SVG icons
import hitoriIcon from '../../assets/icons/hitori.svg';
import nonogramIcon from '../../assets/icons/nonogram.svg';
import mosaicIcon from '../../assets/icons/mosaic.svg';
import lightsoutIcon from '../../assets/icons/lightsout.svg';
import kurottoIcon from '../../assets/icons/kurotto.svg';
import takuzuIcon from '../../assets/icons/takuzu.svg';
import yinyangIcon from '../../assets/icons/yinyang.svg';
import creekIcon from '../../assets/icons/creek.svg';
import minesweeperIcon from '../../assets/icons/minesweeper.svg';
import starbattleIcon from '../../assets/icons/starbattle.svg';
import tapaIcon from '../../assets/icons/tapa.svg';
import nurikabeIcon from '../../assets/icons/nurikabe.svg';
import aquariumIcon from '../../assets/icons/aquarium.svg';
import lightupIcon from '../../assets/icons/lightup.svg';
import campixuIcon from '../../assets/icons/campixu.svg';
import thermometersIcon from '../../assets/icons/thermometers.svg';
import mochikoroIcon from '../../assets/icons/mochikoro.svg';

/**
 * Pack metadata
 */
export const packInfo = {
  id: 'shading-puzzles',
  type: 'official',
  name: 'Shading Puzzles',
  description: 'Shade cells to reveal pictures or satisfy clues. Nonogram, Minesweeper, Nurikabe, and more.',
  icon: '⬛',
  color: '#f472b6',
  version: '1769688178',
  default: true,
  removable: true,
};

/**
 * Categories included in this pack
 */
export const categories = [
  {
    name: 'Grid Shading',
    icon: '⬛',
    description: 'Shade or fill cells based on clues',
    games: [
      {
        title: 'Nonogram',
        slug: 'nonogram',
        aliases: ['Paint by Numbers', 'Hanjie', 'Japanese Crossword'],
        description: 'Fill in cells using number clues to reveal a hidden picture!',
        icon: nonogramIcon,
        emojiIcon: '🖼️',
        colors: { primary: '#f472b6', secondary: '#db2777' },
        gradient: 'linear-gradient(135deg, #f472b6 0%, #db2777 100%)',
        component: () => import('../../pages/Nonogram'),
        lastModified: 1769688178000
      },
      {
        title: 'Minesweeper',
        slug: 'minesweeper',
        aliases: ['Mines', 'Mine Sweeper'],
        description: "Clear the minefield using number clues. Don't click a mine!",
        icon: minesweeperIcon,
        emojiIcon: '💣',
        colors: { primary: '#ef4444', secondary: '#dc2626' },
        gradient: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
        component: () => import('../../pages/Minesweeper'),
        lastModified: 1769688178000
      },
      {
        title: 'Nurikabe',
        slug: 'nurikabe',
        aliases: ['Cell Structure', 'Island Puzzle'],
        description: 'Shade cells to form one connected sea around numbered islands of the given sizes.',
        icon: nurikabeIcon,
        emojiIcon: '🌊',
        colors: { primary: '#3b82f6', secondary: '#2563eb' },
        gradient: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
        component: () => import('../../pages/Nurikabe'),
        lastModified: 1769688178000
      },
      {
        title: 'Hitori',
        slug: 'hitori',
        aliases: ['Hitori ni Shite Kure', 'Leave Me Alone'],
        description: 'Shade cells to eliminate duplicates while keeping unshaded cells connected.',
        icon: hitoriIcon,
        emojiIcon: '⬛',
        colors: { primary: '#71717a', secondary: '#52525b' },
        gradient: 'linear-gradient(135deg, #71717a 0%, #52525b 100%)',
        component: () => import('../../pages/Hitori'),
        lastModified: 1769688178000
      },
      {
        title: 'Aquarium',
        slug: 'aquarium',
        aliases: ['Water Fun', 'Fill the Tanks'],
        description: 'Fill water in tanks to match row and column totals. Water settles to the bottom!',
        icon: aquariumIcon,
        emojiIcon: '🐠',
        colors: { primary: '#06b6d4', secondary: '#0891b2' },
        gradient: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
        component: () => import('../../pages/Aquarium'),
        lastModified: 1769688178000
      },
      {
        title: 'Star Battle',
        slug: 'star-battle',
        aliases: ['Two Not Touch', 'Sternenschlacht'],
        description: 'Place stars so each row, column, and region has exactly the right count. No touching!',
        icon: starbattleIcon,
        emojiIcon: '⭐',
        colors: { primary: '#fbbf24', secondary: '#f59e0b' },
        gradient: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
        component: () => import('../../pages/StarBattle'),
        lastModified: 1769688178000
      },
      {
        title: 'Campixu',
        slug: 'campixu',
        description: 'Place tents using nonogram clues. Tents must be next to trees and cannot touch.',
        icon: campixuIcon,
        emojiIcon: '🏕️',
        colors: { primary: '#22c55e', secondary: '#84cc16' },
        gradient: 'linear-gradient(135deg, #22c55e 0%, #84cc16 100%)',
        component: () => import('../../pages/Campixu'),
        lastModified: 1769688178000
      },
      {
        title: 'Takuzu',
        slug: 'takuzu',
        aliases: ['Binary Puzzle', 'Binero'],
        description: 'Fill the grid with 0s and 1s. No more than two in a row, equal count per line!',
        icon: takuzuIcon,
        emojiIcon: '🔘',
        colors: { primary: '#0ea5e9', secondary: '#0284c7' },
        gradient: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)',
        component: () => import('../../pages/Takuzu'),
        lastModified: 1769688178000
      },
      {
        title: 'Yin-Yang',
        slug: 'yin-yang',
        aliases: ['Shiromaru-Kuromaru'],
        description: 'Fill cells black or white. Each color must connect. No 2×2 same color.',
        icon: yinyangIcon,
        emojiIcon: '☯️',
        colors: { primary: '#1a1a1a', secondary: '#666666' },
        gradient: 'linear-gradient(135deg, #1a1a1a 0%, #666666 100%)',
        component: () => import('../../pages/YinYang'),
        lastModified: 1769688178000
      },
      {
        title: 'Creek',
        slug: 'creek',
        description: 'Shade cells based on corner clues. Each number shows adjacent shaded cells.',
        icon: creekIcon,
        emojiIcon: '🏞️',
        colors: { primary: '#06b6d4', secondary: '#22d3ee' },
        gradient: 'linear-gradient(135deg, #06b6d4 0%, #22d3ee 100%)',
        component: () => import('../../pages/Creek'),
        lastModified: 1769688178000
      },
      {
        title: 'Kurotto',
        slug: 'kurotto',
        description: 'Shade cells so circled numbers equal the sum of adjacent shaded group sizes.',
        icon: kurottoIcon,
        emojiIcon: '⭕',
        colors: { primary: '#8b5cf6', secondary: '#6366f1' },
        gradient: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
        component: () => import('../../pages/Kurotto'),
        lastModified: 1769688178000
      },
      {
        title: 'Thermometers',
        slug: 'thermometers',
        aliases: ['Thermometer Puzzle', 'Mercury'],
        description: 'Fill thermometers from the bulb. Numbers show filled cells per row/column.',
        icon: thermometersIcon,
        emojiIcon: '🌡️',
        colors: { primary: '#ef4444', secondary: '#f97316' },
        gradient: 'linear-gradient(135deg, #ef4444 0%, #f97316 100%)',
        component: () => import('../../pages/Thermometers'),
        lastModified: 1769688178000
      },
      {
        title: 'Lights Out',
        slug: 'lights-out',
        aliases: ['Toggle Puzzle', 'XOR Puzzle'],
        description: 'Toggle lights to turn them all off. Each press affects neighbors!',
        icon: lightsoutIcon,
        emojiIcon: '💡',
        colors: { primary: '#facc15', secondary: '#eab308' },
        gradient: 'linear-gradient(135deg, #facc15 0%, #eab308 100%)',
        component: () => import('../../pages/LightsOut'),
        lastModified: 1769688178000
      },
      {
        title: 'Light Up',
        slug: 'lightup',
        aliases: ['Light Placement', 'Bijutsukan'],
        description: 'Place lights so every cell is lit, without lights seeing each other.',
        icon: lightupIcon,
        emojiIcon: '💡',
        colors: { primary: '#fde047', secondary: '#facc15' },
        gradient: 'linear-gradient(135deg, #fde047 0%, #facc15 100%)',
        component: () => import('../../pages/Lightup'),
        lastModified: 1769688178000
      },
      {
        title: 'Mosaic',
        slug: 'mosaic',
        description: 'Shade tiles to match the numeric clues.',
        icon: mosaicIcon,
        emojiIcon: '🧱',
        colors: { primary: '#71717a', secondary: '#52525b' },
        gradient: 'linear-gradient(135deg, #71717a 0%, #52525b 100%)',
        component: () => import('../../pages/Mosaic'),
        lastModified: 1769688178000
      },
      {
        title: 'Tapa',
        slug: 'tapa',
        aliases: ['Tapa Puzzle'],
        description: 'Shade cells so clue numbers show consecutive shaded groups around them. All shaded cells must connect!',
        icon: tapaIcon,
        emojiIcon: '⬛',
        colors: { primary: '#a855f7', secondary: '#6366f1' },
        gradient: 'linear-gradient(135deg, #a855f7 0%, #6366f1 100%)',
        component: () => import('../../pages/Tapa'),
        lastModified: 1769688178000
      },
      {
        title: 'Mochikoro',
        slug: 'mochikoro',
        aliases: ['Rectangle Division'],
        description: 'Divide the grid into white rectangles. Each contains one number showing its area. Fill gaps with black.',
        icon: mochikoroIcon,
        emojiIcon: '📦',
        colors: { primary: '#10b981', secondary: '#059669' },
        gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
        component: () => import('../../pages/Mochikoro'),
        lastModified: 1769688178000
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
