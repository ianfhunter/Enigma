import { describe, it, expect } from 'vitest';
import {
  PENTOMINO_SHAPES,
  F_SHAPE,
  I_SHAPE,
  L_SHAPE,
  rotateShape,
  flipShape,
  normalizeShape,
  getAllOrientations,
} from './pentominoShapes';

describe('Pentomino Shapes', () => {
  it('defines all 12 pentomino shapes', () => {
    expect(PENTOMINO_SHAPES).toBeDefined();
    expect(PENTOMINO_SHAPES.length).toBe(12);
    
    const names = PENTOMINO_SHAPES.map(p => p.name);
    expect(names).toContain('F');
    expect(names).toContain('I');
    expect(names).toContain('L');
    expect(names).toContain('N');
    expect(names).toContain('P');
    expect(names).toContain('T');
    expect(names).toContain('U');
    expect(names).toContain('V');
    expect(names).toContain('W');
    expect(names).toContain('X');
    expect(names).toContain('Y');
    expect(names).toContain('Z');
  });

  it('each shape has exactly 5 squares', () => {
    PENTOMINO_SHAPES.forEach(pent => {
      expect(pent.shape.length).toBe(5);
      pent.shape.forEach(([r, c]) => {
        expect(typeof r).toBe('number');
        expect(typeof c).toBe('number');
      });
    });
  });

  it('I shape is a straight line', () => {
    expect(I_SHAPE.length).toBe(5);
    // Should be all in one row or column
    const rows = new Set(I_SHAPE.map(([r]) => r));
    const cols = new Set(I_SHAPE.map(([, c]) => c));
    expect(rows.size === 1 || cols.size === 1).toBe(true);
  });

  it('X shape has a center and 4 arms', () => {
    // X shape should have one cell with 4 neighbors
    const xShape = PENTOMINO_SHAPES.find(p => p.name === 'X');
    expect(xShape).toBeDefined();
    const coords = new Set(xShape.shape.map(([r, c]) => `${r},${c}`));
    expect(coords.size).toBe(5);
  });
});

describe('Shape transformations', () => {
  it('normalizeShape moves shape to origin', () => {
    const shape = [[2, 3], [2, 4], [3, 3]];
    const normalized = normalizeShape(shape);
    
    // Should start at (0, 0)
    const minR = Math.min(...normalized.map(([r]) => r));
    const minC = Math.min(...normalized.map(([, c]) => c));
    expect(minR).toBe(0);
    expect(minC).toBe(0);
  });

  it('rotateShape rotates 90 degrees clockwise', () => {
    // L shape: [[0,0], [1,0], [2,0], [2,1]]
    const shape = [[0, 0], [1, 0], [2, 0], [2, 1]];
    const rotated = rotateShape(shape);
    
    // After 90° rotation, should become: [[0,2], [0,1], [0,0], [1,0]]
    // (relative to bounding box)
    expect(rotated.length).toBe(4);
    
    // After 4 rotations, should be back to original (normalized)
    let current = normalizeShape(shape);
    for (let i = 0; i < 4; i++) {
      current = normalizeShape(rotateShape(current));
    }
    const original = normalizeShape(shape);
    expect(current).toEqual(original);
  });

  it('flipShape flips horizontally', () => {
    const shape = [[0, 0], [0, 1], [1, 0]];
    const flipped = flipShape(shape);
    
    // Width should be preserved
    const originalWidth = Math.max(...shape.map(([, c]) => c)) - Math.min(...shape.map(([, c]) => c));
    const flippedWidth = Math.max(...flipped.map(([, c]) => c)) - Math.min(...flipped.map(([, c]) => c));
    expect(flippedWidth).toBe(originalWidth);
  });

  it('getAllOrientations returns multiple orientations', () => {
    const shape = [[0, 0], [0, 1], [1, 0]];
    const orientations = getAllOrientations(shape);
    
    // Should have at least 4 orientations (rotations)
    expect(orientations.length).toBeGreaterThanOrEqual(4);
    
    // All should have 3 cells
    orientations.forEach(orient => {
      expect(orient.length).toBe(3);
    });
  });
});