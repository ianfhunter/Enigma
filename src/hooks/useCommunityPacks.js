/**
 * useCommunityPacks Hook
 *
 * Fetches installed community pack manifests from the backend
 * and provides them for display in the main interface.
 */

import { useState, useEffect, useCallback } from 'react';
import { communitySources } from '../api/client';

/**
 * Hook to fetch and manage installed community pack data
 */
export function useCommunityPacks() {
  const [communityPacks, setCommunityPacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPacks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await communitySources.getInstalledManifests();
      setCommunityPacks(data.manifests || []);
    } catch (err) {
      console.error('Failed to fetch community packs:', err);
      setError(err.message);
      setCommunityPacks([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPacks();
  }, [fetchPacks]);

  /**
   * Refresh community packs data
   */
  const refresh = useCallback(() => {
    return fetchPacks();
  }, [fetchPacks]);

  /**
   * Get all games from all community packs
   */
  const getAllGames = useCallback(() => {
    return communityPacks.flatMap(pack => pack.allGames || []);
  }, [communityPacks]);

  /**
   * Get categories from all community packs
   */
  const getAllCategories = useCallback(() => {
    return communityPacks.flatMap(pack =>
      (pack.categories || []).map(cat => ({
        ...cat,
        packId: pack.id,
        packName: pack.name,
        packIcon: pack.icon,
      }))
    );
  }, [communityPacks]);

  /**
   * Find a game by slug across all community packs
   */
  const getGameBySlug = useCallback((slug) => {
    for (const pack of communityPacks) {
      const game = (pack.allGames || []).find(g => g.slug === slug);
      if (game) {
        return { ...game, packId: pack.id };
      }
    }
    return null;
  }, [communityPacks]);

  return {
    communityPacks,
    loading,
    error,
    refresh,
    getAllGames,
    getAllCategories,
    getGameBySlug,
  };
}

export default useCommunityPacks;

