import { describe, it, expect } from 'vitest';
import {
  idx,
  inBounds,
  isWall,
  isNumberedWall,
  getWallNumber,
  DIFFICULTIES,
  getAvailableSizes,
  parseDatasetPuzzle,
  solutionToEdges,
  analyze,
} from './Lightup.jsx';

describe('Lightup - helpers', () => {
  it('index and bounds helpers work', () => {
    expect(idx(1, 2, 5)).toBe(7);
    expect(inBounds(0, 0, 2, 2)).toBe(true);
    expect(inBounds(2, 0, 2, 2)).toBe(false);
  });

  it('wall helpers classify cells correctly', () => {
    expect(isWall('#')).toBe(true);
    expect(isWall(3)).toBe(true);
    expect(isWall('.')).toBe(false);
    expect(isNumberedWall('2')).toBe(true);
    expect(isNumberedWall(5)).toBe(false);
    expect(getWallNumber('3')).toBe(3);
  });

  it('getAvailableSizes returns sorted unique sizes', () => {
    const sizes = getAvailableSizes('easy');
    const sorted = [...sizes].sort((a, b) => {
      const [ar, ac] = a.split('x').map(Number);
      const [br, bc] = b.split('x').map(Number);
      return ar * ac - br * bc;
    });
    expect(sizes).toEqual(sorted.slice(0, sizes.length)); // already sorted/limited
    expect(DIFFICULTIES).toEqual(['easy', 'medium', 'hard']);
  });
});

describe('Lightup - puzzle parsing and analysis', () => {
  it('parseDatasetPuzzle builds width/height/cells and solution bulbs', () => {
    const puzzle = {
      rows: 2,
      cols: 2,
      clues: [
        ['#', '.'],
        ['1', '.'],
      ],
      solution: [
        [true, false],
        [false, false],
      ],
    };
    const parsed = parseDatasetPuzzle(puzzle);
    expect(parsed.w).toBe(2);
    expect(parsed.h).toBe(2);
    expect(parsed.cells).toHaveLength(4);
    expect(parsed.solutionBulbs.has(idx(0, 1, 2))).toBe(true);
  });

  it('solutionToEdges converts inside cells to loop edges', () => {
    const solutionRaw = ['x .', '. .']; // only top-left inside
    const { hEdges, vEdges } = solutionToEdges(solutionRaw, 2, 2);
    // Expect edges around cell (0,0) set
    expect(hEdges[idx(0, 0, 2)]).toBe(1);
    expect(vEdges[idx(0, 0, 3)]).toBe(1);
  });

  it('analyze flags clue violations and validates loops', () => {
    const w = 1;
    const h = 1;
    const clues = [4]; // impossible with one cell
    const hEdges = [0, 0];
    const vEdges = [0, 0];
    const res = analyze(w, h, clues, hEdges, vEdges);
    expect(res.clueBad.size).toBe(1);
    expect(res.loopOk).toBe(false);
    expect(res.solved).toBe(false);
  });
});

