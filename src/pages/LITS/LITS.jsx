import { useState, useEffect, useCallback, useRef } from 'react';
import GameHeader from '../../components/GameHeader';
import DifficultySelector from '../../components/DifficultySelector';
import GiveUpButton from '../../components/GiveUpButton';
import GameResult from '../../components/GameResult';
import { createGrid, cellKey, getNeighbors, has2x2Block, isFullyConnected, countCells } from '../../utils/generatorUtils';
import styles from './LITS.module.css';

// Dataset-based difficulty mapping
const DIFFICULTY_SIZES = {
  'easy': { minSize: 0, maxSize: 8 },
  'medium': { minSize: 9, maxSize: 12 },
  'hard': { minSize: 13, maxSize: 100 },
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

// Normalize a list of cells to an origin-based shape key for comparison
function normalizeShapeKey(cells) {
  if (!cells || cells.length === 0) return null;

  const minR = Math.min(...cells.map(([r]) => r));
  const minC = Math.min(...cells.map(([, c]) => c));
  const normalized = cells
    .map(([r, c]) => [r - minR, c - minC])
    .sort((a, b) => a[0] - b[0] || a[1] - b[1]);

  return normalized.map(([r, c]) => `${r},${c}`).join('|');
}

// Generate random regions
function generateRegions(size) {
  const regions = createGrid(size, size, -1);
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
        for (const [nr, nc] of getNeighbors(cr, cc, size)) {
          if (regions[nr][nc] === -1 && !cells.some(([r,c]) => r === nr && c === nc)) {
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
  // Use shared utility - check if all truthy cells are connected
  return isFullyConnected(shaded, v => v === true);
}

// Check for 2x2 shaded squares
function has2x2Shaded(shaded, size) {
  // Use shared utility
  return has2x2Block(shaded, true);
}

// Check if same-shape tetrominoes touch
function sameShapesTouch(shaded, regions, regionCells, size) {
  // Map each region to its identified shape name and normalized geometry
  const regionShapes = {};
  for (const [rid, cells] of Object.entries(regionCells)) {
    const shadedCells = cells.filter(([r, c]) => shaded[r]?.[c]);
    if (shadedCells.length === 0) continue;

    const shapeName = shadedCells.length === 4 ? getTetrominoShape(shadedCells) : null;
    const shapeKey = normalizeShapeKey(shadedCells);

    regionShapes[rid] = { shapeName, shapeKey };
  }

  // Check adjacency
  for (const [rid1, shape1] of Object.entries(regionShapes)) {
    for (const [r, c] of regionCells[rid1]) {
      if (!shaded[r]?.[c]) continue;
      for (const [nr, nc] of getNeighbors(r, c, size)) {
        const rid2 = regions[nr]?.[nc];
        if (rid2 !== parseInt(rid1) && shaded[nr]?.[nc] && regionShapes[rid2]) {
          const shape2 = regionShapes[rid2];
          const sameNamedShape = shape1.shapeName && shape2.shapeName && shape1.shapeName === shape2.shapeName;
          const sameGeometry = shape1.shapeKey && shape2.shapeKey && shape1.shapeKey === shape2.shapeKey;
          if (sameNamedShape || (!sameNamedShape && sameGeometry)) {
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
  const maxAttempts = 200; // Generous attempts before fallback

  while (attempts < maxAttempts) {
    attempts++;
    const { regions, regionCells } = generateRegions(size);

    // Try to find a valid solution
    const solution = createGrid(size, size, false);

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
  const cellSet = new Set(cells.map(([r, c]) => cellKey(r, c)));

  while (queue.length > 0) {
    const [r, c] = queue.shift();
    const key = cellKey(r, c);
    if (visited.has(key)) continue;
    visited.add(key);

    // Check orthogonal neighbors within the cell set
    for (const [nr, nc] of [[r-1,c], [r+1,c], [r,c-1], [r,c+1]]) {
      const nkey = cellKey(nr, nc);
      if (cellSet.has(nkey) && !visited.has(nkey)) {
        queue.push([nr, nc]);
      }
    }
  }

  return visited.size === cells.length;
}

// Convert dataset puzzle to game format
function datasetPuzzleToGameFormat(puzzle) {
  const { rows, cols, regions: regionData, solution: solutionData } = puzzle;
  const size = rows;

  // Convert regions from dataset format (may have nulls for blocked cells)
  const regions = regionData.map(row => row.map(cell => cell ?? -1));

  // Convert solution from ['L', 'I', 'T', 'S', '-', null] to boolean
  const solution = solutionData.map(row =>
    row.map(cell => cell !== '-' && cell !== null)
  );

  // Build regionCells mapping
  const regionCells = {};
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const rid = regions[r][c];
      if (rid === -1 || rid === null) continue;
      if (!regionCells[rid]) regionCells[rid] = [];
      regionCells[rid].push([r, c]);
    }
  }

  return { regions, regionCells, solution, size };
}

function checkValidity(shaded, regions, regionCells, size) {
  const errors = new Set();
  const violations = new Set(); // Track which rules are violated

  // Safety check for shaded array
  if (!shaded || shaded.length !== size) return { errors, violations };

  // Check 2x2 shaded squares
  for (let r = 0; r < size - 1; r++) {
    for (let c = 0; c < size - 1; c++) {
      if (shaded[r]?.[c] && shaded[r+1]?.[c] && shaded[r]?.[c+1] && shaded[r+1]?.[c+1]) {
        errors.add(cellKey(r, c));
        errors.add(cellKey(r+1, c));
        errors.add(cellKey(r, c+1));
        errors.add(cellKey(r+1, c+1));
        violations.add('no2x2');
      }
    }
  }

  // Check each region
  for (const [rid, cells] of Object.entries(regionCells)) {
    const shadedCells = cells.filter(([r, c]) => shaded[r]?.[c]);

    if (shadedCells.length > 4) {
      // Too many shaded in region
      for (const [r, c] of shadedCells) {
        errors.add(cellKey(r, c));
      }
      violations.add('onePerRegion');
    } else if (shadedCells.length === 4) {
      // Check if connected
      if (!isConnected(shadedCells)) {
        for (const [r, c] of shadedCells) {
          errors.add(cellKey(r, c));
        }
        violations.add('onePerRegion');
      } else {
        const shape = getTetrominoShape(shadedCells);
        if (!shape) {
          for (const [r, c] of shadedCells) {
            errors.add(cellKey(r, c));
          }
          violations.add('onePerRegion');
        }
      }
    }
  }

  // Check if same shapes touch
  if (sameShapesTouch(shaded, regions, regionCells, size)) {
    violations.add('noSameTouch');
  }

  // Check global connectivity (only if we have some shaded cells)
  const totalShaded = countCells(shaded, v => v === true);
  if (totalShaded > 0 && !areShadedConnected(shaded, size)) {
    violations.add('allConnected');
  }

  return { errors, violations };
}

function checkSolved(shaded, regions, regionCells, size) {
  // Safety check for shaded array
  if (!shaded || shaded.length !== size) return false;

  // Each region must have exactly 4 shaded cells forming a valid tetromino
  const regionShapes = {};

  for (const [rid, cells] of Object.entries(regionCells)) {
    const shadedCells = cells.filter(([r, c]) => shaded[r]?.[c]);
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

// Export helpers for testing
export {
  DIFFICULTY_SIZES,
  TETROMINOES,
  generateRegions,
  getTetrominoShape,
  areShadedConnected,
  has2x2Shaded,
  sameShapesTouch,
  datasetPuzzleToGameFormat,
  checkValidity,
  checkSolved,
};

export default function LITS() {
  const [difficulty, setDifficulty] = useState('easy');
  const [puzzleData, setPuzzleData] = useState(null);
  const [shaded, setShaded] = useState([]);
  const [gameState, setGameState] = useState('playing');
  const [errors, setErrors] = useState(new Set());
  const [violations, setViolations] = useState(new Set());
  const [showErrors, setShowErrors] = useState(true);
  const [showSolution, setShowSolution] = useState(false);
  const [loading, setLoading] = useState(true);
  const datasetRef = useRef(null);

  const size = puzzleData?.size || 6;

  // Load dataset on mount
  useEffect(() => {
    fetch('/datasets/litsPuzzles.json')
      .then(res => res.json())
      .then(data => {
        datasetRef.current = data.puzzles;
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load LITS dataset:', err);
        setLoading(false);
      });
  }, []);

  const initGame = useCallback(() => {
    if (!datasetRef.current || datasetRef.current.length === 0) return;

    // Filter puzzles by difficulty
    const { minSize, maxSize } = DIFFICULTY_SIZES[difficulty];
    const filtered = datasetRef.current.filter(p =>
      p.rows >= minSize && p.rows <= maxSize && p.cols >= minSize && p.cols <= maxSize
    );

    if (filtered.length === 0) {
      // Fallback to any puzzle if no matches
      const puzzle = datasetRef.current[Math.floor(Math.random() * datasetRef.current.length)];
      const data = datasetPuzzleToGameFormat(puzzle);
      setPuzzleData(data);
      setShaded(createGrid(data.size, data.size, false));
    } else {
      const puzzle = filtered[Math.floor(Math.random() * filtered.length)];
      const data = datasetPuzzleToGameFormat(puzzle);
    setPuzzleData(data);
      setShaded(createGrid(data.size, data.size, false));
    }

    setGameState('playing');
    setErrors(new Set());
    setViolations(new Set());
    setShowSolution(false);
  }, [difficulty]);

  useEffect(() => {
    if (!loading && datasetRef.current) {
    initGame();
    }
  }, [loading, initGame]);

  useEffect(() => {
    if (!puzzleData || gameState !== 'playing') return;

    if (showErrors) {
      const result = checkValidity(shaded, puzzleData.regions, puzzleData.regionCells, size);
      setErrors(result.errors);
      setViolations(result.violations);
    } else {
      setErrors(new Set());
      setViolations(new Set());
    }

    if (checkSolved(shaded, puzzleData.regions, puzzleData.regionCells, size)) {
      setGameState('won');
    }
  }, [shaded, puzzleData, showErrors, size, gameState]);

  const handleCellClick = (r, c) => {
    if (gameState !== 'playing' || showSolution) return;

    setShaded(prev => {
      const newShaded = prev.map(row => [...row]);
      newShaded[r][c] = !newShaded[r][c];
      return newShaded;
    });
  };

  const handleReset = () => {
    if (!puzzleData) return;
    setShaded(createGrid(puzzleData.size, puzzleData.size, false));
    setGameState('playing');
    setShowSolution(false);
  };

  const handleGiveUp = () => {
    setShowSolution(true);
    setGameState('gaveUp');
  };

  // Loading state
  if (loading) {
    return (
      <div className={styles.container}>
        <GameHeader title="LITS" />
        <div className={styles.loading}>Loading puzzles...</div>
      </div>
    );
  }

  // Ensure shaded array matches puzzle size
  if (!puzzleData) return null;
  if (shaded.length !== size || (shaded[0] && shaded[0].length !== size)) return null;

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
        <div className={styles.instructions}>
          <p><strong>Click cells to shade them.</strong> In each colored region, shade exactly 4 cells that form one of the tetromino shapes below. A tetromino is a shape made of 4 squares connected by their edges — like Tetris pieces!</p>

          <div className={styles.shapesDiagram}>
            <div className={styles.shapeBox}>
              <div className={styles.shapeGrid} data-shape="L">
                <span></span><span className={styles.filled}></span>
                <span></span><span className={styles.filled}></span>
                <span className={styles.filled}></span><span className={styles.filled}></span>
              </div>
              <span className={styles.shapeLabel}>L</span>
            </div>
            <div className={styles.shapeBox}>
              <div className={styles.shapeGrid} data-shape="I">
                <span className={styles.filled}></span>
                <span className={styles.filled}></span>
                <span className={styles.filled}></span>
                <span className={styles.filled}></span>
              </div>
              <span className={styles.shapeLabel}>I</span>
            </div>
            <div className={styles.shapeBox}>
              <div className={styles.shapeGrid} data-shape="T">
                <span className={styles.filled}></span><span className={styles.filled}></span><span className={styles.filled}></span>
                <span></span><span className={styles.filled}></span><span></span>
              </div>
              <span className={styles.shapeLabel}>T</span>
            </div>
            <div className={styles.shapeBox}>
              <div className={styles.shapeGrid} data-shape="S">
                <span></span><span className={styles.filled}></span><span className={styles.filled}></span>
                <span className={styles.filled}></span><span className={styles.filled}></span><span></span>
              </div>
              <span className={styles.shapeLabel}>S</span>
            </div>
          </div>

          <ul className={styles.rulesList}>
            <li className={violations.has('onePerRegion') ? styles.ruleViolated : ''}>
              Each region must contain exactly one L, I, T, or S shape
            </li>
            <li className={violations.has('allConnected') ? styles.ruleViolated : ''}>
              All shaded cells across the grid must connect (share edges)
            </li>
            <li className={violations.has('no2x2') ? styles.ruleViolated : ''}>
              No 2×2 block of shaded cells is allowed anywhere
            </li>
            <li className={violations.has('noSameTouch') ? styles.ruleViolated : ''}>
              Two tetrominoes of the same shape cannot touch each other
            </li>
          </ul>
        </div>
      </div>

      <DifficultySelector
        options={['easy', 'medium', 'hard']}
        value={difficulty}
        onChange={setDifficulty}
        className={styles.sizeSelector}
      />

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
              const isShaded = showSolution
                ? (puzzleData.solution[r]?.[c] ?? false)
                : (shaded[r]?.[c] ?? false);
              const hasError = !showSolution && errors.has(cellKey(r, c));

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
          <GameResult
            state="won"
            title="🧩 Puzzle Solved!"
            message="All tetrominoes placed correctly!"
            actions={[{ label: 'New Puzzle', onClick: initGame, primary: true }]}
          />
        )}

        {gameState === 'gaveUp' && (
          <GameResult
            state="gaveup"
            title="💡 Solution Revealed"
            message="Try a new puzzle!"
            actions={[{ label: 'New Puzzle', onClick: initGame, primary: true }]}
          />
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
          <GiveUpButton
            onGiveUp={handleGiveUp}
            disabled={gameState !== 'playing'}
          />
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
