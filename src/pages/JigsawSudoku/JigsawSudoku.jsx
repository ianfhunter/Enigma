import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { formatTime } from '../../data/wordUtils';
import styles from './JigsawSudoku.module.css';

const GRID_SIZE = 9;
const REGIONS_COUNT = 9;

// Generate irregular regions for Jigsaw Sudoku (9 regions of 9 cells each)
function generateRegions() {
  const regions = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(-1));
  const regionCells = {};
  
  // Generate regions using a flood-fill approach, ensuring exactly 9 cells per region
  // Start with all positions
  const positions = [];
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      positions.push([r, c]);
    }
  }
  
  // Shuffle positions
  for (let i = positions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [positions[i], positions[j]] = [positions[j], positions[i]];
  }
  
  let regionId = 0;
  let posIndex = 0;
  
  // Create 9 regions, each with exactly 9 cells
  for (let region = 0; region < 9; region++) {
    const cells = [];
    
    // Start with first available position
    while (posIndex < positions.length && regions[positions[posIndex][0]][positions[posIndex][1]] !== -1) {
      posIndex++;
    }
    
    if (posIndex >= positions.length) break;
    
    const [startR, startC] = positions[posIndex];
    cells.push([startR, startC]);
    regions[startR][startC] = regionId;
    posIndex++;
    
    // Grow region to 9 cells by finding adjacent empty cells
    while (cells.length < 9) {
      let found = false;
      const frontiers = [];
      
      // Collect all frontier cells (adjacent to region but not in it)
      for (const [cr, cc] of cells) {
        const neighbors = [[cr-1,cc], [cr+1,cc], [cr,cc-1], [cr,cc+1]];
        for (const [nr, nc] of neighbors) {
          if (nr >= 0 && nr < GRID_SIZE && nc >= 0 && nc < GRID_SIZE && 
              regions[nr][nc] === -1 && !cells.some(([r,c]) => r === nr && c === nc)) {
            if (!frontiers.some(([r,c]) => r === nr && c === nc)) {
              frontiers.push([nr, nc]);
            }
          }
        }
      }
      
      if (frontiers.length === 0) {
        // Can't grow - use any remaining empty cell
        for (let i = 0; i < positions.length; i++) {
          const [r, c] = positions[i];
          if (regions[r][c] === -1) {
            cells.push([r, c]);
            regions[r][c] = regionId;
            found = true;
            break;
          }
        }
        if (!found) break;
      } else {
        // Pick random frontier cell
        const [nr, nc] = frontiers[Math.floor(Math.random() * frontiers.length)];
        cells.push([nr, nc]);
        regions[nr][nc] = regionId;
        found = true;
      }
      
      if (!found) break;
    }
    
    regionCells[regionId] = cells;
    regionId++;
  }
  
  // Fill any remaining -1 cells (shouldn't happen, but safety)
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (regions[r][c] === -1) {
        // Assign to region 0 (shouldn't happen)
        regions[r][c] = 0;
        regionCells[0].push([r, c]);
      }
    }
  }
  
  return { regions, regionCells };
}

// Generate a solved Sudoku grid with irregular regions
function generateSolvedGrid(regions) {
  const grid = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(0));
  let attempts = 0;
  const maxAttempts = 10000; // Limit attempts to prevent infinite loops

  function isValid(grid, row, col, num, regions) {
    // Check row
    for (let x = 0; x < GRID_SIZE; x++) {
      if (x !== col && grid[row][x] === num) return false;
    }
    // Check column
    for (let x = 0; x < GRID_SIZE; x++) {
      if (x !== row && grid[x][col] === num) return false;
    }
    // Check irregular region
    const regionId = regions[row][col];
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        if (regions[r][c] === regionId && (r !== row || c !== col) && grid[r][c] === num) {
          return false;
        }
      }
    }
    return true;
  }

  function solve(grid, regions) {
    attempts++;
    if (attempts > maxAttempts) return false; // Timeout to prevent hanging
    
    // Find cells with fewest possibilities first (heuristic to speed up solving)
    let minRow = -1, minCol = -1, minPossibilities = 10;
    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE; col++) {
        if (grid[row][col] === 0) {
          let count = 0;
          for (let num = 1; num <= 9; num++) {
            if (isValid(grid, row, col, num, regions)) count++;
          }
          if (count < minPossibilities) {
            minPossibilities = count;
            minRow = row;
            minCol = col;
          }
        }
      }
    }
    
    if (minRow === -1) return true; // Grid is filled
    
    const row = minRow;
    const col = minCol;
    
    const nums = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    for (let i = nums.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [nums[i], nums[j]] = [nums[j], nums[i]];
    }
    
    for (const num of nums) {
      if (isValid(grid, row, col, num, regions)) {
        grid[row][col] = num;
        if (solve(grid, regions)) return true;
        grid[row][col] = 0;
      }
    }
    return false;
  }

  const solved = solve(grid, regions);
  
  // If solving failed, try regenerating with fewer constraints or use a fallback
  if (!solved || attempts > maxAttempts) {
    // Fallback: use standard Sudoku solver and then validate regions
    // Or just return a valid standard Sudoku (will have errors but won't hang)
    return generateStandardSudoku();
  }
  
  return grid;
}

