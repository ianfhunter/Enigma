import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import GameHeader from '../../components/GameHeader';
import { createSeededRandom } from '../../data/wordUtils';
import styles from './Pearl.module.css';

function idxH(r, c, w) {
  // edge between (r,c) and (r,c+1), r in [0..h-1], c in [0..w-2]
  return r * (w - 1) + c;
}
function idxV(r, c, w) {
  // edge between (r,c) and (r+1,c), r in [0..h-2], c in [0..w-1]
  return r * w + c;
}
function cellIdx(r, c, w) {
  return r * w + c;
}

function makeRectLoopCells(w, h) {
  const top = Math.floor(Math.random() * (h - 2));
  const left = Math.floor(Math.random() * (w - 2));
  const bottom = top + 1 + Math.floor(Math.random() * (h - top - 1));
  const right = left + 1 + Math.floor(Math.random() * (w - left - 1));

  // Perimeter cells in order (clockwise)
  const cells = [];
  for (let c = left; c <= right; c++) cells.push({ r: top, c });
  for (let r = top + 1; r <= bottom; r++) cells.push({ r, c: right });
  for (let c = right - 1; c >= left; c--) cells.push({ r: bottom, c });
  for (let r = bottom - 1; r > top; r--) cells.push({ r, c: left });

  return { top, left, bottom, right, cells };
}

