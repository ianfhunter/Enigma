import { describe, it, expect } from 'vitest';
import {
  generateSolvedGrid,
  isValidSudokuPlacement,
  checkThermoConstraints,
  generateThermos,
  generatePuzzle,
  checkValidity,
  checkSolved,
} from './ThermoSudoku.jsx';

// ===========================================
// Thermo Sudoku - Grid Generation Tests
// ===========================================
describe('Thermo Sudoku - Grid Generation', () => {
  it('should generate a valid solved Sudoku grid', () => {
    const grid = generateSolvedGrid();
    
    expect(grid).toHaveLength(9);
    grid.forEach(row => {
      expect(row).toHaveLength(9);
      row.forEach(cell => {
        expect(cell).toBeGreaterThanOrEqual(1);
        expect(cell).toBeLessThanOrEqual(9);
      });
    });
  });

  it('should have no duplicates in rows', () => {
    const grid = generateSolvedGrid();
    
    for (let r = 0; r < 9; r++) {
      const rowSet = new Set(grid[r]);
      expect(rowSet.size).toBe(9);
    }
  });

  it('should have no duplicates in columns', () => {
    const grid = generateSolvedGrid();
    
    for (let c = 0; c < 9; c++) {
      const colSet = new Set();
      for (let r = 0; r < 9; r++) {
        colSet.add(grid[r][c]);
      }
      expect(colSet.size).toBe(9);
    }
  });
});

// ===========================================
// Thermo Sudoku - Placement Validation Tests
// ===========================================
describe('Thermo Sudoku - Placement Validation', () => {
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

  it('should accept valid placement', () => {
    const grid = Array(9).fill(null).map(() => Array(9).fill(0));
    grid[0][0] = 5;
    expect(isValidSudokuPlacement(grid, 0, 1, 3)).toBe(true);
  });
});

// ===========================================
// Thermo Sudoku - Thermo Constraint Tests
// ===========================================
describe('Thermo Sudoku - Thermo Constraints', () => {
  it('should validate increasing sequence', () => {
    const grid = Array(9).fill(null).map(() => Array(9).fill(0));
    const thermo = {
      cells: [[0, 0], [0, 1], [0, 2]]
    };
    
    grid[0][0] = 1; // Bulb
    grid[0][1] = 3; // Middle (1 < 3)
    grid[0][2] = 5; // Tip (3 < 5)
    
    const errors = checkThermoConstraints(grid, [thermo]);
    expect(errors.size).toBe(0);
  });

  it('should detect non-increasing sequence', () => {
    const grid = Array(9).fill(null).map(() => Array(9).fill(0));
    const thermo = {
      cells: [[0, 0], [0, 1], [0, 2]]
    };
    
    grid[0][0] = 3; // Bulb
    grid[0][1] = 2; // Middle (3 > 2, violation!)
    grid[0][2] = 5; // Tip
    
    const errors = checkThermoConstraints(grid, [thermo]);
    expect(errors.size).toBeGreaterThan(0);
  });

  it('should detect equal values (not strictly increasing)', () => {
    const grid = Array(9).fill(null).map(() => Array(9).fill(0));
    const thermo = {
      cells: [[0, 0], [0, 1], [0, 2]]
    };
    
    grid[0][0] = 2;
    grid[0][1] = 2; // Equal (not strictly increasing)
    grid[0][2] = 5;
    
    const errors = checkThermoConstraints(grid, [thermo]);
    expect(errors.size).toBeGreaterThan(0);
  });

  it('should not check incomplete thermos', () => {
    const grid = Array(9).fill(null).map(() => Array(9).fill(0));
    const thermo = {
      cells: [[0, 0], [0, 1], [0, 2]]
    };
    
    grid[0][0] = 2;
    grid[0][1] = 4;
    // grid[0][2] is 0 (empty)
    
    const errors = checkThermoConstraints(grid, [thermo]);
    expect(errors.size).toBe(0); // Should not error on incomplete thermos
  });
});

// ===========================================
// Thermo Sudoku - Puzzle Generation Tests
// ===========================================
describe('Thermo Sudoku - Puzzle Generation', () => {
  it('should generate a puzzle with thermos', () => {
    const puzzle = generatePuzzle();
    
    expect(puzzle).toHaveProperty('puzzle');
    expect(puzzle).toHaveProperty('solution');
    expect(puzzle).toHaveProperty('thermos');
    expect(Array.isArray(puzzle.thermos)).toBe(true);
  });

  it('should have puzzle and solution of same size', () => {
    const puzzle = generatePuzzle();
    
    expect(puzzle.puzzle.length).toBe(9);
    expect(puzzle.solution.length).toBe(9);
  });

  it('should have some empty cells in puzzle', () => {
    const puzzle = generatePuzzle();
    
    let hasEmpty = false;
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (puzzle.puzzle[r][c] === 0) {
          hasEmpty = true;
          break;
        }
      }
      if (hasEmpty) break;
    }
    expect(hasEmpty).toBe(true);
  });
});

// ===========================================
// Thermo Sudoku - Solution Checking Tests
// ===========================================
describe('Thermo Sudoku - Solution Checking', () => {
  it('should detect correct solution', () => {
    const grid = Array(9).fill(null).map(() => Array(9).fill(1));
    const solution = Array(9).fill(null).map(() => Array(9).fill(1));
    
    expect(checkSolved(grid, solution)).toBe(true);
  });

  it('should detect incorrect solution', () => {
    const grid = Array(9).fill(null).map(() => Array(9).fill(1));
    const solution = Array(9).fill(null).map(() => Array(9).fill(2));
    
    expect(checkSolved(grid, solution)).toBe(false);
  });
});
