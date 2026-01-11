import { useCallback, useMemo, useState } from 'react';
import GameHeader from '../../components/GameHeader';
import styles from './Loopy.module.css';

function idxHEdge(r, c, w) {
  // horizontal edge between (r,c) and (r,c+1), r in [0..h], c in [0..w-1]
  return r * w + c;
}
function idxVEdge(r, c, w) {
  // vertical edge between (r,c) and (r+1,c), r in [0..h-1], c in [0..w]
  return r * (w + 1) + c;
}

function makeRectanglePuzzle(w, h) {
  // Vertex grid: (h+1) x (w+1)
  const top = Math.floor(Math.random() * h);
  const bottom = top + 1 + Math.floor(Math.random() * (h - top));
  const left = Math.floor(Math.random() * w);
  const right = left + 1 + Math.floor(Math.random() * (w - left));

  // Build solved edges for a rectangle loop along vertex edges.
  const hEdges = new Array((h + 1) * w).fill(0);
  const vEdges = new Array(h * (w + 1)).fill(0);

  // Top and bottom horizontal segments
  for (let c = left; c < right; c++) {
    hEdges[idxHEdge(top, c, w)] = 1;
    hEdges[idxHEdge(bottom, c, w)] = 1;
  }
  // Left and right vertical segments
  for (let r = top; r < bottom; r++) {
    vEdges[idxVEdge(r, left, w)] = 1;
    vEdges[idxVEdge(r, right, w)] = 1;
  }

  // Clues: number of ON edges around each cell
  const clues = new Array(h * w).fill(null);
  for (let r = 0; r < h; r++) {
    for (let c = 0; c < w; c++) {
      const topE = hEdges[idxHEdge(r, c, w)];
      const botE = hEdges[idxHEdge(r + 1, c, w)];
      const leftE = vEdges[idxVEdge(r, c, w)];
      const rightE = vEdges[idxVEdge(r, c + 1, w)];
      const n = (topE === 1) + (botE === 1) + (leftE === 1) + (rightE === 1);
      clues[r * w + c] = n;
    }
  }

  return { w, h, clues, solution: { hEdges, vEdges } };
}

function analyze(w, h, clues, hEdges, vEdges) {
  const clueBad = new Set();
  for (let r = 0; r < h; r++) {
    for (let c = 0; c < w; c++) {
      const clue = clues[r * w + c];
      if (clue == null) continue;
      const topE = hEdges[idxHEdge(r, c, w)] === 1;
      const botE = hEdges[idxHEdge(r + 1, c, w)] === 1;
      const leftE = vEdges[idxVEdge(r, c, w)] === 1;
      const rightE = vEdges[idxVEdge(r, c + 1, w)] === 1;
      const count = (topE ? 1 : 0) + (botE ? 1 : 0) + (leftE ? 1 : 0) + (rightE ? 1 : 0);
      if (count !== clue) clueBad.add(r * w + c);
    }
  }

  // Build vertex degrees
  const deg = new Array((h + 1) * (w + 1)).fill(0);
  const adj = Array.from({ length: (h + 1) * (w + 1) }, () => []);
  let edgeCount = 0;

  const vtx = (r, c) => r * (w + 1) + c;

  // horizontal edges
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
  // vertical edges
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
    // must all have degree 2
    const degreesOk = active.every((i) => deg[i] === 2);
    if (degreesOk) {
      // connectivity
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
      // A single cycle implies edges == vertices in the connected subgraph
      if (connected && edgeCount === active.length) loopOk = true;
    }
  }

  const solved = clueBad.size === 0 && loopOk;
  return { clueBad, loopOk, solved };
}

export default function Loopy() {
  const [w, setW] = useState(8);
  const [h, setH] = useState(8);

  const [puz, setPuz] = useState(() => makeRectanglePuzzle(8, 8));
  const [hEdges, setHEdges] = useState(() => new Array((8 + 1) * 8).fill(0));
  const [vEdges, setVEdges] = useState(() => new Array(8 * (8 + 1)).fill(0));

  const rebuild = useCallback((nw = w, nh = h) => {
    const np = makeRectanglePuzzle(nw, nh);
    setPuz(np);
    setHEdges(new Array((nh + 1) * nw).fill(0));
    setVEdges(new Array(nh * (nw + 1)).fill(0));
  }, [w, h]);

  const { clueBad, loopOk, solved } = useMemo(
    () => analyze(puz.w, puz.h, puz.clues, hEdges, vEdges),
    [puz, hEdges, vEdges],
  );

  const cell = 44;
  const pad = 26;
  const svgW = pad * 2 + puz.w * cell;
  const svgH = pad * 2 + puz.h * cell;

  const toggleEdge = (kind, r, c, dir) => {
    // dir: 'on' for left click, 'off' for right click
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
    if (v === 1) return { stroke: 'rgba(0,0,0,0.95)', strokeWidth: 6, opacity: 1 };
    if (v === -1) return { stroke: 'rgba(255,255,255,0.22)', strokeWidth: 4, opacity: 1, strokeDasharray: '6 6' };
    return { stroke: 'rgba(245, 158, 11, 0.60)', strokeWidth: 4, opacity: 1 };
  };

  return (
    <div className={styles.container}>
      <GameHeader
        title="Loopy"
        instructions="Draw a single loop using some of the grid edges. Left-click an edge to include it; right-click to exclude it. The numbers in cells (here we show all of them) must match how many loop edges surround that cell."
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
              {[6, 7, 8, 9, 10].map((n) => <option key={n} value={n}>{n}</option>)}
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
              {[6, 7, 8, 9, 10].map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </label>
          <button className={styles.button} onClick={() => rebuild(w, h)}>New</button>
          <button
            className={styles.button}
            onClick={() => {
              // reveal the generated rectangle solution for quick sanity/testing
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
            <span className={loopOk ? '' : styles.bad}>
              {loopOk ? 'Loop OK' : 'Not a single loop yet'}
            </span>
          )}
        </div>
      </div>

      <div className={styles.svgWrap}>
        <svg width={svgW} height={svgH} viewBox={`0 0 ${svgW} ${svgH}`}>
          {/* Clues */}
          {Array.from({ length: puz.h * puz.w }, (_, i) => {
            const r = Math.floor(i / puz.w);
            const c = i % puz.w;
            const clue = puz.clues[i];
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
                fill={bad ? 'rgba(251,113,133,0.95)' : 'rgba(255,255,255,0.82)'}
              >
                {clue}
              </text>
            );
          })}

          {/* Edges (clickable) */}
          {/* Horizontal */}
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
          {/* Vertical */}
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

          {/* Dots */}
          {Array.from({ length: (puz.h + 1) * (puz.w + 1) }, (_, i) => {
            const r = Math.floor(i / (puz.w + 1));
            const c = i % (puz.w + 1);
            const x = pad + c * cell;
            const y = pad + r * cell;
            return <circle key={`dot-${i}`} cx={x} cy={y} r="2.3" fill="rgba(255,255,255,0.55)" />;
          })}
        </svg>
      </div>

      <div className={styles.hint}>
        Tip: right-clicking an edge marks it as “definitely not part of the loop”.
      </div>
    </div>
  );
}

