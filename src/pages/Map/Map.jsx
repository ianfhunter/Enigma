import { useCallback, useMemo, useState } from 'react';
import GameHeader from '../../components/GameHeader';
import styles from './Map.module.css';

const COLORS = [
  { name: 'Red', hex: '#ef4444' },
  { name: 'Blue', hex: '#3b82f6' },
  { name: 'Green', hex: '#22c55e' },
  { name: 'Yellow', hex: '#f59e0b' },
];

function rcToIdx(r, c, w) {
  return r * w + c;
}
function idxToRC(i, w) {
  return { r: Math.floor(i / w), c: i % w };
}

function generateRegions(w, h, regionCount) {
  const n = w * h;
  const seeds = [];
  const used = new Set();
  while (seeds.length < Math.min(regionCount, n)) {
    const i = Math.floor(Math.random() * n);
    if (used.has(i)) continue;
    used.add(i);
    seeds.push(i);
  }

  // Multi-source BFS, with random tie-breaking by shuffle of queue insertions.
  const owner = new Array(n).fill(-1);
  const q = [];
  seeds.forEach((i, rid) => {
    owner[i] = rid;
    q.push(i);
  });

  for (let qi = 0; qi < q.length; qi++) {
    const u = q[qi];
    const { r, c } = idxToRC(u, w);
    const nbrs = [];
    if (r > 0) nbrs.push(rcToIdx(r - 1, c, w));
    if (r < h - 1) nbrs.push(rcToIdx(r + 1, c, w));
    if (c > 0) nbrs.push(rcToIdx(r, c - 1, w));
    if (c < w - 1) nbrs.push(rcToIdx(r, c + 1, w));
    for (let i = nbrs.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [nbrs[i], nbrs[j]] = [nbrs[j], nbrs[i]];
    }
    for (const v of nbrs) {
      if (owner[v] !== -1) continue;
      owner[v] = owner[u];
      q.push(v);
    }
  }

  const regions = seeds.length;

  // Build adjacency.
  const adj = Array.from({ length: regions }, () => new Set());
  for (let r = 0; r < h; r++) {
    for (let c = 0; c < w; c++) {
      const i = rcToIdx(r, c, w);
      const a = owner[i];
      if (r + 1 < h) {
        const b = owner[rcToIdx(r + 1, c, w)];
        if (a !== b) { adj[a].add(b); adj[b].add(a); }
      }
      if (c + 1 < w) {
        const b = owner[rcToIdx(r, c + 1, w)];
        if (a !== b) { adj[a].add(b); adj[b].add(a); }
      }
    }
  }

  // 4-coloring via backtracking.
  const order = Array.from({ length: regions }, (_, i) => i).sort((a, b) => adj[b].size - adj[a].size);
  const color = new Array(regions).fill(-1);
  const canUse = (rid, col) => {
    for (const nb of adj[rid]) if (color[nb] === col) return false;
    return true;
  };
  const dfs = (k) => {
    if (k === order.length) return true;
    const rid = order[k];
    for (let col = 0; col < 4; col++) {
      if (!canUse(rid, col)) continue;
      color[rid] = col;
      if (dfs(k + 1)) return true;
      color[rid] = -1;
    }
    return false;
  };
  dfs(0);

  // Pick givens: ensure at least one of each color if possible.
  const givens = new Array(regions).fill(-1);
  const reps = new Map();
  for (let rid = 0; rid < regions; rid++) {
    const col = color[rid];
    if (!reps.has(col)) reps.set(col, rid);
  }
  for (const [col, rid] of reps.entries()) givens[rid] = col;
  // Add a few more givens
  const extra = Math.max(2, Math.floor(regions * 0.12));
  for (let t = 0; t < extra; t++) {
    const rid = Math.floor(Math.random() * regions);
    givens[rid] = color[rid];
  }

  return { w, h, regions, owner, adj, solutionColors: color, givens };
}

function analyze(puz, assignment) {
  // assignment: -1 uncolored else 0..3
  const bad = new Set();
  for (let a = 0; a < puz.regions; a++) {
    const ca = assignment[a];
    if (ca < 0) continue;
    for (const b of puz.adj[a]) {
      if (b < a) continue;
      const cb = assignment[b];
      if (cb < 0) continue;
      if (ca === cb) { bad.add(a); bad.add(b); }
    }
  }
  const solved = bad.size === 0 && assignment.every((x) => x >= 0);
  return { bad, solved };
}

