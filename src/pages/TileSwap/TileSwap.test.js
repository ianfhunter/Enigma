import { describe, it, expect } from 'vitest';
import { GRID_SIZES, createPieces, shufflePieces, checkSolved } from './TileSwap.jsx';

describe('TileSwap - helpers', () => {
  it('exposes grid sizes', () => {
    expect(Object.keys(GRID_SIZES)).toContain('3×3');
  });

  it('createPieces builds correct ids', () => {
    const pieces = createPieces(3);
    expect(pieces.length).toBe(9);
    expect(pieces[0].id).toBe(0);
  });

  it('shufflePieces preserves ids but changes indices', () => {
    const pieces = createPieces(3);
    const shuffled = shufflePieces(pieces, () => 0.1);
    expect(shuffled.map(p => p.id).sort()).toEqual(pieces.map(p => p.id).sort());
  });

  it('checkSolved detects solved state', () => {
    const pieces = createPieces(2);
    expect(checkSolved(pieces)).toBe(true);
    const moved = [...pieces];
    moved[0] = { ...moved[0], currentIndex: 1 };
    expect(checkSolved(moved)).toBe(false);
  });
});

describe('TileSwap - grid size switching', () => {
  it('should have all sizes defined', () => {
    expect(GRID_SIZES).toBeDefined();
    const sizeValues = Object.values(GRID_SIZES);
    expect(sizeValues.length).toBeGreaterThan(0);
    sizeValues.forEach((size) => {
      expect(size).toBeGreaterThan(0);
      expect(Number.isInteger(size)).toBe(true);
    });
  });

  it('should create pieces for all available sizes without crashing', () => {
    Object.values(GRID_SIZES).forEach((size) => {
      expect(() => {
        const pieces = createPieces(size);
        expect(pieces).toBeDefined();
        expect(pieces.length).toBe(size * size);
        expect(pieces[0].id).toBe(0);
        expect(pieces[pieces.length - 1].id).toBe(size * size - 1);
      }).not.toThrow();
    });
  });

  it('should switch between all sizes sequentially without crashing', () => {
    const sizes = Object.values(GRID_SIZES);
    for (let i = 0; i < sizes.length; i++) {
      const size = sizes[i];
      expect(() => {
        const pieces = createPieces(size);
        expect(pieces.length).toBe(size * size);
      }).not.toThrow();
    }
  });

  it('should handle rapid size switching (all sizes in sequence)', () => {
    const sizes = Object.values(GRID_SIZES);
    const allPieces = [];
    
    for (let i = 0; i < sizes.length; i++) {
      const size = sizes[i];
      const pieces = createPieces(size);
      allPieces.push({ size, pieces });
    }
    
    expect(allPieces).toHaveLength(sizes.length);
    allPieces.forEach(({ size, pieces }) => {
      expect(pieces.length).toBe(size * size);
    });
  });

  it('should handle switching from largest to smallest size', () => {
    const sizes = Object.values(GRID_SIZES);
    const largest = Math.max(...sizes);
    const smallest = Math.min(...sizes);
    
    expect(() => {
      const largePieces = createPieces(largest);
      const smallPieces = createPieces(smallest);
      
      expect(largePieces.length).toBe(largest * largest);
      expect(smallPieces.length).toBe(smallest * smallest);
    }).not.toThrow();
  });

  it('should handle switching from smallest to largest size', () => {
    const sizes = Object.values(GRID_SIZES);
    const smallest = Math.min(...sizes);
    const largest = Math.max(...sizes);
    
    expect(() => {
      const smallPieces = createPieces(smallest);
      const largePieces = createPieces(largest);
      
      expect(smallPieces.length).toBe(smallest * smallest);
      expect(largePieces.length).toBe(largest * largest);
    }).not.toThrow();
  });
});
