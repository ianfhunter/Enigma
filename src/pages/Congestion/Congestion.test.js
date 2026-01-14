import { describe, it, expect } from 'vitest';
import {
  parsePuzzle,
  extractVehicles,
  vehiclesToGrid,
  checkWin,
  tryMoveVehicle,
  GRID_SIZE,
  EXIT_ROW,
} from './Congestion.jsx';

// Sample easy puzzle string (6x6 grid). 'A' is target car, 'o' empty, 'x' walls.
const SAMPLE_PUZZLE = (
  '...B..' +
  'AABBB.' +
  '..CC..' +
  '..CCDD' +
  '...EED' +
  '......'
).replace(/\./g, 'o');

describe('Congestion - parsing and extraction', () => {
  it('parses a puzzle string into a 6x6 grid with nulls for empties', () => {
    const grid = parsePuzzle(SAMPLE_PUZZLE);
    expect(grid.length).toBe(GRID_SIZE);
    grid.forEach(row => expect(row.length).toBe(GRID_SIZE));
    expect(grid[0][0]).toBeNull();
    expect(grid[1][0]).toBe('A');
  });

  it('extracts vehicles with orientation and positions', () => {
    const grid = parsePuzzle(SAMPLE_PUZZLE);
    const vehicles = extractVehicles(grid);

    expect(vehicles.A).toBeDefined();
    expect(vehicles.A.isHorizontal).toBe(true);
    expect(vehicles.A.length).toBe(2);
    expect(vehicles.B.length).toBe(3);
  });

  it('vehiclesToGrid round-trips extraction', () => {
    const grid = parsePuzzle(SAMPLE_PUZZLE);
    const vehicles = extractVehicles(grid);
    const back = vehiclesToGrid(vehicles);
    expect(back).toEqual(grid);
  });
});

describe('Congestion - movement and win detection', () => {
  it('allows valid horizontal move and blocks collisions/out-of-bounds', () => {
    const grid = parsePuzzle(SAMPLE_PUZZLE);
    const vehicles = extractVehicles(grid);

    const movedA = tryMoveVehicle(vehicles, 'A', 1); // move right by 1
    expect(movedA).not.toBeNull();
    expect(movedA.A.positions[0].col).toBe(1);

    const blocked = tryMoveVehicle(vehicles, 'B', 1); // would collide
    expect(blocked).toBeNull();
  });

  it('detects win when red car reaches exit row and column 5', () => {
    const grid = parsePuzzle(SAMPLE_PUZZLE);
    const vehicles = extractVehicles(grid);
    const toExit = {
      ...vehicles,
      A: { ...vehicles.A, positions: [{ row: EXIT_ROW, col: 4 }, { row: EXIT_ROW, col: 5 }], startRow: EXIT_ROW, startCol: 4 },
    };
    expect(checkWin(toExit)).toBe(true);
  });
});
