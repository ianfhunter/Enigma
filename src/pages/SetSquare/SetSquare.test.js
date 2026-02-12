import { describe, it, expect } from 'vitest';
import {
  evaluateExpressionLeftToRight,
  countSolutions,
  generateSetSquarePuzzle,
  isSolved,
} from './SetSquare.utils';

describe('Set Square helpers', () => {
  it('evaluates expressions in strict left-to-right order', () => {
    const result = evaluateExpressionLeftToRight([8, 2, 3], ['+', '*']);
    expect(result).toBe(30);
  });

  it('returns null for non-integer division in an expression', () => {
    const result = evaluateExpressionLeftToRight([5, 2, 3], ['/', '+']);
    expect(result).toBeNull();
  });

  it('returns zero solutions for contradictory clues', () => {
    const puzzleGrid = [
      [1, 2, 3],
      [4, 5, 6],
      [7, 8, 9],
    ];
    const rowEquations = [
      { operations: ['+', '+'], target: 6 },
      { operations: ['+', '+'], target: 15 },
      { operations: ['+', '+'], target: 999 },
    ];
    const colEquations = [
      { operations: ['+', '+'], target: 12 },
      { operations: ['+', '+'], target: 15 },
      { operations: ['+', '+'], target: 18 },
    ];

    const solutions = countSolutions({ puzzleGrid, rowEquations, colEquations, maxSolutions: 3 });
    expect(solutions).toBe(0);
  });

  it('generates deterministic puzzles for the same seed and difficulty', () => {
    const one = generateSetSquarePuzzle(123456, 'medium');
    const two = generateSetSquarePuzzle(123456, 'medium');

    expect(one).toEqual(two);
  });

  it('generated puzzle has exactly one solution', () => {
    const puzzle = generateSetSquarePuzzle(987654, 'hard');
    expect(puzzle).toBeTruthy();

    const solutions = countSolutions({
      puzzleGrid: puzzle.puzzleGrid,
      rowEquations: puzzle.rowEquations,
      colEquations: puzzle.colEquations,
      maxSolutions: 2,
    });
    expect(solutions).toBe(1);
  });

  it('isSolved distinguishes solved and unsolved grids', () => {
    const solution = [
      [1, 2, 3],
      [4, 5, 6],
      [7, 8, 9],
    ];

    expect(isSolved(solution, solution)).toBe(true);
    expect(isSolved([
      [1, 2, 3],
      [4, 0, 6],
      [7, 8, 9],
    ], solution)).toBe(false);
  });
});
