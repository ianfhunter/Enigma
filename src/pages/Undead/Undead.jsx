import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import GameHeader from '../../components/GameHeader';
import styles from './Undead.module.css';

// Undead: fill non-mirror cells with G/V/Z.
// Edge clues show number of *visible* monsters along a ray with mirror reflections.
// Vampires: visible directly only (no reflections yet)
// Ghosts: visible in mirrors only (after at least one reflection)
// Zombies: always visible

function rcToIdx(r, c, w) {
  return r * w + c;
}
function idxToRC(i, w) {
  return { r: Math.floor(i / w), c: i % w };
}
function inBounds(r, c, h, w) {
  return r >= 0 && r < h && c >= 0 && c < w;
}

function reflect(dir, mirror) {
  // dir: {dr,dc}
  const { dr, dc } = dir;
  if (mirror === '/') {
    // N<->E, S<->W
    if (dr === -1 && dc === 0) return { dr: 0, dc: 1 };
    if (dr === 0 && dc === 1) return { dr: -1, dc: 0 };
    if (dr === 1 && dc === 0) return { dr: 0, dc: -1 };
    if (dr === 0 && dc === -1) return { dr: 1, dc: 0 };
  } else if (mirror === '\\') {
    // N<->W, S<->E
    if (dr === -1 && dc === 0) return { dr: 0, dc: -1 };
    if (dr === 0 && dc === -1) return { dr: -1, dc: 0 };
    if (dr === 1 && dc === 0) return { dr: 0, dc: 1 };
    if (dr === 0 && dc === 1) return { dr: 1, dc: 0 };
  }
  return dir;
}

function traceEdge({ side, idx }, grid, w, h, monsters) {
  // side: 'T'|'B'|'L'|'R', idx is column/row index
  let r = 0, c = 0;
  let dir = { dr: 0, dc: 0 };
  if (side === 'T') { r = 0; c = idx; dir = { dr: 1, dc: 0 }; }
  if (side === 'B') { r = h - 1; c = idx; dir = { dr: -1, dc: 0 }; }
  if (side === 'L') { r = idx; c = 0; dir = { dr: 0, dc: 1 }; }
  if (side === 'R') { r = idx; c = w - 1; dir = { dr: 0, dc: -1 }; }

  let reflected = false;
  let count = 0;

  const seen = new Set();
  for (let steps = 0; steps < w * h * 8 + 50; steps++) {
    if (!inBounds(r, c, h, w)) break;
    const stateKey = `${r},${c},${dir.dr},${dir.dc}`;
    if (seen.has(stateKey)) break;
    seen.add(stateKey);

    const cell = grid[rcToIdx(r, c, w)];
    if (cell === '/' || cell === '\\') {
      dir = reflect(dir, cell);
      reflected = true;
      r += dir.dr;
      c += dir.dc;
      continue;
    }

    const m = monsters[rcToIdx(r, c, w)];
    if (m) {
      if (m === 'Z') count++;
      else if (m === 'V' && !reflected) count++;
      else if (m === 'G' && reflected) count++;
    }

    r += dir.dr;
    c += dir.dc;
  }
  return count;
}

function buildPuzzle(w, h) {
  // Random mirrors + random monster placement
  const n = w * h;
  const grid = new Array(n).fill('.');
  // place some mirrors
  const mirrorCount = Math.max(4, Math.floor(n * 0.14));
  for (let t = 0; t < mirrorCount; t++) {
    const i = Math.floor(Math.random() * n);
    if (grid[i] !== '.') continue;
    grid[i] = Math.random() < 0.5 ? '/' : '\\';
  }

  // monsters only on '.' cells
  const empties = [];
  for (let i = 0; i < n; i++) if (grid[i] === '.') empties.push(i);
  for (let i = empties.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [empties[i], empties[j]] = [empties[j], empties[i]];
  }

  const totals = {
    G: Math.max(1, Math.floor(empties.length * 0.22)),
    V: Math.max(1, Math.floor(empties.length * 0.22)),
    Z: Math.max(1, Math.floor(empties.length * 0.22)),
  };
  const monsters = new Array(n).fill('');
  let ptr = 0;
  for (let k = 0; k < totals.G; k++) monsters[empties[ptr++]] = 'G';
  for (let k = 0; k < totals.V; k++) monsters[empties[ptr++]] = 'V';
  for (let k = 0; k < totals.Z; k++) monsters[empties[ptr++]] = 'Z';

  // Edge clues
  const clues = new Map();
  for (let c = 0; c < w; c++) {
    clues.set(`T:${c}`, traceEdge({ side: 'T', idx: c }, grid, w, h, monsters));
    clues.set(`B:${c}`, traceEdge({ side: 'B', idx: c }, grid, w, h, monsters));
  }
  for (let r = 0; r < h; r++) {
    clues.set(`L:${r}`, traceEdge({ side: 'L', idx: r }, grid, w, h, monsters));
    clues.set(`R:${r}`, traceEdge({ side: 'R', idx: r }, grid, w, h, monsters));
  }

  return { w, h, grid, clues, totals, solution: monsters };
}

