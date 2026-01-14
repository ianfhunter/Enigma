import { describe, it, expect } from 'vitest';
import {
  getColumn,
  calculateSandwichSum,
  canSandwichBeSatisfied,
  isValidSudokuPlacement,
  countSolutions,
  generatePuzzle,
  checkValidity,
} from './SandwichSudoku.jsx';

// ===========================================
// Sandwich Sudoku - Sandwich Sum Tests
// ===========================================
describe('Sandwich Sudoku - Sandwich Sum Calculation', () => {
  it('should return 0 when 1 and 9 are adjacent', () => {
    const line = [3, 5, 1, 9, 2, 7, 4, 6, 8];
    expect(calculateSandwichSum(line)).toBe(0);
  });

  it('should return 0 when 9 and 1 are adjacent (reversed)', () => {
    const line = [3, 5, 9, 1, 2, 7, 4, 6, 8];
    expect(calculateSandwichSum(line)).toBe(0);
  });

  it('should calculate sum of digits between 1 and 9', () => {
    // 1 at pos 0, 9 at pos 4: sum of 2+3+4 = 9
    const line = [1, 2, 3, 4, 9, 5, 6, 7, 8];
    expect(calculateSandwichSum(line)).toBe(2 + 3 + 4);
  });

  it('should work regardless of 1/9 order', () => {
    // 9 at pos 0, 1 at pos 4: sum of 2+3+4 = 9
    const line = [9, 2, 3, 4, 1, 5, 6, 7, 8];
    expect(calculateSandwichSum(line)).toBe(2 + 3 + 4);
  });

  it('should return 35 when 1 and 9 are at opposite ends', () => {
    // 1 at pos 0, 9 at pos 8: sum of 2+3+4+5+6+7+8 = 35
    const line = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    expect(calculateSandwichSum(line)).toBe(35);
  });

  it('should handle single digit between 1 and 9', () => {
    const line = [1, 5, 9, 2, 3, 4, 6, 7, 8];
    expect(calculateSandwichSum(line)).toBe(5);
  });
});

// ===========================================
// Sandwich Sudoku - Constraint Validation Tests
// ===========================================
describe('Sandwich Sudoku - Constraint Validation', () => {
  it('should validate complete line with correct sum', () => {
    const line = [3, 5, 1, 9, 2, 7, 4, 6, 8]; // 1,9 adjacent, sum = 0
    expect(canSandwichBeSatisfied(line, 0)).toBe(true);
    expect(canSandwichBeSatisfied(line, 5)).toBe(false);
  });

  it('should validate partial line where 1 and 9 are placed', () => {
    // 1 at 2, 9 at 5, cells 3,4 are between
    // Currently cell 3 has 4, cell 4 is empty (0)
    // Available middle digits: 2,3,5,6,7,8 (excluding used: 1,4,9)
    const line = [0, 0, 1, 4, 0, 9, 0, 0, 0];

    // For sum of 7: need remaining cell to have 3 (7-4=3), which is available
    expect(canSandwichBeSatisfied(line, 7)).toBe(true);

    // For sum of 4: need remaining cell to have 0, impossible
    expect(canSandwichBeSatisfied(line, 4)).toBe(false);
  });

  it('should allow partial line without 1 and 9 placed', () => {
    const line = [2, 3, 4, 0, 0, 0, 0, 0, 0];
    // Neither 1 nor 9 placed, should allow any target
    expect(canSandwichBeSatisfied(line, 0)).toBe(true);
    expect(canSandwichBeSatisfied(line, 35)).toBe(true);
  });

  it('should validate when all cells between 1 and 9 are filled', () => {
    // 1 at 2, 9 at 4, only cell 3 between with value 5
    const line = [0, 0, 1, 5, 9, 0, 0, 0, 0];
    expect(canSandwichBeSatisfied(line, 5)).toBe(true);
    expect(canSandwichBeSatisfied(line, 10)).toBe(false);
  });
});

// ===========================================
// Sandwich Sudoku - Sudoku Validation Tests
// ===========================================
describe('Sandwich Sudoku - Sudoku Placement Validation', () => {
  it('should reject duplicate in row', () => {
    const grid = Array(9).fill(null).map(() => Array(9).fill(0));
    grid[0][0] = 5;
    expect(isValidSudokuPlacement(grid, 0, 4, 5)).toBe(false);
  });

  it('should reject duplicate in column', () => {
    const grid = Array(9).fill(null).map(() => Array(9).fill(0));
    grid[0][0] = 5;
    expect(isValidSudokuPlacement(grid, 4, 0, 5)).toBe(false);
  });

  it('should reject duplicate in 3x3 box', () => {
    const grid = Array(9).fill(null).map(() => Array(9).fill(0));
    grid[0][0] = 5;
    expect(isValidSudokuPlacement(grid, 2, 2, 5)).toBe(false);
  });

  it('should accept valid placement', () => {
    const grid = Array(9).fill(null).map(() => Array(9).fill(0));
    grid[0][0] = 5;
    expect(isValidSudokuPlacement(grid, 3, 3, 5)).toBe(true);
  });
});

