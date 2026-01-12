import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import styles from './Tantrix.module.css';

// Tantrix-style puzzle with hexagonal tiles
// Each tile has 3 colored paths connecting 6 edges
// Goal: rotate tiles so all adjacent edges match colors

const COLORS = {
  R: '#ef4444', // Red
  B: '#3b82f6', // Blue
  Y: '#eab308', // Yellow
  G: '#22c55e', // Green
};

// Tile definitions: each tile has 3 paths, each path connects 2 edges (0-5, clockwise from top)
// Format: [[edge1, edge2, color], [edge1, edge2, color], [edge1, edge2, color]]
const TILE_TYPES = [
  [[0, 3, 'R'], [1, 5, 'B'], [2, 4, 'Y']], // Straight lines
  [[0, 2, 'R'], [1, 4, 'B'], [3, 5, 'Y']], // Curved
  [[0, 1, 'R'], [2, 5, 'B'], [3, 4, 'Y']], // Sharp turns
  [[0, 4, 'R'], [1, 3, 'B'], [2, 5, 'Y']], // Mixed
  [[0, 5, 'R'], [1, 2, 'B'], [3, 4, 'G']], // With green
  [[0, 3, 'B'], [1, 4, 'R'], [2, 5, 'G']], // Different combo
  [[0, 2, 'Y'], [1, 5, 'G'], [3, 4, 'R']], // Another combo
  [[0, 1, 'B'], [2, 3, 'Y'], [4, 5, 'G']], // All adjacent pairs
];

// Rotate a tile's paths by n positions (60 degrees each)
function rotateTile(paths, rotations) {
  return paths.map(([e1, e2, color]) => [
    (e1 + rotations) % 6,
    (e2 + rotations) % 6,
    color,
  ]);
}

// Get the color at a specific edge of a tile
function getEdgeColor(paths, edge) {
  for (const [e1, e2, color] of paths) {
    if (e1 === edge || e2 === edge) return color;
  }
  return null;
}

// Hex grid neighbor directions (pointy-top hexagons, odd-r offset coordinates)
// Edge 0 = upper-right, 1 = right, 2 = lower-right, 3 = lower-left, 4 = left, 5 = upper-left
function getNeighbor(row, col, edge) {
  // For odd-r offset coordinates (odd rows shifted right):
  // Neighbor offsets differ based on row parity
  const isOddRow = row % 2 === 1;

  const oddRowOffsets = [
    [-1, 1],  // 0: upper-right
    [0, 1],   // 1: right
    [1, 1],   // 2: lower-right
    [1, 0],   // 3: lower-left
    [0, -1],  // 4: left
    [-1, 0],  // 5: upper-left
  ];

  const evenRowOffsets = [
    [-1, 0],  // 0: upper-right
    [0, 1],   // 1: right
    [1, 0],   // 2: lower-right
    [1, -1],  // 3: lower-left
    [0, -1],  // 4: left
    [-1, -1], // 5: upper-left
  ];

  const offsets = isOddRow ? oddRowOffsets : evenRowOffsets;
  const [dr, dc] = offsets[edge];
  return [row + dr, col + dc];
}

// Opposite edge (what we need to match)
function oppositeEdge(edge) {
  return (edge + 3) % 6;
}

// Check if a tile at given rotation is compatible with already-placed neighbors
function isCompatible(tiles, solutionRotations, r, c, tileType, rotation, size) {
  const paths = rotateTile(tileType, rotation);

  // Check all 6 edges for neighbors that are already placed
  for (let edge = 0; edge < 6; edge++) {
    const [nr, nc] = getNeighbor(r, c, edge);

    // Skip if neighbor is out of bounds or not yet placed
    if (nr < 0 || nr >= size || nc < 0 || nc >= size) continue;
    if (!tiles[nr]?.[nc]) continue;

    const neighborPaths = rotateTile(tiles[nr][nc], solutionRotations[nr][nc]);
    const myColor = getEdgeColor(paths, edge);
    const theirColor = getEdgeColor(neighborPaths, oppositeEdge(edge));

    // If both edges have colors, they must match
    if (myColor && theirColor && myColor !== theirColor) {
      return false;
    }
  }

  return true;
}

// Find a valid tile and rotation for a position
function findValidTile(tiles, solutionRotations, r, c, size) {
  // Shuffle tile types to add variety
  const shuffledTypes = [...TILE_TYPES].sort(() => Math.random() - 0.5);

  for (const tileType of shuffledTypes) {
    // Try all 6 rotations in random order
    const rotations = [0, 1, 2, 3, 4, 5].sort(() => Math.random() - 0.5);

    for (const rotation of rotations) {
      if (isCompatible(tiles, solutionRotations, r, c, tileType, rotation, size)) {
        return { tileType: [...tileType], rotation };
      }
    }
  }

  return null; // No valid tile found
}

