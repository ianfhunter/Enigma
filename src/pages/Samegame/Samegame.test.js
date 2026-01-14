import { describe, it, expect, vi } from 'vitest';
import {
  PALETTE,
  makeGrid,
  inBounds,
  flood,
  applyGravity,
  anyMoves,
} from './Samegame.jsx';

describe('Samegame - helpers', () => {
  it('makeGrid creates grid with requested dimensions/colors', () => {
    const grid = makeGrid(3, 2, 2);
    expect(grid).toHaveLength(2);
    expect(grid[0]).toHaveLength(3);
    grid.flat().forEach(v => expect(v).toBeLessThan(2));
    expect(PALETTE.length).toBeGreaterThan(0);
  });

  it('inBounds respects width/height', () => {
    expect(inBounds(0, 0, 2, 2)).toBe(true);
    expect(inBounds(2, 0, 2, 2)).toBe(false);
  });

  it('flood finds connected same-color group', () => {
    const grid = [
      [1, 1],
      [0, 1],
    ];
    const group = flood(grid, 0, 0);
    expect(group.length).toBe(3);
  });

  it('applyGravity drops tiles and compacts columns', () => {
    const grid = [
      [1, null],
      [1, null],
    ];
    const next = applyGravity(grid);
    expect(next[1][0]).toBe(1);
  });

  it('anyMoves detects if removable groups exist', () => {
    const grid = [
      [1, 2],
      [3, 4],
    ];
    expect(anyMoves(grid)).toBe(false);
    const grid2 = [
      [1, 1],
      [2, 3],
    ];
    expect(anyMoves(grid2)).toBe(true);
  });
});
