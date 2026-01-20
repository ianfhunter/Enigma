/**
 * Shared utilities for puzzle generators
 *
 * This module provides common functions used across multiple puzzle generators
 * to reduce code duplication and ensure consistent behavior.
 */

import { createSeededRandom, seededShuffleArray } from '../data/wordUtils';

// Re-export for convenience
export { createSeededRandom, seededShuffleArray };

// ============================================
// GRID CREATION & MANIPULATION
// ============================================

/**
 * Create a 2D grid filled with an initial value
 * @param {number} rows - Number of rows
 * @param {number} cols - Number of columns (defaults to rows for square grids)
 * @param {any} initialValue - Value to fill each cell with
 * @returns {any[][]} - 2D array
 */
export function createGrid(rows, cols = rows, initialValue = 0) {
  return Array(rows).fill(null).map(() => Array(cols).fill(initialValue));
}

/**
 * Create a deep clone of a 2D grid
 * @param {any[][]} grid - The grid to clone
 * @returns {any[][]} - A new grid with copied values
 */
export function cloneGrid(grid) {
  return grid.map(row => [...row]);
}

/**
 * Check if coordinates are within grid bounds
 * @param {number} r - Row index
 * @param {number} c - Column index
 * @param {number} rows - Number of rows
 * @param {number} cols - Number of columns (defaults to rows)
 * @returns {boolean}
 */
export function isInBounds(r, c, rows, cols = rows) {
  return r >= 0 && r < rows && c >= 0 && c < cols;
}

/**
 * Create a cell key string from coordinates
 * @param {number} r - Row index
 * @param {number} c - Column index
 * @param {string} separator - Separator character (default ',')
 * @returns {string} - Key string like "3,5"
 */
export function cellKey(r, c, separator = ',') {
  return `${r}${separator}${c}`;
}

/**
 * Parse a cell key back to coordinates
 * @param {string} key - Key string like "3,5"
 * @param {string} separator - Separator character (default ',')
 * @returns {[number, number]} - [row, col]
 */
export function parseKey(key, separator = ',') {
  const [r, c] = key.split(separator).map(Number);
  return [r, c];
}

// ============================================
// NEIGHBOR & DIRECTION HELPERS
// ============================================

/** Orthogonal directions: up, down, left, right */
export const ORTHOGONAL_DIRS = [
  [-1, 0], // up
  [1, 0],  // down
  [0, -1], // left
  [0, 1],  // right
];

/** Diagonal directions only */
export const DIAGONAL_DIRS = [
  [-1, -1], // up-left
  [-1, 1],  // up-right
  [1, -1],  // down-left
  [1, 1],   // down-right
];

/** All 8 directions (orthogonal + diagonal) */
export const ALL_DIRS = [...ORTHOGONAL_DIRS, ...DIAGONAL_DIRS];

/**
 * Get valid neighbor coordinates for a cell
 * @param {number} r - Row index
 * @param {number} c - Column index
 * @param {number} rows - Number of rows in grid
 * @param {number} cols - Number of columns (defaults to rows)
 * @param {boolean} includeDiagonal - Include diagonal neighbors (default false)
 * @returns {[number, number][]} - Array of [row, col] pairs
 */
export function getNeighbors(r, c, rows, cols = rows, includeDiagonal = false) {
  const dirs = includeDiagonal ? ALL_DIRS : ORTHOGONAL_DIRS;
  return dirs
    .map(([dr, dc]) => [r + dr, c + dc])
    .filter(([nr, nc]) => isInBounds(nr, nc, rows, cols));
}

/**
 * Get all neighbor values from a grid
 * @param {any[][]} grid - The grid
 * @param {number} r - Row index
 * @param {number} c - Column index
 * @param {boolean} includeDiagonal - Include diagonal neighbors
 * @returns {any[]} - Array of neighbor values
 */
export function getNeighborValues(grid, r, c, includeDiagonal = false) {
  const rows = grid.length;
  const cols = grid[0]?.length || 0;
  return getNeighbors(r, c, rows, cols, includeDiagonal)
    .map(([nr, nc]) => grid[nr][nc]);
}

// ============================================
// CONNECTED REGION DETECTION (BFS/DFS)
// ============================================

/**
 * Find all cells connected to a starting cell using BFS
 * @param {any[][]} grid - The grid
 * @param {number} startR - Starting row
 * @param {number} startC - Starting column
 * @param {function} matchFn - Function (cellValue, startValue) => boolean to determine connectivity
 * @param {boolean} includeDiagonal - Consider diagonal connections
 * @returns {[number, number][]} - Array of [row, col] coordinates in the connected region
 */
