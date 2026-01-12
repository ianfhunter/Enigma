import { useCallback, useMemo, useState } from 'react';
import GameHeader from '../../components/GameHeader';
import styles from './Bag.module.css';

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

// Generate a puzzle with an irregular loop shape for varied clue numbers
function generatePuzzle(w, h) {
  // Start with a random rectangular base
  const baseTop = 1 + Math.floor(Math.random() * Math.max(1, h - 4));
  const baseBottom = baseTop + 2 + Math.floor(Math.random() * Math.max(1, h - baseTop - 2));
  const baseLeft = 1 + Math.floor(Math.random() * Math.max(1, w - 4));
  const baseRight = baseLeft + 2 + Math.floor(Math.random() * Math.max(1, w - baseLeft - 2));

  // Build a set of "inside" cells - start with rectangle, then modify
  const insideCells = new Set();
  for (let r = baseTop; r < baseBottom; r++) {
    for (let c = baseLeft; c < baseRight; c++) {
      insideCells.add(`${r},${c}`);
    }
  }

  // Helper to check if removing a cell keeps the region connected
  const isConnectedWithout = (cells, removeKey) => {
    const remaining = new Set([...cells].filter(k => k !== removeKey));
    if (remaining.size === 0) return false;

    const visited = new Set();
    const start = [...remaining][0];
    const queue = [start];
    visited.add(start);

    while (queue.length > 0) {
      const key = queue.shift();
      const [r, c] = key.split(',').map(Number);

      for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
        const nkey = `${r + dr},${c + dc}`;
        if (remaining.has(nkey) && !visited.has(nkey)) {
          visited.add(nkey);
          queue.push(nkey);
        }
      }
    }

    return visited.size === remaining.size;
  };

  // Helper to check if adding a cell keeps the region simply connected (no holes)
  const hasNoHoles = (cells) => {
    if (cells.size < 4) return true;

    // Find bounding box
    let minR = Infinity, maxR = -Infinity, minC = Infinity, maxC = -Infinity;
    for (const key of cells) {
      const [r, c] = key.split(',').map(Number);
      minR = Math.min(minR, r);
      maxR = Math.max(maxR, r);
      minC = Math.min(minC, c);
      maxC = Math.max(maxC, c);
    }

    // Flood fill from outside to count non-inside cells
    const outside = new Set();
    const queue = [];

    // Start from all boundary positions of extended bounding box
    for (let r = minR - 1; r <= maxR + 1; r++) {
      queue.push(`${r},${minC - 1}`);
      queue.push(`${r},${maxC + 1}`);
    }
    for (let c = minC - 1; c <= maxC + 1; c++) {
      queue.push(`${minR - 1},${c}`);
      queue.push(`${maxR + 1},${c}`);
    }

    while (queue.length > 0) {
      const key = queue.shift();
      if (outside.has(key) || cells.has(key)) continue;

      const [r, c] = key.split(',').map(Number);
      if (r < minR - 1 || r > maxR + 1 || c < minC - 1 || c > maxC + 1) continue;

      outside.add(key);

      for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
        const nkey = `${r + dr},${c + dc}`;
        if (!outside.has(nkey) && !cells.has(nkey)) {
          queue.push(nkey);
        }
      }
    }

    // Count total cells in bounding box
    const bbArea = (maxR - minR + 3) * (maxC - minC + 3);
    // If outside + inside = total, no holes
    return outside.size + cells.size === bbArea;
  };

  // Randomly remove some cells from edges to create irregular shape
  const removals = Math.floor(Math.random() * Math.max(1, insideCells.size / 3));
  for (let i = 0; i < removals && insideCells.size > 4; i++) {
    // Find edge cells (cells with at least one neighbor not in the set)
    const edgeCells = [];
    for (const key of insideCells) {
      const [r, c] = key.split(',').map(Number);
      for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
        if (!insideCells.has(`${r + dr},${c + dc}`)) {
          edgeCells.push(key);
          break;
        }
      }
    }

    if (edgeCells.length === 0) break;

    // Try to remove a random edge cell
    const shuffled = edgeCells.sort(() => Math.random() - 0.5);
    for (const key of shuffled) {
      if (isConnectedWithout(insideCells, key)) {
        insideCells.delete(key);
        if (!hasNoHoles(insideCells)) {
          insideCells.add(key); // Undo if it created a hole
        } else {
          break;
        }
      }
    }
  }

  // Randomly add some cells to edges to create protrusions
  const additions = Math.floor(Math.random() * Math.max(1, insideCells.size / 4));
  for (let i = 0; i < additions; i++) {
    // Find candidate cells adjacent to current inside cells
    const candidates = new Set();
    for (const key of insideCells) {
      const [r, c] = key.split(',').map(Number);
      for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
        const nr = r + dr, nc = c + dc;
        if (nr >= 0 && nr < h && nc >= 0 && nc < w) {
          const nkey = `${nr},${nc}`;
          if (!insideCells.has(nkey)) {
            candidates.add(nkey);
          }
        }
      }
    }

    if (candidates.size === 0) break;

    // Add a random candidate
    const candidateArr = [...candidates].sort(() => Math.random() - 0.5);
    for (const key of candidateArr) {
      const testSet = new Set([...insideCells, key]);
      if (hasNoHoles(testSet)) {
        insideCells.add(key);
        break;
      }
    }
  }

  // Now build the loop boundary from the inside cells
  const hEdges = new Array((h + 1) * w).fill(0);
  const vEdges = new Array(h * (w + 1)).fill(0);

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

  // Calculate visibility clues for cells inside the loop
  const clues = new Array(h * w).fill(null);

  // Calculate visibility for a cell considering the actual loop boundary
  const calcVisibility = (r, c) => {
    let count = 1; // Count self

    // Look up - stop at loop boundary (horizontal edge)
    for (let nr = r - 1; nr >= 0; nr--) {
      if (hEdges[idxHEdge(nr + 1, c, w)] === 1) break;
      if (!insideCells.has(`${nr},${c}`)) break;
      count++;
    }
    // Look down
    for (let nr = r + 1; nr < h; nr++) {
      if (hEdges[idxHEdge(nr, c, w)] === 1) break;
      if (!insideCells.has(`${nr},${c}`)) break;
      count++;
    }
    // Look left
    for (let nc = c - 1; nc >= 0; nc--) {
      if (vEdges[idxVEdge(r, nc + 1, w)] === 1) break;
      if (!insideCells.has(`${r},${nc}`)) break;
      count++;
    }
    // Look right
    for (let nc = c + 1; nc < w; nc++) {
      if (vEdges[idxVEdge(r, nc, w)] === 1) break;
      if (!insideCells.has(`${r},${nc}`)) break;
      count++;
    }

    return count;
  };

  // Calculate all visibilities first to find variety
  const visibilities = [];
  for (const key of insideCells) {
    const [r, c] = key.split(',').map(Number);
    visibilities.push({ r, c, vis: calcVisibility(r, c), idx: r * w + c });
  }

  // Sort by visibility to ensure we show a variety of clue values
  visibilities.sort((a, b) => a.vis - b.vis);

  // Get unique visibility values
  const uniqueVis = [...new Set(visibilities.map(v => v.vis))];

  // Select clues strategically: prefer diverse values and strategic positions
  const selectedIndices = new Set();

  // First, ensure we have at least one clue for each unique visibility value (if possible)
  for (const vis of uniqueVis) {
    const candidates = visibilities.filter(v => v.vis === vis && !selectedIndices.has(v.idx));
    if (candidates.length > 0 && Math.random() < 0.7) {
      const chosen = candidates[Math.floor(Math.random() * candidates.length)];
      selectedIndices.add(chosen.idx);
      clues[chosen.idx] = chosen.vis;
    }
  }

  // Add a few more random clues for difficulty (30-50% of remaining cells)
  const remaining = visibilities.filter(v => !selectedIndices.has(v.idx));
  const additionalCount = Math.floor(remaining.length * (0.3 + Math.random() * 0.2));
  const shuffled = remaining.sort(() => Math.random() - 0.5);

  for (let i = 0; i < additionalCount; i++) {
    const v = shuffled[i];
    clues[v.idx] = v.vis;
  }

  // Ensure at least 2 clues exist
  const clueCount = clues.filter(c => c !== null).length;
  if (clueCount < 2 && visibilities.length >= 2) {
    for (let i = 0; i < Math.min(2 - clueCount, visibilities.length); i++) {
      const v = visibilities[i];
      if (clues[v.idx] === null) {
        clues[v.idx] = v.vis;
      }
    }
  }

  return { w, h, clues, solution: { hEdges, vEdges } };
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
  const [w, setW] = useState(7);
  const [h, setH] = useState(7);

  const [puz, setPuz] = useState(() => generatePuzzle(7, 7));
  const [hEdges, setHEdges] = useState(() => new Array((7 + 1) * 7).fill(0));
  const [vEdges, setVEdges] = useState(() => new Array(7 * (7 + 1)).fill(0));

  const rebuild = useCallback((nw = w, nh = h) => {
    const np = generatePuzzle(nw, nh);
    setPuz(np);
    setHEdges(new Array((nh + 1) * nw).fill(0));
    setVEdges(new Array(nh * (nw + 1)).fill(0));
  }, [w, h]);

  const { clueBad, loopOk, solved, inside, edgeCount } = useMemo(
    () => analyze(puz.w, puz.h, puz.clues, hEdges, vEdges),
    [puz, hEdges, vEdges],
  );

  const cell = 44;
  const pad = 30;
  const svgW = pad * 2 + puz.w * cell;
  const svgH = pad * 2 + puz.h * cell;

  const toggleEdge = (kind, r, c, dir) => {
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

  return (
    <div className={styles.container}>
      <GameHeader
        title="Bag (Corral)"
        instructions="Draw a single closed loop around grid edges. All numbered cells must be inside the loop. Each number shows how many cells can be seen from that cell in all 4 directions (including itself), stopping at the loop boundary."
      />

      <div className={styles.toolbar}>
        <div className={styles.group}>
          <label className={styles.label}>
            Width
            <select
              className={styles.select}
              value={w}
              onChange={(e) => {
                const v = Number(e.target.value);
                setW(v);
                rebuild(v, h);
              }}
            >
              {[5, 6, 7, 8, 9, 10].map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </label>
          <label className={styles.label}>
            Height
            <select
              className={styles.select}
              value={h}
              onChange={(e) => {
                const v = Number(e.target.value);
                setH(v);
                rebuild(w, v);
              }}
            >
              {[5, 6, 7, 8, 9, 10].map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </label>
          <button className={styles.button} onClick={() => rebuild(w, h)}>New</button>
          <button
            className={styles.button}
            onClick={() => {
              setHEdges(puz.solution.hEdges.slice());
              setVEdges(puz.solution.vEdges.slice());
            }}
          >
            Reveal
          </button>
          <button
            className={styles.button}
            onClick={() => {
              setHEdges(new Array((puz.h + 1) * puz.w).fill(0));
              setVEdges(new Array(puz.h * (puz.w + 1)).fill(0));
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
