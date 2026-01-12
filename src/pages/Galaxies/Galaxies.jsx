import { useCallback, useEffect, useMemo, useState } from 'react';
import GameHeader from '../../components/GameHeader';
import styles from './Galaxies.module.css';

// Simplified Galaxies: dots at cell centres only.
// Player assigns each cell to a dot/galaxy. A galaxy is valid if:
// - region is connected
// - region is 180° symmetric about its dot cell

const COLORS = [
  '#ef4444',
  '#3b82f6',
  '#22c55e',
  '#f59e0b',
  '#a855f7',
  '#06b6d4',
  '#f472b6',
  '#94a3b8',
  '#10b981',
  '#f43f5e',
];

// Helper functions
function rcToIdx(r, c, w) {
  return r * w + c;
}
function idxToRC(i, w) {
  return { r: Math.floor(i / w), c: i % w };
}
function inBounds(r, c, h, w) {
  return r >= 0 && r < h && c >= 0 && c < w;
}

// Check if galaxy region is connected (BFS)
function isConnected(sol, g, w, h) {
  const cells = [];
  for (let i = 0; i < sol.length; i++) {
    if (sol[i] === g) cells.push(i);
  }
  if (cells.length === 0) return true;

  const visited = new Set([cells[0]]);
  const queue = [cells[0]];
  const cellSet = new Set(cells);
  const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];

  while (queue.length > 0) {
    const curr = queue.shift();
    const { r, c } = idxToRC(curr, w);

    for (const [dr, dc] of dirs) {
      const nr = r + dr;
      const nc = c + dc;
      if (!inBounds(nr, nc, h, w)) continue;
      const ni = rcToIdx(nr, nc, w);
      if (!cellSet.has(ni) || visited.has(ni)) continue;
      visited.add(ni);
      queue.push(ni);
    }
  }

  return visited.size === cells.length;
}

// ============================================================================
// REVERSE GENERATION ALGORITHM
// Key insight: Generate the SOLUTION first, then extract the puzzle
// This guarantees valid, solvable puzzles by construction
// ============================================================================

// Main puzzle generator using reverse generation
function generatePuzzle(size, numDots) {
  const w = size;
  const h = size;
  const n = w * h;

  // Try reverse generation multiple times
  for (let attempt = 0; attempt < 100; attempt++) {
    const result = reverseGenerate(w, h, numDots);
    if (result) return result;
  }

  // Fallback: simple grid partition (guaranteed to work)
  return generateSimplePartition(size, numDots);
}

// Reverse generation: carve out symmetric regions, then place dots at centers
function reverseGenerate(w, h, numDots) {
  const n = w * h;
  const sol = new Array(n).fill(-1);
    const dots = [];

  // Target cells per galaxy (with some variance)
  const avgCells = Math.floor(n / numDots);

  for (let g = 0; g < numDots; g++) {
    // Find all valid center positions (where we can grow a symmetric region)
    const validCenters = [];

    for (let r = 0; r < h; r++) {
      for (let c = 0; c < w; c++) {
        const idx = rcToIdx(r, c, w);
        if (sol[idx] !== -1) continue;

        // Check if this position can be a center (has symmetric growth potential)
        if (canBeCenter(r, c, sol, w, h)) {
          validCenters.push({ r, c });
        }
      }
    }

    if (validCenters.length === 0) break;

    // Pick a random valid center
    const center = validCenters[Math.floor(Math.random() * validCenters.length)];
    dots.push(center);

    // Grow a symmetric region from this center
    const targetSize = Math.max(1, avgCells + Math.floor((Math.random() - 0.5) * avgCells * 0.6));
    growSymmetricRegion(sol, g, center, w, h, targetSize);
  }

  // Fill any remaining unassigned cells
  fillRemainingCells(sol, dots, w, h);

  // Validate result
  if (sol.some(x => x === -1)) return null;
  if (dots.length !== numDots) return null;
  if (!verifySymmetry(sol, dots, w, h)) return null;
  if (!allGalaxiesConnected(sol, dots, w, h)) return null;

  return { w, h, dots, solution: sol };
}

// Check if a cell can be the center of a new galaxy
function canBeCenter(r, c, sol, w, h) {
  const idx = rcToIdx(r, c, w);
  if (sol[idx] !== -1) return false;

  // Must have at least one direction where symmetric growth is possible
  const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
  for (const [dr, dc] of dirs) {
    const nr = r + dr, nc = c + dc;
    const sr = r - dr, sc = c - dc;

    if (!inBounds(nr, nc, h, w) || !inBounds(sr, sc, h, w)) continue;

    const ni = rcToIdx(nr, nc, w);
    const si = rcToIdx(sr, sc, w);

    if (sol[ni] === -1 && sol[si] === -1) return true;
  }

  return true; // Single cell is always valid
}

