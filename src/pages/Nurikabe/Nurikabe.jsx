import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import styles from './Nurikabe.module.css';

const GRID_SIZES = {
  '5×5': 5,
  '7×7': 7,
  '9×9': 9,
};

// Check if sea cells are connected (excluding the given cell if provided)
function isSeaConnected(grid, size, excludeR = -1, excludeC = -1) {
  let firstSea = null;
  for (let r = 0; r < size && !firstSea; r++) {
    for (let c = 0; c < size && !firstSea; c++) {
      if (grid[r][c] === 'sea' && !(r === excludeR && c === excludeC)) {
        firstSea = [r, c];
      }
    }
  }

  if (!firstSea) return true; // No sea cells is technically connected

  const visited = Array(size).fill(null).map(() => Array(size).fill(false));
  const queue = [firstSea];
  let seaCount = 0;

  while (queue.length > 0) {
    const [r, c] = queue.shift();
    if (visited[r][c] || grid[r][c] !== 'sea' || (r === excludeR && c === excludeC)) continue;
    visited[r][c] = true;
    seaCount++;

    for (const [nr, nc] of [[r-1,c], [r+1,c], [r,c-1], [r,c+1]]) {
      if (nr >= 0 && nr < size && nc >= 0 && nc < size &&
          !visited[nr][nc] && grid[nr][nc] === 'sea' && !(nr === excludeR && nc === excludeC)) {
        queue.push([nr, nc]);
      }
    }
  }

  // Count total sea cells (excluding the excluded cell)
  let totalSea = 0;
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (grid[r][c] === 'sea' && !(r === excludeR && c === excludeC)) totalSea++;
    }
  }

  return seaCount === totalSea;
}

// Check for 2x2 sea squares
function has2x2SeaSquare(grid, size) {
  for (let r = 0; r < size - 1; r++) {
    for (let c = 0; c < size - 1; c++) {
      if (grid[r][c] === 'sea' && grid[r+1][c] === 'sea' &&
          grid[r][c+1] === 'sea' && grid[r+1][c+1] === 'sea') {
        return true;
      }
    }
  }
  return false;
}

// Check if a cell is part of any 2x2 sea square
function isPartOf2x2Sea(grid, size, r, c) {
  if (grid[r][c] !== 'sea') return false;

  // Check all four possible 2x2 squares this cell could be part of
  const offsets = [
    [[0,0], [0,1], [1,0], [1,1]],   // top-left corner
    [[0,-1], [0,0], [1,-1], [1,0]], // top-right corner
    [[-1,0], [-1,1], [0,0], [0,1]], // bottom-left corner
    [[-1,-1], [-1,0], [0,-1], [0,0]] // bottom-right corner
  ];

  for (const square of offsets) {
    let allSea = true;
    for (const [dr, dc] of square) {
      const nr = r + dr;
      const nc = c + dc;
      if (nr < 0 || nr >= size || nc < 0 || nc >= size || grid[nr][nc] !== 'sea') {
        allSea = false;
        break;
      }
    }
    if (allSea) return true;
  }
  return false;
}

// Find cells that MUST be islands to avoid 2x2 sea squares
function findRequired2x2Breaks(grid, size) {
  const required = [];
  for (let r = 0; r < size - 1; r++) {
    for (let c = 0; c < size - 1; c++) {
      // Check if this is a 2x2 sea square
      const cells = [[r,c], [r+1,c], [r,c+1], [r+1,c+1]];
      if (cells.every(([cr, cc]) => grid[cr][cc] === 'sea')) {
        // Need to break this square - find the best cell
        required.push([r, c, cells]);
      }
    }
  }
  return required;
}

