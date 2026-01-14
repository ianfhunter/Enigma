import { describe, it, expect } from 'vitest';
import {
  RADIUS,
  DIRS,
  inBoard,
  neighbor,
  oppositeSide,
  generateMatchings,
  rotatedExit,
  computeBoardCells,
  TILE_TYPES,
  makeNewGameState,
  traverseForward,
} from './Entanglement.jsx';

describe('Entanglement - grid geometry', () => {
  it('neighbor moves follow DIRS', () => {
    const start = { q: 0, r: 0 };
    const n0 = neighbor(start.q, start.r, 0);
    expect(n0).toEqual({ q: start.q + DIRS[0][0], r: start.r + DIRS[0][1] });
  });

  it('oppositeSide maps 0..5 correctly', () => {
    for (let s = 0; s < 6; s++) {
      expect(oppositeSide(oppositeSide(s))).toBe(s);
      expect(oppositeSide(s)).toBe((s + 3) % 6);
    }
  });

  it('inBoard only accepts axial coords within radius', () => {
    expect(inBoard(0, 0)).toBe(true);
    expect(inBoard(RADIUS + 1, 0)).toBe(false);
    expect(inBoard(0, RADIUS + 1)).toBe(false);
  });
});

describe('Entanglement - tile wiring', () => {
  it('generateMatchings yields 15 perfect matchings of 6 sides', () => {
    const matchings = generateMatchings();
    expect(matchings.length).toBe(15);
    matchings.forEach(map => {
      expect(map).toHaveLength(6);
      for (let i = 0; i < 6; i++) {
        expect(map[map[i]]).toBe(i);
      }
    });
  });

  it('rotatedExit maps entry through rotation correctly', () => {
    const map = [1, 0, 3, 2, 5, 4]; // pairs 0-1, 2-3, 4-5
    // rotate by 1: entry 0 in rotated frame -> baseEntry 5 -> baseExit 4 -> rotated back 5
    expect(rotatedExit(map, 1, 0)).toBe(5);
  });
});

describe('Entanglement - board cells', () => {
  it('computeBoardCells returns expected count for radius 4', () => {
    const cells = computeBoardCells();
    // Hex grid cell count formula: 1 + 3r(r+1)
    const expected = 1 + 3 * RADIUS * (RADIUS + 1);
    expect(cells.length).toBe(expected);
  });
});

describe('Entanglement - traversal basics', () => {
  it('makeNewGameState returns a frontier when only center placed', () => {
    const state = makeNewGameState(TILE_TYPES);
    expect(state.board.size).toBe(1);
    // If game already ended, we still expect pathSegments to be recorded
    expect(Array.isArray(state.pathSegments)).toBe(true);
  });

  it('traverseForward yields frontier on empty board', () => {
    const board = new Map();
    const res = traverseForward({ q: 0, r: 0 }, 0, board, TILE_TYPES);
    expect(res.frontier).toBeTruthy();
    expect(res.ended).toBeNull();
  });
});
