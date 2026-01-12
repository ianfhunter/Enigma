import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import styles from './Shakashaka.module.css';

const GRID_SIZES = {
  '5×5': 5,
  '7×7': 7,
  '10×10': 10,
};

// Triangle types - black fills that corner, white is opposite
const TRIANGLE_CYCLE = [null, 'ul', 'ur', 'lr', 'll'];

// ==================== SHAKASHAKA SOLVER ====================

// Cell states for solver (0 = empty, 1-4 = triangles)
const CELL_EMPTY = 0;
const CELL_UL = 1;  // upper-left black triangle
const CELL_UR = 2;  // upper-right black triangle
const CELL_LL = 3;  // lower-left black triangle
const CELL_LR = 4;  // lower-right black triangle

const TRIANGLE_TO_NUM = { 'ul': CELL_UL, 'ur': CELL_UR, 'll': CELL_LL, 'lr': CELL_LR };
const NUM_TO_TRIANGLE = { [CELL_UL]: 'ul', [CELL_UR]: 'ur', [CELL_LL]: 'll', [CELL_LR]: 'lr', [CELL_EMPTY]: null };

const DIRECTIONS = [[-1, 0], [1, 0], [0, -1], [0, 1]];

// Check if current placement violates number constraints
function checkNumberConstraints(board, blackCells, clues, size) {
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (!blackCells[r][c]) continue;

      const clue = clues[r][c];
      let triangleCount = 0;
      let unknownCount = 0;

      for (const [dr, dc] of DIRECTIONS) {
        const nr = r + dr, nc = c + dc;
        if (nr < 0 || nr >= size || nc < 0 || nc >= size) continue;
        if (blackCells[nr][nc]) continue;

        if (board[nr][nc] === -1) unknownCount++;
        else if (board[nr][nc] > 0) triangleCount++;
      }

      // Too many triangles
      if (triangleCount > clue) return false;
      // Can't possibly reach required count
      if (triangleCount + unknownCount < clue) return false;
    }
  }
  return true;
}

// Validate that triangles form valid white regions (rectangles)
// The white parts of triangles must connect to form axis-aligned or 45° rectangles
function validateTriangleConnections(board, blackCells, size) {
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (blackCells[r][c]) continue;

      const cell = board[r][c];
      if (cell <= 0) continue; // Empty or unknown

      // Check that triangle white edges connect properly
      // ul: white faces down-right -> right must be ur/empty, down must be ll/empty
      // ur: white faces down-left -> left must be ul/empty, down must be lr/empty
      // ll: white faces up-right -> right must be lr/empty, up must be ul/empty
      // lr: white faces up-left -> left must be ll/empty, up must be ur/empty

      const checkNeighbor = (nr, nc, validTypes) => {
        if (nr < 0 || nr >= size || nc < 0 || nc >= size) return true;
        if (blackCells[nr][nc]) return true;
        const neighbor = board[nr][nc];
        if (neighbor === -1) return true; // Unknown, ok for now
        return neighbor === 0 || validTypes.includes(neighbor);
      };

      if (cell === CELL_UL) {
        if (!checkNeighbor(r, c + 1, [CELL_UR])) return false;
        if (!checkNeighbor(r + 1, c, [CELL_LL])) return false;
      } else if (cell === CELL_UR) {
        if (!checkNeighbor(r, c - 1, [CELL_UL])) return false;
        if (!checkNeighbor(r + 1, c, [CELL_LR])) return false;
      } else if (cell === CELL_LL) {
        if (!checkNeighbor(r, c + 1, [CELL_LR])) return false;
        if (!checkNeighbor(r - 1, c, [CELL_UL])) return false;
      } else if (cell === CELL_LR) {
        if (!checkNeighbor(r, c - 1, [CELL_LL])) return false;
        if (!checkNeighbor(r - 1, c, [CELL_UR])) return false;
      }
    }
  }
  return true;
}

// Solve the puzzle using backtracking
// Returns array of solutions (limited to maxSolutions)
function solvePuzzle(blackCells, clues, size, maxSolutions = 2) {
  const board = Array(size).fill(null).map(() => Array(size).fill(-1)); // -1 = unknown
  const solutions = [];

  // Get list of white cells to fill
  const whiteCells = [];
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (!blackCells[r][c]) {
        whiteCells.push([r, c]);
      }
    }
  }

  function backtrack(idx) {
    if (solutions.length >= maxSolutions) return;

    if (idx === whiteCells.length) {
      // Verify all clues are exactly satisfied
      for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
          if (!blackCells[r][c]) continue;
          let count = 0;
          for (const [dr, dc] of DIRECTIONS) {
            const nr = r + dr, nc = c + dc;
            if (nr >= 0 && nr < size && nc >= 0 && nc < size && !blackCells[nr][nc] && board[nr][nc] > 0) {
              count++;
            }
          }
          if (count !== clues[r][c]) return;
        }
      }
      solutions.push(board.map(row => [...row]));
      return;
    }

    const [r, c] = whiteCells[idx];

    // Try each state: empty (0), ul (1), ur (2), ll (3), lr (4)
    for (let state = 0; state <= 4; state++) {
      board[r][c] = state;

      if (checkNumberConstraints(board, blackCells, clues, size) &&
          validateTriangleConnections(board, blackCells, size)) {
        backtrack(idx + 1);
        if (solutions.length >= maxSolutions) return;
      }
    }

    board[r][c] = -1; // Reset
  }

  backtrack(0);
  return solutions;
}

