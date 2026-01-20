#!/usr/bin/env node
/**
 * Mochikoro Puzzle Generator
 *
 * Generates uniquely solvable Mochikoro puzzles and outputs a JSON dataset.
 *
 * Mochikoro Rules:
 * 1. Divide the grid into white rectangular regions
 * 2. Each rectangle contains exactly one number showing its area
 * 3. Black cells fill gaps between rectangles
 * 4. No 2×2 area can be entirely black
 *
 * Run with: node offline-generators/generate-mochikoro.js [count] [startSeed]
 *
 * Output: public/datasets/mochikoroPuzzles.json
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
// Mochikoro Specific Functions
// ============================================================================

/**
 * Check if placing a rectangle would overlap or share an EDGE with existing rectangles
 * In Mochikoro, rectangles CAN touch at corners (diagonally), just not share edges
 */
function canPlaceRect(occupied, r, c, h, w, rows, cols) {
  // Check bounds
  if (r + h > rows || c + w > cols) return false;
  if (r < 0 || c < 0) return false;

  // Check the rectangle cells themselves - must be unoccupied
  for (let dr = 0; dr < h; dr++) {
    for (let dc = 0; dc < w; dc++) {
      if (occupied[r + dr][c + dc] !== 0) return false;
    }
  }

  // Check orthogonally adjacent cells (edges) - must not touch another rectangle's edge
  // We need at least one black cell between rectangles on edges
  // Top edge
  if (r > 0) {
    for (let dc = 0; dc < w; dc++) {
      if (occupied[r - 1][c + dc] !== 0) return false;
    }
  }
  // Bottom edge
  if (r + h < rows) {
    for (let dc = 0; dc < w; dc++) {
      if (occupied[r + h][c + dc] !== 0) return false;
    }
  }
  // Left edge
  if (c > 0) {
    for (let dr = 0; dr < h; dr++) {
      if (occupied[r + dr][c - 1] !== 0) return false;
    }
  }
  // Right edge
  if (c + w < cols) {
    for (let dr = 0; dr < h; dr++) {
      if (occupied[r + dr][c + w] !== 0) return false;
    }
  }

  // Corners CAN touch another rectangle (diagonal adjacency allowed in Mochikoro)
  return true;
}

/**
 * Alternative placement check that allows edge-sharing (for testing)
 * Use this if we want rectangles to be directly adjacent without black borders
 */
function canPlaceRectNoBuffer(occupied, r, c, h, w, rows, cols) {
  if (r + h > rows || c + w > cols) return false;
  if (r < 0 || c < 0) return false;

  for (let dr = 0; dr < h; dr++) {
    for (let dc = 0; dc < w; dc++) {
      if (occupied[r + dr][c + dc] !== 0) return false;
    }
  }
  return true;
}

/**
 * Mark rectangle cells as occupied
 */
function placeRect(occupied, r, c, h, w, rectId) {
  for (let dr = 0; dr < h; dr++) {
    for (let dc = 0; dc < w; dc++) {
      occupied[r + dr][c + dc] = rectId;
    }
  }
}

/**
 * Check for 2x2 black squares
 */
function has2x2BlackSquare(grid, rows, cols) {
  for (let r = 0; r < rows - 1; r++) {
    for (let c = 0; c < cols - 1; c++) {
      if (grid[r][c] === 'black' && grid[r+1][c] === 'black' &&
          grid[r][c+1] === 'black' && grid[r+1][c+1] === 'black') {
        return true;
      }
    }
  }
  return false;
}

/**
 * Check if placing black cells in unoccupied areas would create 2x2 at position
 */
function wouldCreate2x2(occupied, r, c, rows, cols) {
  // Check all 4 possible 2x2 squares that include (r,c)
  const checks = [
    [[0,0], [0,1], [1,0], [1,1]],   // (r,c) is top-left
    [[0,-1], [0,0], [1,-1], [1,0]], // (r,c) is top-right
    [[-1,0], [-1,1], [0,0], [0,1]], // (r,c) is bottom-left
    [[-1,-1], [-1,0], [0,-1], [0,0]] // (r,c) is bottom-right
  ];

  for (const offsets of checks) {
    let allBlack = true;
    for (const [dr, dc] of offsets) {
      const nr = r + dr;
      const nc = c + dc;
      if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) {
        allBlack = false;
        break;
      }
      // 0 means unoccupied (will be black), >0 means white rectangle
      if (occupied[nr][nc] !== 0) {
        allBlack = false;
        break;
      }
    }
    if (allBlack) return true;
  }
  return false;
}

