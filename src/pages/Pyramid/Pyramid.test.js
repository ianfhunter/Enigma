import { describe, it, expect } from 'vitest';
import {
  TOTAL_CELLS,
  ROWS,
  getRowAndPos,
  getIndex,
  buildAdjacencyMap,
  generatePyramidLetters,
  findAllValidWordsWithPaths,
  findNonOverlappingSolution,
  generateSolvablePuzzle,
  isValidPath,
  getWordWeight,
} from './Pyramid.jsx';
import { createSeededRandom, isCommonWord } from '../../data/wordUtils';

describe('Pyramid - indexing and adjacency', () => {
  it('row/pos conversions round-trip', () => {
    for (let i = 0; i < TOTAL_CELLS; i++) {
      const { row, pos } = getRowAndPos(i);
      expect(getIndex(row, pos)).toBe(i);
    }
  });

  it('buildAdjacencyMap has correct sizes', () => {
    const adj = buildAdjacencyMap();
    expect(Object.keys(adj)).toHaveLength(TOTAL_CELLS);
    expect(adj[0].length).toBeGreaterThan(0);
  });

  it('isValidPath checks adjacency and uniqueness', () => {
    expect(isValidPath([0, 1])).toBe(true);
    expect(isValidPath([0, 0])).toBe(false);
  });
});

describe('Pyramid - generation', () => {
  it('generatePyramidLetters produces 15 letters deterministically with seeded random', () => {
    const rand = createSeededRandom(123);
    const letters = generatePyramidLetters(rand);
    expect(letters).toHaveLength(TOTAL_CELLS);
    // Recreate with same seed
    const rand2 = createSeededRandom(123);
    expect(generatePyramidLetters(rand2)).toEqual(letters);
  });

  it('findAllValidWordsWithPaths discovers words from letters', () => {
    const letters = Array(TOTAL_CELLS).fill('A');
    const paths = findAllValidWordsWithPaths(letters);
    // "AAA" should be valid if dictionary allows; ensure map exists
    expect(paths instanceof Map).toBe(true);
  });

  it('findNonOverlappingSolution returns solvable flag', () => {
    const letters = Array(TOTAL_CELLS).fill('A');
    const paths = findAllValidWordsWithPaths(letters);
    const res = findNonOverlappingSolution(paths);
    expect(typeof res.solvable).toBe('boolean');
  });

  it('generateSolvablePuzzle returns letters/words and wordPaths', () => {
    const puzzle = generateSolvablePuzzle(42);
    expect(puzzle.letters).toHaveLength(TOTAL_CELLS);
    expect(Array.isArray(puzzle.validWords)).toBe(true);
    expect(puzzle.solution.length).toBeGreaterThan(0);
  });

  it('solution should prioritize common words', () => {
    // Test with multiple seeds to ensure consistent behavior
    const seeds = [42, 123, 456, 789, 1000];

    for (const seed of seeds) {
      const puzzle = generateSolvablePuzzle(seed);

      // Verify solution exists and covers all cells
      expect(puzzle.solution.length).toBeGreaterThan(0);

      const usedCells = new Set();
      for (const item of puzzle.solution) {
        for (const idx of item.path) {
          usedCells.add(idx);
        }
      }
      expect(usedCells.size).toBe(TOTAL_CELLS);

      // Check that solution words are preferably common
      const solutionWords = puzzle.solution.map(item => item.word);
      const commonWordsCount = solutionWords.filter(word => isCommonWord(word)).length;

      // At least 50% of solution words should be common (lenient threshold)
      // This ensures the solution uses recognizable words
      const commonWordRatio = commonWordsCount / solutionWords.length;
      expect(commonWordRatio).toBeGreaterThanOrEqual(0.5);
    }
  });

  it('solution quality check across multiple seeds', () => {
    // More comprehensive test with detailed output
    const seeds = [42, 123, 456, 789, 1000, 2024, 5555, 9999, 12345, 99999];
    let totalCommonRatio = 0;
    let minCommonRatio = 1.0;

    for (const seed of seeds) {
      const puzzle = generateSolvablePuzzle(seed);
      const solutionWords = puzzle.solution.map(item => item.word);
      const commonWordsCount = solutionWords.filter(word => isCommonWord(word)).length;
      const commonWordRatio = commonWordsCount / solutionWords.length;

      totalCommonRatio += commonWordRatio;
      minCommonRatio = Math.min(minCommonRatio, commonWordRatio);

      // Each individual puzzle should have at least some common words
      expect(commonWordsCount).toBeGreaterThan(0);
    }

    // Average across all seeds should be good (>60%)
    const avgCommonRatio = totalCommonRatio / seeds.length;
    expect(avgCommonRatio).toBeGreaterThanOrEqual(0.6);

    // Minimum across all seeds should be reasonable (>40%)
    expect(minCommonRatio).toBeGreaterThanOrEqual(0.4);
  });

  it('solution words should all be valid', () => {
    const puzzle = generateSolvablePuzzle(42);

    // Verify each word in solution exists in valid words
    for (const item of puzzle.solution) {
      expect(puzzle.validWords).toContain(item.word);
    }
  });

  it('solution paths should be non-overlapping', () => {
    const puzzle = generateSolvablePuzzle(789);

    const usedCells = new Set();
    for (const item of puzzle.solution) {
      for (const idx of item.path) {
        // Each cell should only be used once
        expect(usedCells.has(idx)).toBe(false);
        usedCells.add(idx);
      }
    }

    // All cells should be covered
    expect(usedCells.size).toBe(TOTAL_CELLS);
  });
});

describe('Pyramid - word weight and sorting', () => {
  it('getWordWeight should prioritize common words', () => {
    // Mock some common and uncommon words
    const commonWord = 'HOUSE'; // Should be common
    const uncommonWord = 'ZZZZZ'; // Not a real word, should have low weight

    const commonWeight = getWordWeight(commonWord);
    const uncommonWeight = getWordWeight(uncommonWord);

    // Common words should have higher weight due to the 1000 bonus
    expect(commonWeight).toBeGreaterThan(uncommonWeight);
  });
});
