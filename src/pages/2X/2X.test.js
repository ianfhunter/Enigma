import { describe, it, expect } from 'vitest';
import {
  addRandomTile,
  applyMove,
  createEmptyBoard,
  getEmptyIndices,
  getGiveUpBoard,
  getMaxTile,
  hasMoves,
  initializeBoard,
  slideAndMergeLine,
} from './2X.jsx';

const randomWithSequence = (values) => {
  let idx = 0;
  return () => {
    const value = values[idx] ?? values[values.length - 1];
    idx += 1;
    return value;
  };
};

describe('2X - board helpers', () => {
  it('creates an empty board of the right size', () => {
    const board = createEmptyBoard(4);
    expect(board).toHaveLength(16);
    expect(board.every((value) => value === 0)).toBe(true);
  });

  it('returns indices of empty cells', () => {
    const board = [2, 0, 4, 0];
    expect(getEmptyIndices(board)).toEqual([1, 3]);
  });

  it('adds a random tile to the first available cell with deterministic random', () => {
    const board = [0, 2, 0, 4];
    const random = randomWithSequence([0, 0.05]);
    const next = addRandomTile(board, random);
    expect(next[0]).toBe(4);
    expect(next.filter((value) => value !== 0)).toHaveLength(3);
  });

  it('initializes a board with the correct number of tiles', () => {
    const random = randomWithSequence([0, 0, 0.2, 0.3]);
    const board = initializeBoard(4, random);
    expect(board.filter((value) => value !== 0)).toHaveLength(2);
  });
});

describe('2X - merging logic', () => {
  it('merges matching tiles once per move', () => {
    const { line, gained } = slideAndMergeLine([2, 2, 2, 0]);
    expect(line).toEqual([4, 2, 0, 0]);
    expect(gained).toBe(4);
  });

  it('combines two pairs in a single line', () => {
    const { line, gained } = slideAndMergeLine([4, 4, 8, 8]);
    expect(line).toEqual([8, 16, 0, 0]);
    expect(gained).toBe(24);
  });
});

describe('2X - move application', () => {
  it('slides tiles left and merges appropriately', () => {
    const board = [
      2, 0, 2, 0,
      4, 4, 0, 0,
      0, 0, 0, 0,
      2, 0, 0, 2,
    ];
    const result = applyMove(board, 4, 'left');
    expect(result.board).toEqual([
      4, 0, 0, 0,
      8, 0, 0, 0,
      0, 0, 0, 0,
      4, 0, 0, 0,
    ]);
    expect(result.gained).toBe(16);
    expect(result.moved).toBe(true);
  });

  it('detects when no movement happens', () => {
    const board = [
      2, 4, 8, 16,
      32, 64, 128, 256,
      2, 4, 8, 16,
      32, 64, 128, 256,
    ];
    const result = applyMove(board, 4, 'left');
    expect(result.moved).toBe(false);
  });
});

describe('2X - end state checks', () => {
  it('detects available moves when merges exist', () => {
    const board = [
      2, 4, 8, 16,
      32, 64, 128, 256,
      512, 512, 4, 8,
      16, 32, 64, 128,
    ];
    expect(hasMoves(board, 4)).toBe(true);
  });

  it('detects no moves when board is full and no matches', () => {
    const board = [
      2, 4, 8, 16,
      32, 64, 128, 256,
      512, 1024, 4, 8,
      16, 32, 64, 128,
    ];
    expect(hasMoves(board, 4)).toBe(false);
  });

});
