import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import styles from './Hidato.module.css';

const GRID_SIZES = {
  '5×5': 5,
  '6×6': 6,
  '7×7': 7,
  '8×8': 8,
};

const DIFFICULTY = {
  'Easy': 0.6,    // 60% of cells given
  'Medium': 0.45, // 45% of cells given
  'Hard': 0.3,    // 30% of cells given
};

// Get all 8 neighbors (including diagonals)
function getNeighbors(r, c, size) {
  const neighbors = [];
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const nr = r + dr;
      const nc = c + dc;
      if (nr >= 0 && nr < size && nc >= 0 && nc < size) {
        neighbors.push([nr, nc]);
      }
    }
  }
  return neighbors;
}

// Count solutions for a Hidato puzzle (stops early if > 1)
function countSolutions(puzzle, size, maxNum) {
  // Find positions of all given numbers
  const fixedPositions = new Map();
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (puzzle[r][c] > 0) {
        fixedPositions.set(puzzle[r][c], [r, c]);
      }
    }
  }

  let solutionCount = 0;
  const grid = puzzle.map(row => [...row]);

  // Solve using backtracking
  function solve(num) {
    if (solutionCount > 1) return; // Early termination

    if (num > maxNum) {
      solutionCount++;
      return;
    }

    // If this number is fixed, just verify and continue
    if (fixedPositions.has(num)) {
      const [r, c] = fixedPositions.get(num);
      // Check if previous number is adjacent (if not the first)
      if (num > 1) {
        const prevPos = findNumber(grid, num - 1, size);
        if (!prevPos) return;
        const [pr, pc] = prevPos;
        if (Math.abs(r - pr) > 1 || Math.abs(c - pc) > 1) return;
      }
      solve(num + 1);
      return;
    }

    // Find where we can place this number (must be adjacent to num-1)
    const prevPos = findNumber(grid, num - 1, size);
    if (!prevPos) return;

    const [pr, pc] = prevPos;
    const neighbors = getNeighbors(pr, pc, size);

    for (const [nr, nc] of neighbors) {
      if (grid[nr][nc] === 0) {
        // Check if next fixed number is reachable from here
        if (isReachable(nr, nc, num, fixedPositions, grid, size, maxNum)) {
          grid[nr][nc] = num;
          solve(num + 1);
          grid[nr][nc] = 0;
          if (solutionCount > 1) return;
        }
      }
    }
  }

  function findNumber(g, num, sz) {
    for (let r = 0; r < sz; r++) {
      for (let c = 0; c < sz; c++) {
        if (g[r][c] === num) return [r, c];
      }
    }
    return null;
  }

  // Check if we can reach the next fixed number from current position
  function isReachable(r, c, currentNum, fixed, g, sz, mx) {
    // Find next fixed number after currentNum
    let nextFixed = null;
    let nextFixedNum = mx + 1;
    for (const [n, pos] of fixed) {
      if (n > currentNum && n < nextFixedNum) {
        nextFixedNum = n;
        nextFixed = pos;
      }
    }

    if (!nextFixed) return true; // No more fixed numbers

    const [tr, tc] = nextFixed;
    const stepsNeeded = nextFixedNum - currentNum;
    const distance = Math.max(Math.abs(tr - r), Math.abs(tc - c));

    // Must be reachable in exactly stepsNeeded moves
    // Count empty cells in the region
    let emptyCells = 0;
    for (let pr = 0; pr < sz; pr++) {
      for (let pc = 0; pc < sz; pc++) {
        if (g[pr][pc] === 0) emptyCells++;
      }
    }

    return distance <= stepsNeeded && stepsNeeded <= emptyCells + 1;
  }

  solve(1);
  return solutionCount;
}

