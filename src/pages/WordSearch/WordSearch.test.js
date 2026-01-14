import { describe, it, expect } from 'vitest';
import {
  generatePuzzle,
  WORD_SEARCH_GRID_SIZE,
  WORD_SEARCH_WORD_COUNT,
} from './WordSearch';

const runPuzzle = (seed = 12345) => generatePuzzle(seed);

describe('Word Search - puzzle generation', () => {
  it('creates a full grid with the expected dimensions', () => {
    const puzzle = runPuzzle();

    expect(puzzle.grid.length).toBe(WORD_SEARCH_GRID_SIZE);
    puzzle.grid.forEach(row => {
      expect(row.length).toBe(WORD_SEARCH_GRID_SIZE);
      row.forEach(cell => {
        expect(cell).toMatch(/^[A-Z]$/);
      });
    });
  });

  it('places the expected number of words with positions', () => {
    const puzzle = runPuzzle();

    expect(puzzle.words.length).toBe(WORD_SEARCH_WORD_COUNT);
    expect(puzzle.wordPositions.length).toBe(WORD_SEARCH_WORD_COUNT);

    puzzle.words.forEach((word, idx) => {
      const positions = puzzle.wordPositions[idx];
      expect(positions.length).toBe(word.length);

      // Positions should align with the letters in the grid along a straight line
      const [first, second] = positions;
      const dr = Math.sign(second[0] - first[0]);
      const dc = Math.sign(second[1] - first[1]);

      positions.forEach((pos, i) => {
        const [r, c] = pos;
        expect(puzzle.grid[r][c]).toBe(word[i]);
        if (i > 0) {
          const [prevR, prevC] = positions[i - 1];
          expect(r - prevR).toBe(dr);
          expect(c - prevC).toBe(dc);
        }
      });
    });
  });

  it('is deterministic for the same seed and varies across seeds', () => {
    const puzzleA1 = runPuzzle(999);
    const puzzleA2 = runPuzzle(999);
    const puzzleB = runPuzzle(123);

    expect(JSON.stringify(puzzleA1)).toBe(JSON.stringify(puzzleA2));
    expect(JSON.stringify(puzzleA1)).not.toBe(JSON.stringify(puzzleB));
  });

  it('does not leave empty cells and stores unique words', () => {
    const puzzle = runPuzzle();
    const flat = puzzle.grid.flat();

    expect(flat.every(cell => cell !== '')).toBe(true);
    expect(new Set(puzzle.words).size).toBe(puzzle.words.length);
  });
});
