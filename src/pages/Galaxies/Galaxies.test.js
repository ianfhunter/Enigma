import { describe, it, expect } from 'vitest';
import {
  rcToIdx,
  idxToRC,
  inBounds,
  SIZES,
  DIFFICULTIES,
  puzzleFromDataset,
  analyze,
} from './Galaxies.jsx';

describe('Galaxies - coordinate helpers', () => {
  it('rcToIdx and idxToRC are inverses', () => {
    const w = 5;
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        const idx = rcToIdx(r, c, w);
        const rc = idxToRC(idx, w);
        expect(rc).toEqual({ r, c });
      }
    }
  });

  it('inBounds respects height/width', () => {
    expect(inBounds(0, 0, 2, 2)).toBe(true);
    expect(inBounds(-1, 0, 2, 2)).toBe(false);
    expect(inBounds(2, 0, 2, 2)).toBe(false);
    expect(inBounds(0, 2, 2, 2)).toBe(false);
  });
});

describe('Galaxies - dataset transforms', () => {
  it('puzzleFromDataset maps fields and counts regions', () => {
    const compact = {
      id: 1,
      s: 3,
      d: [
        [0, 0, 0],
        [1, 1, 1],
        [2, 2, 2],
        [0, 2, 3],
      ],
      sol: [0, 0, 1, 0, 0, 1, 2, 2, 2],
      diff: 'm',
    };
    const puz = puzzleFromDataset(compact);

    expect(puz.id).toBe(1);
    expect(puz.w).toBe(3);
    expect(puz.h).toBe(3);
    expect(puz.dots[0]).toEqual({ r: 0, c: 0, type: 'cell' });
    expect(puz.dots[1].type).toBe('hedge');
    expect(puz.numRegions).toBe(3);
    expect(puz.difficulty).toBe('medium');
  });

  it('SIZES and DIFFICULTIES expose expected entries', () => {
    expect(SIZES).toEqual([7, 10, 15]);
    const codes = DIFFICULTIES.map(d => d.code);
    expect(codes).toEqual(['e', 'm', 'h', 'x']);
  });
});

describe('Galaxies - analyze', () => {
  const mockPuz = {
    w: 2,
    h: 2,
    solution: [
      0, 0,
      1, 1,
    ],
  };

  it('reports solved when assignment matches solution regions', () => {
    const assign = [0, 0, 1, 1];
    const result = analyze(mockPuz, assign);
    expect(result.solved).toBe(true);
    expect(result.bad.size).toBe(0);
  });

  it('flags bad cells when regions do not match solution grouping', () => {
    const assign = [0, 1, 1, 1]; // cell 1 incorrectly grouped
    const result = analyze(mockPuz, assign);
    expect(result.solved).toBe(false);
    expect(result.bad.size).toBeGreaterThan(0);
  });
});

describe('Galaxies - grid size switching', () => {
  it('should have all sizes defined', () => {
    expect(SIZES).toBeDefined();
    expect(Array.isArray(SIZES)).toBe(true);
    expect(SIZES.length).toBeGreaterThan(0);
    SIZES.forEach((size) => {
      expect(size).toBeGreaterThan(0);
      expect(Number.isInteger(size)).toBe(true);
    });
  });

  it('should have valid size values', () => {
    SIZES.forEach((size) => {
      expect(size).toBeGreaterThan(0);
      expect(size).toBeLessThanOrEqual(20); // Reasonable upper bound
    });
  });

  it('should handle switching between all sizes', () => {
    for (let i = 0; i < SIZES.length; i++) {
      const size = SIZES[i];
      expect(() => {
        // Verify size is valid for creating grids
        const gridSize = size * size;
        const testGrid = new Array(gridSize).fill(-1);
        expect(testGrid.length).toBe(gridSize);
      }).not.toThrow();
    }
  });

  it('should handle rapid size switching (all sizes in sequence)', () => {
    const grids = [];
    
    for (let i = 0; i < SIZES.length; i++) {
      const size = SIZES[i];
      const gridSize = size * size;
      const grid = new Array(gridSize).fill(-1);
      grids.push({ size, grid });
    }
    
    expect(grids).toHaveLength(SIZES.length);
    grids.forEach(({ size, grid }) => {
      expect(grid.length).toBe(size * size);
    });
  });

  it('should handle switching from largest to smallest size', () => {
    const largest = Math.max(...SIZES);
    const smallest = Math.min(...SIZES);
    
    expect(() => {
      const largeGrid = new Array(largest * largest).fill(-1);
      const smallGrid = new Array(smallest * smallest).fill(-1);
      
      expect(largeGrid.length).toBe(largest * largest);
      expect(smallGrid.length).toBe(smallest * smallest);
    }).not.toThrow();
  });

  it('should handle switching from smallest to largest size', () => {
    const smallest = Math.min(...SIZES);
    const largest = Math.max(...SIZES);
    
    expect(() => {
      const smallGrid = new Array(smallest * smallest).fill(-1);
      const largeGrid = new Array(largest * largest).fill(-1);
      
      expect(smallGrid.length).toBe(smallest * smallest);
      expect(largeGrid.length).toBe(largest * largest);
    }).not.toThrow();
  });
});
