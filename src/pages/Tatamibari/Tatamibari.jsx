import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import GameHeader from '../../components/GameHeader';
import SeedDisplay from '../../components/SeedDisplay';
import SizeSelector from '../../components/SizeSelector';
import GiveUpButton from '../../components/GiveUpButton';
import GameResult from '../../components/GameResult';
import { useGameState } from '../../hooks/useGameState';
import { createSeededRandom, stringToSeed, getTodayDateString } from '../../data/wordUtils';
import styles from './Tatamibari.module.css';

// Tatamibari rules:
// - Divide the grid into rectangular regions
// - Each region contains exactly one clue
// - '+' means the region is a square
// - '-' means width > height (horizontal)
// - '|' means height > width (vertical)
// - No four regions can meet at a single point (tatami rule)

const GRID_SIZES = {
  '8×8': 8,
  '10×10': 10,
  '12×12': 12,
  '14×14': 14,
};

// Clue symbols
const CLUES = {
  SQUARE: '+',
  HORIZONTAL: '−',
  VERTICAL: '|',
};

// Load dataset
let datasetCache = null;
let loadingPromise = null;

async function loadDataset() {
  if (datasetCache) return datasetCache;
  if (loadingPromise) return loadingPromise;

  loadingPromise = fetch('/datasets/tatamibariPuzzles.json')
    .then(res => {
      if (!res.ok) throw new Error(`Failed to load Tatamibari puzzles: ${res.status}`);
      return res.json();
    })
    .then(data => {
      datasetCache = data.puzzles || [];
      return datasetCache;
    })
    .catch(err => {
      console.error('Failed to load Tatamibari dataset:', err);
      datasetCache = [];
      return datasetCache;
    })
    .finally(() => {
      loadingPromise = null;
    });

  return loadingPromise;
}

// Convert dataset puzzle to game format
function datasetToGameFormat(puzzle) {
  const size = puzzle.rows;

  // Convert solution: normalize region IDs to 0-based sequential indices
  const solution = puzzle.solution.map(row => [...row]);
  const regionIdMap = new Map();
  let nextId = 0;

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const originalId = solution[r][c];
      if (!regionIdMap.has(originalId)) {
        regionIdMap.set(originalId, nextId++);
      }
      solution[r][c] = regionIdMap.get(originalId);
    }
  }

  // Derive clues from solution by analyzing each region
  const clueGrid = Array(size).fill(null).map(() => Array(size).fill(null));
  const regionCells = new Map();

  // Group cells by region
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const regionId = solution[r][c];
      if (!regionCells.has(regionId)) {
        regionCells.set(regionId, []);
      }
      regionCells.get(regionId).push([r, c]);
    }
  }

  // For each region, calculate dimensions and place clue
  for (const [regionId, cells] of regionCells) {
    if (cells.length === 0) continue;

    // Find bounding box
    let minR = Infinity, maxR = -Infinity, minC = Infinity, maxC = -Infinity;
    for (const [r, c] of cells) {
      minR = Math.min(minR, r);
      maxR = Math.max(maxR, r);
      minC = Math.min(minC, c);
      maxC = Math.max(maxC, c);
    }

    const height = maxR - minR + 1;
    const width = maxC - minC + 1;

    // Determine clue symbol
    let clue = null;
    if (width === height) {
      clue = CLUES.SQUARE; // +
    } else if (width > height) {
      clue = CLUES.HORIZONTAL; // −
    } else {
      clue = CLUES.VERTICAL; // |
    }

    // Place clue at the first cell of the region (top-left)
    const [clueR, clueC] = cells[0];
    clueGrid[clueR][clueC] = clue;
  }

  return {
    clueGrid,
    solution,
    size,
    puzzleId: puzzle.id,
    difficulty: puzzle.difficulty,
    source: puzzle.source,
  };
}

// Select puzzle by size and seed
function selectPuzzle(puzzles, size, seed) {
  const random = createSeededRandom(seed);
  const filtered = puzzles.filter(p => p.rows === size && p.cols === size);
  const list = filtered.length > 0 ? filtered : puzzles;
  if (list.length === 0) return null;
  return list[Math.floor(random() * list.length)];
}

