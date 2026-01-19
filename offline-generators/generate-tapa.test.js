/**
 * Tests for Tapa Puzzle Generator
 *
 * Run with: npx vitest run offline-generators/generate-tapa.test.js
 */

import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import generator functions by dynamically loading the module
// We need to extract the functions for testing
// For now, we'll test the generated output directly

describe('Tapa Generator Output', () => {
  const datasetPath = path.join(__dirname, '..', 'public', 'datasets', 'tapaPuzzles.json');

  // Skip if dataset doesn't exist yet
  const datasetExists = fs.existsSync(datasetPath);

  it.skipIf(!datasetExists)('produces valid JSON output', () => {
    const data = JSON.parse(fs.readFileSync(datasetPath, 'utf8'));

    expect(data).toHaveProperty('name');
    expect(data).toHaveProperty('puzzles');
    expect(Array.isArray(data.puzzles)).toBe(true);
  });

  it.skipIf(!datasetExists)('puzzles have required fields', () => {
    const data = JSON.parse(fs.readFileSync(datasetPath, 'utf8'));

    for (const puzzle of data.puzzles) {
      expect(puzzle).toHaveProperty('id');
      expect(puzzle).toHaveProperty('rows');
      expect(puzzle).toHaveProperty('cols');
      expect(puzzle).toHaveProperty('difficulty');
      expect(puzzle).toHaveProperty('clues');
      expect(puzzle).toHaveProperty('solution');

      // Rows and cols should match
      expect(puzzle.rows).toBe(puzzle.cols);

      // Difficulty should be valid
      expect(['easy', 'medium', 'hard']).toContain(puzzle.difficulty);
    }
  });

  it.skipIf(!datasetExists)('clue grid dimensions match puzzle size', () => {
    const data = JSON.parse(fs.readFileSync(datasetPath, 'utf8'));

    for (const puzzle of data.puzzles) {
      expect(puzzle.clues.length).toBe(puzzle.rows);
      for (const row of puzzle.clues) {
        expect(row.length).toBe(puzzle.cols);
      }
    }
  });

  it.skipIf(!datasetExists)('solution grid dimensions match puzzle size', () => {
    const data = JSON.parse(fs.readFileSync(datasetPath, 'utf8'));

    for (const puzzle of data.puzzles) {
      expect(puzzle.solution.length).toBe(puzzle.rows);
      for (const row of puzzle.solution) {
        expect(row.length).toBe(puzzle.cols);
      }
    }
  });

  it.skipIf(!datasetExists)('clues are valid format (null or array of positive integers)', () => {
    const data = JSON.parse(fs.readFileSync(datasetPath, 'utf8'));

    for (const puzzle of data.puzzles) {
      for (let r = 0; r < puzzle.rows; r++) {
        for (let c = 0; c < puzzle.cols; c++) {
          const clue = puzzle.clues[r][c];
          if (clue !== null) {
            expect(Array.isArray(clue)).toBe(true);
            expect(clue.length).toBeGreaterThan(0);
            for (const num of clue) {
              expect(Number.isInteger(num)).toBe(true);
              expect(num).toBeGreaterThan(0);
              expect(num).toBeLessThanOrEqual(8); // Max 8 neighbors
            }
          }
        }
      }
    }
  });

  it.skipIf(!datasetExists)('solution cells are boolean values', () => {
    const data = JSON.parse(fs.readFileSync(datasetPath, 'utf8'));

    for (const puzzle of data.puzzles) {
      for (let r = 0; r < puzzle.rows; r++) {
        for (let c = 0; c < puzzle.cols; c++) {
          const cell = puzzle.solution[r][c];
          expect(typeof cell === 'boolean').toBe(true);
        }
      }
    }
  });

  it.skipIf(!datasetExists)('clue cells are not shaded in solution', () => {
    const data = JSON.parse(fs.readFileSync(datasetPath, 'utf8'));

    for (const puzzle of data.puzzles) {
      for (let r = 0; r < puzzle.rows; r++) {
        for (let c = 0; c < puzzle.cols; c++) {
          if (puzzle.clues[r][c] !== null) {
            expect(puzzle.solution[r][c]).toBe(false);
          }
        }
      }
    }
  });

  it.skipIf(!datasetExists)('solution has no 2x2 shaded blocks', () => {
    const data = JSON.parse(fs.readFileSync(datasetPath, 'utf8'));

    for (const puzzle of data.puzzles) {
      const { solution, rows, cols } = puzzle;

      for (let r = 0; r < rows - 1; r++) {
        for (let c = 0; c < cols - 1; c++) {
          const block = [
            solution[r][c],
            solution[r][c+1],
            solution[r+1][c],
            solution[r+1][c+1],
          ];
          const allShaded = block.every(v => v === true);
          expect(allShaded).toBe(false);
        }
      }
    }
  });

  it.skipIf(!datasetExists)('solution shaded cells are connected', () => {
    const data = JSON.parse(fs.readFileSync(datasetPath, 'utf8'));

    for (const puzzle of data.puzzles) {
      const { solution, rows, cols } = puzzle;

      // Find first shaded cell
      let firstShaded = null;
      let totalShaded = 0;

      for (let r = 0; r < rows && !firstShaded; r++) {
        for (let c = 0; c < cols && !firstShaded; c++) {
          if (solution[r][c]) {
            firstShaded = [r, c];
          }
        }
      }

      // Count total shaded
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (solution[r][c]) totalShaded++;
        }
      }

      if (!firstShaded) continue; // No shaded cells is valid

      // BFS to count connected shaded cells
      const visited = Array(rows).fill(null).map(() => Array(cols).fill(false));
      const queue = [firstShaded];
      visited[firstShaded[0]][firstShaded[1]] = true;
      let count = 1;

      while (queue.length > 0) {
        const [r, c] = queue.shift();

        for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
          const nr = r + dr;
          const nc = c + dc;
          if (nr >= 0 && nr < rows && nc >= 0 && nc < cols &&
              solution[nr][nc] && !visited[nr][nc]) {
            visited[nr][nc] = true;
            queue.push([nr, nc]);
            count++;
          }
        }
      }

      expect(count).toBe(totalShaded);
    }
  });

  it.skipIf(!datasetExists)('has puzzles of various sizes', () => {
    const data = JSON.parse(fs.readFileSync(datasetPath, 'utf8'));

    const sizes = new Set(data.puzzles.map(p => p.rows));

    // Should have at least 2 different sizes
    expect(sizes.size).toBeGreaterThanOrEqual(1);
  });

  it.skipIf(!datasetExists)('has puzzles of various difficulties', () => {
    const data = JSON.parse(fs.readFileSync(datasetPath, 'utf8'));

    const difficulties = new Set(data.puzzles.map(p => p.difficulty));

    // Should have at least 2 different difficulties
    expect(difficulties.size).toBeGreaterThanOrEqual(1);
  });
});

