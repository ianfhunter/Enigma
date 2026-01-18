import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  PIECE_NUMBER_TO_SHAPE,
  loadPuzzleDataset,
  selectPuzzle,
  transformGrid,
  extractPlacedPieces,
  canPlaceShape,
  placeShape,
  checkSolved,
} from './Pentomino.jsx';
import { PENTOMINO_SHAPES, rotateShape, flipShape, normalizeShape } from './pentominoShapes';

describe('Pentomino - helpers', () => {
  it('exposes PIECE_NUMBER_TO_SHAPE with 12 pieces', () => {
    expect(PIECE_NUMBER_TO_SHAPE).toBeDefined();
    expect(Array.isArray(PIECE_NUMBER_TO_SHAPE)).toBe(true);
    expect(PIECE_NUMBER_TO_SHAPE.length).toBe(12);
    
    PIECE_NUMBER_TO_SHAPE.forEach((piece, idx) => {
      expect(piece.number).toBe(idx + 1);
      expect(piece.name).toBeDefined();
      expect(piece.shape).toBeDefined();
      expect(Array.isArray(piece.shape)).toBe(true);
      expect(piece.shape.length).toBe(5); // Each pentomino has 5 squares
      expect(piece.color).toBeDefined();
      expect(piece.color).toMatch(/^#[0-9a-f]{6}$/i);
    });
  });
});

describe('Pentomino - checkSolved', () => {
  it('returns false for null or undefined grids', () => {
    expect(checkSolved(null, [[1]])).toBe(false);
    expect(checkSolved([[1]], null)).toBe(false);
    expect(checkSolved(undefined, [[1]])).toBe(false);
    expect(checkSolved([[1]], undefined)).toBe(false);
  });

  it('returns false for mismatched grid sizes', () => {
    const player = [[1, 2]];
    const solution = [[1, 2, 3]];
    expect(checkSolved(player, solution)).toBe(false);
    
    const player2 = [[1], [2]];
    const solution2 = [[1]];
    expect(checkSolved(player2, solution2)).toBe(false);
  });

  it('returns true for identical grids', () => {
    const grid = [
      [0, 0, 1, 2],
      [0, 0, 1, 3],
      [4, 5, 6, 7],
    ];
    expect(checkSolved(grid, grid)).toBe(true);
  });

  it('handles hole cells (value 0) correctly', () => {
    const player = [
      [0, 0, 1],
      [0, 0, 2],
      [3, 4, 5],
    ];
    const solution = [
      [0, 0, 1],
      [0, 0, 2],
      [3, 4, 5],
    ];
    expect(checkSolved(player, solution)).toBe(true);
  });

  it('rejects player hole where solution has piece', () => {
    const player = [
      [0, 1],
      [2, 3],
    ];
    const solution = [
      [1, 1],
      [2, 3],
    ];
    expect(checkSolved(player, solution)).toBe(false);
  });

  it('rejects player piece where solution has hole', () => {
    const player = [
      [1, 1],
      [2, 3],
    ];
    const solution = [
      [0, 1],
      [2, 3],
    ];
    expect(checkSolved(player, solution)).toBe(false);
  });

  it('rejects wrong piece values', () => {
    const player = [
      [1, 2],
      [3, 4],
    ];
    const solution = [
      [1, 2],
      [3, 5], // Different piece
    ];
    expect(checkSolved(player, solution)).toBe(false);
  });

  it('handles 8x8 grid with hole pattern', () => {
    const solution = [
      [0, 0, 2, 2, 2, 2, 2, 10],
      [0, 0, 1, 11, 11, 11, 10, 10],
      [12, 1, 1, 1, 3, 11, 11, 10],
      [12, 12, 1, 5, 3, 3, 3, 10],
      [12, 12, 5, 5, 9, 9, 3, 8],
      [6, 5, 5, 4, 9, 8, 8, 8],
      [6, 6, 6, 4, 9, 7, 8, 7],
      [6, 4, 4, 4, 9, 7, 7, 7],
    ];
    expect(checkSolved(solution, solution)).toBe(true);
  });

  it('detects partial solution as incorrect', () => {
    const solution = [
      [0, 0, 1, 2],
      [0, 0, 3, 4],
      [5, 6, 7, 8],
      [9, 10, 11, 12],
    ];
    const player = [
      [0, 0, 1, null], // Incomplete
      [0, 0, 3, 4],
      [5, 6, 7, 8],
      [9, 10, 11, 12],
    ];
    expect(checkSolved(player, solution)).toBe(false);
  });
});

describe('Pentomino - selectPuzzle', () => {
  it('selects puzzles deterministically based on seed', () => {
    const puzzles = [
      { id: 1, grid: [[1]] },
      { id: 2, grid: [[2]] },
      { id: 3, grid: [[3]] },
    ];
    
    const puzzle1 = selectPuzzle(puzzles, 12345);
    const puzzle2 = selectPuzzle(puzzles, 12345);
    
    // Same seed should select same puzzle with same transformation
    expect(puzzle1).toEqual(puzzle2);
    expect(puzzle1).toBeDefined();
    expect(puzzle1.id).toBeDefined();
    expect(puzzle1.transformType).toBeDefined();
    expect(typeof puzzle1.transformType).toBe('number');
  });

  it('selects different puzzles for different seeds', () => {
    const puzzles = [
      { id: 1, grid: [[1]] },
      { id: 2, grid: [[2]] },
      { id: 3, grid: [[3]] },
      { id: 4, grid: [[4]] },
      { id: 5, grid: [[5]] },
    ];
    
    const puzzle1 = selectPuzzle(puzzles, 11111);
    const puzzle2 = selectPuzzle(puzzles, 22222);
    
    // Different seeds might select different puzzles (not guaranteed but likely)
    // Just verify both are valid
    expect(puzzle1).toBeDefined();
    expect(puzzle2).toBeDefined();
    expect(puzzle1.id).toBeDefined();
    expect(puzzle2.id).toBeDefined();
    expect(puzzle1.transformType).toBeDefined();
    expect(puzzle2.transformType).toBeDefined();
  });

  it('handles single puzzle array', () => {
    const puzzles = [{ id: 1, grid: [[1]] }];
    const puzzle = selectPuzzle(puzzles, 12345);
    expect(puzzle).toBeDefined();
    expect(puzzle.id).toBe(1);
    expect(puzzle.grid).toBeDefined();
    expect(puzzle.transformType).toBeDefined();
  });

  it('handles empty puzzle array gracefully', () => {
    const puzzles = [];
    // Empty array should return undefined
    const result = selectPuzzle(puzzles, 12345);
    expect(result).toBeUndefined();
  });
});

describe('Pentomino - dataset loading', () => {
  beforeEach(() => {
    // Reset global puzzleDataset before each test
    vi.resetModules();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('loadPuzzleDataset structure exists', () => {
    expect(loadPuzzleDataset).toBeDefined();
    expect(typeof loadPuzzleDataset).toBe('function');
  });

  it('loadPuzzleDataset returns a promise', () => {
    const result = loadPuzzleDataset();
    expect(result).toBeInstanceOf(Promise);
  });
});

describe('Pentomino - transformGrid', () => {
  it('transforms grid correctly with 90° rotation', () => {
    const grid = [
      [1, 2],
      [3, 4],
    ];
    const transformed = transformGrid(grid, 1); // 90° rotation
    expect(transformed).toEqual([
      [3, 1],
      [4, 2],
    ]);
  });

  it('transforms grid correctly with 180° rotation', () => {
    const grid = [
      [1, 2],
      [3, 4],
    ];
    const transformed = transformGrid(grid, 2); // 180° rotation
    expect(transformed).toEqual([
      [4, 3],
      [2, 1],
    ]);
  });

  it('preserves hole cells (value 0) through transformation', () => {
    const grid = [
      [0, 0, 1],
      [0, 0, 2],
      [3, 4, 5],
    ];
    const transformed = transformGrid(grid, 1); // 90° rotation
    // Should still have 4 zeros (hole cells)
    const zeroCount = transformed.flat().filter(v => v === 0).length;
    expect(zeroCount).toBe(4);
  });

  it('no transformation returns original grid', () => {
    const grid = [
      [1, 2],
      [3, 4],
    ];
    const transformed = transformGrid(grid, 0); // No transformation
    expect(transformed).toEqual(grid);
  });
});

describe('Pentomino - edge cases and validation', () => {
  it('checkSolved handles empty grids', () => {
    expect(checkSolved([], [])).toBe(true);
  });

  it('checkSolved handles single cell grids', () => {
    expect(checkSolved([[0]], [[0]])).toBe(true);
    expect(checkSolved([[1]], [[1]])).toBe(true);
    expect(checkSolved([[0]], [[1]])).toBe(false);
    expect(checkSolved([[1]], [[0]])).toBe(false);
  });

  it('checkSolved validates all piece values (1-12)', () => {
    const solution = [
      [1, 2, 3, 4, 5, 6],
      [7, 8, 9, 10, 11, 12],
    ];
    const player = [
      [1, 2, 3, 4, 5, 6],
      [7, 8, 9, 10, 11, 12],
    ];
    expect(checkSolved(player, solution)).toBe(true);
  });

  it('checkSolved rejects piece values outside 1-12 range when comparing', () => {
    // While pieces are 1-12, we test the comparison logic
    const solution = [[1, 2, 3]];
    const player = [[1, 2, 13]]; // Invalid piece
    expect(checkSolved(player, solution)).toBe(false);
  });

  it('handles rectangular (non-square) grids correctly', () => {
    const solution = [
      [1, 2],
      [3, 4],
      [5, 6],
    ];
    const player = [
      [1, 2],
      [3, 4],
      [5, 6],
    ];
    expect(checkSolved(player, solution)).toBe(true);
    
    const wrongPlayer = [
      [1, 2],
      [3, 4],
      [5, 7], // Wrong
    ];
    expect(checkSolved(wrongPlayer, solution)).toBe(false);
  });

  it('checkSolved is case-sensitive for grid structure', () => {
    const solution = [
      [0, 0, 1],
      [0, 0, 2],
    ];
    const player = [
      [0, 0, 1],
      [0, 0, 2],
    ];
    expect(checkSolved(player, solution)).toBe(true);
    
    // Different structure
    const player2 = [
      [0, 0, 1, 0, 0, 2], // Flattened - should fail
    ];
    expect(checkSolved(player2, solution)).toBe(false);
  });
});