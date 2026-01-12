import { describe, it, expect } from 'vitest';
import {
  findTrueAnagrams,
  generateAnagramsPuzzle,
  isValidAnagramGuess,
  getAnagramStats,
  isValidWord,
  shuffleArray,
} from '../../data/wordUtils';

// ===========================================
// Anagrams - findTrueAnagrams Tests
// ===========================================
describe('Anagrams - findTrueAnagrams', () => {
  it('should find all anagrams of a word', () => {
    // "LISTEN" and "SILENT" are classic anagrams
    const anagrams = findTrueAnagrams('LISTEN');

    expect(anagrams.length).toBeGreaterThanOrEqual(1);
    expect(anagrams).toContain('LISTEN');
  });

  it('should return words with exactly the same letters', () => {
    const anagrams = findTrueAnagrams('STOP');

    anagrams.forEach(word => {
      const sortedOriginal = 'STOP'.split('').sort().join('');
      const sortedAnagram = word.split('').sort().join('');
      expect(sortedAnagram).toBe(sortedOriginal);
    });
  });

  it('should handle case insensitivity', () => {
    const anagrams1 = findTrueAnagrams('stop');
    const anagrams2 = findTrueAnagrams('STOP');

    expect(anagrams1.sort()).toEqual(anagrams2.sort());
  });

  it('should return uppercase words', () => {
    const anagrams = findTrueAnagrams('word');

    anagrams.forEach(word => {
      expect(word).toBe(word.toUpperCase());
    });
  });

  it('should return at least the original word', () => {
    const anagrams = findTrueAnagrams('XYZZY');

    expect(anagrams.length).toBeGreaterThanOrEqual(1);
  });
});

// ===========================================
// Anagrams - generateAnagramsPuzzle Tests
// ===========================================
describe('Anagrams - generateAnagramsPuzzle', () => {
  it('should return puzzle with letters array', () => {
    const puzzle = generateAnagramsPuzzle(4);

    expect(puzzle.letters).toBeDefined();
    expect(Array.isArray(puzzle.letters)).toBe(true);
    expect(puzzle.letters.length).toBeGreaterThan(0);
  });

  it('should return at least minAnagrams solutions', () => {
    const minAnagrams = 4;
    const puzzle = generateAnagramsPuzzle(minAnagrams);

    expect(puzzle.anagrams.length).toBeGreaterThanOrEqual(minAnagrams);
  });

  it('should return valid words as anagrams', () => {
    const puzzle = generateAnagramsPuzzle(4);

    puzzle.anagrams.forEach(word => {
      expect(isValidWord(word)).toBe(true);
    });
  });

  it('should have consistent word length', () => {
    const puzzle = generateAnagramsPuzzle(4);

    expect(puzzle.wordLength).toBe(puzzle.letters.length);
    puzzle.anagrams.forEach(word => {
      expect(word.length).toBe(puzzle.wordLength);
    });
  });

  it('should have letters that form all anagram words', () => {
    const puzzle = generateAnagramsPuzzle(4);
    const lettersSorted = puzzle.letters.sort().join('');

    puzzle.anagrams.forEach(word => {
      const wordSorted = word.split('').sort().join('');
      expect(wordSorted).toBe(lettersSorted);
    });
  });

  it('should shuffle letters differently from anagrams', () => {
    // Over multiple generations, letters should sometimes differ from words
    let differentCount = 0;

    for (let i = 0; i < 10; i++) {
      const puzzle = generateAnagramsPuzzle(4);
      const lettersJoined = puzzle.letters.join('');
      const isDifferent = !puzzle.anagrams.includes(lettersJoined);
      if (isDifferent) differentCount++;
    }

    // At least some should have shuffled letters
    expect(differentCount).toBeGreaterThan(0);
  });
});

// ===========================================
// Anagrams - isValidAnagramGuess Tests
// ===========================================
describe('Anagrams - isValidAnagramGuess', () => {
  it('should accept valid anagram using all letters', () => {
    const letters = ['S', 'T', 'O', 'P'];

    expect(isValidAnagramGuess('STOP', letters)).toBe(true);
    expect(isValidAnagramGuess('TOPS', letters)).toBe(true);
    expect(isValidAnagramGuess('POTS', letters)).toBe(true);
    expect(isValidAnagramGuess('SPOT', letters)).toBe(true);
  });

  it('should reject words not using all letters', () => {
    const letters = ['S', 'T', 'O', 'P', 'S'];

    // Only 4 letters used, need 5
    expect(isValidAnagramGuess('STOP', letters)).toBe(false);
  });

  it('should reject invalid words', () => {
    const letters = ['X', 'Y', 'Z', 'Z'];

    expect(isValidAnagramGuess('XYZZ', letters)).toBe(false);
  });

  it('should handle case insensitivity', () => {
    const letters = ['S', 'T', 'O', 'P'];

    expect(isValidAnagramGuess('stop', letters)).toBe(true);
    expect(isValidAnagramGuess('Stop', letters)).toBe(true);
  });

  it('should reject words using wrong letters', () => {
    const letters = ['S', 'T', 'O', 'P'];

    expect(isValidAnagramGuess('STEP', letters)).toBe(false); // E not in letters
  });
});

// ===========================================
// Anagrams - getAnagramStats Tests
// ===========================================
describe('Anagrams - getAnagramStats', () => {
  it('should return statistics about available puzzles', () => {
    const stats = getAnagramStats();

    expect(stats).toBeDefined();
    expect(stats.totalGroups).toBeDefined();
    expect(typeof stats.totalGroups).toBe('number');
  });

  it('should return bySize breakdown', () => {
    const stats = getAnagramStats();

    expect(stats.bySize).toBeDefined();
    expect(typeof stats.bySize).toBe('object');
  });

  it('should have positive total groups', () => {
    const stats = getAnagramStats();

    expect(stats.totalGroups).toBeGreaterThan(0);
  });
});

// ===========================================
// Anagrams - Score Calculation Tests
// ===========================================
describe('Anagrams - Score Calculation', () => {
  // Anagram games often score based on word length or difficulty
  const calculateScore = (words, totalPossible) => {
    const baseScore = words.length * 10;
    const completionBonus = words.length === totalPossible ? 50 : 0;
    return baseScore + completionBonus;
  };

  it('should score based on words found', () => {
    expect(calculateScore(['STOP', 'POTS'], 4)).toBe(20);
    expect(calculateScore(['STOP'], 4)).toBe(10);
  });

  it('should give completion bonus when all words found', () => {
    expect(calculateScore(['STOP', 'POTS', 'TOPS', 'SPOT'], 4)).toBe(90); // 40 + 50 bonus
  });

  it('should not give bonus for partial completion', () => {
    expect(calculateScore(['STOP', 'POTS', 'TOPS'], 4)).toBe(30); // No bonus
  });
});
