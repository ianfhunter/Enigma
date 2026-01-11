import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import styles from './Numberlink.module.css';

const GRID_SIZES = {
  '5×5': 5,
  '7×7': 7,
  '9×9': 9,
};

const COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4',
  '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6', '#f43f5e'
];

// Generate a guaranteed-solvable Numberlink puzzle by creating paths first
function generatePuzzle(size) {
  const grid = Array(size).fill(null).map(() => Array(size).fill(0));
  const solutionGrid = Array(size).fill(null).map(() => Array(size).fill(0));
  const paths = [];
  const solutionPaths = [];

  // Target number of pairs based on grid size
  const targetPairs = Math.floor(size * size * 0.4 / 2); // ~40% coverage, divided into pairs

  let pairId = 1;
  let attempts = 0;
  const maxAttempts = 1000;

  while (pairId <= targetPairs && attempts < maxAttempts) {
    attempts++;

    // Find a random empty starting cell
    const emptyCells = [];
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (solutionGrid[r][c] === 0) {
          emptyCells.push({ r, c });
        }
      }
    }

    if (emptyCells.length < 4) break; // Need room for paths

    // Pick random start
    const startIdx = Math.floor(Math.random() * emptyCells.length);
    const start = emptyCells[startIdx];

    // Generate a random walk path from start
    const path = [{ r: start.r, c: start.c }];
    const visited = new Set([`${start.r},${start.c}`]);

    // Random path length between 3 and reasonable max
    const minLength = 3;
    const maxLength = Math.min(size * 2, Math.floor(emptyCells.length / 3));
    const targetLength = minLength + Math.floor(Math.random() * (maxLength - minLength + 1));

    let current = { ...start };

    for (let step = 0; step < targetLength - 1; step++) {
      // Get valid neighbors (empty, not visited)
      const neighbors = [];
      const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];

      for (const [dr, dc] of dirs) {
        const nr = current.r + dr;
        const nc = current.c + dc;
        const key = `${nr},${nc}`;

        if (nr >= 0 && nr < size && nc >= 0 && nc < size &&
            solutionGrid[nr][nc] === 0 && !visited.has(key)) {
          neighbors.push({ r: nr, c: nc });
        }
      }

      if (neighbors.length === 0) break;

      // Pick random neighbor with some bias towards continuing direction
      const next = neighbors[Math.floor(Math.random() * neighbors.length)];
      path.push(next);
      visited.add(`${next.r},${next.c}`);
      current = next;
    }

    // Only accept paths of sufficient length
    if (path.length >= minLength) {
      // Mark path in solution grid
      for (const cell of path) {
        solutionGrid[cell.r][cell.c] = pairId;
      }

      const startCell = path[0];
      const endCell = path[path.length - 1];

      // Mark endpoints in puzzle grid
      grid[startCell.r][startCell.c] = pairId;
      grid[endCell.r][endCell.c] = pairId;

      paths.push({
        id: pairId,
        start: { r: startCell.r, c: startCell.c },
        end: { r: endCell.r, c: endCell.c }
      });

      solutionPaths.push({
        id: pairId,
        cells: path
      });

      pairId++;
      attempts = 0; // Reset attempts on success
    }
  }

  // If we got very few pairs, try again
  if (paths.length < 2) {
    return generatePuzzle(size);
  }

  return { grid, paths, numPairs: paths.length, solutionPaths };
}

