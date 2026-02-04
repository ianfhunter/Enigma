import { describe, expect, it } from 'vitest';
import { createSeededRandom } from '../../data/wordUtils';
import {
  LAYOUT,
  createLayout,
  generateSolvablePuzzle,
  isPositionFree,
} from './MahjongSolitaire';

describe('MahjongSolitaire generator', () => {
  it('builds a consistent layout shape', () => {
    const layout = createLayout();
    expect(layout).toHaveLength(LAYOUT.length);
    expect(new Set(layout.map(pos => pos.key)).size).toBe(layout.length);
  });

  it('generates a solvable removal sequence', () => {
    const random = createSeededRandom(42);
    const { solutionSequence } = generateSolvablePuzzle(random);
    const occupied = new Array(LAYOUT.length).fill(true);

    solutionSequence.forEach(([firstIndex, secondIndex]) => {
      expect(isPositionFree(firstIndex, occupied)).toBe(true);
      expect(isPositionFree(secondIndex, occupied)).toBe(true);
      occupied[firstIndex] = false;
      occupied[secondIndex] = false;
    });

    expect(occupied.every(value => value === false)).toBe(true);
  });

  it('uses deterministic generation for a seed', () => {
    const randomA = createSeededRandom(99);
    const randomB = createSeededRandom(99);
    const puzzleA = generateSolvablePuzzle(randomA);
    const puzzleB = generateSolvablePuzzle(randomB);

    expect(puzzleA.solutionSequence).toEqual(puzzleB.solutionSequence);
    expect(puzzleA.tiles).toEqual(puzzleB.tiles);
  });

  it('finds free tiles on the top layer of a full board', () => {
    const occupied = new Array(LAYOUT.length).fill(true);
    const topLayerIndices = LAYOUT
      .map((pos, index) => ({ pos, index }))
      .filter(({ pos }) => pos.z === Math.max(...LAYOUT.map(p => p.z)))
      .map(({ index }) => index);

    const freeOnTop = topLayerIndices.filter(index => isPositionFree(index, occupied));
    expect(freeOnTop.length).toBeGreaterThan(0);
  });
});