/**
 * Generate a valid Mochikoro solution - SIMPLE VERSION
 * Just place rectangles with 1-cell buffer and check for 2x2 at the end
 */
function generateSolution(rows, cols, rng) {
  const occupied = createGrid(rows, cols, 0);
  const rectangles = [];
  let rectId = 1;

  // Rectangle sizes
  const sizes = [];
  const maxDim = Math.min(5, Math.max(rows, cols) - 1);
  for (let h = 1; h <= maxDim; h++) {
    for (let w = 1; w <= maxDim; w++) {
      if (h * w >= 2 && h * w <= 8) {
        sizes.push([h, w]);
      }
    }
  }

  // Random positions
  const positions = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      positions.push([r, c]);
    }
  }
  const shuffledPositions = seededShuffle(positions, rng);

  // Place rectangles with full buffer (original algorithm)
  for (const [r, c] of shuffledPositions) {
    if (occupied[r][c] !== 0) continue;
    const shuffledSizes = seededShuffle([...sizes], rng);
    for (const [h, w] of shuffledSizes) {
      if (canPlaceRectWithFullBuffer(occupied, r, c, h, w, rows, cols)) {
        placeRect(occupied, r, c, h, w, rectId);
        rectangles.push({ id: rectId, r, c, h, w, area: h * w });
        rectId++;
        break;
      }
    }
  }

  // Convert to grid
  const grid = createGrid(rows, cols, 'black');
  for (const rect of rectangles) {
    for (let dr = 0; dr < rect.h; dr++) {
      for (let dc = 0; dc < rect.w; dc++) {
        grid[rect.r + dr][rect.c + dc] = 'white';
      }
    }
  }

  // Validate
  if (has2x2BlackSquare(grid, rows, cols)) {
    return null;
  }

  if (rectangles.length < 3) {
    return null;
  }

  let blackCount = 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (grid[r][c] === 'black') blackCount++;
    }
  }
  if (blackCount < 2) {
    return null;
  }

  return { grid, rectangles };
}

/**
 * Original buffer check - 1 cell around entire rectangle (including corners)
 */
function canPlaceRectWithFullBuffer(occupied, r, c, h, w, rows, cols) {
  if (r + h > rows || c + w > cols) return false;
  if (r < 0 || c < 0) return false;

  for (let dr = -1; dr <= h; dr++) {
    for (let dc = -1; dc <= w; dc++) {
      const nr = r + dr;
      const nc = c + dc;
      if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;
      if (occupied[nr][nc] !== 0) return false;
    }
  }
  return true;
}

/**
 * Create puzzle clues from solution
 * Each rectangle gets one clue showing its area
 */
function createClues(rectangles, rows, cols, rng) {
  const clueGrid = createGrid(rows, cols, null);

  for (const rect of rectangles) {
    // Place clue at random position within rectangle
    const dr = Math.floor(rng() * rect.h);
    const dc = Math.floor(rng() * rect.w);
    clueGrid[rect.r + dr][rect.c + dc] = rect.area;
  }

  return clueGrid;
}

// ============================================================================
// Solver for Uniqueness Verification
// ============================================================================

/**
 * Solve Mochikoro using constraint propagation and backtracking
 * Returns number of solutions found (stops at 2)
 */
