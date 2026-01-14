import { describe, it, expect } from 'vitest';
import {
  GRID_SIZES,
  DIFFICULTY,
  generateRooms,
  generateLatinSquare,
  generatePuzzle,
  getRoomBorders,
  checkSolved,
  findErrors,
} from './InshiNoHeya.jsx';

describe('InshiNoHeya - metadata', () => {
  it('exposes grid sizes and difficulty presets', () => {
    expect(Object.keys(GRID_SIZES)).toEqual(['4×4', '5×5', '6×6', '7×7']);
    expect(Object.keys(DIFFICULTY)).toEqual(['Easy', 'Medium', 'Hard']);
  });
});

describe('InshiNoHeya - generation basics', () => {
  it('generates rooms covering the grid', () => {
    const size = GRID_SIZES['4×4'];
    const { roomGrid, rooms } = generateRooms(size, 2, 3);
    expect(roomGrid.length).toBe(size);
    roomGrid.forEach(row => expect(row.length).toBe(size));
    // All cells assigned
    roomGrid.forEach(row => row.forEach(cell => expect(cell).toBeGreaterThanOrEqual(0)));
    expect(rooms.length).toBeGreaterThan(0);
  });

  it('generates a Latin square with unique rows/cols of 1..N', () => {
    const size = 4;
    const grid = generateLatinSquare(size);
    const digits = new Set([...Array(size).keys()].map(n => n + 1));
    grid.forEach(row => expect(new Set(row)).toEqual(digits));
    for (let c = 0; c < size; c++) {
      const col = grid.map(r => r[c]);
      expect(new Set(col)).toEqual(digits);
    }
  });

  it('generatePuzzle wires products into rooms', () => {
    const size = 4;
    const { solution, rooms, roomGrid } = generatePuzzle(size, 'Easy');
    expect(solution.length).toBe(size);
    expect(rooms.length).toBeGreaterThan(0);
    rooms.forEach(room => {
      let prod = 1;
      room.cells.forEach(([r, c]) => {
        prod *= solution[r][c];
        expect(roomGrid[r][c]).toBe(room.id);
      });
      expect(room.product).toBe(prod);
    });
  });
});

describe('InshiNoHeya - helpers and validation', () => {
  it('getRoomBorders marks edges when crossing rooms', () => {
    const roomGrid = [
      [0, 0],
      [1, 1],
    ];
    const borders = getRoomBorders(1, 0, roomGrid, 2);
    expect(borders.top).toBe(true); // different room above
    expect(borders.bottom).toBe(true); // edge
    expect(borders.left).toBe(true); // edge
    expect(borders.right).toBe(false); // same room to the right
  });

  it('checkSolved requires exact match with solution', () => {
    const solution = [
      [1, 2],
      [2, 1],
    ];
    expect(checkSolved(solution, solution, 2)).toBe(true);
    const wrong = [
      [1, 2],
      [1, 2],
    ];
    expect(checkSolved(wrong, solution, 2)).toBe(false);
  });

  it('findErrors flags row/col duplicates and wrong room products', () => {
    const grid = [
      [1, 1],
      [2, 2],
    ];
    const roomGrid = [
      [0, 0],
      [1, 1],
    ];
    const rooms = [
      { id: 0, cells: [[0, 0], [0, 1]], product: 2 },
      { id: 1, cells: [[1, 0], [1, 1]], product: 4 },
    ];
    const errors = findErrors(grid, roomGrid, rooms, 2);
    expect(errors.size).toBeGreaterThan(0);
  });
});
