import { describe, it, expect } from 'vitest';
import {
  DIFFICULTIES,
  getAvailableSizes,
  calculateVertexClue,
  getClueValue,
  checkValidity,
  checkSolved,
} from './GokigenNaname.jsx';

describe('GokigenNaname - metadata', () => {
  it('exposes expected difficulties', () => {
    expect(DIFFICULTIES).toEqual(['easy', 'medium', 'hard']);
  });
});

describe('GokigenNaname - helpers', () => {
  it('getAvailableSizes returns sorted size strings for difficulty', () => {
    const sizes = getAvailableSizes('easy');
    expect(Array.isArray(sizes)).toBe(true);
    sizes.forEach(s => expect(s).toMatch(/^\d+x\d+$/));
  });

  it('calculateVertexClue counts incident slashes correctly', () => {
    const grid = [
      ['\\', '/'],
      ['/', '\\'],
    ];
    // rows=2 cols=2, vertices range 0..2
    // Vertex (1,1) touches all four cells: TL '\', TR '/', BL '/', BR '\'
    expect(calculateVertexClue(grid, 1, 1, 2, 2)).toBe(4);
    // Corner vertex (0,0) touches only grid[0][0] '\'
    expect(calculateVertexClue(grid, 0, 0, 2, 2)).toBe(1);
  });

  it('getClueValue returns null out of bounds', () => {
    const clues = [[1, 2], [3, 4]];
    expect(getClueValue(clues, 0, 0)).toBe(1);
    expect(getClueValue(clues, 5, 0)).toBeNull();
    expect(getClueValue(clues, 0, 5)).toBeNull();
  });
});

describe('GokigenNaname - validity and solved checks', () => {
  const rows = 2;
  const cols = 2;

  it('checkValidity flags overfilled vertices', () => {
    const grid = [
      ['/', '/'],
      ['/', '/'],
    ];
    const clues = [
      [0, 0, 0],
      [0, 1, 0],
      [0, 0, 0],
    ];
    const errors = checkValidity(grid, clues, rows, cols);
    expect(errors.size).toBeGreaterThan(0);
  });

  it('checkSolved requires all cells filled and clues satisfied', () => {
    const grid = [
      ['\\', '/'],
      ['/', '\\'],
    ];
    const clues = [
      [1, 0, 1],
      [0, 4, 0],
      [1, 0, 1],
    ];
    expect(checkSolved(grid, clues, rows, cols)).toBe(true);

    const incomplete = [
      ['\\', null],
      ['/', '\\'],
    ];
    expect(checkSolved(incomplete, clues, rows, cols)).toBe(false);
  });
});
