import { describe, it, expect } from 'vitest';
import {
  GRID_SIZES,
  CLUES,
  generatePuzzle,
  checkRegion,
  checkTatamiRule,
  validateSolution,
  isSolved,
} from './Tatamibari.jsx';

describe('Tatamibari - helpers', () => {
  it('exposes grid sizes and clues', () => {
    expect(Object.keys(GRID_SIZES)).toContain('8×8');
    expect(CLUES.SQUARE).toBe('+');
  });

  it('generatePuzzle returns clue grid and regions', () => {
    const puz = generatePuzzle(8);
    expect(puz.clueGrid.length).toBe(8);
    expect(puz.regions.length).toBeGreaterThan(0);
  });

  it('checkRegion validates rectangles against clues', () => {
    const cells = [[0, 0], [0, 1], [1, 0], [1, 1]];
    expect(checkRegion(cells, CLUES.SQUARE)).toBe(true);
    expect(checkRegion(cells, CLUES.HORIZONTAL)).toBe(false);
  });

  it('checkTatamiRule detects four-way intersections', () => {
    const grid = [
      [0, 1],
      [2, 3],
    ];
    expect(checkTatamiRule(grid, 2)).toBe(false);
  });

  it('validateSolution returns empty errors for correct grid', () => {
    const puz = generatePuzzle(8);
    const errors = validateSolution(puz.solution, puz.clueGrid, puz.size);
    expect(errors.size).toBe(0);
    expect(isSolved(puz.solution, puz.clueGrid, puz.size)).toBe(true);
  });
});
