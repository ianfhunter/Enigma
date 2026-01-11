import { useCallback, useEffect, useMemo, useState } from 'react';
import GameHeader from '../../components/GameHeader';
import styles from './Galaxies.module.css';

// Simplified Galaxies: dots at cell centres only.
// Player assigns each cell to a dot/galaxy. A galaxy is valid if:
// - region is connected
// - region is 180° symmetric about its dot cell

const COLORS = [
  '#ef4444',
  '#3b82f6',
  '#22c55e',
  '#f59e0b',
  '#a855f7',
  '#06b6d4',
  '#f472b6',
  '#94a3b8',
  '#10b981',
  '#f43f5e',
];

function rcToIdx(r, c, w) {
  return r * w + c;
}
function idxToRC(i, w) {
  return { r: Math.floor(i / w), c: i % w };
}
function inBounds(r, c, h, w) {
  return r >= 0 && r < h && c >= 0 && c < w;
}

// Generate a puzzle by growing symmetric regions
function generatePuzzle(size, numDots) {
  const w = size;
  const h = size;
  const n = w * h;
  
  for (let attempt = 0; attempt < 50; attempt++) {
    // Generate random dot positions
    const dots = [];
    const used = new Set();
    
    for (let d = 0; d < numDots; d++) {
      let r, c, key;
      let tries = 0;
      do {
        r = Math.floor(Math.random() * h);
        c = Math.floor(Math.random() * w);
        key = `${r},${c}`;
        tries++;
      } while (used.has(key) && tries < 100);
      
      if (tries >= 100) break;
      
      used.add(key);
      dots.push({ r, c });
    }
    
    if (dots.length < numDots) continue;
    
    // Initialize solution (all unassigned)
    const sol = new Array(n).fill(-1);
    
    // Assign dot cells to their galaxies
    for (let g = 0; g < dots.length; g++) {
      const { r, c } = dots[g];
      sol[rcToIdx(r, c, w)] = g;
    }
    
    // Grow galaxies symmetrically
    const dirs = [
      { dr: -1, dc: 0 }, { dr: 1, dc: 0 },
      { dr: 0, dc: -1 }, { dr: 0, dc: 1 },
      { dr: -1, dc: -1 }, { dr: -1, dc: 1 },
      { dr: 1, dc: -1 }, { dr: 1, dc: 1 },
    ];
    
    // Repeat growth until no more cells can be added
    let changed = true;
    let iterations = 0;
    while (changed && iterations < n * 2) {
      changed = false;
      iterations++;
      
      // Shuffle galaxy order for fairness
      const order = dots.map((_, i) => i).sort(() => Math.random() - 0.5);
      
      for (const g of order) {
        const { r: cr, c: cc } = dots[g];
        
        // Find frontier cells for this galaxy
        const frontier = [];
        for (let i = 0; i < n; i++) {
          if (sol[i] !== g) continue;
          const { r, c } = idxToRC(i, w);
          
          for (const d of dirs) {
            const nr = r + d.dr;
            const nc = c + d.dc;
            if (!inBounds(nr, nc, h, w)) continue;
            const ni = rcToIdx(nr, nc, w);
            if (sol[ni] !== -1) continue;
            
            // Check if symmetric cell is available
            const sr = 2 * cr - nr;
            const sc = 2 * cc - nc;
            if (!inBounds(sr, sc, h, w)) continue;
            const si = rcToIdx(sr, sc, w);
            if (sol[si] !== -1 && sol[si] !== g) continue;
            
            frontier.push({ ni, si });
          }
        }
        
        // Try to add one cell from frontier
        if (frontier.length > 0) {
          const { ni, si } = frontier[Math.floor(Math.random() * frontier.length)];
          if (sol[ni] === -1 && (sol[si] === -1 || sol[si] === g || ni === si)) {
            sol[ni] = g;
            if (ni !== si) sol[si] = g;
            changed = true;
          }
        }
      }
    }
    
    // Check if all cells are assigned
    if (sol.every(x => x >= 0)) {
      return { w, h, dots, solution: sol };
    }
  }
  
  // Fallback: simple 2x2 grid pattern
  const dots = [];
  const sol = new Array(n).fill(-1);
  const blockSize = Math.ceil(size / 2);
  let dotIdx = 0;
  
  for (let br = 0; br < 2; br++) {
    for (let bc = 0; bc < 2; bc++) {
      const cr = br * blockSize + Math.floor(blockSize / 2);
      const cc = bc * blockSize + Math.floor(blockSize / 2);
      if (cr < h && cc < w) {
        dots.push({ r: cr, c: cc });
        for (let r = br * blockSize; r < Math.min((br + 1) * blockSize, h); r++) {
          for (let c = bc * blockSize; c < Math.min((bc + 1) * blockSize, w); c++) {
            sol[rcToIdx(r, c, w)] = dotIdx;
          }
        }
        dotIdx++;
      }
    }
  }
  
  return { w, h, dots, solution: sol };
}

const SIZES = [4, 6, 8];
const DOT_COUNTS = [3, 4, 5, 6];