// Generate a puzzle using the solver
function generatePuzzleWithSolver(size) {
  const maxAttempts = 50;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    // Create random black cell layout
    const blackCells = Array(size).fill(null).map(() => Array(size).fill(false));
    const numBlacks = Math.floor(size * size * 0.15) + Math.floor(Math.random() * size);

    // Gather all positions
    const positions = [];
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        positions.push([r, c]);
      }
    }

    // Fisher-Yates shuffle
    for (let i = positions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [positions[i], positions[j]] = [positions[j], positions[i]];
    }

    // Place black cells
    for (let i = 0; i < numBlacks && i < positions.length; i++) {
      blackCells[positions[i][0]][positions[i][1]] = true;
    }

    // Generate a random valid solution with some diamonds
    const solution = Array(size).fill(null).map(() => Array(size).fill(CELL_EMPTY));
    let hasTriangles = false;

    // Try to place 1-3 diamonds
    const numDiamonds = 1 + Math.floor(Math.random() * 3);
    let diamondsPlaced = 0;

    // Shuffle positions for diamond placement
    for (let i = positions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [positions[i], positions[j]] = [positions[j], positions[i]];
    }

    for (const [r, c] of positions) {
      if (diamondsPlaced >= numDiamonds) break;

      // Check if we can place a 2x2 diamond here
      if (r + 1 < size && c + 1 < size &&
          !blackCells[r][c] && !blackCells[r][c + 1] &&
          !blackCells[r + 1][c] && !blackCells[r + 1][c + 1] &&
          solution[r][c] === CELL_EMPTY && solution[r][c + 1] === CELL_EMPTY &&
          solution[r + 1][c] === CELL_EMPTY && solution[r + 1][c + 1] === CELL_EMPTY) {

        // The diamond must be isolated - all adjacent non-diamond cells must be black or edge
        const needsIsolation = [
          [r - 1, c], [r - 1, c + 1],  // above
          [r + 2, c], [r + 2, c + 1],  // below
          [r, c - 1], [r + 1, c - 1],  // left
          [r, c + 2], [r + 1, c + 2],  // right
        ];

        let canPlace = true;
        for (const [nr, nc] of needsIsolation) {
          if (nr >= 0 && nr < size && nc >= 0 && nc < size && !blackCells[nr][nc]) {
            canPlace = false;
            break;
          }
        }

        if (canPlace) {
          solution[r][c] = CELL_UL;
          solution[r][c + 1] = CELL_UR;
          solution[r + 1][c] = CELL_LL;
          solution[r + 1][c + 1] = CELL_LR;
          hasTriangles = true;
          diamondsPlaced++;
        }
      }
    }

    if (!hasTriangles) continue;

    // Calculate clues from our solution
    const clues = Array(size).fill(null).map(() => Array(size).fill(0));
    let hasNonZeroClue = false;

    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (!blackCells[r][c]) continue;
        let count = 0;
        for (const [dr, dc] of DIRECTIONS) {
          const nr = r + dr, nc = c + dc;
          if (nr >= 0 && nr < size && nc >= 0 && nc < size && solution[nr][nc] > 0) {
            count++;
          }
        }
        clues[r][c] = count;
        if (count > 0) hasNonZeroClue = true;
      }
    }

    if (!hasNonZeroClue) continue;

    // Verify the puzzle has exactly one solution
    const solutions = solvePuzzle(blackCells, clues, size, 2);

    if (solutions.length === 1) {
      // Convert to game format
      const grid = Array(size).fill(null).map(() => Array(size).fill(null));
      const solutionGrid = Array(size).fill(null).map(() => Array(size).fill(null));

      for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
          if (blackCells[r][c]) {
            grid[r][c] = clues[r][c];
          }
          solutionGrid[r][c] = NUM_TO_TRIANGLE[solutions[0][r][c]];
        }
      }

      return { grid, blackCells, solution: solutionGrid };
    }
  }

  // Fallback to a guaranteed valid puzzle
  return generateFallback(size);
}

