import { useState, useEffect, useCallback, useRef } from 'react';
import GameHeader from '../../components/GameHeader';
import SizeSelector from '../../components/SizeSelector';
import StatsPanel from '../../components/StatsPanel';
import GiveUpButton from '../../components/GiveUpButton';
import GameResult from '../../components/GameResult';
import styles from './Cirkitz.module.css';

// Cirkitz - hexagonal tile puzzle with colored wedges
// Each tile has 6 wedges emanating from a central lightning bolt
// Goal: rotate tiles so all adjacent wedges match colors

const COLORS = {
  M: '#f472b6', // Soft Magenta/Pink
  S: '#38bdf8', // Sky Blue
  A: '#fbbf24', // Amber/Gold
  E: '#34d399', // Emerald/Mint
};

const COLOR_GLOWS = {
  M: 'rgba(244, 114, 182, 0.6)',
  S: 'rgba(56, 189, 248, 0.6)',
  A: 'rgba(251, 191, 36, 0.6)',
  E: 'rgba(52, 211, 153, 0.6)',
};

// Tile definitions: each tile has 3 paths, each path connects 2 edges (0-5, clockwise from top)
// Format: [[edge1, edge2, color], [edge1, edge2, color], [edge1, edge2, color]]
const TILE_TYPES = [
  [[0, 3, 'M'], [1, 5, 'S'], [2, 4, 'A']], // Opposite pairs
  [[0, 2, 'M'], [1, 4, 'S'], [3, 5, 'A']], // Skip-one pairs
  [[0, 1, 'M'], [2, 5, 'S'], [3, 4, 'A']], // Mixed
  [[0, 4, 'M'], [1, 3, 'S'], [2, 5, 'A']], // Mixed 2
  [[0, 5, 'M'], [1, 2, 'S'], [3, 4, 'E']], // With emerald
  [[0, 3, 'S'], [1, 4, 'M'], [2, 5, 'E']], // Different combo
  [[0, 2, 'A'], [1, 5, 'E'], [3, 4, 'M']], // Another combo
  [[0, 1, 'S'], [2, 3, 'A'], [4, 5, 'E']], // All adjacent pairs
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

// Get the connected edge for a given edge (the other end of the path)
function getConnectedEdge(paths, edge) {
  for (const [e1, e2] of paths) {
    if (e1 === edge) return e2;
    if (e2 === edge) return e1;
  }
  return null;
}

// Hex grid neighbor directions (pointy-top hexagons, odd-r offset coordinates)
function getNeighbor(row, col, edge) {
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

// Opposite edge
function oppositeEdge(edge) {
  return (edge + 3) % 6;
}

// Check if a tile at given rotation is compatible with already-placed neighbors
function isCompatible(tiles, solutionRotations, r, c, tileType, rotation, size) {
  const paths = rotateTile(tileType, rotation);

  for (let edge = 0; edge < 6; edge++) {
    const [nr, nc] = getNeighbor(r, c, edge);

    if (nr < 0 || nr >= size || nc < 0 || nc >= size) continue;
    if (!tiles[nr]?.[nc]) continue;

    const neighborPaths = rotateTile(tiles[nr][nc], solutionRotations[nr][nc]);
    const myColor = getEdgeColor(paths, edge);
    const theirColor = getEdgeColor(neighborPaths, oppositeEdge(edge));

    if (myColor && theirColor && myColor !== theirColor) {
      return false;
    }
  }

  return true;
}

// Find a valid tile and rotation for a position
function findValidTile(tiles, solutionRotations, r, c, size) {
  const shuffledTypes = [...TILE_TYPES].sort(() => Math.random() - 0.5);

  for (const tileType of shuffledTypes) {
    const rotations = [0, 1, 2, 3, 4, 5].sort(() => Math.random() - 0.5);

    for (const rotation of rotations) {
      if (isCompatible(tiles, solutionRotations, r, c, tileType, rotation, size)) {
        return { tileType: [...tileType], rotation };
      }
    }
  }

  return null;
}

// Generate a puzzle
function generatePuzzle(size = 3) {
  const gridSize = size;
  const maxAttempts = 50;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const tiles = [];
    const solutionRotations = [];
    let success = true;

    for (let r = 0; r < gridSize; r++) {
      tiles.push(new Array(gridSize).fill(null));
      solutionRotations.push(new Array(gridSize).fill(0));
    }

    for (let r = 0; r < gridSize && success; r++) {
      for (let c = 0; c < gridSize && success; c++) {
        if (r === 0 && c === gridSize - 1) continue;
        if (r === gridSize - 1 && c === 0) continue;

        const result = findValidTile(tiles, solutionRotations, r, c, gridSize);

        if (result) {
          tiles[r][c] = result.tileType;
          solutionRotations[r][c] = result.rotation;
        } else {
          success = false;
        }
      }
    }

    if (success) {
      const startRotations = solutionRotations.map((row, r) =>
        row.map((solRot, c) => {
          if (!tiles[r][c]) return 0;
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

  return generateFallbackPuzzle(gridSize);
}

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
        row.push([...TILE_TYPES[0]]);
        solRow.push(0);
      }
    }
    tiles.push(row);
    solutionRotations.push(solRow);
  }

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

// Check matches and find connected paths
function checkMatches(tiles, rotations, size) {
  let matches = 0;
  let total = 0;
  const mismatches = new Set();
  const connections = []; // [{r1, c1, edge1, r2, c2, edge2, color}]
  const poweredTiles = new Set(); // Tiles where ALL adjacent edges match

  // First pass: count matches and find connections
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (!tiles[r][c]) continue;

      const currentPaths = rotateTile(tiles[r][c], rotations[r][c]);

      for (const edge of [1, 2, 3]) {
        const [nr, nc] = getNeighbor(r, c, edge);

        if (nr >= 0 && nr < size && nc >= 0 && nc < size && tiles[nr]?.[nc]) {
          total++;
          const neighborPaths = rotateTile(tiles[nr][nc], rotations[nr][nc]);
          const myColor = getEdgeColor(currentPaths, edge);
          const theirColor = getEdgeColor(neighborPaths, oppositeEdge(edge));

          if (myColor && theirColor && myColor === theirColor) {
            matches++;
            connections.push({
              r1: r, c1: c, edge1: edge,
              r2: nr, c2: nc, edge2: oppositeEdge(edge),
              color: myColor
            });
          } else if (myColor && theirColor) {
            mismatches.add(`${r},${c}`);
            mismatches.add(`${nr},${nc}`);
          }
        }
      }
    }
  }

  // Second pass: determine which tiles have ALL adjacent edges matching (powered)
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (!tiles[r][c]) continue;

      const currentPaths = rotateTile(tiles[r][c], rotations[r][c]);
      let allMatch = true;
      let hasNeighbor = false;

      for (let edge = 0; edge < 6; edge++) {
        const [nr, nc] = getNeighbor(r, c, edge);

        if (nr >= 0 && nr < size && nc >= 0 && nc < size && tiles[nr]?.[nc]) {
          hasNeighbor = true;
          const neighborPaths = rotateTile(tiles[nr][nc], rotations[nr][nc]);
          const myColor = getEdgeColor(currentPaths, edge);
          const theirColor = getEdgeColor(neighborPaths, oppositeEdge(edge));

          if (myColor !== theirColor) {
            allMatch = false;
            break;
          }
        }
      }

      if (hasNeighbor && allMatch) {
        poweredTiles.add(`${r},${c}`);
      }
    }
  }

  return { matches, total, mismatches, connections, poweredTiles, solved: matches === total && total > 0 };
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

