import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Default stats structure for games
 */
const DEFAULT_STATS = {
  played: 0,
  won: 0,
  currentStreak: 0,
  maxStreak: 0,
  bestTime: null,
  bestScore: null,
  lastPlayed: null,
};

/**
 * Generate localStorage key for a game's stats
 * @param {string} gameSlug - Game identifier
 * @returns {string} localStorage key
 */
function getStorageKey(gameSlug) {
  return `${gameSlug}-stats`;
}

/**
 * Load stats from localStorage
 * @param {string} gameSlug - Game identifier
 * @param {Object} defaultStats - Default stats to use if none exist
 * @returns {Object} Stats object
 */
function loadStats(gameSlug, defaultStats) {
  try {
    const saved = localStorage.getItem(getStorageKey(gameSlug));
    if (saved) {
      const parsed = JSON.parse(saved);
      return { ...defaultStats, ...parsed };
    }
  } catch (e) {
    console.error(`Failed to load stats for ${gameSlug}:`, e);
  }
  return { ...defaultStats };
}

/**
 * Save stats to localStorage
 * @param {string} gameSlug - Game identifier
 * @param {Object} stats - Stats to save
 */
function saveStats(gameSlug, stats) {
  try {
    localStorage.setItem(getStorageKey(gameSlug), JSON.stringify(stats));
  } catch (e) {
    console.error(`Failed to save stats for ${gameSlug}:`, e);
  }
}

/**
 * Hook for managing game statistics with localStorage persistence
 * @param {string} gameSlug - Unique identifier for the game
 * @param {Object} [options] - Configuration options
 * @param {Object} [options.defaultStats] - Additional default stats fields
 * @param {boolean} [options.trackStreak] - Whether to track win streaks (default: true)
 * @param {boolean} [options.trackBestTime] - Whether to track best time (default: true)
 * @param {boolean} [options.trackBestScore] - Whether to track best score (default: true)
 * @param {'higher'|'lower'} [options.scoreComparison] - How to compare scores (default: 'higher')
 * @returns {Object} Stats and stat management functions
 */
export function useGameStats(gameSlug, options = {}) {
  const {
    defaultStats = {},
    trackStreak = true,
    trackBestTime = true,
    trackBestScore = true,
    scoreComparison = 'higher',
  } = options;

  const mergedDefaults = { ...DEFAULT_STATS, ...defaultStats };

  const [stats, setStats] = useState(() => loadStats(gameSlug, mergedDefaults));
  const saveTimeoutRef = useRef(null);

  // Debounced save to localStorage
  const debouncedSave = useCallback((newStats) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(() => {
      saveStats(gameSlug, newStats);
    }, 100);
  }, [gameSlug]);

  // Save stats when they change
  useEffect(() => {
    debouncedSave(stats);
  }, [stats, debouncedSave]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
        // Immediate save on unmount
        saveStats(gameSlug, stats);
      }
    };
  }, [gameSlug, stats]);

  /**
   * Record a game win
   * @param {Object} [details] - Additional details
   * @param {number} [details.time] - Time taken (seconds)
   * @param {number} [details.score] - Score achieved
   * @param {Object} [details.extra] - Extra data to merge into stats
   */
  const recordWin = useCallback(({ time, score, extra = {} } = {}) => {
    setStats((prev) => {
      const newStreak = trackStreak ? prev.currentStreak + 1 : prev.currentStreak;
      const newMaxStreak = trackStreak ? Math.max(prev.maxStreak, newStreak) : prev.maxStreak;

      let newBestTime = prev.bestTime;
      if (trackBestTime && time !== undefined) {
        newBestTime = prev.bestTime === null || time < prev.bestTime ? time : prev.bestTime;
      }

      let newBestScore = prev.bestScore;
      if (trackBestScore && score !== undefined) {
        if (prev.bestScore === null) {
          newBestScore = score;
        } else if (scoreComparison === 'higher') {
          newBestScore = Math.max(prev.bestScore, score);
        } else {
          newBestScore = Math.min(prev.bestScore, score);
        }
      }

      return {
        ...prev,
        ...extra,
        played: prev.played + 1,
        won: prev.won + 1,
        currentStreak: newStreak,
        maxStreak: newMaxStreak,
        bestTime: newBestTime,
        bestScore: newBestScore,
        lastPlayed: new Date().toISOString(),
      };
    });
  }, [trackStreak, trackBestTime, trackBestScore, scoreComparison]);

  /**
   * Record a game loss
   * @param {Object} [details] - Additional details
   * @param {Object} [details.extra] - Extra data to merge into stats
   */
  const recordLoss = useCallback(({ extra = {} } = {}) => {
    setStats((prev) => ({
      ...prev,
      ...extra,
      played: prev.played + 1,
      currentStreak: 0,
      lastPlayed: new Date().toISOString(),
    }));
  }, []);

  /**
   * Record giving up (same as loss)
   * @param {Object} [details] - Additional details
   */
  const recordGiveUp = useCallback((details = {}) => {
    recordLoss(details);
  }, [recordLoss]);

  /**
   * Update stats directly
   * @param {Object|function} updates - Stats updates or updater function
   */
  const updateStats = useCallback((updates) => {
    setStats((prev) => {
      const newStats = typeof updates === 'function' ? updates(prev) : { ...prev, ...updates };
      return newStats;
    });
  }, []);

  /**
   * Update best time (only if better)
   * @param {number} time - Time in seconds
   */
  const updateBestTime = useCallback((time) => {
    if (!trackBestTime) return;

    setStats((prev) => {
      if (prev.bestTime === null || time < prev.bestTime) {
        return { ...prev, bestTime: time };
      }
      return prev;
    });
  }, [trackBestTime]);

  /**
   * Update best score (only if better)
   * @param {number} score - Score value
   */
  const updateBestScore = useCallback((score) => {
    if (!trackBestScore) return;

    setStats((prev) => {
      if (prev.bestScore === null) {
        return { ...prev, bestScore: score };
      }

      const isBetter = scoreComparison === 'higher'
        ? score > prev.bestScore
        : score < prev.bestScore;

      if (isBetter) {
        return { ...prev, bestScore: score };
      }
      return prev;
    });
  }, [trackBestScore, scoreComparison]);

  /**
   * Reset all stats
   */
  const resetStats = useCallback(() => {
    const reset = { ...mergedDefaults };
    setStats(reset);
    saveStats(gameSlug, reset);
  }, [gameSlug, mergedDefaults]);

  /**
   * Calculate win rate percentage
   */
  const winRate = stats.played > 0 ? Math.round((stats.won / stats.played) * 100) : 0;

  return {
    stats,
    winRate,
    recordWin,
    recordLoss,
    recordGiveUp,
    updateStats,
    updateBestTime,
    updateBestScore,
    resetStats,
  };
}

export default useGameStats;
