import { describe, it, expect } from 'vitest';
import { generateWordLadderPuzzle, differsByOneLetter, WORD_LENGTH } from './WordLadder.jsx';

describe('WordLadder - helpers', () => {
  it('differsByOneLetter works', () => {
    expect(differsByOneLetter('COLD', 'CORD')).toBe(true);
    expect(differsByOneLetter('COLD', 'WARM')).toBe(false);
  });

  it('generateWordLadderPuzzle returns start/end/solution', () => {
    const puzzle = generateWordLadderPuzzle(4, 3, WORD_LENGTH);
    expect(puzzle.startWord.length).toBe(WORD_LENGTH);
    expect(puzzle.solution.length).toBeGreaterThan(1);
  });
});
import { describe, it, expect } from 'vitest';
import {
  differsByOneLetter,
  getWordNeighbors,
  findWordLadder,
  generateWordLadderPuzzle,
  getWordsByLength,
  isValidWord,
} from '../../data/wordUtils';

// ===========================================
// Word Ladder - differsByOneLetter Tests
// ===========================================
describe('WordLadder - differsByOneLetter', () => {
  it('should return true for words differing by one letter', () => {
    expect(differsByOneLetter('COLD', 'CORD')).toBe(true);
    expect(differsByOneLetter('CORD', 'WORD')).toBe(true);
    expect(differsByOneLetter('WORD', 'WORK')).toBe(true);
    expect(differsByOneLetter('WORK', 'WORM')).toBe(true);
  });

  it('should return false for identical words', () => {
    expect(differsByOneLetter('WORD', 'WORD')).toBe(false);
  });

  it('should return false for words differing by more than one letter', () => {
    expect(differsByOneLetter('COLD', 'WARM')).toBe(false);
    expect(differsByOneLetter('WORD', 'WART')).toBe(false);
    expect(differsByOneLetter('FISH', 'WISH')).toBe(true);
    expect(differsByOneLetter('FISH', 'DISH')).toBe(true);
    expect(differsByOneLetter('FISH', 'BIRD')).toBe(false);
  });

  it('should return false for words of different lengths', () => {
    expect(differsByOneLetter('WORD', 'WORDS')).toBe(false);
    expect(differsByOneLetter('CAT', 'CATS')).toBe(false);
  });

  it('should handle position of different letter correctly', () => {
    // First letter different
    expect(differsByOneLetter('CART', 'DART')).toBe(true);
    // Middle letter different
    expect(differsByOneLetter('CART', 'CURT')).toBe(true);
    // Last letter different
    expect(differsByOneLetter('CART', 'CARS')).toBe(true);
  });
});

// ===========================================
// Word Ladder - getWordNeighbors Tests
// ===========================================
describe('WordLadder - getWordNeighbors', () => {
  it('should return valid words that differ by one letter', () => {
    const neighbors = getWordNeighbors('COLD');

    expect(neighbors.length).toBeGreaterThan(0);
    neighbors.forEach(neighbor => {
      expect(differsByOneLetter('COLD', neighbor)).toBe(true);
      expect(isValidWord(neighbor)).toBe(true);
    });
  });

  it('should return uppercase words', () => {
    const neighbors = getWordNeighbors('word');

    neighbors.forEach(neighbor => {
      expect(neighbor).toBe(neighbor.toUpperCase());
    });
  });

  it('should include common neighbors', () => {
    const neighbors = getWordNeighbors('COLD');
    // Common neighbors of COLD include CORD, BOLD, GOLD, TOLD, etc.
    const hasCommonNeighbor = neighbors.some(n =>
      ['CORD', 'BOLD', 'GOLD', 'TOLD', 'COLT', 'HOLD'].includes(n)
    );
    expect(hasCommonNeighbor).toBe(true);
  });

  it('should not include the original word', () => {
    const neighbors = getWordNeighbors('WORD');
    expect(neighbors).not.toContain('WORD');
  });
});

