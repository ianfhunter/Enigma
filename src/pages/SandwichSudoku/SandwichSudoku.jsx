import { useTranslation } from 'react-i18next';
import { useState, useEffect, useCallback, useRef } from 'react';
import GameHeader from '../../components/GameHeader';
import Timer from '../../components/Timer';
import GiveUpButton from '../../components/GiveUpButton';
import GameResult from '../../components/GameResult';
import { useGameState } from '../../hooks/useGameState';
import styles from './SandwichSudoku.module.css';

// Generate a valid solved Sudoku grid
function generateSolvedGrid() {
  const grid = Array(9).fill(null).map(() => Array(9).fill(0));

  function isValid(grid, row, col, num) {
    for (let x = 0; x < 9; x++) {
      if (grid[row][x] === num || grid[x][col] === num) return false;
    }
    const boxRow = Math.floor(row / 3) * 3;
    const boxCol = Math.floor(col / 3) * 3;
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        if (grid[boxRow + i][boxCol + j] === num) return false;
      }
    }
    return true;
  }

  function solve(grid) {
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        if (grid[row][col] === 0) {
          const nums = [1, 2, 3, 4, 5, 6, 7, 8, 9];
          for (let i = nums.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [nums[i], nums[j]] = [nums[j], nums[i]];
          }
          for (const num of nums) {
            if (isValid(grid, row, col, num)) {
              grid[row][col] = num;
              if (solve(grid)) return true;
              grid[row][col] = 0;
            }
          }
          return false;
        }
      }
    }
    return true;
  }

  solve(grid);
  return grid;
}

// Get a column as an array
function getColumn(grid, c) {
  const col = [];
  for (let r = 0; r < 9; r++) {
    col.push(grid[r][c]);
  }
  return col;
}

// Calculate sandwich sum for a row or column
function calculateSandwichSum(line) {
  const pos1 = line.indexOf(1);
  const pos9 = line.indexOf(9);

  if (pos1 === -1 || pos9 === -1) return 0;

  const start = Math.min(pos1, pos9);
  const end = Math.max(pos1, pos9);

  let sum = 0;
  for (let i = start + 1; i < end; i++) {
    sum += line[i];
  }

  return sum;
}

// Check if a partially filled line can still satisfy the sandwich constraint
function canSandwichBeSatisfied(line, targetSum) {
  const pos1 = line.indexOf(1);
  const pos9 = line.indexOf(9);

  // If line is complete, check exact sum
  if (!line.includes(0)) {
    return calculateSandwichSum(line) === targetSum;
  }

  // If both 1 and 9 are placed
  if (pos1 !== -1 && pos9 !== -1) {
    const start = Math.min(pos1, pos9);
    const end = Math.max(pos1, pos9);

    // Calculate current sum and count empty cells between 1 and 9
    let currentSum = 0;
    let emptyCount = 0;
    const usedDigits = new Set(line.filter(x => x !== 0));

    for (let i = start + 1; i < end; i++) {
      if (line[i] === 0) {
        emptyCount++;
      } else {
        currentSum += line[i];
      }
    }

    // If no empty cells between, sum must match
    if (emptyCount === 0) {
      return currentSum === targetSum;
    }

    // Calculate min/max possible sums with remaining digits
    const availableDigits = [2, 3, 4, 5, 6, 7, 8].filter(d => !usedDigits.has(d));
    availableDigits.sort((a, b) => a - b);

    const needed = targetSum - currentSum;

    // Check if we can make the needed sum with emptyCount digits from available
    if (emptyCount > availableDigits.length) return true; // Can't fill, allow for now

    const minPossible = availableDigits.slice(0, emptyCount).reduce((a, b) => a + b, 0);
    const maxPossible = availableDigits.slice(-emptyCount).reduce((a, b) => a + b, 0);

    return needed >= minPossible && needed <= maxPossible;
  }

  // If neither or only one of 1/9 is placed, allow (too many possibilities)
  return true;
}

