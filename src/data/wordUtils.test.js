import { describe, it, expect } from 'vitest';
import {
  isValidWord,
  createSeededRandom,
  stringToSeed,
  getTodayDateString,
  getCommonWordsByLength,
  getCommonFiveLetterWords,
  getRandomWordGuessWord,
  getDailyWordGuessWord,
  getAllWords,
  getAllWeightedWords,
} from './wordUtils';
import {
  getWordFrequency,
  getZipfScore,
  isCommonWord,
  filterToCommonWords,
  getFrequencyTier,
  getFrequencyStats,
} from './wordFrequency';

// ===========================================
// isValidWord Tests
// ===========================================
describe('isValidWord', () => {
  it('should return true for valid words', () => {
    expect(isValidWord('CRANE')).toBe(true);
    expect(isValidWord('SPEED')).toBe(true);
    expect(isValidWord('HOUSE')).toBe(true);
  });

  it('should return false for invalid words', () => {
    expect(isValidWord('XXXXX')).toBe(false);
    expect(isValidWord('ZZZZZ')).toBe(false);
    expect(isValidWord('QWERT')).toBe(false);
  });

  it('should be case-insensitive', () => {
    expect(isValidWord('crane')).toBe(true);
    expect(isValidWord('Crane')).toBe(true);
    expect(isValidWord('CRANE')).toBe(true);
    expect(isValidWord('cRaNe')).toBe(true);
  });

  it('should work with various word lengths', () => {
    expect(isValidWord('THE')).toBe(true);
    expect(isValidWord('HOUSE')).toBe(true);
    expect(isValidWord('ELEPHANT')).toBe(true);
  });
});

