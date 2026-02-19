import { describe, it, expect } from 'vitest';
import { createSeededRandom } from '../../data/wordUtils';
import { generateRegionMap, solveGrid, countSolutions, generatePuzzle } from './JigsawSudoku.jsx';


function regionCounts(regionMap) {
  const counts = Array(9).fill(0);
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      counts[regionMap[r][c]]++;
    }
  }
  return counts;
}

function collectRegionCells(regionMap, region) {
  const cells = [];
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (regionMap[r][c] === region) cells.push([r, c]);
    }
  }
  return cells;
}

function isConnected(cells) {
  const key = ([r, c]) => `${r}-${c}`;
  const cellSet = new Set(cells.map(key));
  const queue = [cells[0]];
  const seen = new Set([key(cells[0])]);

  while (queue.length) {
    const [r, c] = queue.shift();
    for (const [nr, nc] of [[r + 1, c], [r - 1, c], [r, c + 1], [r, c - 1]]) {
      const k = `${nr}-${nc}`;
      if (!cellSet.has(k) || seen.has(k)) continue;
      seen.add(k);
      queue.push([nr, nc]);
    }
  }

  return seen.size === cells.length;
}

describe('JigsawSudoku generator', () => {
  it('generates 9 connected regions of 9 cells each', () => {
    const random = createSeededRandom(1337);
    const regionMap = generateRegionMap(random);

    for (let region = 0; region < 9; region++) {
      const cells = collectRegionCells(regionMap, region);
      expect(cells).toHaveLength(9);
      expect(isConnected(cells)).toBe(true);
    }
  });

  it('creates solved grids and enforces uniqueness', () => {
    const { puzzle, solution, regionMap } = generatePuzzle('medium', 424242);
    const solved = solveGrid(puzzle, regionMap, createSeededRandom(5));

    expect(solved).not.toBeNull();
    expect(solved).toEqual(solution);
    expect(countSolutions(puzzle, regionMap, 2)).toBe(1);
    expect(regionCounts(regionMap)).toEqual([9, 9, 9, 9, 9, 9, 9, 9, 9]);
  });

  it('respects difficulty clue ranges', () => {
    const easy = generatePuzzle('easy', 101);
    const medium = generatePuzzle('medium', 102);
    const hard = generatePuzzle('hard', 103);

    const clues = (p) => p.puzzle.flat().filter(n => n !== 0).length;
    expect(clues(easy)).toBeGreaterThanOrEqual(40);
    expect(clues(easy)).toBeLessThanOrEqual(45);
    expect(clues(medium)).toBeGreaterThanOrEqual(32);
    expect(clues(medium)).toBeLessThanOrEqual(39);
    expect(clues(hard)).toBeGreaterThanOrEqual(28);
    expect(clues(hard)).toBeLessThanOrEqual(31);
  });
});
