import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import GameHeader from '../../components/GameHeader';
import styles from './Netslide.module.css';

// Bitmask directions
const N = 1;
const E = 2;
const S = 4;
const W = 8;

function rcToIdx(r, c, w) {
  return r * w + c;
}

function idxToRC(idx, w) {
  return { r: Math.floor(idx / w), c: idx % w };
}

function opposite(dir) {
  if (dir === N) return S;
  if (dir === S) return N;
  if (dir === E) return W;
  return E;
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
    masks[cur] |= pick.dir;
    masks[nxt] |= opposite(pick.dir);
    stack.push(nxt);
  }
  return masks;
}

function shiftRow(board, w, row, dir) {
  const next = board.slice();
  const start = row * w;
  if (dir === 'left') {
    const first = next[start];
    for (let c = 0; c < w - 1; c++) next[start + c] = next[start + c + 1];
    next[start + w - 1] = first;
  } else {
    const last = next[start + w - 1];
    for (let c = w - 1; c > 0; c--) next[start + c] = next[start + c - 1];
    next[start] = last;
  }
  return next;
}

function shiftCol(board, w, h, col, dir) {
  const next = board.slice();
  if (dir === 'up') {
    const first = next[col];
    for (let r = 0; r < h - 1; r++) next[(r * w) + col] = next[((r + 1) * w) + col];
    next[((h - 1) * w) + col] = first;
  } else {
    const last = next[((h - 1) * w) + col];
    for (let r = h - 1; r > 0; r--) next[(r * w) + col] = next[((r - 1) * w) + col];
    next[col] = last;
  }
  return next;
}

function scrambleBySlides(masks, w, h, moves = 40) {
  let b = masks.slice();
  for (let i = 0; i < moves; i++) {
    if (Math.random() < 0.5) {
      const r = Math.floor(Math.random() * h);
      b = shiftRow(b, w, r, Math.random() < 0.5 ? 'left' : 'right');
    } else {
      const c = Math.floor(Math.random() * w);
      b = shiftCol(b, w, h, c, Math.random() < 0.5 ? 'up' : 'down');
    }
  }
  return b;
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
  const hasN = !!(mask & N);
  const hasE = !!(mask & E);
  const hasS = !!(mask & S);
  const hasW = !!(mask & W);
  const deg = (hasN ? 1 : 0) + (hasE ? 1 : 0) + (hasS ? 1 : 0) + (hasW ? 1 : 0);
  if (deg === 0) return '·';
  if (deg === 1) return hasN || hasS ? '│' : '─';
  if (deg === 2) {
    if (hasN && hasS) return '│';
    if (hasE && hasW) return '─';
    if (hasN && hasE) return '└';
    if (hasE && hasS) return '┌';
    if (hasS && hasW) return '┐';
    return '┘';
  }
  if (deg === 3) {
    if (!hasN) return '┬';
    if (!hasE) return '┤';
    if (!hasS) return '┴';
    return '├';
  }
  return '┼';
}

// Export helpers for testing
export {
  N, E, S, W,
  rcToIdx,
  idxToRC,
  opposite,
  neighbors,
  shuffled,
  makeTreeMasks,
  shiftRow,
  shiftCol,
  scrambleBySlides,
  edgeCountAndConnectivity,
  maskToGlyph,
};

