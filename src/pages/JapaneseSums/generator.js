import { createSeededRandom, seededShuffleArray } from '../../data/wordUtils';
import { createGrid, generateLatinSquare as sharedGenerateLatinSquare } from '../../utils/generatorUtils';

/**
 * Find runs of consecutive filled cells in a row/column
 */
function findRuns(pattern) {
  const runs = [];
  let start = -1;

  for (let i = 0; i < pattern.length; i++) {
    if (pattern[i] && start === -1) {
      start = i;
    } else if (!pattern[i] && start !== -1) {
      runs.push({ start, end: i - 1, length: i - start });
      start = -1;
    }
  }

  if (start !== -1) {
    runs.push({ start, end: pattern.length - 1, length: pattern.length - start });
  }

  return runs;
}

/**
 * Calculate sums for runs in a row
 */
function calculateRowSums(solution, pattern, row) {
  const runs = findRuns(pattern[row]);
  return runs.map(run => {
    let sum = 0;
    for (let c = run.start; c <= run.end; c++) {
      sum += solution[row][c];
    }
    return sum;
  });
}

/**
 * Calculate sums for runs in a column
 */
function calculateColSums(solution, pattern, col) {
  const colPattern = pattern.map(row => row[col]);
  const runs = findRuns(colPattern);
  return runs.map(run => {
    let sum = 0;
    for (let r = run.start; r <= run.end; r++) {
      sum += solution[r][col];
    }
    return sum;
  });
}

/**
 * Check if a Japanese Sums puzzle has a unique solution
 */
function solveJapaneseSums(clues, n, maxSolutions = 2) {
  const { rowClues, colClues, pattern, prefilled } = clues;
  const grid = createGrid(n, n, 0);
  const solutions = [];

  // Fill in prefilled cells
  if (prefilled) {
    for (const { r, c, value } of prefilled) {
      grid[r][c] = value;
    }
  }

  function isValid(r, c, num) {
    // Check row: no duplicate numbers
    for (let col = 0; col < n; col++) {
      if (col !== c && grid[r][col] === num) return false;
    }

    // Check column: no duplicate numbers
    for (let row = 0; row < n; row++) {
      if (row !== r && grid[row][c] === num) return false;
    }

    // For now, accept any valid Latin square constraint
    // Full sum validation would be too slow for generator
    return true;
  }

  function validateSums() {
    // Validate row sums
    for (let r = 0; r < n; r++) {
      const runs = findRuns(pattern[r]);
      const actualSums = runs.map(run => {
        let sum = 0;
        let complete = true;
        for (let c = run.start; c <= run.end; c++) {
          if (grid[r][c] === 0) {
            complete = false;
            break;
          }
          sum += grid[r][c];
        }
        return complete ? sum : null;
      }).filter(s => s !== null);

      const expectedSums = rowClues[r] || [];
      if (actualSums.length === expectedSums.length) {
        for (let i = 0; i < actualSums.length; i++) {
          if (actualSums[i] !== expectedSums[i]) return false;
        }
      }
    }

    // Validate column sums
    for (let c = 0; c < n; c++) {
      const colPattern = pattern.map(row => row[c]);
      const runs = findRuns(colPattern);
      const actualSums = runs.map(run => {
        let sum = 0;
        let complete = true;
        for (let r = run.start; r <= run.end; r++) {
          if (grid[r][c] === 0) {
            complete = false;
            break;
          }
          sum += grid[r][c];
        }
        return complete ? sum : null;
      }).filter(s => s !== null);

      const expectedSums = colClues[c] || [];
      if (actualSums.length === expectedSums.length) {
        for (let i = 0; i < actualSums.length; i++) {
          if (actualSums[i] !== expectedSums[i]) return false;
        }
      }
    }

    return true;
  }

  function backtrack() {
    if (solutions.length >= maxSolutions) return;

    // Find next empty cell (that should be filled according to pattern)
    let r = -1, c = -1;
    for (let row = 0; row < n; row++) {
      for (let col = 0; col < n; col++) {
        if (pattern[row][col] && grid[row][col] === 0) {
          r = row;
          c = col;
          break;
        }
      }
      if (r !== -1) break;
    }

    if (r === -1) {
      // Check if solution is valid
      if (validateSums()) {
        solutions.push(grid.map(row => [...row]));
      }
      return;
    }

    // Try numbers 1..n
    const numbers = seededShuffleArray([...Array(n).keys()].map(i => i + 1), () => Math.random());
    for (const num of numbers) {
      if (isValid(r, c, num)) {
        grid[r][c] = num;
        backtrack();
        if (solutions.length >= maxSolutions) return;
        grid[r][c] = 0;
      }
    }
  }

  backtrack();
  return solutions;
}

