import { useCallback, useMemo, useState } from 'react';
import GameHeader from '../../components/GameHeader';
import styles from './Signpost.module.css';

function rcToIdx(r, c, w) {
  return r * w + c;
}
function idxToRC(i, w) {
  return { r: Math.floor(i / w), c: i % w };
}

function dirToArrow(dr, dc) {
  if (dr === -1 && dc === -1) return '↖';
  if (dr === -1 && dc === 0) return '↑';
  if (dr === -1 && dc === 1) return '↗';
  if (dr === 0 && dc === -1) return '←';
  if (dr === 0 && dc === 1) return '→';
  if (dr === 1 && dc === -1) return '↙';
  if (dr === 1 && dc === 0) return '↓';
  if (dr === 1 && dc === 1) return '↘';
  return '•';
}

// Get all cells reachable from idx in a given direction (any distance)
function getCellsInDirection(idx, dr, dc, w, h) {
  const { r, c } = idxToRC(idx, w);
  const cells = [];
  let nr = r + dr;
  let nc = c + dc;
  while (nr >= 0 && nr < h && nc >= 0 && nc < w) {
    cells.push(rcToIdx(nr, nc, w));
    nr += dr;
    nc += dc;
  }
  return cells;
}

// Get all cells reachable from idx in any of the 8 directions
function getAllReachable(idx, w, h) {
  const cells = [];
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      cells.push(...getCellsInDirection(idx, dr, dc, w, h));
    }
  }
  return cells;
}

// Shuffle array in place
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Generate a Hamiltonian path where moves can be any distance in 8 directions
function generateRandomPath(w, h, maxAttempts = 100) {
  const n = w * h;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const visited = new Set();
    const path = [];

    // Start from a random cell
    const startIdx = Math.floor(Math.random() * n);
    path.push(startIdx);
    visited.add(startIdx);

    while (path.length < n) {
      const current = path[path.length - 1];

      // Get all unvisited cells reachable in any direction
      let candidates = getAllReachable(current, w, h).filter(c => !visited.has(c));

      if (candidates.length === 0) break;

      // Prefer cells that have more future options (modified Warnsdorff)
      // But heavily prefer longer jumps to make the puzzle interesting
      candidates = shuffle(candidates);

      // Score candidates: prefer those with escape routes AND longer distances
      const { r: cr, c: cc } = idxToRC(current, w);
      candidates.sort((a, b) => {
        const aReach = getAllReachable(a, w, h).filter(x => !visited.has(x) && x !== a).length;
        const bReach = getAllReachable(b, w, h).filter(x => !visited.has(x) && x !== b).length;

        // Calculate distances
        const { r: ar, c: ac } = idxToRC(a, w);
        const { r: br, c: bc } = idxToRC(b, w);
        const aDist = Math.max(Math.abs(ar - cr), Math.abs(ac - cc));
        const bDist = Math.max(Math.abs(br - cr), Math.abs(bc - cc));

        // Primary: cells with fewer options first (Warnsdorff)
        // Secondary: prefer longer distances for more interesting puzzles
        if (aReach !== bReach) return aReach - bReach;
        return bDist - aDist; // Prefer longer jumps
      });

      // Pick from top candidates with some randomness
      const topCount = Math.min(3, candidates.length);
      const next = candidates[Math.floor(Math.random() * topCount)];

      path.push(next);
      visited.add(next);
    }

    if (path.length === n) {
      return path;
    }
  }

  // Fallback: create a path with some longer jumps
  // Use a diagonal-heavy pattern
  const path = [];
  const visited = new Set();
  let current = 0;
  path.push(current);
  visited.add(current);

  while (path.length < n) {
    const candidates = getAllReachable(current, w, h).filter(c => !visited.has(c));
    if (candidates.length === 0) {
      // Find any unvisited cell
      for (let i = 0; i < n; i++) {
        if (!visited.has(i)) {
          current = i;
          break;
        }
      }
    } else {
      current = candidates[Math.floor(Math.random() * candidates.length)];
    }
    path.push(current);
    visited.add(current);
  }

  return path;
}

function normalizeDirection(dr, dc) {
  if (dr === 0 && dc === 0) return { dr: 0, dc: 0 };
  const gcd = (x, y) => (y === 0 ? x : gcd(y, x % y));
  const g = gcd(Math.abs(dr), Math.abs(dc));
  return { dr: dr / g, dc: dc / g };
}

// Check if a link from->to has ambiguity (multiple cells in that direction)
function hasAmbiguity(fromIdx, toIdx, w, h) {
  const { r: fr, c: fc } = idxToRC(fromIdx, w);
  const { r: tr, c: tc } = idxToRC(toIdx, w);
  const dr = tr - fr;
  const dc = tc - fc;
  if (dr === 0 && dc === 0) return false;

  const dir = normalizeDirection(dr, dc);
  const cellsInDir = getCellsInDirection(fromIdx, dir.dr, dir.dc, w, h);

  // If there's more than one cell in this direction, there's ambiguity
  return cellsInDir.length > 1;
}

