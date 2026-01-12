import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import styles from './YajisanKazusan.module.css';

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

// Check if unshaded cells are connected using BFS
function isConnected(grid, size) {
  const visited = Array(size).fill(null).map(() => Array(size).fill(false));

  // Find first unshaded cell
  let startR = -1, startC = -1;
  for (let r = 0; r < size && startR === -1; r++) {
    for (let c = 0; c < size && startR === -1; c++) {
      if (!grid[r][c]) {
        startR = r;
        startC = c;
      }
    }
  }

  if (startR === -1) return true; // All shaded (edge case)

  // BFS
  const queue = [[startR, startC]];
  visited[startR][startC] = true;
  let count = 1;

  while (queue.length > 0) {
    const [r, c] = queue.shift();
    for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
      const nr = r + dr;
      const nc = c + dc;
      if (nr >= 0 && nr < size && nc >= 0 && nc < size &&
          !grid[nr][nc] && !visited[nr][nc]) {
        visited[nr][nc] = true;
        queue.push([nr, nc]);
        count++;
      }
    }
  }

  // Count total unshaded cells
  let totalUnshaded = 0;
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (!grid[r][c]) totalUnshaded++;
    }
  }

  return count === totalUnshaded;
}

// Check if no two shaded cells are adjacent
function noAdjacentShaded(grid, size) {
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (grid[r][c]) {
        for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
          const nr = r + dr;
          const nc = c + dc;
          if (nr >= 0 && nr < size && nc >= 0 && nc < size && grid[nr][nc]) {
            return false;
          }
        }
      }
    }
  }
  return true;
}

// Check if all clues are satisfied
function allCluesSatisfied(shaded, clues, size) {
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const clue = clues[r][c];
      if (clue) {
        const count = countShadedInDirection(shaded, r, c, clue.direction, size);
        if (count !== clue.count) return false;
      }
    }
  }
  return true;
}

// Optimized solver using backtracking with aggressive pruning
function solvePuzzle(clues, size, maxSolutions = 2) {
  const solutions = [];
  const shaded = Array(size).fill(null).map(() => Array(size).fill(false));

  // Iteration limit to prevent hanging
  let iterations = 0;
  const maxIterations = size <= 5 ? 50000 : 20000;

  // Get all cells that can be shaded (cells without clues)
  // Sort by constraint level - cells near clues first
  const cells = [];
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (!clues[r][c]) {
        // Count how many clues point at this cell
        let constraintScore = 0;
        for (let cr = 0; cr < size; cr++) {
          for (let cc = 0; cc < size; cc++) {
            const clue = clues[cr][cc];
            if (clue) {
              const { dr, dc } = DIRECTIONS[clue.direction];
              let nr = cr + dr, nc = cc + dc;
              while (nr >= 0 && nr < size && nc >= 0 && nc < size) {
                if (nr === r && nc === c) {
                  constraintScore += clue.count > 0 ? 2 : 1;
                  break;
                }
                nr += dr;
                nc += dc;
              }
            }
          }
        }
        cells.push({ r, c, score: constraintScore });
      }
    }
  }
  // Sort by score descending (most constrained first)
  cells.sort((a, b) => b.score - a.score);
  const cellCoords = cells.map(c => [c.r, c.c]);

  function canShade(r, c) {
    for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
      const nr = r + dr, nc = c + dc;
      if (nr >= 0 && nr < size && nc >= 0 && nc < size && shaded[nr][nc]) {
        return false;
      }
    }
    return true;
  }

  // Fast clue check - only check clues that could be affected
  function checkClueConstraints() {
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        const clue = clues[r][c];
        if (clue) {
          const current = countShadedInDirection(shaded, r, c, clue.direction, size);
          if (current > clue.count) return false;
        }
      }
    }
    return true;
  }

  function solve(idx) {
    iterations++;
    if (iterations > maxIterations) return;
    if (solutions.length >= maxSolutions) return;

    if (idx === cellCoords.length) {
      if (isConnected(shaded, size) && allCluesSatisfied(shaded, clues, size)) {
        solutions.push(shaded.map(row => [...row]));
      }
      return;
    }

    const [r, c] = cellCoords[idx];

    // Try not shading this cell
    solve(idx + 1);
    if (solutions.length >= maxSolutions || iterations > maxIterations) return;

    // Try shading this cell
    if (canShade(r, c)) {
      shaded[r][c] = true;
      if (checkClueConstraints()) {
        solve(idx + 1);
      }
      shaded[r][c] = false;
    }
  }

  solve(0);
  return solutions;
}

