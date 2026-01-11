import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import styles from './YinYang.module.css';

const GRID_SIZES = {
  '5×5': 5,
  '7×7': 7,
  '9×9': 9,
};

function generateSolution(size) {
  const solution = Array(size).fill(null).map(() => Array(size).fill(null));
  
  // Start with a random pattern that avoids 2x2 squares
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      // Try to place alternating pattern with some randomness
      const base = (r + c) % 2 === 0;
      solution[r][c] = Math.random() < 0.6 ? base : !base;
    }
  }
  
  // Fix any 2x2 squares
  for (let iter = 0; iter < 100; iter++) {
    let fixed = false;
    for (let r = 0; r < size - 1; r++) {
      for (let c = 0; c < size - 1; c++) {
        // Check for 2x2 same color
        const val = solution[r][c];
        if (solution[r][c+1] === val && solution[r+1][c] === val && solution[r+1][c+1] === val) {
          // Flip one cell
          const cells = [[r, c], [r, c+1], [r+1, c], [r+1, c+1]];
          const [fr, fc] = cells[Math.floor(Math.random() * 4)];
          solution[fr][fc] = !solution[fr][fc];
          fixed = true;
        }
      }
    }
    if (!fixed) break;
  }
  
  // Ensure both colors are connected
  // If not, regenerate
  if (!isColorConnected(solution, size, true) || !isColorConnected(solution, size, false)) {
    return generateSolution(size);
  }
  
  return solution;
}

function isColorConnected(grid, size, color) {
  // Find first cell of this color
  let start = null;
  for (let r = 0; r < size && !start; r++) {
    for (let c = 0; c < size && !start; c++) {
      if (grid[r][c] === color) start = [r, c];
    }
  }
  
  if (!start) return true; // No cells of this color
  
  const visited = new Set();
  const queue = [start];
  visited.add(`${start[0]},${start[1]}`);
  
  while (queue.length > 0) {
    const [r, c] = queue.shift();
    
    for (const [nr, nc] of [[r-1, c], [r+1, c], [r, c-1], [r, c+1]]) {
      if (nr >= 0 && nr < size && nc >= 0 && nc < size) {
        const key = `${nr},${nc}`;
        if (!visited.has(key) && grid[nr][nc] === color) {
          visited.add(key);
          queue.push([nr, nc]);
        }
      }
    }
  }
  
  // Count total cells of this color
  let total = 0;
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (grid[r][c] === color) total++;
    }
  }
  
  return visited.size === total;
}

function createPuzzle(solution, size) {
  const puzzle = solution.map(row => row.map(() => null));
  
  // Give some cells as clues
  const numClues = Math.floor(size * size * 0.25);
  const positions = [];
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      positions.push([r, c]);
    }
  }
  
  // Shuffle
  for (let i = positions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [positions[i], positions[j]] = [positions[j], positions[i]];
  }
  
  for (let i = 0; i < numClues; i++) {
    const [r, c] = positions[i];
    puzzle[r][c] = solution[r][c];
  }
  
  return puzzle;
}

function generatePuzzle(size) {
  const solution = generateSolution(size);
  const puzzle = createPuzzle(solution, size);
  
  return { solution, puzzle, size };
}

function has2x2Square(grid, size, color) {
  for (let r = 0; r < size - 1; r++) {
    for (let c = 0; c < size - 1; c++) {
      if (grid[r][c] === color && 
          grid[r][c+1] === color && 
          grid[r+1][c] === color && 
          grid[r+1][c+1] === color) {
        return [[r, c], [r, c+1], [r+1, c], [r+1, c+1]];
      }
    }
  }
  return null;
}

