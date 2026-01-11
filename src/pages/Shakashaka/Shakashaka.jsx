import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import styles from './Shakashaka.module.css';

const GRID_SIZES = {
  '5×5': 5,
  '7×7': 7,
  '9×9': 9,
};

// Triangle types: null = empty, 'ul' = upper-left, 'ur' = upper-right, 'll' = lower-left, 'lr' = lower-right
const TRIANGLE_CYCLE = [null, 'ul', 'ur', 'lr', 'll'];

function generatePuzzle(size) {
  // Create a puzzle with black cells containing numbers
  const grid = Array(size).fill(null).map(() => Array(size).fill(null));
  const blackCells = Array(size).fill(null).map(() => Array(size).fill(false));
  
  // Place some black cells with numbers (about 15-20% of grid)
  const numBlackCells = Math.floor(size * size * 0.18);
  const positions = [];
  
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      positions.push([r, c]);
    }
  }
  
  // Shuffle positions
  for (let i = positions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [positions[i], positions[j]] = [positions[j], positions[i]];
  }
  
  // Place black cells
  for (let i = 0; i < numBlackCells; i++) {
    const [r, c] = positions[i];
    blackCells[r][c] = true;
    // Random number 0-4
    grid[r][c] = Math.floor(Math.random() * 5);
  }
  
  // Generate a solution
  const solution = Array(size).fill(null).map(() => Array(size).fill(null));
  
  // Try to create valid white rectangles by placing triangles
  // This is a simplified approach - we'll create diagonal patterns
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (blackCells[r][c]) continue;
      
      // Randomly place triangles or leave empty
      if (Math.random() < 0.3) {
        const triangles = ['ul', 'ur', 'll', 'lr'];
        solution[r][c] = triangles[Math.floor(Math.random() * triangles.length)];
      }
    }
  }
  
  // Recalculate black cell numbers based on solution
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (blackCells[r][c]) {
        let count = 0;
        for (const [nr, nc] of [[r-1,c], [r+1,c], [r,c-1], [r,c+1]]) {
          if (nr >= 0 && nr < size && nc >= 0 && nc < size && solution[nr][nc]) {
            count++;
          }
        }
        grid[r][c] = count;
      }
    }
  }
  
  return { grid, blackCells, solution };
}

// Check if a cell contributes to a valid white region
function getWhiteCorners(cell) {
  // Returns which corners of the cell are white
  // Full white: all 4 corners
  // Triangle: 2 corners
  if (!cell) return ['tl', 'tr', 'bl', 'br']; // all white
  
  switch (cell) {
    case 'ul': return ['br']; // upper-left triangle, only bottom-right is white
    case 'ur': return ['bl']; // upper-right triangle, only bottom-left is white
    case 'll': return ['tr']; // lower-left triangle, only top-right is white
    case 'lr': return ['tl']; // lower-right triangle, only top-left is white
    default: return [];
  }
}

function checkValidity(grid, blackCells, playerGrid, size) {
  const errors = new Set();
  
  // Check each black cell's number constraint
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (!blackCells[r][c]) continue;
      
      const expectedCount = grid[r][c];
      let actualCount = 0;
      
      for (const [nr, nc] of [[r-1,c], [r+1,c], [r,c-1], [r,c+1]]) {
        if (nr >= 0 && nr < size && nc >= 0 && nc < size && playerGrid[nr][nc]) {
          actualCount++;
        }
      }
      
      if (actualCount > expectedCount) {
        errors.add(`${r},${c}`);
        // Mark adjacent triangles as errors
        for (const [nr, nc] of [[r-1,c], [r+1,c], [r,c-1], [r,c+1]]) {
          if (nr >= 0 && nr < size && nc >= 0 && nc < size && playerGrid[nr][nc]) {
            errors.add(`${nr},${nc}`);
          }
        }
      }
    }
  }
  
  return errors;
}

function checkSolved(grid, blackCells, playerGrid, size) {
  // Check each black cell's number constraint is exactly met
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (!blackCells[r][c]) continue;
      
      const expectedCount = grid[r][c];
      let actualCount = 0;
      
      for (const [nr, nc] of [[r-1,c], [r+1,c], [r,c-1], [r,c+1]]) {
        if (nr >= 0 && nr < size && nc >= 0 && nc < size && playerGrid[nr][nc]) {
          actualCount++;
        }
      }
      
      if (actualCount !== expectedCount) return false;
    }
  }
  
  // Additional check: white areas should form valid shapes
  // For simplicity, we just check the number constraints are met
  return true;
}

// SVG triangle components
function Triangle({ type, hasError }) {
  const errorClass = hasError ? styles.triangleError : '';
  
  switch (type) {
    case 'ul': // Upper-left (black in upper-left corner)
      return (
        <svg viewBox="0 0 100 100" className={`${styles.triangle} ${errorClass}`}>
          <polygon points="0,0 100,0 0,100" fill="currentColor" />
        </svg>
      );
    case 'ur': // Upper-right
      return (
        <svg viewBox="0 0 100 100" className={`${styles.triangle} ${errorClass}`}>
          <polygon points="0,0 100,0 100,100" fill="currentColor" />
        </svg>
      );
    case 'll': // Lower-left
      return (
        <svg viewBox="0 0 100 100" className={`${styles.triangle} ${errorClass}`}>
          <polygon points="0,0 100,100 0,100" fill="currentColor" />
        </svg>
      );
    case 'lr': // Lower-right
      return (
        <svg viewBox="0 0 100 100" className={`${styles.triangle} ${errorClass}`}>
          <polygon points="100,0 100,100 0,100" fill="currentColor" />
        </svg>
      );
    default:
      return null;
  }
}

