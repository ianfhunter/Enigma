import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import styles from './LITS.module.css';

const GRID_SIZES = {
  '6×6': 6,
  '8×8': 8,
  '10×10': 10,
};

// Tetromino shapes: L, I, T, S (and their rotations)
const TETROMINOES = {
  L: [
    [[0,0], [1,0], [2,0], [2,1]],
    [[0,0], [0,1], [0,2], [1,0]],
    [[0,0], [0,1], [1,1], [2,1]],
    [[0,2], [1,0], [1,1], [1,2]],
  ],
  I: [
    [[0,0], [1,0], [2,0], [3,0]],
    [[0,0], [0,1], [0,2], [0,3]],
  ],
  T: [
    [[0,0], [0,1], [0,2], [1,1]],
    [[0,0], [1,0], [2,0], [1,1]],
    [[0,1], [1,0], [1,1], [1,2]],
    [[0,1], [1,0], [1,1], [2,1]],
  ],
  S: [
    [[0,1], [0,2], [1,0], [1,1]],
    [[0,0], [1,0], [1,1], [2,1]],
    [[0,1], [0,2], [1,0], [1,1]],
    [[0,0], [1,0], [1,1], [2,1]],
  ],
};

// Generate random regions
function generateRegions(size) {
  const regions = Array(size).fill(null).map(() => Array(size).fill(-1));
  let regionId = 0;
  const regionCells = {};

  // Fill grid with regions of size 4-6
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

    const targetSize = 4 + Math.floor(Math.random() * 3); // 4-6 cells per region
    const cells = [[startR, startC]];
    regions[startR][startC] = regionId;

    // Grow the region
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

// Check if shaded cells form a valid tetromino shape
function getTetrominoShape(cells) {
  if (cells.length !== 4) return null;

  // Normalize to origin
  const minR = Math.min(...cells.map(([r]) => r));
  const minC = Math.min(...cells.map(([, c]) => c));
  const normalized = cells.map(([r, c]) => [r - minR, c - minC]);
  normalized.sort((a, b) => a[0] - b[0] || a[1] - b[1]);

  // Check against all tetromino shapes
  for (const [shape, rotations] of Object.entries(TETROMINOES)) {
    for (const rotation of rotations) {
      const sorted = [...rotation].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
      if (normalized.length === sorted.length &&
          normalized.every((cell, i) => cell[0] === sorted[i][0] && cell[1] === sorted[i][1])) {
        return shape;
      }
    }
  }
  return null;
}

// Check if all shaded cells are connected
function areShadedConnected(shaded, size) {
  let first = null;
  for (let r = 0; r < size && !first; r++) {
    for (let c = 0; c < size && !first; c++) {
      if (shaded[r][c]) first = [r, c];
    }
  }

  if (!first) return true;

  const visited = new Set();
  const queue = [first];
  let count = 0;

  while (queue.length > 0) {
    const [r, c] = queue.shift();
    const key = `${r},${c}`;
    if (visited.has(key) || !shaded[r][c]) continue;
    visited.add(key);
    count++;

    for (const [nr, nc] of [[r-1,c], [r+1,c], [r,c-1], [r,c+1]]) {
      if (nr >= 0 && nr < size && nc >= 0 && nc < size && !visited.has(`${nr},${nc}`)) {
        queue.push([nr, nc]);
      }
    }
  }

  let total = 0;
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (shaded[r][c]) total++;
    }
  }

  return count === total;
}

// Check for 2x2 shaded squares
function has2x2Shaded(shaded, size) {
  for (let r = 0; r < size - 1; r++) {
    for (let c = 0; c < size - 1; c++) {
      if (shaded[r][c] && shaded[r+1][c] && shaded[r][c+1] && shaded[r+1][c+1]) {
        return true;
      }
    }
  }
  return false;
}

// Check if same-shape tetrominoes touch
function sameShapesTouch(shaded, regions, regionCells, size) {
  // Get shape for each region
  const regionShapes = {};
  for (const [rid, cells] of Object.entries(regionCells)) {
    const shadedCells = cells.filter(([r, c]) => shaded[r][c]);
    if (shadedCells.length === 4) {
      regionShapes[rid] = getTetrominoShape(shadedCells);
    }
  }

  // Check adjacency
  for (const [rid1, shape1] of Object.entries(regionShapes)) {
    if (!shape1) continue;
    for (const [r, c] of regionCells[rid1]) {
      if (!shaded[r][c]) continue;
      for (const [nr, nc] of [[r-1,c], [r+1,c], [r,c-1], [r,c+1]]) {
        if (nr >= 0 && nr < size && nc >= 0 && nc < size) {
          const rid2 = regions[nr][nc];
          if (rid2 !== parseInt(rid1) && shaded[nr][nc] && regionShapes[rid2] === shape1) {
            return true;
          }
        }
      }
    }
  }
  return false;
}

