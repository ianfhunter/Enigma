import { describe, it, expect } from 'vitest';
import {
  gcd,
  gcdMultiple,
  solvePuzzle,
  DIFFICULTIES,
} from './WaterPouring.jsx';

describe('WaterPouring - helpers', () => {
  it('gcd and gcdMultiple work', () => {
    expect(gcd(12, 8)).toBe(4);
    expect(gcdMultiple([8, 12, 20])).toBe(4);
  });

  it('solvePuzzle finds classic 3/5 to 4 solution', () => {
    const puzzle = {
      jugs: [{ capacity: 3, initial: 0 }, { capacity: 5, initial: 0 }],
      target: 4,
      source: 'infinite',
    };
    const res = solvePuzzle(puzzle);
    expect(res.solvable).toBe(true);
    expect(res.minMoves).toBeGreaterThan(0);
  });

  it('solvePuzzle handles unsolvable puzzles', () => {
    const puzzle = {
      jugs: [{ capacity: 2, initial: 0 }, { capacity: 4, initial: 0 }],
      target: 5, // Impossible target
      source: 'infinite',
    };
    const res = solvePuzzle(puzzle);
    expect(res.solvable).toBe(false);
  });

  it('solvePuzzle handles conservation mode', () => {
    const puzzle = {
      jugs: [{ capacity: 8, initial: 8 }, { capacity: 5, initial: 0 }, { capacity: 3, initial: 0 }],
      target: 4,
      source: 'none',
    };
    const res = solvePuzzle(puzzle);
    expect(res.solvable).toBe(true);
    expect(res.minMoves).toBeGreaterThan(0);
  });

  it('DIFFICULTIES constant is defined', () => {
    expect(DIFFICULTIES).toBeDefined();
    expect(Array.isArray(DIFFICULTIES)).toBe(true);
    expect(DIFFICULTIES.length).toBeGreaterThan(0);
    expect(DIFFICULTIES).toContain('easy');
    expect(DIFFICULTIES).toContain('medium');
    expect(DIFFICULTIES).toContain('hard');
  });
});
