import { describe, it, expect, vi } from 'vitest';
import { generateBoard, findAllValidWords, isValidPath, getWordScore, DICE_4X4 } from './WordShuffle.jsx';

describe('WordShuffle - helpers', () => {
  it('generateBoard respects size and dice', () => {
    const rand = vi.spyOn(Math, 'random').mockReturnValue(0.1);
    const board = generateBoard(4, 42);
    rand.mockRestore();
    expect(board.length).toBe(4);
    expect(DICE_4X4.length).toBe(16);
  });

  it('isValidPath enforces adjacency', () => {
    expect(isValidPath([['A']], [[0, 0]])).toBe(true);
    expect(isValidPath([['A']], [[0, 0], [2, 2]])).toBe(false);
  });

  it('getWordScore follows length rules', () => {
    expect(getWordScore('CAT')).toBe(1);
    expect(getWordScore('SEVEN')).toBe(2);
    expect(getWordScore('EIGHTH')).toBe(3);
    expect(getWordScore('EIGHTEEN')).toBe(11);
  });

  it('findAllValidWords finds words on a simple board', () => {
    const board = [
      ['C', 'A'],
      ['T', 'S'],
    ];
    const words = findAllValidWords(board);
    expect(words).toContain('CAT');
  });
});