function generatePuzzle(size) {
  let attempts = 0;
  const maxAttempts = 50;

  while (attempts < maxAttempts) {
    attempts++;
    const { regions, regionCells } = generateRegions(size);
    
    // Try to find a valid solution
    const solution = Array(size).fill(null).map(() => Array(size).fill(false));
    
    // For each region, try to place a tetromino
    let valid = true;
    const usedShapes = {};

    for (const [rid, cells] of Object.entries(regionCells)) {
      if (cells.length < 4) {
        valid = false;
        break;
      }

      // Try all combinations of 4 cells from this region
      let found = false;
      const combos = getCombinations(cells, 4);
      
      // Shuffle combos
      for (let i = combos.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [combos[i], combos[j]] = [combos[j], combos[i]];
      }

      for (const combo of combos) {
        // Check if it forms a connected tetromino
        if (!isConnected(combo)) continue;
        
        const shape = getTetrominoShape(combo);
        if (!shape) continue;

        // Temporarily place the tetromino
        for (const [r, c] of combo) {
          solution[r][c] = true;
        }

        // Check constraints
        if (!has2x2Shaded(solution, size)) {
          usedShapes[rid] = shape;
          found = true;
          break;
        }

        // Undo
        for (const [r, c] of combo) {
          solution[r][c] = false;
        }
      }

      if (!found) {
        valid = false;
        break;
      }
    }

    if (valid && areShadedConnected(solution, size) && !sameShapesTouch(solution, regions, regionCells, size)) {
      return { regions, regionCells, solution };
    }
  }

  // Fallback: return a simpler puzzle
  return generateSimplePuzzle(size);
}

function getCombinations(arr, k) {
  if (k === 0) return [[]];
  if (arr.length === 0) return [];
  
  const [first, ...rest] = arr;
  const withFirst = getCombinations(rest, k - 1).map(combo => [first, ...combo]);
  const withoutFirst = getCombinations(rest, k);
  return [...withFirst, ...withoutFirst];
}

function isConnected(cells) {
  if (cells.length === 0) return true;
  
  const visited = new Set();
  const queue = [cells[0]];
  const cellSet = new Set(cells.map(([r, c]) => `${r},${c}`));

  while (queue.length > 0) {
    const [r, c] = queue.shift();
    const key = `${r},${c}`;
    if (visited.has(key)) continue;
    visited.add(key);

    for (const [nr, nc] of [[r-1,c], [r+1,c], [r,c-1], [r,c+1]]) {
      const nkey = `${nr},${nc}`;
      if (cellSet.has(nkey) && !visited.has(nkey)) {
        queue.push([nr, nc]);
      }
    }
  }

  return visited.size === cells.length;
}

function generateSimplePuzzle(size) {
  // Create a 4-column region layout
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

  const solution = Array(size).fill(null).map(() => Array(size).fill(false));
  
  return { regions, regionCells, solution };
}

function checkValidity(shaded, regions, regionCells, size) {
  const errors = new Set();

  // Check 2x2 shaded squares
  for (let r = 0; r < size - 1; r++) {
    for (let c = 0; c < size - 1; c++) {
      if (shaded[r][c] && shaded[r+1][c] && shaded[r][c+1] && shaded[r+1][c+1]) {
        errors.add(`${r},${c}`);
        errors.add(`${r+1},${c}`);
        errors.add(`${r},${c+1}`);
        errors.add(`${r+1},${c+1}`);
      }
    }
  }

  // Check each region
  for (const [rid, cells] of Object.entries(regionCells)) {
    const shadedCells = cells.filter(([r, c]) => shaded[r][c]);
    
    if (shadedCells.length > 4) {
      // Too many shaded in region
      for (const [r, c] of shadedCells) {
        errors.add(`${r},${c}`);
      }
    } else if (shadedCells.length === 4) {
      // Check if connected
      if (!isConnected(shadedCells)) {
        for (const [r, c] of shadedCells) {
          errors.add(`${r},${c}`);
        }
      } else {
        const shape = getTetrominoShape(shadedCells);
        if (!shape) {
          for (const [r, c] of shadedCells) {
            errors.add(`${r},${c}`);
          }
        }
      }
    }
  }

  return errors;
}

function checkSolved(shaded, regions, regionCells, size) {
  // Each region must have exactly 4 shaded cells forming a valid tetromino
  const regionShapes = {};
  
  for (const [rid, cells] of Object.entries(regionCells)) {
    const shadedCells = cells.filter(([r, c]) => shaded[r][c]);
    if (shadedCells.length !== 4) return false;
    if (!isConnected(shadedCells)) return false;
    
    const shape = getTetrominoShape(shadedCells);
    if (!shape) return false;
    regionShapes[rid] = shape;
  }

  // No 2x2 shaded squares
  if (has2x2Shaded(shaded, size)) return false;

  // All shaded cells connected
  if (!areShadedConnected(shaded, size)) return false;

  // Same shapes don't touch
  if (sameShapesTouch(shaded, regions, regionCells, size)) return false;

  return true;
}

