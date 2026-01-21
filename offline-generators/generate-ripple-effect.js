#!/usr/bin/env node
/**
 * Ripple Effect Puzzle Generator
 *
 * Generates uniquely solvable Ripple Effect puzzles and outputs a JSON dataset.
 *
 * Ripple Effect Rules:
 * 1. The grid is divided into rooms (polyominoes)
 * 2. Each room must contain numbers 1 through N where N is the room size
 * 3. If the same number N appears twice in a row or column, there must be
 *    at least N cells between them
 *
 * Run with: node offline-generators/generate-ripple-effect.js [count] [startSeed]
 *
 * Output: public/datasets/rippleEffectPuzzles.json
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================================================
// Seeded Random Number Generator
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

// ============================================================================
// Grid Utilities
// ============================================================================

function createGrid(rows, cols, fill) {
  return Array(rows).fill(null).map(() => Array(cols).fill(fill));
}

function cloneGrid(grid) {
  return grid.map(row => [...row]);
}

// ============================================================================
// Room (Region) Generation
// ============================================================================

/**
 * Generate a random partition of the grid into rooms using flood fill approach
 * Ensures rooms are connected polyominoes with varied sizes (2-6 cells typically)
 */
/**
 * Generate room layout for larger grids respecting distance constraint limits
 * For 10x10: max 5 ones/row, max 3 twos/row, max 2 threes/row, etc.
 * Uses larger rooms (4-5 cells) to balance the value distribution
 */
function generateConstrainedLayout(rows, cols, rng) {
  const roomGrid = createGrid(rows, cols, 0);
  let roomId = 1;

  // Calculate max values per row/col for each number
  const maxPerLine = {};
  for (let v = 1; v <= 6; v++) {
    maxPerLine[v] = Math.floor(cols / (v + 1));
  }

  // Track value counts per row and column
  const rowCounts = Array(rows).fill(null).map(() => ({}));
  const colCounts = Array(cols).fill(null).map(() => ({}));

  // Get all cells in random order
  const allCells = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      allCells.push([r, c]);
    }
  }
  const shuffledCells = seededShuffle(allCells, rng);

  for (const [startR, startC] of shuffledCells) {
    if (roomGrid[startR][startC] !== 0) continue;

    // Room sizes depend on grid size - smaller rooms for larger grids
    let targetSize;
    if (rows <= 6) {
      targetSize = 2 + Math.floor(rng() * 5); // 2-6 for 6x6
    } else if (rows <= 8) {
      targetSize = 2 + Math.floor(rng() * 4); // 2-5 for 8x8
    } else {
      // 10x10: use size 2-3, weighted toward 2
      const r = rng();
      if (r < 0.7) targetSize = 2;      // 70% size 2
      else targetSize = 3;               // 30% size 3
    }
    const room = [[startR, startC]];
    roomGrid[startR][startC] = roomId;

    // Grow room
    while (room.length < targetSize) {
      const candidates = [];
      for (const [r, c] of room) {
        for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
          const nr = r + dr;
          const nc = c + dc;
          if (nr >= 0 && nr < rows && nc >= 0 && nc < cols &&
              roomGrid[nr][nc] === 0 &&
              !candidates.some(([cr, cc]) => cr === nr && cc === nc)) {
            candidates.push([nr, nc]);
          }
        }
      }

      if (candidates.length === 0) break;

      const [nr, nc] = candidates[Math.floor(rng() * candidates.length)];
      roomGrid[nr][nc] = roomId;
      room.push([nr, nc]);
    }

    roomId++;
  }

  // Build rooms data structure
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
    rooms.push({ id: parseInt(id), cells, size: cells.length });
  }

  return { roomGrid, rooms };
}

