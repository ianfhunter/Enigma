import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
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
function generateRegions(size, numColors) {
  const grid = Array(size).fill(null).map(() => Array(size).fill(-1));
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
      
      // Add neighbors
      const neighbors = [
        [r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]
      ];
      
      for (const [nr, nc] of neighbors) {
        if (nr >= 0 && nr < size && nc >= 0 && nc < size && grid[nr][nc] === -1) {
          if (!queue.some(([qr, qc]) => qr === nr && qc === nc)) {
            queue.push([nr, nc]);
          }
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
          const neighbors = [
            [r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]
          ];
          
          for (const [nr, nc] of neighbors) {
            if (nr >= 0 && nr < size && nc >= 0 && nc < size && grid[nr][nc] !== -1) {
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
      
      const neighbors = [
        [r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]
      ];
      
      for (const [nr, nc] of neighbors) {
        if (nr >= 0 && nr < size && nc >= 0 && nc < size) {
          const neighborRegion = regionGrid[nr][nc];
          if (neighborRegion !== regionId && coloring[neighborRegion] === color) {
            return false;
          }
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
      const neighbors = [
        [r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]
      ];
      
      for (const [nr, nc] of neighbors) {
        if (nr >= 0 && nr < size && nc >= 0 && nc < size) {
          const neighborRegion = regionGrid[nr][nc];
          if (neighborRegion !== regionId) {
            adjacent[regionId].add(neighborRegion);
          }
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
  const { grid: regionGrid, regions } = generateRegions(size, numColors);
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
  
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const regionId = regionGrid[r][c];
      const color = coloring[regionId];
      
      if (color === -1) continue;
      
      const neighbors = [
        [r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]
      ];
      
      for (const [nr, nc] of neighbors) {
        if (nr >= 0 && nr < size && nc >= 0 && nc < size) {
          const neighborRegion = regionGrid[nr][nc];
          if (neighborRegion !== regionId && coloring[neighborRegion] === color) {
            errors.add(regionId);
            errors.add(neighborRegion);
          }
        }
      }
    }
  }
  
  return errors;
}

export default function StainedGlass() {
  const [sizeKey, setSizeKey] = useState('6×6');
  const [numColors, setNumColors] = useState(4);
  const [puzzleData, setPuzzleData] = useState(null);
  const [coloring, setColoring] = useState([]);
  const [selectedColor, setSelectedColor] = useState(0);
  const [gameState, setGameState] = useState('playing');
  const [errors, setErrors] = useState(new Set());
  const [showErrors, setShowErrors] = useState(true);
  
  const size = GRID_SIZES[sizeKey];
  const activeColors = COLORS.slice(0, numColors);
  
  const initGame = useCallback(() => {
    const data = generatePuzzle(size, numColors);
    setPuzzleData(data);
    setColoring([...data.hints]);
    setGameState('playing');
    setErrors(new Set());
  }, [size, numColors]);
  
  useEffect(() => {
    initGame();
  }, [initGame]);
  
  useEffect(() => {
    if (!puzzleData) return;
    
    const newErrors = showErrors ? findErrors(puzzleData.regionGrid, coloring, size) : new Set();
    setErrors(newErrors);
    
    // Check if solved
    const allFilled = coloring.every(c => c !== -1);
    const noErrors = findErrors(puzzleData.regionGrid, coloring, size).size === 0;
    
    if (allFilled && noErrors) {
      setGameState('won');
    }
  }, [coloring, puzzleData, size, showErrors]);
  
  const handleCellClick = (r, c) => {
    if (gameState !== 'playing' || !puzzleData) return;
    
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
    setGameState('playing');
  };
  
  if (!puzzleData) return null;
  
  // Calculate border styles for regions
  const getBorders = (r, c) => {
    const regionId = puzzleData.regionGrid[r][c];
    const borders = {};
    
    if (r === 0 || puzzleData.regionGrid[r - 1][c] !== regionId) {
      borders.borderTop = '2px solid rgba(255, 255, 255, 0.8)';
    }
    if (r === size - 1 || puzzleData.regionGrid[r + 1][c] !== regionId) {
      borders.borderBottom = '2px solid rgba(255, 255, 255, 0.8)';
    }
    if (c === 0 || puzzleData.regionGrid[r][c - 1] !== regionId) {
      borders.borderLeft = '2px solid rgba(255, 255, 255, 0.8)';
    }
    if (c === size - 1 || puzzleData.regionGrid[r][c + 1] !== regionId) {
      borders.borderRight = '2px solid rgba(255, 255, 255, 0.8)';
    }
    
    return borders;
  };
  
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Link to="/" className={styles.backLink}>← Back to Games</Link>
        <h1 className={styles.title}>Stained Glass</h1>
        <p className={styles.instructions}>
          Color each region so that no two adjacent regions share the same color.
          Click a region to fill it with the selected color.
        </p>
      </div>
      
      <div className={styles.settings}>
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
          <div className={styles.winMessage}>
            <div className={styles.winEmoji}>🎨</div>
            <h3>Beautiful!</h3>
            <p>Your stained glass is complete!</p>
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
      </div>
    </div>
  );
}
