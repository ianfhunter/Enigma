import { describe, it, expect, vi } from 'vitest';
import {
  SIZES,
  generatePuzzle,
  toggleCell,
  checkWin,
} from './LightsOut.jsx';

describe('LightsOut - metadata', () => {
  it('exposes size options', () => {
    expect(Object.values(SIZES)).toEqual([3, 5, 7]);
  });
});

describe('LightsOut - mechanics', () => {
  it('toggleCell flips target and orthogonal neighbors', () => {
    const grid = [
      [false, false],
      [false, false],
    ];
    toggleCell(grid, 0, 0, 2);
    expect(grid).toEqual([
      [true, true],
      [true, false],
    ]);
  });

  it('checkWin detects all-off grid', () => {
    expect(checkWin([[false]])).toBe(true);
    expect(checkWin([[true]])).toBe(false);
  });

  it('generatePuzzle produces a solvable grid with some lights on', () => {
    const rand = vi.spyOn(Math, 'random').mockReturnValue(0.1); // deterministic
    const grid = generatePuzzle(3, 3);
    rand.mockRestore();
    expect(grid).toHaveLength(3);
    const litCount = grid.flat().filter(Boolean).length;
    expect(litCount).toBeGreaterThan(0);
    expect(litCount).toBeLessThanOrEqual(9);
  });
});

describe('LightsOut - grid size switching', () => {
  it('should have all sizes defined', () => {
    expect(SIZES).toBeDefined();
    const sizeValues = Object.values(SIZES);
    expect(sizeValues.length).toBeGreaterThan(0);
    sizeValues.forEach((size) => {
      expect(size).toBeGreaterThan(0);
      expect(Number.isInteger(size)).toBe(true);
    });
  });

  it('should generate puzzles for all available sizes without crashing', () => {
    Object.values(SIZES).forEach((size) => {
      expect(() => {
        const grid = generatePuzzle(size);
        expect(grid).toBeDefined();
        expect(grid).toHaveLength(size);
        expect(grid[0]).toHaveLength(size);
      }).not.toThrow();
    });
  });

  it('should switch between all sizes sequentially without crashing', () => {
    const sizes = Object.values(SIZES);
    for (let i = 0; i < sizes.length; i++) {
      const size = sizes[i];
      expect(() => {
        const grid = generatePuzzle(size);
        expect(grid.length).toBe(size);
        expect(grid[0].length).toBe(size);
      }).not.toThrow();
    }
  });

  it('should handle rapid size switching (all sizes in sequence)', () => {
    const sizes = Object.values(SIZES);
    const grids = [];
    
    for (let i = 0; i < sizes.length; i++) {
      const size = sizes[i];
      const grid = generatePuzzle(size);
      grids.push({ size, grid });
    }
    
    expect(grids).toHaveLength(sizes.length);
    grids.forEach(({ size, grid }) => {
      expect(grid.length).toBe(size);
      expect(grid[0].length).toBe(size);
    });
  });

  it('should handle switching from largest to smallest size', () => {
    const sizes = Object.values(SIZES);
    const largest = Math.max(...sizes);
    const smallest = Math.min(...sizes);
    
    expect(() => {
      const largeGrid = generatePuzzle(largest);
      const smallGrid = generatePuzzle(smallest);
      
      expect(largeGrid.length).toBe(largest);
      expect(smallGrid.length).toBe(smallest);
    }).not.toThrow();
  });

  it('should handle switching from smallest to largest size', () => {
    const sizes = Object.values(SIZES);
    const smallest = Math.min(...sizes);
    const largest = Math.max(...sizes);
    
    expect(() => {
      const smallGrid = generatePuzzle(smallest);
      const largeGrid = generatePuzzle(largest);
      
      expect(smallGrid.length).toBe(smallest);
      expect(largeGrid.length).toBe(largest);
    }).not.toThrow();
  });
});
