import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import styles from './RippleEffect.module.css';

const GRID_SIZES = {
  '5×5': 5,
  '6×6': 6,
  '8×8': 8,
};

// Generate random regions
function generateRegions(size) {
  const regions = Array(size).fill(null).map(() => Array(size).fill(-1));
  const regionCells = {};
  let regionId = 0;

  const positions = [];
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      positions.push([r, c]);
    }
  }

  for (let i = positions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [positions[i], positions[j]] = [positions[j], positions[i]];
  }

  for (const [startR, startC] of positions) {
    if (regions[startR][startC] !== -1) continue;

    const targetSize = 2 + Math.floor(Math.random() * 4); // 2-5 cells
    const cells = [[startR, startC]];
    regions[startR][startC] = regionId;

    for (let g = 1; g < targetSize; g++) {
      const frontier = [];
      for (const [cr, cc] of cells) {
        for (const [nr, nc] of [[cr-1,cc], [cr+1,cc], [cr,cc-1], [cr,cc+1]]) {
          if (nr >= 0 && nr < size && nc >= 0 && nc < size &&
              regions[nr][nc] === -1 && !cells.some(([r,c]) => r === nr && c === nc)) {
            frontier.push([nr, nc]);
          }
        }
      }

      if (frontier.length === 0) break;

      const [nr, nc] = frontier[Math.floor(Math.random() * frontier.length)];
      cells.push([nr, nc]);
      regions[nr][nc] = regionId;
    }

    regionCells[regionId] = [...cells];
    regionId++;
  }

  return { regions, regionCells };
}

// Check if placing num at (r, c) violates ripple constraint
function violatesRipple(grid, r, c, num, size) {
  // Check in all 4 directions
  // If same number exists within 'num' cells, it's invalid
  
  // Left
  for (let i = 1; i <= num && c - i >= 0; i++) {
    if (grid[r][c - i] === num) return true;
  }
  // Right
  for (let i = 1; i <= num && c + i < size; i++) {
    if (grid[r][c + i] === num) return true;
  }
  // Up
  for (let i = 1; i <= num && r - i >= 0; i++) {
    if (grid[r - i][c] === num) return true;
  }
  // Down
  for (let i = 1; i <= num && r + i < size; i++) {
    if (grid[r + i][c] === num) return true;
  }

  return false;
}

// Generate a valid solution
function generateSolution(regions, regionCells, size) {
  const solution = Array(size).fill(null).map(() => Array(size).fill(0));

  const regionIds = Object.keys(regionCells).map(Number);

  function solve(regionIdx) {
    if (regionIdx >= regionIds.length) return true;

    const rid = regionIds[regionIdx];
    const cells = regionCells[rid];
    const regionSize = cells.length;

    const numbers = Array.from({ length: regionSize }, (_, i) => i + 1);

    function assignNumbers(cellIdx, usedNumbers) {
      if (cellIdx >= cells.length) return true;

      const [r, c] = cells[cellIdx];
      const availableNumbers = numbers.filter(n => !usedNumbers.has(n));

      for (let i = availableNumbers.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [availableNumbers[i], availableNumbers[j]] = [availableNumbers[j], availableNumbers[i]];
      }

      for (const num of availableNumbers) {
        if (!violatesRipple(solution, r, c, num, size)) {
          solution[r][c] = num;
          usedNumbers.add(num);

          if (assignNumbers(cellIdx + 1, usedNumbers)) return true;

          usedNumbers.delete(num);
          solution[r][c] = 0;
        }
      }

      return false;
    }

    if (assignNumbers(0, new Set())) {
      return solve(regionIdx + 1);
    }

    return false;
  }

  if (solve(0)) {
    return solution;
  }

  return null;
}

function generatePuzzle(size) {
  let attempts = 0;
  const maxAttempts = 20;

  while (attempts < maxAttempts) {
    attempts++;
    const { regions, regionCells } = generateRegions(size);
    const solution = generateSolution(regions, regionCells, size);

    if (solution) {
      const puzzle = solution.map(row => [...row]);
      const fixed = Array(size).fill(null).map(() => Array(size).fill(false));

      // Remove ~60% of cells
      for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
          if (Math.random() > 0.4) {
            puzzle[r][c] = null;
          } else {
            fixed[r][c] = true;
          }
        }
      }

      // Ensure each region has at least one hint
      for (const cells of Object.values(regionCells)) {
        const hasHint = cells.some(([r, c]) => puzzle[r][c] !== null);
        if (!hasHint) {
          const [r, c] = cells[Math.floor(Math.random() * cells.length)];
          puzzle[r][c] = solution[r][c];
          fixed[r][c] = true;
        }
      }

      return { regions, regionCells, solution, puzzle, fixed };
    }
  }

  return generateSimplePuzzle(size);
}

