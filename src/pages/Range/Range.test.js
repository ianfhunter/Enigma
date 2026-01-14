import { describe, it, expect, vi } from 'vitest';
import {
  rcToIdx,
  idxToRC,
  inBounds,
  computeVisibility,
  allWhiteConnected,
  generateRange,
  analyze,
} from './Range.jsx';

describe('Range - helpers', () => {
  it('rc/idx conversions and bounds', () => {
    expect(idxToRC(rcToIdx(1, 2, 4), 4)).toEqual({ r: 1, c: 2 });
    expect(inBounds(0, 0, 2, 2)).toBe(true);
    expect(inBounds(2, 0, 2, 2)).toBe(false);
  });

  it('computeVisibility counts straight-line whites including self', () => {
    const h = 2, w = 2;
    const isBlack = (i) => i === 1; // block (0,1)
    expect(computeVisibility(rcToIdx(0, 0, w), h, w, isBlack)).toBe(2); // self + (1,0)
  });

  it('allWhiteConnected checks connectivity ignoring blacks', () => {
    const h = 2, w = 2;
    const isBlack = (i) => i === rcToIdx(0, 1, w);
    expect(allWhiteConnected(h, w, isBlack)).toBe(true);
  });
});

describe('Range - generation and analysis', () => {
  it('generateRange returns structure matching size with givens', () => {
    const rand = vi.spyOn(Math, 'random').mockReturnValue(0.2);
    const puz = generateRange(5, 5);
    rand.mockRestore();
    expect(puz.h).toBe(5);
    expect(puz.w).toBe(5);
    expect(puz.givens.length).toBe(25);
  });

  it('analyze flags violating marks and reports connectivity', () => {
    const h = 2, w = 2;
    const givens = [null, 3, null, null];
    const marks = [1, 0, 0, 0]; // mark clue as black -> error
    const res = analyze(h, w, givens, marks);
    expect(res.bad.size).toBeGreaterThan(0);
    expect(res.connected).toBe(true);
  });
});
