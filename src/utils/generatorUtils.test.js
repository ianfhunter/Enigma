import { describe, it, expect } from 'vitest';
import {
  // Grid creation
  createGrid,
  cloneGrid,
  isInBounds,
  cellKey,
  parseKey,
  // Neighbors
  ORTHOGONAL_DIRS,
  DIAGONAL_DIRS,
  ALL_DIRS,
  getNeighbors,
  getNeighborValues,
  // Connected regions
  getConnectedRegion,
  isFullyConnected,
  // Pathfinding
  findShortestPath,
  // Notes
  notesToJSON,
  notesFromJSON,
  // Dataset selection
  selectPuzzleFromDataset,
  // Latin square
  generateLatinSquare,
  // Validation
  isValidInRow,
  isValidInColumn,
  isValidPlacement,
  // Backtracking
  solveWithBacktracking,
  hasUniqueSolution,
  // Maze
  generateMaze,
  // Regions
  generateRegions,
  // Grid utilities
  has2x2Block,
  countCells,
  findCells,
  // Re-exports
  createSeededRandom,
} from './generatorUtils';

describe('Grid Creation & Manipulation', () => {
  describe('createGrid', () => {
    it('creates a square grid with default value', () => {
      const grid = createGrid(3);
      expect(grid).toHaveLength(3);
      expect(grid[0]).toHaveLength(3);
      expect(grid[1][1]).toBe(0);
    });

    it('creates a rectangular grid', () => {
      const grid = createGrid(2, 4, null);
      expect(grid).toHaveLength(2);
      expect(grid[0]).toHaveLength(4);
      expect(grid[0][0]).toBeNull();
    });

    it('creates independent rows (not references)', () => {
      const grid = createGrid(3, 3, 0);
      grid[0][0] = 99;
      expect(grid[1][0]).toBe(0);
    });
  });

  describe('cloneGrid', () => {
    it('creates a deep copy', () => {
      const original = [[1, 2], [3, 4]];
      const clone = cloneGrid(original);
      clone[0][0] = 99;
      expect(original[0][0]).toBe(1);
    });
  });

  describe('isInBounds', () => {
    it('returns true for valid coordinates', () => {
      expect(isInBounds(0, 0, 5)).toBe(true);
      expect(isInBounds(4, 4, 5)).toBe(true);
      expect(isInBounds(2, 3, 5, 6)).toBe(true);
    });

    it('returns false for out-of-bounds coordinates', () => {
      expect(isInBounds(-1, 0, 5)).toBe(false);
      expect(isInBounds(5, 0, 5)).toBe(false);
      expect(isInBounds(0, 5, 5)).toBe(false);
    });
  });

  describe('cellKey and parseKey', () => {
    it('creates and parses keys correctly', () => {
      expect(cellKey(3, 5)).toBe('3,5');
      expect(parseKey('3,5')).toEqual([3, 5]);
    });

    it('supports custom separators', () => {
      expect(cellKey(3, 5, '-')).toBe('3-5');
      expect(parseKey('3-5', '-')).toEqual([3, 5]);
    });
  });
});

describe('Neighbor Helpers', () => {
  describe('direction constants', () => {
    it('has 4 orthogonal directions', () => {
      expect(ORTHOGONAL_DIRS).toHaveLength(4);
    });

    it('has 4 diagonal directions', () => {
      expect(DIAGONAL_DIRS).toHaveLength(4);
    });

    it('has 8 total directions', () => {
      expect(ALL_DIRS).toHaveLength(8);
    });
  });

  describe('getNeighbors', () => {
    it('returns orthogonal neighbors in center of grid', () => {
      const neighbors = getNeighbors(2, 2, 5);
      expect(neighbors).toHaveLength(4);
      expect(neighbors).toContainEqual([1, 2]);
      expect(neighbors).toContainEqual([3, 2]);
      expect(neighbors).toContainEqual([2, 1]);
      expect(neighbors).toContainEqual([2, 3]);
    });

    it('filters out-of-bounds neighbors at corners', () => {
      const neighbors = getNeighbors(0, 0, 5);
      expect(neighbors).toHaveLength(2);
      expect(neighbors).toContainEqual([1, 0]);
      expect(neighbors).toContainEqual([0, 1]);
    });

    it('includes diagonal neighbors when requested', () => {
      const neighbors = getNeighbors(2, 2, 5, 5, true);
      expect(neighbors).toHaveLength(8);
    });
  });

  describe('getNeighborValues', () => {
    it('returns values of orthogonal neighbors', () => {
      const grid = [
        [1, 2, 3],
        [4, 5, 6],
        [7, 8, 9],
      ];
      const values = getNeighborValues(grid, 1, 1);
      expect(values).toHaveLength(4);
      expect(values).toContain(2); // up
      expect(values).toContain(4); // left
      expect(values).toContain(6); // right
      expect(values).toContain(8); // down
    });
  });
});