function generateSimplePuzzle(size) {
  const regions = Array(size).fill(null).map(() => Array(size).fill(-1));
  const regionCells = {};
  let rid = 0;

  for (let r = 0; r < size; r += 2) {
    for (let c = 0; c < size; c += 2) {
      const cells = [];
      for (let dr = 0; dr < 2 && r + dr < size; dr++) {
        for (let dc = 0; dc < 2 && c + dc < size; dc++) {
          cells.push([r + dr, c + dc]);
          regions[r + dr][c + dc] = rid;
        }
      }
      regionCells[rid] = cells;
      rid++;
    }
  }

  const solution = Array(size).fill(null).map(() => Array(size).fill(1));
  const puzzle = solution.map(row => row.map(() => null));
  const fixed = Array(size).fill(null).map(() => Array(size).fill(false));

  return { regions, regionCells, solution, puzzle, fixed };
}

function checkValidity(grid, regions, regionCells, size) {
  const errors = new Set();

  // Check ripple constraint for each cell
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const val = grid[r][c];
      if (!val) continue;

      // Check left
      for (let i = 1; i <= val && c - i >= 0; i++) {
        if (grid[r][c - i] === val) {
          errors.add(`${r},${c}`);
          errors.add(`${r},${c - i}`);
        }
      }
      // Check up
      for (let i = 1; i <= val && r - i >= 0; i++) {
        if (grid[r - i][c] === val) {
          errors.add(`${r},${c}`);
          errors.add(`${r - i},${c}`);
        }
      }
    }
  }

  // Check each region has unique numbers in valid range
  for (const [rid, cells] of Object.entries(regionCells)) {
    const regionSize = cells.length;
    const seen = new Map();

    for (const [r, c] of cells) {
      const val = grid[r][c];
      if (!val) continue;

      if (val < 1 || val > regionSize) {
        errors.add(`${r},${c}`);
      } else if (seen.has(val)) {
        errors.add(`${r},${c}`);
        errors.add(seen.get(val));
      } else {
        seen.set(val, `${r},${c}`);
      }
    }
  }

  return errors;
}

function checkSolved(grid, regions, regionCells, size) {
  // All cells filled
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (!grid[r][c]) return false;
    }
  }

  // Check ripple constraint
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (violatesRipple(grid, r, c, grid[r][c], size)) return false;
    }
  }

  // Each region has 1 to N
  for (const [rid, cells] of Object.entries(regionCells)) {
    const regionSize = cells.length;
    const values = cells.map(([r, c]) => grid[r][c]).sort((a, b) => a - b);
    const expected = Array.from({ length: regionSize }, (_, i) => i + 1);
    if (!values.every((v, i) => v === expected[i])) return false;
  }

  return true;
}

