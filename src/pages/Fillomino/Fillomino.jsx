import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import styles from './Fillomino.module.css';

const GRID_SIZES = {
  '5×5': 5,
  '7×7': 7,
  '10×10': 10,
  '12×12': 12,
  '15×15': 15,
};

// Helper function
function getConnectedRegion(grid, r, c, size) {
  const val = grid[r][c];
  if (!val) return [];

  const visited = new Set();
  const queue = [[r, c]];
  const cells = [];

  while (queue.length > 0) {
    const [cr, cc] = queue.shift();
    const key = `${cr},${cc}`;
    if (visited.has(key)) continue;
    if (grid[cr][cc] !== val) continue;

    visited.add(key);
    cells.push([cr, cc]);

    for (const [nr, nc] of [[cr-1,cc], [cr+1,cc], [cr,cc-1], [cr,cc+1]]) {
      if (nr >= 0 && nr < size && nc >= 0 && nc < size && !visited.has(`${nr},${nc}`)) {
        queue.push([nr, nc]);
      }
    }
  }

  return cells;
}

function checkValidity(grid) {
  const size = grid.length;
  const errors = new Set();
  const checked = new Set();

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (!grid[r][c] || checked.has(`${r},${c}`)) continue;

      const region = getConnectedRegion(grid, r, c, size);
      const val = grid[r][c];

      for (const [cr, cc] of region) {
        checked.add(`${cr},${cc}`);
      }

      // Region is too big
      if (region.length > val) {
        for (const [cr, cc] of region) {
          errors.add(`${cr},${cc}`);
        }
      }
    }
  }

  return errors;
}

function checkSolved(grid) {
  const size = grid.length;
  const checked = new Set();

  // All cells must be filled
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (!grid[r][c]) return false;
    }
  }

  // Each region must have size equal to its number
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (checked.has(`${r},${c}`)) continue;

      const region = getConnectedRegion(grid, r, c, size);
      const val = grid[r][c];

      for (const [cr, cc] of region) {
        checked.add(`${cr},${cc}`);
      }

      if (region.length !== val) return false;
    }
  }

  return true;
}