// Solver to check for unique solutions
function solvePuzzle(puzzleGrid, maxSolutions = 2) {
  const size = puzzleGrid.length;
  const solutions = [];

  // Initialize state: null = unknown, true = sea, false = island
  const state = Array(size).fill(null).map(() => Array(size).fill(null));

  // Mark cells with numbers as islands
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (puzzleGrid[r][c] !== null) {
        state[r][c] = false; // island
      }
    }
  }

  function isValidPartial(state) {
    // Check no 2x2 sea squares
    for (let r = 0; r < size - 1; r++) {
      for (let c = 0; c < size - 1; c++) {
        if (state[r][c] === true && state[r+1][c] === true &&
            state[r][c+1] === true && state[r+1][c+1] === true) {
          return false;
        }
      }
    }

    // Check sea connectivity (only for determined sea cells)
    const seaCells = [];
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (state[r][c] === true) seaCells.push([r, c]);
      }
    }

    if (seaCells.length > 1) {
      const visited = new Set();
      const queue = [seaCells[0]];
      visited.add(`${seaCells[0][0]},${seaCells[0][1]}`);

      while (queue.length > 0) {
        const [r, c] = queue.shift();
        for (const [nr, nc] of [[r-1,c], [r+1,c], [r,c-1], [r,c+1]]) {
          if (nr >= 0 && nr < size && nc >= 0 && nc < size) {
            const key = `${nr},${nc}`;
            if (!visited.has(key) && state[nr][nc] !== false) {
              // Can traverse through unknown or sea
              if (state[nr][nc] === true) {
                visited.add(key);
                queue.push([nr, nc]);
              }
            }
          }
        }
      }

      // Check if all sea cells are reachable
      for (const [r, c] of seaCells) {
        if (!visited.has(`${r},${c}`)) {
          // Check if there's a possible path through unknowns
          const canReach = canConnectThroughUnknowns(state, size, seaCells[0], [r, c]);
          if (!canReach) return false;
        }
      }
    }

    // Check island constraints
    const visitedIsland = Array(size).fill(null).map(() => Array(size).fill(false));

    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (visitedIsland[r][c] || state[r][c] === true) continue;
        if (state[r][c] === null) continue; // Skip unknowns

        // BFS to find island
        const queue = [[r, c]];
        const islandCells = [];
        const numbers = [];
        let hasUnknownNeighbor = false;

        while (queue.length > 0) {
          const [cr, cc] = queue.shift();
          if (visitedIsland[cr][cc]) continue;
          if (state[cr][cc] === true) continue;

          if (state[cr][cc] === null) {
            hasUnknownNeighbor = true;
            continue;
          }

          visitedIsland[cr][cc] = true;
          islandCells.push([cr, cc]);

          if (puzzleGrid[cr][cc] !== null) {
            numbers.push(puzzleGrid[cr][cc]);
          }

          for (const [nr, nc] of [[cr-1,cc], [cr+1,cc], [cr,cc-1], [cr,cc+1]]) {
            if (nr >= 0 && nr < size && nc >= 0 && nc < size &&
                !visitedIsland[nr][nc] && state[nr][nc] !== true) {
              queue.push([nr, nc]);
            }
          }
        }

        // More than one number in island = invalid
        if (numbers.length > 1) return false;

        // Island too big
        if (numbers.length === 1 && islandCells.length > numbers[0]) return false;

        // Island complete (no unknown neighbors) but wrong size or no number
        if (!hasUnknownNeighbor) {
          if (numbers.length !== 1) return false;
          if (islandCells.length !== numbers[0]) return false;
        }
      }
    }

    return true;
  }

  function canConnectThroughUnknowns(state, size, start, end) {
    // BFS allowing traversal through unknowns and sea
    const visited = new Set();
    const queue = [start];
    visited.add(`${start[0]},${start[1]}`);

    while (queue.length > 0) {
      const [r, c] = queue.shift();
      if (r === end[0] && c === end[1]) return true;

      for (const [nr, nc] of [[r-1,c], [r+1,c], [r,c-1], [r,c+1]]) {
        if (nr >= 0 && nr < size && nc >= 0 && nc < size) {
          const key = `${nr},${nc}`;
          if (!visited.has(key) && state[nr][nc] !== false) {
            visited.add(key);
            queue.push([nr, nc]);
          }
        }
      }
    }
    return false;
  }

  function isComplete(state) {
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (state[r][c] === null) return false;
      }
    }
    return true;
  }

  function solve(state, depth = 0) {
    if (solutions.length >= maxSolutions) return;

    if (!isValidPartial(state)) return;

    if (isComplete(state)) {
      // Final validation
      const shaded = state.map(row => row.map(c => c === true));
      if (verifySolution(puzzleGrid, shaded)) {
        solutions.push(state.map(row => [...row]));
      }
      return;
    }

    // Find first unknown cell
    let targetR = -1, targetC = -1;
    outer: for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (state[r][c] === null) {
          targetR = r;
          targetC = c;
          break outer;
        }
      }
    }

    if (targetR === -1) return;

    // Try sea first (true)
    state[targetR][targetC] = true;
    solve(state, depth + 1);

    if (solutions.length >= maxSolutions) {
      state[targetR][targetC] = null;
      return;
    }

    // Try island (false)
    state[targetR][targetC] = false;
    solve(state, depth + 1);

    // Restore
    state[targetR][targetC] = null;
  }

  solve(state);
  return solutions;
}

