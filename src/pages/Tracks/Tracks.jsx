import { useCallback, useEffect, useMemo, useState } from 'react';
import GameHeader from '../../components/GameHeader';
import styles from './Tracks.module.css';

// Simplified Tracks: mark which squares contain track (path) connecting A to B,
// with row/column counts of track squares. Valid solution: a single non-branching
// path from A to B (orthogonal) and counts match.

function rcToIdx(r, c, w) {
  return r * w + c;
}
function idxToRC(i, w) {
  return { r: Math.floor(i / w), c: i % w };
}
function inBounds(r, c, h, w) {
  return r >= 0 && r < h && c >= 0 && c < w;
}

const DIRS = [
  { dr: -1, dc: 0 },
  { dr: 1, dc: 0 },
  { dr: 0, dc: -1 },
  { dr: 0, dc: 1 },
];

// Generate a random path from start to end using random walk
function generatePath(w, h, startR, startC, endR, endC) {
  const visited = new Set();
  const path = [[startR, startC]];
  visited.add(`${startR},${startC}`);
  
  let r = startR;
  let c = startC;
  let stuck = 0;
  const maxSteps = w * h * 2;
  
  while ((r !== endR || c !== endC) && stuck < maxSteps) {
    // Get valid neighbors
    const neighbors = [];
    for (const { dr, dc } of DIRS) {
      const nr = r + dr;
      const nc = c + dc;
      if (!inBounds(nr, nc, h, w)) continue;
      if (visited.has(`${nr},${nc}`)) continue;
      
      // Don't trap ourselves - ensure we can still reach end
      neighbors.push({ r: nr, c: nc, dist: Math.abs(nr - endR) + Math.abs(nc - endC) });
    }
    
    if (neighbors.length === 0) {
      // Backtrack
      if (path.length <= 1) break;
      path.pop();
      const last = path[path.length - 1];
      r = last[0];
      c = last[1];
      stuck++;
      continue;
    }
    
    // Sort by distance to end (prefer getting closer) with some randomness
    neighbors.sort((a, b) => {
      const ra = a.dist + Math.random() * 3;
      const rb = b.dist + Math.random() * 3;
      return ra - rb;
    });
    
    // Sometimes take a random neighbor instead
    const next = Math.random() < 0.3 ? neighbors[Math.floor(Math.random() * neighbors.length)] : neighbors[0];
    
    r = next.r;
    c = next.c;
    path.push([r, c]);
    visited.add(`${r},${c}`);
    stuck = 0;
  }
  
  if (r !== endR || c !== endC) {
    return null; // Failed to find path
  }
  
  return path;
}

// Generate a complete puzzle
function generatePuzzle(size, difficulty) {
  const w = size;
  const h = size;
  
  const minPathLen = difficulty === 'easy' ? size : difficulty === 'medium' ? size * 1.5 : size * 2;
  const fixedRatio = difficulty === 'easy' ? 0.4 : difficulty === 'medium' ? 0.25 : 0.15;
  
  for (let attempt = 0; attempt < 50; attempt++) {
    // Random start and end positions (on edges or near edges)
    const aR = Math.floor(Math.random() * (h - 2)) + 1;
    const aC = Math.floor(Math.random() * (w - 2)) + 1;
    const bR = Math.floor(Math.random() * (h - 2)) + 1;
    const bC = Math.floor(Math.random() * (w - 2)) + 1;
    
    // Ensure A and B are far enough apart
    if (Math.abs(aR - bR) + Math.abs(aC - bC) < size / 2) continue;
    
    const path = generatePath(w, h, aR, aC, bR, bC);
    if (!path || path.length < minPathLen) continue;
    
    // Create solution set
    const solution = new Set(path.map(([r, c]) => rcToIdx(r, c, w)));
    const a = rcToIdx(aR, aC, w);
    const b = rcToIdx(bR, bC, w);
    
    // Pick fixed cells (not A or B)
    const fixedCount = Math.max(2, Math.floor(path.length * fixedRatio));
    const middleCells = path.slice(1, -1); // Exclude A and B
    const shuffled = [...middleCells].sort(() => Math.random() - 0.5);
    const fixedCells = shuffled.slice(0, fixedCount);
    const fixed = new Set(fixedCells.map(([r, c]) => rcToIdx(r, c, w)));
    
    // Calculate clues
    const rowClues = new Array(h).fill(0);
    const colClues = new Array(w).fill(0);
    for (const i of solution) {
      const { r, c } = idxToRC(i, w);
      rowClues[r]++;
      colClues[c]++;
    }
    
    return {
      w,
      h,
      a,
      b,
      aPos: { r: aR, c: aC },
      bPos: { r: bR, c: bC },
      path,
      solution,
      fixed,
      rowClues,
      colClues,
    };
  }
  
  // Fallback
  return {
    w: 8,
    h: 8,
    a: rcToIdx(1, 1, 8),
    b: rcToIdx(6, 6, 8),
    aPos: { r: 1, c: 1 },
    bPos: { r: 6, c: 6 },
    path: [[1,1], [1,2], [2,2], [3,2], [3,3], [4,3], [5,3], [5,4], [5,5], [6,5], [6,6]],
    solution: new Set([9, 10, 18, 26, 27, 35, 43, 44, 45, 53, 54]),
    fixed: new Set([10, 27, 53]),
    rowClues: [0, 2, 1, 2, 1, 3, 2, 0],
    colClues: [0, 1, 2, 3, 1, 3, 1, 0],
  };
}

