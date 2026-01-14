import { describe, it, expect } from 'vitest';
import {
  DIFFICULTIES,
  getAvailableSizes,
  parseDatasetPuzzle,
  checkValidity,
  checkSolved,
} from './Takuzu.jsx';

describe('Takuzu - helpers', () => {
  it('exposes difficulties and sizes', () => {
    expect(DIFFICULTIES).toEqual(['easy', 'medium', 'hard']);
    expect(getAvailableSizes('easy')).toBeInstanceOf(Array);
  });

  it('parseDatasetPuzzle converts 1/2 to 0/1', () => {
    const puzzle = {
      rows: 2,
      cols: 2,
      clues: [[1, 2], [null, null]],
      solution: [[1, 2], [2, 1]],
    };
    const parsed = parseDatasetPuzzle(puzzle);
    expect(parsed.puzzle[0][0]).toBe(0);
    expect(parsed.solution[1][0]).toBe(1);
  });

  it('checkValidity flags three-in-a-row', () => {
    const grid = [
      [0, 0, 0],
      [null, null, null],
      [null, null, null],
    ];
    const errors = checkValidity(grid);
    expect(errors.size).toBeGreaterThan(0);
  });

  it('checkSolved compares to solution', () => {
    const grid = [[0, 1], [1, 0]];
    expect(checkSolved(grid, grid)).toBe(true);
  });
});