// ===========================================
// Sandwich Sudoku - Solution Counter Tests
// ===========================================
describe('Sandwich Sudoku - Solution Counter', () => {
  it('should find exactly one solution for a valid complete puzzle', () => {
    // A complete valid Sudoku grid
    const grid = [
      [5, 3, 4, 6, 7, 8, 9, 1, 2],
      [6, 7, 2, 1, 9, 5, 3, 4, 8],
      [1, 9, 8, 3, 4, 2, 5, 6, 7],
      [8, 5, 9, 7, 6, 1, 4, 2, 3],
      [4, 2, 6, 8, 5, 3, 7, 9, 1],
      [7, 1, 3, 9, 2, 4, 8, 5, 6],
      [9, 6, 1, 5, 3, 7, 2, 8, 4],
      [2, 8, 7, 4, 1, 9, 6, 3, 5],
      [3, 4, 5, 2, 8, 6, 1, 7, 9],
    ];

    const rowClues = grid.map(row => calculateSandwichSum(row));
    const colClues = [];
    for (let c = 0; c < 9; c++) {
      colClues.push(calculateSandwichSum(getColumn(grid, c)));
    }

    const testGrid = grid.map(row => [...row]);
    expect(countSolutions(testGrid, rowClues, colClues, 2)).toBe(1);
  });

  it('should find solution for puzzle with one empty cell', () => {
    const grid = [
      [5, 3, 4, 6, 7, 8, 9, 1, 2],
      [6, 7, 2, 1, 9, 5, 3, 4, 8],
      [1, 9, 8, 3, 4, 2, 5, 6, 7],
      [8, 5, 9, 7, 6, 1, 4, 2, 3],
      [4, 2, 6, 8, 5, 3, 7, 9, 1],
      [7, 1, 3, 9, 2, 4, 8, 5, 6],
      [9, 6, 1, 5, 3, 7, 2, 8, 4],
      [2, 8, 7, 4, 1, 9, 6, 3, 5],
      [3, 4, 5, 2, 8, 6, 1, 7, 9],
    ];

    const rowClues = grid.map(row => calculateSandwichSum(row));
    const colClues = [];
    for (let c = 0; c < 9; c++) {
      colClues.push(calculateSandwichSum(getColumn(grid, c)));
    }

    // Remove one cell
    const testGrid = grid.map(row => [...row]);
    testGrid[0][0] = 0;

    expect(countSolutions(testGrid, rowClues, colClues, 2)).toBe(1);
  });
});

// ===========================================
// Sandwich Sudoku - Edge Cases
// ===========================================
describe('Sandwich Sudoku - Edge Cases', () => {
  it('should handle sum of 0 (1 and 9 adjacent)', () => {
    const line = [2, 3, 4, 5, 1, 9, 6, 7, 8];
    expect(calculateSandwichSum(line)).toBe(0);
  });

  it('should handle maximum sum of 35', () => {
    const line = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    expect(calculateSandwichSum(line)).toBe(35);
  });

  it('should handle 9 before 1', () => {
    const line = [9, 2, 3, 4, 5, 6, 7, 8, 1];
    expect(calculateSandwichSum(line)).toBe(35);
  });
});

// ===========================================
// Sandwich Sudoku - Puzzle Generation
// ===========================================
describe('Sandwich Sudoku - Puzzle Generation', () => {
  it('should generate a puzzle and solution with matching dimensions', () => {
    const { puzzle, solution, rowClues, colClues } = generatePuzzle();

    expect(puzzle).toHaveLength(9);
    expect(solution).toHaveLength(9);
    puzzle.forEach(row => expect(row).toHaveLength(9));
    solution.forEach(row => expect(row).toHaveLength(9));
    expect(rowClues).toHaveLength(9);
    expect(colClues).toHaveLength(9);
  });

  it('generated solution should satisfy sandwich constraints', () => {
    const { solution, rowClues, colClues } = generatePuzzle();

    solution.forEach((row, r) => {
      expect(calculateSandwichSum(row)).toBe(rowClues[r]);
    });
    for (let c = 0; c < 9; c++) {
      expect(calculateSandwichSum(getColumn(solution, c))).toBe(colClues[c]);
    }
  });

  it('generated puzzle should have a unique solution by counter check', () => {
    const { puzzle, rowClues, colClues } = generatePuzzle();
    const gridCopy = puzzle.map(row => [...row]);
    const solutions = countSolutions(gridCopy, rowClues, colClues, 2);
    expect(solutions).toBe(1);
  });

  it('checkValidity should flag no errors on the solution', () => {
    const { solution } = generatePuzzle();
    const errors = checkValidity(solution, solution);
    expect(errors.size).toBe(0);
  });
});
