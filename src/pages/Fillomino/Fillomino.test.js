import { describe, it, expect } from 'vitest';
import { createSeededRandom } from '../../data/wordUtils';

// ===========================================
// Fillomino - Grid Creation Tests
// ===========================================
describe('Fillomino - Grid Creation', () => {
  const createEmptyGrid = (rows, cols) => {
    return Array(rows).fill(null).map(() => Array(cols).fill(0));
  };

  it('should create grid of correct dimensions', () => {
    const grid = createEmptyGrid(6, 6);

    expect(grid.length).toBe(6);
    grid.forEach(row => {
      expect(row.length).toBe(6);
    });
  });

  it('should initialize all cells to 0 (empty)', () => {
    const grid = createEmptyGrid(4, 4);

    grid.flat().forEach(cell => {
      expect(cell).toBe(0);
    });
  });
});

// ===========================================
// Fillomino - Clue Placement Tests
// ===========================================
describe('Fillomino - Clue Placement', () => {
  // Clues are numbers placed in cells indicating polyomino size
  const placeClue = (grid, row, col, value) => {
    const newGrid = grid.map(r => [...r]);
    newGrid[row][col] = value;
    return newGrid;
  };

  const getClues = (grid) => {
    const clues = [];
    for (let r = 0; r < grid.length; r++) {
      for (let c = 0; c < grid[r].length; c++) {
        if (grid[r][c] > 0) {
          clues.push({ row: r, col: c, value: grid[r][c] });
        }
      }
    }
    return clues;
  };

  it('should place clue in cell', () => {
    let grid = [[0, 0], [0, 0]];
    grid = placeClue(grid, 0, 0, 3);

    expect(grid[0][0]).toBe(3);
  });

  it('should find all clues', () => {
    const grid = [
      [3, 0, 2],
      [0, 1, 0],
      [4, 0, 0],
    ];

    const clues = getClues(grid);
    expect(clues).toHaveLength(4);
  });
});

// ===========================================
// Fillomino - Region Finding Tests
// ===========================================
describe('Fillomino - Region Finding', () => {
  const findRegion = (grid, startRow, startCol, visited = new Set()) => {
    const value = grid[startRow][startCol];
    if (value === 0) return [];

    const region = [];
    const queue = [[startRow, startCol]];

    while (queue.length > 0) {
      const [r, c] = queue.shift();
      const key = `${r},${c}`;

      if (visited.has(key)) continue;
      if (r < 0 || r >= grid.length || c < 0 || c >= grid[0].length) continue;
      if (grid[r][c] !== value) continue;

      visited.add(key);
      region.push([r, c]);

      queue.push([r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]);
    }

    return region;
  };

  it('should find connected region', () => {
    const grid = [
      [3, 3, 3],
      [0, 0, 0],
      [0, 0, 0],
    ];

    const region = findRegion(grid, 0, 0);
    expect(region).toHaveLength(3);
  });

  it('should not cross different numbers', () => {
    const grid = [
      [3, 2, 3],
      [3, 2, 3],
      [3, 2, 3],
    ];

    const region = findRegion(grid, 0, 0);
    expect(region).toHaveLength(3); // Only left column
  });

  it('should handle single cell', () => {
    const grid = [[1]];
    const region = findRegion(grid, 0, 0);
    expect(region).toHaveLength(1);
  });
});

// ===========================================
// Fillomino - Region Validation Tests
// ===========================================
describe('Fillomino - Region Validation', () => {
  const isRegionValid = (grid, startRow, startCol) => {
    const value = grid[startRow][startCol];
    if (value === 0) return true; // Empty cells are valid

    // Find connected region
    const visited = new Set();
    const queue = [[startRow, startCol]];
    const region = [];

    while (queue.length > 0) {
      const [r, c] = queue.shift();
      const key = `${r},${c}`;

      if (visited.has(key)) continue;
      if (r < 0 || r >= grid.length || c < 0 || c >= grid[0].length) continue;
      if (grid[r][c] !== value) continue;

      visited.add(key);
      region.push([r, c]);

      queue.push([r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]);
    }

    // Region size must equal the value
    return region.length === value;
  };

  it('should validate correct region', () => {
    const grid = [
      [3, 3, 3],
      [0, 0, 0],
      [0, 0, 0],
    ];

    expect(isRegionValid(grid, 0, 0)).toBe(true);
  });

  it('should reject undersized region', () => {
    const grid = [
      [3, 3, 0],
      [0, 0, 0],
      [0, 0, 0],
    ];

    expect(isRegionValid(grid, 0, 0)).toBe(false);
  });

  it('should reject oversized region', () => {
    const grid = [
      [2, 2, 2],
      [0, 0, 0],
      [0, 0, 0],
    ];

    expect(isRegionValid(grid, 0, 0)).toBe(false);
  });
});

