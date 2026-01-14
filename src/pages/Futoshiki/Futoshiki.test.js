import { describe, it, expect } from 'vitest';
import {
  GRID_SIZES,
  generatePuzzle,
  isValidPlacement,
  findErrors,
  checkSolved,
} from './Futoshiki.jsx';

describe('Futoshiki - puzzle generation', () => {
  it('generates puzzle/solution with matching dimensions and inequalities', () => {
    const size = GRID_SIZES['4×4'];
    const { puzzle, solution, horizontal, vertical } = generatePuzzle(size);

    expect(puzzle.length).toBe(size);
    expect(solution.length).toBe(size);
    puzzle.forEach(row => expect(row.length).toBe(size));
    solution.forEach(row => expect(row.length).toBe(size));

    expect(horizontal.length).toBe(size);
    horizontal.forEach(row => expect(row.length).toBe(size - 1));
    expect(vertical.length).toBe(size - 1);
    vertical.forEach(row => expect(row.length).toBe(size));
  });
});

describe('Futoshiki - placement validity', () => {
  it('rejects duplicate in row/column and respects inequalities', () => {
    const size = 4;
    const grid = [
      [2, 0, 0, 0],
      [0, 4, 0, 0],
      [0, 0, 3, 0],
      [0, 0, 0, 4],
    ];
    const horizontal = Array(size).fill(null).map(() => Array(size - 1).fill(null));
    const vertical = Array(size - 1).fill(null).map(() => Array(size).fill(null));

    // Set inequality: cell(0,0) < cell(0,1)
    horizontal[0][0] = '<';

    // Duplicate in row
    expect(isValidPlacement(grid, 0, 1, 2, horizontal, vertical, size)).toBe(false);
    // Valid distinct number but violates inequality (should be > 1)
    expect(isValidPlacement(grid, 0, 1, 1, horizontal, vertical, size)).toBe(false);
    // Satisfies inequality
    expect(isValidPlacement(grid, 0, 1, 3, horizontal, vertical, size)).toBe(true);

    // Duplicate in column
    expect(isValidPlacement(grid, 1, 0, 2, horizontal, vertical, size)).toBe(false);
  });
});

describe('Futoshiki - error detection and solved check', () => {
  it('findErrors flags duplicates and inequality violations', () => {
    const size = 4;
    const grid = [
      [1, 1, 0, 0], // duplicate 1 in row
      [0, 2, 0, 0],
      [0, 0, 3, 0],
      [0, 0, 0, 4],
    ];
    const horizontal = Array(size).fill(null).map(() => Array(size - 1).fill(null));
    const vertical = Array(size - 1).fill(null).map(() => Array(size).fill(null));
    horizontal[0][0] = '<'; // 1 < 1 violates

    const errors = findErrors(grid, horizontal, vertical, size);
    expect(errors.size).toBeGreaterThan(0);
  });

  it('checkSolved returns true when grid matches solution', () => {
    const size = GRID_SIZES['4×4'];
    const { solution } = generatePuzzle(size);
    const grid = solution.map(row => [...row]);
    expect(checkSolved(grid, solution)).toBe(true);
  });
});
