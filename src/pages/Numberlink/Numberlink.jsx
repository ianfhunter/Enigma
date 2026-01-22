import { useTranslation } from 'react-i18next';
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import GameHeader from '../../components/GameHeader';
import DifficultySelector from '../../components/DifficultySelector';
import SizeSelector from '../../components/SizeSelector';
import GiveUpButton from '../../components/GiveUpButton';
import GameResult from '../../components/GameResult';
import { useGameState } from '../../hooks/useGameState';
import styles from './Numberlink.module.css';
import puzzleDataset from '../../../public/datasets/numberlinkPuzzles.json';

const COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4',
  '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6', '#f43f5e',
  '#6366f1', '#84cc16', '#f472b6', '#0ea5e9', '#a855f7'
];

// Direction encoding: each letter maps to ord(letter) - 96
// Two letters: first * 26 + second
const DIR_MOVE = {
  n: [-1, 0],  // North = up
  s: [1, 0],   // South = down
  e: [0, 1],   // East = right
  w: [0, -1]   // West = left
};

const DIR_OPPOSITE = { n: 's', s: 'n', e: 'w', w: 'e' };

// Decode solution value to direction string (e.g., 153 -> 'ew')
function decodeDirections(val) {
  if (val <= 26) {
    return String.fromCharCode(val + 96);
  }
  const first = Math.floor(val / 26);
  const second = val % 26;
  return String.fromCharCode(first + 96) + String.fromCharCode(second + 96);
}

// Trace paths from the solution grid
function tracePaths(endpoints, solution, rows, cols) {
  // Build endpoint map: pairId -> [{r, c}, {r, c}]
  const endpointMap = {};
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const val = endpoints[r][c];
      if (val !== null) {
        if (!endpointMap[val]) endpointMap[val] = [];
        endpointMap[val].push({ r, c });
      }
    }
  }

  const solutionPaths = {};
  const pathsInfo = [];

  for (const [pairIdStr, positions] of Object.entries(endpointMap)) {
    const pairId = parseInt(pairIdStr);
    if (positions.length !== 2) continue;

    const [start, end] = positions;

    // Trace from start to end using decoded directions
    let r = start.r, c = start.c;
    const path = [{ r, c }];
    let cameFrom = null;

    for (let i = 0; i < rows * cols; i++) {
      if (r === end.r && c === end.c && path.length > 1) break;

      const solVal = solution[r][c];
      const dirs = decodeDirections(solVal);

      // Find next direction (not the one we came from)
      let nextDir = null;
      for (const d of dirs) {
        if (cameFrom === null || d !== DIR_OPPOSITE[cameFrom]) {
          nextDir = d;
          break;
        }
      }

      if (!nextDir) break;

      const [dr, dc] = DIR_MOVE[nextDir];
      const nr = r + dr, nc = c + dc;

      if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) break;

      path.push({ r: nr, c: nc });
      cameFrom = nextDir;
      r = nr;
      c = nc;
    }

    solutionPaths[pairId] = path;
    pathsInfo.push({
      id: pairId,
      start,
      end
    });
  }

  return { solutionPaths, pathsInfo };
}

// Export helpers for testing
export {
  COLORS,
  DIR_MOVE,
  DIR_OPPOSITE,
  decodeDirections,
  tracePaths,
};