function generateRoomLayout(rows, cols, rng) {
  // For 10x10+, use constrained layout with larger rooms
  if (rows >= 10) {
    return generateConstrainedLayout(rows, cols, rng);
  }

  const roomGrid = createGrid(rows, cols, 0);
  const totalCells = rows * cols;
  let roomId = 1;
  let cellsAssigned = 0;

  // Get all cells in random order
  const allCells = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      allCells.push([r, c]);
    }
  }
  const shuffledCells = seededShuffle(allCells, rng);

  // Assign rooms
  for (const [startR, startC] of shuffledCells) {
    if (roomGrid[startR][startC] !== 0) continue;

    // Start a new room
    let roomSize;
    if (rows <= 6) {
      roomSize = 2 + Math.floor(rng() * 5); // 2-6 cells
    } else {
      roomSize = 2 + Math.floor(rng() * 4); // 2-5 cells
    }
    const room = [[startR, startC]];
    roomGrid[startR][startC] = roomId;
    cellsAssigned++;

    // Grow the room
    while (room.length < roomSize && cellsAssigned < totalCells) {
      // Find all cells adjacent to current room that are unassigned
      const candidates = [];
      for (const [r, c] of room) {
        for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
          const nr = r + dr;
          const nc = c + dc;
          if (nr >= 0 && nr < rows && nc >= 0 && nc < cols &&
              roomGrid[nr][nc] === 0) {
            // Check not already a candidate
            if (!candidates.some(([cr, cc]) => cr === nr && cc === nc)) {
              candidates.push([nr, nc]);
            }
          }
        }
      }

      if (candidates.length === 0) break;

      // Pick a random candidate
      const [nr, nc] = candidates[Math.floor(rng() * candidates.length)];
      roomGrid[nr][nc] = roomId;
      room.push([nr, nc]);
      cellsAssigned++;
    }

    roomId++;
  }

  // Build rooms data structure
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

// ============================================================================
// Ripple Effect Constraint Checking
// ============================================================================

/**
 * Check if placing value at (row, col) violates the ripple effect distance constraint
 * Two identical numbers N must have at least N cells between them in same row/col
 */
function violatesDistanceConstraint(grid, rows, cols, row, col, value) {
  if (value === 0) return false;

  // Check in the same row
  for (let c = 0; c < cols; c++) {
    if (c === col) continue;
    if (grid[row][c] === value) {
      const distance = Math.abs(c - col) - 1; // cells between them
      if (distance < value) return true;
    }
  }

  // Check in the same column
  for (let r = 0; r < rows; r++) {
    if (r === row) continue;
    if (grid[r][col] === value) {
      const distance = Math.abs(r - row) - 1; // cells between them
      if (distance < value) return true;
    }
  }

  return false;
}

/**
 * Check if a room has duplicate values
 */
function roomHasDuplicate(grid, room, excludeCell = null) {
  const seen = new Set();
  for (const [r, c] of room.cells) {
    if (excludeCell && r === excludeCell[0] && c === excludeCell[1]) continue;
    const val = grid[r][c];
    if (val !== 0) {
      if (seen.has(val)) return true;
      seen.add(val);
    }
  }
  return false;
}

/**
 * Check if a room value exceeds room size
 */
function roomHasInvalidValue(grid, room) {
  for (const [r, c] of room.cells) {
    if (grid[r][c] > room.size) return true;
  }
  return false;
}

// ============================================================================
// Solution Generation
// ============================================================================

/**
 * Generate a valid distance-constrained grid (solution-first approach)
 * This is used for larger grids where room-first approach is too slow
 * Uses MRV (minimum remaining values) heuristic for better efficiency
 */
