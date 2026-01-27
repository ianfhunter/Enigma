import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import GameHeader from '../../components/GameHeader';
import GiveUpButton from '../../components/GiveUpButton';
import GameResult from '../../components/GameResult';
import { createSeededRandom } from '../../data/wordUtils';
import styles from './Slant.module.css';

function vIdx(r, c, w) {
  return r * (w + 1) + c;
}

class DSU {
  constructor(n) {
    this.p = Array.from({ length: n }, (_, i) => i);
    this.r = Array(n).fill(0);
  }
  find(x) {
    let a = x;
    while (this.p[a] !== a) a = this.p[a];
    while (this.p[x] !== x) {
      const nx = this.p[x];
      this.p[x] = a;
      x = nx;
    }
    return a;
  }
  union(a, b) {
    let ra = this.find(a);
    let rb = this.find(b);
    if (ra === rb) return false;
    if (this.r[ra] < this.r[rb]) [ra, rb] = [rb, ra];
    this.p[rb] = ra;
    if (this.r[ra] === this.r[rb]) this.r[ra]++;
    return true;
  }
  clone() {
    const d = new DSU(this.p.length);
    d.p = this.p.slice();
    d.r = this.r.slice();
    return d;
  }
}

function generateAcyclicSolution(w, h, seed = Date.now()) {
  const random = createSeededRandom(seed);
  const cells = Array.from({ length: h }, () => Array(w).fill(null));
  const nVerts = (w + 1) * (h + 1);
  for (let attempt = 0; attempt < 200; attempt++) {
    const dsu = new DSU(nVerts);
    let ok = true;
    const order = [];
    for (let r = 0; r < h; r++) for (let c = 0; c < w; c++) order.push([r, c]);
    for (let i = order.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [order[i], order[j]] = [order[j], order[i]];
    }

    for (const [r, c] of order) {
      const aBack = vIdx(r, c, w);
      const bBack = vIdx(r + 1, c + 1, w);
      const aFwd = vIdx(r, c + 1, w);
      const bFwd = vIdx(r + 1, c, w);

      const first = random() < 0.5 ? '\\' : '/';
      const tryOrder = first === '\\' ? ['\\', '/'] : ['/', '\\'];
      let placed = false;
      for (const ch of tryOrder) {
        const [u, v] = ch === '\\' ? [aBack, bBack] : [aFwd, bFwd];
        if (dsu.union(u, v)) {
          cells[r][c] = ch;
          placed = true;
          break;
        }
      }
      if (!placed) {
        ok = false;
        break;
      }
    }
    if (ok) return cells;
  }
  // Fallback: empty
  return cells;
}

function degreesFromCells(cells) {
  const h = cells.length;
  const w = cells[0].length;
  const deg = Array((w + 1) * (h + 1)).fill(0);
  for (let r = 0; r < h; r++) {
    for (let c = 0; c < w; c++) {
      const ch = cells[r][c];
      if (!ch) continue;
      if (ch === '\\') {
        deg[vIdx(r, c, w)]++;
        deg[vIdx(r + 1, c + 1, w)]++;
      } else {
        deg[vIdx(r, c + 1, w)]++;
        deg[vIdx(r + 1, c, w)]++;
      }
    }
  }
  return deg;
}

// Get vertices touching a cell
function getCellVertices(r, c, w) {
  return [
    vIdx(r, c, w),      // top-left
    vIdx(r, c + 1, w),  // top-right
    vIdx(r + 1, c, w),  // bottom-left
    vIdx(r + 1, c + 1, w) // bottom-right
  ];
}

