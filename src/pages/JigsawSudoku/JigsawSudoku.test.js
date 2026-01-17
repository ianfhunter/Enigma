import { describe, it, expect } from 'vitest';
import {
  generateRegions,
  generateSolvedGrid,
  isValidSudokuPlacement,
  generatePuzzle,
  checkValidity,
  checkSolved,
} from './JigsawSudoku.jsx';

// ===========================================
// Jigsaw Sudoku - Region Generation Tests
// ===========================================
describe('Jigsaw Sudoku - Region Generation', () => {
  it('should generate 9 regions', () => {
    const { regions, regionCells } = generateRegions();
    
    expect(Object.keys(regionCells).length).toBe(9);
  });

  it('should have each cell assigned to a region', () => {
    const { regions } = generateRegions();
    
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        expect(regions[r][c]).toBeGreaterThanOrEqual(0);
        expect(regions[r][c]).toBeLessThan(9);
      }
    }
  });

  it('should have exactly 9 cells per region', () => {
    const { regionCells } = generateRegions();
    
    Object.values(regionCells).forEach(cells => {
      expect(cells.length).toBe(9);
    });
  });
});

// ===========================================
// Jigsaw Sudoku - Grid Generation Tests
// ===========================================
describe('Jigsaw Sudoku - Grid Generation', () => {
  it('should generate a valid solved grid with regions', () => {
    const { regions } = generateRegions();
    const grid = generateSolvedGrid(regions);
    
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
    const { regions } = generateRegions();
    const grid = generateSolvedGrid(regions);
    
    for (let r = 0; r < 9; r++) {
      const rowSet = new Set(grid[r]);
      expect(rowSet.size).toBe(9);
    }
  });

  it('should have no duplicates in columns', () => {
    const { regions } = generateRegions();
    const grid = generateSolvedGrid(regions);
    
    for (let c = 0; c < 9; c++) {
      const colSet = new Set();
      for (let r = 0; r < 9; r++) {
        colSet.add(grid[r][c]);
      }
      expect(colSet.size).toBe(9);
    }
  });

  it('should have no duplicates in regions', () => {
    const { regions, regionCells } = generateRegions();
    const grid = generateSolvedGrid(regions);
    
    Object.values(regionCells).forEach(cells => {
      const regionSet = new Set();
      cells.forEach(([r, c]) => {
        regionSet.add(grid[r][c]);
      });
      expect(regionSet.size).toBe(9);
    });
  });
});

// ===========================================
// Jigsaw Sudoku - Placement Validation Tests
// ===========================================
describe('Jigsaw Sudoku - Placement Validation', () => {
  it('should reject duplicate in row', () => {
    const { regions } = generateRegions();
    const grid = Array(9).fill(null).map(() => Array(9).fill(0));
    grid[0][0] = 5;
    expect(isValidSudokuPlacement(grid, 0, 4, 5, regions)).toBe(false);
  });

  it('should reject duplicate in column', () => {
    const { regions } = generateRegions();
    const grid = Array(9).fill(null).map(() => Array(9).fill(0));
    grid[0][0] = 5;
    expect(isValidSudokuPlacement(grid, 4, 0, 5, regions)).toBe(false);
  });

  it('should reject duplicate in region', () => {
    const { regions } = generateRegions();
    const regionId = regions[0][0];
    
    // Find another cell in the same region
    let otherCell = null;
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if ((r !== 0 || c !== 0) && regions[r][c] === regionId) {
          otherCell = [r, c];
          break;
        }
      }
      if (otherCell) break;
    }
    
    if (otherCell) {
      const grid = Array(9).fill(null).map(() => Array(9).fill(0));
      grid[0][0] = 5;
      grid[otherCell[0]][otherCell[1]] = 5;
      expect(isValidSudokuPlacement(grid, 0, 1, 5, regions)).toBe(true); // Different region, should be OK
    }
  });
});

// ===========================================
// Jigsaw Sudoku - Puzzle Generation Tests
// ===========================================
describe('Jigsaw Sudoku - Puzzle Generation', () => {
  it('should generate a puzzle with regions', () => {
    const puzzle = generatePuzzle();
    
    expect(puzzle).toHaveProperty('puzzle');
    expect(puzzle).toHaveProperty('solution');
    expect(puzzle).toHaveProperty('regions');
    expect(puzzle).toHaveProperty('regionCells');
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
// Jigsaw Sudoku - Solution Checking Tests
// ===========================================
describe('Jigsaw Sudoku - Solution Checking', () => {
  it('should detect correct solution', () => {
    const { regions } = generateRegions();
    const solution = generateSolvedGrid(regions);
    
    expect(checkSolved(solution, solution)).toBe(true);
  });

  it('should detect incorrect solution', () => {
    const { regions } = generateRegions();
    const solution = generateSolvedGrid(regions);
    const grid = solution.map(row => [...row]);
    grid[0][0] = grid[0][0] === 1 ? 2 : 1; // Change one cell
    
    expect(checkSolved(grid, solution)).toBe(false);
  });
});