// ===========================================
// Fillomino - Adjacent Region Tests
// ===========================================
describe('Fillomino - Adjacent Region Rules', () => {
  const getAdjacentValues = (grid, row, col) => {
    const adjacent = [];
    const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];

    for (const [dr, dc] of directions) {
      const r = row + dr;
      const c = col + dc;

      if (r >= 0 && r < grid.length && c >= 0 && c < grid[0].length) {
        if (grid[r][c] > 0) {
          adjacent.push(grid[r][c]);
        }
      }
    }

    return adjacent;
  };

  const canPlaceNumber = (grid, row, col, value) => {
    // Check if placing this number would connect to same-size region illegally
    const adjacent = getAdjacentValues(grid, row, col);

    // Count how many adjacent cells have the same value
    const sameValueCount = adjacent.filter(v => v === value).length;

    // If placing would merge with existing region, need to check final size
    // Simplified: just check if any adjacent has same value
    return true; // Complex validation omitted for basic test
  };

  it('should find adjacent values', () => {
    const grid = [
      [3, 2, 0],
      [1, 0, 4],
      [0, 5, 0],
    ];

    // Cell at (1, 1) is adjacent to: up=(0,1)=2, down=(2,1)=5, left=(1,0)=1, right=(1,2)=4
    const adjacent = getAdjacentValues(grid, 1, 1);
    expect(adjacent).toContain(2);  // up
    expect(adjacent).toContain(5);  // down
    expect(adjacent).toContain(1);  // left
    expect(adjacent).toContain(4);  // right
    expect(adjacent).toHaveLength(4);
  });

  it('should handle corner cells', () => {
    const grid = [
      [3, 2],
      [1, 4],
    ];

    const adjacent = getAdjacentValues(grid, 0, 0);
    expect(adjacent).toHaveLength(2);
    expect(adjacent).toContain(2);
    expect(adjacent).toContain(1);
  });
});

// ===========================================
// Fillomino - Win Condition Tests
// ===========================================
describe('Fillomino - Win Condition', () => {
  const isPuzzleSolved = (grid) => {
    // All cells must be filled
    for (let r = 0; r < grid.length; r++) {
      for (let c = 0; c < grid[0].length; c++) {
        if (grid[r][c] === 0) return false;
      }
    }

    // All regions must have correct size
    const visited = new Set();

    for (let r = 0; r < grid.length; r++) {
      for (let c = 0; c < grid[0].length; c++) {
        const key = `${r},${c}`;
        if (visited.has(key)) continue;

        const value = grid[r][c];
        const queue = [[r, c]];
        const region = [];

        while (queue.length > 0) {
          const [cr, cc] = queue.shift();
          const cellKey = `${cr},${cc}`;

          if (visited.has(cellKey)) continue;
          if (cr < 0 || cr >= grid.length || cc < 0 || cc >= grid[0].length) continue;
          if (grid[cr][cc] !== value) continue;

          visited.add(cellKey);
          region.push([cr, cc]);

          queue.push([cr - 1, cc], [cr + 1, cc], [cr, cc - 1], [cr, cc + 1]);
        }

        if (region.length !== value) return false;
      }
    }

    return true;
  };

  it('should detect solved puzzle', () => {
    const grid = [
      [1, 2, 2],
      [3, 3, 3],
    ];

    expect(isPuzzleSolved(grid)).toBe(true);
  });

  it('should reject puzzle with empty cells', () => {
    const grid = [
      [1, 0, 2],
      [3, 3, 3],
    ];

    expect(isPuzzleSolved(grid)).toBe(false);
  });

  it('should reject puzzle with wrong region size', () => {
    const grid = [
      [2, 2, 2], // Three 2s connected = wrong
      [3, 3, 3],
    ];

    expect(isPuzzleSolved(grid)).toBe(false);
  });
});

// ===========================================
// Fillomino - Hint System Tests
// ===========================================
describe('Fillomino - Hint System', () => {
  const getCellHint = (grid, row, col, solution) => {
    if (grid[row][col] !== 0) {
      return null; // Cell already filled
    }

    return solution[row][col];
  };

  const getNextHint = (grid, solution) => {
    // Find first empty cell
    for (let r = 0; r < grid.length; r++) {
      for (let c = 0; c < grid[0].length; c++) {
        if (grid[r][c] === 0) {
          return { row: r, col: c, value: solution[r][c] };
        }
      }
    }
    return null;
  };

  it('should provide hint for empty cell', () => {
    const grid = [[0, 0], [0, 0]];
    const solution = [[2, 2], [1, 1]];

    const hint = getCellHint(grid, 0, 0, solution);
    expect(hint).toBe(2);
  });

  it('should not hint filled cell', () => {
    const grid = [[2, 0], [0, 0]];
    const solution = [[2, 2], [1, 1]];

    const hint = getCellHint(grid, 0, 0, solution);
    expect(hint).toBeNull();
  });

  it('should find next hint', () => {
    const grid = [[2, 2], [0, 0]];
    const solution = [[2, 2], [1, 1]];

    const hint = getNextHint(grid, solution);
    expect(hint).toEqual({ row: 1, col: 0, value: 1 });
  });
});
