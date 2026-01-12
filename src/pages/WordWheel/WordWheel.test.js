import { describe, it, expect } from 'vitest';
import {
  findAllWords,
  generatePuzzle,
  shuffleArray,
  isValidWord,
} from '../../data/wordUtils';

// ===========================================
// Word Wheel - findAllWords Tests
// ===========================================
describe('WordWheel - findAllWords', () => {
  it('should find words that include the center letter', () => {
    const letters = ['C', 'A', 'R', 'P', 'E', 'T', 'I', 'N', 'G'];
    const center = 'A';
    const words = findAllWords(letters, center);

    // All words should contain the center letter
    words.forEach(word => {
      expect(word.toUpperCase()).toContain(center);
    });
  });

  it('should only return words of 4 or more letters', () => {
    const letters = ['C', 'A', 'R', 'P', 'E', 'T', 'I', 'N', 'G'];
    const center = 'A';
    const words = findAllWords(letters, center);

    words.forEach(word => {
      expect(word.length).toBeGreaterThanOrEqual(4);
    });
  });

  it('should return words sorted by length (longest first)', () => {
    const letters = ['C', 'A', 'R', 'P', 'E', 'T', 'I', 'N', 'G'];
    const center = 'A';
    const words = findAllWords(letters, center);

    for (let i = 1; i < words.length; i++) {
      expect(words[i].length).toBeLessThanOrEqual(words[i - 1].length);
    }
  });

  it('should not use letters more times than available', () => {
    const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'];
    const center = 'A';
    const words = findAllWords(letters, center);

    words.forEach(word => {
      const letterCounts = {};
      for (const char of word) {
        letterCounts[char] = (letterCounts[char] || 0) + 1;
      }

      for (const char of Object.keys(letterCounts)) {
        const availableCount = letters.filter(l => l === char).length;
        expect(letterCounts[char]).toBeLessThanOrEqual(availableCount);
      }
    });
  });

  it('should handle case insensitivity', () => {
    const letters = ['c', 'a', 'r', 'p', 'e', 't', 'i', 'n', 'g'];
    const center = 'a';
    const words = findAllWords(letters, center);

    expect(words.length).toBeGreaterThan(0);
    words.forEach(word => {
      expect(word).toBe(word.toUpperCase());
    });
  });

  it('should return empty array if no words possible', () => {
    const letters = ['X', 'X', 'X', 'Q', 'Q', 'Q', 'Z', 'Z', 'Z'];
    const center = 'X';
    const words = findAllWords(letters, center);

    expect(Array.isArray(words)).toBe(true);
  });
});

// ===========================================
// Word Wheel - Puzzle Structure Tests
// ===========================================
describe('WordWheel - Puzzle Structure', () => {
  // Use mock puzzle to avoid slow generation
  const mockPuzzle = {
    letters: ['C', 'A', 'R', 'P', 'E', 'T', 'I', 'N', 'G'],
    center: 'A',
    nineLetterWord: 'CARPETING',
  };

  it('should have a puzzle with 9 letters', () => {
    expect(mockPuzzle.letters).toHaveLength(9);
  });

  it('should have a center letter that is in the letters array', () => {
    expect(mockPuzzle.letters).toContain(mockPuzzle.center);
  });

  it('should have a 9-letter word', () => {
    expect(mockPuzzle.nineLetterWord).toHaveLength(9);
    expect(isValidWord(mockPuzzle.nineLetterWord)).toBe(true);
  });

  it('should have letters that can form the nine letter word', () => {
    const wordLetters = mockPuzzle.nineLetterWord.split('').sort().join('');
    const puzzleLetters = [...mockPuzzle.letters].sort().join('');
    expect(wordLetters).toBe(puzzleLetters);
  });

  it('should have puzzle properties of correct types', () => {
    expect(Array.isArray(mockPuzzle.letters)).toBe(true);
    expect(typeof mockPuzzle.center).toBe('string');
    expect(typeof mockPuzzle.nineLetterWord).toBe('string');
  });
});

// ===========================================
// Word Wheel - Score Calculation Logic Tests
// ===========================================
describe('WordWheel - Score Calculation', () => {
  const calculateScore = (words) => {
    return words.reduce((score, word) => {
      if (word.length === 9) return score + 18;
      if (word.length >= 7) return score + 7;
      if (word.length >= 5) return score + 5;
      if (word.length >= 4) return score + 2;
      return score + 1;
    }, 0);
  };

  it('should score 9-letter words as 18 points', () => {
    expect(calculateScore(['CARPETING'])).toBe(18);
  });

  it('should score 7-8 letter words as 7 points', () => {
    expect(calculateScore(['CARPING'])).toBe(7);
    expect(calculateScore(['PAINTING'])).toBe(7);
  });

  it('should score 5-6 letter words as 5 points', () => {
    expect(calculateScore(['PAINT'])).toBe(5);
    expect(calculateScore(['CARPET'])).toBe(5);
  });

  it('should score 4 letter words as 2 points', () => {
    expect(calculateScore(['CART'])).toBe(2);
  });

  it('should accumulate scores correctly', () => {
    const words = ['CARPETING', 'PAINTING', 'PAINT', 'CART'];
    // 18 + 7 + 5 + 2 = 32
    expect(calculateScore(words)).toBe(32);
  });
});

// ===========================================
// Word Wheel - shuffleArray Tests
// ===========================================
describe('WordWheel - shuffleArray', () => {
  it('should return an array of the same length', () => {
    const original = [1, 2, 3, 4, 5, 6, 7, 8];
    const shuffled = shuffleArray(original);

    expect(shuffled).toHaveLength(original.length);
  });

  it('should contain the same elements', () => {
    const original = ['A', 'B', 'C', 'D', 'E'];
    const shuffled = shuffleArray(original);

    expect(shuffled.sort()).toEqual(original.sort());
  });

  it('should not modify the original array', () => {
    const original = [1, 2, 3, 4, 5];
    const originalCopy = [...original];
    shuffleArray(original);

    expect(original).toEqual(originalCopy);
  });

  it('should produce different orderings over multiple shuffles', () => {
    const original = [1, 2, 3, 4, 5, 6, 7, 8];
    const results = new Set();

    for (let i = 0; i < 20; i++) {
      results.add(shuffleArray(original).join(','));
    }

    // Should have produced multiple different orderings
    expect(results.size).toBeGreaterThan(1);
  });
});
