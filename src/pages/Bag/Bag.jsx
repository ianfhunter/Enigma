import { useCallback, useEffect, useMemo, useState } from 'react';
import GameHeader from '../../components/GameHeader';
import styles from './Bag.module.css';
import corralPuzzles from '../../../public/datasets/corralPuzzles.json';

/**
 * Bag (Corral) Puzzle
 *
 * Rules:
 * - Draw a single closed loop along grid edges
 * - All numbered cells must be inside the loop
 * - Each number shows how many cells can be "seen" from that cell
 *   in the 4 orthogonal directions (including itself), where
 *   visibility stops at the loop boundary
 */

const DIFFICULTIES = ['easy', 'medium', 'hard'];

// Get available sizes for a difficulty
function getAvailableSizes(difficulty) {
  const sizes = new Set();
  corralPuzzles.puzzles.forEach(p => {
    if (p.difficulty === difficulty) {
      sizes.add(`${p.rows}×${p.cols}`);
    }
  });
  return Array.from(sizes).sort((a, b) => {
    const [aRows] = a.split('×').map(Number);
    const [bRows] = b.split('×').map(Number);
    return aRows - bRows;
  });
}

// Edge indexing helpers
function idxHEdge(r, c, w) {
  // horizontal edge below row r, between columns c and c+1
  // r in [0..h], c in [0..w-1]
  return r * w + c;
}

function idxVEdge(r, c, w) {
  // vertical edge to the right of column c, between rows r and r+1
  // r in [0..h-1], c in [0..w]
  return r * (w + 1) + c;
}

// Convert solution (inside cells marked with 'x') to edges
function solutionToEdges(solution, w, h) {
  const hEdges = new Array((h + 1) * w).fill(0);
  const vEdges = new Array(h * (w + 1)).fill(0);

  // Build inside cells set
  const insideCells = new Set();
  for (let r = 0; r < h; r++) {
    for (let c = 0; c < w; c++) {
      if (solution[r][c] === 'x') {
        insideCells.add(`${r},${c}`);
      }
    }
  }

  // Build edges from inside cells
  for (const key of insideCells) {
    const [r, c] = key.split(',').map(Number);

    // Top edge: if cell above is not inside
    if (!insideCells.has(`${r - 1},${c}`)) {
      hEdges[idxHEdge(r, c, w)] = 1;
    }
    // Bottom edge: if cell below is not inside
    if (!insideCells.has(`${r + 1},${c}`)) {
      hEdges[idxHEdge(r + 1, c, w)] = 1;
    }
    // Left edge: if cell to left is not inside
    if (!insideCells.has(`${r},${c - 1}`)) {
      vEdges[idxVEdge(r, c, w)] = 1;
    }
    // Right edge: if cell to right is not inside
    if (!insideCells.has(`${r},${c + 1}`)) {
      vEdges[idxVEdge(r, c + 1, w)] = 1;
    }
  }

  return { hEdges, vEdges };
}

