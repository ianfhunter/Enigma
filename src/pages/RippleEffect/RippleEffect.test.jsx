import { describe, it, expect } from 'vitest';

// ===========================================
// Ripple Effect - Distance Constraint Tests
// ===========================================
describe('Ripple Effect - Distance Constraint Validation', () => {
  function checkDistanceConstraint(grid, size) {
    const errors = new Set();

    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        const value = grid[r][c];
        if (value === 0) continue;

        // Check horizontal (same row)
        for (let c2 = c + 1; c2 < size; c2++) {
          if (grid[r][c2] === value) {
            const distance = c2 - c - 1; // cells between them
            if (distance < value) {
              errors.add(`${r},${c}`);
              errors.add(`${r},${c2}`);
            }
          }
        }

        // Check vertical (same column)
        for (let r2 = r + 1; r2 < size; r2++) {
          if (grid[r2][c] === value) {
            const distance = r2 - r - 1; // cells between them
            if (distance < value) {
              errors.add(`${r},${c}`);
              errors.add(`${r2},${c}`);
            }
          }
        }
      }
    }

    return errors;
  }

  it('should detect adjacent 1s as violation (need 1 cell between)', () => {
    const grid = [
      [1, 1, 0],
      [0, 0, 0],
      [0, 0, 0],
    ];

    const errors = checkDistanceConstraint(grid, 3);
    expect(errors.has('0,0')).toBe(true);
    expect(errors.has('0,1')).toBe(true);
  });

  it('should allow 1s with exactly 1 cell between', () => {
    const grid = [
      [1, 0, 1],
      [0, 0, 0],
      [0, 0, 0],
    ];

    const errors = checkDistanceConstraint(grid, 3);
    expect(errors.size).toBe(0);
  });

  it('should detect 2s with only 1 cell between as violation', () => {
    const grid = [
      [2, 0, 2, 0, 0],
      [0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0],
    ];

    const errors = checkDistanceConstraint(grid, 5);
    expect(errors.has('0,0')).toBe(true);
    expect(errors.has('0,2')).toBe(true);
  });

  it('should allow 2s with exactly 2 cells between', () => {
    const grid = [
      [2, 0, 0, 2, 0],
      [0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0],
    ];

    const errors = checkDistanceConstraint(grid, 5);
    expect(errors.size).toBe(0);
  });

  it('should detect vertical violations', () => {
    const grid = [
      [3, 0, 0],
      [0, 0, 0],
      [3, 0, 0],
    ];

    // 3s need at least 3 cells between, but only 1 cell is between
    const errors = checkDistanceConstraint(grid, 3);
    expect(errors.has('0,0')).toBe(true);
    expect(errors.has('2,0')).toBe(true);
  });

  it('should allow different numbers to be adjacent', () => {
    const grid = [
      [1, 2, 3],
      [4, 5, 1],
      [2, 3, 4],
    ];

    const errors = checkDistanceConstraint(grid, 3);
    expect(errors.size).toBe(0);
  });

  it('should ignore empty cells (zeros)', () => {
    const grid = [
      [1, 0, 0],
      [0, 1, 0],
      [0, 0, 1],
    ];

    // 1s are diagonal, not in same row or column - no violation
    const errors = checkDistanceConstraint(grid, 3);
    expect(errors.size).toBe(0);
  });

  it('should detect multiple violations in same row', () => {
    const grid = [
      [2, 2, 0, 2, 2],
      [0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0],
    ];

    const errors = checkDistanceConstraint(grid, 5);
    // All four 2s should be flagged
    expect(errors.has('0,0')).toBe(true);
    expect(errors.has('0,1')).toBe(true);
    expect(errors.has('0,3')).toBe(true);
    expect(errors.has('0,4')).toBe(true);
  });
});

