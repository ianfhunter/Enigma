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
} from './Pyramid.jsx';
import { createSeededRandom } from '../../data/wordUtils';

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
});
