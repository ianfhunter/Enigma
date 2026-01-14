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
