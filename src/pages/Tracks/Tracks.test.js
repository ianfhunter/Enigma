import { describe, it, expect, vi } from 'vitest';
import {
  rcToIdx,
  idxToRC,
  inBounds,
  DIRS,
  generatePath,
  generatePuzzle,
  SIZES,
  DIFFICULTIES,
  analyze,
} from './Tracks.jsx';

describe('Tracks - helpers', () => {
  it('converts indexes', () => {
    const idx = rcToIdx(1, 2, 5);
    expect(idx).toBe(7);
    expect(idxToRC(idx, 5)).toEqual({ r: 1, c: 2 });
    expect(inBounds(0, 0, 5, 5)).toBe(true);
    expect(inBounds(-1, 0, 5, 5)).toBe(false);
  });

  it('exports dirs, sizes, difficulties', () => {
    expect(DIRS.length).toBe(4);
    expect(SIZES).toContain(8);
    expect(DIFFICULTIES).toContain('medium');
  });

  it('generatePath builds a path to target', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.1);
    const path = generatePath(4, 4, 0, 0, 3, 3);
    vi.restoreAllMocks();
    expect(path?.[0]).toEqual([0, 0]);
  });

  it('generatePuzzle returns puzzle data', () => {
    const rand = vi.spyOn(Math, 'random').mockReturnValue(0.2);
    const puz = generatePuzzle(6, 'easy');
    rand.mockRestore();
    expect(puz.w).toBe(6);
    expect(puz.rowClues.length).toBe(6);
  });

  it('returns a puzzle even when generation fails, preserving size', () => {
    const rand = vi.spyOn(Math, 'random').mockReturnValue(0.9); // bias against easy path finding
    const puz = generatePuzzle(5, 'hard');
    rand.mockRestore();
    expect(puz.w).toBe(5);
    expect(puz.h).toBe(5);
    expect(puz.a).toBeDefined();
    expect(puz.b).toBeDefined();
    expect(puz.rowClues).toHaveLength(5);
    expect(puz.colClues).toHaveLength(5);
    expect(puz.solution instanceof Set).toBe(true);
  });

  it('analyze checks counts and connectivity', () => {
    const puz = {
      w: 2,
      h: 2,
      a: 0,
      b: 3,
      rowClues: [1, 1],
      colClues: [1, 1],
    };
    const marks = [1, 0, 0, 1];
    const res = analyze(puz, marks);
    expect(res.rowOk).toBe(true);
    expect(res.colOk).toBe(true);
  });
});
