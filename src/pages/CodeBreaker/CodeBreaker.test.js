import { describe, it, expect } from 'vitest';
import { generateSecretCode, checkGuess } from './CodeBreaker.jsx';

// ===========================================
// CodeBreaker - Code Generation Tests
// ===========================================
describe('CodeBreaker - Code Generation', () => {
  it('should generate code of correct length', () => {
    const code = generateSecretCode(4, 6, 12345);
    expect(code.length).toBe(4);
  });

  it('should only use valid color indices', () => {
    for (let i = 0; i < 100; i++) {
      const code = generateSecretCode(5, 8, i * 1000);
      code.forEach(color => {
        expect(color).toBeGreaterThanOrEqual(0);
        expect(color).toBeLessThan(8);
      });
    }
  });

  it('should generate reproducible codes with same seed', () => {
    const seed = 42;
    const code1 = generateSecretCode(4, 6, seed);
    const code2 = generateSecretCode(4, 6, seed);
    expect(code1).toEqual(code2);
  });

  it('should generate different codes with different seeds', () => {
    const code1 = generateSecretCode(4, 6, 12345);
    const code2 = generateSecretCode(4, 6, 54321);
    // Different seeds should produce different codes (extremely unlikely to match)
    expect(code1).not.toEqual(code2);
  });

  it('should generate consistent codes across multiple calls with same seed', () => {
    const seed = 99999;
    const codes = [];
    for (let i = 0; i < 10; i++) {
      codes.push(generateSecretCode(5, 8, seed));
    }
    // All codes should be identical
    codes.forEach(code => {
      expect(code).toEqual(codes[0]);
    });
  });
});

// ===========================================
// CodeBreaker - Guess Checking Tests
// ===========================================
describe('CodeBreaker - Guess Checking', () => {
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

  it('should handle all colors in wrong positions', () => {
    const result = checkGuess([0, 1, 2, 3], [3, 2, 1, 0]);
    expect(result.exact).toBe(0);
    expect(result.color).toBe(4);
  });

  it('should handle repeated colors with some exact', () => {
    // Secret: [0, 0, 1, 1]
    // Guess:  [0, 1, 0, 1]
    // Position 0: exact (0)
    // Position 3: exact (1)
    // Position 1: color match with position 2 of secret (0)
    // Position 2: color match with position 1 of secret (1)... wait no
    // Let me think again:
    // Secret: [0, 0, 1, 1]
    // Guess:  [0, 1, 0, 1]
    // Pos 0: guess=0, secret=0 -> exact
    // Pos 1: guess=1, secret=0 -> not exact
    // Pos 2: guess=0, secret=1 -> not exact
    // Pos 3: guess=1, secret=1 -> exact
    // After exact pass: secretCopy=[null, 0, 1, null], guessCopy=[null, 1, 0, null]
    // Color pass:
    // Pos 1: guess=1, look for 1 in secretCopy -> found at pos 2 -> color match
    // Pos 2: guess=0, look for 0 in secretCopy -> found at pos 1 -> color match
    const result = checkGuess([0, 1, 0, 1], [0, 0, 1, 1]);
    expect(result.exact).toBe(2);
    expect(result.color).toBe(2);
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

// ===========================================
// CodeBreaker - Seed Reproducibility Tests
// ===========================================
describe('CodeBreaker - Seed Reproducibility', () => {
  it('should produce identical puzzles for identical seeds', () => {
    const seed = 123456789;
    const puzzle1 = generateSecretCode(4, 6, seed);
    const puzzle2 = generateSecretCode(4, 6, seed);
    expect(puzzle1).toEqual(puzzle2);
  });

  it('should produce different puzzles for different seeds', () => {
    const puzzles = new Set();
    for (let seed = 1; seed <= 100; seed++) {
      const puzzle = generateSecretCode(4, 6, seed);
      puzzles.add(JSON.stringify(puzzle));
    }
    // Should have generated mostly unique puzzles (allow some collisions)
    expect(puzzles.size).toBeGreaterThan(90);
  });

  it('should work with large seed values', () => {
    const seed = 2147483647; // Max 32-bit signed integer
    const code = generateSecretCode(4, 6, seed);
    expect(code.length).toBe(4);
    code.forEach(color => {
      expect(color).toBeGreaterThanOrEqual(0);
      expect(color).toBeLessThan(6);
    });
  });

  it('should work with seed value 0', () => {
    const code = generateSecretCode(4, 6, 0);
    expect(code.length).toBe(4);
    code.forEach(color => {
      expect(color).toBeGreaterThanOrEqual(0);
      expect(color).toBeLessThan(6);
    });
  });
});