function generatePearl(w, h) {
  const hEdges = new Array(h * (w - 1)).fill(0);
  const vEdges = new Array((h - 1) * w).fill(0);

  const { cells } = makeRectLoopCells(w, h);

  // Connect consecutive cells (including wrap)
  for (let i = 0; i < cells.length; i++) {
    const a = cells[i];
    const b = cells[(i + 1) % cells.length];
    if (a.r === b.r) {
      const r = a.r;
      const c = Math.min(a.c, b.c);
      hEdges[idxH(r, c, w)] = 1;
    } else {
      const c = a.c;
      const r = Math.min(a.r, b.r);
      vEdges[idxV(r, c, w)] = 1;
    }
  }

  // Determine loop degree + whether corner for each loop cell
  const deg = new Array(h * w).fill(0);
  const hasH = new Array(h * w).fill(false);
  const hasV = new Array(h * w).fill(false);

  const addDeg = (r, c, kind) => {
    const i = cellIdx(r, c, w);
    deg[i] += 1;
    if (kind === 'h') hasH[i] = true;
    if (kind === 'v') hasV[i] = true;
  };

  for (let r = 0; r < h; r++) {
    for (let c = 0; c < w - 1; c++) {
      if (hEdges[idxH(r, c, w)] !== 1) continue;
      addDeg(r, c, 'h');
      addDeg(r, c + 1, 'h');
    }
  }
  for (let r = 0; r < h - 1; r++) {
    for (let c = 0; c < w; c++) {
      if (vEdges[idxV(r, c, w)] !== 1) continue;
      addDeg(r, c, 'v');
      addDeg(r + 1, c, 'v');
    }
  }

  const isCorner = (i) => deg[i] === 2 && hasH[i] && hasV[i];
  const isStraight = (i) => deg[i] === 2 && ((hasH[i] && !hasV[i]) || (!hasH[i] && hasV[i]));

  // Build adjacency for loop cells
  const adj = Array.from({ length: h * w }, () => []);
  for (let r = 0; r < h; r++) {
    for (let c = 0; c < w - 1; c++) {
      if (hEdges[idxH(r, c, w)] === 1) {
        const a = cellIdx(r, c, w);
        const b = cellIdx(r, c + 1, w);
        adj[a].push(b);
        adj[b].push(a);
      }
    }
  }
  for (let r = 0; r < h - 1; r++) {
    for (let c = 0; c < w; c++) {
      if (vEdges[idxV(r, c, w)] === 1) {
        const a = cellIdx(r, c, w);
        const b = cellIdx(r + 1, c, w);
        adj[a].push(b);
        adj[b].push(a);
      }
    }
  }

  // Place pearls consistent with this loop.
  const pearls = new Array(h * w).fill(0); // 0 none, 1 white, 2 black
  const loopCells = [];
  for (let i = 0; i < deg.length; i++) if (deg[i] === 2) loopCells.push(i);

  // Candidate black pearls: corners where both neighbors are straight.
  const blackCandidates = loopCells.filter((i) => isCorner(i) && adj[i].every((n) => isStraight(n)));
  // Candidate white pearls: straight cells where at least one neighbor is a corner.
  const whiteCandidates = loopCells.filter((i) => isStraight(i) && adj[i].some((n) => isCorner(n)));

  // Shuffle candidates
  const shuffle = (arr) => {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  const bPick = shuffle(blackCandidates).slice(0, Math.max(2, Math.floor(blackCandidates.length * 0.4)));
  for (const i of bPick) pearls[i] = 2;

  const wPick = shuffle(whiteCandidates).slice(0, Math.max(2, Math.floor(whiteCandidates.length * 0.25)));
  for (const i of wPick) if (pearls[i] === 0) pearls[i] = 1;

  return { w, h, pearls, solution: { hEdges, vEdges } };
}

function analyze(w, h, pearls, hEdges, vEdges) {
  // Build degrees and adjacency on cell graph.
  const n = w * h;
  const deg = new Array(n).fill(0);
  const adj = Array.from({ length: n }, () => []);
  const hasH = new Array(n).fill(false);
  const hasV = new Array(n).fill(false);
  let edgeCount = 0;

  const add = (a, b, kind) => {
    deg[a]++; deg[b]++;
    adj[a].push(b); adj[b].push(a);
    if (kind === 'h') { hasH[a] = true; hasH[b] = true; }
    if (kind === 'v') { hasV[a] = true; hasV[b] = true; }
    edgeCount++;
  };

  for (let r = 0; r < h; r++) {
    for (let c = 0; c < w - 1; c++) {
      if (hEdges[idxH(r, c, w)] !== 1) continue;
      add(cellIdx(r, c, w), cellIdx(r, c + 1, w), 'h');
    }
  }
  for (let r = 0; r < h - 1; r++) {
    for (let c = 0; c < w; c++) {
      if (vEdges[idxV(r, c, w)] !== 1) continue;
      add(cellIdx(r, c, w), cellIdx(r + 1, c, w), 'v');
    }
  }

  const active = [];
  for (let i = 0; i < n; i++) if (deg[i] > 0) active.push(i);

  let loopOk = false;
  if (active.length > 0) {
    const degOk = active.every((i) => deg[i] === 2);
    if (degOk) {
      const seen = new Set([active[0]]);
      const stack = [active[0]];
      while (stack.length) {
        const u = stack.pop();
        for (const v of adj[u]) if (!seen.has(v)) { seen.add(v); stack.push(v); }
      }
      const connected = active.every((i) => seen.has(i));
      if (connected && edgeCount === active.length) loopOk = true;
    }
  }

  const isCorner = (i) => deg[i] === 2 && hasH[i] && hasV[i];
  const isStraight = (i) => deg[i] === 2 && ((hasH[i] && !hasV[i]) || (!hasH[i] && hasV[i]));

  const bad = new Set();
  for (let i = 0; i < n; i++) {
    const p = pearls[i];
    if (p === 0) continue;
    if (deg[i] !== 2) { bad.add(i); continue; }
    if (p === 2) {
      // black: must be corner; neighbors in loop must be straight
      if (!isCorner(i)) { bad.add(i); continue; }
      const [a, b] = adj[i];
      if (!isStraight(a) || !isStraight(b)) bad.add(i);
    } else if (p === 1) {
      // white: must be straight; at least one neighbor in loop is a corner
      if (!isStraight(i)) { bad.add(i); continue; }
      const [a, b] = adj[i];
      if (!isCorner(a) && !isCorner(b)) bad.add(i);
    }
  }

  const solved = loopOk && bad.size === 0;
  return { loopOk, bad, solved };
}

// Export helpers for testing
export {
  idxH,
  idxV,
  cellIdx,
  makeRectLoopCells,
  generatePearl,
  analyze,
};

export default function Pearl() {
  const { t } = useTranslation();
  const [w, setW] = useState(8);
  const [h, setH] = useState(8);

  const [puz, setPuz] = useState(() => generatePearl(8, 8));
  const [hEdges, setHEdges] = useState(() => new Array(8 * (8 - 1)).fill(0));
  const [vEdges, setVEdges] = useState(() => new Array((8 - 1) * 8).fill(0));

  const rebuild = useCallback((nw = w, nh = h) => {
    const np = generatePearl(nw, nh);
    setPuz(np);
    setHEdges(new Array(nh * (nw - 1)).fill(0));
    setVEdges(new Array((nh - 1) * nw).fill(0));
  }, [w, h]);

  const { loopOk, bad, solved } = useMemo(
    () => analyze(puz.w, puz.h, puz.pearls, hEdges, vEdges),
    [puz, hEdges, vEdges],
  );

  const cell = 44;
  const pad = 28;
  const svgW = pad * 2 + (puz.w - 1) * cell;
  const svgH = pad * 2 + (puz.h - 1) * cell;

  const strokeFor = (v) => {
    if (v === 1) return { stroke: 'var(--color-primary)', strokeWidth: 6, opacity: 1 };
    if (v === -1) return { stroke: 'var(--color-text-muted)', strokeWidth: 4, opacity: 1, strokeDasharray: '6 6' };
    return { stroke: 'var(--game-cell-border)', strokeWidth: 4, opacity: 1 };
  };

  const toggleEdge = (kind, r, c, mode) => {
    if (kind === 'h') {
      const i = idxH(r, c, puz.w);
      setHEdges((prev) => {
        const n = prev.slice();
        const cur = n[i];
        if (mode === 'on') n[i] = cur === 1 ? 0 : 1;
        else n[i] = cur === -1 ? 0 : -1;
        return n;
      });
    } else {
      const i = idxV(r, c, puz.w);
      setVEdges((prev) => {
        const n = prev.slice();
        const cur = n[i];
        if (mode === 'on') n[i] = cur === 1 ? 0 : 1;
        else n[i] = cur === -1 ? 0 : -1;
        return n;
      });
    }
  };

  return (
    <div className={styles.container}>
      <GameHeader
        title="Pearl"
        instructions="Draw a single closed loop through some squares. Black pearls must be corners and the loop must go straight through the next square on both sides. White pearls must be straight, and at least one adjacent square along the loop must be a corner."
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
              {[6, 7, 8, 9, 10].filter((n) => n >= 6).map((n) => <option key={n} value={n}>{n}</option>)}
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
              {[6, 7, 8, 9, 10].filter((n) => n >= 6).map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </label>
          <button className={styles.button} onClick={() => rebuild(w, h)}>New</button>
          <button
            className={styles.button}
            onClick={() => {
              setHEdges(new Array(puz.h * (puz.w - 1)).fill(0));
              setVEdges(new Array((puz.h - 1) * puz.w).fill(0));
            }}
          >
            Clear
          </button>
          <button
            className={styles.button}
            onClick={() => {
              setHEdges(puz.solution.hEdges.slice());
              setVEdges(puz.solution.vEdges.slice());
            }}
          >
            Reveal
          </button>
        </div>

        <div className={styles.status}>
          {solved ? <span className={styles.win}>Solved!</span> : (
            <span className={(loopOk && bad.size === 0) ? '' : styles.bad}>
              {loopOk ? (bad.size === 0 ? 'Loop OK' : 'Pearl rule violation') : 'Not a single loop yet'}
            </span>
          )}
        </div>
      </div>

      <div className={styles.svgWrap}>
        <svg width={svgW} height={svgH} viewBox={`0 0 ${svgW} ${svgH}`}>
          {/* Draw faint lattice */}
          {Array.from({ length: puz.h }, (_, r) => (
            <line
              key={`gridrow-${r}`}
              x1={pad}
              y1={pad + r * cell}
              x2={pad + (puz.w - 1) * cell}
              y2={pad + r * cell}
              stroke="var(--game-cell-border)"
              strokeWidth="2"
            />
          ))}
          {Array.from({ length: puz.w }, (_, c) => (
            <line
              key={`gridcol-${c}`}
              x1={pad + c * cell}
              y1={pad}
              x2={pad + c * cell}
              y2={pad + (puz.h - 1) * cell}
              stroke="var(--game-cell-border)"
              strokeWidth="2"
            />
          ))}

          {/* Edges between cell centres */}
          {/* Horizontal */}
          {Array.from({ length: puz.h * (puz.w - 1) }, (_, i) => {
            const r = Math.floor(i / (puz.w - 1));
            const c = i % (puz.w - 1);
            const x1 = pad + c * cell;
            const y1 = pad + r * cell;
            const x2 = x1 + cell;
            const y2 = y1;
            const st = strokeFor(hEdges[i]);
            return (
              <g key={`h-${i}`}>
                <line x1={x1} y1={y1} x2={x2} y2={y2} {...st} strokeLinecap="round" />
                <line
                  x1={x1} y1={y1} x2={x2} y2={y2}
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
          {Array.from({ length: (puz.h - 1) * puz.w }, (_, i) => {
            const r = Math.floor(i / puz.w);
            const c = i % puz.w;
            const x1 = pad + c * cell;
            const y1 = pad + r * cell;
            const x2 = x1;
            const y2 = y1 + cell;
            const st = strokeFor(vEdges[i]);
            return (
              <g key={`v-${i}`}>
                <line x1={x1} y1={y1} x2={x2} y2={y2} {...st} strokeLinecap="round" />
                <line
                  x1={x1} y1={y1} x2={x2} y2={y2}
                  stroke="transparent"
                  strokeWidth="18"
                  onClick={() => toggleEdge('v', r, c, 'on')}
                  onContextMenu={(e) => { e.preventDefault(); toggleEdge('v', r, c, 'off'); }}
                  style={{ cursor: 'pointer' }}
                />
              </g>
            );
          })}

          {/* Pearls */}
          {Array.from({ length: puz.h * puz.w }, (_, i) => {
            const p = puz.pearls[i];
            if (p === 0) return null;
            const r = Math.floor(i / puz.w);
            const c = i % puz.w;
            const x = pad + c * cell;
            const y = pad + r * cell;
            const isBad = bad.has(i);
            if (p === 2) {
              // Black pearl
              return (
                <circle
                  key={`pb-${i}`}
                  cx={x}
                  cy={y}
                  r="10"
                  fill={isBad ? 'var(--color-danger)' : 'var(--color-text)'}
                  stroke="var(--color-bg)"
                  strokeWidth="2"
                />
              );
            }
            // White pearl
            return (
              <circle
                key={`pw-${i}`}
                cx={x}
                cy={y}
                r="10"
                fill="var(--color-bg)"
                stroke={isBad ? 'var(--color-danger)' : 'var(--color-text)'}
                strokeWidth="3"
              />
            );
          })}
        </svg>
      </div>

      <div className={styles.hint}>
        Left-click toggles a loop segment; right-click toggles a “no segment” cross marker.
      </div>
    </div>
  );
}
