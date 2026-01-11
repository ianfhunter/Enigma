import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { formatTime } from '../../data/wordUtils';
import styles from './KillerSudoku.module.css';

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

// Generate cages for Killer Sudoku
function generateCages(solution) {
  const cages = [];
  const cageGrid = Array(9).fill(null).map(() => Array(9).fill(-1));
  
  // Start from each cell and grow cages
  let cageId = 0;
  
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (cageGrid[r][c] !== -1) continue;
      
      // Start a new cage
      const cageSize = 2 + Math.floor(Math.random() * 3); // 2-4 cells
      const cells = [[r, c]];
      cageGrid[r][c] = cageId;
      
      // Grow the cage
      for (let i = 1; i < cageSize; i++) {
        const frontier = [];
        for (const [cr, cc] of cells) {
          for (const [nr, nc] of [[cr-1, cc], [cr+1, cc], [cr, cc-1], [cr, cc+1]]) {
            if (nr >= 0 && nr < 9 && nc >= 0 && nc < 9 && cageGrid[nr][nc] === -1) {
              if (!frontier.some(([fr, fc]) => fr === nr && fc === nc)) {
                frontier.push([nr, nc]);
              }
            }
          }
        }
        
        if (frontier.length === 0) break;
        
        const [nr, nc] = frontier[Math.floor(Math.random() * frontier.length)];
        cells.push([nr, nc]);
        cageGrid[nr][nc] = cageId;
      }
      
      // Calculate sum
      let sum = 0;
      for (const [cr, cc] of cells) {
        sum += solution[cr][cc];
      }
      
      cages.push({ id: cageId, cells, sum });
      cageId++;
    }
  }
  
  return { cages, cageGrid };
}

function generatePuzzle() {
  const solution = generateSolvedGrid();
  const { cages, cageGrid } = generateCages(solution);
  
  return { solution, cages, cageGrid };
}