// Fallback puzzle generator (guaranteed valid)
function generateFallback(size) {
  const blackCells = Array(size).fill(null).map(() => Array(size).fill(false));
  const grid = Array(size).fill(null).map(() => Array(size).fill(null));
  const solution = Array(size).fill(null).map(() => Array(size).fill(null));

  // Diamond in top-left corner (at grid edge, so properly isolated)
  solution[0][0] = 'ul';
  solution[0][1] = 'ur';
  solution[1][0] = 'll';
  solution[1][1] = 'lr';

  // Black cells to isolate diamond from the rest of the grid
  for (let c = 2; c < size; c++) {
    blackCells[0][c] = true;
    blackCells[1][c] = true;
  }
  for (let r = 2; r < size; r++) {
    blackCells[r][0] = true;
    blackCells[r][1] = true;
  }

  // Calculate clues
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (blackCells[r][c]) {
        grid[r][c] = countAdjacentTriangles(solution, r, c, size);
      }
    }
  }

  return { grid, blackCells, solution };
}

function countAdjacentTriangles(grid, r, c, size) {
  let count = 0;
  if (!grid || !grid.length) return 0;

  for (const [dr, dc] of DIRECTIONS) {
    const nr = r + dr;
    const nc = c + dc;
    if (nr >= 0 && nr < size && nc >= 0 && nc < size && grid[nr] && grid[nr][nc]) {
      count++;
    }
  }
  return count;
}

function generatePuzzle(size) {
  return generatePuzzleWithSolver(size);
}

// ==================== GAME LOGIC ====================

function checkValidity(grid, blackCells, playerGrid, size) {
  const errors = new Set();

  // Safety check for grid dimensions
  if (!playerGrid || playerGrid.length !== size) return errors;

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (!blackCells[r] || !blackCells[r][c]) continue;

      const expected = grid[r][c];
      const actual = countAdjacentTriangles(playerGrid, r, c, size);

      if (actual > expected) {
        errors.add(`${r},${c}`);
        for (const [dr, dc] of DIRECTIONS) {
          const nr = r + dr;
          const nc = c + dc;
          if (nr >= 0 && nr < size && nc >= 0 && nc < size && playerGrid[nr][nc]) {
            errors.add(`${nr},${nc}`);
          }
        }
      }
    }
  }

  return errors;
}

function checkSolved(solution, playerGrid, size) {
  // Safety check for grid dimensions
  if (!playerGrid || playerGrid.length !== size || !solution || solution.length !== size) return false;

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (!playerGrid[r] || !solution[r]) return false;
      if (solution[r][c] !== playerGrid[r][c]) return false;
    }
  }
  return true;
}

function Triangle({ type, hasError }) {
  const paths = {
    ul: "0,0 100,0 0,100",
    ur: "0,0 100,0 100,100",
    ll: "0,0 100,100 0,100",
    lr: "100,0 100,100 0,100",
  };

  if (!paths[type]) return null;

  return (
    <svg viewBox="0 0 100 100" className={`${styles.triangle} ${hasError ? styles.triangleError : ''}`}>
      <polygon points={paths[type]} fill="currentColor" />
    </svg>
  );
}