// Generate a valid Hidato puzzle using Hamiltonian path approach
function generatePuzzle(size, difficultyKey) {
  const totalCells = size * size;
  const maxAttempts = 50;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    // Create path using random walk
    const path = [];
    const visited = Array(size).fill(null).map(() => Array(size).fill(false));

    // Start from random position
    let r = Math.floor(Math.random() * size);
    let c = Math.floor(Math.random() * size);

    path.push([r, c]);
    visited[r][c] = true;

    // Try to build a complete path
    while (path.length < totalCells) {
      const neighbors = getNeighbors(r, c, size).filter(([nr, nc]) => !visited[nr][nc]);

      if (neighbors.length === 0) {
        // Dead end - try backtracking
        if (path.length < totalCells * 0.7) break; // Too early, restart
        break;
      }

      // Prefer neighbors with fewer unvisited neighbors (Warnsdorff-like heuristic)
      neighbors.sort((a, b) => {
        const aCount = getNeighbors(a[0], a[1], size).filter(([nr, nc]) => !visited[nr][nc]).length;
        const bCount = getNeighbors(b[0], b[1], size).filter(([nr, nc]) => !visited[nr][nc]).length;
        return aCount - bCount;
      });

      // Pick with some randomness
      const idx = Math.random() < 0.7 ? 0 : Math.floor(Math.random() * neighbors.length);
      [r, c] = neighbors[idx];
      path.push([r, c]);
      visited[r][c] = true;
    }

    if (path.length >= totalCells * 0.8) {
      // Good enough path, create the solution grid
      const solution = Array(size).fill(null).map(() => Array(size).fill(0));

      for (let i = 0; i < path.length; i++) {
        const [pr, pc] = path[i];
        solution[pr][pc] = i + 1;
      }

      // Create puzzle with unique solution
      const result = createUniquePuzzle(solution, size, path.length, difficultyKey);
      if (result) return result;
    }
  }

  // Fallback: simple puzzle
  return generateSimplePuzzle(size, difficultyKey);
}

// Create a puzzle with guaranteed unique solution
function createUniquePuzzle(solution, size, maxNum, difficultyKey) {
  const givenRatio = DIFFICULTY[difficultyKey];
  const targetGiven = Math.max(2, Math.floor(maxNum * givenRatio));

  // Start with just first and last numbers
  const mustShow = new Set([1, maxNum]);

  // Create initial puzzle
  const createPuzzleFromShown = (shown) => {
    const puzzle = Array(size).fill(null).map(() => Array(size).fill(0));
    const given = Array(size).fill(null).map(() => Array(size).fill(false));

    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (solution[r][c] > 0 && shown.has(solution[r][c])) {
          puzzle[r][c] = solution[r][c];
          given[r][c] = true;
        }
      }
    }
    return { puzzle, given };
  };

  // Add random numbers to reach target, then ensure uniqueness
  while (mustShow.size < targetGiven) {
    mustShow.add(Math.floor(Math.random() * maxNum) + 1);
  }

  // Check uniqueness and add more clues if needed
  const maxClues = maxNum - 2; // Leave at least 2 cells to solve
  let iterations = 0;

  while (mustShow.size < maxClues && iterations < 100) {
    iterations++;
    const { puzzle, given } = createPuzzleFromShown(mustShow);
    const solutions = countSolutions(puzzle, size, maxNum);

    if (solutions === 1) {
      return { puzzle, solution, given, maxNum, pathLength: maxNum };
    }

    if (solutions === 0) {
      // Something went wrong, try again with different random clues
      return null;
    }

    // Multiple solutions - add a strategic clue
    // Find cells with most branching potential (numbers not adjacent to shown numbers)
    const candidates = [];
    for (let num = 2; num < maxNum; num++) {
      if (!mustShow.has(num)) {
        // Prioritize numbers that are "in the middle" between shown numbers
        let prevShown = 0, nextShown = maxNum + 1;
        for (const shown of mustShow) {
          if (shown < num && shown > prevShown) prevShown = shown;
          if (shown > num && shown < nextShown) nextShown = shown;
        }
        const gap = nextShown - prevShown;
        candidates.push({ num, gap });
      }
    }

    // Sort by gap size (largest gaps first) and pick one
    candidates.sort((a, b) => b.gap - a.gap);
    if (candidates.length > 0) {
      // Add a number from the largest gap
      const topCandidates = candidates.filter(c => c.gap === candidates[0].gap);
      const pick = topCandidates[Math.floor(Math.random() * topCandidates.length)];
      mustShow.add(pick.num);
    } else {
      break;
    }
  }

  // Final check
  const { puzzle, given } = createPuzzleFromShown(mustShow);
  const solutions = countSolutions(puzzle, size, maxNum);

  if (solutions === 1) {
    return { puzzle, solution, given, maxNum, pathLength: maxNum };
  }

  return null; // Failed to create unique puzzle
}

