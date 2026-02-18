import { describe, expect, it } from 'vitest';
import {
  SIZE,
  getKnightNeighbors,
  generateKnightTour,
  countSolutions,
  generatePuzzle,
  findInputErrors,
  isSolved,
} from './GrandTour';

function isKnightMove(a, b) {
  const dr = Math.abs(a[0] - b[0]);
  const dc = Math.abs(a[1] - b[1]);
  return (dr === 1 && dc === 2) || (dr === 2 && dc === 1);
}

describe('GrandTour helpers', () => {
  it('generates a complete valid knight tour', () => {
    const tour = generateKnightTour(12345, SIZE);
    const positions = new Map();

    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        positions.set(tour[r][c], [r, c]);
      }
    }

    expect(positions.size).toBe(SIZE * SIZE);
    for (let n = 1; n < SIZE * SIZE; n++) {
      expect(isKnightMove(positions.get(n), positions.get(n + 1))).toBe(true);
    }
  });

  it('creates deterministic, uniquely solvable puzzles from a seed', () => {
    const first = generatePuzzle(2024, SIZE);
    const second = generatePuzzle(2024, SIZE);
    expect(second).toEqual(first);
    expect(countSolutions(first.clues, SIZE, 2)).toBe(1);
  });

  it('finds duplicate and non-knight adjacency entry errors', () => {
    const grid = Array(SIZE).fill(null).map(() => Array(SIZE).fill(0));
    grid[0][0] = 1;
    grid[0][1] = 2;
    grid[1][1] = 1;

    const errors = findInputErrors(grid, SIZE);
    expect(errors.has('0,0')).toBe(true);
    expect(errors.has('1,1')).toBe(true);
    expect(errors.has('0,1')).toBe(true);
  });

  it('validates solved grids exactly', () => {
    const solution = generateKnightTour(777, SIZE);
    expect(isSolved(solution, solution)).toBe(true);

    const modified = solution.map(row => [...row]);
    modified[0][0] = modified[0][0] === 1 ? 2 : 1;
    expect(isSolved(modified, solution)).toBe(false);
  });

  it('counts a fully specified puzzle as a unique solution', () => {
    const solution = generateKnightTour(999, SIZE);
    expect(countSolutions(solution, SIZE, 2)).toBe(1);
  });

  it('knight neighbor function stays in bounds and returns legal jumps', () => {
    const neighbors = getKnightNeighbors(0, 0, SIZE);
    expect(neighbors.length).toBeGreaterThan(0);
    neighbors.forEach(([r, c]) => {
      expect(r).toBeGreaterThanOrEqual(0);
      expect(c).toBeGreaterThanOrEqual(0);
      expect(r).toBeLessThan(SIZE);
      expect(c).toBeLessThan(SIZE);
      expect(isKnightMove([0, 0], [r, c])).toBe(true);
    });
  });
});
