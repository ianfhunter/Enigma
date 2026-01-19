import { useState, useEffect, useCallback } from 'react';
import GameHeader from '../../components/GameHeader';
import SizeSelector from '../../components/SizeSelector';
import DifficultySelector from '../../components/DifficultySelector';
import GiveUpButton from '../../components/GiveUpButton';
import GameResult from '../../components/GameResult';
import styles from './HotaruBeam.module.css';

const GRID_SIZES = {
  '5×5': 5,
  '6×6': 6,
  '7×7': 7,
  '8×8': 8,
};

const DIFFICULTY = {
  'Easy': { circles: 3, minValue: 2, maxValue: 4 },
  'Medium': { circles: 4, minValue: 2, maxValue: 6 },
  'Hard': { circles: 5, minValue: 3, maxValue: 8 },
};

// Hotaru Beam rules:
// - Circles contain numbers indicating how many line segments touch them
// - Lines form closed loops
// - Each cell can have 0, 1, or 2 line segments passing through it
// - Lines connect orthogonally adjacent cells through their edges

// Generate a loop using random walk that creates a closed path
function generateRandomLoop(size) {
  const solutionH = Array(size).fill(null).map(() => Array(size - 1).fill(false));
  const solutionV = Array(size - 1).fill(null).map(() => Array(size).fill(false));

  // Pick a random starting point not on edges
  const startR = 1 + Math.floor(Math.random() * (size - 2));
  const startC = 1 + Math.floor(Math.random() * (size - 2));

  // Perform a random walk to create a loop
  const path = [[startR, startC]];
  const visited = new Set([`${startR},${startC}`]);
  let r = startR, c = startC;

  const dirs = [
    [-1, 0], // up
    [1, 0],  // down
    [0, -1], // left
    [0, 1],  // right
  ];

  // Random walk until we can close the loop
  const maxSteps = size * size;
  for (let step = 0; step < maxSteps; step++) {
    // Shuffle directions
    const shuffled = [...dirs].sort(() => Math.random() - 0.5);
    let moved = false;

    for (const [dr, dc] of shuffled) {
      const nr = r + dr;
      const nc = c + dc;

      // Check bounds
      if (nr < 0 || nr >= size || nc < 0 || nc >= size) continue;

      // Check if we can close the loop (back to start and path is long enough)
      if (nr === startR && nc === startC && path.length >= 4) {
        // Close the loop by adding edge back to start
        addEdge(r, c, nr, nc, solutionH, solutionV, size);
        return { solutionH, solutionV, valid: true };
      }

      // Check if already visited
      if (visited.has(`${nr},${nc}`)) continue;

      // Move to new cell
      addEdge(r, c, nr, nc, solutionH, solutionV, size);
      path.push([nr, nc]);
      visited.add(`${nr},${nc}`);
      r = nr;
      c = nc;
      moved = true;
      break;
    }

    // If stuck, try to close loop if adjacent to start
    if (!moved) {
      for (const [dr, dc] of dirs) {
        const nr = r + dr;
        const nc = c + dc;
        if (nr === startR && nc === startC && path.length >= 4) {
          addEdge(r, c, nr, nc, solutionH, solutionV, size);
          return { solutionH, solutionV, valid: true };
        }
      }
      break;
    }
  }

  return { solutionH, solutionV, valid: false };
}

// Add an edge between two adjacent cells
function addEdge(r1, c1, r2, c2, solutionH, solutionV, size) {
  if (r1 === r2) {
    // Horizontal edge
    const minC = Math.min(c1, c2);
    if (minC >= 0 && minC < size - 1) {
      solutionH[r1][minC] = true;
    }
  } else {
    // Vertical edge
    const minR = Math.min(r1, r2);
    if (minR >= 0 && minR < size - 1) {
      solutionV[minR][c1] = true;
    }
  }
}

