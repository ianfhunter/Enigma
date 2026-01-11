import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useKeyboardInput } from '../../hooks/useKeyboardInput';
import styles from './Skyscraper.module.css';

const GRID_SIZES = {
  '4×4': 4,
  '5×5': 5,
  '6×6': 6,
};

// Calculate how many buildings are visible from one direction
function countVisible(heights) {
  let max = 0;
  let count = 0;
  for (const h of heights) {
    if (h > max) {
      count++;
      max = h;
    }
  }
  return count;
}

// Generate a valid completed grid (Latin square with heights 1-N)
function generateSolution(size) {
  const grid = Array(size).fill(null).map(() => Array(size).fill(0));

  function isValid(row, col, num) {
    // Check row
    for (let c = 0; c < size; c++) {
      if (grid[row][c] === num) return false;
    }
    // Check column
    for (let r = 0; r < size; r++) {
      if (grid[r][col] === num) return false;
    }
    return true;
  }

  function solve(row, col) {
    if (row === size) return true;
    if (col === size) return solve(row + 1, 0);

    const nums = Array.from({ length: size }, (_, i) => i + 1);
    // Shuffle for randomness
    for (let i = nums.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [nums[i], nums[j]] = [nums[j], nums[i]];
    }

    for (const num of nums) {
      if (isValid(row, col, num)) {
        grid[row][col] = num;
        if (solve(row, col + 1)) return true;
        grid[row][col] = 0;
      }
    }
    return false;
  }

  solve(0, 0);
  return grid;
}

// Generate clues from solution
function generateClues(solution) {
  const size = solution.length;
  const clues = {
    top: [],
    bottom: [],
    left: [],
    right: [],
  };

  // Top clues (looking down)
  for (let c = 0; c < size; c++) {
    const col = [];
    for (let r = 0; r < size; r++) {
      col.push(solution[r][c]);
    }
    clues.top.push(countVisible(col));
  }

  // Bottom clues (looking up)
  for (let c = 0; c < size; c++) {
    const col = [];
    for (let r = size - 1; r >= 0; r--) {
      col.push(solution[r][c]);
    }
    clues.bottom.push(countVisible(col));
  }

  // Left clues (looking right)
  for (let r = 0; r < size; r++) {
    clues.left.push(countVisible(solution[r]));
  }

  // Right clues (looking left)
  for (let r = 0; r < size; r++) {
    const row = [...solution[r]].reverse();
    clues.right.push(countVisible(row));
  }

  // Hide some clues randomly (keep about 50-70%)
  const hideChance = 0.35;
  for (const side of ['top', 'bottom', 'left', 'right']) {
    clues[side] = clues[side].map(c => Math.random() < hideChance ? null : c);
  }

  return clues;
}

function generatePuzzle(size) {
  const solution = generateSolution(size);
  const clues = generateClues(solution);

  // Create puzzle by removing some cells
  const puzzle = solution.map(row => [...row]);
  const cellsToRemove = Math.floor(size * size * 0.6);
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

  for (let i = 0; i < cellsToRemove; i++) {
    const [r, c] = positions[i];
    puzzle[r][c] = 0;
  }

  return { puzzle, solution, clues };
}

function checkValidity(grid, clues) {
  const size = grid.length;
  const errors = new Set();

  // Check rows for duplicates
  for (let r = 0; r < size; r++) {
    const seen = new Map();
    for (let c = 0; c < size; c++) {
      const val = grid[r][c];
      if (val === 0) continue;
      if (seen.has(val)) {
        errors.add(`${r},${c}`);
        errors.add(`${r},${seen.get(val)}`);
      } else {
        seen.set(val, c);
      }
    }
  }

  // Check columns for duplicates
  for (let c = 0; c < size; c++) {
    const seen = new Map();
    for (let r = 0; r < size; r++) {
      const val = grid[r][c];
      if (val === 0) continue;
      if (seen.has(val)) {
        errors.add(`${r},${c}`);
        errors.add(`${seen.get(val)},${c}`);
      } else {
        seen.set(val, r);
      }
    }
  }

  // Check clues (only for complete rows/columns)
  // Top clues
  for (let c = 0; c < size; c++) {
    if (clues.top[c] === null) continue;
    const col = [];
    let complete = true;
    for (let r = 0; r < size; r++) {
      if (grid[r][c] === 0) { complete = false; break; }
      col.push(grid[r][c]);
    }
    if (complete && countVisible(col) !== clues.top[c]) {
      for (let r = 0; r < size; r++) {
        errors.add(`${r},${c}`);
      }
    }
  }

  // Bottom clues
  for (let c = 0; c < size; c++) {
    if (clues.bottom[c] === null) continue;
    const col = [];
    let complete = true;
    for (let r = size - 1; r >= 0; r--) {
      if (grid[r][c] === 0) { complete = false; break; }
      col.push(grid[r][c]);
    }
    if (complete && countVisible(col) !== clues.bottom[c]) {
      for (let r = 0; r < size; r++) {
        errors.add(`${r},${c}`);
      }
    }
  }

  // Left clues
  for (let r = 0; r < size; r++) {
    if (clues.left[r] === null) continue;
    let complete = true;
    for (let c = 0; c < size; c++) {
      if (grid[r][c] === 0) { complete = false; break; }
    }
    if (complete && countVisible(grid[r]) !== clues.left[r]) {
      for (let c = 0; c < size; c++) {
        errors.add(`${r},${c}`);
      }
    }
  }

  // Right clues
  for (let r = 0; r < size; r++) {
    if (clues.right[r] === null) continue;
    let complete = true;
    for (let c = 0; c < size; c++) {
      if (grid[r][c] === 0) { complete = false; break; }
    }
    if (complete && countVisible([...grid[r]].reverse()) !== clues.right[r]) {
      for (let c = 0; c < size; c++) {
        errors.add(`${r},${c}`);
      }
    }
  }

  return errors;
}

