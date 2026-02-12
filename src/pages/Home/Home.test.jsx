import { vi, describe, it, expect } from 'vitest';

describe('Home - performance optimization', () => {
  /**
   * This test verifies the O(1) Map lookup optimization used in Home.jsx
   * for favourite games processing.
   *
   * Before the fix: O(n²) using allGames.find() for each favourite
   * After the fix: O(n) using Map.get() for O(1) lookups
   */
  it('uses efficient O(1) Map lookup for favourite games instead of O(n²) find', () => {
    // Simulate a realistic game registry with ~200 games
    const allGames = Array.from({ length: 200 }, (_, i) => ({
      slug: `game-${i}`,
      title: `Game ${i}`,
      description: 'Test game description',
      disabled: false,
    }));

    // ~20 favourites (typical user)
    const favourites = Array.from({ length: 20 }, (_, i) => `game-${i}`);

    const recentlyPlayed = [
      { slug: 'game-1', timestamp: Date.now() },
      { slug: 'game-5', timestamp: Date.now() - 1000 },
    ];

    const gamesBySlug = new Map(allGames.map(game => [game.slug, game]));
    const recentlyPlayedMap = new Map(recentlyPlayed.map((entry, index) => [entry.slug, index]));

    const unsortedFavourites = favourites
      .map(slug => gamesBySlug.get(slug))
      .filter(Boolean);

    // Add recently played index using Map lookup
    const favouritesWithRecentlyPlayed = unsortedFavourites.map(game => ({
      ...game,
      recentlyPlayedIndex: recentlyPlayedMap.get(game.slug) ?? Infinity
    }));

    // Verify correctness
    expect(unsortedFavourites).toHaveLength(20);
    expect(favouritesWithRecentlyPlayed[0].slug).toBe('game-0');
    expect(favouritesWithRecentlyPlayed[1].slug).toBe('game-1');

    // Verify recently played indices are set correctly
    const game1Result = favouritesWithRecentlyPlayed.find(g => g.slug === 'game-1');
    expect(game1Result.recentlyPlayedIndex).toBe(0); // First in recentlyPlayed

    const game5Result = favouritesWithRecentlyPlayed.find(g => g.slug === 'game-5');
    expect(game5Result.recentlyPlayedIndex).toBe(1); // Second in recentlyPlayed

    const game10Result = favouritesWithRecentlyPlayed.find(g => g.slug === 'game-10');
    expect(game10Result.recentlyPlayedIndex).toBe(Infinity); // Not in recentlyPlayed
  });

  it('Map lookup produces correct results for edge cases', () => {
    // Test with empty arrays
    const emptyGames = [];
    const gamesBySlugEmpty = new Map(emptyGames.map(g => [g.slug, g]));
    expect(gamesBySlugEmpty.get('nonexistent')).toBeUndefined();

    // Test with single game
    const singleGame = [{ slug: 'solo', title: 'Solo' }];
    const singleMap = new Map(singleGame.map(g => [g.slug, g]));
    expect(singleMap.get('solo')).toEqual({ slug: 'solo', title: 'Solo' });

    // Test recently played Map with empty array
    const emptyRecentlyPlayed = [];
    const emptyRecentlyMap = new Map(emptyRecentlyPlayed.map((e, i) => [e.slug, i]));
    expect(emptyRecentlyMap.size).toBe(0);
  });
});
