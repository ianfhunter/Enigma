import { describe, it, expect } from 'vitest';
import {
  GRID_SIZES,
  DIFFICULTIES,
  checkValidity,
  checkSolved,
} from './Norinori.jsx';

describe('Norinori - metadata', () => {
  it('exposes grid sizes and difficulties', () => {
    expect(Object.keys(GRID_SIZES)).toEqual(['6×6', '8×8', '10×10', '12×12']);
    expect(DIFFICULTIES).toEqual(['Easy', 'Medium', 'Hard']);
  });
});

describe('Norinori - validation', () => {
  it('flags cells not forming domino pairs', () => {
    const grid = [
      [true, false],
      [false, false],
    ];
    const regions = [
      [0, 0],
      [1, 1],
    ];
    const errors = checkValidity(grid, regions);
    expect(errors.size).toBeGreaterThan(0);
  });

  it('flags regions with too many shaded cells', () => {
    const grid = [
      [true, true],
      [false, false],
    ];
    const regions = [
      [0, 0],
      [1, 1],
    ];
    const errors = checkValidity(grid, regions);
    expect(errors.size).toBeGreaterThan(0);
  });

  it('flags regions with too few shaded cells', () => {
    const grid = [
      [false, false],
      [false, false],
    ];
    const regions = [
      [0, 0],
      [0, 0],
    ];
    const errors = checkValidity(grid, regions);
    expect(errors.size).toBeGreaterThan(0);
  });

  it('checkSolved requires exact match', () => {
    const sol = [
      [true, false],
      [true, false],
    ];
    expect(checkSolved(sol, sol)).toBe(true);
    const wrong = [
      [true, false],
      [false, true],
    ];
    expect(checkSolved(wrong, sol)).toBe(false);
  });
});
