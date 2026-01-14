import { describe, it, expect, vi } from 'vitest';
import { chordCross, makeOuterPlanarGraph, segIntersect, randBetween } from './Untangle.jsx';

describe('Untangle - helpers', () => {
  it('chordCross detects circle chord intersections', () => {
    expect(chordCross(0, 3, 1, 2)).toBe(true);
    expect(chordCross(0, 2, 2, 3)).toBe(false);
    expect(chordCross(0, 1, 2, 3)).toBe(false);
    expect(chordCross(0, 2, 1, 3)).toBe(true);
  });

  it('segIntersect detects segment intersections', () => {
    const p1 = { x: 0, y: 0 };
    const p2 = { x: 2, y: 2 };
    const p3 = { x: 0, y: 2 };
    const p4 = { x: 2, y: 0 };
    expect(segIntersect(p1, p2, p3, p4)).toBe(true);
  });

  it('makeOuterPlanarGraph builds edges without duplicates', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.2);
    const edges = makeOuterPlanarGraph(6, 2);
    vi.restoreAllMocks();
    expect(edges.length).toBeGreaterThanOrEqual(6);
    const unique = new Set(edges.map(e => e.slice().sort().join('-')));
    expect(unique.size).toBe(edges.length);
  });

  it('randBetween respects bounds', () => {
    const r = vi.spyOn(Math, 'random').mockReturnValue(0.5);
    expect(randBetween(10, 20)).toBe(15);
    r.mockRestore();
  });
});
