import { describe, it, expect } from 'vitest';
import {
  SIZES,
  generateBoard,
  floodFill,
  checkWin,
  countFloodedCells,
} from './FloodIt.jsx';

describe('FloodIt - board generation', () => {
  it('creates a square board with allowed color indexes', () => {
    const { size } = SIZES['10×10'];
    const colorCount = 4;
    const seed = 12345;
    const board = generateBoard(size, colorCount, seed);
    expect(board.length).toBe(size);
    board.forEach(row => {
      expect(row.length).toBe(size);
      row.forEach(cell => {
        expect(cell).toBeGreaterThanOrEqual(0);
        expect(cell).toBeLessThan(colorCount);
      });
    });
  });
});

describe('FloodIt - flood fill mechanics', () => {
  it('fills connected region of the starting color', () => {
    const board = [
      [0, 0, 1],
      [0, 1, 1],
      [2, 2, 1],
    ];
    const filled = floodFill(board, 3);
    // The region at [0,0] (0s) becomes 3
    expect(filled[0][0]).toBe(3);
    expect(filled[0][1]).toBe(3);
    expect(filled[1][0]).toBe(3);
    // Other colors unchanged
    expect(filled[1][1]).toBe(1);
    expect(filled[2][0]).toBe(2);
  });

  it('no-op when new color matches current', () => {
    const board = [
      [0, 1],
      [1, 1],
    ];
    const filled = floodFill(board, 0);
    expect(filled).toEqual(board);
  });
});

describe('FloodIt - win detection and progress', () => {
  it('checkWin returns true for uniform board', () => {
    const board = [
      [2, 2],
      [2, 2],
    ];
    expect(checkWin(board)).toBe(true);
  });

  it('checkWin returns false when colors differ', () => {
    const board = [
      [2, 2],
      [2, 3],
    ];
    expect(checkWin(board)).toBe(false);
  });

  it('countFloodedCells counts the starting-color region', () => {
    const board = [
      [1, 1, 0],
      [1, 0, 0],
      [2, 2, 0],
    ];
    // Starting color is 1, region at top-left is 3 cells
    expect(countFloodedCells(board)).toBe(3);
  });
});