// Solver: find all solutions (up to limit) for a given set of clues
function solve(w, h, clues, limit = 2) {
  const nVerts = (w + 1) * (h + 1);
  const solutions = [];

  // possible[r][c] = array of possible values ('\\' or '/')
  const possible = Array.from({ length: h }, () =>
    Array.from({ length: w }, () => ['\\', '/'])
  );

  // Current degree at each vertex
  const curDeg = Array(nVerts).fill(0);
  // Max possible additional degree at each vertex (unfilled cells touching it)
  const maxAdd = Array(nVerts).fill(0);

  // Initialize maxAdd
  for (let r = 0; r < h; r++) {
    for (let c = 0; c < w; c++) {
      const verts = getCellVertices(r, c, w);
      for (const v of verts) maxAdd[v]++;
    }
  }

  // Check if current state is valid
  function isValid(board, dsu) {
    // Check no vertex exceeds its clue
    for (let v = 0; v < nVerts; v++) {
      if (clues[v] !== null && curDeg[v] > clues[v]) return false;
      // Check if it's still possible to reach the clue
      if (clues[v] !== null && curDeg[v] + maxAdd[v] < clues[v]) return false;
    }
    return true;
  }

  // Check if solution is complete and valid
  function isComplete(board, dsu) {
    for (let r = 0; r < h; r++) {
      for (let c = 0; c < w; c++) {
        if (!board[r][c]) return false;
      }
    }
    // Check all clues are satisfied exactly
    for (let v = 0; v < nVerts; v++) {
      if (clues[v] !== null && curDeg[v] !== clues[v]) return false;
    }
    return true;
  }

  function backtrack(board, dsu, pos) {
    if (solutions.length >= limit) return;

    if (pos >= w * h) {
      if (isComplete(board, dsu)) {
        solutions.push(board.map(row => row.slice()));
      }
      return;
    }

    const r = Math.floor(pos / w);
    const c = pos % w;

    // Get vertices for this cell
    const vTL = vIdx(r, c, w);
    const vTR = vIdx(r, c + 1, w);
    const vBL = vIdx(r + 1, c, w);
    const vBR = vIdx(r + 1, c + 1, w);
    const allVerts = [vTL, vTR, vBL, vBR];

    // Reduce maxAdd for all touching vertices
    for (const v of allVerts) maxAdd[v]--;

    // Try both slashes
    for (const ch of ['\\', '/']) {
      const [u, v] = ch === '\\' ? [vTL, vBR] : [vTR, vBL];

      // Check vertex constraints before placing
      const newDegU = curDeg[u] + 1;
      const newDegV = curDeg[v] + 1;

      if (clues[u] !== null && newDegU > clues[u]) continue;
      if (clues[v] !== null && newDegV > clues[v]) continue;

      // Check if other vertices can still reach their targets
      const otherVerts = ch === '\\' ? [vTR, vBL] : [vTL, vBR];
      let canReach = true;
      for (const ov of otherVerts) {
        if (clues[ov] !== null && curDeg[ov] + maxAdd[ov] < clues[ov]) {
          canReach = false;
          break;
        }
      }
      if (!canReach) continue;

      // Clone DSU to check for cycles
      const newDsu = dsu.clone();
      if (!newDsu.union(u, v)) continue; // Would create a cycle

      // Place the slash
      board[r][c] = ch;
      curDeg[u]++;
      curDeg[v]++;

      backtrack(board, newDsu, pos + 1);

      // Undo
      board[r][c] = null;
      curDeg[u]--;
      curDeg[v]--;
    }

    // Restore maxAdd
    for (const v of allVerts) maxAdd[v]++;
  }

  const board = Array.from({ length: h }, () => Array(w).fill(null));
  const dsu = new DSU(nVerts);
  backtrack(board, dsu, 0);

  return solutions;
}

// Export helpers for testing
export {
  vIdx,
  DSU,
  generateAcyclicSolution,
  degreesFromCells,
  getCellVertices,
  solve,
  generatePuzzle,
  hasUniqueSolution,
  analyze,
};

// Check if puzzle with given clues has exactly one solution
function hasUniqueSolution(w, h, clues) {
  const solutions = solve(w, h, clues, 2);
  return solutions.length === 1;
}

