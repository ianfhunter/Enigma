import { describe, it, expect } from 'vitest';
import {
  BIN_CAPACITY,
  DIFFICULTY_CONFIG,
  canMove,
  moveBalls,
  isSolved,
  generateBallSortPuzzle,
  getTopRunLength,
} from './BallSortLogic';

describe('BallSortLogic', () => {
  it('moves the full top run onto matching color until destination is full', () => {
    const state = [
      [1, 1, 1, 0],
      [1],
      [],
    ];

    const next = moveBalls(state, 0, 1);
    expect(next[0]).toEqual([0]);
    expect(next[1]).toEqual([1, 1, 1, 1]);
  });


  it('stops moving when destination reaches full capacity', () => {
    const state = [
      [2, 2, 2],
      [2, 2, 2],
      [],
    ];

    const next = moveBalls(state, 0, 1);
    expect(next[0]).toEqual([2, 2]);
    expect(next[1]).toEqual([2, 2, 2, 2]);
  });

  it('does not allow moves to non-matching non-empty bin', () => {
    const state = [
      [0, 0],
      [1, 1],
      [],
    ];

    expect(canMove(state, 0, 1)).toBe(false);
    expect(moveBalls(state, 0, 1)).toBe(state);
  });

  it('pours from the top of the source bin, not the bottom', () => {
    const state = [
      [2, 1, 1, 1],
      [],
    ];

    const next = moveBalls(state, 0, 1);
    expect(next[0]).toEqual([1, 1, 1]);
    expect(next[1]).toEqual([2]);
  });

  it('detects solved and unsolved states', () => {
    const solved = [[0, 0, 0, 0], [1, 1, 1, 1], []];
    const unsolved = [[0, 1, 0, 1], [1, 1, 1, 0], []];

    expect(isSolved(solved)).toBe(true);
    expect(isSolved(unsolved)).toBe(false);
  });

  it('generates deterministic puzzle for same seed and difficulty', () => {
    const first = generateBallSortPuzzle(123456, 'medium');
    const second = generateBallSortPuzzle(123456, 'medium');

    expect(second).toEqual(first);
    expect(isSolved(first.bins)).toBe(false);
  });

  it('respects difficulty bounds and exact color counts', () => {
    for (const [difficulty, config] of Object.entries(DIFFICULTY_CONFIG)) {
      const puzzle = generateBallSortPuzzle(7890, difficulty);
      expect(puzzle.fullBins).toBeGreaterThanOrEqual(config.minFullBins);
      expect(puzzle.fullBins).toBeLessThanOrEqual(config.maxFullBins);
      expect(puzzle.bins.length).toBe(puzzle.fullBins + config.emptyBins);

      const emptyBins = puzzle.bins.filter((bin) => bin.length === 0);
      const nonEmptyBins = puzzle.bins.filter((bin) => bin.length > 0);
      expect(emptyBins).toHaveLength(config.emptyBins);
      expect(nonEmptyBins).toHaveLength(puzzle.fullBins);

      const counts = new Map();
      for (const bin of puzzle.bins) {
        expect(bin.length).toBeLessThanOrEqual(BIN_CAPACITY);
        if (bin.length > 0) expect(bin.length).toBe(BIN_CAPACITY);
        for (const color of bin) counts.set(color, (counts.get(color) || 0) + 1);
      }

      for (let color = 0; color < puzzle.fullBins; color++) {
        expect(counts.get(color)).toBe(BIN_CAPACITY);
      }

      const hasMixedBin = nonEmptyBins.some((bin) => new Set(bin).size > 1);
      expect(hasMixedBin).toBe(true);
    }
  });

  it('computes top run length correctly', () => {
    expect(getTopRunLength([])).toBe(0);
    expect(getTopRunLength([2, 2, 2, 1])).toBe(3);
    expect(getTopRunLength([3, 3, 2, 2])).toBe(2);
  });
});
