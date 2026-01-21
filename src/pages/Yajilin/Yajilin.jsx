import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { createSeededRandom, getTodayDateString, stringToSeed } from '../../data/wordUtils';
import GameHeader from '../../components/GameHeader';
import DifficultySelector from '../../components/DifficultySelector';
import SeedDisplay from '../../components/SeedDisplay';
import GiveUpButton from '../../components/GiveUpButton';
import GameResult from '../../components/GameResult';
import styles from './Yajilin.module.css';

const DIFFICULTIES = ['easy', 'medium', 'hard'];

const DIRECTIONS = {
  n: { dr: -1, dc: 0, symbol: '↑' },
  s: { dr: 1, dc: 0, symbol: '↓' },
  w: { dr: 0, dc: -1, symbol: '←' },
  e: { dr: 0, dc: 1, symbol: '→' },
};

// Path segment codes map to connections: which sides of the cell the path passes through
const PATH_CONNECTIONS = {
  ns: ['n', 's'],
  ew: ['e', 'w'],
  ne: ['n', 'e'],
  nw: ['n', 'w'],
  se: ['s', 'e'],
  sw: ['s', 'w'],
};

// Parse dataset clue format: "1w" → { count: 1, direction: 'w' }
function parseClue(clueStr) {
  if (!clueStr) return null;
  const match = clueStr.match(/^(\d+)([nsew])$/);
  if (!match) return null;
  return { count: parseInt(match[1], 10), direction: match[2] };
}

// Parse solution to extract shaded cells and path connections
function parseSolution(solutionGrid) {
  const rows = solutionGrid.length;
  const cols = solutionGrid[0]?.length || 0;

  const shaded = Array(rows).fill(null).map(() => Array(cols).fill(false));
  const pathSegments = new Set();

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cell = solutionGrid[r][c];
      if (cell === 'x') {
        shaded[r][c] = true;
      } else if (cell && PATH_CONNECTIONS[cell]) {
        // Add path segments based on connections
        const connections = PATH_CONNECTIONS[cell];
        for (const dir of connections) {
          const { dr, dc } = DIRECTIONS[dir];
          const nr = r + dr;
          const nc = c + dc;
          if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
            // Create normalized segment key (smaller coords first)
            const key = makeSegmentKey(r, c, nr, nc);
            pathSegments.add(key);
          }
        }
      }
    }
  }

  return { shaded, pathSegments };
}

// Create normalized segment key for edge between two adjacent cells
function makeSegmentKey(r1, c1, r2, c2) {
  if (r1 < r2 || (r1 === r2 && c1 < c2)) {
    return `${r1},${c1}-${r2},${c2}`;
  }
  return `${r2},${c2}-${r1},${c1}`;
}

// Convert dataset puzzle to game format
function datasetToGameFormat(puzzle) {
  const rows = puzzle.rows;
  const cols = puzzle.cols;

  const clues = puzzle.clues.map(row => row.map(cell => parseClue(cell)));
  const { shaded, pathSegments } = parseSolution(puzzle.solution);

  return {
    rows,
    cols,
    clues,
    solutionShaded: shaded,
    solutionPath: pathSegments,
    id: puzzle.id,
    difficulty: puzzle.difficulty,
    source: puzzle.source,
  };
}

// Load dataset
let datasetCache = null;
let loadingPromise = null;

async function loadDataset() {
  if (datasetCache) return datasetCache;
  if (loadingPromise) return loadingPromise;

  loadingPromise = fetch('/datasets/yajilinPuzzles.json')
    .then(res => {
      if (!res.ok) throw new Error(`Failed to load Yajilin puzzles: ${res.status}`);
      return res.json();
    })
    .then(data => {
      datasetCache = data.puzzles || [];
      return datasetCache;
    })
    .catch(err => {
      console.error('Failed to load Yajilin dataset:', err);
      datasetCache = [];
      return datasetCache;
    })
    .finally(() => {
      loadingPromise = null;
    });

  return loadingPromise;
}

// Select puzzle by difficulty and seed
function selectPuzzle(puzzles, difficulty, seed) {
  const random = createSeededRandom(seed);
  const filtered = puzzles.filter(p => p.difficulty === difficulty);
  const list = filtered.length > 0 ? filtered : puzzles;
  if (list.length === 0) return null;
  return list[Math.floor(random() * list.length)];
}

