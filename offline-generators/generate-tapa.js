#!/usr/bin/env node
/**
 * Tapa Puzzle Generator
 *
 * Generates uniquely solvable Tapa puzzles and outputs a JSON dataset.
 *
 * Tapa Rules:
 * 1. Shade cells to form one connected wall
 * 2. No 2×2 area can be entirely shaded
 * 3. Clue cells show lengths of consecutive shaded groups in the 8 surrounding cells
 * 4. Multiple numbers = multiple separate groups (with gaps between)
 * 5. Clue cells cannot be shaded
 *
 * Run with: node offline-generators/generate-tapa.js [count] [startSeed]
 *
 * Output: public/datasets/tapaPuzzles.json
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

function createGrid(size, fill) {
  return Array(size).fill(null).map(() => Array(size).fill(fill));
}

function cloneGrid(grid) {
  return grid.map(row => [...row]);
}

// Get 8 neighbors in clockwise order starting from top
const NEIGHBOR_OFFSETS = [
  [-1, 0],  // top
  [-1, 1],  // top-right
  [0, 1],   // right
  [1, 1],   // bottom-right
  [1, 0],   // bottom
  [1, -1],  // bottom-left
  [0, -1],  // left
  [-1, -1], // top-left
];

function getNeighborValues(grid, row, col) {
  const size = grid.length;
  return NEIGHBOR_OFFSETS.map(([dr, dc]) => {
    const r = row + dr;
    const c = col + dc;
    if (r < 0 || r >= size || c < 0 || c >= size) return false;
    return grid[r][c];
  });
}

// ============================================================================
// Tapa Clue Calculation
// ============================================================================

/**
 * Calculate the Tapa clue for a cell based on surrounding shaded cells.
 * Returns an array of consecutive run lengths in clockwise order.
 * E.g., [3, 2] means two groups of 3 and 2 shaded cells with gaps between.
 */
function calculateClue(grid, row, col) {
  const neighbors = getNeighborValues(grid, row, col);

  // Find runs of shaded (true) cells, handling wraparound
  const runs = [];
  let currentRun = 0;
  let firstRun = 0;
  let inFirstRun = true;

  for (let i = 0; i < 8; i++) {
    if (neighbors[i]) {
      currentRun++;
    } else {
      if (currentRun > 0) {
        if (inFirstRun) {
          firstRun = currentRun;
          inFirstRun = false;
        } else {
          runs.push(currentRun);
        }
        currentRun = 0;
      }
      inFirstRun = false;
    }
  }

  // Handle wraparound: if we ended in a run and started in a run, they connect
  if (currentRun > 0) {
    if (runs.length === 0 && firstRun > 0) {
      // Entire ring is one connected run
      runs.push(currentRun + firstRun);
    } else if (firstRun > 0) {
      // Connect last run to first run
      runs.unshift(currentRun + firstRun);
    } else {
      runs.push(currentRun);
    }
  } else if (firstRun > 0) {
    runs.unshift(firstRun);
  }

  // Sort for canonical form
  return runs.sort((a, b) => b - a);
}

// ============================================================================
// Shaded Region Generation
// ============================================================================

/**
 * Check if shaded region is connected using BFS
 */
function isShadedConnected(grid) {
  const size = grid.length;
  let firstShaded = null;
  let totalShaded = 0;

  // Find first shaded cell and count total
  for (let r = 0; r < size && !firstShaded; r++) {
    for (let c = 0; c < size && !firstShaded; c++) {
      if (grid[r][c]) {
        firstShaded = [r, c];
      }
      if (grid[r][c]) totalShaded++;
    }
  }

  if (!firstShaded) return true; // No shaded cells = trivially connected
  if (totalShaded === 0) return true;

  // Recount total
  totalShaded = 0;
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (grid[r][c]) totalShaded++;
    }
  }

  // BFS from first shaded cell
  const visited = createGrid(size, false);
  const queue = [firstShaded];
  visited[firstShaded[0]][firstShaded[1]] = true;
  let count = 1;

  while (queue.length > 0) {
    const [r, c] = queue.shift();

    for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
      const nr = r + dr;
      const nc = c + dc;
      if (nr >= 0 && nr < size && nc >= 0 && nc < size &&
          grid[nr][nc] && !visited[nr][nc]) {
        visited[nr][nc] = true;
        queue.push([nr, nc]);
        count++;
      }
    }
  }

  return count === totalShaded;
}

