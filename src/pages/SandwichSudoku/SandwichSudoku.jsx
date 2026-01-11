import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { formatTime } from '../../data/wordUtils';
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
    const col = [];
    for (let r = 0; r < 9; r++) {
      col.push(solution[r][c]);
    }
    colClues.push(calculateSandwichSum(col));
  }
  
  return { rowClues, colClues };
}

function generatePuzzle() {
  const solution = generateSolvedGrid();
  const { rowClues, colClues } = generateClues(solution);
  
  // Create puzzle by removing some cells
  const puzzle = solution.map(row => [...row]);
  const positions = [];
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      positions.push([r, c]);
    }
  }
  
  // Shuffle and remove ~50 cells
  for (let i = positions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [positions[i], positions[j]] = [positions[j], positions[i]];
  }
  
  for (let i = 0; i < 50; i++) {
    const [r, c] = positions[i];
    puzzle[r][c] = 0;
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

export default function SandwichSudoku() {
  const [puzzleData, setPuzzleData] = useState(null);
  const [grid, setGrid] = useState([]);
  const [selectedCell, setSelectedCell] = useState(null);
  const [gameState, setGameState] = useState('playing');
  const [errors, setErrors] = useState(new Set());
  const [showErrors, setShowErrors] = useState(true);
  const [timer, setTimer] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const timerRef = useRef(null);

  const initGame = useCallback(() => {
    const data = generatePuzzle();
    setPuzzleData(data);
    setGrid(data.puzzle.map(row => [...row]));
    setSelectedCell(null);
    setGameState('playing');
    setErrors(new Set());
    setTimer(0);
    setIsRunning(true);
  }, []);

  useEffect(() => {
    initGame();
  }, [initGame]);

  useEffect(() => {
    if (isRunning && gameState === 'playing') {
      timerRef.current = setInterval(() => {
        setTimer(t => t + 1);
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [isRunning, gameState]);

  useEffect(() => {
    if (!puzzleData) return;

    const newErrors = showErrors 
      ? checkValidity(grid, puzzleData.solution)
      : new Set();
    setErrors(newErrors);

    if (checkSolved(grid, puzzleData.solution)) {
      setGameState('won');
      setIsRunning(false);
    }
  }, [grid, puzzleData, showErrors]);

  const handleCellClick = (r, c) => {
    if (gameState !== 'playing') return;
    if (puzzleData.puzzle[r][c] !== 0) return;
    setSelectedCell({ row: r, col: c });
  };

  const handleNumberInput = (num) => {
    if (!selectedCell || gameState !== 'playing') return;
    const { row, col } = selectedCell;
    if (puzzleData.puzzle[row][col] !== 0) return;
    
    setGrid(prev => {
      const newGrid = prev.map(r => [...r]);
      newGrid[row][col] = num;
      return newGrid;
    });
  };

  const handleClear = () => {
    if (!selectedCell || gameState !== 'playing') return;
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
      if (!selectedCell || gameState !== 'playing') return;

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
      <div className={styles.header}>
        <Link to="/" className={styles.backLink}>← Back to Games</Link>
        <h1 className={styles.title}>Sandwich Sudoku</h1>
        <p className={styles.instructions}>
          Standard Sudoku rules apply. Clues outside the grid show the sum of digits
          between 1 and 9 in that row/column.
        </p>
      </div>

      <div className={styles.gameArea}>
        <div className={styles.timerDisplay}>
          <span className={styles.timerIcon}>⏱</span>
          <span>{formatTime(timer)}</span>
        </div>

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
          <div className={styles.winMessage}>
            <div className={styles.winEmoji}>🥪</div>
            <h3>Puzzle Solved!</h3>
            <p>Completed in {formatTime(timer)}</p>
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
          <button className={styles.resetBtn} onClick={() => {
            setGrid(puzzleData.puzzle.map(row => [...row]));
            setGameState('playing');
            setTimer(0);
            setIsRunning(true);
          }}>
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