const SIZES = [6, 8, 10];
const DIFFICULTIES = ['easy', 'medium', 'hard'];

function analyze(puz, marks) {
  // marks: 0 empty, 1 track
  const n = puz.w * puz.h;
  const bad = new Set();

  // counts
  const row = new Array(puz.h).fill(0);
  const col = new Array(puz.w).fill(0);
  for (let i = 0; i < n; i++) {
    if (marks[i] !== 1) continue;
    const { r, c } = idxToRC(i, puz.w);
    row[r]++; col[c]++;
  }
  const rowOk = row.every((v, r) => v === puz.rowClues[r]);
  const colOk = col.every((v, c) => v === puz.colClues[c]);

  // path validity: track cells form a single path from A to B, no branches, no cycles
  const deg = new Array(n).fill(0);
  const adj = Array.from({ length: n }, () => []);
  const dirs = [
    { dr: -1, dc: 0 },
    { dr: 1, dc: 0 },
    { dr: 0, dc: -1 },
    { dr: 0, dc: 1 },
  ];
  for (let i = 0; i < n; i++) {
    if (marks[i] !== 1) continue;
    const { r, c } = idxToRC(i, puz.w);
    for (const d of dirs) {
      const rr = r + d.dr;
      const cc = c + d.dc;
      if (!inBounds(rr, cc, puz.h, puz.w)) continue;
      const j = rcToIdx(rr, cc, puz.w);
      if (marks[j] !== 1) continue;
      if (j < i) continue;
      deg[i]++; deg[j]++;
      adj[i].push(j); adj[j].push(i);
    }
  }

  // degree constraints
  for (let i = 0; i < n; i++) {
    if (marks[i] !== 1) continue;
    const isEnd = i === puz.a || i === puz.b;
    if (isEnd) {
      if (deg[i] !== 1) bad.add(i);
    } else {
      if (deg[i] !== 2) bad.add(i);
    }
    if (deg[i] > 2) bad.add(i);
  }

  // connectivity: BFS from A across track cells; must reach B and cover all track cells
  let connectedPath = false;
  if (marks[puz.a] === 1 && marks[puz.b] === 1) {
    const seen = new Set([puz.a]);
    const stack = [puz.a];
    while (stack.length) {
      const u = stack.pop();
      for (const v of adj[u]) if (!seen.has(v)) { seen.add(v); stack.push(v); }
    }
    const trackCount = marks.reduce((acc, v) => acc + (v === 1 ? 1 : 0), 0);
    connectedPath = seen.has(puz.b) && seen.size === trackCount;
  }

  const solved = bad.size === 0 && rowOk && colOk && connectedPath;
  return { bad, row, col, rowOk, colOk, connectedPath, solved };
}

