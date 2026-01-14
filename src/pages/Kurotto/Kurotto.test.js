import { describe, it, expect } from 'vitest';
import kurottoPuzzles from '../../../public/datasets/kurottoPuzzles.json';
import {
  DIFFICULTIES,
  getAvailableSizes,
  parseDatasetPuzzle,
  calculateClueValue,
  checkValidity,
  checkSolved,
} from './Kurotto.jsx';

describe('Kurotto - metadata', () => {
  it('exposes difficulties', () => {
    expect(DIFFICULTIES).toEqual(['easy', 'medium', 'hard']);
  });

  it('getAvailableSizes returns sorted unique sizes per difficulty', () => {
    const sizes = getAvailableSizes('easy');
    const sorted = [...sizes].sort((a, b) => {
      const [ar, ac] = a.split('x').map(Number);
      const [br, bc] = b.split('x').map(Number);
      return ar * ac - br * bc;
    });
    expect(sizes).toEqual(sorted);
  });
});

describe('Kurotto - parsing and validation', () => {
  it('parseDatasetPuzzle converts x to shaded booleans', () => {
    const puzzle = {
      rows: 2,
      cols: 2,
      clues: [
        [null, 1],
        [2, null],
      ],
      solution: [
        ['x', '.'],
        ['.', 'x'],
      ],
    };
    const parsed = parseDatasetPuzzle(puzzle);
    expect(parsed.solution).toEqual([
      [true, false],
      [false, true],
    ]);
    expect(parsed.clues).toEqual(puzzle.clues);
  });

  it('calculateClueValue sums distinct adjacent shaded groups', () => {
    const sol = [
      [false, true, true],
      [false, false, true],
      [true, false, false],
    ];
    // Cell (1,1) touches two groups: size 2 (top) and size 1 (bottom)
    expect(calculateClueValue(sol, 1, 1, 3)).toBe(3);
  });

  it('checkValidity flags shaded clue cells and sum overages', () => {
    const clues = [
      [null, 2],
      [1, null],
    ];
    const grid = [
      [true, true], // clue at (0,1) shaded -> error
      [false, null],
    ];
    const errors = checkValidity(grid, clues, 2);
    expect(errors.has('0,1')).toBe(true);
  });

  it('checkSolved matches boolean shading to solution', () => {
    const solution = [
      [true, false],
      [false, true],
    ];
    expect(checkSolved(solution, solution, 2)).toBe(true);
    const wrong = [
      [false, false],
      [false, true],
    ];
    expect(checkSolved(wrong, solution, 2)).toBe(false);
  });
});

describe('Kurotto - dataset sanity', () => {
  it('dataset has puzzles for each difficulty', () => {
    DIFFICULTIES.forEach(diff => {
      const subset = kurottoPuzzles.puzzles.filter(p => p.difficulty === diff);
      expect(subset.length).toBeGreaterThan(0);
    });
  });
});
