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
  analyze,
  getTrackConnections,
  findRenderablePath,
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

  it('getRenderableTrackConnections only connects tiles on the chosen A→B path', () => {
    const puz = { w: 4, h: 3, a: 0, b: 11 };
    const marks = [
      1, 1, 1, 0,
      0, 0, 1, 0,
      1, 1, 1, 1,
    ];

    const pathSet = new Set(findRenderablePath(puz, marks));

    expect(getRenderableTrackConnections(puz, marks, 8, pathSet)).toEqual({
      up: false,
      right: false,
      down: false,
      left: false,
    });

    // index 2 connects left to 1 and down to 6 on the rendered A→B path
    expect(getRenderableTrackConnections(puz, marks, 2, pathSet)).toEqual({
      up: false,
      right: false,
      down: true,
      left: true,
    });
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