export default function Fillomino() {
  const [sizeKey, setSizeKey] = useState('7×7');
  const [difficulty, setDifficulty] = useState('easy');
  const [allPuzzles, setAllPuzzles] = useState([]);
  const [puzzleData, setPuzzleData] = useState(null);
  const [grid, setGrid] = useState([]);
  const [fixed, setFixed] = useState([]);
  const [selected, setSelected] = useState(null);
  const [gameState, setGameState] = useState('playing');
  const [errors, setErrors] = useState(new Set());
  const [showErrors, setShowErrors] = useState(true);
  const [loading, setLoading] = useState(true);

  const size = GRID_SIZES[sizeKey];

  // Load puzzles from dataset
  useEffect(() => {
    fetch('/datasets/fillominoPuzzles.json')
      .then(res => res.json())
      .then(data => {
        setAllPuzzles(data.puzzles || []);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load Fillomino puzzles:', err);
        setLoading(false);
      });
  }, []);

  const initGame = useCallback(() => {
    if (allPuzzles.length === 0) return;

    let available = allPuzzles.filter(p =>
      p.rows === size && p.cols === size && p.difficulty === difficulty
    );

    if (available.length === 0) {
      available = allPuzzles.filter(p => p.rows === size && p.cols === size);
    }

    if (available.length === 0) {
      const sizes = [...new Set(allPuzzles.filter(p => p.rows === p.cols).map(p => p.rows))].sort((a,b) => a-b);
      const closest = sizes.reduce((prev, curr) => Math.abs(curr - size) < Math.abs(prev - size) ? curr : prev, sizes[0]);
      available = allPuzzles.filter(p => p.rows === closest && p.cols === closest);
    }

    if (available.length === 0) return;

    const puzzle = available[Math.floor(Math.random() * available.length)];
    const puzzleSize = puzzle.rows;

    // Convert clues grid (null = empty) to puzzle format
    const cluesGrid = puzzle.clues.map(row => row.map(cell => cell || null));

    setPuzzleData({
      puzzle: cluesGrid,
      solution: puzzle.solution,
      size: puzzleSize
    });
    setGrid(cluesGrid.map(row => [...row]));
    setFixed(cluesGrid.map(row => row.map(cell => cell !== null)));
    setSelected(null);
    setGameState('playing');
    setErrors(new Set());
  }, [allPuzzles, size, difficulty]);

  useEffect(() => {
    if (!loading && allPuzzles.length > 0) {
      initGame();
    }
  }, [loading, allPuzzles, initGame]);

  useEffect(() => {
    if (!puzzleData) return;

    const newErrors = showErrors ? checkValidity(grid) : new Set();
    setErrors(newErrors);

    if (checkSolved(grid)) {
      setGameState('won');
    }
  }, [grid, puzzleData, showErrors]);

  // Keyboard input for numbers
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!selected || gameState !== 'playing') return;
      const [r, c] = selected;
      if (fixed[r][c]) return;

      // Number keys 1-9
      if (e.key >= '1' && e.key <= '9') {
        const num = parseInt(e.key, 10);
        setGrid(prev => {
          const newGrid = prev.map(row => [...row]);
          newGrid[r][c] = newGrid[r][c] === num ? null : num;
          return newGrid;
        });
      }
      // Backspace, Delete, or 0 to clear
      else if (e.key === 'Backspace' || e.key === 'Delete' || e.key === '0') {
        setGrid(prev => {
          const newGrid = prev.map(row => [...row]);
          newGrid[r][c] = null;
          return newGrid;
        });
      }
      // Arrow keys to move selection
      else if (e.key.startsWith('Arrow')) {
        e.preventDefault();
        const gridSize = puzzleData?.size || size;
        let [nr, nc] = selected;
        if (e.key === 'ArrowUp') nr = Math.max(0, nr - 1);
        else if (e.key === 'ArrowDown') nr = Math.min(gridSize - 1, nr + 1);
        else if (e.key === 'ArrowLeft') nc = Math.max(0, nc - 1);
        else if (e.key === 'ArrowRight') nc = Math.min(gridSize - 1, nc + 1);
        setSelected([nr, nc]);
      }
      // Escape to deselect
      else if (e.key === 'Escape') {
        setSelected(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selected, gameState, fixed, size, puzzleData]);

  const handleCellClick = (r, c) => {
    if (gameState !== 'playing' || fixed[r][c]) return;
    setSelected([r, c]);
  };

  const handleNumberClick = (num) => {
    if (!selected || gameState !== 'playing') return;
    const [r, c] = selected;
    if (fixed[r][c]) return;

    setGrid(prev => {
      const newGrid = prev.map(row => [...row]);
      newGrid[r][c] = newGrid[r][c] === num ? null : num;
      return newGrid;
    });
  };

  const handleReset = () => {
    if (!puzzleData) return;
    setGrid(puzzleData.puzzle.map(row => [...row]));
    setSelected(null);
    setGameState('playing');
  };

  const handleGiveUp = () => {
    if (!puzzleData || gameState !== 'playing') return;
    setGrid(puzzleData.solution.map(row => [...row]));
    setSelected(null);
    setGameState('gave_up');
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <Link to="/" className={styles.backLink}>← Back to Games</Link>
          <h1 className={styles.title}>Fillomino</h1>
        </div>
        <div className={styles.loading}>Loading puzzles...</div>
      </div>
    );
  }

  if (!puzzleData) return null;

  const gridSize = puzzleData.size || size;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Link to="/" className={styles.backLink}>← Back to Games</Link>
        <h1 className={styles.title}>Fillomino</h1>
        <div className={styles.instructions}>
          <p className={styles.instructionMain}>
            Fill every cell with a number. Each number tells you the size of its group.
          </p>
          <ul className={styles.instructionList}>
            <li><strong>Rule 1:</strong> A group of connected cells with the same number must contain exactly that many cells.
              <em>Example: A "3" must be part of a group of exactly 3 connected "3"s.</em></li>
            <li><strong>Rule 2:</strong> Two different groups of the same number cannot touch orthogonally (up/down/left/right).
              <em>Example: Two separate groups of "2"s cannot share an edge.</em></li>
            <li><strong>Tip:</strong> Purple cells are given hints. Use them to deduce the rest!</li>
            <li><strong>Controls:</strong> Click a cell, then type 1-9 or use the number pad. Arrow keys to move, Backspace to clear.</li>
          </ul>
        </div>
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

      <div className={styles.difficultySelector}>
        {['easy', 'medium', 'hard'].map((d) => (
          <button
            key={d}
            className={`${styles.difficultyBtn} ${difficulty === d ? styles.active : ''}`}
            onClick={() => setDifficulty(d)}
          >
            {d.charAt(0).toUpperCase() + d.slice(1)}
          </button>
        ))}
      </div>

      <div className={styles.gameArea}>
        <div
          className={styles.grid}
          style={{
            gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
            width: `${Math.min(gridSize * 45, 500)}px`,
            height: `${Math.min(gridSize * 45, 500)}px`,
          }}
        >
          {grid.map((row, r) =>
            row.map((cell, c) => {
              const isSelected = selected && selected[0] === r && selected[1] === c;
              const isFixed = fixed[r][c];
              const hasError = errors.has(`${r},${c}`);

              return (
                <button
                  key={`${r}-${c}`}
                  className={`
                    ${styles.cell}
                    ${isSelected ? styles.selected : ''}
                    ${isFixed ? styles.fixed : ''}
                    ${hasError ? styles.error : ''}
                  `}
                  onClick={() => handleCellClick(r, c)}
                >
                  {cell && <span className={styles.value}>{cell}</span>}
                </button>
              );
            })
          )}
        </div>

        {gameState === 'won' && (
          <div className={styles.winMessage}>
            <div className={styles.winEmoji}>🎉</div>
            <h3>Puzzle Solved!</h3>
            <p>All regions complete!</p>
          </div>
        )}

        <div className={styles.numberPad}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <button
              key={num}
              className={styles.numberBtn}
              onClick={() => handleNumberClick(num)}
              disabled={gameState !== 'playing'}
            >
              {num}
            </button>
          ))}
          <button
            className={styles.numberBtn}
            onClick={() => selected && !fixed[selected[0]][selected[1]] && setGrid(prev => {
              const newGrid = prev.map(row => [...row]);
              newGrid[selected[0]][selected[1]] = null;
              return newGrid;
            })}
            disabled={gameState !== 'playing' || !selected}
          >
            ✕
          </button>
        </div>

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
          {gameState === 'playing' && (
            <button className={styles.giveUpBtn} onClick={handleGiveUp}>
              Give Up
            </button>
          )}
          <button className={styles.newGameBtn} onClick={initGame}>
            New Puzzle
          </button>
        </div>
      </div>
    </div>
  );
}