function hasUniqueSolution(puzzleGrid) {
  const solutions = solvePuzzle(puzzleGrid, 2);
  return solutions.length === 1;
}

function generatePuzzle(size) {
  const maxAttempts = 100;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const result = tryGeneratePuzzle(size);
    if (result && hasUniqueSolution(result.grid)) {
      return result;
    }
  }

  // Fallback: generate a simple valid puzzle with uniqueness check
  for (let attempt = 0; attempt < 50; attempt++) {
    const result = generateSimplePuzzle(size);
    if (result && hasUniqueSolution(result.grid)) {
      return result;
    }
  }

  // Last resort fallback
  return generateSimplePuzzle(size);
}

function tryGeneratePuzzle(size) {
  // Start with all sea
  const grid = Array(size).fill(null).map(() => Array(size).fill('sea'));
  const islands = [];

  // First, place islands to break ALL potential 2x2 sea squares
  // We need at least one island cell in every 2x2 region
  // Use a pattern that guarantees this: place islands at positions where (r + c) % 3 == 0
  // but with some spacing to allow for island growth

  const seedPositions = [];
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      // Place seeds in a pattern that breaks 2x2 squares
      // Every 2x2 square must have at least one island
      if ((r % 3 === 0 && c % 3 === 0) ||
          (r % 3 === 1 && c % 3 === 2) ||
          (r % 3 === 2 && c % 3 === 1)) {
        seedPositions.push([r, c]);
      }
    }
  }

  // Shuffle seed positions
  for (let i = seedPositions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [seedPositions[i], seedPositions[j]] = [seedPositions[j], seedPositions[i]];
  }

  // Place island seeds, checking constraints
  for (const [r, c] of seedPositions) {
    if (grid[r][c] !== 'sea') continue;

    // Check minimum distance from other island seeds
    let tooClose = false;
    for (const island of islands) {
      for (const [ir, ic] of island.cells) {
        const dist = Math.abs(ir - r) + Math.abs(ic - c);
        if (dist < 2) {
          tooClose = true;
          break;
        }
      }
      if (tooClose) break;
    }
    if (tooClose) continue;

    // Place the island seed
    grid[r][c] = 'island';

    // Check sea connectivity
    if (!isSeaConnected(grid, size)) {
      grid[r][c] = 'sea';
      continue;
    }

    const islandCells = [[r, c]];

    // Try to grow island (size 1-3)
    const targetSize = 1 + Math.floor(Math.random() * Math.min(3, Math.floor(size / 2)));

    for (let g = 1; g < targetSize; g++) {
      const frontier = [];
      for (const [ir, ic] of islandCells) {
        for (const [nr, nc] of [[ir-1,ic], [ir+1,ic], [ir,ic-1], [ir,ic+1]]) {
          if (nr >= 0 && nr < size && nc >= 0 && nc < size &&
              grid[nr][nc] === 'sea' &&
              !islandCells.some(([cr, cc]) => cr === nr && cc === nc)) {
            // Check doesn't touch another island
            let touchesOther = false;
            for (const [dr, dc] of [[nr-1,nc], [nr+1,nc], [nr,nc-1], [nr,nc+1]]) {
              if (dr >= 0 && dr < size && dc >= 0 && dc < size &&
                  grid[dr][dc] === 'island' &&
                  !islandCells.some(([cr, cc]) => cr === dr && cc === dc)) {
                touchesOther = true;
                break;
              }
            }
            if (!touchesOther) {
              frontier.push([nr, nc]);
            }
          }
        }
      }

      if (frontier.length === 0) break;

      // Shuffle and try each
      for (let i = frontier.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [frontier[i], frontier[j]] = [frontier[j], frontier[i]];
      }

      let expanded = false;
      for (const [nr, nc] of frontier) {
        grid[nr][nc] = 'island';
        if (isSeaConnected(grid, size) && !has2x2SeaSquare(grid, size)) {
          islandCells.push([nr, nc]);
          expanded = true;
          break;
        }
        grid[nr][nc] = 'sea';
      }

      if (!expanded) break;
    }

    islands.push({ r, c, size: islandCells.length, cells: islandCells });
  }

  // Now check if we still have 2x2 sea squares and try to fix them
  let attempts = 0;
  while (has2x2SeaSquare(grid, size) && attempts < 100) {
    attempts++;
    const squares = findRequired2x2Breaks(grid, size);
    if (squares.length === 0) break;

    // Try to extend an existing island into one of the problem squares
    const [, , cells] = squares[0];
    let fixed = false;

    for (const [cr, cc] of cells) {
      // Check if this cell is adjacent to an existing island
      for (const [nr, nc] of [[cr-1,cc], [cr+1,cc], [cr,cc-1], [cr,cc+1]]) {
        if (nr >= 0 && nr < size && nc >= 0 && nc < size && grid[nr][nc] === 'island') {
          // Find which island this belongs to
          for (const island of islands) {
            if (island.cells.some(([ir, ic]) => ir === nr && ic === nc)) {
              // Try to extend this island
              grid[cr][cc] = 'island';
              if (isSeaConnected(grid, size)) {
                island.cells.push([cr, cc]);
                island.size++;
                fixed = true;
                break;
              }
              grid[cr][cc] = 'sea';
            }
          }
          if (fixed) break;
        }
      }
      if (fixed) break;

      // Or create a new single-cell island
      grid[cr][cc] = 'island';
      if (isSeaConnected(grid, size)) {
        islands.push({ r: cr, c: cc, size: 1, cells: [[cr, cc]] });
        fixed = true;
        break;
      }
      grid[cr][cc] = 'sea';
    }

    if (!fixed) return null; // Can't fix this puzzle
  }

  // Final validation
  if (has2x2SeaSquare(grid, size)) return null;
  if (!isSeaConnected(grid, size)) return null;
  if (islands.length < 2) return null;

  // Check islands don't touch
  for (const island of islands) {
    for (const [ir, ic] of island.cells) {
      for (const [nr, nc] of [[ir-1,ic], [ir+1,ic], [ir,ic-1], [ir,ic+1]]) {
        if (nr >= 0 && nr < size && nc >= 0 && nc < size &&
            grid[nr][nc] === 'island' &&
            !island.cells.some(([cr, cc]) => cr === nr && cc === nc)) {
          return null;
        }
      }
    }
  }

  // Create puzzle grid
  const puzzleGrid = Array(size).fill(null).map(() => Array(size).fill(null));
  for (const island of islands) {
    puzzleGrid[island.r][island.c] = island.size;
  }

  // Verify solution
  const solutionShaded = Array(size).fill(null).map((_, r) =>
    Array(size).fill(null).map((_, c) => grid[r][c] === 'sea')
  );

  if (!verifySolution(puzzleGrid, solutionShaded)) {
    return null;
  }

  return { grid: puzzleGrid, solution: grid, islands };
}