/**
 * Generate a Japanese Sums puzzle
 */
export function generatePuzzle(size = 7, difficulty = 'medium', seed = null) {
  const actualSeed = seed !== null ? seed : Date.now();
  const random = createSeededRandom(actualSeed);

  const n = Math.max(5, Math.min(size, 9)); // Typically 5-9

  // Generate solution (Latin square) using shared utility
  const solution = sharedGenerateLatinSquare(n, random);

  // Determine fill density based on difficulty
  const densities = {
    easy: 0.6,
    medium: 0.5,
    hard: 0.4,
    expert: 0.35
  };
  const fillDensity = densities[difficulty] || densities.medium;
  const totalCells = n * n;
  const filledCount = Math.floor(totalCells * fillDensity);

  // Generate fill pattern (which cells are filled vs shaded)
  const pattern = createGrid(n, n, false);
  const positions = [];
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      positions.push([r, c]);
    }
  }

  // Select filled positions with some constraint to ensure good runs
  const shuffledPositions = seededShuffleArray(positions, random);
  for (let i = 0; i < filledCount; i++) {
    const [r, c] = shuffledPositions[i];
    pattern[r][c] = true;
  }

  // Calculate row and column clues (sums of runs)
  const rowClues = [];
  const colClues = [];

  for (let r = 0; r < n; r++) {
    const sums = calculateRowSums(solution, pattern, r);
    rowClues.push(sums.length > 0 ? sums : []);
  }

  for (let c = 0; c < n; c++) {
    const sums = calculateColSums(solution, pattern, c);
    colClues.push(sums.length > 0 ? sums : []);
  }

  // Remove numbers from grid (only pattern and clues remain)
  const puzzle = createGrid(n, n, null);

  // Verify uniqueness (simplified - just ensure we have enough constraints)
  const clues = { rowClues, colClues, pattern, prefilled: [] };

  // Add a few hints if needed for uniqueness (simplified approach)
  // In practice, full uniqueness checking is expensive, so we add some prefilled cells
  const hintCount = difficulty === 'expert' ? 0 : difficulty === 'hard' ? 1 : 2;
  for (let i = 0; i < hintCount; i++) {
    const filledPositions = shuffledPositions.slice(0, filledCount);
    const hintPos = filledPositions[Math.floor(random() * filledPositions.length)];
    const [r, c] = hintPos;
    puzzle[r][c] = solution[r][c];
    clues.prefilled.push({ r, c, value: solution[r][c] });
  }

  return {
    puzzle: puzzle, // null for empty/shaded, number for prefilled hints
    solution: solution,
    pattern: pattern, // true = filled, false = shaded
    rowClues: rowClues,
    colClues: colClues,
    size: n,
    seed: actualSeed,
    difficulty
  };
}

/**
 * Check if puzzle is solved correctly
 */
export function isSolved(userGrid, solution, pattern) {
  if (!userGrid || !solution || !pattern) return false;

  for (let r = 0; r < userGrid.length; r++) {
    for (let c = 0; c < userGrid[r].length; c++) {
      if (pattern[r][c]) {
        // This cell should be filled
        if (userGrid[r][c] !== solution[r][c]) {
          return false;
        }
      } else {
        // This cell should be empty/shaded
        if (userGrid[r][c] !== null && userGrid[r][c] !== 0) {
          return false;
        }
      }
    }
  }
  return true;
}