// Generate a simple test puzzle (for testing only)
function generatePuzzle(size) {
  const regionGrid = Array(size).fill(null).map(() => Array(size).fill(-1));
  const clueGrid = Array(size).fill(null).map(() => Array(size).fill(null));
  const regions = [];

  // Use row-wide rectangles to guarantee no tatami violations and easy validation.
  for (let r = 0; r < size; r++) {
    const regionId = r;
    const cells = [];
    for (let c = 0; c < size; c++) {
      regionGrid[r][c] = regionId;
      cells.push([r, c]);
    }

    const width = size;
    const height = 1;
    const clue = width === height ? CLUES.SQUARE : CLUES.HORIZONTAL;
    const cluePos = [r, 0];
    clueGrid[r][0] = clue;

    regions.push({
      id: regionId,
      cells,
      clue,
      cluePos,
      width,
      height,
    });
  }

  return { clueGrid, solution: regionGrid, regions, size };
}

// Check if a region satisfies its clue
function checkRegion(cells, clue) {
  if (cells.length === 0) return false;

  // Find bounding box
  let minR = Infinity, maxR = -Infinity, minC = Infinity, maxC = -Infinity;
  for (const [r, c] of cells) {
    minR = Math.min(minR, r);
    maxR = Math.max(maxR, r);
    minC = Math.min(minC, c);
    maxC = Math.max(maxC, c);
  }

  const height = maxR - minR + 1;
  const width = maxC - minC + 1;

  // Check if it's a solid rectangle
  if (cells.length !== width * height) return false;

  // Check clue
  if (clue === CLUES.SQUARE) return width === height;
  if (clue === CLUES.HORIZONTAL) return width > height;
  if (clue === CLUES.VERTICAL) return height > width;

  return false;
}

// Check for tatami rule (no 4-way intersections)
function checkTatamiRule(regionGrid, size) {
  for (let r = 0; r < size - 1; r++) {
    for (let c = 0; c < size - 1; c++) {
      const corners = new Set([
        regionGrid[r][c],
        regionGrid[r][c + 1],
        regionGrid[r + 1][c],
        regionGrid[r + 1][c + 1],
      ]);
      if (corners.size === 4) return false; // 4 different regions meet
    }
  }
  return true;
}

// Validate the current player solution
function validateSolution(playerGrid, clueGrid, size) {
  const errors = new Set();
  const regionCells = new Map();

  // Group cells by region
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const regionId = playerGrid[r][c];
      if (regionId === -1) {
        errors.add(`${r},${c}`);
        continue;
      }

      if (!regionCells.has(regionId)) {
        regionCells.set(regionId, []);
      }
      regionCells.get(regionId).push([r, c]);
    }
  }

  // Check each region
  for (const [regionId, cells] of regionCells) {
    // Find clue in this region
    let clue = null;
    let clueCount = 0;

    for (const [r, c] of cells) {
      if (clueGrid[r][c]) {
        clue = clueGrid[r][c];
        clueCount++;
      }
    }

    // Must have exactly one clue
    if (clueCount !== 1) {
      for (const [r, c] of cells) {
        errors.add(`${r},${c}`);
      }
      continue;
    }

    // Check if region satisfies clue
    if (!checkRegion(cells, clue)) {
      for (const [r, c] of cells) {
        errors.add(`${r},${c}`);
      }
    }
  }

  // Check tatami rule
  if (!checkTatamiRule(playerGrid, size)) {
    // Mark all cells at violation points
    for (let r = 0; r < size - 1; r++) {
      for (let c = 0; c < size - 1; c++) {
        const corners = new Set([
          playerGrid[r][c],
          playerGrid[r][c + 1],
          playerGrid[r + 1][c],
          playerGrid[r + 1][c + 1],
        ]);
        if (corners.size === 4) {
          errors.add(`${r},${c}`);
          errors.add(`${r},${c + 1}`);
          errors.add(`${r + 1},${c}`);
          errors.add(`${r + 1},${c + 1}`);
        }
      }
    }
  }

  return errors;
}

// Check if puzzle is solved
function isSolved(playerGrid, clueGrid, size) {
  const errors = validateSolution(playerGrid, clueGrid, size);
  return errors.size === 0 && playerGrid.flat().every(v => v !== -1);
}

