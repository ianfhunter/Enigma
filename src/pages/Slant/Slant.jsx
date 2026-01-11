import { useCallback, useMemo, useState } from 'react';
import GameHeader from '../../components/GameHeader';
import styles from './Slant.module.css';

function vIdx(r, c, w) {
  return r * (w + 1) + c;
}

class DSU {
  constructor(n) {
    this.p = Array.from({ length: n }, (_, i) => i);
    this.r = Array(n).fill(0);
  }
  find(x) {
    let a = x;
    while (this.p[a] !== a) a = this.p[a];
    while (this.p[x] !== x) {
      const nx = this.p[x];
      this.p[x] = a;
      x = nx;
    }
    return a;
  }
  union(a, b) {
    let ra = this.find(a);
    let rb = this.find(b);
    if (ra === rb) return false;
    if (this.r[ra] < this.r[rb]) [ra, rb] = [rb, ra];
    this.p[rb] = ra;
    if (this.r[ra] === this.r[rb]) this.r[ra]++;
    return true;
  }
}

function generateAcyclicSolution(w, h) {
  const cells = Array.from({ length: h }, () => Array(w).fill(null));
  const nVerts = (w + 1) * (h + 1);
  for (let attempt = 0; attempt < 200; attempt++) {
    const dsu = new DSU(nVerts);
    let ok = true;
    const order = [];
    for (let r = 0; r < h; r++) for (let c = 0; c < w; c++) order.push([r, c]);
    for (let i = order.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [order[i], order[j]] = [order[j], order[i]];
    }

    for (const [r, c] of order) {
      const aBack = vIdx(r, c, w);
      const bBack = vIdx(r + 1, c + 1, w);
      const aFwd = vIdx(r, c + 1, w);
      const bFwd = vIdx(r + 1, c, w);

      const first = Math.random() < 0.5 ? '\\' : '/';
      const tryOrder = first === '\\' ? ['\\', '/'] : ['/', '\\'];
      let placed = false;
      for (const ch of tryOrder) {
        const [u, v] = ch === '\\' ? [aBack, bBack] : [aFwd, bFwd];
        if (dsu.union(u, v)) {
          cells[r][c] = ch;
          placed = true;
          break;
        }
      }
      if (!placed) {
        ok = false;
        break;
      }
    }
    if (ok) return cells;
  }
  // Fallback: empty
  return cells;
}

function degreesFromCells(cells) {
  const h = cells.length;
  const w = cells[0].length;
  const deg = Array((w + 1) * (h + 1)).fill(0);
  for (let r = 0; r < h; r++) {
    for (let c = 0; c < w; c++) {
      const ch = cells[r][c];
      if (!ch) continue;
      if (ch === '\\') {
        deg[vIdx(r, c, w)]++;
        deg[vIdx(r + 1, c + 1, w)]++;
      } else {
        deg[vIdx(r, c + 1, w)]++;
        deg[vIdx(r + 1, c, w)]++;
      }
    }
  }
  return deg;
}

function analyze(cells, targetDeg) {
  const h = cells.length;
  const w = cells[0].length;
  const nVerts = (w + 1) * (h + 1);
  const dsu = new DSU(nVerts);
  const deg = Array(nVerts).fill(0);
  let hasLoop = false;
  let filled = true;

  for (let r = 0; r < h; r++) {
    for (let c = 0; c < w; c++) {
      const ch = cells[r][c];
      if (!ch) {
        filled = false;
        continue;
      }
      let u;
      let v;
      if (ch === '\\') {
        u = vIdx(r, c, w);
        v = vIdx(r + 1, c + 1, w);
      } else {
        u = vIdx(r, c + 1, w);
        v = vIdx(r + 1, c, w);
      }
      deg[u]++;
      deg[v]++;
      if (!dsu.union(u, v)) hasLoop = true;
    }
  }

  const over = deg.map((d, i) => (d > targetDeg[i]));
  const exact = filled && !hasLoop && deg.every((d, i) => d === targetDeg[i]);

  return { deg, hasLoop, filled, over, exact };
}

export default function Slant() {
  const [size, setSize] = useState({ w: 8, h: 8 });
  const [solution, setSolution] = useState(() => generateAcyclicSolution(8, 8));
  const [cells, setCells] = useState(() => Array.from({ length: 8 }, () => Array(8).fill(null)));

  const targetDeg = useMemo(() => degreesFromCells(solution), [solution]);
  const a = useMemo(() => analyze(cells, targetDeg), [cells, targetDeg]);

  const newGame = useCallback((w = size.w, h = size.h) => {
    const sol = generateAcyclicSolution(w, h);
    setSolution(sol);
    setCells(Array.from({ length: h }, () => Array(w).fill(null)));
  }, [size.w, size.h]);

  const cycleCell = (r, c, dir = 'left') => {
    setCells((prev) => {
      const next = prev.map((row) => row.slice());
      const cur = next[r][c];
      const order = dir === 'left' ? [null, '\\', '/'] : [null, '/', '\\'];
      const idx = order.indexOf(cur);
      next[r][c] = order[(idx + 1) % order.length];
      return next;
    });
  };

  const w = size.w;
  const h = size.h;

  return (
    <div className={styles.container}>
      <GameHeader
        title="Slant"
        instructions="Place a / or \\ in every cell. Vertex numbers show how many diagonals touch that vertex. Diagonals must not form any loops."
      />

      <div className={styles.toolbar}>
        <label className={styles.label}>
          Size
          <select
            className={styles.select}
            value={`${w}x${h}`}
            onChange={(e) => {
              const [nw, nh] = e.target.value.split('x').map(Number);
              setSize({ w: nw, h: nh });
              newGame(nw, nh);
            }}
          >
            <option value="6x6">6×6</option>
            <option value="8x8">8×8</option>
            <option value="10x10">10×10</option>
          </select>
        </label>
        <button className={styles.button} onClick={() => newGame(w, h)}>New</button>
        <div className={styles.status}>
          {a.exact ? <span className={styles.win}>Solved!</span> : a.hasLoop ? <span className={styles.bad}>Loop detected</span> : <span>{a.filled ? 'All cells filled' : 'Fill all cells'}</span>}
        </div>
      </div>

      <div className={styles.boardWrap} onContextMenu={(e) => e.preventDefault()}>
        <div className={styles.vertexGrid} style={{ gridTemplateColumns: `repeat(${w + 1}, 1fr)` }}>
          {Array.from({ length: (w + 1) * (h + 1) }).map((_, i) => (
            <div
              key={i}
              className={`${styles.vertex} ${a.over[i] ? styles.vertexBad : ''}`}
              title={`target ${targetDeg[i]}, current ${a.deg[i]}`}
            >
              {targetDeg[i]}
            </div>
          ))}
        </div>

        <div className={styles.cellGrid} style={{ gridTemplateColumns: `repeat(${w}, 1fr)` }}>
          {cells.map((row, r) =>
            row.map((ch, c) => (
              <button
                key={`${r},${c}`}
                className={styles.cell}
                onClick={() => cycleCell(r, c, 'left')}
                onMouseDown={(e) => {
                  if (e.button === 2) cycleCell(r, c, 'right');
                }}
                aria-label={`cell ${r},${c}`}
              >
                <span className={styles.slash}>{ch ?? ''}</span>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

