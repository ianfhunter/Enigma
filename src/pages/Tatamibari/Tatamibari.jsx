import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import styles from './Tatamibari.module.css';

// Tatamibari rules:
// - Divide the grid into rectangular regions
// - Each region contains exactly one clue
// - '+' means the region is a square
// - '-' means width > height (horizontal)
// - '|' means height > width (vertical)
// - No four regions can meet at a single point (tatami rule)

const GRID_SIZES = {
  '5×5': 5,
  '6×6': 6,
  '7×7': 7,
  '8×8': 8,
};

// Clue symbols
const CLUES = {
  SQUARE: '+',
  HORIZONTAL: '−',
  VERTICAL: '|',
};

// Generate a valid Tatamibari puzzle
function generatePuzzle(size) {
  // Create regions by randomly dividing the grid
  const regionGrid = Array(size).fill(null).map(() => Array(size).fill(-1));
  const regions = [];
  
  let regionId = 0;
  
  // Simple region generation: create random rectangles
  function tryPlaceRegion() {
    // Find an unassigned cell
    const unassigned = [];
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (regionGrid[r][c] === -1) {
          unassigned.push([r, c]);
        }
      }
    }
    
    if (unassigned.length === 0) return false;
    
    // Pick a random unassigned cell
    const [startR, startC] = unassigned[Math.floor(Math.random() * unassigned.length)];
    
    // Try to create a rectangle from this cell
    const maxWidth = Math.min(4, size - startC);
    const maxHeight = Math.min(4, size - startR);
    
    // Try random rectangle sizes
    const sizes = [];
    for (let h = 1; h <= maxHeight; h++) {
      for (let w = 1; w <= maxWidth; w++) {
        sizes.push([h, w]);
      }
    }
    
    // Shuffle sizes
    for (let i = sizes.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [sizes[i], sizes[j]] = [sizes[j], sizes[i]];
    }
    
    for (const [height, width] of sizes) {
      // Check if this rectangle is valid (all cells unassigned)
      let valid = true;
      for (let r = startR; r < startR + height && valid; r++) {
        for (let c = startC; c < startC + width && valid; c++) {
          if (r >= size || c >= size || regionGrid[r][c] !== -1) {
            valid = false;
          }
        }
      }
      
      if (valid) {
        // Place this region
        const cells = [];
        for (let r = startR; r < startR + height; r++) {
          for (let c = startC; c < startC + width; c++) {
            regionGrid[r][c] = regionId;
            cells.push([r, c]);
          }
        }
        
        // Determine clue based on shape
        let clue;
        if (width === height) {
          clue = CLUES.SQUARE;
        } else if (width > height) {
          clue = CLUES.HORIZONTAL;
        } else {
          clue = CLUES.VERTICAL;
        }
        
        // Place clue in a random cell of the region
        const clueCell = cells[Math.floor(Math.random() * cells.length)];
        
        regions.push({
          id: regionId,
          cells,
          clue,
          cluePos: clueCell,
          width,
          height,
        });
        
        regionId++;
        return true;
      }
    }
    
    return false;
  }
  
  // Keep placing regions until grid is full
  let attempts = 0;
  while (attempts < 1000) {
    if (!tryPlaceRegion()) {
      // Check if grid is full
      let full = true;
      for (let r = 0; r < size && full; r++) {
        for (let c = 0; c < size && full; c++) {
          if (regionGrid[r][c] === -1) full = false;
        }
      }
      if (full) break;
      
      // Grid not full but can't place, restart
      for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
          regionGrid[r][c] = -1;
        }
      }
      regions.length = 0;
      regionId = 0;
    }
    attempts++;
  }
  
  // Create clue grid
  const clueGrid = Array(size).fill(null).map(() => Array(size).fill(null));
  for (const region of regions) {
    const [r, c] = region.cluePos;
    clueGrid[r][c] = region.clue;
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

export default function Tatamibari() {
  const [sizeKey, setSizeKey] = useState('6×6');
  const [puzzleData, setPuzzleData] = useState(null);
  const [playerGrid, setPlayerGrid] = useState([]);
  const [currentRegion, setCurrentRegion] = useState(0);
  const [gameState, setGameState] = useState('playing');
  const [errors, setErrors] = useState(new Set());
  const [showErrors, setShowErrors] = useState(true);
  const [isDrawing, setIsDrawing] = useState(false);
  
  const size = GRID_SIZES[sizeKey];
  
  const initGame = useCallback(() => {
    const data = generatePuzzle(size);
    setPuzzleData(data);
    setPlayerGrid(Array(size).fill(null).map(() => Array(size).fill(-1)));
    setCurrentRegion(0);
    setGameState('playing');
    setErrors(new Set());
  }, [size]);
  
  useEffect(() => {
    initGame();
  }, [initGame]);
  
  useEffect(() => {
    if (!puzzleData) return;
    
    const newErrors = showErrors ? validateSolution(playerGrid, puzzleData.clueGrid, size) : new Set();
    setErrors(newErrors);
    
    if (isSolved(playerGrid, puzzleData.clueGrid, size)) {
      setGameState('won');
    }
  }, [playerGrid, puzzleData, size, showErrors]);
  
  const handleCellMouseDown = (r, c) => {
    if (gameState !== 'playing') return;
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
    if (!isDrawing || gameState !== 'playing') return;
    
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
    setGameState('playing');
  };
  
  if (!puzzleData) return null;
  
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
      <div className={styles.header}>
        <Link to="/" className={styles.backLink}>← Back to Games</Link>
        <h1 className={styles.title}>Tatamibari</h1>
        <p className={styles.instructions}>
          Divide the grid into rectangles. Each rectangle has exactly one symbol:
          <strong> +</strong> (square), <strong>−</strong> (wider), <strong>|</strong> (taller).
          No four rectangles can meet at a corner.
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
      </div>
      
      <div className={styles.gameArea}>
        <div className={styles.regionSelector}>
          <span className={styles.label}>Region:</span>
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
          <div className={styles.winMessage}>
            <div className={styles.winEmoji}>🎉</div>
            <h3>Perfect!</h3>
            <p>All regions are valid!</p>
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
