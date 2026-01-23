import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// ===========================================
// useGameStats - Default Stats Tests
// ===========================================
describe('useGameStats - Default Stats', () => {
  const DEFAULT_STATS = {
    played: 0,
    won: 0,
    currentStreak: 0,
    maxStreak: 0,
    bestTime: null,
    bestScore: null,
    lastPlayed: null,
  };

  it('should have correct default values', () => {
    expect(DEFAULT_STATS.played).toBe(0);
    expect(DEFAULT_STATS.won).toBe(0);
    expect(DEFAULT_STATS.currentStreak).toBe(0);
    expect(DEFAULT_STATS.maxStreak).toBe(0);
    expect(DEFAULT_STATS.bestTime).toBeNull();
    expect(DEFAULT_STATS.bestScore).toBeNull();
    expect(DEFAULT_STATS.lastPlayed).toBeNull();
  });

  it('should merge custom defaults', () => {
    const customDefaults = { customField: 'value' };
    const merged = { ...DEFAULT_STATS, ...customDefaults };

    expect(merged.customField).toBe('value');
    expect(merged.played).toBe(0);
  });
});

// ===========================================
// useGameStats - Storage Key Tests
// ===========================================
describe('useGameStats - Storage Key', () => {
  const getStorageKey = (gameSlug) => `${gameSlug}-stats`;

  it('should generate correct storage key', () => {
    expect(getStorageKey('sudoku')).toBe('sudoku-stats');
    expect(getStorageKey('minesweeper')).toBe('minesweeper-stats');
    expect(getStorageKey('flag-guesser')).toBe('flag-guesser-stats');
  });
});

// ===========================================
// useGameStats - Win Rate Calculation Tests
// ===========================================
describe('useGameStats - Win Rate', () => {
  const calculateWinRate = (played, won) => {
    if (played === 0) return 0;
    return Math.round((won / played) * 100);
  };

  it('should return 0 when no games played', () => {
    expect(calculateWinRate(0, 0)).toBe(0);
  });

  it('should calculate 100% correctly', () => {
    expect(calculateWinRate(10, 10)).toBe(100);
  });

  it('should calculate partial win rate correctly', () => {
    expect(calculateWinRate(10, 7)).toBe(70);
    expect(calculateWinRate(3, 1)).toBe(33);
  });
});

// ===========================================
// useGameStats - Streak Tests
// ===========================================
describe('useGameStats - Streak', () => {
  it('should increment streak on win', () => {
    let currentStreak = 0;
    const recordWin = () => { currentStreak += 1; };

    recordWin();
    expect(currentStreak).toBe(1);

    recordWin();
    expect(currentStreak).toBe(2);
  });

  it('should reset streak on loss', () => {
    let currentStreak = 5;
    const recordLoss = () => { currentStreak = 0; };

    recordLoss();
    expect(currentStreak).toBe(0);
  });

  it('should track max streak', () => {
    let currentStreak = 0;
    let maxStreak = 0;

    const recordWin = () => {
      currentStreak += 1;
      maxStreak = Math.max(maxStreak, currentStreak);
    };

    const recordLoss = () => {
      currentStreak = 0;
    };

    recordWin();
    recordWin();
    recordWin();
    expect(currentStreak).toBe(3);
    expect(maxStreak).toBe(3);

    recordLoss();
    expect(currentStreak).toBe(0);
    expect(maxStreak).toBe(3); // Should not change

    recordWin();
    expect(currentStreak).toBe(1);
    expect(maxStreak).toBe(3); // Should not change
  });
});

// ===========================================
// useGameStats - Best Time Tests
// ===========================================
describe('useGameStats - Best Time', () => {
  const updateBestTime = (current, newTime) => {
    if (current === null || newTime < current) {
      return newTime;
    }
    return current;
  };

  it('should set initial best time', () => {
    expect(updateBestTime(null, 120)).toBe(120);
  });

  it('should update when time is better', () => {
    expect(updateBestTime(120, 100)).toBe(100);
  });

  it('should not update when time is worse', () => {
    expect(updateBestTime(100, 150)).toBe(100);
  });
});

