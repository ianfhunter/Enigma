import { describe, it, expect } from 'vitest';
import {
  findAllWordsFromLetters,
  getLongestWordsFromLetters,
  isValidCountdownWord,
  isValidWord,
} from '../../data/wordUtils';

// ===========================================
// CountdownLetters - findAllWordsFromLetters Tests
// ===========================================
describe('CountdownLetters - findAllWordsFromLetters', () => {
  it('should find words from a set of letters', () => {
    const letters = ['C', 'A', 'T', 'S', 'D', 'O', 'G', 'E', 'R'];
    const words = findAllWordsFromLetters(letters, 3);

    expect(words.length).toBeGreaterThan(0);
    expect(words).toContain('CAT');
    expect(words).toContain('DOG');
    expect(words).toContain('CATS');
  });

  it('should sort words by length (longest first)', () => {
    const letters = ['C', 'A', 'T', 'S', 'D', 'O', 'G', 'E', 'R'];
    const words = findAllWordsFromLetters(letters, 3);

    for (let i = 1; i < words.length; i++) {
      expect(words[i - 1].length).toBeGreaterThanOrEqual(words[i].length);
    }
  });

  it('should respect minimum length parameter', () => {
    const letters = ['C', 'A', 'T', 'S', 'D', 'O', 'G', 'E', 'R'];
    const words4 = findAllWordsFromLetters(letters, 4);
    const words3 = findAllWordsFromLetters(letters, 3);

    expect(words4.every(word => word.length >= 4)).toBe(true);

    expect(words3.length).toBeGreaterThan(words4.length);
  });

  it('should not find words longer than available letters', () => {
    const letters = ['C', 'A', 'T'];
    const words = findAllWordsFromLetters(letters, 3);

    expect(words.every(word => word.length <= letters.length)).toBe(true);
  });

  it('should respect letter frequency', () => {
    // Only one 'T', so no words with double T
    const letters = ['T', 'E', 'S', 'T', 'I', 'N', 'G', 'A', 'B'];
    const words = findAllWordsFromLetters(letters, 3);

    // TESTING has two T's, but we have two T's so it should be possible
    // Let's check a word that would need more letters than available
    const lettersNoDoubleT = ['T', 'E', 'S', 'I', 'N', 'G', 'A', 'B', 'C'];
    const wordsNoDoubleT = findAllWordsFromLetters(lettersNoDoubleT, 3);

    // Words requiring two T's should not be present with only one T
    wordsNoDoubleT.forEach(word => {
      const tCount = word.split('').filter(c => c === 'T').length;
      expect(tCount).toBeLessThanOrEqual(1);
    });
  });

  it('should return uppercase words', () => {
    const letters = ['C', 'A', 'T'];
    const words = findAllWordsFromLetters(letters, 3);

    expect(words.every(word => word === word.toUpperCase())).toBe(true);
  });

  it('should handle empty result gracefully', () => {
    const letters = ['X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X'];
    const words = findAllWordsFromLetters(letters, 3);

    expect(Array.isArray(words)).toBe(true);
  });
});

// ===========================================
// CountdownLetters - getLongestWordsFromLetters Tests
// ===========================================
describe('CountdownLetters - getLongestWordsFromLetters', () => {
  it('should return only the longest words', () => {
    const letters = ['C', 'A', 'T', 'S', 'D', 'O', 'G', 'E', 'R'];
    const longest = getLongestWordsFromLetters(letters);

    if (longest.length > 0) {
      const maxLength = longest[0].length;
      longest.forEach(word => {
        expect(word.length).toBe(maxLength);
      });
    }
  });

  it('should return all words of maximum length', () => {
    const letters = ['S', 'T', 'O', 'P', 'A', 'E', 'R', 'I', 'N'];
    const longest = getLongestWordsFromLetters(letters);
    const allWords = findAllWordsFromLetters(letters, 3);

    if (longest.length > 0 && allWords.length > 0) {
      const maxLength = allWords[0].length;
      const expectedCount = allWords.filter(w => w.length === maxLength).length;
      expect(longest.length).toBe(expectedCount);
    }
  });

  it('should return empty array for impossible letters', () => {
    const letters = ['X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X'];
    const longest = getLongestWordsFromLetters(letters);

    expect(Array.isArray(longest)).toBe(true);
    expect(longest.length).toBe(0);
  });

  it('should return valid dictionary words', () => {
    const letters = ['C', 'A', 'T', 'S', 'D', 'O', 'G', 'E', 'R'];
    const longest = getLongestWordsFromLetters(letters);

    longest.forEach(word => {
      expect(isValidWord(word)).toBe(true);
    });
  });
});

