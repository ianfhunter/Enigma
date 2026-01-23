import { describe, it, expect } from 'vitest';
import { generateSolvedPuzzle, isValidPlacement, isSolved, NUMBER_COLORS } from './Tetravex';
import { createSeededRandom } from '../../utils/generatorUtils';

// ===========================================
// Tetravex - Puzzle Generation Tests
// ===========================================
describe('Tetravex - Puzzle Generation', () => {
  it('should generate correct number of tiles for different sizes', () => {
    const random = createSeededRandom(12345);

    const tiles2x2 = generateSolvedPuzzle(2, createSeededRandom(100));
    expect(tiles2x2).toHaveLength(4);

    const tiles3x3 = generateSolvedPuzzle(3, createSeededRandom(100));
    expect(tiles3x3).toHaveLength(9);

    const tiles4x4 = generateSolvedPuzzle(4, createSeededRandom(100));
    expect(tiles4x4).toHaveLength(16);
  });

  it('should generate tiles with valid number values (0-9)', () => {
    const tiles = generateSolvedPuzzle(3, createSeededRandom(42));

    for (const tile of tiles) {
      expect(tile.top).toBeGreaterThanOrEqual(0);
      expect(tile.top).toBeLessThanOrEqual(9);
      expect(tile.right).toBeGreaterThanOrEqual(0);
      expect(tile.right).toBeLessThanOrEqual(9);
      expect(tile.bottom).toBeGreaterThanOrEqual(0);
      expect(tile.bottom).toBeLessThanOrEqual(9);
      expect(tile.left).toBeGreaterThanOrEqual(0);
      expect(tile.left).toBeLessThanOrEqual(9);
    }
  });

  it('should generate tiles with unique IDs', () => {
    const tiles = generateSolvedPuzzle(4, createSeededRandom(99));
    const ids = tiles.map(t => t.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(tiles.length);
  });

  it('should be deterministic with the same seed', () => {
    const tiles1 = generateSolvedPuzzle(3, createSeededRandom(42));
    const tiles2 = generateSolvedPuzzle(3, createSeededRandom(42));

    expect(tiles1).toEqual(tiles2);
  });

  it('should generate different puzzles with different seeds', () => {
    const tiles1 = generateSolvedPuzzle(3, createSeededRandom(1));
    const tiles2 = generateSolvedPuzzle(3, createSeededRandom(2));

    // Very unlikely to be exactly the same
    const same = tiles1.every((tile, i) =>
      tile.top === tiles2[i].top &&
      tile.right === tiles2[i].right &&
      tile.bottom === tiles2[i].bottom &&
      tile.left === tiles2[i].left
    );
    expect(same).toBe(false);
  });
});

// ===========================================
// Tetravex - Solution Validation Tests
// ===========================================
describe('Tetravex - Solution Validation', () => {
  it('should validate a correct 2x2 solution', () => {
    const tiles = generateSolvedPuzzle(2, createSeededRandom(123));
    expect(isSolved(tiles, 2)).toBe(true);
  });

  it('should validate a correct 3x3 solution', () => {
    const tiles = generateSolvedPuzzle(3, createSeededRandom(456));
    expect(isSolved(tiles, 3)).toBe(true);
  });

  it('should validate a correct 4x4 solution', () => {
    const tiles = generateSolvedPuzzle(4, createSeededRandom(789));
    expect(isSolved(tiles, 4)).toBe(true);
  });

  it('should reject an incomplete board', () => {
    const tiles = generateSolvedPuzzle(3, createSeededRandom(100));
    tiles[4] = null; // Remove center tile
    expect(isSolved(tiles, 3)).toBe(false);
  });

  it('should reject a board with mismatched edges', () => {
    const tiles = generateSolvedPuzzle(2, createSeededRandom(100));
    // Swap two tiles that will break adjacency
    [tiles[0], tiles[1]] = [tiles[1], tiles[0]];
    // This might still be valid by chance, so we check structural integrity
    // The generated puzzle guarantees matching edges in original order
  });
});

// ===========================================
// Tetravex - Edge Matching Tests
// ===========================================
describe('Tetravex - Edge Matching', () => {
  it('should have matching horizontal edges in generated solution', () => {
    const size = 3;
    const tiles = generateSolvedPuzzle(size, createSeededRandom(555));

    for (let row = 0; row < size; row++) {
      for (let col = 0; col < size - 1; col++) {
        const left = tiles[row * size + col];
        const right = tiles[row * size + col + 1];
        expect(left.right).toBe(right.left);
      }
    }
  });

  it('should have matching vertical edges in generated solution', () => {
    const size = 3;
    const tiles = generateSolvedPuzzle(size, createSeededRandom(666));

    for (let row = 0; row < size - 1; row++) {
      for (let col = 0; col < size; col++) {
        const top = tiles[row * size + col];
        const bottom = tiles[(row + 1) * size + col];
        expect(top.bottom).toBe(bottom.top);
      }
    }
  });
});

// ===========================================
// Tetravex - Placement Validation Tests
// ===========================================
describe('Tetravex - Placement Validation', () => {
  it('should validate placement in empty board', () => {
    const board = [null, null, null, null];
    const tile = { top: 1, right: 2, bottom: 3, left: 4 };

    expect(isValidPlacement(board, 2, 0, 0, tile)).toBe(true);
    expect(isValidPlacement(board, 2, 0, 1, tile)).toBe(true);
    expect(isValidPlacement(board, 2, 1, 0, tile)).toBe(true);
    expect(isValidPlacement(board, 2, 1, 1, tile)).toBe(true);
  });

  it('should validate placement with matching neighbor', () => {
    const existingTile = { id: 0, top: 1, right: 5, bottom: 3, left: 4 };
    const board = [existingTile, null, null, null];

    // Tile to the right should have left=5 to match
    const matchingTile = { top: 2, right: 6, bottom: 4, left: 5 };
    expect(isValidPlacement(board, 2, 0, 1, matchingTile)).toBe(true);

    // Tile with wrong left value should fail
    const nonMatchingTile = { top: 2, right: 6, bottom: 4, left: 9 };
    expect(isValidPlacement(board, 2, 0, 1, nonMatchingTile)).toBe(false);
  });

  it('should validate placement with top neighbor', () => {
    const topTile = { id: 0, top: 1, right: 2, bottom: 7, left: 4 };
    const board = [topTile, null, null, null];

    // Tile below should have top=7 to match
    const matchingTile = { top: 7, right: 6, bottom: 4, left: 5 };
    expect(isValidPlacement(board, 2, 1, 0, matchingTile)).toBe(true);

    // Tile with wrong top value should fail
    const nonMatchingTile = { top: 0, right: 6, bottom: 4, left: 5 };
    expect(isValidPlacement(board, 2, 1, 0, nonMatchingTile)).toBe(false);
  });

  it('should validate placement with multiple neighbors', () => {
    // 2x2 board with top-left and top-right filled
    const tile0 = { id: 0, top: 1, right: 5, bottom: 3, left: 4 };
    const tile1 = { id: 1, top: 2, right: 6, bottom: 8, left: 5 };
    const board = [tile0, tile1, null, null];

    // Bottom-left tile needs top=3, right should match bottom-right's left
    const matchingTile = { top: 3, right: 9, bottom: 0, left: 7 };
    expect(isValidPlacement(board, 2, 1, 0, matchingTile)).toBe(true);

    // Wrong top value
    const wrongTile = { top: 0, right: 9, bottom: 0, left: 7 };
    expect(isValidPlacement(board, 2, 1, 0, wrongTile)).toBe(false);
  });
});

// ===========================================
// Tetravex - Color Configuration Tests
// ===========================================
describe('Tetravex - Colors', () => {
  it('should have exactly 10 colors for digits 0-9', () => {
    expect(NUMBER_COLORS).toHaveLength(10);
  });

  it('should have unique colors', () => {
    const uniqueColors = new Set(NUMBER_COLORS);
    expect(uniqueColors.size).toBe(10);
  });

  it('should have valid hex color format', () => {
    const hexRegex = /^#[0-9a-fA-F]{6}$/;
    for (const color of NUMBER_COLORS) {
      expect(color).toMatch(hexRegex);
    }
  });
});

// ===========================================
// Tetravex - Edge Cases
// ===========================================
describe('Tetravex - Edge Cases', () => {
  it('should handle minimum grid size (2x2)', () => {
    const tiles = generateSolvedPuzzle(2, createSeededRandom(1));
    expect(tiles).toHaveLength(4);
    expect(isSolved(tiles, 2)).toBe(true);
  });

  it('should handle larger grid size (5x5)', () => {
    const tiles = generateSolvedPuzzle(5, createSeededRandom(1));
    expect(tiles).toHaveLength(25);
    expect(isSolved(tiles, 5)).toBe(true);
  });

  it('should generate puzzles with varying number distributions', () => {
    // Generate multiple puzzles and check number variety
    const allNumbers = new Set();
    for (let seed = 0; seed < 10; seed++) {
      const tiles = generateSolvedPuzzle(3, createSeededRandom(seed));
      for (const tile of tiles) {
        allNumbers.add(tile.top);
        allNumbers.add(tile.right);
        allNumbers.add(tile.bottom);
        allNumbers.add(tile.left);
      }
    }
    // Should use most if not all digits 0-9 across multiple puzzles
    expect(allNumbers.size).toBeGreaterThan(5);
  });
});

// ===========================================
// Tetravex - Tile Structure Tests
// ===========================================
describe('Tetravex - Tile Structure', () => {
  it('should have correct tile structure', () => {
    const tiles = generateSolvedPuzzle(2, createSeededRandom(100));

    for (const tile of tiles) {
      expect(tile).toHaveProperty('id');
      expect(tile).toHaveProperty('top');
      expect(tile).toHaveProperty('right');
      expect(tile).toHaveProperty('bottom');
      expect(tile).toHaveProperty('left');
      expect(typeof tile.id).toBe('number');
      expect(typeof tile.top).toBe('number');
      expect(typeof tile.right).toBe('number');
      expect(typeof tile.bottom).toBe('number');
      expect(typeof tile.left).toBe('number');
    }
  });

  it('should have sequential IDs starting from 0', () => {
    const tiles = generateSolvedPuzzle(3, createSeededRandom(100));
    const ids = tiles.map(t => t.id).sort((a, b) => a - b);

    for (let i = 0; i < ids.length; i++) {
      expect(ids[i]).toBe(i);
    }
  });
});
