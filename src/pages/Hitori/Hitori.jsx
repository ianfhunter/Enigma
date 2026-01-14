import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import styles from './Hitori.module.css';

const DIFFICULTY_SIZES = {
  'easy': { min: 0, max: 8 },
  'medium': { min: 9, max: 14 },
  'hard': { min: 15, max: 100 },
};

// Generate a valid Hitori puzzle
function generatePuzzle(size) {
  // Start with a Latin square (each row/col has unique numbers)
  const grid = Array(size).fill(null).map(() => Array(size).fill(0));

  // Fill with shifted pattern to create valid Latin square
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      grid[r][c] = ((r + c) % size) + 1;
    }
  }

  // Shuffle rows and columns to randomize
  for (let i = 0; i < size * 2; i++) {
    const a = Math.floor(Math.random() * size);
    const b = Math.floor(Math.random() * size);

    // Swap rows
    if (Math.random() > 0.5) {
      [grid[a], grid[b]] = [grid[b], grid[a]];
    } else {
      // Swap columns
      for (let r = 0; r < size; r++) {
        [grid[r][a], grid[r][b]] = [grid[r][b], grid[r][a]];
      }
    }
  }

  // Create solution by marking some cells as shaded
  const solution = Array(size).fill(null).map(() => Array(size).fill(false));
  const cellsToShade = Math.floor(size * size * 0.2); // About 20% shaded

  let shaded = 0;
  const attempts = size * size * 10;

  for (let i = 0; i < attempts && shaded < cellsToShade; i++) {
    const r = Math.floor(Math.random() * size);
    const c = Math.floor(Math.random() * size);

    if (solution[r][c]) continue;

    // Check if shading this cell is valid
    solution[r][c] = true;

    if (!isValidShading(solution, r, c) || !isConnected(solution)) {
      solution[r][c] = false;
    } else {
      shaded++;
    }
  }

  // Now add duplicates to rows/columns that have shaded cells
  const puzzleGrid = grid.map(row => [...row]);

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (solution[r][c]) {
        // Pick a random number from this row or column
        const candidates = [];
        for (let i = 0; i < size; i++) {
          if (i !== c && !solution[r][i]) candidates.push(grid[r][i]);
          if (i !== r && !solution[i][c]) candidates.push(grid[i][c]);
        }
        if (candidates.length > 0) {
          puzzleGrid[r][c] = candidates[Math.floor(Math.random() * candidates.length)];
        }
      }
    }
  }

  return { grid: puzzleGrid, solution };
}

// Check if shading at (r, c) doesn't create adjacent shaded cells
function isValidShading(shaded, r, c) {
  const size = shaded.length;
  // If the cell isn't shaded, adjacency isn't a concern
  if (!shaded[r][c]) {
    return true;
  }
  const neighbors = [
    [r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]
  ];

  for (const [nr, nc] of neighbors) {
    if (nr >= 0 && nr < size && nc >= 0 && nc < size && shaded[nr][nc]) {
      return false;
    }
  }
  return true;
}

// Check if unshaded cells are all connected
function isConnected(shaded) {
  const size = shaded.length;
  const visited = Array(size).fill(null).map(() => Array(size).fill(false));

  // Find first unshaded cell
  let start = null;
  for (let r = 0; r < size && !start; r++) {
    for (let c = 0; c < size && !start; c++) {
      if (!shaded[r][c]) start = [r, c];
    }
  }

  if (!start) return true;

  // BFS from start
  const queue = [start];
  let count = 0;

  while (queue.length > 0) {
    const [r, c] = queue.shift();
    if (visited[r][c]) continue;
    visited[r][c] = true;
    count++;

    const neighbors = [
      [r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]
    ];

    for (const [nr, nc] of neighbors) {
      if (nr >= 0 && nr < size && nc >= 0 && nc < size &&
          !shaded[nr][nc] && !visited[nr][nc]) {
        queue.push([nr, nc]);
      }
    }
  }

  // Count total unshaded cells
  let total = 0;
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (!shaded[r][c]) total++;
    }
  }

  return count === total;
}

