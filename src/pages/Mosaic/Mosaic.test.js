import { describe, it, expect } from 'vitest';
import mosaicPuzzles from '../../../public/datasets/mosaicPuzzles.json';
import {
  idx,
  inBounds,
  neighbors3x3,
  cycleCell,
  getAvailableSizes,
  parseDatasetPuzzle,
} from './Mosaic.jsx';

describe('Mosaic - helpers', () => {
  it('idx/inBounds operate on width/height', () => {
    expect(idx(1, 2, 5)).toBe(7);
    expect(inBounds(0, 0, 2, 2)).toBe(true);
    expect(inBounds(2, 0, 2, 2)).toBe(false);
  });

  it('neighbors3x3 returns up to 9 cells inside bounds', () => {
    const nbrs = neighbors3x3(0, 0, 2, 2);
    expect(nbrs).toContainEqual([0, 0]);
    expect(nbrs.some(([r, c]) => r === -1 || c === -1)).toBe(false);
  });

  it('cycleCell cycles states based on button', () => {
    expect(cycleCell(null, 'left')).toBe(1);
    expect(cycleCell(1, 'left')).toBe(0);
    expect(cycleCell(0, 'left')).toBeNull();
    expect(cycleCell(null, 'right')).toBe(0);
  });

  it('getAvailableSizes lists dataset sizes sorted', () => {
    const sizes = getAvailableSizes();
    const sorted = [...sizes].sort((a, b) => {
      const [aw, ah] = a.split('x').map(Number);
      const [bw, bh] = b.split('x').map(Number);
      return aw * ah - bw * bh;
    });
    expect(sizes).toEqual(sorted);
  });
});

describe('Mosaic - dataset parsing', () => {
  it('parseDatasetPuzzle flattens clues and solution', () => {
    const puzzle = {
      rows: 2,
      cols: 2,
      clues: [
        [1, null],
        [2, 3],
      ],
      solution: [
        ['x', null],
        [null, 'x'],
      ],
    };
    const parsed = parseDatasetPuzzle(puzzle);
    expect(parsed.w).toBe(2);
    expect(parsed.h).toBe(2);
    expect(parsed.clues).toEqual([1, null, 2, 3]);
    expect(parsed.solution).toEqual([1, 0, 0, 1]);
  });

  it('dataset has puzzles and sizes are covered', () => {
    expect(mosaicPuzzles.puzzles.length).toBeGreaterThan(0);
    const sizes = new Set(getAvailableSizes());
    mosaicPuzzles.puzzles.forEach(p => {
      expect(sizes.has(`${p.cols}x${p.rows}`)).toBe(true);
    });
  });
});