// Verify a solution is valid (used by generator)
function verifySolution(grid, shaded) {
  const size = grid.length;

  // Check for 2x2 sea squares
  for (let r = 0; r < size - 1; r++) {
    for (let c = 0; c < size - 1; c++) {
      if (shaded[r][c] && shaded[r+1][c] && shaded[r][c+1] && shaded[r+1][c+1]) {
        return false;
      }
    }
  }

  // Check all sea cells are connected
  let firstSea = null;
  for (let r = 0; r < size && !firstSea; r++) {
    for (let c = 0; c < size && !firstSea; c++) {
      if (shaded[r][c]) firstSea = [r, c];
    }
  }

  if (firstSea) {
    const visited = Array(size).fill(null).map(() => Array(size).fill(false));
    const queue = [firstSea];
    let seaCount = 0;

    while (queue.length > 0) {
      const [r, c] = queue.shift();
      if (visited[r][c] || !shaded[r][c]) continue;
      visited[r][c] = true;
      seaCount++;

      for (const [nr, nc] of [[r-1,c], [r+1,c], [r,c-1], [r,c+1]]) {
        if (nr >= 0 && nr < size && nc >= 0 && nc < size &&
            !visited[nr][nc] && shaded[nr][nc]) {
          queue.push([nr, nc]);
        }
      }
    }

    let totalSea = 0;
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (shaded[r][c]) totalSea++;
      }
    }

    if (seaCount !== totalSea) return false;
  }

  // Check each island has correct size and exactly one number
  const visited = Array(size).fill(null).map(() => Array(size).fill(false));

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (visited[r][c] || shaded[r][c]) continue;

      const queue = [[r, c]];
      const islandCells = [];
      let numberCount = 0;
      let numberValue = null;

      while (queue.length > 0) {
        const [cr, cc] = queue.shift();
        if (visited[cr][cc] || shaded[cr][cc]) continue;
        visited[cr][cc] = true;
        islandCells.push([cr, cc]);

        if (grid[cr][cc] !== null) {
          numberCount++;
          numberValue = grid[cr][cc];
        }

        for (const [nr, nc] of [[cr-1,cc], [cr+1,cc], [cr,cc-1], [cr,cc+1]]) {
          if (nr >= 0 && nr < size && nc >= 0 && nc < size &&
              !visited[nr][nc] && !shaded[nr][nc]) {
            queue.push([nr, nc]);
          }
        }
      }

      if (numberCount !== 1) return false;
      if (islandCells.length !== numberValue) return false;
    }
  }

  return true;
}

