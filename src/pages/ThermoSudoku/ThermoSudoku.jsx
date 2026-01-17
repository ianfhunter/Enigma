import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { formatTime } from '../../data/wordUtils';
import styles from './ThermoSudoku.module.css';

const GRID_SIZE = 9;

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

// Thermometer constraint: digits must strictly increase from bulb to tip
// thermos: array of {cells: [[r, c], [r, c], ...]} where first is bulb
function checkThermoConstraints(grid, thermos) {
  const errors = new Set();
  
  for (const thermo of thermos) {
    if (thermo.cells.length < 2) continue;
    
    let prevValue = 0;
    for (let i = 0; i < thermo.cells.length; i++) {
      const [r, c] = thermo.cells[i];
      const value = grid[r][c];
      
      if (value === 0) {
        prevValue = 0; // Can't validate incomplete chain
        continue;
      }
      
      // Digits must strictly increase (value > prevValue)
      if (i > 0 && prevValue > 0 && value <= prevValue) {
        errors.add(`${r},${c}`);
        // Mark previous cell too if it's the violation point
        if (i > 0) {
          const [prevR, prevC] = thermo.cells[i - 1];
          errors.add(`${prevR},${prevC}`);
        }
      }
      
      prevValue = value;
    }
  }
  
  return errors;
}

// Generate simple thermometer constraints
function generateThermos(solution) {
  const thermos = [];
  const usedCells = new Set();
  
  // Generate 3-5 thermometers (more attempts to find valid ones)
  const numThermos = 3 + Math.floor(Math.random() * 3);
  const directions = [
    [-1, 0], [1, 0], [0, -1], [0, 1],  // up, down, left, right
    [-1, -1], [-1, 1], [1, -1], [1, 1]  // diagonals
  ];
  
  let foundThermos = 0;
  let totalAttempts = 0;
  const maxTotalAttempts = 500; // Prevent infinite loops
  
  while (foundThermos < numThermos && totalAttempts < maxTotalAttempts) {
    totalAttempts++;
    
    // Find a random starting cell
    let bulbR = Math.floor(Math.random() * 9);
    let bulbC = Math.floor(Math.random() * 9);
    
    if (usedCells.has(`${bulbR},${bulbC}`)) continue;
    
    // Try each direction
    const dirs = [...directions];
    for (let i = dirs.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [dirs[i], dirs[j]] = [dirs[j], dirs[i]];
    }
    
    for (const [dr, dc] of dirs) {
      const length = 3 + Math.floor(Math.random() * 3); // 3-5 cells
      const cells = [];
      let valid = true;
      
      // Build cell path
      for (let j = 0; j < length; j++) {
        const r = bulbR + dr * j;
        const c = bulbC + dc * j;
        
        if (r < 0 || r >= 9 || c < 0 || c >= 9 || usedCells.has(`${r},${c}`)) {
          valid = false;
          break;
        }
        
        cells.push([r, c]);
      }
      
      // Check if this creates a valid increasing sequence in the solution
      if (valid && cells.length >= 2) {
        const values = cells.map(([r, c]) => solution[r]?.[c] || 0);
        let isIncreasing = true;
        for (let k = 1; k < values.length; k++) {
          if (values[k] <= values[k - 1] || values[k] === 0) {
            isIncreasing = false;
            break;
          }
        }
        
        if (isIncreasing && values[0] > 0) {
          cells.forEach(([r, c]) => usedCells.add(`${r},${c}`));
          thermos.push({ cells });
          foundThermos++;
          break; // Found one, move to next thermo
        }
      }
    }
  }
  
  // Fallback: create at least one thermo even if not perfectly increasing
  if (thermos.length === 0) {
    // Create a simple vertical thermo
    const cells = [[4, 4], [3, 4], [2, 4]];
    thermos.push({ cells });
  }
  
  return thermos;
}

