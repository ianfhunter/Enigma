import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import GameHeader from '../../components/GameHeader';
import styles from './Mosaic.module.css';

// Cell state: null=unknown, 1=black, 0=white

function idx(r, c, w) {
  return r * w + c;
}

function inBounds(r, c, w, h) {
  return r >= 0 && r < h && c >= 0 && c < w;
}

function neighbors3x3(r, c, w, h) {
  const out = [];
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      const nr = r + dr;
      const nc = c + dc;
      if (inBounds(nr, nc, w, h)) out.push([nr, nc]);
    }
  }
  return out;
}

function makeSolution(w, h, density = 0.45) {
  return Array.from({ length: w * h }, () => (Math.random() < density ? 1 : 0));
}

function makeClues(solution, w, h) {
  const clues = Array(w * h).fill(null);
  for (let r = 0; r < h; r++) {
    for (let c = 0; c < w; c++) {
      let count = 0;
      for (const [nr, nc] of neighbors3x3(r, c, w, h)) {
        count += solution[idx(nr, nc, w)] === 1 ? 1 : 0;
      }
      clues[idx(r, c, w)] = count;
    }
  }
  return clues;
}

function maskClues(allClues, w, h, clueDensity = 0.55) {
  // Keep some clue numbers; always keep border clues a bit more often.
  return allClues.map((v, i) => {
    const r = Math.floor(i / w);
    const c = i % w;
    const border = r === 0 || c === 0 || r === h - 1 || c === w - 1;
    const p = border ? Math.min(1, clueDensity + 0.15) : clueDensity;
    return Math.random() < p ? v : null;
  });
}

function cycleCell(current, button) {
  // Left cycles: null -> black -> white -> null
  // Right cycles: null -> white -> black -> null
  if (button === 'left') {
    if (current == null) return 1;
    if (current === 1) return 0;
    return null;
  }
  if (current == null) return 0;
  if (current === 0) return 1;
  return null;
}

