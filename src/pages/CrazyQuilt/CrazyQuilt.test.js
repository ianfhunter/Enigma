import { describe, expect, it } from 'vitest';
import {
  generateCrazyQuilt,
  isSolved,
  swapCards,
} from './CrazyQuilt.jsx';

const flattenIds = (grid) => grid.flat().map((card) => card.id);

describe('CrazyQuilt - generation', () => {
  it('creates a 4x13 grid with a suit order', () => {
    const { grid, suitOrder, solution } = generateCrazyQuilt(12345);

    expect(grid).toHaveLength(4);
    grid.forEach((row) => expect(row).toHaveLength(13));

    expect(suitOrder).toHaveLength(4);
    const ids = new Set(suitOrder.map((suit) => suit.id));
    expect(ids.size).toBe(4);

    solution.forEach((row, rowIndex) => {
      const targetSuit = suitOrder[rowIndex].id;
      row.forEach((card) => {
        expect(card.suit).toBe(targetSuit);
      });
    });
  });

  it('is deterministic for the same seed', () => {
    const resultA = generateCrazyQuilt(777);
    const resultB = generateCrazyQuilt(777);

    expect(flattenIds(resultA.grid)).toEqual(flattenIds(resultB.grid));
    expect(resultA.suitOrder.map((s) => s.id)).toEqual(resultB.suitOrder.map((s) => s.id));
  });

  it('differs across different seeds', () => {
    const resultA = generateCrazyQuilt(1);
    const resultB = generateCrazyQuilt(999);

    expect(flattenIds(resultA.grid)).not.toEqual(flattenIds(resultB.grid));
  });
});

describe('CrazyQuilt - swapping and solution', () => {
  it('swaps cards without mutating the original grid', () => {
    const { grid } = generateCrazyQuilt(2024);
    const originalIds = flattenIds(grid);

    const swapped = swapCards(grid, { row: 0, col: 0 }, { row: 3, col: 12 });

    expect(flattenIds(grid)).toEqual(originalIds);
    expect(flattenIds(swapped)).not.toEqual(originalIds);
    expect(swapped[0][0].id).toBe(grid[3][12].id);
    expect(swapped[3][12].id).toBe(grid[0][0].id);
  });

  it('detects solved and unsolved grids', () => {
    const { solution } = generateCrazyQuilt(333);
    expect(isSolved(solution, solution)).toBe(true);

    const swapped = swapCards(solution, { row: 0, col: 0 }, { row: 0, col: 1 });
    expect(isSolved(swapped, solution)).toBe(false);
  });
});
