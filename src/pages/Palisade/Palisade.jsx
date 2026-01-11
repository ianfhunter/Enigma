import { useMemo, useState } from 'react';
import GameHeader from '../../components/GameHeader';
import styles from './Palisade.module.css';

// Simplified Palisade: instead of drawing edges, you assign region IDs.
// Constraint: all regions have fixed size K and are connected.
// Each numbered cell equals the number of boundary edges around it (including outer border),
// where a boundary edge is between two different regions or between region and outside.

const COLORS = ['#f97316', '#3b82f6', '#22c55e', '#a855f7', '#ef4444', '#06b6d4'];

function rcToIdx(r, c, w) {
  return r * w + c;
}
function idxToRC(i, w) {
  return { r: Math.floor(i / w), c: i % w };
}
function inBounds(r, c, h, w) {
  return r >= 0 && r < h && c >= 0 && c < w;
}

function preset() {
  // 5x5, region size 5, solution is 5 horizontal stripes
  const w = 5, h = 5, k = 5;
  const sol = new Array(w * h).fill(-1);
  for (let r = 0; r < h; r++) for (let c = 0; c < w; c++) sol[rcToIdx(r, c, w)] = r;

  // numbers from solution
  const nums = new Array(w * h).fill(null);
  for (let r = 0; r < h; r++) {
    for (let c = 0; c < w; c++) {
      const id = sol[rcToIdx(r, c, w)];
      let b = 0;
      const dirs = [{ dr: -1, dc: 0 }, { dr: 1, dc: 0 }, { dr: 0, dc: -1 }, { dr: 0, dc: 1 }];
      for (const d of dirs) {
        const rr = r + d.dr, cc = c + d.dc;
        if (!inBounds(rr, cc, h, w)) { b++; continue; }
        const nid = sol[rcToIdx(rr, cc, w)];
        if (nid !== id) b++;
      }
      nums[rcToIdx(r, c, w)] = b;
    }
  }

  return { w, h, k, regions: 5, nums, solution: sol };
}

function analyze(puz, assign) {
  const n = puz.w * puz.h;
  const bad = new Set();

  // boundary counts
  for (let r = 0; r < puz.h; r++) {
    for (let c = 0; c < puz.w; c++) {
      const i = rcToIdx(r, c, puz.w);
      const id = assign[i];
      if (id < 0) { bad.add(i); continue; }
      let b = 0;
      const dirs = [{ dr: -1, dc: 0 }, { dr: 1, dc: 0 }, { dr: 0, dc: -1 }, { dr: 0, dc: 1 }];
      for (const d of dirs) {
        const rr = r + d.dr, cc = c + d.dc;
        if (!inBounds(rr, cc, puz.h, puz.w)) { b++; continue; }
        const nid = assign[rcToIdx(rr, cc, puz.w)];
        if (nid !== id) b++;
      }
      if (puz.nums[i] != null && b !== puz.nums[i]) bad.add(i);
    }
  }

  // region sizes + connectivity
  const cellsBy = Array.from({ length: puz.regions }, () => []);
  for (let i = 0; i < n; i++) {
    const id = assign[i];
    if (id >= 0 && id < puz.regions) cellsBy[id].push(i);
  }
  for (let id = 0; id < puz.regions; id++) {
    const cells = cellsBy[id];
    if (cells.length !== puz.k) {
      for (const i of cells) bad.add(i);
      continue;
    }
    const set = new Set(cells);
    const seen = new Set([cells[0]]);
    const stack = [cells[0]];
    const dirs = [{ dr: -1, dc: 0 }, { dr: 1, dc: 0 }, { dr: 0, dc: -1 }, { dr: 0, dc: 1 }];
    while (stack.length) {
      const u = stack.pop();
      const { r, c } = idxToRC(u, puz.w);
      for (const d of dirs) {
        const rr = r + d.dr, cc = c + d.dc;
        if (!inBounds(rr, cc, puz.h, puz.w)) continue;
        const v = rcToIdx(rr, cc, puz.w);
        if (!set.has(v) || seen.has(v)) continue;
        seen.add(v); stack.push(v);
      }
    }
    if (seen.size !== cells.length) for (const i of cells) bad.add(i);
  }

  const solved = assign.every((x) => x >= 0) && bad.size === 0;
  return { bad, solved };
}

export default function Palisade() {
  const [puz] = useState(() => preset());
  const [sel, setSel] = useState(0);
  const [assign, setAssign] = useState(() => new Array(puz.w * puz.h).fill(-1));

  const { bad, solved } = useMemo(() => analyze(puz, assign), [puz, assign]);

  const paint = (i) => {
    setAssign((prev) => {
      const n = prev.slice();
      n[i] = n[i] === sel ? -1 : sel;
      return n;
    });
  };

  return (
    <div className={styles.container}>
      <GameHeader
        title="Palisade"
        instructions="Divide the grid into connected regions of fixed size (here: 5). Each number tells how many of the four edges of that cell are region boundaries (including the outer border). Select a region color and click cells to assign them."
      />

      <div className={styles.toolbar}>
        <div className={styles.group}>
          <button className={styles.button} onClick={() => setAssign(new Array(puz.w * puz.h).fill(-1))}>Clear</button>
          <button className={styles.button} onClick={() => setAssign(puz.solution.slice())}>Reveal</button>
        </div>
        <div className={styles.group}>
          <div className={styles.palette}>
            {Array.from({ length: puz.regions }, (_, i) => (
              <div
                key={i}
                className={`${styles.swatch} ${sel === i ? styles.active : ''}`}
                style={{ background: COLORS[i % COLORS.length] }}
                onClick={() => setSel(i)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && setSel(i)}
                title={`Region ${i + 1}`}
              />
            ))}
          </div>
        </div>
        <div className={styles.status}>
          {solved ? <span className={styles.win}>Solved!</span> : (bad.size ? <span className={styles.bad}>Invalid</span> : <span>OK</span>)}
        </div>
      </div>

      <div className={styles.grid} style={{ gridTemplateColumns: `repeat(${puz.w}, 44px)` }}>
        {Array.from({ length: puz.w * puz.h }, (_, i) => {
          const id = assign[i];
          const bg = id >= 0 ? COLORS[id % COLORS.length] : 'rgba(255,255,255,0.06)';
          return (
            <div
              key={i}
              className={`${styles.cell} ${bad.has(i) ? styles.badCell : ''}`}
              style={{ background: bg }}
              onClick={() => paint(i)}
              title={`Clue: ${puz.nums[i]}`}
            >
              {puz.nums[i]}
            </div>
          );
        })}
      </div>
    </div>
  );
}

