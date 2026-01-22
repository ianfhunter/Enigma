import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import GameHeader from '../../components/GameHeader';
import styles from './Fifteen.module.css';

function makeSolved(size) {
  const arr = [];
  for (let i = 1; i < size * size; i++) arr.push(i);
  arr.push(0); // blank
  return arr;
}

function idxToRC(idx, size) {
  return { r: Math.floor(idx / size), c: idx % size };
}

function rcToIdx(r, c, size) {
  return r * size + c;
}

function getArrowMoveIndex(blankIdx, size, key) {
  const { r, c } = idxToRC(blankIdx, size);

  switch (key) {
    case 'ArrowLeft':
      return c > 0 ? rcToIdx(r, c - 1, size) : null;
    case 'ArrowRight':
      return c < size - 1 ? rcToIdx(r, c + 1, size) : null;
    case 'ArrowUp':
      return r > 0 ? rcToIdx(r - 1, c, size) : null;
    case 'ArrowDown':
      return r < size - 1 ? rcToIdx(r + 1, c, size) : null;
    default:
      return null;
  }
}

function isSolved(board) {
  for (let i = 0; i < board.length - 1; i++) {
    if (board[i] !== i + 1) return false;
  }
  return board[board.length - 1] === 0;
}

function neighborsOfBlank(blankIdx, size) {
  const { r, c } = idxToRC(blankIdx, size);
  const out = [];
  if (r > 0) out.push(rcToIdx(r - 1, c, size));
  if (r < size - 1) out.push(rcToIdx(r + 1, c, size));
  if (c > 0) out.push(rcToIdx(r, c - 1, size));
  if (c < size - 1) out.push(rcToIdx(r, c + 1, size));
  return out;
}

function moveTile(board, size, tileIdx) {
  const blankIdx = board.indexOf(0);
  const { r: tr, c: tc } = idxToRC(tileIdx, size);
  const { r: br, c: bc } = idxToRC(blankIdx, size);

  // Single-tile move if adjacent
  if (Math.abs(tr - br) + Math.abs(tc - bc) === 1) {
    const next = board.slice();
    next[blankIdx] = next[tileIdx];
    next[tileIdx] = 0;
    return next;
  }

  // "Row/column slide" move: click any tile in same row/col as blank
  if (tr === br) {
    const next = board.slice();
    if (tc < bc) {
      // slide rightwards: [tc..bc-1] -> [tc+1..bc]
      for (let c = bc; c > tc; c--) next[rcToIdx(tr, c, size)] = next[rcToIdx(tr, c - 1, size)];
      next[rcToIdx(tr, tc, size)] = 0;
      return next;
    }
    if (tc > bc) {
      // slide leftwards
      for (let c = bc; c < tc; c++) next[rcToIdx(tr, c, size)] = next[rcToIdx(tr, c + 1, size)];
      next[rcToIdx(tr, tc, size)] = 0;
      return next;
    }
  }

  if (tc === bc) {
    const next = board.slice();
    if (tr < br) {
      // slide downward
      for (let r = br; r > tr; r--) next[rcToIdx(r, tc, size)] = next[rcToIdx(r - 1, tc, size)];
      next[rcToIdx(tr, tc, size)] = 0;
      return next;
    }
    if (tr > br) {
      // slide upward
      for (let r = br; r < tr; r++) next[rcToIdx(r, tc, size)] = next[rcToIdx(r + 1, tc, size)];
      next[rcToIdx(tr, tc, size)] = 0;
      return next;
    }
  }

  return null;
}

function scrambleFromSolved(size, steps = 250) {
  let board = makeSolved(size);
  let blankIdx = board.length - 1;
  let lastMoveFrom = null;
  for (let i = 0; i < steps; i++) {
    const opts = neighborsOfBlank(blankIdx, size).filter((idx) => idx !== lastMoveFrom);
    const pick = opts[Math.floor(Math.random() * opts.length)];
    const next = moveTile(board, size, pick);
    if (!next) continue;
    lastMoveFrom = blankIdx;
    board = next;
    blankIdx = board.indexOf(0);
  }
  return board;
}

