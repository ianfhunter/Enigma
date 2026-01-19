import { useState, useEffect, useCallback } from 'react';
import GameHeader from '../../components/GameHeader';
import SizeSelector from '../../components/SizeSelector';
import GiveUpButton from '../../components/GiveUpButton';
import GameResult from '../../components/GameResult';
import styles from './Creek.module.css';

const GRID_SIZES = {
  '5×5': 5,
  '7×7': 7,
  '9×9': 9,
};

// Generate a valid Creek solution
function generateSolution(size) {
  const solution = Array(size).fill(null).map(() => Array(size).fill(false));

  // Randomly shade cells, ensuring white cells stay connected
  const numShaded = Math.floor(size * size * 0.4);
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

  let shaded = 0;
  for (const [r, c] of positions) {
    if (shaded >= numShaded) break;

    // Try shading this cell
    solution[r][c] = true;

    // Check if white cells are still connected
    if (!areWhiteCellsConnected(solution, size)) {
      solution[r][c] = false;
    } else {
      shaded++;
    }
  }

  return solution;
}

function areWhiteCellsConnected(grid, size) {
  // Find first white cell
  let start = null;
  for (let r = 0; r < size && !start; r++) {
    for (let c = 0; c < size && !start; c++) {
      if (!grid[r][c]) start = [r, c];
    }
  }

  if (!start) return true; // All shaded is technically valid

  // BFS to count connected white cells
  const visited = new Set();
  const queue = [start];
  visited.add(`${start[0]},${start[1]}`);

  while (queue.length > 0) {
    const [r, c] = queue.shift();

    for (const [nr, nc] of [[r-1, c], [r+1, c], [r, c-1], [r, c+1]]) {
      if (nr >= 0 && nr < size && nc >= 0 && nc < size) {
        const key = `${nr},${nc}`;
        if (!visited.has(key) && !grid[nr][nc]) {
          visited.add(key);
          queue.push([nr, nc]);
        }
      }
    }
  }

  // Count total white cells
  let totalWhite = 0;
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (!grid[r][c]) totalWhite++;
    }
  }

  return visited.size === totalWhite;
}

// Generate clues at vertices (corners between 4 cells)
function generateClues(solution, size) {
  // Clues are at vertices, which are at positions (r, c) where r, c in [0, size]
  // Each vertex touches up to 4 cells: (r-1,c-1), (r-1,c), (r,c-1), (r,c)
  const clues = Array(size + 1).fill(null).map(() => Array(size + 1).fill(null));

  for (let r = 0; r <= size; r++) {
    for (let c = 0; c <= size; c++) {
      // Count shaded cells around this vertex
      let count = 0;
      const cells = [
        [r - 1, c - 1],
        [r - 1, c],
        [r, c - 1],
        [r, c],
      ];

      for (const [cr, cc] of cells) {
        if (cr >= 0 && cr < size && cc >= 0 && cc < size && solution[cr][cc]) {
          count++;
        }
      }

      // Only show some clues (enough to make puzzle solvable)
      // Show clues with 50% probability or at corners/edges
      if (Math.random() < 0.5 || r === 0 || r === size || c === 0 || c === size) {
        clues[r][c] = count;
      }
    }
  }

  return clues;
}

function generatePuzzle(size) {
  const solution = generateSolution(size);
  const clues = generateClues(solution, size);

  return { solution, clues, size };
}

function checkValidity(grid, clues, size) {
  const errors = new Set();

  // Check each clue
  for (let r = 0; r <= size; r++) {
    for (let c = 0; c <= size; c++) {
      if (clues[r][c] === null) continue;

      let count = 0;
      const cells = [
        [r - 1, c - 1],
        [r - 1, c],
        [r, c - 1],
        [r, c],
      ];

      for (const [cr, cc] of cells) {
        if (cr >= 0 && cr < size && cc >= 0 && cc < size) {
          if (grid[cr][cc]) {
            count++;
          }
        }
      }

      // Only show error if count exceeds clue
      if (count > clues[r][c]) {
        for (const [cr, cc] of cells) {
          if (cr >= 0 && cr < size && cc >= 0 && cc < size && grid[cr][cc]) {
            errors.add(`${cr},${cc}`);
          }
        }
      }
    }
  }

  // Check white cells are connected
  let hasAnyWhite = false;
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (grid[r][c] === false) hasAnyWhite = true;
    }
  }

  if (hasAnyWhite && !areWhiteCellsConnectedPartial(grid, size)) {
    // Mark some white cells as errors
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (grid[r][c] === false) {
          errors.add(`${r},${c}`);
        }
      }
    }
  }

  return errors;
}

function areWhiteCellsConnectedPartial(grid, size) {
  // Find first white cell
  let start = null;
  for (let r = 0; r < size && !start; r++) {
    for (let c = 0; c < size && !start; c++) {
      if (grid[r][c] === false) start = [r, c];
    }
  }

  if (!start) return true;

  const visited = new Set();
  const queue = [start];
  visited.add(`${start[0]},${start[1]}`);

  while (queue.length > 0) {
    const [r, c] = queue.shift();

    for (const [nr, nc] of [[r-1, c], [r+1, c], [r, c-1], [r, c+1]]) {
      if (nr >= 0 && nr < size && nc >= 0 && nc < size) {
        const key = `${nr},${nc}`;
        if (!visited.has(key) && (grid[nr][nc] === false || grid[nr][nc] === null)) {
          visited.add(key);
          if (grid[nr][nc] === false) queue.push([nr, nc]);
        }
      }
    }
  }

  let totalWhite = 0;
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (grid[r][c] === false) totalWhite++;
    }
  }

  return visited.size >= totalWhite;
}