// Generate an L-shaped or U-shaped loop
function generateShapedLoop(size, shape) {
  const solutionH = Array(size).fill(null).map(() => Array(size - 1).fill(false));
  const solutionV = Array(size - 1).fill(null).map(() => Array(size).fill(false));

  const margin = 1;
  const maxW = size - 2 * margin;
  const maxH = size - 2 * margin;

  if (shape === 'L') {
    // L-shape: vertical bar + horizontal bar at bottom
    const vHeight = 2 + Math.floor(Math.random() * (maxH - 2));
    const hWidth = 2 + Math.floor(Math.random() * (maxW - 2));
    const thickness = 1 + Math.floor(Math.random() * 2);

    const top = margin;
    const left = margin;
    const right = left + thickness;
    const bottom = top + vHeight;
    const farRight = left + hWidth;

    // Draw outer L
    // Vertical part - left side
    for (let r = top; r < bottom; r++) solutionV[r][left] = true;
    // Vertical part - right side (partial)
    for (let r = top; r < bottom - thickness; r++) solutionV[r][right] = true;
    // Top horizontal
    for (let c = left; c < right; c++) solutionH[top][c] = true;
    // Inner corner horizontal
    for (let c = right; c < farRight; c++) solutionH[bottom - thickness][c] = true;
    // Bottom horizontal
    for (let c = left; c < farRight; c++) solutionH[bottom][c] = true;
    // Right vertical
    for (let r = bottom - thickness; r < bottom; r++) solutionV[r][farRight] = true;

  } else if (shape === 'U') {
    // U-shape
    const width = 3 + Math.floor(Math.random() * (maxW - 3));
    const height = 3 + Math.floor(Math.random() * (maxH - 3));
    const thickness = 1;
    const gapWidth = Math.max(1, width - 2 * thickness);

    const top = margin;
    const left = margin;
    const right = left + width;
    const bottom = top + height;
    const innerLeft = left + thickness;
    const innerRight = right - thickness;
    const innerBottom = bottom - thickness;

    // Left vertical
    for (let r = top; r < bottom; r++) solutionV[r][left] = true;
    // Right vertical
    for (let r = top; r < bottom; r++) solutionV[r][right] = true;
    // Bottom horizontal
    for (let c = left; c < right; c++) solutionH[bottom][c] = true;
    // Top left horizontal
    for (let c = left; c < innerLeft; c++) solutionH[top][c] = true;
    // Top right horizontal
    for (let c = innerRight; c < right; c++) solutionH[top][c] = true;
    // Inner left vertical
    for (let r = top; r < innerBottom; r++) solutionV[r][innerLeft] = true;
    // Inner right vertical
    for (let r = top; r < innerBottom; r++) solutionV[r][innerRight] = true;
    // Inner bottom horizontal
    for (let c = innerLeft; c < innerRight; c++) solutionH[innerBottom][c] = true;

  } else if (shape === 'S') {
    // S-shape / staircase
    const width = 4 + Math.floor(Math.random() * (maxW - 4));
    const height = 4 + Math.floor(Math.random() * (maxH - 4));
    const midH = Math.floor(height / 2);
    const midW = Math.floor(width / 2);

    const top = margin;
    const left = margin;

    // Top rectangle
    for (let c = left; c < left + width; c++) solutionH[top][c] = true;
    for (let c = left + midW; c < left + width; c++) solutionH[top + midH][c] = true;
    for (let r = top; r < top + midH; r++) solutionV[r][left] = true;
    for (let r = top; r < top + midH; r++) solutionV[r][left + width] = true;

    // Bottom rectangle (offset)
    for (let c = left; c < left + midW; c++) solutionH[top + midH][c] = true;
    for (let c = left; c < left + width; c++) solutionH[top + height][c] = true;
    for (let r = top + midH; r < top + height; r++) solutionV[r][left] = true;
    for (let r = top + midH; r < top + height; r++) solutionV[r][left + width] = true;
  }

  return { solutionH, solutionV };
}