function solveMochikoro(rows, cols, clueGrid, maxSolutions = 2, timeout = 3000) {
  const startTime = Date.now();
  let solutions = 0;

  // Find all clue cells
  const clues = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (clueGrid[r][c] !== null) {
        clues.push({ r, c, area: clueGrid[r][c] });
      }
    }
  }

  // For each clue, find all possible rectangles containing that cell with that area
  function getRectanglesForClue(clue) {
    const rects = [];
    const { r, c, area } = clue;

    // Find all factor pairs of area
    for (let h = 1; h <= area; h++) {
      if (area % h === 0) {
        const w = area / h;
        // Find all positions where this rectangle could contain (r, c)
        for (let startR = Math.max(0, r - h + 1); startR <= r && startR + h <= rows; startR++) {
          for (let startC = Math.max(0, c - w + 1); startC <= c && startC + w <= cols; startC++) {
            rects.push({ r: startR, c: startC, h, w });
          }
        }
      }
    }

    return rects;
  }

  // Precompute possible rectangles for each clue
  const cluePossibilities = clues.map(clue => ({
    clue,
    rects: getRectanglesForClue(clue)
  }));

  // Check if two rectangles overlap or share an edge (not corners - those are OK)
  function rectsConflict(r1, r2) {
    // Check for overlap (cells inside both rectangles)
    const overlapHoriz = !(r1.c + r1.w <= r2.c || r2.c + r2.w <= r1.c);
    const overlapVert = !(r1.r + r1.h <= r2.r || r2.r + r2.h <= r1.r);
    if (overlapHoriz && overlapVert) return true;

    // Check for edge-sharing (orthogonal adjacency)
    // They conflict if they share an edge (but corner-touching is allowed)
    const touchHoriz = (r1.c + r1.w === r2.c || r2.c + r2.w === r1.c);
    const touchVert = (r1.r + r1.h === r2.r || r2.r + r2.h === r1.r);

    // Edge sharing: one dimension touches exactly, the other overlaps
    if (touchHoriz && overlapVert) return true;
    if (touchVert && overlapHoriz) return true;

    // Corner touching is NOT a conflict (diagonal adjacency is fine)
    return false;
  }

  // Check if a rectangle contains another clue
  function rectContainsOtherClue(rect, clueIdx) {
    for (let i = 0; i < clues.length; i++) {
      if (i === clueIdx) continue;
      const other = clues[i];
      if (other.r >= rect.r && other.r < rect.r + rect.h &&
          other.c >= rect.c && other.c < rect.c + rect.w) {
        return true;
      }
    }
    return false;
  }

  // Filter out rectangles that contain other clues
  for (let i = 0; i < cluePossibilities.length; i++) {
    cluePossibilities[i].rects = cluePossibilities[i].rects.filter(
      rect => !rectContainsOtherClue(rect, i)
    );
  }

  // Sort by fewest possibilities first (most constrained)
  cluePossibilities.sort((a, b) => a.rects.length - b.rects.length);

  // Backtracking solver
  function solve(idx, assignedRects) {
    if (Date.now() - startTime > timeout) return;
    if (solutions >= maxSolutions) return;

    if (idx === cluePossibilities.length) {
      // All clues assigned - check if remaining cells can be black without 2x2
      const grid = createGrid(rows, cols, 'black');

      for (const rect of assignedRects) {
        for (let dr = 0; dr < rect.h; dr++) {
          for (let dc = 0; dc < rect.w; dc++) {
            grid[rect.r + dr][rect.c + dc] = 'white';
          }
        }
      }

      if (!has2x2BlackSquare(grid, rows, cols)) {
        solutions++;
      }
      return;
    }

    const { rects } = cluePossibilities[idx];

    for (const rect of rects) {
      // Check if this rectangle conflicts with any already assigned
      let conflicts = false;
      for (const assigned of assignedRects) {
        if (rectsConflict(rect, assigned)) {
          conflicts = true;
          break;
        }
      }

      if (!conflicts) {
        assignedRects.push(rect);
        solve(idx + 1, assignedRects);
        assignedRects.pop();

        if (solutions >= maxSolutions) return;
      }
    }
  }

  solve(0, []);

  return solutions;
}

/**
 * Generate a Mochikoro puzzle
 */
