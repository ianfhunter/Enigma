import { useState, useEffect, useCallback, useRef } from 'react';
import { games } from '../api/client';

/**
 * Hook for managing game progress with the backend API.
 * Provides automatic loading, caching, and debounced updates.
 *
 * @param {string} gameSlug - The unique identifier for the game
 * @returns {Object} - { progress, updateProgress, incrementStats, isLoading, error }
 */
export function useGameProgress(gameSlug) {
  const [progress, setProgress] = useState({
    played: 0,
    won: 0,
    bestScore: null,
    bestTime: null,
    currentStreak: 0,
    maxStreak: 0,
    extraData: {}
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Debounce timer ref
  const debounceRef = useRef(null);
  const pendingUpdatesRef = useRef({});

  // Load progress on mount
  useEffect(() => {
    let mounted = true;

    async function loadProgress() {
      try {
        const data = await games.getProgress(gameSlug);
        if (mounted) {
          setProgress(data);
          setError(null);
        }
      } catch (err) {
        console.error(`Failed to load progress for ${gameSlug}:`, err);
        if (mounted) {
          setError(err.message);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    loadProgress();

    return () => {
      mounted = false;
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [gameSlug]);

  // Flush pending updates immediately
  const flushUpdates = useCallback(async () => {
    if (Object.keys(pendingUpdatesRef.current).length === 0) return;

    const updates = { ...pendingUpdatesRef.current };
    pendingUpdatesRef.current = {};

    try {
      const updated = await games.updateProgress(gameSlug, updates);
      setProgress(updated);
    } catch (err) {
      console.error(`Failed to save progress for ${gameSlug}:`, err);
      setError(err.message);
    }
  }, [gameSlug]);

  // Update progress with debouncing
  const updateProgress = useCallback((updates) => {
    // Merge with pending updates
    pendingUpdatesRef.current = {
      ...pendingUpdatesRef.current,
      ...updates
    };

    // Optimistic update
    setProgress(prev => ({
      ...prev,
      ...updates,
      // Handle best score/time correctly (only update if better)
      bestScore: updates.bestScore !== undefined
        ? (prev.bestScore === null || updates.bestScore > prev.bestScore ? updates.bestScore : prev.bestScore)
        : prev.bestScore,
      bestTime: updates.bestTime !== undefined
        ? (prev.bestTime === null || updates.bestTime < prev.bestTime ? updates.bestTime : prev.bestTime)
        : prev.bestTime,
      maxStreak: updates.maxStreak !== undefined
        ? Math.max(prev.maxStreak, updates.maxStreak)
        : prev.maxStreak
    }));

    // Debounce the actual API call
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(flushUpdates, 500);
  }, [flushUpdates]);

  // Helper to increment played/won counts
  const incrementStats = useCallback(({ won = false, time = null, score = null } = {}) => {
    setProgress(prev => {
      const newStreak = won ? prev.currentStreak + 1 : 0;
      const newMaxStreak = Math.max(prev.maxStreak, newStreak);

      const updates = {
        played: prev.played + 1,
        won: won ? prev.won + 1 : prev.won,
        currentStreak: newStreak,
        maxStreak: newMaxStreak
      };

      if (time !== null) {
        updates.bestTime = time;
      }
      if (score !== null) {
        updates.bestScore = score;
      }

      // Queue for server update
      pendingUpdatesRef.current = {
        ...pendingUpdatesRef.current,
        ...updates
      };

      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      debounceRef.current = setTimeout(flushUpdates, 500);

      return {
        ...prev,
        ...updates,
        bestTime: time !== null
          ? (prev.bestTime === null || time < prev.bestTime ? time : prev.bestTime)
          : prev.bestTime,
        bestScore: score !== null
          ? (prev.bestScore === null || score > prev.bestScore ? score : prev.bestScore)
          : prev.bestScore
      };
    });
  }, [flushUpdates]);

  // Update extra data (for game-specific data)
  const updateExtraData = useCallback((extraData) => {
    updateProgress({ extraData });
  }, [updateProgress]);

  return {
    progress,
    updateProgress,
    incrementStats,
    updateExtraData,
    isLoading,
    error,
    // Expose flush for when user navigates away
    flush: flushUpdates
  };
}

/**
 * Hook for fetching leaderboard data for a game.
 *
 * @param {string} gameSlug - The unique identifier for the game
 * @param {Object} options - { sortBy, limit }
 * @returns {Object} - { leaderboard, isLoading, error, refresh }
 */
export function useLeaderboard(gameSlug, { sortBy = 'won', limit = 10 } = {}) {
  const [leaderboard, setLeaderboard] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadLeaderboard = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await games.getLeaderboard(gameSlug, { sortBy, limit });
      setLeaderboard(data);
      setError(null);
    } catch (err) {
      console.error(`Failed to load leaderboard for ${gameSlug}:`, err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [gameSlug, sortBy, limit]);

  useEffect(() => {
    loadLeaderboard();
  }, [loadLeaderboard]);

  return {
    leaderboard,
    isLoading,
    error,
    refresh: loadLeaderboard
  };
}