function generateDistanceConstrainedGrid(rows, cols, rng, timeout = 5000) {
  const startTime = Date.now();
  const grid = createGrid(rows, cols, 0);

  // Get valid values for a cell
  function getValidValues(r, c) {
    const valid = [];
    for (let v = 1; v <= 3; v++) {  // Only use 1-3 for 10x10
      if (!violatesDistanceConstraint(grid, rows, cols, r, c, v)) {
        valid.push(v);
      }
    }
    return valid;
  }

  // Get the unfilled cell with minimum remaining values (MRV heuristic)
  function getMRVCell() {
    let minCount = Infinity;
    let bestCells = [];

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (grid[r][c] === 0) {
          const validCount = getValidValues(r, c).length;
          if (validCount < minCount) {
            minCount = validCount;
            bestCells = [[r, c]];
          } else if (validCount === minCount) {
            bestCells.push([r, c]);
          }
        }
      }
    }

    if (bestCells.length === 0) return null;
    return bestCells[Math.floor(rng() * bestCells.length)];
  }

  // Count unfilled cells
  function countUnfilled() {
    let count = 0;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (grid[r][c] === 0) count++;
      }
    }
    return count;
  }

  function solve() {
    if (Date.now() - startTime > timeout) return false;

    const cell = getMRVCell();
    if (!cell) return true; // All cells filled

    const [r, c] = cell;
    const validValues = seededShuffle(getValidValues(r, c), rng);

    if (validValues.length === 0) return false;

    for (const val of validValues) {
      grid[r][c] = val;
      if (solve()) return true;
      grid[r][c] = 0;
    }

    return false;
  }

  if (solve()) {
    return grid;
  }
  return null;
}

/**
 * Create rooms from a filled grid (solution-first approach)
 * Groups adjacent cells ensuring each room contains exactly values {1, 2, ..., N}
 */
function createRoomsFromGrid(grid, rows, cols, rng) {
  const roomGrid = createGrid(rows, cols, 0);
  let roomId = 1;

  // Get all cells in random order
  const allCells = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      allCells.push([r, c]);
    }
  }
  const shuffledCells = seededShuffle(allCells, rng);

  for (const [startR, startC] of shuffledCells) {
    if (roomGrid[startR][startC] !== 0) continue;

    const startVal = grid[startR][startC];

    // Start a new room with this cell
    const room = [[startR, startC]];
    const roomValues = new Set([startVal]);
    roomGrid[startR][startC] = roomId;

    // Target size based on starting value - we need to collect {1, ..., targetSize}
    // Start with targetSize = startVal (minimum viable room)
    let targetSize = startVal;

    // Try to grow the room to get consecutive values 1..N
    let attempts = 0;
    const maxAttempts = 50;

    while (attempts < maxAttempts) {
      attempts++;

      // Check what values we're missing to complete {1, ..., targetSize}
      const missingValues = [];
      for (let v = 1; v <= targetSize; v++) {
        if (!roomValues.has(v)) missingValues.push(v);
      }

      // If we have all values 1..targetSize, room is valid
      if (missingValues.length === 0) break;

      // Find adjacent unassigned cells with a missing value
      const candidates = [];
      for (const [r, c] of room) {
        for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
          const nr = r + dr;
          const nc = c + dc;
          if (nr >= 0 && nr < rows && nc >= 0 && nc < cols &&
              roomGrid[nr][nc] === 0) {
            const val = grid[nr][nc];
            // Only add if this value is missing and not already in room
            if (missingValues.includes(val) && !roomValues.has(val)) {
              if (!candidates.some(([cr, cc]) => cr === nr && cc === nc)) {
                candidates.push([nr, nc, val]);
              }
            }
          }
        }
      }

      if (candidates.length === 0) {
        // Can't find a missing value - try increasing target size
        // Look for adjacent cells with value = targetSize + 1
        if (targetSize < 3) { // Max room size 3 for 10x10
          const expandCandidates = [];
          for (const [r, c] of room) {
            for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
              const nr = r + dr;
              const nc = c + dc;
              if (nr >= 0 && nr < rows && nc >= 0 && nc < cols &&
                  roomGrid[nr][nc] === 0) {
                const val = grid[nr][nc];
                if (val === targetSize + 1 && !roomValues.has(val)) {
                  if (!expandCandidates.some(([cr, cc]) => cr === nr && cc === nc)) {
                    expandCandidates.push([nr, nc, val]);
                  }
                }
              }
            }
          }
          if (expandCandidates.length > 0) {
            targetSize++;
            const [nr, nc, val] = expandCandidates[Math.floor(rng() * expandCandidates.length)];
            roomGrid[nr][nc] = roomId;
            room.push([nr, nc]);
            roomValues.add(val);
            continue;
          }
        }
        break;
      }

      // Pick a random candidate
      const [nr, nc, val] = candidates[Math.floor(rng() * candidates.length)];
      roomGrid[nr][nc] = roomId;
      room.push([nr, nc]);
      roomValues.add(val);
    }

    roomId++;
  }

  // Build rooms data structure
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

