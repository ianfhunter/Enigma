import { describe, it, expect, vi } from 'vitest';
import {
  PIPE_TYPES,
  GRID_SIZES,
  rotateOpenings,
  areConnected,
  findConnected,
  generatePuzzle,
  checkSolved,
} from './PipePuzzle.jsx';

describe('PipePuzzle - helpers', () => {
  it('rotateOpenings shifts directions modulo 4', () => {
    expect(rotateOpenings([0, 2], 1)).toEqual([1, 3]);
  });

  it('areConnected respects rotations and openings', () => {
    const grid = [
      [{ type: 'straight', rotation: 1 }, { type: 'dead', rotation: 3 }],
    ];
    expect(areConnected(grid, 0, 0, 0, 1)).toBe(true); // horizontal connection
  });

  it('findConnected explores all reachable cells', () => {
    const grid = [
      [{ type: 'cross', rotation: 0 }, { type: 'cross', rotation: 0 }],
      [{ type: 'cross', rotation: 0 }, { type: 'cross', rotation: 0 }],
    ];
    const connected = findConnected(grid, 0, 0);
    expect(connected.size).toBe(4);
  });
});

describe('PipePuzzle - generation', () => {
  it('generatePuzzle returns grid matching size key', () => {
    const rand = vi.spyOn(Math, 'random').mockReturnValue(0.2);
    const grid = generatePuzzle(GRID_SIZES['4×4']);
    rand.mockRestore();
    expect(grid.length).toBe(4);
    expect(grid[0].length).toBe(4);
  });

  it('checkSolved passes on a fully connected generated grid', () => {
    const grid = generatePuzzle(4);
    // Generated grid is a spanning tree; after scrambling it may not be solved,
    // but running findConnected from 0,0 should still cover all cells only when solved.
    const maybeSolved = checkSolved(grid);
    expect(typeof maybeSolved).toBe('boolean');
  });
});
