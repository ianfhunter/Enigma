import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import styles from './Takuzu.module.css';

const GRID_SIZES = {
  '6×6': 6,
  '8×8': 8,
  '10×10': 10,
};

// Generate a valid completed Takuzu grid
function generateSolution(size) {
  const grid = Array(size).fill(null).map(() => Array(size).fill(null));

  function isValidPlacement(grid, row, col, value) {
    // Check for three in a row horizontally
    if (col >= 2 && grid[row][col-1] === value && grid[row][col-2] === value) return false;
    if (col >= 1 && col < size - 1 && grid[row][col-1] === value && grid[row][col+1] === value) return false;
    if (col < size - 2 && grid[row][col+1] === value && grid[row][col+2] === value) return false;

    // Check for three in a row vertically
    if (row >= 2 && grid[row-1][col] === value && grid[row-2][col] === value) return false;
    if (row >= 1 && row < size - 1 && grid[row-1][col] === value && grid[row+1]?.[col] === value) return false;
    if (row < size - 2 && grid[row+1]?.[col] === value && grid[row+2]?.[col] === value) return false;

    // Count values in row
    let rowCount = 0;
    for (let c = 0; c < size; c++) {
      if (grid[row][c] === value) rowCount++;
    }
    if (rowCount >= size / 2) return false;

    // Count values in column
    let colCount = 0;
    for (let r = 0; r < size; r++) {
      if (grid[r][col] === value) colCount++;
    }
    if (colCount >= size / 2) return false;

    return true;
  }

  function solve(row, col) {
    if (row === size) return true;

    const nextCol = (col + 1) % size;
    const nextRow = col === size - 1 ? row + 1 : row;

    const values = Math.random() > 0.5 ? [0, 1] : [1, 0];

    for (const value of values) {
      if (isValidPlacement(grid, row, col, value)) {
        grid[row][col] = value;
        if (solve(nextRow, nextCol)) return true;
        grid[row][col] = null;
      }
    }

    return false;
  }

  solve(0, 0);
  return grid;
}

// Create puzzle by removing cells from solution
function generatePuzzle(size) {
  const solution = generateSolution(size);
  const puzzle = solution.map(row => [...row]);

  // Remove about 50-60% of cells
  const cellsToRemove = Math.floor(size * size * 0.55);
  const positions = [];

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      positions.push([r, c]);
    }
  }

  // Shuffle positions
  for (let i = positions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [positions[i], positions[j]] = [positions[j], positions[i]];
  }

  for (let i = 0; i < cellsToRemove; i++) {
    const [r, c] = positions[i];
    puzzle[r][c] = null;
  }

  return { puzzle, solution };
}

// Check if current grid state is valid
function checkValidity(grid) {
  const size = grid.length;
  const errors = new Set();

  // Check rows for three in a row and counts
  for (let r = 0; r < size; r++) {
    let zeros = 0, ones = 0;
    for (let c = 0; c < size; c++) {
      if (grid[r][c] === 0) zeros++;
      if (grid[r][c] === 1) ones++;

      // Check three in a row
      if (c >= 2 && grid[r][c] !== null && grid[r][c] === grid[r][c-1] && grid[r][c] === grid[r][c-2]) {
        errors.add(`${r},${c}`);
        errors.add(`${r},${c-1}`);
        errors.add(`${r},${c-2}`);
      }
    }
    if (zeros > size / 2 || ones > size / 2) {
      for (let c = 0; c < size; c++) {
        if ((zeros > size / 2 && grid[r][c] === 0) || (ones > size / 2 && grid[r][c] === 1)) {
          errors.add(`${r},${c}`);
        }
      }
    }
  }

  // Check columns for three in a row and counts
  for (let c = 0; c < size; c++) {
    let zeros = 0, ones = 0;
    for (let r = 0; r < size; r++) {
      if (grid[r][c] === 0) zeros++;
      if (grid[r][c] === 1) ones++;

      // Check three in a row
      if (r >= 2 && grid[r][c] !== null && grid[r][c] === grid[r-1][c] && grid[r][c] === grid[r-2][c]) {
        errors.add(`${r},${c}`);
        errors.add(`${r-1},${c}`);
        errors.add(`${r-2},${c}`);
      }
    }
    if (zeros > size / 2 || ones > size / 2) {
      for (let r = 0; r < size; r++) {
        if ((zeros > size / 2 && grid[r][c] === 0) || (ones > size / 2 && grid[r][c] === 1)) {
          errors.add(`${r},${c}`);
        }
      }
    }
  }

  return errors;
}

