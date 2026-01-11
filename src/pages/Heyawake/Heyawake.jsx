import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import styles from './Heyawake.module.css';

const GRID_SIZES = {
  '5×5': 5,
  '7×7': 7,
  '9×9': 9,
};

// Generate regions for the puzzle
function generateRegions(size) {
  const regions = Array(size).fill(null).map(() => Array(size).fill(-1));
  let regionId = 0;
  
  // Simple region generation: divide into rectangles
  const regionList = [];
  const _minRegionSize = 2;
  const maxRegionSize = Math.min(size, 6);
  
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (regions[r][c] === -1) {
        // Try to create a rectangle starting here
        const maxWidth = Math.min(maxRegionSize, size - c);
        const maxHeight = Math.min(maxRegionSize, size - r);
        
        // Check how far we can extend
        let width = 1;
        let height = 1;
        
        // Randomly decide rectangle dimensions
        const targetWidth = Math.min(Math.floor(Math.random() * 3) + 1, maxWidth);
        const targetHeight = Math.min(Math.floor(Math.random() * 3) + 1, maxHeight);
        
        // Verify the rectangle is free
        let canExpand = true;
        for (let dr = 0; dr < targetHeight && canExpand; dr++) {
          for (let dc = 0; dc < targetWidth && canExpand; dc++) {
            if (r + dr >= size || c + dc >= size || regions[r + dr][c + dc] !== -1) {
              canExpand = false;
            }
          }
        }
        
        if (canExpand) {
          width = targetWidth;
          height = targetHeight;
        }
        
        // Fill the region
        const cells = [];
        for (let dr = 0; dr < height; dr++) {
          for (let dc = 0; dc < width; dc++) {
            if (r + dr < size && c + dc < size && regions[r + dr][c + dc] === -1) {
              regions[r + dr][c + dc] = regionId;
              cells.push([r + dr, c + dc]);
            }
          }
        }
        
        if (cells.length > 0) {
          regionList.push({ id: regionId, cells, clue: null });
          regionId++;
        }
      }
    }
  }
  
  return { regions, regionList };
}

function generatePuzzle(size) {
  const { regions, regionList } = generateRegions(size);
  
  // Create a valid solution
  const solution = Array(size).fill(null).map(() => Array(size).fill(false));
  
  // For each region, decide how many cells to shade (respecting constraints)
  for (const region of regionList) {
    const numToShade = Math.floor(Math.random() * Math.min(3, region.cells.length));
    
    // Shuffle cells
    const shuffled = [...region.cells];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    
    let shaded = 0;
    for (const [r, c] of shuffled) {
      if (shaded >= numToShade) break;
      
      // Check if we can shade this cell (no adjacent shaded)
      const hasAdjacentShaded = [
        [r-1, c], [r+1, c], [r, c-1], [r, c+1]
      ].some(([nr, nc]) => 
        nr >= 0 && nr < size && nc >= 0 && nc < size && solution[nr][nc]
      );
      
      if (!hasAdjacentShaded) {
        solution[r][c] = true;
        shaded++;
      }
    }
    
    // Set the clue for this region (about 60% of regions get clues)
    if (Math.random() < 0.6) {
      let count = 0;
      for (const [r, c] of region.cells) {
        if (solution[r][c]) count++;
      }
      region.clue = count;
    }
  }
  
  // Verify connectivity and three-region rule
  // (simplified: just generate and hope it's valid)
  
  return { regions, regionList, solution };
}

// Check if unshaded cells are connected
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
  
  if (startR === -1) return false; // All shaded
  
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

// Check if any line of unshaded cells crosses more than 2 region borders
function checkThreeRegionRule(grid, regions, size) {
  // Check horizontal lines
  for (let r = 0; r < size; r++) {
    let start = -1;
    for (let c = 0; c <= size; c++) {
      if (c < size && !grid[r][c]) {
        if (start === -1) start = c;
      } else {
        if (start !== -1) {
          // We have a horizontal line from (r, start) to (r, c-1)
          const regionsInLine = new Set();
          for (let cc = start; cc < c; cc++) {
            regionsInLine.add(regions[r][cc]);
          }
          if (regionsInLine.size > 2) return false;
          start = -1;
        }
      }
    }
  }
  
  // Check vertical lines
  for (let c = 0; c < size; c++) {
    let start = -1;
    for (let r = 0; r <= size; r++) {
      if (r < size && !grid[r][c]) {
        if (start === -1) start = r;
      } else {
        if (start !== -1) {
          // We have a vertical line from (start, c) to (r-1, c)
          const regionsInLine = new Set();
          for (let rr = start; rr < r; rr++) {
            regionsInLine.add(regions[rr][c]);
          }
          if (regionsInLine.size > 2) return false;
          start = -1;
        }
      }
    }
  }
  
  return true;
}

