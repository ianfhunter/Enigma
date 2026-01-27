import { describe, it, expect, vi } from 'vitest';
import {
  GRID_SIZES,
  ARROWS,
  ARROW_DELTAS,
  generatePuzzle,
  checkValidity,
  checkSolved,
} from './Shinro.jsx';

describe('Shinro - metadata', () => {
  it('exposes grid sizes and arrow symbols', () => {
    expect(Object.keys(GRID_SIZES)).toEqual(['6×6', '8×8', '10×10']);
    expect(ARROWS.N).toBe('↑');
    expect(ARROW_DELTAS.S).toEqual([1, 0]);
  });
});

describe('Shinro - generation and validation', () => {
  it('generatePuzzle builds counts consistent with gems', () => {
    const seed = 12345;
    const puz = generatePuzzle(6, seed);
    const gemCount = puz.gems.size;
    expect(puz.rowCounts.reduce((a, b) => a + b, 0)).toBe(gemCount);
    expect(puz.colCounts.reduce((a, b) => a + b, 0)).toBe(gemCount);
  });

  it('checkValidity flags over-count rows/cols and gem-on-arrow', () => {
    const size = 2;
    const grid = [
      [null, 'N'],
      [null, null],
    ];
    const rowCounts = [0, 0];
    const colCounts = [0, 0];
    const playerGems = new Set(['0,1']); // gem on arrow
    const errors = checkValidity(playerGems, grid, rowCounts, colCounts, size);
    expect(errors.has('0,1')).toBe(true);
  });

  it('checkSolved requires exact gem match', () => {
    const gems = new Set(['0,0']);
    const rowCounts = [1];
    const colCounts = [1];
    const grid = [[null]];
    expect(checkSolved(new Set(['0,0']), gems, rowCounts, colCounts, grid, 1)).toBe(true);
    expect(checkSolved(new Set(), gems, rowCounts, colCounts, grid, 1)).toBe(false);
  });
});
