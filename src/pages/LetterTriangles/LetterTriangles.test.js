import { describe, it, expect } from 'vitest';
import {
  CELL_COUNT,
  generateLetterTrianglesPuzzle,
  buildLineWordsFromPlacement,
  isSolvedPlacement,
} from './letterTrianglesLogic';

describe('Letter Triangles generator', () => {
  it('creates deterministic puzzles for the same seed', () => {
    const a = generateLetterTrianglesPuzzle(123456);
    const b = generateLetterTrianglesPuzzle(123456);

    expect(a.targetWords).toEqual(b.targetWords);
    expect(a.solvedTiles).toEqual(b.solvedTiles);
    expect(a.shuffledTiles).toEqual(b.shuffledTiles);
  });

  it('generates words with strict 1..8 lengths', () => {
    const puzzle = generateLetterTrianglesPuzzle(99);

    expect(puzzle.targetWords).toHaveLength(8);
    puzzle.targetWords.forEach((word, index) => {
      expect(word).toMatch(/^[A-Z]+$/);
      expect(word.length).toBe(index + 1);
    });
  });

  it('solved placement reconstructs exactly the target line words', () => {
    const puzzle = generateLetterTrianglesPuzzle(42);
    const solvedPlacement = Array.from({ length: CELL_COUNT }, (_, index) => index);
    const tileById = new Map(puzzle.solvedTiles.map((tile) => [tile.id, tile]));

    const lines = buildLineWordsFromPlacement(solvedPlacement, tileById);
    expect(lines).toEqual(puzzle.targetWords);
    expect(isSolvedPlacement(solvedPlacement)).toBe(true);
  });

  it('unsolved placements are never falsely considered solved', () => {
    const placement = [0, 1, 2, 3, 4, 5, 6, 8, 7];
    expect(isSolvedPlacement(placement)).toBe(false);
  });
});