// Generate a puzzle with minimal clues that has a unique solution
function generatePuzzle(w, h) {
  const solution = generateAcyclicSolution(w, h);
  const allDegrees = degreesFromCells(solution);
  const nVerts = (w + 1) * (h + 1);

  // Start with all clues
  const clues = allDegrees.slice();

  // Shuffle vertex indices
  const indices = Array.from({ length: nVerts }, (_, i) => i);
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }

  // Try removing clues one by one
  for (const idx of indices) {
    const oldClue = clues[idx];
    clues[idx] = null;

    if (!hasUniqueSolution(w, h, clues)) {
      // Removing this clue makes it non-unique, restore it
      clues[idx] = oldClue;
    }
  }

  return { solution, clues };
}

function analyze(cells, targetDeg, clues) {
  const h = cells.length;
  const w = cells[0].length;
  const nVerts = (w + 1) * (h + 1);
  const dsu = new DSU(nVerts);
  const deg = Array(nVerts).fill(0);
  let hasLoop = false;
  let filled = true;

  for (let r = 0; r < h; r++) {
    for (let c = 0; c < w; c++) {
      const ch = cells[r][c];
      if (!ch) {
        filled = false;
        continue;
      }
      let u;
      let v;
      if (ch === '\\') {
        u = vIdx(r, c, w);
        v = vIdx(r + 1, c + 1, w);
      } else {
        u = vIdx(r, c + 1, w);
        v = vIdx(r + 1, c, w);
      }
      deg[u]++;
      deg[v]++;
      if (!dsu.union(u, v)) hasLoop = true;
    }
  }

  // Only check clues that are visible
  const over = deg.map((d, i) => (clues[i] !== null && d > clues[i]));
  const exact = filled && !hasLoop && deg.every((d, i) => d === targetDeg[i]);

  return { deg, hasLoop, filled, over, exact };
}

