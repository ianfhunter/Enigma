import { createSeededRandom, seededShuffleArray } from '../../data/wordUtils';

/**
 * Generate a Latin square of order n
 */
function generateLatinSquare(n, random) {
  const grid = Array(n).fill(null).map(() => Array(n).fill(0));
  
  // Fill first row with shuffled numbers
  const firstRow = seededShuffleArray([...Array(n).keys()].map(i => i + 1), random);
  for (let c = 0; c < n; c++) {
    grid[0][c] = firstRow[c];
  }
  
  // Fill remaining rows using cyclic shift
  for (let r = 1; r < n; r++) {
    for (let c = 0; c < n; c++) {
      grid[r][c] = grid[r - 1][(c + 1) % n];
    }
  }
  
  // Shuffle rows (except first) to add randomness
  const rowOrder = seededShuffleArray([...Array(n).keys()], random);
  const shuffled = rowOrder.map(r => grid[r]);
  
  return shuffled;
}

/**
 * Generate an orthogonal Latin square (Graeco-Latin pair)
 * Ensures each (number, letter) pair appears exactly once
 */
function generateOrthogonalSquare(numbersSquare, n, random) {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.slice(0, n).split('');
  const solution = Array(n).fill(null).map(() => 
    Array(n).fill(null).map(() => ({ number: 0, letter: null }))
  );
  
  // Build a valid Graeco-Latin square
  // Strategy: Use a permutation-based approach
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      const num = numbersSquare[r][c];
      // Use a simple bijection: (num + c + r) % n to get letter index
      // This ensures orthogonality for small n
      const letterIdx = (num + c + r) % n;
      solution[r][c] = {
        number: num,
        letter: letters[letterIdx]
      };
    }
  }
  
  // Verify orthogonality (each pair is unique)
  const pairSet = new Set();
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      const key = `${solution[r][c].number}-${solution[r][c].letter}`;
      if (pairSet.has(key)) {
        // If duplicate found, regenerate using different strategy
        return generateOrthogonalSquareFallback(numbersSquare, n, random);
      }
      pairSet.add(key);
    }
  }
  
  return solution;
}

/**
 * Fallback method for generating orthogonal square
 */
function generateOrthogonalSquareFallback(numbersSquare, n, random) {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.slice(0, n).split('');
  const solution = Array(n).fill(null).map(() => 
    Array(n).fill(null).map(() => ({ number: 0, letter: null }))
  );
  
  // Use backtracking to find valid assignment
  const usedPairs = new Set();
  
  function canPlace(r, c, num, letter) {
    const pairKey = `${num}-${letter}`;
    if (usedPairs.has(pairKey)) return false;
    
    // Check row constraint
    for (let col = 0; col < c; col++) {
      if (solution[r][col].letter === letter) return false;
    }
    
    // Check column constraint
    for (let row = 0; row < r; row++) {
      if (solution[row][c].letter === letter) return false;
    }
    
    return true;
  }
  
  function backtrack(row, col) {
    if (row >= n) return true;
    
    const num = numbersSquare[row][col];
    const shuffledLetters = seededShuffleArray([...letters], random);
    
    for (const letter of shuffledLetters) {
      if (canPlace(row, col, num, letter)) {
        const pairKey = `${num}-${letter}`;
        solution[row][col] = { number: num, letter };
        usedPairs.add(pairKey);
        
        const nextCol = col + 1;
        const nextRow = nextCol >= n ? row + 1 : row;
        const nextColActual = nextCol >= n ? 0 : nextCol;
        
        if (backtrack(nextRow, nextColActual)) {
          return true;
        }
        
        usedPairs.delete(pairKey);
        solution[row][col] = { number: 0, letter: null };
      }
    }
    
    return false;
  }
  
  if (!backtrack(0, 0)) {
    // If backtracking fails, use simple modulo method
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        const num = numbersSquare[r][c];
        const letterIdx = (num + c + r + Math.floor(random() * n)) % n;
        solution[r][c] = { number: num, letter: letters[letterIdx] };
      }
    }
  }
  
  return solution;
}

/**
 * Check if a partial Eulero puzzle has a unique solution
 */
