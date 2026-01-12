import { describe, it, expect } from 'vitest';
import { createSeededRandom } from '../../data/wordUtils';

// ===========================================
// Calcudoku - Grid Creation Tests
// ===========================================
describe('Calcudoku - Grid Creation', () => {
  const createEmptyGrid = (size) => {
    return Array(size).fill(null).map(() => Array(size).fill(0));
  };

  it('should create square grid', () => {
    const grid = createEmptyGrid(6);

    expect(grid.length).toBe(6);
    grid.forEach(row => {
      expect(row.length).toBe(6);
    });
  });

  it('should initialize all cells to 0', () => {
    const grid = createEmptyGrid(4);

    grid.flat().forEach(cell => {
      expect(cell).toBe(0);
    });
  });
});

// ===========================================
// Calcudoku - Latin Square Validation Tests
// ===========================================
describe('Calcudoku - Latin Square Rules', () => {
  const isValidPlacement = (grid, row, col, num, size) => {
    // Check row
    for (let c = 0; c < size; c++) {
      if (c !== col && grid[row][c] === num) return false;
    }

    // Check column
    for (let r = 0; r < size; r++) {
      if (r !== row && grid[r][col] === num) return false;
    }

    return true;
  };

  it('should allow valid placement', () => {
    const grid = [
      [1, 2, 0],
      [0, 0, 0],
      [0, 0, 0],
    ];

    expect(isValidPlacement(grid, 1, 0, 2, 3)).toBe(true);
    expect(isValidPlacement(grid, 0, 2, 3, 3)).toBe(true);
  });

  it('should reject duplicate in row', () => {
    const grid = [
      [1, 2, 0],
      [0, 0, 0],
      [0, 0, 0],
    ];

    expect(isValidPlacement(grid, 0, 2, 1, 3)).toBe(false);
  });

  it('should reject duplicate in column', () => {
    const grid = [
      [1, 2, 0],
      [0, 0, 0],
      [0, 0, 0],
    ];

    expect(isValidPlacement(grid, 2, 0, 1, 3)).toBe(false);
  });
});

// ===========================================
// Calcudoku - Cage Definition Tests
// ===========================================
describe('Calcudoku - Cage Definition', () => {
  // Cages: { cells: [[r, c], ...], target: number, operation: '+' | '-' | '*' | '/' }
  const createCage = (cells, target, operation) => {
    return { cells, target, operation };
  };

  const getCellCage = (cages, row, col) => {
    return cages.find(cage =>
      cage.cells.some(([r, c]) => r === row && c === col)
    );
  };

  it('should create cage with cells', () => {
    const cage = createCage([[0, 0], [0, 1]], 5, '+');

    expect(cage.cells).toHaveLength(2);
    expect(cage.target).toBe(5);
    expect(cage.operation).toBe('+');
  });

  it('should find cage for cell', () => {
    const cages = [
      createCage([[0, 0], [0, 1]], 5, '+'),
      createCage([[1, 0], [1, 1]], 2, '-'),
    ];

    const cage = getCellCage(cages, 0, 1);
    expect(cage.target).toBe(5);
  });
});

// ===========================================
// Calcudoku - Cage Validation Tests
// ===========================================
describe('Calcudoku - Cage Validation', () => {
  const evaluateCage = (grid, cage) => {
    const values = cage.cells.map(([r, c]) => grid[r][c]).filter(v => v > 0);

    if (values.length === 0) return null; // Not filled
    if (values.length !== cage.cells.length) return null; // Partially filled

    switch (cage.operation) {
      case '+':
        return values.reduce((a, b) => a + b, 0);
      case '-':
        return Math.abs(values[0] - values[1]); // Assumes 2 cells for subtraction
      case '*':
        return values.reduce((a, b) => a * b, 1);
      case '/':
        return Math.max(values[0], values[1]) / Math.min(values[0], values[1]);
      default:
        return values[0]; // Single cell
    }
  };

  const isCageValid = (grid, cage) => {
    const result = evaluateCage(grid, cage);
    if (result === null) return true; // Not complete, can't validate
    return result === cage.target;
  };

  it('should validate addition cage', () => {
    const grid = [[3, 2], [0, 0]];
    const cage = { cells: [[0, 0], [0, 1]], target: 5, operation: '+' };

    expect(isCageValid(grid, cage)).toBe(true);
  });

  it('should validate subtraction cage', () => {
    const grid = [[4, 1], [0, 0]];
    const cage = { cells: [[0, 0], [0, 1]], target: 3, operation: '-' };

    expect(isCageValid(grid, cage)).toBe(true);
  });

  it('should validate multiplication cage', () => {
    const grid = [[2, 3], [0, 0]];
    const cage = { cells: [[0, 0], [0, 1]], target: 6, operation: '*' };

    expect(isCageValid(grid, cage)).toBe(true);
  });

  it('should validate division cage', () => {
    const grid = [[6, 2], [0, 0]];
    const cage = { cells: [[0, 0], [0, 1]], target: 3, operation: '/' };

    expect(isCageValid(grid, cage)).toBe(true);
  });

  it('should reject invalid cage', () => {
    const grid = [[1, 2], [0, 0]];
    const cage = { cells: [[0, 0], [0, 1]], target: 5, operation: '+' };

    expect(isCageValid(grid, cage)).toBe(false);
  });
});

