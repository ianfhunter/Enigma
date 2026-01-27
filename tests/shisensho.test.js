/**
 * Shisen-Sho Test Suite
 *
 * Tests the tile matching and path finding logic
 */

import { describe, it, expect } from 'vitest';

// Helper functions extracted from the game
function tilesMatch(tile1, tile2) {
  if (!tile1 || !tile2) return false;
  if (tile1.id === tile2.id) return false;
  return tile1.type === tile2.type && tile1.value === tile2.value;
}

function findPath(grid, r1, c1, r2, c2) {
  const rows = grid.length;
  const cols = grid[0].length;
  
  const queue = [[r1, c1, 0, -1]];
  const visited = new Set([`${r1},${c1},0,-1`]);
  
  while (queue.length > 0) {
    const [r, c, turns, lastDir] = queue.shift();
    
    if (r === r2 && c === c2) return true;
    if (turns > 2) continue;
    
    const directions = [[0, 1], [1, 0], [0, -1], [-1, 0]];
    for (let dir = 0; dir < 4; dir++) {
      const [dr, dc] = directions[dir];
      let nr = r + dr;
      let nc = c + dc;
      
      while (nr >= -1 && nr <= rows && nc >= -1 && nc <= cols) {
        const outOfBounds = nr < 0 || nr >= rows || nc < 0 || nc >= cols;
        const hasTile = !outOfBounds && grid[nr][nc] !== null && !(nr === r2 && nc === c2);
        
        if (hasTile) break;
        
        const newTurns = turns + (lastDir !== -1 && lastDir !== dir ? 1 : 0);
        if (newTurns <= 2) {
          const key = `${nr},${nc},${newTurns},${dir}`;
          if (!visited.has(key)) {
            visited.add(key);
            queue.push([nr, nc, newTurns, dir]);
          }
        }
        
        nr += dr;
        nc += dc;
      }
    }
  }
  
  return false;
}

describe('Shisen-Sho - Tile Matching', () => {
  it('should match identical tiles with different IDs', () => {
    const tile1 = { id: 0, type: 'bamboo', value: 3 };
    const tile2 = { id: 1, type: 'bamboo', value: 3 };
    expect(tilesMatch(tile1, tile2)).toBe(true);
  });

  it('should not match tiles with same id (same tile)', () => {
    const tile1 = { id: 0, type: 'bamboo', value: 3 };
    const tile2 = { id: 0, type: 'bamboo', value: 3 };
    expect(tilesMatch(tile1, tile2)).toBe(false);
  });

  it('should not match tiles of different types', () => {
    const tile1 = { id: 0, type: 'bamboo', value: 3 };
    const tile2 = { id: 1, type: 'dot', value: 3 };
    expect(tilesMatch(tile1, tile2)).toBe(false);
  });

  it('should not match tiles of different values within same type', () => {
    const tile1 = { id: 0, type: 'bamboo', value: 3 };
    const tile2 = { id: 1, type: 'bamboo', value: 5 };
    expect(tilesMatch(tile1, tile2)).toBe(false);
  });

  it('should not match when either tile is null', () => {
    const tile1 = { id: 0, type: 'bamboo', value: 3 };
    expect(tilesMatch(tile1, null)).toBe(false);
    expect(tilesMatch(null, tile1)).toBe(false);
    expect(tilesMatch(null, null)).toBe(false);
  });
});

describe('Shisen-Sho - Direct Paths (0 turns)', () => {
  it('should find direct horizontal path with no obstacles', () => {
    const grid = [
      [{ id: 0 }, null, null, { id: 1 }],
    ];
    expect(findPath(grid, 0, 0, 0, 3)).toBe(true);
  });

  it('should find direct vertical path with no obstacles', () => {
    const grid = [
      [{ id: 0 }],
      [null],
      [null],
      [{ id: 1 }],
    ];
    expect(findPath(grid, 0, 0, 3, 0)).toBe(true);
  });

  it('should find path between adjacent tiles', () => {
    const grid = [
      [{ id: 0 }, { id: 1 }],
    ];
    expect(findPath(grid, 0, 0, 0, 1)).toBe(true);
  });
});