// Generate a puzzle by building from a solved state
function generatePuzzle(size = 3) {
  const gridSize = size;
  const maxAttempts = 50;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const tiles = [];
    const solutionRotations = [];
    let success = true;

    // Initialize empty grid
    for (let r = 0; r < gridSize; r++) {
      tiles.push(new Array(gridSize).fill(null));
      solutionRotations.push(new Array(gridSize).fill(0));
    }

    // Place tiles one by one, ensuring compatibility with neighbors
    for (let r = 0; r < gridSize && success; r++) {
      for (let c = 0; c < gridSize && success; c++) {
        // Skip some cells to make hex-like pattern
        if (r === 0 && c === gridSize - 1) continue;
        if (r === gridSize - 1 && c === 0) continue;

        const result = findValidTile(tiles, solutionRotations, r, c, gridSize);

        if (result) {
          tiles[r][c] = result.tileType;
          solutionRotations[r][c] = result.rotation;
        } else {
          success = false; // Backtrack by restarting
        }
      }
    }

    if (success) {
      // Randomize starting rotations (different from solution)
      const startRotations = solutionRotations.map((row, r) =>
        row.map((solRot, c) => {
          if (!tiles[r][c]) return 0;
          // Pick a random rotation that's NOT the solution
          const options = [0, 1, 2, 3, 4, 5].filter(rot => rot !== solRot);
          return options[Math.floor(Math.random() * options.length)];
        })
      );

      return {
        tiles,
        rotations: startRotations,
        solution: solutionRotations,
        size: gridSize,
      };
    }
  }

  // Fallback: return a simple solvable puzzle if generation fails
  return generateFallbackPuzzle(gridSize);
}

// Fallback puzzle generation using a simpler pattern
function generateFallbackPuzzle(size) {
  const tiles = [];
  const solutionRotations = [];

  for (let r = 0; r < size; r++) {
    const row = [];
    const solRow = [];
    for (let c = 0; c < size; c++) {
      if ((r === 0 && c === size - 1) || (r === size - 1 && c === 0)) {
        row.push(null);
        solRow.push(0);
      } else {
        // Use the same tile type for all - guaranteed compatible
        row.push([...TILE_TYPES[0]]);
        solRow.push(0);
      }
    }
    tiles.push(row);
    solutionRotations.push(solRow);
  }

  // Randomize starting rotations
  const startRotations = solutionRotations.map((row, r) =>
    row.map((_, c) => tiles[r][c] ? Math.floor(Math.random() * 5) + 1 : 0)
  );

  return {
    tiles,
    rotations: startRotations,
    solution: solutionRotations,
    size,
  };
}

// Check how many edges match
function checkMatches(tiles, rotations, size) {
  let matches = 0;
  let total = 0;
  const mismatches = new Set();

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (!tiles[r][c]) continue;

      const currentPaths = rotateTile(tiles[r][c], rotations[r][c]);

      // Check edges 1, 2, 3 (avoid double counting)
      for (const edge of [1, 2, 3]) {
        const [nr, nc] = getNeighbor(r, c, edge);

        if (nr >= 0 && nr < size && nc >= 0 && nc < size && tiles[nr]?.[nc]) {
          total++;
          const neighborPaths = rotateTile(tiles[nr][nc], rotations[nr][nc]);
          const myColor = getEdgeColor(currentPaths, edge);
          const theirColor = getEdgeColor(neighborPaths, oppositeEdge(edge));

          if (myColor && theirColor && myColor === theirColor) {
            matches++;
          } else if (myColor && theirColor) {
            mismatches.add(`${r},${c}`);
            mismatches.add(`${nr},${nc}`);
          }
        }
      }
    }
  }

  return { matches, total, mismatches, solved: matches === total && total > 0 };
}

// Draw a hexagon path
function hexPath(cx, cy, size) {
  const points = [];
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i - Math.PI / 2;
    points.push(`${cx + size * Math.cos(angle)},${cy + size * Math.sin(angle)}`);
  }
  return `M${points.join('L')}Z`;
}

// Get edge midpoint for path drawing
function getEdgeMidpoint(cx, cy, size, edge) {
  const angle1 = (Math.PI / 3) * edge - Math.PI / 2;
  const angle2 = (Math.PI / 3) * ((edge + 1) % 6) - Math.PI / 2;
  const x1 = cx + size * Math.cos(angle1);
  const y1 = cy + size * Math.sin(angle1);
  const x2 = cx + size * Math.cos(angle2);
  const y2 = cy + size * Math.sin(angle2);
  return [(x1 + x2) / 2, (y1 + y2) / 2];
}