export default function LITS() {
  const [sizeKey, setSizeKey] = useState('6×6');
  const [puzzleData, setPuzzleData] = useState(null);
  const [shaded, setShaded] = useState([]);
  const [gameState, setGameState] = useState('playing');
  const [errors, setErrors] = useState(new Set());
  const [showErrors, setShowErrors] = useState(true);
  const [showSolution, setShowSolution] = useState(false);

  const size = GRID_SIZES[sizeKey];

  const initGame = useCallback(() => {
    const data = generatePuzzle(size);
    setPuzzleData(data);
    setShaded(Array(size).fill(null).map(() => Array(size).fill(false)));
    setGameState('playing');
    setErrors(new Set());
    setShowSolution(false);
  }, [size]);

  useEffect(() => {
    initGame();
  }, [initGame]);

  useEffect(() => {
    if (!puzzleData) return;

    const newErrors = showErrors ? checkValidity(shaded, puzzleData.regions, puzzleData.regionCells, size) : new Set();
    setErrors(newErrors);

    if (checkSolved(shaded, puzzleData.regions, puzzleData.regionCells, size)) {
      setGameState('won');
    }
  }, [shaded, puzzleData, showErrors, size]);

  const handleCellClick = (r, c) => {
    if (gameState !== 'playing' || showSolution) return;

    setShaded(prev => {
      const newShaded = prev.map(row => [...row]);
      newShaded[r][c] = !newShaded[r][c];
      return newShaded;
    });
  };

  const handleReset = () => {
    setShaded(Array(size).fill(null).map(() => Array(size).fill(false)));
    setGameState('playing');
    setShowSolution(false);
  };

  const handleGiveUp = () => {
    setShowSolution(true);
    setGameState('gaveUp');
  };

  if (!puzzleData) return null;

  // Generate region colors
  const regionColors = {};
  const colorPalette = [
    'rgba(239, 68, 68, 0.15)', 'rgba(34, 197, 94, 0.15)', 'rgba(59, 130, 246, 0.15)',
    'rgba(168, 85, 247, 0.15)', 'rgba(251, 191, 36, 0.15)', 'rgba(236, 72, 153, 0.15)',
    'rgba(20, 184, 166, 0.15)', 'rgba(249, 115, 22, 0.15)', 'rgba(99, 102, 241, 0.15)',
    'rgba(132, 204, 22, 0.15)', 'rgba(6, 182, 212, 0.15)', 'rgba(244, 114, 182, 0.15)',
  ];

  for (const rid of Object.keys(puzzleData.regionCells)) {
    regionColors[rid] = colorPalette[parseInt(rid) % colorPalette.length];
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Link to="/" className={styles.backLink}>← Back to Games</Link>
        <h1 className={styles.title}>LITS</h1>
        <p className={styles.instructions}>
          Shade exactly 4 cells in each region to form an L, I, T, or S tetromino.
          All shaded cells must be connected, no 2×2 shaded squares allowed,
          and identical shapes cannot touch orthogonally.
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
            width: `${size * 40}px`,
            height: `${size * 40}px`,
          }}
        >
          {puzzleData.regions.map((row, r) =>
            row.map((regionId, c) => {
              const isShaded = showSolution ? puzzleData.solution[r][c] : shaded[r][c];
              const hasError = !showSolution && errors.has(`${r},${c}`);

              // Determine borders for region boundaries
              const borderTop = r === 0 || puzzleData.regions[r-1][c] !== regionId;
              const borderBottom = r === size - 1 || puzzleData.regions[r+1][c] !== regionId;
              const borderLeft = c === 0 || puzzleData.regions[r][c-1] !== regionId;
              const borderRight = c === size - 1 || puzzleData.regions[r][c+1] !== regionId;

              return (
                <button
                  key={`${r}-${c}`}
                  className={`
                    ${styles.cell}
                    ${isShaded ? styles.shaded : ''}
                    ${hasError ? styles.error : ''}
                    ${borderTop ? styles.borderTop : ''}
                    ${borderBottom ? styles.borderBottom : ''}
                    ${borderLeft ? styles.borderLeft : ''}
                    ${borderRight ? styles.borderRight : ''}
                  `}
                  style={{ backgroundColor: isShaded ? undefined : regionColors[regionId] }}
                  onClick={() => handleCellClick(r, c)}
                  disabled={showSolution}
                />
              );
            })
          )}
        </div>

        {gameState === 'won' && (
          <div className={styles.winMessage}>
            <div className={styles.winEmoji}>🧩</div>
            <h3>Puzzle Solved!</h3>
            <p>All tetrominoes placed correctly!</p>
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

        <div className={styles.legend}>
          <div className={styles.legendItem}>
            <span className={styles.legendShape}>L</span>
            <span className={styles.legendShape}>I</span>
            <span className={styles.legendShape}>T</span>
            <span className={styles.legendShape}>S</span>
          </div>
        </div>
      </div>
    </div>
  );
}
