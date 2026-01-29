/**
 * International Word Games Pack Manifest
 *
 * Word games from around the world featuring different languages and cultural variations.
 */

// Custom SVG icons used by games in this pack
import shiritoriIcon from '../../assets/icons/shiritori.svg';

const internationalWordsPack = {
  id: 'international-words',
  type: 'official',
  name: 'International Word Games',
  description: 'Word games from around the world. Currently featuring Shiritori (しりとり) - the Japanese word chain game.',
  icon: '🌐',
  color: '#dc2626',
  version: '1769688178',
  default: true,
  removable: true,

  categories: [
    {
      name: 'International Word Games',
      icon: '🌐',
      description: 'Word games from different cultures around the world',
      games: [
        {
          slug: 'shiritori',
          title: 'しりとり',
          aliases: ['Word Chain', 'Last Letter Game'],
          description: 'Word chain game! Each word starts with the last letter of the previous.',
          icon: shiritoriIcon,
          emojiIcon: '🔗',
          colors: { primary: '#dc2626', secondary: '#b91c1c' },
          gradient: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
          tag: 'JP',
          component: () => import('../../pages/Shiritori'),
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

export default internationalWordsPack;