// Generate a simple rectangle with optional notches
function generateRectWithNotches(size) {
  const solutionH = Array(size).fill(null).map(() => Array(size - 1).fill(false));
  const solutionV = Array(size - 1).fill(null).map(() => Array(size).fill(false));

  const minLoopSize = 3;
  const margin = Math.floor(Math.random() * 2);

  const loopTop = margin;
  const loopLeft = margin;
  const loopHeight = minLoopSize + Math.floor(Math.random() * (size - margin - minLoopSize));
  const loopWidth = minLoopSize + Math.floor(Math.random() * (size - margin - minLoopSize));

  const loopBottom = loopTop + loopHeight - 1;
  const loopRight = loopLeft + loopWidth - 1;

  // Draw basic rectangle
  for (let c = loopLeft; c < loopRight; c++) solutionH[loopTop][c] = true;
  for (let c = loopLeft; c < loopRight; c++) solutionH[loopBottom][c] = true;
  for (let r = loopTop; r < loopBottom; r++) solutionV[r][loopLeft] = true;
  for (let r = loopTop; r < loopBottom; r++) solutionV[r][loopRight] = true;

  // Add notches (indentations) randomly
  const notchCount = Math.floor(Math.random() * 3);
  for (let n = 0; n < notchCount; n++) {
    const side = Math.floor(Math.random() * 4);

    if (side === 0 && loopRight - loopLeft > 3) {
      // Top notch
      const notchPos = loopLeft + 1 + Math.floor(Math.random() * (loopRight - loopLeft - 2));
      const notchDepth = 1;
      if (loopTop + notchDepth < loopBottom - 1) {
        solutionH[loopTop][notchPos] = false;
        solutionH[loopTop + notchDepth][notchPos - 1] = true;
        solutionH[loopTop + notchDepth][notchPos] = true;
        solutionV[loopTop][notchPos] = true;
        solutionV[loopTop][notchPos + 1] = true;
      }
    } else if (side === 1 && loopRight - loopLeft > 3) {
      // Bottom notch
      const notchPos = loopLeft + 1 + Math.floor(Math.random() * (loopRight - loopLeft - 2));
      const notchDepth = 1;
      if (loopBottom - notchDepth > loopTop + 1) {
        solutionH[loopBottom][notchPos] = false;
        solutionH[loopBottom - notchDepth][notchPos - 1] = true;
        solutionH[loopBottom - notchDepth][notchPos] = true;
        solutionV[loopBottom - notchDepth][notchPos] = true;
        solutionV[loopBottom - notchDepth][notchPos + 1] = true;
      }
    } else if (side === 2 && loopBottom - loopTop > 3) {
      // Left notch
      const notchPos = loopTop + 1 + Math.floor(Math.random() * (loopBottom - loopTop - 2));
      const notchDepth = 1;
      if (loopLeft + notchDepth < loopRight - 1) {
        solutionV[notchPos][loopLeft] = false;
        solutionV[notchPos - 1][loopLeft + notchDepth] = true;
        solutionV[notchPos][loopLeft + notchDepth] = true;
        solutionH[notchPos][loopLeft] = true;
        solutionH[notchPos + 1][loopLeft] = true;
      }
    } else if (side === 3 && loopBottom - loopTop > 3) {
      // Right notch
      const notchPos = loopTop + 1 + Math.floor(Math.random() * (loopBottom - loopTop - 2));
      const notchDepth = 1;
      if (loopRight - notchDepth > loopLeft + 1) {
        solutionV[notchPos][loopRight] = false;
        solutionV[notchPos - 1][loopRight - notchDepth] = true;
        solutionV[notchPos][loopRight - notchDepth] = true;
        solutionH[notchPos][loopRight - notchDepth] = true;
        solutionH[notchPos + 1][loopRight - notchDepth] = true;
      }
    }
  }

  return { solutionH, solutionV };
}

function generatePuzzle(size, difficultyKey) {
  const { circles } = DIFFICULTY[difficultyKey];

  let solutionH, solutionV;

  // Choose a random loop generation method
  const method = Math.floor(Math.random() * 5);

  if (method === 0) {
    // Random walk loop
    const result = generateRandomLoop(size);
    if (result.valid) {
      solutionH = result.solutionH;
      solutionV = result.solutionV;
    } else {
      // Fallback to rectangle with notches
      const fallback = generateRectWithNotches(size);
      solutionH = fallback.solutionH;
      solutionV = fallback.solutionV;
    }
  } else if (method === 1) {
    // L-shaped loop
    const result = generateShapedLoop(size, 'L');
    solutionH = result.solutionH;
    solutionV = result.solutionV;
  } else if (method === 2) {
    // U-shaped loop
    const result = generateShapedLoop(size, 'U');
    solutionH = result.solutionH;
    solutionV = result.solutionV;
  } else if (method === 3) {
    // S-shaped loop
    const result = generateShapedLoop(size, 'S');
    solutionH = result.solutionH;
    solutionV = result.solutionV;
  } else {
    // Rectangle with notches
    const result = generateRectWithNotches(size);
    solutionH = result.solutionH;
    solutionV = result.solutionV;
  }

  // Create circle grid - place circles on cells that are part of the loop
  const circleGrid = Array(size).fill(null).map(() => Array(size).fill(0));

  // Find all cells that have edges (part of the loop)
  const loopCells = [];
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const edgeCount = countEdgesForSolution(r, c, solutionH, solutionV, size);
      if (edgeCount > 0) {
        loopCells.push({ r, c, edgeCount });
      }
    }
  }

  // Shuffle loop cells and place circles
  for (let i = loopCells.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [loopCells[i], loopCells[j]] = [loopCells[j], loopCells[i]];
  }

  // Place circles with their actual edge counts
  const numCircles = Math.min(circles, loopCells.length);
  for (let i = 0; i < numCircles; i++) {
    const { r, c, edgeCount } = loopCells[i];
    circleGrid[r][c] = edgeCount;
  }

  return {
    circleGrid,
    solutionH,
    solutionV,
    size,
  };
}