function checkValidity(grid, size) {
  const errors = new Set();
  
  // Check for 2x2 squares of same color
  for (const color of [true, false]) {
    const square = has2x2Square(grid, size, color);
    if (square) {
      for (const [r, c] of square) {
        errors.add(`${r},${c}`);
      }
    }
  }
  
  // Check connectivity (only if all cells filled)
  let allFilled = true;
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (grid[r][c] === null) allFilled = false;
    }
  }
  
  if (allFilled) {
    if (!isColorConnected(grid, size, true)) {
      // Mark disconnected black cells
      for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
          if (grid[r][c] === true) errors.add(`${r},${c}`);
        }
      }
    }
    if (!isColorConnected(grid, size, false)) {
      for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
          if (grid[r][c] === false) errors.add(`${r},${c}`);
        }
      }
    }
  }
  
  return errors;
}

function checkSolved(grid, solution, size) {
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (grid[r][c] !== solution[r][c]) return false;
    }
  }
  return true;
}

export default function YinYang() {
  const [sizeKey, setSizeKey] = useState('5×5');
  const [puzzleData, setPuzzleData] = useState(null);
  const [grid, setGrid] = useState([]);
  const [gameState, setGameState] = useState('playing');
  const [errors, setErrors] = useState(new Set());
  const [showErrors, setShowErrors] = useState(true);

  const size = GRID_SIZES[sizeKey];

  const initGame = useCallback(() => {
    const data = generatePuzzle(size);
    setPuzzleData(data);
    setGrid(data.puzzle.map(row => [...row]));
    setGameState('playing');
    setErrors(new Set());
  }, [size]);

  useEffect(() => {
    initGame();
  }, [initGame]);

  useEffect(() => {
    if (!puzzleData) return;

    const newErrors = showErrors ? checkValidity(grid, size) : new Set();
    setErrors(newErrors);

    if (checkSolved(grid, puzzleData.solution, size)) {
      setGameState('won');
    }
  }, [grid, puzzleData, showErrors, size]);

  const handleCellClick = (r, c, e) => {
    if (gameState !== 'playing') return;
    if (puzzleData.puzzle[r][c] !== null) return; // Can't change given cells
    
    if (e.type === 'contextmenu' || e.ctrlKey) {
      e.preventDefault();
      // Place white
      setGrid(prev => {
        const newGrid = prev.map(row => [...row]);
        newGrid[r][c] = newGrid[r][c] === false ? null : false;
        return newGrid;
      });
    } else {
      // Place black
      setGrid(prev => {
        const newGrid = prev.map(row => [...row]);
        newGrid[r][c] = newGrid[r][c] === true ? null : true;
        return newGrid;
      });
    }
  };

  const handleReset = () => {
    setGrid(puzzleData.puzzle.map(row => [...row]));
    setGameState('playing');
  };

  if (!puzzleData) return null;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Link to="/" className={styles.backLink}>← Back to Games</Link>
        <h1 className={styles.title}>Yin-Yang</h1>
        <p className={styles.instructions}>
          Fill cells black or white. Each color must be connected. No 2×2 squares of the same color allowed.
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
          style={{ gridTemplateColumns: `repeat(${size}, 1fr)` }}
        >
          {grid.map((row, r) =>
            row.map((cell, c) => {
              const isGiven = puzzleData.puzzle[r][c] !== null;
              const hasError = errors.has(`${r},${c}`);

              return (
                <button
                  key={`${r}-${c}`}
                  className={`
                    ${styles.cell}
                    ${cell === true ? styles.black : ''}
                    ${cell === false ? styles.white : ''}
                    ${isGiven ? styles.given : ''}
                    ${hasError ? styles.error : ''}
                  `}
                  onClick={(e) => handleCellClick(r, c, e)}
                  onContextMenu={(e) => handleCellClick(r, c, e)}
                  disabled={isGiven}
                >
                  {cell === true && <span className={styles.yinYang}>☯</span>}
                </button>
              );
            })
          )}
        </div>

        {gameState === 'won' && (
          <div className={styles.winMessage}>
            <div className={styles.winEmoji}>☯️</div>
            <h3>Balance Achieved!</h3>
            <p>Yin and Yang in harmony!</p>
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
          <button className={styles.newGameBtn} onClick={initGame}>
            New Puzzle
          </button>
        </div>

        <div className={styles.legend}>
          <span>Click: Black</span>
          <span>Right-click: White</span>
        </div>
      </div>
    </div>
  );
}