// Check if a cell is inside the loop using flood fill from outside
function computeInsideOutside(w, h, hEdges, vEdges) {
  // We'll flood fill from outside the grid to find all outside cells
  // Any cell not reached is inside

  const outside = new Set();
  const visited = new Set();

  // Start from a virtual "border" - we'll check each cell's connectivity to outside
  // A cell is outside if we can reach it from the grid boundary without crossing edges

  const queue = [];

  // Add all boundary-adjacent virtual positions
  // We use a slightly different approach: flood fill on an extended grid
  // where we can move between cells if there's no edge blocking

  // For simplicity, let's use a cell-based flood fill
  // Mark cells reachable from outside (any cell on boundary with no blocking edge)

  // Check boundary cells
  for (let c = 0; c < w; c++) {
    // Top row - can enter if no top edge
    if (hEdges[idxHEdge(0, c, w)] !== 1) {
      queue.push(`0,${c}`);
    }
    // Bottom row - can enter if no bottom edge
    if (hEdges[idxHEdge(h, c, w)] !== 1) {
      queue.push(`${h-1},${c}`);
    }
  }
  for (let r = 0; r < h; r++) {
    // Left column - can enter if no left edge
    if (vEdges[idxVEdge(r, 0, w)] !== 1) {
      queue.push(`${r},0`);
    }
    // Right column - can enter if no right edge
    if (vEdges[idxVEdge(r, w, w)] !== 1) {
      queue.push(`${r},${w-1}`);
    }
  }

  // BFS to find all outside cells
  while (queue.length > 0) {
    const key = queue.shift();
    if (visited.has(key)) continue;
    visited.add(key);
    outside.add(key);

    const [r, c] = key.split(',').map(Number);

    // Try moving in each direction
    // Up: check if there's no horizontal edge between this cell and the one above
    if (r > 0 && hEdges[idxHEdge(r, c, w)] !== 1) {
      const nkey = `${r-1},${c}`;
      if (!visited.has(nkey)) queue.push(nkey);
    }
    // Down
    if (r < h - 1 && hEdges[idxHEdge(r + 1, c, w)] !== 1) {
      const nkey = `${r+1},${c}`;
      if (!visited.has(nkey)) queue.push(nkey);
    }
    // Left
    if (c > 0 && vEdges[idxVEdge(r, c, w)] !== 1) {
      const nkey = `${r},${c-1}`;
      if (!visited.has(nkey)) queue.push(nkey);
    }
    // Right
    if (c < w - 1 && vEdges[idxVEdge(r, c + 1, w)] !== 1) {
      const nkey = `${r},${c+1}`;
      if (!visited.has(nkey)) queue.push(nkey);
    }
  }

  // Also check cells that weren't visited at all - they might be unreachable
  // from any boundary entry point but still need to be classified

  // Build inside set
  const inside = new Set();
  for (let r = 0; r < h; r++) {
    for (let c = 0; c < w; c++) {
      const key = `${r},${c}`;
      if (!outside.has(key)) {
        inside.add(key);
      }
    }
  }

  return { inside, outside };
}

// Calculate visibility from a cell (how many cells can be seen in 4 directions)
function calculateVisibility(r, c, w, h, hEdges, vEdges) {
  let count = 1; // Count self

  // Look up - blocked by horizontal edge at row r (top of current cell)
  for (let nr = r - 1; nr >= 0; nr--) {
    if (hEdges[idxHEdge(nr + 1, c, w)] === 1) break;
    count++;
  }
  // Look down - blocked by horizontal edge at row r+1 (bottom of current cell)
  for (let nr = r + 1; nr < h; nr++) {
    if (hEdges[idxHEdge(nr, c, w)] === 1) break;
    count++;
  }
  // Look left - blocked by vertical edge at column c (left of current cell)
  for (let nc = c - 1; nc >= 0; nc--) {
    if (vEdges[idxVEdge(r, nc + 1, w)] === 1) break;
    count++;
  }
  // Look right - blocked by vertical edge at column c+1 (right of current cell)
  for (let nc = c + 1; nc < w; nc++) {
    if (vEdges[idxVEdge(r, nc, w)] === 1) break;
    count++;
  }

  return count;
}

