import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import styles from './Futoshiki.module.css';

const GRID_SIZES = {
  '4×4': 4,
  '5×5': 5,
  '6×6': 6,
};

// Generate a valid Futoshiki puzzle
function generatePuzzle(size) {
  // Create a solved Latin square
  const solution = Array(size).fill(null).map(() => Array(size).fill(0));

  // Fill with shifted pattern
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      solution[r][c] = ((r + c) % size) + 1;
    }
  }

  // Shuffle rows and columns
  for (let i = 0; i < size * 3; i++) {
    const a = Math.floor(Math.random() * size);
    const b = Math.floor(Math.random() * size);

    if (Math.random() > 0.5) {
      [solution[a], solution[b]] = [solution[b], solution[a]];
    } else {
      for (let r = 0; r < size; r++) {
        [solution[r][a], solution[r][b]] = [solution[r][b], solution[r][a]];
      }
    }
  }

  // Generate inequalities based on solution
  const horizontal = Array(size).fill(null).map(() => Array(size - 1).fill(null)); // > or < between cells
  const vertical = Array(size - 1).fill(null).map(() => Array(size).fill(null));

  // Add horizontal inequalities
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size - 1; c++) {
      if (Math.random() < 0.4) { // 40% chance of inequality
        horizontal[r][c] = solution[r][c] > solution[r][c + 1] ? '>' : '<';
      }
    }
  }

  // Add vertical inequalities
  for (let r = 0; r < size - 1; r++) {
    for (let c = 0; c < size; c++) {
      if (Math.random() < 0.4) {
        vertical[r][c] = solution[r][c] > solution[r + 1][c] ? 'v' : '^';
      }
    }
  }

  // Create puzzle by removing some numbers
  const puzzle = solution.map(row => [...row]);
  const cellsToRemove = Math.floor(size * size * 0.6); // Remove 60% of cells

  for (let i = 0; i < cellsToRemove; i++) {
    const r = Math.floor(Math.random() * size);
    const c = Math.floor(Math.random() * size);
    puzzle[r][c] = 0;
  }

  return { puzzle, solution, horizontal, vertical };
}

// Check if a number is valid at a position
function _isValidPlacement(grid, row, col, num, horizontal, vertical, size) {
  // Check row uniqueness
  for (let c = 0; c < size; c++) {
    if (c !== col && grid[row][c] === num) return false;
  }

  // Check column uniqueness
  for (let r = 0; r < size; r++) {
    if (r !== row && grid[r][col] === num) return false;
  }

  // Check horizontal inequalities
  if (col > 0 && horizontal[row][col - 1] && grid[row][col - 1] !== 0) {
    const op = horizontal[row][col - 1];
    if (op === '>' && grid[row][col - 1] <= num) return false;
    if (op === '<' && grid[row][col - 1] >= num) return false;
  }
  if (col < size - 1 && horizontal[row][col] && grid[row][col + 1] !== 0) {
    const op = horizontal[row][col];
    if (op === '>' && num <= grid[row][col + 1]) return false;
    if (op === '<' && num >= grid[row][col + 1]) return false;
  }

  // Check vertical inequalities
  if (row > 0 && vertical[row - 1][col] && grid[row - 1][col] !== 0) {
    const op = vertical[row - 1][col];
    if (op === 'v' && grid[row - 1][col] <= num) return false;
    if (op === '^' && grid[row - 1][col] >= num) return false;
  }
  if (row < size - 1 && vertical[row][col] && grid[row + 1][col] !== 0) {
    const op = vertical[row][col];
    if (op === 'v' && num <= grid[row + 1][col]) return false;
    if (op === '^' && num >= grid[row + 1][col]) return false;
  }

  return true;
}