/**
 * Validate that the grid satisfies room constraints
 */
function validateRoomConstraints(grid, rooms) {
  for (const room of rooms) {
    const values = new Set();
    for (const [r, c] of room.cells) {
      const val = grid[r][c];
      if (val > room.size) return false;
      if (values.has(val)) return false;
      values.add(val);
    }
    // Each room must have values 1 to N
    for (let i = 1; i <= room.size; i++) {
      if (!values.has(i)) return false;
    }
  }
  return true;
}

/**
 * Generate a valid Ripple Effect solution using backtracking with timeout
 */
function generateSolution(rows, cols, roomGrid, rooms, rng, timeout = 500) {
  const startTime = Date.now();
  const grid = createGrid(rows, cols, 0);

  // Map cell to room for quick lookup
  const cellToRoom = {};
  for (const room of rooms) {
    for (const [r, c] of room.cells) {
      cellToRoom[`${r},${c}`] = room;
    }
  }

  // Sort rooms by size (smaller first - easier to fill)
  const sortedRooms = [...rooms].sort((a, b) => a.size - b.size);

  let timedOut = false;

  function fillRoom(roomIdx) {
    if (Date.now() - startTime > timeout) {
      timedOut = true;
      return false;
    }
    if (roomIdx >= sortedRooms.length) return true;

    const room = sortedRooms[roomIdx];
    const cells = [...room.cells];
    const values = Array.from({ length: room.size }, (_, i) => i + 1);

    // Try all permutations of values for this room
    return tryPermutation(cells, seededShuffle(values, rng), 0);

    function tryPermutation(cells, availableValues, cellIdx) {
      if (timedOut || Date.now() - startTime > timeout) {
        timedOut = true;
        return false;
      }
      if (cellIdx >= cells.length) {
        return fillRoom(roomIdx + 1);
      }

      const [r, c] = cells[cellIdx];
      const shuffledValues = seededShuffle([...availableValues], rng);

      for (const val of shuffledValues) {
        // Check distance constraint
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

  if (fillRoom(0) && !timedOut) {
    return grid;
  }

  return null;
}

// ============================================================================
// Solver for Uniqueness Verification
// ============================================================================

/**
 * Solve Ripple Effect using constraint propagation and backtracking
 * Returns number of solutions found (stops at maxSolutions)
 */
function solveRippleEffect(rows, cols, roomGrid, rooms, clueGrid, maxSolutions = 2, timeout = 2000) {
  const startTime = Date.now();
  let solutions = 0;

  // Map cell to room
  const cellToRoom = {};
  for (const room of rooms) {
    for (const [r, c] of room.cells) {
      cellToRoom[`${r},${c}`] = room;
    }
  }

  // Initialize grid with clues
  const grid = createGrid(rows, cols, 0);
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (clueGrid[r][c] !== null && clueGrid[r][c] !== 0) {
        grid[r][c] = clueGrid[r][c];
      }
    }
  }

  // Find all empty cells
  const emptyCells = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (grid[r][c] === 0) {
        emptyCells.push([r, c]);
      }
    }
  }

  // Calculate possible values for each cell
  function getPossibleValues(r, c) {
    const room = cellToRoom[`${r},${c}`];
    const possible = [];

    // Values must be 1 to room.size
    for (let val = 1; val <= room.size; val++) {
      // Check not already used in room
      let usedInRoom = false;
      for (const [rr, cc] of room.cells) {
        if ((rr !== r || cc !== c) && grid[rr][cc] === val) {
          usedInRoom = true;
          break;
        }
      }
      if (usedInRoom) continue;

      // Check distance constraint
      if (!violatesDistanceConstraint(grid, rows, cols, r, c, val)) {
        possible.push(val);
      }
    }

    return possible;
  }

  // Sort empty cells by most constrained first (MRV heuristic)
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
// Puzzle Generation
// ============================================================================