function checkSolved(grid, solution) {
  const size = grid.length;
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (grid[r][c] !== solution[r][c]) return false;
    }
  }
  return true;
}

export default function Skyscraper() {
  const [sizeKey, setSizeKey] = useState('4×4');
  const [puzzleData, setPuzzleData] = useState(null);
  const [grid, setGrid] = useState([]);
  const [fixed, setFixed] = useState([]);
  const [selected, setSelected] = useState(null);
  const [gameState, setGameState] = useState('playing');
  const [errors, setErrors] = useState(new Set());
  const [showErrors, setShowErrors] = useState(true);

  const size = GRID_SIZES[sizeKey];

  const initGame = useCallback(() => {
    const data = generatePuzzle(size);
    setPuzzleData(data);
    setGrid(data.puzzle.map(row => [...row]));
    setFixed(data.puzzle.map(row => row.map(cell => cell !== 0)));
    setSelected(null);
    setGameState('playing');
    setErrors(new Set());
  }, [size]);

  useEffect(() => {
    initGame();
  }, [initGame]);

  useEffect(() => {
    if (!puzzleData) return;

    const newErrors = showErrors ? checkValidity(grid, puzzleData.clues) : new Set();
    setErrors(newErrors);

    if (checkSolved(grid, puzzleData.solution)) {
      setGameState('won');
    }
  }, [grid, puzzleData, showErrors]);

  const handleCellClick = (r, c) => {
    if (gameState !== 'playing' || fixed[r][c]) return;
    setSelected([r, c]);
  };

  const handleNumberClick = (num) => {
    if (!selected || gameState !== 'playing') return;
    const [r, c] = selected;
    if (fixed[r][c]) return;

    setGrid(prev => {
      const newGrid = prev.map(row => [...row]);
      newGrid[r][c] = newGrid[r][c] === num ? 0 : num;
      return newGrid;
    });
  };

  const handleReset = () => {
    if (!puzzleData) return;
    setGrid(puzzleData.puzzle.map(row => [...row]));
    setSelected(null);
    setGameState('playing');
  };

  const handleGiveUp = () => {
    if (!puzzleData) return;
    setGrid(puzzleData.solution.map(row => [...row]));
    setGameState('gaveUp');
  };

  // Keyboard input for number keys
  useKeyboardInput({
    onNumber: useCallback((num) => {
      if (num >= 0 && num <= size) {
        handleNumberClick(num);
      }
    }, [size, handleNumberClick]),
    onBackspace: useCallback(() => {
      handleNumberClick(0);
    }, [handleNumberClick]),
    enabled: gameState === 'playing' && selected !== null,
  });

  if (!puzzleData) return null;

  const { clues } = puzzleData;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Link to="/" className={styles.backLink}>← Back to Games</Link>
        <h1 className={styles.title}>Skyscraper</h1>
        <p className={styles.instructions}>
          Fill each row and column with 1-{size} (no repeats). Clues show how many buildings
          are visible from that edge. Taller buildings hide shorter ones behind them.
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
        <div className={styles.gridWrapper}>
          {/* Top clues */}
          <div className={styles.clueRow}>
            <div className={styles.corner}></div>
            {clues.top.map((clue, i) => (
              <div key={i} className={styles.clue}>{clue ?? ''}</div>
            ))}
            <div className={styles.corner}></div>
          </div>

          {/* Main grid with side clues */}
          {grid.map((row, r) => (
            <div key={r} className={styles.gridRow}>
              <div className={styles.clue}>{clues.left[r] ?? ''}</div>
              {row.map((cell, c) => {
                const isSelected = selected && selected[0] === r && selected[1] === c;
                const isFixed = fixed[r][c];
                const hasError = errors.has(`${r},${c}`);

                return (
                  <button
                    key={c}
                    className={`
                      ${styles.cell}
                      ${isSelected ? styles.selected : ''}
                      ${isFixed ? styles.fixed : ''}
                      ${hasError ? styles.error : ''}
                    `}
                    onClick={() => handleCellClick(r, c)}
                  >
                    {cell !== 0 && (
                      <div className={styles.building} style={{ height: `${(cell / size) * 80}%` }}>
                        {cell}
                      </div>
                    )}
                  </button>
                );
              })}
              <div className={styles.clue}>{clues.right[r] ?? ''}</div>
            </div>
          ))}

          {/* Bottom clues */}
          <div className={styles.clueRow}>
            <div className={styles.corner}></div>
            {clues.bottom.map((clue, i) => (
              <div key={i} className={styles.clue}>{clue ?? ''}</div>
            ))}
            <div className={styles.corner}></div>
          </div>
        </div>

        {/* Number pad */}
        <div className={styles.numPad}>
          {Array.from({ length: size }, (_, i) => i + 1).map(num => (
            <button
              key={num}
              className={styles.numBtn}
              onClick={() => handleNumberClick(num)}
            >
              {num}
            </button>
          ))}
          <button className={styles.numBtn} onClick={() => handleNumberClick(0)}>×</button>
        </div>

        {gameState === 'won' && (
          <div className={styles.winMessage}>
            <div className={styles.winEmoji}>🏙️</div>
            <h3>Puzzle Solved!</h3>
            <p>Perfect skyline achieved!</p>
          </div>
        )}

        {gameState === 'gaveUp' && (
          <div className={styles.gaveUpMessage}>
            <div className={styles.winEmoji}>😔</div>
            <h3>Solution Revealed</h3>
            <p>Try a new puzzle!</p>
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
      </div>
    </div>
  );
}
