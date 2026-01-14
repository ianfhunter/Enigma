import { describe, it, expect, vi } from 'vitest';
import {
  N, E, S, W,
  rotateMaskCW,
  rotateMask,
  rcToIdx,
  idxToRC,
  neighbors,
  opposite,
  shuffled,
  makeTreeMasks,
  scrambleMasks,
  edgeCountAndConnectivity,
  maskToGlyph,
} from './Netgame.jsx';

describe('Netgame - helpers', () => {
  it('rotations map directions correctly', () => {
    expect(rotateMaskCW(N)).toBe(E);
    expect(rotateMask(N | E)).toBe(E | S);
  });

  it('index conversions and neighbors are consistent', () => {
    const w = 3;
    expect(idxToRC(rcToIdx(1, 2, w), w)).toEqual({ r: 1, c: 2 });
    const nbs = neighbors(rcToIdx(1, 1, w), w, 3);
    const dirs = nbs.map(n => n.dir);
    expect(dirs).toContain(N);
    expect(dirs).toContain(S);
    expect(dirs).toContain(E);
    expect(dirs).toContain(W);
  });

  it('opposite returns inverse direction', () => {
    expect(opposite(N)).toBe(S);
    expect(opposite(E)).toBe(W);
  });

  it('maskToGlyph maps degree patterns', () => {
    expect(maskToGlyph(N)).toBe('╵');
    expect(maskToGlyph(N | S)).toBe('│');
    expect(maskToGlyph(N | E | S | W)).toBe('┼');
  });
});

describe('Netgame - generation and connectivity', () => {
  it('makeTreeMasks builds a spanning tree (edges = n-1, all connected)', () => {
    const rand = vi.spyOn(Math, 'random').mockReturnValue(0.1);
    const w = 3; const h = 3;
    const masks = makeTreeMasks(w, h);
    rand.mockRestore();
    const { edges, connectedCount } = edgeCountAndConnectivity(masks, w, h, 0);
    const total = w * h;
    expect(edges).toBe(total - 1);
    expect(connectedCount).toBe(total);
  });

  it('scrambleMasks keeps degree counts but changes orientation', () => {
    const masks = [N, E, S, W];
    const rand = vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const scrambled = scrambleMasks(masks);
    rand.mockRestore();
    expect(scrambled).toHaveLength(4);
  });
});