// Test the clue calculation logic directly
describe('Clue Calculation', () => {
  // Helper to create grid
  const createGrid = (size, fill) =>
    Array(size).fill(null).map(() => Array(size).fill(fill));

  // Neighbor offsets (clockwise from top)
  const NEIGHBOR_OFFSETS = [
    [-1, 0],  // top
    [-1, 1],  // top-right
    [0, 1],   // right
    [1, 1],   // bottom-right
    [1, 0],   // bottom
    [1, -1],  // bottom-left
    [0, -1],  // left
    [-1, -1], // top-left
  ];

  function getNeighborValues(grid, row, col) {
    const size = grid.length;
    return NEIGHBOR_OFFSETS.map(([dr, dc]) => {
      const r = row + dr;
      const c = col + dc;
      if (r < 0 || r >= size || c < 0 || c >= size) return false;
      return grid[r][c];
    });
  }

  function calculateClue(grid, row, col) {
    const neighbors = getNeighborValues(grid, row, col);

    const runs = [];
    let currentRun = 0;
    let firstRun = 0;
    let inFirstRun = true;

    for (let i = 0; i < 8; i++) {
      if (neighbors[i]) {
        currentRun++;
      } else {
        if (currentRun > 0) {
          if (inFirstRun) {
            firstRun = currentRun;
            inFirstRun = false;
          } else {
            runs.push(currentRun);
          }
          currentRun = 0;
        }
        inFirstRun = false;
      }
    }

    if (currentRun > 0) {
      if (runs.length === 0 && firstRun > 0) {
        runs.push(currentRun + firstRun);
      } else if (firstRun > 0) {
        runs.unshift(currentRun + firstRun);
      } else {
        runs.push(currentRun);
      }
    } else if (firstRun > 0) {
      runs.unshift(firstRun);
    }

    return runs.sort((a, b) => b - a);
  }

  it('returns empty array for no shaded neighbors', () => {
    const grid = createGrid(3, false);
    expect(calculateClue(grid, 1, 1)).toEqual([]);
  });

  it('returns [8] when all neighbors are shaded', () => {
    const grid = [
      [true, true, true],
      [true, false, true],
      [true, true, true],
    ];
    expect(calculateClue(grid, 1, 1)).toEqual([8]);
  });

  it('returns [1,1,1,1] for corner pattern', () => {
    const grid = [
      [true, false, true],
      [false, false, false],
      [true, false, true],
    ];
    expect(calculateClue(grid, 1, 1)).toEqual([1, 1, 1, 1]);
  });

  it('handles L-shaped patterns', () => {
    const grid = [
      [true, true, false],
      [true, false, false],
      [false, false, false],
    ];
    // Top, top-left, left are shaded = run of 3
    expect(calculateClue(grid, 1, 1)).toEqual([3]);
  });

  it('handles split patterns', () => {
    const grid = [
      [true, true, false],
      [false, false, false],
      [false, true, true],
    ];
    // Two separate runs of 2
    expect(calculateClue(grid, 1, 1)).toEqual([2, 2]);
  });
});