// Region colors for visualization
const REGION_COLORS = [
  'rgba(239, 68, 68, 0.3)',   // Red
  'rgba(59, 130, 246, 0.3)',  // Blue
  'rgba(34, 197, 94, 0.3)',   // Green
  'rgba(251, 191, 36, 0.3)',  // Yellow
  'rgba(168, 85, 247, 0.3)',  // Purple
  'rgba(236, 72, 153, 0.3)',  // Pink
  'rgba(20, 184, 166, 0.3)',  // Teal
  'rgba(249, 115, 22, 0.3)',  // Orange
  'rgba(139, 92, 246, 0.3)',  // Violet
  'rgba(6, 182, 212, 0.3)',   // Cyan
  'rgba(132, 204, 22, 0.3)',  // Lime
  'rgba(244, 114, 182, 0.3)', // Rose
];

// Export helpers for testing
export {
  GRID_SIZES,
  CLUES,
  generatePuzzle,
  checkRegion,
  checkTatamiRule,
  validateSolution,
  isSolved,
  REGION_COLORS,
};

export default function Tatamibari() {
  const { t } = useTranslation();
  const [sizeKey, setSizeKey] = useState('8×8');
  const [puzzleData, setPuzzleData] = useState(null);
  const [playerGrid, setPlayerGrid] = useState([]);
  const [currentRegion, setCurrentRegion] = useState(0);
  const { gameState, checkWin, giveUp, reset: resetGameState, isPlaying } = useGameState();
  const [errors, setErrors] = useState(new Set());
  const [showErrors, setShowErrors] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [seed, setSeed] = useState(() => Date.now());
  const [loading, setLoading] = useState(true);

  const size = GRID_SIZES[sizeKey];

  const initGame = useCallback(async (newSeed = null) => {
    setLoading(true);
    try {
      const puzzles = await loadDataset();
      const actualSeed = newSeed ?? Date.now();
      setSeed(actualSeed);

      const selectedPuzzle = selectPuzzle(puzzles, size, actualSeed);
      if (!selectedPuzzle) {
        console.error(`No puzzles found for size ${size}`);
        setLoading(false);
        return;
      }

      const data = datasetToGameFormat(selectedPuzzle);
      setPuzzleData(data);
      setPlayerGrid(Array(size).fill(null).map(() => Array(size).fill(-1)));
      setCurrentRegion(0);
      resetGameState();
      setErrors(new Set());
    } catch (err) {
      console.error('Failed to initialize game:', err);
    } finally {
      setLoading(false);
    }
  }, [size, resetGameState]);

  useEffect(() => {
    initGame();
  }, [initGame]);

  useEffect(() => {
    if (!puzzleData || !isPlaying) return;

    const newErrors = showErrors ? validateSolution(playerGrid, puzzleData.clueGrid, size) : new Set();
    setErrors(newErrors);

    if (isSolved(playerGrid, puzzleData.clueGrid, size)) {
      checkWin(true);
    }
  }, [playerGrid, puzzleData, size, showErrors, isPlaying, checkWin]);

  const handleCellMouseDown = (r, c) => {
    if (!isPlaying) return;
    setIsDrawing(true);

    setPlayerGrid(prev => {
      const newGrid = prev.map(row => [...row]);
      if (newGrid[r][c] === currentRegion) {
        newGrid[r][c] = -1; // Toggle off
      } else {
        newGrid[r][c] = currentRegion;
      }
      return newGrid;
    });
  };

  const handleCellMouseEnter = (r, c) => {
    if (!isDrawing || !isPlaying) return;

    setPlayerGrid(prev => {
      const newGrid = prev.map(row => [...row]);
      newGrid[r][c] = currentRegion;
      return newGrid;
    });
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
  };

  useEffect(() => {
    window.addEventListener('mouseup', handleMouseUp);
    return () => window.removeEventListener('mouseup', handleMouseUp);
  }, []);

  const handleReset = () => {
    setPlayerGrid(Array(size).fill(null).map(() => Array(size).fill(-1)));
    setCurrentRegion(0);
    resetGameState();
  };

  const handleGiveUp = () => {
    if (!puzzleData || !isPlaying) return;
    setPlayerGrid(puzzleData.solution.map(row => [...row]));
    giveUp();
  };

  if (loading || !puzzleData) {
    return (
      <div className={styles.container}>
        <GameHeader
          title="Tatamibari"
          instructions="Loading puzzle..."
        />
        <div style={{ textAlign: 'center', padding: '2rem' }}>{t('common.loadingPuzzle')}</div>
      </div>
    );
  }

  // Calculate border styles for regions
  const getBorders = (r, c) => {
    const regionId = playerGrid[r][c];
    const borders = {};

    if (r === 0 || playerGrid[r - 1][c] !== regionId) {
      borders.borderTop = '2px solid rgba(255, 255, 255, 0.8)';
    }
    if (r === size - 1 || playerGrid[r + 1][c] !== regionId) {
      borders.borderBottom = '2px solid rgba(255, 255, 255, 0.8)';
    }
    if (c === 0 || playerGrid[r][c - 1] !== regionId) {
      borders.borderLeft = '2px solid rgba(255, 255, 255, 0.8)';
    }
    if (c === size - 1 || playerGrid[r][c + 1] !== regionId) {
      borders.borderRight = '2px solid rgba(255, 255, 255, 0.8)';
    }

    return borders;
  };

  return (
    <div className={styles.container}>
      <GameHeader
        title="Tatamibari"
        instructions="Divide the grid into rectangles. Each rectangle has exactly one symbol: + (square), − (wider), | (taller). No four rectangles can meet at a corner."
      />

      {seed !== null && (
        <SeedDisplay
          seed={seed}
          variant="compact"
          showNewButton={false}
          showShare={false}
          onSeedChange={(newSeed) => {
            const seedNum = typeof newSeed === 'string'
              ? (isNaN(parseInt(newSeed, 10)) ? parseInt(newSeed, 10) : Date.now())
              : newSeed;
            initGame(seedNum);
          }}
        />
      )}

      <div className={styles.settings}>
        <SizeSelector
          sizes={Object.keys(GRID_SIZES)}
          selectedSize={sizeKey}
          onSizeChange={setSizeKey}
          getLabel={(key) => key}
        />
      </div>

      <div className={styles.gameArea}>
        <div className={styles.regionSelector}>
          <span className={styles.label}>{t('common.region')}:</span>
          {Array.from({ length: 12 }, (_, i) => (
            <button
              key={i}
              className={`${styles.regionBtn} ${currentRegion === i ? styles.active : ''}`}
              style={{ backgroundColor: REGION_COLORS[i] }}
              onClick={() => setCurrentRegion(i)}
            >
              {i + 1}
            </button>
          ))}
        </div>

        <div
          className={styles.grid}
          style={{
            gridTemplateColumns: `repeat(${size}, 1fr)`,
            width: `${size * 45}px`,
            height: `${size * 45}px`,
          }}
        >
          {Array(size).fill(null).map((_, r) =>
            Array(size).fill(null).map((_, c) => {
              const clue = puzzleData.clueGrid[r][c];
              const regionId = playerGrid[r][c];
              const hasError = errors.has(`${r},${c}`);
              const borders = getBorders(r, c);
              const bgColor = regionId >= 0 ? REGION_COLORS[regionId % REGION_COLORS.length] : 'transparent';

              return (
                <button
                  key={`${r}-${c}`}
                  className={`
                    ${styles.cell}
                    ${hasError ? styles.error : ''}
                  `}
                  style={{
                    backgroundColor: bgColor,
                    ...borders,
                  }}
                  onMouseDown={() => handleCellMouseDown(r, c)}
                  onMouseEnter={() => handleCellMouseEnter(r, c)}
                >
                  {clue && <span className={styles.clue}>{clue}</span>}
                </button>
              );
            })
          )}
        </div>

        {gameState === 'won' && (
          <GameResult
            state="won"
            title="Perfect!"
            message="All regions are valid!"
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
            disabled={!isPlaying}
          />
          <button className={styles.newGameBtn} onClick={() => initGame()}>
            New Puzzle
          </button>
        </div>

        <div className={styles.legend}>
          <div className={styles.legendItem}>
            <span className={styles.legendSymbol}>+</span>
            <span>Square region</span>
          </div>
          <div className={styles.legendItem}>
            <span className={styles.legendSymbol}>−</span>
            <span>Wider than tall</span>
          </div>
          <div className={styles.legendItem}>
            <span className={styles.legendSymbol}>|</span>
            <span>Taller than wide</span>
          </div>
        </div>
      </div>
    </div>
  );
}
