import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import styles from './StarBattle.module.css';

const DIFFICULTIES = {
  'Easy (1★)': { size: 6, stars: 1 },
  'Medium (1★)': { size: 8, stars: 1 },
  'Hard (2★)': { size: 10, stars: 2 },
};

// Generate regions for the grid
function generateRegions(size, numRegions) {
  const regions = Array(size).fill(null).map(() => Array(size).fill(-1));
  const regionSizes = Array(numRegions).fill(0);
  const targetSize = Math.floor((size * size) / numRegions);

  // Initialize with seed cells for each region
  const seeds = [];
  for (let i = 0; i < numRegions; i++) {
    let r, c;
    do {
      r = Math.floor(Math.random() * size);
      c = Math.floor(Math.random() * size);
    } while (regions[r][c] !== -1);
    regions[r][c] = i;
    regionSizes[i] = 1;
    seeds.push([[r, c]]);
  }

  // Grow regions
  let unassigned = size * size - numRegions;
  let attempts = 0;
  const maxAttempts = size * size * 100;

  while (unassigned > 0 && attempts < maxAttempts) {
    attempts++;
    const regionIdx = Math.floor(Math.random() * numRegions);
    if (regionSizes[regionIdx] >= targetSize + 1) continue;

    // Find a frontier cell for this region
    const frontier = [];
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (regions[r][c] !== regionIdx) continue;
        const neighbors = [[r-1,c], [r+1,c], [r,c-1], [r,c+1]];
        for (const [nr, nc] of neighbors) {
          if (nr >= 0 && nr < size && nc >= 0 && nc < size && regions[nr][nc] === -1) {
            frontier.push([nr, nc]);
          }
        }
      }
    }

    if (frontier.length > 0) {
      const [r, c] = frontier[Math.floor(Math.random() * frontier.length)];
      regions[r][c] = regionIdx;
      regionSizes[regionIdx]++;
      unassigned--;
    }
  }

  // Assign any remaining unassigned cells to nearest region
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (regions[r][c] === -1) {
        // Find adjacent region
        const neighbors = [[r-1,c], [r+1,c], [r,c-1], [r,c+1]];
        for (const [nr, nc] of neighbors) {
          if (nr >= 0 && nr < size && nc >= 0 && nc < size && regions[nr][nc] !== -1) {
            regions[r][c] = regions[nr][nc];
            break;
          }
        }
      }
    }
  }

  return regions;
}

// Generate a valid star placement
function generateSolution(size, starsPerUnit, regions) {
  const stars = Array(size).fill(null).map(() => Array(size).fill(false));
  const numRegions = size;

  function canPlaceStar(r, c) {
    // Check row count
    let rowCount = 0;
    for (let cc = 0; cc < size; cc++) {
      if (stars[r][cc]) rowCount++;
    }
    if (rowCount >= starsPerUnit) return false;

    // Check column count
    let colCount = 0;
    for (let rr = 0; rr < size; rr++) {
      if (stars[rr][c]) colCount++;
    }
    if (colCount >= starsPerUnit) return false;

    // Check region count
    const region = regions[r][c];
    let regionCount = 0;
    for (let rr = 0; rr < size; rr++) {
      for (let cc = 0; cc < size; cc++) {
        if (regions[rr][cc] === region && stars[rr][cc]) regionCount++;
      }
    }
    if (regionCount >= starsPerUnit) return false;

    // Check adjacent cells (including diagonals)
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        const nr = r + dr, nc = c + dc;
        if (nr >= 0 && nr < size && nc >= 0 && nc < size && stars[nr][nc]) {
          return false;
        }
      }
    }

    return true;
  }

  function solve(row, rowStars, regionStars) {
    if (row === size) {
      // Check all regions have enough stars
      for (let i = 0; i < numRegions; i++) {
        if (regionStars[i] !== starsPerUnit) return false;
      }
      return true;
    }

    // If this row already has enough stars, move to next row
    if (rowStars === starsPerUnit) {
      return solve(row + 1, 0, regionStars);
    }

    // Try placing stars in remaining columns
    const startCol = rowStars === 0 ? 0 : 0;
    for (let c = startCol; c < size; c++) {
      if (canPlaceStar(row, c)) {
        stars[row][c] = true;
        const region = regions[row][c];
        regionStars[region]++;

        if (solve(row, rowStars + 1, regionStars)) return true;

        stars[row][c] = false;
        regionStars[region]--;
      }
    }

    // Also try moving to next row if we haven't placed all stars
    if (rowStars < starsPerUnit) {
      return false;
    }

    return false;
  }

  const regionStars = Array(numRegions).fill(0);
  if (solve(0, 0, regionStars)) {
    return stars;
  }

  return null;
}

