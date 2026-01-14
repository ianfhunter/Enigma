import { describe, it, expect } from 'vitest';
import {
  GRID_SIZES,
  DIFFICULTIES,
  EMPTY,
  WATER,
  SHIP,
  SEGMENT_TYPES,
  parseHints,
  parseSegmentTypes,
  parseSolution,
  checkValidity,
  checkSolved,
} from './NavalBattle.jsx';

describe('NavalBattle - metadata', () => {
  it('exposes grid sizes and difficulties', () => {
    expect(Object.keys(GRID_SIZES)).toEqual(['6×6', '8×8', '10×10', '12×12']);
    expect(DIFFICULTIES).toEqual(['Easy', 'Medium', 'Hard']);
  });
});

describe('NavalBattle - parsing', () => {
  it('parseHints marks water and ship hints', () => {
    const hints = [
      ['x', '-'],
      ['o', 'm'],
    ];
    const hintSet = parseHints(hints);
    expect(hintSet.has('water:0,0')).toBe(true);
    expect(hintSet.has('1,0')).toBe(true);
    expect(hintSet.has('1,1')).toBe(true);
  });

  it('parseSegmentTypes classifies segments', () => {
    const grid = [
      ['o', 'w', 'm', 'e'],
      ['n', 'm', 's', 'x'],
    ];
    const segments = parseSegmentTypes(grid);
    expect(segments['0,0']).toBe(SEGMENT_TYPES.SINGLE);
    expect(segments['0,1']).toBe(SEGMENT_TYPES.LEFT);
    expect(segments['0,3']).toBe(SEGMENT_TYPES.RIGHT);
    expect(segments['1,0']).toBe(SEGMENT_TYPES.TOP);
    expect(segments['1,2']).toBe(SEGMENT_TYPES.BOTTOM);
  });

  it('parseSolution maps symbols to internal grid', () => {
    const sol = [
      ['x', '-'],
      ['o', 'm'],
    ];
    const parsed = parseSolution(sol);
    expect(parsed[0][0]).toBe(WATER);
    expect(parsed[1][0]).toBe(SHIP);
  });
});

describe('NavalBattle - validation', () => {
  it('checkValidity flags overfilled rows/cols and diagonal touches', () => {
    const grid = [
      [SHIP, SHIP],
      [EMPTY, SHIP],
    ];
    const rowCounts = [1, 1];
    const colCounts = [1, 1];
    const errors = checkValidity(grid, rowCounts, colCounts, 2);
    expect(errors.size).toBeGreaterThan(0);
  });

  it('checkSolved verifies counts and fleet composition', () => {
    const grid = [
      [SHIP, EMPTY],
      [SHIP, EMPTY],
    ];
    const rowCounts = [1, 1];
    const colCounts = [2, 0];
    const fleet = [2]; // one destroyer length 2
    expect(checkSolved(grid, rowCounts, colCounts, 2, fleet)).toBe(true);

    const wrong = [
      [SHIP, SHIP],
      [EMPTY, EMPTY],
    ];
    expect(checkSolved(wrong, rowCounts, colCounts, 2, fleet)).toBe(false);
  });
});
import { describe, it, expect } from 'vitest';
import battleshipPuzzles from '../../../public/datasets/battleshipPuzzles.json';