// Check if placing a number is valid (standard Sudoku rules)
function isValidSudokuPlacement(grid, row, col, num) {
  // Check row
  for (let x = 0; x < 9; x++) {
    if (x !== col && grid[row][x] === num) return false;
  }
  // Check column
  for (let x = 0; x < 9; x++) {
    if (x !== row && grid[x][col] === num) return false;
  }
  // Check box
  const boxRow = Math.floor(row / 3) * 3;
  const boxCol = Math.floor(col / 3) * 3;
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      const r = boxRow + i;
      const c = boxCol + j;
      if ((r !== row || c !== col) && grid[r][c] === num) return false;
    }
  }
  return true;
}

// Count solutions using backtracking with sandwich constraint validation
function countSolutions(grid, rowClues, colClues, limit = 2) {
  // Find first empty cell
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (grid[r][c] === 0) {
        let count = 0;
        for (let num = 1; num <= 9; num++) {
          if (!isValidSudokuPlacement(grid, r, c, num)) continue;

          // Place the number
          grid[r][c] = num;

          // Check sandwich constraints for this row and column
          const rowValid = canSandwichBeSatisfied(grid[r], rowClues[r]);
          const colValid = canSandwichBeSatisfied(getColumn(grid, c), colClues[c]);

          if (rowValid && colValid) {
            count += countSolutions(grid, rowClues, colClues, limit - count);
            if (count >= limit) {
              grid[r][c] = 0;
              return count;
            }
          }

          grid[r][c] = 0;
        }
        return count;
      }
    }
  }

  // No empty cells - this is a complete valid solution
  return 1;
}

// Generate sandwich clues
function generateClues(solution) {
  const rowClues = [];
  const colClues = [];

  // Row clues
  for (let r = 0; r < 9; r++) {
    rowClues.push(calculateSandwichSum(solution[r]));
  }

  // Column clues
  for (let c = 0; c < 9; c++) {
    colClues.push(calculateSandwichSum(getColumn(solution, c)));
  }

  return { rowClues, colClues };
}

// Shuffle array in place
function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function generatePuzzle() {
  const solution = generateSolvedGrid();
  const { rowClues, colClues } = generateClues(solution);

  // Create puzzle starting with full solution
  const puzzle = solution.map(row => [...row]);

  // Get all positions and shuffle them
  const positions = [];
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      positions.push([r, c]);
    }
  }
  shuffle(positions);

  // Try to remove each cell, keeping only if puzzle remains uniquely solvable
  let removed = 0;
  const maxToRemove = 55; // Try to remove up to this many cells

  for (const [r, c] of positions) {
    if (removed >= maxToRemove) break;

    const backup = puzzle[r][c];
    puzzle[r][c] = 0;

    // Make a copy to test with (countSolutions modifies the grid)
    const testGrid = puzzle.map(row => [...row]);
    const solutions = countSolutions(testGrid, rowClues, colClues, 2);

    if (solutions !== 1) {
      // Multiple solutions or unsolvable - restore the cell
      puzzle[r][c] = backup;
    } else {
      removed++;
    }
  }

  return { puzzle, solution, rowClues, colClues };
}

function checkValidity(grid, solution) {
  const errors = new Set();

  // Check standard Sudoku rules
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (grid[r][c] === 0) continue;

      // Check row
      for (let x = 0; x < 9; x++) {
        if (x !== c && grid[r][x] === grid[r][c]) {
          errors.add(`${r},${c}`);
          errors.add(`${r},${x}`);
        }
      }

      // Check column
      for (let x = 0; x < 9; x++) {
        if (x !== r && grid[x][c] === grid[r][c]) {
          errors.add(`${r},${c}`);
          errors.add(`${x},${c}`);
        }
      }

      // Check box
      const boxRow = Math.floor(r / 3) * 3;
      const boxCol = Math.floor(c / 3) * 3;
      for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
          const nr = boxRow + i;
          const nc = boxCol + j;
          if ((nr !== r || nc !== c) && grid[nr][nc] === grid[r][c]) {
            errors.add(`${r},${c}`);
            errors.add(`${nr},${nc}`);
          }
        }
      }
    }
  }

  return errors;
}

function checkSolved(grid, solution) {
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (grid[r][c] !== solution[r][c]) return false;
    }
  }
  return true;
}

// Export helpers for testing
export {
  generateSolvedGrid,
  getColumn,
  calculateSandwichSum,
  canSandwichBeSatisfied,
  isValidSudokuPlacement,
  countSolutions,
  generateClues,
  generatePuzzle,
  checkValidity,
  checkSolved,
};