export function getConnectedRegion(grid, startR, startC, matchFn = null, includeDiagonal = false) {
  const rows = grid.length;
  const cols = grid[0]?.length || 0;
  const startVal = grid[startR][startC];

  // Default match function: match same value
  const match = matchFn || ((val, start) => val === start);

  const visited = new Set();
  const queue = [[startR, startC]];
  const cells = [];

  while (queue.length > 0) {
    const [r, c] = queue.shift();
    const key = cellKey(r, c);

    if (visited.has(key)) continue;
    if (!match(grid[r][c], startVal)) continue;

    visited.add(key);
    cells.push([r, c]);

    for (const [nr, nc] of getNeighbors(r, c, rows, cols, includeDiagonal)) {
      if (!visited.has(cellKey(nr, nc))) {
        queue.push([nr, nc]);
      }
    }
  }

  return cells;
}

/**
 * Check if all cells matching a condition form a single connected region
 * @param {any[][]} grid - The grid
 * @param {function} cellFilter - Function (cellValue, r, c) => boolean to filter cells
 * @param {boolean} includeDiagonal - Consider diagonal connections
 * @returns {boolean}
 */
export function isFullyConnected(grid, cellFilter, includeDiagonal = false) {
  const rows = grid.length;
  const cols = grid[0]?.length || 0;

  // Find all matching cells
  const matchingCells = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (cellFilter(grid[r][c], r, c)) {
        matchingCells.push([r, c]);
      }
    }
  }

  if (matchingCells.length === 0) return true;

  // Get connected region from first matching cell
  const [startR, startC] = matchingCells[0];
  const connected = getConnectedRegion(grid, startR, startC, (val, _) => cellFilter(val, 0, 0), includeDiagonal);

  return connected.length === matchingCells.length;
}

// ============================================
// PATHFINDING
// ============================================

/**
 * Find shortest path between two points using BFS
 * @param {any[][]} grid - The grid
 * @param {[number, number]} start - Starting [row, col]
 * @param {[number, number]} end - Ending [row, col]
 * @param {function} isPassable - Function (cellValue, r, c) => boolean
 * @param {boolean} includeDiagonal - Allow diagonal movement
 * @returns {[number, number][] | null} - Path as array of [row, col], or null if no path
 */
export function findShortestPath(grid, start, end, isPassable = (cell) => cell === 0, includeDiagonal = false) {
  const rows = grid.length;
  const cols = grid[0]?.length || 0;
  const visited = new Set();
  const queue = [[start[0], start[1], []]];

  while (queue.length > 0) {
    const [r, c, path] = queue.shift();

    if (r === end[0] && c === end[1]) {
      return [...path, [r, c]];
    }

    const key = cellKey(r, c);
    if (visited.has(key)) continue;
    visited.add(key);

    for (const [nr, nc] of getNeighbors(r, c, rows, cols, includeDiagonal)) {
      if (!visited.has(cellKey(nr, nc)) && isPassable(grid[nr][nc], nr, nc)) {
        queue.push([nr, nc, [...path, [r, c]]]);
      }
    }
  }

  return null;
}

// ============================================
// NOTES SERIALIZATION (for Sudoku-like games)
// ============================================

/**
 * Convert a notes object (with Set values) to JSON-serializable format
 * @param {Object<string, Set<number>>} notes - Notes object
 * @returns {Object<string, number[]>} - JSON-safe object
 */
export function notesToJSON(notes) {
  const result = {};
  for (const [key, value] of Object.entries(notes)) {
    result[key] = Array.from(value);
  }
  return result;
}

/**
 * Convert JSON notes back to object with Set values
 * @param {Object<string, number[]>} json - JSON notes object
 * @returns {Object<string, Set<number>>} - Notes with Set values
 */
export function notesFromJSON(json) {
  const result = {};
  for (const [key, value] of Object.entries(json || {})) {
    result[key] = new Set(value);
  }
  return result;
}

// ============================================
// DATASET PUZZLE SELECTION
// ============================================

/**
 * Select a puzzle from a dataset based on filters and seed
 * @param {Object[]} puzzles - Array of puzzle objects
 * @param {Object} filters - Object of property/value pairs to filter by
 * @param {number} seed - Seed for deterministic selection
 * @returns {Object | null} - Selected puzzle or null if none available
 */
export function selectPuzzleFromDataset(puzzles, filters, seed) {
  if (!puzzles || puzzles.length === 0) return null;

  const random = createSeededRandom(seed);
  let filtered = puzzles;

  // Apply filters progressively, falling back if too restrictive
  for (const [key, value] of Object.entries(filters)) {
    const matching = filtered.filter(p => p[key] === value);
    if (matching.length > 0) {
      filtered = matching;
    }
  }

  return filtered[Math.floor(random() * filtered.length)];
}

