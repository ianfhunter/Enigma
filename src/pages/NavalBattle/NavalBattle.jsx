import { useState, useEffect, useCallback } from 'react';
import GameHeader from '../../components/GameHeader';
import SizeSelector from '../../components/SizeSelector';
import DifficultySelector from '../../components/DifficultySelector';
import GiveUpButton from '../../components/GiveUpButton';
import GameResult from '../../components/GameResult';
import styles from './NavalBattle.module.css';

// Load puzzles from dataset
import battleshipPuzzles from '../../../public/datasets/battleshipPuzzles.json';

const GRID_SIZES = {
  '6×6': 6,
  '8×8': 8,
  '10×10': 10,
  '12×12': 12,
};

const DIFFICULTIES = ['Easy', 'Medium', 'Hard'];

// Cell states
const EMPTY = 0;
const WATER = 1;
const SHIP = 2;

// Ship segment types for visual display
const SEGMENT_TYPES = {
  SINGLE: 'single',     // ●
  LEFT: 'left',         // ◀
  RIGHT: 'right',       // ▶
  TOP: 'top',           // ▲
  BOTTOM: 'bottom',     // ▼
  MIDDLE_H: 'middle_h', // ═
  MIDDLE_V: 'middle_v', // ║
};

// Parse hints from dataset
function parseHints(hints) {
  const hintSet = new Set();
  for (let r = 0; r < hints.length; r++) {
    for (let c = 0; c < hints[r].length; c++) {
      const cell = hints[r][c];
      if (cell === 'x') {
        hintSet.add(`water:${r},${c}`);
      } else if (cell !== '-') {
        // Ship hint (o, w, e, n, s, m)
        hintSet.add(`${r},${c}`);
      }
    }
  }
  return hintSet;
}

// Parse segment types from a grid (hints or solution)
function parseSegmentTypes(grid) {
  const segments = {};
  for (let r = 0; r < grid.length; r++) {
    for (let c = 0; c < grid[r].length; c++) {
      const cell = grid[r][c];
      if (cell === 'o') {
        segments[`${r},${c}`] = SEGMENT_TYPES.SINGLE;
      } else if (cell === 'w') {
        segments[`${r},${c}`] = SEGMENT_TYPES.LEFT;
      } else if (cell === 'e') {
        segments[`${r},${c}`] = SEGMENT_TYPES.RIGHT;
      } else if (cell === 'n') {
        segments[`${r},${c}`] = SEGMENT_TYPES.TOP;
      } else if (cell === 's') {
        segments[`${r},${c}`] = SEGMENT_TYPES.BOTTOM;
      } else if (cell === 'm') {
        // Check context to determine horizontal or vertical
        const leftIsShip = c > 0 && !['x', '-'].includes(grid[r][c-1]);
        const rightIsShip = c < grid[r].length - 1 && !['x', '-'].includes(grid[r][c+1]);
        segments[`${r},${c}`] = (leftIsShip || rightIsShip) ? SEGMENT_TYPES.MIDDLE_H : SEGMENT_TYPES.MIDDLE_V;
      }
    }
  }
  return segments;
}

// Convert solution grid to internal format
function parseSolution(solution) {
  const rows = solution.length;
  const cols = solution[0]?.length || 0;
  const grid = Array(rows).fill(null).map(() => Array(cols).fill(EMPTY));

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < solution[r].length; c++) {
      const cell = solution[r][c];
      if (cell === 'x') {
        grid[r][c] = WATER;
      } else if (cell !== '-') {
        grid[r][c] = SHIP;
      }
    }
  }

  return grid;
}

function checkValidity(playerGrid, rowCounts, colCounts, size) {
  const errors = new Set();

  // Check row counts
  for (let r = 0; r < size; r++) {
    const count = playerGrid[r].filter(cell => cell === SHIP).length;
    if (count > rowCounts[r]) {
      for (let c = 0; c < size; c++) {
        if (playerGrid[r][c] === SHIP) errors.add(`${r},${c}`);
      }
    }
  }

  // Check column counts
  for (let c = 0; c < size; c++) {
    let count = 0;
    for (let r = 0; r < size; r++) {
      if (playerGrid[r][c] === SHIP) count++;
    }
    if (count > colCounts[c]) {
      for (let r = 0; r < size; r++) {
        if (playerGrid[r][c] === SHIP) errors.add(`${r},${c}`);
      }
    }
  }

  // Check that ships don't touch diagonally
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (playerGrid[r][c] === SHIP) {
        const diagonals = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
        for (const [dr, dc] of diagonals) {
          const nr = r + dr;
          const nc = c + dc;
          if (nr >= 0 && nr < size && nc >= 0 && nc < size) {
            if (playerGrid[nr][nc] === SHIP) {
              const orthogonallyConnected =
                (playerGrid[r][nc] === SHIP) || (playerGrid[nr][c] === SHIP);
              if (!orthogonallyConnected) {
                errors.add(`${r},${c}`);
                errors.add(`${nr},${nc}`);
              }
            }
          }
        }
      }
    }
  }

  return errors;
}

