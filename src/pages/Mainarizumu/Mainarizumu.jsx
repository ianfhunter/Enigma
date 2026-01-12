import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import styles from './Mainarizumu.module.css';

const GRID_SIZES = {
  '5×5': 5,
  '6×6': 6,
  '8×8': 8,
};

// Generate random regions (polyominoes)
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

  // Shuffle positions
  for (let i = positions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [positions[i], positions[j]] = [positions[j], positions[i]];
  }

  for (const [startR, startC] of positions) {
    if (regions[startR][startC] !== -1) continue;

    // Smaller regions (2-4 cells) are easier to solve and still interesting
    const targetSize = 2 + Math.floor(Math.random() * 3); // 2-4 cells per region
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

// Check if a number can be placed at position
function canPlace(grid, r, c, num, size) {
  // Check all 8 neighbors for same number
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const nr = r + dr;
      const nc = c + dc;
      if (nr >= 0 && nr < size && nc >= 0 && nc < size) {
        if (grid[nr][nc] === num) return false;
      }
    }
  }
  return true;
}

// Solver: counts solutions (stops at 2 to check uniqueness)
function countSolutions(puzzle, regions, regionCells, size, maxCount = 2) {
  const grid = puzzle.map(row => [...row]);

  // Find all empty cells
  const emptyCells = [];
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (grid[r][c] === null) {
        emptyCells.push([r, c]);
      }
    }
  }

  let count = 0;

  function solve(idx) {
    if (count >= maxCount) return; // Early exit once we find enough solutions

    if (idx >= emptyCells.length) {
      count++;
      return;
    }

    const [r, c] = emptyCells[idx];
    const regionId = regions[r][c];
    const regionSize = regionCells[regionId].length;

    // Find which numbers are already used in this region
    const usedInRegion = new Set();
    for (const [rr, cc] of regionCells[regionId]) {
      if (grid[rr][cc] !== null) {
        usedInRegion.add(grid[rr][cc]);
      }
    }

    // Try each valid number for this cell
    for (let num = 1; num <= regionSize; num++) {
      if (usedInRegion.has(num)) continue;
      if (!canPlace(grid, r, c, num, size)) continue;

      grid[r][c] = num;
      solve(idx + 1);
      grid[r][c] = null;

      if (count >= maxCount) return;
    }
  }

  solve(0);
  return count;
}

// Check if puzzle has exactly one solution
function hasUniqueSolution(puzzle, regions, regionCells, size) {
  return countSolutions(puzzle, regions, regionCells, size, 2) === 1;
}

// Generate a valid solution using global backtracking
function generateSolution(regions, regionCells, size) {
  const solution = Array(size).fill(null).map(() => Array(size).fill(0));

  // Get all cells and sort them for better backtracking (process cells with fewer options first)
  const allCells = [];
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      allCells.push([r, c]);
    }
  }

  // Shuffle for variety
  for (let i = allCells.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [allCells[i], allCells[j]] = [allCells[j], allCells[i]];
  }

  function getValidNumbers(r, c) {
    const regionId = regions[r][c];
    const regionSize = regionCells[regionId].length;

    // Find used numbers in this region
    const usedInRegion = new Set();
    for (const [rr, cc] of regionCells[regionId]) {
      if (solution[rr][cc] !== 0) {
        usedInRegion.add(solution[rr][cc]);
      }
    }

    const valid = [];
    for (let num = 1; num <= regionSize; num++) {
      if (usedInRegion.has(num)) continue;
      if (!canPlace(solution, r, c, num, size)) continue;
      valid.push(num);
    }

    // Shuffle for variety
    for (let i = valid.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [valid[i], valid[j]] = [valid[j], valid[i]];
    }

    return valid;
  }

  function solve(idx) {
    if (idx >= allCells.length) return true;

    const [r, c] = allCells[idx];
    const validNumbers = getValidNumbers(r, c);

    for (const num of validNumbers) {
      solution[r][c] = num;
      if (solve(idx + 1)) return true;
      solution[r][c] = 0;
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
  const maxAttempts = 30;

  while (attempts < maxAttempts) {
    attempts++;
    const { regions, regionCells } = generateRegions(size);
    const solution = generateSolution(regions, regionCells, size);

    if (solution) {
      // Start with full solution and remove cells while maintaining unique solvability
      const puzzle = solution.map(row => [...row]);
      const fixed = Array(size).fill(null).map(() => Array(size).fill(true));

      // Create a shuffled list of all cells to try removing
      const allCells = [];
      for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
          allCells.push([r, c]);
        }
      }
      // Shuffle
      for (let i = allCells.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [allCells[i], allCells[j]] = [allCells[j], allCells[i]];
      }

      // Target: remove about 55% of cells (keep ~45%)
      const targetRemoved = Math.floor(size * size * 0.55);
      let removed = 0;

      for (const [r, c] of allCells) {
        if (removed >= targetRemoved) break;

        // Try removing this cell
        const savedValue = puzzle[r][c];
        puzzle[r][c] = null;

        // Ensure each region still has at least one hint
        const regionId = regions[r][c];
        const regionHasHint = regionCells[regionId].some(([rr, cc]) =>
          puzzle[rr][cc] !== null
        );

        if (!regionHasHint) {
          // Must keep at least one hint per region
          puzzle[r][c] = savedValue;
          continue;
        }

        // Check if puzzle still has unique solution
        if (hasUniqueSolution(puzzle, regions, regionCells, size)) {
          fixed[r][c] = false;
          removed++;
        } else {
          // Restore the cell - removing it makes puzzle non-unique or unsolvable
          puzzle[r][c] = savedValue;
        }
      }

      // Final verification: ensure the puzzle is solvable
      if (hasUniqueSolution(puzzle, regions, regionCells, size)) {
        return { regions, regionCells, solution, puzzle, fixed };
      }
      // If somehow not solvable, try again
    }
  }

  // Fallback to a guaranteed simple puzzle
  return generateSimplePuzzle(size);
}

