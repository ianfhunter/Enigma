import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import styles from './Yajilin.module.css';

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

// Cell states: null (empty), 'shaded', 'line-h', 'line-v', 'line-corner-XX'
const LINE_STATES = ['line-h', 'line-v', 'line-tl', 'line-tr', 'line-bl', 'line-br'];

function generatePuzzle(size) {
  // Generate a valid solution with loop and shaded cells
  const shaded = Array(size).fill(null).map(() => Array(size).fill(false));
  const clues = Array(size).fill(null).map(() => Array(size).fill(null));
  
  // Place some random shaded cells (avoiding adjacent)
  const numShaded = Math.floor(size * size * 0.15);
  const positions = [];
  
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      positions.push([r, c]);
    }
  }
  
  // Shuffle
  for (let i = positions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [positions[i], positions[j]] = [positions[j], positions[i]];
  }
  
  let placed = 0;
  for (const [r, c] of positions) {
    if (placed >= numShaded) break;
    
    const hasAdjacentShaded = [
      [r-1, c], [r+1, c], [r, c-1], [r, c+1]
    ].some(([nr, nc]) => 
      nr >= 0 && nr < size && nc >= 0 && nc < size && shaded[nr][nc]
    );
    
    if (!hasAdjacentShaded) {
      shaded[r][c] = true;
      placed++;
    }
  }
  
  // Generate clues for some cells
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (shaded[r][c]) continue;
      if (Math.random() < 0.15) {
        const dir = DIR_KEYS[Math.floor(Math.random() * DIR_KEYS.length)];
        const { dr, dc } = DIRECTIONS[dir];
        
        // Count shaded cells in that direction
        let count = 0;
        let nr = r + dr;
        let nc = c + dc;
        
        while (nr >= 0 && nr < size && nc >= 0 && nc < size) {
          if (shaded[nr][nc]) count++;
          nr += dr;
          nc += dc;
        }
        
        clues[r][c] = { direction: dir, count };
      }
    }
  }
  
  return { clues, solutionShaded: shaded };
}

// Check if a clue is satisfied
function checkClue(grid, clue, r, c, size) {
  if (!clue) return null;
  
  const { direction, count } = clue;
  const { dr, dc } = DIRECTIONS[direction];
  
  let shadedCount = 0;
  let nr = r + dr;
  let nc = c + dc;
  
  while (nr >= 0 && nr < size && nc >= 0 && nc < size) {
    if (grid[nr][nc] === 'shaded') shadedCount++;
    nr += dr;
    nc += dc;
  }
  
  return shadedCount === count;
}

// Check if shaded cells are not adjacent
function checkNoAdjacentShaded(grid, size) {
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (grid[r][c] === 'shaded') {
        for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
          const nr = r + dr;
          const nc = c + dc;
          if (nr >= 0 && nr < size && nc >= 0 && nc < size && grid[nr][nc] === 'shaded') {
            return false;
          }
        }
      }
    }
  }
  return true;
}

// Get line connections for a cell
function getLineConnections(cellState) {
  if (!cellState || cellState === 'shaded') return [];
  switch (cellState) {
    case 'line-h': return ['left', 'right'];
    case 'line-v': return ['up', 'down'];
    case 'line-tl': return ['up', 'left'];
    case 'line-tr': return ['up', 'right'];
    case 'line-bl': return ['down', 'left'];
    case 'line-br': return ['down', 'right'];
    default: return [];
  }
}

// Check if the loop is valid (single closed loop passing through all non-shaded/non-clue cells)
function checkLoop(grid, clues, size) {
  const connections = getLineConnections;
  
  // Find all line cells
  const lineCells = [];
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (grid[r][c] && grid[r][c].startsWith('line-')) {
        lineCells.push([r, c]);
      }
    }
  }
  
  if (lineCells.length === 0) return false;
  
  // Check each line cell has exactly 2 connections that match neighbors
  const opposites = {
    'up': 'down', 'down': 'up', 'left': 'right', 'right': 'left'
  };
  const deltas = {
    'up': [-1, 0], 'down': [1, 0], 'left': [0, -1], 'right': [0, 1]
  };
  
  for (const [r, c] of lineCells) {
    const myConnections = connections(grid[r][c]);
    for (const dir of myConnections) {
      const [dr, dc] = deltas[dir];
      const nr = r + dr;
      const nc = c + dc;
      
      if (nr < 0 || nr >= size || nc < 0 || nc >= size) return false;
      
      const neighborConn = connections(grid[nr][nc]);
      if (!neighborConn.includes(opposites[dir])) return false;
    }
  }
  
  // Check loop is connected (single component)
  if (lineCells.length === 0) return false;
  
  const visited = new Set();
  const queue = [lineCells[0]];
  visited.add(`${lineCells[0][0]},${lineCells[0][1]}`);
  
  while (queue.length > 0) {
    const [r, c] = queue.shift();
    const myConnections = connections(grid[r][c]);
    
    for (const dir of myConnections) {
      const [dr, dc] = deltas[dir];
      const nr = r + dr;
      const nc = c + dc;
      const key = `${nr},${nc}`;
      
      if (!visited.has(key) && nr >= 0 && nr < size && nc >= 0 && nc < size) {
        const neighborConn = connections(grid[nr][nc]);
        if (neighborConn.includes(opposites[dir])) {
          visited.add(key);
          queue.push([nr, nc]);
        }
      }
    }
  }
  
  return visited.size === lineCells.length;
}

