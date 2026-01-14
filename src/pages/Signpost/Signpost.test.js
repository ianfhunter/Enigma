import { describe, it, expect, vi } from 'vitest';
import {
  rcToIdx,
  idxToRC,
  dirToArrow,
  getCellsInDirection,
  getAllReachable,
  generateRandomPath,
  normalizeDirection,
  hasAmbiguity,
  generatePuzzle,
  inArrowDirection,
  analyzeSolution,
} from './Signpost.jsx';

describe('Signpost - helpers', () => {
  it('rc/index conversions round-trip', () => {
    expect(idxToRC(rcToIdx(2, 3, 5), 5)).toEqual({ r: 2, c: 3 });
  });

  it('dirToArrow maps directions', () => {
    expect(dirToArrow(-1, 0)).toBe('↑');
    expect(dirToArrow(0, 0)).toBe('•');
  });

  it('getCellsInDirection and reachable lists respect bounds', () => {
    const cells = getCellsInDirection(0, 0, 1, 3, 3); // to the right
    expect(cells).toEqual([1, 2]);
    const all = getAllReachable(4, 3, 3);
    expect(all.length).toBeGreaterThan(0);
  });

  it('normalizeDirection reduces to unit steps', () => {
    expect(normalizeDirection(2, 4)).toEqual({ dr: 1, dc: 2 });
  });

  it('inArrowDirection checks direction match', () => {
    const arrows = Array(9).fill(null);
    arrows[0] = { dr: 1, dc: 0 };
    expect(inArrowDirection(0, 3, arrows, 3)).toBe(true);
    expect(inArrowDirection(0, 1, arrows, 3)).toBe(false);
  });
});

describe('Signpost - generation and analysis', () => {
  it('generateRandomPath covers all cells', () => {
    const rand = vi.spyOn(Math, 'random').mockReturnValue(0.3);
    const path = generateRandomPath(3, 3);
    rand.mockRestore();
    expect(new Set(path).size).toBe(9);
  });

  it('generatePuzzle returns arrows and numbers sized to grid', () => {
    const rand = vi.spyOn(Math, 'random').mockReturnValue(0.2);
    const puz = generatePuzzle(3, 3);
    rand.mockRestore();
    expect(puz.arrows.length).toBe(9);
    expect(puz.fixedNumbers.filter((x) => x != null).length).toBeGreaterThan(0);
  });

  it('analyzeSolution detects solved path when succ/pred follow solution', () => {
    const puz = generatePuzzle(3, 3);
    const n = puz.w * puz.h;
    const succ = Array(n).fill(null);
    const pred = Array(n).fill(null);
    for (let i = 0; i < n - 1; i++) {
      succ[puz.solutionPath[i]] = puz.solutionPath[i + 1];
      pred[puz.solutionPath[i + 1]] = puz.solutionPath[i];
    }
    const res = analyzeSolution(puz, succ, pred);
    expect(res.solved).toBe(true);
  });
});
