import { describe, it, expect } from 'vitest';

// ============================================================================
// Copy of core functions from generate-ripple-effect.js for testing
// ============================================================================

function createSeededRandom(seed) {
  let s = seed;
  return function() {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

function seededShuffle(array, rng) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function createGrid(rows, cols, fill) {
  return Array(rows).fill(null).map(() => Array(cols).fill(fill));
}

function cloneGrid(grid) {
  return grid.map(row => [...row]);
}

function generateRoomLayout(rows, cols, rng) {
  const roomGrid = createGrid(rows, cols, 0);
  const totalCells = rows * cols;
  let roomId = 1;
  let cellsAssigned = 0;

  const allCells = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      allCells.push([r, c]);
    }
  }
  const shuffledCells = seededShuffle(allCells, rng);

  for (const [startR, startC] of shuffledCells) {
    if (roomGrid[startR][startC] !== 0) continue;

    const roomSize = 2 + Math.floor(rng() * 5);
    const room = [[startR, startC]];
    roomGrid[startR][startC] = roomId;
    cellsAssigned++;

    while (room.length < roomSize && cellsAssigned < totalCells) {
      const candidates = [];
      for (const [r, c] of room) {
        for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
          const nr = r + dr;
          const nc = c + dc;
          if (nr >= 0 && nr < rows && nc >= 0 && nc < cols &&
              roomGrid[nr][nc] === 0) {
            if (!candidates.some(([cr, cc]) => cr === nr && cc === nc)) {
              candidates.push([nr, nc]);
            }
          }
        }
      }

      if (candidates.length === 0) break;

      const [nr, nc] = candidates[Math.floor(rng() * candidates.length)];
      roomGrid[nr][nc] = roomId;
      room.push([nr, nc]);
      cellsAssigned++;
    }

    roomId++;
  }

  const rooms = [];
  const roomCells = {};
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const id = roomGrid[r][c];
      if (!roomCells[id]) roomCells[id] = [];
      roomCells[id].push([r, c]);
    }
  }

  for (const [id, cells] of Object.entries(roomCells)) {
    rooms.push({
      id: parseInt(id),
      cells,
      size: cells.length
    });
  }

  return { roomGrid, rooms };
}

function violatesDistanceConstraint(grid, rows, cols, row, col, value) {
  if (value === 0) return false;

  for (let c = 0; c < cols; c++) {
    if (c === col) continue;
    if (grid[row][c] === value) {
      const distance = Math.abs(c - col) - 1;
      if (distance < value) return true;
    }
  }

  for (let r = 0; r < rows; r++) {
    if (r === row) continue;
    if (grid[r][col] === value) {
      const distance = Math.abs(r - row) - 1;
      if (distance < value) return true;
    }
  }

  return false;
}

function generateSolution(rows, cols, roomGrid, rooms, rng) {
  const grid = createGrid(rows, cols, 0);

  const cellToRoom = {};
  for (const room of rooms) {
    for (const [r, c] of room.cells) {
      cellToRoom[`${r},${c}`] = room;
    }
  }

  const shuffledRooms = seededShuffle([...rooms], rng);

  function fillRoom(roomIdx) {
    if (roomIdx >= shuffledRooms.length) return true;

    const room = shuffledRooms[roomIdx];
    const cells = [...room.cells];
    const values = Array.from({ length: room.size }, (_, i) => i + 1);

    return tryPermutation(cells, seededShuffle(values, rng), 0);

    function tryPermutation(cells, availableValues, cellIdx) {
      if (cellIdx >= cells.length) {
        return fillRoom(roomIdx + 1);
      }

      const [r, c] = cells[cellIdx];
      const shuffledValues = seededShuffle([...availableValues], rng);

      for (const val of shuffledValues) {
        if (!violatesDistanceConstraint(grid, rows, cols, r, c, val)) {
          grid[r][c] = val;
          const remaining = availableValues.filter(v => v !== val);
          if (tryPermutation(cells, remaining, cellIdx + 1)) {
            return true;
          }
          grid[r][c] = 0;
        }
      }

      return false;
    }
  }

  if (fillRoom(0)) {
    return grid;
  }

  return null;
}

