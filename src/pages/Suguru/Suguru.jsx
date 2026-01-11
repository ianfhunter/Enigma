import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { formatTime } from '../../data/wordUtils';
import styles from './Suguru.module.css';

const GRID_SIZES = {
  '6×6': 6,
  '8×8': 8,
  '10×10': 10,
};

// Generate regions using flood-fill approach
function generateRegions(size) {
  const regionGrid = Array(size).fill(null).map(() => Array(size).fill(-1));
  const regions = [];
  
  let regionId = 0;
  
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (regionGrid[r][c] !== -1) continue;
      
      // Start a new region
      const regionSize = 2 + Math.floor(Math.random() * 4); // 2-5 cells
      const cells = [[r, c]];
      regionGrid[r][c] = regionId;
      
      // Grow the region
      for (let i = 1; i < regionSize; i++) {
        const frontier = [];
        for (const [cr, cc] of cells) {
          for (const [nr, nc] of [[cr-1, cc], [cr+1, cc], [cr, cc-1], [cr, cc+1]]) {
            if (nr >= 0 && nr < size && nc >= 0 && nc < size && regionGrid[nr][nc] === -1) {
              if (!frontier.some(([fr, fc]) => fr === nr && fc === nc)) {
                frontier.push([nr, nc]);
              }
            }
          }
        }
        
        if (frontier.length === 0) break;
        
        const [nr, nc] = frontier[Math.floor(Math.random() * frontier.length)];
        cells.push([nr, nc]);
        regionGrid[nr][nc] = regionId;
      }
      
      regions.push({ id: regionId, cells, size: cells.length });
      regionId++;
    }
  }
  
  return { regionGrid, regions };
}

// Generate a valid Suguru solution
function generateSolution(regions, regionGrid, size) {
  const solution = Array(size).fill(null).map(() => Array(size).fill(0));
  
  function isValid(r, c, num) {
    // Check all 8 neighbors for same number
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        const nr = r + dr;
        const nc = c + dc;
        if (nr >= 0 && nr < size && nc >= 0 && nc < size) {
          if (solution[nr][nc] === num) return false;
        }
      }
    }
    return true;
  }
  
  function solve(regionIdx, cellIdx) {
    if (regionIdx >= regions.length) return true;
    
    const region = regions[regionIdx];
    if (cellIdx >= region.cells.length) {
      return solve(regionIdx + 1, 0);
    }
    
    const [r, c] = region.cells[cellIdx];
    const maxNum = region.size;
    
    // Shuffle numbers for variety
    const nums = Array.from({ length: maxNum }, (_, i) => i + 1);
    for (let i = nums.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [nums[i], nums[j]] = [nums[j], nums[i]];
    }
    
    for (const num of nums) {
      // Check if num already used in region
      let used = false;
      for (let i = 0; i < cellIdx; i++) {
        const [pr, pc] = region.cells[i];
        if (solution[pr][pc] === num) {
          used = true;
          break;
        }
      }
      if (used) continue;
      
      if (isValid(r, c, num)) {
        solution[r][c] = num;
        if (solve(regionIdx, cellIdx + 1)) return true;
        solution[r][c] = 0;
      }
    }
    
    return false;
  }
  
  solve(0, 0);
  return solution;
}

// Remove some numbers to create puzzle
function createPuzzle(solution, regions, difficulty = 0.5) {
  const puzzle = solution.map(row => [...row]);
  
  for (const region of regions) {
    // Remove some cells from each region
    const numToRemove = Math.floor(region.cells.length * difficulty);
    const indices = region.cells.map((_, i) => i);
    
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    
    for (let i = 0; i < numToRemove; i++) {
      const [r, c] = region.cells[indices[i]];
      puzzle[r][c] = 0;
    }
  }
  
  return puzzle;
}

function generatePuzzle(size) {
  const { regionGrid, regions } = generateRegions(size);
  const solution = generateSolution(regions, regionGrid, size);
  const puzzle = createPuzzle(solution, regions);
  
  return { regionGrid, regions, solution, puzzle };
}