// Fallback generator that creates a known-valid simple puzzle
function generateSimplePuzzle(size) {
  // Create a guaranteed valid puzzle using a checkerboard-like pattern
  // that ensures no 2x2 sea squares can form
  const grid = Array(size).fill(null).map(() => Array(size).fill('sea'));
  const islands = [];

  // Place islands in a pattern where every 2x2 region has at least one island
  // Pattern: place an island at every position where (r + c) % 3 == 0 AND
  // r % 2 == 0, to ensure spacing
  //
  // For a 5x5:  I . . I .
  //             . . . . .
  //             . . I . .
  //             . . . . .
  //             I . . I .
  //
  // This breaks all 2x2 squares while keeping islands separated

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      // Place island if this position breaks a 2x2 that needs breaking
      // Using a staggered diagonal pattern
      const shouldPlace = (r % 2 === 0 && c % 3 === 0) ||
                          (r % 2 === 1 && c % 3 === 2 && r < size - 1);

      if (shouldPlace) {
        // Verify it doesn't touch an existing island
        let touchesIsland = false;
        for (const [nr, nc] of [[r-1,c], [r+1,c], [r,c-1], [r,c+1]]) {
          if (nr >= 0 && nr < size && nc >= 0 && nc < size && grid[nr][nc] === 'island') {
            touchesIsland = true;
            break;
          }
        }

        if (!touchesIsland) {
          grid[r][c] = 'island';
          islands.push({ r, c, size: 1, cells: [[r, c]] });
        }
      }
    }
  }

  // Check for any remaining 2x2 sea squares and fix them
  for (let r = 0; r < size - 1; r++) {
    for (let c = 0; c < size - 1; c++) {
      const cells = [[r,c], [r+1,c], [r,c+1], [r+1,c+1]];
      if (cells.every(([cr, cc]) => grid[cr][cc] === 'sea')) {
        // Need to place an island here - pick one that doesn't touch others
        for (const [cr, cc] of cells) {
          let touchesIsland = false;
          for (const [nr, nc] of [[cr-1,cc], [cr+1,cc], [cr,cc-1], [cr,cc+1]]) {
            if (nr >= 0 && nr < size && nc >= 0 && nc < size && grid[nr][nc] === 'island') {
              touchesIsland = true;
              break;
            }
          }
          if (!touchesIsland) {
            grid[cr][cc] = 'island';
            islands.push({ r: cr, c: cc, size: 1, cells: [[cr, cc]] });
            break;
          }
        }
      }
    }
  }

  // Create puzzle grid with only numbers
  const puzzleGrid = Array(size).fill(null).map(() => Array(size).fill(null));
  for (const island of islands) {
    puzzleGrid[island.r][island.c] = island.size;
  }

  // Validate the fallback solution
  const solutionShaded = Array(size).fill(null).map((_, r) =>
    Array(size).fill(null).map((_, c) => grid[r][c] === 'sea')
  );

  // Final check - if still invalid, this shouldn't happen but handle it
  if (!verifySolution(puzzleGrid, solutionShaded)) {
    console.warn('Fallback puzzle generation failed validation, using minimal puzzle');
    // Create minimal valid puzzle - checkerboard pattern
    const minGrid = Array(size).fill(null).map(() => Array(size).fill('sea'));
    const minIslands = [];

    // Every other cell in a diagonal ensures no 2x2 sea squares
    for (let r = 0; r < size; r += 2) {
      for (let c = (r % 4 === 0) ? 0 : 2; c < size; c += 4) {
        if (c < size) {
          minGrid[r][c] = 'island';
          minIslands.push({ r, c, size: 1, cells: [[r, c]] });
        }
      }
    }
    for (let r = 1; r < size; r += 2) {
      for (let c = (r % 4 === 1) ? 2 : 0; c < size; c += 4) {
        if (c < size) {
          minGrid[r][c] = 'island';
          minIslands.push({ r, c, size: 1, cells: [[r, c]] });
        }
      }
    }

    const minPuzzle = Array(size).fill(null).map(() => Array(size).fill(null));
    for (const island of minIslands) {
      minPuzzle[island.r][island.c] = island.size;
    }

    return { grid: minPuzzle, solution: minGrid, islands: minIslands };
  }

  return { grid: puzzleGrid, solution: grid, islands };
}