// Check if a clue is satisfied
function checkClue(shaded, clue, r, c, rows, cols) {
  if (!clue) return null;

  const { direction, count } = clue;
  const { dr, dc } = DIRECTIONS[direction];

  let shadedCount = 0;
  let nr = r + dr;
  let nc = c + dc;

  while (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
    if (shaded[nr]?.[nc]) shadedCount++;
    nr += dr;
    nc += dc;
  }

  return shadedCount === count;
}

// Check if shaded cells have adjacent shaded (error)
function hasAdjacentShaded(shaded, r, c, rows, cols) {
  if (!shaded[r]?.[c]) return false;
  for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
    const nr = r + dr;
    const nc = c + dc;
    if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && shaded[nr]?.[nc]) {
      return true;
    }
  }
  return false;
}

// Get path connections for a cell based on current path segments
function getCellConnections(pathSegments, r, c, rows, cols) {
  const connections = [];
  for (const [dir, { dr, dc }] of Object.entries(DIRECTIONS)) {
    const nr = r + dr;
    const nc = c + dc;
    if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
      const key = makeSegmentKey(r, c, nr, nc);
      if (pathSegments.has(key)) {
        connections.push(dir);
      }
    }
  }
  return connections;
}

// Validate loop: must be a single closed loop visiting all required cells
function validateLoop(pathSegments, shaded, clues, rows, cols) {
  if (pathSegments.size === 0) return { valid: false, reason: 'no-path' };

  // Get all cells that should be part of the loop (not shaded, not clue cells)
  const requiredCells = new Set();
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (!shaded[r][c] && !clues[r][c]) {
        requiredCells.add(`${r},${c}`);
      }
    }
  }

  // Check each required cell has exactly 2 connections (part of loop)
  for (const cellKey of requiredCells) {
    const [r, c] = cellKey.split(',').map(Number);
    const connections = getCellConnections(pathSegments, r, c, rows, cols);
    if (connections.length !== 2) {
      return { valid: false, reason: 'incomplete' };
    }
  }

  // Check that path only goes through required cells
  const visitedCells = new Set();
  for (const segmentKey of pathSegments) {
    const [cell1, cell2] = segmentKey.split('-');
    visitedCells.add(cell1);
    visitedCells.add(cell2);
  }

  for (const cellKey of visitedCells) {
    if (!requiredCells.has(cellKey)) {
      return { valid: false, reason: 'invalid-cell' };
    }
  }

  // Check all required cells are visited
  for (const cellKey of requiredCells) {
    if (!visitedCells.has(cellKey)) {
      return { valid: false, reason: 'missing-cells' };
    }
  }

  // Verify it's a single closed loop by traversing
  const startCell = [...requiredCells][0];
  if (!startCell) return { valid: true, reason: 'empty' }; // No required cells

  const [startR, startC] = startCell.split(',').map(Number);
  const visited = new Set();
  let currentR = startR;
  let currentC = startC;
  let prevR = -1;
  let prevC = -1;

  while (true) {
    const cellKey = `${currentR},${currentC}`;
    if (visited.has(cellKey)) {
      // Back to start?
      if (currentR === startR && currentC === startC && visited.size === requiredCells.size) {
        return { valid: true };
      }
      return { valid: false, reason: 'multiple-loops' };
    }
    visited.add(cellKey);

    const connections = getCellConnections(pathSegments, currentR, currentC, rows, cols);
    if (connections.length !== 2) {
      return { valid: false, reason: 'broken' };
    }

    // Find next cell (not the one we came from)
    let foundNext = false;
    for (const dir of connections) {
      const { dr, dc } = DIRECTIONS[dir];
      const nr = currentR + dr;
      const nc = currentC + dc;
      if (nr !== prevR || nc !== prevC) {
        prevR = currentR;
        prevC = currentC;
        currentR = nr;
        currentC = nc;
        foundNext = true;
        break;
      }
    }

    if (!foundNext) {
      return { valid: false, reason: 'dead-end' };
    }

    // Check if we've completed the loop
    if (currentR === startR && currentC === startC) {
      if (visited.size === requiredCells.size) {
        return { valid: true };
      }
      return { valid: false, reason: 'partial-loop' };
    }
  }
}