// ============================================
// LATIN SQUARE GENERATION
// ============================================

/**
 * Generate a valid Latin square (each row/column has 1..n exactly once)
 * @param {number} n - Size of the square
 * @param {function} random - Seeded random function
 * @returns {number[][]} - n×n grid where each row/column has 1..n
 */
export function generateLatinSquare(n, random) {
  const grid = createGrid(n, n, 0);

  // Fill first row with shuffled 1..n
  const firstRow = seededShuffleArray(
    Array.from({ length: n }, (_, i) => i + 1),
    random
  );
  for (let c = 0; c < n; c++) {
    grid[0][c] = firstRow[c];
  }

  // Fill remaining rows using cyclic permutation
  for (let r = 1; r < n; r++) {
    for (let c = 0; c < n; c++) {
      grid[r][c] = grid[r - 1][(c + 1) % n];
    }
  }

  // Shuffle rows for more randomness
  const rowIndices = seededShuffleArray([...Array(n).keys()], random);
  const shuffled = rowIndices.map(r => grid[r]);

  // Shuffle columns too
  const colIndices = seededShuffleArray([...Array(n).keys()], random);
  return shuffled.map(row => colIndices.map(c => row[c]));
}

// ============================================
// CONSTRAINT VALIDATION HELPERS
// ============================================

/**
 * Check if a value can be placed in a row (no duplicates)
 * @param {any[][]} grid - The grid
 * @param {number} row - Row index
 * @param {number} col - Column to exclude from check
 * @param {any} value - Value to check
 * @returns {boolean}
 */
export function isValidInRow(grid, row, col, value) {
  for (let c = 0; c < grid[row].length; c++) {
    if (c !== col && grid[row][c] === value) return false;
  }
  return true;
}

/**
 * Check if a value can be placed in a column (no duplicates)
 * @param {any[][]} grid - The grid
 * @param {number} row - Row to exclude from check
 * @param {number} col - Column index
 * @param {any} value - Value to check
 * @returns {boolean}
 */
export function isValidInColumn(grid, row, col, value) {
  for (let r = 0; r < grid.length; r++) {
    if (r !== row && grid[r][col] === value) return false;
  }
  return true;
}

/**
 * Check if a value can be placed (no row or column duplicates)
 * @param {any[][]} grid - The grid
 * @param {number} row - Row index
 * @param {number} col - Column index
 * @param {any} value - Value to check
 * @returns {boolean}
 */
export function isValidPlacement(grid, row, col, value) {
  return isValidInRow(grid, row, col, value) && isValidInColumn(grid, row, col, value);
}

// ============================================
// BACKTRACKING SOLVER
// ============================================

/**
 * Solve a puzzle using backtracking
 * @param {any[][]} grid - The grid (will be modified)
 * @param {function} getEmptyCells - Function (grid) => [[r, c], ...] to get cells to fill
 * @param {function} getPossibleValues - Function (grid, r, c) => [values] to get valid values
 * @param {function} isValid - Function (grid, r, c, value) => boolean
 * @param {number} maxSolutions - Stop after finding this many solutions
 * @returns {any[][][]} - Array of solution grids
 */
export function solveWithBacktracking(grid, getEmptyCells, getPossibleValues, isValid, maxSolutions = 2) {
  const solutions = [];
  const emptyCells = getEmptyCells(grid);

  function backtrack(idx) {
    if (solutions.length >= maxSolutions) return;

    if (idx >= emptyCells.length) {
      solutions.push(cloneGrid(grid));
      return;
    }

    const [r, c] = emptyCells[idx];
    const values = getPossibleValues(grid, r, c);

    for (const value of values) {
      if (isValid(grid, r, c, value)) {
        grid[r][c] = value;
        backtrack(idx + 1);
        if (solutions.length >= maxSolutions) return;
        grid[r][c] = 0;
      }
    }
  }

  backtrack(0);
  return solutions;
}

/**
 * Check if a puzzle has exactly one solution
 * @param {any[][]} grid - The puzzle grid
 * @param {function} getEmptyCells - Function to get empty cells
 * @param {function} getPossibleValues - Function to get possible values
 * @param {function} isValid - Validation function
 * @returns {boolean}
 */
export function hasUniqueSolution(grid, getEmptyCells, getPossibleValues, isValid) {
  const solutions = solveWithBacktracking(
    cloneGrid(grid),
    getEmptyCells,
    getPossibleValues,
    isValid,
    2
  );
  return solutions.length === 1;
}

// ============================================
// MAZE GENERATION
// ============================================

