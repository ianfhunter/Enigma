import { useTranslation } from 'react-i18next';
import { useState, useEffect, useCallback, useRef } from 'react';
import { formatTime, createSeededRandom } from '../../data/wordUtils';
import GameHeader from '../../components/GameHeader';
import SizeSelector from '../../components/SizeSelector';
import Timer from '../../components/Timer';
import GiveUpButton from '../../components/GiveUpButton';
import GameResult from '../../components/GameResult';
import { useGameState } from '../../hooks/useGameState';
import { useGameStats } from '../../hooks/useGameStats';
import styles from './Kropki.module.css';

const GRID_SIZES = {
  '4×4': 4,
  '5×5': 5,
  '6×6': 6,
};

// Generate a valid Latin square
function generateLatinSquare(size, random = Math.random) {
  const grid = Array(size).fill(null).map(() => Array(size).fill(0));

  function isValid(grid, row, col, num) {
    for (let x = 0; x < size; x++) {
      if (grid[row][x] === num || grid[x][col] === num) return false;
    }
    return true;
  }

  function solve(grid, row = 0, col = 0) {
    if (row === size) return true;
    if (col === size) return solve(grid, row + 1, 0);

    const nums = Array.from({ length: size }, (_, i) => i + 1);
    for (let i = nums.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [nums[i], nums[j]] = [nums[j], nums[i]];
    }

    for (const num of nums) {
      if (isValid(grid, row, col, num)) {
        grid[row][col] = num;
        if (solve(grid, row, col + 1)) return true;
        grid[row][col] = 0;
      }
    }
    return false;
  }

  solve(grid);
  return grid;
}

// Generate Kropki dots based on solution
function generateDots(solution, size) {
  const horizontalDots = Array(size).fill(null).map(() => Array(size - 1).fill(null));
  const verticalDots = Array(size - 1).fill(null).map(() => Array(size).fill(null));

  // Horizontal dots (between columns)
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size - 1; c++) {
      const a = solution[r][c];
      const b = solution[r][c + 1];

      if (Math.abs(a - b) === 1) {
        horizontalDots[r][c] = 'white'; // Consecutive
      } else if (a === 2 * b || b === 2 * a) {
        horizontalDots[r][c] = 'black'; // Double
      }
    }
  }

  // Vertical dots (between rows)
  for (let r = 0; r < size - 1; r++) {
    for (let c = 0; c < size; c++) {
      const a = solution[r][c];
      const b = solution[r + 1][c];

      if (Math.abs(a - b) === 1) {
        verticalDots[r][c] = 'white';
      } else if (a === 2 * b || b === 2 * a) {
        verticalDots[r][c] = 'black';
      }
    }
  }

  return { horizontalDots, verticalDots };
}

function generatePuzzle(size, seed = Date.now()) {
  const random = createSeededRandom(seed);
  const solution = generateLatinSquare(size, random);
  const { horizontalDots, verticalDots } = generateDots(solution, size);

  return { solution, horizontalDots, verticalDots, size };
}

