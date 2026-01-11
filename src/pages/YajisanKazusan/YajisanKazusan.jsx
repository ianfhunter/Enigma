import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import styles from './YajisanKazusan.module.css';

const GRID_SIZES = {
  '5×5': 5,
  '7×7': 7,
  '9×9': 9,
};

const DIRECTIONS = {
  UP: { dr: -1, dc: 0, symbol: '↑' },
  DOWN: { dr: 1, dc: 0, symbol: '↓' },
  LEFT: { dr: 0, dc: -1, symbol: '←' },
  RIGHT: { dr: 0, dc: 1, symbol: '→' },
};

const DIR_KEYS = Object.keys(DIRECTIONS);

// Generate a valid Yajisan-Kazusan puzzle
function generatePuzzle(size) {
  // Create an empty grid for shading solution
  const solution = Array(size).fill(null).map(() => Array(size).fill(false));
  
  // Randomly shade some cells (about 25-35%)
  const cellsToShade = Math.floor(size * size * (0.25 + Math.random() * 0.1));
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
  
  // Try to shade cells while maintaining validity
  let shaded = 0;
  for (const [r, c] of positions) {
    if (shaded >= cellsToShade) break;
    
    // Check if shading this cell would create adjacent shaded cells
    const hasAdjacentShaded = [
      [r-1, c], [r+1, c], [r, c-1], [r, c+1]
    ].some(([nr, nc]) => 
      nr >= 0 && nr < size && nc >= 0 && nc < size && solution[nr][nc]
    );
    
    if (!hasAdjacentShaded) {
      solution[r][c] = true;
      
      // Check if unshaded cells remain connected
      if (isConnected(solution, size)) {
        shaded++;
      } else {
        solution[r][c] = false;
      }
    }
  }
  
  // Create clues based on the solution
  const clues = Array(size).fill(null).map(() => Array(size).fill(null));
  
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      // About 40% of cells get clues
      if (Math.random() < 0.4) {
        const dir = DIR_KEYS[Math.floor(Math.random() * DIR_KEYS.length)];
        const { dr, dc } = DIRECTIONS[dir];
        
        // Count shaded cells in that direction
        let count = 0;
        let nr = r + dr;
        let nc = c + dc;
        
        while (nr >= 0 && nr < size && nc >= 0 && nc < size) {
          if (solution[nr][nc]) count++;
          nr += dr;
          nc += dc;
        }
        
        // If this cell is shaded, the clue becomes a "lie" - we might give wrong info
        if (solution[r][c]) {
          // For shaded clue cells, give a random (possibly wrong) count
          count = Math.floor(Math.random() * 3);
        }
        
        clues[r][c] = { direction: dir, count };
      }
    }
  }
  
  return { clues, solution };
}

// Check if unshaded cells are connected
function isConnected(grid, size) {
  const visited = Array(size).fill(null).map(() => Array(size).fill(false));
  
  // Find first unshaded cell
  let startR = -1, startC = -1;
  for (let r = 0; r < size && startR === -1; r++) {
    for (let c = 0; c < size && startR === -1; c++) {
      if (!grid[r][c]) {
        startR = r;
        startC = c;
      }
    }
  }
  
  if (startR === -1) return true; // All shaded (edge case)
  
  // BFS
  const queue = [[startR, startC]];
  visited[startR][startC] = true;
  let count = 1;
  
  while (queue.length > 0) {
    const [r, c] = queue.shift();
    for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
      const nr = r + dr;
      const nc = c + dc;
      if (nr >= 0 && nr < size && nc >= 0 && nc < size && 
          !grid[nr][nc] && !visited[nr][nc]) {
        visited[nr][nc] = true;
        queue.push([nr, nc]);
        count++;
      }
    }
  }
  
  // Count total unshaded cells
  let totalUnshaded = 0;
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (!grid[r][c]) totalUnshaded++;
    }
  }
  
  return count === totalUnshaded;
}