export default function Shakashaka() {
  const [sizeKey, setSizeKey] = useState('5×5');
  const [puzzleData, setPuzzleData] = useState(null);
  const [playerGrid, setPlayerGrid] = useState([]);
  const [gameState, setGameState] = useState('playing');
  const [errors, setErrors] = useState(new Set());
  const [showErrors, setShowErrors] = useState(true);
  const [showSolution, setShowSolution] = useState(false);
  const [generating, setGenerating] = useState(false);

  const size = GRID_SIZES[sizeKey];

  const initGame = useCallback(() => {
    setGenerating(true);
    // Use setTimeout to allow UI to update before heavy computation
    setTimeout(() => {
      const data = generatePuzzle(size);
      setPuzzleData(data);
      setPlayerGrid(Array(size).fill(null).map(() => Array(size).fill(null)));
      setGameState('playing');
      setErrors(new Set());
      setShowSolution(false);
      setGenerating(false);
    }, 10);
  }, [size]);

  useEffect(() => { initGame(); }, [initGame]);

  useEffect(() => {
    if (!puzzleData) return;
    // Ensure playerGrid dimensions match current size (prevents race condition on size change)
    if (playerGrid.length !== size || (playerGrid[0] && playerGrid[0].length !== size)) return;

    const newErrors = showErrors && !showSolution
      ? checkValidity(puzzleData.grid, puzzleData.blackCells, playerGrid, size)
      : new Set();
    setErrors(newErrors);

    if (!showSolution && checkSolved(puzzleData.solution, playerGrid, size)) {
      setGameState('won');
    }
  }, [playerGrid, puzzleData, showErrors, showSolution, size]);

  const handleCellClick = (r, c) => {
    if (gameState !== 'playing' || showSolution) return;
    if (puzzleData.blackCells[r][c]) return;

    setPlayerGrid(prev => {
      const newGrid = prev.map(row => [...row]);
      const idx = TRIANGLE_CYCLE.indexOf(prev[r][c]);
      newGrid[r][c] = TRIANGLE_CYCLE[(idx + 1) % TRIANGLE_CYCLE.length];
      return newGrid;
    });
  };

  const handleCellRightClick = (r, c, e) => {
    e.preventDefault();
    if (gameState !== 'playing' || showSolution) return;
    if (puzzleData.blackCells[r][c]) return;

    setPlayerGrid(prev => {
      const newGrid = prev.map(row => [...row]);
      const idx = TRIANGLE_CYCLE.indexOf(prev[r][c]);
      newGrid[r][c] = TRIANGLE_CYCLE[(idx - 1 + TRIANGLE_CYCLE.length) % TRIANGLE_CYCLE.length];
      return newGrid;
    });
  };

  if (generating || !puzzleData) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <Link to="/" className={styles.backLink}>← Back to Games</Link>
          <h1 className={styles.title}>Shakashaka</h1>
        </div>
        <div className={styles.loading}>Generating puzzle...</div>
      </div>
    );
  }

  const displayGrid = showSolution ? puzzleData.solution : playerGrid;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Link to="/" className={styles.backLink}>← Back to Games</Link>
        <h1 className={styles.title}>Shakashaka</h1>
        <p className={styles.instructions}>
          Place black triangles so all white areas form rectangles. Numbers show
          adjacent triangle count. Click to cycle, right-click to reverse.
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
            width: `min(${size * 45}px, 90vw)`,
            height: `min(${size * 45}px, 90vw)`,
          }}
        >
          {puzzleData.grid.map((row, r) =>
            row.map((cell, c) => {
              const isBlack = puzzleData.blackCells[r][c];
              const triangleType = displayGrid[r][c];
              const hasError = errors.has(`${r},${c}`);

              return (
                <button
                  key={`${r}-${c}`}
                  className={`${styles.cell} ${isBlack ? styles.blackCell : ''} ${hasError && !isBlack ? styles.error : ''} ${hasError && isBlack ? styles.blackError : ''}`}
                  onClick={() => handleCellClick(r, c)}
                  onContextMenu={(e) => handleCellRightClick(r, c, e)}
                  disabled={showSolution || isBlack}
                >
                  {isBlack ? (
                    <span className={styles.number}>{cell}</span>
                  ) : (
                    triangleType && <Triangle type={triangleType} hasError={hasError} />
                  )}
                </button>
              );
            })
          )}
        </div>

        {gameState === 'won' && (
          <div className={styles.winMessage}>
            <div className={styles.winEmoji}>🔺</div>
            <h3>Puzzle Solved!</h3>
            <p>All rectangles perfectly formed!</p>
          </div>
        )}

        {gameState === 'gaveUp' && (
          <div className={styles.gaveUpMessage}>
            <div className={styles.gaveUpEmoji}>💡</div>
            <h3>Solution Revealed</h3>
            <p>Try a new puzzle!</p>
          </div>
        )}

        <div className={styles.controls}>
          <label className={styles.toggle}>
            <input type="checkbox" checked={showErrors} onChange={(e) => setShowErrors(e.target.checked)} />
            <span className={styles.toggleSlider}></span>
            Show errors
          </label>
        </div>

        <div className={styles.buttons}>
          <button className={styles.resetBtn} onClick={() => { setPlayerGrid(Array(size).fill(null).map(() => Array(size).fill(null))); setGameState('playing'); setShowSolution(false); }}>
            Reset
          </button>
          {gameState === 'playing' && (
            <button className={styles.giveUpBtn} onClick={() => { setShowSolution(true); setGameState('gaveUp'); }}>
              Give Up
            </button>
          )}
          <button className={styles.newGameBtn} onClick={initGame}>New Puzzle</button>
        </div>

        <div className={styles.legend}>
          <div className={styles.legendItem}>
            <div className={styles.legendTriangle}><Triangle type="ul" /></div>
            <div className={styles.legendTriangle}><Triangle type="ur" /></div>
            <div className={styles.legendTriangle}><Triangle type="ll" /></div>
            <div className={styles.legendTriangle}><Triangle type="lr" /></div>
            <span>Click to cycle</span>
          </div>
        </div>
      </div>
    </div>
  );
}
