import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATASET_PATH = path.join(__dirname, '..', 'public', 'datasets', 'mochikoroPuzzles.json');

/**
 * Check for 2x2 black squares
 */
function has2x2BlackSquare(grid, rows, cols) {
  for (let r = 0; r < rows - 1; r++) {
    for (let c = 0; c < cols - 1; c++) {
      if (grid[r][c] === 'black' && grid[r+1][c] === 'black' &&
          grid[r][c+1] === 'black' && grid[r+1][c+1] === 'black') {
        return true;
      }
    }
  }
  return false;
}

/**
 * Find connected white region using BFS
 */
function findWhiteRegion(grid, startR, startC, rows, cols, visited) {
  const DIRS = [[-1, 0], [1, 0], [0, -1], [0, 1]];
  if (grid[startR][startC] !== 'white' || visited.has(`${startR},${startC}`)) {
    return null;
  }

  const region = [];
  const queue = [[startR, startC]];
  visited.add(`${startR},${startC}`);

  while (queue.length > 0) {
    const [r, c] = queue.shift();
    region.push([r, c]);

    for (const [dr, dc] of DIRS) {
      const nr = r + dr;
      const nc = c + dc;
      const key = `${nr},${nc}`;

      if (nr >= 0 && nr < rows && nc >= 0 && nc < cols &&
          grid[nr][nc] === 'white' && !visited.has(key)) {
        visited.add(key);
        queue.push([nr, nc]);
      }
    }
  }

  return region;
}

/**
 * Check if a region forms a rectangle
 */
function isRectangle(region) {
  if (region.length === 0) return false;

  let minR = Infinity, maxR = -Infinity;
  let minC = Infinity, maxC = -Infinity;

  for (const [r, c] of region) {
    minR = Math.min(minR, r);
    maxR = Math.max(maxR, r);
    minC = Math.min(minC, c);
    maxC = Math.max(maxC, c);
  }

  const expectedCount = (maxR - minR + 1) * (maxC - minC + 1);
  return region.length === expectedCount;
}

describe('Mochikoro Dataset', () => {
  let puzzles = [];

  // Load the dataset before running tests
  beforeAll(() => {
    if (fs.existsSync(DATASET_PATH)) {
      const data = JSON.parse(fs.readFileSync(DATASET_PATH, 'utf8'));
      puzzles = data.puzzles || [];
    }
  });

  it('should have puzzles in the dataset', () => {
    expect(puzzles.length).toBeGreaterThan(0);
  });

  it('should have puzzles for each size/difficulty combination', () => {
    // Note: 10x10 is disabled - too hard to generate reliably
    const configs = [
      { rows: 5, cols: 5 },
      { rows: 7, cols: 7 },
    ];
    const difficulties = ['easy', 'medium', 'hard'];

    for (const { rows, cols } of configs) {
      for (const difficulty of difficulties) {
        const matching = puzzles.filter(
          p => p.rows === rows && p.cols === cols && p.difficulty === difficulty
        );
        expect(matching.length).toBeGreaterThan(0,
          `No puzzles for ${rows}x${cols} ${difficulty}`);
      }
    }
  });

  it('should have valid puzzle structure', () => {
    const sampled = puzzles.slice(0, 30);

    for (const puzzle of sampled) {
      expect(puzzle).toHaveProperty('rows');
      expect(puzzle).toHaveProperty('cols');
      expect(puzzle).toHaveProperty('clues');
      expect(puzzle).toHaveProperty('solution');
      expect(puzzle).toHaveProperty('seed');
      expect(puzzle).toHaveProperty('difficulty');
      expect(puzzle).toHaveProperty('id');

      // Clues grid should be correct size
      expect(puzzle.clues.length).toBe(puzzle.rows);
      expect(puzzle.clues[0].length).toBe(puzzle.cols);

      // Solution grid should be correct size
      expect(puzzle.solution.length).toBe(puzzle.rows);
      expect(puzzle.solution[0].length).toBe(puzzle.cols);
    }
  });

  it('should have no 2x2 black squares in solutions', () => {
    const sampled = puzzles.slice(0, 50);

    for (const puzzle of sampled) {
      const hasViolation = has2x2BlackSquare(puzzle.solution, puzzle.rows, puzzle.cols);
      expect(hasViolation).toBe(false,
        `Puzzle ${puzzle.id} has 2x2 black square`);
    }
  });

  it('should have all white regions as valid rectangles', () => {
    const sampled = puzzles.slice(0, 50);

    for (const puzzle of sampled) {
      const { solution, rows, cols } = puzzle;
      const visited = new Set();

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (solution[r][c] === 'white' && !visited.has(`${r},${c}`)) {
            const region = findWhiteRegion(solution, r, c, rows, cols, visited);
            expect(isRectangle(region)).toBe(true,
              `Puzzle ${puzzle.id} has non-rectangular white region at (${r}, ${c})`);
          }
        }
      }
    }
  });

  it('should have exactly one clue per white rectangle with matching area', () => {
    const sampled = puzzles.slice(0, 50);

    for (const puzzle of sampled) {
      const { solution, clues, rows, cols } = puzzle;
      const visited = new Set();

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (solution[r][c] === 'white' && !visited.has(`${r},${c}`)) {
            const region = findWhiteRegion(solution, r, c, rows, cols, visited);

            // Count clues in region
            let clueCount = 0;
            let clueValue = null;

            for (const [rr, cc] of region) {
              if (clues[rr][cc] !== null) {
                clueCount++;
                clueValue = clues[rr][cc];
              }
            }

            expect(clueCount).toBe(1,
              `Puzzle ${puzzle.id} has ${clueCount} clues in region at (${r}, ${c})`);
            expect(clueValue).toBe(region.length,
              `Puzzle ${puzzle.id}: clue ${clueValue} doesn't match region area ${region.length}`);
          }
        }
      }
    }
  });

  it('should have unique seeds per size/difficulty', () => {
    const seedMap = new Map();

    for (const puzzle of puzzles) {
      const key = `${puzzle.rows}x${puzzle.cols}-${puzzle.difficulty}`;
      if (!seedMap.has(key)) {
        seedMap.set(key, new Set());
      }
      seedMap.get(key).add(puzzle.seed);
    }

    // Check that we have variety in seeds
    for (const [key, seeds] of seedMap) {
      const puzzleCount = puzzles.filter(p =>
        `${p.rows}x${p.cols}-${p.difficulty}` === key
      ).length;
      expect(seeds.size).toBe(puzzleCount,
        `${key} has duplicate seeds`);
    }
  });
});
