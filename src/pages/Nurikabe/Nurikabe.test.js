import { describe, it, expect } from 'vitest';
import {
  GRID_SIZES,
  checkValidity,
  checkSolved,
} from './Nurikabe.jsx';

describe('Nurikabe - metadata', () => {
  it('exposes grid sizes', () => {
    expect(Object.keys(GRID_SIZES)).toContain('5×5');
  });
});

describe('Nurikabe - validation', () => {
  it('checkValidity flags 2x2 sea blocks and multiple numbers', () => {
    const grid = [
      [null, 1],
      [1, null],
    ];
    const shaded = [
      [true, true],
      [true, true],
    ];
    const errors = checkValidity(grid, shaded);
    expect(errors.size).toBeGreaterThan(0);
  });

  it('checkSolved enforces island sizes, single numbers, and sea connectivity', () => {
    const grid = [
      [1, null],
      [null, null],
    ];

    // Island is too large for the clue value (size 2 vs clue 1)
    const oversizedIsland = [
      [false, false],
      [true, true],
    ];
    expect(checkSolved(grid, oversizedIsland)).toBe(false);

    // Correctly solved: one-cell island with clue and connected sea
    const solvedShaded = [
      [false, true],
      [true, true],
    ];
    expect(checkSolved(grid, solvedShaded)).toBe(true);
  });
});
import { describe, it, expect } from 'vitest';
import { createSeededRandom } from '../../data/wordUtils';

// ===========================================
// Nurikabe - Grid Creation Tests
// ===========================================
describe('Nurikabe - Grid Creation', () => {
  // Cell states: null = empty, 'wall' = black/wall, 'island' = white/island
  const createEmptyGrid = (rows, cols) => {
    return Array(rows).fill(null).map(() => Array(cols).fill(null));
  };

  it('should create grid of correct dimensions', () => {
    const grid = createEmptyGrid(7, 7);

    expect(grid.length).toBe(7);
    grid.forEach(row => {
      expect(row.length).toBe(7);
    });
  });

  it('should initialize all cells as null (unmarked)', () => {
    const grid = createEmptyGrid(4, 4);

    grid.flat().forEach(cell => {
      expect(cell).toBeNull();
    });
  });
});

// ===========================================
// Nurikabe - Clue Placement Tests
// ===========================================
describe('Nurikabe - Clue Placement', () => {
  // Clues are numbers indicating island size
  const placeClue = (clues, row, col, value) => {
    return [...clues, { row, col, value }];
  };

  const hasClueAt = (clues, row, col) => {
    return clues.some(c => c.row === row && c.col === col);
  };

  it('should add clue to list', () => {
    let clues = [];
    clues = placeClue(clues, 0, 0, 3);

    expect(clues).toHaveLength(1);
    expect(clues[0]).toEqual({ row: 0, col: 0, value: 3 });
  });

  it('should check for clue at position', () => {
    const clues = [{ row: 0, col: 0, value: 3 }];

    expect(hasClueAt(clues, 0, 0)).toBe(true);
    expect(hasClueAt(clues, 1, 1)).toBe(false);
  });
});

// ===========================================
// Nurikabe - Cell Marking Tests
// ===========================================
describe('Nurikabe - Cell Marking', () => {
  const markCell = (grid, row, col, state) => {
    const newGrid = grid.map(r => [...r]);
    newGrid[row][col] = state;
    return newGrid;
  };

  const cycleCell = (grid, row, col) => {
    const current = grid[row][col];
    const states = [null, 'wall', 'island'];
    const currentIndex = states.indexOf(current);
    const nextIndex = (currentIndex + 1) % states.length;
    return markCell(grid, row, col, states[nextIndex]);
  };

  it('should mark cell as wall', () => {
    let grid = [[null, null], [null, null]];
    grid = markCell(grid, 0, 0, 'wall');

    expect(grid[0][0]).toBe('wall');
  });

  it('should mark cell as island', () => {
    let grid = [[null, null], [null, null]];
    grid = markCell(grid, 0, 0, 'island');

    expect(grid[0][0]).toBe('island');
  });

  it('should cycle through states', () => {
    let grid = [[null]];

    grid = cycleCell(grid, 0, 0);
    expect(grid[0][0]).toBe('wall');

    grid = cycleCell(grid, 0, 0);
    expect(grid[0][0]).toBe('island');

    grid = cycleCell(grid, 0, 0);
    expect(grid[0][0]).toBeNull();
  });
});

// ===========================================
// Nurikabe - Island Region Tests
// ===========================================
describe('Nurikabe - Island Region', () => {
  const findIslandRegion = (grid, clues, startRow, startCol) => {
    const visited = new Set();
    const region = [];
    const queue = [[startRow, startCol]];

    while (queue.length > 0) {
      const [r, c] = queue.shift();
      const key = `${r},${c}`;

      if (visited.has(key)) continue;
      if (r < 0 || r >= grid.length || c < 0 || c >= grid[0].length) continue;

      // Must be island or clue cell
      const isClue = clues.some(cl => cl.row === r && cl.col === c);
      if (grid[r][c] !== 'island' && !isClue) continue;

      visited.add(key);
      region.push([r, c]);

      queue.push([r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]);
    }

    return region;
  };

  it('should find connected island cells', () => {
    const grid = [
      ['island', 'island', 'wall'],
      ['wall', 'island', 'wall'],
      ['wall', 'wall', 'wall'],
    ];
    const clues = [{ row: 0, col: 0, value: 3 }];

    const region = findIslandRegion(grid, clues, 0, 0);
    expect(region).toHaveLength(3);
  });

  it('should not cross walls', () => {
    const grid = [
      ['island', 'wall', 'island'],
      ['island', 'wall', 'island'],
    ];
    const clues = [];

    const region = findIslandRegion(grid, clues, 0, 0);
    expect(region).toHaveLength(2);
  });
});