/**
 * Generate a Ripple Effect puzzle
 * Returns { puzzle, rejectReason } where rejectReason indicates why generation failed
 */
function generatePuzzle(rows, cols, difficulty, seed, verbose = false) {
  const rng = createSeededRandom(seed);

  // Generate room layout (works for all sizes)
  const { roomGrid, rooms } = generateRoomLayout(rows, cols, rng);

  // Generate a valid solution with size-dependent timeout
  // 10x10 needs much longer timeout - give it up to 30 seconds
  const solutionTimeout = rows <= 6 ? 500 : rows <= 8 ? 1000 : 30000;
  const solution = generateSolution(rows, cols, roomGrid, rooms, rng, solutionTimeout);
  if (!solution) {
    return { puzzle: null, rejectReason: 'no_solution' };
  }

  // Create clue grid - start with all values revealed
  const clueGrid = cloneGrid(solution);

  // Get all cells and shuffle them
  const allCells = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      allCells.push([r, c]);
    }
  }
  const shuffledCells = seededShuffle(allCells, rng);

  // Target clue counts based on difficulty
  const totalCells = rows * cols;
  const targetClues = {
    easy: Math.floor(totalCells * 0.45),
    medium: Math.floor(totalCells * 0.35),
    hard: Math.floor(totalCells * 0.25),
  };
  const minClues = targetClues[difficulty] || targetClues.medium;

  // Remove clues one by one while maintaining unique solvability
  let currentClues = totalCells;
  for (const [r, c] of shuffledCells) {
    if (currentClues <= minClues) break;
    if (clueGrid[r][c] === null || clueGrid[r][c] === 0) continue;

    const oldValue = clueGrid[r][c];
    clueGrid[r][c] = null;

    // Check uniqueness - use shorter timeout for larger grids
    const solverTimeout = rows <= 6 ? 2000 : rows <= 8 ? 1500 : 1000;
    const solutionCount = solveRippleEffect(rows, cols, roomGrid, rooms, clueGrid, 2, solverTimeout);

    if (solutionCount !== 1) {
      // Not unique, restore the clue
      clueGrid[r][c] = oldValue;
    } else {
      currentClues--;
    }
  }

  // Final verification - use shorter timeout for larger grids
  const finalTimeout = rows <= 6 ? 3000 : rows <= 8 ? 2000 : 1500;
  const finalSolutions = solveRippleEffect(rows, cols, roomGrid, rooms, clueGrid, 2, finalTimeout);
  if (finalSolutions !== 1) {
    return { puzzle: null, rejectReason: finalSolutions === 0 ? 'no_final_solution' : 'not_unique' };
  }

  // Count actual clues
  let clueCount = 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (clueGrid[r][c] !== null && clueGrid[r][c] !== 0) {
        clueCount++;
      }
    }
  }

  // Build regionCells for easier frontend use
  const regionCells = {};
  for (const room of rooms) {
    regionCells[room.id] = room.cells;
  }

  return {
    puzzle: {
      rows,
      cols,
      difficulty,
      seed,
      clues: clueGrid,
      regions: roomGrid,
      regionCells,
      solution,
      clueCount,
      roomCount: rooms.length
    },
    rejectReason: null
  };
}

// ============================================================================
// Incremental Save System
// ============================================================================

const OUTPUT_PATH = path.join(__dirname, '..', 'datasets', 'rippleEffectPuzzles.json');
const PROGRESS_PATH = path.join(__dirname, '.ripple-effect-progress.json');

let shuttingDown = false;

process.on('SIGINT', () => {
  console.log('\n\nGraceful shutdown initiated...');
  shuttingDown = true;
});

process.on('SIGTERM', () => {
  console.log('\n\nGraceful shutdown initiated...');
  shuttingDown = true;
});