/**
 * Generate a maze using recursive backtracking
 * @param {number} width - Width (should be odd for proper maze)
 * @param {number} height - Height (should be odd for proper maze)
 * @param {function} random - Optional seeded random function
 * @returns {{ maze: number[][], start: {x, y}, end: {x, y} }}
 */
export function generateMaze(width, height, random = Math.random) {
  // Initialize grid with walls (1 = wall, 0 = passage)
  const maze = createGrid(height, width, 1);

  function carve(x, y) {
    maze[y][x] = 0;

    const directions = [
      [0, -2], // up
      [2, 0],  // right
      [0, 2],  // down
      [-2, 0], // left
    ].sort(() => random() - 0.5);

    for (const [dx, dy] of directions) {
      const nx = x + dx;
      const ny = y + dy;

      if (nx > 0 && nx < width - 1 && ny > 0 && ny < height - 1 && maze[ny][nx] === 1) {
        maze[y + dy / 2][x + dx / 2] = 0; // Remove wall between
        carve(nx, ny);
      }
    }
  }

  // Start from position (1, 1)
  carve(1, 1);

  const start = { x: 1, y: 1 };
  const end = { x: width - 2, y: height - 2 };

  return { maze, start, end };
}

// ============================================
// REGION GENERATION
// ============================================

/**
 * Generate random regions that tile a grid
 * @param {number} size - Grid size
 * @param {number} numRegions - Target number of regions
 * @param {function} random - Optional seeded random function
 * @returns {{ regionGrid: number[][], regions: {id, cells}[] }}
 */
export function generateRegions(size, numRegions, random = Math.random) {
  const regionGrid = createGrid(size, size, -1);
  const regions = [];

  // Start with seed cells for each region
  const allCells = [];
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      allCells.push([r, c]);
    }
  }

  // Shuffle and pick seed cells
  for (let i = allCells.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [allCells[i], allCells[j]] = [allCells[j], allCells[i]];
  }

  const seedCells = allCells.slice(0, numRegions);

  for (let i = 0; i < seedCells.length; i++) {
    const [r, c] = seedCells[i];
    regionGrid[r][c] = i;
    regions.push({ id: i, cells: [[r, c]] });
  }

  // Grow regions until all cells are assigned
  let unassigned = size * size - numRegions;

  while (unassigned > 0) {
    // Pick a random region to grow
    const regionIdx = Math.floor(random() * numRegions);
    const region = regions[regionIdx];

    // Find unassigned neighbors
    const candidates = [];
    for (const [r, c] of region.cells) {
      for (const [nr, nc] of getNeighbors(r, c, size, size)) {
        if (regionGrid[nr][nc] === -1) {
          candidates.push([nr, nc]);
        }
      }
    }

    if (candidates.length > 0) {
      const [nr, nc] = candidates[Math.floor(random() * candidates.length)];
      regionGrid[nr][nc] = regionIdx;
      region.cells.push([nr, nc]);
      unassigned--;
    }
  }

  return { regionGrid, regions };
}

// ============================================
// GRID VALIDATION UTILITIES
// ============================================

/**
 * Check if a grid has any 2x2 block of the same value
 * @param {any[][]} grid - The grid
 * @param {any} value - Value to check for 2x2 blocks
 * @returns {boolean} - True if a 2x2 block exists
 */
export function has2x2Block(grid, value) {
  const rows = grid.length;
  const cols = grid[0]?.length || 0;

  for (let r = 0; r < rows - 1; r++) {
    for (let c = 0; c < cols - 1; c++) {
      if (
        grid[r][c] === value &&
        grid[r][c + 1] === value &&
        grid[r + 1][c] === value &&
        grid[r + 1][c + 1] === value
      ) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Count cells matching a predicate
 * @param {any[][]} grid - The grid
 * @param {function} predicate - Function (value, r, c) => boolean
 * @returns {number}
 */
export function countCells(grid, predicate) {
  let count = 0;
  for (let r = 0; r < grid.length; r++) {
    for (let c = 0; c < grid[r].length; c++) {
      if (predicate(grid[r][c], r, c)) count++;
    }
  }
  return count;
}

/**
 * Find all cells matching a predicate
 * @param {any[][]} grid - The grid
 * @param {function} predicate - Function (value, r, c) => boolean
 * @returns {[number, number][]} - Array of [row, col]
 */
export function findCells(grid, predicate) {
  const cells = [];
  for (let r = 0; r < grid.length; r++) {
    for (let c = 0; c < grid[r].length; c++) {
      if (predicate(grid[r][c], r, c)) {
        cells.push([r, c]);
      }
    }
  }
  return cells;
}
