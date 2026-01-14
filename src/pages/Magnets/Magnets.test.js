import { describe, it, expect, vi } from 'vitest';
import {
  rcToIdx,
  idxToRC,
  inBounds,
  generateDominoTiling,
  generateRegularTiling,
  generatePuzzle,
  SIZES,
  DIFFICULTIES,
  analyze,
} from './Magnets.jsx';

describe('Magnets - helpers', () => {
  it('index conversions round-trip', () => {
    const w = 5;
    expect(idxToRC(rcToIdx(2, 3, w), w)).toEqual({ r: 2, c: 3 });
  });

  it('inBounds respects dimensions', () => {
    expect(inBounds(0, 0, 2, 2)).toBe(true);
    expect(inBounds(2, 0, 2, 2)).toBe(false);
  });

  it('exposes sizes and difficulties', () => {
    expect(SIZES).toEqual([4, 6, 8]);
    expect(DIFFICULTIES).toEqual(['easy', 'medium', 'hard']);
  });
});

describe('Magnets - generation', () => {
  it('generateRegularTiling covers grid with dominoes', () => {
    const dominoes = generateRegularTiling(4, 4);
    const cells = new Set(dominoes.flat());
    expect(dominoes.length * 2).toBe(16);
    expect(cells.size).toBe(16);
  });

  it('generateDominoTiling falls back to regular when needed', () => {
    const rand = vi.spyOn(Math, 'random').mockReturnValue(0); // deterministic shuffle
    const dominoes = generateDominoTiling(4, 4);
    rand.mockRestore();
    const cells = new Set(dominoes.flat());
    expect(cells.size).toBe(16);
  });

  it('generatePuzzle produces clues and solution consistent with size', () => {
    const rand = vi.spyOn(Math, 'random').mockReturnValue(0.1);
    const puz = generatePuzzle(4, 'easy');
    rand.mockRestore();
    expect(puz.w).toBe(4);
    expect(puz.h).toBe(4);
    expect(puz.rowPlus).toHaveLength(4);
    expect(puz.colMinus).toHaveLength(4);
    expect(puz.solution).toHaveLength(puz.dominoes.length);
  });
});

describe('Magnets - analysis', () => {
  it('detects solved state when clues match and no conflicts', () => {
    // Simple 2x2 with one domino horizontal and one vertical
    const puz = {
      w: 2,
      h: 2,
      dominoes: [
        [0, 1], // top row
        [2, 3], // bottom row
      ],
      rowPlus: [1, 1],
      rowMinus: [1, 1],
      colPlus: [1, 1],
      colMinus: [1, 1],
    };
    const state = [1, 2]; // (+-) top, (-+) bottom
    const res = analyze(puz, state);
    expect(res.solved).toBe(true);
    expect(res.bad.size).toBe(0);
  });

  it('marks conflicts when adjacent poles match even if counts fit', () => {
    // 1x4 grid: two vertical dominoes stacked. Middle cells both - after placement.
    const puz = {
      w: 1,
      h: 4,
      dominoes: [
        [0, 1],
        [2, 3],
      ],
      rowPlus: [1, 0, 0, 1],
      rowMinus: [0, 1, 1, 0],
      colPlus: [2],
      colMinus: [2],
    };
    const state = [1, 2]; // (+-) then (-+); cells 1 and 2 both - and touch
    const res = analyze(puz, state);
    expect(res.countsOk).toBe(true);
    expect(res.bad.has(1)).toBe(true);
    expect(res.bad.has(2)).toBe(true);
    expect(res.solved).toBe(false);
  });
});