function generatePuzzle(size, starsPerUnit) {
  let attempts = 0;
  while (attempts < 50) {
    attempts++;
    const regions = generateRegions(size, size);
    const solution = generateSolution(size, starsPerUnit, regions);
    if (solution) {
      return { regions, solution, starsPerUnit };
    }
  }

  // Fallback: simple stripe regions
  const regions = Array(size).fill(null).map((_, r) =>
    Array(size).fill(null).map((_, c) => r)
  );
  const solution = generateSolution(size, starsPerUnit, regions);
  return { regions, solution: solution || Array(size).fill(null).map(() => Array(size).fill(false)), starsPerUnit };
}

// Check validity
function checkValidity(stars, regions, starsPerUnit) {
  const size = stars.length;
  const errors = new Set();

  // Check rows
  for (let r = 0; r < size; r++) {
    let count = 0;
    for (let c = 0; c < size; c++) {
      if (stars[r][c]) count++;
    }
    if (count > starsPerUnit) {
      for (let c = 0; c < size; c++) {
        if (stars[r][c]) errors.add(`${r},${c}`);
      }
    }
  }

  // Check columns
  for (let c = 0; c < size; c++) {
    let count = 0;
    for (let r = 0; r < size; r++) {
      if (stars[r][c]) count++;
    }
    if (count > starsPerUnit) {
      for (let r = 0; r < size; r++) {
        if (stars[r][c]) errors.add(`${r},${c}`);
      }
    }
  }

  // Check regions
  const regionCounts = {};
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (stars[r][c]) {
        const region = regions[r][c];
        regionCounts[region] = (regionCounts[region] || 0) + 1;
      }
    }
  }
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (stars[r][c] && regionCounts[regions[r][c]] > starsPerUnit) {
        errors.add(`${r},${c}`);
      }
    }
  }

  // Check adjacent stars
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (!stars[r][c]) continue;
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue;
          const nr = r + dr, nc = c + dc;
          if (nr >= 0 && nr < size && nc >= 0 && nc < size && stars[nr][nc]) {
            errors.add(`${r},${c}`);
            errors.add(`${nr},${nc}`);
          }
        }
      }
    }
  }

  return errors;
}

function checkSolved(stars, regions, starsPerUnit) {
  const size = stars.length;
  const errors = checkValidity(stars, regions, starsPerUnit);
  if (errors.size > 0) return false;

  // Check each row has exactly starsPerUnit stars
  for (let r = 0; r < size; r++) {
    let count = 0;
    for (let c = 0; c < size; c++) {
      if (stars[r][c]) count++;
    }
    if (count !== starsPerUnit) return false;
  }

  return true;
}

// Generate colors for regions
const REGION_COLORS = [
  'rgba(239, 68, 68, 0.3)',
  'rgba(249, 115, 22, 0.3)',
  'rgba(234, 179, 8, 0.3)',
  'rgba(34, 197, 94, 0.3)',
  'rgba(14, 165, 233, 0.3)',
  'rgba(99, 102, 241, 0.3)',
  'rgba(168, 85, 247, 0.3)',
  'rgba(236, 72, 153, 0.3)',
  'rgba(20, 184, 166, 0.3)',
  'rgba(251, 191, 36, 0.3)',
];

