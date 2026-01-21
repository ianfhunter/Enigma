import { useCallback, useMemo, useState } from 'react';
import GameHeader from '../../components/GameHeader';
import GiveUpButton from '../../components/GiveUpButton';
import GameResult from '../../components/GameResult';
import styles from './Dominosa.module.css';

function shuffled(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pairsUpTo(n) {
  const out = [];
  for (let a = 0; a <= n; a++) {
    for (let b = a; b <= n; b++) out.push([a, b]);
  }
  return out;
}

function genTiling(w, h) {
  const used = Array.from({ length: h }, () => Array(w).fill(false));
  const placements = [];

  function findNext() {
    for (let r = 0; r < h; r++) {
      for (let c = 0; c < w; c++) {
        if (!used[r][c]) return [r, c];
      }
    }
    return null;
  }

  function dfs() {
    const cell = findNext();
    if (!cell) return true;
    const [r, c] = cell;
    used[r][c] = true;

    const opts = shuffled([
      { r2: r, c2: c + 1 },
      { r2: r + 1, c2: c },
    ]).filter(({ r2, c2 }) => r2 >= 0 && r2 < h && c2 >= 0 && c2 < w && !used[r2][c2]);

    for (const { r2, c2 } of opts) {
      used[r2][c2] = true;
      placements.push([[r, c], [r2, c2]]);
      if (dfs()) return true;
      placements.pop();
      used[r2][c2] = false;
    }

    used[r][c] = false;
    return false;
  }

  dfs();
  return placements;
}

function buildPuzzle(maxN) {
  const w = maxN + 2;
  const h = maxN + 1;
  const pairs = shuffled(pairsUpTo(maxN));
  const tiling = genTiling(w, h);
  // Assign pair to each placement
  const numbers = Array.from({ length: h }, () => Array(w).fill(null));
  for (let i = 0; i < tiling.length; i++) {
    const [[r1, c1], [r2, c2]] = tiling[i];
    const [a, b] = pairs[i];
    if (Math.random() < 0.5) {
      numbers[r1][c1] = a;
      numbers[r2][c2] = b;
    } else {
      numbers[r1][c1] = b;
      numbers[r2][c2] = a;
    }
  }
  return { w, h, maxN, numbers, solution: tiling };
}

function edgeKey(a, b) {
  const [r1, c1] = a;
  const [r2, c2] = b;
  const k1 = `${r1},${c1}`;
  const k2 = `${r2},${c2}`;
  return k1 < k2 ? `${k1}|${k2}` : `${k2}|${k1}`;
}

function adjacent(a, b) {
  return Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) === 1;
}