function loadExistingData() {
  try {
    if (fs.existsSync(OUTPUT_PATH)) {
      const data = JSON.parse(fs.readFileSync(OUTPUT_PATH, 'utf8'));
      return data.puzzles || [];
    }
  } catch (e) {
    console.log('No existing dataset found, starting fresh.');
  }
  return [];
}

function loadProgress() {
  try {
    if (fs.existsSync(PROGRESS_PATH)) {
      return JSON.parse(fs.readFileSync(PROGRESS_PATH, 'utf8'));
    }
  } catch (e) {
    // Ignore
  }
  return {};
}

function saveProgress(progress) {
  fs.writeFileSync(PROGRESS_PATH, JSON.stringify(progress, null, 2));
}

function saveDataset(puzzles) {
  const output = {
    name: 'Ripple Effect Puzzles',
    description: 'Fill each room with numbers 1-N. Same numbers in a row/column must be N cells apart.',
    generated: new Date().toISOString(),
    count: puzzles.length,
    puzzles
  };
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2));
}

// ============================================================================
// Main Generator
// ============================================================================

async function main() {
  const TARGET_COUNT = parseInt(process.argv[2]) || 1000;
  const START_SEED = parseInt(process.argv[3]) || 1;
  const BASE_MAX_SEED = parseInt(process.argv[4]) || 500000;

  console.log('='.repeat(60));
  console.log('Ripple Effect Puzzle Generator (with incremental save)');
  console.log('='.repeat(60));
  console.log(`Target: ${TARGET_COUNT} puzzles per size/difficulty`);
  console.log(`Seed range: ${START_SEED} to ${BASE_MAX_SEED}`);
  console.log('');

  // Load existing puzzles and progress
  const puzzles = loadExistingData();
  const progress = loadProgress();

  console.log(`Loaded ${puzzles.length} existing puzzles`);
  if (Object.keys(progress).length > 0) {
    console.log('Resuming from previous progress...');
  }
  console.log('');

  // Standard size is 8x8, also generate 6x6
  // Note: 10x10 is too constrained - the distance rule creates an extremely narrow
  // solution space that random room generation can't reliably satisfy.
  // For value v, max per row = floor((L-1)/(v+1))+1. With 10x10 and mostly size-2+ rooms,
  // the required 2s often exceed the max of 40, making layouts unsolvable.
  const configs = [
    { rows: 6, cols: 6, difficulty: 'easy', maxSeed: BASE_MAX_SEED },
    { rows: 6, cols: 6, difficulty: 'medium', maxSeed: BASE_MAX_SEED },
    { rows: 6, cols: 6, difficulty: 'hard', maxSeed: BASE_MAX_SEED },
    { rows: 8, cols: 8, difficulty: 'easy', maxSeed: BASE_MAX_SEED },
    { rows: 8, cols: 8, difficulty: 'medium', maxSeed: BASE_MAX_SEED },
    { rows: 8, cols: 8, difficulty: 'hard', maxSeed: BASE_MAX_SEED },
  ];

  // Calculate how many per config to reach target total
  const perConfig = Math.ceil(TARGET_COUNT / configs.length);

  for (const { rows, cols, difficulty, maxSeed } of configs) {
    if (shuttingDown) break;

    const configKey = `${rows}x${cols}-${difficulty}`;

    // Count existing puzzles for this config
    const existing = puzzles.filter(
      p => p.rows === rows && p.cols === cols && p.difficulty === difficulty
    ).length;

    if (existing >= perConfig) {
      console.log(`${configKey}: Already have ${existing} puzzles ✓`);
      continue;
    }

    // Get resume point
    let seed = progress[configKey]?.lastSeed ?? START_SEED;
    let generated = existing;

    console.log(`${configKey}: Have ${existing}, need ${perConfig - existing} more...`);
    const startTime = Date.now();
    let tested = 0;

    // Track rejection reasons for diagnostics
    const rejections = { no_solution: 0, not_unique: 0, no_final_solution: 0, invalid_rooms: 0 };
    let lastProgressTime = Date.now();

    while (generated < perConfig && seed < maxSeed) {
      if (shuttingDown) break;

      const result = generatePuzzle(rows, cols, difficulty, seed);

      if (result.puzzle) {
        puzzles.push({
          id: `ripple-${difficulty}-${rows}x${cols}-${String(generated + 1).padStart(4, '0')}`,
          ...result.puzzle
        });
        generated++;

        // Progress display
        const elapsed = (Date.now() - startTime) / 1000;
        const rate = (generated - existing) > 0 ? Math.round((generated - existing) / elapsed * 3600) : 0;
        const successRate = tested > 0 ? ((generated - existing) / tested * 100).toFixed(1) : 0;
        process.stdout.write(`\r  Found ${generated}/${perConfig} | seed ${seed} | ${elapsed.toFixed(0)}s | ~${rate}/hr | ${successRate}% success    `);

        // Incremental save every 10 puzzles
        if (generated % 10 === 0) {
          saveDataset(puzzles);
          progress[configKey] = { lastSeed: seed, count: generated };
          saveProgress(progress);
        }
      } else {
        // Track rejection reason
        if (result.rejectReason) {
          rejections[result.rejectReason] = (rejections[result.rejectReason] || 0) + 1;
        }
      }

      seed++;
      tested++;

      // Print verbose progress every 3 seconds for larger grids, 10 seconds for smaller
      const now = Date.now();
      const progressInterval = rows >= 8 ? 3000 : 10000;
      if (now - lastProgressTime >= progressInterval) {
        const elapsed = (now - startTime) / 1000;
        const rate = (generated - existing) > 0 ? Math.round((generated - existing) / elapsed * 3600) : 0;
        const successRate = tested > 0 ? ((generated - existing) / tested * 100).toFixed(1) : 0;
        console.log(`\n  [${new Date().toLocaleTimeString()}] Seed ${seed} | Found ${generated - existing}/${perConfig - existing} | Tested ${tested} | ${successRate}% success | ~${rate}/hr`);
        console.log(`    Rejections: no_solution=${rejections.no_solution}, not_unique=${rejections.not_unique}, no_final=${rejections.no_final_solution || 0}, invalid_rooms=${rejections.invalid_rooms || 0}`);
        lastProgressTime = now;

        // For larger grids, also save progress more frequently
        if (rows >= 8 && tested % 10 === 0) {
          progress[configKey] = { lastSeed: seed, count: generated };
          saveProgress(progress);
        }
      }

      // Yield to event loop periodically
      if (tested % 50 === 0) {
        await new Promise(resolve => setImmediate(resolve));
      }
    }

    // Save after completing this config
    saveDataset(puzzles);
    progress[configKey] = { lastSeed: seed, count: generated, complete: generated >= perConfig || seed >= maxSeed };
    saveProgress(progress);

    const elapsed = (Date.now() - startTime) / 1000;
    const successRate = tested > 0 ? ((generated - existing) / tested * 100).toFixed(1) : 0;
    console.log(`\n  Done: ${generated - existing} puzzles in ${elapsed.toFixed(1)}s (tested ${tested} seeds, ${successRate}% success)`);
    console.log(`  Rejections: no_solution=${rejections.no_solution}, not_unique=${rejections.not_unique}, no_final=${rejections.no_final_solution || 0}`);
    console.log('');
  }

  // Final save
  saveDataset(puzzles);
  console.log('='.repeat(60));
  console.log(`Final dataset: ${puzzles.length} puzzles saved to ${OUTPUT_PATH}`);

  // Clean up progress file if complete
  const allComplete = configs.every(c => {
    const key = `${c.rows}x${c.cols}-${c.difficulty}`;
    return progress[key]?.complete;
  });

  if (allComplete) {
    try {
      fs.unlinkSync(PROGRESS_PATH);
      console.log('Progress file cleaned up (all configurations complete)');
    } catch (e) {
      // Ignore
    }
  }
}

main().catch(console.error);
