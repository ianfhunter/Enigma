import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { formatTime } from '../../data/wordUtils';
import styles from './ArrowSudoku.module.css';

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

// Arrow constraint: sum of cells along arrow path equals cell in circle
// arrows: array of {circle: [r, c], path: [[r, c], [r, c], ...]}
function checkArrowConstraints(grid, arrows) {
  const errors = new Set();
  
  for (const arrow of arrows) {
    const [circleR, circleC] = arrow.circle;
    const circleValue = grid[circleR][circleC];
    
    if (circleValue === 0) continue; // Can't check if circle is empty
    
    let pathSum = 0;
    let allFilled = true;
    
    for (const [r, c] of arrow.path) {
      if (grid[r][c] === 0) {
        allFilled = false;
        break;
      }
      pathSum += grid[r][c];
    }
    
    // If path is fully filled, check sum
    if (allFilled && pathSum !== circleValue) {
      errors.add(`${circleR},${circleC}`);
      for (const [r, c] of arrow.path) {
        errors.add(`${r},${c}`);
      }
    }
  }
  
  return errors;
}

// Generate simple arrow constraints for a solved grid
function generateArrows(solution) {
  const arrows = [];
  
  // Generate 4-8 arrows randomly placed
  const numArrows = 4 + Math.floor(Math.random() * 5);
  const usedCells = new Set();
  
  for (let i = 0; i < numArrows; i++) {
    // Find a random cell not yet used
    let circleR, circleC;
    let attempts = 0;
    do {
      circleR = Math.floor(Math.random() * 9);
      circleC = Math.floor(Math.random() * 9);
      attempts++;
    } while (usedCells.has(`${circleR},${circleC}`) && attempts < 50);
    
    if (attempts >= 50) continue;
    
    usedCells.add(`${circleR},${circleC}`);
    
    // Create path: 2-4 cells going in a direction
    const directions = [
      [-1, -1], [-1, 0], [-1, 1],
      [0, -1], [0, 1],
      [1, -1], [1, 0], [1, 1]
    ];
    const [dr, dc] = directions[Math.floor(Math.random() * directions.length)];
    const pathLength = 2 + Math.floor(Math.random() * 3); // 2-4 cells
    
    const path = [];
    for (let j = 1; j <= pathLength; j++) {
      const r = circleR + dr * j;
      const c = circleC + dc * j;
      if (r >= 0 && r < 9 && c >= 0 && c < 9 && !usedCells.has(`${r},${c}`)) {
        path.push([r, c]);
        usedCells.add(`${r},${c}`);
      } else {
        break;
      }
    }
    
    if (path.length >= 2) {
      arrows.push({ circle: [circleR, circleC], path });
    }
  }
  
  return arrows;
}

// Generate a simple puzzle with arrows
function generatePuzzle() {
  const solution = generateSolvedGrid();
  const arrows = generateArrows(solution);
  
  // Create puzzle by removing some cells
  const puzzle = solution.map(row => [...row]);
  
  // Remove 40-50 cells, but keep arrow circle cells
  const arrowCells = new Set();
  arrows.forEach(arrow => {
    arrowCells.add(`${arrow.circle[0]},${arrow.circle[1]}`);
    arrow.path.forEach(([r, c]) => {
      arrowCells.add(`${r},${c}`);
    });
  });
  
  const positions = [];
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (!arrowCells.has(`${r},${c}`)) {
        positions.push([r, c]);
      }
    }
  }
  
  // Shuffle and remove
  for (let i = positions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [positions[i], positions[j]] = [positions[j], positions[i]];
  }
  
  const toRemove = 40 + Math.floor(Math.random() * 11);
  for (let i = 0; i < Math.min(toRemove, positions.length); i++) {
    const [r, c] = positions[i];
    puzzle[r][c] = 0;
  }
  
  return { puzzle, solution, arrows };
}

