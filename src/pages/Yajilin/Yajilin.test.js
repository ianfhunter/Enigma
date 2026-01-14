import { describe, it, expect } from 'vitest';
import {
  parseClue,
  parseSolution,
  datasetToGameFormat,
  selectPuzzle,
  checkClue,
  checkSolved,
  makeSegmentKey,
  getCellConnections,
  validateLoop,
  hasAdjacentShaded,
} from './Yajilin.jsx';

describe('Yajilin - clue parsing', () => {
  it('parses valid clue strings', () => {
    expect(parseClue('1w')).toEqual({ count: 1, direction: 'w' });
    expect(parseClue('0n')).toEqual({ count: 0, direction: 'n' });
    expect(parseClue('3e')).toEqual({ count: 3, direction: 'e' });
    expect(parseClue('2s')).toEqual({ count: 2, direction: 's' });
  });

  it('returns null for invalid clue strings', () => {
    expect(parseClue(null)).toBe(null);
    expect(parseClue('')).toBe(null);
    expect(parseClue('abc')).toBe(null);
    expect(parseClue('1x')).toBe(null);
  });
});

describe('Yajilin - solution parsing', () => {
  it('parses shaded cells correctly', () => {
    const solution = [
      ['x', null, 'se'],
      [null, 'x', 'ns'],
    ];
    const { shaded } = parseSolution(solution);
    expect(shaded).toEqual([
      [true, false, false],
      [false, true, false],
    ]);
  });

  it('parses path segments correctly', () => {
    // A simple 2x2 grid with a path from (0,0) to (0,1) to (1,1) to (1,0) back to (0,0)
    const solution = [
      ['se', 'sw'],
      ['ne', 'nw'],
    ];
    const { pathSegments } = parseSolution(solution);

    // Check that path segments connect adjacent cells properly
    expect(pathSegments.has(makeSegmentKey(0, 0, 0, 1))).toBe(true); // horizontal top
    expect(pathSegments.has(makeSegmentKey(0, 0, 1, 0))).toBe(true); // vertical left
    expect(pathSegments.has(makeSegmentKey(0, 1, 1, 1))).toBe(true); // vertical right
    expect(pathSegments.has(makeSegmentKey(1, 0, 1, 1))).toBe(true); // horizontal bottom
  });
});

describe('Yajilin - makeSegmentKey', () => {
  it('creates normalized keys (smaller coords first)', () => {
    expect(makeSegmentKey(0, 0, 0, 1)).toBe('0,0-0,1');
    expect(makeSegmentKey(0, 1, 0, 0)).toBe('0,0-0,1');
    expect(makeSegmentKey(1, 0, 0, 0)).toBe('0,0-1,0');
    expect(makeSegmentKey(2, 3, 2, 4)).toBe('2,3-2,4');
  });
});

describe('Yajilin - getCellConnections', () => {
  it('returns connections for a cell', () => {
    const pathSegments = new Set([
      makeSegmentKey(1, 1, 0, 1), // north
      makeSegmentKey(1, 1, 1, 2), // east
    ]);
    const connections = getCellConnections(pathSegments, 1, 1, 3, 3);
    expect(connections).toContain('n');
    expect(connections).toContain('e');
    expect(connections).not.toContain('s');
    expect(connections).not.toContain('w');
  });

  it('returns empty array for cell with no connections', () => {
    const pathSegments = new Set();
    const connections = getCellConnections(pathSegments, 1, 1, 3, 3);
    expect(connections).toEqual([]);
  });
});

describe('Yajilin - hasAdjacentShaded', () => {
  it('returns true when adjacent shaded cells exist', () => {
    const shaded = [
      [true, true],
      [false, false],
    ];
    expect(hasAdjacentShaded(shaded, 0, 0, 2, 2)).toBe(true);
    expect(hasAdjacentShaded(shaded, 0, 1, 2, 2)).toBe(true);
  });

  it('returns false when no adjacent shaded cells', () => {
    const shaded = [
      [true, false],
      [false, true],
    ];
    expect(hasAdjacentShaded(shaded, 0, 0, 2, 2)).toBe(false);
    expect(hasAdjacentShaded(shaded, 1, 1, 2, 2)).toBe(false);
  });

  it('returns false for non-shaded cells', () => {
    const shaded = [
      [false, true],
      [false, false],
    ];
    expect(hasAdjacentShaded(shaded, 0, 0, 2, 2)).toBe(false);
  });
});

