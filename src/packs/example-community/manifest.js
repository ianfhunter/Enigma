/**
 * Example Community Pack Manifest
 *
 * This is an example of a community pack with a backend.
 * It demonstrates how to create games that use server-side APIs.
 *
 * ⚠️ COMMUNITY PACK: This pack has backend code that runs on your server.
 */

const exampleCommunityPack = {
  id: 'example-community',
  type: 'community',
  name: 'Example Community Pack',
  description: 'A demo pack showing how community packs with backends work. Features a daily number guessing challenge!',
  icon: '🌟',
  color: '#8b5cf6',
  version: '1.0.0',
  author: 'Enigma Team',
  default: false,  // Community packs not installed by default
  removable: true,
  hasBackend: true, // Indicates this pack has server-side code

  categories: [
    {
      name: 'Community Examples',
      icon: '🌟',
      description: 'Example games showing community pack features',
      games: [
        {
          slug: 'daily-number',
          title: 'Daily Number',
          description: 'Guess the secret number! A new challenge every day with server-generated puzzles.',
          icon: '🔢',
          emojiIcon: '🔢',
          colors: { primary: '#8b5cf6', secondary: '#7c3aed' },
          gradient: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
          version: 'v1.0',
          component: () => import('./games/DailyNumber'),
        },
      ],
    },
  ],

  /**
   * Get all games in this pack
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
   * Preview games for pack display
   */
  getPreviewGames() {
    return this.allGames.slice(0, 4);
  },
};

export default exampleCommunityPack;