export default function Mosaic() {
  const [size, setSize] = useState({ w: 15, h: 15 });
  const [params, setParams] = useState({ fill: 0.45, clue: 0.55 });
  const [solution, setSolution] = useState(() => makeSolution(15, 15, 0.45));
  const [allClues, setAllClues] = useState(() => makeClues(solution, 15, 15));
  const [clues, setClues] = useState(() => maskClues(allClues, 15, 15, 0.55));
  const [cells, setCells] = useState(() => Array(15 * 15).fill(null));
  const [showSolution, setShowSolution] = useState(false);

  const dragRef = useRef({ active: false, button: 'left', seen: new Set() });

  const newGame = useCallback((w = size.w, h = size.h, fill = params.fill, clue = params.clue) => {
    const sol = makeSolution(w, h, fill);
    const full = makeClues(sol, w, h);
    const masked = maskClues(full, w, h, clue);
    setSize({ w, h });
    setSolution(sol);
    setAllClues(full);
    setClues(masked);
    setCells(Array(w * h).fill(null));
    setShowSolution(false);
  }, [params.clue, params.fill, size.h, size.w]);

  const analysis = useMemo(() => {
    const w = size.w;
    const h = size.h;
    const bad = new Set();
    const good = new Set();
    let allSatisfied = true;
    for (let r = 0; r < h; r++) {
      for (let c = 0; c < w; c++) {
        const clue = clues[idx(r, c, w)];
        if (clue == null) continue;
        let black = 0;
        let unknown = 0;
        for (const [nr, nc] of neighbors3x3(r, c, w, h)) {
          const v = cells[idx(nr, nc, w)];
          if (v == null) unknown++;
          else if (v === 1) black++;
        }
        const min = black;
        const max = black + unknown;
        if (min > clue || max < clue) {
          bad.add(idx(r, c, w));
          allSatisfied = false;
        } else if (unknown === 0 && black === clue) {
          good.add(idx(r, c, w));
        } else {
          allSatisfied = false;
        }
      }
    }
    const filled = cells.every((v) => v != null);
    const solved = filled && allSatisfied && bad.size === 0;
    return { bad, good, solved };
  }, [cells, clues, size.h, size.w]);

  useEffect(() => {
    const onUp = () => {
      dragRef.current.active = false;
      dragRef.current.seen = new Set();
    };
    window.addEventListener('mouseup', onUp);
    return () => window.removeEventListener('mouseup', onUp);
  }, []);

  const applyAt = (i, button) => {
    setCells((prev) => {
      const next = prev.slice();
      next[i] = cycleCell(next[i], button);
      return next;
    });
  };

  const onCellDown = (i, button) => {
    dragRef.current.active = true;
    dragRef.current.button = button;
    dragRef.current.seen = new Set([i]);
    applyAt(i, button);
  };

  const onCellEnter = (i) => {
    if (!dragRef.current.active) return;
    if (dragRef.current.seen.has(i)) return;
    dragRef.current.seen.add(i);
    applyAt(i, dragRef.current.button);
  };

  return (
    <div className={styles.container}>
      <GameHeader
        title="Mosaic"
        instructions="Fill squares black/white. Each clue number equals the number of black squares in its surrounding 3×3 (including itself). Left-click cycles toward black; right-click cycles toward white."
      />

      <div className={styles.toolbar}>
        <div className={styles.group}>
          <label className={styles.label}>
            Size
            <select
              className={styles.select}
              value={`${size.w}x${size.h}`}
              onChange={(e) => {
                const [w, h] = e.target.value.split('x').map(Number);
                newGame(w, h, params.fill, params.clue);
              }}
            >
              <option value="10x10">10×10</option>
              <option value="15x15">15×15</option>
              <option value="20x20">20×20</option>
            </select>
          </label>
          <label className={styles.label}>
            Clue density
            <select
              className={styles.select}
              value={params.clue}
              onChange={(e) => {
                const clue = Number(e.target.value);
                setParams((p) => ({ ...p, clue }));
                newGame(size.w, size.h, params.fill, clue);
              }}
            >
              <option value={0.35}>Low</option>
              <option value={0.55}>Medium</option>
              <option value={0.8}>High</option>
              <option value={1}>All clues</option>
            </select>
          </label>
          <button className={styles.button} onClick={() => newGame(size.w, size.h, params.fill, params.clue)}>New</button>
        </div>

        <div className={styles.group}>
          <button className={styles.button} onClick={() => setCells(Array(size.w * size.h).fill(null))}>Clear</button>
          <button className={styles.button} onClick={() => setShowSolution((v) => !v)}>
            {showSolution ? 'Hide solution' : 'Show solution'}
          </button>
        </div>

        <div className={styles.status}>
          {analysis.solved ? <span className={styles.win}>Solved!</span> : <span>Clue errors: {analysis.bad.size}</span>}
        </div>
      </div>

      <div
        className={styles.grid}
        style={{ gridTemplateColumns: `repeat(${size.w}, 1fr)` }}
        onContextMenu={(e) => e.preventDefault()}
      >
        {Array.from({ length: size.w * size.h }).map((_, i) => {
          const clue = clues[i];
          const v = showSolution ? solution[i] : cells[i];
          const isBad = analysis.bad.has(i);
          const isGood = analysis.good.has(i);
          return (
            <div
              key={i}
              className={`${styles.cell} ${v === 1 ? styles.black : v === 0 ? styles.white : styles.unknown} ${isBad ? styles.bad : ''} ${isGood ? styles.good : ''}`}
              onMouseEnter={() => onCellEnter(i)}
              onMouseDown={(e) => {
                if (e.button === 2) onCellDown(i, 'right');
                else onCellDown(i, 'left');
              }}
              role="button"
              tabIndex={0}
              aria-label={`cell ${i}`}
            >
              {clue != null && <span className={styles.clue}>{clue}</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

