import { describe, it, expect } from 'vitest';
import {
  DIFFICULTIES,
  selectPuzzle,
  convertPuzzle,
  areWhiteCellsConnected,
  checkValidity,
  checkSolved,
} from './Creek.jsx';

// Mock puzzle data for testing
const mockDatasetPuzzle = {
  id: 'test_5x5',
  rows: 5,
  cols: 5,
  difficulty: 'easy',
  clues: [
    [null, 1, null, 2, null, null],
    [null, null, 2, null, null, 1],
    [1, null, null, null, 2, null],
    [null, 2, null, null, null, null],
    [null, null, 1, null, 2, null],
    [null, null, null, null, null, null],
  ],
  solution: [
    [null, 'x', null, 'x', null],
    ['x', null, 'x', null, null],
    [null, null, null, 'x', null],
    [null, 'x', null, null, 'x'],
    [null, null, null, 'x', null],
  ],
};

describe('Creek - dataset conversion', () => {
  it('convertPuzzle transforms dataset format to game format', () => {
    const converted = convertPuzzle(mockDatasetPuzzle);

    expect(converted.rows).toBe(5);
    expect(converted.cols).toBe(5);
    expect(converted.id).toBe('test_5x5');
    expect(converted.difficulty).toBe('easy');

    // Check solution conversion: "x" -> true, null -> false
    expect(converted.solution[0][0]).toBe(false); // null -> false
    expect(converted.solution[0][1]).toBe(true);  // "x" -> true
    expect(converted.solution[1][0]).toBe(true);  // "x" -> true
    expect(converted.solution[1][1]).toBe(false); // null -> false
  });

  it('clues are preserved as-is', () => {
    const converted = convertPuzzle(mockDatasetPuzzle);
    expect(converted.clues).toEqual(mockDatasetPuzzle.clues);
  });
});

describe('Creek - puzzle selection', () => {
  it('selectPuzzle filters by difficulty', () => {
    const puzzles = [
      { id: '1', difficulty: 'easy' },
      { id: '2', difficulty: 'medium' },
      { id: '3', difficulty: 'easy' },
      { id: '4', difficulty: 'hard' },
    ];

    // With a fixed seed, should consistently select from filtered set
    const selected = selectPuzzle(puzzles, 'easy', 12345);
    expect(['easy']).toContain(selected.difficulty);
  });

  it('selectPuzzle falls back to any puzzle if no matching difficulty', () => {
    const puzzles = [
      { id: '1', difficulty: 'hard' },
      { id: '2', difficulty: 'hard' },
    ];

    const selected = selectPuzzle(puzzles, 'easy', 12345);
    expect(selected).toBeDefined();
  });
});

describe('Creek - connectivity', () => {
  it('all-white grid is connected', () => {
    const rows = 5, cols = 5;
    const grid = Array.from({ length: rows }, () => Array(cols).fill(false));
    expect(areWhiteCellsConnected(grid, rows, cols)).toBe(true);
  });

  it('disconnected whites return false', () => {
    const rows = 5, cols = 5;
    const grid = Array.from({ length: rows }, () => Array(cols).fill(true));
    grid[0][0] = false;
    grid[4][4] = false; // isolated
    expect(areWhiteCellsConnected(grid, rows, cols)).toBe(false);
  });

  it('connectivity allows traversing through null cells', () => {
    const rows = 3, cols = 3;
    const grid = [
      [false, null, true],
      [true, null, true],
      [true, null, false],
    ];
    // White cells at (0,0) and (2,2) can connect through null cells in column 1
    expect(areWhiteCellsConnected(grid, rows, cols)).toBe(true);
  });
});

describe('Creek - validity and solved checks', () => {
  it('checkValidity flags over-satisfied clues', () => {
    const rows = 2, cols = 2;
    const grid = [
      [true, false],
      [false, false],
    ];
    // Clue at vertex (1,1) touches all four cells; expect error on the shaded cell
    const clues = [
      [null, null, null],
      [null, 0, null],
      [null, null, null],
    ];
    const errors = checkValidity(grid, clues, rows, cols);
    expect(errors.has('0,0')).toBe(true);
    expect(errors.size).toBe(1);
  });

  it('checkSolved returns true when grid matches solution', () => {
    const converted = convertPuzzle(mockDatasetPuzzle);
    const grid = converted.solution.map(row => [...row]);
    expect(checkSolved(grid, converted.solution, converted.rows, converted.cols)).toBe(true);
  });

  it('checkSolved returns false when grid differs from solution', () => {
    const converted = convertPuzzle(mockDatasetPuzzle);
    const grid = converted.solution.map(row => [...row]);
    grid[0][0] = !grid[0][0]; // Flip one cell
    expect(checkSolved(grid, converted.solution, converted.rows, converted.cols)).toBe(false);
  });
});

describe('Creek - constants', () => {
  it('DIFFICULTIES contains expected values', () => {
    expect(DIFFICULTIES).toContain('easy');
    expect(DIFFICULTIES).toContain('medium');
    expect(DIFFICULTIES).toContain('hard');
  });
});
