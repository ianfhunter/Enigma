import { describe, it, expect } from 'vitest';
import {
  GRID_SIZES,
  DIFFICULTY,
  addEdge,
  countEdges,
  countEdgesForSolution,
  checkSolved,
  checkLoopConnectivity,
} from './HotaruBeam.jsx';

describe('HotaruBeam - metadata', () => {
  it('exposes grid sizes and difficulties', () => {
    expect(Object.keys(GRID_SIZES)).toEqual(['5×5', '6×6', '7×7', '8×8']);
    expect(Object.keys(DIFFICULTY)).toEqual(['Easy', 'Medium', 'Hard']);
  });
});

describe('HotaruBeam - edge counting and solving', () => {
  const size = 3;
  const emptyH = Array(size).fill(null).map(() => Array(size - 1).fill(false));
  const emptyV = Array(size - 1).fill(null).map(() => Array(size).fill(false));

  it('addEdge marks horizontal and vertical edges correctly', () => {
    const h = emptyH.map(row => [...row]);
    const v = emptyV.map(row => [...row]);
    addEdge(0, 0, 0, 1, h, v, size); // horizontal
    expect(h[0][0]).toBe(true);
    addEdge(0, 1, 1, 1, h, v, size); // vertical
    expect(v[0][1]).toBe(true);
  });

  it('countEdges and countEdgesForSolution agree on simple edges', () => {
    const h = emptyH.map(row => [...row]);
    const v = emptyV.map(row => [...row]);
    addEdge(0, 0, 0, 1, h, v, size);
    addEdge(0, 1, 1, 1, h, v, size);
    expect(countEdges(0, 0, h, v, size)).toBe(1);
    expect(countEdges(0, 1, h, v, size)).toBe(2);
    expect(countEdgesForSolution(0, 1, h, v, size)).toBe(2);
  });

  it('checkSolved fails when circle constraints or degree rules are broken', () => {
    const circleGrid = Array(size).fill(null).map(() => Array(size).fill(0));
    const h = emptyH.map(row => [...row]);
    const v = emptyV.map(row => [...row]);
    // Only one edge -> degree 1 -> should not solve
    addEdge(0, 0, 0, 1, h, v, size);
    expect(checkSolved(circleGrid, h, v, size)).toBe(false);
  });

  it('checkLoopConnectivity detects a simple loop', () => {
    const h = [
      [true, true],
      [false, false],
      [true, true],
    ];
    const v = [
      [true, false, true],
      [true, false, true],
    ];
    expect(checkLoopConnectivity(h, v, 3)).toBe(true);
  });
});