function analyze(puz, assign) {
  const n = puz.w * puz.h;
  const bad = new Set();

  // all assigned?
  const allAssigned = assign.every((x) => x >= 0);

  // build cells per region
  const cellsBy = Array.from({ length: puz.dots.length }, () => []);
  for (let i = 0; i < n; i++) {
    const g = assign[i];
    if (g < 0) continue;
    if (!cellsBy[g]) continue;
    cellsBy[g].push(i);
  }

  // validate each region: connected + symmetry
  for (let g = 0; g < puz.dots.length; g++) {
    const cells = cellsBy[g];
    if (cells.length === 0) continue;
    const { r: cr, c: cc } = puz.dots[g];
    const cellSet = new Set(cells);

    // symmetry
    for (const i of cells) {
      const { r, c } = idxToRC(i, puz.w);
      const rr = 2 * cr - r;
      const cc2 = 2 * cc - c;
      if (!inBounds(rr, cc2, puz.h, puz.w) || !cellSet.has(rcToIdx(rr, cc2, puz.w))) {
        bad.add(i);
      }
    }

    // must contain its dot cell
    const dotIdx = rcToIdx(cr, cc, puz.w);
    if (!cellSet.has(dotIdx)) bad.add(dotIdx);

    // connectivity
    const start = cells[0];
    const seen = new Set([start]);
    const stack = [start];
    const dirs = [{ dr: -1, dc: 0 }, { dr: 1, dc: 0 }, { dr: 0, dc: -1 }, { dr: 0, dc: 1 }];
    while (stack.length) {
      const u = stack.pop();
      const { r, c } = idxToRC(u, puz.w);
      for (const d of dirs) {
        const rr = r + d.dr, cc3 = c + d.dc;
        if (!inBounds(rr, cc3, puz.h, puz.w)) continue;
        const v = rcToIdx(rr, cc3, puz.w);
        if (!cellSet.has(v) || seen.has(v)) continue;
        seen.add(v);
        stack.push(v);
      }
    }
    if (seen.size !== cells.length) {
      for (const i of cells) bad.add(i);
    }
  }

  const solved = allAssigned && bad.size === 0;
  return { bad, solved };
}

export default function Galaxies() {
  const [size, setSize] = useState(6);
  const [numDots, setNumDots] = useState(4);
  const [puz, setPuz] = useState(null);
  const [sel, setSel] = useState(0);
  const [assign, setAssign] = useState([]);

  const generateNew = useCallback(() => {
    const newPuz = generatePuzzle(size, numDots);
    setPuz(newPuz);
    setAssign(new Array(newPuz.w * newPuz.h).fill(-1));
    setSel(0);
  }, [size, numDots]);

  useEffect(() => {
    generateNew();
  }, []);

  const { bad, solved } = useMemo(() => {
    if (!puz) return { bad: new Set(), solved: false };
    return analyze(puz, assign);
  }, [puz, assign]);

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
        title="Galaxies"
        instructions="Partition the grid into galaxies. Each galaxy must be connected and 180° symmetric about its dot. Select a dot color, then click cells to assign them to that galaxy."
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
          <label>Dots:</label>
          {DOT_COUNTS.map((d) => (
            <button
              key={d}
              className={`${styles.button} ${numDots === d ? styles.active : ''}`}
              onClick={() => setNumDots(d)}
            >
              {d}
            </button>
          ))}
        </div>
        <div className={styles.group}>
          <button className={styles.generateBtn} onClick={generateNew}>New Puzzle</button>
          {puz && <button className={styles.button} onClick={() => setAssign(new Array(puz.w * puz.h).fill(-1))}>Clear</button>}
          {puz && <button className={styles.button} onClick={() => setAssign(puz.solution.slice())}>Reveal</button>}
        </div>
        {puz && (
          <div className={styles.group}>
            <div className={styles.palette}>
              {puz.dots.map((d, i) => (
                <div
                  key={i}
                  className={`${styles.swatch} ${sel === i ? styles.active : ''}`}
                  style={{ background: COLORS[i % COLORS.length] }}
                  onClick={() => setSel(i)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && setSel(i)}
                  title={`Dot ${i + 1} at (${d.r + 1},${d.c + 1})`}
                />
              ))}
            </div>
          </div>
        )}
        <div className={styles.status}>
          {solved ? <span className={styles.win}>Solved!</span> : (bad.size ? <span className={styles.bad}>Invalid symmetry/connection</span> : <span>OK</span>)}
        </div>
      </div>

      {puz && (
        <div className={styles.grid} style={{ gridTemplateColumns: `repeat(${puz.w}, 44px)` }}>
          {Array.from({ length: puz.w * puz.h }, (_, i) => {
            const g = assign[i];
            const { r, c } = idxToRC(i, puz.w);
            const dotHere = puz.dots.findIndex((d) => d.r === r && d.c === c);
            const bg = g >= 0 ? COLORS[g % COLORS.length] : 'rgba(255,255,255,0.06)';
            const style = { background: bg };
            return (
              <div
                key={i}
                className={`${styles.cell} ${bad.has(i) ? styles.badCell : ''}`}
                style={style}
                onClick={() => paint(i)}
                title={`(${r + 1},${c + 1})`}
              >
                {dotHere >= 0 && <div className={styles.dot}>•</div>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