// Check if puzzle is solved
function checkSolved(grid, solution) {
  const size = grid.length;
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (grid[r][c] !== solution[r][c]) return false;
    }
  }
  return true;
}

export default function Takuzu() {
  const [sizeKey, setSizeKey] = useState('6×6');
  const [puzzleData, setPuzzleData] = useState(null);
  const [grid, setGrid] = useState([]);
  const [fixed, setFixed] = useState([]);
  const [gameState, setGameState] = useState('playing');
  const [errors, setErrors] = useState(new Set());
  const [showErrors, setShowErrors] = useState(true);

  const size = GRID_SIZES[sizeKey];

  const initGame = useCallback(() => {
    const data = generatePuzzle(size);
    setPuzzleData(data);
    setGrid(data.puzzle.map(row => [...row]));
    setFixed(data.puzzle.map(row => row.map(cell => cell !== null)));
    setGameState('playing');
    setErrors(new Set());
  }, [size]);

  useEffect(() => {
    initGame();
  }, [initGame]);

  useEffect(() => {
    if (!puzzleData) return;

    const newErrors = showErrors ? checkValidity(grid) : new Set();
    setErrors(newErrors);

    if (checkSolved(grid, puzzleData.solution)) {
      setGameState('won');
    }
  }, [grid, puzzleData, showErrors]);

  const handleCellClick = (r, c) => {
    if (gameState !== 'playing' || fixed[r][c]) return;

    setGrid(prev => {
      const newGrid = prev.map(row => [...row]);
      // Cycle: null -> 0 -> 1 -> null
      if (newGrid[r][c] === null) newGrid[r][c] = 0;
      else if (newGrid[r][c] === 0) newGrid[r][c] = 1;
      else newGrid[r][c] = null;
      return newGrid;
    });
  };

  const handleReset = () => {
    if (!puzzleData) return;
    setGrid(puzzleData.puzzle.map(row => [...row]));
    setGameState('playing');
  };

  if (!puzzleData) return null;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Link to="/" className={styles.backLink}>← Back to Games</Link>
        <h1 className={styles.title}>Takuzu</h1>
        <p className={styles.instructions}>
          Fill the grid with 0s and 1s. No more than two consecutive same digits.
          Each row and column must have equal counts of 0s and 1s.
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
          {grid.map((row, r) =>
            row.map((cell, c) => {
              const isFixed = fixed[r][c];
              const hasError = errors.has(`${r},${c}`);

              return (
                <button
                  key={`${r}-${c}`}
                  className={`
                    ${styles.cell}
                    ${isFixed ? styles.fixed : ''}
                    ${hasError ? styles.error : ''}
                    ${cell === 0 ? styles.zero : ''}
                    ${cell === 1 ? styles.one : ''}
                  `}
                  onClick={() => handleCellClick(r, c)}
                  disabled={isFixed}
                >
                  {cell !== null && <span className={styles.value}>{cell}</span>}
                </button>
              );
            })
          )}
        </div>

        {gameState === 'won' && (
          <div className={styles.winMessage}>
            <div className={styles.winEmoji}>🎉</div>
            <h3>Puzzle Solved!</h3>
            <p>Perfect binary balance achieved!</p>
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
      </div>
    </div>
  );
}