// Generate a valid shading (no adjacent shaded cells, unshaded cells connected)
function generateValidShading(size) {
  const shaded = Array(size).fill(null).map(() => Array(size).fill(false));
  // Fewer shaded cells for larger grids = faster solving
  const basePercent = size <= 5 ? 0.18 : size <= 7 ? 0.12 : 0.08;
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
      // Check connectivity
      if (isConnected(shaded, size)) {
        placed++;
      } else {
        shaded[r][c] = false;
      }
    }
  }

  return shaded;
}

// Generate puzzle with GUARANTEED unique solution
function generatePuzzle(size) {
  const maxAttempts = size <= 5 ? 20 : 15;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const solution = generateValidShading(size);

    // Count actual shaded cells
    let shadedCount = 0;
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (solution[r][c]) shadedCount++;
      }
    }

    if (shadedCount < 3) continue;

    // Strategy: Start with MANY clues that guarantee uniqueness, then minimize
    const clues = Array(size).fill(null).map(() => Array(size).fill(null));

    // First, add clues that directly identify each shaded cell
    // For each shaded cell, add clues from adjacent cells pointing at it
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (!solution[r][c]) continue; // Only process shaded cells

        // Add clues from cells that can "see" this shaded cell
        const directions = [
          { dir: 'DOWN', dr: -1, dc: 0 },  // Cell above points down
          { dir: 'UP', dr: 1, dc: 0 },     // Cell below points up
          { dir: 'RIGHT', dr: 0, dc: -1 }, // Cell left points right
          { dir: 'LEFT', dr: 0, dc: 1 },   // Cell right points left
        ];

        for (const { dir, dr, dc } of directions) {
          const nr = r + dr, nc = c + dc;
          if (nr >= 0 && nr < size && nc >= 0 && nc < size &&
              !solution[nr][nc] && !clues[nr][nc]) {
            const count = countShadedInDirection(solution, nr, nc, dir, size);
            clues[nr][nc] = { direction: dir, count };
            break; // One clue per shaded cell is enough
          }
        }
      }
    }

    // Add some additional clues with count=0 to constrain empty areas
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (solution[r][c] || clues[r][c]) continue;

        // 30% chance to add a zero-count clue
        if (Math.random() < 0.3) {
          for (const dir of DIR_KEYS) {
            const count = countShadedInDirection(solution, r, c, dir, size);
            if (count === 0) {
              clues[r][c] = { direction: dir, count: 0 };
              break;
            }
          }
        }
      }
    }

    // Verify uniqueness
    const solutions = solvePuzzle(clues, size, 2);

    if (solutions.length === 1) {
      // Verify solution matches
      const found = solutions[0];
      let matches = true;
      for (let r = 0; r < size && matches; r++) {
        for (let c = 0; c < size && matches; c++) {
          if (found[r][c] !== solution[r][c]) matches = false;
        }
      }

      if (matches) {
        // Try to minimize clues (only for small grids)
        if (size <= 5) {
          const minimized = minimizeClues(clues, solution, size);
          return { clues: minimized.clues, solution: minimized.solution };
        }
        return { clues, solution };
      }
    }

    // If not unique yet, add more clues until it is
    if (solutions.length > 1) {
      // Add all remaining informative clues
      for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
          if (solution[r][c] || clues[r][c]) continue;

          // Find the most informative direction
          let bestDir = DIR_KEYS[0];
          let bestCount = -1;
          for (const dir of DIR_KEYS) {
            const count = countShadedInDirection(solution, r, c, dir, size);
            if (count > bestCount) {
              bestCount = count;
              bestDir = dir;
            }
          }
          clues[r][c] = { direction: bestDir, count: bestCount };
        }
      }

      // Final check
      const finalSolutions = solvePuzzle(clues, size, 2);
      if (finalSolutions.length === 1) {
        return { clues, solution };
      }
    }
  }

  // Fallback: generate simple puzzle with guaranteed uniqueness
  return generateGuaranteedUniquePuzzle(size);
}