// Fallback: generate a standard Sudoku (doesn't satisfy irregular regions, but won't hang)
function generateStandardSudoku() {
  const grid = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(0));
  
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

// Check if placing a number is valid
function isValidSudokuPlacement(grid, row, col, num, regions) {
  // Check row
  for (let x = 0; x < GRID_SIZE; x++) {
    if (x !== col && grid[row][x] === num) return false;
  }
  // Check column
  for (let x = 0; x < GRID_SIZE; x++) {
    if (x !== row && grid[x][col] === num) return false;
  }
  // Check irregular region
  const regionId = regions[row][col];
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (regions[r][c] === regionId && (r !== row || c !== col) && grid[r][c] === num) {
        return false;
      }
    }
  }
  return true;
}

function generatePuzzle() {
  // Try generating up to 5 times to get a solvable puzzle
  for (let attempt = 0; attempt < 5; attempt++) {
    const { regions, regionCells } = generateRegions();
    const solution = generateSolvedGrid(regions);
    
    // Verify solution is complete
    let isValid = true;
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        if (solution[r][c] === 0) {
          isValid = false;
          break;
        }
      }
      if (!isValid) break;
    }
    
    if (!isValid) continue; // Try again with different regions
    
    // Create puzzle by removing cells
    const puzzle = solution.map(row => [...row]);
  
    // Remove 40-50 cells
    const positions = [];
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        positions.push([r, c]);
      }
    }
    
    for (let i = positions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [positions[i], positions[j]] = [positions[j], positions[i]];
    }
    
    const toRemove = 40 + Math.floor(Math.random() * 11);
    for (let i = 0; i < toRemove; i++) {
      const [r, c] = positions[i];
      puzzle[r][c] = 0;
    }
    
    // Validate that the puzzle doesn't have duplicates in regions
    const regionErrors = validatePuzzleRegions(puzzle, regions);
    if (regionErrors.size > 0) {
      // If there are region duplicates, try removing more cells from those regions
      // For now, just continue to next attempt
      continue;
    }
    
    return { puzzle, solution, regions, regionCells };
  }
  
  // If all attempts failed, return a fallback puzzle
  const { regions, regionCells } = generateRegions();
  const solution = generateStandardSudoku();
  const puzzle = solution.map(row => [...row]);
  const toRemove = 45;
  const positions = [];
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      positions.push([r, c]);
    }
  }
  for (let i = positions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [positions[i], positions[j]] = [positions[j], positions[i]];
  }
  for (let i = 0; i < toRemove; i++) {
    const [r, c] = positions[i];
    puzzle[r][c] = 0;
  }
  
  // Validate that the fallback puzzle doesn't have duplicates in regions
  const regionErrors = validatePuzzleRegions(puzzle, regions);
  if (regionErrors.size > 0) {
    // Remove cells from regions with duplicates
    for (const errorKey of regionErrors) {
      const [r, c] = errorKey.split(',').map(Number);
      puzzle[r][c] = 0;
    }
  }
  
  return { puzzle, solution, regions, regionCells };
}