function checkSolved(grid, clues, size) {
  // Check no adjacent shaded
  if (!checkNoAdjacentShaded(grid, size)) return false;
  
  // Check all clues
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const result = checkClue(grid, clues[r][c], r, c, size);
      if (result === false) return false;
    }
  }
  
  // Check valid loop
  if (!checkLoop(grid, clues, size)) return false;
  
  // Check all non-shaded, non-clue cells are part of the loop
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (!clues[r][c] && grid[r][c] !== 'shaded' && !grid[r][c]?.startsWith('line-')) {
        return false;
      }
    }
  }
  
  return true;
}

export default function Yajilin() {
  const [sizeKey, setSizeKey] = useState('5×5');
  const [puzzleData, setPuzzleData] = useState(null);
  const [grid, setGrid] = useState([]);
  const [gameState, setGameState] = useState('playing');
  const [showErrors, setShowErrors] = useState(true);
  const [mode, setMode] = useState('shade'); // 'shade' or 'line'

  const size = GRID_SIZES[sizeKey];

  const initGame = useCallback(() => {
    const data = generatePuzzle(size);
    setPuzzleData(data);
    setGrid(Array(size).fill(null).map(() => Array(size).fill(null)));
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
    if (puzzleData.clues[r][c]) return; // Can't modify clue cells

    setGrid(prev => {
      const newGrid = prev.map(row => [...row]);
      const current = newGrid[r][c];
      
      if (mode === 'shade') {
        // Toggle between null and shaded
        newGrid[r][c] = current === 'shaded' ? null : 'shaded';
      } else {
        // Cycle through line states
        const currentIndex = LINE_STATES.indexOf(current);
        if (currentIndex === -1) {
          newGrid[r][c] = LINE_STATES[0];
        } else if (currentIndex === LINE_STATES.length - 1) {
          newGrid[r][c] = null;
        } else {
          newGrid[r][c] = LINE_STATES[currentIndex + 1];
        }
      }
      
      return newGrid;
    });
  };

  const handleReset = () => {
    setGrid(Array(size).fill(null).map(() => Array(size).fill(null)));
    setGameState('playing');
  };

  if (!puzzleData) return null;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Link to="/" className={styles.backLink}>← Back to Games</Link>
        <h1 className={styles.title}>Yajilin</h1>
        <p className={styles.instructions}>
          Shade cells and draw a single closed loop through all remaining cells.
          Arrow clues show how many shaded cells are in that direction.
          Shaded cells cannot be adjacent.
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

      <div className={styles.modeSelector}>
        <button
          className={`${styles.modeBtn} ${mode === 'shade' ? styles.active : ''}`}
          onClick={() => setMode('shade')}
        >
          ⬛ Shade
        </button>
        <button
          className={`${styles.modeBtn} ${mode === 'line' ? styles.active : ''}`}
          onClick={() => setMode('line')}
        >
          ➰ Line
        </button>
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
            row.map((cell, c) => {
              const clue = puzzleData.clues[r][c];
              const clueResult = showErrors && clue ? checkClue(grid, clue, r, c, size) : null;
              const hasError = clueResult === false;
              const isShaded = cell === 'shaded';
              const isLine = cell?.startsWith('line-');
              
              return (
                <button
                  key={`${r}-${c}`}
                  className={`
                    ${styles.cell}
                    ${isShaded ? styles.shaded : ''}
                    ${isLine ? styles[cell] : ''}
                    ${hasError ? styles.error : ''}
                    ${clueResult === true ? styles.satisfied : ''}
                    ${clue ? styles.clueCell : ''}
                  `}
                  onClick={() => handleCellClick(r, c)}
                  disabled={!!clue}
                >
                  {clue && (
                    <span className={styles.clue}>
                      <span className={styles.arrow}>{DIRECTIONS[clue.direction].symbol}</span>
                      <span className={styles.count}>{clue.count}</span>
                    </span>
                  )}
                  {isLine && (
                    <svg className={styles.lineSvg} viewBox="0 0 100 100">
                      {cell === 'line-h' && <line x1="0" y1="50" x2="100" y2="50" />}
                      {cell === 'line-v' && <line x1="50" y1="0" x2="50" y2="100" />}
                      {cell === 'line-tl' && <path d="M 50 0 Q 50 50 0 50" fill="none" />}
                      {cell === 'line-tr' && <path d="M 50 0 Q 50 50 100 50" fill="none" />}
                      {cell === 'line-bl' && <path d="M 50 100 Q 50 50 0 50" fill="none" />}
                      {cell === 'line-br' && <path d="M 50 100 Q 50 50 100 50" fill="none" />}
                    </svg>
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
            <p>The loop is complete!</p>
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