// Get vertex positions of hexagon
function getHexVertex(cx, cy, size, vertexIndex) {
  const angle = (Math.PI / 3) * vertexIndex - Math.PI / 2;
  return [cx + size * Math.cos(angle), cy + size * Math.sin(angle)];
}

// Create a wedge path from center to an edge
function wedgePath(cx, cy, size, edgeIndex) {
  const v1 = getHexVertex(cx, cy, size, edgeIndex);
  const v2 = getHexVertex(cx, cy, size, (edgeIndex + 1) % 6);
  return `M${cx},${cy} L${v1[0]},${v1[1]} L${v2[0]},${v2[1]} Z`;
}

// Lightning bolt SVG path for the center
function lightningBoltPath(cx, cy, size) {
  const s = size * 0.4;
  return `
    M${cx - s * 0.2},${cy - s * 0.8}
    L${cx + s * 0.4},${cy - s * 0.8}
    L${cx + s * 0.1},${cy - s * 0.1}
    L${cx + s * 0.5},${cy - s * 0.1}
    L${cx - s * 0.3},${cy + s * 0.9}
    L${cx},${cy + s * 0.1}
    L${cx - s * 0.4},${cy + s * 0.1}
    Z
  `;
}

// Export helpers for testing
export {
  COLORS,
  TILE_TYPES,
  rotateTile,
  getEdgeColor,
  getNeighbor,
  oppositeEdge,
  generatePuzzle,
  checkMatches,
};