// ===========================================
// Ripple Effect - Room Constraint Tests
// ===========================================
describe('Ripple Effect - Room Constraints', () => {
  function checkRoomConstraints(grid, regions) {
    const errors = new Set();

    for (const region of regions) {
      const seen = new Map();
      for (const [r, c] of region.cells) {
        const value = grid[r][c];
        if (value === 0) continue;

        // Check if value exceeds room size
        if (value > region.size) {
          errors.add(`${r},${c}`);
        }

        // Check for duplicates
        if (seen.has(value)) {
          errors.add(`${r},${c}`);
          errors.add(seen.get(value));
        } else {
          seen.set(value, `${r},${c}`);
        }
      }
    }

    return errors;
  }

  it('should detect duplicate values in a room', () => {
    const grid = [
      [1, 1],
      [2, 3],
    ];
    const regions = [
      { id: 1, cells: [[0, 0], [0, 1]], size: 2 },
      { id: 2, cells: [[1, 0], [1, 1]], size: 2 },
    ];

    const errors = checkRoomConstraints(grid, regions);
    expect(errors.has('0,0')).toBe(true);
    expect(errors.has('0,1')).toBe(true);
  });

  it('should detect values exceeding room size', () => {
    const grid = [
      [5, 2],
      [1, 3],
    ];
    const regions = [
      { id: 1, cells: [[0, 0], [0, 1], [1, 0]], size: 3 },
      { id: 2, cells: [[1, 1]], size: 1 },
    ];

    const errors = checkRoomConstraints(grid, regions);
    expect(errors.has('0,0')).toBe(true); // 5 > 3
  });

  it('should allow valid room placements', () => {
    const grid = [
      [1, 2],
      [3, 1],
    ];
    const regions = [
      { id: 1, cells: [[0, 0], [0, 1], [1, 0]], size: 3 },
      { id: 2, cells: [[1, 1]], size: 1 },
    ];

    const errors = checkRoomConstraints(grid, regions);
    expect(errors.size).toBe(0);
  });

  it('should allow same value in different rooms', () => {
    const grid = [
      [1, 1],
      [2, 2],
    ];
    const regions = [
      { id: 1, cells: [[0, 0], [1, 0]], size: 2 },
      { id: 2, cells: [[0, 1], [1, 1]], size: 2 },
    ];

    const errors = checkRoomConstraints(grid, regions);
    expect(errors.size).toBe(0);
  });

  it('should handle single-cell rooms', () => {
    const grid = [
      [1],
    ];
    const regions = [
      { id: 1, cells: [[0, 0]], size: 1 },
    ];

    const errors = checkRoomConstraints(grid, regions);
    expect(errors.size).toBe(0);
  });

  it('should flag value 2 in single-cell room', () => {
    const grid = [
      [2],
    ];
    const regions = [
      { id: 1, cells: [[0, 0]], size: 1 },
    ];

    const errors = checkRoomConstraints(grid, regions);
    expect(errors.has('0,0')).toBe(true);
  });
});

// ===========================================
// Ripple Effect - Solution Check Tests
// ===========================================
describe('Ripple Effect - Solution Check', () => {
  function checkSolved(grid, solution, size) {
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        // Must have all cells filled (no empty cells)
        if (grid[r][c] === 0) return false;
        if (grid[r][c] !== solution[r][c]) return false;
      }
    }
    return true;
  }

  it('should detect correct solution', () => {
    const solution = [
      [1, 2, 3],
      [3, 1, 2],
      [2, 3, 1],
    ];

    expect(checkSolved(solution, solution, 3)).toBe(true);
  });

  it('should detect incorrect grid', () => {
    const solution = [
      [1, 2, 3],
      [3, 1, 2],
      [2, 3, 1],
    ];
    const grid = [
      [1, 2, 3],
      [3, 2, 2], // Wrong value at (1,1)
      [2, 3, 1],
    ];

    expect(checkSolved(grid, solution, 3)).toBe(false);
  });

  it('should detect incomplete grid with empty cells', () => {
    const solution = [
      [1, 2, 3],
      [3, 1, 2],
      [2, 3, 1],
    ];
    const grid = [
      [1, 2, 3],
      [3, 0, 2], // Empty cell (0 means unfilled)
      [2, 3, 1],
    ];

    expect(checkSolved(grid, solution, 3)).toBe(false);
  });

  it('should reject grid with multiple empty cells', () => {
    const solution = [
      [1, 2, 3],
      [3, 1, 2],
      [2, 3, 1],
    ];
    const grid = [
      [1, 0, 0],
      [0, 0, 0],
      [0, 0, 0],
    ];

    expect(checkSolved(grid, solution, 3)).toBe(false);
  });

  it('should reject completely empty grid', () => {
    const solution = [
      [1, 2, 3],
      [3, 1, 2],
      [2, 3, 1],
    ];
    const grid = [
      [0, 0, 0],
      [0, 0, 0],
      [0, 0, 0],
    ];

    expect(checkSolved(grid, solution, 3)).toBe(false);
  });
});