/**
 * Check for any 2×2 shaded block
 */
function has2x2Block(grid) {
  const size = grid.length;
  for (let r = 0; r < size - 1; r++) {
    for (let c = 0; c < size - 1; c++) {
      if (grid[r][c] && grid[r+1][c] && grid[r][c+1] && grid[r+1][c+1]) {
        return true;
      }
    }
  }
  return false;
}

/**
 * Generate a valid shaded pattern for Tapa
 */
function generateShadedPattern(size, rng, targetDensity = 0.5) {
  const targetCount = Math.floor(size * size * targetDensity);
  const maxAttempts = 100;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const grid = createGrid(size, false);

    // Start with a random cell
    const startR = Math.floor(rng() * size);
    const startC = Math.floor(rng() * size);
    grid[startR][startC] = true;

    // Grow the region
    let shaded = 1;
    let failures = 0;

    while (shaded < targetCount && failures < size * size * 2) {
      // Find all cells adjacent to current shaded region
      const candidates = [];
      for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
          if (grid[r][c]) continue;

          // Check if adjacent to a shaded cell
          let adjacent = false;
          for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
            const nr = r + dr;
            const nc = c + dc;
            if (nr >= 0 && nr < size && nc >= 0 && nc < size && grid[nr][nc]) {
              adjacent = true;
              break;
            }
          }

          if (adjacent) {
            // Test if adding this cell would create a 2×2 block
            grid[r][c] = true;
            const creates2x2 = has2x2Block(grid);
            grid[r][c] = false;

            if (!creates2x2) {
              candidates.push([r, c]);
            }
          }
        }
      }

      if (candidates.length === 0) {
        failures++;
        continue;
      }

      // Pick a random candidate
      const [r, c] = candidates[Math.floor(rng() * candidates.length)];
      grid[r][c] = true;
      shaded++;
    }

    // Verify the pattern is valid
    if (shaded >= targetCount * 0.8 && isShadedConnected(grid) && !has2x2Block(grid)) {
      return grid;
    }
  }

  return null;
}

// ============================================================================
// Tapa Solver
// ============================================================================

/**
 * Check if a clue is satisfied by the current grid state
 * Returns: 'satisfied' | 'violated' | 'possible'
 */
function checkClue(grid, row, col, expectedClue) {
  const neighbors = getNeighborValues(grid, row, col);

  // Count known shaded, known unshaded, and unknown
  let knownShaded = 0;
  let knownUnshaded = 0;
  let unknown = 0;

  for (const val of neighbors) {
    if (val === true) knownShaded++;
    else if (val === false) knownUnshaded++;
    else unknown++;
  }

  // If all neighbors are known, check exact match
  if (unknown === 0) {
    const actualClue = calculateClue(grid, row, col);
    const match = actualClue.length === expectedClue.length &&
                  actualClue.every((v, i) => v === expectedClue[i]);
    return match ? 'satisfied' : 'violated';
  }

  // Calculate min and max possible shaded count
  const minPossibleShaded = knownShaded;
  const maxPossibleShaded = knownShaded + unknown;
  const expectedTotal = expectedClue.reduce((a, b) => a + b, 0);

  // Quick bounds check
  if (expectedTotal < minPossibleShaded || expectedTotal > maxPossibleShaded) {
    return 'violated';
  }

  return 'possible';
}

/**
 * Solve Tapa puzzle using backtracking with constraint propagation
 * Returns array of solutions (stops at maxSolutions)
 */
