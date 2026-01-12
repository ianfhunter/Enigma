import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import styles from './Yajilin.module.css';

const GRID_SIZES = {
  '5×5': 5,
  '7×7': 7,
  '9×9': 9,
};

const DIRECTIONS = {
  UP: { dr: -1, dc: 0, symbol: '↑' },
  DOWN: { dr: 1, dc: 0, symbol: '↓' },
  LEFT: { dr: 0, dc: -1, symbol: '←' },
  RIGHT: { dr: 0, dc: 1, symbol: '→' },
};

const DIR_KEYS = Object.keys(DIRECTIONS);

// Shuffle array in place
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Count shaded cells in a direction from a position
function countShadedInDirection(shaded, r, c, dir, size) {
  const { dr, dc } = DIRECTIONS[dir];
  let count = 0;
  let nr = r + dr;
  let nc = c + dc;
  while (nr >= 0 && nr < size && nc >= 0 && nc < size) {
    if (shaded[nr][nc]) count++;
    nr += dr;
    nc += dc;
  }
  return count;
}

// Check if all clues are satisfied
function cluesSatisfied(shaded, clues, size) {
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (clues[r][c]) {
        const { direction, count } = clues[r][c];
        if (countShadedInDirection(shaded, r, c, direction, size) !== count) {
          return false;
        }
      }
    }
  }
  return true;
}

// Solve puzzle using backtracking with iteration limit
function solvePuzzle(clues, size, maxSolutions = 2) {
  const solutions = [];
  const shaded = Array(size).fill(null).map(() => Array(size).fill(false));

  // Iteration limit to prevent hanging
  let iterations = 0;
  const maxIterations = 50000;

  // Get cells that can potentially be shaded (not clue cells)
  // Sort by most constrained first (cells with clues pointing at them)
  const cells = [];
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (!clues[r][c]) {
        cells.push([r, c]);
      }
    }
  }

  function canPlace(r, c) {
    // Check no adjacent shaded cells
    for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
      const nr = r + dr, nc = c + dc;
      if (nr >= 0 && nr < size && nc >= 0 && nc < size && shaded[nr][nc]) {
        return false;
      }
    }
    return true;
  }

  // More aggressive pruning - check if clues can possibly be satisfied
  function checkPartialClues() {
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (clues[r][c]) {
          const { direction, count } = clues[r][c];
          const current = countShadedInDirection(shaded, r, c, direction, size);
          // Too many shaded cells already
          if (current > count) return false;
        }
      }
    }
    return true;
  }

  function solve(idx) {
    iterations++;
    if (iterations > maxIterations) return;
    if (solutions.length >= maxSolutions) return;

    if (idx === cells.length) {
      if (cluesSatisfied(shaded, clues, size)) {
        solutions.push(shaded.map(row => [...row]));
      }
      return;
    }

    const [r, c] = cells[idx];

    // Try not shading this cell first
    solve(idx + 1);

    // Try shading this cell
    if (canPlace(r, c)) {
      shaded[r][c] = true;
      if (checkPartialClues()) {
        solve(idx + 1);
      }
      shaded[r][c] = false;
    }
  }

  solve(0);
  return solutions;
}

// Generate a valid shading (no adjacent shaded cells)
function generateValidShading(size) {
  const shaded = Array(size).fill(null).map(() => Array(size).fill(false));
  // Fewer shaded cells for larger grids to keep solver fast
  // 5x5: ~4-5 cells, 7x7: ~6-7 cells, 9x9: ~8-10 cells
  const basePercent = size <= 5 ? 0.16 : size <= 7 ? 0.12 : 0.10;
  const numShaded = Math.floor(size * size * basePercent) + Math.floor(Math.random() * 2);

  const positions = [];
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      positions.push([r, c]);
    }
  }
  shuffle(positions);

  let placed = 0;
  for (const [r, c] of positions) {
    if (placed >= numShaded) break;

    const hasAdjacentShaded = [
      [r-1, c], [r+1, c], [r, c-1], [r, c+1]
    ].some(([nr, nc]) =>
      nr >= 0 && nr < size && nc >= 0 && nc < size && shaded[nr][nc]
    );

    if (!hasAdjacentShaded) {
      shaded[r][c] = true;
      placed++;
    }
  }

  return shaded;
}

