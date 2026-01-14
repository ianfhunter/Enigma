import { describe, it, expect, vi } from 'vitest';
import { rcToIdx, idxToRC, inBounds, reflect, traceEdge, buildPuzzle, analyze } from './Undead.jsx';

describe('Undead - helpers', () => {
  it('index helpers convert correctly', () => {
    const idx = rcToIdx(1, 2, 4);
    expect(idx).toBe(6);
    expect(idxToRC(idx, 4)).toEqual({ r: 1, c: 2 });
    expect(inBounds(0, 0, 2, 2)).toBe(true);
    expect(inBounds(-1, 0, 2, 2)).toBe(false);
  });

  it('reflect turns directions with mirrors', () => {
    expect(reflect({ dr: -1, dc: 0 }, '/')).toEqual({ dr: 0, dc: 1 });
    expect(reflect({ dr: 0, dc: 1 }, '\\')).toEqual({ dr: 1, dc: 0 });
  });

  it('traceEdge counts monsters correctly', () => {
    const grid = [
      '.', '.',
      '.', '.',
    ];
    const monsters = ['', 'Z', '', ''];
    const count = traceEdge({ side: 'L', idx: 0 }, grid, 2, 2, monsters);
    expect(count).toBe(1);
  });

  it('buildPuzzle and analyze produce solvable structure', () => {
    const rand = vi.spyOn(Math, 'random').mockReturnValue(0.2);
    const puz = buildPuzzle(3, 3);
    rand.mockRestore();
    expect(puz.grid.length).toBe(9);
    const monsters = puz.solution;
    const res = analyze(puz, monsters);
    expect(res.totalsOk).toBe(true);
  });
});