export default function Netslide() {
  const { t } = useTranslation();
  const [size, setSize] = useState({ w: 7, h: 7 });
  const [solution, setSolution] = useState(() => makeTreeMasks(7, 7));
  const [masks, setMasks] = useState(() => scrambleBySlides(solution, 7, 7));
  const [moves, setMoves] = useState(0);

  const centerIdx = Math.floor((size.h * size.w) / 2);
  const conn = useMemo(() => edgeCountAndConnectivity(masks, size.w, size.h, centerIdx), [masks, size.w, size.h, centerIdx]);
  const total = size.w * size.h;
  const solved = conn.connectedCount === total && conn.edges === total - 1;

  const newGame = useCallback((w = size.w, h = size.h) => {
    const sol = makeTreeMasks(w, h);
    setSolution(sol);
    setMasks(scrambleBySlides(sol, w, h));
    setMoves(0);
  }, [size.w, size.h]);

  const doRow = (r, dir) => {
    setMasks((prev) => shiftRow(prev, size.w, r, dir));
    setMoves((m) => m + 1);
  };
  const doCol = (c, dir) => {
    setMasks((prev) => shiftCol(prev, size.w, size.h, c, dir));
    setMoves((m) => m + 1);
  };

  const showSolved = useCallback(() => {
    setMasks(solution.slice());
  }, [solution]);

  return (
    <div className={styles.container}>
      <GameHeader
        title="Netslide"
        instructions="Slide whole rows/columns (wrap-around) to restore a single connected network with no loops. Connected-to-center tiles are highlighted."
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
        <div className={styles.actions}>
          <button className={styles.button} onClick={() => newGame(size.w, size.h)}>New</button>
          <button className={styles.button} onClick={showSolved}>{t('common.reveal')}</button>
        </div>
        <div className={styles.status}>
          {solved ? <span className={styles.win}>{t('gameStatus.solved')}</span> : <span>{t('gameStatus.moves')}: {moves} • {t('gameStatus.connected')}: {conn.connectedCount}/{total}</span>}
        </div>
      </div>

      <div className={styles.frame} onContextMenu={(e) => e.preventDefault()}>
        <div className={styles.topArrows} style={{ gridTemplateColumns: `repeat(${size.w}, 1fr)` }}>
          {Array.from({ length: size.w }).map((_, c) => (
            <button
              key={c}
              className={styles.arrowBtn}
              onClick={() => doCol(c, 'down')}
              onMouseDown={(e) => { if (e.button === 2) doCol(c, 'up'); }}
              title="Left: down • Right: up"
            >
              ↓
            </button>
          ))}
        </div>

        <div className={styles.midRow}>
          <div className={styles.sideArrows} style={{ gridTemplateRows: `repeat(${size.h}, 1fr)` }}>
            {Array.from({ length: size.h }).map((_, r) => (
              <button
                key={r}
                className={styles.arrowBtn}
                onClick={() => doRow(r, 'right')}
                onMouseDown={(e) => { if (e.button === 2) doRow(r, 'left'); }}
                title="Left: right • Right: left"
              >
                →
              </button>
            ))}
          </div>

          <div className={styles.grid} style={{ gridTemplateColumns: `repeat(${size.w}, 1fr)` }}>
            {masks.map((mask, idx) => (
              <div
                key={idx}
                className={`${styles.tile} ${conn.seen[idx] ? styles.lit : ''}`}
                title={`tile ${idx}`}
              >
                <span className={styles.glyph}>{maskToGlyph(mask)}</span>
                {idx === centerIdx && <span className={styles.centerDot} />}
              </div>
            ))}
          </div>

          <div className={styles.sideArrows} style={{ gridTemplateRows: `repeat(${size.h}, 1fr)` }}>
            {Array.from({ length: size.h }).map((_, r) => (
              <button
                key={r}
                className={styles.arrowBtn}
                onClick={() => doRow(r, 'left')}
                onMouseDown={(e) => { if (e.button === 2) doRow(r, 'right'); }}
                title="Left: left • Right: right"
              >
                ←
              </button>
            ))}
          </div>
        </div>

        <div className={styles.bottomArrows} style={{ gridTemplateColumns: `repeat(${size.w}, 1fr)` }}>
          {Array.from({ length: size.w }).map((_, c) => (
            <button
              key={c}
              className={styles.arrowBtn}
              onClick={() => doCol(c, 'up')}
              onMouseDown={(e) => { if (e.button === 2) doCol(c, 'down'); }}
              title="Left: up • Right: down"
            >
              ↑
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
