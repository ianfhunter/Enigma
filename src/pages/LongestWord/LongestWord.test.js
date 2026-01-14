import { describe, it, expect, vi } from 'vitest';
import { MAX_WORDS, SEEDS, generateSeed, containsSeed } from './LongestWord.jsx';

describe('LongestWord - helpers', () => {
  it('exposes seeds and max words', () => {
    expect(MAX_WORDS).toBe(5);
    expect(SEEDS.length).toBeGreaterThan(0);
  });

  it('generateSeed is seeded-random friendly', () => {
    const rand = vi.spyOn(Math, 'random').mockReturnValue(0.0);
    const seed = generateSeed(Math.random);
    rand.mockRestore();
    expect(SEEDS).toContain(seed);
  });

  it('containsSeed checks case-insensitive inclusion', () => {
    expect(containsSeed('thrive', 'TH')).toBe(true);
    expect(containsSeed('apple', 'TH')).toBe(false);
  });
});
import { describe, it, expect } from 'vitest';
import {
  findLongestWordWithSeed,
  isValidWord,
} from '../../data/wordUtils';

// ===========================================
// LongestWord - findLongestWordWithSeed Tests
// ===========================================
describe('LongestWord - findLongestWordWithSeed', () => {
  it('should find a word containing the seed', () => {
    const result = findLongestWordWithSeed('ING');

    expect(result).not.toBeNull();
    expect(result.word.includes('ING')).toBe(true);
  });

  it('should return the word length', () => {
    const result = findLongestWordWithSeed('ING');

    expect(result.length).toBe(result.word.length);
  });

  it('should return a valid word', () => {
    const result = findLongestWordWithSeed('ING');

    expect(isValidWord(result.word)).toBe(true);
  });

  it('should find words of at least 4 letters', () => {
    const result = findLongestWordWithSeed('ING');

    expect(result.length).toBeGreaterThanOrEqual(4);
  });

  it('should handle uppercase seeds', () => {
    const result = findLongestWordWithSeed('THE');

    expect(result).not.toBeNull();
    expect(result.word.includes('THE')).toBe(true);
  });

  it('should handle lowercase seeds', () => {
    const result = findLongestWordWithSeed('the');

    expect(result).not.toBeNull();
    expect(result.word.includes('THE')).toBe(true);
  });

  it('should return null for impossible seeds', () => {
    const result = findLongestWordWithSeed('QQQQ');

    expect(result).toBeNull();
  });

  it('should find long words for common seeds', () => {
    const result = findLongestWordWithSeed('TION');

    expect(result).not.toBeNull();
    expect(result.length).toBeGreaterThanOrEqual(6);
  });
});

// ===========================================
// LongestWord - Seed Validation Tests
// ===========================================
describe('LongestWord - Seed Validation', () => {
  const isValidSeed = (seed) => {
    // Seeds should be 2-4 letters
    if (seed.length < 2 || seed.length > 4) return false;
    // Only letters
    if (!/^[A-Za-z]+$/.test(seed)) return false;
    return true;
  };

  it('should accept 2-letter seeds', () => {
    expect(isValidSeed('AB')).toBe(true);
    expect(isValidSeed('TH')).toBe(true);
  });

  it('should accept 3-letter seeds', () => {
    expect(isValidSeed('ING')).toBe(true);
    expect(isValidSeed('THE')).toBe(true);
  });

  it('should accept 4-letter seeds', () => {
    expect(isValidSeed('TION')).toBe(true);
    expect(isValidSeed('ABLE')).toBe(true);
  });

  it('should reject 1-letter seeds', () => {
    expect(isValidSeed('A')).toBe(false);
  });

  it('should reject 5+ letter seeds', () => {
    expect(isValidSeed('ABCDE')).toBe(false);
  });

  it('should reject seeds with numbers', () => {
    expect(isValidSeed('AB1')).toBe(false);
  });

  it('should reject seeds with special characters', () => {
    expect(isValidSeed('AB!')).toBe(false);
    expect(isValidSeed('A-B')).toBe(false);
  });
});

// ===========================================
// LongestWord - Word Scoring Tests
// ===========================================
describe('LongestWord - Word Scoring', () => {
  // Score based on word length relative to longest possible
  const calculateScore = (wordLength, longestPossible) => {
    const percentage = (wordLength / longestPossible) * 100;

    if (percentage >= 100) return 5; // Perfect
    if (percentage >= 90) return 4;
    if (percentage >= 75) return 3;
    if (percentage >= 50) return 2;
    return 1;
  };

  it('should give 5 points for matching longest word', () => {
    expect(calculateScore(10, 10)).toBe(5);
  });

  it('should give 4 points for 90%+ of longest', () => {
    expect(calculateScore(9, 10)).toBe(4);
    expect(calculateScore(18, 20)).toBe(4);
  });

  it('should give 3 points for 75%+ of longest', () => {
    expect(calculateScore(8, 10)).toBe(3);
    expect(calculateScore(15, 20)).toBe(3);
  });

  it('should give 2 points for 50%+ of longest', () => {
    expect(calculateScore(5, 10)).toBe(2);
    expect(calculateScore(10, 20)).toBe(2);
  });

  it('should give 1 point for less than 50%', () => {
    expect(calculateScore(4, 10)).toBe(1);
  });
});

// ===========================================
// LongestWord - Guess Validation Tests
// ===========================================
describe('LongestWord - Guess Validation', () => {
  const validateGuess = (guess, seed) => {
    const upperGuess = guess.toUpperCase();
    const upperSeed = seed.toUpperCase();

    // Must contain seed
    if (!upperGuess.includes(upperSeed)) {
      return { valid: false, error: 'Word must contain the seed letters' };
    }

    // Must be at least 4 letters
    if (upperGuess.length < 4) {
      return { valid: false, error: 'Word must be at least 4 letters' };
    }

    // Must be a valid word
    if (!isValidWord(upperGuess)) {
      return { valid: false, error: 'Not a valid word' };
    }

    return { valid: true };
  };

  it('should accept valid words containing the seed', () => {
    const result = validateGuess('SINGING', 'ING');

    expect(result.valid).toBe(true);
  });

  it('should reject words not containing the seed', () => {
    const result = validateGuess('HELLO', 'ING');

    expect(result.valid).toBe(false);
    expect(result.error).toContain('seed');
  });

  it('should reject words shorter than 4 letters', () => {
    const result = validateGuess('ING', 'ING');

    expect(result.valid).toBe(false);
    expect(result.error).toContain('4 letters');
  });

  it('should reject invalid words', () => {
    const result = validateGuess('XINGING', 'ING');

    expect(result.valid).toBe(false);
    expect(result.error).toContain('valid word');
  });

  it('should be case insensitive', () => {
    const result = validateGuess('singing', 'ING');

    expect(result.valid).toBe(true);
  });
});