describe('Yajilin - validateLoop', () => {
  it('validates a simple closed loop', () => {
    // 2x2 grid with loop around all cells
    const pathSegments = new Set([
      makeSegmentKey(0, 0, 0, 1),
      makeSegmentKey(0, 0, 1, 0),
      makeSegmentKey(0, 1, 1, 1),
      makeSegmentKey(1, 0, 1, 1),
    ]);
    const shaded = [[false, false], [false, false]];
    const clues = [[null, null], [null, null]];

    const result = validateLoop(pathSegments, shaded, clues, 2, 2);
    expect(result.valid).toBe(true);
  });

  it('rejects incomplete loop', () => {
    // 2x2 grid with missing segment
    const pathSegments = new Set([
      makeSegmentKey(0, 0, 0, 1),
      makeSegmentKey(0, 0, 1, 0),
      makeSegmentKey(0, 1, 1, 1),
      // missing: makeSegmentKey(1, 0, 1, 1)
    ]);
    const shaded = [[false, false], [false, false]];
    const clues = [[null, null], [null, null]];

    const result = validateLoop(pathSegments, shaded, clues, 2, 2);
    expect(result.valid).toBe(false);
  });

  it('rejects empty path', () => {
    const pathSegments = new Set();
    const shaded = [[false, false], [false, false]];
    const clues = [[null, null], [null, null]];

    const result = validateLoop(pathSegments, shaded, clues, 2, 2);
    expect(result.valid).toBe(false);
  });

  it('accepts loop that skips shaded cells', () => {
    // 2x2 grid with one shaded cell
    // Loop should only go through 3 cells
    const pathSegments = new Set([
      makeSegmentKey(0, 0, 0, 1),
      makeSegmentKey(0, 0, 1, 0),
      makeSegmentKey(0, 1, 1, 0), // diagonal connection doesn't exist
    ]);
    const shaded = [[false, false], [false, true]]; // (1,1) is shaded
    const clues = [[null, null], [null, null]];

    // This is actually invalid because we can't make a loop with 3 cells in a 2x2 grid
    // when (1,1) is shaded - the remaining 3 cells form an L shape which can't be a loop
    const result = validateLoop(pathSegments, shaded, clues, 2, 2);
    expect(result.valid).toBe(false);
  });
});

describe('Yajilin - checkClue', () => {
  it('counts shaded cells in direction', () => {
    const shaded = [
      [false, false, true],
      [false, true, false],
      [false, false, false],
    ];

    // Clue at (0,0) pointing east should count 1 shaded cell
    expect(checkClue(shaded, { count: 1, direction: 'e' }, 0, 0, 3, 3)).toBe(true);
    expect(checkClue(shaded, { count: 2, direction: 'e' }, 0, 0, 3, 3)).toBe(false);

    // Clue at (0,0) pointing south should count 0 shaded cells
    expect(checkClue(shaded, { count: 0, direction: 's' }, 0, 0, 3, 3)).toBe(true);
  });

  it('returns null for null clue', () => {
    const shaded = [[false]];
    expect(checkClue(shaded, null, 0, 0, 1, 1)).toBe(null);
  });
});

describe('Yajilin - checkSolved', () => {
  it('returns true when shading and loop are correct', () => {
    const shaded = [[false, false], [false, false]];
    const solutionShaded = [[false, false], [false, false]];
    const clues = [[null, null], [null, null]];

    // Complete loop
    const pathSegments = new Set([
      makeSegmentKey(0, 0, 0, 1),
      makeSegmentKey(0, 0, 1, 0),
      makeSegmentKey(0, 1, 1, 1),
      makeSegmentKey(1, 0, 1, 1),
    ]);

    expect(checkSolved(shaded, pathSegments, solutionShaded, clues, 2, 2)).toBe(true);
  });

  it('returns false when shading is incorrect', () => {
    const shaded = [[true, false], [false, false]];
    const solutionShaded = [[false, false], [false, false]];
    const clues = [[null, null], [null, null]];
    const pathSegments = new Set();

    expect(checkSolved(shaded, pathSegments, solutionShaded, clues, 2, 2)).toBe(false);
  });

  it('returns false when loop is incomplete', () => {
    const shaded = [[false, false], [false, false]];
    const solutionShaded = [[false, false], [false, false]];
    const clues = [[null, null], [null, null]];

    // Incomplete loop
    const pathSegments = new Set([
      makeSegmentKey(0, 0, 0, 1),
    ]);

    expect(checkSolved(shaded, pathSegments, solutionShaded, clues, 2, 2)).toBe(false);
  });
});

describe('Yajilin - puzzle selection', () => {
  const puzzles = [
    { id: '1', difficulty: 'easy' },
    { id: '2', difficulty: 'easy' },
    { id: '3', difficulty: 'medium' },
    { id: '4', difficulty: 'hard' },
  ];

  it('filters by difficulty', () => {
    const puzzle = selectPuzzle(puzzles, 'medium', 12345);
    expect(puzzle.difficulty).toBe('medium');
  });

  it('falls back to all puzzles if difficulty not found', () => {
    const puzzle = selectPuzzle(puzzles, 'expert', 12345);
    expect(puzzle).not.toBe(null);
  });

  it('returns null for empty array', () => {
    expect(selectPuzzle([], 'easy', 12345)).toBe(null);
  });

  it('produces deterministic results with same seed', () => {
    const p1 = selectPuzzle(puzzles, 'easy', 99999);
    const p2 = selectPuzzle(puzzles, 'easy', 99999);
    expect(p1.id).toBe(p2.id);
  });
});

describe('Yajilin - dataset conversion', () => {
  it('converts dataset puzzle to game format', () => {
    const puzzle = {
      id: 'test_2x2',
      rows: 2,
      cols: 2,
      clues: [
        ['1e', null],
        [null, null],
      ],
      solution: [
        ['x', 'ew'],
        ['ns', 'nw'],
      ],
      difficulty: 'easy',
      source: 'test',
    };

    const game = datasetToGameFormat(puzzle);

    expect(game.rows).toBe(2);
    expect(game.cols).toBe(2);
    expect(game.difficulty).toBe('easy');
    expect(game.clues[0][0]).toEqual({ count: 1, direction: 'e' });
    expect(game.clues[0][1]).toBe(null);
    expect(game.solutionShaded[0][0]).toBe(true);
    expect(game.solutionShaded[0][1]).toBe(false);
    expect(game.solutionPath).toBeInstanceOf(Set);
  });
});