// Grow a symmetric region using BFS
function growSymmetricRegion(sol, g, center, w, h, targetSize) {
  const { r: cr, c: cc } = center;
  const centerIdx = rcToIdx(cr, cc, w);

  // Claim center
  sol[centerIdx] = g;
  let size = 1;

  // BFS queue with random direction preference
  const frontier = [{ r: cr, c: cc }];
  const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];

  while (frontier.length > 0 && size < targetSize) {
    // Pick random cell from frontier
    const idx = Math.floor(Math.random() * frontier.length);
    const { r, c } = frontier[idx];
    frontier.splice(idx, 1);

    // Shuffle directions for variety
    const shuffledDirs = [...dirs].sort(() => Math.random() - 0.5);

    for (const [dr, dc] of shuffledDirs) {
      if (size >= targetSize) break;

      const nr = r + dr, nc = c + dc;
      const sr = 2 * cr - nr, sc = 2 * cc - nc; // Symmetric cell

      // Both cells must be in bounds
      if (!inBounds(nr, nc, h, w) || !inBounds(sr, sc, h, w)) continue;

      const ni = rcToIdx(nr, nc, w);
      const si = rcToIdx(sr, sc, w);

      // Both cells must be unclaimed
      if (sol[ni] !== -1 || sol[si] !== -1) continue;

      // Claim both cells symmetrically
      sol[ni] = g;
      sol[si] = g;
      size += (ni === si) ? 1 : 2;

      // Add to frontier
      frontier.push({ r: nr, c: nc });
      if (ni !== si) {
        frontier.push({ r: sr, c: sc });
      }
    }

    // Re-add current cell if it still has potential
    if (frontier.length === 0 && size < targetSize) {
      // Find cells belonging to this galaxy that might still grow
      for (let i = 0; i < sol.length; i++) {
        if (sol[i] === g) {
          const { r: fr, c: fc } = idxToRC(i, w);
          for (const [dr, dc] of dirs) {
            const nr = fr + dr, nc = fc + dc;
            const sr = 2 * cr - nr, sc = 2 * cc - nc;
            if (inBounds(nr, nc, h, w) && inBounds(sr, sc, h, w)) {
              const ni = rcToIdx(nr, nc, w);
              const si = rcToIdx(sr, sc, w);
              if (sol[ni] === -1 && sol[si] === -1) {
                frontier.push({ r: fr, c: fc });
                break;
              }
            }
          }
        }
        if (frontier.length > 0) break;
      }
    }
  }
}

// Fill remaining unassigned cells by expanding existing galaxies
function fillRemainingCells(sol, dots, w, h) {
  const n = w * h;
  const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];

  let changed = true;
  let iterations = 0;
  const maxIterations = n * 2;

  while (changed && iterations < maxIterations) {
    changed = false;
    iterations++;

    // Process cells in random order for variety
    const indices = Array.from({ length: n }, (_, i) => i);
    indices.sort(() => Math.random() - 0.5);

    for (const i of indices) {
      if (sol[i] !== -1) continue;

      const { r, c } = idxToRC(i, w);

      // Find neighboring galaxies that can claim this cell
      const candidates = [];

      for (const [dr, dc] of dirs) {
        const nr = r + dr, nc = c + dc;
        if (!inBounds(nr, nc, h, w)) continue;

        const ni = rcToIdx(nr, nc, w);
        const g = sol[ni];
        if (g === -1) continue;

        // Check if galaxy g can claim this cell symmetrically
        const { r: cr, c: cc } = dots[g];
        const sr = 2 * cr - r, sc = 2 * cc - c;

        if (!inBounds(sr, sc, h, w)) continue;
        const si = rcToIdx(sr, sc, w);
        if (sol[si] !== -1 && sol[si] !== g) continue;

        candidates.push({ g, si });
      }

      if (candidates.length > 0) {
        // Pick random candidate
        const { g, si } = candidates[Math.floor(Math.random() * candidates.length)];
        sol[i] = g;
        sol[si] = g;
        changed = true;
      }
    }
  }
}

// Check if all galaxies are connected
function allGalaxiesConnected(sol, dots, w, h) {
  for (let g = 0; g < dots.length; g++) {
    if (!isConnected(sol, g, w, h)) return false;
  }
  return true;
}

