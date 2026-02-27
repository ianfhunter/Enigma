import { describe, it, expect } from 'vitest';
import { isValidWord, isCommonWord } from '../../data/wordUtils';
import {
  CELL_COUNT,
  generateLetterTrianglesPuzzle,
  buildLineWordsFromPlacement,
  isSolvedPlacement,
  getTileLetterForLine,
} from './letterTrianglesLogic';

describe('Letter Triangles generator', () => {
  it('creates deterministic puzzles for the same seed', () => {
    const a = generateLetterTrianglesPuzzle(123456);
    const b = generateLetterTrianglesPuzzle(123456);

    expect(a.targetWords).toEqual(b.targetWords);
    expect(a.solvedTiles).toEqual(b.solvedTiles);
    expect(a.shuffledTiles).toEqual(b.shuffledTiles);
    expect(a.initialRotations).toEqual(b.initialRotations);
  });

  it('seeds each tile with a random initial rotation', () => {
    const puzzle = generateLetterTrianglesPuzzle(9876);
    expect(Object.keys(puzzle.initialRotations)).toHaveLength(CELL_COUNT);
    Object.values(puzzle.initialRotations).forEach((rotation) => {
      expect(rotation).toBeGreaterThanOrEqual(0);
      expect(rotation).toBeLessThanOrEqual(2);
    });
  });

  it('generates valid English words with configured line lengths', () => {
    const puzzle = generateLetterTrianglesPuzzle(99);

    const expectedLengths = [1, 2, 4, 5, 7, 8];
    expect(puzzle.targetWords).toHaveLength(expectedLengths.length);
    puzzle.targetWords.forEach((word, index) => {
      expect(word).toMatch(/^[A-Z]+$/);
      expect(word.length).toBe(expectedLengths[index]);

      if (word.length >= 3) {
        expect(isValidWord(word)).toBe(true);
      }
    });
  });

  it('prefers common words for most rows', () => {
    const puzzle = generateLetterTrianglesPuzzle(314159);
    const longRows = puzzle.targetWords.filter((word) => word.length >= 3);
    const commonCount = longRows.filter((word) => isCommonWord(word)).length;

    expect(commonCount).toBeGreaterThanOrEqual(2);
  });

  it('solved placement reconstructs exactly the target line words when rotations are reset', () => {
    const puzzle = generateLetterTrianglesPuzzle(42);
    const solvedPlacement = Array.from({ length: CELL_COUNT }, (_, index) => index);
    const zeroRotations = Object.fromEntries(solvedPlacement.map((id) => [id, 0]));
    const tileById = new Map(puzzle.solvedTiles.map((tile) => [tile.id, tile]));

    const lines = buildLineWordsFromPlacement(solvedPlacement, tileById, zeroRotations);
    expect(lines).toEqual(puzzle.targetWords);
    expect(isSolvedPlacement(solvedPlacement, zeroRotations)).toBe(true);
  });

  it('applies upside-down cell reversal before rotation lookup', () => {
    const tile = { letters: ['A', 'B', 'C'] };

    // Cell 2 is down: display corner B maps to physical C.
    // With one clockwise turn, display B should use previous corner -> B.
    expect(getTileLetterForLine(tile, 'B', 1, 2)).toBe('B');
  });

  it('unsolved placements or rotations are never falsely considered solved', () => {
    const placement = [0, 1, 2, 3, 4, 5, 6, 8, 7];
    expect(isSolvedPlacement(placement)).toBe(false);

    const solvedPlacement = Array.from({ length: CELL_COUNT }, (_, index) => index);
    expect(isSolvedPlacement(solvedPlacement, { 0: 1 })).toBe(false);
  });
});
