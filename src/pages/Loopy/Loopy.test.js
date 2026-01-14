import { describe, it, expect } from 'vitest';
import {
  DIFFICULTIES,
  getAvailableSizes,
  idxHEdge,
  idxVEdge,
  solutionToEdges,
  analyze,
} from './Loopy.jsx';

describe('Loopy - metadata', () => {
  it('exposes difficulties and sorted sizes', () => {
    expect(DIFFICULTIES).toEqual(['easy', 'medium', 'hard']);
    const sizes = getAvailableSizes('easy');
    const sorted = [...sizes].sort((a, b) => {
      const [ar] = a.split('×').map(Number);
      const [br] = b.split('×').map(Number);
      return ar - br;
    });
    expect(sizes).toEqual(sorted);
  });
});

describe('Loopy - helpers', () => {
  it('edge index helpers map to unique positions', () => {
    expect(idxHEdge(1, 2, 5)).toBe(7);
    expect(idxVEdge(0, 1, 3)).toBe(1);
  });

  it('solutionToEdges marks boundaries around inside cells', () => {
    const solutionRaw = ['x .', '. x'];
    const { hEdges, vEdges } = solutionToEdges(solutionRaw, 2, 2);
    // Top-left cell contributes top and left edges
    expect(hEdges[idxHEdge(0, 0, 2)]).toBe(1);
    expect(vEdges[idxVEdge(0, 0, 2)]).toBe(1);
  });

  it('analyze flags incorrect clue counts and loop status', () => {
    const w = 1;
    const h = 1;
    const clues = [0];
    // Single edge active -> degree mismatch
    const hEdges = [1, 0];
    const vEdges = [0, 0];
    const res = analyze(w, h, clues, hEdges, vEdges);
    expect(res.clueBad.size).toBe(1);
    expect(res.loopOk).toBe(false);
    expect(res.solved).toBe(false);
  });
});