// Simple fallback generator
function generateSimplePuzzle(size, difficultyKey) {
  const solution = Array(size).fill(null).map(() => Array(size).fill(0));
  let num = 1;

  // Snake pattern
  for (let r = 0; r < size; r++) {
    if (r % 2 === 0) {
      for (let c = 0; c < size; c++) {
        solution[r][c] = num++;
      }
    } else {
      for (let c = size - 1; c >= 0; c--) {
        solution[r][c] = num++;
      }
    }
  }

  const maxNum = size * size;

  // Use the same unique puzzle creation logic
  const result = createUniquePuzzle(solution, size, maxNum, difficultyKey);
  if (result) return result;

  // Ultimate fallback - show more numbers
  const puzzle = solution.map(row => [...row]);
  const given = Array(size).fill(null).map(() => Array(size).fill(false));
  const mustShow = new Set([1, maxNum]);

  // Add every other number for guaranteed uniqueness
  for (let i = 1; i <= maxNum; i += 2) {
    mustShow.add(i);
  }

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (mustShow.has(puzzle[r][c])) {
        given[r][c] = true;
      } else {
        puzzle[r][c] = 0;
      }
    }
  }

  return { puzzle, solution, given, maxNum, pathLength: maxNum };
}

// Check if placement is valid
function isValidPlacement(grid, r, c, num, size, maxNum) {
  // Check if number is in valid range
  if (num < 1 || num > maxNum) return false;

  // Check if number already exists elsewhere
  for (let pr = 0; pr < size; pr++) {
    for (let pc = 0; pc < size; pc++) {
      if ((pr !== r || pc !== c) && grid[pr][pc] === num) {
        return false;
      }
    }
  }

  return true;
}

// Check if puzzle is solved
function checkSolved(grid, solution, size) {
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (solution[r][c] > 0 && grid[r][c] !== solution[r][c]) {
        return false;
      }
    }
  }
  return true;
}

// Find errors in current grid
function findErrors(grid, size, maxNum) {
  const errors = new Set();
  const numPositions = new Map();

  // Find duplicate numbers
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const num = grid[r][c];
      if (num > 0) {
        if (numPositions.has(num)) {
          errors.add(`${r},${c}`);
          errors.add(numPositions.get(num));
        } else {
          numPositions.set(num, `${r},${c}`);
        }
      }
    }
  }

  // Check consecutive number connectivity
  for (let num = 1; num < maxNum; num++) {
    let pos1 = null, pos2 = null;

    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (grid[r][c] === num) pos1 = [r, c];
        if (grid[r][c] === num + 1) pos2 = [r, c];
      }
    }

    if (pos1 && pos2) {
      const [r1, c1] = pos1;
      const [r2, c2] = pos2;
      const isAdjacent = Math.abs(r1 - r2) <= 1 && Math.abs(c1 - c2) <= 1;

      if (!isAdjacent) {
        errors.add(`${r1},${c1}`);
        errors.add(`${r2},${c2}`);
      }
    }
  }

  return errors;
}

