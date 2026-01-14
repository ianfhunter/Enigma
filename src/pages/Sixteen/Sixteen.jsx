import { useCallback, useMemo, useState } from 'react';
import GameHeader from '../../components/GameHeader';
import styles from './Sixteen.module.css';

function makeSolved(w, h) {
  const out = [];
  for (let i = 1; i <= w * h; i++) out.push(i);
  return out;
}

function shiftRow(board, w, h, row, dir) {
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

function isSolved(board) {
  for (let i = 0; i < board.length; i++) {
    if (board[i] !== i + 1) return false;
  }
  return true;
}

function scramble(w, h, moves = 80, { rng = Math.random, maxAttempts = 2, onFallback } = {}) {
  const run = () => {
    let b = makeSolved(w, h);
    for (let i = 0; i < moves; i++) {
      const isRow = rng() < 0.5;
      if (isRow) {
        const r = Math.floor(rng() * h);
        const dir = rng() < 0.5 ? 'left' : 'right';
        b = shiftRow(b, w, h, r, dir);
      } else {
        const c = Math.floor(rng() * w);
        const dir = rng() < 0.5 ? 'up' : 'down';
        b = shiftCol(b, w, h, c, dir);
      }
    }
    return b;
  };

  for (let i = 0; i < maxAttempts; i++) {
    const b = run();
    if (!isSolved(b)) return b;
  }

  let b = run();
  if (isSolved(b)) {
    if (onFallback) onFallback();
    if (w > 1) b = shiftRow(b, w, h, 0, 'left');
    else if (h > 1) b = shiftCol(b, w, h, 0, 'up');
  }
  return b;
}

// Export helpers for testing
export {
  makeSolved,
  shiftRow,
  shiftCol,
  isSolved,
  scramble,
};

export default function Sixteen() {
  const [size, setSize] = useState({ w: 4, h: 4 });
  const [board, setBoard] = useState(() => scramble(4, 4));
  const solved = useMemo(() => isSolved(board), [board]);

  const newGame = useCallback((w = size.w, h = size.h) => {
    setBoard(scramble(w, h));
  }, [size.w, size.h]);

  const doRow = (r, dir) => setBoard((prev) => shiftRow(prev, size.w, size.h, r, dir));
  const doCol = (c, dir) => setBoard((prev) => shiftCol(prev, size.w, size.h, c, dir));

  return (
    <div className={styles.container}>
      <GameHeader
        title="Sixteen"
        instructions="Shift whole rows/columns with wrap-around to restore numerical order."
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
            <option value="4x4">4×4</option>
            <option value="5x5">5×5</option>
            <option value="6x6">6×6</option>
          </select>
        </label>
        <button className={styles.button} onClick={() => newGame(size.w, size.h)}>New</button>
        <div className={styles.status}>
          {solved ? <span className={styles.win}>Solved!</span> : <span>Keep shifting…</span>}
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
              title="Left click: down • Right click: up"
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
                title="Left click: right • Right click: left"
              >
                →
              </button>
            ))}
          </div>

          <div className={styles.grid} style={{ gridTemplateColumns: `repeat(${size.w}, 1fr)` }}>
            {board.map((v, i) => (
              <div key={i} className={styles.tile}>{v}</div>
            ))}
          </div>

          <div className={styles.sideArrows} style={{ gridTemplateRows: `repeat(${size.h}, 1fr)` }}>
            {Array.from({ length: size.h }).map((_, r) => (
              <button
                key={r}
                className={styles.arrowBtn}
                onClick={() => doRow(r, 'left')}
                onMouseDown={(e) => { if (e.button === 2) doRow(r, 'right'); }}
                title="Left click: left • Right click: right"
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
              title="Left click: up • Right click: down"
            >
              ↑
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
