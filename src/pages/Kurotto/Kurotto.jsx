import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import styles from './Kurotto.module.css';

const GRID_SIZES = {
  '5×5': 5,
  '7×7': 7,
  '9×9': 9,
};

// Generate a valid Kurotto solution
function generateSolution(size) {
  const solution = Array(size).fill(null).map(() => Array(size).fill(false));
  
  // Randomly shade cells
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      solution[r][c] = Math.random() < 0.4;
    }
  }
  
  return solution;
}

// Calculate clue value for a cell (sum of orthogonally adjacent shaded group sizes)
function calculateClueValue(solution, r, c, size) {
  const visited = new Set();
  let totalSum = 0;
  
  // Check each orthogonal neighbor
  for (const [nr, nc] of [[r-1, c], [r+1, c], [r, c-1], [r, c+1]]) {
    if (nr < 0 || nr >= size || nc < 0 || nc >= size) continue;
    if (!solution[nr][nc]) continue;
    
    const key = `${nr},${nc}`;
    if (visited.has(key)) continue;
    
    // BFS to find the shaded group containing this neighbor
    const groupCells = [];
    const queue = [[nr, nc]];
    visited.add(key);
    
    while (queue.length > 0) {
      const [cr, cc] = queue.shift();
      groupCells.push([cr, cc]);
      
      for (const [nnr, nnc] of [[cr-1, cc], [cr+1, cc], [cr, cc-1], [cr, cc+1]]) {
        if (nnr < 0 || nnr >= size || nnc < 0 || nnc >= size) continue;
        const nKey = `${nnr},${nnc}`;
        if (visited.has(nKey) || !solution[nnr][nnc]) continue;
        visited.add(nKey);
        queue.push([nnr, nnc]);
      }
    }
    
    totalSum += groupCells.length;
  }
  
  return totalSum;
}

// Generate clues at some unshaded cells
function generateClues(solution, size) {
  const clues = Array(size).fill(null).map(() => Array(size).fill(null));
  
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      // Only unshaded cells can have clues
      if (solution[r][c]) continue;
      
      // 40% chance to show a clue
      if (Math.random() < 0.4) {
        clues[r][c] = calculateClueValue(solution, r, c, size);
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
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (clues[r][c] === null) continue;
      if (grid[r][c] === true) {
        // Clue cell is shaded - error
        errors.add(`${r},${c}`);
        continue;
      }
      
      // Calculate current sum of adjacent shaded groups
      const currentSum = calculateClueValue(grid, r, c, size);
      
      // Only show error if sum exceeds clue
      if (currentSum > clues[r][c]) {
        errors.add(`${r},${c}`);
      }
    }
  }
  
  return errors;
}

function checkSolved(grid, solution, size) {
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if ((grid[r][c] === true) !== solution[r][c]) return false;
    }
  }
  return true;
}

export default function Kurotto() {
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

    if (checkSolved(grid, puzzleData.solution, size)) {
      setGameState('won');
    }
  }, [grid, puzzleData, showErrors, size]);

  const handleCellClick = (r, c, e) => {
    if (gameState !== 'playing') return;
    if (puzzleData.clues[r][c] !== null) return; // Can't shade clue cells
    
    if (e.type === 'contextmenu' || e.ctrlKey) {
      e.preventDefault();
      // Mark as white
      setGrid(prev => {
        const newGrid = prev.map(row => [...row]);
        newGrid[r][c] = newGrid[r][c] === false ? null : false;
        return newGrid;
      });
    } else {
      // Shade
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

  if (!puzzleData) return null;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Link to="/" className={styles.backLink}>← Back to Games</Link>
        <h1 className={styles.title}>Kurotto</h1>
        <p className={styles.instructions}>
          Shade cells so each circled number equals the total size of all shaded groups
          orthogonally adjacent to that circle. Circled cells cannot be shaded.
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
        <div 
          className={styles.grid}
          style={{ gridTemplateColumns: `repeat(${size}, 1fr)` }}
        >
          {Array(size).fill(null).map((_, r) =>
            Array(size).fill(null).map((_, c) => {
              const clue = puzzleData.clues[r][c];
              const hasClue = clue !== null;
              const isShaded = grid[r][c] === true;
              const isMarkedWhite = grid[r][c] === false;
              const hasError = errors.has(`${r},${c}`);

              return (
                <button
                  key={`${r}-${c}`}
                  className={`
                    ${styles.cell}
                    ${hasClue ? styles.clue : ''}
                    ${isShaded ? styles.shaded : ''}
                    ${isMarkedWhite ? styles.markedWhite : ''}
                    ${hasError ? styles.error : ''}
                  `}
                  onClick={(e) => handleCellClick(r, c, e)}
                  onContextMenu={(e) => handleCellClick(r, c, e)}
                  disabled={hasClue}
                >
                  {hasClue && <span className={styles.clueValue}>{clue}</span>}
                </button>
              );
            })
          )}
        </div>

        {gameState === 'won' && (
          <div className={styles.winMessage}>
            <div className={styles.winEmoji}>⭕</div>
            <h3>Puzzle Solved!</h3>
            <p>All clues satisfied!</p>
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

        <div className={styles.legend}>
          <span>Click: Shade cell</span>
          <span>Right-click: Mark white</span>
        </div>
      </div>
    </div>
  );
}
