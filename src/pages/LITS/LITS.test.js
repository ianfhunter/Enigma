import { describe, it, expect } from 'vitest';
import {
  DIFFICULTY_SIZES,
  TETROMINOES,
  getTetrominoShape,
  areShadedConnected,
  has2x2Shaded,
  sameShapesTouch,
  datasetPuzzleToGameFormat,
  checkValidity,
  checkSolved,
} from './LITS.jsx';

describe('LITS - helpers', () => {
  it('exposes difficulty size ranges', () => {
    expect(Object.keys(DIFFICULTY_SIZES)).toEqual(['easy', 'medium', 'hard']);
  });

  it('recognizes tetromino shapes', () => {
    const Lshape = [[0, 0], [1, 0], [2, 0], [2, 1]];
    expect(getTetrominoShape(Lshape)).toBe('L');
    const notTetromino = [[0, 0], [1, 1], [2, 2], [3, 3]];
    expect(getTetrominoShape(notTetromino)).toBeNull();
    expect(Array.isArray(TETROMINOES.L)).toBe(true);
  });

  it('detects connectivity and 2x2 blocks', () => {
    const shaded = [
      [true, true],
      [false, true],
    ];
    expect(areShadedConnected(shaded, 2)).toBe(true);
    expect(has2x2Shaded([[true, true], [true, true]], 2)).toBe(true);
  });

  it('detects same-shaped adjacency across regions', () => {
    const shaded = [
      [true, true],
      [true, true],
    ];
    const regions = [
      [0, 0],
      [1, 1],
    ];
    const regionCells = { 0: [[0, 0], [0, 1]], 1: [[1, 0], [1, 1]] };
    expect(sameShapesTouch(shaded, regions, regionCells, 2)).toBe(true);
  });

  it('ignores adjacency when region shapes differ', () => {
    const shaded = [
      [true, true],
      [true, false],
    ];
    const regions = [
      [0, 0],
      [1, 1],
    ];
    const regionCells = { 0: [[0, 0], [0, 1]], 1: [[1, 0], [1, 1]] };
    expect(sameShapesTouch(shaded, regions, regionCells, 2)).toBe(false);
  });
});

describe('LITS - validation', () => {
  const samplePuzzle = {
    rows: 2,
    cols: 2,
    regions: [
      [0, 0],
      [1, 1],
    ],
    solution: [
      ['L', 'L'],
      ['L', 'L'],
    ],
  };

  it('datasetPuzzleToGameFormat builds regions and solution masks', () => {
    const parsed = datasetPuzzleToGameFormat(samplePuzzle);
    expect(parsed.size).toBe(2);
    expect(parsed.regions[0][0]).toBe(0);
    expect(parsed.regionCells[1]).toEqual([[1, 0], [1, 1]]);
    expect(parsed.solution[0][0]).toBe(true);
  });

  it('checkValidity reports overfilled regions and 2x2 blocks', () => {
    const shaded = [
      [true, true],
      [true, true],
    ];
    const parsed = datasetPuzzleToGameFormat(samplePuzzle);
    const { errors, violations } = checkValidity(shaded, parsed.regions, parsed.regionCells, parsed.size);
    expect(errors.size).toBeGreaterThan(0);
    expect(violations.size).toBeGreaterThan(0);
  });

  it('checkSolved requires exact tetromino placement and rules', () => {
    const parsed = datasetPuzzleToGameFormat(samplePuzzle);
    expect(checkSolved(parsed.solution, parsed.regions, parsed.regionCells, parsed.size)).toBe(false); // same shapes touch

    const altShaded = [
      [true, false],
      [true, true],
    ];
    const altRegions = [
      [0, 0],
      [1, 1],
    ];
    const altRegionCells = { 0: [[0, 0], [1, 0]], 1: [[0, 1], [1, 1]] };
    expect(checkSolved(altShaded, altRegions, altRegionCells, 2)).toBe(false);
  });
});