export default function Tracks() {
  const [size, setSize] = useState(8);
  const [difficulty, setDifficulty] = useState('medium');
  const [puz, setPuz] = useState(null);
  const [marks, setMarks] = useState([]);

  const generateNew = useCallback(() => {
    const p = generatePuzzle(size, difficulty);
    setPuz(p);
    const m = new Array(p.w * p.h).fill(0);
    m[p.a] = 1;
    m[p.b] = 1;
    for (const i of p.fixed) m[i] = 1;
    setMarks(m);
  }, [size, difficulty]);

  useEffect(() => {
    generateNew();
  }, []);

  const reset = useCallback(() => {
    if (!puz) return;
    const m = new Array(puz.w * puz.h).fill(0);
    m[puz.a] = 1;
    m[puz.b] = 1;
    for (const i of puz.fixed) m[i] = 1;
    setMarks(m);
  }, [puz]);

  const a = puz?.a;
  const b = puz?.b;

  const { bad, rowOk, colOk, connectedPath, solved } = useMemo(() => {
    if (!puz) return { bad: new Set(), rowOk: false, colOk: false, connectedPath: false, solved: false };
    return analyze(puz, marks);
  }, [puz, marks]);

  const toggle = (i) => {
    if (i === a || i === b) return;
    if (puz.fixed.has(i)) return;
    setMarks((prev) => {
      const n = prev.slice();
      n[i] = n[i] === 1 ? 0 : 1;
      return n;
    });
  };

  return (
    <div className={styles.container}>
      <GameHeader
        title="Tracks"
        instructions="Complete a single non-branching track from A to B (no crossings). The row/column clues (derived from this puzzle’s solution) indicate how many track squares must appear in each row/column. Click squares to toggle track."
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
          <label>Difficulty:</label>
          {DIFFICULTIES.map((d) => (
            <button
              key={d}
              className={`${styles.button} ${difficulty === d ? styles.active : ''}`}
              onClick={() => setDifficulty(d)}
            >
              {d.charAt(0).toUpperCase() + d.slice(1)}
            </button>
          ))}
        </div>
        <div className={styles.group}>
          <button className={styles.generateBtn} onClick={generateNew}>New Puzzle</button>
          <button className={styles.button} onClick={reset}>Reset</button>
          {puz && (
            <button
              className={styles.button}
              onClick={() => {
                const m = new Array(puz.w * puz.h).fill(0);
                for (const i of puz.solution) m[i] = 1;
                setMarks(m);
              }}
            >
              Reveal
            </button>
          )}
        </div>

        <div className={styles.status}>
          {solved ? <span className={styles.win}>Solved!</span> : (
            <span className={!rowOk || !colOk || !connectedPath ? styles.bad : ''}>
              {connectedPath ? 'Path OK' : 'Not a single A→B path'} · {rowOk ? 'Rows OK' : 'Row counts off'} · {colOk ? 'Cols OK' : 'Col counts off'}
            </span>
          )}
        </div>
      </div>

      {puz && (
        <div className={styles.wrap}>
          <div className={styles.grid} style={{ gridTemplateColumns: `repeat(${puz.w}, 42px)` }}>
            {Array.from({ length: puz.w * puz.h }, (_, i) => {
              const isTrack = marks[i] === 1;
              const isEnd = i === a || i === b;
              const isFixed = puz.fixed.has(i);
              const cls = [
                styles.cell,
                isTrack ? styles.track : '',
                isEnd ? styles.endpoint : '',
                isFixed ? styles.fixed : '',
                bad.has(i) ? styles.badCell : '',
              ].join(' ');
              let text = '';
              if (isEnd) text = i === a ? 'A' : 'B';
              return (
                <button key={i} className={cls} onClick={() => toggle(i)}>
                  {text}
                </button>
              );
            })}
          </div>

          <div className={styles.clues}>
            <div className={styles.clueRow}>
              <div><strong>Row clues</strong></div>
              <div className={styles.mono}>{puz.rowClues.join(' ')}</div>
            </div>
            <div className={styles.clueRow}>
              <div><strong>Column clues</strong></div>
              <div className={styles.mono}>{puz.colClues.join(' ')}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

