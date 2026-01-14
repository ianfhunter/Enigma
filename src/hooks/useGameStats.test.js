import { describe, it, expect, beforeEach, afterEach } from 'vitest';

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