// Try to remove clues while maintaining unique solution
function minimizeClues(clues, solution, size) {
  const workingClues = clues.map(row => row.map(c => c ? { ...c } : null));

  const clueList = [];
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (workingClues[r][c]) {
        clueList.push({ r, c });
      }
    }
  }

  shuffle(clueList);

  for (const { r, c } of clueList) {
    const backup = workingClues[r][c];
    workingClues[r][c] = null;

    const solutions = solvePuzzle(workingClues, size, 2);

    if (solutions.length === 1) {
      const found = solutions[0];
      let matches = true;
      for (let pr = 0; pr < size && matches; pr++) {
        for (let pc = 0; pc < size && matches; pc++) {
          if (found[pr][pc] !== solution[pr][pc]) matches = false;
        }
      }
      if (!matches) {
        workingClues[r][c] = backup;
      }
      // If matches, keep clue removed
    } else {
      // Multiple or no solutions - restore the clue
      workingClues[r][c] = backup;
    }
  }

  // Final verification - ensure exactly 1 solution
  const finalCheck = solvePuzzle(workingClues, size, 2);
  if (finalCheck.length !== 1) {
    // Minimization somehow broke uniqueness, return original
    return { clues, solution };
  }

  return { clues: workingClues, solution };
}

// Fallback puzzle generator that guarantees unique solution
function generateGuaranteedUniquePuzzle(size) {
  const solution = Array(size).fill(null).map(() => Array(size).fill(false));
  const clues = Array(size).fill(null).map(() => Array(size).fill(null));

  // Place shaded cells in a simple sparse pattern (guaranteed no adjacency)
  // Use a very predictable pattern that's easy to constrain
  const shadedPositions = [];
  for (let r = 1; r < size - 1; r += 2) {
    for (let c = 1; c < size - 1; c += 2) {
      if ((r + c) % 4 === 2 && shadedPositions.length < Math.floor(size * size * 0.1)) {
        solution[r][c] = true;
        shadedPositions.push([r, c]);
      }
    }
  }

  // If no shaded cells, add at least one
  if (shadedPositions.length === 0) {
    const mid = Math.floor(size / 2);
    solution[mid][mid] = true;
    shadedPositions.push([mid, mid]);
  }

  // For each shaded cell, add clues from ALL four adjacent cells if possible
  // This over-constrains the puzzle to guarantee uniqueness
  for (const [r, c] of shadedPositions) {
    const adjacents = [
      { nr: r - 1, nc: c, dir: 'DOWN' },
      { nr: r + 1, nc: c, dir: 'UP' },
      { nr: r, nc: c - 1, dir: 'RIGHT' },
      { nr: r, nc: c + 1, dir: 'LEFT' },
    ];

    for (const { nr, nc, dir } of adjacents) {
      if (nr >= 0 && nr < size && nc >= 0 && nc < size &&
          !solution[nr][nc] && !clues[nr][nc]) {
        const count = countShadedInDirection(solution, nr, nc, dir, size);
        clues[nr][nc] = { direction: dir, count };
      }
    }
  }

  // Add clues for ALL remaining unshaded cells to guarantee uniqueness
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (!solution[r][c] && !clues[r][c]) {
        // Find most constraining direction
        let bestDir = DIR_KEYS[0];
        let bestCount = -1;
        for (const dir of DIR_KEYS) {
          const count = countShadedInDirection(solution, r, c, dir, size);
          if (count > bestCount || (count >= 0 && bestCount < 0)) {
            bestCount = count;
            bestDir = dir;
          }
        }
        clues[r][c] = { direction: bestDir, count: Math.max(0, bestCount) };
      }
    }
  }

  return { clues, solution };
}