export default function MapGame() {
  const [w, setW] = useState(18);
  const [h, setH] = useState(12);
  const [regions, setRegions] = useState(22);

  const [puz, setPuz] = useState(() => generateRegions(18, 12, 22));
  const [sel, setSel] = useState(0);
  const [assign, setAssign] = useState(() => {
    const a = new Array(puz.regions).fill(-1);
    for (let r = 0; r < puz.regions; r++) if (puz.givens[r] >= 0) a[r] = puz.givens[r];
    return a;
  });

  const newGame = useCallback((nw = w, nh = h, nr = regions) => {
    const np = generateRegions(nw, nh, nr);
    setPuz(np);
    const a = new Array(np.regions).fill(-1);
    for (let r = 0; r < np.regions; r++) if (np.givens[r] >= 0) a[r] = np.givens[r];
    setAssign(a);
    setSel(0);
  }, [w, h, regions]);

  const { bad, solved } = useMemo(() => analyze(puz, assign), [puz, assign]);

  const paintRegion = (rid) => {
    if (puz.givens[rid] >= 0) return;
    setAssign((prev) => {
      const n = prev.slice();
      n[rid] = n[rid] === sel ? -1 : sel;
      return n;
    });
  };

  const cellStyle = (rid, topBorder, leftBorder) => {
    const col = assign[rid];
    const given = puz.givens[rid] >= 0;
    const hex = col >= 0 ? COLORS[col].hex : 'rgba(255,255,255,0.06)';
    return {
      background: hex,
      borderTopWidth: topBorder ? 3 : 1,
      borderLeftWidth: leftBorder ? 3 : 1,
      borderTopColor: topBorder ? 'rgba(0,0,0,0.75)' : 'rgba(255,255,255,0.12)',
      borderLeftColor: leftBorder ? 'rgba(0,0,0,0.75)' : 'rgba(255,255,255,0.12)',
      boxShadow: given ? 'inset 0 0 0 2px rgba(255,255,255,0.80)' : (bad.has(rid) ? 'inset 0 0 0 2px rgba(251,113,133,0.90)' : undefined),
      cursor: given ? 'default' : 'pointer',
    };
  };

  return (
    <div className={styles.container}>
      <GameHeader
        title="Map"
        instructions="Color each region with one of four colors so that no two regions sharing an edge have the same color. Click a region to paint it with the selected color (click again to clear)."
      />

      <div className={styles.toolbar}>
        <div className={styles.group}>
          <label className={styles.label}>
            Width
            <input className={styles.input} type="number" min={10} max={26} value={w} onChange={(e) => setW(Number(e.target.value) || 18)} style={{ width: 70 }} />
          </label>
          <label className={styles.label}>
            Height
            <input className={styles.input} type="number" min={8} max={18} value={h} onChange={(e) => setH(Number(e.target.value) || 12)} style={{ width: 70 }} />
          </label>
          <label className={styles.label}>
            Regions
            <input className={styles.input} type="number" min={8} max={60} value={regions} onChange={(e) => setRegions(Number(e.target.value) || 22)} style={{ width: 80 }} />
          </label>
          <button className={styles.button} onClick={() => newGame(w, h, regions)}>New</button>
          <button
            className={styles.button}
            onClick={() => {
              const a = assign.slice();
              for (let r = 0; r < puz.regions; r++) if (puz.givens[r] < 0) a[r] = -1;
              setAssign(a);
            }}
          >
            Clear
          </button>
          <button className={styles.button} onClick={() => setAssign(puz.solutionColors.slice())}>Reveal</button>
        </div>

        <div className={styles.group}>
          <div className={styles.palette}>
            {COLORS.map((c, i) => (
              <span
                key={c.name}
                className={`${styles.swatch} ${sel === i ? styles.active : ''}`}
                style={{ background: c.hex }}
                onClick={() => setSel(i)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && setSel(i)}
                title={c.name}
              />
            ))}
          </div>
        </div>

        <div className={styles.status}>
          {solved ? <span className={styles.win}>Solved!</span> : (bad.size ? <span className={styles.bad}>Conflict</span> : <span>OK</span>)}
        </div>
      </div>

      <div className={styles.grid} style={{ gridTemplateColumns: `repeat(${puz.w}, 28px)` }}>
        {puz.owner.map((rid, i) => {
          const { r, c } = idxToRC(i, puz.w);
          const topBorder = r === 0 || puz.owner[rcToIdx(r - 1, c, puz.w)] !== rid;
          const leftBorder = c === 0 || puz.owner[rcToIdx(r, c - 1, puz.w)] !== rid;
          return (
            <div
              key={i}
              className={styles.cell}
              style={cellStyle(rid, topBorder, leftBorder)}
              onClick={() => paintRegion(rid)}
              title={`Region ${rid + 1}`}
            />
          );
        })}
      </div>
    </div>
  );
}

