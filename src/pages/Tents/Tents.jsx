import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import styles from './Tents.module.css';

const GRID_SIZES = {
  '6×6': 6,
  '8×8': 8,
  '10×10': 10,
};

// Solver to verify puzzle has unique solution
function solvePuzzle(grid, rowClues, colClues, maxSolutions = 2) {
  const size = grid.length;
  const solutions = [];

  // Find all possible tent positions (adjacent to trees, not on trees)
  const possibleTentPositions = [];
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (grid[r][c] !== 'tree') {
        // Check if adjacent to at least one tree
        const neighbors = [[r-1,c], [r+1,c], [r,c-1], [r,c+1]];
        for (const [nr, nc] of neighbors) {
          if (nr >= 0 && nr < size && nc >= 0 && nc < size && grid[nr][nc] === 'tree') {
            possibleTentPositions.push([r, c]);
            break;
          }
        }
      }
    }
  }

  // Get tree positions
  const trees = [];
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (grid[r][c] === 'tree') trees.push([r, c]);
    }
  }

  const numTents = trees.length;
  const tents = Array(size).fill(null).map(() => Array(size).fill(false));

  function canPlaceTent(r, c) {
    // Check row count
    let rowCount = 0;
    for (let cc = 0; cc < size; cc++) if (tents[r][cc]) rowCount++;
    if (rowCount >= rowClues[r]) return false;

    // Check col count
    let colCount = 0;
    for (let rr = 0; rr < size; rr++) if (tents[rr][c]) colCount++;
    if (colCount >= colClues[c]) return false;

    // Check no adjacent tents (including diagonal)
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        const nr = r + dr, nc = c + dc;
        if (nr >= 0 && nr < size && nc >= 0 && nc < size && tents[nr][nc]) {
          return false;
        }
      }
    }

    return true;
  }

  function countTents() {
    let count = 0;
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (tents[r][c]) count++;
      }
    }
    return count;
  }

  function isValidAssignment() {
    // Check each tree has exactly one adjacent tent
    for (const [tr, tc] of trees) {
      let adjTents = 0;
      const neighbors = [[tr-1,tc], [tr+1,tc], [tr,tc-1], [tr,tc+1]];
      for (const [nr, nc] of neighbors) {
        if (nr >= 0 && nr < size && nc >= 0 && nc < size && tents[nr][nc]) {
          adjTents++;
        }
      }
      if (adjTents !== 1) return false;
    }

    // Check row and column counts match exactly
    for (let r = 0; r < size; r++) {
      let count = 0;
      for (let c = 0; c < size; c++) if (tents[r][c]) count++;
      if (count !== rowClues[r]) return false;
    }
    for (let c = 0; c < size; c++) {
      let count = 0;
      for (let r = 0; r < size; r++) if (tents[r][c]) count++;
      if (count !== colClues[c]) return false;
    }

    return true;
  }

  function solve(idx) {
    if (solutions.length >= maxSolutions) return;

    if (countTents() === numTents) {
      if (isValidAssignment()) {
        solutions.push(tents.map(row => [...row]));
      }
      return;
    }

    if (idx >= possibleTentPositions.length) return;

    const [r, c] = possibleTentPositions[idx];

    // Try not placing a tent here
    solve(idx + 1);

    // Try placing a tent here
    if (canPlaceTent(r, c)) {
      tents[r][c] = true;
      solve(idx + 1);
      tents[r][c] = false;
    }
  }

  solve(0);
  return solutions;
}

function generateValidSolution(size) {
  const grid = Array(size).fill(null).map(() => Array(size).fill(null));
  const solution = Array(size).fill(null).map(() => Array(size).fill(null));

  // Target number of tree-tent pairs based on size
  const targetPairs = Math.floor(size * size * 0.18);

  // Shuffle all positions for random placement
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

  let placed = 0;

  for (const [r, c] of positions) {
    if (placed >= targetPairs) break;
    if (grid[r][c] !== null) continue;

    // Get orthogonal neighbors for potential tent positions
    const neighbors = [
      [r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]
    ].filter(([nr, nc]) =>
      nr >= 0 && nr < size && nc >= 0 && nc < size && grid[nr][nc] === null
    );

    if (neighbors.length === 0) continue;

    // Shuffle neighbors to randomize tent position
    for (let i = neighbors.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [neighbors[i], neighbors[j]] = [neighbors[j], neighbors[i]];
    }

    // Find a valid spot for tent (no adjacent tents)
    let tentPlaced = false;
    for (const [tr, tc] of neighbors) {
      let valid = true;

      // Check all 8 neighbors for existing tents
      for (let dr = -1; dr <= 1 && valid; dr++) {
        for (let dc = -1; dc <= 1 && valid; dc++) {
          if (dr === 0 && dc === 0) continue;
          const nr = tr + dr, nc = tc + dc;
          if (nr >= 0 && nr < size && nc >= 0 && nc < size) {
            if (solution[nr][nc] === 'tent') valid = false;
          }
        }
      }

      if (valid) {
        grid[r][c] = 'tree';
        solution[r][c] = 'tree';
        solution[tr][tc] = 'tent';
        grid[tr][tc] = 'reserved'; // Reserve space but don't show as tree
        placed++;
        tentPlaced = true;
        break;
      }
    }
  }

  // Clear reserved markers
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (grid[r][c] === 'reserved') grid[r][c] = null;
    }
  }

  // Calculate clues
  const rowClues = Array(size).fill(0);
  const colClues = Array(size).fill(0);
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (solution[r][c] === 'tent') {
        rowClues[r]++;
        colClues[c]++;
      }
    }
  }

  return { grid, solution, rowClues, colClues, numTrees: placed };
}