// Check if no adjacent shaded cells
function checkNoAdjacent(grid, size) {
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

// Check region clues
function checkRegionClues(grid, regionList) {
  for (const region of regionList) {
    if (region.clue !== null) {
      let count = 0;
      for (const [r, c] of region.cells) {
        if (grid[r][c]) count++;
      }
      if (count !== region.clue) return false;
    }
  }
  return true;
}

function checkSolved(grid, regions, regionList, size) {
  if (!checkNoAdjacent(grid, size)) return false;
  if (!isConnected(grid, size)) return false;
  if (!checkThreeRegionRule(grid, regions, size)) return false;
  if (!checkRegionClues(grid, regionList)) return false;
  return true;
}

// Get errors for display
function getErrors(grid, regions, regionList, size) {
  const errors = {
    adjacent: new Set(),
    regionClues: new Set(),
  };
  
  // Check adjacent
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (grid[r][c]) {
        for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
          const nr = r + dr;
          const nc = c + dc;
          if (nr >= 0 && nr < size && nc >= 0 && nc < size && grid[nr][nc]) {
            errors.adjacent.add(`${r},${c}`);
            errors.adjacent.add(`${nr},${nc}`);
          }
        }
      }
    }
  }
  
  // Check region clues
  for (const region of regionList) {
    if (region.clue !== null) {
      let count = 0;
      for (const [r, c] of region.cells) {
        if (grid[r][c]) count++;
      }
      if (count > region.clue) {
        errors.regionClues.add(region.id);
      }
    }
  }
  
  return errors;
}

export default function Heyawake() {
  const [sizeKey, setSizeKey] = useState('5×5');
  const [puzzleData, setPuzzleData] = useState(null);
  const [grid, setGrid] = useState([]);
  const [gameState, setGameState] = useState('playing');
  const [showErrors, setShowErrors] = useState(true);

  const size = GRID_SIZES[sizeKey];

  const initGame = useCallback(() => {
    const data = generatePuzzle(size);
    setPuzzleData(data);
    setGrid(Array(size).fill(null).map(() => Array(size).fill(false)));
    setGameState('playing');
  }, [size]);

  useEffect(() => {
    initGame();
  }, [initGame]);

  useEffect(() => {
    if (!puzzleData) return;
    
    if (checkSolved(grid, puzzleData.regions, puzzleData.regionList, size)) {
      setGameState('won');
    }
  }, [grid, puzzleData, size]);

  const handleCellClick = (r, c) => {
    if (gameState !== 'playing') return;

    setGrid(prev => {
      const newGrid = prev.map(row => [...row]);
      newGrid[r][c] = !newGrid[r][c];
      return newGrid;
    });
  };

  const handleReset = () => {
    setGrid(Array(size).fill(null).map(() => Array(size).fill(false)));
    setGameState('playing');
  };

  if (!puzzleData) return null;

  const errors = showErrors ? getErrors(grid, puzzleData.regions, puzzleData.regionList, size) : { adjacent: new Set(), regionClues: new Set() };

  // Get clue for each cell (only first cell in region shows clue)
  const getClueForCell = (r, c) => {
    const regionId = puzzleData.regions[r][c];
    const region = puzzleData.regionList[regionId];
    if (region.clue === null) return null;
    // Only show clue in first cell of region
    if (region.cells[0][0] === r && region.cells[0][1] === c) {
      return region.clue;
    }
    return null;
  };

  // Get border styles for region boundaries
  const getBorderStyles = (r, c) => {
    const regionId = puzzleData.regions[r][c];
    const borders = {};
    
    if (r === 0 || puzzleData.regions[r-1][c] !== regionId) {
      borders.borderTop = '2px solid rgba(255, 255, 255, 0.5)';
    }
    if (r === size - 1 || puzzleData.regions[r+1]?.[c] !== regionId) {
      borders.borderBottom = '2px solid rgba(255, 255, 255, 0.5)';
    }
    if (c === 0 || puzzleData.regions[r][c-1] !== regionId) {
      borders.borderLeft = '2px solid rgba(255, 255, 255, 0.5)';
    }
    if (c === size - 1 || puzzleData.regions[r][c+1] !== regionId) {
      borders.borderRight = '2px solid rgba(255, 255, 255, 0.5)';
    }
    
    return borders;
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Link to="/" className={styles.backLink}>← Back to Games</Link>
        <h1 className={styles.title}>Heyawake</h1>
        <p className={styles.instructions}>
          Shade cells following the rules: (1) Shaded cells cannot be adjacent.
          (2) Unshaded cells must form a connected region.
          (3) A horizontal or vertical line of unshaded cells cannot span more than 2 rooms.
          (4) Numbers show how many shaded cells are in that room.
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
            row.map((isShaded, c) => {
              const clue = getClueForCell(r, c);
              const regionId = puzzleData.regions[r][c];
              const hasError = errors.adjacent.has(`${r},${c}`);
              const regionError = errors.regionClues.has(regionId);
              const borderStyles = getBorderStyles(r, c);
              
              return (
                <button
                  key={`${r}-${c}`}
                  className={`
                    ${styles.cell}
                    ${isShaded ? styles.shaded : ''}
                    ${hasError || regionError ? styles.error : ''}
                  `}
                  style={borderStyles}
                  onClick={() => handleCellClick(r, c)}
                >
                  {clue !== null && (
                    <span className={styles.clue}>{clue}</span>
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
            <p>All rooms are correctly shaded!</p>
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