function checkValidity(grid, horizontalDots, verticalDots, size) {
  const errors = new Set();

  // Check Latin square rules
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (grid[r][c] === 0) continue;

      // Check row
      for (let x = 0; x < size; x++) {
        if (x !== c && grid[r][x] === grid[r][c]) {
          errors.add(`${r},${c}`);
          errors.add(`${r},${x}`);
        }
      }

      // Check column
      for (let x = 0; x < size; x++) {
        if (x !== r && grid[x][c] === grid[r][c]) {
          errors.add(`${r},${c}`);
          errors.add(`${x},${c}`);
        }
      }
    }
  }

  // Check dot constraints
  // Horizontal dots
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size - 1; c++) {
      const a = grid[r][c];
      const b = grid[r][c + 1];
      if (a === 0 || b === 0) continue;

      const dot = horizontalDots[r][c];

      if (dot === 'white') {
        // Must be consecutive
        if (Math.abs(a - b) !== 1) {
          errors.add(`${r},${c}`);
          errors.add(`${r},${c + 1}`);
        }
      } else if (dot === 'black') {
        // Must be double
        if (a !== 2 * b && b !== 2 * a) {
          errors.add(`${r},${c}`);
          errors.add(`${r},${c + 1}`);
        }
      } else {
        // No dot - must NOT be consecutive or double
        if (Math.abs(a - b) === 1 || a === 2 * b || b === 2 * a) {
          errors.add(`${r},${c}`);
          errors.add(`${r},${c + 1}`);
        }
      }
    }
  }

  // Vertical dots
  for (let r = 0; r < size - 1; r++) {
    for (let c = 0; c < size; c++) {
      const a = grid[r][c];
      const b = grid[r + 1][c];
      if (a === 0 || b === 0) continue;

      const dot = verticalDots[r][c];

      if (dot === 'white') {
        if (Math.abs(a - b) !== 1) {
          errors.add(`${r},${c}`);
          errors.add(`${r + 1},${c}`);
        }
      } else if (dot === 'black') {
        if (a !== 2 * b && b !== 2 * a) {
          errors.add(`${r},${c}`);
          errors.add(`${r + 1},${c}`);
        }
      } else {
        if (Math.abs(a - b) === 1 || a === 2 * b || b === 2 * a) {
          errors.add(`${r},${c}`);
          errors.add(`${r + 1},${c}`);
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

// Export helpers for testing
export {
  GRID_SIZES,
  generateLatinSquare,
  generateDots,
  generatePuzzle,
  checkValidity,
  checkSolved,
};

export default function Kropki() {
  const { t } = useTranslation();
  const [sizeKey, setSizeKey] = useState('5×5');
  const [puzzleData, setPuzzleData] = useState(null);
  const [grid, setGrid] = useState([]);
  const [selectedCell, setSelectedCell] = useState(null);
  const { gameState, checkWin, giveUp, reset: resetGameState, isPlaying } = useGameState();
  const { recordWin, recordGiveUp } = useGameStats('kropki');
  const [errors, setErrors] = useState(new Set());
  const [showErrors, setShowErrors] = useState(false);
  const [timer, setTimer] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const timerRef = useRef(null);

  const size = GRID_SIZES[sizeKey];

  const initGame = useCallback(() => {
    const data = generatePuzzle(size);
    setPuzzleData(data);
    setGrid(Array(size).fill(null).map(() => Array(size).fill(0)));
    setSelectedCell(null);
    resetGameState();
    setErrors(new Set());
    setTimer(0);
    setIsRunning(true);
  }, [size, resetGameState]);

  useEffect(() => {
    initGame();
  }, [initGame]);

  useEffect(() => {
    if (isRunning && isPlaying) {
      timerRef.current = setInterval(() => {
        setTimer(t => t + 1);
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [isRunning, isPlaying]);

  useEffect(() => {
    if (!puzzleData || !isPlaying) return;

    const newErrors = showErrors
      ? checkValidity(grid, puzzleData.horizontalDots, puzzleData.verticalDots, size)
      : new Set();
    setErrors(newErrors);

    if (checkSolved(grid, puzzleData.solution, size)) {
      checkWin(true);
      recordWin();
      setIsRunning(false);
    }
  }, [grid, puzzleData, showErrors, size, isPlaying, checkWin, recordWin]);

  const handleCellClick = (r, c) => {
    if (!isPlaying) return;
    setSelectedCell({ row: r, col: c });
  };

  const handleNumberInput = (num) => {
    if (!selectedCell || !isPlaying) return;
    if (num > size) return;

    const { row, col } = selectedCell;
    setGrid(prev => {
      const newGrid = prev.map(r => [...r]);
      newGrid[row][col] = num;
      return newGrid;
    });
  };

  const handleGiveUp = () => {
    if (!puzzleData || !isPlaying) return;
    setGrid(puzzleData.solution.map(row => [...row]));
    giveUp();
    recordGiveUp();
    setIsRunning(false);
  };

  const handleClear = () => {
    if (!selectedCell || !isPlaying) return;
    const { row, col } = selectedCell;
    setGrid(prev => {
      const newGrid = prev.map(r => [...r]);
      newGrid[row][col] = 0;
      return newGrid;
    });
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!selectedCell || !isPlaying) return;

      const num = parseInt(e.key);
      if (num >= 1 && num <= size) {
        handleNumberInput(num);
      } else if (e.key === 'Backspace' || e.key === 'Delete' || e.key === '0') {
        handleClear();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedCell, gameState, size]);

  if (!puzzleData) return null;

  return (
    <div className={styles.container}>
      <GameHeader
        title="Kropki"
        instructions={`Fill the grid with 1-${size}. Each row and column contains each number once. White dots = consecutive numbers. Black dots = one is double the other. No dot = neither relationship.`}
      />

      <SizeSelector
        sizes={Object.keys(GRID_SIZES)}
        selected={sizeKey}
        onSelect={setSizeKey}
      />

      <div className={styles.gameArea}>
        <Timer seconds={timer} />

        <div className={styles.boardWrapper}>
          <div className={styles.board} style={{ '--grid-size': size }}>
            {Array(size).fill(null).map((_, r) => (
              <div key={r} className={styles.row}>
                {Array(size).fill(null).map((_, c) => {
                  const value = grid[r][c];
                  const isSelected = selectedCell?.row === r && selectedCell?.col === c;
                  const hasError = errors.has(`${r},${c}`);
                  const hDot = c < size - 1 ? puzzleData.horizontalDots[r][c] : null;
                  const vDot = r < size - 1 ? puzzleData.verticalDots[r][c] : null;

                  return (
                    <div key={c} className={styles.cellWrapper}>
                      <div
                        className={`
                          ${styles.cell}
                          ${isSelected ? styles.selected : ''}
                          ${hasError ? styles.error : ''}
                        `}
                        onClick={() => handleCellClick(r, c)}
                      >
                        {value !== 0 && <span className={styles.cellValue}>{value}</span>}
                      </div>
                      {hDot && (
                        <div className={`${styles.hDot} ${styles[hDot]}`} />
                      )}
                      {vDot && (
                        <div className={`${styles.vDot} ${styles[vDot]}`} />
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
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
          <button className={styles.numBtn} onClick={handleClear}>✕</button>
        </div>

        {gameState === 'won' && (
          <GameResult
            state="won"
            title="🎉 Puzzle Solved!"
            message={`Completed in ${formatTime(timer)}`}
          />
        )}

        {gameState === 'gaveUp' && (
          <GameResult
            state="gaveup"
            title="Solution Revealed"
          />
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

        <div className={styles.legend}>
          <div className={styles.legendItem}>
            <div className={`${styles.legendDot} ${styles.white}`}></div>
            <span>Consecutive (1-2, 3-4, etc.)</span>
          </div>
          <div className={styles.legendItem}>
            <div className={`${styles.legendDot} ${styles.black}`}></div>
            <span>Double (1-2, 2-4, 3-6, etc.)</span>
          </div>
        </div>

        <div className={styles.buttons}>
          <button className={styles.resetBtn} onClick={() => {
            setGrid(Array(size).fill(null).map(() => Array(size).fill(0)));
            resetGameState();
            setTimer(0);
            setIsRunning(true);
          }}>
            Reset
          </button>
          <GiveUpButton
            onGiveUp={handleGiveUp}
            disabled={!isPlaying}
          />
          <button className={styles.newGameBtn} onClick={initGame}>
            New Puzzle
          </button>
        </div>
      </div>
    </div>
  );
}