describe('Connected Region Detection', () => {
  describe('getConnectedRegion', () => {
    it('finds connected cells with same value', () => {
      const grid = [
        [1, 1, 0],
        [1, 0, 0],
        [0, 0, 2],
      ];
      const region = getConnectedRegion(grid, 0, 0);
      expect(region).toHaveLength(3);
    });

    it('respects orthogonal-only connectivity', () => {
      const grid = [
        [1, 0, 1],
        [0, 0, 0],
        [1, 0, 1],
      ];
      const region = getConnectedRegion(grid, 0, 0);
      expect(region).toHaveLength(1); // Diagonal cells not connected
    });

    it('can use custom match function', () => {
      const grid = [
        [1, 2, 3],
        [4, 5, 6],
        [7, 8, 9],
      ];
      // Match all values <= 5
      const region = getConnectedRegion(grid, 0, 0, (val) => val <= 5);
      expect(region).toHaveLength(5);
    });
  });

  describe('isFullyConnected', () => {
    it('returns true for connected regions', () => {
      const grid = [
        [1, 1, 0],
        [1, 1, 0],
        [0, 0, 0],
      ];
      expect(isFullyConnected(grid, v => v === 1)).toBe(true);
    });

    it('returns false for disconnected regions', () => {
      const grid = [
        [1, 0, 1],
        [0, 0, 0],
        [1, 0, 1],
      ];
      expect(isFullyConnected(grid, v => v === 1)).toBe(false);
    });
  });
});

describe('Pathfinding', () => {
  describe('findShortestPath', () => {
    it('finds path through simple maze', () => {
      const grid = [
        [0, 0, 0],
        [1, 1, 0],
        [0, 0, 0],
      ];
      const path = findShortestPath(grid, [0, 0], [2, 2]);
      expect(path).not.toBeNull();
      expect(path[0]).toEqual([0, 0]);
      expect(path[path.length - 1]).toEqual([2, 2]);
    });

    it('returns null when no path exists', () => {
      const grid = [
        [0, 1, 0],
        [0, 1, 0],
        [0, 1, 0],
      ];
      const path = findShortestPath(grid, [0, 0], [0, 2]);
      expect(path).toBeNull();
    });

    it('finds shortest path', () => {
      const grid = [
        [0, 0, 0],
        [0, 0, 0],
        [0, 0, 0],
      ];
      const path = findShortestPath(grid, [0, 0], [2, 2]);
      // Manhattan distance is 4, so path length should be 5
      expect(path).toHaveLength(5);
    });
  });
});

describe('Notes Serialization', () => {
  it('converts notes to JSON and back', () => {
    const original = {
      '0,0': new Set([1, 2, 3]),
      '1,1': new Set([4, 5]),
    };
    const json = notesToJSON(original);
    expect(json['0,0']).toEqual([1, 2, 3]);

    const restored = notesFromJSON(json);
    expect(restored['0,0'].has(1)).toBe(true);
    expect(restored['0,0'].has(2)).toBe(true);
    expect(restored['0,0'].has(3)).toBe(true);
  });

  it('handles empty notes', () => {
    expect(notesFromJSON(null)).toEqual({});
    expect(notesFromJSON({})).toEqual({});
  });
});