function checkValidity(grid, solution, arrows) {
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

  // Check arrow constraints
  const arrowErrors = checkArrowConstraints(grid, arrows);
  arrowErrors.forEach(err => errors.add(err));

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

// Export helpers for testing
export {
  generateSolvedGrid,
  isValidSudokuPlacement,
  checkArrowConstraints,
  generateArrows,
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

  loadingPromise = fetch('/datasets/arrowSudokuPuzzles.json')
    .then(res => {
      if (!res.ok) throw new Error(`Failed to load Arrow Sudoku puzzles: ${res.status}`);
      return res.json();
    })
    .then(data => {
      datasetCache = data.puzzles || [];
      return datasetCache;
    })
    .catch(err => {
      console.error('Failed to load Arrow Sudoku dataset:', err);
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
  // Ensure solution is valid - don't use empty fallback
  if (!puzzle.solution || !Array.isArray(puzzle.solution) || puzzle.solution.length === 0) {
    console.warn('Puzzle has no valid solution:', puzzle.id);
    return null;
  }
  
  return {
    puzzle: puzzle.puzzle || [],
    solution: puzzle.solution, // Don't use fallback - solution must exist
    arrows: puzzle.arrows || [],
  };
}

export default function ArrowSudoku() {
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
      if (data && data.solution && Array.isArray(data.solution) && data.solution.length > 0) {
        setPuzzleData(data);
        setGrid(data.puzzle.map(row => [...row]));
      } else {
        // If dataset puzzle is invalid, try generator
        console.warn('Dataset puzzle invalid, using generator');
        const data = generatePuzzle();
        setPuzzleData(data);
        setGrid(data.puzzle.map(row => [...row]));
      }
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
      ? checkValidity(grid, puzzleData.solution, puzzleData.arrows)
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
    
    // Check if solution exists and is valid
    if (!puzzleData.solution) {
      console.error('Cannot give up: puzzleData.solution is null or undefined');
      return;
    }
    
    if (!Array.isArray(puzzleData.solution)) {
      console.error('Cannot give up: puzzleData.solution is not an array', typeof puzzleData.solution);
      return;
    }
    
    if (puzzleData.solution.length === 0) {
      console.error('Cannot give up: puzzleData.solution is empty array');
      return;
    }
    
    // Check if solution rows are valid arrays
    if (!puzzleData.solution[0] || !Array.isArray(puzzleData.solution[0])) {
      console.error('Cannot give up: puzzleData.solution[0] is not a valid array', puzzleData.solution[0]);
      return;
    }
    
    // Deep copy the solution to avoid reference issues
    try {
      const solutionCopy = puzzleData.solution.map(row => Array.isArray(row) ? [...row] : []);
      setGrid(solutionCopy);
      setGameState('gaveUp');
      setIsRunning(false);
    } catch (error) {
      console.error('Error setting solution grid:', error);
    }
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

  // Helper to check if cell is part of an arrow
  const getArrowInfo = (r, c) => {
    for (const arrow of puzzleData.arrows) {
      if (arrow.circle[0] === r && arrow.circle[1] === c) {
        return { type: 'circle', arrow };
      }
      for (let i = 0; i < arrow.path.length; i++) {
        const [pr, pc] = arrow.path[i];
        if (pr === r && pc === c) {
          return { type: 'path', arrow, index: i, isLast: i === arrow.path.length - 1 };
        }
      }
    }
    return null;
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Link to="/" className={styles.backLink}>← Back to Games</Link>
        <h1 className={styles.title}>Arrow Sudoku</h1>
        <p className={styles.instructions}>
          Standard Sudoku rules apply. Digits along arrows must sum to the digit in the circle.
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
                  const arrowInfo = getArrowInfo(r, c);

                  return (
                    <div
                      key={c}
                      className={`
                        ${styles.cell}
                        ${isGiven ? styles.given : ''}
                        ${isSelected ? styles.selected : ''}
                        ${hasError ? styles.error : ''}
                        ${arrowInfo?.type === 'circle' ? styles.arrowCircle : ''}
                        ${arrowInfo?.type === 'path' ? styles.arrowPath : ''}
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
            
            {/* Render arrow lines using SVG overlay */}
            <svg className={styles.arrowOverlay} viewBox="0 0 360 360">
              {puzzleData.arrows.map((arrow, idx) => {
                const [cr, cc] = arrow.circle;
                const [pr, pc] = arrow.path[arrow.path.length - 1]; // Last path cell
                const cx = (cc + 0.5) * 40;
                const cy = (cr + 0.5) * 40;
                const px = (pc + 0.5) * 40;
                const py = (pr + 0.5) * 40;
                
                return (
                  <g key={idx}>
                    <line
                      x1={cx}
                      y1={cy}
                      x2={px}
                      y2={py}
                      stroke="#f59e0b"
                      strokeWidth="2"
                      markerEnd="url(#arrowhead)"
                    />
                  </g>
                );
              })}
              <defs>
                <marker
                  id="arrowhead"
                  markerWidth="10"
                  markerHeight="10"
                  refX="9"
                  refY="3"
                  orient="auto"
                >
                  <polygon points="0 0, 10 3, 0 6" fill="#f59e0b" />
                </marker>
              </defs>
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
            <div className={styles.winEmoji}>🎯</div>
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
