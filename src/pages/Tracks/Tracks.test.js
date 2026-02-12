import { describe, it, expect } from 'vitest';
import { createSeededRandom } from '../../data/wordUtils';
import {
  rcToIdx,
  idxToRC,
  inBounds,
  DIRS,
  generatePath,
  generatePuzzle,
  SIZES,
  DIFFICULTIES,
  createNextPuzzleSeed,
  analyze,
  getTrackConnections,
  findRenderablePath,
  buildRenderableEdgeSet,
  limitConnectionsToTwo,
  getRenderableTrackConnections,
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
    const random = createSeededRandom(12345);
    const path = generatePath(4, 4, 0, 0, 3, 3, random);
    expect(path?.[0]).toEqual([0, 0]);
  });

  it('generatePuzzle returns puzzle data', () => {
    const seed = 12345;
    const puz = generatePuzzle(6, 'easy', seed);
    expect(puz.w).toBe(6);
    expect(puz.rowClues.length).toBe(6);
  });

  it('returns a puzzle even when generation fails, preserving size', () => {
    const seed = 99999; // Use a seed that might be difficult
    const puz = generatePuzzle(5, 'hard', seed);
    expect(puz.w).toBe(5);
    expect(puz.h).toBe(5);
    expect(puz.a).toBeDefined();
    expect(puz.b).toBeDefined();
    expect(puz.rowClues).toHaveLength(5);
    expect(puz.colClues).toHaveLength(5);
    expect(puz.solution instanceof Set).toBe(true);
  });



  it('getTrackConnections returns orthogonal connections for track cells', () => {
    const puz = { w: 3, h: 3 };
    const marks = [
      0, 1, 0,
      1, 1, 1,
      0, 1, 0,
    ];

    expect(getTrackConnections(puz, marks, 4)).toEqual({
      up: true,
      right: true,
      down: true,
      left: true,
    });

    expect(getTrackConnections(puz, marks, 0)).toEqual({
      up: false,
      right: false,
      down: false,
      left: false,
    });
  });

  it('findRenderablePath returns a continuous A→B path only', () => {
    const puz = { w: 4, h: 3, a: 0, b: 11 };
    const marks = [
      1, 1, 1, 0,
      0, 0, 1, 0,
      1, 1, 1, 1,
    ];

    const path = findRenderablePath(puz, marks);
    expect(path[0]).toBe(0);
    expect(path[path.length - 1]).toBe(11);
    // disconnected bottom-left island (index 8) must not be part of rendered path
    expect(path).not.toContain(8);
  });


  it('findRenderablePath prefers a longer valid A→B path when multiple exist', () => {
    const puz = { w: 3, h: 3, a: 0, b: 8 };
    const marks = [
      1, 1, 1,
      1, 1, 1,
      0, 1, 1,
    ];

    const path = findRenderablePath(puz, marks);
    // A shorter path exists (length 5), but render path should use the longer route.
    expect(path.length).toBeGreaterThanOrEqual(7);
    expect(path[0]).toBe(0);
    expect(path[path.length - 1]).toBe(8);
  });


  it('findRenderablePath keeps B as terminal endpoint (does not continue past it)', () => {
    const puz = { w: 4, h: 3, a: 0, b: 1 };
    const marks = [
      1, 1, 1, 1,
      1, 1, 1, 1,
      0, 0, 0, 0,
    ];

    const path = findRenderablePath(puz, marks);
    expect(path[0]).toBe(0);
    expect(path[path.length - 1]).toBe(1);
    expect(path.filter((i) => i === 1)).toHaveLength(1);
  });

  it('getRenderableTrackConnections uses path edges, with capped fallback for off-path tiles', () => {
    const puz = { w: 4, h: 3, a: 0, b: 11 };
    const marks = [
      1, 1, 1, 0,
      0, 0, 1, 0,
      1, 1, 1, 1,
    ];

    const edgeSet = buildRenderableEdgeSet(findRenderablePath(puz, marks));

    const offPath = getRenderableTrackConnections(puz, marks, 8, edgeSet);
    const offPathDegree = Number(offPath.up) + Number(offPath.right) + Number(offPath.down) + Number(offPath.left);
    expect(offPathDegree).toBeLessThanOrEqual(2);

    // index 2 connects left to 1 and down to 6 on the rendered A→B path
    expect(getRenderableTrackConnections(puz, marks, 2, edgeSet)).toEqual({
      up: false,
      right: false,
      down: true,
      left: true,
    });
  });


  it('getRenderableTrackConnections never renders more than two connections per tile', () => {
    const puz = { w: 3, h: 3, a: 0, b: 8 };
    const marks = [
      1, 1, 1,
      1, 1, 1,
      0, 1, 1,
    ];

    const renderablePath = findRenderablePath(puz, marks);
    const edgeSet = buildRenderableEdgeSet(renderablePath);

    for (const i of renderablePath) {
      const c = getRenderableTrackConnections(puz, marks, i, edgeSet);
      const degree = Number(c.up) + Number(c.right) + Number(c.down) + Number(c.left);
      expect(degree).toBeLessThanOrEqual(2);
    }
  });


  it('limitConnectionsToTwo caps dense local connections to valid track pieces', () => {
    const capped = limitConnectionsToTwo({ up: true, right: true, down: true, left: true });
    const degree = Number(capped.up) + Number(capped.right) + Number(capped.down) + Number(capped.left);
    expect(degree).toBe(2);
    expect(capped.up).toBe(true);
    expect(capped.down).toBe(true);
  });

  it('getRenderableTrackConnections falls back to local capped connections for non-path marked tiles', () => {
    const puz = { w: 4, h: 3, a: 0, b: 11 };
    const marks = [
      1, 1, 1, 0,
      1, 0, 1, 0,
      1, 1, 1, 1,
    ];

    const edgeSet = buildRenderableEdgeSet(findRenderablePath(puz, marks));
    const c = getRenderableTrackConnections(puz, marks, 4, edgeSet);
    const degree = Number(c.up) + Number(c.right) + Number(c.down) + Number(c.left);

    expect(degree).toBeLessThanOrEqual(2);
    expect(degree).toBeGreaterThan(0);
  });


  it('createNextPuzzleSeed returns a deterministic new seed for entropy input', () => {
    const seed1 = createNextPuzzleSeed(12345, 111);
    const seed2 = createNextPuzzleSeed(12345, 111);
    const seed3 = createNextPuzzleSeed(12345, 222);

    expect(seed1).toBe(seed2);
    expect(seed1).not.toBe(12345);
    expect(seed1).not.toBe(seed3);
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
