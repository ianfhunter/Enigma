import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import GameHeader from '../../components/GameHeader';
import styles from './Magnets.module.css';

// Minimal Magnets: procedurally generated domino tiling + computed row/col (+/-) counts from hidden solution.
// Click a cell to cycle the domino: empty -> (+ on clicked cell) -> (- on clicked cell) -> blank -> empty.
// Constraints checked:
// - adjacent equal poles not allowed (orthogonal)
// - row/column +/- counts match clues

function rcToIdx(r, c, w) {
  return r * w + c;
}
function idxToRC(i, w) {
  return { r: Math.floor(i / w), c: i % w };
}
function inBounds(r, c, h, w) {
  return r >= 0 && r < h && c >= 0 && c < w;
}

// Domino state:
// 0 unknown/empty
// 1 magnet (+ on first cell in domino ordering)
// 2 magnet (- on first cell in domino ordering)
// 3 blank (neutral)

// Generate a random domino tiling for a grid
function generateDominoTiling(w, h) {
  const n = w * h;
  const used = new Array(n).fill(false);
  const dominoes = [];

  // Randomly try to pair adjacent cells
  const cells = [];
  for (let i = 0; i < n; i++) cells.push(i);

  // Shuffle cells for randomness
  for (let i = cells.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cells[i], cells[j]] = [cells[j], cells[i]];
  }

  for (const i of cells) {
    if (used[i]) continue;

    const { r, c } = idxToRC(i, w);
    const neighbors = [];

    // Right neighbor
    if (c + 1 < w && !used[rcToIdx(r, c + 1, w)]) {
      neighbors.push(rcToIdx(r, c + 1, w));
    }
    // Down neighbor
    if (r + 1 < h && !used[rcToIdx(r + 1, c, w)]) {
      neighbors.push(rcToIdx(r + 1, c, w));
    }
    // Left neighbor
    if (c - 1 >= 0 && !used[rcToIdx(r, c - 1, w)]) {
      neighbors.push(rcToIdx(r, c - 1, w));
    }
    // Up neighbor
    if (r - 1 >= 0 && !used[rcToIdx(r - 1, c, w)]) {
      neighbors.push(rcToIdx(r - 1, c, w));
    }

    if (neighbors.length === 0) continue;

    // Pick random neighbor
    const j = neighbors[Math.floor(Math.random() * neighbors.length)];
    used[i] = true;
    used[j] = true;
    dominoes.push([Math.min(i, j), Math.max(i, j)]);
  }

  // If any cells are unpaired, try to fix by regenerating
  if (used.some(u => !u)) {
    // Fallback: use a simple regular tiling
    return generateRegularTiling(w, h);
  }

  return dominoes;
}

// Generate a regular (brick-like) domino tiling
function generateRegularTiling(w, h) {
  const dominoes = [];
  const used = new Array(w * h).fill(false);

  for (let r = 0; r < h; r++) {
    for (let c = 0; c < w; c++) {
      const i = rcToIdx(r, c, w);
      if (used[i]) continue;

      // Alternate between horizontal and vertical based on position
      const tryHorizontal = (r + Math.floor(c / 2)) % 2 === 0;

      if (tryHorizontal && c + 1 < w && !used[rcToIdx(r, c + 1, w)]) {
        const j = rcToIdx(r, c + 1, w);
        used[i] = true;
        used[j] = true;
        dominoes.push([i, j]);
      } else if (r + 1 < h && !used[rcToIdx(r + 1, c, w)]) {
        const j = rcToIdx(r + 1, c, w);
        used[i] = true;
        used[j] = true;
        dominoes.push([i, j]);
      } else if (c + 1 < w && !used[rcToIdx(r, c + 1, w)]) {
        const j = rcToIdx(r, c + 1, w);
        used[i] = true;
        used[j] = true;
        dominoes.push([i, j]);
      }
    }
  }

  return dominoes;
}

