import { describe, it, expect, vi } from 'vitest';
import {
  gcd,
  gcdMultiple,
  solvePuzzle,
  generateInfinitePuzzle,
  generateConservationPuzzle,
  generatePuzzle,
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

  it('generateInfinitePuzzle returns solvable puzzle', () => {
    const rand = vi.spyOn(Math, 'random').mockReturnValue(0.3);
    const puzzle = generateInfinitePuzzle(3, 'easy');
    rand.mockRestore();
    expect(puzzle.jugs.length).toBe(3);
    expect(puzzle.minMoves).toBeGreaterThan(0);
  });

  it('generateConservationPuzzle returns solvable puzzle', () => {
    const rand = vi.spyOn(Math, 'random').mockReturnValue(0.3);
    const puzzle = generateConservationPuzzle(3, 'easy');
    rand.mockRestore();
    expect(puzzle.jugs.length).toBe(3);
    expect(puzzle.minMoves).toBeGreaterThan(0);
  });

  it('generatePuzzle selects based on hasSource', () => {
    const p1 = generatePuzzle({ numJugs: 2, difficulty: 'easy', hasSource: true });
    const p2 = generatePuzzle({ numJugs: 3, difficulty: 'easy', hasSource: false });
    expect(p1.source).toBe('infinite');
    expect(p2.source).toBe('none');
    expect(DIFFICULTIES).toContain('medium');
  });
});
