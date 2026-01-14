import { describe, it, expect } from 'vitest';
import {
  DIR_MOVE,
  DIR_OPPOSITE,
  decodeDirections,
  tracePaths,
} from './Numberlink.jsx';

describe('Numberlink - helpers', () => {
  it('decodeDirections handles single and double letters', () => {
    expect(decodeDirections(14)).toBe('n');
    expect(decodeDirections(153)).toBe('ew'); // 153 = 5*26 + 23 -> e, w
  });

  it('direction constants are consistent', () => {
    expect(DIR_MOVE.n).toEqual([-1, 0]);
    expect(DIR_OPPOSITE.e).toBe('w');
  });
});

describe('Numberlink - tracePaths', () => {
  it('builds paths between endpoints using solution directions', () => {
    const endpoints = [
      [1, null],
      [null, 1],
    ];
    // Solution: 1 goes from (0,0) to (1,1) using east then south
    const solution = [
      [5, 19], // 5='e', 19='s'
      [0, 0],
    ];
    const { solutionPaths, pathsInfo } = tracePaths(endpoints, solution, 2, 2);
    expect(pathsInfo[0].start).toEqual({ r: 0, c: 0 });
    expect(pathsInfo[0].end).toEqual({ r: 1, c: 1 });
    expect(solutionPaths[1].length).toBeGreaterThan(1);
  });
});
import { describe, it, expect } from 'vitest';
import { createSeededRandom } from '../../data/wordUtils';

// ===========================================
// Numberlink - Grid Creation Tests
// ===========================================
describe('Numberlink - Grid Creation', () => {
  const createEmptyGrid = (rows, cols) => {
    return Array(rows).fill(null).map(() => Array(cols).fill(0));
  };

  it('should create grid of correct dimensions', () => {
    const grid = createEmptyGrid(7, 7);

    expect(grid.length).toBe(7);
    grid.forEach(row => {
      expect(row.length).toBe(7);
    });
  });

  it('should initialize all cells to 0', () => {
    const grid = createEmptyGrid(5, 5);

    grid.flat().forEach(cell => {
      expect(cell).toBe(0);
    });
  });
});

// ===========================================
// Numberlink - Endpoint Placement Tests
// ===========================================
describe('Numberlink - Endpoint Placement', () => {
  // Endpoints are pairs of numbers (1, 2, 3, ...) that need to be connected
  const placeEndpoints = (grid, pairs) => {
    const newGrid = grid.map(row => [...row]);

    pairs.forEach(({ num, start, end }) => {
      newGrid[start.row][start.col] = num;
      newGrid[end.row][end.col] = num;
    });

    return newGrid;
  };

  const findEndpoints = (grid, num) => {
    const endpoints = [];
    for (let r = 0; r < grid.length; r++) {
      for (let c = 0; c < grid[r].length; c++) {
        if (grid[r][c] === num) {
          endpoints.push({ row: r, col: c });
        }
      }
    }
    return endpoints;
  };

  it('should place endpoint pairs', () => {
    let grid = createEmptyGrid(5, 5);
    grid = placeEndpoints(grid, [
      { num: 1, start: { row: 0, col: 0 }, end: { row: 4, col: 4 } },
      { num: 2, start: { row: 0, col: 4 }, end: { row: 4, col: 0 } },
    ]);

    expect(grid[0][0]).toBe(1);
    expect(grid[4][4]).toBe(1);
    expect(grid[0][4]).toBe(2);
    expect(grid[4][0]).toBe(2);
  });

  it('should find both endpoints for a number', () => {
    const grid = [
      [1, 0, 0, 0, 2],
      [0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0],
      [2, 0, 0, 0, 1],
    ];

    const endpoints1 = findEndpoints(grid, 1);
    expect(endpoints1).toHaveLength(2);
    expect(endpoints1).toContainEqual({ row: 0, col: 0 });
    expect(endpoints1).toContainEqual({ row: 4, col: 4 });
  });

  const createEmptyGrid = (rows, cols) => {
    return Array(rows).fill(null).map(() => Array(cols).fill(0));
  };
});