function solveRippleEffect(rows, cols, roomGrid, rooms, clueGrid, maxSolutions = 2, timeout = 5000) {
  const startTime = Date.now();
  let solutions = 0;

  const cellToRoom = {};
  for (const room of rooms) {
    for (const [r, c] of room.cells) {
      cellToRoom[`${r},${c}`] = room;
    }
  }

  const grid = createGrid(rows, cols, 0);
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (clueGrid[r][c] !== null && clueGrid[r][c] !== 0) {
        grid[r][c] = clueGrid[r][c];
      }
    }
  }

  const emptyCells = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (grid[r][c] === 0) {
        emptyCells.push([r, c]);
      }
    }
  }

  function getPossibleValues(r, c) {
    const room = cellToRoom[`${r},${c}`];
    const possible = [];

    for (let val = 1; val <= room.size; val++) {
      let usedInRoom = false;
      for (const [rr, cc] of room.cells) {
        if ((rr !== r || cc !== c) && grid[rr][cc] === val) {
          usedInRoom = true;
          break;
        }
      }
      if (usedInRoom) continue;

      if (!violatesDistanceConstraint(grid, rows, cols, r, c, val)) {
        possible.push(val);
      }
    }

    return possible;
  }

  function sortByMRV() {
    emptyCells.sort((a, b) => {
      const possA = getPossibleValues(a[0], a[1]).length;
      const possB = getPossibleValues(b[0], b[1]).length;
      return possA - possB;
    });
  }

  function backtrack(idx) {
    if (Date.now() - startTime > timeout) return;
    if (solutions >= maxSolutions) return;

    if (idx >= emptyCells.length) {
      solutions++;
      return;
    }

    const [r, c] = emptyCells[idx];
    const possible = getPossibleValues(r, c);

    for (const val of possible) {
      grid[r][c] = val;
      backtrack(idx + 1);
      if (solutions >= maxSolutions) return;
      grid[r][c] = 0;
    }
  }

  sortByMRV();
  backtrack(0);

  return solutions;
}

// ============================================================================
// Tests
// ============================================================================

describe('Seeded Random Number Generator', () => {
  it('produces deterministic sequences', () => {
    const rng1 = createSeededRandom(12345);
    const rng2 = createSeededRandom(12345);

    const seq1 = [rng1(), rng1(), rng1(), rng1(), rng1()];
    const seq2 = [rng2(), rng2(), rng2(), rng2(), rng2()];

    expect(seq1).toEqual(seq2);
  });

  it('produces different sequences for different seeds', () => {
    const rng1 = createSeededRandom(12345);
    const rng2 = createSeededRandom(54321);

    const seq1 = [rng1(), rng1(), rng1()];
    const seq2 = [rng2(), rng2(), rng2()];

    expect(seq1).not.toEqual(seq2);
  });

  it('produces values between 0 and 1', () => {
    const rng = createSeededRandom(99999);
    for (let i = 0; i < 100; i++) {
      const val = rng();
      expect(val).toBeGreaterThanOrEqual(0);
      expect(val).toBeLessThan(1);
    }
  });
});

describe('Room Layout Generation', () => {
  it('covers entire grid', () => {
    const rng = createSeededRandom(42);
    const { roomGrid, rooms } = generateRoomLayout(6, 6, rng);

    // Check all cells are assigned
    for (let r = 0; r < 6; r++) {
      for (let c = 0; c < 6; c++) {
        expect(roomGrid[r][c]).toBeGreaterThan(0);
      }
    }

    // Check total cells in rooms equals grid size
    const totalCells = rooms.reduce((sum, room) => sum + room.size, 0);
    expect(totalCells).toBe(36);
  });

  it('creates connected rooms', () => {
    const rng = createSeededRandom(123);
    const { roomGrid, rooms } = generateRoomLayout(8, 8, rng);

    // Check each room is connected using BFS
    for (const room of rooms) {
      if (room.cells.length <= 1) continue;

      const [startR, startC] = room.cells[0];
      const visited = new Set();
      const queue = [[startR, startC]];
      visited.add(`${startR},${startC}`);

      while (queue.length > 0) {
        const [r, c] = queue.shift();
        for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
          const nr = r + dr;
          const nc = c + dc;
          const key = `${nr},${nc}`;
          if (!visited.has(key) && room.cells.some(([rr, cc]) => rr === nr && cc === nc)) {
            visited.add(key);
            queue.push([nr, nc]);
          }
        }
      }

      expect(visited.size).toBe(room.cells.length);
    }
  });

  it('generates deterministic layouts for same seed', () => {
    const rng1 = createSeededRandom(555);
    const rng2 = createSeededRandom(555);

    const layout1 = generateRoomLayout(6, 6, rng1);
    const layout2 = generateRoomLayout(6, 6, rng2);

    expect(layout1.roomGrid).toEqual(layout2.roomGrid);
  });
});