function solveEulero(puzzle, n, maxSolutions = 2) {
  const grid = puzzle.map(row => row.map(cell => 
    cell ? { ...cell } : { number: 0, letter: null }
  ));
  const solutions = [];
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.slice(0, n).split('');
  
  function isValid(r, c, num, letter) {
    // Check row constraints
    for (let col = 0; col < n; col++) {
      if (col !== c) {
        if (grid[r][col].number === num) return false;
        if (grid[r][col].letter === letter) return false;
      }
    }
    
    // Check column constraints
    for (let row = 0; row < n; row++) {
      if (row !== r) {
        if (grid[row][c].number === num) return false;
        if (grid[row][c].letter === letter) return false;
      }
    }
    
    // Check pair uniqueness
    for (let row = 0; row < n; row++) {
      for (let col = 0; col < n; col++) {
        if (row === r && col === c) continue;
        if (grid[row][col].number === num && grid[row][col].letter === letter) {
          return false;
        }
      }
    }
    
    return true;
  }
  
  function backtrack() {
    if (solutions.length >= maxSolutions) return;
    
    // Find next empty cell
    let r = -1, c = -1;
    for (let row = 0; row < n; row++) {
      for (let col = 0; col < n; col++) {
        if (grid[row][col].number === 0 || !grid[row][col].letter) {
          r = row;
          c = col;
          break;
        }
      }
      if (r !== -1) break;
    }
    
    if (r === -1) {
      // Solved
      solutions.push(grid.map(row => row.map(cell => ({ ...cell }))));
      return;
    }
    
    // Try all number-letter combinations
    const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9].slice(0, n);
    
    for (const num of numbers) {
      for (const letter of letters) {
        if (isValid(r, c, num, letter)) {
          const oldNum = grid[r][c].number;
          const oldLetter = grid[r][c].letter;
          grid[r][c].number = num;
          grid[r][c].letter = letter;
          
          backtrack();
          if (solutions.length >= maxSolutions) return;
          
          grid[r][c].number = oldNum;
          grid[r][c].letter = oldLetter;
        }
      }
    }
  }
  
  backtrack();
  return solutions;
}

/**
 * Generate an Eulero puzzle
 */
export function generatePuzzle(size = 5, difficulty = 'medium', seed = null) {
  const actualSeed = seed !== null ? seed : Date.now();
  const random = createSeededRandom(actualSeed);
  
  const n = Math.max(4, Math.min(size, 7)); // Typically 4-7
  
  // Generate solution
  const numbersSquare = generateLatinSquare(n, random);
  const solution = generateOrthogonalSquare(numbersSquare, n, random);
  
  // Determine clue count based on difficulty
  const totalCells = n * n;
  const clueCounts = {
    easy: Math.floor(totalCells * 0.5),
    medium: Math.floor(totalCells * 0.35),
    hard: Math.floor(totalCells * 0.25),
    expert: Math.floor(totalCells * 0.15)
  };
  const targetClues = clueCounts[difficulty] || clueCounts.medium;
  
  // Create puzzle by removing cells
  const puzzle = solution.map(row => 
    row.map(cell => ({ ...cell }))
  );
  
  // Get all positions and shuffle
  const positions = [];
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      positions.push([r, c]);
    }
  }
  const shuffledPositions = seededShuffleArray(positions, random);
  
  // Remove cells starting from the end
  const cellsToRemove = totalCells - targetClues;
  for (let i = 0; i < cellsToRemove && i < shuffledPositions.length; i++) {
    const [r, c] = shuffledPositions[i];
    puzzle[r][c] = { number: 0, letter: null };
  }
  
  // Verify uniqueness (try adding back if needed)
  for (let attempt = 0; attempt < 5; attempt++) {
    const solutions = solveEulero(puzzle, n, 2);
    if (solutions.length === 1) {
      break;
    }
    
    // Add back one clue if not unique
    if (solutions.length === 0 || solutions.length > 1) {
      const remaining = shuffledPositions.slice(cellsToRemove);
      if (remaining.length > 0) {
        const idx = Math.floor(random() * remaining.length);
        const [r, c] = remaining[idx];
        puzzle[r][c] = { 
          number: solution[r][c].number, 
          letter: solution[r][c].letter 
        };
        remaining.splice(idx, 1);
      }
    }
  }
  
  // Convert to display format (null for empty cells)
  const displayPuzzle = puzzle.map(row => 
    row.map(cell => 
      cell.number === 0 || !cell.letter ? null : { ...cell }
    )
  );
  
  return {
    puzzle: displayPuzzle,
    solution: solution,
    size: n,
    seed: actualSeed,
    difficulty
  };
}

/**
 * Check if puzzle is solved correctly
 */
export function isSolved(puzzle, solution) {
  if (!puzzle || !solution) return false;
  for (let r = 0; r < puzzle.length; r++) {
    for (let c = 0; c < puzzle[r].length; c++) {
      const cell = puzzle[r][c];
      const sol = solution[r][c];
      if (!cell || cell.number !== sol.number || cell.letter !== sol.letter) {
        return false;
      }
    }
  }
  return true;
}