// Check if puzzle is solved
function checkSolved(shaded, pathSegments, solutionShaded, clues, rows, cols) {
  // Check shading matches
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (shaded[r][c] !== solutionShaded[r][c]) {
        return false;
      }
    }
  }

  // Check loop is valid
  const loopResult = validateLoop(pathSegments, shaded, clues, rows, cols);
  return loopResult.valid;
}

// Export for testing
export {
  parseClue,
  parseSolution,
  datasetToGameFormat,
  selectPuzzle,
  checkClue,
  checkSolved,
  loadDataset,
  makeSegmentKey,
  getCellConnections,
  validateLoop,
  hasAdjacentShaded,
};

export default function Yajilin() {
  const { t } = useTranslation();
  const [difficulty, setDifficulty] = useState('easy');
  const [puzzleData, setPuzzleData] = useState(null);
  const [shaded, setShaded] = useState([]);
  const [pathSegments, setPathSegments] = useState(new Set());
  const [gameState, setGameState] = useState('playing');
  const [showErrors, setShowErrors] = useState(true);
  const [showSolution, setShowSolution] = useState(false);
  const [loading, setLoading] = useState(true);
  const [seed, setSeed] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [lastDragCell, setLastDragCell] = useState(null);
  const datasetRef = useRef(null);
  const gridRef = useRef(null);

  // Load dataset on mount
  useEffect(() => {
    let mounted = true;
    loadDataset().then(puzzles => {
      if (mounted) {
        datasetRef.current = puzzles;
        setLoading(false);
      }
    });
    return () => { mounted = false; };
  }, []);

  const initGame = useCallback((newDifficulty = difficulty, newSeed = null) => {
    const puzzles = datasetRef.current;
    if (!puzzles || puzzles.length === 0) return;

    const today = getTodayDateString();
    const actualSeed = newSeed ?? stringToSeed(`yajilin-${today}-${newDifficulty}`);
    setSeed(actualSeed);

    const puzzle = selectPuzzle(puzzles, newDifficulty, actualSeed);
    if (!puzzle) return;

    const data = datasetToGameFormat(puzzle);
    setPuzzleData(data);
    setShaded(Array(data.rows).fill(null).map(() => Array(data.cols).fill(false)));
    setPathSegments(new Set());
    setGameState('playing');
    setShowSolution(false);
  }, [difficulty]);

  // Init game when dataset loads or difficulty changes
  useEffect(() => {
    if (!loading && datasetRef.current) {
      initGame();
    }
  }, [loading, difficulty, initGame]);

  // Check win condition
  useEffect(() => {
    if (!puzzleData || gameState !== 'playing') return;
    if (checkSolved(shaded, pathSegments, puzzleData.solutionShaded, puzzleData.clues, puzzleData.rows, puzzleData.cols)) {
      setGameState('won');
    }
  }, [shaded, pathSegments, puzzleData, gameState]);

  const handleGiveUp = () => {
    setShowSolution(true);
    setGameState('gaveUp');
  };

  // Handle cell click for shading
  const handleCellClick = (r, c, e) => {
    if (gameState !== 'playing' || showSolution) return;
    if (puzzleData.clues[r][c]) return; // Can't modify clue cells
    if (isDragging) return; // Don't toggle while dragging

    // Right click or ctrl+click clears path from cell
    if (e.button === 2 || e.ctrlKey) {
      e.preventDefault();
      clearCellPath(r, c);
      return;
    }

    setShaded(prev => {
      const newShaded = prev.map(row => [...row]);
      newShaded[r][c] = !newShaded[r][c];
      // If shading, clear any path through this cell
      if (newShaded[r][c]) {
        clearCellPath(r, c);
      }
      return newShaded;
    });
  };

  // Clear path segments connected to a cell
  const clearCellPath = (r, c) => {
    setPathSegments(prev => {
      const newSet = new Set(prev);
      const toRemove = [];
      for (const key of newSet) {
        if (key.includes(`${r},${c}`)) {
          toRemove.push(key);
        }
      }
      toRemove.forEach(k => newSet.delete(k));
      return newSet;
    });
  };

  // Get cell coordinates from mouse position
  const getCellFromPosition = (clientX, clientY) => {
    if (!gridRef.current || !puzzleData) return null;
    const rect = gridRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    // Account for gap (2px) and padding (2px)
    const gap = 2;
    const padding = 2;
    const cellWithGap = cellSize + gap;

    // Adjust for padding and calculate cell
    const adjustedX = x - padding;
    const adjustedY = y - padding;

    const c = Math.floor(adjustedX / cellWithGap);
    const r = Math.floor(adjustedY / cellWithGap);

    if (r >= 0 && r < puzzleData.rows && c >= 0 && c < puzzleData.cols) {
      return { r, c };
    }
    return null;
  };

  // Handle mouse down for path drawing
  const handleMouseDown = (e) => {
    if (gameState !== 'playing' || showSolution) return;
    if (e.button !== 0) return; // Only left button for drawing

    const cell = getCellFromPosition(e.clientX, e.clientY);
    if (cell && !puzzleData.clues[cell.r][cell.c] && !shaded[cell.r]?.[cell.c]) {
      setIsDragging(true);
      setLastDragCell(cell);
    }
  };

  // Handle mouse move for path drawing
  const handleMouseMove = (e) => {
    if (!isDragging || !lastDragCell) return;

    const cell = getCellFromPosition(e.clientX, e.clientY);
    if (!cell) return;

    // Only connect adjacent cells
    const dr = cell.r - lastDragCell.r;
    const dc = cell.c - lastDragCell.c;
    if (Math.abs(dr) + Math.abs(dc) !== 1) return;

    // Don't draw through clue cells or shaded cells
    if (puzzleData.clues[cell.r][cell.c]) return;
    if (shaded[cell.r]?.[cell.c]) return;
    if (puzzleData.clues[lastDragCell.r][lastDragCell.c]) return;
    if (shaded[lastDragCell.r]?.[lastDragCell.c]) return;

    const segmentKey = makeSegmentKey(lastDragCell.r, lastDragCell.c, cell.r, cell.c);

    setPathSegments(prev => {
      const newSet = new Set(prev);
      if (newSet.has(segmentKey)) {
        newSet.delete(segmentKey);
      } else {
        newSet.add(segmentKey);
      }
      return newSet;
    });

    setLastDragCell(cell);
  };

  // Handle mouse up
  const handleMouseUp = () => {
    setIsDragging(false);
    setLastDragCell(null);
  };

  // Handle touch events for mobile
  const handleTouchStart = (e) => {
    if (gameState !== 'playing' || showSolution) return;
    const touch = e.touches[0];
    const cell = getCellFromPosition(touch.clientX, touch.clientY);
    if (cell && !puzzleData.clues[cell.r][cell.c] && !shaded[cell.r]?.[cell.c]) {
      setIsDragging(true);
      setLastDragCell(cell);
    }
  };

  const handleTouchMove = (e) => {
    if (!isDragging || !lastDragCell) return;
    e.preventDefault();
    const touch = e.touches[0];
    const cell = getCellFromPosition(touch.clientX, touch.clientY);
    if (!cell) return;

    const dr = cell.r - lastDragCell.r;
    const dc = cell.c - lastDragCell.c;
    if (Math.abs(dr) + Math.abs(dc) !== 1) return;

    if (puzzleData.clues[cell.r][cell.c]) return;
    if (shaded[cell.r]?.[cell.c]) return;
    if (puzzleData.clues[lastDragCell.r][lastDragCell.c]) return;
    if (shaded[lastDragCell.r]?.[lastDragCell.c]) return;

    const segmentKey = makeSegmentKey(lastDragCell.r, lastDragCell.c, cell.r, cell.c);

    setPathSegments(prev => {
      const newSet = new Set(prev);
      if (newSet.has(segmentKey)) {
        newSet.delete(segmentKey);
      } else {
        newSet.add(segmentKey);
      }
      return newSet;
    });

    setLastDragCell(cell);
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    setLastDragCell(null);
  };

  const handleReset = () => {
    if (!puzzleData) return;
    setShaded(Array(puzzleData.rows).fill(null).map(() => Array(puzzleData.cols).fill(false)));
    setPathSegments(new Set());
    setGameState('playing');
    setShowSolution(false);
  };

  const handleNewPuzzle = () => {
    initGame(Date.now());
  };

  // Prevent context menu on right click
  const handleContextMenu = (e) => {
    e.preventDefault();
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <GameHeader
          title="Yajilin"
          instructions="Loading puzzles..."
        />
        <div className={styles.loading}>{t('common.loadingPuzzles')}</div>
      </div>
    );
  }

  if (!puzzleData || shaded.length !== puzzleData.rows) return null;

  const { rows, cols, clues, solutionShaded, solutionPath } = puzzleData;
  const cellSize = Math.max(30, Math.min(50, 400 / Math.max(rows, cols)));
  const displayShaded = showSolution ? solutionShaded : shaded;
  const displayPath = showSolution ? solutionPath : pathSegments;

  return (
    <div className={styles.container}>
      <GameHeader
        title="Yajilin"
        instructions="Shade cells and draw a loop. Arrow clues show shaded cell counts in that direction. Click to shade, drag to draw path. The loop must pass through all non-shaded cells."
      />

      {seed !== null && (
        <SeedDisplay
          seed={seed}
          variant="compact"
          showNewButton={false}
          showShare={false}
          onSeedChange={(newSeed) => {
            // Convert string seeds to numbers if needed
            const seedNum = typeof newSeed === 'string'
              ? (isNaN(parseInt(newSeed, 10)) ? stringToSeed(newSeed) : parseInt(newSeed, 10))
              : newSeed;
            initGame(difficulty, seedNum);
          }}
        />
      )}

      <DifficultySelector
        difficulties={DIFFICULTIES}
        selected={difficulty}
        onSelect={setDifficulty}
      />

      <div className={styles.gameArea}>
        <div
          ref={gridRef}
          className={styles.grid}
          style={{
            gridTemplateColumns: `repeat(${cols}, ${cellSize}px)`,
            gridTemplateRows: `repeat(${rows}, ${cellSize}px)`,
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onContextMenu={handleContextMenu}
        >
          {displayShaded.map((row, r) =>
            row.map((isShaded, c) => {
              const clue = clues[r][c];
              const clueResult = showErrors && !showSolution && clue ? checkClue(displayShaded, clue, r, c, rows, cols) : null;
              const clueError = clueResult === false;
              const adjacentError = showErrors && !showSolution && hasAdjacentShaded(displayShaded, r, c, rows, cols);
              const connections = getCellConnections(displayPath, r, c, rows, cols);

              return (
                <button
                  key={`${r}-${c}`}
                  className={`
                    ${styles.cell}
                    ${isShaded ? styles.shaded : ''}
                    ${clueError || adjacentError ? styles.error : ''}
                    ${clueResult === true ? styles.satisfied : ''}
                    ${clue ? styles.clueCell : ''}
                    ${showSolution && isShaded ? styles.solutionShaded : ''}
                  `}
                  style={{
                    fontSize: `${Math.max(10, cellSize * 0.35)}px`,
                  }}
                  onClick={(e) => handleCellClick(r, c, e)}
                  onContextMenu={handleContextMenu}
                  disabled={showSolution}
                >
                  {clue && (
                    <span className={styles.clue}>
                      <span className={styles.arrow}>{DIRECTIONS[clue.direction].symbol}</span>
                      <span className={styles.count}>{clue.count}</span>
                    </span>
                  )}
                  {!isShaded && !clue && connections.length > 0 && (
                    <svg className={styles.pathSvg} viewBox="0 0 100 100">
                      {connections.includes('n') && (
                        <line x1="50" y1="50" x2="50" y2="0" />
                      )}
                      {connections.includes('s') && (
                        <line x1="50" y1="50" x2="50" y2="100" />
                      )}
                      {connections.includes('e') && (
                        <line x1="50" y1="50" x2="100" y2="50" />
                      )}
                      {connections.includes('w') && (
                        <line x1="50" y1="50" x2="0" y2="50" />
                      )}
                    </svg>
                  )}
                </button>
              );
            })
          )}
        </div>

        {gameState === 'won' && (
          <GameResult
            state="won"
            title={t('gameStatus.solved')}
            message={t('common.loopComplete', 'Loop complete!')}
          />
        )}

        {gameState === 'gaveUp' && (
          <GameResult
            state="gaveup"
            title="Solution Revealed"
            message="The correct shading and loop are shown."
          />
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
          <GiveUpButton
            onGiveUp={handleGiveUp}
            disabled={gameState !== 'playing'}
          />
          <button className={styles.newGameBtn} onClick={handleNewPuzzle}>
            New Puzzle
          </button>
        </div>
      </div>
    </div>
  );
}
