import { describe, expect, it } from 'vitest';
import { createSeededRandom } from '../../data/wordUtils';
import {
  CLASSIC_SHAPE_KEY,
  SHAPE_KEYS,
  SHAPES,
  generateSolvablePuzzle,
  isPositionFree,
  isTileFree,
} from './MahjongSolitaire';

describe('MahjongSolitaire generator', () => {
  it('includes all supported named shapes', () => {
    expect(SHAPE_KEYS).toEqual([
      'classic',
      'turtle',
      'spider',
      'pyramid',
      'tiger',
      'rooster',
      'hourglass',
      'butterfly',
    ]);
    expect(CLASSIC_SHAPE_KEY).toBe('classic');
  });

  it('builds valid layouts for every shape', () => {
    SHAPE_KEYS.forEach((shapeKey) => {
      const shape = SHAPES[shapeKey];
      expect(shape.layout.length % 2).toBe(0);
      expect(new Set(shape.layout.map(pos => pos.key)).size).toBe(shape.layout.length);
      expect(shape.layout.length).toBeGreaterThan(20);
    });
  });

  it('generates a legal removal sequence for each shape', () => {
    SHAPE_KEYS.forEach((shapeKey, seedOffset) => {
      const random = createSeededRandom(1000 + seedOffset);
      const shape = SHAPES[shapeKey];
      const { solutionSequence } = generateSolvablePuzzle(shape, random);
      const occupied = new Array(shape.layout.length).fill(true);

      solutionSequence.forEach(([firstIndex, secondIndex]) => {
        expect(isPositionFree(shape, firstIndex, occupied)).toBe(true);
        expect(isPositionFree(shape, secondIndex, occupied)).toBe(true);
        occupied[firstIndex] = false;
        occupied[secondIndex] = false;
      });

      expect(occupied.every(value => value === false)).toBe(true);
    });
  });

  it('is deterministic for identical seed and shape', () => {
    const shape = SHAPES.turtle;
    const puzzleA = generateSolvablePuzzle(shape, createSeededRandom(99));
    const puzzleB = generateSolvablePuzzle(shape, createSeededRandom(99));
    expect(puzzleA.solutionSequence).toEqual(puzzleB.solutionSequence);
    expect(puzzleA.tiles).toEqual(puzzleB.tiles);
  });

  it('stays solvable across multiple seeds for complex shapes', () => {
    ['tiger', 'rooster', 'butterfly'].forEach((shapeKey) => {
      const shape = SHAPES[shapeKey];
      for (let seed = 1; seed <= 20; seed += 1) {
        const { solutionSequence } = generateSolvablePuzzle(shape, createSeededRandom(seed));
        expect(solutionSequence.length * 2).toBe(shape.layout.length);
      }
    });
  });

  it('returns false for out-of-range tile checks during shape transitions', () => {
    const shape = SHAPES.classic;
    const occupied = new Array(shape.layout.length).fill(true);
    expect(isPositionFree(shape, shape.layout.length + 4, occupied)).toBe(false);

    const tiles = new Array(shape.layout.length).fill(null);
    expect(isTileFree(shape, shape.layout.length + 2, tiles)).toBe(false);
  });
});