// Generate puzzle with unique solution
function generatePuzzle(size) {
  const maxAttempts = size <= 5 ? 50 : 30; // Fewer attempts for larger grids

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const solutionShaded = generateValidShading(size);

    // Count actual shaded cells
    let shadedCount = 0;
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (solutionShaded[r][c]) shadedCount++;
      }
    }

    // Skip if too few shaded cells
    const minShaded = size <= 5 ? 3 : size <= 7 ? 4 : 5;
    if (shadedCount < minShaded) continue;

    const clues = Array(size).fill(null).map(() => Array(size).fill(null));

    // Collect ALL potential clues
    const potentialClues = [];

    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (solutionShaded[r][c]) continue;

        for (const dir of DIR_KEYS) {
          const count = countShadedInDirection(solutionShaded, r, c, dir, size);
          potentialClues.push({ r, c, direction: dir, count });
        }
      }
    }

    // Sort by informativeness: clues with count > 0 first (they pinpoint shaded cells)
    // Then by count (higher counts = more constraint)
    potentialClues.sort((a, b) => {
      if (a.count > 0 && b.count === 0) return -1;
      if (a.count === 0 && b.count > 0) return 1;
      return b.count - a.count; // Higher count first
    });

    // Add some randomness while keeping general order
    for (let i = 0; i < potentialClues.length - 1; i++) {
      if (Math.random() < 0.2) {
        const j = Math.min(i + 1 + Math.floor(Math.random() * 2), potentialClues.length - 1);
        [potentialClues[i], potentialClues[j]] = [potentialClues[j], potentialClues[i]];
      }
    }

    // Start with more clues for larger grids (helps solver converge faster)
    const initialClues = size <= 5 ? 5 : size <= 7 ? 8 : 12;
    let clueIdx = 0;

    for (let i = 0; i < initialClues && clueIdx < potentialClues.length; clueIdx++) {
      const { r, c, direction, count } = potentialClues[clueIdx];
      if (!clues[r][c]) {
        clues[r][c] = { direction, count };
        i++;
      }
    }

    // Add clues until unique solution
    let iterations = 0;
    const maxIterations = size <= 5 ? 100 : 50; // Fewer iterations for larger grids

    while (iterations < maxIterations && clueIdx < potentialClues.length) {
      iterations++;
      const solutions = solvePuzzle(clues, size, 2);

      if (solutions.length === 1) {
        const found = solutions[0];
        let matches = true;
        for (let r = 0; r < size && matches; r++) {
          for (let c = 0; c < size && matches; c++) {
            if (found[r][c] !== solutionShaded[r][c]) matches = false;
          }
        }
        if (matches) {
          // Puzzle is uniquely solvable - return it
          // Skip minimization to ensure uniqueness
          return { clues, solutionShaded };
        }
      }

      if (solutions.length === 0) break;

      // Add another clue
      let added = false;
      while (clueIdx < potentialClues.length && !added) {
        const { r, c, direction, count } = potentialClues[clueIdx];
        clueIdx++;
        if (!clues[r][c]) {
          clues[r][c] = { direction, count };
          added = true;
        }
      }
    }
  }

  return generateSimplePuzzle(size);
}

// Try to remove clues while maintaining unique solution
function minimizeClues(clues, solutionShaded, size) {
  // Make a copy to work with
  const workingClues = clues.map(row => row.map(c => c ? { ...c } : null));

  const clueList = [];
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (workingClues[r][c]) {
        clueList.push({ r, c });
      }
    }
  }

  // Shuffle to randomize which clues we try to remove
  shuffle(clueList);

  for (const { r, c } of clueList) {
    const backup = workingClues[r][c];
    workingClues[r][c] = null;

    const solutions = solvePuzzle(workingClues, size, 2);

    if (solutions.length === 1) {
      // Verify solution still matches our intended solution
      const found = solutions[0];
      let matches = true;
      for (let pr = 0; pr < size && matches; pr++) {
        for (let pc = 0; pc < size && matches; pc++) {
          if (found[pr][pc] !== solutionShaded[pr][pc]) matches = false;
        }
      }
      if (!matches) {
        // Wrong solution, restore clue
        workingClues[r][c] = backup;
      }
      // If matches, keep the clue removed (puzzle is still unique)
    } else {
      // Multiple or no solutions, restore clue
      workingClues[r][c] = backup;
    }
  }

  // FINAL VERIFICATION: ensure puzzle is truly unique
  const finalCheck = solvePuzzle(workingClues, size, 2);
  if (finalCheck.length !== 1) {
    // Minimization broke uniqueness somehow, return original
    return { clues, solutionShaded };
  }

  // Verify final solution matches
  const finalSolution = finalCheck[0];
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (finalSolution[r][c] !== solutionShaded[r][c]) {
        // Solution doesn't match, return original
        return { clues, solutionShaded };
      }
    }
  }

  return { clues: workingClues, solutionShaded };
}

// Simple fallback puzzle generator - uses deterministic pattern, no solver needed
function generateSimplePuzzle(size) {
  const solutionShaded = Array(size).fill(null).map(() => Array(size).fill(false));
  const clues = Array(size).fill(null).map(() => Array(size).fill(null));

  // Place shaded cells in a simple diagonal pattern (guaranteed no adjacency)
  for (let i = 1; i < size - 1; i += 2) {
    if (i < size && i < size) {
      solutionShaded[i][i] = true;
    }
    if (i + 1 < size - 1 && size - i - 2 >= 1 && size - i - 2 !== i) {
      solutionShaded[i + 1][size - i - 2] = true;
    }
  }

  // Add clues pointing to each shaded cell from multiple directions
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (solutionShaded[r][c]) continue;

      // Add a clue for this cell
      for (const dir of DIR_KEYS) {
        const count = countShadedInDirection(solutionShaded, r, c, dir, size);
        if (count > 0 && !clues[r][c]) {
          clues[r][c] = { direction: dir, count };
          break;
        }
      }
    }
  }

  return { clues, solutionShaded };
}

