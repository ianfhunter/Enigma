import { useTranslation } from 'react-i18next';
import { useState, useEffect, useCallback } from 'react';
import GameHeader from '../../components/GameHeader';
import SizeSelector from '../../components/SizeSelector';
import GiveUpButton from '../../components/GiveUpButton';
import GameResult from '../../components/GameResult';
import { useGameState } from '../../hooks/useGameState';
import { useGameStats } from '../../hooks/useGameStats';
import { createSeededRandom } from '../../data/wordUtils';
import { createGrid, getNeighbors } from '../../utils/generatorUtils';
import styles from './StainedGlass.module.css';

const GRID_SIZES = {
  '5×5': 5,
  '6×6': 6,
  '7×7': 7,
  '8×8': 8,
};

const COLORS = [
  { name: 'red', hex: '#ef4444' },
  { name: 'blue', hex: '#3b82f6' },
  { name: 'green', hex: '#22c55e' },
  { name: 'yellow', hex: '#eab308' },
  { name: 'purple', hex: '#a855f7' },
  { name: 'orange', hex: '#f97316' },
];

// Generate regions for stained glass pattern
function generateRegionsForGlass(size, numColors) {
  const grid = createGrid(size, size, -1);
  const regions = [];

  // Create random regions using flood fill
  let regionId = 0;
  const cellsPerRegion = Math.floor((size * size) / numColors);

  for (let i = 0; i < numColors && regionId < numColors; i++) {
    // Find a random unassigned cell to start
    const unassigned = [];
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (grid[r][c] === -1) unassigned.push([r, c]);
      }
    }

    if (unassigned.length === 0) break;

    const [startR, startC] = unassigned[Math.floor(Math.random() * unassigned.length)];
    const region = [];
    const queue = [[startR, startC]];
    const targetSize = Math.min(cellsPerRegion + Math.floor(Math.random() * 3) - 1, unassigned.length);

    while (queue.length > 0 && region.length < targetSize) {
      const idx = Math.floor(Math.random() * queue.length);
      const [r, c] = queue.splice(idx, 1)[0];

      if (grid[r][c] !== -1) continue;

      grid[r][c] = regionId;
      region.push([r, c]);

      // Add neighbors using shared utility
      for (const [nr, nc] of getNeighbors(r, c, size)) {
        if (grid[nr][nc] === -1 && !queue.some(([qr, qc]) => qr === nr && qc === nc)) {
          queue.push([nr, nc]);
        }
      }
    }

    if (region.length > 0) {
      regions.push(region);
      regionId++;
    }
  }

  // Assign remaining cells to adjacent regions
  let changed = true;
  while (changed) {
    changed = false;
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (grid[r][c] === -1) {
          for (const [nr, nc] of getNeighbors(r, c, size)) {
            if (grid[nr][nc] !== -1) {
              const rid = grid[nr][nc];
              grid[r][c] = rid;
              regions[rid].push([r, c]);
              changed = true;
              break;
            }
          }
        }
      }
    }
  }

  return { grid, regions };
}

// Check if a coloring is valid (no adjacent same colors across regions)
function isValidColoring(regionGrid, coloring, size) {
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const regionId = regionGrid[r][c];
      const color = coloring[regionId];

      if (color === -1) continue;

      for (const [nr, nc] of getNeighbors(r, c, size)) {
        const neighborRegion = regionGrid[nr][nc];
        if (neighborRegion !== regionId && coloring[neighborRegion] === color) {
          return false;
        }
      }
    }
  }
  return true;
}

// Generate a valid solution using graph coloring
function generateSolution(regionGrid, regions, size, numColors) {
  const numRegions = regions.length;
  const coloring = Array(numRegions).fill(-1);

  // Build adjacency
  const adjacent = Array(numRegions).fill(null).map(() => new Set());

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const regionId = regionGrid[r][c];
      for (const [nr, nc] of getNeighbors(r, c, size)) {
        const neighborRegion = regionGrid[nr][nc];
        if (neighborRegion !== regionId) {
          adjacent[regionId].add(neighborRegion);
        }
      }
    }
  }

  // Greedy coloring with backtracking
  function solve(regionIdx) {
    if (regionIdx === numRegions) return true;

    const usedColors = new Set();
    for (const neighbor of adjacent[regionIdx]) {
      if (coloring[neighbor] !== -1) {
        usedColors.add(coloring[neighbor]);
      }
    }

    const availableColors = [];
    for (let c = 0; c < numColors; c++) {
      if (!usedColors.has(c)) availableColors.push(c);
    }

    // Shuffle available colors for variety
    for (let i = availableColors.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [availableColors[i], availableColors[j]] = [availableColors[j], availableColors[i]];
    }

    for (const color of availableColors) {
      coloring[regionIdx] = color;
      if (solve(regionIdx + 1)) return true;
    }

    coloring[regionIdx] = -1;
    return false;
  }

  solve(0);
  return coloring;
}

