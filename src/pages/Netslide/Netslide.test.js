import { describe, it, expect, vi } from 'vitest';
import {
  N, E, S, W,
  rcToIdx,
  idxToRC,
  opposite,
  neighbors,
  makeTreeMasks,
  shiftRow,
  shiftCol,
  scrambleBySlides,
  edgeCountAndConnectivity,
  maskToGlyph,
} from './Netslide.jsx';

describe('Netslide - helpers', () => {
  it('index conversions and opposites work', () => {
    expect(idxToRC(rcToIdx(1, 2, 4), 4)).toEqual({ r: 1, c: 2 });
    expect(opposite(N)).toBe(S);
  });

  it('neighbors returns valid neighbors', () => {
    const nbs = neighbors(rcToIdx(1, 1, 3), 3, 3);
    const dirs = nbs.map(n => n.dir);
    expect(dirs).toContain(N);
    expect(dirs).toContain(E);
  });

  it('maskToGlyph maps degree patterns', () => {
    expect(maskToGlyph(N | S)).toBe('│');
    expect(maskToGlyph(N | E)).toBe('└');
  });
});

describe('Netslide - board shifts and connectivity', () => {
  it('shiftRow and shiftCol wrap tiles', () => {
    const board = [1, 2, 3, 4];
    expect(shiftRow(board, 2, 0, 'left')).toEqual([2, 1, 3, 4]);
    expect(shiftCol(board, 2, 2, 0, 'down')).toEqual([3, 2, 1, 4]);
  });

  it('makeTreeMasks creates connected tree; scramble keeps size', () => {
    const rand = vi.spyOn(Math, 'random').mockReturnValue(0.3);
    const masks = makeTreeMasks(3, 3);
    rand.mockRestore();
    expect(masks).toHaveLength(9);
    const { edges, connectedCount } = edgeCountAndConnectivity(masks, 3, 3, 0);
    expect(edges).toBe(8);
    expect(connectedCount).toBe(9);

    const scrambled = scrambleBySlides(masks, 3, 3, 2);
    expect(scrambled).toHaveLength(9);
  });
});
