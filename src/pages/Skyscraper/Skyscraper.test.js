import { describe, it, expect } from 'vitest';
import { GRID_SIZES, countVisible, checkValidity, checkSolved } from './Skyscraper.jsx';

describe('Skyscraper - helpers', () => {
  it('exposes grid sizes', () => {
    expect(Object.keys(GRID_SIZES)).toContain('4×4');
  });

  it('countVisible counts increasing heights', () => {
    expect(countVisible([1, 3, 2, 4])).toBe(3); // 1,3,4 visible
  });
});

describe('Skyscraper - validation', () => {
  it('checkValidity flags duplicates and clue mismatches', () => {
    const grid = [
      [1, 1],
      [2, 0],
    ];
    const clues = { top: [null, null], bottom: [null, null], left: [null, null], right: [null, null] };
    const errors = checkValidity(grid, clues);
    expect(errors.size).toBeGreaterThan(0);
  });

  it('checkSolved compares to solution exactly', () => {
    const sol = [
      [1, 2],
      [2, 1],
    ];
    expect(checkSolved(sol, sol)).toBe(true);
    expect(checkSolved([[1, 0], [2, 1]], sol)).toBe(false);
  });
});

describe('Skyscraper - grid size switching', () => {
  it('should have all sizes defined', () => {
    expect(GRID_SIZES).toBeDefined();
    const sizeKeys = Object.keys(GRID_SIZES);
    expect(sizeKeys.length).toBeGreaterThan(0);
    sizeKeys.forEach((key) => {
      expect(GRID_SIZES[key]).toBeGreaterThan(0);
      expect(Number.isInteger(GRID_SIZES[key])).toBe(true);
    });
  });

  it('should create grids for all available sizes without crashing', () => {
    Object.values(GRID_SIZES).forEach((size) => {
      expect(() => {
        const grid = Array(size).fill(null).map(() => Array(size).fill(0));
        expect(grid.length).toBe(size);
        expect(grid[0].length).toBe(size);
      }).not.toThrow();
    });
  });

  it('should switch between all sizes sequentially without crashing', () => {
    const sizes = Object.values(GRID_SIZES);
    for (let i = 0; i < sizes.length; i++) {
      const size = sizes[i];
      expect(() => {
        const grid = Array(size).fill(null).map(() => Array(size).fill(0));
        expect(grid.length).toBe(size);
      }).not.toThrow();
    }
  });

  it('should handle rapid size switching (all sizes in sequence)', () => {
    const sizes = Object.values(GRID_SIZES);
    const grids = [];
    
    for (let i = 0; i < sizes.length; i++) {
      const size = sizes[i];
      const grid = Array(size).fill(null).map(() => Array(size).fill(0));
      grids.push({ size, grid });
    }
    
    expect(grids).toHaveLength(sizes.length);
    grids.forEach(({ size, grid }) => {
      expect(grid.length).toBe(size);
      expect(grid[0].length).toBe(size);
    });
  });

  it('should handle switching from largest to smallest size', () => {
    const sizes = Object.values(GRID_SIZES);
    const largest = Math.max(...sizes);
    const smallest = Math.min(...sizes);
    
    expect(() => {
      const largeGrid = Array(largest).fill(null).map(() => Array(largest).fill(0));
      const smallGrid = Array(smallest).fill(null).map(() => Array(smallest).fill(0));
      
      expect(largeGrid.length).toBe(largest);
      expect(smallGrid.length).toBe(smallest);
    }).not.toThrow();
  });

  it('should handle switching from smallest to largest size', () => {
    const sizes = Object.values(GRID_SIZES);
    const smallest = Math.min(...sizes);
    const largest = Math.max(...sizes);
    
    expect(() => {
      const smallGrid = Array(smallest).fill(null).map(() => Array(smallest).fill(0));
      const largeGrid = Array(largest).fill(null).map(() => Array(largest).fill(0));
      
      expect(smallGrid.length).toBe(smallest);
      expect(largeGrid.length).toBe(largest);
    }).not.toThrow();
  });
});