function checkSolved(grid, solution, size) {
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (grid[r][c] !== solution[r][c]) return false;
    }
  }
  return true;
}

// Export helpers for testing
export {
  GRID_SIZES,
  generateSolution,
  generateClues,
  generatePuzzle,
  areWhiteCellsConnected,
  areWhiteCellsConnectedPartial,
  checkValidity,
  checkSolved,
};

export default function Creek() {
  const [sizeKey, setSizeKey] = useState('5×5');
  const [puzzleData, setPuzzleData] = useState(null);
  const [grid, setGrid] = useState([]);
  const [gameState, setGameState] = useState('playing');
  const [errors, setErrors] = useState(new Set());
  const [showErrors, setShowErrors] = useState(true);
  const [whiteMode, setWhiteMode] = useState(false); // Mobile white mode

  const size = GRID_SIZES[sizeKey];

  const initGame = useCallback(() => {
    const data = generatePuzzle(size);
    setPuzzleData(data);
    setGrid(Array(size).fill(null).map(() => Array(size).fill(null)));
    setGameState('playing');
    setErrors(new Set());
  }, [size]);

  useEffect(() => {
    initGame();
  }, [initGame]);

  useEffect(() => {
    if (!puzzleData) return;

    const newErrors = showErrors
      ? checkValidity(grid, puzzleData.clues, size)
      : new Set();
    setErrors(newErrors);

    if (checkSolved(grid, puzzleData.solution, size)) {
      setGameState('won');
    }
  }, [grid, puzzleData, showErrors, size]);

  const handleCellClick = (r, c, e) => {
    if (gameState !== 'playing') return;

    const isWhiteAction = e.type === 'contextmenu' || e.ctrlKey || whiteMode;

    if (isWhiteAction) {
      if (e.type === 'contextmenu') e.preventDefault();
      // Mark as white
      setGrid(prev => {
        const newGrid = prev.map(row => [...row]);
        newGrid[r][c] = newGrid[r][c] === false ? null : false;
        return newGrid;
      });
    } else {
      // Mark as shaded
      setGrid(prev => {
        const newGrid = prev.map(row => [...row]);
        newGrid[r][c] = newGrid[r][c] === true ? null : true;
        return newGrid;
      });
    }
  };

  const handleReset = () => {
    setGrid(Array(size).fill(null).map(() => Array(size).fill(null)));
    setGameState('playing');
  };

  const handleGiveUp = () => {
    if (!puzzleData || gameState !== 'playing') return;
    setGrid(puzzleData.solution.map(row => [...row]));
    setGameState('gaveUp');
  };

  if (!puzzleData) return null;

  return (
    <div className={styles.container}>
      <GameHeader
        title="Creek"
        instructions="Shade cells based on corner clues. Each number shows how many of the 4 adjacent cells are shaded. All white cells must be connected orthogonally."
      />

      <SizeSelector
        options={Object.keys(GRID_SIZES)}
        value={sizeKey}
        onChange={setSizeKey}
        className={styles.sizeSelector}
      />

      <div className={styles.gameArea}>
        {/* Mobile White Toggle */}
        <button
          className={`${styles.whiteToggle} ${whiteMode ? styles.whiteModeActive : ''}`}
          onClick={() => setWhiteMode(!whiteMode)}
        >
          ○ {whiteMode ? 'White Mode ON' : 'White Mode'}
        </button>

        <div className={styles.gridWrapper}>
          {/* Grid with clues at vertices */}
          <div className={styles.board} style={{
            gridTemplateColumns: Array(size * 2 + 1).fill(null).map((_, i) => 
              i % 2 === 0 ? 'min-content' : '1fr'
            ).join(' '),
            gridTemplateRows: Array(size * 2 + 1).fill(null).map((_, i) => 
              i % 2 === 0 ? 'min-content' : '1fr'
            ).join(' ')
          }}>
            {Array(size * 2 + 1).fill(null).map((_, row) =>
              Array(size * 2 + 1).fill(null).map((_, col) => {
                const isVertex = row % 2 === 0 && col % 2 === 0;
                const isCell = row % 2 === 1 && col % 2 === 1;

                if (isVertex) {
                  const vr = row / 2;
                  const vc = col / 2;
                  const clue = puzzleData.clues[vr][vc];

                  return (
                    <div key={`${row}-${col}`} className={styles.vertex}>
                      {clue !== null && <span className={styles.clue}>{clue}</span>}
                    </div>
                  );
                } else if (isCell) {
                  const cr = (row - 1) / 2;
                  const cc = (col - 1) / 2;
                  const value = grid[cr][cc];
                  const hasError = errors.has(`${cr},${cc}`);

                  return (
                    <button
                      key={`${row}-${col}`}
                      className={`
                        ${styles.cell}
                        ${value === true ? styles.shaded : ''}
                        ${value === false ? styles.white : ''}
                        ${hasError ? styles.error : ''}
                      `}
                      onClick={(e) => handleCellClick(cr, cc, e)}
                      onContextMenu={(e) => handleCellClick(cr, cc, e)}
                    />
                  );
                } else {
                  return <div key={`${row}-${col}`} className={styles.edge} />;
                }
              })
            )}
          </div>
        </div>

        {gameState === 'won' && (
          <GameResult
            state="won"
            title="🏞️ Puzzle Solved!"
            message="Creek perfectly mapped!"
            actions={[{ label: 'New Puzzle', onClick: initGame, primary: true }]}
          />
        )}

        {gameState === 'gaveUp' && (
          <GameResult
            state="gaveup"
            message="Better luck next time!"
            actions={[{ label: 'New Puzzle', onClick: initGame, primary: true }]}
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
          <span>Click: Shade cell</span>
          <span>Right-click: Mark white</span>
        </div>
      </div>
    </div>
  );
}