export default function Numberlink() {
  const [sizeKey, setSizeKey] = useState('7×7');
  const [puzzleData, setPuzzleData] = useState(null);
  const [paths, setPaths] = useState({}); // { pairId: [{r, c}, ...] }
  const [currentPath, setCurrentPath] = useState(null); // Currently drawing path
  const [isDrawing, setIsDrawing] = useState(false);
  const [gameState, setGameState] = useState('playing');
  const [completedPairs, setCompletedPairs] = useState(new Set());

  const gridRef = useRef(null);
  const size = GRID_SIZES[sizeKey];

  const initGame = useCallback(() => {
    const data = generatePuzzle(size);
    setPuzzleData(data);
    setPaths({});
    setCurrentPath(null);
    setIsDrawing(false);
    setGameState('playing');
    setCompletedPairs(new Set());
  }, [size]);

  useEffect(() => {
    initGame();
  }, [initGame]);

  // Check if a cell is a numbered endpoint
  const isEndpoint = useCallback((r, c) => {
    return puzzleData?.grid[r][c] !== 0;
  }, [puzzleData]);

  // Get pair ID at cell
  const getPairAt = useCallback((r, c) => {
    return puzzleData?.grid[r][c] || 0;
  }, [puzzleData]);

  // Check if path connects the pair properly
  const checkPathComplete = useCallback((pairId, path) => {
    if (!puzzleData || path.length < 2) return false;

    const pair = puzzleData.paths.find(p => p.id === pairId);
    if (!pair) return false;

    const start = path[0];
    const end = path[path.length - 1];

    const isValidStart = (start.r === pair.start.r && start.c === pair.start.c) ||
                         (start.r === pair.end.r && start.c === pair.end.c);
    const isValidEnd = (end.r === pair.start.r && end.c === pair.start.c) ||
                       (end.r === pair.end.r && end.c === pair.end.c);

    return isValidStart && isValidEnd && start.r !== end.r || start.c !== end.c;
  }, [puzzleData]);

  // Check if cell is occupied by another path
  const isCellOccupied = useCallback((r, c, excludePairId = null) => {
    for (const [pairId, path] of Object.entries(paths)) {
      if (parseInt(pairId) === excludePairId) continue;
      if (path.some(cell => cell.r === r && cell.c === c)) {
        return true;
      }
    }
    return false;
  }, [paths]);

  // Check if two cells are adjacent
  const areAdjacent = (cell1, cell2) => {
    return Math.abs(cell1.r - cell2.r) + Math.abs(cell1.c - cell2.c) === 1;
  };

  const startDrawing = (r, c) => {
    if (gameState !== 'playing') return;

    const pairId = getPairAt(r, c);
    if (pairId === 0) {
      // Check if clicking on an existing path to erase it
      for (const [id, path] of Object.entries(paths)) {
        if (path.some(cell => cell.r === r && cell.c === c)) {
          // Remove this path
          setPaths(prev => {
            const newPaths = { ...prev };
            delete newPaths[id];
            return newPaths;
          });
          setCompletedPairs(prev => {
            const newSet = new Set(prev);
            newSet.delete(parseInt(id));
            return newSet;
          });
          return;
        }
      }
      return;
    }

    // Clear existing path for this pair
    setPaths(prev => {
      const newPaths = { ...prev };
      delete newPaths[pairId];
      return newPaths;
    });
    setCompletedPairs(prev => {
      const newSet = new Set(prev);
      newSet.delete(pairId);
      return newSet;
    });

    setCurrentPath({ pairId, cells: [{ r, c }] });
    setIsDrawing(true);
  };

  const continueDrawing = (r, c) => {
    if (!isDrawing || !currentPath || gameState !== 'playing') return;

    const lastCell = currentPath.cells[currentPath.cells.length - 1];

    // Must be adjacent
    if (!areAdjacent(lastCell, { r, c })) return;

    // Check if we're backtracking
    if (currentPath.cells.length >= 2) {
      const prevCell = currentPath.cells[currentPath.cells.length - 2];
      if (prevCell.r === r && prevCell.c === c) {
        // Backtrack
        setCurrentPath(prev => ({
          ...prev,
          cells: prev.cells.slice(0, -1)
        }));
        return;
      }
    }

    // Can't cross own path (except at the endpoint)
    const isEndpointForPair = getPairAt(r, c) === currentPath.pairId;
    if (currentPath.cells.some(cell => cell.r === r && cell.c === c)) return;

    // Can't cross other paths
    if (isCellOccupied(r, c, currentPath.pairId)) return;

    // Can only stop at own endpoints or empty cells
    const cellPair = getPairAt(r, c);
    if (cellPair !== 0 && cellPair !== currentPath.pairId) return;

    // Add to path
    const newCells = [...currentPath.cells, { r, c }];
    setCurrentPath(prev => ({ ...prev, cells: newCells }));

    // Check if completed
    if (isEndpointForPair && newCells.length > 1) {
      const pair = puzzleData.paths.find(p => p.id === currentPath.pairId);
      const startCell = newCells[0];
      const endCell = { r, c };

      const connectsStart = (startCell.r === pair.start.r && startCell.c === pair.start.c) ||
                           (startCell.r === pair.end.r && startCell.c === pair.end.c);
      const connectsEnd = (endCell.r === pair.start.r && endCell.c === pair.start.c) ||
                         (endCell.r === pair.end.r && endCell.c === pair.end.c);

      if (connectsStart && connectsEnd) {
        // Path complete!
        setPaths(prev => ({
          ...prev,
          [currentPath.pairId]: newCells
        }));
        setCompletedPairs(prev => new Set([...prev, currentPath.pairId]));
        setCurrentPath(null);
        setIsDrawing(false);

        // Check win condition
        if (completedPairs.size + 1 === puzzleData.numPairs) {
          setGameState('won');
        }
      }
    }
  };

  const stopDrawing = () => {
    if (currentPath && currentPath.cells.length > 1) {
      const lastCell = currentPath.cells[currentPath.cells.length - 1];
      const isComplete = getPairAt(lastCell.r, lastCell.c) === currentPath.pairId;

      if (!isComplete) {
        // Incomplete path - don't save it
        setCurrentPath(null);
      }
    }
    setIsDrawing(false);
  };

  // Handle touch/mouse events
  const handleCellEnter = (r, c) => {
    if (isDrawing) {
      continueDrawing(r, c);
    }
  };

  const getCellState = (r, c) => {
    // Check if it's an endpoint
    const pairId = getPairAt(r, c);

    // Check current drawing path
    if (currentPath?.cells.some(cell => cell.r === r && cell.c === c)) {
      return { inPath: true, pairId: currentPath.pairId };
    }

    // Check completed paths
    for (const [id, path] of Object.entries(paths)) {
      if (path.some(cell => cell.r === r && cell.c === c)) {
        return { inPath: true, pairId: parseInt(id) };
      }
    }

    return { inPath: false, pairId };
  };

  useEffect(() => {
    // Check win condition
    if (puzzleData && completedPairs.size === puzzleData.numPairs) {
      setGameState('won');
    }
  }, [completedPairs, puzzleData]);

  if (!puzzleData) return null;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Link to="/" className={styles.backLink}>← Back to Games</Link>
        <h1 className={styles.title}>Numberlink</h1>
        <p className={styles.instructions}>
          Connect matching numbers with a continuous line. Lines cannot cross or share cells.
          Click and drag to draw paths.
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
        <div className={styles.progress}>
          <span>Connected: {completedPairs.size} / {puzzleData.numPairs}</span>
        </div>

        <div
          ref={gridRef}
          className={styles.grid}
          style={{
            gridTemplateColumns: `repeat(${size}, 1fr)`,
            width: `${size * 45}px`,
            height: `${size * 45}px`,
          }}
          onMouseLeave={stopDrawing}
          onMouseUp={stopDrawing}
          onTouchEnd={stopDrawing}
        >
          {puzzleData.grid.map((row, r) =>
            row.map((cell, c) => {
              const state = getCellState(r, c);
              const pairId = cell || state.pairId;
              const color = pairId ? COLORS[(pairId - 1) % COLORS.length] : null;
              const isNumber = cell !== 0;
              const isCompleted = completedPairs.has(pairId);

              return (
                <div
                  key={`${r}-${c}`}
                  className={`
                    ${styles.cell}
                    ${state.inPath ? styles.inPath : ''}
                    ${isNumber ? styles.endpoint : ''}
                    ${isCompleted ? styles.completed : ''}
                  `}
                  style={{
                    '--cell-color': color,
                    backgroundColor: state.inPath ? `${color}40` : undefined,
                  }}
                  onMouseDown={() => startDrawing(r, c)}
                  onMouseEnter={() => handleCellEnter(r, c)}
                  onTouchStart={() => startDrawing(r, c)}
                >
                  {isNumber && (
                    <span
                      className={styles.number}
                      style={{ backgroundColor: color }}
                    >
                      {cell}
                    </span>
                  )}
                </div>
              );
            })
          )}
        </div>

        {gameState === 'won' && (
          <div className={styles.winMessage}>
            <div className={styles.winEmoji}>🎉</div>
            <h3>All Connected!</h3>
            <p>Puzzle solved perfectly</p>
          </div>
        )}

        <button className={styles.newGameBtn} onClick={initGame}>
          {gameState === 'won' ? 'Play Again' : 'New Puzzle'}
        </button>
      </div>
    </div>
  );
}