// Export pure helpers for testing
export {
  getArrowMoveIndex,
  makeSolved,
  idxToRC,
  rcToIdx,
  isSolved,
  neighborsOfBlank,
  moveTile,
  scrambleFromSolved,
};

export default function Fifteen() {
  const [size, setSize] = useState(4);
  const [history, setHistory] = useState(() => [scrambleFromSolved(4)]);
  const [cursor, setCursor] = useState(0);

  const board = history[cursor];
  const solved = useMemo(() => isSolved(board), [board]);

  const pushBoard = useCallback((next) => {
    setHistory((prev) => {
      const base = prev.slice(0, cursor + 1);
      base.push(next);
      return base;
    });
    setCursor((c) => c + 1);
  }, [cursor]);

  const newGame = useCallback((nextSize = size) => {
    const fresh = scrambleFromSolved(nextSize);
    setHistory([fresh]);
    setCursor(0);
  }, [size]);

  const onTileClick = (idx) => {
    if (solved) return;
    const next = moveTile(board, size, idx);
    if (next) pushBoard(next);
  };

  const undo = useCallback(() => setCursor((c) => Math.max(0, c - 1)), []);
  const redo = useCallback(
    () => setCursor((c) => Math.min(history.length - 1, c + 1)),
    [history.length],
  );

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'z' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        undo();
        return;
      }
      if ((e.key === 'y' && (e.ctrlKey || e.metaKey)) || (e.key === 'z' && (e.ctrlKey || e.metaKey) && e.shiftKey)) {
        e.preventDefault();
        redo();
        return;
      }

      if (solved) return;

      const blankIdx = board.indexOf(0);
      const tileIdx = getArrowMoveIndex(blankIdx, size, e.key);
      if (tileIdx != null) {
        e.preventDefault();
        const next = moveTile(board, size, tileIdx);
        if (next) pushBoard(next);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [board, pushBoard, size, solved, undo, redo]);

  return (
    <div className={styles.container}>
      <GameHeader
        title="Fifteen"
        instructions="Slide tiles into the empty space to arrange 1–15 in order (blank bottom-right). Click a tile in the blank’s row/column to slide a whole run."
      />

      <div className={styles.toolbar}>
        <div className={styles.group}>
          <label className={styles.label}>
            Size
            <select
              className={styles.select}
              value={size}
              onChange={(e) => {
                const v = Number(e.target.value);
                setSize(v);
                newGame(v);
              }}
            >
              {[3, 4, 5].map((n) => (
                <option key={n} value={n}>{n}×{n}</option>
              ))}
            </select>
          </label>
          <button className={styles.button} onClick={() => newGame(size)}>New</button>
        </div>

        <div className={styles.group}>
          <button className={styles.button} onClick={undo} disabled={cursor === 0}>{t('common.undo')}</button>
          <button className={styles.button} onClick={redo} disabled={cursor === history.length - 1}>Redo</button>
        </div>

        <div className={styles.status}>
          {solved ? <span className={styles.win}>{t('gameStatus.solved')}</span> : <span>{t('gameStatus.moves')}: {cursor}</span>}
        </div>
      </div>

      <div
        className={styles.grid}
        style={{ gridTemplateColumns: `repeat(${size}, 1fr)` }}
      >
        {board.map((v, idx) => (
          <button
            key={idx}
            className={`${styles.tile} ${v === 0 ? styles.blank : ''}`}
            onClick={() => v !== 0 && onTileClick(idx)}
            disabled={v === 0}
            aria-label={v === 0 ? 'blank' : `tile ${v}`}
          >
            {v === 0 ? '' : v}
          </button>
        ))}
      </div>
    </div>
  );
}
