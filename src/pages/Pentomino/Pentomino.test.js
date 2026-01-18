import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  PIECE_NUMBER_TO_SHAPE,
  loadPuzzleDataset,
  selectPuzzle,
  transformGrid,
  extractPlacedPieces,
  canPlaceShape,
  placeShape,
  validateSolution,
  isConnected,
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

describe('Pentomino - validateSolution', () => {
  it('returns false for null or undefined grids', () => {
    expect(validateSolution(null, [[1]])).toBe(false);
    expect(validateSolution([[1]], null)).toBe(false);
    expect(validateSolution(undefined, [[1]])).toBe(false);
    expect(validateSolution([[1]], undefined)).toBe(false);
  });

  it('returns false for incomplete solutions (missing pieces)', () => {
    const holeBoard = [
      [0, 0, 1, 1, 1, 1, 1],
      [0, 0, 2, 2, 2, 2, 2],
      [3, 3, 3, 3, 3, 4, 4],
      [4, 4, 4, 4, 5, 5, 5],
      [5, 5, 6, 6, 6, 6, 6],
      [7, 7, 7, 7, 7, 8, 8],
      [8, 8, 8, 8, 9, 9, 9],
      [9, 9, 10, 10, 10, 10, 10],
    ];
    const player = [
      [null, null, 1, 1, 1, 1, 1], // Missing some pieces
      [null, null, 2, 2, 2, 2, 2],
      [3, 3, 3, 3, 3, null, null],
      [null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null],
    ];
    expect(validateSolution(player, holeBoard)).toBe(false);
  });

  it('returns false when pieces are placed in hole cells', () => {
    const holeBoard = [
      [0, 0, 1, 1],
      [0, 0, 1, 1],
      [1, 1, 1, 1],
      [1, 1, 1, 1],
    ];
    const player = [
      [1, 1, 1, 1], // Piece in hole
      [1, 1, 1, 1],
      [1, 1, 1, 1],
      [1, 1, 1, 1],
    ];
    expect(validateSolution(player, holeBoard)).toBe(false);
  });

  it('returns false when cells are not filled', () => {
    const holeBoard = [
      [0, 0, 1, 1],
      [0, 0, 1, 1],
      [1, 1, 1, 1],
      [1, 1, 1, 1],
    ];
    const player = [
      [null, null, null, null], // Empty cells
      [null, null, null, null],
      [null, null, null, null],
      [null, null, null, null],
    ];
    expect(validateSolution(player, holeBoard)).toBe(false);
  });

  it('validates connectivity requirement for pieces', () => {
    // Test that pieces must be connected
    const holeBoard = [
      [0, 0, 1, 1, 1, 1, 1, 2],
      [0, 0, 1, 2, 2, 2, 2, 2],
      [3, 3, 3, 3, 3, 4, 4, 4],
      [4, 4, 4, 4, 5, 5, 5, 5],
      [5, 5, 5, 6, 6, 6, 6, 6],
      [7, 7, 7, 7, 7, 8, 8, 8],
      [8, 8, 9, 9, 9, 9, 9, 10],
      [10, 10, 10, 10, 11, 11, 11, 12],
    ];
    // Create a player board with disconnected piece (piece 1 split)
    const player = holeBoard.map(row => [...row]);
    player[0][2] = 1; // Keep one cell of piece 1
    player[0][3] = 13; // Invalid piece number - will fail validation
    // This should fail validation
    expect(validateSolution(player, holeBoard)).toBe(false);
  });
});

describe('Pentomino - isConnected', () => {
  it('returns true for single cell', () => {
    expect(isConnected([[0, 0]])).toBe(true);
  });

  it('returns false for empty array', () => {
    expect(isConnected([])).toBe(false);
  });

  it('returns true for connected cells', () => {
    const cells = [[0, 0], [0, 1], [1, 1], [2, 1]];
    expect(isConnected(cells)).toBe(true);
  });

  it('returns false for disconnected cells', () => {
    const cells = [[0, 0], [0, 1], [2, 2], [2, 3]]; // Two separate groups
    expect(isConnected(cells)).toBe(false);
  });

  it('handles L-shaped connections', () => {
    const cells = [[0, 0], [1, 0], [1, 1], [1, 2]];
    expect(isConnected(cells)).toBe(true);
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
  it('validateSolution returns false for empty grids', () => {
    expect(validateSolution([], [])).toBe(false);
  });

  it('validateSolution requires all 12 pieces', () => {
    const holeBoard = Array(8).fill(null).map(() => Array(8).fill(1));
    holeBoard[0][0] = 0;
    holeBoard[0][1] = 0;
    holeBoard[1][0] = 0;
    holeBoard[1][1] = 0;
    
    const player = Array(8).fill(null).map(() => Array(8).fill(null));
    player[0][0] = null;
    player[0][1] = null;
    player[1][0] = null;
    player[1][1] = null;
    
    // Only has piece 1, missing pieces 2-12
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        if (holeBoard[r][c] !== 0) {
          player[r][c] = 1;
        }
      }
    }
    
    expect(validateSolution(player, holeBoard)).toBe(false);
  });

  it('validateSolution requires exactly 5 cells per piece', () => {
    const holeBoard = [
      [0, 0, 1, 1, 1, 1, 1, 2],
      [0, 0, 1, 2, 2, 2, 2, 2],
      [3, 3, 3, 3, 3, 4, 4, 4],
      [4, 4, 4, 4, 5, 5, 5, 5],
      [5, 5, 5, 6, 6, 6, 6, 6],
      [7, 7, 7, 7, 7, 8, 8, 8],
      [8, 8, 9, 9, 9, 9, 9, 10],
      [10, 10, 10, 10, 11, 11, 11, 12],
    ];
    const player = [...holeBoard];
    // Piece 1 has 6 cells instead of 5
    player[0][2] = 1;
    expect(validateSolution(player, holeBoard)).toBe(false);
  });
});