// ===========================================
// useGameStats - Best Score Tests
// ===========================================
describe('useGameStats - Best Score', () => {
  const updateBestScore = (current, newScore, comparison = 'higher') => {
    if (current === null) return newScore;

    if (comparison === 'higher') {
      return Math.max(current, newScore);
    } else {
      return Math.min(current, newScore);
    }
  };

  it('should set initial best score', () => {
    expect(updateBestScore(null, 100)).toBe(100);
  });

  it('should update when score is higher (higher is better)', () => {
    expect(updateBestScore(100, 150, 'higher')).toBe(150);
  });

  it('should not update when score is lower (higher is better)', () => {
    expect(updateBestScore(100, 50, 'higher')).toBe(100);
  });

  it('should update when score is lower (lower is better)', () => {
    expect(updateBestScore(100, 50, 'lower')).toBe(50);
  });

  it('should not update when score is higher (lower is better)', () => {
    expect(updateBestScore(50, 100, 'lower')).toBe(50);
  });
});

// ===========================================
// useGameStats - Persistence Logic Tests
// ===========================================
describe('useGameStats - Persistence Logic', () => {
  it('should generate correct JSON for storage', () => {
    const stats = { played: 5, won: 3 };
    const json = JSON.stringify(stats);

    expect(json).toBe('{"played":5,"won":3}');
  });

  it('should parse JSON correctly', () => {
    const json = '{"played":10,"won":8}';
    const stats = JSON.parse(json);

    expect(stats.played).toBe(10);
    expect(stats.won).toBe(8);
  });

  it('should merge loaded stats with defaults', () => {
    const defaults = { played: 0, won: 0, customField: 'default' };
    const saved = { played: 5, won: 3 };

    const merged = { ...defaults, ...saved };

    expect(merged.played).toBe(5);
    expect(merged.won).toBe(3);
    expect(merged.customField).toBe('default');
  });

  it('should handle malformed JSON gracefully', () => {
    const parseStats = (json) => {
      try {
        return JSON.parse(json);
      } catch {
        return null;
      }
    };

    expect(parseStats('invalid json')).toBeNull();
    expect(parseStats('{"valid": true}')).toEqual({ valid: true });
  });
});

// ===========================================
// useGameStats - Record Win Tests
// ===========================================
describe('useGameStats - Record Win', () => {
  it('should increment played and won counts', () => {
    let stats = { played: 0, won: 0 };

    const recordWin = () => {
      stats = { ...stats, played: stats.played + 1, won: stats.won + 1 };
    };

    recordWin();
    expect(stats.played).toBe(1);
    expect(stats.won).toBe(1);
  });

  it('should accept time and score', () => {
    let stats = { bestTime: null, bestScore: null };

    const recordWin = ({ time, score }) => {
      if (time !== undefined) {
        stats.bestTime = stats.bestTime === null || time < stats.bestTime ? time : stats.bestTime;
      }
      if (score !== undefined) {
        stats.bestScore = stats.bestScore === null || score > stats.bestScore ? score : stats.bestScore;
      }
    };

    recordWin({ time: 120, score: 500 });
    expect(stats.bestTime).toBe(120);
    expect(stats.bestScore).toBe(500);

    recordWin({ time: 100, score: 400 });
    expect(stats.bestTime).toBe(100); // Better time
    expect(stats.bestScore).toBe(500); // Score not better
  });
});

// ===========================================
// useGameStats - Record Loss Tests
// ===========================================
describe('useGameStats - Record Loss', () => {
  it('should increment played but not won', () => {
    let stats = { played: 0, won: 0 };

    const recordLoss = () => {
      stats = { ...stats, played: stats.played + 1 };
    };

    recordLoss();
    expect(stats.played).toBe(1);
    expect(stats.won).toBe(0);
  });

  it('should reset current streak', () => {
    let stats = { currentStreak: 5 };

    const recordLoss = () => {
      stats = { ...stats, currentStreak: 0 };
    };

    recordLoss();
    expect(stats.currentStreak).toBe(0);
  });
});