// ===========================================
// Word Ladder - findWordLadder Tests
// ===========================================
describe('WordLadder - findWordLadder', () => {
  it('should find a path between connected words', () => {
    const ladder = findWordLadder('COLD', 'WARM');

    expect(ladder).not.toBeNull();
    expect(ladder[0]).toBe('COLD');
    expect(ladder[ladder.length - 1]).toBe('WARM');
  });

  it('should return valid intermediate steps', () => {
    const ladder = findWordLadder('COLD', 'WARM');

    if (ladder) {
      for (let i = 1; i < ladder.length; i++) {
        expect(differsByOneLetter(ladder[i - 1], ladder[i])).toBe(true);
        expect(isValidWord(ladder[i])).toBe(true);
      }
    }
  });

  it('should return [word] for same start and end', () => {
    const ladder = findWordLadder('WORD', 'WORD');

    expect(ladder).toEqual(['WORD']);
  });

  it('should return null for different length words', () => {
    const ladder = findWordLadder('COLD', 'WARMER');

    expect(ladder).toBeNull();
  });

  it('should return null for invalid words', () => {
    const ladder = findWordLadder('XXXX', 'YYYY');

    expect(ladder).toBeNull();
  });

  it('should find short ladder for close words', () => {
    const ladder = findWordLadder('COLD', 'CORD');

    expect(ladder).not.toBeNull();
    expect(ladder.length).toBe(2); // COLD -> CORD
  });

  it('should handle case insensitivity', () => {
    const ladder = findWordLadder('cold', 'CORD');

    expect(ladder).not.toBeNull();
    expect(ladder.length).toBe(2);
  });
});

// ===========================================
// Word Ladder - generateWordLadderPuzzle Tests
// ===========================================
describe('WordLadder - generateWordLadderPuzzle', () => {
  it('should generate a puzzle with valid start and end words', () => {
    const puzzle = generateWordLadderPuzzle(4, 3, 5);

    expect(puzzle).not.toBeNull();
    expect(isValidWord(puzzle.startWord)).toBe(true);
    expect(isValidWord(puzzle.endWord)).toBe(true);
  });

  it('should generate words of the specified length', () => {
    const puzzle = generateWordLadderPuzzle(4, 3, 5);

    expect(puzzle.startWord.length).toBe(4);
    expect(puzzle.endWord.length).toBe(4);
  });

  it('should include a valid solution path', () => {
    const puzzle = generateWordLadderPuzzle(4, 3, 5);

    expect(puzzle.solution).toBeDefined();
    expect(puzzle.solution.length).toBeGreaterThanOrEqual(4); // minSteps + 1
    expect(puzzle.solution[0]).toBe(puzzle.startWord);
    expect(puzzle.solution[puzzle.solution.length - 1]).toBe(puzzle.endWord);

    // Verify each step differs by one letter
    for (let i = 1; i < puzzle.solution.length; i++) {
      expect(differsByOneLetter(puzzle.solution[i - 1], puzzle.solution[i])).toBe(true);
    }
  });

  it('should respect minSteps and maxSteps', () => {
    const minSteps = 3;
    const maxSteps = 5;
    const puzzle = generateWordLadderPuzzle(4, minSteps, maxSteps);

    // Solution length includes start and end, so steps = length - 1
    const steps = puzzle.solution.length - 1;
    expect(steps).toBeGreaterThanOrEqual(minSteps);
    expect(steps).toBeLessThanOrEqual(maxSteps);
  });

  it('should generate different puzzles on multiple calls', () => {
    const puzzles = [];

    for (let i = 0; i < 5; i++) {
      const puzzle = generateWordLadderPuzzle(4, 3, 5);
      if (puzzle) {
        puzzles.push(`${puzzle.startWord}-${puzzle.endWord}`);
      }
    }

    // Should have some variety
    const uniquePuzzles = new Set(puzzles);
    expect(uniquePuzzles.size).toBeGreaterThan(1);
  });
});

// ===========================================
// Word Ladder - getWordsByLength Tests
// ===========================================
describe('WordLadder - getWordsByLength', () => {
  it('should return words of the specified length', () => {
    const words = getWordsByLength(4);

    expect(words.length).toBeGreaterThan(0);
    words.forEach(word => {
      expect(word.length).toBe(4);
    });
  });

  it('should return valid words', () => {
    const words = getWordsByLength(5);

    // Check a sample of words
    const sample = words.slice(0, 20);
    sample.forEach(word => {
      expect(isValidWord(word)).toBe(true);
    });
  });

  it('should return empty array for invalid length', () => {
    const words = getWordsByLength(100);

    expect(words).toEqual([]);
  });

  it('should contain common words', () => {
    const words4 = getWordsByLength(4);
    const words5 = getWordsByLength(5);

    expect(words4).toContain('COLD');
    expect(words4).toContain('WARM');
    expect(words5).toContain('HOUSE');
    expect(words5).toContain('ABOUT');
  });
});
