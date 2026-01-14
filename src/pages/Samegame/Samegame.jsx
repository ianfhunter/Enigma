import { useCallback, useMemo, useState } from 'react';
import GameHeader from '../../components/GameHeader';
import styles from './Samegame.module.css';

const PALETTE = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#a855f7', '#ec4899', '#14b8a6'];

function makeGrid(w, h, colors) {
  const grid = Array.from({ length: h }, () => Array.from({ length: w }, () => Math.floor(Math.random() * colors)));
  return grid;
}

function inBounds(r, c, w, h) {
  return r >= 0 && r < h && c >= 0 && c < w;
}

function flood(grid, r0, c0) {
  const h = grid.length;
  const w = grid[0].length;
  const color = grid[r0][c0];
  if (color == null) return [];
  const q = [[r0, c0]];
  const seen = new Set([`${r0},${c0}`]);
  const out = [];
  while (q.length) {
    const [r, c] = q.pop();
    out.push([r, c]);
    for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nr = r + dr;
      const nc = c + dc;
      const key = `${nr},${nc}`;
      if (!inBounds(nr, nc, w, h) || seen.has(key)) continue;
      if (grid[nr][nc] === color) {
        seen.add(key);
        q.push([nr, nc]);
      }
    }
  }
  return out;
}

function applyGravity(grid) {
  const h = grid.length;
  const w = grid[0].length;
  const cols = Array.from({ length: w }, (_, c) => {
    const col = [];
    for (let r = h - 1; r >= 0; r--) {
      const v = grid[r][c];
      if (v != null) col.push(v);
    }
    // fill to height with nulls
    while (col.length < h) col.push(null);
    return col; // bottom-up
  });

  // Remove empty columns; shift left by pulling from right (equivalently drop empties)
  const nonEmpty = cols.filter((col) => col.some((v) => v != null));
  while (nonEmpty.length < w) nonEmpty.push(Array.from({ length: h }, () => null));

  // back to rows (top-down)
  const next = Array.from({ length: h }, () => Array(w).fill(null));
  for (let c = 0; c < w; c++) {
    const col = nonEmpty[c];
    for (let r = 0; r < h; r++) {
      next[h - 1 - r][c] = col[r];
    }
  }
  return next;
}

function anyMoves(grid) {
  const h = grid.length;
  const w = grid[0].length;
  const seen = new Set();
  for (let r = 0; r < h; r++) {
    for (let c = 0; c < w; c++) {
      const v = grid[r][c];
      if (v == null) continue;
      const key = `${r},${c}`;
      if (seen.has(key)) continue;
      const group = flood(grid, r, c);
      group.forEach(([rr, cc]) => seen.add(`${rr},${cc}`));
      if (group.length > 1) return true;
    }
  }
  return false;
}

// Export helpers for testing
export {
  PALETTE,
  makeGrid,
  inBounds,
  flood,
  applyGravity,
  anyMoves,
};

export default function Samegame() {
  const [settings, setSettings] = useState({ w: 12, h: 10, colors: 5 });
  const [grid, setGrid] = useState(() => makeGrid(12, 10, 5));
  const [selected, setSelected] = useState(null); // Set of "r,c"
  const [score, setScore] = useState(0);

  const remaining = useMemo(() => grid.flat().filter((v) => v != null).length, [grid]);
  const won = remaining === 0;
  const stuck = !won && !anyMoves(grid);

  const newGame = useCallback((next = settings) => {
    setGrid(makeGrid(next.w, next.h, next.colors));
    setSelected(null);
    setScore(0);
  }, [settings]);

  const clickCell = (r, c, button = 'left') => {
    const v = grid[r][c];
    if (v == null) return;
    const group = flood(grid, r, c);
    if (group.length <= 1) {
      setSelected(null);
      return;
    }
    const keySet = new Set(group.map(([rr, cc]) => `${rr},${cc}`));
    if (button === 'right') {
      setSelected(null);
      return;
    }
    if (selected && keySet.size === selected.size && [...keySet].every((k) => selected.has(k))) {
      // remove
      const next = grid.map((row) => row.slice());
      for (const [rr, cc] of group) next[rr][cc] = null;
      const after = applyGravity(next);
      setGrid(after);
      setSelected(null);
      const n = group.length;
      setScore((s) => s + (n - 2) * (n - 2));
    } else {
      setSelected(keySet);
    }
  };

  return (
    <div className={styles.container}>
      <GameHeader
        title="Samegame"
        instructions="Click a group (2+ adjacent same-color blocks) to select; click it again to remove. Clear the board to win."
      />

      <div className={styles.toolbar}>
        <div className={styles.group}>
          <label className={styles.label}>
            Size
            <select
              className={styles.select}
              value={`${settings.w}x${settings.h}`}
              onChange={(e) => {
                const [w, h] = e.target.value.split('x').map(Number);
                const next = { ...settings, w, h };
                setSettings(next);
                newGame(next);
              }}
            >
              <option value="10x8">10×8</option>
              <option value="12x10">12×10</option>
              <option value="15x12">15×12</option>
            </select>
          </label>
          <label className={styles.label}>
            Colors
            <select
              className={styles.select}
              value={settings.colors}
              onChange={(e) => {
                const next = { ...settings, colors: Number(e.target.value) };
                setSettings(next);
                newGame(next);
              }}
            >
              {[3, 4, 5, 6, 7].map((v) => <option key={v} value={v}>{v}</option>)}
            </select>
          </label>
          <button className={styles.button} onClick={() => newGame(settings)}>New</button>
        </div>
        <div className={styles.stats}>
          <span><strong>Score:</strong> {score}</span>
          <span><strong>Left:</strong> {remaining}</span>
          {won && <span className={styles.win}>Cleared!</span>}
          {stuck && <span className={styles.lose}>No moves</span>}
        </div>
      </div>

      <div
        className={styles.grid}
        style={{
          gridTemplateColumns: `repeat(${settings.w}, 1fr)`,
          width: `min(92vw, ${settings.w * 42}px)`,
        }}
        onContextMenu={(e) => e.preventDefault()}
      >
        {grid.map((row, r) =>
          row.map((v, c) => {
            const sel = selected?.has(`${r},${c}`);
            return (
              <button
                key={`${r},${c}`}
                className={`${styles.cell} ${sel ? styles.selected : ''} ${v == null ? styles.empty : ''}`}
                style={{ background: v == null ? 'transparent' : PALETTE[v] }}
                onClick={() => clickCell(r, c, 'left')}
                onMouseDown={(e) => {
                  if (e.button === 2) clickCell(r, c, 'right');
                }}
                disabled={v == null}
                aria-label={v == null ? 'empty' : `color ${v}`}
              />
            );
          })
        )}
      </div>
    </div>
  );
}