// ===========================================
// Calcudoku - Win Condition Tests
// ===========================================
describe('Calcudoku - Win Condition', () => {
  const isPuzzleSolved = (grid, cages, size) => {
    // Check all cells filled with valid numbers
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (grid[r][c] < 1 || grid[r][c] > size) return false;
      }
    }

    // Check Latin square rules (no duplicates in rows/columns)
    for (let i = 0; i < size; i++) {
      const rowSet = new Set();
      const colSet = new Set();

      for (let j = 0; j < size; j++) {
        if (rowSet.has(grid[i][j])) return false;
        rowSet.add(grid[i][j]);

        if (colSet.has(grid[j][i])) return false;
        colSet.add(grid[j][i]);
      }
    }

    // Check all cages
    for (const cage of cages) {
      const values = cage.cells.map(([r, c]) => grid[r][c]);
      let result;

      switch (cage.operation) {
        case '+':
          result = values.reduce((a, b) => a + b, 0);
          break;
        case '-':
          result = Math.abs(values[0] - values[1]);
          break;
        case '*':
          result = values.reduce((a, b) => a * b, 1);
          break;
        case '/':
          result = Math.max(...values) / Math.min(...values);
          break;
        default:
          result = values[0];
      }

      if (result !== cage.target) return false;
    }

    return true;
  };

  it('should detect solved puzzle', () => {
    const grid = [
      [1, 2],
      [2, 1],
    ];
    const cages = [
      { cells: [[0, 0], [0, 1]], target: 3, operation: '+' },
      { cells: [[1, 0], [1, 1]], target: 3, operation: '+' },
    ];

    expect(isPuzzleSolved(grid, cages, 2)).toBe(true);
  });

  it('should reject incomplete puzzle', () => {
    const grid = [
      [1, 0],
      [2, 1],
    ];
    const cages = [
      { cells: [[0, 0], [0, 1]], target: 3, operation: '+' },
    ];

    expect(isPuzzleSolved(grid, cages, 2)).toBe(false);
  });

  it('should reject puzzle with Latin square violation', () => {
    const grid = [
      [1, 1],
      [2, 2],
    ];
    const cages = [];

    expect(isPuzzleSolved(grid, cages, 2)).toBe(false);
  });
});

// ===========================================
// Calcudoku - Hint Generation Tests
// ===========================================
describe('Calcudoku - Hints', () => {
  const getPossibleValues = (grid, cages, row, col, size) => {
    const possible = [];

    for (let num = 1; num <= size; num++) {
      // Check row
      let inRow = false;
      for (let c = 0; c < size; c++) {
        if (c !== col && grid[row][c] === num) {
          inRow = true;
          break;
        }
      }
      if (inRow) continue;

      // Check column
      let inCol = false;
      for (let r = 0; r < size; r++) {
        if (r !== row && grid[r][col] === num) {
          inCol = true;
          break;
        }
      }
      if (inCol) continue;

      possible.push(num);
    }

    return possible;
  };

  it('should find possible values for cell', () => {
    const grid = [
      [1, 2, 0],
      [0, 0, 0],
      [0, 0, 0],
    ];

    const possible = getPossibleValues(grid, [], 0, 2, 3);
    expect(possible).toEqual([3]);
  });

  it('should exclude numbers in row', () => {
    const grid = [
      [1, 0, 0],
      [0, 0, 0],
      [0, 0, 0],
    ];

    const possible = getPossibleValues(grid, [], 0, 1, 3);
    expect(possible).not.toContain(1);
  });

  it('should exclude numbers in column', () => {
    const grid = [
      [1, 0, 0],
      [0, 0, 0],
      [0, 0, 0],
    ];

    const possible = getPossibleValues(grid, [], 1, 0, 3);
    expect(possible).not.toContain(1);
  });
});

// ===========================================
// Calcudoku - Difficulty Tests
// ===========================================
describe('Calcudoku - Difficulty', () => {
  const DIFFICULTY_SETTINGS = {
    easy: { size: 4, operations: ['+'] },
    medium: { size: 5, operations: ['+', '-'] },
    hard: { size: 6, operations: ['+', '-', '*'] },
    expert: { size: 6, operations: ['+', '-', '*', '/'] },
  };

  it('should have increasing sizes', () => {
    expect(DIFFICULTY_SETTINGS.easy.size).toBeLessThanOrEqual(DIFFICULTY_SETTINGS.medium.size);
    expect(DIFFICULTY_SETTINGS.medium.size).toBeLessThanOrEqual(DIFFICULTY_SETTINGS.hard.size);
  });

  it('should have increasing operation complexity', () => {
    expect(DIFFICULTY_SETTINGS.easy.operations.length).toBeLessThan(DIFFICULTY_SETTINGS.expert.operations.length);
  });
});