export default function Dominosa() {
  const [maxN, setMaxN] = useState(6);
  const [puzzle, setPuzzle] = useState(() => buildPuzzle(6));
  // placed: map cell "r,c" -> partner "r,c"
  const [placed, setPlaced] = useState(() => new Map());
  const [crossed, setCrossed] = useState(() => new Set()); // edgeKey
  const [gaveUp, setGaveUp] = useState(false);

  const w = puzzle.w;
  const h = puzzle.h;

  const newGame = useCallback((n = maxN) => {
    setPuzzle(buildPuzzle(n));
    setPlaced(new Map());
    setCrossed(new Set());
    setGaveUp(false);
  }, [maxN]);

  const giveUp = useCallback(() => {
    // Reveal the solution by placing all dominoes from the tiling
    const solutionMap = new Map();
    for (const [[r1, c1], [r2, c2]] of puzzle.solution) {
      const ka = `${r1},${c1}`;
      const kb = `${r2},${c2}`;
      solutionMap.set(ka, kb);
      solutionMap.set(kb, ka);
    }
    setPlaced(solutionMap);
    setCrossed(new Set());
    setGaveUp(true);
  }, [puzzle.solution]);

  const toggleDomino = (a, b) => {
    if (!adjacent(a, b)) return;
    const ka = `${a[0]},${a[1]}`;
    const kb = `${b[0]},${b[1]}`;
    const ek = edgeKey(a, b);

    setCrossed((prev) => {
      if (!prev.has(ek)) return prev;
      const next = new Set(prev);
      next.delete(ek);
      return next;
    });

    setPlaced((prev) => {
      const next = new Map(prev);
      const pa = next.get(ka);
      const pb = next.get(kb);

      // If already paired with each other, remove
      if (pa === kb && pb === ka) {
        next.delete(ka);
        next.delete(kb);
        return next;
      }

      // Remove any overlapping dominos
      if (pa) { next.delete(pa); next.delete(ka); }
      if (pb) { next.delete(pb); next.delete(kb); }

      // Place new domino
      next.set(ka, kb);
      next.set(kb, ka);
      return next;
    });
  };

  const toggleCross = (a, b) => {
    if (!adjacent(a, b)) return;
    const ek = edgeKey(a, b);
    setCrossed((prev) => {
      const next = new Set(prev);
      if (next.has(ek)) next.delete(ek);
      else next.add(ek);
      return next;
    });
  };

  const usedPairs = useMemo(() => {
    const seen = new Set();
    const pairs = [];
    for (const [k, v] of placed.entries()) {
      if (seen.has(k)) continue;
      seen.add(k);
      seen.add(v);
      const [r1, c1] = k.split(',').map(Number);
      const [r2, c2] = v.split(',').map(Number);
      const a = puzzle.numbers[r1][c1];
      const b = puzzle.numbers[r2][c2];
      const lo = Math.min(a, b);
      const hi = Math.max(a, b);
      pairs.push(`${lo}-${hi}`);
    }
    return pairs;
  }, [placed, puzzle.numbers]);

  const completeCover = placed.size === w * h;
  const uniquePairs = new Set(usedPairs).size === usedPairs.length;
  const requiredCount = ((maxN + 1) * (maxN + 2)) / 2;
  const solved = completeCover && uniquePairs && usedPairs.length === requiredCount;

  // For drawing: create a set of normalized edges used by dominos
  const dominoEdges = useMemo(() => {
    const edges = new Set();
    const seen = new Set();
    for (const [k, v] of placed.entries()) {
      if (seen.has(k)) continue;
      seen.add(k);
      seen.add(v);
      const [r1, c1] = k.split(',').map(Number);
      const [r2, c2] = v.split(',').map(Number);
      edges.add(edgeKey([r1, c1], [r2, c2]));
    }
    return edges;
  }, [placed]);

  return (
    <div className={styles.container}>
      <GameHeader
        title="Dominosa"
        instructions="Place dominoes between adjacent numbers so that every unordered pair 0..N appears exactly once."
      />

      <div className={styles.toolbar}>
        <label className={styles.label}>
          Max number
          <select
            className={styles.select}
            value={maxN}
            onChange={(e) => {
              const n = Number(e.target.value);
              setMaxN(n);
              newGame(n);
            }}
          >
            {[4, 5, 6, 7].map((v) => <option key={v} value={v}>{v}</option>)}
          </select>
        </label>
        <button className={styles.button} onClick={() => newGame(maxN)}>New</button>
        <GiveUpButton
          onGiveUp={giveUp}
          disabled={solved || gaveUp}
        />
        {gaveUp && (
          <GameResult
            state="gaveup"
            title="Solution shown"
            variant="inline"
          />
        )}
        {solved && !gaveUp && (
          <GameResult
            state="won"
            title="Solved!"
            variant="inline"
          />
        )}
        {!solved && !gaveUp && (
          <div className={styles.status}>
            <span>Placed: {usedPairs.length}/{requiredCount}</span>
          </div>
        )}
      </div>

      <div
        className={styles.grid}
        style={{ gridTemplateColumns: `repeat(${w}, 1fr)` }}
      >
        {puzzle.numbers.map((row, r) =>
          row.map((v, c) => {
            const key = `${r},${c}`;
            const partner = placed.get(key);
            const isPaired = !!partner;
            const isRightEdge = c === w - 1;
            const isBottomEdge = r === h - 1;

            const rightKey = !isRightEdge ? edgeKey([r, c], [r, c + 1]) : null;
            const downKey = !isBottomEdge ? edgeKey([r, c], [r + 1, c]) : null;

            const dominoRight = rightKey ? dominoEdges.has(rightKey) : false;
            const dominoDown = downKey ? dominoEdges.has(downKey) : false;
            const crossRight = rightKey ? crossed.has(rightKey) : false;
            const crossDown = downKey ? crossed.has(downKey) : false;

            return (
              <div key={key} className={`${styles.cell} ${isPaired ? styles.paired : ''}`}>
                <div className={styles.num}>{v}</div>

                {!isRightEdge && (
                  <button
                    className={`${styles.edgeBtn} ${styles.edgeRight} ${dominoRight ? styles.domino : ''} ${crossRight ? styles.cross : ''}`}
                    onClick={() => toggleDomino([r, c], [r, c + 1])}
                    onContextMenu={(e) => { e.preventDefault(); toggleCross([r, c], [r, c + 1]); }}
                    aria-label={`edge ${r},${c} to ${r},${c + 1}`}
                    title="Left: domino • Right: cross"
                  />
                )}

                {!isBottomEdge && (
                  <button
                    className={`${styles.edgeBtn} ${styles.edgeDown} ${dominoDown ? styles.domino : ''} ${crossDown ? styles.cross : ''}`}
                    onClick={() => toggleDomino([r, c], [r + 1, c])}
                    onContextMenu={(e) => { e.preventDefault(); toggleCross([r, c], [r + 1, c]); }}
                    aria-label={`edge ${r},${c} to ${r + 1},${c}`}
                    title="Left: domino • Right: cross"
                  />
                )}
              </div>
            );
          })
        )}
      </div>

      <div className={styles.footer}>
        <div className={styles.hint}>
          <span><strong>Rule check:</strong> cover all cells with dominoes, and don’t reuse any unordered pair.</span>
          {!uniquePairs && <span className={styles.bad}>Duplicate pair used</span>}
        </div>
      </div>
    </div>
  );
}