// Generate puzzle with some pre-filled hints
function generatePuzzle(size, numColors) {
  const { grid: regionGrid, regions } = generateRegionsForGlass(size, numColors);
  const solution = generateSolution(regionGrid, regions, size, numColors);

  // Pre-fill some regions as hints (about 30%)
  const hints = Array(regions.length).fill(-1);
  const numHints = Math.max(2, Math.floor(regions.length * 0.3));
  const indices = Array.from({ length: regions.length }, (_, i) => i);

  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }

  for (let i = 0; i < numHints; i++) {
    hints[indices[i]] = solution[indices[i]];
  }

  return { regionGrid, regions, solution, hints };
}

// Find errors in current coloring
function findErrors(regionGrid, coloring, size) {
  const errors = new Set();

  // Safety check: ensure regionGrid matches expected size
  if (!regionGrid || regionGrid.length !== size) {
    return errors;
  }

  for (let r = 0; r < size; r++) {
    if (!regionGrid[r] || regionGrid[r].length !== size) {
      continue;
    }

    for (let c = 0; c < size; c++) {
      const regionId = regionGrid[r][c];
      const color = coloring[regionId];

      if (color === -1) continue;

      for (const [nr, nc] of getNeighbors(r, c, size)) {
        if (!regionGrid[nr] || regionGrid[nr][nc] === undefined) {
          continue;
        }
        const neighborRegion = regionGrid[nr][nc];
        if (neighborRegion !== regionId && coloring[neighborRegion] === color) {
          errors.add(regionId);
          errors.add(neighborRegion);
        }
      }
    }
  }

  return errors;
}