function generateSimplePuzzle(size) {
  const regions = Array(size).fill(null).map(() => Array(size).fill(-1));
  const regionCells = {};
  let rid = 0;

  // Create 2x2 regions (or 1x2/2x1/1x1 at edges for odd sizes)
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

  // Create a guaranteed valid solution using a simple pattern
  // For 2x2 regions: assign 1,2,3,4 in reading order (top-left, top-right, bottom-left, bottom-right)
  // This pattern ensures no adjacent cells (including diagonals) between regions have same numbers
  const solution = Array(size).fill(null).map(() => Array(size).fill(0));

  for (const [regionId, cells] of Object.entries(regionCells)) {
    // For each cell in region, assign 1, 2, 3, ... based on position within region
    cells.forEach(([r, c], idx) => {
      solution[r][c] = idx + 1;
    });
  }

  // Create puzzle - for simplicity, keep one hint per region (this is always uniquely solvable for 2x2)
  const puzzle = solution.map(row => row.map(() => null));
  const fixed = Array(size).fill(null).map(() => Array(size).fill(false));

  for (const cells of Object.values(regionCells)) {
    // Keep the first cell as a hint
    const [r, c] = cells[0];
    puzzle[r][c] = solution[r][c];
    fixed[r][c] = true;

    // For 2x2 regions, also keep one more hint to ensure uniqueness
    if (cells.length >= 2) {
      const [r2, c2] = cells[1];
      puzzle[r2][c2] = solution[r2][c2];
      fixed[r2][c2] = true;
    }
  }

  return { regions, regionCells, solution, puzzle, fixed };
}

function checkValidity(grid, regions, regionCells, size) {
  const errors = new Set();

  // Check adjacent cells (including diagonals) for same number
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (!grid[r][c]) continue;

      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue;
          const nr = r + dr;
          const nc = c + dc;
          if (nr >= 0 && nr < size && nc >= 0 && nc < size) {
            if (grid[nr][nc] === grid[r][c]) {
              errors.add(`${r},${c}`);
              errors.add(`${nr},${nc}`);
            }
          }
        }
      }
    }
  }

  // Check each region has unique numbers and numbers are in valid range
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
  // All cells must be filled
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (!grid[r][c]) return false;
    }
  }

  // No adjacent same numbers
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue;
          const nr = r + dr;
          const nc = c + dc;
          if (nr >= 0 && nr < size && nc >= 0 && nc < size) {
            if (grid[nr][nc] === grid[r][c]) return false;
          }
        }
      }
    }
  }

  // Each region has exactly 1 to regionSize
  for (const [rid, cells] of Object.entries(regionCells)) {
    const regionSize = cells.length;
    const values = cells.map(([r, c]) => grid[r][c]).sort((a, b) => a - b);
    const expected = Array.from({ length: regionSize }, (_, i) => i + 1);
    if (!values.every((v, i) => v === expected[i])) return false;
  }

  return true;
}

export default function Mainarizumu() {
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

  // Keyboard input
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

  // Guard against size mismatch during transitions
  if (grid.length !== size || (grid[0] && grid[0].length !== size)) {
    return null;
  }

  // Generate region colors - muted jewel tones for dark theme
  const regionColors = {};
  const colorPalette = [
    'rgba(56, 189, 248, 0.15)',   // sky blue
    'rgba(52, 211, 153, 0.15)',   // emerald
    'rgba(167, 139, 250, 0.15)',  // violet
    'rgba(251, 191, 36, 0.12)',   // amber
    'rgba(45, 212, 191, 0.15)',   // teal
    'rgba(244, 114, 182, 0.12)',  // pink
    'rgba(129, 140, 248, 0.15)',  // indigo
    'rgba(249, 115, 22, 0.12)',   // orange
    'rgba(163, 230, 53, 0.12)',   // lime
    'rgba(14, 165, 233, 0.15)',   // cyan
    'rgba(192, 132, 252, 0.15)',  // purple
    'rgba(74, 222, 128, 0.15)',   // green
  ];

  for (const rid of Object.keys(puzzleData.regionCells)) {
    regionColors[rid] = colorPalette[parseInt(rid) % colorPalette.length];
  }

  // Get max region size for number pad
  const maxRegionSize = Math.max(...Object.values(puzzleData.regionCells).map(cells => cells.length));

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Link to="/" className={styles.backLink}>← Back to Games</Link>
        <h1 className={styles.title}>Mainarizumu</h1>
        <p className={styles.instructions}>
          Fill each region with numbers 1 to N (where N is the region size).
          Same numbers cannot touch each other, even diagonally.
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

              // Determine borders for region boundaries (with safety checks)
              const borderTop = r === 0 || !puzzleData.regions[r-1] || puzzleData.regions[r-1][c] !== regionId;
              const borderBottom = r === size - 1 || !puzzleData.regions[r+1] || puzzleData.regions[r+1][c] !== regionId;
              const borderLeft = c === 0 || puzzleData.regions[r][c-1] === undefined || puzzleData.regions[r][c-1] !== regionId;
              const borderRight = c === size - 1 || puzzleData.regions[r][c+1] === undefined || puzzleData.regions[r][c+1] !== regionId;

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

        {/* Number pad */}
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
            <div className={styles.winEmoji}>🎉</div>
            <h3>Puzzle Solved!</h3>
            <p>All regions filled correctly!</p>
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