export default function StarBattle() {
  const [difficulty, setDifficulty] = useState('Easy (1★)');
  const [puzzleData, setPuzzleData] = useState(null);
  const [stars, setStars] = useState([]);
  const [gameState, setGameState] = useState('playing');
  const [errors, setErrors] = useState(new Set());
  const [showErrors, setShowErrors] = useState(true);

  const { size, stars: starsPerUnit } = DIFFICULTIES[difficulty];

  const initGame = useCallback(() => {
    const data = generatePuzzle(size, starsPerUnit);
    setPuzzleData(data);
    setStars(Array(size).fill(null).map(() => Array(size).fill(false)));
    setGameState('playing');
    setErrors(new Set());
  }, [size, starsPerUnit]);

  useEffect(() => {
    initGame();
  }, [initGame]);

  useEffect(() => {
    if (!puzzleData) return;

    const newErrors = showErrors ? checkValidity(stars, puzzleData.regions, puzzleData.starsPerUnit) : new Set();
    setErrors(newErrors);

    if (checkSolved(stars, puzzleData.regions, puzzleData.starsPerUnit)) {
      setGameState('won');
    }
  }, [stars, puzzleData, showErrors]);

  const handleCellClick = (r, c) => {
    if (gameState !== 'playing') return;

    setStars(prev => {
      const newStars = prev.map(row => [...row]);
      newStars[r][c] = !newStars[r][c];
      return newStars;
    });
  };

  const handleReset = () => {
    setStars(Array(size).fill(null).map(() => Array(size).fill(false)));
    setGameState('playing');
  };

  if (!puzzleData) return null;

  // Calculate border classes for regions
  const getBorderClasses = (r, c) => {
    const region = puzzleData.regions[r][c];
    const classes = [];
    if (r === 0 || puzzleData.regions[r-1][c] !== region) classes.push(styles.borderTop);
    if (r === size - 1 || puzzleData.regions[r+1]?.[c] !== region) classes.push(styles.borderBottom);
    if (c === 0 || puzzleData.regions[r][c-1] !== region) classes.push(styles.borderLeft);
    if (c === size - 1 || puzzleData.regions[r][c+1] !== region) classes.push(styles.borderRight);
    return classes.join(' ');
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Link to="/" className={styles.backLink}>← Back to Games</Link>
        <h1 className={styles.title}>Star Battle</h1>
        <p className={styles.instructions}>
          Place {starsPerUnit} star{starsPerUnit > 1 ? 's' : ''} in each row, column, and region.
          Stars cannot touch each other, even diagonally.
        </p>
      </div>

      <div className={styles.sizeSelector}>
        {Object.keys(DIFFICULTIES).map((key) => (
          <button
            key={key}
            className={`${styles.sizeBtn} ${difficulty === key ? styles.active : ''}`}
            onClick={() => setDifficulty(key)}
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
            width: `${size * 42}px`,
            height: `${size * 42}px`,
          }}
        >
          {stars.map((row, r) =>
            row.map((hasStar, c) => {
              const hasError = errors.has(`${r},${c}`);
              const regionColor = REGION_COLORS[puzzleData.regions[r][c] % REGION_COLORS.length];

              return (
                <button
                  key={`${r}-${c}`}
                  className={`
                    ${styles.cell}
                    ${getBorderClasses(r, c)}
                    ${hasError ? styles.error : ''}
                  `}
                  style={{ backgroundColor: regionColor }}
                  onClick={() => handleCellClick(r, c)}
                >
                  {hasStar && <span className={styles.star}>★</span>}
                </button>
              );
            })
          )}
        </div>

        {gameState === 'won' && (
          <div className={styles.winMessage}>
            <div className={styles.winEmoji}>⭐</div>
            <h3>Puzzle Solved!</h3>
            <p>All stars placed correctly!</p>
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