export default function StainedGlass() {
  const { t } = useTranslation();
  const [sizeKey, setSizeKey] = useState('6×6');
  const [numColors, setNumColors] = useState(4);
  const [puzzleData, setPuzzleData] = useState(null);
  const [coloring, setColoring] = useState([]);
  const [selectedColor, setSelectedColor] = useState(0);
  const { gameState, checkWin, giveUp, reset: resetGameState, isPlaying } = useGameState();
  const [errors, setErrors] = useState(new Set());
  const [showErrors, setShowErrors] = useState(false);

  const size = GRID_SIZES[sizeKey];
  const activeColors = COLORS.slice(0, numColors);

  const initGame = useCallback(() => {
    const data = generatePuzzle(size, numColors);
    setPuzzleData(data);
    setColoring([...data.hints]);
    resetGameState();
    setErrors(new Set());
  }, [size, numColors, resetGameState]);

  // Initialize game when sizeKey or numColors changes
  useEffect(() => {
    // Generate new puzzle with current size and numColors
    const data = generatePuzzle(size, numColors);
    setPuzzleData(data);
    setColoring([...data.hints]);
    resetGameState();
    setErrors(new Set());
  }, [sizeKey, numColors, size, resetGameState]);

  // Ensure selectedColor is valid when numColors changes
  useEffect(() => {
    if (selectedColor >= numColors) {
      setSelectedColor(0);
    }
  }, [numColors, selectedColor]);

  useEffect(() => {
    if (!puzzleData) return;

    // Ensure puzzleData matches current size to prevent errors
    if (puzzleData.regionGrid.length !== size || puzzleData.regionGrid[0]?.length !== size) {
      return;
    }

    const newErrors = showErrors ? findErrors(puzzleData.regionGrid, coloring, size) : new Set();
    setErrors(newErrors);

    // Don't check for win if game is not in playing state
    if (!isPlaying) return;

    // Check if solved
    const allFilled = coloring.every(c => c !== -1);
    const noErrors = findErrors(puzzleData.regionGrid, coloring, size).size === 0;

    if (allFilled && noErrors) {
      checkWin(true);
    }
  }, [coloring, puzzleData, size, showErrors, isPlaying, checkWin]);

  const handleCellClick = (r, c) => {
    if (!isPlaying || !puzzleData) return;

    // Safety check: ensure puzzleData matches current size
    if (puzzleData.regionGrid.length !== size || !puzzleData.regionGrid[r] || puzzleData.regionGrid[r][c] === undefined) {
      return;
    }

    const regionId = puzzleData.regionGrid[r][c];

    // Don't allow changing hint cells
    if (puzzleData.hints[regionId] !== -1) return;

    setColoring(prev => {
      const newColoring = [...prev];
      if (newColoring[regionId] === selectedColor) {
        newColoring[regionId] = -1; // Toggle off
      } else {
        newColoring[regionId] = selectedColor;
      }
      return newColoring;
    });
  };

  const handleReset = () => {
    if (!puzzleData) return;
    setColoring([...puzzleData.hints]);
    resetGameState();
  };

  const handleGiveUp = () => {
    if (!puzzleData || !isPlaying) return;
    setColoring([...puzzleData.solution]);
    giveUp();
  };

  if (!puzzleData) return null;

  // Ensure puzzleData matches current size to prevent rendering issues
  if (puzzleData.regionGrid.length !== size || puzzleData.regionGrid[0]?.length !== size) {
    return null;
  }

  // Calculate border styles for regions
  const getBorders = (r, c) => {
    if (!puzzleData.regionGrid[r] || puzzleData.regionGrid[r][c] === undefined) {
      return {};
    }

    const regionId = puzzleData.regionGrid[r][c];
    const borders = {};

    if (r === 0 || (r > 0 && puzzleData.regionGrid[r - 1] && puzzleData.regionGrid[r - 1][c] !== regionId)) {
      borders.borderTop = '2px solid rgba(255, 255, 255, 0.8)';
    }
    if (r === size - 1 || (r < size - 1 && puzzleData.regionGrid[r + 1] && puzzleData.regionGrid[r + 1][c] !== regionId)) {
      borders.borderBottom = '2px solid rgba(255, 255, 255, 0.8)';
    }
    if (c === 0 || (c > 0 && puzzleData.regionGrid[r][c - 1] !== undefined && puzzleData.regionGrid[r][c - 1] !== regionId)) {
      borders.borderLeft = '2px solid rgba(255, 255, 255, 0.8)';
    }
    if (c === size - 1 || (c < size - 1 && puzzleData.regionGrid[r][c + 1] !== undefined && puzzleData.regionGrid[r][c + 1] !== regionId)) {
      borders.borderRight = '2px solid rgba(255, 255, 255, 0.8)';
    }

    return borders;
  };

  return (
    <div className={styles.container}>
      <GameHeader
        title="Stained Glass"
        instructions="Color each region so that no two adjacent regions share the same color. Click a region to fill it with the selected color."
      />

      <div className={styles.settings}>
        <SizeSelector
          sizes={Object.keys(GRID_SIZES)}
          selectedSize={sizeKey}
          onSelectSize={setSizeKey}
        />

        <div className={styles.colorCountSelector}>
          <span className={styles.label}>Colors:</span>
          {[3, 4, 5, 6].map((n) => (
            <button
              key={n}
              className={`${styles.sizeBtn} ${numColors === n ? styles.active : ''}`}
              onClick={() => setNumColors(n)}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.gameArea}>
        <div className={styles.colorPalette}>
          {activeColors.map((color, idx) => (
            <button
              key={color.name}
              className={`${styles.colorBtn} ${selectedColor === idx ? styles.selected : ''}`}
              style={{ backgroundColor: color.hex }}
              onClick={() => setSelectedColor(idx)}
              title={color.name}
            >
              {selectedColor === idx && <span className={styles.checkmark}>✓</span>}
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
              const regionId = puzzleData.regionGrid[r][c];
              const color = coloring[regionId];
              const isHint = puzzleData.hints[regionId] !== -1;
              const hasError = errors.has(regionId);
              const borders = getBorders(r, c);

              return (
                <button
                  key={`${r}-${c}`}
                  className={`
                    ${styles.cell}
                    ${isHint ? styles.hint : ''}
                    ${hasError ? styles.error : ''}
                  `}
                  style={{
                    backgroundColor: color !== -1 ? activeColors[color].hex : 'rgba(255, 255, 255, 0.05)',
                    ...borders,
                  }}
                  onClick={() => handleCellClick(r, c)}
                />
              );
            })
          )}
        </div>

        {gameState === 'won' && (
          <GameResult
            state="won"
            title="Beautiful!"
            message="Your stained glass is complete!"
          />
        )}
        {gameState === 'gaveUp' && (
          <GameResult
            state="gaveup"
            title="Solution Revealed"
            message="Here's the solution."
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
      </div>
    </div>
  );
}
