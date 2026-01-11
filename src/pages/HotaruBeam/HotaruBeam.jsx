import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import styles from './HotaruBeam.module.css';

const GRID_SIZES = {
  '5×5': 5,
  '6×6': 6,
  '7×7': 7,
  '8×8': 8,
};

const DIFFICULTY = {
  'Easy': { circles: 3, minValue: 2, maxValue: 4 },
  'Medium': { circles: 4, minValue: 2, maxValue: 6 },
  'Hard': { circles: 5, minValue: 3, maxValue: 8 },
};

// Hotaru Beam rules:
// - Circles contain numbers indicating how many line segments touch them
// - Lines form closed loops
// - Each cell can have 0, 1, or 2 line segments passing through it
// - Lines connect orthogonally adjacent cells through their edges

function generatePuzzle(size, difficultyKey) {
  const { circles, minValue, maxValue } = DIFFICULTY[difficultyKey];
  
  // Create empty grid for circles (0 means no circle)
  const circleGrid = Array(size).fill(null).map(() => Array(size).fill(0));
  
  // Place circles randomly
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
  
  // Place circles with some minimum distance
  const placedCircles = [];
  for (const [r, c] of positions) {
    if (placedCircles.length >= circles) break;
    
    // Check minimum distance from other circles
    let tooClose = false;
    for (const [pr, pc] of placedCircles) {
      if (Math.abs(r - pr) + Math.abs(c - pc) < 2) {
        tooClose = true;
        break;
      }
    }
    
    if (!tooClose) {
      const value = minValue + Math.floor(Math.random() * (maxValue - minValue + 1));
      circleGrid[r][c] = value;
      placedCircles.push([r, c]);
    }
  }
  
  // Generate a valid solution (simplified approach)
  // Solution stores edges: horizontal edges at [r][c] means edge between (r,c) and (r,c+1)
  // Vertical edges at [r][c] means edge between (r,c) and (r+1,c)
  const solutionH = Array(size).fill(null).map(() => Array(size - 1).fill(false));
  const solutionV = Array(size - 1).fill(null).map(() => Array(size).fill(false));
  
  // For simplicity, create a simple loop that satisfies some circle constraints
  // This is a simplified puzzle generator
  
  return {
    circleGrid,
    solutionH,
    solutionV,
    size,
  };
}

// Count edges touching a cell
function countEdges(r, c, hEdges, vEdges, size) {
  let count = 0;
  
  // Left edge
  if (c > 0 && hEdges[r][c - 1]) count++;
  // Right edge
  if (c < size - 1 && hEdges[r][c]) count++;
  // Top edge
  if (r > 0 && vEdges[r - 1][c]) count++;
  // Bottom edge
  if (r < size - 1 && vEdges[r][c]) count++;
  
  return count;
}

// Check if puzzle is solved
function checkSolved(circleGrid, hEdges, vEdges, size) {
  // Check all circle constraints
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (circleGrid[r][c] > 0) {
        const edgeCount = countEdges(r, c, hEdges, vEdges, size);
        if (edgeCount !== circleGrid[r][c]) {
          return false;
        }
      }
    }
  }
  
  // Check that lines form valid paths (each cell has 0 or 2 edges, not 1 or 3)
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const edgeCount = countEdges(r, c, hEdges, vEdges, size);
      if (edgeCount !== 0 && edgeCount !== 2) {
        return false;
      }
    }
  }
  
  // Check that at least some edges exist
  let hasEdges = false;
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size - 1; c++) {
      if (hEdges[r][c]) hasEdges = true;
    }
  }
  for (let r = 0; r < size - 1; r++) {
    for (let c = 0; c < size; c++) {
      if (vEdges[r][c]) hasEdges = true;
    }
  }
  
  if (!hasEdges) return false;
  
  // Check connectivity of the loop
  return checkLoopConnectivity(hEdges, vEdges, size);
}