function checkSolved(playerGrid, rowCounts, colCounts, size, fleet) {
  // Check all row counts match exactly
  for (let r = 0; r < size; r++) {
    const count = playerGrid[r].filter(cell => cell === SHIP).length;
    if (count !== rowCounts[r]) return false;
  }

  // Check all column counts match exactly
  for (let c = 0; c < size; c++) {
    let count = 0;
    for (let r = 0; r < size; r++) {
      if (playerGrid[r][c] === SHIP) count++;
    }
    if (count !== colCounts[c]) return false;
  }

  // Check ships don't touch diagonally (without orthogonal connection)
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (playerGrid[r][c] === SHIP) {
        const diagonals = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
        for (const [dr, dc] of diagonals) {
          const nr = r + dr, nc = c + dc;
          if (nr >= 0 && nr < size && nc >= 0 && nc < size) {
            if (playerGrid[nr][nc] === SHIP) {
              const orthogonallyConnected =
                (playerGrid[r][nc] === SHIP) || (playerGrid[nr][c] === SHIP);
              if (!orthogonallyConnected) return false;
            }
          }
        }
      }
    }
  }

  // Extract ships and verify fleet composition
  const visited = new Set();
  const foundShips = [];

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (playerGrid[r][c] === SHIP && !visited.has(`${r},${c}`)) {
        // BFS to find connected ship cells
        const ship = [];
        const queue = [[r, c]];
        visited.add(`${r},${c}`);

        while (queue.length > 0) {
          const [cr, cc] = queue.shift();
          ship.push([cr, cc]);

          // Check orthogonal neighbors
          const neighbors = [[0, 1], [0, -1], [1, 0], [-1, 0]];
          for (const [dr, dc] of neighbors) {
            const nr = cr + dr, nc = cc + dc;
            if (nr >= 0 && nr < size && nc >= 0 && nc < size) {
              if (playerGrid[nr][nc] === SHIP && !visited.has(`${nr},${nc}`)) {
                visited.add(`${nr},${nc}`);
                queue.push([nr, nc]);
              }
            }
          }
        }

        foundShips.push(ship.length);
      }
    }
  }

  // Compare found ships to expected fleet
  const expectedFleet = [...fleet].sort((a, b) => b - a);
  const actualFleet = foundShips.sort((a, b) => b - a);

  if (expectedFleet.length !== actualFleet.length) return false;
  for (let i = 0; i < expectedFleet.length; i++) {
    if (expectedFleet[i] !== actualFleet[i]) return false;
  }

  return true;
}

function getShipEmoji(segmentType) {
  switch (segmentType) {
    case SEGMENT_TYPES.SINGLE: return '●';
    case SEGMENT_TYPES.LEFT: return '◀';
    case SEGMENT_TYPES.RIGHT: return '▶';
    case SEGMENT_TYPES.TOP: return '▲';
    case SEGMENT_TYPES.BOTTOM: return '▼';
    case SEGMENT_TYPES.MIDDLE_H: return '═';
    case SEGMENT_TYPES.MIDDLE_V: return '║';
    default: return '■';
  }
}

// Export helpers for testing
export {
  GRID_SIZES,
  DIFFICULTIES,
  EMPTY,
  WATER,
  SHIP,
  SEGMENT_TYPES,
  parseHints,
  parseSegmentTypes,
  parseSolution,
  checkValidity,
  checkSolved,
};

