import { describe, it, expect } from 'vitest';
import { makeEnglishBoard, inBounds, movesFrom } from './Pegs.jsx';

describe('Pegs - helpers', () => {
  it('makes English board with center empty and corners invalid', () => {
    const board = makeEnglishBoard();
    expect(board[3][3]).toBe(0);
    expect(board[0][0]).toBe(-1);
    expect(board[2][3]).toBe(1);
  });

  it('inBounds enforces 7x7 board', () => {
    expect(inBounds(0, 0)).toBe(true);
    expect(inBounds(7, 0)).toBe(false);
  });

  it('movesFrom returns legal jump targets', () => {
    const board = makeEnglishBoard();
    // Move from (3,1) should be able to jump to (3,3) initially
    board[3][2] = 1;
    board[3][3] = 0;
    const moves = movesFrom(board, 3, 1);
    expect(moves).toContainEqual([3, 3]);
  });
});