function analyze(puz, monsters) {
  const n = puz.w * puz.h;
  const bad = new Set();

  // Totals check (not required during solve, but for "solved" yes)
  const counts = { G: 0, V: 0, Z: 0 };
  for (let i = 0; i < n; i++) {
    const m = monsters[i];
    if (m === 'G') counts.G++;
    if (m === 'V') counts.V++;
    if (m === 'Z') counts.Z++;
  }

  // Edge clue mismatches
  for (let c = 0; c < puz.w; c++) {
    const t = traceEdge({ side: 'T', idx: c }, puz.grid, puz.w, puz.h, monsters);
    const b = traceEdge({ side: 'B', idx: c }, puz.grid, puz.w, puz.h, monsters);
    if (t !== puz.clues.get(`T:${c}`)) bad.add(rcToIdx(0, c, puz.w));
    if (b !== puz.clues.get(`B:${c}`)) bad.add(rcToIdx(puz.h - 1, c, puz.w));
  }
  for (let r = 0; r < puz.h; r++) {
    const l = traceEdge({ side: 'L', idx: r }, puz.grid, puz.w, puz.h, monsters);
    const rr = traceEdge({ side: 'R', idx: r }, puz.grid, puz.w, puz.h, monsters);
    if (l !== puz.clues.get(`L:${r}`)) bad.add(rcToIdx(r, 0, puz.w));
    if (rr !== puz.clues.get(`R:${r}`)) bad.add(rcToIdx(r, puz.w - 1, puz.w));
  }

  // solved only when all non-mirror cells filled and counts match and edges match
  let filled = true;
  for (let i = 0; i < n; i++) {
    if (puz.grid[i] !== '.') continue;
    if (!monsters[i]) { filled = false; break; }
  }
  const totalsOk = counts.G === puz.totals.G && counts.V === puz.totals.V && counts.Z === puz.totals.Z;
  const solved = filled && totalsOk && bad.size === 0;
  return { bad, counts, totalsOk, solved };
}

// Export helpers for testing
export {
  rcToIdx,
  idxToRC,
  inBounds,
  reflect,
  traceEdge,
  buildPuzzle,
  analyze,
};

