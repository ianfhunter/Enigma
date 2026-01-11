import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import styles from './Nanro.module.css';

const GRID_SIZES = {
  '5×5': 5,
  '7×7': 7,
  '9×9': 9,
};

// Generate regions
function generateRegions(size) {
  const regionGrid = Array(size).fill(null).map(() => Array(size).fill(-1));
  const regions = [];
  
  let regionId = 0;
  
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (regionGrid[r][c] !== -1) continue;
      
      // Start a new region (size 2-5)
      const regionSize = 2 + Math.floor(Math.random() * 4);
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
      
      regions.push({ id: regionId, cells });
      regionId++;
    }
  }
  
  return { regionGrid, regions };
}

// Generate a valid Nanro solution
function generateSolution(regions, regionGrid, size) {
  const solution = Array(size).fill(null).map(() => Array(size).fill(0));
  
  // For each region, fill some cells with numbers
  for (const region of regions) {
    // Fill 1-3 cells per region with the same number
    const numFilled = 1 + Math.floor(Math.random() * Math.min(3, region.cells.length));
    
    // Shuffle cells
    const shuffledCells = [...region.cells];
    for (let i = shuffledCells.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledCells[i], shuffledCells[j]] = [shuffledCells[j], shuffledCells[i]];
    }
    
    // Fill with the number = count of filled cells in region
    for (let i = 0; i < numFilled; i++) {
      const [r, c] = shuffledCells[i];
      solution[r][c] = numFilled;
    }
  }
  
  return solution;
}

// Create puzzle by showing some numbers as clues
function createPuzzle(solution, regions, size) {
  const puzzle = Array(size).fill(null).map(() => Array(size).fill(0));
  
  // Show some filled cells as clues (about 30%)
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (solution[r][c] > 0 && Math.random() < 0.3) {
        puzzle[r][c] = solution[r][c];
      }
    }
  }
  
  return puzzle;
}

function generatePuzzle(size) {
  const { regionGrid, regions } = generateRegions(size);
  const solution = generateSolution(regions, regionGrid, size);
  const puzzle = createPuzzle(solution, regions, size);
  
  return { regionGrid, regions, solution, puzzle, size };
}

