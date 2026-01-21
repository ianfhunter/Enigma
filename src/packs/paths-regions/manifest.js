/**
 * Paths & Regions Pack Manifest
 *
 * Contains loop/path puzzles and region division puzzles.
 * Draw paths, connect loops, and divide grids into regions.
 */

// Custom SVG icons used by games in this pack
import mazeIcon from '../../assets/icons/maze.svg';
import litsIcon from '../../assets/icons/lits.svg';
import loopyIcon from '../../assets/icons/loopy.svg';
import yajilinIcon from '../../assets/icons/yajilin.svg';
import gokigennanameIcon from '../../assets/icons/gokigennaname.svg';
import tatamibariIcon from '../../assets/icons/tatamibari.svg';
import shikakuIcon from '../../assets/icons/shikaku.svg';
import fillominoIcon from '../../assets/icons/fillomino.svg';
import suguruIcon from '../../assets/icons/suguru.svg';
import rippleEffectIcon from '../../assets/icons/rippleEffect.svg';
import norinoriIcon from '../../assets/icons/norinori.svg';
import inshinoheyaIcon from '../../assets/icons/inshinoheya.svg';
import hotarubeamIcon from '../../assets/icons/hotarubeam.svg';
import hidatoIcon from '../../assets/icons/hidato.svg';
import numberlinkIcon from '../../assets/icons/numberlink.svg';
import slantIcon from '../../assets/icons/slant.svg';
import tracksIcon from '../../assets/icons/tracks.svg';
import bagIcon from '../../assets/icons/bag.svg';
import hashiIcon from '../../assets/icons/hashi.svg';

/**
 * Pack metadata
 */
export const packInfo = {
  id: 'paths-regions',
  type: 'official',
  name: 'Paths & Regions',
  description: 'Draw loops, connect paths, and divide grids. Hashi, Loopy, Numberlink, Shikaku, and more.',
  icon: '🔗',
  color: '#a855f7',
  version: '1.0.0',
  default: true,
  removable: true,
};

/**
 * Categories included in this pack
 */