function generatePuzzle(size) {
  // Try to generate a puzzle with a unique solution
  const maxAttempts = 50;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const { grid, solution, rowClues, colClues, numTrees } = generateValidSolution(size);

    // Skip if too few trees were placed
    if (numTrees < Math.floor(size * size * 0.1)) continue;

    // Check if puzzle has exactly one solution
    const solutions = solvePuzzle(grid, rowClues, colClues, 2);

    if (solutions.length === 1) {
      // Verify our stored solution matches the found solution
      const foundSolution = solutions[0];
      let matches = true;
      for (let r = 0; r < size && matches; r++) {
        for (let c = 0; c < size && matches; c++) {
          const shouldHaveTent = solution[r][c] === 'tent';
          if (foundSolution[r][c] !== shouldHaveTent) matches = false;
        }
      }

      if (matches) {
        return { grid, solution, rowClues, colClues };
      }
    }
  }

  // Fallback: return a puzzle even if uniqueness couldn't be verified
  // This can happen rarely with complex configurations
  const { grid, solution, rowClues, colClues } = generateValidSolution(size);
  return { grid, solution, rowClues, colClues };
}

function checkValidity(grid, playerTents, rowClues, colClues) {
  const size = grid.length;
  const errors = new Set();

  // Check row counts
  for (let r = 0; r < size; r++) {
    let count = 0;
    for (let c = 0; c < size; c++) {
      if (playerTents[r][c]) count++;
    }
    if (count > rowClues[r]) {
      for (let c = 0; c < size; c++) {
        if (playerTents[r][c]) errors.add(`${r},${c}`);
      }
    }
  }

  // Check column counts
  for (let c = 0; c < size; c++) {
    let count = 0;
    for (let r = 0; r < size; r++) {
      if (playerTents[r][c]) count++;
    }
    if (count > colClues[c]) {
      for (let r = 0; r < size; r++) {
        if (playerTents[r][c]) errors.add(`${r},${c}`);
      }
    }
  }

  // Check no adjacent tents (including diagonal)
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (!playerTents[r][c]) continue;

      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue;
          const nr = r + dr, nc = c + dc;
          if (nr >= 0 && nr < size && nc >= 0 && nc < size && playerTents[nr][nc]) {
            errors.add(`${r},${c}`);
            errors.add(`${nr},${nc}`);
          }
        }
      }
    }
  }

  // Check tents are adjacent to trees
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (!playerTents[r][c]) continue;

      let hasAdjacentTree = false;
      const neighbors = [[r-1,c], [r+1,c], [r,c-1], [r,c+1]];
      for (const [nr, nc] of neighbors) {
        if (nr >= 0 && nr < size && nc >= 0 && nc < size && grid[nr][nc] === 'tree') {
          hasAdjacentTree = true;
          break;
        }
      }

      if (!hasAdjacentTree) {
        errors.add(`${r},${c}`);
      }
    }
  }

  return errors;
}

function checkSolved(grid, playerTents, solution, rowClues, colClues) {
  const size = grid.length;
  const errors = checkValidity(grid, playerTents, rowClues, colClues);
  if (errors.size > 0) return false;

  // Check all tents are placed correctly
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const shouldHaveTent = solution[r][c] === 'tent';
      if (playerTents[r][c] !== shouldHaveTent) return false;
    }
  }

  return true;
}

