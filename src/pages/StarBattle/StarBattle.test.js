import { describe, it, expect } from 'vitest';

// ===========================================
// StarBattle - Row/Column Validation Tests
// ===========================================
describe('StarBattle - Row/Column Star Count', () => {
  function checkRowCounts(stars, starsPerUnit) {
    const size = stars.length;
    const errors = new Set();

    for (let r = 0; r < size; r++) {
      let count = 0;
      for (let c = 0; c < size; c++) {
        if (stars[r][c]) count++;
      }
      if (count > starsPerUnit) {
        for (let c = 0; c < size; c++) {
          if (stars[r][c]) errors.add(`${r},${c}`);
        }
      }
    }

    return errors;
  }

  function checkColumnCounts(stars, starsPerUnit) {
    const size = stars.length;
    const errors = new Set();

    for (let c = 0; c < size; c++) {
      let count = 0;
      for (let r = 0; r < size; r++) {
        if (stars[r][c]) count++;
      }
      if (count > starsPerUnit) {
        for (let r = 0; r < size; r++) {
          if (stars[r][c]) errors.add(`${r},${c}`);
        }
      }
    }

    return errors;
  }

  it('should detect too many stars in row', () => {
    const stars = [
      [true, true, true, false],
      [false, false, false, false],
      [false, false, false, false],
      [false, false, false, false],
    ];

    const errors = checkRowCounts(stars, 2);
    expect(errors.size).toBe(3);
  });

  it('should detect too many stars in column', () => {
    const stars = [
      [true, false, false, false],
      [true, false, false, false],
      [true, false, false, false],
      [false, false, false, false],
    ];

    const errors = checkColumnCounts(stars, 2);
    expect(errors.size).toBe(3);
  });

  it('should allow valid star count', () => {
    const stars = [
      [true, false, true, false],
      [false, true, false, true],
      [true, false, true, false],
      [false, true, false, true],
    ];

    const rowErrors = checkRowCounts(stars, 2);
    const colErrors = checkColumnCounts(stars, 2);

    expect(rowErrors.size).toBe(0);
    expect(colErrors.size).toBe(0);
  });
});

// ===========================================
// StarBattle - Adjacent Stars Tests
// ===========================================
describe('StarBattle - No Adjacent Stars', () => {
  function checkNoAdjacentStars(stars) {
    const size = stars.length;
    const errors = new Set();

    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (!stars[r][c]) continue;

        // Check all 8 neighbors
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            if (dr === 0 && dc === 0) continue;
            const nr = r + dr, nc = c + dc;
            if (nr >= 0 && nr < size && nc >= 0 && nc < size && stars[nr][nc]) {
              errors.add(`${r},${c}`);
              errors.add(`${nr},${nc}`);
            }
          }
        }
      }
    }

    return errors;
  }

  it('should detect horizontally adjacent stars', () => {
    const stars = [
      [true, true, false],
      [false, false, false],
      [false, false, false],
    ];

    const errors = checkNoAdjacentStars(stars);
    expect(errors.has('0,0')).toBe(true);
    expect(errors.has('0,1')).toBe(true);
  });

  it('should detect vertically adjacent stars', () => {
    const stars = [
      [true, false, false],
      [true, false, false],
      [false, false, false],
    ];

    const errors = checkNoAdjacentStars(stars);
    expect(errors.has('0,0')).toBe(true);
    expect(errors.has('1,0')).toBe(true);
  });

  it('should detect diagonally adjacent stars', () => {
    const stars = [
      [true, false, false],
      [false, true, false],
      [false, false, false],
    ];

    const errors = checkNoAdjacentStars(stars);
    expect(errors.has('0,0')).toBe(true);
    expect(errors.has('1,1')).toBe(true);
  });

  it('should allow non-adjacent stars', () => {
    const stars = [
      [true, false, true],
      [false, false, false],
      [true, false, true],
    ];

    const errors = checkNoAdjacentStars(stars);
    expect(errors.size).toBe(0);
  });
});

// ===========================================
// StarBattle - Region Validation Tests
// ===========================================
describe('StarBattle - Region Star Count', () => {
  function checkRegionCounts(stars, regions, starsPerUnit) {
    const size = stars.length;
    const errors = new Set();

    const regionCounts = {};
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (stars[r][c]) {
          const region = regions[r][c];
          regionCounts[region] = (regionCounts[region] || 0) + 1;
        }
      }
    }

    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (stars[r][c] && regionCounts[regions[r][c]] > starsPerUnit) {
          errors.add(`${r},${c}`);
        }
      }
    }

    return errors;
  }

  it('should detect too many stars in region', () => {
    const stars = [
      [true, true, false],
      [true, false, false],
      [false, false, false],
    ];
    const regions = [
      [1, 1, 2],
      [1, 2, 2],
      [3, 3, 3],
    ];

    const errors = checkRegionCounts(stars, regions, 1);
    expect(errors.size).toBeGreaterThan(0);
  });

  it('should allow valid region star count', () => {
    const stars = [
      [true, false, false],
      [false, true, false],
      [false, false, true],
    ];
    const regions = [
      [1, 2, 3],
      [1, 2, 3],
      [1, 2, 3],
    ];

    const errors = checkRegionCounts(stars, regions, 1);
    expect(errors.size).toBe(0);
  });
});

// ===========================================
// StarBattle - Win Condition Tests
// ===========================================
describe('StarBattle - Win Condition', () => {
  function checkSolved(stars, regions, starsPerUnit) {
    const size = stars.length;

    // Check each row has exactly starsPerUnit stars
    for (let r = 0; r < size; r++) {
      let count = 0;
      for (let c = 0; c < size; c++) {
        if (stars[r][c]) count++;
      }
      if (count !== starsPerUnit) return false;
    }

    // Check each column has exactly starsPerUnit stars
    for (let c = 0; c < size; c++) {
      let count = 0;
      for (let r = 0; r < size; r++) {
        if (stars[r][c]) count++;
      }
      if (count !== starsPerUnit) return false;
    }

    // Check no adjacent stars
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (!stars[r][c]) continue;
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            if (dr === 0 && dc === 0) continue;
            const nr = r + dr, nc = c + dc;
            if (nr >= 0 && nr < size && nc >= 0 && nc < size && stars[nr][nc]) {
              return false;
            }
          }
        }
      }
    }

    return true;
  }

  it('should detect valid solution', () => {
    // Valid 4x4 solution with 1 star per row/column
    const stars = [
      [false, true, false, false],
      [false, false, false, true],
      [true, false, false, false],
      [false, false, true, false],
    ];
    const regions = [
      [1, 1, 2, 2],
      [1, 1, 2, 2],
      [3, 3, 4, 4],
      [3, 3, 4, 4],
    ];

    expect(checkSolved(stars, regions, 1)).toBe(true);
  });

  it('should detect incomplete solution', () => {
    const stars = [
      [false, true, false, false],
      [false, false, false, false],  // Missing star
      [true, false, false, false],
      [false, false, true, false],
    ];
    const regions = [
      [1, 1, 2, 2],
      [1, 1, 2, 2],
      [3, 3, 4, 4],
      [3, 3, 4, 4],
    ];

    expect(checkSolved(stars, regions, 1)).toBe(false);
  });
});