// Check if a clue is satisfied
function checkClue(grid, clue, r, c, size) {
  if (!clue) return null;
  
  // If the clue cell is shaded, the clue is "deactivated"
  if (grid[r][c]) return null;
  
  const { direction, count } = clue;
  const { dr, dc } = DIRECTIONS[direction];
  
  let shadedCount = 0;
  let nr = r + dr;
  let nc = c + dc;
  
  while (nr >= 0 && nr < size && nc >= 0 && nc < size) {
    if (grid[nr][nc]) shadedCount++;
    nr += dr;
    nc += dc;
  }
  
  return shadedCount === count;
}

// Check if puzzle is solved
function checkSolved(grid, clues, size) {
  // Check no adjacent shaded cells
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (grid[r][c]) {
        for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
          const nr = r + dr;
          const nc = c + dc;
          if (nr >= 0 && nr < size && nc >= 0 && nc < size && grid[nr][nc]) {
            return false;
          }
        }
      }
    }
  }
  
  // Check connectivity
  if (!isConnected(grid, size)) return false;
  
  // Check all clues
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const result = checkClue(grid, clues[r][c], r, c, size);
      if (result === false) return false;
    }
  }
  
  return true;
}

export default function YajisanKazusan() {
  const [sizeKey, setSizeKey] = useState('5×5');
  const [puzzleData, setPuzzleData] = useState(null);
  const [grid, setGrid] = useState([]);
  const [gameState, setGameState] = useState('playing');
  const [showErrors, setShowErrors] = useState(true);

  const size = GRID_SIZES[sizeKey];

  const initGame = useCallback(() => {
    const data = generatePuzzle(size);
    setPuzzleData(data);
    setGrid(Array(size).fill(null).map(() => Array(size).fill(false)));
    setGameState('playing');
  }, [size]);

  useEffect(() => {
    initGame();
  }, [initGame]);

  useEffect(() => {
    if (!puzzleData) return;
    
    if (checkSolved(grid, puzzleData.clues, size)) {
      setGameState('won');
    }
  }, [grid, puzzleData, size]);

  const handleCellClick = (r, c) => {
    if (gameState !== 'playing') return;

    setGrid(prev => {
      const newGrid = prev.map(row => [...row]);
      newGrid[r][c] = !newGrid[r][c];
      return newGrid;
    });
  };

  const handleReset = () => {
    setGrid(Array(size).fill(null).map(() => Array(size).fill(false)));
    setGameState('playing');
  };

  if (!puzzleData) return null;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Link to="/" className={styles.backLink}>← Back to Games</Link>
        <h1 className={styles.title}>Yajisan-Kazusan</h1>
        <p className={styles.instructions}>
          Shade cells so that: (1) shaded cells are not adjacent, (2) unshaded cells form a connected region,
          (3) each unshaded clue correctly shows how many shaded cells are in that direction.
          Shaded clues are "lies" and can be ignored.
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
            width: `${size * 50}px`,
            height: `${size * 50}px`,
          }}
        >
          {grid.map((row, r) =>
            row.map((isShaded, c) => {
              const clue = puzzleData.clues[r][c];
              const clueResult = showErrors ? checkClue(grid, clue, r, c, size) : null;
              const hasError = clueResult === false;
              
              return (
                <button
                  key={`${r}-${c}`}
                  className={`
                    ${styles.cell}
                    ${isShaded ? styles.shaded : ''}
                    ${hasError ? styles.error : ''}
                    ${clueResult === true ? styles.satisfied : ''}
                  `}
                  onClick={() => handleCellClick(r, c)}
                >
                  {clue && (
                    <span className={styles.clue}>
                      <span className={styles.arrow}>{DIRECTIONS[clue.direction].symbol}</span>
                      <span className={styles.count}>{clue.count}</span>
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>

        {gameState === 'won' && (
          <div className={styles.winMessage}>
            <div className={styles.winEmoji}>🎉</div>
            <h3>Puzzle Solved!</h3>
            <p>All clues are satisfied!</p>
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
          <button className={styles.newGameBtn} onClick={initGame}>
            New Puzzle
          </button>
        </div>
      </div>
    </div>
  );
}
