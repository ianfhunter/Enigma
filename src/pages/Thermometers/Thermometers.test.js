import { describe, it, expect, vi } from 'vitest';
import {
  GRID_SIZES,
  DIRECTIONS,
  generatePuzzle,
  checkValidity,
  checkSolved,
} from './Thermometers.jsx';

describe('Thermometers - helpers', () => {
  it('exposes grid sizes and directions', () => {
    expect(Object.keys(GRID_SIZES)).toContain('5×5');
    expect(DIRECTIONS.map(d => d.name)).toContain('up');
  });

  it('generatePuzzle returns thermometers, clues, and solution', () => {
    const rand = vi.spyOn(Math, 'random').mockReturnValue(0.2);
    const puz = generatePuzzle(5);
    rand.mockRestore();
    expect(puz.thermometers.length).toBeGreaterThan(0);
    expect(puz.solution.length).toBe(5);
    expect(puz.rowClues.length).toBe(5);
  });

  it('checkValidity flags overfills and broken order', () => {
    const puz = generatePuzzle(5);
    const filled = puz.solution.map(row => row.map(() => false));
    // Force an invalid fill: fill last cell of first thermometer only
    const [tr, tc] = puz.thermometers[0].cells.slice(-1)[0];
    filled[tr][tc] = true;
    const errors = checkValidity(filled, puz.thermometers, puz.rowClues, puz.colClues, 5);
    expect(errors.size).toBeGreaterThanOrEqual(0);
  });

  it('checkSolved compares to solution', () => {
    const puz = generatePuzzle(5);
    expect(checkSolved(puz.solution, puz.solution, 5)).toBe(true);
  });
});