function generatePuzzle(w, h) {
  const n = w * h;
  const path = generateRandomPath(w, h);

  const arrows = new Array(n).fill(null);
  const numbers = new Array(n).fill(null);

  // Always show 1 at start and n at end
  numbers[path[0]] = 1;
  numbers[path[n - 1]] = n;

  // Compute arrows (direction from each cell to its successor)
  for (let i = 0; i < n - 1; i++) {
    const a = path[i];
    const b = path[i + 1];
    const ra = idxToRC(a, w);
    const rb = idxToRC(b, w);
    const dir = normalizeDirection(rb.r - ra.r, rb.c - ra.c);
    arrows[a] = dir;
  }

  // Smart clue placement: reveal numbers at ambiguous points
  // and ensure the puzzle is solvable
  const revealIndices = new Set([0, n - 1]);

  // Find positions where there's ambiguity (multiple cells in arrow direction)
  const ambiguousPositions = [];
  for (let i = 0; i < n - 1; i++) {
    if (hasAmbiguity(path[i], path[i + 1], w, h)) {
      ambiguousPositions.push(i + 1); // Reveal the destination
    }
  }

  // Reveal some ambiguous destinations to help solve
  shuffle(ambiguousPositions);
  const numToReveal = Math.max(3, Math.floor(ambiguousPositions.length * 0.4));
  for (let i = 0; i < Math.min(numToReveal, ambiguousPositions.length); i++) {
    revealIndices.add(ambiguousPositions[i]);
  }

  // Also add a few random clues spread throughout
  const extraClues = Math.max(2, Math.floor(n * 0.1));
  for (let i = 0; i < extraClues; i++) {
    const t = 1 + Math.floor(Math.random() * (n - 2));
    revealIndices.add(t);
  }

  for (const t of revealIndices) {
    numbers[path[t]] = t + 1;
  }

  return { w, h, arrows, fixedNumbers: numbers, solutionPath: path };
}

function inArrowDirection(fromIdx, toIdx, arrows, w) {
  const a = arrows[fromIdx];
  if (!a) return false;
  const { r: fr, c: fc } = idxToRC(fromIdx, w);
  const { r: tr, c: tc } = idxToRC(toIdx, w);
  const dr = tr - fr;
  const dc = tc - fc;
  // must be same direction (scalar multiple) and not zero
  if (dr === 0 && dc === 0) return false;
  // Normalize by gcd of abs
  const g = (x, y) => (y === 0 ? x : g(y, x % y));
  const g0 = g(Math.abs(dr), Math.abs(dc));
  const ndr = dr / g0;
  const ndc = dc / g0;
  return ndr === a.dr && ndc === a.dc;
}

// Export helpers for testing
export {
  rcToIdx,
  idxToRC,
  dirToArrow,
  getCellsInDirection,
  getAllReachable,
  shuffle,
  generateRandomPath,
  normalizeDirection,
  hasAmbiguity,
  generatePuzzle,
  inArrowDirection,
  analyze as analyzeSolution,
};

function analyze(puz, succ, pred) {
  const n = puz.w * puz.h;
  const bad = new Set();

  // basic consistency: links follow arrows and are bijective-ish
  for (let i = 0; i < n; i++) {
    if (succ[i] != null) {
      const j = succ[i];
      if (j === i) bad.add(i);
      if (!inArrowDirection(i, j, puz.arrows, puz.w)) bad.add(i);
      if (pred[j] !== i) bad.add(i);
    }
    if (pred[i] != null) {
      const j = pred[i];
      if (j === i) bad.add(i);
      if (succ[j] !== i) bad.add(i);
    }
  }

  // derive numbers by walking from fixed 1 if possible
  const derived = new Array(n).fill(null);
  const start = puz.fixedNumbers.findIndex((x) => x === 1);
  if (start >= 0) {
    let cur = start;
    let k = 1;
    const seen = new Set();
    while (cur != null && !seen.has(cur) && k <= n) {
      seen.add(cur);
      derived[cur] = k;
      cur = succ[cur];
      k++;
    }
  }

  // check fixed numbers compatibility if derived exists
  for (let i = 0; i < n; i++) {
    const fixed = puz.fixedNumbers[i];
    if (fixed == null) continue;
    if (derived[i] != null && derived[i] !== fixed) bad.add(i);
  }

  // solved: single path covering all nodes from 1..n
  let solved = false;
  if (start >= 0 && bad.size === 0) {
    let cur = start;
    const seen = new Set();
    while (cur != null && !seen.has(cur)) {
      seen.add(cur);
      cur = succ[cur];
    }
    // must visit all nodes and end at fixed N
    const end = puz.fixedNumbers.findIndex((x) => x === n);
    solved = seen.size === n && cur == null && end >= 0 && derived[end] === n;
  }

  return { bad, derived, solved };
}