export default function NavalBattle() {
  const [sizeKey, setSizeKey] = useState('10×10');
  const [difficulty, setDifficulty] = useState('Medium');
  const [puzzleData, setPuzzleData] = useState(null);
  const [playerGrid, setPlayerGrid] = useState(null);
  const [gameState, setGameState] = useState('playing');
  const [errors, setErrors] = useState(new Set());
  const [showErrors, setShowErrors] = useState(true);
  const [showSolution, setShowSolution] = useState(false);
  const [waterMode, setWaterMode] = useState(false);

  const size = GRID_SIZES[sizeKey];

  const initGame = useCallback(() => {
    // Filter puzzles by size and difficulty
    const matchingPuzzles = battleshipPuzzles.puzzles.filter(p => {
      const matchSize = p.rows === size && p.cols === size;
      const matchDiff = p.difficulty?.toLowerCase() === difficulty.toLowerCase();
      return matchSize && matchDiff;
    });

    let availablePuzzles = matchingPuzzles.length > 0
      ? matchingPuzzles
      : battleshipPuzzles.puzzles.filter(p => p.rows === size && p.cols === size);

    if (availablePuzzles.length === 0) {
      const sizes = [...new Set(battleshipPuzzles.puzzles.map(p => p.rows))].sort((a, b) => Math.abs(a - size) - Math.abs(b - size));
      if (sizes.length > 0) {
        availablePuzzles = battleshipPuzzles.puzzles.filter(p => p.rows === sizes[0]);
      }
    }

    if (availablePuzzles.length === 0) {
      console.error('No puzzles available');
      return;
    }

    const puzzle = availablePuzzles[Math.floor(Math.random() * availablePuzzles.length)];
    const hints = parseHints(puzzle.hints);

    const data = {
      size: puzzle.rows,
      fleet: puzzle.shipSizes,
      rowCounts: puzzle.rowCounts,
      colCounts: puzzle.colCounts,
      hints,
      hintSegments: parseSegmentTypes(puzzle.hints),
      solutionGrid: parseSolution(puzzle.solution),
      solutionSegments: parseSegmentTypes(puzzle.solution),
    };

    setPuzzleData(data);

    // Initialize player grid with hints from dataset (trust them completely)
    const initialGrid = Array(data.size).fill(null).map(() => Array(data.size).fill(EMPTY));
    for (let r = 0; r < puzzle.hints.length; r++) {
      for (let c = 0; c < puzzle.hints[r].length; c++) {
        const cell = puzzle.hints[r][c];
        if (cell === 'x') {
          initialGrid[r][c] = WATER;
        } else if (cell !== '-') {
          initialGrid[r][c] = SHIP;
        }
      }
    }

    setPlayerGrid(initialGrid);
    setGameState('playing');
    setErrors(new Set());
    setShowSolution(false);
  }, [size, difficulty]);

  useEffect(() => {
    initGame();
  }, [initGame]);

  useEffect(() => {
    if (!puzzleData || !playerGrid) return;

    const newErrors = showErrors && !showSolution
      ? checkValidity(playerGrid, puzzleData.rowCounts, puzzleData.colCounts, puzzleData.size)
      : new Set();
    setErrors(newErrors);

    if (!showSolution && checkSolved(playerGrid, puzzleData.rowCounts, puzzleData.colCounts, puzzleData.size, puzzleData.fleet)) {
      setGameState('won');
    }
  }, [playerGrid, puzzleData, showErrors, showSolution]);

  const handleCellClick = (r, c, e) => {
    if (gameState !== 'playing' || showSolution) return;

    const isHint = puzzleData.hints.has(`${r},${c}`) || puzzleData.hints.has(`water:${r},${c}`);
    if (isHint) return;

    const isWaterAction = e.type === 'contextmenu' || e.ctrlKey || e.button === 2 || waterMode;

    if (isWaterAction) {
      if (e.type === 'contextmenu') e.preventDefault();
      setPlayerGrid(prev => {
        const newGrid = prev.map(row => [...row]);
        if (newGrid[r][c] === WATER) {
          newGrid[r][c] = EMPTY;
        } else {
          newGrid[r][c] = WATER;
        }
        return newGrid;
      });
    } else {
      setPlayerGrid(prev => {
        const newGrid = prev.map(row => [...row]);
        if (newGrid[r][c] === SHIP) {
          newGrid[r][c] = EMPTY;
        } else {
          newGrid[r][c] = SHIP;
        }
        return newGrid;
      });
    }
  };

  const handleReset = () => {
    if (!puzzleData) return;
    const initialGrid = Array(puzzleData.size).fill(null).map(() => Array(puzzleData.size).fill(EMPTY));
    for (const hint of puzzleData.hints) {
      if (hint.startsWith('water:')) {
        const [r, c] = hint.slice(6).split(',').map(Number);
        initialGrid[r][c] = WATER;
      } else {
        const [r, c] = hint.split(',').map(Number);
        initialGrid[r][c] = SHIP;
      }
    }
    setPlayerGrid(initialGrid);
    setGameState('playing');
    setShowSolution(false);
  };

  const handleGiveUp = () => {
    if (!puzzleData || gameState !== 'playing') return;
    setShowSolution(true);
    setGameState('gaveUp');
  };

  if (!puzzleData || !playerGrid) return null;

  // Show solution grid when given up, otherwise player grid
  const displayGrid = showSolution ? puzzleData.solutionGrid : playerGrid;
  // Use appropriate segments based on display mode
  const getSegmentType = (r, c) => {
    if (showSolution && puzzleData.solutionSegments) {
      return puzzleData.solutionSegments[`${r},${c}`];
    }
    if (puzzleData.hintSegments && puzzleData.hintSegments[`${r},${c}`]) {
      return puzzleData.hintSegments[`${r},${c}`];
    }
    return null;
  };

  return (
    <div className={styles.container}>
      <GameHeader
        title="Naval Battle"
        instructions="Place ships on the grid using the row and column counts. Ships cannot touch each other, even diagonally. Click to place ship parts, right-click to mark water."
      />

      <SizeSelector
        sizes={Object.keys(GRID_SIZES)}
        selected={sizeKey}
        onSelect={setSizeKey}
      />

      <DifficultySelector
        difficulties={DIFFICULTIES}
        selected={difficulty}
        onSelect={setDifficulty}
      />

      <div className={styles.gameArea}>
        <button
          className={`${styles.waterToggle} ${waterMode ? styles.waterModeActive : ''}`}
          onClick={() => setWaterMode(!waterMode)}
        >
          ~ {waterMode ? 'Water Mode ON' : 'Water Mode'}
        </button>

        <div className={styles.fleetInfo}>
          <span className={styles.fleetLabel}>Fleet:</span>
          {puzzleData.fleet.map((len, i) => (
            <span key={i} className={styles.shipPreview}>
              {len === 1 ? '●' : `◀${'■'.repeat(Math.max(0, len - 2))}▶`}
            </span>
          ))}
        </div>

        <div className={styles.gridWrapper}>
          <div
            className={styles.colCounts}
            style={{ gridTemplateColumns: `32px repeat(${puzzleData.size}, 32px)` }}
          >
            <div className={styles.corner}></div>
            {puzzleData.colCounts.map((count, c) => (
              <div key={c} className={styles.count}>{count}</div>
            ))}
          </div>

          <div className={styles.mainGrid}>
            <div className={styles.rowCounts}>
              {puzzleData.rowCounts.map((count, r) => (
                <div key={r} className={styles.count}>{count}</div>
              ))}
            </div>

            <div
              className={styles.grid}
              style={{ gridTemplateColumns: `repeat(${puzzleData.size}, 32px)` }}
            >
              {displayGrid.map((row, r) =>
                row.map((cell, c) => {
                  const isShip = cell === SHIP;
                  const isWater = cell === WATER;
                  const isHint = puzzleData.hints.has(`${r},${c}`) || puzzleData.hints.has(`water:${r},${c}`);
                  const hasError = errors.has(`${r},${c}`);
                  const segmentType = getSegmentType(r, c);

                  return (
                    <button
                      key={`${r}-${c}`}
                      className={`
                        ${styles.cell}
                        ${isShip ? styles.ship : ''}
                        ${isWater ? styles.water : ''}
                        ${isHint ? styles.hint : ''}
                        ${hasError ? styles.error : ''}
                      `}
                      onClick={(e) => handleCellClick(r, c, e)}
                      onContextMenu={(e) => handleCellClick(r, c, e)}
                    >
                      {isShip && (segmentType ? getShipEmoji(segmentType) : '■')}
                      {isWater && '~'}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {gameState === 'won' && (
          <GameResult
            state="won"
            title="🚢 Fleet Located!"
            message="All ships correctly placed!"
          />
        )}

        {gameState === 'gaveUp' && (
          <GameResult
            state="gaveup"
            title="Solution Revealed"
            message="Here's how it should be solved."
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
          <button className={styles.newGameBtn} onClick={initGame}>
            New Puzzle
          </button>
        </div>

        <div className={styles.legend}>
          <span>Left click: Ship</span>
          <span>Right click: Water</span>
        </div>
      </div>
    </div>
  );
}