describe('Battleship Puzzles Dataset', () => {
  it('should have puzzles loaded', () => {
    expect(battleshipPuzzles.puzzles).toBeDefined();
    expect(battleshipPuzzles.puzzles.length).toBeGreaterThan(0);
  });

  it('should have valid puzzle structure', () => {
    for (const puzzle of battleshipPuzzles.puzzles.slice(0, 50)) {
      expect(puzzle.id).toBeDefined();
      expect(puzzle.rows).toBeGreaterThan(0);
      expect(puzzle.cols).toBeGreaterThan(0);
      expect(puzzle.shipSizes).toBeInstanceOf(Array);
      expect(puzzle.rowCounts).toBeInstanceOf(Array);
      expect(puzzle.colCounts).toBeInstanceOf(Array);
      expect(puzzle.hints).toBeInstanceOf(Array);
      expect(puzzle.solution).toBeInstanceOf(Array);

      // Dimensions should match
      expect(puzzle.rowCounts.length).toBe(puzzle.rows);
      expect(puzzle.colCounts.length).toBe(puzzle.cols);
      expect(puzzle.hints.length).toBe(puzzle.rows);
      expect(puzzle.solution.length).toBe(puzzle.rows);
    }
  });

  it('should have solution row counts matching rowCounts', () => {
    for (const puzzle of battleshipPuzzles.puzzles.slice(0, 50)) {
      for (let r = 0; r < puzzle.rows; r++) {
        const shipCount = puzzle.solution[r].filter(c => !['x', '-'].includes(c)).length;
        expect(shipCount, `Puzzle ${puzzle.id} row ${r}`).toBe(puzzle.rowCounts[r]);
      }
    }
  });

  it('should have solution column counts matching colCounts', () => {
    for (const puzzle of battleshipPuzzles.puzzles.slice(0, 50)) {
      for (let c = 0; c < puzzle.cols; c++) {
        const shipCount = puzzle.solution.filter(row => row[c] && !['x', '-'].includes(row[c])).length;
        expect(shipCount, `Puzzle ${puzzle.id} col ${c}`).toBe(puzzle.colCounts[c]);
      }
    }
  });

  it('should have hints that match the solution', () => {
    for (const puzzle of battleshipPuzzles.puzzles.slice(0, 50)) {
      for (let r = 0; r < puzzle.rows; r++) {
        for (let c = 0; c < puzzle.cols; c++) {
          const hint = puzzle.hints[r]?.[c];
          const sol = puzzle.solution[r]?.[c];

          if (hint && hint !== '-') {
            const hintIsShip = !['x', '-'].includes(hint);
            const solIsShip = !['x', '-'].includes(sol);

            if (hintIsShip) {
              // Ship hints must match exactly
              expect(hint, `Puzzle ${puzzle.id} hint at [${r},${c}]`).toBe(sol);
            } else if (hint === 'x') {
              // Water hints must not be ships
              expect(solIsShip, `Puzzle ${puzzle.id} water hint at [${r},${c}] conflicts with solution`).toBe(false);
            }
          }
        }
      }
    }
  });

  it('should have valid ship segment types', () => {
    const validSegments = ['o', 'w', 'e', 'n', 's', 'm', 'x', '-'];

    for (const puzzle of battleshipPuzzles.puzzles.slice(0, 50)) {
      for (let r = 0; r < puzzle.rows; r++) {
        for (let c = 0; c < puzzle.cols; c++) {
          const cell = puzzle.solution[r][c];
          expect(validSegments, `Puzzle ${puzzle.id} invalid cell at [${r},${c}]: ${cell}`).toContain(cell);
        }
      }
    }
  });

  it('should have ships that form valid connected components', () => {
    for (const puzzle of battleshipPuzzles.puzzles.slice(0, 20)) {
      // Find all ships using BFS
      const visited = new Set();
      const ships = [];

      for (let r = 0; r < puzzle.rows; r++) {
        for (let c = 0; c < puzzle.cols; c++) {
          const cell = puzzle.solution[r][c];
          if (!['x', '-'].includes(cell) && !visited.has(`${r},${c}`)) {
            // BFS to find connected ship cells
            const ship = [];
            const queue = [[r, c]];
            visited.add(`${r},${c}`);

            while (queue.length > 0) {
              const [cr, cc] = queue.shift();
              ship.push([cr, cc]);

              // Check orthogonal neighbors
              for (const [dr, dc] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) {
                const nr = cr + dr, nc = cc + dc;
                if (nr >= 0 && nr < puzzle.rows && nc >= 0 && nc < puzzle.cols) {
                  const ncell = puzzle.solution[nr][nc];
                  if (!['x', '-'].includes(ncell) && !visited.has(`${nr},${nc}`)) {
                    visited.add(`${nr},${nc}`);
                    queue.push([nr, nc]);
                  }
                }
              }
            }

            ships.push(ship.length);
          }
        }
      }

      // Ships found should match the fleet
      const expectedFleet = [...puzzle.shipSizes].sort((a, b) => b - a);
      const actualFleet = ships.sort((a, b) => b - a);

      expect(actualFleet, `Puzzle ${puzzle.id} fleet mismatch`).toEqual(expectedFleet);
    }
  });

  it('should have ships that do not touch diagonally', () => {
    for (const puzzle of battleshipPuzzles.puzzles.slice(0, 20)) {
      for (let r = 0; r < puzzle.rows; r++) {
        for (let c = 0; c < puzzle.cols; c++) {
          const cell = puzzle.solution[r][c];
          if (!['x', '-'].includes(cell)) {
            // Check diagonal neighbors - they should not be ships unless connected orthogonally
            const diagonals = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
            for (const [dr, dc] of diagonals) {
              const nr = r + dr, nc = c + dc;
              if (nr >= 0 && nr < puzzle.rows && nc >= 0 && nc < puzzle.cols) {
                const diagCell = puzzle.solution[nr][nc];
                if (!['x', '-'].includes(diagCell)) {
                  // Diagonal has a ship - must have orthogonal connection
                  const orthogonal1 = puzzle.solution[r]?.[nc];
                  const orthogonal2 = puzzle.solution[nr]?.[c];
                  const hasOrthogonalConnection =
                    (!['x', '-'].includes(orthogonal1)) || (!['x', '-'].includes(orthogonal2));

                  expect(hasOrthogonalConnection,
                    `Puzzle ${puzzle.id} has diagonal touch at [${r},${c}] and [${nr},${nc}]`).toBe(true);
                }
              }
            }
          }
        }
      }
    }
  });
});