// Generate a complete puzzle
function generatePuzzle(size, difficulty) {
  const w = size;
  const h = size;
  const n = w * h;

  // Generate domino tiling
  const dominoes = generateDominoTiling(w, h);

  // Create domOf mapping
  const domOf = new Array(n).fill(-1);
  dominoes.forEach(([a, b], di) => {
    domOf[a] = di;
    domOf[b] = di;
  });

  // Generate solution
  const sol = new Array(dominoes.length).fill(0);
  const cellPole = new Array(n).fill(0);

  const blankRate = difficulty === 'easy' ? 0.4 : difficulty === 'medium' ? 0.3 : 0.2;

  const setDomino = (di, state) => {
    sol[di] = state;
    const [a, b] = dominoes[di];
    cellPole[a] = 0;
    cellPole[b] = 0;
    if (state === 3) return;
    if (state === 0) return;
    if (state === 1) { cellPole[a] = +1; cellPole[b] = -1; }
    if (state === 2) { cellPole[a] = -1; cellPole[b] = +1; }
  };

  const neighbors = (i) => {
    const { r, c } = idxToRC(i, w);
    const out = [];
    const ds = [{ dr: -1, dc: 0 }, { dr: 1, dc: 0 }, { dr: 0, dc: -1 }, { dr: 0, dc: 1 }];
    for (const d of ds) {
      const rr = r + d.dr, cc = c + d.dc;
      if (!inBounds(rr, cc, h, w)) continue;
      out.push(rcToIdx(rr, cc, w));
    }
    return out;
  };

  const conflicts = () => {
    for (let i = 0; i < n; i++) {
      if (cellPole[i] === 0) continue;
      for (const j of neighbors(i)) {
        if (cellPole[j] !== 0 && cellPole[j] === cellPole[i]) return true;
      }
    }
    return false;
  };

  // Assign dominos
  for (let di = 0; di < dominoes.length; di++) {
    const roll = Math.random();
    const state = roll < blankRate ? 3 : (Math.random() < 0.5 ? 1 : 2);
    setDomino(di, state);
    if (conflicts()) {
      setDomino(di, 3);
    }
  }

  // Compute clues
  const rowPlus = new Array(h).fill(0);
  const rowMinus = new Array(h).fill(0);
  const colPlus = new Array(w).fill(0);
  const colMinus = new Array(w).fill(0);
  for (let i = 0; i < n; i++) {
    const { r, c } = idxToRC(i, w);
    if (cellPole[i] === 1) { rowPlus[r]++; colPlus[c]++; }
    if (cellPole[i] === -1) { rowMinus[r]++; colMinus[c]++; }
  }

  return {
    name: `${w}×${h}`,
    w,
    h,
    dominoes,
    domOf,
    solution: sol,
    rowPlus,
    rowMinus,
    colPlus,
    colMinus,
  };
}

const SIZES = [4, 6, 8];
const DIFFICULTIES = ['easy', 'medium', 'hard'];


function analyze(puz, state) {
  const n = puz.w * puz.h;
  const bad = new Set();
  const cellPole = new Array(n).fill(0);

  // materialize poles from state
  for (let di = 0; di < puz.dominoes.length; di++) {
    const [a, b] = puz.dominoes[di];
    const s = state[di];
    if (s === 1) { cellPole[a] = +1; cellPole[b] = -1; }
    else if (s === 2) { cellPole[a] = -1; cellPole[b] = +1; }
    else { cellPole[a] = 0; cellPole[b] = 0; }
  }

  // adjacency same-pole conflicts
  const ds = [{ dr: -1, dc: 0 }, { dr: 1, dc: 0 }, { dr: 0, dc: -1 }, { dr: 0, dc: 1 }];
  for (let r = 0; r < puz.h; r++) {
    for (let c = 0; c < puz.w; c++) {
      const i = rcToIdx(r, c, puz.w);
      if (cellPole[i] === 0) continue;
      for (const d of ds) {
        const rr = r + d.dr, cc = c + d.dc;
        if (!inBounds(rr, cc, puz.h, puz.w)) continue;
        const j = rcToIdx(rr, cc, puz.w);
        if (cellPole[j] !== 0 && cellPole[j] === cellPole[i]) { bad.add(i); bad.add(j); }
      }
    }
  }

  // counts
  const rowPlus = new Array(puz.h).fill(0);
  const rowMinus = new Array(puz.h).fill(0);
  const colPlus = new Array(puz.w).fill(0);
  const colMinus = new Array(puz.w).fill(0);
  for (let i = 0; i < n; i++) {
    const { r, c } = idxToRC(i, puz.w);
    if (cellPole[i] === 1) { rowPlus[r]++; colPlus[c]++; }
    if (cellPole[i] === -1) { rowMinus[r]++; colMinus[c]++; }
  }
  const countsOk =
    rowPlus.every((v, i) => v === puz.rowPlus[i]) &&
    rowMinus.every((v, i) => v === puz.rowMinus[i]) &&
    colPlus.every((v, i) => v === puz.colPlus[i]) &&
    colMinus.every((v, i) => v === puz.colMinus[i]);

  const solved = bad.size === 0 && countsOk;
  return { bad, cellPole, rowPlus, rowMinus, colPlus, colMinus, countsOk, solved };
}

// Export helpers for testing
export {
  rcToIdx,
  idxToRC,
  inBounds,
  generateDominoTiling,
  generateRegularTiling,
  generatePuzzle,
  SIZES,
  DIFFICULTIES,
  analyze,
};

