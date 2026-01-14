import { describe, it, expect, vi } from 'vitest';
import {
  vIdx,
  DSU,
  generateAcyclicSolution,
  degreesFromCells,
  getCellVertices,
  solve,
  generatePuzzle,
  hasUniqueSolution,
  analyze,
} from './Slant.jsx';

describe('Slant - helpers', () => {
  it('vIdx maps vertex positions', () => {
    expect(vIdx(1, 1, 2)).toBe(4);
  });

  it('DSU unions and finds roots', () => {
    const d = new DSU(3);
    d.union(0, 1);
    expect(d.find(0)).toBe(d.find(1));
  });

  it('getCellVertices returns four vertices', () => {
    expect(getCellVertices(0, 0, 1)).toHaveLength(4);
  });
});

describe('Slant - generation and solving', () => {
  it('generateAcyclicSolution produces grid of given size', () => {
    const rand = vi.spyOn(Math, 'random').mockReturnValue(0.2);
    const sol = generateAcyclicSolution(2, 2);
    rand.mockRestore();
    expect(sol.length).toBe(2);
    expect(sol[0].length).toBe(2);
  });

  it('degreesFromCells counts vertex degrees', () => {
    const cells = [
      ['\\'],
    ];
    const deg = degreesFromCells(cells);
    expect(deg.reduce((a, b) => a + b, 0)).toBe(2);
  });

  it('solve finds at least one solution for empty clues', () => {
    const w = 2, h = 2;
    const clues = Array((w + 1) * (h + 1)).fill(null);
    const sols = solve(w, h, clues, 1);
    expect(sols.length).toBeGreaterThan(0);
  });
});

describe('Slant - puzzle generation and analysis', () => {
  it('generatePuzzle returns solution and clues', () => {
    const puz = generatePuzzle(3, 3);
    expect(puz.solution.length).toBe(3);
    expect(puz.clues.length).toBe((3 + 1) * (3 + 1));
  });

  it('hasUniqueSolution confirms uniqueness', () => {
    const puz = generatePuzzle(3, 3);
    expect(hasUniqueSolution(3, 3, puz.clues)).toBe(true);
  });

  it('analyze reports over/loop info', () => {
    const puz = generatePuzzle(2, 2);
    const cells = Array.from({ length: puz.solution.length }, () => Array(puz.solution[0].length).fill(null));
    const res = analyze(cells, degreesFromCells(puz.solution), puz.clues);
    expect(res.over.length).toBe((puz.solution[0].length + 1) * (puz.solution.length + 1));
  });
});