function checkValidity(grid, cages, _solution) {
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
  
  // Check cage constraints
  for (const cage of cages) {
    let sum = 0;
    let allFilled = true;
    const values = new Set();
    let hasDuplicate = false;
    
    for (const [r, c] of cage.cells) {
      if (grid[r][c] === 0) {
        allFilled = false;
      } else {
        if (values.has(grid[r][c])) {
          hasDuplicate = true;
        }
        values.add(grid[r][c]);
        sum += grid[r][c];
      }
    }
    
    // Error if sum exceeds target or duplicates in cage
    if (sum > cage.sum || hasDuplicate) {
      for (const [r, c] of cage.cells) {
        if (grid[r][c] !== 0) {
          errors.add(`${r},${c}`);
        }
      }
    }
    
    // Error if all filled but sum wrong
    if (allFilled && sum !== cage.sum) {
      for (const [r, c] of cage.cells) {
        errors.add(`${r},${c}`);
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

// Get border classes for cage visualization
function getCageBorders(r, c, cageGrid) {
  const cageId = cageGrid[r][c];
  const borders = [];
  
  if (r === 0 || cageGrid[r-1][c] !== cageId) borders.push('top');
  if (r === 8 || cageGrid[r+1][c] !== cageId) borders.push('bottom');
  if (c === 0 || cageGrid[r][c-1] !== cageId) borders.push('left');
  if (c === 8 || cageGrid[r][c+1] !== cageId) borders.push('right');
  
  return borders;
}

export default function KillerSudoku() {
  const [puzzleData, setPuzzleData] = useState(null);
  const [grid, setGrid] = useState([]);
  const [notes, setNotes] = useState({});
  const [selectedCell, setSelectedCell] = useState(null);
  const [notesMode, setNotesMode] = useState(false);
  const [gameState, setGameState] = useState('playing');
  const [errors, setErrors] = useState(new Set());
  const [showErrors, setShowErrors] = useState(true);
  const [timer, setTimer] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const timerRef = useRef(null);

  const initGame = useCallback(() => {
    const data = generatePuzzle();
    setPuzzleData(data);
    setGrid(Array(9).fill(null).map(() => Array(9).fill(0)));
    setNotes({});
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
      ? checkValidity(grid, puzzleData.cages, puzzleData.solution)
      : new Set();
    setErrors(newErrors);

    if (checkSolved(grid, puzzleData.solution)) {
      setGameState('won');
      setIsRunning(false);
    }
  }, [grid, puzzleData, showErrors]);

  const handleCellClick = (r, c) => {
    if (gameState !== 'playing') return;
    setSelectedCell({ row: r, col: c });
  };

  const handleNumberInput = (num) => {
    if (!selectedCell || gameState !== 'playing') return;
    const { row, col } = selectedCell;
    const key = `${row},${col}`;

    if (notesMode) {
      setNotes(prev => {
        const cellNotes = prev[key] || new Set();
        const newNotes = new Set(cellNotes);
        if (newNotes.has(num)) {
          newNotes.delete(num);
        } else {
          newNotes.add(num);
        }
        return { ...prev, [key]: newNotes };
      });
    } else {
      setGrid(prev => {
        const newGrid = prev.map(r => [...r]);
        newGrid[row][col] = num;
        return newGrid;
      });
      setNotes(prev => {
        const newNotes = { ...prev };
        delete newNotes[key];
        return newNotes;
      });
    }
  };

  const handleClear = () => {
    if (!selectedCell || gameState !== 'playing') return;
    const { row, col } = selectedCell;
    const key = `${row},${col}`;

    setGrid(prev => {
      const newGrid = prev.map(r => [...r]);
      newGrid[row][col] = 0;
      return newGrid;
    });
    setNotes(prev => {
      const newNotes = { ...prev };
      delete newNotes[key];
      return newNotes;
    });
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!selectedCell || gameState !== 'playing') return;

      if (e.key >= '1' && e.key <= '9') {
        handleNumberInput(parseInt(e.key));
      } else if (e.key === 'Backspace' || e.key === 'Delete' || e.key === '0') {
        handleClear();
      } else if (e.key === 'n' || e.key === 'N') {
        setNotesMode(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedCell, gameState, notesMode]);

  if (!puzzleData) return null;

  // Create a map of cage sums for display
  const cageSumPositions = {};
  for (const cage of puzzleData.cages) {
    // Find top-left cell of cage
    let minR = 9, minC = 9;
    for (const [r, c] of cage.cells) {
      if (r < minR || (r === minR && c < minC)) {
        minR = r;
        minC = c;
      }
    }
    cageSumPositions[`${minR},${minC}`] = cage.sum;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Link to="/" className={styles.backLink}>← Back to Games</Link>
        <h1 className={styles.title}>Killer Sudoku</h1>
        <p className={styles.instructions}>
          Fill the grid 1-9. Standard Sudoku rules apply, plus: dotted cages must sum to the number shown,
          and no digit can repeat within a cage.
        </p>
      </div>

      <div className={styles.gameArea}>
        <div className={styles.timerDisplay}>
          <span className={styles.timerIcon}>⏱</span>
          <span>{formatTime(timer)}</span>
        </div>

        <div className={styles.board}>
          {Array(9).fill(null).map((_, r) => (
            <div key={r} className={styles.row}>
              {Array(9).fill(null).map((_, c) => {
                const value = grid[r][c];
                const key = `${r},${c}`;
                const cellNotes = notes[key];
                const isSelected = selectedCell?.row === r && selectedCell?.col === c;
                const hasError = errors.has(key);
                const borders = getCageBorders(r, c, puzzleData.cageGrid);
                const cageSum = cageSumPositions[key];

                return (
                  <div
                    key={c}
                    className={`
                      ${styles.cell}
                      ${isSelected ? styles.selected : ''}
                      ${hasError ? styles.error : ''}
                      ${borders.includes('top') ? styles.borderTop : ''}
                      ${borders.includes('bottom') ? styles.borderBottom : ''}
                      ${borders.includes('left') ? styles.borderLeft : ''}
                      ${borders.includes('right') ? styles.borderRight : ''}
                      ${(c + 1) % 3 === 0 && c !== 8 ? styles.boxRight : ''}
                      ${(r + 1) % 3 === 0 && r !== 8 ? styles.boxBottom : ''}
                    `}
                    onClick={() => handleCellClick(r, c)}
                  >
                    {cageSum && <span className={styles.cageSum}>{cageSum}</span>}
                    {value !== 0 ? (
                      <span className={styles.cellValue}>{value}</span>
                    ) : cellNotes && cellNotes.size > 0 ? (
                      <div className={styles.notes}>
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
                          <span key={n} className={styles.note}>
                            {cellNotes.has(n) ? n : ''}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          ))}
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
        </div>

        <div className={styles.actionButtons}>
          <button
            className={`${styles.actionBtn} ${notesMode ? styles.active : ''}`}
            onClick={() => setNotesMode(!notesMode)}
          >
            ✏️ Notes
          </button>
          <button className={styles.actionBtn} onClick={handleClear}>
            ⌫ Clear
          </button>
        </div>

        {gameState === 'won' && (
          <div className={styles.winMessage}>
            <div className={styles.winEmoji}>🎉</div>
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
            setGrid(Array(9).fill(null).map(() => Array(9).fill(0)));
            setNotes({});
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
