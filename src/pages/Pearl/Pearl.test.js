import { describe, it, expect, vi } from 'vitest';
import {
  idxH,
  idxV,
  cellIdx,
  makeRectLoopCells,
  generatePearl,
  analyze,
} from './Pearl.jsx';

describe('Pearl - helpers', () => {
  it('index helpers map coordinates correctly', () => {
    expect(idxH(0, 1, 4)).toBe(1);
    expect(idxV(1, 0, 3)).toBe(3);
    expect(cellIdx(2, 1, 5)).toBe(11);
  });

  it('makeRectLoopCells returns perimeter cells within bounds', () => {
    const rand = vi.spyOn(Math, 'random').mockReturnValue(0.1);
    const { top, left, bottom, right, cells } = makeRectLoopCells(6, 6);
    rand.mockRestore();
    expect(bottom).toBeGreaterThan(top);
    expect(right).toBeGreaterThan(left);
    expect(cells.length).toBeGreaterThan(0);
    cells.forEach(({ r, c }) => {
      expect(r).toBeGreaterThanOrEqual(0);
      expect(r).toBeLessThan(6);
      expect(c).toBeGreaterThanOrEqual(0);
      expect(c).toBeLessThan(6);
    });
  });
});

describe('Pearl - generation and analysis', () => {
  it('generatePearl builds loop edges and pearls', () => {
    const rand = vi.spyOn(Math, 'random').mockReturnValue(0.2);
    const puz = generatePearl(5, 5);
    rand.mockRestore();
    expect(puz.solution.hEdges.length).toBe(5 * 4);
    expect(puz.solution.vEdges.length).toBe(4 * 5);
    expect(puz.pearls.length).toBe(25);
  });

  it('analyze validates loop degrees and pearl rules', () => {
    const { solution, pearls, w, h } = generatePearl(5, 5);
    const res = analyze(w, h, pearls, solution.hEdges, solution.vEdges);
    expect(res.loopOk).toBe(true);
  });
});