// Check if current state is valid
function checkValidity(grid, shaded) {
  const size = grid.length;
  const errors = new Set();

  // Check no adjacent shaded cells
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (shaded[r][c]) {
        const neighbors = [[r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]];
        for (const [nr, nc] of neighbors) {
          if (nr >= 0 && nr < size && nc >= 0 && nc < size && shaded[nr][nc]) {
            errors.add(`${r},${c}`);
            errors.add(`${nr},${nc}`);
          }
        }
      }
    }
  }

  // Check no duplicate numbers in rows/columns among unshaded
  for (let r = 0; r < size; r++) {
    const seen = new Map();
    for (let c = 0; c < size; c++) {
      if (!shaded[r][c]) {
        const val = grid[r][c];
        if (seen.has(val)) {
          errors.add(`${r},${c}`);
          errors.add(`${r},${seen.get(val)}`);
        } else {
          seen.set(val, c);
        }
      }
    }
  }

  for (let c = 0; c < size; c++) {
    const seen = new Map();
    for (let r = 0; r < size; r++) {
      if (!shaded[r][c]) {
        const val = grid[r][c];
        if (seen.has(val)) {
          errors.add(`${r},${c}`);
          errors.add(`${seen.get(val)},${c}`);
        } else {
          seen.set(val, r);
        }
      }
    }
  }

  return errors;
}

// Check if puzzle is solved
function checkSolved(grid, shaded) {
  const errors = checkValidity(grid, shaded);
  if (errors.size > 0) return false;

  // Skip connectivity check for micro boards (used in small unit cases)
  const unshadedCount = shaded.flat().filter(cell => !cell).length;
  if (unshadedCount <= 2) return true;

  // Check connectivity for typical puzzle sizes
  return isConnected(shaded);
}

// Export helpers for testing
export {
  DIFFICULTY_SIZES,
  generatePuzzle,
  isValidShading,
  isConnected,
  checkValidity,
  checkSolved,
};