export default function Numberlink() {
  // Build available difficulties and sizes from dataset
  const { difficulties, sizesByDifficulty } = useMemo(() => {
    const diffSet = new Set();
    const sizesMap = {};

    puzzleDataset.puzzles.forEach(p => {
      const diff = p.difficulty || 'medium';
      diffSet.add(diff);
      if (!sizesMap[diff]) sizesMap[diff] = new Set();
      sizesMap[diff].add(`${p.rows}x${p.cols}`);
    });

    return {
      difficulties: ['easy', 'medium', 'hard'].filter(d => diffSet.has(d)),
      sizesByDifficulty: Object.fromEntries(
        Object.entries(sizesMap).map(([d, s]) => [d, [...s].sort()])
      )
    };
  }, []);

  const [difficulty, setDifficulty] = useState(difficulties[0] || 'easy');
  const [sizeKey, setSizeKey] = useState(() => {
    const sizes = sizesByDifficulty[difficulties[0] || 'easy'] || [];
    return sizes[0] || '5x5';
  });
  const [puzzleData, setPuzzleData] = useState(null);
  const [paths, setPaths] = useState({}); // { pairId: [{r, c}, ...] }
  const [currentPath, setCurrentPath] = useState(null); // Currently drawing path
  const [isDrawing, setIsDrawing] = useState(false);
  const { gameState, checkWin, giveUp, reset: resetGameState, isPlaying } = useGameState();
  const [completedPairs, setCompletedPairs] = useState(new Set());

  const gridRef = useRef(null);

  // Update size options when difficulty changes
  useEffect(() => {
    const sizes = sizesByDifficulty[difficulty] || [];
    if (sizes.length > 0 && !sizes.includes(sizeKey)) {
      setSizeKey(sizes[0]);
    }
  }, [difficulty, sizesByDifficulty, sizeKey]);

  const initGame = useCallback(() => {
    // Filter puzzles by difficulty and size
    const [targetRows, targetCols] = sizeKey.split('x').map(Number);
    const candidates = puzzleDataset.puzzles.filter(p =>
      (p.difficulty || 'medium') === difficulty &&
      p.rows === targetRows && p.cols === targetCols
    );

    if (candidates.length === 0) {
      console.warn('No puzzles found for', difficulty, sizeKey);
      return;
    }

    // Pick random puzzle
    const puzzle = candidates[Math.floor(Math.random() * candidates.length)];

    // Build grid from endpoints
    const grid = puzzle.endpoints.map(row =>
      row.map(v => v === null ? 0 : v)
    );

    // Trace solution paths
    const { solutionPaths, pathsInfo } = tracePaths(
      puzzle.endpoints,
      puzzle.solution,
      puzzle.rows,
      puzzle.cols
    );

    setPuzzleData({
      grid,
      rows: puzzle.rows,
      cols: puzzle.cols,
      paths: pathsInfo,
      numPairs: pathsInfo.length,
      solutionPaths
    });
    setPaths({});
    setCurrentPath(null);
    setIsDrawing(false);
    resetGameState();
    setCompletedPairs(new Set());
  }, [difficulty, sizeKey, resetGameState]);

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

    // Fixed operator precedence: must have && before ||
    return isValidStart && isValidEnd && (start.r !== end.r || start.c !== end.c);
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
    if (!isPlaying) return;

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
    if (!isDrawing || !currentPath || !isPlaying) return;

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
          checkWin(true);
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
    // Check win condition only if currently playing (not if gave up)
    if (puzzleData && completedPairs.size === puzzleData.numPairs && isPlaying) {
      checkWin(true);
    }
  }, [completedPairs, puzzleData, isPlaying, checkWin]);

  const handleGiveUp = () => {
    if (!puzzleData || !isPlaying) return;
    // Use the pre-traced solution paths
    setPaths(puzzleData.solutionPaths);
    setCompletedPairs(new Set(Object.keys(puzzleData.solutionPaths).map(Number)));
    giveUp();
  };

  const handleReset = () => {
    setPaths({});
    setCompletedPairs(new Set());
    setCurrentPath(null);
    resetGameState();
  };

  if (!puzzleData) return null;

  return (
    <div className={styles.container}>
      <GameHeader
        title="Numberlink"
        instructions="Connect matching numbers with a continuous line. Lines cannot cross or share cells. Click and drag to draw paths."
      />

      <DifficultySelector
        difficulties={difficulties}
        selected={difficulty}
        onSelect={setDifficulty}
      />

      <SizeSelector
        sizes={sizesByDifficulty[difficulty] || []}
        selected={sizeKey}
        onSelect={setSizeKey}
      />

      <div className={styles.gameArea}>
        <div className={styles.progress}>
          <span>Connected: {completedPairs.size} / {puzzleData.numPairs}</span>
        </div>

        <div
          ref={gridRef}
          className={styles.grid}
          style={{
            gridTemplateColumns: `repeat(${puzzleData.cols}, 1fr)`,
            width: `${puzzleData.cols * 45}px`,
            height: `${puzzleData.rows * 45}px`,
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
          <GameResult
            state="won"
            title="🎉 All Connected!"
            message="Puzzle solved perfectly"
          />
        )}

        {gameState === 'gaveUp' && (
          <GameResult
            state="gaveup"
            title="Solution Revealed"
            message="Better luck next time!"
          />
        )}

        <div className={styles.buttons}>
          <button className={styles.resetBtn} onClick={handleReset}>
            Reset
          </button>
          <GiveUpButton
            onGiveUp={handleGiveUp}
            disabled={!isPlaying}
          />
          <button className={styles.newGameBtn} onClick={initGame}>
            {gameState === 'won' || gameState === 'gaveUp' ? 'Play Again' : 'New Puzzle'}
          </button>
        </div>
      </div>
    </div>
  );
}