export default function Magnets() {
  const { t } = useTranslation();
  const [size, setSize] = useState(6);
  const [difficulty, setDifficulty] = useState('medium');
  const [puz, setPuz] = useState(null);
  const [state, setState] = useState([]);

  const generateNew = useCallback(() => {
    const p = generatePuzzle(size, difficulty);
    setPuz(p);
    setState(new Array(p.dominoes.length).fill(0));
  }, [size, difficulty]);

  useEffect(() => {
    generateNew();
  }, []);

  const reset = () => {
    if (puz) {
      setState(new Array(puz.dominoes.length).fill(0));
    }
  };

  const { bad, cellPole, countsOk, solved } = useMemo(() => {
    if (!puz) return { bad: new Set(), cellPole: [], countsOk: false, solved: false };
    return analyze(puz, state);
  }, [puz, state]);

  const clickCell = (i, e) => {
    e.preventDefault();
    const di = puz.domOf[i];
    if (di < 0) return;
    const [a, b] = puz.dominoes[di];
    const clickedFirst = i === a;
    const cur = state[di];
    // Cycle: 0 -> (magnet with + on clicked) -> (magnet with - on clicked) -> blank -> 0
    let next = 0;
    if (cur === 0) next = clickedFirst ? 1 : 2;
    else if (cur === 1) next = clickedFirst ? 2 : 1;
    else if (cur === 2) next = 3;
    else if (cur === 3) next = 0;
    setState((prev) => {
      const n = prev.slice();
      n[di] = next;
      return n;
    });
  };

  const renderCell = (i) => {
    const pole = cellPole[i];
    if (pole === 1) return <span className={styles.plus}>+</span>;
    if (pole === -1) return <span className={styles.minus}>−</span>;
    // blank/unknown
    const di = puz.domOf[i];
    if (di >= 0 && state[di] === 3) return <span className={styles.blank}>·</span>;
    return '';
  };

  return (
    <div className={styles.container}>
      <GameHeader
        title="Magnets"
        instructions="Each domino is either a magnet (+/−) or blank (·). Adjacent equal poles are not allowed. Clues along the edges show how many + and − poles belong in each row/column."
      />

      <div className={styles.toolbar}>
        <div className={styles.group}>
          <label>Size:</label>
          {SIZES.map((s) => (
            <button
              key={s}
              className={`${styles.button} ${size === s ? styles.active : ''}`}
              onClick={() => setSize(s)}
            >
              {s}×{s}
            </button>
          ))}
        </div>
        <div className={styles.group}>
          <label>Difficulty:</label>
          {DIFFICULTIES.map((d) => (
            <button
              key={d}
              className={`${styles.button} ${difficulty === d ? styles.active : ''}`}
              onClick={() => setDifficulty(d)}
            >
              {d.charAt(0).toUpperCase() + d.slice(1)}
            </button>
          ))}
        </div>
        <div className={styles.group}>
          <button className={styles.generateBtn} onClick={generateNew}>{t('common.newPuzzle')}</button>
          <button className={styles.button} onClick={reset}>{t('common.clear')}</button>
          {puz && <button className={styles.button} onClick={() => setState(puz.solution.slice())}>{t('common.reveal')}</button>}
        </div>

        <div className={styles.status}>
          {solved ? <span className={styles.win}>Solved!</span> : (countsOk && bad.size === 0 ? <span>OK</span> : <span className={styles.bad}>Conflicts / counts off</span>)}
        </div>
      </div>

      {puz && (
        <div className={styles.wrap}>
          <div
            className={styles.gridContainer}
            style={{
              gridTemplateColumns: `44px repeat(${puz.w}, 44px) 44px`,
              gridTemplateRows: `44px repeat(${puz.h}, 44px) 44px`
            }}
          >
            {/* Top-left corner (empty) */}
            <div className={styles.corner}></div>

            {/* Top edge: Column + clues */}
            {puz.colPlus.map((count, c) => (
              <div key={`col-plus-${c}`} className={`${styles.clueCell} ${styles.clueTop}`}>
                <span className={styles.plus}>+{count}</span>
              </div>
            ))}

            {/* Top-right corner (empty) */}
            <div className={styles.corner}></div>

            {/* Main rows with left/right clues */}
            {Array.from({ length: puz.h }, (_, r) => (
              <>
                {/* Left edge: Row + clue */}
                <div key={`row-plus-${r}`} className={`${styles.clueCell} ${styles.clueLeft}`}>
                  <span className={styles.plus}>+{puz.rowPlus[r]}</span>
                </div>

                {/* Grid cells for this row */}
                {Array.from({ length: puz.w }, (_, c) => {
                  const i = rcToIdx(r, c, puz.w);
                  return (
                    <button
                      key={`cell-${i}`}
                      className={[styles.cell, styles.domino, bad.has(i) ? styles.badCell : ''].join(' ')}
                      onClick={(e) => clickCell(i, e)}
                      onContextMenu={(e) => clickCell(i, e)}
                      title="Click to cycle this domino"
                    >
                      {renderCell(i)}
                    </button>
                  );
                })}

                {/* Right edge: Row - clue */}
                <div key={`row-minus-${r}`} className={`${styles.clueCell} ${styles.clueRight}`}>
                  <span className={styles.minus}>−{puz.rowMinus[r]}</span>
                </div>
              </>
            ))}

            {/* Bottom-left corner (empty) */}
            <div className={styles.corner}></div>

            {/* Bottom edge: Column - clues */}
            {puz.colMinus.map((count, c) => (
              <div key={`col-minus-${c}`} className={`${styles.clueCell} ${styles.clueBottom}`}>
                <span className={styles.minus}>−{count}</span>
              </div>
            ))}

            {/* Bottom-right corner (empty) */}
            <div className={styles.corner}></div>
          </div>

          <div className={styles.legend}>
            <span className={styles.plus}>+</span> clues on left/top &nbsp;|&nbsp; <span className={styles.minus}>−</span> clues on right/bottom
          </div>
        </div>
      )}
    </div>
  );
}
