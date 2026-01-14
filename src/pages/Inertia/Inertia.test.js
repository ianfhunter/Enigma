import { describe, it, expect, vi } from 'vitest';
import {
  generateLevel,
  parseLevel,
  rcToIdx,
  idxToRC,
  solveLevel,
  SIZES,
  DIFFICULTIES,
  DIRS,
} from './Inertia.jsx';

const makeLCGRand = (seed = 123456) => {
  let s = seed;
  return () => {
    s = (s * 48271) % 0x7fffffff;
    return s / 0x7fffffff;
  };
};

describe('Inertia - metadata', () => {
  it('exposes size and difficulty presets', () => {
    expect(SIZES).toEqual([7, 9, 11]);
    expect(DIFFICULTIES).toEqual(['easy', 'medium', 'hard']);
    expect(DIRS.length).toBe(9);
  });
});

describe('Inertia - indexing helpers', () => {
  it('rcToIdx and idxToRC are inverses', () => {
    const w = 5;
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        const idx = rcToIdx(r, c, w);
        const rc = idxToRC(idx, w);
        expect(rc).toEqual({ r, c });
      }
    }
  });
});

describe('Inertia - level generation and parsing', () => {
  it('generateLevel creates bordered grid with a start and at least one gem', () => {
    const rand = makeLCGRand(98765);
    const level = generateLevel(7, 'easy', rand, false);

    const { grid } = level;
    const h = grid.length;
    const w = grid[0].length;

    expect(h).toBe(9); // size+2
    expect(w).toBe(9);
    grid.forEach(row => expect(row.length).toBe(w));

    // Borders should be walls
    expect(grid[0].every(ch => ch === '#')).toBe(true);
    expect(grid[h - 1].every(ch => ch === '#')).toBe(true);
    grid.forEach(row => {
      expect(row[0]).toBe('#');
      expect(row[w - 1]).toBe('#');
    });

    const parsed = parseLevel(level);
    expect(parsed.start).not.toBeNull();
    expect(parsed.totalGems).toBeGreaterThan(0);
    const solved = solveLevel(parsed, true);
    expect(solved.solvable).toBe(true);
  });

  it('parseLevel flattens cells and counts gems', () => {
    const sample = {
      grid: [
        '#O*',
        '#.#',
        '###',
      ],
    };
    const parsed = parseLevel(sample);
    expect(parsed.w).toBe(3);
    expect(parsed.h).toBe(3);
    expect(parsed.cells.length).toBe(9);
    expect(parsed.start).toEqual({ r: 0, c: 1 });
    expect(parsed.totalGems).toBe(1);
  });

  it('solveLevel detects solvable unique puzzle', () => {
    const grid = [
      '#####',
      '#O*##',
      '#####',
    ].map(r => r.split(''));
    const parsed = parseLevel({ grid });
    const res = solveLevel(parsed, true);
    expect(res.solvable).toBe(true);
    expect(res.unique).toBe(true);
  });

  it('solveLevel rejects puzzles that force a mine', () => {
    const grid = [
      '#####',
      '#O*X#',
      '#####',
    ].map(r => r.split(''));
    const parsed = parseLevel({ grid });
    const res = solveLevel(parsed, true);
    expect(res.solvable).toBe(false);
    expect(res.unique).toBe(false);
  });
});