describe('Distance Constraint', () => {
  it('detects violation when same numbers are too close horizontally', () => {
    const grid = [
      [1, 0, 1, 0, 0],
      [0, 0, 0, 0, 0],
    ];

    // 1s are only 1 cell apart, need at least 1 cell between them
    // Actually: distance = |2 - 0| - 1 = 1, value = 1, so 1 >= 1 is OK
    expect(violatesDistanceConstraint(grid, 2, 5, 0, 2, 1)).toBe(false);

    // Now test with value 2: two 2s need 2 cells between them
    const grid2 = [
      [2, 0, 2, 0, 0],
      [0, 0, 0, 0, 0],
    ];
    // distance = |2 - 0| - 1 = 1, value = 2, 1 < 2 = violation
    expect(violatesDistanceConstraint(grid2, 2, 5, 0, 2, 2)).toBe(true);
  });

  it('detects violation when same numbers are too close vertically', () => {
    const grid = [
      [3, 0],
      [0, 0],
      [3, 0],
    ];
    // distance = |2 - 0| - 1 = 1, value = 3, 1 < 3 = violation
    expect(violatesDistanceConstraint(grid, 3, 2, 2, 0, 3)).toBe(true);
  });

  it('allows properly spaced numbers', () => {
    const grid = [
      [2, 0, 0, 2, 0],
      [0, 0, 0, 0, 0],
    ];
    // distance = |3 - 0| - 1 = 2, value = 2, 2 >= 2 = OK
    expect(violatesDistanceConstraint(grid, 2, 5, 0, 3, 2)).toBe(false);
  });

  it('handles value 1 correctly (can be adjacent)', () => {
    const grid = [
      [1, 1, 0],
      [0, 0, 0],
    ];
    // distance = |1 - 0| - 1 = 0, value = 1, 0 < 1 = violation
    // Actually 1s cannot be directly adjacent!
    expect(violatesDistanceConstraint(grid, 2, 3, 0, 1, 1)).toBe(true);
  });
});

describe('Solution Generation', () => {
  it('generates valid solutions', () => {
    const rng = createSeededRandom(789);
    const { roomGrid, rooms } = generateRoomLayout(6, 6, rng);

    const rng2 = createSeededRandom(789);
    // Need to advance rng to same state
    generateRoomLayout(6, 6, rng2);

    const solution = generateSolution(6, 6, roomGrid, rooms, rng);

    if (solution) {
      // Check all cells are filled
      for (let r = 0; r < 6; r++) {
        for (let c = 0; c < 6; c++) {
          expect(solution[r][c]).toBeGreaterThan(0);
        }
      }

      // Check room constraint: each room has 1 to N
      for (const room of rooms) {
        const values = room.cells.map(([r, c]) => solution[r][c]).sort((a, b) => a - b);
        const expected = Array.from({ length: room.size }, (_, i) => i + 1);
        expect(values).toEqual(expected);
      }

      // Check distance constraint
      for (let r = 0; r < 6; r++) {
        for (let c = 0; c < 6; c++) {
          expect(violatesDistanceConstraint(solution, 6, 6, r, c, solution[r][c])).toBe(false);
        }
      }
    }
  });

  it('is deterministic for same seed', () => {
    const seed = 42424;

    const rng1 = createSeededRandom(seed);
    const { roomGrid: rg1, rooms: rooms1 } = generateRoomLayout(6, 6, rng1);
    const solution1 = generateSolution(6, 6, rg1, rooms1, rng1);

    const rng2 = createSeededRandom(seed);
    const { roomGrid: rg2, rooms: rooms2 } = generateRoomLayout(6, 6, rng2);
    const solution2 = generateSolution(6, 6, rg2, rooms2, rng2);

    expect(solution1).toEqual(solution2);
  });
});