export default function SandwichSudoku() {
  const [puzzleData, setPuzzleData] = useState(null);
  const [grid, setGrid] = useState([]);
  const [selectedCell, setSelectedCell] = useState(null);
  const { gameState, checkWin, giveUp, reset: resetGameState, isPlaying } = useGameState();
  const [errors, setErrors] = useState(new Set());
  const [showErrors, setShowErrors] = useState(false);
  const [timer, setTimer] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const timerRef = useRef(null);

  const initGame = useCallback(() => {
    const data = generatePuzzle();
    setPuzzleData(data);
    setGrid(data.puzzle.map(row => [...row]));
    setSelectedCell(null);
    resetGameState();
    setErrors(new Set());
    setTimer(0);
    setIsRunning(true);
  }, [resetGameState]);

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
      ? checkValidity(grid, puzzleData.solution)
      : new Set();
    setErrors(newErrors);

    if (checkSolved(grid, puzzleData.solution)) {
      checkWin(true);
      setIsRunning(false);
    }
  }, [grid, puzzleData, showErrors, isPlaying, checkWin]);

  const handleCellClick = (r, c) => {
    if (!isPlaying) return;
    if (puzzleData.puzzle[r][c] !== 0) return;
    setSelectedCell({ row: r, col: c });
  };

  const handleNumberInput = (num) => {
    if (!selectedCell || !isPlaying) return;
    const { row, col } = selectedCell;
    if (puzzleData.puzzle[row][col] !== 0) return;

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
    setIsRunning(false);
  };

  const handleClear = () => {
    if (!selectedCell || !isPlaying) return;
    const { row, col } = selectedCell;
    if (puzzleData.puzzle[row][col] !== 0) return;

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
      if (num >= 1 && num <= 9) {
        handleNumberInput(num);
      } else if (e.key === 'Backspace' || e.key === 'Delete' || e.key === '0') {
        handleClear();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedCell, gameState]);

  if (!puzzleData) return null;

  return (
    <div className={styles.container}>
      <GameHeader
        title="Sandwich Sudoku"
        instructions="Standard Sudoku rules apply. Clues outside the grid show the sum of digits sandwiched between 1 and 9 in that row/column. A clue of 0 means the 1 and 9 are adjacent."
      />

      <div className={styles.gameArea}>
        <Timer seconds={timer} />

        <div className={styles.boardWrapper}>
          {/* Top clues */}
          <div className={styles.topClues}>
            <div className={styles.clueCorner}></div>
            {puzzleData.colClues.map((clue, c) => (
              <div key={c} className={styles.clue}>{clue}</div>
            ))}
          </div>

          <div className={styles.mainArea}>
            {/* Left clues */}
            <div className={styles.leftClues}>
              {puzzleData.rowClues.map((clue, r) => (
                <div key={r} className={styles.clue}>{clue}</div>
              ))}
            </div>

            {/* Board */}
            <div className={styles.board}>
              {grid.map((row, r) => (
                <div key={r} className={styles.row}>
                  {row.map((cell, c) => {
                    const isGiven = puzzleData.puzzle[r][c] !== 0;
                    const isSelected = selectedCell?.row === r && selectedCell?.col === c;
                    const hasError = errors.has(`${r},${c}`);

                    return (
                      <div
                        key={c}
                        className={`
                          ${styles.cell}
                          ${isGiven ? styles.given : ''}
                          ${isSelected ? styles.selected : ''}
                          ${hasError ? styles.error : ''}
                          ${(c + 1) % 3 === 0 && c !== 8 ? styles.boxRight : ''}
                          ${(r + 1) % 3 === 0 && r !== 8 ? styles.boxBottom : ''}
                        `}
                        onClick={() => handleCellClick(r, c)}
                      >
                        {cell !== 0 && <span className={styles.cellValue}>{cell}</span>}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className={styles.numberPad}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
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
            title="🥪 Puzzle Solved!"
            message={`Completed in ${Math.floor(timer / 60)}:${String(timer % 60).padStart(2, '0')}`}
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

        <div className={styles.buttons}>
          <button className={styles.resetBtn} onClick={() => {
            setGrid(puzzleData.puzzle.map(row => [...row]));
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
