import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import GameHeader from '../../components/GameHeader';
import styles from './Range.module.css';

// Range (Kuromasu): place black squares so
// - numbered squares are never black
// - no adjacent black squares
// - all non-black squares are connected
// - each numbered square's "visibility" count matches: itself + straight-line white squares until black/edge

function rcToIdx(r, c, w) {
  return r * w + c;
}
function idxToRC(i, w) {
  return { r: Math.floor(i / w), c: i % w };
}
function inBounds(r, c, h, w) {
  return r >= 0 && r < h && c >= 0 && c < w;
}

function computeVisibility(idx, h, w, isBlack) {
  const { r, c } = idxToRC(idx, w);
  let total = 1;
  // up
  for (let rr = r - 1; rr >= 0; rr--) {
    const ii = rcToIdx(rr, c, w);
    if (isBlack(ii)) break;
    total++;
  }
  // down
  for (let rr = r + 1; rr < h; rr++) {
    const ii = rcToIdx(rr, c, w);
    if (isBlack(ii)) break;
    total++;
  }
  // left
  for (let cc = c - 1; cc >= 0; cc--) {
    const ii = rcToIdx(r, cc, w);
    if (isBlack(ii)) break;
    total++;
  }
  // right
  for (let cc = c + 1; cc < w; cc++) {
    const ii = rcToIdx(r, cc, w);
    if (isBlack(ii)) break;
    total++;
  }
  return total;
}

function allWhiteConnected(h, w, isBlack) {
  const n = h * w;
  let start = -1;
  for (let i = 0; i < n; i++) {
    if (!isBlack(i)) { start = i; break; }
  }
  if (start === -1) return false;
  const seen = new Set([start]);
  const stack = [start];
  while (stack.length) {
    const u = stack.pop();
    const { r, c } = idxToRC(u, w);
    const nbrs = [
      { r: r - 1, c },
      { r: r + 1, c },
      { r, c: c - 1 },
      { r, c: c + 1 },
    ];
    for (const nb of nbrs) {
      if (!inBounds(nb.r, nb.c, h, w)) continue;
      const v = rcToIdx(nb.r, nb.c, w);
      if (isBlack(v)) continue;
      if (!seen.has(v)) { seen.add(v); stack.push(v); }
    }
  }
  for (let i = 0; i < n; i++) {
    if (!isBlack(i) && !seen.has(i)) return false;
  }
  return true;
}

function generateRange(h, w) {
  // Randomly place black squares with no adjacency while keeping whites connected.
  const n = h * w;
  const black = new Set();

  const canPlace = (i) => {
    if (black.has(i)) return false;
    const { r, c } = idxToRC(i, w);
    const nbrs = [
      { r: r - 1, c },
      { r: r + 1, c },
      { r, c: c - 1 },
      { r, c: c + 1 },
    ];
    for (const nb of nbrs) {
      if (!inBounds(nb.r, nb.c, h, w)) continue;
      const j = rcToIdx(nb.r, nb.c, w);
      if (black.has(j)) return false;
    }
    return true;
  };

  const tries = Math.max(40, Math.floor((n * 2) / 3));
  for (let t = 0; t < tries; t++) {
    const i = Math.floor(Math.random() * n);
    if (!canPlace(i)) continue;
    black.add(i);
    if (!allWhiteConnected(h, w, (x) => black.has(x))) {
      black.delete(i);
    }
  }

  // Place number clues on a subset of white squares.
  const clues = new Array(n).fill(null);
  for (let i = 0; i < n; i++) {
    if (black.has(i)) continue;
    const v = computeVisibility(i, h, w, (x) => black.has(x));
    // avoid trivial 1 (should not occur in valid)
    clues[i] = v;
  }

  // Reveal ~55% of clues, but always reveal a few.
  const reveal = new Array(n).fill(false);
  const whiteCells = [];
  for (let i = 0; i < n; i++) if (!black.has(i)) whiteCells.push(i);
  for (let i = whiteCells.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [whiteCells[i], whiteCells[j]] = [whiteCells[j], whiteCells[i]];
  }
  const k = Math.max(6, Math.floor(whiteCells.length * 0.55));
  for (let i = 0; i < k; i++) reveal[whiteCells[i]] = true;

  const givens = new Array(n).fill(null);
  for (let i = 0; i < n; i++) if (reveal[i]) givens[i] = clues[i];

  return { h, w, givens, solutionBlack: black };
}