// Find errors in the grid
function findErrors(grid, horizontal, vertical, size) {
  const errors = new Set();

  // Check row uniqueness
  for (let r = 0; r < size; r++) {
    const seen = new Map();
    for (let c = 0; c < size; c++) {
      if (grid[r][c] !== 0) {
        if (seen.has(grid[r][c])) {
          errors.add(`${r},${c}`);
          errors.add(`${r},${seen.get(grid[r][c])}`);
        }
        seen.set(grid[r][c], c);
      }
    }
  }

  // Check column uniqueness
  for (let c = 0; c < size; c++) {
    const seen = new Map();
    for (let r = 0; r < size; r++) {
      if (grid[r][c] !== 0) {
        if (seen.has(grid[r][c])) {
          errors.add(`${r},${c}`);
          errors.add(`${seen.get(grid[r][c])},${c}`);
        }
        seen.set(grid[r][c], r);
      }
    }
  }

  // Check inequalities
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size - 1; c++) {
      if (horizontal[r][c] && grid[r][c] !== 0 && grid[r][c + 1] !== 0) {
        const op = horizontal[r][c];
        if ((op === '>' && grid[r][c] <= grid[r][c + 1]) ||
            (op === '<' && grid[r][c] >= grid[r][c + 1])) {
          errors.add(`${r},${c}`);
          errors.add(`${r},${c + 1}`);
        }
      }
    }
  }

  for (let r = 0; r < size - 1; r++) {
    for (let c = 0; c < size; c++) {
      if (vertical[r][c] && grid[r][c] !== 0 && grid[r + 1][c] !== 0) {
        const op = vertical[r][c];
        if ((op === 'v' && grid[r][c] <= grid[r + 1][c]) ||
            (op === '^' && grid[r][c] >= grid[r + 1][c])) {
          errors.add(`${r},${c}`);
          errors.add(`${r + 1},${c}`);
        }
      }
    }
  }

  return errors;
}

// Check if puzzle is solved
function checkSolved(grid, solution) {
  for (let r = 0; r < grid.length; r++) {
    for (let c = 0; c < grid[r].length; c++) {
      if (grid[r][c] !== solution[r][c]) return false;
    }
  }
  return true;
}