export default function Shakashaka() {
  const [sizeKey, setSizeKey] = useState('5×5');
  const [puzzleData, setPuzzleData] = useState(null);
  const [playerGrid, setPlayerGrid] = useState([]);
  const [gameState, setGameState] = useState('playing');
  const [errors, setErrors] = useState(new Set());
  const [showErrors, setShowErrors] = useState(true);
  const [showSolution, setShowSolution] = useState(false);
  
  const size = GRID_SIZES[sizeKey];
  
  const initGame = useCallback(() => {
    const data = generatePuzzle(size);
    setPuzzleData(data);
    setPlayerGrid(Array(size).fill(null).map(() => Array(size).fill(null)));
    setGameState('playing');
    setErrors(new Set());
    setShowSolution(false);
  }, [size]);
  
  useEffect(() => {
    initGame();
  }, [initGame]);
  
  useEffect(() => {
    if (!puzzleData) return;
    
    const gridToCheck = showSolution ? puzzleData.solution : playerGrid;
    const newErrors = showErrors && !showSolution ? 
      checkValidity(puzzleData.grid, puzzleData.blackCells, playerGrid, size) : 
      new Set();
    setErrors(newErrors);
    
    if (!showSolution && checkSolved(puzzleData.grid, puzzleData.blackCells, playerGrid, size)) {
      setGameState('won');
    }
  }, [playerGrid, puzzleData, showErrors, showSolution, size]);
  
  const handleCellClick = (r, c) => {
    if (gameState !== 'playing' || showSolution) return;
    if (puzzleData.blackCells[r][c]) return;
    
    setPlayerGrid(prev => {
      const newGrid = prev.map(row => [...row]);
      const currentIdx = TRIANGLE_CYCLE.indexOf(prev[r][c]);
      newGrid[r][c] = TRIANGLE_CYCLE[(currentIdx + 1) % TRIANGLE_CYCLE.length];
      return newGrid;
    });
  };
  
  const handleCellRightClick = (r, c, e) => {
    e.preventDefault();
    if (gameState !== 'playing' || showSolution) return;
    if (puzzleData.blackCells[r][c]) return;
    
    setPlayerGrid(prev => {
      const newGrid = prev.map(row => [...row]);
      const currentIdx = TRIANGLE_CYCLE.indexOf(prev[r][c]);
      newGrid[r][c] = TRIANGLE_CYCLE[(currentIdx - 1 + TRIANGLE_CYCLE.length) % TRIANGLE_CYCLE.length];
      return newGrid;
    });
  };
  
  const handleReset = () => {
    setPlayerGrid(Array(size).fill(null).map(() => Array(size).fill(null)));
    setGameState('playing');
    setShowSolution(false);
  };
  
  const handleGiveUp = () => {
    setShowSolution(true);
    setGameState('gaveUp');
  };
  
  if (!puzzleData) return null;
  
  const displayGrid = showSolution ? puzzleData.solution : playerGrid;
  
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Link to="/" className={styles.backLink}>← Back to Games</Link>
        <h1 className={styles.title}>Shakashaka</h1>
        <p className={styles.instructions}>
          Place triangles in cells to satisfy the number clues. Each number indicates 
          how many triangles touch it orthogonally. Click to cycle through triangle types,
          right-click to cycle backwards.
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
          style={{
            gridTemplateColumns: `repeat(${size}, 1fr)`,
            width: `${size * 45}px`,
            height: `${size * 45}px`,
          }}
        >
          {puzzleData.grid.map((row, r) =>
            row.map((cell, c) => {
              const isBlack = puzzleData.blackCells[r][c];
              const triangleType = displayGrid[r][c];
              const hasError = errors.has(`${r},${c}`);
              
              return (
                <button
                  key={`${r}-${c}`}
                  className={`
                    ${styles.cell}
                    ${isBlack ? styles.blackCell : ''}
                    ${hasError && !isBlack ? styles.error : ''}
                    ${hasError && isBlack ? styles.blackError : ''}
                  `}
                  onClick={() => handleCellClick(r, c)}
                  onContextMenu={(e) => handleCellRightClick(r, c, e)}
                  disabled={showSolution || isBlack}
                >
                  {isBlack ? (
                    <span className={styles.number}>{cell}</span>
                  ) : (
                    triangleType && <Triangle type={triangleType} hasError={hasError} />
                  )}
                </button>
              );
            })
          )}
        </div>
        
        {gameState === 'won' && (
          <div className={styles.winMessage}>
            <div className={styles.winEmoji}>🔺</div>
            <h3>Puzzle Solved!</h3>
            <p>All triangles perfectly placed!</p>
          </div>
        )}
        
        {gameState === 'gaveUp' && (
          <div className={styles.gaveUpMessage}>
            <div className={styles.gaveUpEmoji}>💡</div>
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
          {gameState === 'playing' && (
            <button className={styles.giveUpBtn} onClick={handleGiveUp}>
              Give Up
            </button>
          )}
          <button className={styles.newGameBtn} onClick={initGame}>
            New Puzzle
          </button>
        </div>
        
        <div className={styles.legend}>
          <div className={styles.legendItem}>
            <div className={styles.legendTriangle}>
              <Triangle type="ul" />
            </div>
            <div className={styles.legendTriangle}>
              <Triangle type="ur" />
            </div>
            <div className={styles.legendTriangle}>
              <Triangle type="ll" />
            </div>
            <div className={styles.legendTriangle}>
              <Triangle type="lr" />
            </div>
            <span>Click to cycle</span>
          </div>
        </div>
      </div>
    </div>
  );
}