// Helper to count edges for a cell during puzzle generation
function countEdgesForSolution(r, c, hEdges, vEdges, size) {
  let count = 0;
  if (c > 0 && hEdges[r][c - 1]) count++;
  if (c < size - 1 && hEdges[r][c]) count++;
  if (r > 0 && vEdges[r - 1][c]) count++;
  if (r < size - 1 && vEdges[r][c]) count++;
  return count;
}

// Count edges touching a cell
function countEdges(r, c, hEdges, vEdges, size) {
  let count = 0;

  // Defensive checks to prevent errors during size transitions
  if (!hEdges || !vEdges || !hEdges[r] || r < 0 || r >= size || c < 0 || c >= size) {
    return 0;
  }

  // Left edge
  if (c > 0 && hEdges[r] && hEdges[r][c - 1]) count++;
  // Right edge
  if (c < size - 1 && hEdges[r] && hEdges[r][c]) count++;
  // Top edge
  if (r > 0 && vEdges[r - 1] && vEdges[r - 1][c]) count++;
  // Bottom edge
  if (r < size - 1 && vEdges[r] && vEdges[r][c]) count++;

  return count;
}

// Check if puzzle is solved
function checkSolved(circleGrid, hEdges, vEdges, size) {
  // Check all circle constraints
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (circleGrid[r][c] > 0) {
        const edgeCount = countEdges(r, c, hEdges, vEdges, size);
        if (edgeCount !== circleGrid[r][c]) {
          return false;
        }
      }
    }
  }

  // Check that lines form valid paths (each cell has 0 or 2 edges, not 1 or 3)
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const edgeCount = countEdges(r, c, hEdges, vEdges, size);
      if (edgeCount !== 0 && edgeCount !== 2) {
        return false;
      }
    }
  }

  // Check that at least some edges exist
  let hasEdges = false;
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size - 1; c++) {
      if (hEdges[r][c]) hasEdges = true;
    }
  }
  for (let r = 0; r < size - 1; r++) {
    for (let c = 0; c < size; c++) {
      if (vEdges[r][c]) hasEdges = true;
    }
  }

  if (!hasEdges) return false;

  // Check connectivity of the loop
  return checkLoopConnectivity(hEdges, vEdges, size);
}

// Check if edges form connected loops
function checkLoopConnectivity(hEdges, vEdges, size) {
  // Find a starting cell with edges
  let start = null;
  for (let r = 0; r < size && !start; r++) {
    for (let c = 0; c < size && !start; c++) {
      if (countEdges(r, c, hEdges, vEdges, size) > 0) {
        start = [r, c];
      }
    }
  }

  if (!start) return true; // No edges is technically valid

  // BFS to check all edge-connected cells are reachable
  const visited = Array(size).fill(null).map(() => Array(size).fill(false));
  const queue = [start];
  let visitedCount = 0;

  while (queue.length > 0) {
    const [r, c] = queue.shift();
    if (visited[r][c]) continue;
    visited[r][c] = true;
    visitedCount++;

    // Check connected neighbors via edges
    // Left
    if (c > 0 && hEdges[r][c - 1] && !visited[r][c - 1]) {
      queue.push([r, c - 1]);
    }
    // Right
    if (c < size - 1 && hEdges[r][c] && !visited[r][c + 1]) {
      queue.push([r, c + 1]);
    }
    // Up
    if (r > 0 && vEdges[r - 1][c] && !visited[r - 1][c]) {
      queue.push([r - 1, c]);
    }
    // Down
    if (r < size - 1 && vEdges[r][c] && !visited[r + 1][c]) {
      queue.push([r + 1, c]);
    }
  }

  // Count cells with edges
  let cellsWithEdges = 0;
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (countEdges(r, c, hEdges, vEdges, size) > 0) {
        cellsWithEdges++;
      }
    }
  }

  return visitedCount === cellsWithEdges;
}