function solveTapa(size, clues, maxSolutions = 2) {
  const solutions = [];
  const grid = createGrid(size, null); // null = unknown, true = shaded, false = unshaded

  // Mark clue cells as unshaded
  for (const clue of clues) {
    grid[clue.row][clue.col] = false;
  }

  // Get all cells to fill (excluding clue cells)
  const cellsToFill = [];
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (grid[r][c] === null) {
        cellsToFill.push([r, c]);
      }
    }
  }

  function isValidPartial() {
    // Check no 2×2 blocks of shaded cells
    for (let r = 0; r < size - 1; r++) {
      for (let c = 0; c < size - 1; c++) {
        if (grid[r][c] === true && grid[r+1][c] === true &&
            grid[r][c+1] === true && grid[r+1][c+1] === true) {
          return false;
        }
      }
    }

    // Check all clues are not violated
    for (const clue of clues) {
      const status = checkClue(grid, clue.row, clue.col, clue.values);
      if (status === 'violated') return false;
    }

    return true;
  }

  function isComplete() {
    // Check all cells are filled
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (grid[r][c] === null) return false;
      }
    }

    // Check connectivity
    const shadedGrid = grid.map(row => row.map(v => v === true));
    if (!isShadedConnected(shadedGrid)) return false;

    // Check all clues satisfied
    for (const clue of clues) {
      const status = checkClue(grid, clue.row, clue.col, clue.values);
      if (status !== 'satisfied') return false;
    }

    return true;
  }

  function backtrack(idx) {
    if (solutions.length >= maxSolutions) return;

    if (idx === cellsToFill.length) {
      if (isComplete()) {
        solutions.push(cloneGrid(grid));
      }
      return;
    }

    const [r, c] = cellsToFill[idx];

    // Try shaded
    grid[r][c] = true;
    if (isValidPartial()) {
      backtrack(idx + 1);
    }

    // Try unshaded
    grid[r][c] = false;
    if (isValidPartial()) {
      backtrack(idx + 1);
    }

    grid[r][c] = null;
  }

  backtrack(0);
  return solutions;
}

// ============================================================================
// Puzzle Generation
// ============================================================================

/**
 * Generate a Tapa puzzle
 */
function generatePuzzle(size, difficulty, seed) {
  const rng = createSeededRandom(seed);

  // Target density based on difficulty
  const densities = {
    easy: 0.45,
    medium: 0.50,
    hard: 0.55,
  };
  const density = densities[difficulty] || densities.medium;

  // Generate shaded pattern
  const solution = generateShadedPattern(size, rng, density);
  if (!solution) return null;

  // Calculate all possible clues
  const allClues = [];
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (!solution[r][c]) {
        const clueValues = calculateClue(solution, r, c);
        if (clueValues.length > 0) {
          allClues.push({ row: r, col: c, values: clueValues });
        }
      }
    }
  }

  // Shuffle clues
  const shuffledClues = seededShuffle(allClues, rng);

  // Start with all clues, try removing while maintaining uniqueness
  let currentClues = [...shuffledClues];

  // Target clue counts based on difficulty
  const minClues = {
    easy: Math.floor(size * size * 0.25),
    medium: Math.floor(size * size * 0.18),
    hard: Math.floor(size * size * 0.12),
  };
  const targetMin = minClues[difficulty] || minClues.medium;

  // Try removing clues one by one
  for (let i = currentClues.length - 1; i >= 0 && currentClues.length > targetMin; i--) {
    const testClues = currentClues.filter((_, idx) => idx !== i);

    // Quick uniqueness check
    const solutions = solveTapa(size, testClues, 2);

    if (solutions.length === 1) {
      // Still unique, remove this clue
      currentClues = testClues;
    }
  }

  // Final uniqueness verification
  const finalSolutions = solveTapa(size, currentClues, 2);
  if (finalSolutions.length !== 1) {
    return null;
  }

  // Use the solver's solution (guaranteed to be valid and unique)
  const verifiedSolution = finalSolutions[0];

  // Final validation: ensure solution satisfies Tapa constraints
  if (has2x2Block(verifiedSolution)) {
    return null;
  }
  if (!isShadedConnected(verifiedSolution)) {
    return null;
  }

  // Convert clues to 2D grid format (matching existing dataset format)
  const clueGrid = Array(size).fill(null).map(() => Array(size).fill(null));
  for (const clue of currentClues) {
    clueGrid[clue.row][clue.col] = clue.values;
  }

  return {
    rows: size,
    cols: size,
    difficulty,
    seed,
    clues: clueGrid,
    solution: verifiedSolution, // Use solver's verified solution
  };
}

// ============================================================================
// Incremental Save System
// ============================================================================

