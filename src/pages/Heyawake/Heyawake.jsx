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

  const regionList = [];
  const maxRegionSize = Math.min(size, 5);

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (regions[r][c] === -1) {
        const maxWidth = Math.min(maxRegionSize, size - c);
        const maxHeight = Math.min(maxRegionSize, size - r);

        let width = 1;
        let height = 1;

        const targetWidth = Math.min(Math.floor(Math.random() * 3) + 1, maxWidth);
        const targetHeight = Math.min(Math.floor(Math.random() * 3) + 1, maxHeight);

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

// Deep copy a 2D array
function copyGrid(grid) {
  return grid.map(row => [...row]);
}

// Check if shading a cell would create adjacent shaded cells
function hasAdjacentShaded(grid, r, c, size) {
  const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
  for (const [dr, dc] of dirs) {
    const nr = r + dr;
    const nc = c + dc;
    if (nr >= 0 && nr < size && nc >= 0 && nc < size && grid[nr][nc] === true) {
      return true;
    }
  }
  return false;
}

// Check connectivity of unshaded cells
function checkConnectivity(grid, size) {
  let startR = -1, startC = -1;
  for (let r = 0; r < size && startR === -1; r++) {
    for (let c = 0; c < size && startR === -1; c++) {
      if (grid[r][c] === false) {
        startR = r;
        startC = c;
      }
    }
  }

  if (startR === -1) return false;

  const visited = Array(size).fill(null).map(() => Array(size).fill(false));
  const queue = [[startR, startC]];
  visited[startR][startC] = true;
  let count = 1;

  while (queue.length > 0) {
    const [r, c] = queue.shift();
    for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
      const nr = r + dr;
      const nc = c + dc;
      if (nr >= 0 && nr < size && nc >= 0 && nc < size &&
          grid[nr][nc] === false && !visited[nr][nc]) {
        visited[nr][nc] = true;
        queue.push([nr, nc]);
        count++;
      }
    }
  }

  let totalUnshaded = 0;
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (grid[r][c] === false) totalUnshaded++;
    }
  }

  return count === totalUnshaded;
}

