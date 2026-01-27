import { describe, it, expect } from 'vitest';
import {
  isValidPlacement,
  getAttackingPairs,
  getAttackedSquares,
  generatePuzzle,
  DIFFICULTIES,
} from './NQueens.jsx';

describe('NQueens - helpers', () => {
  it('valid placement rejects row/col/diagonal conflicts', () => {
    // Choose non-conflicting existing queens so we can verify both invalid and valid spots
    const queens = [[0, 0], [2, 3]];
    expect(isValidPlacement(queens, 0, 1)).toBe(false); // same row
    expect(isValidPlacement(queens, 1, 0)).toBe(false); // same col
    expect(isValidPlacement(queens, 1, 1)).toBe(false); // diagonal
    expect(isValidPlacement(queens, 3, 1)).toBe(true);
  });

  it('getAttackingPairs finds conflicts', () => {
    const queens = [[0, 0], [0, 2], [1, 1]];
    const attacks = getAttackingPairs(queens);
    expect(attacks.length).toBeGreaterThan(0);
  });

  it('getAttackedSquares marks rows/cols/diagonals', () => {
    const attacked = getAttackedSquares([[0, 0]], 3);
    expect(attacked.has('0-2')).toBe(true); // same row
    expect(attacked.has('2-2')).toBe(true); // diagonal
  });

  it('generatePuzzle produces solvable placement with preplaced queens', () => {
    const { size, preplaced } = DIFFICULTIES.easy;
    const seed = 12345;
    const { solution, preplaced: pre } = generatePuzzle(size, preplaced, seed);
    expect(solution).toHaveLength(size);
    expect(pre.length).toBe(preplaced);
    // All queens should be non-conflicting
    expect(getAttackingPairs(solution).length).toBe(0);
  });
});