const OUTPUT_PATH = path.join(__dirname, '..', 'public', 'datasets', 'tapaPuzzles.json');
const PROGRESS_PATH = path.join(__dirname, '.tapa-progress.json');

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
    name: 'Tapa Puzzles',
    description: 'Uniquely solvable Tapa puzzles - shade cells based on numbered clues',
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
  const MAX_SEED = parseInt(process.argv[4]) || 100000;

  console.log('='.repeat(60));
  console.log('Tapa Puzzle Generator (with incremental save)');
  console.log('='.repeat(60));
  console.log(`Target: ${TARGET_COUNT} puzzles per size/difficulty`);
  console.log(`Seed range: ${START_SEED} to ${MAX_SEED}`);
  console.log('');

  // Load existing puzzles and progress
  const puzzles = loadExistingData();
  const progress = loadProgress();

  console.log(`Loaded ${puzzles.length} existing puzzles`);
  if (Object.keys(progress).length > 0) {
    console.log('Resuming from previous progress...');
  }
  console.log('');

  const configs = [
    { size: 7, difficulty: 'easy' },
    { size: 7, difficulty: 'medium' },
    { size: 7, difficulty: 'hard' },
    { size: 10, difficulty: 'easy' },
    { size: 10, difficulty: 'medium' },
    { size: 10, difficulty: 'hard' },
    { size: 12, difficulty: 'easy' },
    { size: 12, difficulty: 'medium' },
    { size: 12, difficulty: 'hard' },
  ];

  // Handle graceful shutdown
  let shuttingDown = false;
  process.on('SIGINT', () => {
    if (shuttingDown) process.exit(1);
    shuttingDown = true;
    console.log('\n\nGraceful shutdown requested, saving progress...');
    saveDataset(puzzles);
    saveProgress(progress);
    console.log(`Saved ${puzzles.length} puzzles. Run again to resume.`);
    process.exit(0);
  });

  for (const { size, difficulty } of configs) {
    const configKey = `${size}x${size}-${difficulty}`;

    // Count existing puzzles for this config
    const existingCount = puzzles.filter(p => p.rows === size && p.difficulty === difficulty).length;

    if (existingCount >= TARGET_COUNT) {
      console.log(`${configKey}: Already have ${existingCount}/${TARGET_COUNT}, skipping`);
      continue;
    }

    console.log(`\n${configKey}: Have ${existingCount}, need ${TARGET_COUNT - existingCount} more...`);

    // Resume from last seed or start fresh
    let seed = progress[configKey]?.lastSeed || START_SEED;
    let generated = existingCount;
    let tested = 0;
    const startTime = Date.now();

    while (generated < TARGET_COUNT && seed < MAX_SEED) {
      if (shuttingDown) break;

      const puzzle = generatePuzzle(size, difficulty, seed);

      if (puzzle) {
        puzzles.push({
          id: `tapa-${difficulty}-${size}x${size}-${String(generated + 1).padStart(3, '0')}`,
          ...puzzle
        });
        generated++;

        // Save incrementally every 5 puzzles
        if (generated % 5 === 0) {
          saveDataset(puzzles);
          progress[configKey] = { lastSeed: seed, count: generated };
          saveProgress(progress);
        }

        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
        const rate = generated > existingCount
          ? ((generated - existingCount) / (Date.now() - startTime) * 3600000).toFixed(0)
          : '?';
        process.stdout.write(`\r  Found ${generated}/${TARGET_COUNT} (seed ${seed}, ${elapsed}s, ~${rate}/hr)  `);
      }

      seed++;
      tested++;

      // Yield to event loop occasionally
      if (tested % 10 === 0) {
        await new Promise(resolve => setImmediate(resolve));
      }
    }

    // Save after completing each config
    saveDataset(puzzles);
    progress[configKey] = { lastSeed: seed, count: generated, complete: generated >= TARGET_COUNT };
    saveProgress(progress);

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`\n  Done: ${generated} puzzles in ${elapsed}s`);
  }

  console.log('\n' + '='.repeat(60));
  console.log(`Total puzzles: ${puzzles.length}`);
  console.log(`Saved to ${OUTPUT_PATH}`);

  // Clean up progress file if complete
  const allComplete = configs.every(({ size, difficulty }) => {
    const count = puzzles.filter(p => p.rows === size && p.difficulty === difficulty).length;
    return count >= TARGET_COUNT;
  });

  if (allComplete && fs.existsSync(PROGRESS_PATH)) {
    fs.unlinkSync(PROGRESS_PATH);
    console.log('All targets reached! Cleaned up progress file.');
  }

  console.log('='.repeat(60));
}

main().catch(console.error);
