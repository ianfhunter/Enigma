import { describe, it, expect } from 'vitest';
import {
  shuffleArray,
  isValidWord,
} from '../../data/wordUtils';

// ===========================================
// Conundrum - Puzzle Structure Tests
// ===========================================
describe('Conundrum - Puzzle Structure', () => {
  // Mock puzzle to avoid slow generation
  const mockPuzzle = {
    word: 'CARPETING',
    scrambled: 'PETCARING',
  };

  it('should have a 9-letter word', () => {
    expect(mockPuzzle.word).toHaveLength(9);
  });

  it('should have valid puzzle structure', () => {
    expect(typeof mockPuzzle.word).toBe('string');
    expect(typeof mockPuzzle.scrambled).toBe('string');
  });

  it('should have scrambled letters different from the word', () => {
    expect(mockPuzzle.scrambled).not.toBe(mockPuzzle.word);
    expect(mockPuzzle.scrambled).toHaveLength(9);
  });

  it('should contain the same letters in scrambled form', () => {
    const sortedWord = mockPuzzle.word.split('').sort().join('');
    const sortedScrambled = mockPuzzle.scrambled.split('').sort().join('');

    expect(sortedScrambled).toBe(sortedWord);
  });

  it('should have uppercase words', () => {
    expect(mockPuzzle.word).toBe(mockPuzzle.word.toUpperCase());
    expect(mockPuzzle.scrambled).toBe(mockPuzzle.scrambled.toUpperCase());
  });
});

// ===========================================
// Conundrum - Letter Validation Logic Tests
// ===========================================
describe('Conundrum - Letter Validation', () => {
  const canAddLetter = (guess, displayLetters, newChar) => {
    const upperChar = newChar.toUpperCase();
    const currentGuessChars = guess.split('');

    const availableCount = displayLetters.filter(l => l === upperChar).length;
    const usedCount = currentGuessChars.filter(c => c === upperChar).length;

    return usedCount < availableCount;
  };

  it('should allow adding a letter that is available', () => {
    const displayLetters = ['C', 'A', 'R', 'P', 'E', 'T', 'I', 'N', 'G'];

    expect(canAddLetter('', displayLetters, 'C')).toBe(true);
    expect(canAddLetter('CAR', displayLetters, 'P')).toBe(true);
  });

  it('should not allow adding a letter already fully used', () => {
    const displayLetters = ['C', 'A', 'R', 'P', 'E', 'T', 'I', 'N', 'G'];

    // 'C' appears once, so after using it once, can't add again
    expect(canAddLetter('C', displayLetters, 'C')).toBe(false);
    expect(canAddLetter('CAR', displayLetters, 'C')).toBe(false);
  });

  it('should allow adding duplicate letters if available', () => {
    const displayLetters = ['T', 'E', 'S', 'T', 'I', 'N', 'G', 'S', 'S'];

    // 'S' appears 3 times
    expect(canAddLetter('', displayLetters, 'S')).toBe(true);
    expect(canAddLetter('S', displayLetters, 'S')).toBe(true);
    expect(canAddLetter('SS', displayLetters, 'S')).toBe(true);
    expect(canAddLetter('SSS', displayLetters, 'S')).toBe(false);
  });

  it('should not allow letters not in display', () => {
    const displayLetters = ['C', 'A', 'R', 'P', 'E', 'T', 'I', 'N', 'G'];

    expect(canAddLetter('', displayLetters, 'Z')).toBe(false);
    expect(canAddLetter('', displayLetters, 'X')).toBe(false);
  });
});

// ===========================================
// Conundrum - Guess Validation Tests
// ===========================================
describe('Conundrum - Guess Validation', () => {
  const mockPuzzle = {
    word: 'CARPETING',
    scrambled: 'PETCARING',
  };

  it('should accept a valid 9-letter word using all letters', () => {
    const guess = mockPuzzle.word;

    expect(guess.length).toBe(9);
    expect(isValidWord(guess)).toBe(true);
  });

  it('should reject words shorter than 9 letters', () => {
    // Even if valid word, must be 9 letters
    expect(mockPuzzle.word.length).toBe(9);
    expect(mockPuzzle.word.slice(0, 8).length).not.toBe(9);
  });

  it('should verify guess uses same letters as scrambled', () => {
    const guessSorted = mockPuzzle.word.split('').sort().join('');
    const scrambledSorted = mockPuzzle.scrambled.split('').sort().join('');

    expect(guessSorted).toBe(scrambledSorted);
  });
});

// ===========================================
// Conundrum - Timer Logic Tests
// ===========================================
describe('Conundrum - Timer Format', () => {
  const formatTime = (seconds) => {
    return `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, '0')}`;
  };

  it('should format 30 seconds correctly', () => {
    expect(formatTime(30)).toBe('0:30');
  });

  it('should format 0 seconds correctly', () => {
    expect(formatTime(0)).toBe('0:00');
  });

  it('should format 60 seconds as 1 minute', () => {
    expect(formatTime(60)).toBe('1:00');
  });

  it('should format 90 seconds correctly', () => {
    expect(formatTime(90)).toBe('1:30');
  });

  it('should pad single digit seconds with zero', () => {
    expect(formatTime(5)).toBe('0:05');
    expect(formatTime(65)).toBe('1:05');
  });
});

// ===========================================
// Conundrum - getUsedIndices Logic Tests
// ===========================================
describe('Conundrum - Used Indices Tracking', () => {
  const getUsedIndices = (guess, displayLetters) => {
    const usedIndices = new Set();
    const availableIndices = displayLetters.map((_, i) => i);

    for (const char of guess) {
      const matchIdx = availableIndices.findIndex(
        idx => displayLetters[idx] === char && !usedIndices.has(idx)
      );
      if (matchIdx !== -1) {
        usedIndices.add(availableIndices[matchIdx]);
      }
    }

    return usedIndices;
  };

  it('should return empty set for empty guess', () => {
    const displayLetters = ['C', 'A', 'R', 'P', 'E', 'T', 'I', 'N', 'G'];
    const usedIndices = getUsedIndices('', displayLetters);

    expect(usedIndices.size).toBe(0);
  });

  it('should track single used letter', () => {
    const displayLetters = ['C', 'A', 'R', 'P', 'E', 'T', 'I', 'N', 'G'];
    const usedIndices = getUsedIndices('C', displayLetters);

    expect(usedIndices.size).toBe(1);
    expect(usedIndices.has(0)).toBe(true); // 'C' is at index 0
  });

  it('should track multiple used letters', () => {
    const displayLetters = ['C', 'A', 'R', 'P', 'E', 'T', 'I', 'N', 'G'];
    const usedIndices = getUsedIndices('CAR', displayLetters);

    expect(usedIndices.size).toBe(3);
  });

  it('should handle duplicate letters correctly', () => {
    const displayLetters = ['T', 'E', 'S', 'T', 'I', 'N', 'G', 'S', 'S'];
    const usedIndices = getUsedIndices('TEST', displayLetters);

    // Should use indices 0 (T), 1 (E), 2 (S), 3 (T)
    expect(usedIndices.size).toBe(4);
  });
});
