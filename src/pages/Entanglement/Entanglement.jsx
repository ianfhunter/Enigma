import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import GameHeader from '../../components/GameHeader';
import { getGameGradient } from '../../data/gameRegistry';
import styles from './Entanglement.module.css';

// Hex grid config
const RADIUS = 4; // 61 cells
const HEX_SIZE = 32;

// Axial directions (pointy-top)
const DIRS = [
  [1, 0],
  [1, -1],
  [0, -1],
  [-1, 0],
  [-1, 1],
  [0, 1],
];

function keyOf(q, r) {
  return `${q},${r}`;
}

function inBoard(q, r) {
  return Math.abs(q) <= RADIUS && Math.abs(r) <= RADIUS && Math.abs(q + r) <= RADIUS;
}

function neighbor(q, r, dir) {
  const [dq, dr] = DIRS[dir];
  return { q: q + dq, r: r + dr };
}

function oppositeSide(side) {
  return (side + 3) % 6;
}

function axialToPixel(q, r) {
  // pointy-top axial
  const x = HEX_SIZE * Math.sqrt(3) * (q + r / 2);
  const y = HEX_SIZE * (3 / 2) * r;
  return { x, y };
}

function hexPoints(cx, cy) {
  const pts = [];
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 180) * (60 * i - 30); // pointy-top
    pts.push([cx + HEX_SIZE * Math.cos(angle), cy + HEX_SIZE * Math.sin(angle)]);
  }
  return pts.map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`).join(' ');
}

function sideMidpoint(cx, cy, side) {
  const angle = (Math.PI / 180) * (60 * side - 30);
  return {
    x: cx + HEX_SIZE * Math.cos(angle),
    y: cy + HEX_SIZE * Math.sin(angle),
  };
}

// Generate all perfect matchings of 6 sides (0..5)
function generateMatchings() {
  const sides = [0, 1, 2, 3, 4, 5];
  const results = [];

  function rec(remaining, pairs) {
    if (remaining.length === 0) {
      const map = Array(6).fill(-1);
      for (const [a, b] of pairs) {
        map[a] = b;
        map[b] = a;
      }
      results.push(map);
      return;
    }
    const [first, ...rest] = remaining;
    for (let i = 0; i < rest.length; i++) {
      const second = rest[i];
      const nextRemaining = rest.filter((_, idx) => idx !== i);
      rec(nextRemaining, [...pairs, [first, second]]);
    }
  }

  rec(sides, []);
  return results;
}

function rotatedExit(baseMap, rot, entrySide) {
  // Rotate the tile by rot steps clockwise.
  // entrySide in rotated frame -> map to base frame, lookup, then rotate back.
  const baseEntry = (entrySide - rot + 6) % 6;
  const baseExit = baseMap[baseEntry];
  return (baseExit + rot) % 6;
}

function randomInt(max) {
  return Math.floor(Math.random() * max);
}

function computeBoardCells() {
  const cells = [];
  for (let q = -RADIUS; q <= RADIUS; q++) {
    for (let r = -RADIUS; r <= RADIUS; r++) {
      if (inBoard(q, r)) cells.push({ q, r, key: keyOf(q, r) });
    }
  }
  return cells;
}

const TILE_TYPES = generateMatchings();
const CELLS = computeBoardCells();

function makeNewGameState(tileTypes) {
  const board = new Map();
  board.set(keyOf(0, 0), { typeIdx: randomInt(tileTypes.length), rot: randomInt(6) });

  // Choose an arbitrary starting "entry side" into the center tile.
  const startEntry = randomInt(6);
  const initial = traverseForward({ q: 0, r: 0 }, startEntry, board, tileTypes);

  return {
    board,
    visited: new Set(initial.visitedKeys),
    frontier: initial.frontier,
    nextTileIdx: randomInt(tileTypes.length),
    nextRot: 0,
    gameOverReason: initial.ended,
  };
}

function traverseForward(startCell, entrySide, board, tileTypes) {
  const visitedKeys = [];
  const visitedDirected = new Set(); // `${key}:${entrySide}`

  let q = startCell.q;
  let r = startCell.r;
  let entry = entrySide;

  while (true) {
    if (!inBoard(q, r)) {
      return { visitedKeys, frontier: null, ended: 'escaped' };
    }

    const k = keyOf(q, r);
    const directedKey = `${k}:${entry}`;
    if (visitedDirected.has(directedKey)) {
      // Loop detected: path is now closed.
      return { visitedKeys, frontier: null, ended: 'loop' };
    }
    visitedDirected.add(directedKey);

    const tile = board.get(k);
    if (!tile) {
      return { visitedKeys, frontier: { q, r, entrySide: entry }, ended: null };
    }

    visitedKeys.push(k);
    const exit = rotatedExit(tileTypes[tile.typeIdx], tile.rot, entry);
    const next = neighbor(q, r, exit);
    q = next.q;
    r = next.r;
    entry = oppositeSide(exit);
  }
}

function drawTilePaths(cx, cy, baseMap, rot, stroke, strokeWidth) {
  const used = new Set();
  const paths = [];
  for (let s = 0; s < 6; s++) {
    if (used.has(s)) continue;
    const t = baseMap[s];
    used.add(s);
    used.add(t);

    // Rotate endpoints
    const a = (s + rot) % 6;
    const b = (t + rot) % 6;
    const p1 = sideMidpoint(cx, cy, a);
    const p2 = sideMidpoint(cx, cy, b);

    // Simple quadratic curve via center. (Not the exact Entanglement artwork, but readable.)
    const d = `M ${p1.x.toFixed(2)} ${p1.y.toFixed(2)} Q ${cx.toFixed(2)} ${cy.toFixed(2)} ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`;
    paths.push(
      <path
        key={`${a}-${b}`}
        d={d}
        fill="none"
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={0.9}
      />
    );
  }
  return paths;
}

export default function Entanglement() {
  const gradient = getGameGradient('entanglement');

  const tileTypes = TILE_TYPES;
  const cells = CELLS;

  const [game, setGame] = useState(() => makeNewGameState(tileTypes));
  const { board, frontier, nextTileIdx, nextRot, visited, gameOverReason } = game;

  const svgRef = useRef(null);

  const newGame = useCallback(() => {
    setGame(makeNewGameState(tileTypes));
  }, [tileTypes]);

  const score = visited.size;

  const rotateLeft = useCallback(() => {
    setGame(g => ({ ...g, nextRot: (g.nextRot + 5) % 6 }));
  }, []);
  const rotateRight = useCallback(() => {
    setGame(g => ({ ...g, nextRot: (g.nextRot + 1) % 6 }));
  }, []);

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') rotateLeft();
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') rotateRight();
      if (e.key === 'r' || e.key === 'R') newGame();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [newGame, rotateLeft, rotateRight]);

  const canPlay = !!frontier && !gameOverReason;

  const placeTile = useCallback((q, r) => {
    setGame(g => {
      if (!g.frontier || g.gameOverReason) return g;
      if (q !== g.frontier.q || r !== g.frontier.r) return g;

      const k = keyOf(q, r);
      if (g.board.has(k)) return g;

      const b2 = new Map(g.board);
      b2.set(k, { typeIdx: g.nextTileIdx, rot: g.nextRot });

      const step = traverseForward({ q, r }, g.frontier.entrySide, b2, tileTypes);
      const v2 = new Set(g.visited);
      for (const vk of step.visitedKeys) v2.add(vk);

      return {
        ...g,
        board: b2,
        visited: v2,
        frontier: step.frontier,
        gameOverReason: step.ended,
        nextTileIdx: randomInt(tileTypes.length),
        nextRot: 0,
      };
    });
  }, [tileTypes]);

  // Compute SVG bounds
  const points = useMemo(() => {
    const px = cells.map(c => axialToPixel(c.q, c.r));
    const xs = px.map(p => p.x);
    const ys = px.map(p => p.y);
    const pad = HEX_SIZE * 1.2;
    const minX = Math.min(...xs) - pad;
    const maxX = Math.max(...xs) + pad;
    const minY = Math.min(...ys) - pad;
    const maxY = Math.max(...ys) + pad;
    return { minX, minY, width: maxX - minX, height: maxY - minY };
  }, [cells]);

  const instructions = (
    <>
      Place the next hex tile on the highlighted cell to keep the path going. Rotate with{' '}
      <span className={styles.pill}>←</span>/<span className={styles.pill}>→</span> (or{' '}
      <span className={styles.pill}>A</span>/<span className={styles.pill}>D</span>). Restart with{' '}
      <span className={styles.pill}>R</span>.
    </>
  );

  return (
    <div className={styles.page}>
      <GameHeader
        title="Entanglement"
        instructions={instructions}
        gradient={gradient}
      />

      <div className={styles.topBar}>
        <div className={styles.panel}>
          <div className={styles.statsRow}>
            <div className={styles.stat}>
              <span className={styles.label}>Score</span>
              <span className={styles.value}>{score}</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.label}>Next tile</span>
              <span className={styles.value}>#{nextTileIdx + 1}</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.label}>Rotation</span>
              <span className={styles.value}>{nextRot * 60}°</span>
            </div>
          </div>

          {gameOverReason && (
            <div className={styles.gameOver}>
              Game over —{' '}
              <span className={styles.subtle}>
                {gameOverReason === 'escaped' ? 'the path escaped the board' : 'you formed a loop'}
              </span>
            </div>
          )}

          <div className={styles.help}>
            Tip: Only the highlighted cell is placeable — it’s where the path is about to enter.
          </div>
        </div>

        <div className={styles.controls}>
          <button className={styles.button} onClick={rotateLeft} disabled={!canPlay}>
            Rotate Left
          </button>
          <button className={styles.button} onClick={rotateRight} disabled={!canPlay}>
            Rotate Right
          </button>
          <button className={styles.button} onClick={newGame}>
            New Game
          </button>
        </div>
      </div>

      <div className={styles.gameArea}>
        <div className={styles.board}>
          <svg
            ref={svgRef}
            className={styles.boardInner}
            viewBox={`${points.minX} ${points.minY} ${points.width} ${points.height}`}
            role="img"
            aria-label="Entanglement board"
          >
            <rect
              x={points.minX}
              y={points.minY}
              width={points.width}
              height={points.height}
              fill="transparent"
            />

            {cells.map(({ q, r, key }) => {
              const { x, y } = axialToPixel(q, r);
              const tile = board.get(key);
              const isVisited = visited.has(key);
              const isFrontier = frontier && frontier.q === q && frontier.r === r && !tile;

              const stroke = isFrontier ? '#fbbf24' : 'rgba(255,255,255,0.18)';
              const fill = isVisited
                ? 'rgba(168, 85, 247, 0.12)'
                : 'rgba(255,255,255,0.03)';

              const onClick = () => placeTile(q, r);

              return (
                <g key={key} onClick={onClick} style={{ cursor: isFrontier && canPlay ? 'pointer' : 'default' }}>
                  <polygon
                    points={hexPoints(x, y)}
                    fill={fill}
                    stroke={stroke}
                    strokeWidth={isFrontier ? 2.4 : 1.1}
                  />

                  {tile && (
                    <>
                      {drawTilePaths(
                        x,
                        y,
                        tileTypes[tile.typeIdx],
                        tile.rot,
                        isVisited ? 'rgba(34,211,238,0.95)' : 'rgba(255,255,255,0.65)',
                        isVisited ? 4 : 3
                      )}
                    </>
                  )}

                  {isFrontier && (
                    (() => {
                      const entryMid = sideMidpoint(x, y, frontier.entrySide);
                      return (
                        <>
                          <circle cx={x} cy={y} r={5.2} fill="#fbbf24" opacity={0.95} />
                          <line
                            x1={x}
                            y1={y}
                            x2={entryMid.x}
                            y2={entryMid.y}
                            stroke="#fbbf24"
                            strokeWidth={3}
                            strokeLinecap="round"
                            opacity={0.9}
                          />
                        </>
                      );
                    })()
                  )}
                </g>
              );
            })}

            {/* Next tile preview (top-right in viewBox space) */}
            {(() => {
              const previewPos = { x: points.minX + points.width - HEX_SIZE * 2.4, y: points.minY + HEX_SIZE * 2.0 };
              return (
                <g opacity={canPlay ? 1 : 0.6}>
                  <polygon
                    points={hexPoints(previewPos.x, previewPos.y)}
                    fill="rgba(255,255,255,0.05)"
                    stroke="rgba(255,255,255,0.25)"
                    strokeWidth={1.2}
                  />
                  {drawTilePaths(
                    previewPos.x,
                    previewPos.y,
                    tileTypes[nextTileIdx],
                    nextRot,
                    'rgba(255,255,255,0.85)',
                    3.2
                  )}
                </g>
              );
            })()}
          </svg>
        </div>
      </div>
    </div>
  );
}