export default function Undead() {
  const { t } = useTranslation();
  const [w, setW] = useState(6);
  const [h, setH] = useState(6);
  const [puz, setPuz] = useState(() => buildPuzzle(6, 6));
  const [monsters, setMonsters] = useState(() => new Array(36).fill(''));

  const newGame = useCallback((nw = w, nh = h) => {
    const np = buildPuzzle(nw, nh);
    setPuz(np);
    setMonsters(new Array(nw * nh).fill(''));
  }, [w, h]);

  const { bad, counts, totalsOk, solved } = useMemo(() => analyze(puz, monsters), [puz, monsters]);

  const cycle = (i) => {
    if (puz.grid[i] !== '.') return;
    setMonsters((prev) => {
      const n = prev.slice();
      const cur = n[i];
      const next = cur === '' ? 'G' : cur === 'G' ? 'V' : cur === 'V' ? 'Z' : '';
      n[i] = next;
      return n;
    });
  };

  const cellType = (rr, cc) => {
    const isCorner = (rr === 0 || rr === puz.h + 1) && (cc === 0 || cc === puz.w + 1);
    if (isCorner) return 'corner';
    const isInner = rr >= 1 && rr <= puz.h && cc >= 1 && cc <= puz.w;
    return isInner ? 'inner' : 'edge';
  };

  const edgeLabel = (rr, cc) => {
    if (rr === 0 && cc >= 1 && cc <= puz.w) return String(puz.clues.get(`T:${cc - 1}`));
    if (rr === puz.h + 1 && cc >= 1 && cc <= puz.w) return String(puz.clues.get(`B:${cc - 1}`));
    if (cc === 0 && rr >= 1 && rr <= puz.h) return String(puz.clues.get(`L:${rr - 1}`));
    if (cc === puz.w + 1 && rr >= 1 && rr <= puz.h) return String(puz.clues.get(`R:${rr - 1}`));
    return '';
  };

  return (
    <div className={styles.container}>
      <GameHeader
        title="Undead"
        instructions="Fill each non-mirror cell with G (ghost), V (vampire), or Z (zombie). Edge numbers tell how many monsters are visible along that ray, with mirrors reflecting sight. Vampires are visible directly only; ghosts only via at least one reflection; zombies always."
      />

      <div className={styles.toolbar}>
        <div className={styles.group}>
          <button className={styles.button} onClick={() => newGame(w, h)}>New</button>
          <button className={styles.button} onClick={() => setMonsters(new Array(puz.w * puz.h).fill(''))}>Clear</button>
          <button className={styles.button} onClick={() => setMonsters(puz.solution.slice())}>{t('common.reveal')}</button>
          <label style={{ color: 'rgba(255,255,255,0.85)' }}>
            W
            <input
              value={w}
              onChange={(e) => setW(Math.max(5, Math.min(9, Number(e.target.value) || 6)))}
              style={{ width: 50, marginLeft: 6, marginRight: 10 }}
            />
            H
            <input
              value={h}
              onChange={(e) => setH(Math.max(5, Math.min(9, Number(e.target.value) || 6)))}
              style={{ width: 50, marginLeft: 6 }}
            />
          </label>
          <button className={styles.button} onClick={() => newGame(w, h)}>Apply size</button>
        </div>

        <div className={styles.counts}>
          <span className={styles.pill}>G {counts.G}/{puz.totals.G}</span>
          <span className={styles.pill}>V {counts.V}/{puz.totals.V}</span>
          <span className={styles.pill}>Z {counts.Z}/{puz.totals.Z}</span>
          <span className={styles.status}>
            {solved ? <span className={styles.win}>{t('gameStatus.solved')}</span> : (totalsOk ? (bad.size ? <span className={styles.bad}>{t('gameStatus.edgeMismatch')}</span> : <span>{t('common.ok')}</span>) : <span className={styles.bad}>{t('gameStatus.totalsOff')}</span>)}
          </span>
        </div>
      </div>

      <div className={styles.board} style={{ gridTemplateColumns: `repeat(${puz.w + 2}, 44px)` }}>
        {Array.from({ length: (puz.w + 2) * (puz.h + 2) }, (_, idx) => {
          const rr = Math.floor(idx / (puz.w + 2));
          const cc = idx % (puz.w + 2);
          const t = cellType(rr, cc);
          if (t === 'corner') return <div key={idx} className={`${styles.cell} ${styles.corner}`} />;
          if (t === 'edge') {
            return <div key={idx} className={`${styles.cell} ${styles.edge}`}>{edgeLabel(rr, cc)}</div>;
          }
          const r = rr - 1;
          const c = cc - 1;
          const i = rcToIdx(r, c, puz.w);
          const g = puz.grid[i];
          const m = monsters[i];
          const isMirror = g === '/' || g === '\\';
          return (
            <button
              key={idx}
              className={[
                styles.cell,
                styles.gridCell,
                isMirror ? styles.mirror : '',
                bad.has(i) ? styles.badCell : '',
              ].join(' ')}
              onClick={() => cycle(i)}
              title={isMirror ? 'Mirror' : 'Click to cycle: (empty) → G → V → Z'}
            >
              {isMirror ? g : (m || '')}
            </button>
          );
        })}
      </div>
    </div>
  );
}