function checkValidity(grid, shaded, numbers) {
  const size = grid.length;
  const errors = new Set();

  // Check for 2x2 sea squares
  for (let r = 0; r < size - 1; r++) {
    for (let c = 0; c < size - 1; c++) {
      if (shaded[r][c] && shaded[r+1][c] && shaded[r][c+1] && shaded[r+1][c+1]) {
        errors.add(`${r},${c}`);
        errors.add(`${r+1},${c}`);
        errors.add(`${r},${c+1}`);
        errors.add(`${r+1},${c+1}`);
      }
    }
  }

  // Check all unshaded regions (islands)
  const visited = Array(size).fill(null).map(() => Array(size).fill(false));

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (visited[r][c] || shaded[r][c]) continue;

      // BFS to find island size
      const queue = [[r, c]];
      const islandCells = [];
      const numbersFound = [];

      while (queue.length > 0) {
        const [cr, cc] = queue.shift();
        if (visited[cr][cc] || shaded[cr][cc]) continue;
        visited[cr][cc] = true;
        islandCells.push([cr, cc]);

        if (grid[cr][cc] !== null) {
          numbersFound.push({ r: cr, c: cc, value: grid[cr][cc] });
        }

        for (const [nr, nc] of [[cr-1,cc], [cr+1,cc], [cr,cc-1], [cr,cc+1]]) {
          if (nr >= 0 && nr < size && nc >= 0 && nc < size &&
              !visited[nr][nc] && !shaded[nr][nc]) {
            queue.push([nr, nc]);
          }
        }
      }

      // Check for errors in this island
      if (numbersFound.length > 1) {
        // Two or more numbers in same island - error
        for (const [ir, ic] of islandCells) {
          errors.add(`${ir},${ic}`);
        }
      } else if (numbersFound.length === 1) {
        // Check if island size exceeds the number
        if (islandCells.length > numbersFound[0].value) {
          for (const [ir, ic] of islandCells) {
            errors.add(`${ir},${ic}`);
          }
        }
      }
      // Note: islands with no numbers or size <= number are not errors (yet)
    }
  }

  return errors;
}

