import { describe, it, expect } from 'vitest';
import {
  GRID_ROWS,
  GRID_COLS,
  DIRECTIONS,
  isValidCell,
  getAdjacentCells,
  shuffleArrayInPlace,
  getEmptyCells,
  getCellsAdjacentToUsed,
  isOnEdge,
  getOppositeEdge,
  areAdjacent,
  getPuzzleForDate,
} from './Threads.jsx';

describe('Threads - helpers', () => {
  it('has grid constants and directions', () => {
    expect(GRID_ROWS).toBe(8);
    expect(DIRECTIONS.length).toBe(8);
  });

  it('validates and gets adjacency', () => {
    expect(isValidCell(0, 0)).toBe(true);
    expect(isValidCell(-1, 0)).toBe(false);
    expect(getAdjacentCells(0, 0)).toContainEqual([0, 1]);
  });

  it('shuffleArrayInPlace permutes array', () => {
    const arr = [1, 2, 3];
    shuffleArrayInPlace(arr, () => 0.1);
    expect(arr.sort()).toEqual([1, 2, 3]);
  });

  it('getEmptyCells lists unused cells', () => {
    const used = new Set(['0,0']);
    const empty = getEmptyCells(Array(GRID_ROWS).fill(Array(GRID_COLS).fill('')), used);
    expect(empty).not.toContainEqual([0, 0]);
  });

  it('getCellsAdjacentToUsed finds border cells', () => {
    const used = new Set(['1,1']);
    const adj = getCellsAdjacentToUsed(used);
    expect(adj).toContainEqual([0, 0]);
  });

  it('edge helpers work', () => {
    expect(isOnEdge(0, 3, 'top')).toBe(true);
    expect(getOppositeEdge('left')).toBe('right');
    expect(areAdjacent([0, 0], [1, 1])).toBe(true);
  });

  it('getPuzzleForDate returns deterministic puzzle', () => {
    const puz = getPuzzleForDate('2024-01-01');
    expect(puz.grid.length).toBe(GRID_ROWS);

    expect(typeof puz.wordPositions).toBe('object');
    Object.entries(puz.wordPositions).forEach(([word, path]) => {
      expect(Array.isArray(path)).toBe(true);
      expect(path.length).toBe(word.length);
      path.forEach(cell => expect(cell.length).toBe(2));
    });

    const repeat = getPuzzleForDate('2024-01-01');
    expect(repeat.grid).toEqual(puz.grid);
    expect(repeat.wordPositions).toEqual(puz.wordPositions);
  });
});