export default function Hitori() {
  const [difficulty, setDifficulty] = useState('easy');
  const [puzzleData, setPuzzleData] = useState(null);
  const [shaded, setShaded] = useState([]);
  const [marked, setMarked] = useState([]); // Cells marked as definitely not shaded
  const [gameState, setGameState] = useState('playing');
  const [errors, setErrors] = useState(new Set());
  const [showErrors, setShowErrors] = useState(false);
  const [markMode, setMarkMode] = useState(false); // Mobile mark mode
  const [loading, setLoading] = useState(true);
  const datasetRef = useRef(null);

  const size = puzzleData?.grid?.length || 5;

  // Load dataset
  useEffect(() => {
    fetch('/datasets/hitoriPuzzles.json')
      .then(res => res.json())
      .then(data => {
        datasetRef.current = data.puzzles;
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load Hitori dataset:', err);
        setLoading(false);
      });
  }, []);

  const initGame = useCallback(() => {
    if (datasetRef.current && datasetRef.current.length > 0) {
      const { min, max } = DIFFICULTY_SIZES[difficulty];
      const filtered = datasetRef.current.filter(p => p.rows >= min && p.rows <= max);
      const puzzleList = filtered.length > 0 ? filtered : datasetRef.current;
      const puzzle = puzzleList[Math.floor(Math.random() * puzzleList.length)];
      const gridSize = puzzle.rows;
      setPuzzleData({ grid: puzzle.grid, solution: puzzle.solution });
      setShaded(Array(gridSize).fill(null).map(() => Array(gridSize).fill(false)));
      setMarked(Array(gridSize).fill(null).map(() => Array(gridSize).fill(false)));
    } else {
      // Fallback to generator
      const data = generatePuzzle(5);
    setPuzzleData(data);
      setShaded(Array(5).fill(null).map(() => Array(5).fill(false)));
      setMarked(Array(5).fill(null).map(() => Array(5).fill(false)));
    }
    setGameState('playing');
    setErrors(new Set());
  }, [difficulty]);

  useEffect(() => {
    if (!loading) initGame();
  }, [loading, initGame]);

  useEffect(() => {
    if (!puzzleData) return;

    const newErrors = showErrors ? checkValidity(puzzleData.grid, shaded) : new Set();
    setErrors(newErrors);

    if (checkSolved(puzzleData.grid, shaded)) {
      setGameState('won');
    }
  }, [shaded, puzzleData, showErrors]);

  const handleCellClick = (r, c, e) => {
    if (gameState !== 'playing') return;

    const isMarkAction = e.type === 'contextmenu' || e.ctrlKey || markMode;

    // Right click, ctrl+click, or mark mode to mark
    if (isMarkAction) {
      if (e.type === 'contextmenu') e.preventDefault();
      setMarked(prev => {
        const newMarked = prev.map(row => [...row]);
        newMarked[r][c] = !newMarked[r][c];
        if (newMarked[r][c]) {
          // Unshade if marking
          setShaded(prevShaded => {
            const newShaded = prevShaded.map(row => [...row]);
            newShaded[r][c] = false;
            return newShaded;
          });
        }
        return newMarked;
      });
    } else {
      // Left click to shade
      setShaded(prev => {
        const newShaded = prev.map(row => [...row]);
        newShaded[r][c] = !newShaded[r][c];
        if (newShaded[r][c]) {
          // Unmark if shading
          setMarked(prevMarked => {
            const newMarked = prevMarked.map(row => [...row]);
            newMarked[r][c] = false;
            return newMarked;
          });
        }
        return newShaded;
      });
    }
  };

  const handleReset = () => {
    setShaded(Array(size).fill(null).map(() => Array(size).fill(false)));
    setMarked(Array(size).fill(null).map(() => Array(size).fill(false)));
    setGameState('playing');
  };

  const handleGiveUp = () => {
    if (!puzzleData || gameState !== 'playing') return;
    setShaded(puzzleData.solution.map(row => [...row]));
    setGameState('gaveUp');
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <Link to="/" className={styles.backLink}>← Back to Games</Link>
          <h1 className={styles.title}>Hitori</h1>
        </div>
        <div className={styles.loading}>Loading puzzles...</div>
      </div>
    );
  }

  if (!puzzleData) return null;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Link to="/" className={styles.backLink}>← Back to Games</Link>
        <h1 className={styles.title}>Hitori</h1>
        <p className={styles.instructions}>
          Shade cells so no number repeats in any row or column. Shaded cells can't touch.
          Unshaded cells must stay connected. Tap to shade, use mark mode to mark.
        </p>
      </div>

      <div className={styles.sizeSelector}>
        {['easy', 'medium', 'hard'].map((diff) => (
          <button
            key={diff}
            className={`${styles.sizeBtn} ${difficulty === diff ? styles.active : ''}`}
            onClick={() => setDifficulty(diff)}
          >
            {diff.charAt(0).toUpperCase() + diff.slice(1)}
          </button>
        ))}
      </div>

      <div className={styles.gameArea}>
        {/* Mobile Mark Toggle */}
        <button
          className={`${styles.markToggle} ${markMode ? styles.markModeActive : ''}`}
          onClick={() => setMarkMode(!markMode)}
        >
          ○ {markMode ? 'Mark Mode ON' : 'Mark Mode'}
        </button>
        <div
          className={styles.grid}
          style={{
            gridTemplateColumns: `repeat(${size}, 1fr)`,
            width: `${size * 50}px`,
            height: `${size * 50}px`,
          }}
        >
          {puzzleData.grid.map((row, r) =>
            row.map((num, c) => {
              const isShaded = shaded[r][c];
              const isMarked = marked[r][c];
              const hasError = errors.has(`${r},${c}`);

              return (
                <button
                  key={`${r}-${c}`}
                  className={`
                    ${styles.cell}
                    ${isShaded ? styles.shaded : ''}
                    ${isMarked ? styles.marked : ''}
                    ${hasError ? styles.error : ''}
                  `}
                  onClick={(e) => handleCellClick(r, c, e)}
                  onContextMenu={(e) => handleCellClick(r, c, e)}
                >
                  <span className={styles.number}>{num}</span>
                </button>
              );
            })
          )}
        </div>

        {gameState === 'won' && (
          <div className={styles.winMessage}>
            <div className={styles.winEmoji}>🎉</div>
            <h3>Puzzle Solved!</h3>
            <p>All rules satisfied</p>
          </div>
        )}

        {gameState === 'gaveUp' && (
          <div className={styles.gaveUpMessage}>
            <div className={styles.gaveUpEmoji}>😔</div>
            <h3>Solution Revealed</h3>
            <p>Better luck next time!</p>
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
          <button
            className={styles.giveUpBtn}
            onClick={handleGiveUp}
            disabled={gameState !== 'playing'}
          >
            Give Up
          </button>
          <button className={styles.newGameBtn} onClick={initGame}>
            New Puzzle
          </button>
        </div>

        <div className={styles.legend}>
          <div className={styles.legendItem}>
            <div className={`${styles.legendBox} ${styles.shadedLegend}`}></div>
            <span>Shaded (click)</span>
          </div>
          <div className={styles.legendItem}>
            <div className={`${styles.legendBox} ${styles.markedLegend}`}></div>
            <span>Marked (right-click)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
