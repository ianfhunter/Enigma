import { describe, it, expect } from 'vitest';

// ===========================================
// Suguru - Adjacent Number Check Tests
// ===========================================
describe('Suguru - Adjacent Number Validation', () => {
  function checkNoTouchingSameNumbers(grid, size) {
    const errors = new Set();

    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (grid[r][c] === 0) continue;

        // Check all 8 neighbors
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            if (dr === 0 && dc === 0) continue;
            const nr = r + dr;
            const nc = c + dc;
            if (nr >= 0 && nr < size && nc >= 0 && nc < size) {
              if (grid[nr][nc] === grid[r][c]) {
                errors.add(`${r},${c}`);
                errors.add(`${nr},${nc}`);
              }
            }
          }
        }
      }
    }

    return errors;
  }

  it('should detect horizontally adjacent same numbers', () => {
    const grid = [
      [1, 1, 2],
      [2, 3, 1],
      [3, 1, 2],
    ];

    const errors = checkNoTouchingSameNumbers(grid, 3);
    expect(errors.has('0,0')).toBe(true);
    expect(errors.has('0,1')).toBe(true);
  });

  it('should detect vertically adjacent same numbers', () => {
    const grid = [
      [1, 2, 3],
      [1, 3, 2],
      [2, 1, 1],
    ];

    const errors = checkNoTouchingSameNumbers(grid, 3);
    expect(errors.has('0,0')).toBe(true);
    expect(errors.has('1,0')).toBe(true);
  });

  it('should detect diagonally adjacent same numbers', () => {
    const grid = [
      [1, 2, 3],
      [2, 1, 2],
      [3, 2, 1],
    ];

    const errors = checkNoTouchingSameNumbers(grid, 3);
    // 1s at (0,0), (1,1), (2,2) are diagonally adjacent
    expect(errors.has('0,0')).toBe(true);
    expect(errors.has('1,1')).toBe(true);
    expect(errors.has('2,2')).toBe(true);
  });

  it('should allow non-adjacent same numbers', () => {
    const grid = [
      [1, 2, 1],
      [3, 4, 3],
      [1, 2, 1],
    ];

    const errors = checkNoTouchingSameNumbers(grid, 3);
    expect(errors.size).toBe(0);
  });

  it('should ignore empty cells', () => {
    const grid = [
      [1, 0, 1],
      [0, 0, 0],
      [1, 0, 1],
    ];

    const errors = checkNoTouchingSameNumbers(grid, 3);
    expect(errors.size).toBe(0);
  });
});

// ===========================================
// Suguru - Region Constraint Tests
// ===========================================
describe('Suguru - Region Constraints', () => {
  function checkRegionConstraints(grid, regions, size) {
    const errors = new Set();

    for (const region of regions) {
      const seen = new Set();
      for (const [r, c] of region.cells) {
        if (grid[r][c] === 0) continue;

        // Number exceeds region size
        if (grid[r][c] > region.size) {
          errors.add(`${r},${c}`);
        }

        // Duplicate in region
        if (seen.has(grid[r][c])) {
          for (const [rr, cc] of region.cells) {
            if (grid[rr][cc] === grid[r][c]) {
              errors.add(`${rr},${cc}`);
            }
          }
        }
        seen.add(grid[r][c]);
      }
    }

    return errors;
  }

  it('should detect numbers exceeding region size', () => {
    const grid = [
      [4, 2],  // 4 is too big for region of size 3
      [1, 3],
    ];
    const regions = [
      { id: 0, cells: [[0, 0], [0, 1], [1, 0]], size: 3 },
      { id: 1, cells: [[1, 1]], size: 1 },
    ];

    const errors = checkRegionConstraints(grid, regions, 2);
    expect(errors.has('0,0')).toBe(true);
  });

  it('should detect duplicate numbers in region', () => {
    const grid = [
      [1, 2],
      [1, 3],
    ];
    const regions = [
      { id: 0, cells: [[0, 0], [0, 1], [1, 0]], size: 3 },
      { id: 1, cells: [[1, 1]], size: 1 },
    ];

    const errors = checkRegionConstraints(grid, regions, 2);
    expect(errors.has('0,0')).toBe(true);
    expect(errors.has('1,0')).toBe(true);
  });

  it('should allow valid region placement', () => {
    const grid = [
      [1, 2],
      [3, 1],
    ];
    const regions = [
      { id: 0, cells: [[0, 0], [0, 1], [1, 0]], size: 3 },
      { id: 1, cells: [[1, 1]], size: 1 },
    ];

    const errors = checkRegionConstraints(grid, regions, 2);
    expect(errors.size).toBe(0);
  });
});

// ===========================================
// Suguru - Solution Check Tests
// ===========================================
describe('Suguru - Solution Check', () => {
  function checkSolved(grid, solution, size) {
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
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
      [3, 2, 2],  // Wrong value
      [2, 3, 1],
    ];

    expect(checkSolved(grid, solution, 3)).toBe(false);
  });

  it('should detect incomplete grid', () => {
    const solution = [
      [1, 2, 3],
      [3, 1, 2],
      [2, 3, 1],
    ];
    const grid = [
      [1, 2, 3],
      [3, 0, 2],  // Empty cell
      [2, 3, 1],
    ];

    expect(checkSolved(grid, solution, 3)).toBe(false);
  });
});

// ===========================================
// Suguru - Region Border Tests
// ===========================================
describe('Suguru - Region Border Detection', () => {
  function getRegionBorders(r, c, regionGrid, size) {
    const regionId = regionGrid[r][c];
    const borders = [];

    if (r === 0 || regionGrid[r-1][c] !== regionId) borders.push('top');
    if (r === size - 1 || regionGrid[r+1][c] !== regionId) borders.push('bottom');
    if (c === 0 || regionGrid[r][c-1] !== regionId) borders.push('left');
    if (c === size - 1 || regionGrid[r][c+1] !== regionId) borders.push('right');

    return borders;
  }

  it('should detect all borders for corner cell', () => {
    const regionGrid = [
      [0, 0, 1],
      [0, 1, 1],
      [2, 2, 1],
    ];

    const borders = getRegionBorders(0, 0, regionGrid, 3);
    expect(borders).toContain('top');
    expect(borders).toContain('left');
  });

  it('should detect border between different regions', () => {
    const regionGrid = [
      [0, 1],
      [0, 1],
    ];

    const borders = getRegionBorders(0, 0, regionGrid, 2);
    expect(borders).toContain('right'); // Border with region 1
    expect(borders).not.toContain('bottom'); // Same region below
  });

  it('should have no internal borders', () => {
    const regionGrid = [
      [0, 0, 0],
      [0, 0, 0],
      [0, 0, 0],
    ];

    // Center cell should only have no borders (all neighbors same region)
    const borders = getRegionBorders(1, 1, regionGrid, 3);
    expect(borders.length).toBe(0);
  });
});