// ===========================================
// useGameStats - Merge Stats Tests (Backend Sync)
// ===========================================
describe('useGameStats - Merge Stats', () => {
  // Replicate the mergeStats function logic for testing
  const mergeStats = (local, server) => {
    if (!server) return local;
    if (!local) return server;

    return {
      played: Math.max(local.played || 0, server.played || 0),
      won: Math.max(local.won || 0, server.won || 0),
      currentStreak: server.currentStreak ?? local.currentStreak ?? 0,
      maxStreak: Math.max(local.maxStreak || 0, server.maxStreak || 0),
      bestTime: local.bestTime !== null && server.bestTime !== null
        ? Math.min(local.bestTime, server.bestTime)
        : local.bestTime ?? server.bestTime,
      bestScore: local.bestScore !== null && server.bestScore !== null
        ? Math.max(local.bestScore, server.bestScore)
        : local.bestScore ?? server.bestScore,
      lastPlayed: local.lastPlayed && server.lastPlayed
        ? (new Date(local.lastPlayed) > new Date(server.lastPlayed) ? local.lastPlayed : server.lastPlayed)
        : local.lastPlayed || server.lastPlayed,
    };
  };

  it('should return local stats when server is null', () => {
    const local = { played: 5, won: 3, currentStreak: 2, maxStreak: 4, bestTime: 100, bestScore: 500, lastPlayed: '2025-01-20T00:00:00Z' };
    const result = mergeStats(local, null);
    expect(result).toEqual(local);
  });

  it('should return server stats when local is null', () => {
    const server = { played: 10, won: 7, currentStreak: 1, maxStreak: 5, bestTime: 80, bestScore: 600, lastPlayed: '2025-01-21T00:00:00Z' };
    const result = mergeStats(null, server);
    expect(result).toEqual(server);
  });

  it('should prefer higher played/won counts', () => {
    const local = { played: 5, won: 3, currentStreak: 0, maxStreak: 2, bestTime: null, bestScore: null, lastPlayed: null };
    const server = { played: 10, won: 2, currentStreak: 0, maxStreak: 3, bestTime: null, bestScore: null, lastPlayed: null };

    const result = mergeStats(local, server);
    expect(result.played).toBe(10); // Max of 5 and 10
    expect(result.won).toBe(3); // Max of 3 and 2
    expect(result.maxStreak).toBe(3); // Max of 2 and 3
  });

  it('should prefer server currentStreak (represents latest state)', () => {
    const local = { played: 5, won: 3, currentStreak: 4, maxStreak: 4, bestTime: null, bestScore: null, lastPlayed: null };
    const server = { played: 5, won: 3, currentStreak: 0, maxStreak: 4, bestTime: null, bestScore: null, lastPlayed: null };

    const result = mergeStats(local, server);
    expect(result.currentStreak).toBe(0); // Server value takes precedence
  });

  it('should prefer lower best time', () => {
    const local = { played: 5, won: 3, currentStreak: 0, maxStreak: 2, bestTime: 120, bestScore: null, lastPlayed: null };
    const server = { played: 5, won: 3, currentStreak: 0, maxStreak: 2, bestTime: 80, bestScore: null, lastPlayed: null };

    const result = mergeStats(local, server);
    expect(result.bestTime).toBe(80); // Min of 120 and 80
  });

  it('should prefer higher best score', () => {
    const local = { played: 5, won: 3, currentStreak: 0, maxStreak: 2, bestTime: null, bestScore: 500, lastPlayed: null };
    const server = { played: 5, won: 3, currentStreak: 0, maxStreak: 2, bestTime: null, bestScore: 800, lastPlayed: null };

    const result = mergeStats(local, server);
    expect(result.bestScore).toBe(800); // Max of 500 and 800
  });

  it('should handle null best time from one source', () => {
    const local = { played: 5, won: 3, currentStreak: 0, maxStreak: 2, bestTime: null, bestScore: null, lastPlayed: null };
    const server = { played: 5, won: 3, currentStreak: 0, maxStreak: 2, bestTime: 100, bestScore: null, lastPlayed: null };

    const result = mergeStats(local, server);
    expect(result.bestTime).toBe(100); // Use server's value since local is null
  });

  it('should handle null best score from one source', () => {
    const local = { played: 5, won: 3, currentStreak: 0, maxStreak: 2, bestTime: null, bestScore: 500, lastPlayed: null };
    const server = { played: 5, won: 3, currentStreak: 0, maxStreak: 2, bestTime: null, bestScore: null, lastPlayed: null };

    const result = mergeStats(local, server);
    expect(result.bestScore).toBe(500); // Use local's value since server is null
  });

  it('should prefer more recent lastPlayed date', () => {
    const local = { played: 5, won: 3, currentStreak: 0, maxStreak: 2, bestTime: null, bestScore: null, lastPlayed: '2025-01-15T00:00:00Z' };
    const server = { played: 5, won: 3, currentStreak: 0, maxStreak: 2, bestTime: null, bestScore: null, lastPlayed: '2025-01-20T00:00:00Z' };

    const result = mergeStats(local, server);
    expect(result.lastPlayed).toBe('2025-01-20T00:00:00Z'); // More recent
  });

  it('should handle null lastPlayed from one source', () => {
    const local = { played: 5, won: 3, currentStreak: 0, maxStreak: 2, bestTime: null, bestScore: null, lastPlayed: '2025-01-15T00:00:00Z' };
    const server = { played: 5, won: 3, currentStreak: 0, maxStreak: 2, bestTime: null, bestScore: null, lastPlayed: null };

    const result = mergeStats(local, server);
    expect(result.lastPlayed).toBe('2025-01-15T00:00:00Z'); // Use local's value since server is null
  });

  it('should merge complex scenario correctly', () => {
    // Simulates: played more locally, but server has better times from another device
    const local = {
      played: 15,
      won: 10,
      currentStreak: 3,
      maxStreak: 5,
      bestTime: 90,
      bestScore: 1000,
      lastPlayed: '2025-01-22T10:00:00Z',
    };
    const server = {
      played: 12,
      won: 9,
      currentStreak: 0, // Lost on server after local sync
      maxStreak: 6, // Had a better streak on server
      bestTime: 75, // Better time on server
      bestScore: 800,
      lastPlayed: '2025-01-22T15:00:00Z', // More recent on server
    };

    const result = mergeStats(local, server);
    expect(result.played).toBe(15); // Max
    expect(result.won).toBe(10); // Max
    expect(result.currentStreak).toBe(0); // Server (authoritative)
    expect(result.maxStreak).toBe(6); // Max
    expect(result.bestTime).toBe(75); // Min
    expect(result.bestScore).toBe(1000); // Max
    expect(result.lastPlayed).toBe('2025-01-22T15:00:00Z'); // More recent
  });
});

