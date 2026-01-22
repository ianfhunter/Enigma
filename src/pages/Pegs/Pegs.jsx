import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import GameHeader from '../../components/GameHeader';
import styles from './Pegs.module.css';

function makeEnglishBoard() {
  // 7x7 cross; -1 = invalid, 0 = empty hole, 1 = peg
  const grid = Array.from({ length: 7 }, () => Array(7).fill(1));
  for (let r = 0; r < 7; r++) {
    for (let c = 0; c < 7; c++) {
      const invalid = (r < 2 || r > 4) && (c < 2 || c > 4);
      if (invalid) grid[r][c] = -1;
    }
  }
  grid[3][3] = 0;
  return grid;
}

function inBounds(r, c) {
  return r >= 0 && r < 7 && c >= 0 && c < 7;
}

function movesFrom(grid, r, c) {
  if (!inBounds(r, c) || grid[r][c] !== 1) return [];
  const out = [];
  for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const r1 = r + dr;
    const c1 = c + dc;
    const r2 = r + 2 * dr;
    const c2 = c + 2 * dc;
    if (!inBounds(r2, c2)) continue;
    if (grid[r1]?.[c1] === 1 && grid[r2]?.[c2] === 0) out.push([r2, c2]);
  }
  return out;
}

// Export helpers for testing
export {
  makeEnglishBoard,
  inBounds,
  movesFrom,
};

export default function Pegs() {
  const [grid, setGrid] = useState(() => makeEnglishBoard());
  const [selected, setSelected] = useState(null); // [r,c]

  const pegsLeft = useMemo(() => grid.flat().filter((v) => v === 1).length, [grid]);
  const legalTargets = useMemo(() => {
    if (!selected) return [];
    return movesFrom(grid, selected[0], selected[1]).map(([r, c]) => `${r},${c}`);
  }, [grid, selected]);

  const anyMoves = useMemo(() => {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        if (grid[r][c] === 1 && movesFrom(grid, r, c).length) return true;
      }
    }
    return false;
  }, [grid]);

  const won = pegsLeft === 1;

  const reset = () => {
    setGrid(makeEnglishBoard());
    setSelected(null);
  };

  const clickCell = (r, c) => {
    const v = grid[r][c];
    if (v === -1) return;
    if (v === 1) {
      setSelected([r, c]);
      return;
    }
    if (v === 0 && selected) {
      const [sr, sc] = selected;
      const key = `${r},${c}`;
      if (!legalTargets.includes(key)) return;
      const dr = (r - sr) / 2;
      const dc = (c - sc) / 2;
      const mr = sr + dr;
      const mc = sc + dc;
      setGrid((prev) => {
        const next = prev.map((row) => row.slice());
        next[sr][sc] = 0;
        next[mr][mc] = 0;
        next[r][c] = 1;
        return next;
      });
      setSelected(null);
    }
  };

  return (
    <div className={styles.container}>
      <GameHeader
        title="Pegs"
        instructions="Jump a peg over an adjacent peg into an empty hole to remove the jumped peg. Aim to leave one peg."
      />

      <div className={styles.toolbar}>
        <button className={styles.button} onClick={reset}>New</button>
        <div className={styles.stats}>
          <span><strong>{t('common.pegs')}:</strong> {pegsLeft}</span>
          {won && <span className={styles.win}>One peg left!</span>}
          {!won && !anyMoves && <span className={styles.lose}>No moves</span>}
        </div>
      </div>

      <div className={styles.board}>
        {grid.map((row, r) =>
          row.map((v, c) => {
            const isSel = selected?.[0] === r && selected?.[1] === c;
            const isTarget = legalTargets.includes(`${r},${c}`);
            return (
              <button
                key={`${r},${c}`}
                className={`${styles.cell} ${v === -1 ? styles.invalid : ''} ${isSel ? styles.selected : ''} ${isTarget ? styles.target : ''}`}
                onClick={() => clickCell(r, c)}
                disabled={v === -1}
                aria-label={`cell ${r},${c}`}
              >
                {v === 1 && <span className={styles.peg} />}
                {v === 0 && <span className={styles.hole} />}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