// Analyze the current state
function analyze(w, h, clues, hEdges, vEdges) {
  const clueBad = new Set();
  const { inside } = computeInsideOutside(w, h, hEdges, vEdges);

  // Check clue satisfaction
  for (let r = 0; r < h; r++) {
    for (let c = 0; c < w; c++) {
      const clue = clues[r * w + c];
      if (clue === null) continue;

      const key = `${r},${c}`;
      // Clue cells must be inside
      if (!inside.has(key)) {
        clueBad.add(r * w + c);
        continue;
      }

      // Check visibility matches clue
      const visibility = calculateVisibility(r, c, w, h, hEdges, vEdges);
      if (visibility !== clue) {
        clueBad.add(r * w + c);
      }
    }
  }

  // Check if edges form a valid single loop
  // Build vertex degrees
  const deg = new Array((h + 1) * (w + 1)).fill(0);
  const adj = Array.from({ length: (h + 1) * (w + 1) }, () => []);
  let edgeCount = 0;

  const vtx = (r, c) => r * (w + 1) + c;

  // Horizontal edges
  for (let r = 0; r <= h; r++) {
    for (let c = 0; c < w; c++) {
      if (hEdges[idxHEdge(r, c, w)] !== 1) continue;
      const a = vtx(r, c);
      const b = vtx(r, c + 1);
      deg[a]++; deg[b]++;
      adj[a].push(b); adj[b].push(a);
      edgeCount++;
    }
  }
  // Vertical edges
  for (let r = 0; r < h; r++) {
    for (let c = 0; c <= w; c++) {
      if (vEdges[idxVEdge(r, c, w)] !== 1) continue;
      const a = vtx(r, c);
      const b = vtx(r + 1, c);
      deg[a]++; deg[b]++;
      adj[a].push(b); adj[b].push(a);
      edgeCount++;
    }
  }

  const active = [];
  for (let i = 0; i < deg.length; i++) if (deg[i] > 0) active.push(i);

  let loopOk = false;
  if (active.length > 0) {
    // All active vertices must have degree 2
    const degreesOk = active.every((i) => deg[i] === 2);
    if (degreesOk) {
      // Check connectivity
      const seen = new Set();
      const stack = [active[0]];
      seen.add(active[0]);
      while (stack.length) {
        const u = stack.pop();
        for (const v of adj[u]) {
          if (!seen.has(v)) { seen.add(v); stack.push(v); }
        }
      }
      const connected = active.every((i) => seen.has(i));
      // Single cycle: edges == vertices in connected subgraph
      if (connected && edgeCount === active.length) loopOk = true;
    }
  }

  // Puzzle is solved when:
  // 1. There's a valid single loop
  // 2. All clues are satisfied (inside loop and correct visibility)
  const solved = clueBad.size === 0 && loopOk && edgeCount > 0;

  return { clueBad, loopOk, solved, inside, edgeCount };
}

