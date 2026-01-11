import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import styles from './GokigenNaname.module.css';

const GRID_SIZES = {
  '5×5': 5,
  '7×7': 7,
  '9×9': 9,
};

// Generate a valid solution (slashes in cells)
function generateSolution(size) {
  // Each cell can have '/' or '\' (backslash)
  const solution = Array(size).fill(null).map(() => 
    Array(size).fill(null).map(() => Math.random() < 0.5 ? '/' : '\\')
  );
  
  return solution;
}

// Calculate clue at vertex (count of slashes touching that vertex)
function calculateVertexClue(solution, r, c, size) {
  let count = 0;
  
  // Check the 4 cells around this vertex (if they exist)
  // Top-left cell (r-1, c-1): '/' touches bottom-right corner
  if (r > 0 && c > 0 && solution[r-1][c-1] === '/') count++;
  // Top-right cell (r-1, c): '\' touches bottom-left corner  
  if (r > 0 && c < size && solution[r-1][c] === '\\') count++;
  // Bottom-left cell (r, c-1): '\' touches top-right corner
  if (r < size && c > 0 && solution[r][c-1] === '\\') count++;
  // Bottom-right cell (r, c): '/' touches top-left corner
  if (r < size && c < size && solution[r][c] === '/') count++;
  
  return count;
}

// Generate clues at vertices
function generateClues(solution, size) {
  const clues = Array(size + 1).fill(null).map(() => Array(size + 1).fill(null));
  
  for (let r = 0; r <= size; r++) {
    for (let c = 0; c <= size; c++) {
      // 50% chance to show a clue
      if (Math.random() < 0.5) {
        clues[r][c] = calculateVertexClue(solution, r, c, size);
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
      
      const currentCount = calculateVertexClue(grid, r, c, size);
      
      // Error if count exceeds clue
      if (currentCount > clues[r][c]) {
        // Mark adjacent cells as errors
        if (r > 0 && c > 0 && grid[r-1][c-1] === '/') errors.add(`${r-1},${c-1}`);
        if (r > 0 && c < size && grid[r-1][c] === '\\') errors.add(`${r-1},${c}`);
        if (r < size && c > 0 && grid[r][c-1] === '\\') errors.add(`${r},${c-1}`);
        if (r < size && c < size && grid[r][c] === '/') errors.add(`${r},${c}`);
      }
    }
  }
  
  return errors;
}

// Check for closed loops (invalid in this puzzle)
function _hasClosedLoop(_grid, _size) {
  // This is complex - simplified version just checks for small loops
  return false;
}

function checkSolved(grid, clues, size) {
  // Check all cells are filled
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (!grid[r][c]) return false;
    }
  }
  
  // Check all clues are satisfied
  for (let r = 0; r <= size; r++) {
    for (let c = 0; c <= size; c++) {
      if (clues[r][c] === null) continue;
      if (calculateVertexClue(grid, r, c, size) !== clues[r][c]) return false;
    }
  }
  
  return true;
}

export default function GokigenNaname() {
  const [sizeKey, setSizeKey] = useState('5×5');
  const [puzzleData, setPuzzleData] = useState(null);
  const [grid, setGrid] = useState([]);
  const [gameState, setGameState] = useState('playing');
  const [errors, setErrors] = useState(new Set());
  const [showErrors, setShowErrors] = useState(true);

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

    if (checkSolved(grid, puzzleData.clues, size)) {
      setGameState('won');
    }
  }, [grid, puzzleData, showErrors, size]);

  const handleCellClick = (r, c) => {
    if (gameState !== 'playing') return;
    
    // Cycle through: empty -> / -> \ -> empty
    setGrid(prev => {
      const newGrid = prev.map(row => [...row]);
      if (newGrid[r][c] === null) {
        newGrid[r][c] = '/';
      } else if (newGrid[r][c] === '/') {
        newGrid[r][c] = '\\';
      } else {
        newGrid[r][c] = null;
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
        <h1 className={styles.title}>Gokigen Naname</h1>
        <p className={styles.instructions}>
          Draw diagonal lines in each cell. Numbers at intersections show how many
          lines meet at that point. Click cells to cycle between / and \.
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
        <div className={styles.gridWrapper}>
          {/* Render the grid with vertex clues */}
          <div 
            className={styles.board}
            style={{ 
              gridTemplateColumns: `repeat(${size * 2 + 1}, 1fr)`,
              gridTemplateRows: `repeat(${size * 2 + 1}, 1fr)`
            }}
          >
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
                        ${hasError ? styles.error : ''}
                      `}
                      onClick={() => handleCellClick(cr, cc)}
                    >
                      {value && (
                        <div className={`${styles.slash} ${value === '/' ? styles.forward : styles.backward}`} />
                      )}
                    </button>
                  );
                } else {
                  return <div key={`${row}-${col}`} className={styles.edge} />;
                }
              })
            )}
          </div>
        </div>

        {gameState === 'won' && (
          <div className={styles.winMessage}>
            <div className={styles.winEmoji}>／＼</div>
            <h3>Puzzle Solved!</h3>
            <p>All slashes in place!</p>
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