export default function Hidato() {
  const [sizeKey, setSizeKey] = useState('5×5');
  const [difficultyKey, setDifficultyKey] = useState('Medium');
  const [puzzleData, setPuzzleData] = useState(null);
  const [grid, setGrid] = useState([]);
  const [selectedCell, setSelectedCell] = useState(null);
  const [gameState, setGameState] = useState('playing');
  const [errors, setErrors] = useState(new Set());
  const [showErrors, setShowErrors] = useState(true);

  const size = GRID_SIZES[sizeKey];

  const initGame = useCallback(() => {
    const data = generatePuzzle(size, difficultyKey);
    setPuzzleData(data);
    setGrid(data.puzzle.map(row => [...row]));
    setSelectedCell(null);
    setGameState('playing');
    setErrors(new Set());
  }, [size, difficultyKey]);

  useEffect(() => {
    initGame();
  }, [initGame]);

  useEffect(() => {
    if (!puzzleData) return;

    if (showErrors) {
      setErrors(findErrors(grid, size, puzzleData.maxNum));
    } else {
      setErrors(new Set());
    }

    if (checkSolved(grid, puzzleData.solution, size)) {
      setGameState('won');
    }
  }, [grid, puzzleData, size, showErrors]);

  const handleCellClick = (r, c) => {
    if (gameState !== 'playing') return;
    if (puzzleData.given[r][c]) return; // Can't modify given cells

    setSelectedCell([r, c]);
  };

  const handleKeyDown = useCallback((e) => {
    if (!selectedCell || gameState !== 'playing') return;

    const [r, c] = selectedCell;

    if (e.key === 'Backspace' || e.key === 'Delete') {
      if (!puzzleData.given[r][c]) {
        setGrid(prev => {
          const newGrid = prev.map(row => [...row]);
          newGrid[r][c] = 0;
          return newGrid;
        });
      }
      return;
    }

    if (e.key === 'Escape') {
      setSelectedCell(null);
      return;
    }

    // Arrow keys for navigation
    if (e.key === 'ArrowUp' && r > 0) {
      setSelectedCell([r - 1, c]);
      return;
    }
    if (e.key === 'ArrowDown' && r < size - 1) {
      setSelectedCell([r + 1, c]);
      return;
    }
    if (e.key === 'ArrowLeft' && c > 0) {
      setSelectedCell([r, c - 1]);
      return;
    }
    if (e.key === 'ArrowRight' && c < size - 1) {
      setSelectedCell([r, c + 1]);
      return;
    }

    // Number input
    const num = parseInt(e.key, 10);
    if (!isNaN(num)) {
      if (!puzzleData.given[r][c]) {
        setGrid(prev => {
          const newGrid = prev.map(row => [...row]);
          const currentVal = newGrid[r][c];
          // Allow multi-digit input - try building on current value first
          const newVal = currentVal > 0 ? currentVal * 10 + num : num;
          // Only check range validity, not duplicates (error highlighting handles that)
          if (newVal >= 1 && newVal <= puzzleData.maxNum) {
            newGrid[r][c] = newVal;
          } else if (num >= 1 && num <= puzzleData.maxNum) {
            // If multi-digit is out of range, try just the single digit
            newGrid[r][c] = num;
          }
          return newGrid;
        });
      }
    }
  }, [selectedCell, gameState, puzzleData, size]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const handleNumberPad = (num) => {
    if (!selectedCell || gameState !== 'playing') return;

    const [r, c] = selectedCell;
    if (puzzleData.given[r][c]) return;

    if (num === 'clear') {
      setGrid(prev => {
        const newGrid = prev.map(row => [...row]);
        newGrid[r][c] = 0;
        return newGrid;
      });
      return;
    }

    // Place the number directly
    setGrid(prev => {
      const newGrid = prev.map(row => [...row]);
      newGrid[r][c] = num;
      return newGrid;
    });
  };

  const handleReset = () => {
    if (!puzzleData) return;
    setGrid(puzzleData.puzzle.map(row => [...row]));
    setSelectedCell(null);
    setGameState('playing');
  };

  const handleGiveUp = () => {
    if (!puzzleData || gameState !== 'playing') return;
    setGrid(puzzleData.solution.map(row => [...row]));
    setSelectedCell(null);
    setGameState('revealed');
  };

  // Compute which numbers are already used on the grid
  const usedNumbers = useMemo(() => {
    const used = new Set();
    for (let r = 0; r < grid.length; r++) {
      for (let c = 0; c < grid[r].length; c++) {
        if (grid[r][c] > 0) {
          used.add(grid[r][c]);
        }
      }
    }
    return used;
  }, [grid]);

  if (!puzzleData) return null;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Link to="/" className={styles.backLink}>← Back to Games</Link>
        <h1 className={styles.title}>Hidato</h1>
        <p className={styles.instructions}>
          Fill in the grid with consecutive numbers (1 to {puzzleData.maxNum}).
          Each number must be adjacent to the next (including diagonals).
        </p>
      </div>

      <div className={styles.selectors}>
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
        <div className={styles.difficultySelector}>
          {Object.keys(DIFFICULTY).map((key) => (
            <button
              key={key}
              className={`${styles.difficultyBtn} ${difficultyKey === key ? styles.active : ''}`}
              onClick={() => setDifficultyKey(key)}
            >
              {key}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.gameArea}>
        <div
          className={styles.grid}
          style={{
            gridTemplateColumns: `repeat(${size}, 1fr)`,
            width: `${size * 52}px`,
            height: `${size * 52}px`,
          }}
        >
          {grid.map((row, r) =>
            row.map((num, c) => {
              const isGiven = puzzleData.given[r][c];
              const isSelected = selectedCell && selectedCell[0] === r && selectedCell[1] === c;
              const hasError = errors.has(`${r},${c}`);
              const isEmpty = puzzleData.solution[r][c] === 0;

              return (
                <button
                  key={`${r}-${c}`}
                  className={`
                    ${styles.cell}
                    ${isGiven ? styles.given : ''}
                    ${isSelected ? styles.selected : ''}
                    ${hasError ? styles.error : ''}
                    ${isEmpty ? styles.empty : ''}
                  `}
                  onClick={() => handleCellClick(r, c)}
                  disabled={isEmpty}
                >
                  {num > 0 && <span className={styles.number}>{num}</span>}
                </button>
              );
            })
          )}
        </div>

        {gameState === 'won' && (
          <div className={styles.winMessage}>
            <div className={styles.winEmoji}>🎉</div>
            <h3>Puzzle Solved!</h3>
            <p>Path complete from 1 to {puzzleData.maxNum}</p>
          </div>
        )}

        {gameState === 'revealed' && (
          <div className={styles.revealedMessage}>
            <div className={styles.revealedEmoji}>🔍</div>
            <h3>Solution Revealed</h3>
            <p>Better luck next time!</p>
          </div>
        )}

        <div className={styles.numberPad}>
          {Array.from({ length: puzzleData.maxNum }, (_, i) => i + 1).map(num => {
            const isUsed = usedNumbers.has(num);
            return (
              <button
                key={num}
                className={`${styles.numBtn} ${isUsed ? styles.numBtnUsed : ''}`}
                onClick={() => handleNumberPad(num)}
                disabled={isUsed}
              >
                {num}
              </button>
            );
          })}
          <button
            className={styles.numBtn}
            onClick={() => handleNumberPad('clear')}
          >
            ✕
          </button>
        </div>

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
          <button
            className={styles.giveUpBtn}
            onClick={handleGiveUp}
            disabled={gameState !== 'playing'}
          >
            Give Up
          </button>
          <button className={styles.newGameBtn} onClick={initGame}>
            New Puzzle
          </button>
        </div>

        <div className={styles.hint}>
          <p>Use keyboard: Arrow keys to move, numbers to enter, Backspace to clear</p>
        </div>
      </div>
    </div>
  );
}