// Check if edges form connected loops
function checkLoopConnectivity(hEdges, vEdges, size) {
  // Find a starting cell with edges
  let start = null;
  for (let r = 0; r < size && !start; r++) {
    for (let c = 0; c < size && !start; c++) {
      if (countEdges(r, c, hEdges, vEdges, size) > 0) {
        start = [r, c];
      }
    }
  }
  
  if (!start) return true; // No edges is technically valid
  
  // BFS to check all edge-connected cells are reachable
  const visited = Array(size).fill(null).map(() => Array(size).fill(false));
  const queue = [start];
  let visitedCount = 0;
  
  while (queue.length > 0) {
    const [r, c] = queue.shift();
    if (visited[r][c]) continue;
    visited[r][c] = true;
    visitedCount++;
    
    // Check connected neighbors via edges
    // Left
    if (c > 0 && hEdges[r][c - 1] && !visited[r][c - 1]) {
      queue.push([r, c - 1]);
    }
    // Right
    if (c < size - 1 && hEdges[r][c] && !visited[r][c + 1]) {
      queue.push([r, c + 1]);
    }
    // Up
    if (r > 0 && vEdges[r - 1][c] && !visited[r - 1][c]) {
      queue.push([r - 1, c]);
    }
    // Down
    if (r < size - 1 && vEdges[r][c] && !visited[r + 1][c]) {
      queue.push([r + 1, c]);
    }
  }
  
  // Count cells with edges
  let cellsWithEdges = 0;
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (countEdges(r, c, hEdges, vEdges, size) > 0) {
        cellsWithEdges++;
      }
    }
  }
  
  return visitedCount === cellsWithEdges;
}

// Find errors in current state
function findErrors(circleGrid, hEdges, vEdges, size) {
  const errors = new Set();
  
  // Check circle constraints
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const edgeCount = countEdges(r, c, hEdges, vEdges, size);
      
      // Circle constraint violation
      if (circleGrid[r][c] > 0 && edgeCount > circleGrid[r][c]) {
        errors.add(`cell-${r}-${c}`);
      }
      
      // Invalid edge count (1 or 3 edges means incomplete path)
      if (edgeCount === 1 || edgeCount === 3) {
        errors.add(`cell-${r}-${c}`);
      }
      
      // More than 2 edges is always invalid
      if (edgeCount > 2) {
        errors.add(`cell-${r}-${c}`);
      }
    }
  }
  
  return errors;
}