// Export helpers for testing
export {
  GRID_SIZES,
  DIFFICULTY,
  addEdge,
  countEdges,
  countEdgesForSolution,
  checkSolved,
  checkLoopConnectivity,
};

// Find errors in current state
function findErrors(circleGrid, hEdges, vEdges, size) {
  const errors = new Set();

  // Check circle constraints
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const edgeCount = countEdges(r, c, hEdges, vEdges, size);

      // Circle constraint violation
      if (circleGrid[r][c] > 0 && edgeCount > circleGrid[r][c]) {
        errors.add(`cell-${r}-${c}`);
      }

      // Invalid edge count (1 or 3 edges means incomplete path)
      if (edgeCount === 1 || edgeCount === 3) {
        errors.add(`cell-${r}-${c}`);
      }

      // More than 2 edges is always invalid
      if (edgeCount > 2) {
        errors.add(`cell-${r}-${c}`);
      }
    }
  }

  return errors;
}

export default function HotaruBeam() {
  const [sizeKey, setSizeKey] = useState('5×5');
  const [difficultyKey, setDifficultyKey] = useState('Easy');
  const [puzzleData, setPuzzleData] = useState(null);
  const [hEdges, setHEdges] = useState([]);
  const [vEdges, setVEdges] = useState([]);
  const [gameState, setGameState] = useState('playing');
  const [errors, setErrors] = useState(new Set());
  const [showErrors, setShowErrors] = useState(true);

  const size = GRID_SIZES[sizeKey];

  const initGame = useCallback(() => {
    const data = generatePuzzle(size, difficultyKey);
    setPuzzleData(data);
    setHEdges(Array(size).fill(null).map(() => Array(size - 1).fill(false)));
    setVEdges(Array(size - 1).fill(null).map(() => Array(size).fill(false)));
    setGameState('playing');
    setErrors(new Set());
  }, [size, difficultyKey]);

  // Reset edges immediately when size changes to prevent dimension mismatches
  useEffect(() => {
    setHEdges(Array(size).fill(null).map(() => Array(size - 1).fill(false)));
    setVEdges(Array(size - 1).fill(null).map(() => Array(size).fill(false)));
  }, [size]);

  useEffect(() => {
    initGame();
  }, [initGame]);

  useEffect(() => {
    if (!puzzleData) return;

    // Guard against dimension mismatches - don't process errors if arrays don't match size
    const hEdgesValid = hEdges.length === size && hEdges.every(row => row && row.length === size - 1);
    const vEdgesValid = vEdges.length === size - 1 && vEdges.every(row => row && row.length === size);
    if (!hEdgesValid || !vEdgesValid) return;

    if (showErrors) {
      setErrors(findErrors(puzzleData.circleGrid, hEdges, vEdges, size));
    } else {
      setErrors(new Set());
    }

    // Only check for win if still playing (not revealed)
    if (gameState === 'playing' && checkSolved(puzzleData.circleGrid, hEdges, vEdges, size)) {
      setGameState('won');
    }
  }, [hEdges, vEdges, puzzleData, size, showErrors, gameState]);

  const toggleHEdge = (r, c) => {
    if (gameState !== 'playing') return;
    setHEdges(prev => {
      const newEdges = prev.map(row => [...row]);
      newEdges[r][c] = !newEdges[r][c];
      return newEdges;
    });
  };

  const toggleVEdge = (r, c) => {
    if (gameState !== 'playing') return;
    setVEdges(prev => {
      const newEdges = prev.map(row => [...row]);
      newEdges[r][c] = !newEdges[r][c];
      return newEdges;
    });
  };

  const handleReset = () => {
    setHEdges(Array(size).fill(null).map(() => Array(size - 1).fill(false)));
    setVEdges(Array(size - 1).fill(null).map(() => Array(size).fill(false)));
    setGameState('playing');
  };

  const handleGiveUp = () => {
    if (!puzzleData) return;
    setHEdges(puzzleData.solutionH.map(row => [...row]));
    setVEdges(puzzleData.solutionV.map(row => [...row]));
    setGameState('revealed');
  };

  if (!puzzleData) return null;

  // Guard against dimension mismatches when size changes
  const hEdgesValid = hEdges.length === size && hEdges.every(row => row.length === size - 1);
  const vEdgesValid = vEdges.length === size - 1 && vEdges.every(row => row.length === size);
  if (!hEdgesValid || !vEdgesValid) return null;

  // Calculate cell size based on grid
  const cellSize = 50;
  const gridWidth = size * cellSize;
  const gridHeight = size * cellSize;

  return (
    <div className={styles.container}>
      <GameHeader
        title="Hotaru Beam"
        instructions="Draw lines to form closed loops. Each numbered circle must have exactly that many line segments touching it. Click between cells to draw/remove lines."
      />

      <div className={styles.selectors}>
        <SizeSelector
          sizes={Object.keys(GRID_SIZES)}
          selectedSize={sizeKey}
          onSizeChange={setSizeKey}
          getLabel={(key) => key}
        />
        <DifficultySelector
          difficulties={Object.keys(DIFFICULTY)}
          selectedDifficulty={difficultyKey}
          onDifficultyChange={setDifficultyKey}
        />
      </div>

      <div className={styles.gameArea}>
        <div
          className={styles.gridContainer}
          style={{ width: gridWidth, height: gridHeight }}
        >
          {/* Grid cells */}
          {puzzleData.circleGrid.map((row, r) =>
            row.map((circle, c) => {
              const hasError = errors.has(`cell-${r}-${c}`);
              const edgeCount = countEdges(r, c, hEdges, vEdges, size);

              return (
                <div
                  key={`cell-${r}-${c}`}
                  className={`${styles.cell} ${hasError ? styles.errorCell : ''}`}
                  style={{
                    left: c * cellSize,
                    top: r * cellSize,
                    width: cellSize,
                    height: cellSize,
                  }}
                >
                  {circle > 0 && (
                    <div className={`${styles.circle} ${edgeCount === circle ? styles.satisfied : ''}`}>
                      {circle}
                    </div>
                  )}
                </div>
              );
            })
          )}

          {/* Horizontal edges */}
          {hEdges.map((row, r) =>
            row.map((isActive, c) => (
              <button
                key={`h-${r}-${c}`}
                className={`${styles.edge} ${styles.hEdge} ${isActive ? styles.active : ''}`}
                style={{
                  left: (c + 1) * cellSize - 8,
                  top: r * cellSize + cellSize / 2 - 4,
                }}
                onClick={() => toggleHEdge(r, c)}
              />
            ))
          )}

          {/* Vertical edges */}
          {vEdges.map((row, r) =>
            row.map((isActive, c) => (
              <button
                key={`v-${r}-${c}`}
                className={`${styles.edge} ${styles.vEdge} ${isActive ? styles.active : ''}`}
                style={{
                  left: c * cellSize + cellSize / 2 - 4,
                  top: (r + 1) * cellSize - 8,
                }}
                onClick={() => toggleVEdge(r, c)}
              />
            ))
          )}

          {/* Draw lines for active edges */}
          <svg className={styles.linesSvg} style={{ width: gridWidth, height: gridHeight }}>
            {hEdges.map((row, r) =>
              row.map((isActive, c) =>
                isActive && (
                  <line
                    key={`line-h-${r}-${c}`}
                    x1={(c + 0.5) * cellSize}
                    y1={(r + 0.5) * cellSize}
                    x2={(c + 1.5) * cellSize}
                    y2={(r + 0.5) * cellSize}
                    className={styles.line}
                  />
                )
              )
            )}
            {vEdges.map((row, r) =>
              row.map((isActive, c) =>
                isActive && (
                  <line
                    key={`line-v-${r}-${c}`}
                    x1={(c + 0.5) * cellSize}
                    y1={(r + 0.5) * cellSize}
                    x2={(c + 0.5) * cellSize}
                    y2={(r + 1.5) * cellSize}
                    className={styles.line}
                  />
                )
              )
            )}
          </svg>
        </div>

        <GameResult
          gameState={gameState === 'revealed' ? 'gaveUp' : gameState}
          onPlayAgain={initGame}
          winMessage="All loops complete!"
        />

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