export default function Cirkitz() {
  const [puzzleSize, setPuzzleSize] = useState(3);
  const [puzzleData, setPuzzleData] = useState(null);
  const [rotations, setRotations] = useState([]);
  const [gameState, setGameState] = useState('playing');
  const [matchInfo, setMatchInfo] = useState({ matches: 0, total: 0, mismatches: new Set(), connections: [], poweredTiles: new Set() });
  const [animatingTile, setAnimatingTile] = useState(null);
  const prevConnectionsRef = useRef([]);

  const initGame = useCallback(() => {
    const data = generatePuzzle(puzzleSize);
    setPuzzleData(data);
    setRotations(data.rotations.map(row => [...row]));
    setGameState('playing');
    prevConnectionsRef.current = [];
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

    setAnimatingTile(`${r}-${c}`);
    setTimeout(() => setAnimatingTile(null), 300);

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

  const hexSize = 48;
  const hexWidth = hexSize * 2;
  const hexHeight = hexSize * Math.sqrt(3);
  const hSpacing = 1.06; // Horizontal spacing multiplier
  const vSpacing = 0.88; // Vertical spacing multiplier
  const svgWidth = puzzleData.size * hexWidth * 0.85 * hSpacing + hexSize * 2;
  const svgHeight = puzzleData.size * hexHeight * vSpacing + hexSize * 1.5;

  // Calculate tile centers for connection animations
  const getTileCenter = (r, c) => {
    const cx = hexSize * 1.3 + c * hexWidth * 0.77 * hSpacing + (r % 2) * hexWidth * 0.385 * hSpacing;
    const cy = hexSize * 1.1 + r * hexHeight * vSpacing;
    return { cx, cy };
  };

  return (
    <div className={styles.container}>
      <GameHeader
        title="Cirkitz"
        instructions="Rotate the tiles so all adjacent wedges match colors. Click to rotate clockwise, Shift+click for counter-clockwise."
      />

      <SizeSelector
        sizes={[3, 4, 5]}
        currentSize={puzzleSize}
        onSizeChange={setPuzzleSize}
      />

      <div className={styles.gameArea}>
        <StatsPanel
          stats={[
            { label: '⚡ Connections', value: `${matchInfo.matches} / ${matchInfo.total}` }
          ]}
          layout="row"
        />

        <svg
          className={styles.board}
          width={svgWidth}
          height={svgHeight}
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        >
          <defs>
            {/* Glow filters for each color */}
            {Object.entries(COLOR_GLOWS).map(([key, glowColor]) => (
              <filter key={key} id={`glow-${key}`} x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            ))}
            {/* Center glow filter */}
            <filter id="centerGlow" x="-100%" y="-100%" width="300%" height="300%">
              <feGaussianBlur stdDeviation="2" result="glow"/>
              <feMerge>
                <feMergeNode in="glow"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
            {/* Radial gradient for tile background */}
            <radialGradient id="tileGradient" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="rgba(40, 40, 60, 0.95)"/>
              <stop offset="100%" stopColor="rgba(20, 20, 35, 0.98)"/>
            </radialGradient>
          </defs>

          {puzzleData.tiles.map((row, r) =>
            row.map((tile, c) => {
              if (!tile) return null;

              const { cx, cy } = getTileCenter(r, c);
              const paths = rotateTile(tile, rotations[r][c]);
              const hasMismatch = matchInfo.mismatches.has(`${r},${c}`);
              const isPowered = matchInfo.poweredTiles.has(`${r},${c}`);
              const isAnimating = animatingTile === `${r}-${c}`;

              // Build edge-to-color mapping
              const edgeColors = {};
              for (const [e1, e2, color] of paths) {
                edgeColors[e1] = color;
                edgeColors[e2] = color;
              }

              return (
                <g
                  key={`${r}-${c}`}
                  className={`${styles.tile} ${isAnimating ? styles.rotating : ''}`}
                  onClick={(e) => handleTileClick(r, c, e)}
                  onContextMenu={(e) => handleTileClick(r, c, e)}
                  style={{ cursor: 'pointer' }}
                >
                  {/* Hex background */}
                  <path
                    d={hexPath(cx, cy, hexSize - 2)}
                    fill="url(#tileGradient)"
                    stroke={hasMismatch ? '#ff3366' : 'rgba(255, 255, 255, 0.15)'}
                    strokeWidth={hasMismatch ? 2 : 1}
                  />

                  {/* Draw colored wedges */}
                  {[0, 1, 2, 3, 4, 5].map((edge) => {
                    const color = edgeColors[edge];
                    if (!color) return null;

                    return (
                      <path
                        key={edge}
                        d={wedgePath(cx, cy, hexSize - 4, edge)}
                        fill={COLORS[color]}
                        fillOpacity={0.85}
                        stroke={COLORS[color]}
                        strokeWidth={1}
                        filter={`url(#glow-${color})`}
                        className={styles.wedge}
                      />
                    );
                  })}

                  {/* Divider lines between wedges */}
                  {[0, 1, 2, 3, 4, 5].map((i) => {
                    const v = getHexVertex(cx, cy, hexSize - 4, i);
                    return (
                      <line
                        key={`div-${i}`}
                        x1={cx} y1={cy}
                        x2={v[0]} y2={v[1]}
                        stroke="rgba(0, 0, 0, 0.5)"
                        strokeWidth={2}
                      />
                    );
                  })}

                  {/* Center lightning bolt circle */}
                  <circle
                    cx={cx}
                    cy={cy}
                    r={hexSize * 0.22}
                    fill={isPowered ? "rgba(25, 25, 40, 0.95)" : "rgba(15, 15, 25, 0.95)"}
                    stroke={isPowered ? "rgba(255, 215, 0, 0.6)" : "rgba(80, 80, 100, 0.4)"}
                    strokeWidth={isPowered ? 2 : 1.5}
                    filter={isPowered ? "url(#centerGlow)" : undefined}
                    className={isPowered ? styles.poweredCircle : styles.unpoweredCircle}
                  />
                  <path
                    d={lightningBoltPath(cx, cy, hexSize * 0.8)}
                    fill={isPowered ? "#ffd700" : "#6a6a7a"}
                    stroke={isPowered ? "#ffaa00" : "#5a5a65"}
                    strokeWidth={0.5}
                    className={isPowered ? styles.lightningBoltPowered : styles.lightningBoltOff}
                  />
                </g>
              );
            })
          )}
        </svg>

        {gameState === 'won' && (
          <GameResult
            status="won"
            title="⚡ Circuit Complete!"
            message="All connections are live!"
            onNewGame={initGame}
            newGameLabel="New Puzzle"
          />
        )}

        {gameState === 'gaveUp' && (
          <GameResult
            status="gaveUp"
            title="Solution Revealed"
            message="Here's how it connects!"
            onNewGame={initGame}
            newGameLabel="New Puzzle"
          />
        )}

        <div className={styles.buttons}>
          <button className={styles.newGameBtn} onClick={initGame}>
            New Puzzle
          </button>
          {gameState === 'playing' && (
            <GiveUpButton onGiveUp={handleGiveUp} />
          )}
        </div>

        <div className={styles.legend}>
          <span className={styles.legendTitle}>Circuits:</span>
          {Object.entries(COLORS).map(([key, color]) => (
            <div key={key} className={styles.legendItem}>
              <div className={styles.legendColor} style={{ backgroundColor: color, boxShadow: `0 0 8px ${color}` }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