function checkValidity(grid, solution, regions) {
  const errors = new Set();

  // Only check for rule violations (duplicates), not against solution
  // Solution checking is done separately in checkSolved()
  
  // Validate regions array
  if (!regions || !Array.isArray(regions)) {
    // If no regions provided, skip region checks but still check row/column duplicates
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        if (grid[r][c] === 0) continue;

        // Check row for duplicates
        for (let x = 0; x < GRID_SIZE; x++) {
          if (x !== c && grid[r][x] === grid[r][c]) {
            errors.add(`${r},${c}`);
            errors.add(`${r},${x}`);
          }
        }

        // Check column for duplicates
        for (let x = 0; x < GRID_SIZE; x++) {
          if (x !== r && grid[x][c] === grid[r][c]) {
            errors.add(`${r},${c}`);
            errors.add(`${x},${c}`);
          }
        }
      }
    }
    return errors;
  }

  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (grid[r][c] === 0) continue;
      if (!grid[r] || grid[r][c] === undefined) continue;

      // Check row for duplicates
      for (let x = 0; x < GRID_SIZE; x++) {
        if (x !== c && grid[r][x] === grid[r][c]) {
          errors.add(`${r},${c}`);
          errors.add(`${r},${x}`);
        }
      }

      // Check column for duplicates
      for (let x = 0; x < GRID_SIZE; x++) {
        if (x !== r && grid[x] && grid[x][c] === grid[r][c]) {
          errors.add(`${r},${c}`);
          errors.add(`${x},${c}`);
        }
      }

      // Check irregular region for duplicates
      if (regions[r] && regions[r][c] !== undefined && regions[r][c] !== -1) {
        const regionId = regions[r][c];
        for (let nr = 0; nr < GRID_SIZE; nr++) {
          if (!regions[nr]) continue;
          for (let nc = 0; nc < GRID_SIZE; nc++) {
            if (regions[nr][nc] === regionId && (nr !== r || nc !== c) && grid[nr] && grid[nr][nc] === grid[r][c]) {
              errors.add(`${r},${c}`);
              errors.add(`${nr},${nc}`);
            }
          }
        }
      }
    }
  }

  return errors;
}

// Validate that puzzle doesn't have duplicates in regions (for initial puzzle state)
function validatePuzzleRegions(puzzle, regions) {
  const errors = new Set();
  
  // Check each region for duplicates
  const regionValues = {};
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      const regionId = regions[r][c];
      const value = puzzle[r][c];
      if (value === 0) continue;
      
      if (!regionValues[regionId]) {
        regionValues[regionId] = [];
      }
      
      // Check if this value already exists in this region
      for (const [otherR, otherC] of regionValues[regionId]) {
        if (puzzle[otherR][otherC] === value) {
          errors.add(`${r},${c}`);
          errors.add(`${otherR},${otherC}`);
        }
      }
      
      regionValues[regionId].push([r, c]);
    }
  }
  
  return errors;
}

function checkSolved(grid, solution) {
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (grid[r][c] !== solution[r][c]) return false;
    }
  }
  return true;
}

export {
  generateRegions,
  generateSolvedGrid,
  isValidSudokuPlacement,
  generatePuzzle,
  checkValidity,
  checkSolved,
  validatePuzzleRegions,
};

// Load dataset
let datasetCache = null;
let loadingPromise = null;

async function loadDataset() {
  if (datasetCache) return datasetCache;
  if (loadingPromise) return loadingPromise;

  loadingPromise = fetch('/datasets/jigsawSudokuPuzzles.json')
    .then(res => {
      if (!res.ok) throw new Error(`Failed to load Jigsaw Sudoku puzzles: ${res.status}`);
      return res.json();
    })
    .then(data => {
      datasetCache = data.puzzles || [];
      return datasetCache;
    })
    .catch(err => {
      console.error('Failed to load Jigsaw Sudoku dataset:', err);
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
    regions: puzzle.regions || [],
    regionCells: puzzle.regionCells || {},
  };
}

export default function JigsawSudoku() {
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
      ? checkValidity(grid, puzzleData.solution, puzzleData.regions)
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

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Link to="/" className={styles.backLink}>← Back to Games</Link>
        <h1 className={styles.title}>Jigsaw Sudoku</h1>
        <p className={styles.instructions}>
          Standard Sudoku rules apply. Each colored region must contain digits 1-9.
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
                  const regionId = puzzleData.regions[r][c];
                  const regionColor = `hsl(${(regionId * 40) % 360}, 60%, 25%)`;

                  return (
                    <div
                      key={c}
                      className={`
                        ${styles.cell}
                        ${isGiven ? styles.given : ''}
                        ${isSelected ? styles.selected : ''}
                        ${hasError ? styles.error : ''}
                      `}
                      style={{ backgroundColor: `rgba(${Math.sin(regionId) * 50 + 100}, ${Math.cos(regionId) * 50 + 100}, ${regionId * 30}, 0.15)` }}
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
            <div className={styles.winEmoji}>🧩</div>
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