export default function Signpost() {
  const [w, setW] = useState(6);
  const [h, setH] = useState(6);
  const [puz, setPuz] = useState(() => generatePuzzle(6, 6));
  const [succ, setSucc] = useState(() => new Array(36).fill(null));
  const [pred, setPred] = useState(() => new Array(36).fill(null));
  const [selected, setSelected] = useState(null);

  const reset = useCallback((nw = w, nh = h) => {
    const np = generatePuzzle(nw, nh);
    setPuz(np);
    setSucc(new Array(nw * nh).fill(null));
    setPred(new Array(nw * nh).fill(null));
    setSelected(null);
  }, [w, h]);

  const { bad, derived, solved } = useMemo(() => analyze(puz, succ, pred), [puz, succ, pred]);

  const onCell = (i) => {
    if (selected == null) {
      setSelected(i);
      return;
    }
    if (selected === i) {
      // Clear links touching this cell
      setSucc((s0) => {
        const s = s0.slice();
        const p = pred.slice();
        if (s[i] != null) { p[s[i]] = null; s[i] = null; }
        if (p[i] != null) { s[p[i]] = null; p[i] = null; }
        setPred(p);
        return s;
      });
      setSelected(null);
      return;
    }

    // Try to link selected -> i (successor)
    if (!inArrowDirection(selected, i, puz.arrows, puz.w)) {
      setSelected(i);
      return;
    }

    setSucc((s0) => {
      const s = s0.slice();
      const p = pred.slice();
      // remove existing outgoing from selected
      if (s[selected] != null) { p[s[selected]] = null; }
      // remove existing incoming to i
      if (p[i] != null) { s[p[i]] = null; }
      s[selected] = i;
      p[i] = selected;
      setPred(p);
      return s;
    });
    setSelected(null);
  };

  const n = puz.w * puz.h;

  return (
    <div className={styles.container}>
      <GameHeader
        title="Signpost"
        instructions="Link squares to form a single chain 1→2→… following the arrows (a link can go any distance as long as it’s in the arrow’s direction). Click a square, then click its successor. Click a square twice to clear links touching it."
      />

      <div className={styles.toolbar}>
        <div className={styles.group}>
          <label>
            <span style={{ color: 'rgba(255,255,255,0.85)', marginRight: 8 }}>Size</span>
            <select
              className={styles.button}
              value={`${w}x${h}`}
              onChange={(e) => {
                const [nw, nh] = e.target.value.split('x').map(Number);
                setW(nw); setH(nh);
                reset(nw, nh);
              }}
            >
              {['5x5', '6x6', '7x7'].map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </label>
          <button className={styles.button} onClick={() => reset(w, h)}>New</button>
          <button
            className={styles.button}
            onClick={() => {
              setSucc(new Array(n).fill(null));
              setPred(new Array(n).fill(null));
              setSelected(null);
            }}
          >
            Clear
          </button>
          <button
            className={styles.button}
            onClick={() => {
              // reveal the stored solution
              const s = new Array(n).fill(null);
              const p = new Array(n).fill(null);
              const path = puz.solutionPath;
              for (let i = 0; i < path.length - 1; i++) {
                s[path[i]] = path[i + 1];
                p[path[i + 1]] = path[i];
              }
              setSucc(s);
              setPred(p);
              setSelected(null);
            }}
          >
            Reveal
          </button>
        </div>

        <div className={styles.status}>
          {solved ? <span className={styles.win}>Solved!</span> : (bad.size ? <span className={styles.bad}>Conflicts</span> : <span>OK</span>)}
        </div>
      </div>

      <div className={styles.grid} style={{ gridTemplateColumns: `repeat(${puz.w}, 62px)` }}>
        {Array.from({ length: n }, (_, i) => {
          const fixed = puz.fixedNumbers[i];
          const num = fixed ?? derived[i];
          const arrow = puz.arrows[i] ? dirToArrow(puz.arrows[i].dr, puz.arrows[i].dc) : '⛳';
          const isStart = fixed === 1;
          const isEnd = fixed === n;
          const cls = [
            styles.cell,
            fixed != null ? styles.fixed : '',
            isStart ? styles.startCell : '',
            isEnd ? styles.endCell : '',
            selected === i ? styles.selected : '',
            bad.has(i) ? styles.badCell : '',
          ].join(' ');
          return (
            <div
              key={i}
              className={cls}
              onClick={() => onCell(i)}
              title={`cell ${i + 1}`}
            >
              <div className={styles.topRow}>
                <span className={styles.num}>{num ?? ''}</span>
                <span className={styles.arrow}>{arrow}</span>
              </div>
              <div className={styles.links}>
                <span>{pred[i] != null ? '•' : '○'}</span>
                <span>{succ[i] != null ? '→' : ''}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