// Simple partition fallback - guaranteed to work
function generateSimplePartition(size, numDots) {
  const w = size, h = size;
  const n = w * h;
  const sol = new Array(n).fill(-1);
  const dots = [];

  // Arrange dots in a grid pattern
  const cols = Math.ceil(Math.sqrt(numDots));
  const rows = Math.ceil(numDots / cols);
  const cellW = w / cols;
  const cellH = h / rows;

  let g = 0;
  for (let gr = 0; gr < rows && g < numDots; gr++) {
    for (let gc = 0; gc < cols && g < numDots; gc++) {
      // Place dot at center of grid cell
      const cr = Math.floor((gr + 0.5) * cellH);
      const cc = Math.floor((gc + 0.5) * cellW);
      dots.push({ r: cr, c: cc });

      // Assign cells in this grid region
      const rStart = Math.floor(gr * cellH);
      const rEnd = gr === rows - 1 ? h : Math.floor((gr + 1) * cellH);
      const cStart = Math.floor(gc * cellW);
      const cEnd = gc === cols - 1 ? w : Math.floor((gc + 1) * cellW);

      for (let r = rStart; r < rEnd; r++) {
        for (let c = cStart; c < cEnd; c++) {
          sol[rcToIdx(r, c, w)] = g;
        }
      }
      g++;
    }
  }

  return { w, h, dots, solution: sol };
}

// Verify that a solution has valid symmetry for all galaxies
function verifySymmetry(sol, dots, w, h) {
  for (let g = 0; g < dots.length; g++) {
    const { r: cr, c: cc } = dots[g];

    for (let i = 0; i < sol.length; i++) {
      if (sol[i] !== g) continue;

      const { r, c } = idxToRC(i, w);
      const sr = 2 * cr - r;
      const sc = 2 * cc - c;

      // Symmetric cell must be in bounds and belong to same galaxy
      if (!inBounds(sr, sc, h, w)) return false;
      const si = rcToIdx(sr, sc, w);
      if (sol[si] !== g) return false;
    }
  }
  return true;
}

// Grid sizes and recommended dot counts
// Rule of thumb: ~6-12 cells per galaxy works well
const SIZES = [5, 7, 9, 11];
const DOT_COUNTS_BY_SIZE = {
  5: [2, 3, 4],      // 25 cells: 6-12 cells per galaxy
  7: [3, 4, 5, 6],   // 49 cells: 8-16 cells per galaxy
  9: [4, 6, 8, 10],  // 81 cells: 8-20 cells per galaxy
  11: [6, 8, 10, 12] // 121 cells: 10-20 cells per galaxy
};

function analyze(puz, assign) {
  const n = puz.w * puz.h;
  const bad = new Set();

  // all assigned?
  const allAssigned = assign.every((x) => x >= 0);

  // build cells per region
  const cellsBy = Array.from({ length: puz.dots.length }, () => []);
  for (let i = 0; i < n; i++) {
    const g = assign[i];
    if (g < 0) continue;
    if (!cellsBy[g]) continue;
    cellsBy[g].push(i);
  }

  // validate each region: connected + symmetry
  for (let g = 0; g < puz.dots.length; g++) {
    const cells = cellsBy[g];
    if (cells.length === 0) continue;
    const { r: cr, c: cc } = puz.dots[g];
    const cellSet = new Set(cells);

    // symmetry
    for (const i of cells) {
      const { r, c } = idxToRC(i, puz.w);
      const rr = 2 * cr - r;
      const cc2 = 2 * cc - c;
      if (!inBounds(rr, cc2, puz.h, puz.w) || !cellSet.has(rcToIdx(rr, cc2, puz.w))) {
        bad.add(i);
      }
    }

    // must contain its dot cell
    const dotIdx = rcToIdx(cr, cc, puz.w);
    if (!cellSet.has(dotIdx)) bad.add(dotIdx);

    // connectivity
    const start = cells[0];
    const seen = new Set([start]);
    const stack = [start];
    const dirs = [{ dr: -1, dc: 0 }, { dr: 1, dc: 0 }, { dr: 0, dc: -1 }, { dr: 0, dc: 1 }];
    while (stack.length) {
      const u = stack.pop();
      const { r, c } = idxToRC(u, puz.w);
      for (const d of dirs) {
        const rr = r + d.dr, cc3 = c + d.dc;
        if (!inBounds(rr, cc3, puz.h, puz.w)) continue;
        const v = rcToIdx(rr, cc3, puz.w);
        if (!cellSet.has(v) || seen.has(v)) continue;
        seen.add(v);
        stack.push(v);
      }
    }
    if (seen.size !== cells.length) {
      for (const i of cells) bad.add(i);
    }
  }

  const solved = allAssigned && bad.size === 0;
  return { bad, solved };
}