function checkValidity(grid, regionGrid, regions, size) {
  const errors = new Set();
  
  // Check no touching same numbers (8 neighbors)
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (grid[r][c] === 0) continue;
      
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue;
          const nr = r + dr;
          const nc = c + dc;
          if (nr >= 0 && nr < size && nc >= 0 && nc < size) {
            if (grid[nr][nc] === grid[r][c]) {
              errors.add(`${r},${c}`);
              errors.add(`${nr},${nc}`);
            }
          }
        }
      }
    }
  }
  
  // Check region constraints
  for (const region of regions) {
    const seen = new Set();
    for (const [r, c] of region.cells) {
      if (grid[r][c] === 0) continue;
      if (grid[r][c] > region.size) {
        errors.add(`${r},${c}`);
      }
      if (seen.has(grid[r][c])) {
        // Duplicate in region
        for (const [rr, cc] of region.cells) {
          if (grid[rr][cc] === grid[r][c]) {
            errors.add(`${rr},${cc}`);
          }
        }
      }
      seen.add(grid[r][c]);
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

// Get border classes for region visualization
function getRegionBorders(r, c, regionGrid, size) {
  const regionId = regionGrid[r][c];
  const borders = [];
  
  if (r === 0 || regionGrid[r-1][c] !== regionId) borders.push('top');
  if (r === size - 1 || regionGrid[r+1][c] !== regionId) borders.push('bottom');
  if (c === 0 || regionGrid[r][c-1] !== regionId) borders.push('left');
  if (c === size - 1 || regionGrid[r][c+1] !== regionId) borders.push('right');
  
  return borders;
}

export default function Suguru() {
  const [sizeKey, setSizeKey] = useState('6×6');
  const [puzzleData, setPuzzleData] = useState(null);
  const [grid, setGrid] = useState([]);
  const [selectedCell, setSelectedCell] = useState(null);
  const [gameState, setGameState] = useState('playing');
  const [errors, setErrors] = useState(new Set());
  const [showErrors, setShowErrors] = useState(true);
  const [timer, setTimer] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const timerRef = useRef(null);

  const size = GRID_SIZES[sizeKey];

  const initGame = useCallback(() => {
    const data = generatePuzzle(size);
    setPuzzleData(data);
    setGrid(data.puzzle.map(row => [...row]));
    setSelectedCell(null);
    setGameState('playing');
    setErrors(new Set());
    setTimer(0);
    setIsRunning(true);
  }, [size]);

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
      ? checkValidity(grid, puzzleData.regionGrid, puzzleData.regions, size)
      : new Set();
    setErrors(newErrors);

    if (checkSolved(grid, puzzleData.solution, size)) {
      setGameState('won');
      setIsRunning(false);
    }
  }, [grid, puzzleData, showErrors, size]);

  const handleCellClick = (r, c) => {
    if (gameState !== 'playing') return;
    if (puzzleData.puzzle[r][c] !== 0) return; // Can't edit given numbers
    setSelectedCell({ row: r, col: c });
  };

  const handleNumberInput = (num) => {
    if (!selectedCell || gameState !== 'playing') return;
    const { row, col } = selectedCell;
    if (puzzleData.puzzle[row][col] !== 0) return;
    
    const regionId = puzzleData.regionGrid[row][col];
    const region = puzzleData.regions.find(r => r.id === regionId);
    if (num > region.size) return;
    
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

  // Color palette for regions
  const colors = [
    'rgba(239, 68, 68, 0.2)',
    'rgba(34, 197, 94, 0.2)',
    'rgba(59, 130, 246, 0.2)',
    'rgba(168, 85, 247, 0.2)',
    'rgba(234, 179, 8, 0.2)',
    'rgba(236, 72, 153, 0.2)',
    'rgba(20, 184, 166, 0.2)',
    'rgba(249, 115, 22, 0.2)',
    'rgba(99, 102, 241, 0.2)',
    'rgba(132, 204, 22, 0.2)',
  ];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Link to="/" className={styles.backLink}>← Back to Games</Link>
        <h1 className={styles.title}>Suguru</h1>
        <p className={styles.instructions}>
          Fill each region with numbers 1 to N (where N = region size).
          Same numbers cannot touch, even diagonally.
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
        <div className={styles.timerDisplay}>
          <span className={styles.timerIcon}>⏱</span>
          <span>{formatTime(timer)}</span>
        </div>

        <div className={styles.board} style={{ '--grid-size': size }}>
          {Array(size).fill(null).map((_, r) => (
            <div key={r} className={styles.row}>
              {Array(size).fill(null).map((_, c) => {
                const value = grid[r][c];
                const isGiven = puzzleData.puzzle[r][c] !== 0;
                const isSelected = selectedCell?.row === r && selectedCell?.col === c;
                const hasError = errors.has(`${r},${c}`);
                const borders = getRegionBorders(r, c, puzzleData.regionGrid, size);
                const regionId = puzzleData.regionGrid[r][c];
                const bgColor = colors[regionId % colors.length];

                return (
                  <div
                    key={c}
                    className={`
                      ${styles.cell}
                      ${isGiven ? styles.given : ''}
                      ${isSelected ? styles.selected : ''}
                      ${hasError ? styles.error : ''}
                      ${borders.includes('top') ? styles.borderTop : ''}
                      ${borders.includes('bottom') ? styles.borderBottom : ''}
                      ${borders.includes('left') ? styles.borderLeft : ''}
                      ${borders.includes('right') ? styles.borderRight : ''}
                    `}
                    style={{ backgroundColor: bgColor }}
                    onClick={() => handleCellClick(r, c)}
                  >
                    {value !== 0 && <span className={styles.cellValue}>{value}</span>}
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        <div className={styles.numberPad}>
          {[1, 2, 3, 4, 5].map(num => (
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
