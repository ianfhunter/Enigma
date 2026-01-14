import { describe, it, expect, vi } from 'vitest';
import {
  DIFFICULTIES,
  isBlocked,
  moveMinotaurOnce,
  stateKey,
  solvePuzzle,
  generateWalls,
  isReachable,
  findSolvablePlacement,
  generatePuzzle,
} from './TheseusMinotaur.jsx';

describe('Theseus & Minotaur - helpers', () => {
  it('exports difficulties', () => {
    expect(Object.keys(DIFFICULTIES)).toContain('Easy');
  });

  it('isBlocked checks boundaries and walls', () => {
    const walls = [[0]];
    expect(isBlocked(walls, 1, 1, 0, 0, -1, 0)).toBe(true);
  });

  it('stateKey combines positions', () => {
    expect(stateKey({ x: 1, y: 2 }, { x: 3, y: 4 })).toBe('1,2,3,4');
  });

  it('moveMinotaurOnce moves horizontally first', () => {
    const walls = [[0,0],[0,0]];
    const next = moveMinotaurOnce(walls, 2, 2, { x: 0, y: 0 }, { x: 1, y: 0 });
    expect(next).toEqual({ x: 1, y: 0 });
  });

  it('generateWalls returns wall grid with bits', () => {
    const rand = vi.spyOn(Math, 'random').mockReturnValue(0.9);
    const walls = generateWalls(2, 2, 0.5);
    rand.mockRestore();
    expect(walls.length).toBe(2);
  });

  it('isReachable detects connectivity', () => {
    const walls = [
      [0, 0],
      [0, 0],
    ];
    expect(isReachable(walls, 2, 2, { x: 0, y: 0 }, { x: 1, y: 1 })).toBe(true);
  });

  it('findSolvablePlacement finds a valid minotaur position', () => {
    const walls = [
      [0, 0, 0],
      [0, 0, 0],
      [0, 0, 0],
    ];
    const result = findSolvablePlacement(walls, 3, 3, { x: 0, y: 2 }, { x: 2, y: 2 }, 1);
    expect(result).not.toBeNull();
    expect(result.solution.solvable).toBe(true);
    expect(result.solution.path.length).toBeGreaterThan(0);
  });

  it('solvePuzzle finds trivial path with wait', () => {
    const walls = [
      [0, 0],
      [0, 0],
    ];
    const res = solvePuzzle(walls, 2, 2, { x: 0, y: 0 }, { x: 1, y: 1 }, { x: 0, y: 0 });
    expect(res.solvable).toBe(true);
  });

  it('generatePuzzle returns puzzle data', () => {
    const rand = vi.spyOn(Math, 'random').mockReturnValue(0.2);
    const puz = generatePuzzle('Easy');
    rand.mockRestore();
    expect(puz.width).toBeGreaterThan(0);
    expect(puz.solution.length).toBeGreaterThan(0);
  });
});
