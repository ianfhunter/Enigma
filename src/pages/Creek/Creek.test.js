import { describe, it, expect } from 'vitest';
import {
  GRID_SIZES,
  generateSolution,
  generateClues,
  generatePuzzle,
  areWhiteCellsConnected,
  areWhiteCellsConnectedPartial,
  checkValidity,
  checkSolved,
} from './Creek.jsx';

describe('Creek - generation basics', () => {
  it('generates a solution with correct dimensions and boolean entries', () => {
    const size = GRID_SIZES['5×5'];
    const sol = generateSolution(size);
    expect(sol.length).toBe(size);
    sol.forEach(row => {
      expect(row.length).toBe(size);
      row.forEach(cell => expect(typeof cell).toBe('boolean'));
    });
  });

  it('clues matrix matches size+1 and contains numbers/null', () => {
    const size = GRID_SIZES['5×5'];
    const sol = generateSolution(size);
    const clues = generateClues(sol, size);
    expect(clues.length).toBe(size + 1);
    clues.forEach(row => {
      expect(row.length).toBe(size + 1);
      row.forEach(cell => {
        expect(cell === null || Number.isInteger(cell)).toBe(true);
      });
    });
  });

  it('generatePuzzle returns consistent sizes', () => {
    const { solution, clues, size } = generatePuzzle(GRID_SIZES['5×5']);
    expect(solution.length).toBe(size);
    expect(clues.length).toBe(size + 1);
  });
});

describe('Creek - connectivity helpers', () => {
  it('all-white grid is connected', () => {
    const size = GRID_SIZES['5×5'];
    const grid = Array.from({ length: size }, () => Array(size).fill(false));
    expect(areWhiteCellsConnected(grid, size)).toBe(true);
  });

  it('disconnected whites return false', () => {
    const size = 5;
    const grid = Array.from({ length: size }, () => Array(size).fill(true));
    grid[0][0] = false;
    grid[4][4] = false; // isolated
    expect(areWhiteCellsConnected(grid, size)).toBe(false);
  });

  it('partial connectivity allows unknown cells (null) as passable', () => {
    const size = 3;
    const grid = [
      [false, null, true],
      [true, null, true],
      [true, null, false],
    ];
    expect(areWhiteCellsConnectedPartial(grid, size)).toBe(true);
  });
});

describe('Creek - validity and solved checks', () => {
  it('checkValidity flags over-satisfied clues', () => {
    const size = 2;
    const grid = [
      [true, false],
      [false, false],
    ];
    // Clue at vertex (1,1) touches all four cells; expect error on the shaded cell
    const clues = [
      [null, null, null],
      [null, 0, null],
      [null, null, null],
    ];
    const errors = checkValidity(grid, clues, size);
    expect(errors.has('0,0')).toBe(true);
    expect(errors.size).toBe(1);
  });

  it('checkSolved returns true when grid matches solution', () => {
    const size = GRID_SIZES['5×5'];
    const { solution } = generatePuzzle(size);
    const grid = solution.map(row => [...row]);
    expect(checkSolved(grid, solution, size)).toBe(true);
  });
});