export default function RippleEffect() {
  const [sizeKey, setSizeKey] = useState('5×5');
  const [puzzleData, setPuzzleData] = useState(null);
  const [grid, setGrid] = useState([]);
  const [selected, setSelected] = useState(null);
  const [gameState, setGameState] = useState('playing');
  const [errors, setErrors] = useState(new Set());
  const [showErrors, setShowErrors] = useState(true);

  const size = GRID_SIZES[sizeKey];

  const initGame = useCallback(() => {
    const data = generatePuzzle(size);
    setPuzzleData(data);
    setGrid(data.puzzle.map(row => [...row]));
    setSelected(null);
    setGameState('playing');
    setErrors(new Set());
  }, [size]);

  useEffect(() => {
    initGame();
  }, [initGame]);

  useEffect(() => {
    if (!puzzleData) return;

    const newErrors = showErrors ? checkValidity(grid, puzzleData.regions, puzzleData.regionCells, size) : new Set();
    setErrors(newErrors);

    if (checkSolved(grid, puzzleData.regions, puzzleData.regionCells, size)) {
      setGameState('won');
    }
  }, [grid, puzzleData, showErrors, size]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!selected || gameState !== 'playing') return;
      const [r, c] = selected;
      if (puzzleData.fixed[r][c]) return;

      const regionSize = puzzleData.regionCells[puzzleData.regions[r][c]].length;

      if (e.key >= '1' && e.key <= '9') {
        const num = parseInt(e.key, 10);
        if (num <= regionSize) {
          setGrid(prev => {
            const newGrid = prev.map(row => [...row]);
            newGrid[r][c] = newGrid[r][c] === num ? null : num;
            return newGrid;
          });
        }
      } else if (e.key === 'Backspace' || e.key === 'Delete' || e.key === '0') {
        setGrid(prev => {
          const newGrid = prev.map(row => [...row]);
          newGrid[r][c] = null;
          return newGrid;
        });
      } else if (e.key.startsWith('Arrow')) {
        e.preventDefault();
        let [nr, nc] = selected;
        if (e.key === 'ArrowUp') nr = Math.max(0, nr - 1);
        else if (e.key === 'ArrowDown') nr = Math.min(size - 1, nr + 1);
        else if (e.key === 'ArrowLeft') nc = Math.max(0, nc - 1);
        else if (e.key === 'ArrowRight') nc = Math.min(size - 1, nc + 1);
        setSelected([nr, nc]);
      } else if (e.key === 'Escape') {
        setSelected(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selected, gameState, puzzleData, size]);

  const handleCellClick = (r, c) => {
    if (gameState !== 'playing') return;
    setSelected([r, c]);
  };

  const handleNumberClick = (num) => {
    if (!selected || gameState !== 'playing') return;
    const [r, c] = selected;
    if (puzzleData.fixed[r][c]) return;

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

  const regionColors = {};
  const colorPalette = [
    'rgba(239, 68, 68, 0.12)', 'rgba(34, 197, 94, 0.12)', 'rgba(59, 130, 246, 0.12)',
    'rgba(168, 85, 247, 0.12)', 'rgba(251, 191, 36, 0.12)', 'rgba(236, 72, 153, 0.12)',
    'rgba(20, 184, 166, 0.12)', 'rgba(249, 115, 22, 0.12)', 'rgba(99, 102, 241, 0.12)',
    'rgba(132, 204, 22, 0.12)', 'rgba(6, 182, 212, 0.12)', 'rgba(244, 114, 182, 0.12)',
  ];

  for (const rid of Object.keys(puzzleData.regionCells)) {
    regionColors[rid] = colorPalette[parseInt(rid) % colorPalette.length];
  }

  const maxRegionSize = Math.max(...Object.values(puzzleData.regionCells).map(cells => cells.length));

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Link to="/" className={styles.backLink}>← Back to Games</Link>
        <h1 className={styles.title}>Ripple Effect</h1>
        <p className={styles.instructions}>
          Fill each region with numbers 1 to N (where N is the region size).
          If two cells contain the same number X, they must be at least X+1 cells apart orthogonally.
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
          style={{
            gridTemplateColumns: `repeat(${size}, 1fr)`,
            width: `${size * 48}px`,
            height: `${size * 48}px`,
          }}
        >
          {grid.map((row, r) =>
            row.map((cell, c) => {
              const regionId = puzzleData.regions[r][c];
              const isSelected = selected && selected[0] === r && selected[1] === c;
              const isFixed = puzzleData.fixed[r][c];
              const hasError = errors.has(`${r},${c}`);

              const borderTop = r === 0 || puzzleData.regions[r-1][c] !== regionId;
              const borderBottom = r === size - 1 || puzzleData.regions[r+1][c] !== regionId;
              const borderLeft = c === 0 || puzzleData.regions[r][c-1] !== regionId;
              const borderRight = c === size - 1 || puzzleData.regions[r][c+1] !== regionId;

              return (
                <button
                  key={`${r}-${c}`}
                  className={`
                    ${styles.cell}
                    ${isSelected ? styles.selected : ''}
                    ${isFixed ? styles.fixed : ''}
                    ${hasError ? styles.error : ''}
                    ${borderTop ? styles.borderTop : ''}
                    ${borderBottom ? styles.borderBottom : ''}
                    ${borderLeft ? styles.borderLeft : ''}
                    ${borderRight ? styles.borderRight : ''}
                  `}
                  style={{ backgroundColor: regionColors[regionId] }}
                  onClick={() => handleCellClick(r, c)}
                >
                  {cell && <span className={styles.number}>{cell}</span>}
                </button>
              );
            })
          )}
        </div>

        <div className={styles.numPad}>
          {Array.from({ length: maxRegionSize }, (_, i) => i + 1).map(num => (
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
            <div className={styles.winEmoji}>🌊</div>
            <h3>Puzzle Solved!</h3>
            <p>All ripples in perfect harmony!</p>
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
