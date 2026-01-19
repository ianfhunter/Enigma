import { describe, it, expect } from 'vitest';

// ===========================================
// StainedGlass - Color Mixing Tests
// ===========================================
describe('StainedGlass - Color Mixing', () => {
  function mixColors(color1, color2) {
    // Simple additive color mixing
    return {
      r: Math.min(255, (color1.r + color2.r) / 2),
      g: Math.min(255, (color1.g + color2.g) / 2),
      b: Math.min(255, (color1.b + color2.b) / 2),
    };
  }

  it('should mix two colors', () => {
    const red = { r: 255, g: 0, b: 0 };
    const blue = { r: 0, g: 0, b: 255 };
    const result = mixColors(red, blue);

    expect(result.r).toBe(127.5);
    expect(result.b).toBe(127.5);
  });

  it('should produce same color when mixing identical colors', () => {
    const color = { r: 100, g: 150, b: 200 };
    const result = mixColors(color, color);

    expect(result.r).toBe(100);
    expect(result.g).toBe(150);
    expect(result.b).toBe(200);
  });
});

// ===========================================
// StainedGlass - Color Matching Tests
// ===========================================
describe('StainedGlass - Color Matching', () => {
  function colorsMatch(color1, color2, tolerance = 10) {
    return Math.abs(color1.r - color2.r) <= tolerance &&
           Math.abs(color1.g - color2.g) <= tolerance &&
           Math.abs(color1.b - color2.b) <= tolerance;
  }

  it('should match identical colors', () => {
    const color = { r: 100, g: 150, b: 200 };
    expect(colorsMatch(color, color)).toBe(true);
  });

  it('should match within tolerance', () => {
    const color1 = { r: 100, g: 150, b: 200 };
    const color2 = { r: 105, g: 155, b: 195 };
    expect(colorsMatch(color1, color2, 10)).toBe(true);
  });

  it('should not match outside tolerance', () => {
    const color1 = { r: 100, g: 150, b: 200 };
    const color2 = { r: 120, g: 170, b: 220 };
    expect(colorsMatch(color1, color2, 10)).toBe(false);
  });
});

// ===========================================
// StainedGlass - Grid Validation Tests
// ===========================================
describe('StainedGlass - Grid Validation', () => {
  function validateGrid(grid, targetColors) {
    const size = grid.length;
    let allMatch = true;

    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (grid[r][c] !== targetColors[r][c]) {
          allMatch = false;
        }
      }
    }

    return allMatch;
  }

  it('should validate matching grid', () => {
    const grid = [[1, 2], [3, 4]];
    const target = [[1, 2], [3, 4]];
    expect(validateGrid(grid, target)).toBe(true);
  });

  it('should invalidate non-matching grid', () => {
    const grid = [[1, 2], [3, 4]];
    const target = [[1, 2], [3, 5]];
    expect(validateGrid(grid, target)).toBe(false);
  });
});

// ===========================================
// StainedGlass - Cell Selection Tests
// ===========================================
describe('StainedGlass - Cell Selection', () => {
  function cycleColor(currentColor, availableColors) {
    const currentIndex = availableColors.indexOf(currentColor);
    const nextIndex = (currentIndex + 1) % availableColors.length;
    return availableColors[nextIndex];
  }

  it('should cycle to next color', () => {
    const colors = ['red', 'green', 'blue'];
    expect(cycleColor('red', colors)).toBe('green');
    expect(cycleColor('green', colors)).toBe('blue');
  });

  it('should wrap around to first color', () => {
    const colors = ['red', 'green', 'blue'];
    expect(cycleColor('blue', colors)).toBe('red');
  });
});

// ===========================================
// StainedGlass - Puzzle Generation Tests
// ===========================================
describe('StainedGlass - Puzzle Generation', () => {
  function generatePuzzle(size, colorCount, random) {
    const grid = [];
    for (let r = 0; r < size; r++) {
      const row = [];
      for (let c = 0; c < size; c++) {
        row.push(Math.floor(random() * colorCount));
      }
      grid.push(row);
    }
    return grid;
  }

  function createSeededRandom(seed) {
    let s = seed;
    return function() {
      s = (s * 9301 + 49297) % 233280;
      return s / 233280;
    };
  }

  it('should generate grid of correct size', () => {
    const random = createSeededRandom(12345);
    const grid = generatePuzzle(4, 5, random);

    expect(grid.length).toBe(4);
    expect(grid[0].length).toBe(4);
  });

  it('should use only valid color indices', () => {
    const random = createSeededRandom(12345);
    const colorCount = 5;
    const grid = generatePuzzle(4, colorCount, random);

    for (const row of grid) {
      for (const cell of row) {
        expect(cell).toBeGreaterThanOrEqual(0);
        expect(cell).toBeLessThan(colorCount);
      }
    }
  });

  it('should be deterministic', () => {
    const grid1 = generatePuzzle(4, 5, createSeededRandom(12345));
    const grid2 = generatePuzzle(4, 5, createSeededRandom(12345));

    expect(grid1).toEqual(grid2);
  });
});

// ===========================================
// StainedGlass - Completion Detection Tests
// ===========================================
describe('StainedGlass - Completion Detection', () => {
  function isComplete(currentGrid, targetGrid) {
    const size = currentGrid.length;
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (currentGrid[r][c] !== targetGrid[r][c]) return false;
      }
    }
    return true;
  }

  it('should detect complete puzzle', () => {
    const current = [[1, 2], [3, 4]];
    const target = [[1, 2], [3, 4]];
    expect(isComplete(current, target)).toBe(true);
  });

  it('should detect incomplete puzzle', () => {
    const current = [[0, 2], [3, 4]];
    const target = [[1, 2], [3, 4]];
    expect(isComplete(current, target)).toBe(false);
  });
});
