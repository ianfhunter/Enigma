import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import GameHeader from '../../components/GameHeader';
import styles from './Twiddle.module.css';

function makeSolved(w, h) {
  const out = [];
  for (let i = 1; i <= w * h; i++) out.push(i);
  return out;
}

function isSolved(board) {
  for (let i = 0; i < board.length; i++) {
    if (board[i] !== i + 1) return false;
  }
  return true;
}

function rotateBlock(board, w, h, top, left, k, dir) {
  const next = board.slice();
  const get = (r, c) => board[(top + r) * w + (left + c)];
  const set = (r, c, v) => { next[(top + r) * w + (left + c)] = v; };

  // Rotate kxk by 90 deg
  for (let r = 0; r < k; r++) {
    for (let c = 0; c < k; c++) {
      const v = get(r, c);
      if (dir === 'ccw') {
        // (r,c) -> (k-1-c, r)
        set(k - 1 - c, r, v);
      } else {
        // cw: (r,c) -> (c, k-1-r)
        set(c, k - 1 - r, v);
      }
    }
  }
  return next;
}

function scramble(w, h, k, moves = 60) {
  let b = makeSolved(w, h);
  for (let i = 0; i < moves; i++) {
    const top = Math.floor(Math.random() * (h - k + 1));
    const left = Math.floor(Math.random() * (w - k + 1));
    const dir = Math.random() < 0.5 ? 'ccw' : 'cw';
    b = rotateBlock(b, w, h, top, left, k, dir);
  }
  if (isSolved(b)) return scramble(w, h, k, moves);
  return b;
}

// Export helpers for testing
export {
  makeSolved,
  isSolved,
  rotateBlock,
  scramble,
};

export default function Twiddle() {
  const { t } = useTranslation();
  const [size, setSize] = useState({ w: 4, h: 4 });
  const [k, setK] = useState(2);
  const [board, setBoard] = useState(() => scramble(4, 4, 2));

  const solved = useMemo(() => isSolved(board), [board]);

  const newGame = useCallback((w = size.w, h = size.h, nk = k) => {
    setBoard(scramble(w, h, nk));
  }, [size.w, size.h, k]);

  const doRotate = (top, left, dir) => {
    setBoard((prev) => rotateBlock(prev, size.w, size.h, top, left, k, dir));
  };

  const controls = useMemo(() => {
    const out = [];
    for (let r = 0; r <= size.h - k; r++) {
      for (let c = 0; c <= size.w - k; c++) out.push([r, c]);
    }
    return out;
  }, [size.h, size.w, k]);

  return (
    <div className={styles.container}>
      <GameHeader
        title="Twiddle"
        instructions="Rotate a square block of tiles to restore numerical order. Left click rotates counterclockwise, right click clockwise."
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
              newGame(w, h, k);
            }}
          >
            <option value="4x4">4×4</option>
            <option value="5x5">5×5</option>
            <option value="6x6">6×6</option>
          </select>
        </label>
        <label className={styles.label}>
          Block
          <select
            className={styles.select}
            value={k}
            onChange={(e) => {
              const nk = Number(e.target.value);
              setK(nk);
              newGame(size.w, size.h, nk);
            }}
          >
            <option value={2}>2×2</option>
            <option value={3}>3×3</option>
          </select>
        </label>
        <button className={styles.button} onClick={() => newGame(size.w, size.h, k)}>New</button>
        <div className={styles.status}>
          {solved ? <span className={styles.win}>{t('gameStatus.solved')}</span> : <span>{t('common.rotateBlocks')}</span>}
        </div>
      </div>

      <div className={styles.stage} onContextMenu={(e) => e.preventDefault()}>
        <div className={styles.grid} style={{ gridTemplateColumns: `repeat(${size.w}, 1fr)` }}>
          {board.map((v, i) => (
            <div key={i} className={styles.tile}>{v}</div>
          ))}
        </div>

        <div className={styles.controls}>
          {controls.map(([r, c]) => (
            <button
              key={`${r},${c}`}
              className={styles.ctrl}
              style={{
                gridRowStart: r + 1,
                gridColumnStart: c + 1,
                gridRowEnd: r + k + 1,
                gridColumnEnd: c + k + 1,
              }}
              onClick={() => doRotate(r, c, 'ccw')}
              onMouseDown={(e) => { if (e.button === 2) doRotate(r, c, 'cw'); }}
              title={`Rotate ${k}×${k}`}
              aria-label={`rotate block at ${r},${c}`}
            >
              ⟲
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
