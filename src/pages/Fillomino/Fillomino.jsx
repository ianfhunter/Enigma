import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import styles from './Fillomino.module.css';

const GRID_SIZES = {
  '5×5': 5,
  '7×7': 7,
  '9×9': 9,
};

function generateValidSolution(size) {
  const solution = Array(size).fill(null).map(() => Array(size).fill(0));
  const regions = Array(size).fill(null).map(() => Array(size).fill(-1));
  const regionCells = {};
  let regionId = 0;

  // Fill grid with polyominoes
  const positions = [];
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      positions.push([r, c]);
    }
  }

  // Shuffle starting positions
  for (let i = positions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [positions[i], positions[j]] = [positions[j], positions[i]];
  }

  for (const [startR, startC] of positions) {
    if (solution[startR][startC] !== 0) continue;

    // Create a polyomino of random size (1-5)
    const targetSize = 1 + Math.floor(Math.random() * 5);
    const cells = [[startR, startC]];
    regions[startR][startC] = regionId;

    // Grow the polyomino
    for (let g = 1; g < targetSize; g++) {
      const frontier = [];
      for (const [cr, cc] of cells) {
        for (const [nr, nc] of [[cr-1,cc], [cr+1,cc], [cr,cc-1], [cr,cc+1]]) {
          if (nr >= 0 && nr < size && nc >= 0 && nc < size &&
              solution[nr][nc] === 0 && !cells.some(([r,c]) => r === nr && c === nc)) {
            frontier.push([nr, nc]);
          }
        }
      }

      if (frontier.length === 0) break;

      const [nr, nc] = frontier[Math.floor(Math.random() * frontier.length)];
      cells.push([nr, nc]);
      regions[nr][nc] = regionId;
    }

    // Set all cells to actual size achieved
    const finalSize = cells.length;
    for (const [cr, cc] of cells) {
      solution[cr][cc] = finalSize;
      regions[cr][cc] = regionId;
    }

    regionCells[regionId] = [...cells];
    regionId++;
  }

  return { solution, regions, regionCells };
}

function isSolutionValid(solution, regions, size) {
  // Check that no two cells with the same value from different regions are adjacent
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const val = solution[r][c];
      const reg = regions[r][c];

      for (const [nr, nc] of [[r-1,c], [r+1,c], [r,c-1], [r,c+1]]) {
        if (nr >= 0 && nr < size && nc >= 0 && nc < size) {
          if (solution[nr][nc] === val && regions[nr][nc] !== reg) {
            return false; // Two different regions with same value are adjacent
          }
        }
      }
    }
  }
  return true;
}

function generatePuzzle(size) {
  // Keep generating until we get a valid solution (no adjacent same-valued different regions)
  let solution, regions, regionCells;
  let attempts = 0;
  const maxAttempts = 100;

  do {
    const result = generateValidSolution(size);
    solution = result.solution;
    regions = result.regions;
    regionCells = result.regionCells;
    attempts++;
  } while (!isSolutionValid(solution, regions, size) && attempts < maxAttempts);

  // Create puzzle ensuring each region has at least one hint
  const puzzle = Array(size).fill(null).map(() => Array(size).fill(null));
  const hintedCells = new Set();

  // First, ensure each region has at least one hint (pick a random cell from each region)
  for (const rid in regionCells) {
    const cells = regionCells[rid];
    const randomIdx = Math.floor(Math.random() * cells.length);
    const [r, c] = cells[randomIdx];
    puzzle[r][c] = solution[r][c];
    hintedCells.add(`${r},${c}`);
  }

  // Add additional random hints to reach ~35% coverage
  const targetHints = Math.floor(size * size * 0.35);
  const remainingPositions = [];
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (!hintedCells.has(`${r},${c}`)) {
        remainingPositions.push([r, c]);
      }
    }
  }

  // Shuffle remaining positions
  for (let i = remainingPositions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [remainingPositions[i], remainingPositions[j]] = [remainingPositions[j], remainingPositions[i]];
  }

  // Add more hints until we reach target
  const hintsNeeded = Math.max(0, targetHints - hintedCells.size);
  for (let i = 0; i < hintsNeeded && i < remainingPositions.length; i++) {
    const [r, c] = remainingPositions[i];
    puzzle[r][c] = solution[r][c];
  }

  return { puzzle, solution };
}

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
  const [sizeKey, setSizeKey] = useState('5×5');
  const [puzzleData, setPuzzleData] = useState(null);
  const [grid, setGrid] = useState([]);
  const [fixed, setFixed] = useState([]);
  const [selected, setSelected] = useState(null);
  const [gameState, setGameState] = useState('playing');
  const [errors, setErrors] = useState(new Set());
  const [showErrors, setShowErrors] = useState(true);

  const size = GRID_SIZES[sizeKey];

  const initGame = useCallback(() => {
    const data = generatePuzzle(size);
    setPuzzleData(data);
    setGrid(data.puzzle.map(row => [...row]));
    setFixed(data.puzzle.map(row => row.map(cell => cell !== null)));
    setSelected(null);
    setGameState('playing');
    setErrors(new Set());
  }, [size]);

  useEffect(() => {
    initGame();
  }, [initGame]);

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
        let [nr, nc] = selected;
        if (e.key === 'ArrowUp') nr = Math.max(0, nr - 1);
        else if (e.key === 'ArrowDown') nr = Math.min(size - 1, nr + 1);
        else if (e.key === 'ArrowLeft') nc = Math.max(0, nc - 1);
        else if (e.key === 'ArrowRight') nc = Math.min(size - 1, nc + 1);
        setSelected([nr, nc]);
      }
      // Escape to deselect
      else if (e.key === 'Escape') {
        setSelected(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selected, gameState, fixed, size]);

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

  if (!puzzleData) return null;

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

      <div className={styles.gameArea}>
        <div
          className={styles.grid}
          style={{
            gridTemplateColumns: `repeat(${size}, 1fr)`,
            width: `${size * 48}px`,
            height: `${size * 48}px`,
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
                  {cell && <span className={styles.number}>{cell}</span>}
                </button>
              );
            })
          )}
        </div>

        {/* Number pad */}
        <div className={styles.numPad}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
            <button
              key={num}
              className={styles.numBtn}
              onClick={() => handleNumberClick(num)}
            >
              {num}
            </button>
          ))}
          <button className={styles.numBtn} onClick={() => handleNumberClick(null)}>×</button>
        </div>

        {gameState === 'won' && (
          <div className={styles.winMessage}>
            <div className={styles.winEmoji}>🎉</div>
            <h3>Puzzle Solved!</h3>
            <p>All regions perfectly sized!</p>
          </div>
        )}

        {gameState === 'gave_up' && (
          <div className={styles.gaveUpMessage}>
            <div className={styles.gaveUpEmoji}>💡</div>
            <h3>Solution Revealed</h3>
            <p>Try a new puzzle!</p>
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