function checkValidity(grid, regionGrid, regions, size) {
  const errors = new Set();
  
  // Check no 2x2 area is all filled with numbers
  for (let r = 0; r < size - 1; r++) {
    for (let c = 0; c < size - 1; c++) {
      if (grid[r][c] > 0 && grid[r][c+1] > 0 && 
          grid[r+1][c] > 0 && grid[r+1][c+1] > 0) {
        errors.add(`${r},${c}`);
        errors.add(`${r},${c+1}`);
        errors.add(`${r+1},${c}`);
        errors.add(`${r+1},${c+1}`);
      }
    }
  }
  
  // Check adjacent cells in different regions don't have same number
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (grid[r][c] === 0) continue;
      
      for (const [nr, nc] of [[r-1, c], [r+1, c], [r, c-1], [r, c+1]]) {
        if (nr < 0 || nr >= size || nc < 0 || nc >= size) continue;
        if (grid[nr][nc] === 0) continue;
        
        // Different regions with same number
        if (regionGrid[r][c] !== regionGrid[nr][nc] && grid[r][c] === grid[nr][nc]) {
          errors.add(`${r},${c}`);
          errors.add(`${nr},${nc}`);
        }
      }
    }
  }
  
  // Check numbers within same region match
  for (const region of regions) {
    const numbersInRegion = {};
    for (const [r, c] of region.cells) {
      if (grid[r][c] > 0) {
        if (!numbersInRegion[grid[r][c]]) {
          numbersInRegion[grid[r][c]] = [];
        }
        numbersInRegion[grid[r][c]].push([r, c]);
      }
    }
    
    // Check if any number appears more times than its value
    for (const [num, cells] of Object.entries(numbersInRegion)) {
      if (cells.length > parseInt(num)) {
        for (const [r, c] of cells) {
          errors.add(`${r},${c}`);
        }
      }
    }
    
    // Check for multiple different numbers (should all be same)
    const keys = Object.keys(numbersInRegion);
    if (keys.length > 1) {
      for (const [r, c] of region.cells) {
        if (grid[r][c] > 0) {
          errors.add(`${r},${c}`);
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

// Get region borders
function getRegionBorders(r, c, regionGrid, size) {
  const regionId = regionGrid[r][c];
  const borders = [];
  
  if (r === 0 || regionGrid[r-1][c] !== regionId) borders.push('top');
  if (r === size - 1 || regionGrid[r+1][c] !== regionId) borders.push('bottom');
  if (c === 0 || regionGrid[r][c-1] !== regionId) borders.push('left');
  if (c === size - 1 || regionGrid[r][c+1] !== regionId) borders.push('right');
  
  return borders;
}

export default function Nanro() {
  const [sizeKey, setSizeKey] = useState('5×5');
  const [puzzleData, setPuzzleData] = useState(null);
  const [grid, setGrid] = useState([]);
  const [selectedCell, setSelectedCell] = useState(null);
  const [gameState, setGameState] = useState('playing');
  const [errors, setErrors] = useState(new Set());
  const [showErrors, setShowErrors] = useState(true);

  const size = GRID_SIZES[sizeKey];

  const initGame = useCallback(() => {
    const data = generatePuzzle(size);
    setPuzzleData(data);
    setGrid(data.puzzle.map(row => [...row]));
    setSelectedCell(null);
    setGameState('playing');
    setErrors(new Set());
  }, [size]);

  useEffect(() => {
    initGame();
  }, [initGame]);

  useEffect(() => {
    if (!puzzleData) return;

    const newErrors = showErrors 
      ? checkValidity(grid, puzzleData.regionGrid, puzzleData.regions, size)
      : new Set();
    setErrors(newErrors);

    if (checkSolved(grid, puzzleData.solution, size)) {
      setGameState('won');
    }
  }, [grid, puzzleData, showErrors, size]);

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

  if (!puzzleData) return null;

  // Colors for regions
  const colors = [
    'rgba(239, 68, 68, 0.15)',
    'rgba(34, 197, 94, 0.15)',
    'rgba(59, 130, 246, 0.15)',
    'rgba(168, 85, 247, 0.15)',
    'rgba(234, 179, 8, 0.15)',
    'rgba(236, 72, 153, 0.15)',
    'rgba(20, 184, 166, 0.15)',
    'rgba(249, 115, 22, 0.15)',
  ];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Link to="/" className={styles.backLink}>← Back to Games</Link>
        <h1 className={styles.title}>Nanro</h1>
        <p className={styles.instructions}>
          Fill numbers in regions. All numbers in a region must be the same and equal
          to the count of filled cells. Same numbers cannot be orthogonally adjacent
          across regions. No 2×2 area can be fully filled.
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
          className={styles.grid}
          style={{ gridTemplateColumns: `repeat(${size}, 1fr)` }}
        >
          {grid.map((row, r) =>
            row.map((cell, c) => {
              const isGiven = puzzleData.puzzle[r][c] !== 0;
              const isSelected = selectedCell?.row === r && selectedCell?.col === c;
              const hasError = errors.has(`${r},${c}`);
              const borders = getRegionBorders(r, c, puzzleData.regionGrid, size);
              const regionId = puzzleData.regionGrid[r][c];
              const bgColor = colors[regionId % colors.length];

              return (
                <div
                  key={`${r}-${c}`}
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
                  {cell !== 0 && <span className={styles.cellValue}>{cell}</span>}
                </div>
              );
            })
          )}
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
            <div className={styles.winEmoji}>🔢</div>
            <h3>Puzzle Solved!</h3>
            <p>All regions correctly filled!</p>
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