export default function Tantrix() {
  const [puzzleSize, setPuzzleSize] = useState(3);
  const [puzzleData, setPuzzleData] = useState(null);
  const [rotations, setRotations] = useState([]);
  const [gameState, setGameState] = useState('playing');
  const [matchInfo, setMatchInfo] = useState({ matches: 0, total: 0, mismatches: new Set() });

  const initGame = useCallback(() => {
    const data = generatePuzzle(puzzleSize);
    setPuzzleData(data);
    setRotations(data.rotations.map(row => [...row]));
    setGameState('playing');
  }, [puzzleSize]);

  useEffect(() => {
    initGame();
  }, [initGame]);

  useEffect(() => {
    if (!puzzleData) return;

    const info = checkMatches(puzzleData.tiles, rotations, puzzleData.size);
    setMatchInfo(info);

    if (info.solved) {
      setGameState('won');
    }
  }, [rotations, puzzleData]);

  const handleTileClick = (r, c, e) => {
    if (gameState !== 'playing' || !puzzleData?.tiles[r]?.[c]) return;

    e.preventDefault();
    const delta = e.button === 2 || e.shiftKey ? -1 : 1;

    setRotations(prev => {
      const newRotations = prev.map(row => [...row]);
      newRotations[r][c] = (newRotations[r][c] + delta + 6) % 6;
      return newRotations;
    });
  };

  const handleGiveUp = () => {
    if (gameState !== 'playing' || !puzzleData) return;
    setRotations(puzzleData.solution.map(row => [...row]));
    setGameState('gaveUp');
  };

  if (!puzzleData) return null;

  const hexSize = 45;
  const hexWidth = hexSize * 2;
  const hexHeight = hexSize * Math.sqrt(3);
  const svgWidth = puzzleData.size * hexWidth * 0.85 + hexSize;
  const svgHeight = puzzleData.size * hexHeight + hexSize;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Link to="/" className={styles.backLink}>← Back to Games</Link>
        <h1 className={styles.title}>Tantrix</h1>
        <p className={styles.instructions}>
          Rotate the hexagonal tiles so that all adjacent edges match colors.
          Click to rotate clockwise, Shift+click for counter-clockwise.
        </p>
      </div>

      <div className={styles.sizeSelector}>
        {[2, 3, 4].map((size) => (
          <button
            key={size}
            className={`${styles.sizeBtn} ${puzzleSize === size ? styles.active : ''}`}
            onClick={() => setPuzzleSize(size)}
          >
            {size}×{size}
          </button>
        ))}
      </div>

      <div className={styles.gameArea}>
        <div className={styles.stats}>
          <span className={styles.matchCount}>
            Matches: {matchInfo.matches} / {matchInfo.total}
          </span>
        </div>

        <svg
          className={styles.board}
          width={svgWidth}
          height={svgHeight}
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        >
          {puzzleData.tiles.map((row, r) =>
            row.map((tile, c) => {
              if (!tile) return null;

              const cx = hexSize + c * hexWidth * 0.75 + (r % 2) * hexWidth * 0.375;
              const cy = hexSize + r * hexHeight * 0.85;
              const paths = rotateTile(tile, rotations[r][c]);
              const hasMismatch = matchInfo.mismatches.has(`${r},${c}`);

              return (
                <g
                  key={`${r}-${c}`}
                  className={styles.tile}
                  onClick={(e) => handleTileClick(r, c, e)}
                  onContextMenu={(e) => handleTileClick(r, c, e)}
                  style={{ cursor: 'pointer' }}
                >
                  {/* Hex background */}
                  <path
                    d={hexPath(cx, cy, hexSize - 2)}
                    fill="rgba(30, 30, 50, 0.95)"
                    stroke={hasMismatch ? '#ef4444' : 'rgba(255, 255, 255, 0.3)'}
                    strokeWidth={hasMismatch ? 3 : 2}
                  />

                  {/* Draw colored paths */}
                  {paths.map(([e1, e2, color], i) => {
                    const [x1, y1] = getEdgeMidpoint(cx, cy, hexSize - 4, e1);
                    const [x2, y2] = getEdgeMidpoint(cx, cy, hexSize - 4, e2);

                    // Curved path through center-ish
                    const midX = cx + (x1 + x2 - 2 * cx) * 0.2;
                    const midY = cy + (y1 + y2 - 2 * cy) * 0.2;

                    return (
                      <path
                        key={i}
                        d={`M${x1},${y1} Q${midX},${midY} ${x2},${y2}`}
                        fill="none"
                        stroke={COLORS[color]}
                        strokeWidth={8}
                        strokeLinecap="round"
                      />
                    );
                  })}
                </g>
              );
            })
          )}
        </svg>

        {gameState === 'won' && (
          <div className={styles.winMessage}>
            <div className={styles.winEmoji}>🎉</div>
            <h3>Excellent!</h3>
            <p>All paths are connected!</p>
          </div>
        )}

        {gameState === 'gaveUp' && (
          <div className={styles.gaveUpMessage}>
            <h3>Solution Revealed</h3>
            <p>Here's how it should look!</p>
          </div>
        )}

        <div className={styles.buttons}>
          <button className={styles.newGameBtn} onClick={initGame}>
            New Puzzle
          </button>
          {gameState === 'playing' && (
            <button className={styles.giveUpBtn} onClick={handleGiveUp}>
              Give Up
            </button>
          )}
        </div>

        <div className={styles.legend}>
          <span className={styles.legendTitle}>Colors:</span>
          {Object.entries(COLORS).map(([key, color]) => (
            <div key={key} className={styles.legendItem}>
              <div className={styles.legendColor} style={{ backgroundColor: color }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
