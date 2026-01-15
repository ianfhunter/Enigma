/**
 * Card Games Pack Manifest
 *
 * Classic solitaire and card-based puzzles.
 */

const cardGamesPack = {
  id: 'card-games',
  type: 'official',
  name: 'Card Games',
  description: 'Classic solitaire and card-based puzzles. Clear the pyramid, build foundations, and more.',
  icon: '🃏',
  color: '#16a34a',
  version: '1.0.0',
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
          icon: '🔺',
          emojiIcon: '🔺',
          colors: { primary: '#16a34a', secondary: '#15803d' },
          gradient: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
          version: 'v1.0',
          component: () => import('../../pages/PyramidCards'),
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