export default function Slant() {
  const { t } = useTranslation();
  const [size, setSize] = useState({ w: 6, h: 6 });
  const [puzzle, setPuzzle] = useState(() => generatePuzzle(6, 6));
  const [cells, setCells] = useState(() => Array.from({ length: 6 }, () => Array(6).fill(null)));
  const [showSolution, setShowSolution] = useState(false);

  const { solution, clues } = puzzle;
  const targetDeg = useMemo(() => degreesFromCells(solution), [solution]);
  const a = useMemo(() => analyze(cells, targetDeg, clues), [cells, targetDeg, clues]);

  const newGame = useCallback((w = size.w, h = size.h) => {
    const newPuzzle = generatePuzzle(w, h);
    setPuzzle(newPuzzle);
    setCells(Array.from({ length: h }, () => Array(w).fill(null)));
    setShowSolution(false);
  }, [size.w, size.h]);

  const cycleCell = (r, c, dir = 'left') => {
    if (showSolution) return; // Don't allow changes when solution is shown
    setCells((prev) => {
      const next = prev.map((row) => row.slice());
      const cur = next[r][c];
      const order = dir === 'left' ? [null, '\\', '/'] : [null, '/', '\\'];
      const idx = order.indexOf(cur);
      next[r][c] = order[(idx + 1) % order.length];
      return next;
    });
  };

  const handleGiveUp = () => {
    setShowSolution(true);
    setCells(solution.map(row => row.slice()));
  };

  const w = size.w;
  const h = size.h;

  // Count how many clues are visible
  const visibleClues = clues.filter(c => c !== null).length;
  const totalClues = clues.length;

  return (
    <div className={styles.container}>
      <GameHeader
        title="Slant"
        instructions="Place a / or \\ in every cell. Vertex numbers show how many diagonals touch that vertex. Diagonals must not form any loops."
      />

      <div className={styles.toolbar}>
        <label className={styles.label}>
          Size
          <select
            className={styles.select}
            value={`${w}x${h}`}
            onChange={(e) => {
              const [nw, nh] = e.target.value.split('x').map(Number);
              setSize({ w: nw, h: nh });
              newGame(nw, nh);
            }}
          >
            <option value="5x5">5×5</option>
            <option value="6x6">6×6</option>
            <option value="7x7">7×7</option>
            <option value="8x8">8×8</option>
          </select>
        </label>
        <button className={styles.button} onClick={() => newGame(w, h)}>New</button>
        <GiveUpButton
          onGiveUp={handleGiveUp}
          disabled={showSolution || a.exact}
          variant="compact"
        />
        <div className={styles.status}>
          {showSolution ? (
            <GameResult state="gaveup" variant="inline" />
          ) : a.exact ? (
            <GameResult state="won" title="Solved!" variant="inline" actions={[]} />
          ) : a.hasLoop ? (
            <span className={styles.bad}>Loop detected</span>
          ) : (
            <span>{a.filled ? 'Check constraints' : `Clues: ${visibleClues}/${totalClues}`}</span>
          )}
        </div>
      </div>

      <div className={styles.boardWrap} onContextMenu={(e) => e.preventDefault()}>
        {/* SVG gradient definitions */}
        <svg width="0" height="0" style={{ position: 'absolute' }}>
          <defs>
            <linearGradient id="slashGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="50%" stopColor="#60a5fa" />
              <stop offset="100%" stopColor="#818cf8" />
            </linearGradient>
            <linearGradient id="slashGradientSolution" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fbbf24" />
              <stop offset="100%" stopColor="#f59e0b" />
            </linearGradient>
          </defs>
        </svg>

        {/* Cell grid with embedded vertex indicators */}
        <div
          className={styles.cellGrid}
          style={{ gridTemplateColumns: `repeat(${w}, 1fr)` }}
        >
          {cells.map((row, r) =>
            row.map((ch, c) => {
              // Get the 4 corner vertices for this cell
              const vTL = r * (w + 1) + c;
              const vTR = r * (w + 1) + c + 1;
              const vBL = (r + 1) * (w + 1) + c;
              const vBR = (r + 1) * (w + 1) + c + 1;

              return (
                <div key={`${r},${c}`} className={styles.cellWrapper}>
                  <button
                    className={`${styles.cell} ${showSolution ? styles.cellSolution : ''}`}
                    onClick={() => cycleCell(r, c, 'left')}
                    onMouseDown={(e) => {
                      if (e.button === 2) cycleCell(r, c, 'right');
                    }}
                    aria-label={`cell ${r},${c}`}
                    disabled={showSolution}
                  >
                    {ch && (
                      <svg className={styles.slashSvg} viewBox="0 0 100 100" preserveAspectRatio="none">
                        <line
                          x1={ch === '\\' ? 8 : 92}
                          y1={8}
                          x2={ch === '\\' ? 92 : 8}
                          y2={92}
                          stroke={showSolution ? 'url(#slashGradientSolution)' : 'url(#slashGradient)'}
                          strokeWidth="5"
                          strokeLinecap="round"
                        />
                      </svg>
                    )}
                  </button>

                  {/* Top-left vertex (only show on first row/col cells) */}
                  {r === 0 && c === 0 && clues[vTL] !== null && (
                    <div className={`${styles.vertex} ${styles.vertexTL} ${a.over[vTL] ? styles.vertexBad : ''}`}>
                      {clues[vTL]}
                    </div>
                  )}

                  {/* Top-right vertex (only on first row) */}
                  {r === 0 && clues[vTR] !== null && (
                    <div className={`${styles.vertex} ${styles.vertexTR} ${a.over[vTR] ? styles.vertexBad : ''}`}>
                      {clues[vTR]}
                    </div>
                  )}

                  {/* Bottom-left vertex (only on first col) */}
                  {c === 0 && clues[vBL] !== null && (
                    <div className={`${styles.vertex} ${styles.vertexBL} ${a.over[vBL] ? styles.vertexBad : ''}`}>
                      {clues[vBL]}
                    </div>
                  )}

                  {/* Bottom-right vertex (always, this is the main one) */}
                  {clues[vBR] !== null && (
                    <div className={`${styles.vertex} ${styles.vertexBR} ${a.over[vBR] ? styles.vertexBad : ''}`}>
                      {clues[vBR]}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
