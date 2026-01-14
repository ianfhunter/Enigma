import { describe, it, expect } from 'vitest';
import {
  DIFFICULTIES,
  getAvailableSizes,
  parseDatasetPuzzle,
  isColorConnected,
  has2x2Square,
  checkValidity,
  checkSolved,
} from './YinYang.jsx';

describe('YinYang - helpers', () => {
  it('exposes difficulties and sizes', () => {
    expect(DIFFICULTIES).toContain('easy');
    expect(Array.isArray(getAvailableSizes('easy'))).toBe(true);
  });

  it('parseDatasetPuzzle converts symbols', () => {
    const parsed = parseDatasetPuzzle({
      rows: 2,
      cols: 2,
      clues: [['w', 'b'], [null, null]],
      solution: [['w', 'b'], ['b', 'w']],
    });
    expect(parsed.puzzle[0][0]).toBe(false);
    expect(parsed.solution[0][1]).toBe(true);
  });

  it('connectivity and 2x2 checks work', () => {
    const grid = [
      [true, false],
      [true, false],
    ];
    expect(isColorConnected(grid, 2, true)).toBe(true);
    expect(has2x2Square(grid, 2, true)).toBeNull();
  });

  it('checkValidity flags 2x2 blocks and connectivity', () => {
    const grid = [
      [true, true],
      [true, true],
    ];
    const errors = checkValidity(grid, 2);
    expect(errors.size).toBeGreaterThan(0);
  });

  it('checkSolved compares to solution', () => {
    const solution = [
      [true, false],
      [false, true],
    ];
    expect(checkSolved(solution, solution, 2)).toBe(true);
  });
});