export default function HotaruBeam() {
  const [sizeKey, setSizeKey] = useState('5×5');
  const [difficultyKey, setDifficultyKey] = useState('Easy');
  const [puzzleData, setPuzzleData] = useState(null);
  const [hEdges, setHEdges] = useState([]);
  const [vEdges, setVEdges] = useState([]);
  const [gameState, setGameState] = useState('playing');
  const [errors, setErrors] = useState(new Set());
  const [showErrors, setShowErrors] = useState(true);

  const size = GRID_SIZES[sizeKey];

  const initGame = useCallback(() => {
    const data = generatePuzzle(size, difficultyKey);
    setPuzzleData(data);
    setHEdges(Array(size).fill(null).map(() => Array(size - 1).fill(false)));
    setVEdges(Array(size - 1).fill(null).map(() => Array(size).fill(false)));
    setGameState('playing');
    setErrors(new Set());
  }, [size, difficultyKey]);

  useEffect(() => {
    initGame();
  }, [initGame]);

  useEffect(() => {
    if (!puzzleData) return;
    
    if (showErrors) {
      setErrors(findErrors(puzzleData.circleGrid, hEdges, vEdges, size));
    } else {
      setErrors(new Set());
    }
    
    if (checkSolved(puzzleData.circleGrid, hEdges, vEdges, size)) {
      setGameState('won');
    }
  }, [hEdges, vEdges, puzzleData, size, showErrors]);

  const toggleHEdge = (r, c) => {
    if (gameState !== 'playing') return;
    setHEdges(prev => {
      const newEdges = prev.map(row => [...row]);
      newEdges[r][c] = !newEdges[r][c];
      return newEdges;
    });
  };

  const toggleVEdge = (r, c) => {
    if (gameState !== 'playing') return;
    setVEdges(prev => {
      const newEdges = prev.map(row => [...row]);
      newEdges[r][c] = !newEdges[r][c];
      return newEdges;
    });
  };

  const handleReset = () => {
    setHEdges(Array(size).fill(null).map(() => Array(size - 1).fill(false)));
    setVEdges(Array(size - 1).fill(null).map(() => Array(size).fill(false)));
    setGameState('playing');
  };

  if (!puzzleData) return null;

  // Calculate cell size based on grid
  const cellSize = 50;
  const gridWidth = size * cellSize;
  const gridHeight = size * cellSize;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Link to="/" className={styles.backLink}>← Back to Games</Link>
        <h1 className={styles.title}>Hotaru Beam</h1>
        <p className={styles.instructions}>
          Draw lines to form closed loops. Each numbered circle must have exactly that many line segments touching it.
          Click between cells to draw/remove lines.
        </p>
      </div>

      <div className={styles.selectors}>
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
        <div className={styles.difficultySelector}>
          {Object.keys(DIFFICULTY).map((key) => (
            <button
              key={key}
              className={`${styles.difficultyBtn} ${difficultyKey === key ? styles.active : ''}`}
              onClick={() => setDifficultyKey(key)}
            >
              {key}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.gameArea}>
        <div 
          className={styles.gridContainer}
          style={{ width: gridWidth, height: gridHeight }}
        >
          {/* Grid cells */}
          {puzzleData.circleGrid.map((row, r) =>
            row.map((circle, c) => {
              const hasError = errors.has(`cell-${r}-${c}`);
              const edgeCount = countEdges(r, c, hEdges, vEdges, size);
              
              return (
                <div
                  key={`cell-${r}-${c}`}
                  className={`${styles.cell} ${hasError ? styles.errorCell : ''}`}
                  style={{
                    left: c * cellSize,
                    top: r * cellSize,
                    width: cellSize,
                    height: cellSize,
                  }}
                >
                  {circle > 0 && (
                    <div className={`${styles.circle} ${edgeCount === circle ? styles.satisfied : ''}`}>
                      {circle}
                    </div>
                  )}
                </div>
              );
            })
          )}

          {/* Horizontal edges */}
          {hEdges.map((row, r) =>
            row.map((isActive, c) => (
              <button
                key={`h-${r}-${c}`}
                className={`${styles.edge} ${styles.hEdge} ${isActive ? styles.active : ''}`}
                style={{
                  left: (c + 1) * cellSize - 8,
                  top: r * cellSize + cellSize / 2 - 4,
                }}
                onClick={() => toggleHEdge(r, c)}
              />
            ))
          )}

          {/* Vertical edges */}
          {vEdges.map((row, r) =>
            row.map((isActive, c) => (
              <button
                key={`v-${r}-${c}`}
                className={`${styles.edge} ${styles.vEdge} ${isActive ? styles.active : ''}`}
                style={{
                  left: c * cellSize + cellSize / 2 - 4,
                  top: (r + 1) * cellSize - 8,
                }}
                onClick={() => toggleVEdge(r, c)}
              />
            ))
          )}

          {/* Draw lines for active edges */}
          <svg className={styles.linesSvg} style={{ width: gridWidth, height: gridHeight }}>
            {hEdges.map((row, r) =>
              row.map((isActive, c) =>
                isActive && (
                  <line
                    key={`line-h-${r}-${c}`}
                    x1={(c + 0.5) * cellSize}
                    y1={(r + 0.5) * cellSize}
                    x2={(c + 1.5) * cellSize}
                    y2={(r + 0.5) * cellSize}
                    className={styles.line}
                  />
                )
              )
            )}
            {vEdges.map((row, r) =>
              row.map((isActive, c) =>
                isActive && (
                  <line
                    key={`line-v-${r}-${c}`}
                    x1={(c + 0.5) * cellSize}
                    y1={(r + 0.5) * cellSize}
                    x2={(c + 0.5) * cellSize}
                    y2={(r + 1.5) * cellSize}
                    className={styles.line}
                  />
                )
              )
            )}
          </svg>
        </div>

        {gameState === 'won' && (
          <div className={styles.winMessage}>
            <div className={styles.winEmoji}>🎉</div>
            <h3>Puzzle Solved!</h3>
            <p>All loops complete!</p>
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