function generatePuzzle() {
  const solution = generateSolvedGrid();
  const thermos = generateThermos(solution);
  
  // Create puzzle by removing cells (but keep thermo cells visible)
  const puzzle = solution.map(row => [...row]);
  
  const thermoCells = new Set();
  thermos.forEach(thermo => {
    thermo.cells.forEach(([r, c]) => {
      thermoCells.add(`${r},${c}`);
    });
  });
  
  // Remove 40-50 cells (excluding thermo cells)
  const positions = [];
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (!thermoCells.has(`${r},${c}`)) {
        positions.push([r, c]);
      }
    }
  }
  
  for (let i = positions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [positions[i], positions[j]] = [positions[j], positions[i]];
  }
  
  const toRemove = 40 + Math.floor(Math.random() * 11);
  for (let i = 0; i < toRemove && i < positions.length; i++) {
    const [r, c] = positions[i];
    puzzle[r][c] = 0;
  }
  
  return { puzzle, solution, thermos };
}

function checkValidity(grid, solution, thermos) {
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

  // Check thermo constraints
  const thermoErrors = checkThermoConstraints(grid, thermos);
  thermoErrors.forEach(err => errors.add(err));

  return errors;
}

function checkSolved(grid, solution) {
  if (!solution) return false;
  
  // First check that all cells are filled (no zeros)
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (grid[r][c] === 0) return false;
    }
  }
  
  // Then check that all cells match the solution
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (grid[r][c] !== solution[r][c]) return false;
    }
  }
  return true;
}

export {
  generateSolvedGrid,
  isValidSudokuPlacement,
  checkThermoConstraints,
  generateThermos,
  generatePuzzle,
  checkValidity,
  checkSolved,
};

// Load dataset
let datasetCache = null;
let loadingPromise = null;

async function loadDataset() {
  if (datasetCache) return datasetCache;
  if (loadingPromise) return loadingPromise;

  loadingPromise = fetch('/datasets/thermoSudokuPuzzles.json')
    .then(res => {
      if (!res.ok) throw new Error(`Failed to load Thermo Sudoku puzzles: ${res.status}`);
      return res.json();
    })
    .then(data => {
      datasetCache = data.puzzles || [];
      return datasetCache;
    })
    .catch(err => {
      console.error('Failed to load Thermo Sudoku dataset:', err);
      datasetCache = [];
      return datasetCache;
    })
    .finally(() => {
      loadingPromise = null;
    });

  return loadingPromise;
}

// Convert dataset puzzle to game format
function datasetPuzzleToGameFormat(puzzle) {
  return {
    puzzle: puzzle.puzzle || [],
    solution: puzzle.solution || [],
    thermos: puzzle.thermos || [],
  };
}