// ===========================================
// Nurikabe - Wall Connectivity Tests
// ===========================================
describe('Nurikabe - Wall Connectivity', () => {
  const areWallsConnected = (grid) => {
    // Find first wall cell
    let startWall = null;
    for (let r = 0; r < grid.length && !startWall; r++) {
      for (let c = 0; c < grid[0].length && !startWall; c++) {
        if (grid[r][c] === 'wall') {
          startWall = [r, c];
        }
      }
    }

    if (!startWall) return true; // No walls

    // Count all walls via BFS
    const visited = new Set();
    const queue = [startWall];
    let connectedCount = 0;

    while (queue.length > 0) {
      const [r, c] = queue.shift();
      const key = `${r},${c}`;

      if (visited.has(key)) continue;
      if (r < 0 || r >= grid.length || c < 0 || c >= grid[0].length) continue;
      if (grid[r][c] !== 'wall') continue;

      visited.add(key);
      connectedCount++;

      queue.push([r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]);
    }

    // Count total walls
    let totalWalls = 0;
    grid.forEach(row => {
      row.forEach(cell => {
        if (cell === 'wall') totalWalls++;
      });
    });

    return connectedCount === totalWalls;
  };

  it('should detect connected walls', () => {
    const grid = [
      ['island', 'wall', 'wall'],
      ['wall', 'wall', 'island'],
      ['wall', 'island', 'island'],
    ];

    expect(areWallsConnected(grid)).toBe(true);
  });

  it('should detect disconnected walls', () => {
    const grid = [
      ['wall', 'island', 'wall'],
      ['island', 'island', 'island'],
      ['wall', 'island', 'wall'],
    ];

    expect(areWallsConnected(grid)).toBe(false);
  });
});

// ===========================================
// Nurikabe - 2x2 Wall Check Tests
// ===========================================
describe('Nurikabe - 2x2 Wall Rule', () => {
  const has2x2Wall = (grid) => {
    for (let r = 0; r < grid.length - 1; r++) {
      for (let c = 0; c < grid[0].length - 1; c++) {
        if (grid[r][c] === 'wall' &&
            grid[r][c + 1] === 'wall' &&
            grid[r + 1][c] === 'wall' &&
            grid[r + 1][c + 1] === 'wall') {
          return true;
        }
      }
    }
    return false;
  };

  it('should detect 2x2 wall', () => {
    const grid = [
      ['wall', 'wall', 'island'],
      ['wall', 'wall', 'island'],
      ['island', 'island', 'island'],
    ];

    expect(has2x2Wall(grid)).toBe(true);
  });

  it('should not flag valid configuration', () => {
    const grid = [
      ['wall', 'island', 'wall'],
      ['wall', 'wall', 'wall'],
      ['island', 'wall', 'island'],
    ];

    expect(has2x2Wall(grid)).toBe(false);
  });
});

// ===========================================
// Nurikabe - Win Condition Tests
// ===========================================
describe('Nurikabe - Win Condition', () => {
  const isPuzzleSolved = (grid, clues) => {
    // 1. All cells must be marked
    for (let r = 0; r < grid.length; r++) {
      for (let c = 0; c < grid[0].length; c++) {
        const isClue = clues.some(cl => cl.row === r && cl.col === c);
        if (!isClue && grid[r][c] === null) return false;
      }
    }

    // 2. No 2x2 walls
    for (let r = 0; r < grid.length - 1; r++) {
      for (let c = 0; c < grid[0].length - 1; c++) {
        const allWalls = [
          grid[r][c], grid[r][c + 1], grid[r + 1][c], grid[r + 1][c + 1]
        ].every(cell => cell === 'wall');

        // Handle clue cells (they're treated as island)
        const hasClue = clues.some(cl =>
          (cl.row === r && cl.col === c) ||
          (cl.row === r && cl.col === c + 1) ||
          (cl.row === r + 1 && cl.col === c) ||
          (cl.row === r + 1 && cl.col === c + 1)
        );

        if (allWalls && !hasClue) return false;
      }
    }

    // 3. Each island has exactly one clue and correct size
    const visited = new Set();

    for (const clue of clues) {
      const region = [];
      const queue = [[clue.row, clue.col]];

      while (queue.length > 0) {
        const [r, c] = queue.shift();
        const key = `${r},${c}`;

        if (visited.has(key)) continue;
        if (r < 0 || r >= grid.length || c < 0 || c >= grid[0].length) continue;

        const isClue = clues.some(cl => cl.row === r && cl.col === c);
        if (grid[r][c] !== 'island' && !isClue) continue;

        visited.add(key);
        region.push([r, c]);

        queue.push([r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]);
      }

      if (region.length !== clue.value) return false;

      // Check only one clue in region
      const cluesInRegion = clues.filter(cl =>
        region.some(([r, c]) => r === cl.row && c === cl.col)
      );
      if (cluesInRegion.length !== 1) return false;
    }

    return true;
  };

  it('should detect solved puzzle', () => {
    const grid = [
      ['island', 'wall'],
      ['wall', 'island'],
    ];
    const clues = [
      { row: 0, col: 0, value: 1 },
      { row: 1, col: 1, value: 1 },
    ];

    expect(isPuzzleSolved(grid, clues)).toBe(true);
  });

  it('should reject puzzle with unmarked cells', () => {
    const grid = [
      ['island', null],
      ['wall', 'island'],
    ];
    const clues = [{ row: 0, col: 0, value: 1 }];

    expect(isPuzzleSolved(grid, clues)).toBe(false);
  });
});