function checkSolved(grid, shaded) {
  const size = grid.length;

  // Check for 2x2 sea squares
  for (let r = 0; r < size - 1; r++) {
    for (let c = 0; c < size - 1; c++) {
      if (shaded[r][c] && shaded[r+1][c] && shaded[r][c+1] && shaded[r+1][c+1]) {
        return false;
      }
    }
  }

  // Check all sea cells are connected
  let firstSea = null;
  for (let r = 0; r < size && !firstSea; r++) {
    for (let c = 0; c < size && !firstSea; c++) {
      if (shaded[r][c]) firstSea = [r, c];
    }
  }

  if (firstSea) {
    const visited = Array(size).fill(null).map(() => Array(size).fill(false));
    const queue = [firstSea];
    let seaCount = 0;

    while (queue.length > 0) {
      const [r, c] = queue.shift();
      if (visited[r][c] || !shaded[r][c]) continue;
      visited[r][c] = true;
      seaCount++;

      for (const [nr, nc] of [[r-1,c], [r+1,c], [r,c-1], [r,c+1]]) {
        if (nr >= 0 && nr < size && nc >= 0 && nc < size &&
            !visited[nr][nc] && shaded[nr][nc]) {
          queue.push([nr, nc]);
        }
      }
    }

    // Count total sea cells
    let totalSea = 0;
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (shaded[r][c]) totalSea++;
      }
    }

    if (seaCount !== totalSea) return false;
  }

  // Check each island has correct size and one number
  const visited = Array(size).fill(null).map(() => Array(size).fill(false));

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (visited[r][c] || shaded[r][c]) continue;

      const queue = [[r, c]];
      const islandCells = [];
      let numberCount = 0;
      let numberValue = null;

      while (queue.length > 0) {
        const [cr, cc] = queue.shift();
        if (visited[cr][cc] || shaded[cr][cc]) continue;
        visited[cr][cc] = true;
        islandCells.push([cr, cc]);

        if (grid[cr][cc] !== null) {
          numberCount++;
          numberValue = grid[cr][cc];
        }

        for (const [nr, nc] of [[cr-1,cc], [cr+1,cc], [cr,cc-1], [cr,cc+1]]) {
          if (nr >= 0 && nr < size && nc >= 0 && nc < size &&
              !visited[nr][nc] && !shaded[nr][nc]) {
            queue.push([nr, nc]);
          }
        }
      }

      if (numberCount !== 1) return false;
      if (islandCells.length !== numberValue) return false;
    }
  }

  return true;
}