export default function ThermoSudoku() {
  const [puzzleData, setPuzzleData] = useState(null);
  const [grid, setGrid] = useState([]);
  const [selectedCell, setSelectedCell] = useState(null);
  const [gameState, setGameState] = useState('playing');
  const [errors, setErrors] = useState(new Set());
  const [showErrors, setShowErrors] = useState(true);
  const [timer, setTimer] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [loading, setLoading] = useState(true);
  const timerRef = useRef(null);
  const datasetRef = useRef(null);

  // Load dataset on mount
  useEffect(() => {
    loadDataset().then(puzzles => {
      datasetRef.current = puzzles;
      setLoading(false);
    });
  }, []);

  const initGame = useCallback(() => {
    // Try to use dataset first
    if (datasetRef.current && datasetRef.current.length > 0) {
      const puzzle = datasetRef.current[Math.floor(Math.random() * datasetRef.current.length)];
      const data = datasetPuzzleToGameFormat(puzzle);
      setPuzzleData(data);
      setGrid(data.puzzle.map(row => [...row]));
    } else {
      // Fallback to generator
      const data = generatePuzzle();
      setPuzzleData(data);
      setGrid(data.puzzle.map(row => [...row]));
    }
    setSelectedCell(null);
    setGameState('playing');
    setErrors(new Set());
    setTimer(0);
    setIsRunning(true);
  }, []);

  useEffect(() => {
    if (!loading) {
      initGame();
    }
  }, [loading, initGame]);

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
    
    // Don't show errors when game is won or gave up
    if (gameState === 'won' || gameState === 'gaveUp') {
      setErrors(new Set());
      return;
    }

    const newErrors = showErrors
      ? checkValidity(grid, puzzleData.solution, puzzleData.thermos)
      : new Set();
    setErrors(newErrors);

    if (checkSolved(grid, puzzleData.solution)) {
      setGameState('won');
      setIsRunning(false);
    }
  }, [grid, puzzleData, showErrors, gameState]);

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

  const handleGiveUp = () => {
    if (!puzzleData || gameState !== 'playing') return;
    if (!puzzleData.solution || !Array.isArray(puzzleData.solution) || puzzleData.solution.length === 0) {
      console.error('Cannot give up: solution is missing or invalid');
      return;
    }
    setGrid(puzzleData.solution.map(row => [...row]));
    setGameState('gaveUp');
    setIsRunning(false);
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

  // Helper to check if cell is part of a thermo
  const getThermoInfo = (r, c) => {
    for (const thermo of puzzleData.thermos) {
      for (let i = 0; i < thermo.cells.length; i++) {
        const [pr, pc] = thermo.cells[i];
        if (pr === r && pc === c) {
          return { thermo, index: i, isBulb: i === 0 };
        }
      }
    }
    return null;
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Link to="/" className={styles.backLink}>← Back to Games</Link>
        <h1 className={styles.title}>Thermo Sudoku</h1>
        <p className={styles.instructions}>
          Standard Sudoku rules apply. Digits along thermometers must strictly increase from bulb to tip.
        </p>
      </div>

      <div className={styles.gameArea}>
        <div className={styles.timerDisplay}>
          <span className={styles.timerIcon}>⏱</span>
          <span>{formatTime(timer)}</span>
        </div>

        <div className={styles.boardWrapper}>
          <div className={styles.board}>
            {grid.map((row, r) => (
              <div key={r} className={styles.row}>
                {row.map((cell, c) => {
                  const isGiven = puzzleData.puzzle[r][c] !== 0;
                  const isSelected = selectedCell?.row === r && selectedCell?.col === c;
                  const hasError = errors.has(`${r},${c}`);
                  const thermoInfo = getThermoInfo(r, c);

                  return (
                    <div
                      key={c}
                      className={`
                        ${styles.cell}
                        ${isGiven ? styles.given : ''}
                        ${isSelected ? styles.selected : ''}
                        ${hasError ? styles.error : ''}
                        ${thermoInfo ? (thermoInfo.isBulb ? styles.thermoBulb : styles.thermoTube) : ''}
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
            
            {/* Render thermo lines using SVG overlay */}
            <svg className={styles.thermoOverlay} viewBox="0 0 360 360">
              {puzzleData.thermos.map((thermo, idx) => {
                if (thermo.cells.length < 2) return null;
                
                // Draw path through all cells
                const points = thermo.cells.map(([r, c]) => {
                  const x = (c + 0.5) * 40;
                  const y = (r + 0.5) * 40;
                  return `${x},${y}`;
                }).join(' ');
                
                return (
                  <g key={idx}>
                    {/* Bulb (circle at start) */}
                    <circle
                      cx={(thermo.cells[0][1] + 0.5) * 40}
                      cy={(thermo.cells[0][0] + 0.5) * 40}
                      r="12"
                      fill="#06b6d4"
                      opacity="0.3"
                      stroke="#06b6d4"
                      strokeWidth="3"
                    />
                    {/* Tube (polyline through all cells) */}
                    <polyline
                      points={points}
                      fill="none"
                      stroke="#06b6d4"
                      strokeWidth="4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </g>
                );
              })}
            </svg>
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
            <div className={styles.winEmoji}>🌡️</div>
            <h3>Puzzle Solved!</h3>
            <p>Completed in {formatTime(timer)}</p>
          </div>
        )}

        {gameState === 'gaveUp' && (
          <div className={styles.gaveUpMessage}>
            <span className={styles.gaveUpIcon}>📖</span>
            <span>Solution Revealed</span>
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
          <button
            className={styles.giveUpBtn}
            onClick={handleGiveUp}
            disabled={gameState !== 'playing'}
          >
            Give Up
          </button>
          <button className={styles.newBtn} onClick={initGame}>
            New Puzzle
          </button>
        </div>
      </div>
    </div>
  );
}