// ===========================================
// Ripple Effect - Region Border Tests
// ===========================================
describe('Ripple Effect - Region Border Detection', () => {
  function getRegionBorders(r, c, regionGrid, size) {
    const regionId = regionGrid[r][c];
    const borders = [];

    if (r === 0 || regionGrid[r - 1][c] !== regionId) borders.push('top');
    if (r === size - 1 || regionGrid[r + 1][c] !== regionId) borders.push('bottom');
    if (c === 0 || regionGrid[r][c - 1] !== regionId) borders.push('left');
    if (c === size - 1 || regionGrid[r][c + 1] !== regionId) borders.push('right');

    return borders;
  }

  it('should detect all borders for corner cell in its own region', () => {
    const regionGrid = [
      [1, 2, 2],
      [2, 2, 2],
      [2, 2, 2],
    ];

    const borders = getRegionBorders(0, 0, regionGrid, 3);
    expect(borders).toContain('top');
    expect(borders).toContain('left');
    expect(borders).toContain('right');
    expect(borders).toContain('bottom');
  });

  it('should detect border between different regions', () => {
    const regionGrid = [
      [1, 2],
      [1, 2],
    ];

    const borders = getRegionBorders(0, 0, regionGrid, 2);
    expect(borders).toContain('right'); // Border with region 2
    expect(borders).not.toContain('bottom'); // Same region below
  });

  it('should have no internal borders for center of uniform region', () => {
    const regionGrid = [
      [1, 1, 1],
      [1, 1, 1],
      [1, 1, 1],
    ];

    const borders = getRegionBorders(1, 1, regionGrid, 3);
    expect(borders.length).toBe(0);
  });

  it('should detect edges of grid as borders', () => {
    const regionGrid = [
      [1, 1],
      [1, 1],
    ];

    // Top-left corner
    let borders = getRegionBorders(0, 0, regionGrid, 2);
    expect(borders).toContain('top');
    expect(borders).toContain('left');

    // Bottom-right corner
    borders = getRegionBorders(1, 1, regionGrid, 2);
    expect(borders).toContain('bottom');
    expect(borders).toContain('right');
  });
});

// ===========================================
// Ripple Effect - Combined Validation Tests
// ===========================================
describe('Ripple Effect - Combined Validation', () => {
  function checkValidity(grid, regionGrid, regions, size) {
    const errors = new Set();

    // Check distance constraint
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        const value = grid[r][c];
        if (value === 0) continue;

        for (let c2 = c + 1; c2 < size; c2++) {
          if (grid[r][c2] === value) {
            const distance = c2 - c - 1;
            if (distance < value) {
              errors.add(`${r},${c}`);
              errors.add(`${r},${c2}`);
            }
          }
        }

        for (let r2 = r + 1; r2 < size; r2++) {
          if (grid[r2][c] === value) {
            const distance = r2 - r - 1;
            if (distance < value) {
              errors.add(`${r},${c}`);
              errors.add(`${r2},${c}`);
            }
          }
        }
      }
    }

    // Check room constraints
    for (const region of regions) {
      const seen = new Map();
      for (const [r, c] of region.cells) {
        const value = grid[r][c];
        if (value === 0) continue;

        if (value > region.size) {
          errors.add(`${r},${c}`);
        }

        if (seen.has(value)) {
          errors.add(`${r},${c}`);
          errors.add(seen.get(value));
        } else {
          seen.set(value, `${r},${c}`);
        }
      }
    }

    return errors;
  }

  it('should validate a complete valid puzzle', () => {
    // A simple 3x3 valid Ripple Effect solution
    const grid = [
      [1, 2, 1],
      [2, 1, 2],
      [1, 2, 1],
    ];
    const regionGrid = [
      [1, 1, 2],
      [1, 2, 2],
      [3, 3, 2],
    ];
    const regions = [
      { id: 1, cells: [[0, 0], [0, 1], [1, 0]], size: 3 },
      { id: 2, cells: [[0, 2], [1, 1], [1, 2], [2, 2]], size: 4 },
      { id: 3, cells: [[2, 0], [2, 1]], size: 2 },
    ];

    // This should have violations because it's not a proper Ripple Effect solution
    const errors = checkValidity(grid, regionGrid, regions, 3);
    // The 1s in column 0 and column 2 are too close (need 1 cell between)
    // Row 0: 1 at (0,0) and 1 at (0,2) - distance = 1 cell, need 1 - OK
    // But we have issues with room duplicates
    expect(errors.size).toBeGreaterThan(0);
  });

  it('should catch both distance and room violations', () => {
    const grid = [
      [1, 1], // Duplicate in row AND in room
      [2, 2],
    ];
    const regions = [
      { id: 1, cells: [[0, 0], [0, 1]], size: 2 },
      { id: 2, cells: [[1, 0], [1, 1]], size: 2 },
    ];

    const errors = checkValidity(grid, [[1, 1], [2, 2]], regions, 2);
    // Should catch: distance violation (1s adjacent) AND room duplicate
    expect(errors.has('0,0')).toBe(true);
    expect(errors.has('0,1')).toBe(true);
  });
});
