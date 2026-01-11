import { useCallback, useMemo, useState } from 'react';
import GameHeader from '../../components/GameHeader';
import styles from './Signpost.module.css';

function rcToIdx(r, c, w) {
  return r * w + c;
}
function idxToRC(i, w) {
  return { r: Math.floor(i / w), c: i % w };
}

function dirToArrow(dr, dc) {
  if (dr === -1 && dc === -1) return '↖';
  if (dr === -1 && dc === 0) return '↑';
  if (dr === -1 && dc === 1) return '↗';
  if (dr === 0 && dc === -1) return '←';
  if (dr === 0 && dc === 1) return '→';
  if (dr === 1 && dc === -1) return '↙';
  if (dr === 1 && dc === 0) return '↓';
  if (dr === 1 && dc === 1) return '↘';
  return '•';
}

function generateSnake(w, h) {
  // Simple Hamiltonian path (snake)
  const path = [];
  for (let r = 0; r < h; r++) {
    if (r % 2 === 0) {
      for (let c = 0; c < w; c++) path.push(rcToIdx(r, c, w));
    } else {
      for (let c = w - 1; c >= 0; c--) path.push(rcToIdx(r, c, w));
    }
  }

  const n = w * h;
  const arrows = new Array(n).fill(null); // {dr,dc} or null for last
  const numbers = new Array(n).fill(null);
  numbers[path[0]] = 1;
  numbers[path[n - 1]] = n;

  for (let i = 0; i < n - 1; i++) {
    const a = path[i];
    const b = path[i + 1];
    const ra = idxToRC(a, w);
    const rb = idxToRC(b, w);
    arrows[a] = { dr: rb.r - ra.r, dc: rb.c - ra.c };
  }

  // Reveal a few early numbers (like the original often does)
  const extra = Math.max(2, Math.floor(n * 0.07));
  for (let k = 0; k < extra; k++) {
    const t = 1 + Math.floor(Math.random() * (n - 2));
    const idx = path[t];
    numbers[idx] = t + 1;
  }

  return { w, h, arrows, fixedNumbers: numbers };
}

function inArrowDirection(fromIdx, toIdx, arrows, w) {
  const a = arrows[fromIdx];
  if (!a) return false;
  const { r: fr, c: fc } = idxToRC(fromIdx, w);
  const { r: tr, c: tc } = idxToRC(toIdx, w);
  const dr = tr - fr;
  const dc = tc - fc;
  // must be same direction (scalar multiple) and not zero
  if (dr === 0 && dc === 0) return false;
  // Normalize by gcd of abs
  const g = (x, y) => (y === 0 ? x : g(y, x % y));
  const g0 = g(Math.abs(dr), Math.abs(dc));
  const ndr = dr / g0;
  const ndc = dc / g0;
  return ndr === a.dr && ndc === a.dc;
}

function analyze(puz, succ, pred) {
  const n = puz.w * puz.h;
  const bad = new Set();

  // basic consistency: links follow arrows and are bijective-ish
  for (let i = 0; i < n; i++) {
    if (succ[i] != null) {
      const j = succ[i];
      if (j === i) bad.add(i);
      if (!inArrowDirection(i, j, puz.arrows, puz.w)) bad.add(i);
      if (pred[j] !== i) bad.add(i);
    }
    if (pred[i] != null) {
      const j = pred[i];
      if (j === i) bad.add(i);
      if (succ[j] !== i) bad.add(i);
    }
  }

  // derive numbers by walking from fixed 1 if possible
  const derived = new Array(n).fill(null);
  const start = puz.fixedNumbers.findIndex((x) => x === 1);
  if (start >= 0) {
    let cur = start;
    let k = 1;
    const seen = new Set();
    while (cur != null && !seen.has(cur) && k <= n) {
      seen.add(cur);
      derived[cur] = k;
      cur = succ[cur];
      k++;
    }
  }

  // check fixed numbers compatibility if derived exists
  for (let i = 0; i < n; i++) {
    const fixed = puz.fixedNumbers[i];
    if (fixed == null) continue;
    if (derived[i] != null && derived[i] !== fixed) bad.add(i);
  }

  // solved: single path covering all nodes from 1..n
  let solved = false;
  if (start >= 0 && bad.size === 0) {
    let cur = start;
    const seen = new Set();
    while (cur != null && !seen.has(cur)) {
      seen.add(cur);
      cur = succ[cur];
    }
    // must visit all nodes and end at fixed N
    const end = puz.fixedNumbers.findIndex((x) => x === n);
    solved = seen.size === n && cur == null && end >= 0 && derived[end] === n;
  }

  return { bad, derived, solved };
}

