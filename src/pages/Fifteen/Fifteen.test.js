import { describe, it, expect } from 'vitest';
import {
  getArrowMoveIndex,
  makeSolved,
  isSolved,
  neighborsOfBlank,
  moveTile,
  scrambleFromSolved,
} from './Fifteen.jsx';

describe('Fifteen - keyboard movement helper', () => {
  it('returns neighbor indexes for arrow keys', () => {
    const size = 4;
    const blankIdx = 5; // row 1, col 1

    expect(getArrowMoveIndex(blankIdx, size, 'ArrowUp')).toBe(1);
    expect(getArrowMoveIndex(blankIdx, size, 'ArrowDown')).toBe(9);
    expect(getArrowMoveIndex(blankIdx, size, 'ArrowLeft')).toBe(4);
    expect(getArrowMoveIndex(blankIdx, size, 'ArrowRight')).toBe(6);
  });

  it('returns null when the blank is against a wall or key is unsupported', () => {
    expect(getArrowMoveIndex(0, 3, 'ArrowUp')).toBeNull();
    expect(getArrowMoveIndex(0, 3, 'ArrowLeft')).toBeNull();
    expect(getArrowMoveIndex(8, 3, 'ArrowRight')).toBeNull();
    expect(getArrowMoveIndex(6, 3, 'ArrowDown')).toBeNull();
    expect(getArrowMoveIndex(4, 3, 'a')).toBeNull();
  });

  it('moves the blank in the pressed arrow direction', () => {
    const size = 3;
    const board = [1, 2, 3, 4, 5, 6, 7, 0, 8]; // blank at index 7

    const target = getArrowMoveIndex(board.indexOf(0), size, 'ArrowRight');
    const next = moveTile(board, size, target);

    expect(next).not.toBeNull();
    expect(next[7]).toBe(8);
    expect(next[8]).toBe(0);
    expect(board[7]).toBe(0); // original board unchanged
  });
});

describe('Fifteen - solved state helpers', () => {
  it('creates a solved board with the blank at the end', () => {
    const solved = makeSolved(4);

    expect(solved).toHaveLength(16);
    expect(solved[15]).toBe(0);
    expect(isSolved(solved)).toBe(true);
  });

  it('detects unsolved boards', () => {
    const board = makeSolved(4).slice();
    [board[14], board[15]] = [board[15], board[14]]; // swap last tile with blank

    expect(isSolved(board)).toBe(false);
  });
});

describe('Fifteen - movement rules', () => {
  it('returns neighbor indexes for the blank', () => {
    const size = 3;
    const board = makeSolved(size);
    const blankIdx = board.indexOf(0); // bottom-right (index 8)
    const neighbors = neighborsOfBlank(blankIdx, size);

    expect(neighbors.sort()).toEqual([5, 7]);
  });

  it('moves an adjacent tile into the blank', () => {
    const size = 3;
    const board = [
      1, 2, 3,
      4, 5, 6,
      7, 0, 8,
    ];

    const next = moveTile(board, size, 8); // move tile "8" into the blank
    expect(next).toEqual([
      1, 2, 3,
      4, 5, 6,
      7, 8, 0,
    ]);
  });

  it('supports row sliding when clicking in the same row as the blank', () => {
    const size = 3;
    const board = [
      1, 2, 3,
      4, 5, 0,
      6, 7, 8,
    ];

    const next = moveTile(board, size, 3); // click tile "4" (same row as blank)
    expect(next).toEqual([
      1, 2, 3,
      0, 4, 5,
      6, 7, 8,
    ]);
  });

  it('returns null for invalid moves', () => {
    const size = 3;
    const board = [
      1, 2, 3,
      4, 5, 0,
      6, 7, 8,
    ];

    expect(moveTile(board, size, 0)).toBeNull(); // corner not in row/col of blank
  });
});

describe('Fifteen - scrambling', () => {
  it('produces a board of the right size with a single blank', () => {
    const size = 4;
    const scrambled = scrambleFromSolved(size, 50);

    expect(scrambled).toHaveLength(size * size);
    expect(scrambled.filter(v => v === 0).length).toBe(1);
  });

  it('scramble output differs from the solved state', () => {
    const size = 4;
    const solved = makeSolved(size);
    const scrambled = scrambleFromSolved(size, 30);

    expect(JSON.stringify(scrambled)).not.toBe(JSON.stringify(solved));
  });
});