export default function Bag() {
  const [difficulty, setDifficulty] = useState('easy');
  const [availableSizes, setAvailableSizes] = useState(() => getAvailableSizes('easy'));
  const [sizeKey, setSizeKey] = useState(() => {
    const sizes = getAvailableSizes('easy');
    return sizes[0] || '10×10';
  });

  const [puz, setPuz] = useState(null);
  const [hEdges, setHEdges] = useState([]);
  const [vEdges, setVEdges] = useState([]);

  const initGame = useCallback(() => {
    // Parse size from sizeKey
    const [rows, cols] = sizeKey.split('×').map(Number);

    // Filter puzzles by difficulty and size
    const matching = corralPuzzles.puzzles.filter(p =>
      p.difficulty === difficulty && p.rows === rows && p.cols === cols
    );

    if (matching.length === 0) {
      console.error('No puzzles found for', difficulty, sizeKey);
      return;
    }

    // Pick a random puzzle
    const puzzle = matching[Math.floor(Math.random() * matching.length)];

    // Convert 2D clues array to 1D array
    const clues = [];
    for (let r = 0; r < puzzle.rows; r++) {
      for (let c = 0; c < puzzle.cols; c++) {
        clues.push(puzzle.clues[r][c]);
      }
    }

    // Convert solution to edges
    const solutionEdges = solutionToEdges(puzzle.solution, puzzle.cols, puzzle.rows);

    setPuz({
      w: puzzle.cols,
      h: puzzle.rows,
      clues,
      solution: solutionEdges
    });
    setHEdges(new Array((puzzle.rows + 1) * puzzle.cols).fill(0));
    setVEdges(new Array(puzzle.rows * (puzzle.cols + 1)).fill(0));
  }, [difficulty, sizeKey]);

  useEffect(() => {
    initGame();
  }, [initGame]);

  // Update available sizes when difficulty changes
  useEffect(() => {
    const sizes = getAvailableSizes(difficulty);
    setAvailableSizes(sizes);
    if (!sizes.includes(sizeKey)) {
      setSizeKey(sizes[0] || '10×10');
    }
  }, [difficulty]);

  const { clueBad, loopOk, solved, inside, edgeCount } = useMemo(
    () => {
      if (!puz) return { clueBad: new Set(), loopOk: false, solved: false, inside: new Set(), edgeCount: 0 };
      return analyze(puz.w, puz.h, puz.clues, hEdges, vEdges);
    },
    [puz, hEdges, vEdges],
  );

  const cell = 44;
  const pad = 30;

  const toggleEdge = (kind, r, c, dir) => {
    if (!puz) return;
    if (kind === 'h') {
      const i = idxHEdge(r, c, puz.w);
      setHEdges((prev) => {
        const n = prev.slice();
        const cur = n[i];
        if (dir === 'on') n[i] = cur === 1 ? 0 : 1;
        else n[i] = cur === -1 ? 0 : -1;
        return n;
      });
    } else {
      const i = idxVEdge(r, c, puz.w);
      setVEdges((prev) => {
        const n = prev.slice();
        const cur = n[i];
        if (dir === 'on') n[i] = cur === 1 ? 0 : 1;
        else n[i] = cur === -1 ? 0 : -1;
        return n;
      });
    }
  };

  const strokeFor = (v) => {
    if (v === 1) return { stroke: '#22d3ee', strokeWidth: 5, opacity: 1 };
    if (v === -1) return { stroke: 'rgba(255,255,255,0.2)', strokeWidth: 3, opacity: 1, strokeDasharray: '4 4' };
    return { stroke: 'rgba(255,255,255,0.25)', strokeWidth: 2, opacity: 1 };
  };

  if (!puz) return null;

  const svgW = pad * 2 + puz.w * cell;
  const svgH = pad * 2 + puz.h * cell;

  return (
    <div className={styles.container}>
      <GameHeader
        title="Bag (Corral)"
        instructions="Draw a single closed loop around grid edges. All numbered cells must be inside the loop. Each number shows how many cells can be seen from that cell in all 4 directions (including itself), stopping at the loop boundary."
      />

      <div className={styles.toolbar}>
        <div className={styles.group}>
          <div className={styles.difficultySelector}>
            {DIFFICULTIES.map((d) => (
              <button
                key={d}
                className={`${styles.difficultyBtn} ${difficulty === d ? styles.active : ''}`}
                onClick={() => setDifficulty(d)}
              >
                {d.charAt(0).toUpperCase() + d.slice(1)}
              </button>
            ))}
          </div>
          <div className={styles.sizeSelector}>
            {availableSizes.map((key) => (
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
        <div className={styles.group}>
          <button className={styles.button} onClick={initGame}>New</button>
          <button
            className={styles.button}
            onClick={() => {
              if (puz) {
                setHEdges(puz.solution.hEdges.slice());
                setVEdges(puz.solution.vEdges.slice());
              }
            }}
          >
            Reveal
          </button>
          <button
            className={styles.button}
            onClick={() => {
              if (puz) {
                setHEdges(new Array((puz.h + 1) * puz.w).fill(0));
                setVEdges(new Array(puz.h * (puz.w + 1)).fill(0));
              }
            }}
          >
            Clear
          </button>
        </div>

        <div className={styles.status}>
          {solved ? (
            <span className={styles.win}>Solved!</span>
          ) : (
            <span className={edgeCount > 0 ? (loopOk ? '' : styles.bad) : ''}>
              {edgeCount === 0 ? 'Draw a loop' : loopOk ? 'Loop OK - check clues' : 'Not a single loop yet'}
            </span>
          )}
        </div>
      </div>

      <div className={styles.svgWrap}>
        <svg width={svgW} height={svgH} viewBox={`0 0 ${svgW} ${svgH}`}>
          {/* Cell backgrounds */}
          {Array.from({ length: puz.h * puz.w }, (_, i) => {
            const r = Math.floor(i / puz.w);
            const c = i % puz.w;
            const key = `${r},${c}`;
            const isIn = inside.has(key);
            const x = pad + c * cell;
            const y = pad + r * cell;

            // Only show inside/outside if we have edges
            if (edgeCount === 0) return null;

            return (
              <rect
                key={`bg-${i}`}
                x={x + 1}
                y={y + 1}
                width={cell - 2}
                height={cell - 2}
                fill={isIn ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.08)'}
                rx="2"
              />
            );
          })}

          {/* Clues */}
          {Array.from({ length: puz.h * puz.w }, (_, i) => {
            const r = Math.floor(i / puz.w);
            const c = i % puz.w;
            const clue = puz.clues[i];
            if (clue === null) return null;

            const x = pad + c * cell + cell / 2;
            const y = pad + r * cell + cell / 2 + 6;
            const bad = clueBad.has(i);

            return (
              <text
                key={`clue-${i}`}
                x={x}
                y={y}
                textAnchor="middle"
                fontSize="18"
                fontWeight="800"
                fill={bad ? 'rgba(251,113,133,0.95)' : 'rgba(255,255,255,0.9)'}
              >
                {clue}
              </text>
            );
          })}

          {/* Horizontal edges */}
          {Array.from({ length: (puz.h + 1) * puz.w }, (_, i) => {
            const r = Math.floor(i / puz.w);
            const c = i % puz.w;
            const x1 = pad + c * cell;
            const y1 = pad + r * cell;
            const x2 = x1 + cell;
            const y2 = y1;
            const st = strokeFor(hEdges[i]);
            return (
              <g key={`h-${i}`}>
                <line x1={x1} y1={y1} x2={x2} y2={y2} {...st} strokeLinecap="round" />
                <line
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke="transparent"
                  strokeWidth="18"
                  onClick={() => toggleEdge('h', r, c, 'on')}
                  onContextMenu={(e) => { e.preventDefault(); toggleEdge('h', r, c, 'off'); }}
                  style={{ cursor: 'pointer' }}
                />
              </g>
            );
          })}

          {/* Vertical edges */}
          {Array.from({ length: puz.h * (puz.w + 1) }, (_, i) => {
            const r = Math.floor(i / (puz.w + 1));
            const c = i % (puz.w + 1);
            const x1 = pad + c * cell;
            const y1 = pad + r * cell;
            const x2 = x1;
            const y2 = y1 + cell;
            const st = strokeFor(vEdges[i]);
            return (
              <g key={`v-${i}`}>
                <line x1={x1} y1={y1} x2={x2} y2={y2} {...st} strokeLinecap="round" />
                <line
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke="transparent"
                  strokeWidth="18"
                  onClick={() => toggleEdge('v', r, c, 'on')}
                  onContextMenu={(e) => { e.preventDefault(); toggleEdge('v', r, c, 'off'); }}
                  style={{ cursor: 'pointer' }}
                />
              </g>
            );
          })}

          {/* Corner dots */}
          {Array.from({ length: (puz.h + 1) * (puz.w + 1) }, (_, i) => {
            const r = Math.floor(i / (puz.w + 1));
            const c = i % (puz.w + 1);
            const x = pad + c * cell;
            const y = pad + r * cell;
            return <circle key={`dot-${i}`} cx={x} cy={y} r="3" fill="rgba(255,255,255,0.5)" />;
          })}
        </svg>
      </div>

      <div className={styles.legend}>
        <div className={styles.legendItem}>
          <div className={`${styles.legendSwatch} ${styles.insideSwatch}`}></div>
          <span>Inside loop</span>
        </div>
        <div className={styles.legendItem}>
          <div className={`${styles.legendSwatch} ${styles.outsideSwatch}`}></div>
          <span>Outside loop</span>
        </div>
      </div>

      <div className={styles.hint}>
        Left-click to add/remove loop edges. Right-click to mark edges as excluded.
      </div>
    </div>
  );
}