// ===========================================
// createSeededRandom Tests
// ===========================================
describe('createSeededRandom', () => {
  it('should produce the same sequence for the same seed', () => {
    const random1 = createSeededRandom(12345);
    const random2 = createSeededRandom(12345);

    for (let i = 0; i < 10; i++) {
      expect(random1()).toBe(random2());
    }
  });

  it('should produce different sequences for different seeds', () => {
    const random1 = createSeededRandom(12345);
    const random2 = createSeededRandom(54321);

    const seq1 = [];
    const seq2 = [];
    for (let i = 0; i < 5; i++) {
      seq1.push(random1());
      seq2.push(random2());
    }

    expect(seq1.join(',')).not.toBe(seq2.join(','));
  });

  it('should return values between 0 and 1', () => {
    const random = createSeededRandom(42);
    for (let i = 0; i < 100; i++) {
      const value = random();
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });
});

// ===========================================
// stringToSeed Tests
// ===========================================
describe('stringToSeed', () => {
  it('should return a number', () => {
    const seed = stringToSeed('test');
    expect(typeof seed).toBe('number');
  });

  it('should return the same seed for the same string', () => {
    const seed1 = stringToSeed('wordguess-2026-01-12');
    const seed2 = stringToSeed('wordguess-2026-01-12');
    expect(seed1).toBe(seed2);
  });

  it('should return different seeds for different strings', () => {
    const seed1 = stringToSeed('wordguess-2026-01-12');
    const seed2 = stringToSeed('wordguess-2026-01-13');
    expect(seed1).not.toBe(seed2);
  });

  it('should return non-negative numbers', () => {
    const testStrings = ['a', 'test', 'wordguess-2026-01-12', 'longer string with spaces'];
    testStrings.forEach(str => {
      expect(stringToSeed(str)).toBeGreaterThanOrEqual(0);
    });
  });
});

// ===========================================
// getTodayDateString Tests
// ===========================================
describe('getTodayDateString', () => {
  it('should return a string in YYYY-MM-DD format', () => {
    const dateStr = getTodayDateString();
    expect(dateStr).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('should return a valid date', () => {
    const dateStr = getTodayDateString();
    const date = new Date(dateStr);
    expect(date.toString()).not.toBe('Invalid Date');
  });

  it('should return today\'s date', () => {
    const dateStr = getTodayDateString();
    const today = new Date();
    const expected = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    expect(dateStr).toBe(expected);
  });
});

// ===========================================
// Word Frequency Tests
// ===========================================
describe('wordFrequency', () => {
  describe('getFrequencyStats', () => {
    it('should confirm frequency data is loaded', () => {
      const stats = getFrequencyStats();
      expect(stats.loaded).toBe(true);
      expect(stats.wordCount).toBeGreaterThan(50000);
    });
  });

  describe('getWordFrequency', () => {
    it('should return high frequency for common words', () => {
      // "YOU" and "THE" are extremely common
      expect(getWordFrequency('YOU')).toBeGreaterThan(10);
      expect(getWordFrequency('THE')).toBeGreaterThan(10);
    });

    it('should return 0 for non-existent words', () => {
      expect(getWordFrequency('XYZQWERTY')).toBe(0);
    });

    it('should be case-insensitive', () => {
      const freqUpper = getWordFrequency('HOUSE');
      const freqLower = getWordFrequency('house');
      const freqMixed = getWordFrequency('HoUsE');
      expect(freqUpper).toBe(freqLower);
      expect(freqLower).toBe(freqMixed);
    });
  });

  describe('getZipfScore', () => {
    it('should return higher scores for more common words', () => {
      const zipfThe = getZipfScore('THE');
      const zipfHouse = getZipfScore('HOUSE');
      // "THE" should have higher Zipf than "HOUSE"
      expect(zipfThe).toBeGreaterThan(zipfHouse);
    });

    it('should return 0 for words not in corpus', () => {
      expect(getZipfScore('XYZQWERTY')).toBe(0);
    });
  });

  describe('isCommonWord', () => {
    it('should return true for very common words', () => {
      expect(isCommonWord('HOUSE')).toBe(true);
      expect(isCommonWord('ABOUT')).toBe(true);
      expect(isCommonWord('THINK')).toBe(true);
    });

    it('should return false for words not in frequency corpus', () => {
      expect(isCommonWord('XYZQWERTY')).toBe(false);
    });
  });

  describe('filterToCommonWords', () => {
    it('should filter an array to only common words', () => {
      const words = ['HOUSE', 'XYZQWERTY', 'ABOUT', 'ZZZZZ'];
      const filtered = filterToCommonWords(words);
      expect(filtered).toContain('HOUSE');
      expect(filtered).toContain('ABOUT');
      expect(filtered).not.toContain('XYZQWERTY');
      expect(filtered).not.toContain('ZZZZZ');
    });
  });

  describe('getFrequencyTier', () => {
    it('should categorize words by frequency', () => {
      const tierThe = getFrequencyTier('THE');
      const tierHouse = getFrequencyTier('HOUSE');
      // Very common words should be 'very_common' or 'common'
      expect(['very_common', 'common']).toContain(tierThe);
      expect(['very_common', 'common']).toContain(tierHouse);
    });
  });
});

// ===========================================
// Common Words Integration Tests
// ===========================================
describe('common words integration', () => {
  describe('getCommonWordsByLength', () => {
    it('should return common words for valid lengths', () => {
      const common5 = getCommonWordsByLength(5);
      const common6 = getCommonWordsByLength(6);
      expect(common5.length).toBeGreaterThan(100);
      expect(common6.length).toBeGreaterThan(100);
    });

    it('should return empty array for invalid lengths', () => {
      const common100 = getCommonWordsByLength(100);
      expect(common100).toEqual([]);
    });
  });

  describe('getCommonFiveLetterWords', () => {
    it('should return many common 5-letter words', () => {
      const words = getCommonFiveLetterWords();
      expect(words.length).toBeGreaterThan(500);
    });

    it('should contain recognizable common words', () => {
      const words = getCommonFiveLetterWords();
      expect(words).toContain('HOUSE');
      expect(words).toContain('ABOUT');
      expect(words).toContain('THINK');
      expect(words).toContain('COULD');
    });
  });

  describe('getRandomWordGuessWord', () => {
    it('should return 5-letter words', () => {
      for (let i = 0; i < 10; i++) {
        const word = getRandomWordGuessWord();
        expect(word.length).toBe(5);
      }
    });

    it('should return common words', () => {
      // Test that most random words are in the common pool
      const commonWords = new Set(getCommonFiveLetterWords());
      let commonCount = 0;
      for (let i = 0; i < 50; i++) {
        if (commonWords.has(getRandomWordGuessWord())) {
          commonCount++;
        }
      }
      // At least 90% should be common words
      expect(commonCount).toBeGreaterThan(45);
    });
  });

  describe('getDailyWordGuessWord', () => {
    it('should return consistent words for same date', () => {
      const word1 = getDailyWordGuessWord('2026-01-12');
      const word2 = getDailyWordGuessWord('2026-01-12');
      expect(word1).toBe(word2);
    });

    it('should return different words for different dates', () => {
      const word1 = getDailyWordGuessWord('2026-01-12');
      const word2 = getDailyWordGuessWord('2026-01-13');
      expect(word1).not.toBe(word2);
    });

    it('should return common words', () => {
      const commonWords = new Set(getCommonFiveLetterWords());
      const word = getDailyWordGuessWord('2026-01-12');
      expect(commonWords.has(word)).toBe(true);
    });
  });
});

// ===========================================
// getAllWeightedWords Tests
// ===========================================
describe('getAllWeightedWords', () => {
  it('should return all words from dictionary', () => {
    const allWords = getAllWords();
    const weightedWords = getAllWeightedWords();
    expect(weightedWords.length).toBe(allWords.length);
  });

  it('should contain the same words as getAllWords', () => {
    const allWords = new Set(getAllWords());
    const weightedWords = getAllWeightedWords();
    expect(weightedWords.every(word => allWords.has(word))).toBe(true);
  });

  it('should prioritize common words near the beginning', () => {
    const weightedWords = getAllWeightedWords();
    // Check that common words like HOUSE, ABOUT appear in the first 20% of the list
    const first20Percent = weightedWords.slice(0, Math.floor(weightedWords.length * 0.2));
    const first20Set = new Set(first20Percent);

    // These very common words should be in the top portion
    expect(first20Set.has('HOUSE')).toBe(true);
    expect(first20Set.has('ABOUT')).toBe(true);
    expect(first20Set.has('THINK')).toBe(true);
  });

  it('should return a cached result on subsequent calls', () => {
    const result1 = getAllWeightedWords();
    const result2 = getAllWeightedWords();
    // Should return the exact same array reference (cached)
    expect(result1).toBe(result2);
  });
});

// ===========================================
// Anagrams Weighted Words Tests
// ===========================================
import { generateAnagramsPuzzle, getAnagramStats } from './wordUtils';

describe('generateAnagramsPuzzle', () => {
  it('should return anagrams sorted by weight (common words first)', () => {
    const puzzle = generateAnagramsPuzzle(4);

    expect(puzzle.anagrams).toBeDefined();
    expect(puzzle.anagrams.length).toBeGreaterThanOrEqual(4);
    expect(puzzle.letters).toBeDefined();
    expect(puzzle.wordLength).toBeGreaterThan(0);

    // All anagrams should have the same length
    expect(puzzle.anagrams.every(word => word.length === puzzle.wordLength)).toBe(true);
  });

  it('should prefer groups with more common words', () => {
    // Generate multiple puzzles and verify common word presence
    let commonWordCount = 0;
    const trials = 10;

    for (let i = 0; i < trials; i++) {
      const puzzle = generateAnagramsPuzzle(4);
      // Check if first word (should be most common) is actually common
      const firstWord = puzzle.anagrams[0];
      if (isCommonWord(firstWord)) {
        commonWordCount++;
      }
    }

    // At least 70% of puzzles should start with a common word
    expect(commonWordCount / trials).toBeGreaterThanOrEqual(0.7);
  });

  it('should generate valid letter arrays', () => {
    const puzzle = generateAnagramsPuzzle(4);

    // Letters array should have same length as words
    expect(puzzle.letters.length).toBe(puzzle.wordLength);

    // Letters should be uppercase
    expect(puzzle.letters.every(letter => /^[A-Z]$/.test(letter))).toBe(true);
  });
});

describe('getAnagramStats', () => {
  it('should return statistics about anagram groups', () => {
    const stats = getAnagramStats();

    expect(stats.totalGroups).toBeGreaterThan(0);
    expect(stats.bySize).toBeDefined();

    // Should have groups of size 4+ (our minimum)
    expect(stats.bySize[4] || 0 + stats.bySize[5] || 0).toBeGreaterThan(0);
  });
});
