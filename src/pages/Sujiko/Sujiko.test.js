import { describe, it, expect, vi } from 'vitest';
import {
  shuffleArray,
  calculateSums,
  generatePuzzle,
  checkValidity,
  checkSums,
} from './Sujiko.jsx';

describe('Sujiko - helpers', () => {
  it('shuffleArray returns permutation', () => {
    const rand = vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const arr = shuffleArray([1, 2, 3]);
    rand.mockRestore();
    expect(arr.sort()).toEqual([1, 2, 3]);
  });

  it('calculateSums computes 2x2 sums', () => {
    const grid = [
      [1, 2, 3],
      [4, 5, 6],
      [7, 8, 9],
    ];
    expect(calculateSums(grid)).toEqual([12, 16, 24, 28]);
  });

  it('generatePuzzle returns puzzle/solution/sums', () => {
    const rand = vi.spyOn(Math, 'random').mockReturnValue(0.1);
    const puz = generatePuzzle('easy');
    rand.mockRestore();
    expect(puz.puzzle).toHaveLength(3);
    expect(puz.solution).toHaveLength(3);
    expect(puz.sums).toHaveLength(4);
  });

  it('checkValidity flags duplicates or wrong values', () => {
    const solution = [
      [1, 2, 3],
      [4, 5, 6],
      [7, 8, 9],
    ];
    const grid = [
      [1, 2, 3],
      [4, 5, 6],
      [7, 7, 9],
    ];
    const errors = checkValidity(grid, solution);
    expect(errors.size).toBeGreaterThan(0);
  });

  it('checkSums matches target sums', () => {
    const grid = [
      [1, 2, 3],
      [4, 5, 6],
      [7, 8, 9],
    ];
    const sums = calculateSums(grid);
    expect(checkSums(grid, sums).every(Boolean)).toBe(true);
  });
});