// Check if a clue is satisfied
function checkClue(grid, clue, r, c, size) {
  if (!clue) return null;
  if (!grid || !grid[r]) return null; // Safety check

  const { direction, count } = clue;
  const { dr, dc } = DIRECTIONS[direction];

  let shadedCount = 0;
  let nr = r + dr;
  let nc = c + dc;

  while (nr >= 0 && nr < size && nc >= 0 && nc < size) {
    if (grid[nr] && grid[nr][nc] === 'shaded') shadedCount++;
    nr += dr;
    nc += dc;
  }

  return shadedCount === count;
}

function checkSolved(grid, clues, solutionShaded, size) {
  // Check if player's shaded cells match the solution exactly
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const playerShaded = grid[r][c] === 'shaded';
      const solutionIsShaded = solutionShaded[r][c];
      if (playerShaded !== solutionIsShaded) {
        return false;
      }
    }
  }
  return true;
}

export default function Yajilin() {
  const [sizeKey, setSizeKey] = useState('5×5');
  const [puzzleData, setPuzzleData] = useState(null);
  const [grid, setGrid] = useState([]);
  const [gameState, setGameState] = useState('playing');
  const [showErrors, setShowErrors] = useState(true);
  const [showSolution, setShowSolution] = useState(false);

  const size = GRID_SIZES[sizeKey];

  const initGame = useCallback(() => {
    const data = generatePuzzle(size);
    setPuzzleData(data);
    setGrid(Array(size).fill(null).map(() => Array(size).fill(null)));
    setGameState('playing');
    setShowSolution(false);
  }, [size]);

  useEffect(() => {
    initGame();
  }, [initGame]);

  useEffect(() => {
    if (!puzzleData) return;

    if (checkSolved(grid, puzzleData.clues, puzzleData.solutionShaded, size)) {
      setGameState('won');
    }
  }, [grid, puzzleData, size]);

  const handleGiveUp = () => {
    setShowSolution(true);
    setGameState('gaveUp');
  };

  const handleCellClick = (r, c) => {
    if (gameState !== 'playing' || showSolution) return;
    if (puzzleData.clues[r][c]) return; // Can't modify clue cells

    setGrid(prev => {
      const newGrid = prev.map(row => [...row]);
      const current = newGrid[r][c];
      // Toggle between null and shaded
      newGrid[r][c] = current === 'shaded' ? null : 'shaded';
      return newGrid;
    });
  };

  const handleReset = () => {
    setGrid(Array(size).fill(null).map(() => Array(size).fill(null)));
    setGameState('playing');
  };

  // Don't render until puzzle data matches current size
  if (!puzzleData || puzzleData.clues.length !== size || grid.length !== size) return null;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Link to="/" className={styles.backLink}>← Back to Games</Link>
        <h1 className={styles.title}>Yajilin</h1>
        <p className={styles.instructions}>
          Find and shade all the hidden cells. Arrow clues show how many
          shaded cells are in that direction. Shaded cells cannot be adjacent.
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
            width: `${size * 50}px`,
            height: `${size * 50}px`,
          }}
        >
          {grid.map((row, r) =>
            row.map((cell, c) => {
              const clue = puzzleData.clues[r][c];
              const clueResult = showErrors && !showSolution && clue ? checkClue(grid, clue, r, c, size) : null;
              const hasError = clueResult === false;
              const isShaded = showSolution ? puzzleData.solutionShaded[r][c] : cell === 'shaded';

              return (
                <button
                  key={`${r}-${c}`}
                  className={`
                    ${styles.cell}
                    ${isShaded ? styles.shaded : ''}
                    ${hasError ? styles.error : ''}
                    ${clueResult === true ? styles.satisfied : ''}
                    ${clue ? styles.clueCell : ''}
                    ${showSolution && isShaded ? styles.solutionShaded : ''}
                  `}
                  onClick={() => handleCellClick(r, c)}
                  disabled={!!clue || showSolution}
                >
                  {clue && (
                    <span className={styles.clue}>
                      <span className={styles.arrow}>{DIRECTIONS[clue.direction].symbol}</span>
                      <span className={styles.count}>{clue.count}</span>
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>

        {gameState === 'won' && (
          <div className={styles.winMessage}>
            <div className={styles.winEmoji}>🎉</div>
            <h3>Puzzle Solved!</h3>
            <p>All shaded cells found!</p>
          </div>
        )}

        {gameState === 'gaveUp' && (
          <div className={styles.gaveUpMessage}>
            <div className={styles.gaveUpEmoji}>😔</div>
            <h3>Solution Revealed</h3>
            <p>Shaded cells are shown above.</p>
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