describe('Lightup - Bug fix: empty grid should not appear solved', () => {
  it('parseDatasetPuzzle handles empty puzzle without crashing', () => {
    // Test the edge case where an empty puzzle is parsed
    // This is part of the bug fix for "solved on refresh"
    const puzzle = {
      rows: 0,
      cols: 0,
      clues: [],
      solution: [],
    };
    const parsed = parseDatasetPuzzle(puzzle);

    expect(parsed.w).toBe(0);
    expect(parsed.h).toBe(0);
    expect(parsed.cells).toHaveLength(0);
    expect(parsed.solutionBulbs.size).toBe(0);
  });

  it('parseDatasetPuzzle correctly identifies solution bulbs', () => {
    // Verify that solution bulbs are correctly extracted
    const puzzle = {
      rows: 3,
      cols: 3,
      clues: [
        ['.', '.', '.'],
        ['.', '1', '.'],
        ['.', '.', '.'],
      ],
      solution: [
        [false, true, true],
        [true, false, true],
        [true, true, false],
      ],
    };
    const parsed = parseDatasetPuzzle(puzzle);

    // Solution bulbs should be where solution[r][c] === false
    expect(parsed.solutionBulbs.has(idx(0, 0, 3))).toBe(true);
    expect(parsed.solutionBulbs.has(idx(2, 2, 3))).toBe(true);

    // Cells where solution[r][c] === true should NOT have bulbs
    expect(parsed.solutionBulbs.has(idx(0, 1, 3))).toBe(false);
    expect(parsed.solutionBulbs.has(idx(1, 0, 3))).toBe(false);
  });

  it('puzzle with all walls is valid', () => {
    // Edge case: a puzzle that is all walls
    const puzzle = {
      rows: 2,
      cols: 2,
      clues: [
        ['#', '#'],
        ['#', '#'],
      ],
      solution: [
        [true, true],
        [true, true],
      ],
    };
    const parsed = parseDatasetPuzzle(puzzle);

    expect(parsed.cells).toHaveLength(4);
    expect(parsed.cells.every(c => isWall(c))).toBe(true);
    // Since all cells are walls, no bulbs should be in solution
    expect(parsed.solutionBulbs.size).toBe(0);
  });

  it('numbered wall validation extracts correct numbers', () => {
    // Test that numbered walls are correctly parsed
    const puzzle = {
      rows: 3,
      cols: 3,
      clues: [
        ['.', '0', '.'],
        ['1', '2', '3'],
        ['.', '4', '.'],
      ],
      solution: [
        [false, true, true],
        [false, false, true],
        [true, true, true],
      ],
    };
    const parsed = parseDatasetPuzzle(puzzle);

    // Test that numbered walls have correct values
    expect(getWallNumber(parsed.cells[idx(0, 1, 3)])).toBe(0);
    expect(getWallNumber(parsed.cells[idx(1, 0, 3)])).toBe(1);
    expect(getWallNumber(parsed.cells[idx(1, 1, 3)])).toBe(2);
    expect(getWallNumber(parsed.cells[idx(1, 2, 3)])).toBe(3);
    expect(getWallNumber(parsed.cells[idx(2, 1, 3)])).toBe(4);
  });

  it('solution bulbs count is correct for various puzzle sizes', () => {
    // Test different puzzle sizes to ensure bulb counting works
    const puzzles = [
      {
        rows: 2,
        cols: 2,
        clues: [['.', '.'], ['.', '.']],
        solution: [[false, true], [true, false]],
        expectedBulbs: 2,
      },
      {
        rows: 3,
        cols: 3,
        clues: [['.', '.', '.'], ['.', '.', '.'], ['.', '.', '.']],
        solution: [[false, false, true], [false, true, true], [true, true, true]],
        expectedBulbs: 3, // Three false values = three bulbs
      },
      {
        rows: 1,
        cols: 5,
        clues: [['.', '.', '.', '.', '.']],
        solution: [[false, true, false, true, false]],
        expectedBulbs: 3,
      },
    ];

    puzzles.forEach((puzzle, i) => {
      const parsed = parseDatasetPuzzle(puzzle);
      expect(parsed.solutionBulbs.size).toBe(puzzle.expectedBulbs);
    });
  });

  it('bulb positions are correctly calculated from row/col indices', () => {
    // Verify that idx() function correctly maps to bulb positions
    const puzzle = {
      rows: 4,
      cols: 4,
      clues: [
        ['.', '.', '.', '.'],
        ['.', '.', '.', '.'],
        ['.', '.', '.', '.'],
        ['.', '.', '.', '.'],
      ],
      solution: [
        [false, true, true, true],
        [true, false, true, true],
        [true, true, false, true],
        [true, true, true, false],
      ],
    };
    const parsed = parseDatasetPuzzle(puzzle);

    // Check diagonal has bulbs (where solution === false)
    expect(parsed.solutionBulbs.has(idx(0, 0, 4))).toBe(true);
    expect(parsed.solutionBulbs.has(idx(1, 1, 4))).toBe(true);
    expect(parsed.solutionBulbs.has(idx(2, 2, 4))).toBe(true);
    expect(parsed.solutionBulbs.has(idx(3, 3, 4))).toBe(true);
    expect(parsed.solutionBulbs.size).toBe(4);
  });
});
