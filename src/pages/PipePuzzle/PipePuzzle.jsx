import { useTranslation } from 'react-i18next';
import { useState, useEffect, useCallback } from 'react';
import GameHeader from '../../components/GameHeader';
import SizeSelector from '../../components/SizeSelector';
import GameResult from '../../components/GameResult';
import { useGameState } from '../../hooks/useGameState';
import { useGameStats } from '../../hooks/useGameStats';
import { usePersistedState } from '../../hooks/usePersistedState';
import styles from './PipePuzzle.module.css';

// Pipe types: each pipe has openings in certain directions
// Directions: 0=top, 1=right, 2=bottom, 3=left
const PIPE_TYPES = {
  dead: { openings: [0], symbol: '╷' }, // dead end (opens upward by default)
  straight: { openings: [0, 2], symbol: '│' }, // vertical
  corner: { openings: [1, 2], symbol: '┘' }, // bottom-right
  tee: { openings: [0, 1, 2], symbol: '├' }, // T-junction
  cross: { openings: [0, 1, 2, 3], symbol: '┼' }, // 4-way
};

const GRID_SIZES = {
  '4×4': 4,
  '5×5': 5,
  '6×6': 6,
  '7×7': 7,
};

// Rotate openings by 90 degrees clockwise
function rotateOpenings(openings, times) {
  return openings.map(dir => (dir + times) % 4);
}

// Check if two cells are connected
function areConnected(grid, r1, c1, r2, c2) {
  const cell1 = grid[r1][c1];
  const cell2 = grid[r2][c2];

  // Determine direction from cell1 to cell2
  let dir1to2, dir2to1;
  if (r2 < r1) { dir1to2 = 0; dir2to1 = 2; } // cell2 is above
  else if (r2 > r1) { dir1to2 = 2; dir2to1 = 0; } // cell2 is below
  else if (c2 > c1) { dir1to2 = 1; dir2to1 = 3; } // cell2 is right
  else { dir1to2 = 3; dir2to1 = 1; } // cell2 is left

  const openings1 = rotateOpenings(PIPE_TYPES[cell1.type].openings, cell1.rotation);
  const openings2 = rotateOpenings(PIPE_TYPES[cell2.type].openings, cell2.rotation);

  return openings1.includes(dir1to2) && openings2.includes(dir2to1);
}

// Find all connected cells from start using BFS
function findConnected(grid, startRow, startCol) {
  const size = grid.length;
  const visited = new Set();
  const queue = [[startRow, startCol]];
  const connected = new Set();

  while (queue.length > 0) {
    const [r, c] = queue.shift();
    const key = `${r},${c}`;

    if (visited.has(key)) continue;
    visited.add(key);
    connected.add(key);

    // Check all 4 neighbors
    const neighbors = [
      [r - 1, c], // top
      [r, c + 1], // right
      [r + 1, c], // bottom
      [r, c - 1], // left
    ];

    for (const [nr, nc] of neighbors) {
      if (nr >= 0 && nr < size && nc >= 0 && nc < size && !visited.has(`${nr},${nc}`)) {
        if (areConnected(grid, r, c, nr, nc)) {
          queue.push([nr, nc]);
        }
      }
    }
  }

  return connected;
}

// Generate a solvable puzzle
function generatePuzzle(size) {
  // Create a solved grid first by building a path
  const grid = Array(size).fill(null).map(() =>
    Array(size).fill(null).map(() => ({ type: 'straight', rotation: 0 }))
  );

  // Build a spanning tree using randomized DFS
  const visited = new Set();
  const connections = new Map(); // Store connections for each cell

  function dfs(r, c) {
    visited.add(`${r},${c}`);
    connections.set(`${r},${c}`, new Set());

    const neighbors = [
      [r - 1, c, 0, 2], // top: my opening 0, their opening 2
      [r, c + 1, 1, 3], // right
      [r + 1, c, 2, 0], // bottom
      [r, c - 1, 3, 1], // left
    ].sort(() => Math.random() - 0.5);

    for (const [nr, nc, myDir, theirDir] of neighbors) {
      if (nr >= 0 && nr < size && nc >= 0 && nc < size && !visited.has(`${nr},${nc}`)) {
        connections.get(`${r},${c}`).add(myDir);
        dfs(nr, nc);
        connections.get(`${nr},${nc}`).add(theirDir);
      }
    }
  }

  dfs(0, 0);

  // Convert connections to pipe types
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const dirs = Array.from(connections.get(`${r},${c}`)).sort((a, b) => a - b);

      // Find matching pipe type and rotation
      for (const [type, data] of Object.entries(PIPE_TYPES)) {
        if (data.openings.length !== dirs.length) continue;

        // Try all rotations
        for (let rot = 0; rot < 4; rot++) {
          const rotated = rotateOpenings(data.openings, rot).sort((a, b) => a - b);
          if (JSON.stringify(rotated) === JSON.stringify(dirs)) {
            grid[r][c] = { type, rotation: rot };
            break;
          }
        }
      }
    }
  }

  // Scramble rotations
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      grid[r][c].rotation = Math.floor(Math.random() * 4);
    }
  }

  return grid;
}

// Check if puzzle is solved (all pipes connected)
function checkSolved(grid) {
  const size = grid.length;
  const connected = findConnected(grid, 0, 0);
  return connected.size === size * size;
}

