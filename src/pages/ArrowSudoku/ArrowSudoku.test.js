import { describe, it, expect } from 'vitest';
import {
  generateSolvedGrid,
  isValidSudokuPlacement,
  checkArrowConstraints,
  generateArrows,
  generatePuzzle,
  checkValidity,
  checkSolved,
} from './ArrowSudoku.jsx';

// ===========================================
// Arrow Sudoku - Grid Generation Tests
// ===========================================
describe('Arrow Sudoku - Grid Generation', () => {
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
      expect(rowSet.size).toBe(9); // All 9 digits unique
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

  it('should have no duplicates in boxes', () => {
    const grid = generateSolvedGrid();
    
    for (let boxRow = 0; boxRow < 3; boxRow++) {
      for (let boxCol = 0; boxCol < 3; boxCol++) {
        const boxSet = new Set();
        for (let i = 0; i < 3; i++) {
          for (let j = 0; j < 3; j++) {
            const r = boxRow * 3 + i;
            const c = boxCol * 3 + j;
            boxSet.add(grid[r][c]);
          }
        }
        expect(boxSet.size).toBe(9);
      }
    }
  });
});

// ===========================================
// Arrow Sudoku - Placement Validation Tests
// ===========================================
describe('Arrow Sudoku - Placement Validation', () => {
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

  it('should reject duplicate in box', () => {
    const grid = Array(9).fill(null).map(() => Array(9).fill(0));
    grid[0][0] = 5;
    expect(isValidSudokuPlacement(grid, 1, 1, 5)).toBe(false);
  });

  it('should accept valid placement', () => {
    const grid = Array(9).fill(null).map(() => Array(9).fill(0));
    grid[0][0] = 5;
    expect(isValidSudokuPlacement(grid, 0, 1, 3)).toBe(true);
  });
});

// ===========================================
// Arrow Sudoku - Arrow Constraint Tests
// ===========================================
describe('Arrow Sudoku - Arrow Constraints', () => {
  it('should validate correct arrow sum', () => {
    const grid = Array(9).fill(null).map(() => Array(9).fill(0));
    const arrow = {
      circle: [0, 0],
      path: [[0, 1], [0, 2]]
    };
    
    grid[0][0] = 6; // Circle
    grid[0][1] = 2; // Path cell 1
    grid[0][2] = 4; // Path cell 2 (2+4=6)
    
    const errors = checkArrowConstraints(grid, [arrow]);
    expect(errors.size).toBe(0);
  });

  it('should detect incorrect arrow sum', () => {
    const grid = Array(9).fill(null).map(() => Array(9).fill(0));
    const arrow = {
      circle: [0, 0],
      path: [[0, 1], [0, 2]]
    };
    
    grid[0][0] = 5; // Circle expects 5
    grid[0][1] = 2; // Path cell 1
    grid[0][2] = 4; // Path cell 2 (2+4=6, not 5)
    
    const errors = checkArrowConstraints(grid, [arrow]);
    expect(errors.size).toBeGreaterThan(0);
    expect(errors.has('0,0')).toBe(true);
  });

  it('should not check incomplete arrows', () => {
    const grid = Array(9).fill(null).map(() => Array(9).fill(0));
    const arrow = {
      circle: [0, 0],
      path: [[0, 1], [0, 2]]
    };
    
    grid[0][0] = 5;
    grid[0][1] = 2;
    // grid[0][2] is 0 (empty)
    
    const errors = checkArrowConstraints(grid, [arrow]);
    expect(errors.size).toBe(0); // Should not error on incomplete arrows
  });
});

// ===========================================
// Arrow Sudoku - Puzzle Generation Tests
// ===========================================
describe('Arrow Sudoku - Puzzle Generation', () => {
  it('should generate a puzzle with arrows', () => {
    const puzzle = generatePuzzle();
    
    expect(puzzle).toHaveProperty('puzzle');
    expect(puzzle).toHaveProperty('solution');
    expect(puzzle).toHaveProperty('arrows');
    expect(Array.isArray(puzzle.arrows)).toBe(true);
    expect(puzzle.arrows.length).toBeGreaterThan(0);
  });

  it('should have puzzle and solution of same size', () => {
    const puzzle = generatePuzzle();
    
    expect(puzzle.puzzle.length).toBe(9);
    expect(puzzle.solution.length).toBe(9);
    puzzle.puzzle.forEach((row, i) => {
      expect(row.length).toBe(9);
      expect(puzzle.solution[i].length).toBe(9);
    });
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
// Arrow Sudoku - Solution Checking Tests
// ===========================================
describe('Arrow Sudoku - Solution Checking', () => {
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
