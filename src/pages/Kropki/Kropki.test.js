import { describe, it, expect, vi } from 'vitest';
import {
  GRID_SIZES,
  generateDots,
  generatePuzzle,
  checkValidity,
  checkSolved,
} from './Kropki.jsx';

describe('Kropki - metadata', () => {
  it('exposes grid sizes', () => {
    expect(Object.keys(GRID_SIZES)).toEqual(['4×4', '5×5', '6×6']);
  });
});

describe('Kropki - generation', () => {
  it('generatePuzzle returns consistent structure', () => {
    const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0); // deterministic ordering
    const puzzle = generatePuzzle(4);
    expect(puzzle.size).toBe(4);
    expect(puzzle.solution).toHaveLength(4);
    expect(puzzle.horizontalDots).toHaveLength(4);
    expect(puzzle.verticalDots).toHaveLength(3); // size-1 rows
    randomSpy.mockRestore();
  });

  it('generateDots marks white for consecutive and black for doubles', () => {
    const solution = [
      [1, 2, 4],
      [2, 4, 8],
      [3, 6, 5],
    ];
    const { horizontalDots, verticalDots } = generateDots(solution, 3);
    expect(horizontalDots[0][0]).toBe('white'); // 1-2 consecutive
    expect(horizontalDots[0][1]).toBe('black'); // 2 and 4 double
    expect(verticalDots[0][0]).toBe('white'); // 1-2 consecutive (rows 0-1, col 0)
    expect(verticalDots[0][2]).toBe('black'); // 4 and 8 double (rows 0-1, col 2)
  });
});

describe('Kropki - validation', () => {
  it('flags duplicate numbers in row/column and dot violations', () => {
    const size = 3;
    const grid = [
      [1, 1, 3], // duplicate in row
      [2, 4, 6],
      [3, 6, 5],
    ];
    const solution = [
      [1, 2, 4],
      [2, 4, 8],
      [3, 6, 5],
    ];
    const { horizontalDots, verticalDots } = generateDots(solution, size);
    const errors = checkValidity(grid, horizontalDots, verticalDots, size);
    expect(errors.size).toBeGreaterThan(0);
  });

  it('checkSolved requires exact match to solution', () => {
    const solution = [
      [1, 2],
      [2, 1],
    ];
    expect(checkSolved(solution, solution, 2)).toBe(true);
    const almost = [
      [1, 2],
      [1, 2],
    ];
    expect(checkSolved(almost, solution, 2)).toBe(false);
  });
});