// Check if a clue is satisfied (for display purposes)
function checkClue(grid, clue, r, c, size) {
  if (!clue) return null;

  const { direction, count } = clue;
  const { dr, dc } = DIRECTIONS[direction];

  let shadedCount = 0;
  let nr = r + dr;
  let nc = c + dc;

  while (nr >= 0 && nr < size && nc >= 0 && nc < size) {
    if (grid[nr][nc]) shadedCount++;
    nr += dr;
    nc += dc;
  }

  return shadedCount === count;
}

// Check if a shaded cell has adjacent shaded cells
function hasAdjacentShadedError(grid, r, c, size) {
  if (!grid[r][c]) return false; // Only check shaded cells

        for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
          const nr = r + dr;
          const nc = c + dc;
          if (nr >= 0 && nr < size && nc >= 0 && nc < size && grid[nr][nc]) {
      return true;
    }
  }
  return false;
}

// Check if puzzle is solved
function checkSolved(grid, solution, size) {
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (grid[r][c] !== solution[r][c]) {
        return false;
      }
    }
  }
  return true;
}

export default function YajisanKazusan() {
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
    setGrid(Array(size).fill(null).map(() => Array(size).fill(false)));
    setGameState('playing');
    setShowSolution(false);
  }, [size]);

  useEffect(() => {
    initGame();
  }, [initGame]);

  useEffect(() => {
    if (!puzzleData) return;

    if (checkSolved(grid, puzzleData.solution, size)) {
      setGameState('won');
    }
  }, [grid, puzzleData, size]);

  const handleCellClick = (r, c) => {
    if (gameState !== 'playing' || showSolution) return;
    if (puzzleData.clues[r][c]) return; // Can't shade clue cells

    setGrid(prev => {
      const newGrid = prev.map(row => [...row]);
      newGrid[r][c] = !newGrid[r][c];
      return newGrid;
    });
  };

  const handleReset = () => {
    setGrid(Array(size).fill(null).map(() => Array(size).fill(false)));
    setGameState('playing');
    setShowSolution(false);
  };

  const handleGiveUp = () => {
    setShowSolution(true);
    setGameState('gaveUp');
  };

  if (!puzzleData || puzzleData.clues.length !== size || grid.length !== size) return null;

  const displayGrid = showSolution ? puzzleData.solution : grid;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Link to="/" className={styles.backLink}>← Back to Games</Link>
        <h1 className={styles.title}>Yajisan-Kazusan</h1>
        <p className={styles.instructions}>
          Shade cells so that: (1) shaded cells are not adjacent, (2) unshaded cells form a connected region,
          (3) each clue shows how many shaded cells are in that direction. Clue cells cannot be shaded.
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
        {displayGrid.map((row, r) =>
            row.map((isShaded, c) => {
              const clue = puzzleData.clues[r][c];
              const clueResult = showErrors && !showSolution ? checkClue(grid, clue, r, c, size) : null;
              const clueError = clueResult === false;
              const adjacentError = showErrors && !showSolution && hasAdjacentShadedError(grid, r, c, size);
              const hasError = clueError || adjacentError;

              return (
                <button
                  key={`${r}-${c}`}
                  className={`
                    ${styles.cell}
                    ${isShaded ? styles.shaded : ''}
                    ${hasError ? styles.error : ''}
                    ${clueResult === true ? styles.satisfied : ''}
                    ${showSolution && isShaded ? styles.solutionShaded : ''}
                    ${clue ? styles.clueCell : ''}
                  `}
                  onClick={() => handleCellClick(r, c)}
                  disabled={showSolution || !!clue}
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
            <p>All clues are satisfied!</p>
          </div>
        )}

        {gameState === 'gaveUp' && (
          <div className={styles.gaveUpMessage}>
            <div className={styles.gaveUpEmoji}>😔</div>
            <h3>Solution Revealed</h3>
            <p>The shaded cells are shown above.</p>
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