export default function Nurikabe() {
  const [sizeKey, setSizeKey] = useState('5×5');
  const [puzzleData, setPuzzleData] = useState(null);
  const [shaded, setShaded] = useState([]);
  const [marked, setMarked] = useState([]);
  const [gameState, setGameState] = useState('playing'); // 'playing', 'won', 'gaveUp'
  const [errors, setErrors] = useState(new Set());
  const [showErrors, setShowErrors] = useState(true);
  const [showSolution, setShowSolution] = useState(false);

  const size = GRID_SIZES[sizeKey];

  const initGame = useCallback(() => {
    const data = generatePuzzle(size);
    setPuzzleData(data);
    setShaded(Array(size).fill(null).map(() => Array(size).fill(false)));
    setMarked(Array(size).fill(null).map(() => Array(size).fill(false)));
    setGameState('playing');
    setErrors(new Set());
    setShowSolution(false);
  }, [size]);

  useEffect(() => {
    initGame();
  }, [initGame]);

  useEffect(() => {
    if (!puzzleData) return;

    const newErrors = showErrors ? checkValidity(puzzleData.grid, shaded, puzzleData.grid) : new Set();
    setErrors(newErrors);

    if (checkSolved(puzzleData.grid, shaded)) {
      setGameState('won');
    }
  }, [shaded, puzzleData, showErrors]);

  const handleCellClick = (r, c, e) => {
    if (gameState !== 'playing' || showSolution) return;
    if (puzzleData.grid[r][c] !== null) return; // Can't shade number cells

    if (e.type === 'contextmenu' || e.ctrlKey) {
      e.preventDefault();
      setMarked(prev => {
        const newMarked = prev.map(row => [...row]);
        newMarked[r][c] = !newMarked[r][c];
        if (newMarked[r][c]) {
          setShaded(p => {
            const n = p.map(row => [...row]);
            n[r][c] = false;
            return n;
          });
        }
        return newMarked;
      });
    } else {
      setShaded(prev => {
        const newShaded = prev.map(row => [...row]);
        newShaded[r][c] = !newShaded[r][c];
        if (newShaded[r][c]) {
          setMarked(m => {
            const n = m.map(row => [...row]);
            n[r][c] = false;
            return n;
          });
        }
        return newShaded;
      });
    }
  };

  const handleReset = () => {
    setShaded(Array(size).fill(null).map(() => Array(size).fill(false)));
    setMarked(Array(size).fill(null).map(() => Array(size).fill(false)));
    setGameState('playing');
    setShowSolution(false);
  };

  const handleGiveUp = () => {
    setShowSolution(true);
    setGameState('gaveUp');
  };

  if (!puzzleData) return null;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Link to="/" className={styles.backLink}>← Back to Games</Link>
        <h1 className={styles.title}>Nurikabe</h1>
        <p className={styles.instructions}>
          Shade cells to create a connected sea (dark) around islands (white). Each number indicates
          the total size of its island—the numbered cell plus adjacent white cells must equal that number.
          All sea cells must connect, no 2×2 sea squares allowed, and islands cannot touch orthogonally.
          Click to shade, right-click to mark as island.
        </p>
      </div>

      <div className={styles.sizeSelector}>
        {Object.keys(GRID_SIZES).map((key) => (
          <button
            key={key}
            className={`${styles.sizeBtn} ${sizeKey === key ? styles.active : ''}`}
            onClick={() => setSizeKey(key)}
          >
            {key}
          </button>
        ))}
      </div>

      <div className={styles.gameArea}>
        <div
          className={styles.grid}
          style={{
            gridTemplateColumns: `repeat(${size}, 1fr)`,
            width: `${size * 45}px`,
            height: `${size * 45}px`,
          }}
        >
          {puzzleData.grid.map((row, r) =>
            row.map((cell, c) => {
              const isSolutionSea = showSolution && puzzleData.solution[r][c] === 'sea';
              const isShaded = showSolution ? isSolutionSea : shaded[r][c];
              const isMarked = showSolution ? false : marked[r][c];
              const hasError = showSolution ? false : errors.has(`${r},${c}`);
              const hasNumber = cell !== null;

              return (
                <button
                  key={`${r}-${c}`}
                  className={`
                    ${styles.cell}
                    ${isShaded ? styles.shaded : ''}
                    ${isMarked ? styles.marked : ''}
                    ${hasError ? styles.error : ''}
                    ${hasNumber ? styles.number : ''}
                    ${showSolution ? styles.solution : ''}
                  `}
                  onClick={(e) => handleCellClick(r, c, e)}
                  onContextMenu={(e) => handleCellClick(r, c, e)}
                  disabled={showSolution}
                >
                  {hasNumber && <span className={styles.value}>{cell}</span>}
                </button>
              );
            })
          )}
        </div>

        {gameState === 'won' && (
          <div className={styles.winMessage}>
            <div className={styles.winEmoji}>🌊</div>
            <h3>Puzzle Solved!</h3>
            <p>Sea and islands perfectly balanced!</p>
          </div>
        )}

        {gameState === 'gaveUp' && (
          <div className={styles.gaveUpMessage}>
            <div className={styles.gaveUpEmoji}>🗺️</div>
            <h3>Solution Revealed</h3>
            <p>Study the pattern and try another puzzle!</p>
          </div>
        )}

        <div className={styles.controls}>
          <label className={styles.toggle}>
            <input
              type="checkbox"
              checked={showErrors}
              onChange={(e) => setShowErrors(e.target.checked)}
            />
            <span className={styles.toggleSlider}></span>
            Show errors
          </label>
        </div>

        <div className={styles.buttons}>
          <button className={styles.resetBtn} onClick={handleReset}>
            Reset
          </button>
          {gameState === 'playing' && (
            <button className={styles.giveUpBtn} onClick={handleGiveUp}>
              Give Up
            </button>
          )}
          <button className={styles.newGameBtn} onClick={initGame}>
            New Puzzle
          </button>
        </div>

        <div className={styles.legend}>
          <div className={styles.legendItem}>
            <div className={`${styles.legendBox} ${styles.seaLegend}`}></div>
            <span>Sea (click)</span>
          </div>
          <div className={styles.legendItem}>
            <div className={`${styles.legendBox} ${styles.islandLegend}`}></div>
            <span>Island (right-click)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