export const categories = [
  {
    name: 'Loop & Path',
    icon: '🔗',
    description: 'Draw paths, loops, and connections',
    games: [
      {
        title: 'Numberlink',
        slug: 'numberlink',
        aliases: ['Number Link', 'Path Puzzle'],
        description: 'Connect matching number pairs without crossing paths.',
        icon: numberlinkIcon,
        emojiIcon: '🔗',
        colors: { primary: '#a78bfa', secondary: '#8b5cf6' },
        gradient: 'linear-gradient(135deg, #a78bfa 0%, #8b5cf6 100%)',
        version: 'v1.0',
        component: () => import('../../pages/Numberlink'),
      },
      {
        title: 'Hashi',
        slug: 'hashi',
        aliases: ['Bridges', 'Bridge Building'],
        description: 'Connect islands with bridges. Each island shows how many bridges connect to it.',
        icon: hashiIcon,
        emojiIcon: '🌉',
        colors: { primary: '#14b8a6', secondary: '#0d9488' },
        gradient: 'linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)',
        version: 'v1.0',
        component: () => import('../../pages/Hashi'),
      },
      {
        title: 'Loopy',
        slug: 'loopy',
        aliases: ['Fences', 'Loop the Loop', 'Takegaki'],
        description: 'Draw a single loop around the grid, satisfying the numeric clues.',
        icon: loopyIcon,
        emojiIcon: '⭕',
        colors: { primary: '#8b5cf6', secondary: '#7c3aed' },
        gradient: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
        version: 'v1.0',
        component: () => import('../../pages/Loopy'),
      },
      {
        title: 'Pearl',
        slug: 'pearl',
        aliases: ['White Pearls Black Pearls'],
        description: 'Draw a single loop through all pearls. Black pearls are corners with straight exits; white pearls are straight with a turn nearby.',
        icon: '🫧',
        colors: { primary: '#7dd3fc', secondary: '#38bdf8' },
        gradient: 'linear-gradient(135deg, #7dd3fc 0%, #38bdf8 100%)',
        version: 'v1.0',
        component: () => import('../../pages/Pearl'),
      },
      {
        title: 'Yajilin',
        slug: 'yajilin',
        description: 'Shade cells and draw a single closed loop. Arrow clues show shaded cells in that direction.',
        icon: yajilinIcon,
        emojiIcon: '↗️',
        colors: { primary: '#a855f7', secondary: '#9333ea' },
        gradient: 'linear-gradient(135deg, #a855f7 0%, #9333ea 100%)',
        version: 'v1.0',
        component: () => import('../../pages/Yajilin'),
      },
      {
        title: 'Slant',
        slug: 'slant',
        aliases: ['Diagonal'],
        description: 'Draw slashes in cells so the vertex counts match the clues.',
        icon: slantIcon,
        emojiIcon: '／',
        colors: { primary: '#e879f9', secondary: '#d946ef' },
        gradient: 'linear-gradient(135deg, #e879f9 0%, #d946ef 100%)',
        version: 'v1.0',
        component: () => import('../../pages/Slant'),
      },
      {
        title: 'Gokigen Naname',
        slug: 'gokigen-naname',
        description: 'Draw diagonals in cells. Numbers show how many lines meet at that point.',
        icon: gokigennanameIcon,
        emojiIcon: '／',
        colors: { primary: '#ec4899', secondary: '#f472b6' },
        gradient: 'linear-gradient(135deg, #ec4899 0%, #f472b6 100%)',
        version: 'v1.0',
        component: () => import('../../pages/GokigenNaname'),
      },
      {
        title: 'Hotaru Beam',
        slug: 'hotaru-beam',
        description: 'Draw lines forming closed loops. Each numbered circle shows how many line segments touch it.',
        icon: hotarubeamIcon,
        emojiIcon: '✨',
        colors: { primary: '#22d3ee', secondary: '#06b6d4' },
        gradient: 'linear-gradient(135deg, #22d3ee 0%, #06b6d4 100%)',
        version: 'v1.0',
        component: () => import('../../pages/HotaruBeam'),
      },
      {
        title: 'Hidato',
        slug: 'hidato',
        aliases: ['Number Snake', 'Number Path'],
        description: 'Fill the grid with consecutive numbers that connect horizontally, vertically, or diagonally.',
        icon: hidatoIcon,
        emojiIcon: '🔢',
        colors: { primary: '#f59e0b', secondary: '#d97706' },
        gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
        version: 'v1.0',
        component: () => import('../../pages/Hidato'),
      },
      {
        title: 'Signpost',
        slug: 'signpost',
        description: 'Link numbered squares into a continuous path using arrow directions.',
        icon: '⛳',
        colors: { primary: '#34d399', secondary: '#10b981' },
        gradient: 'linear-gradient(135deg, #34d399 0%, #10b981 100%)',
        version: 'v1.0',
        component: () => import('../../pages/Signpost'),
      },
      {
        title: 'Tracks',
        slug: 'tracks',
        description: 'Lay tracks through the grid to satisfy the numbers.',
        icon: tracksIcon,
        emojiIcon: '🛤️',
        colors: { primary: '#84cc16', secondary: '#65a30d' },
        gradient: 'linear-gradient(135deg, #84cc16 0%, #65a30d 100%)',
        version: 'v1.0',
        component: () => import('../../pages/Tracks'),
      },
      {
        title: 'Maze',
        slug: 'maze',
        description: 'Navigate from start to finish through the winding passages.',
        icon: mazeIcon,
        emojiIcon: '🌀',
        colors: { primary: '#4ade80', secondary: '#22c55e' },
        gradient: 'linear-gradient(135deg, #4ade80 0%, #22c55e 100%)',
        version: 'v1.0',
        component: () => import('../../pages/Maze'),
      },
      {
        title: 'Bag (Corral)',
        slug: 'bag',
        description: 'Draw a loop so numbered cells are inside and can see exactly that many cells.',
        icon: bagIcon,
        emojiIcon: '🎒',
        colors: { primary: '#14b8a6', secondary: '#0d9488' },
        gradient: 'linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)',
        version: 'v1.0',
        component: () => import('../../pages/Bag'),
      },
    ],
  },
  {
    name: 'Region Division',
    icon: '🔲',
    description: 'Divide grids into regions or place shapes',
    games: [
      {
        title: 'Shikaku',
        slug: 'shikaku',
        aliases: ['Rectangles', 'Divide by Box'],
        description: 'Divide the grid into rectangles. Each rectangle contains exactly one number showing its area.',
        icon: shikakuIcon,
        emojiIcon: '▢',
        colors: { primary: '#f472b6', secondary: '#ec4899' },
        gradient: 'linear-gradient(135deg, #f472b6 0%, #ec4899 100%)',
        version: 'v1.0',
        component: () => import('../../pages/Shikaku'),
      },
      {
        title: 'Fillomino',
        slug: 'fillomino',
        aliases: ['Polyominous'],
        description: 'Fill numbers so connected groups of the same number have that many cells.',
        icon: fillominoIcon,
        emojiIcon: '🔢',
        colors: { primary: '#8b5cf6', secondary: '#7c3aed' },
        gradient: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
        version: 'v1.0',
        component: () => import('../../pages/Fillomino'),
      },
      {
        title: 'Galaxies',
        slug: 'galaxies',
        description: 'Divide the grid into symmetric galaxies around their centers.',
        icon: '🌌',
        colors: { primary: '#6366f1', secondary: '#4f46e5' },
        gradient: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
        version: 'v1.0',
        component: () => import('../../pages/Galaxies'),
      },
      {
        title: 'Tatamibari',
        slug: 'tatamibari',
        description: 'Divide the grid into rectangles. Each contains one clue showing its shape.',
        icon: tatamibariIcon,
        emojiIcon: '🔲',
        colors: { primary: '#14b8a6', secondary: '#06b6d4' },
        gradient: 'linear-gradient(135deg, #14b8a6 0%, #06b6d4 100%)',
        version: 'v1.0',
        component: () => import('../../pages/Tatamibari'),
      },
      {
        title: 'LITS',
        slug: 'lits',
        description: 'Place L, I, T, S tetrominoes in regions. Same shapes cannot touch, all shaded cells must connect.',
        icon: litsIcon,
        emojiIcon: '🧱',
        colors: { primary: '#a855f7', secondary: '#6366f1' },
        gradient: 'linear-gradient(135deg, #a855f7 0%, #6366f1 100%)',
        version: 'v1.0',
        component: () => import('../../pages/LITS'),
      },
      {
        title: 'Suguru',
        slug: 'suguru',
        description: 'Fill regions with 1-N (region size). Same numbers cannot touch, even diagonally.',
        icon: suguruIcon,
        emojiIcon: '🔢',
        colors: { primary: '#f472b6', secondary: '#c084fc' },
        gradient: 'linear-gradient(135deg, #f472b6 0%, #c084fc 100%)',
        version: 'v1.0',
        component: () => import('../../pages/Suguru'),
      },
      {
        title: 'Ripple Effect',
        slug: 'ripple-effect',
        aliases: ['Hakyuu'],
        description: 'Fill rooms with 1-N. Same numbers in a row/column must be N cells apart.',
        icon: rippleEffectIcon,
        emojiIcon: '🌊',
        colors: { primary: '#63b3ed', secondary: '#3182ce' },
        gradient: 'linear-gradient(135deg, #63b3ed 0%, #3182ce 100%)',
        version: 'v1.0',
        component: () => import('../../pages/RippleEffect'),
      },
      {
        title: 'Norinori',
        slug: 'norinori',
        description: 'Shade cells to form dominoes. Each region must contain exactly 2 shaded cells.',
        icon: norinoriIcon,
        emojiIcon: '▪️',
        colors: { primary: '#8b5cf6', secondary: '#6366f1' },
        gradient: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
        version: 'v1.0',
        component: () => import('../../pages/Norinori'),
      },
      {
        title: 'Inshi no Heya',
        slug: 'inshi-no-heya',
        description: 'Fill numbers so each row/column has 1-N once. Numbers in each room must multiply to the clue.',
        icon: inshinoheyaIcon,
        emojiIcon: '✖️',
        colors: { primary: '#a78bfa', secondary: '#8b5cf6' },
        gradient: 'linear-gradient(135deg, #a78bfa 0%, #8b5cf6 100%)',
        version: 'v1.0',
        component: () => import('../../pages/InshiNoHeya'),
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
