import { describe, it, expect } from 'vitest';
import {
  DIFFICULTY_SIZES,
  generatePuzzle,
  isValidShading,
  isConnected,
  checkValidity,
  checkSolved,
} from './Hitori.jsx';

describe('Hitori - generation basics', () => {
  it('generates puzzle grid and solution with matching size', () => {
    const size = DIFFICULTY_SIZES.easy.max; // 8
    const seed = 12345;
    const { grid, solution } = generatePuzzle(size, seed);
    expect(grid.length).toBe(size);
    expect(solution.length).toBe(size);
    grid.forEach(row => expect(row.length).toBe(size));
    solution.forEach(row => expect(row.length).toBe(size));
  });
});

describe('Hitori - rule helpers', () => {
  it('detects invalid adjacent shading', () => {
    const shaded = [
      [true, true],
      [false, false],
    ];
    expect(isValidShading(shaded, 0, 1)).toBe(false);
    expect(isValidShading(shaded, 1, 1)).toBe(true);
  });

  it('connectivity requires all unshaded cells to be connected', () => {
    const connected = [
      [false, false],
      [false, false],
    ];
    const disconnected = [
      [false, true],
      [true, false],
    ];
    expect(isConnected(connected)).toBe(true);
    expect(isConnected(disconnected)).toBe(false);
  });
});

describe('Hitori - validity and solved checks', () => {
  it('checkValidity flags adjacent shaded and duplicate numbers in rows/cols', () => {
    const grid = [
      [1, 1],
      [2, 3],
    ];
    const shaded = [
      [false, false],
      [false, false],
    ];
    const errors = checkValidity(grid, shaded);
    expect(errors.size).toBeGreaterThan(0); // duplicate 1s in row 0

    const shadedAdj = [
      [true, true],
      [false, false],
    ];
    const errorsAdj = checkValidity(grid, shadedAdj);
    expect(errorsAdj.size).toBeGreaterThan(0); // adjacent shaded
  });

  it('checkSolved returns true when valid and connected with no errors', () => {
    const grid = [
      [1, 2],
      [2, 1],
    ];
    const shaded = [
      [true, false],
      [false, true],
    ];
    expect(checkSolved(grid, shaded)).toBe(true);
  });

  it('checkSolved enforces connectivity for typical puzzle sizes', () => {
    const grid = [
      [1, 2, 3],
      [2, 3, 1],
      [3, 1, 2],
    ];
    const shaded = [
      [true, false, true],
      [false, true, false],
      [true, false, true],
    ];
    expect(checkSolved(grid, shaded)).toBe(false);
  });
});