export default function Futoshiki() {
  const [sizeKey, setSizeKey] = useState('5×5');
  const [puzzleData, setPuzzleData] = useState(null);
  const [grid, setGrid] = useState([]);
  const [initialCells, setInitialCells] = useState(new Set());
  const [selectedCell, setSelectedCell] = useState(null);
  const [gameState, setGameState] = useState('playing');
  const [errors, setErrors] = useState(new Set());
  const [showErrors, setShowErrors] = useState(true);

  const size = GRID_SIZES[sizeKey];

  const initGame = useCallback(() => {
    const data = generatePuzzle(size);
    setPuzzleData(data);
    setGrid(data.puzzle.map(row => [...row]));

    const initCells = new Set();
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (data.puzzle[r][c] !== 0) {
          initCells.add(`${r},${c}`);
        }
      }
    }
    setInitialCells(initCells);
    setSelectedCell(null);
    setGameState('playing');
    setErrors(new Set());
  }, [size]);

  useEffect(() => {
    initGame();
  }, [initGame]);

  useEffect(() => {
    if (!puzzleData) return;

    if (showErrors) {
      setErrors(findErrors(grid, puzzleData.horizontal, puzzleData.vertical, size));
    } else {
      setErrors(new Set());
    }

    if (checkSolved(grid, puzzleData.solution)) {
      setGameState('won');
    }
  }, [grid, puzzleData, size, showErrors]);

  const handleCellClick = (r, c) => {
    if (gameState !== 'playing') return;
    if (initialCells.has(`${r},${c}`)) return;
    setSelectedCell({ r, c });
  };

  const handleNumberInput = (num) => {
    if (!selectedCell || gameState !== 'playing') return;
    const { r, c } = selectedCell;
    if (initialCells.has(`${r},${c}`)) return;

    setGrid(prev => {
      const newGrid = prev.map(row => [...row]);
      newGrid[r][c] = num;
      return newGrid;
    });
  };

  const handleClear = () => {
    if (!selectedCell || gameState !== 'playing') return;
    const { r, c } = selectedCell;
    if (initialCells.has(`${r},${c}`)) return;

    setGrid(prev => {
      const newGrid = prev.map(row => [...row]);
      newGrid[r][c] = 0;
      return newGrid;
    });
  };

  // Keyboard handling
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!selectedCell || gameState !== 'playing') return;

      if (e.key >= '1' && e.key <= String(size)) {
        handleNumberInput(parseInt(e.key));
      } else if (e.key === 'Backspace' || e.key === 'Delete' || e.key === '0') {
        handleClear();
      } else if (e.key === 'ArrowUp' && selectedCell.r > 0) {
        setSelectedCell({ r: selectedCell.r - 1, c: selectedCell.c });
      } else if (e.key === 'ArrowDown' && selectedCell.r < size - 1) {
        setSelectedCell({ r: selectedCell.r + 1, c: selectedCell.c });
      } else if (e.key === 'ArrowLeft' && selectedCell.c > 0) {
        setSelectedCell({ r: selectedCell.r, c: selectedCell.c - 1 });
      } else if (e.key === 'ArrowRight' && selectedCell.c < size - 1) {
        setSelectedCell({ r: selectedCell.r, c: selectedCell.c + 1 });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedCell, gameState, size]);

  if (!puzzleData) return null;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Link to="/" className={styles.backLink}>← Back to Games</Link>
        <h1 className={styles.title}>Futoshiki</h1>
        <p className={styles.instructions}>
          Fill the grid with numbers 1-{size}. Each row and column must have unique numbers.
          Respect the inequality signs between cells!
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
          className={styles.gridContainer}
          style={{ '--grid-size': size }}
        >
          {grid.map((row, r) => (
            <div key={r} className={styles.row}>
              <div className={styles.cellsRow}>
                {row.map((cell, c) => {
                  const isInitial = initialCells.has(`${r},${c}`);
                  const isSelected = selectedCell?.r === r && selectedCell?.c === c;
                  const hasError = errors.has(`${r},${c}`);

                  return (
                    <div key={c} className={styles.cellGroup}>
                      <button
                        className={`
                          ${styles.cell}
                          ${isInitial ? styles.initial : ''}
                          ${isSelected ? styles.selected : ''}
                          ${hasError ? styles.error : ''}
                        `}
                        onClick={() => handleCellClick(r, c)}
                      >
                        {cell !== 0 && <span className={styles.number}>{cell}</span>}
                      </button>

                      {/* Horizontal inequality */}
                      {c < size - 1 && (
                        <span className={styles.horizontalOp}>
                          {puzzleData.horizontal[r][c] || ''}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Vertical inequalities below row */}
              {r < size - 1 && (
                <div className={styles.verticalRow}>
                  {row.map((_, c) => (
                    <div key={c} className={styles.verticalCell}>
                      <span className={styles.verticalOp}>
                        {puzzleData.vertical[r][c] || ''}
                      </span>
                      {c < size - 1 && <span className={styles.spacer}></span>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className={styles.numberPad}>
          {Array.from({ length: size }, (_, i) => i + 1).map(num => (
            <button
              key={num}
              className={styles.numBtn}
              onClick={() => handleNumberInput(num)}
            >
              {num}
            </button>
          ))}
          <button className={styles.numBtn} onClick={handleClear}>
            ⌫
          </button>
        </div>

        {gameState === 'won' && (
          <div className={styles.winMessage}>
            <div className={styles.winEmoji}>🎉</div>
            <h3>Puzzle Solved!</h3>
            <p>All inequalities satisfied</p>
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

        <button className={styles.newGameBtn} onClick={initGame}>
          New Puzzle
        </button>
      </div>
    </div>
  );
}