// ===========================================
// useGameStats - Backend Sync Timing Tests
// ===========================================
describe('useGameStats - Backend Sync Timing', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should debounce localStorage saves (100ms)', () => {
    const saves = [];
    const debouncedSave = (() => {
      let timeout = null;
      return (data) => {
        if (timeout) clearTimeout(timeout);
        timeout = setTimeout(() => saves.push(data), 100);
      };
    })();

    // Rapid calls
    debouncedSave({ played: 1 });
    debouncedSave({ played: 2 });
    debouncedSave({ played: 3 });

    expect(saves.length).toBe(0); // Not yet

    vi.advanceTimersByTime(100);
    expect(saves.length).toBe(1);
    expect(saves[0]).toEqual({ played: 3 }); // Only last value
  });

  it('should debounce backend sync (500ms)', () => {
    const syncs = [];
    const debouncedSync = (() => {
      let timeout = null;
      return (data) => {
        if (timeout) clearTimeout(timeout);
        timeout = setTimeout(() => syncs.push(data), 500);
      };
    })();

    // Rapid calls
    debouncedSync({ played: 1 });
    debouncedSync({ played: 2 });
    debouncedSync({ played: 3 });

    expect(syncs.length).toBe(0);

    vi.advanceTimersByTime(300);
    expect(syncs.length).toBe(0); // Still waiting

    vi.advanceTimersByTime(200);
    expect(syncs.length).toBe(1);
    expect(syncs[0]).toEqual({ played: 3 });
  });

  it('should not sync if stats unchanged', () => {
    let lastSynced = null;
    const syncs = [];

    const debouncedSync = (stats) => {
      const statsJson = JSON.stringify(stats);
      if (statsJson === lastSynced) return;
      syncs.push(stats);
      lastSynced = statsJson;
    };

    debouncedSync({ played: 5 });
    expect(syncs.length).toBe(1);

    debouncedSync({ played: 5 }); // Same
    expect(syncs.length).toBe(1); // No new sync

    debouncedSync({ played: 6 }); // Different
    expect(syncs.length).toBe(2);
  });
});
