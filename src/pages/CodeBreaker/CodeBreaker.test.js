import { describe, it, expect } from 'vitest';

// ===========================================
// CodeBreaker - Code Generation Tests
// ===========================================
describe('CodeBreaker - Code Generation', () => {
  function generateSecretCode(length, colorCount) {
    return Array.from({ length }, () => Math.floor(Math.random() * colorCount));
  }

  it('should generate code of correct length', () => {
    const code = generateSecretCode(4, 6);
    expect(code.length).toBe(4);
  });

  it('should only use valid color indices', () => {
    for (let i = 0; i < 100; i++) {
      const code = generateSecretCode(5, 8);
      code.forEach(color => {
        expect(color).toBeGreaterThanOrEqual(0);
        expect(color).toBeLessThan(8);
      });
    }
  });
});

// ===========================================
// CodeBreaker - Guess Checking Tests
// ===========================================
describe('CodeBreaker - Guess Checking', () => {
  function checkGuess(guess, secret) {
    const exactMatches = [];
    const colorMatches = [];

    const secretCopy = [...secret];
    const guessCopy = [...guess];

    // First pass: find exact matches
    for (let i = 0; i < guess.length; i++) {
      if (guessCopy[i] === secretCopy[i]) {
        exactMatches.push(i);
        secretCopy[i] = null;
        guessCopy[i] = null;
      }
    }

    // Second pass: find color matches
    for (let i = 0; i < guess.length; i++) {
      if (guessCopy[i] === null) continue;

      const foundIndex = secretCopy.findIndex(c => c === guessCopy[i] && c !== null);
      if (foundIndex !== -1) {
        colorMatches.push(i);
        secretCopy[foundIndex] = null;
      }
    }

    return {
      exact: exactMatches.length,
      color: colorMatches.length,
    };
  }

  it('should detect exact match', () => {
    const result = checkGuess([1, 2, 3, 4], [1, 2, 3, 4]);
    expect(result.exact).toBe(4);
    expect(result.color).toBe(0);
  });

  it('should detect no matches', () => {
    const result = checkGuess([1, 2, 3, 4], [5, 6, 7, 8]);
    expect(result.exact).toBe(0);
    expect(result.color).toBe(0);
  });

  it('should detect color matches (wrong position)', () => {
    const result = checkGuess([1, 2, 3, 4], [4, 3, 2, 1]);
    expect(result.exact).toBe(0);
    expect(result.color).toBe(4);
  });

  it('should handle mix of exact and color matches', () => {
    const result = checkGuess([1, 2, 3, 4], [1, 3, 2, 4]);
    expect(result.exact).toBe(2); // 1 and 4 in correct positions
    expect(result.color).toBe(2); // 2 and 3 wrong positions
  });

  it('should handle duplicates correctly', () => {
    // Secret: [1, 1, 2, 3]
    // Guess:  [1, 2, 1, 4]
    // First 1 is exact match
    // Second 1 in guess matches second 1 in secret (color match)
    // 2 in guess at pos 1 is wrong position
    const result = checkGuess([1, 2, 1, 4], [1, 1, 2, 3]);
    expect(result.exact).toBe(1); // First 1
    expect(result.color).toBe(2); // Second 1 and the 2
  });

  it('should not double count colors', () => {
    // Secret: [1, 2, 3, 4]
    // Guess:  [1, 1, 1, 1]
    // Only one 1 matches (exact)
    const result = checkGuess([1, 1, 1, 1], [1, 2, 3, 4]);
    expect(result.exact).toBe(1);
    expect(result.color).toBe(0);
  });

  it('should handle partial matches', () => {
    const result = checkGuess([1, 2, 3, 4], [1, 2, 5, 6]);
    expect(result.exact).toBe(2);
    expect(result.color).toBe(0);
  });
});

// ===========================================
// CodeBreaker - Win Condition Tests
// ===========================================
describe('CodeBreaker - Win Condition', () => {
  function isWin(result, codeLength) {
    return result.exact === codeLength;
  }

  it('should detect win when all exact', () => {
    expect(isWin({ exact: 4, color: 0 }, 4)).toBe(true);
  });

  it('should not detect win with partial match', () => {
    expect(isWin({ exact: 3, color: 1 }, 4)).toBe(false);
  });

  it('should handle different code lengths', () => {
    expect(isWin({ exact: 5, color: 0 }, 5)).toBe(true);
    expect(isWin({ exact: 4, color: 0 }, 5)).toBe(false);
  });
});

// ===========================================
// CodeBreaker - Difficulty Settings Tests
// ===========================================
describe('CodeBreaker - Difficulty Settings', () => {
  const DIFFICULTIES = {
    easy: { codeLength: 4, colorCount: 6, maxGuesses: 12 },
    medium: { codeLength: 4, colorCount: 6, maxGuesses: 10 },
    hard: { codeLength: 5, colorCount: 8, maxGuesses: 10 },
  };

  it('should have more guesses on easy', () => {
    expect(DIFFICULTIES.easy.maxGuesses).toBeGreaterThan(DIFFICULTIES.medium.maxGuesses);
  });

  it('should have longer code on hard', () => {
    expect(DIFFICULTIES.hard.codeLength).toBeGreaterThan(DIFFICULTIES.easy.codeLength);
  });

  it('should have more colors on hard', () => {
    expect(DIFFICULTIES.hard.colorCount).toBeGreaterThan(DIFFICULTIES.easy.colorCount);
  });
});

// ===========================================
// CodeBreaker - Game State Tests
// ===========================================
describe('CodeBreaker - Game State', () => {
  function determineGameState(guesses, maxGuesses, lastResult, codeLength) {
    if (lastResult && lastResult.exact === codeLength) {
      return 'won';
    }
    if (guesses.length >= maxGuesses) {
      return 'lost';
    }
    return 'playing';
  }

  it('should be playing initially', () => {
    expect(determineGameState([], 10, null, 4)).toBe('playing');
  });

  it('should be won on exact match', () => {
    expect(determineGameState([{}], 10, { exact: 4, color: 0 }, 4)).toBe('won');
  });

  it('should be lost when max guesses reached', () => {
    const guesses = Array(10).fill({});
    expect(determineGameState(guesses, 10, { exact: 2, color: 1 }, 4)).toBe('lost');
  });

  it('should continue playing with guesses remaining', () => {
    const guesses = Array(5).fill({});
    expect(determineGameState(guesses, 10, { exact: 2, color: 1 }, 4)).toBe('playing');
  });
});