export default function Tents() {
  const [sizeKey, setSizeKey] = useState('6×6');
  const [puzzleData, setPuzzleData] = useState(null);
  const [playerTents, setPlayerTents] = useState([]);
  const [grass, setGrass] = useState([]);
  const [gameState, setGameState] = useState('playing');
  const [errors, setErrors] = useState(new Set());
  const [showErrors, setShowErrors] = useState(true);

  const size = GRID_SIZES[sizeKey];

  const initGame = useCallback(() => {
    const data = generatePuzzle(size);
    setPuzzleData(data);
    setPlayerTents(Array(size).fill(null).map(() => Array(size).fill(false)));
    setGrass(Array(size).fill(null).map(() => Array(size).fill(false)));
    setGameState('playing');
    setErrors(new Set());
  }, [size]);

  useEffect(() => {
    initGame();
  }, [initGame]);

  useEffect(() => {
    if (!puzzleData) return;

    const newErrors = showErrors ? checkValidity(puzzleData.grid, playerTents, puzzleData.rowClues, puzzleData.colClues) : new Set();
    setErrors(newErrors);

    if (checkSolved(puzzleData.grid, playerTents, puzzleData.solution, puzzleData.rowClues, puzzleData.colClues)) {
      setGameState('won');
    }
  }, [playerTents, puzzleData, showErrors]);

  const handleCellClick = (r, c, e) => {
    if (gameState !== 'playing') return;
    if (puzzleData.grid[r][c] === 'tree') return;

    if (e.type === 'contextmenu' || e.ctrlKey) {
      e.preventDefault();
      // Toggle grass
      setGrass(prev => {
        const newGrass = prev.map(row => [...row]);
        newGrass[r][c] = !newGrass[r][c];
        if (newGrass[r][c]) {
          setPlayerTents(p => {
            const n = p.map(row => [...row]);
            n[r][c] = false;
            return n;
          });
        }
        return newGrass;
      });
    } else {
      // Toggle tent
      setPlayerTents(prev => {
        const newTents = prev.map(row => [...row]);
        newTents[r][c] = !newTents[r][c];
        if (newTents[r][c]) {
          setGrass(g => {
            const n = g.map(row => [...row]);
            n[r][c] = false;
            return n;
          });
        }
        return newTents;
      });
    }
  };

  const handleReset = () => {
    setPlayerTents(Array(size).fill(null).map(() => Array(size).fill(false)));
    setGrass(Array(size).fill(null).map(() => Array(size).fill(false)));
    setGameState('playing');
  };

  if (!puzzleData) return null;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Link to="/" className={styles.backLink}>← Back to Games</Link>
        <h1 className={styles.title}>Tents</h1>
        <p className={styles.instructions}>
          Place tents next to trees. Each tree has exactly one tent adjacent (not diagonal).
          Tents can't touch each other, even diagonally. Numbers show tents per row/column.
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
          {/* Column clues */}
          <div className={styles.colClues} style={{ gridTemplateColumns: `repeat(${size}, 1fr)` }}>
            {puzzleData.colClues.map((clue, c) => (
              <div key={c} className={styles.clue}>{clue}</div>
            ))}
          </div>

          <div className={styles.mainGrid}>
            {/* Row clues */}
            <div className={styles.rowClues}>
              {puzzleData.rowClues.map((clue, r) => (
                <div key={r} className={styles.clue}>{clue}</div>
              ))}
            </div>

            {/* Grid */}
            <div
              className={styles.grid}
              style={{
                gridTemplateColumns: `repeat(${size}, 1fr)`,
              }}
            >
              {puzzleData.grid.map((row, r) =>
                row.map((cell, c) => {
                  const hasTent = playerTents[r][c];
                  const hasGrass = grass[r][c];
                  const hasError = errors.has(`${r},${c}`);
                  const isTree = cell === 'tree';

                  return (
                    <button
                      key={`${r}-${c}`}
                      className={`
                        ${styles.cell}
                        ${isTree ? styles.tree : ''}
                        ${hasTent ? styles.tent : ''}
                        ${hasGrass ? styles.grass : ''}
                        ${hasError ? styles.error : ''}
                      `}
                      onClick={(e) => handleCellClick(r, c, e)}
                      onContextMenu={(e) => handleCellClick(r, c, e)}
                      disabled={isTree}
                    >
                      {isTree && '🌲'}
                      {hasTent && '⛺'}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {gameState === 'won' && (
          <div className={styles.winMessage}>
            <div className={styles.winEmoji}>🏕️</div>
            <h3>Puzzle Solved!</h3>
            <p>All tents perfectly placed!</p>
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
          <span>Click: Place tent</span>
          <span>Right-click: Mark grass</span>
        </div>
      </div>
    </div>
  );
}