// Export helpers for testing
export {
  PIPE_TYPES,
  GRID_SIZES,
  rotateOpenings,
  areConnected,
  findConnected,
  generatePuzzle,
  checkSolved,
};

export default function PipePuzzle() {
  const { t } = useTranslation();
  const [gridSizeKey, setGridSizeKey] = useState('5×5');
  const [grid, setGrid] = useState([]);
  const [moves, setMoves] = useState(0);
  const { gameState, checkWin, reset: resetGameState, isWon } = useGameState();
  const [connectedCells, setConnectedCells] = useState(new Set());
  const [bestScores, setBestScores] = usePersistedState('pipe-puzzle-best', {});

  const size = GRID_SIZES[gridSizeKey];

  const initGame = useCallback(() => {
    const newGrid = generatePuzzle(size);
    setGrid(newGrid);
    setMoves(0);
    resetGameState();
    setConnectedCells(findConnected(newGrid, 0, 0));
  }, [size, resetGameState]);

  useEffect(() => {
    initGame();
  }, [initGame]);

  const handleCellClick = (row, col) => {
    if (isWon) return;

    const newGrid = grid.map(r => r.map(c => ({ ...c })));
    newGrid[row][col].rotation = (newGrid[row][col].rotation + 1) % 4;
    setGrid(newGrid);
    setMoves(prev => prev + 1);

    const newConnected = findConnected(newGrid, 0, 0);
    setConnectedCells(newConnected);

    if (checkSolved(newGrid)) {
      checkWin(true);
      const key = gridSizeKey;
      if (!bestScores[key] || moves + 1 < bestScores[key]) {
        setBestScores(prev => ({ ...prev, [key]: moves + 1 }));
      }
    }
  };

  const getPipeSymbol = (type, rotation) => {
    // Symbols must match the openings after rotation
    // Directions: 0=top, 1=right, 2=bottom, 3=left
    const symbols = {
      // dead: base openings [2] (bottom)
      // rot 0: bottom, rot 1: left, rot 2: top, rot 3: right
      dead: ['╷', '╴', '╵', '╶'],
      // straight: base openings [0, 2] (top, bottom = vertical)
      // rot 0: vertical, rot 1: horizontal, rot 2: vertical, rot 3: horizontal
      straight: ['│', '─', '│', '─'],
      // corner: base openings [1, 2] (right, bottom)
      // rot 0: right+bottom, rot 1: bottom+left, rot 2: left+top, rot 3: top+right
      corner: ['┌', '┐', '┘', '└'],
      // tee: base openings [0, 1, 2] (top, right, bottom) = closed on left
      // rot 0: closed left, rot 1: closed top, rot 2: closed right, rot 3: closed bottom
      tee: ['├', '┬', '┤', '┴'],
      // cross: all directions open, same for all rotations
      cross: ['┼', '┼', '┼', '┼'],
    };
    return symbols[type][rotation];
  };

  return (
    <div className={styles.container}>
      <GameHeader
        title="Pipe Puzzle"
        instructions="Connect all pipes to the water source 💧 in the top-left corner. Click any pipe to rotate it 90°."
      />

      <SizeSelector
        sizes={Object.keys(GRID_SIZES)}
        selectedSize={gridSizeKey}
        onSizeChange={setGridSizeKey}
        getLabel={(key) => key}
      />

      <div className={styles.gameArea}>
        <div className={styles.statsBar}>
          <div className={styles.stat}>
            <span className={styles.statLabel}>Moves</span>
            <span className={styles.statValue}>{moves}</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statLabel}>Connected</span>
            <span className={styles.statValue}>{connectedCells.size}/{size * size}</span>
          </div>
          {bestScores[gridSizeKey] && (
            <div className={styles.stat}>
              <span className={styles.statLabel}>Best</span>
              <span className={styles.statValue}>{bestScores[gridSizeKey]}</span>
            </div>
          )}
        </div>

        <div
          className={styles.grid}
          style={{
            gridTemplateColumns: `repeat(${size}, 1fr)`,
            width: `${size * 55}px`,
            height: `${size * 55}px`,
          }}
        >
          {grid.map((row, rowIndex) =>
            row.map((cell, colIndex) => {
              const isConnected = connectedCells.has(`${rowIndex},${colIndex}`);
              const isStart = rowIndex === 0 && colIndex === 0;

              return (
                <button
                  key={`${rowIndex}-${colIndex}`}
                  className={`${styles.cell} ${isConnected ? styles.connected : ''} ${isStart ? styles.start : ''}`}
                  onClick={() => handleCellClick(rowIndex, colIndex)}
                >
                  {isStart && <span className={styles.waterSource}>💧</span>}
                  <span className={styles.pipe}>
                    {getPipeSymbol(cell.type, cell.rotation)}
                  </span>
                </button>
              );
            })
          )}
        </div>

        {gameState === 'won' && (
          <GameResult
            state="won"
            title="All Connected!"
            message={`Solved in ${moves} moves`}
          />
        )}

        <button className={styles.newGameBtn} onClick={initGame}>
          {gameState === 'won' ? 'Play Again' : 'New Puzzle'}
        </button>
      </div>
    </div>
  );
}