export default function Signpost() {
  const [w, setW] = useState(6);
  const [h, setH] = useState(6);
  const [puz, setPuz] = useState(() => generateSnake(6, 6));
  const [succ, setSucc] = useState(() => new Array(36).fill(null));
  const [pred, setPred] = useState(() => new Array(36).fill(null));
  const [selected, setSelected] = useState(null);

  const reset = useCallback((nw = w, nh = h) => {
    const np = generateSnake(nw, nh);
    setPuz(np);
    setSucc(new Array(nw * nh).fill(null));
    setPred(new Array(nw * nh).fill(null));
    setSelected(null);
  }, [w, h]);

  const { bad, derived, solved } = useMemo(() => analyze(puz, succ, pred), [puz, succ, pred]);

  const onCell = (i) => {
    if (selected == null) {
      setSelected(i);
      return;
    }
    if (selected === i) {
      // Clear links touching this cell
      setSucc((s0) => {
        const s = s0.slice();
        const p = pred.slice();
        if (s[i] != null) { p[s[i]] = null; s[i] = null; }
        if (p[i] != null) { s[p[i]] = null; p[i] = null; }
        setPred(p);
        return s;
      });
      setSelected(null);
      return;
    }

    // Try to link selected -> i (successor)
    if (!inArrowDirection(selected, i, puz.arrows, puz.w)) {
      setSelected(i);
      return;
    }

    setSucc((s0) => {
      const s = s0.slice();
      const p = pred.slice();
      // remove existing outgoing from selected
      if (s[selected] != null) { p[s[selected]] = null; }
      // remove existing incoming to i
      if (p[i] != null) { s[p[i]] = null; }
      s[selected] = i;
      p[i] = selected;
      setPred(p);
      return s;
    });
    setSelected(null);
  };

  const n = puz.w * puz.h;

  return (
    <div className={styles.container}>
      <GameHeader
        title="Signpost"
        instructions="Link squares to form a single chain 1→2→… following the arrows (a link can go any distance as long as it’s in the arrow’s direction). Click a square, then click its successor. Click a square twice to clear links touching it."
      />

      <div className={styles.toolbar}>
        <div className={styles.group}>
          <label>
            <span style={{ color: 'rgba(255,255,255,0.85)', marginRight: 8 }}>Size</span>
            <select
              className={styles.button}
              value={`${w}x${h}`}
              onChange={(e) => {
                const [nw, nh] = e.target.value.split('x').map(Number);
                setW(nw); setH(nh);
                reset(nw, nh);
              }}
            >
              {['5x5', '6x6', '7x7'].map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </label>
          <button className={styles.button} onClick={() => reset(w, h)}>New</button>
          <button
            className={styles.button}
            onClick={() => {
              setSucc(new Array(n).fill(null));
              setPred(new Array(n).fill(null));
              setSelected(null);
            }}
          >
            Clear
          </button>
          <button
            className={styles.button}
            onClick={() => {
              // reveal the generated snake solution
              const s = new Array(n).fill(null);
              const p = new Array(n).fill(null);
              // reconstruct snake path as in generator
              const path = [];
              for (let rr = 0; rr < puz.h; rr++) {
                if (rr % 2 === 0) for (let cc = 0; cc < puz.w; cc++) path.push(rcToIdx(rr, cc, puz.w));
                else for (let cc = puz.w - 1; cc >= 0; cc--) path.push(rcToIdx(rr, cc, puz.w));
              }
              for (let i = 0; i < path.length - 1; i++) { s[path[i]] = path[i + 1]; p[path[i + 1]] = path[i]; }
              setSucc(s); setPred(p); setSelected(null);
            }}
          >
            Reveal
          </button>
        </div>

        <div className={styles.status}>
          {solved ? <span className={styles.win}>Solved!</span> : (bad.size ? <span className={styles.bad}>Conflicts</span> : <span>OK</span>)}
        </div>
      </div>

      <div className={styles.grid} style={{ gridTemplateColumns: `repeat(${puz.w}, 62px)` }}>
        {Array.from({ length: n }, (_, i) => {
          const fixed = puz.fixedNumbers[i];
          const num = fixed ?? derived[i];
          const arrow = puz.arrows[i] ? dirToArrow(puz.arrows[i].dr, puz.arrows[i].dc) : '⛳';
          const cls = [
            styles.cell,
            fixed != null ? styles.fixed : '',
            selected === i ? styles.selected : '',
            bad.has(i) ? styles.badCell : '',
          ].join(' ');
          return (
            <div
              key={i}
              className={cls}
              onClick={() => onCell(i)}
              title={`cell ${i + 1}`}
            >
              <div className={styles.topRow}>
                <span className={styles.num}>{num ?? ''}</span>
                <span className={styles.arrow}>{arrow}</span>
              </div>
              <div className={styles.links}>
                <span>{pred[i] != null ? '•' : '○'}</span>
                <span>{succ[i] != null ? '→' : ''}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