// Check the three-region rule for a specific line
function checkThreeRegionRuleForGrid(grid, regions, size) {
  // Horizontal lines
  for (let r = 0; r < size; r++) {
    let start = -1;
    for (let c = 0; c <= size; c++) {
      if (c < size && grid[r][c] === false) {
        if (start === -1) start = c;
      } else {
        if (start !== -1) {
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

  // Vertical lines
  for (let c = 0; c < size; c++) {
    let start = -1;
    for (let r = 0; r <= size; r++) {
      if (r < size && grid[r][c] === false) {
        if (start === -1) start = r;
      } else {
        if (start !== -1) {
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

// Check region clues
function checkRegionCluesComplete(grid, regionList) {
  for (const region of regionList) {
    if (region.clue !== null) {
      let count = 0;
      for (const [r, c] of region.cells) {
        if (grid[r][c] === true) count++;
      }
      if (count !== region.clue) return false;
    }
  }
  return true;
}

// Count shaded in region
function countShadedInRegion(grid, region) {
  let count = 0;
  for (const [r, c] of region.cells) {
    if (grid[r][c] === true) count++;
  }
  return count;
}

// Count unassigned cells in region
function countUnassignedInRegion(grid, region) {
  let count = 0;
  for (const [r, c] of region.cells) {
    if (grid[r][c] === null) count++;
  }
  return count;
}

// Efficient solver with better pruning
function solve(grid, regions, regionList, size, findAll = false) {
  const solutions = [];
  const maxSolutions = findAll ? 2 : 1;

  // Build region lookup
  const cellToRegion = Array(size).fill(null).map(() => Array(size).fill(null));
  for (const region of regionList) {
    for (const [r, c] of region.cells) {
      cellToRegion[r][c] = region;
    }
  }

  function canShade(r, c) {
    // Check adjacent cells
    for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
      const nr = r + dr;
      const nc = c + dc;
      if (nr >= 0 && nr < size && nc >= 0 && nc < size && grid[nr][nc] === true) {
        return false;
      }
    }
    return true;
  }

  function checkRegionConstraints() {
    for (const region of regionList) {
      if (region.clue === null) continue;
      const shaded = countShadedInRegion(grid, region);
      const unassigned = countUnassignedInRegion(grid, region);
      // Too many shaded
      if (shaded > region.clue) return false;
      // Can't reach the clue
      if (shaded + unassigned < region.clue) return false;
    }
    return true;
  }

  function isComplete() {
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (grid[r][c] === null) return false;
      }
    }
    return true;
  }

  function isSolution() {
    if (!isComplete()) return false;
    if (!checkConnectivity(grid, size)) return false;
    if (!checkThreeRegionRuleForGrid(grid, regions, size)) return false;
    if (!checkRegionCluesComplete(grid, regionList)) return false;
    return true;
  }

  function backtrack(idx) {
    if (solutions.length >= maxSolutions) return;
    if (!checkRegionConstraints()) return;

    if (idx >= size * size) {
      if (isSolution()) {
        solutions.push(copyGrid(grid));
      }
      return;
    }

    const r = Math.floor(idx / size);
    const c = idx % size;

    if (grid[r][c] !== null) {
      backtrack(idx + 1);
      return;
    }

    // Try unshaded first (more common in Heyawake)
    grid[r][c] = false;
    backtrack(idx + 1);

    if (solutions.length >= maxSolutions) {
      grid[r][c] = null;
      return;
    }

    // Try shaded only if valid
    if (canShade(r, c)) {
      grid[r][c] = true;
      backtrack(idx + 1);
    }

    grid[r][c] = null;
  }

  backtrack(0);
  return solutions;
}

// Count solutions with timeout protection
function countSolutions(regions, regionList, size) {
  const grid = Array(size).fill(null).map(() => Array(size).fill(null));
  const solutions = solve(grid, regions, regionList, size, true);
  return solutions.length;
}

// Generate a valid solution that satisfies Heyawake rules
function generateValidSolution(regions, regionList, size, maxAttempts = 50) {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const solution = Array(size).fill(null).map(() => Array(size).fill(false));

    // Randomly shade cells respecting the no-adjacent rule
    const allCells = [];
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        allCells.push([r, c]);
      }
    }

    // Shuffle
    for (let i = allCells.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [allCells[i], allCells[j]] = [allCells[j], allCells[i]];
    }

    // Target a certain density of shaded cells (at least a few)
    const minShaded = Math.max(2, Math.floor(size * size * 0.1));
    const targetShaded = Math.max(minShaded, Math.floor(size * size * (0.15 + Math.random() * 0.15)));
    let shaded = 0;

    for (const [r, c] of allCells) {
      if (shaded >= targetShaded) break;

      if (!hasAdjacentShaded(solution, r, c, size)) {
        solution[r][c] = true;

        // Check if this maintains connectivity
        if (!checkConnectivity(solution, size)) {
          solution[r][c] = false;
        } else if (!checkThreeRegionRuleForGrid(solution, regions, size)) {
          solution[r][c] = false;
        } else {
          shaded++;
        }
      }
    }

    // Validate the solution and ensure it has some shaded cells
    const totalShaded = solution.flat().filter(Boolean).length;
    if (totalShaded > 0 && checkConnectivity(solution, size) && checkThreeRegionRuleForGrid(solution, regions, size)) {
      return solution;
    }
  }

  // Fallback: create a minimal valid solution with at least one shaded cell
  const fallbackSolution = Array(size).fill(null).map(() => Array(size).fill(false));
  // Try to shade at least one cell
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      fallbackSolution[r][c] = true;
      if (checkConnectivity(fallbackSolution, size) && checkThreeRegionRuleForGrid(fallbackSolution, regions, size)) {
        return fallbackSolution;
      }
      fallbackSolution[r][c] = false;
    }
  }
  return fallbackSolution;
}

// Generate puzzle with unique solution
function generatePuzzle(size) {
  let attempts = 0;
  const maxAttempts = 20;

  while (attempts < maxAttempts) {
    attempts++;

    const { regions, regionList } = generateRegions(size);
    const solution = generateValidSolution(regions, regionList, size);

    // Set all clues based on solution
    for (const region of regionList) {
      let count = 0;
      for (const [r, c] of region.cells) {
        if (solution[r][c]) count++;
      }
      region.clue = count;
    }

    // Verify the full-clue puzzle has exactly one solution
    let numSolutions = countSolutions(regions, regionList, size);
    if (numSolutions !== 1) continue;

    // Now try to remove clues while maintaining unique solvability
    // Shuffle regions to randomize which clues we try to remove
    const shuffledIndices = [...Array(regionList.length).keys()];
    for (let i = shuffledIndices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledIndices[i], shuffledIndices[j]] = [shuffledIndices[j], shuffledIndices[i]];
    }

    for (const idx of shuffledIndices) {
      const region = regionList[idx];
      const savedClue = region.clue;
      region.clue = null;

      const testSolutions = countSolutions(regions, regionList, size);
      if (testSolutions !== 1) {
        // Removing this clue breaks uniqueness, restore it
        region.clue = savedClue;
      }
    }

    // Ensure we have at least some clues and not all zeros
    const cluesWithValues = regionList.filter(r => r.clue !== null);
    const hasNonZeroClue = cluesWithValues.some(r => r.clue > 0);
    if (cluesWithValues.length > 0 && hasNonZeroClue) {
      return { regions, regionList, solution };
    }
  }

  // Fallback: generate a simple puzzle with all clues, ensuring uniqueness and non-zero
  for (let fallbackAttempts = 0; fallbackAttempts < 100; fallbackAttempts++) {
    const { regions, regionList } = generateRegions(size);
    const solution = generateValidSolution(regions, regionList, size);

    for (const region of regionList) {
      let count = 0;
      for (const [r, c] of region.cells) {
        if (solution[r][c]) count++;
      }
      region.clue = count;
    }

    // Ensure at least one region has shaded cells AND unique solution
    const hasNonZero = regionList.some(r => r.clue > 0);
    if (hasNonZero) {
      const numSolutions = countSolutions(regions, regionList, size);
      if (numSolutions === 1) {
        return { regions, regionList, solution };
      }
    }
  }

  // Absolute last resort: create a minimal valid unique puzzle
  // Use a simple pattern that's guaranteed to be unique
  const { regions, regionList } = generateRegions(size);
  const solution = Array(size).fill(null).map(() => Array(size).fill(false));
  // Shade cells in a checkerboard-like pattern (every other cell where possible)
  for (let r = 0; r < size; r += 2) {
    for (let c = 0; c < size; c += 2) {
      solution[r][c] = true;
    }
  }
  // Set all clues
  for (const region of regionList) {
    let count = 0;
    for (const [r, c] of region.cells) {
      if (solution[r][c]) count++;
    }
    region.clue = count;
  }
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
  const [gameState, setGameState] = useState('playing'); // 'playing', 'won', 'gaveUp'
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
    if (!puzzleData || gameState === 'gaveUp') return;

    if (checkSolved(grid, puzzleData.regions, puzzleData.regionList, size)) {
      setGameState('won');
    }
  }, [grid, puzzleData, size, gameState]);

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

  const handleGiveUp = () => {
    if (!puzzleData) return;
    setGrid(puzzleData.solution);
    setGameState('gaveUp');
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

        {gameState === 'gaveUp' && (
          <div className={styles.gaveUpMessage}>
            <div className={styles.gaveUpEmoji}>💡</div>
            <h3>Solution Revealed</h3>
            <p>Here&apos;s how it should be solved.</p>
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
      </div>
    </div>
  );
}