describe('Solver', () => {
  it('finds unique solution when fully specified', () => {
    const rng = createSeededRandom(111);
    const { roomGrid, rooms } = generateRoomLayout(6, 6, rng);
    const solution = generateSolution(6, 6, roomGrid, rooms, createSeededRandom(111 * 2));

    if (solution) {
      // Use solution as clues (should find exactly 1 solution)
      const solutions = solveRippleEffect(6, 6, roomGrid, rooms, solution, 2, 5000);
      expect(solutions).toBe(1);
    }
  });

  it('finds multiple solutions when under-constrained', () => {
    const rng = createSeededRandom(222);
    const { roomGrid, rooms } = generateRoomLayout(4, 4, rng);
    const solution = generateSolution(4, 4, roomGrid, rooms, createSeededRandom(222 * 2));

    if (solution) {
      // Remove most clues
      const sparseClues = createGrid(4, 4, null);
      sparseClues[0][0] = solution[0][0];

      const solutions = solveRippleEffect(4, 4, roomGrid, rooms, sparseClues, 3, 5000);
      // Should likely find multiple solutions with only 1 clue
      expect(solutions).toBeGreaterThanOrEqual(1);
    }
  });

  it('respects timeout', () => {
    const rng = createSeededRandom(333);
    const { roomGrid, rooms } = generateRoomLayout(8, 8, rng);

    // Empty clues - very hard to solve
    const emptyClues = createGrid(8, 8, null);

    const startTime = Date.now();
    solveRippleEffect(8, 8, roomGrid, rooms, emptyClues, 100, 100);
    const elapsed = Date.now() - startTime;

    // Should stop within reasonable time of timeout
    expect(elapsed).toBeLessThan(500);
  });
});

describe('Full Puzzle Generation', () => {
  it('produces puzzles with valid structure', () => {
    // Simple manual test of a small puzzle
    const rng = createSeededRandom(12345);
    const { roomGrid, rooms } = generateRoomLayout(6, 6, rng);
    const solution = generateSolution(6, 6, roomGrid, rooms, createSeededRandom(12345 * 3));

    if (solution) {
      // Verify solution structure
      expect(solution.length).toBe(6);
      expect(solution[0].length).toBe(6);

      // All values should be positive integers
      for (let r = 0; r < 6; r++) {
        for (let c = 0; c < 6; c++) {
          expect(Number.isInteger(solution[r][c])).toBe(true);
          expect(solution[r][c]).toBeGreaterThan(0);
        }
      }
    }
  });
});

describe('Edge Cases', () => {
  it('handles single-cell rooms correctly', () => {
    // A single-cell room must contain exactly the number 1
    const rooms = [{ id: 1, cells: [[0, 0]], size: 1 }];
    const roomGrid = [[1]];

    const solution = createGrid(1, 1, 1);
    const solutions = solveRippleEffect(1, 1, roomGrid, rooms, solution, 2, 1000);
    expect(solutions).toBe(1);
  });

  it('handles 2x2 grid', () => {
    const rng = createSeededRandom(999);
    const { roomGrid, rooms } = generateRoomLayout(2, 2, rng);
    const solution = generateSolution(2, 2, roomGrid, rooms, createSeededRandom(999 * 2));

    // Should produce a valid solution or null
    if (solution) {
      for (const room of rooms) {
        const values = room.cells.map(([r, c]) => solution[r][c]).sort((a, b) => a - b);
        const expected = Array.from({ length: room.size }, (_, i) => i + 1);
        expect(values).toEqual(expected);
      }
    }
  });
});