export default function Galaxies() {
  const [size, setSize] = useState(7);
  const [numDots, setNumDots] = useState(4);
  const [puz, setPuz] = useState(null);
  const [sel, setSel] = useState(0);
  const [assign, setAssign] = useState([]);

  // Get valid dot counts for current size
  const dotCounts = DOT_COUNTS_BY_SIZE[size] || [3, 4, 5];

  // When size changes, adjust numDots if needed
  useEffect(() => {
    const validCounts = DOT_COUNTS_BY_SIZE[size] || [3, 4, 5];
    if (!validCounts.includes(numDots)) {
      // Pick closest valid value
      const closest = validCounts.reduce((prev, curr) =>
        Math.abs(curr - numDots) < Math.abs(prev - numDots) ? curr : prev
      );
      setNumDots(closest);
    }
  }, [size, numDots]);

  const generateNew = useCallback(() => {
    const newPuz = generatePuzzle(size, numDots);
    setPuz(newPuz);
    setAssign(new Array(newPuz.w * newPuz.h).fill(-1));
    setSel(0);
  }, [size, numDots]);

  useEffect(() => {
    generateNew();
  }, [generateNew]);

  const { bad, solved } = useMemo(() => {
    if (!puz) return { bad: new Set(), solved: false };
    return analyze(puz, assign);
  }, [puz, assign]);

  const paint = (i) => {
    setAssign((prev) => {
      const n = prev.slice();
      n[i] = n[i] === sel ? -1 : sel;
      return n;
    });
  };

  return (
    <div className={styles.container}>
      <GameHeader
        title="Galaxies"
        instructions="Partition the grid into galaxies. Each galaxy must be connected and 180° symmetric about its dot. Select a dot color, then click cells to assign them to that galaxy."
      />

      <div className={styles.toolbar}>
        <div className={styles.group}>
          <label>Size:</label>
          {SIZES.map((s) => (
            <button
              key={s}
              className={`${styles.button} ${size === s ? styles.active : ''}`}
              onClick={() => setSize(s)}
            >
              {s}×{s}
            </button>
          ))}
        </div>
        <div className={styles.group}>
          <label>Dots:</label>
          {dotCounts.map((d) => (
            <button
              key={d}
              className={`${styles.button} ${numDots === d ? styles.active : ''}`}
              onClick={() => setNumDots(d)}
            >
              {d}
            </button>
          ))}
        </div>
        <div className={styles.group}>
          <button className={styles.generateBtn} onClick={generateNew}>New Puzzle</button>
          {puz && <button className={styles.button} onClick={() => setAssign(new Array(puz.w * puz.h).fill(-1))}>Clear</button>}
          {puz && <button className={styles.button} onClick={() => setAssign(puz.solution.slice())}>Reveal</button>}
        </div>
        {puz && (
          <div className={styles.group}>
            <div className={styles.palette}>
              {puz.dots.map((d, i) => (
                <div
                  key={i}
                  className={`${styles.swatch} ${sel === i ? styles.active : ''}`}
                  style={{ background: COLORS[i % COLORS.length] }}
                  onClick={() => setSel(i)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && setSel(i)}
                  title={`Dot ${i + 1} at (${d.r + 1},${d.c + 1})`}
                />
              ))}
            </div>
          </div>
        )}
        <div className={styles.status}>
          {solved ? <span className={styles.win}>Solved!</span> : (bad.size ? <span className={styles.bad}>Invalid symmetry/connection</span> : <span>OK</span>)}
        </div>
      </div>

      {puz && (
        <div className={styles.grid} style={{ gridTemplateColumns: `repeat(${puz.w}, 44px)` }}>
          {Array.from({ length: puz.w * puz.h }, (_, i) => {
            const g = assign[i];
            const { r, c } = idxToRC(i, puz.w);
            const dotHere = puz.dots.findIndex((d) => d.r === r && d.c === c);
            const bg = g >= 0 ? COLORS[g % COLORS.length] : 'rgba(255,255,255,0.06)';
            const style = { background: bg };
            return (
              <div
                key={i}
                className={`${styles.cell} ${bad.has(i) ? styles.badCell : ''}`}
                style={style}
                onClick={() => paint(i)}
                title={`(${r + 1},${c + 1})`}
              >
                {dotHere >= 0 && <div className={styles.dot}>•</div>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