describe('Dataset Selection', () => {
  const puzzles = [
    { id: 1, difficulty: 'easy', size: 5 },
    { id: 2, difficulty: 'easy', size: 7 },
    { id: 3, difficulty: 'medium', size: 5 },
    { id: 4, difficulty: 'hard', size: 5 },
  ];

  it('selects puzzle matching all filters', () => {
    const result = selectPuzzleFromDataset(puzzles, { difficulty: 'easy', size: 5 }, 12345);
    expect(result.difficulty).toBe('easy');
    expect(result.size).toBe(5);
  });

  it('falls back gracefully when filter too restrictive', () => {
    const result = selectPuzzleFromDataset(puzzles, { difficulty: 'expert' }, 12345);
    expect(result).not.toBeNull();
  });

  it('returns deterministic results with same seed', () => {
    const result1 = selectPuzzleFromDataset(puzzles, {}, 12345);
    const result2 = selectPuzzleFromDataset(puzzles, {}, 12345);
    expect(result1.id).toBe(result2.id);
  });

  it('handles empty puzzle list', () => {
    expect(selectPuzzleFromDataset([], {}, 12345)).toBeNull();
    expect(selectPuzzleFromDataset(null, {}, 12345)).toBeNull();
  });
});

describe('Latin Square Generation', () => {
  it('generates valid Latin square', () => {
    const random = createSeededRandom(42);
    const square = generateLatinSquare(5, random);

    expect(square).toHaveLength(5);
    expect(square[0]).toHaveLength(5);

    // Check rows have 1-5
    for (const row of square) {
      const sorted = [...row].sort((a, b) => a - b);
      expect(sorted).toEqual([1, 2, 3, 4, 5]);
    }

    // Check columns have 1-5
    for (let c = 0; c < 5; c++) {
      const col = square.map(row => row[c]).sort((a, b) => a - b);
      expect(col).toEqual([1, 2, 3, 4, 5]);
    }
  });

  it('produces deterministic results with same seed', () => {
    const random1 = createSeededRandom(42);
    const random2 = createSeededRandom(42);
    const square1 = generateLatinSquare(4, random1);
    const square2 = generateLatinSquare(4, random2);
    expect(square1).toEqual(square2);
  });
});

describe('Constraint Validation', () => {
  const grid = [
    [1, 2, 3],
    [4, 5, 6],
    [7, 8, 9],
  ];

  describe('isValidInRow', () => {
    it('returns true when value not in row', () => {
      expect(isValidInRow(grid, 0, 0, 9)).toBe(true);
    });

    it('returns false when value already in row', () => {
      expect(isValidInRow(grid, 0, 0, 2)).toBe(false);
    });
  });

  describe('isValidInColumn', () => {
    it('returns true when value not in column', () => {
      expect(isValidInColumn(grid, 0, 0, 9)).toBe(true);
    });

    it('returns false when value already in column', () => {
      expect(isValidInColumn(grid, 0, 0, 4)).toBe(false);
    });
  });

  describe('isValidPlacement', () => {
    it('returns true when valid in both row and column', () => {
      const testGrid = [
        [1, 0, 0],
        [0, 0, 0],
        [0, 0, 0],
      ];
      expect(isValidPlacement(testGrid, 1, 1, 2)).toBe(true);
    });

    it('returns false when invalid in row', () => {
      const testGrid = [
        [1, 2, 0],
        [0, 0, 0],
        [0, 0, 0],
      ];
      expect(isValidPlacement(testGrid, 0, 2, 2)).toBe(false);
    });
  });
});

