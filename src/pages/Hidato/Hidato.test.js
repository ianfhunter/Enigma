import { describe, it, expect } from 'vitest';
import {
  DIFFICULTIES,
  getAvailableSizes,
  getNeighbors,
  checkSolved,
  findErrors,
} from './Hidato.jsx';

describe('Hidato - metadata', () => {
  it('exposes expected difficulties', () => {
    expect(DIFFICULTIES).toEqual(['easy', 'medium', 'hard']);
  });

  it('lists available sizes per difficulty', () => {
    const sizes = getAvailableSizes('easy');
    expect(Array.isArray(sizes)).toBe(true);
    sizes.forEach(s => expect(s).toMatch(/^\d+×\d+$/));
  });
});

describe('Hidato - neighbor logic', () => {
  it('returns up to 8 neighbors within bounds', () => {
    const n = getNeighbors(1, 1, 3);
    expect(n).toContainEqual([0, 0]);
    expect(n).toContainEqual([2, 2]);
    expect(n.length).toBe(8);

    const corner = getNeighbors(0, 0, 3);
    expect(corner.length).toBeLessThanOrEqual(3);
    corner.forEach(([r, c]) => {
      expect(r).toBeGreaterThanOrEqual(0);
      expect(c).toBeGreaterThanOrEqual(0);
      expect(r).toBeLessThan(3);
      expect(c).toBeLessThan(3);
    });
  });
});

describe('Hidato - solved and error checks', () => {
  it('checkSolved requires all given numbers to match solution', () => {
    const solution = [
      [1, 2],
      [3, 4],
    ];
    const gridGood = [
      [1, 2],
      [3, 4],
    ];
    const gridBad = [
      [1, 2],
      [3, 0],
    ];
    expect(checkSolved(gridGood, solution)).toBe(true);
    expect(checkSolved(gridBad, solution)).toBe(false);
  });

  it('findErrors flags duplicates and non-adjacent consecutive numbers', () => {
    const grid = [
      [1, 2],
      [2, 4], // duplicate 2
    ];
    const errors = findErrors(grid, 4);
    expect(errors.size).toBeGreaterThan(0);

    const gridAdj = [
      [1, 0],
      [0, 2],
    ];
    const errorsAdj = findErrors(gridAdj, 2);
    expect(errorsAdj.size).toBe(0); // 1 and 2 adjacent diagonally

    const gridNotAdj = [
      [1, 0],
      [0, 0],
      [0, 2],
    ];
    const errorsNotAdj = findErrors(gridNotAdj, 2);
    expect(errorsNotAdj.size).toBeGreaterThan(0);
  });
});
