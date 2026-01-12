import { describe, it, expect } from 'vitest';
import { createSeededRandom } from '../../data/wordUtils';

// ===========================================
// Hashi (Bridges) - Grid Creation Tests
// ===========================================
describe('Hashi - Grid Creation', () => {
  const createEmptyGrid = (rows, cols) => {
    return Array(rows).fill(null).map(() => Array(cols).fill(0));
  };

  it('should create grid of correct dimensions', () => {
    const grid = createEmptyGrid(7, 9);

    expect(grid.length).toBe(7);
    grid.forEach(row => {
      expect(row.length).toBe(9);
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
// Hashi - Island Placement Tests
// ===========================================
describe('Hashi - Island Placement', () => {
  // Islands are represented as numbers 1-8 (required bridge count)
  // 0 = empty cell, null = bridge
  const placeIsland = (grid, row, col, value) => {
    if (value < 1 || value > 8) {
      throw new Error('Island value must be 1-8');
    }
    const newGrid = grid.map(r => [...r]);
    newGrid[row][col] = value;
    return newGrid;
  };

  it('should place island with valid value', () => {
    let grid = [[0, 0], [0, 0]];
    grid = placeIsland(grid, 0, 0, 4);

    expect(grid[0][0]).toBe(4);
  });

  it('should reject invalid island values', () => {
    const grid = [[0, 0], [0, 0]];

    expect(() => placeIsland(grid, 0, 0, 0)).toThrow();
    expect(() => placeIsland(grid, 0, 0, 9)).toThrow();
  });
});

// ===========================================
// Hashi - Bridge Connection Tests
// ===========================================
describe('Hashi - Bridge Connection', () => {
  const canConnect = (grid, bridges, row1, col1, row2, col2) => {
    // Must be same row or column
    if (row1 !== row2 && col1 !== col2) return false;

    // Can't connect to self
    if (row1 === row2 && col1 === col2) return false;

    // Both endpoints must be islands
    if (grid[row1][col1] === 0 || grid[row2][col2] === 0) return false;

    // Check for obstacles in path
    if (row1 === row2) {
      const minCol = Math.min(col1, col2);
      const maxCol = Math.max(col1, col2);
      for (let c = minCol + 1; c < maxCol; c++) {
        if (grid[row1][c] !== 0) return false; // Island in way
      }
    } else {
      const minRow = Math.min(row1, row2);
      const maxRow = Math.max(row1, row2);
      for (let r = minRow + 1; r < maxRow; r++) {
        if (grid[r][col1] !== 0) return false; // Island in way
      }
    }

    // Check existing bridge count
    const key = `${row1},${col1}-${row2},${col2}`;
    const reverseKey = `${row2},${col2}-${row1},${col1}`;
    const existing = bridges[key] || bridges[reverseKey] || 0;

    return existing < 2; // Max 2 bridges
  };

  const grid = [
    [3, 0, 0, 2],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [2, 0, 0, 1],
  ];

  it('should allow horizontal connection', () => {
    expect(canConnect(grid, {}, 0, 0, 0, 3)).toBe(true);
  });

  it('should allow vertical connection', () => {
    expect(canConnect(grid, {}, 0, 0, 3, 0)).toBe(true);
  });

  it('should reject diagonal connection', () => {
    expect(canConnect(grid, {}, 0, 0, 3, 3)).toBe(false);
  });

  it('should allow max 2 bridges', () => {
    const bridges = { '0,0-0,3': 2 };
    expect(canConnect(grid, bridges, 0, 0, 0, 3)).toBe(false);

    const bridges1 = { '0,0-0,3': 1 };
    expect(canConnect(grid, bridges1, 0, 0, 0, 3)).toBe(true);
  });
});

// ===========================================
// Hashi - Bridge Count Validation Tests
// ===========================================
describe('Hashi - Bridge Count', () => {
  const getBridgeCount = (bridges, row, col) => {
    let count = 0;

    Object.entries(bridges).forEach(([key, num]) => {
      const [from, to] = key.split('-');
      if (from === `${row},${col}` || to === `${row},${col}`) {
        count += num;
      }
    });

    return count;
  };

  it('should count bridges connected to island', () => {
    const bridges = {
      '0,0-0,3': 2,
      '0,0-3,0': 1,
    };

    expect(getBridgeCount(bridges, 0, 0)).toBe(3);
    expect(getBridgeCount(bridges, 0, 3)).toBe(2);
    expect(getBridgeCount(bridges, 3, 0)).toBe(1);
  });

  it('should return 0 for island with no bridges', () => {
    const bridges = { '0,0-0,3': 2 };
    expect(getBridgeCount(bridges, 3, 3)).toBe(0);
  });
});

// ===========================================
// Hashi - Island Satisfaction Tests
// ===========================================
describe('Hashi - Island Satisfaction', () => {
  const isIslandSatisfied = (grid, bridges, row, col) => {
    const required = grid[row][col];
    if (required === 0) return true; // Not an island

    let count = 0;
    Object.entries(bridges).forEach(([key, num]) => {
      const [from, to] = key.split('-');
      if (from === `${row},${col}` || to === `${row},${col}`) {
        count += num;
      }
    });

    return count === required;
  };

  const grid = [
    [3, 0, 0, 2],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [2, 0, 0, 1],
  ];

  it('should detect satisfied island', () => {
    const bridges = {
      '0,0-0,3': 2,
      '0,0-3,0': 1,
    };

    expect(isIslandSatisfied(grid, bridges, 0, 0)).toBe(true); // Needs 3, has 3
    expect(isIslandSatisfied(grid, bridges, 0, 3)).toBe(true); // Needs 2, has 2
  });

  it('should detect unsatisfied island', () => {
    const bridges = { '0,0-0,3': 1 };

    expect(isIslandSatisfied(grid, bridges, 0, 0)).toBe(false); // Needs 3, has 1
    expect(isIslandSatisfied(grid, bridges, 0, 3)).toBe(false); // Needs 2, has 1
  });
});

// ===========================================
// Hashi - Connectivity Tests
// ===========================================
describe('Hashi - Connectivity', () => {
  const findIslands = (grid) => {
    const islands = [];
    for (let r = 0; r < grid.length; r++) {
      for (let c = 0; c < grid[r].length; c++) {
        if (grid[r][c] > 0) {
          islands.push([r, c]);
        }
      }
    }
    return islands;
  };

  const areAllConnected = (grid, bridges) => {
    const islands = findIslands(grid);
    if (islands.length === 0) return true;

    const visited = new Set();
    const queue = [islands[0].join(',')];

    while (queue.length > 0) {
      const current = queue.shift();
      if (visited.has(current)) continue;
      visited.add(current);

      // Find connected islands
      Object.entries(bridges).forEach(([key, num]) => {
        if (num === 0) return;
        const [from, to] = key.split('-');
        if (from === current && !visited.has(to)) queue.push(to);
        if (to === current && !visited.has(from)) queue.push(from);
      });
    }

    return visited.size === islands.length;
  };

  const grid = [
    [2, 0, 2],
    [0, 0, 0],
    [2, 0, 2],
  ];

  it('should detect fully connected islands', () => {
    const bridges = {
      '0,0-0,2': 1,
      '0,0-2,0': 1,
      '0,2-2,2': 1,
      '2,0-2,2': 1,
    };

    expect(areAllConnected(grid, bridges)).toBe(true);
  });

  it('should detect disconnected islands', () => {
    const bridges = {
      '0,0-0,2': 1,
      '2,0-2,2': 1,
    };

    expect(areAllConnected(grid, bridges)).toBe(false);
  });
});

// ===========================================
// Hashi - Win Condition Tests
// ===========================================
describe('Hashi - Win Condition', () => {
  const isPuzzleSolved = (grid, bridges) => {
    // All islands must be satisfied
    for (let r = 0; r < grid.length; r++) {
      for (let c = 0; c < grid[r].length; c++) {
        if (grid[r][c] > 0) {
          let count = 0;
          const key1 = `${r},${c}`;
          Object.entries(bridges).forEach(([bridgeKey, num]) => {
            const [from, to] = bridgeKey.split('-');
            if (from === key1 || to === key1) count += num;
          });
          if (count !== grid[r][c]) return false;
        }
      }
    }

    // All islands must be connected
    const islands = [];
    for (let r = 0; r < grid.length; r++) {
      for (let c = 0; c < grid[r].length; c++) {
        if (grid[r][c] > 0) islands.push(`${r},${c}`);
      }
    }

    if (islands.length === 0) return true;

    const visited = new Set();
    const queue = [islands[0]];

    while (queue.length > 0) {
      const current = queue.shift();
      if (visited.has(current)) continue;
      visited.add(current);

      Object.entries(bridges).forEach(([key, num]) => {
        if (num === 0) return;
        const [from, to] = key.split('-');
        if (from === current && !visited.has(to)) queue.push(to);
        if (to === current && !visited.has(from)) queue.push(from);
      });
    }

    return visited.size === islands.length;
  };

  it('should detect solved puzzle', () => {
    const grid = [[2, 0, 2]];
    const bridges = { '0,0-0,2': 2 };

    expect(isPuzzleSolved(grid, bridges)).toBe(true);
  });

  it('should reject incomplete puzzle', () => {
    const grid = [[2, 0, 2]];
    const bridges = { '0,0-0,2': 1 };

    expect(isPuzzleSolved(grid, bridges)).toBe(false);
  });
});