// ===========================================
// CountdownLetters - isValidCountdownWord Tests
// ===========================================
describe('CountdownLetters - isValidCountdownWord', () => {
  it('should accept valid words using available letters', () => {
    const letters = ['C', 'A', 'T', 'S', 'D', 'O', 'G', 'E', 'R'];

    expect(isValidCountdownWord('CAT', letters)).toBe(true);
    expect(isValidCountdownWord('DOG', letters)).toBe(true);
    expect(isValidCountdownWord('CATS', letters)).toBe(true);
  });

  it('should reject words shorter than 3 letters', () => {
    const letters = ['C', 'A', 'T', 'S', 'D', 'O', 'G', 'E', 'R'];

    expect(isValidCountdownWord('AT', letters)).toBe(false);
    expect(isValidCountdownWord('A', letters)).toBe(false);
  });

  it('should reject invalid dictionary words', () => {
    const letters = ['C', 'A', 'T', 'S', 'D', 'O', 'G', 'E', 'R'];

    expect(isValidCountdownWord('CATSDOG', letters)).toBe(false);
    expect(isValidCountdownWord('XYZ', letters)).toBe(false);
  });

  it('should reject words using letters not in pool', () => {
    const letters = ['C', 'A', 'T', 'S', 'D', 'O', 'G', 'E', 'R'];

    expect(isValidCountdownWord('BUZZ', letters)).toBe(false); // No B, U, or Z
  });

  it('should respect letter frequency', () => {
    const letters = ['C', 'A', 'T']; // Only one of each

    // Can't spell words requiring duplicate letters
    expect(isValidCountdownWord('TACT', letters)).toBe(false); // Needs two T's
  });

  it('should handle case insensitivity', () => {
    const letters = ['C', 'A', 'T', 'S', 'D', 'O', 'G', 'E', 'R'];

    expect(isValidCountdownWord('cat', letters)).toBe(true);
    expect(isValidCountdownWord('Cat', letters)).toBe(true);
    expect(isValidCountdownWord('CAT', letters)).toBe(true);
  });

  it('should handle lowercase letter pool', () => {
    const letters = ['c', 'a', 't', 's', 'd', 'o', 'g', 'e', 'r'];

    expect(isValidCountdownWord('CAT', letters)).toBe(true);
    expect(isValidCountdownWord('DOG', letters)).toBe(true);
  });
});

// ===========================================
// CountdownLetters - Score Calculation Tests
// ===========================================
describe('CountdownLetters - Score Calculation', () => {
  const calculateScore = (word, letters) => {
    if (!word || !isValidCountdownWord(word, letters)) return 0;
    // 9-letter word gets double points
    if (word.length === 9) return 18;
    return word.length;
  };

  it('should score based on word length', () => {
    const letters = ['C', 'A', 'T', 'S', 'D', 'O', 'G', 'E', 'R'];

    expect(calculateScore('CAT', letters)).toBe(3);
    expect(calculateScore('CATS', letters)).toBe(4);
    expect(calculateScore('COASTED', letters)).toBe(7);
  });

  it('should give double points for 9-letter words', () => {
    // Need a real 9-letter word for this test
    const letters = ['C', 'R', 'E', 'A', 'T', 'I', 'O', 'N', 'S'];

    expect(calculateScore('CREATIONS', letters)).toBe(18);
  });

  it('should return 0 for invalid words', () => {
    const letters = ['C', 'A', 'T', 'S', 'D', 'O', 'G', 'E', 'R'];

    expect(calculateScore('XYZZY', letters)).toBe(0);
    expect(calculateScore('', letters)).toBe(0);
    expect(calculateScore(null, letters)).toBe(0);
  });

  it('should return 0 for words too short', () => {
    const letters = ['C', 'A', 'T', 'S', 'D', 'O', 'G', 'E', 'R'];

    expect(calculateScore('AT', letters)).toBe(0);
  });
});

// ===========================================
// CountdownLetters - Letter Pool Tests
// ===========================================
describe('CountdownLetters - Letter Pool Validation', () => {
  const VOWELS = 'AEIOU';
  const MIN_VOWELS = 3;
  const MIN_CONSONANTS = 4;
  const TOTAL_LETTERS = 9;

  const isValidSelection = (letters) => {
    if (letters.length !== TOTAL_LETTERS) return false;

    const vowelCount = letters.filter(l => VOWELS.includes(l)).length;
    const consonantCount = letters.length - vowelCount;

    return vowelCount >= MIN_VOWELS && consonantCount >= MIN_CONSONANTS;
  };

  it('should require exactly 9 letters', () => {
    expect(isValidSelection(['A', 'E', 'I', 'B', 'C', 'D', 'F', 'G'])).toBe(false); // 8
    expect(isValidSelection(['A', 'E', 'I', 'B', 'C', 'D', 'F', 'G', 'H'])).toBe(true); // 9
    expect(isValidSelection(['A', 'E', 'I', 'B', 'C', 'D', 'F', 'G', 'H', 'J'])).toBe(false); // 10
  });

  it('should require at least 3 vowels', () => {
    expect(isValidSelection(['A', 'E', 'B', 'C', 'D', 'F', 'G', 'H', 'J'])).toBe(false); // 2 vowels
    expect(isValidSelection(['A', 'E', 'I', 'B', 'C', 'D', 'F', 'G', 'H'])).toBe(true); // 3 vowels
  });

  it('should require at least 4 consonants', () => {
    expect(isValidSelection(['A', 'E', 'I', 'O', 'U', 'A', 'B', 'C', 'D'])).toBe(false); // 3 consonants
    expect(isValidSelection(['A', 'E', 'I', 'O', 'U', 'B', 'C', 'D', 'F'])).toBe(true); // 4 consonants
  });

  it('should accept valid 3 vowel, 6 consonant combinations', () => {
    expect(isValidSelection(['A', 'E', 'I', 'B', 'C', 'D', 'F', 'G', 'H'])).toBe(true);
  });

  it('should accept valid 5 vowel, 4 consonant combinations', () => {
    expect(isValidSelection(['A', 'E', 'I', 'O', 'U', 'B', 'C', 'D', 'F'])).toBe(true);
  });
});
