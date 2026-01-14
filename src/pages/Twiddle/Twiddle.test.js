import { describe, it, expect, vi } from 'vitest';
import { makeSolved, isSolved, rotateBlock, scramble } from './Twiddle.jsx';

describe('Twiddle - helpers', () => {
  it('makeSolved builds ordered board', () => {
    expect(makeSolved(2, 2)).toEqual([1, 2, 3, 4]);
  });

  it('isSolved detects solved/unsolved boards', () => {
    expect(isSolved([1, 2, 3])).toBe(true);
    expect(isSolved([2, 1, 3])).toBe(false);
  });

  it('rotateBlock rotates kxk subgrid correctly', () => {
    const board = [1, 2, 3, 4];
    const rotated = rotateBlock(board, 2, 2, 0, 0, 2, 'cw');
    expect(rotated).toEqual([3, 1, 4, 2]);
  });

  it('scramble returns unsolved board deterministically when mocked', () => {
    const rand = vi.spyOn(Math, 'random').mockReturnValue(0.1);
    const board = scramble(3, 3, 2, 5);
    rand.mockRestore();
    expect(isSolved(board)).toBe(false);
    expect(board.length).toBe(9);
  });
});
