/**
 * Card Games Pack Manifest
 *
 * Classic solitaire and card-based puzzles.
 */

// Custom SVG icons used by games in this pack
import pyramidcardsIcon from '../../assets/icons/pyramidcards.svg';
import tripeaksIcon from '../../assets/icons/tripeaks.svg';

const cardGamesPack = {
  id: 'card-games',
  type: 'official',
  name: 'Card Games',
  description: 'Classic solitaire and card-based puzzles. Clear the pyramid, build foundations, and more.',
  icon: '🃏',
  color: '#16a34a',
  version: '1769688178',
  default: true,
  removable: true,

  categories: [
    {
      name: 'Card Games',
      icon: '🃏',
      description: 'Classic solitaire and card-based puzzles',
      games: [
        {
          slug: 'pyramid-cards',
          title: 'Pyramid Cards',
          aliases: ['Pyramid Solitaire', 'Tut\'s Tomb'],
          description: 'Remove pairs of cards that sum to 13 to clear the pyramid. Kings remove alone!',
          icon: pyramidcardsIcon,
          emojiIcon: '🔺',
          colors: { primary: '#16a34a', secondary: '#15803d' },
          gradient: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
          component: () => import('../../pages/PyramidCards'),
          lastModified: 1769688178000
        },
        {
          slug: 'tri-peaks',
          title: 'Tri-Peaks',
          aliases: ['Tri Peaks', 'Three Peaks'],
          description: 'Clear three peaks by removing cards adjacent to the waste card. Cards are adjacent if they differ by 1 rank (wrapping A-2-K).',
          icon: tripeaksIcon,
          emojiIcon: '⛰️',
          colors: { primary: '#16a34a', secondary: '#15803d' },
          gradient: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
          component: () => import('../../pages/TriPeaks'),
          lastModified: 1769688178000
        },
      ],
    },
  ],

  /**
   * Get all games in this pack (flattened from categories with categoryName)
   */
  get allGames() {
    return this.categories.flatMap(cat =>
      cat.games.map(game => ({ ...game, categoryName: cat.name }))
    );
  },

  /**
   * Find a game by slug
   */
  getGameBySlug(slug) {
    return this.allGames.find(g => g.slug === slug);
  },

  /**
   * Total game count
   */
  get gameCount() {
    return this.allGames.length;
  },

  /**
   * Preview games for pack display (first 4)
   */
  getPreviewGames() {
    return this.allGames.slice(0, 4);
  },
};

export default cardGamesPack;