describe('Shisen-Sho - One Turn Paths', () => {
  it('should find L-shaped path with one turn', () => {
    const grid = [
      [{ id: 0 }, null, null],
      [null, null, null],
      [null, null, { id: 1 }],
    ];
    expect(findPath(grid, 0, 0, 2, 2)).toBe(true);
  });

  it('should find path with one turn in opposite direction', () => {
    const grid = [
      [null, null, { id: 0 }],
      [null, null, null],
      [{ id: 1 }, null, null],
    ];
    expect(findPath(grid, 0, 2, 2, 0)).toBe(true);
  });
});

describe('Shisen-Sho - Two Turn Paths', () => {
  it('should find Z-shaped path with two turns', () => {
    const grid = [
      [{ id: 0 }, null, null, null],
      [null, null, null, null],
      [null, null, null, { id: 1 }],
    ];
    expect(findPath(grid, 0, 0, 2, 3)).toBe(true);
  });

  it('should find zigzag path with 2 turns', () => {
    const grid = [
      [null, null, null, { id: 0 }],
      [null, null, null, null],
      [null, null, null, null],
      [{ id: 1 }, null, null, null],
    ];
    expect(findPath(grid, 0, 3, 3, 0)).toBe(true);
  });
});

describe('Shisen-Sho - Path Around Board Edge', () => {
  it('should find path going outside board boundary (key feature)', () => {
    const grid = [
      [{ id: 0 }, { id: 2 }, { id: 3 }],
      [null, null, null],
      [{ id: 4 }, { id: 5 }, { id: 1 }],
    ];
    // Can go around the outside even though direct path is blocked
    expect(findPath(grid, 0, 0, 2, 2)).toBe(true);
  });

  it('should connect corner to corner via outside', () => {
    const grid = [
      [{ id: 0 }, null, { id: 2 }],
      [null, null, null],
      [{ id: 3 }, null, { id: 1 }],
    ];
    expect(findPath(grid, 0, 0, 2, 2)).toBe(true);
  });

  it('should connect tiles in same row going around outside', () => {
    const grid = [
      [{ id: 0 }, { id: 2 }, { id: 3 }, { id: 1 }],
    ];
    // Can go above/below the board
    expect(findPath(grid, 0, 0, 0, 3)).toBe(true);
  });

  it('should connect tiles in same column going around outside', () => {
    const grid = [
      [{ id: 0 }],
      [{ id: 2 }],
      [{ id: 3 }],
      [{ id: 1 }],
    ];
    // Can go left/right of the board
    expect(findPath(grid, 0, 0, 3, 0)).toBe(true);
  });
});

describe('Shisen-Sho - Edge Cases', () => {
  it('should handle tiles at edge of board', () => {
    const grid = [
      [{ id: 0 }, null],
      [{ id: 1 }, null],
    ];
    expect(findPath(grid, 0, 0, 1, 0)).toBe(true);
  });

  it('should handle same row with gap', () => {
    const grid = [
      [{ id: 0 }, null, null, null, { id: 1 }],
    ];
    expect(findPath(grid, 0, 0, 0, 4)).toBe(true);
  });

  it('should handle same column with gap', () => {
    const grid = [
      [{ id: 0 }],
      [null],
      [null],
      [null],
      [{ id: 1 }],
    ];
    expect(findPath(grid, 0, 0, 4, 0)).toBe(true);
  });
});

describe('Shisen-Sho - Stress Tests', () => {
  it('should handle larger grid efficiently', () => {
    const grid = Array(10).fill(null).map(() => Array(10).fill(null));
    grid[0][0] = { id: 0 };
    grid[9][9] = { id: 1 };
    
    // Should be able to connect corner to corner
    expect(findPath(grid, 0, 0, 9, 9)).toBe(true);
  });

  it('should handle dense grid with strategic opening', () => {
    const grid = [
      [{ id: 0 }, { id: 2 }, { id: 3 }, { id: 4 }],
      [{ id: 5 }, { id: 6 }, { id: 7 }, { id: 8 }],
      [{ id: 9 }, { id: 10 }, { id: 11 }, { id: 12 }],
      [null, null, null, { id: 1 }],
    ];
    
    // Should find path from top-left going around outside to bottom-right
    expect(findPath(grid, 0, 0, 3, 3)).toBe(true);
  });

  it('should handle complex interior path', () => {
    const grid = [
      [null, null, null, null, null],
      [null, { id: 0 }, null, { id: 1 }, null],
      [null, null, null, null, null],
    ];
    
    expect(findPath(grid, 1, 1, 1, 3)).toBe(true);
  });
});