describe('Backtracking Solver', () => {
  it('solves simple puzzle', () => {
    // 2x2 grid where we need to fill in 0s with 1 or 2, no duplicates in rows/cols
    const grid = [
      [0, 2],
      [2, 0],
    ];

    const getEmpty = (g) => findCells(g, v => v === 0);
    const getValues = () => [1];
    const isValid = (g, r, c, v) => isValidPlacement(g, r, c, v);

    const solutions = solveWithBacktracking(grid, getEmpty, getValues, isValid);
    expect(solutions).toHaveLength(1);
    expect(solutions[0]).toEqual([[1, 2], [2, 1]]);
  });

  it('respects maxSolutions limit', () => {
    // Multiple solutions possible
    const grid = [
      [0, 0],
      [0, 0],
    ];

    const getEmpty = (g) => findCells(g, v => v === 0);
    const getValues = () => [1, 2];
    const isValid = (g, r, c, v) => isValidPlacement(g, r, c, v);

    const solutions = solveWithBacktracking(grid, getEmpty, getValues, isValid, 1);
    expect(solutions).toHaveLength(1);
  });
});

describe('Maze Generation', () => {
  it('generates valid maze', () => {
    const { maze, start, end } = generateMaze(11, 11);

    expect(maze).toHaveLength(11);
    expect(maze[0]).toHaveLength(11);
    expect(maze[start.y][start.x]).toBe(0); // Start is passable
    expect(maze[end.y][end.x]).toBe(0); // End is passable
  });

  it('has a path from start to end', () => {
    const random = createSeededRandom(42);
    const { maze, start, end } = generateMaze(11, 11, () => random());

    const path = findShortestPath(
      maze,
      [start.y, start.x],
      [end.y, end.x],
      v => v === 0
    );
    expect(path).not.toBeNull();
  });

  it('produces deterministic results with seeded random', () => {
    const random1 = createSeededRandom(42);
    const random2 = createSeededRandom(42);
    const maze1 = generateMaze(11, 11, () => random1());
    const maze2 = generateMaze(11, 11, () => random2());
    expect(maze1.maze).toEqual(maze2.maze);
  });
});

describe('Region Generation', () => {
  it('generates regions that tile the grid', () => {
    const { regionGrid, regions } = generateRegions(5, 4);

    // All cells should be assigned
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 5; c++) {
        expect(regionGrid[r][c]).toBeGreaterThanOrEqual(0);
        expect(regionGrid[r][c]).toBeLessThan(4);
      }
    }

    // Total cells in regions should equal grid size
    const totalCells = regions.reduce((sum, r) => sum + r.cells.length, 0);
    expect(totalCells).toBe(25);
  });

  it('creates connected regions', () => {
    const { regionGrid, regions } = generateRegions(5, 4);

    for (const region of regions) {
      if (region.cells.length > 1) {
        const [startR, startC] = region.cells[0];
        const connected = getConnectedRegion(
          regionGrid,
          startR,
          startC,
          (val, start) => val === start
        );
        expect(connected.length).toBe(region.cells.length);
      }
    }
  });
});

describe('Grid Utilities', () => {
  describe('has2x2Block', () => {
    it('detects 2x2 block', () => {
      const grid = [
        [1, 1, 0],
        [1, 1, 0],
        [0, 0, 0],
      ];
      expect(has2x2Block(grid, 1)).toBe(true);
    });

    it('returns false when no 2x2 block', () => {
      const grid = [
        [1, 1, 0],
        [1, 0, 1],
        [0, 1, 1],
      ];
      expect(has2x2Block(grid, 1)).toBe(false);
    });
  });

  describe('countCells', () => {
    it('counts cells matching predicate', () => {
      const grid = [
        [1, 2, 1],
        [3, 1, 4],
        [1, 5, 1],
      ];
      expect(countCells(grid, v => v === 1)).toBe(5);
    });
  });

  describe('findCells', () => {
    it('finds all cells matching predicate', () => {
      const grid = [
        [0, 1, 0],
        [1, 0, 1],
        [0, 1, 0],
      ];
      const cells = findCells(grid, v => v === 1);
      expect(cells).toHaveLength(4);
      expect(cells).toContainEqual([0, 1]);
      expect(cells).toContainEqual([1, 0]);
      expect(cells).toContainEqual([1, 2]);
      expect(cells).toContainEqual([2, 1]);
    });
  });
});
