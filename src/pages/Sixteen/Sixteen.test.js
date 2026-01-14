import { describe, it, expect, vi } from 'vitest';
import { makeSolved, shiftRow, shiftCol, isSolved, scramble } from './Sixteen.jsx';

describe('Sixteen - helpers', () => {
  it('makeSolved builds sequential board', () => {
    const b = makeSolved(3, 3);
    expect(b[0]).toBe(1);
    expect(b[8]).toBe(9);
  });

  it('shiftRow and shiftCol wrap tiles', () => {
    const board = [1, 2, 3, 4];
    expect(shiftRow(board, 2, 2, 0, 'left')).toEqual([2, 1, 3, 4]);
    expect(shiftCol(board, 2, 2, 0, 'down')).toEqual([3, 2, 1, 4]);
  });

  it('isSolved detects solved vs unsolved', () => {
    const b = makeSolved(2, 2);
    expect(isSolved(b)).toBe(true);
    const b2 = [2, 1, 3, 4];
    expect(isSolved(b2)).toBe(false);
  });

  it('scramble uses injected rng deterministically', () => {
    const seq = [
      0.1, 0.0, 0.1, // row left, row 0
      0.9, 0.4, 0.6, // col down, col 0
      0.1, 0.9, 0.1, // row left, row 1
      0.9, 0.0, 0.4, // col up, col 0
    ];
    let idx = 0;
    const rng = () => seq[idx++ % seq.length];
    const b = scramble(2, 2, 4, { rng });
    expect(b).toEqual([4, 1, 3, 2]);
  });

  it('scramble only nudges solved boards after attempts and reports fallback', () => {
    const onFallback = vi.fn();
    const rng = () => 0.1; // always rows, always row 0 left, deterministic loop
    const b = scramble(2, 2, 2, { rng, maxAttempts: 1, onFallback });
    expect(isSolved(b)).toBe(false);
    expect(onFallback).toHaveBeenCalledTimes(1);
  });
});