// ===========================================
// Numberlink - Path Drawing Tests
// ===========================================
describe('Numberlink - Path Drawing', () => {
  // Paths are stored as arrays of [row, col] coordinates
  const isValidPathStep = (from, to, grid, paths, pathNum) => {
    const [fromRow, fromCol] = from;
    const [toRow, toCol] = to;

    // Must be adjacent (no diagonal)
    const rowDiff = Math.abs(toRow - fromRow);
    const colDiff = Math.abs(toCol - fromCol);
    if (!((rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1))) {
      return false;
    }

    // Must be in bounds
    if (toRow < 0 || toRow >= grid.length || toCol < 0 || toCol >= grid[0].length) {
      return false;
    }

    // Can only step on empty cell or matching endpoint
    const targetCell = grid[toRow][toCol];
    if (targetCell !== 0 && targetCell !== pathNum) {
      return false;
    }

    // Can't step on existing path
    for (const [num, pathCells] of Object.entries(paths)) {
      if (num !== String(pathNum)) {
        if (pathCells.some(([r, c]) => r === toRow && c === toCol)) {
          return false;
        }
      }
    }

    return true;
  };

  it('should allow valid adjacent step', () => {
    const grid = [[1, 0, 0], [0, 0, 0], [0, 0, 1]];
    const paths = { 1: [[0, 0]] };

    expect(isValidPathStep([0, 0], [0, 1], grid, paths, 1)).toBe(true);
    expect(isValidPathStep([0, 0], [1, 0], grid, paths, 1)).toBe(true);
  });

  it('should reject diagonal step', () => {
    const grid = [[1, 0, 0], [0, 0, 0], [0, 0, 1]];
    const paths = { 1: [[0, 0]] };

    expect(isValidPathStep([0, 0], [1, 1], grid, paths, 1)).toBe(false);
  });

  it('should reject stepping on other endpoint', () => {
    const grid = [[1, 2, 0], [0, 0, 0], [0, 0, 1]];
    const paths = { 1: [[0, 0]] };

    expect(isValidPathStep([0, 0], [0, 1], grid, paths, 1)).toBe(false);
  });

  it('should reject stepping on other path', () => {
    const grid = [[1, 0, 0], [0, 0, 0], [2, 0, 1]];
    const paths = { 1: [[0, 0]], 2: [[2, 0], [1, 0]] };

    expect(isValidPathStep([0, 0], [1, 0], grid, paths, 1)).toBe(false);
  });
});

// ===========================================
// Numberlink - Path Completion Tests
// ===========================================
describe('Numberlink - Path Completion', () => {
  const isPathComplete = (path, grid, num) => {
    if (path.length < 2) return false;

    // First and last cells must be endpoints
    const [startRow, startCol] = path[0];
    const [endRow, endCol] = path[path.length - 1];

    return grid[startRow][startCol] === num && grid[endRow][endCol] === num;
  };

  it('should detect complete path', () => {
    const grid = [[1, 0, 0], [0, 0, 0], [0, 0, 1]];
    const path = [[0, 0], [0, 1], [0, 2], [1, 2], [2, 2]];

    expect(isPathComplete(path, grid, 1)).toBe(true);
  });

  it('should reject incomplete path', () => {
    const grid = [[1, 0, 0], [0, 0, 0], [0, 0, 1]];
    const path = [[0, 0], [0, 1], [0, 2]];

    expect(isPathComplete(path, grid, 1)).toBe(false);
  });
});

