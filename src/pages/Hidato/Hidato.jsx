import { useState, useEffect, useCallback } from 'react';
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
      
      // Create puzzle by hiding some numbers
      const puzzle = solution.map(row => [...row]);
      const givenRatio = DIFFICULTY[difficultyKey];
      const numGiven = Math.max(2, Math.floor(path.length * givenRatio));
      
      // Always show first and last numbers
      const mustShow = new Set([1, path.length]);
      
      // Add some random numbers to show
      while (mustShow.size < numGiven) {
        mustShow.add(Math.floor(Math.random() * path.length) + 1);
      }
      
      // Create the given cells map
      const given = Array(size).fill(null).map(() => Array(size).fill(false));
      
      for (let pr = 0; pr < size; pr++) {
        for (let pc = 0; pc < size; pc++) {
          if (puzzle[pr][pc] > 0 && mustShow.has(puzzle[pr][pc])) {
            given[pr][pc] = true;
          } else if (puzzle[pr][pc] > 0) {
            puzzle[pr][pc] = 0;
          }
        }
      }
      
      return { 
        puzzle, 
        solution, 
        given, 
        maxNum: path.length,
        pathLength: path.length
      };
    }
  }
  
  // Fallback: simple puzzle
  return generateSimplePuzzle(size, difficultyKey);
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
  
  const puzzle = solution.map(row => [...row]);
  const given = Array(size).fill(null).map(() => Array(size).fill(false));
  const givenRatio = DIFFICULTY[difficultyKey];
  const maxNum = size * size;
  const numGiven = Math.max(2, Math.floor(maxNum * givenRatio));
  
  const mustShow = new Set([1, maxNum]);
  while (mustShow.size < numGiven) {
    mustShow.add(Math.floor(Math.random() * maxNum) + 1);
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
          // Allow multi-digit input
          const newVal = currentVal > 0 && currentVal < 10 ? currentVal * 10 + num : num;
          if (isValidPlacement(newGrid, r, c, newVal, size, puzzleData.maxNum)) {
            newGrid[r][c] = newVal;
          } else if (isValidPlacement(newGrid, r, c, num, size, puzzleData.maxNum)) {
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
    
    setGrid(prev => {
      const newGrid = prev.map(row => [...row]);
      const currentVal = newGrid[r][c];
      const newVal = currentVal > 0 && currentVal < 10 ? currentVal * 10 + num : num;
      if (isValidPlacement(newGrid, r, c, newVal, size, puzzleData.maxNum)) {
        newGrid[r][c] = newVal;
      } else if (isValidPlacement(newGrid, r, c, num, size, puzzleData.maxNum)) {
        newGrid[r][c] = num;
      }
      return newGrid;
    });
  };

  const handleReset = () => {
    if (!puzzleData) return;
    setGrid(puzzleData.puzzle.map(row => [...row]));
    setSelectedCell(null);
    setGameState('playing');
  };

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

        <div className={styles.numberPad}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
            <button
              key={num}
              className={styles.numBtn}
              onClick={() => handleNumberPad(num)}
            >
              {num}
            </button>
          ))}
          <button
            className={styles.numBtn}
            onClick={() => handleNumberPad('clear')}
          >
            ✕
          </button>
          <button
            className={styles.numBtn}
            onClick={() => handleNumberPad(0)}
          >
            0
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