function generatePuzzle(rows, cols, difficulty, seed) {
  const rng = createSeededRandom(seed);

  // Try to generate a valid solution
  const result = generateSolution(rows, cols, rng);
  if (!result) return null;

  const { grid, rectangles } = result;

  // Create clues
  const clueGrid = createClues(rectangles, rows, cols, rng);

  // Verify uniqueness
  const solutionCount = solveMochikoro(rows, cols, clueGrid, 2, 3000);

  if (solutionCount !== 1) {
    return null;
  }

  return {
    rows,
    cols,
    difficulty,
    seed,
    clues: clueGrid,
    solution: grid,
    rectangleCount: rectangles.length
  };
}

// ============================================================================
// Incremental Save System
// ============================================================================

const OUTPUT_PATH = path.join(__dirname, '..', 'public', 'datasets', 'mochikoroPuzzles.json');
const PROGRESS_PATH = path.join(__dirname, '.mochikoro-progress.json');

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
    name: 'Mochikoro Puzzles',
    description: 'Divide the grid into rectangles. Each contains one number showing its area.',
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
  const TARGET_COUNT = parseInt(process.argv[2]) || 50;
  const START_SEED = parseInt(process.argv[3]) || 1;
  const BASE_MAX_SEED = parseInt(process.argv[4]) || 100000;

  console.log('='.repeat(60));
  console.log('Mochikoro Puzzle Generator (with incremental save)');
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

  // Only 5x5 and 7x7 - 10x10 is too hard to generate reliably
  const configs = [
    { rows: 5, cols: 5, difficulty: 'easy', maxSeed: BASE_MAX_SEED },
    { rows: 5, cols: 5, difficulty: 'medium', maxSeed: BASE_MAX_SEED },
    { rows: 5, cols: 5, difficulty: 'hard', maxSeed: BASE_MAX_SEED },
    { rows: 7, cols: 7, difficulty: 'easy', maxSeed: BASE_MAX_SEED },
    { rows: 7, cols: 7, difficulty: 'medium', maxSeed: BASE_MAX_SEED },
    { rows: 7, cols: 7, difficulty: 'hard', maxSeed: BASE_MAX_SEED },
  ];

  for (const { rows, cols, difficulty, maxSeed } of configs) {
    if (shuttingDown) break;

    const configKey = `${rows}x${cols}-${difficulty}`;

    // Count existing puzzles for this config
    const existing = puzzles.filter(
      p => p.rows === rows && p.cols === cols && p.difficulty === difficulty
    ).length;

    if (existing >= TARGET_COUNT) {
      console.log(`${configKey}: Already have ${existing} puzzles ✓`);
      continue;
    }

    // Get resume point
    let seed = progress[configKey]?.lastSeed ?? START_SEED;
    let generated = existing;

    console.log(`${configKey}: Have ${existing}, need ${TARGET_COUNT - existing} more...`);
    const startTime = Date.now();
    let tested = 0;

    while (generated < TARGET_COUNT && seed < maxSeed) {
      if (shuttingDown) break;

      const puzzle = generatePuzzle(rows, cols, difficulty, seed);

      if (puzzle) {
        puzzles.push({
          id: `mochikoro-${difficulty}-${rows}x${cols}-${String(generated + 1).padStart(3, '0')}`,
          ...puzzle
        });
        generated++;

        // Progress display
        const elapsed = (Date.now() - startTime) / 1000;
        const rate = Math.round((generated - existing) / elapsed * 3600);
        process.stdout.write(`\r  Found ${generated}/${TARGET_COUNT} (seed ${seed}, ${elapsed.toFixed(1)}s, ~${rate}/hr)    `);

        // Incremental save every 5 puzzles
        if (generated % 5 === 0) {
          saveDataset(puzzles);
          progress[configKey] = { lastSeed: seed, count: generated };
          saveProgress(progress);
        }
      }

      seed++;
      tested++;

      // Yield to event loop periodically
      if (tested % 100 === 0) {
        await new Promise(resolve => setImmediate(resolve));
      }
    }

    // Save after completing this config
    saveDataset(puzzles);
    progress[configKey] = { lastSeed: seed, count: generated, complete: generated >= TARGET_COUNT || seed >= maxSeed };
    saveProgress(progress);

    const elapsed = (Date.now() - startTime) / 1000;
    console.log(`\n  Done: ${generated - existing} puzzles in ${elapsed.toFixed(1)}s`);
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