// ===========================================
// Numberlink - Grid Coverage Tests
// ===========================================
describe('Numberlink - Grid Coverage', () => {
  const getGridCoverage = (paths, gridRows, gridCols) => {
    const covered = new Set();

    Object.values(paths).forEach(pathCells => {
      pathCells.forEach(([r, c]) => {
        covered.add(`${r},${c}`);
      });
    });

    const total = gridRows * gridCols;
    return {
      covered: covered.size,
      total,
      percentage: (covered.size / total) * 100,
    };
  };

  it('should calculate coverage correctly', () => {
    const paths = {
      1: [[0, 0], [0, 1], [0, 2]],
      2: [[1, 0], [1, 1]],
    };

    const coverage = getGridCoverage(paths, 3, 3);

    expect(coverage.covered).toBe(5);
    expect(coverage.total).toBe(9);
    expect(coverage.percentage).toBeCloseTo(55.56, 1);
  });
});

// ===========================================
// Numberlink - Win Condition Tests
// ===========================================
describe('Numberlink - Win Condition', () => {
  const isPuzzleSolved = (grid, paths) => {
    // Find all unique numbers (endpoints)
    const numbers = new Set();
    for (let r = 0; r < grid.length; r++) {
      for (let c = 0; c < grid[r].length; c++) {
        if (grid[r][c] > 0) numbers.add(grid[r][c]);
      }
    }

    // Each number must have complete path
    for (const num of numbers) {
      const path = paths[num];
      if (!path || path.length < 2) return false;

      const [startRow, startCol] = path[0];
      const [endRow, endCol] = path[path.length - 1];

      if (grid[startRow][startCol] !== num || grid[endRow][endCol] !== num) {
        return false;
      }
    }

    // All cells must be covered by exactly one path
    const coverage = Array(grid.length).fill(null).map(() => Array(grid[0].length).fill(0));

    Object.entries(paths).forEach(([num, pathCells]) => {
      pathCells.forEach(([r, c]) => {
        coverage[r][c]++;
      });
    });

    // Add endpoints
    for (let r = 0; r < grid.length; r++) {
      for (let c = 0; c < grid[r].length; c++) {
        if (grid[r][c] > 0 && coverage[r][c] === 0) {
          return false; // Endpoint not covered
        }
      }
    }

    // Check all cells covered exactly once
    return coverage.every(row => row.every(cell => cell === 1));
  };

  it('should detect solved puzzle', () => {
    const grid = [[1, 0, 1]];
    const paths = { 1: [[0, 0], [0, 1], [0, 2]] };

    expect(isPuzzleSolved(grid, paths)).toBe(true);
  });

  it('should reject puzzle with missing path', () => {
    const grid = [[1, 0, 1], [2, 0, 2]];
    const paths = { 1: [[0, 0], [0, 1], [0, 2]] };

    expect(isPuzzleSolved(grid, paths)).toBe(false);
  });

  it('should reject puzzle with uncovered cells', () => {
    const grid = [[1, 0, 0], [0, 0, 0], [0, 0, 1]];
    const paths = { 1: [[0, 0], [1, 0], [2, 0], [2, 1], [2, 2]] }; // Only 5 cells

    expect(isPuzzleSolved(grid, paths)).toBe(false);
  });
});

// ===========================================
// Numberlink - Path Continuity Tests
// ===========================================
describe('Numberlink - Path Continuity', () => {
  const isPathContinuous = (path) => {
    for (let i = 1; i < path.length; i++) {
      const [prevRow, prevCol] = path[i - 1];
      const [currRow, currCol] = path[i];

      const rowDiff = Math.abs(currRow - prevRow);
      const colDiff = Math.abs(currCol - prevCol);

      if (!((rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1))) {
        return false;
      }
    }
    return true;
  };

  it('should validate continuous path', () => {
    const path = [[0, 0], [0, 1], [1, 1], [2, 1], [2, 2]];
    expect(isPathContinuous(path)).toBe(true);
  });

  it('should detect broken path', () => {
    const path = [[0, 0], [0, 1], [2, 1]]; // Jump from row 0 to row 2
    expect(isPathContinuous(path)).toBe(false);
  });

  it('should detect diagonal in path', () => {
    const path = [[0, 0], [1, 1]]; // Diagonal move
    expect(isPathContinuous(path)).toBe(false);
  });
});