function analyze(h, w, givens, marks) {
  // marks: 0 empty, 1 black, 2 dot
  const n = h * w;
  const isBlack = (i) => marks[i] === 1;

  const bad = new Set();

  // numbered squares not black; numbered visibility correct
  for (let i = 0; i < n; i++) {
    const clue = givens[i];
    if (clue == null) continue;
    if (isBlack(i)) bad.add(i);
  }
  for (let i = 0; i < n; i++) {
    const clue = givens[i];
    if (clue == null) continue;
    if (isBlack(i)) continue;
    const v = computeVisibility(i, h, w, isBlack);
    if (v !== clue) bad.add(i);
  }

  // no adjacent blacks
  for (let r = 0; r < h; r++) {
    for (let c = 0; c < w; c++) {
      const i = rcToIdx(r, c, w);
      if (!isBlack(i)) continue;
      const nbrs = [
        { r: r - 1, c },
        { r: r + 1, c },
        { r, c: c - 1 },
        { r, c: c + 1 },
      ];
      for (const nb of nbrs) {
        if (!inBounds(nb.r, nb.c, h, w)) continue;
        const j = rcToIdx(nb.r, nb.c, w);
        if (isBlack(j)) { bad.add(i); bad.add(j); }
      }
    }
  }

  const connected = allWhiteConnected(h, w, isBlack);
  const solved = connected && bad.size === 0;
  return { bad, connected, solved };
}

// Export helpers for testing
export {
  rcToIdx,
  idxToRC,
  inBounds,
  computeVisibility,
  allWhiteConnected,
  generateRange,
  analyze,
};

export default function Range() {
  const [w, setW] = useState(8);
  const [h, setH] = useState(8);

  const [puz, setPuz] = useState(() => generateRange(8, 8));
  const [marks, setMarks] = useState(() => new Array(8 * 8).fill(0));

  const newGame = useCallback((nw = w, nh = h) => {
    const np = generateRange(nh, nw);
    setPuz(np);
    setMarks(new Array(nw * nh).fill(0));
  }, [w, h]);

  const { bad, connected, solved } = useMemo(() => analyze(puz.h, puz.w, puz.givens, marks), [puz, marks]);

  const onCell = (i, e) => {
    e.preventDefault();
    if (puz.givens[i] != null) return;
    const right = e.type === 'contextmenu' || e.button === 2;
    setMarks((prev) => {
      const n = prev.slice();
      const cur = n[i];
      if (right) n[i] = cur === 2 ? 0 : 2;
      else n[i] = cur === 1 ? 0 : 1;
      return n;
    });
  };

  return (
    <div className={styles.container}>
      <GameHeader
        title="Range"
        instructions="Mark some squares black so no two blacks touch (orthogonally) and all remaining whites are connected. Each given number equals the total visible white squares from it in four directions (including itself) until hitting a black square or the edge."
      />

      <div className={styles.toolbar}>
        <div className={styles.group}>
          <label className={styles.label}>
            Width
            <select
              className={styles.select}
              value={w}
              onChange={(e) => {
                const v = Number(e.target.value);
                setW(v);
                newGame(v, h);
              }}
            >
              {[6, 7, 8, 9, 10].map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </label>
          <label className={styles.label}>
            Height
            <select
              className={styles.select}
              value={h}
              onChange={(e) => {
                const v = Number(e.target.value);
                setH(v);
                newGame(w, v);
              }}
            >
              {[6, 7, 8, 9, 10].map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </label>
          <button className={styles.button} onClick={() => newGame(w, h)}>New</button>
          <button className={styles.button} onClick={() => setMarks(new Array(puz.w * puz.h).fill(0))}>Clear</button>
          <button
            className={styles.button}
            onClick={() => {
              // reveal generator's solution (black placement)
              const n = new Array(puz.w * puz.h).fill(0);
              for (const i of puz.solutionBlack) n[i] = 1;
              setMarks(n);
            }}
          >
            Reveal
          </button>
        </div>

        <div className={styles.status}>
          {solved ? (
            <span className={styles.win}>Solved!</span>
          ) : (
            <span className={connected ? '' : styles.bad}>
              {connected ? 'Whites connected' : 'Whites not connected'}
            </span>
          )}
        </div>
      </div>

      <div className={styles.grid} style={{ gridTemplateColumns: `repeat(${puz.w}, 44px)` }}>
        {Array.from({ length: puz.w * puz.h }, (_, i) => {
          const clue = puz.givens[i];
          const m = marks[i];
          const isBad = bad.has(i);
          const cls = [
            styles.cell,
            clue != null ? styles.given : '',
            m === 1 ? styles.black : '',
            m === 2 ? styles.dot : '',
            isBad ? styles.badCell : '',
          ].join(' ');
          return (
            <button
              key={i}
              className={cls}
              onClick={(e) => onCell(i, e)}
              onContextMenu={(e) => onCell(i, e)}
              aria-label={`cell ${i}`}
              title={clue != null ? `Clue: ${clue}` : 'Left click: black. Right click: dot.'}
            >
              {clue != null ? clue : (m === 1 ? '' : '')}
            </button>
          );
        })}
      </div>
    </div>
  );
}
