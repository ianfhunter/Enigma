import { useCallback, useMemo, useState } from 'react';
import GameHeader from '../../components/GameHeader';
import styles from './Netgame.module.css';

// Bitmask directions
const N = 1;
const E = 2;
const S = 4;
const W = 8;

function rotateMaskCW(mask) {
  // N->E, E->S, S->W, W->N
  const n = (mask & N) ? E : 0;
  const e = (mask & E) ? S : 0;
  const s = (mask & S) ? W : 0;
  const w = (mask & W) ? N : 0;
  return n | e | s | w;
}

function rotateMask(mask, turns) {
  let m = mask;
  for (let i = 0; i < ((turns % 4) + 4) % 4; i++) m = rotateMaskCW(m);
  return m;
}

function rcToIdx(r, c, w) {
  return r * w + c;
}

function idxToRC(idx, w) {
  return { r: Math.floor(idx / w), c: idx % w };
}

function neighbors(idx, w, h) {
  const { r, c } = idxToRC(idx, w);
  const out = [];
  if (r > 0) out.push({ dir: N, idx: rcToIdx(r - 1, c, w) });
  if (c < w - 1) out.push({ dir: E, idx: rcToIdx(r, c + 1, w) });
  if (r < h - 1) out.push({ dir: S, idx: rcToIdx(r + 1, c, w) });
  if (c > 0) out.push({ dir: W, idx: rcToIdx(r, c - 1, w) });
  return out;
}

function opposite(dir) {
  if (dir === N) return S;
  if (dir === S) return N;
  if (dir === E) return W;
  return E;
}

function shuffled(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function makeTreeMasks(w, h) {
  const n = w * h;
  const masks = Array(n).fill(0);
  const visited = Array(n).fill(false);
  const stack = [Math.floor(Math.random() * n)];
  visited[stack[0]] = true;

  while (stack.length) {
    const cur = stack[stack.length - 1];
    const ns = shuffled(neighbors(cur, w, h).filter((x) => !visited[x.idx]));
    if (!ns.length) {
      stack.pop();
      continue;
    }
    const pick = ns[0];
    const nxt = pick.idx;
    visited[nxt] = true;
    // add undirected edge
    masks[cur] |= pick.dir;
    masks[nxt] |= opposite(pick.dir);
    stack.push(nxt);
  }
  return masks;
}

function scrambleMasks(masks) {
  return masks.map((m) => rotateMask(m, Math.floor(Math.random() * 4)));
}

function edgeCountAndConnectivity(masks, w, h, startIdx) {
  const n = w * h;
  const seen = Array(n).fill(false);
  const q = [startIdx];
  seen[startIdx] = true;

  let edges = 0;
  while (q.length) {
    const cur = q.pop();
    const curMask = masks[cur];
    for (const nb of neighbors(cur, w, h)) {
      if (curMask & nb.dir) {
        const otherMask = masks[nb.idx];
        if (otherMask & opposite(nb.dir)) {
          // count each undirected edge once
          if (cur < nb.idx) edges++;
          if (!seen[nb.idx]) {
            seen[nb.idx] = true;
            q.push(nb.idx);
          }
        }
      }
    }
  }
  const connectedCount = seen.filter(Boolean).length;
  return { edges, connectedCount, seen };
}

function maskToGlyph(mask) {
  // Box drawing characters for 4-neighbor connectors
  const hasN = !!(mask & N);
  const hasE = !!(mask & E);
  const hasS = !!(mask & S);
  const hasW = !!(mask & W);

  const deg = (hasN ? 1 : 0) + (hasE ? 1 : 0) + (hasS ? 1 : 0) + (hasW ? 1 : 0);
  if (deg === 0) return '·';
  if (deg === 1) {
    // Use directional half-line characters to show which way single arms point
    if (hasN) return '╵'; // connects up only
    if (hasS) return '╷'; // connects down only
    if (hasE) return '╶'; // connects right only
    return '╴'; // connects left only (hasW)
  }
  if (deg === 2) {
    if (hasN && hasS) return '│';
    if (hasE && hasW) return '─';
    if (hasN && hasE) return '└';
    if (hasE && hasS) return '┌';
    if (hasS && hasW) return '┐';
    if (hasW && hasN) return '┘';
  }
  if (deg === 3) {
    if (!hasN) return '┬';
    if (!hasE) return '┤';
    if (!hasS) return '┴';
    return '├';
  }
  return '┼';
}

export default function Netgame() {
  const [size, setSize] = useState({ w: 7, h: 7 });
  const [locked, setLocked] = useState(() => Array(49).fill(false));
  const [solution] = useState(() => makeTreeMasks(7, 7));
  const [masks, setMasks] = useState(() => scrambleMasks(solution));

  const centerIdx = Math.floor((size.h * size.w) / 2);
  const conn = useMemo(() => edgeCountAndConnectivity(masks, size.w, size.h, centerIdx), [masks, size.w, size.h, centerIdx]);
  const total = size.w * size.h;
  const solved = conn.connectedCount === total && conn.edges === total - 1;

  const newGame = useCallback((w = size.w, h = size.h) => {
    const sol = makeTreeMasks(w, h);
    setMasks(scrambleMasks(sol));
    setLocked(Array(w * h).fill(false));
    // Keep `solution` as initial state only; correctness is checked structurally (connected + acyclic)
  }, [size.w, size.h]);

  const rotate = (idx, dir) => {
    if (locked[idx]) return;
    setMasks((prev) => {
      const next = prev.slice();
      if (dir === 'cw') next[idx] = rotateMaskCW(next[idx]);
      else next[idx] = rotateMask(next[idx], 3);
      return next;
    });
  };

  const toggleLock = (idx) => setLocked((prev) => prev.map((v, i) => (i === idx ? !v : v)));

  return (
    <div className={styles.container}>
      <GameHeader
        title="Net"
        instructions="Rotate tiles to form one connected network with no loops. Tiles connected to the center are highlighted. Shift-click to lock a tile."
      />

      <div className={styles.toolbar}>
        <label className={styles.label}>
          Size
          <select
            className={styles.select}
            value={`${size.w}x${size.h}`}
            onChange={(e) => {
              const [w, h] = e.target.value.split('x').map(Number);
              setSize({ w, h });
              newGame(w, h);
            }}
          >
            <option value="5x5">5×5</option>
            <option value="7x7">7×7</option>
            <option value="9x9">9×9</option>
          </select>
        </label>
        <button className={styles.button} onClick={() => newGame(size.w, size.h)}>New</button>
        <div className={styles.status}>
          {solved ? <span className={styles.win}>Connected + no loops!</span> : <span>Connected: {conn.connectedCount}/{total} • Edges: {conn.edges}/{total - 1}</span>}
        </div>
      </div>

      <div
        className={styles.grid}
        style={{ gridTemplateColumns: `repeat(${size.w}, 1fr)` }}
        onContextMenu={(e) => e.preventDefault()}
      >
        {masks.map((mask, idx) => {
          const lit = conn.seen[idx];
          const isLocked = locked[idx];
          return (
            <button
              key={idx}
              className={`${styles.tile} ${lit ? styles.lit : ''} ${isLocked ? styles.locked : ''}`}
              onClick={(e) => {
                if (e.shiftKey) {
                  toggleLock(idx);
                } else {
                  rotate(idx, 'cw');
                }
              }}
              onMouseDown={(e) => {
                if (e.button === 2) rotate(idx, 'ccw');
              }}
              title={isLocked ? 'Locked' : 'Rotate'}
            >
              <span className={styles.glyph}>{maskToGlyph(mask)}</span>
              {idx === centerIdx && <span className={styles.centerDot} />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
