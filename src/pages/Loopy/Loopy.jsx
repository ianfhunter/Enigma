import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import GameHeader from '../../components/GameHeader';
import styles from './Loopy.module.css';
import slitherlinkPuzzles from '../../../public/datasets/slitherlinkPuzzles.json';

const DIFFICULTIES = ['easy', 'medium', 'hard'];

// Get available sizes for a difficulty
function getAvailableSizes(difficulty) {
  const sizes = new Set();
  slitherlinkPuzzles.puzzles.forEach(p => {
    if (p.difficulty === difficulty) {
      sizes.add(`${p.rows}×${p.cols}`);
    }
  });
  return Array.from(sizes).sort((a, b) => {
    const [aRows] = a.split('×').map(Number);
    const [bRows] = b.split('×').map(Number);
    return aRows - bRows;
  });
}

function idxHEdge(r, c, w) {
  // horizontal edge between (r,c) and (r,c+1), r in [0..h], c in [0..w-1]
  return r * w + c;
}
function idxVEdge(r, c, w) {
  // vertical edge between (r,c) and (r+1,c), r in [0..h-1], c in [0..w]
  return r * (w + 1) + c;
}

// Convert solution (inside cells marked with 'x') to edges
function solutionToEdges(solutionRaw, w, h) {
  const hEdges = new Array((h + 1) * w).fill(0);
  const vEdges = new Array(h * (w + 1)).fill(0);

  // Parse solutionRaw into inside cells
  const inside = solutionRaw.map(rowStr => rowStr.split(' ').map(c => c === 'x'));

  // Build edges from inside cells
  for (let r = 0; r < h; r++) {
    for (let c = 0; c < w; c++) {
      if (!inside[r][c]) continue;

      // Top edge: if r=0 or cell above is outside
      if (r === 0 || !inside[r - 1][c]) {
        hEdges[idxHEdge(r, c, w)] = 1;
      }
      // Bottom edge: if r=h-1 or cell below is outside
      if (r === h - 1 || !inside[r + 1][c]) {
        hEdges[idxHEdge(r + 1, c, w)] = 1;
      }
      // Left edge: if c=0 or cell to left is outside
      if (c === 0 || !inside[r][c - 1]) {
        vEdges[idxVEdge(r, c, w)] = 1;
      }
      // Right edge: if c=w-1 or cell to right is outside
      if (c === w - 1 || !inside[r][c + 1]) {
        vEdges[idxVEdge(r, c + 1, w)] = 1;
      }
    }
  }

  return { hEdges, vEdges };
}

function analyze(w, h, clues, hEdges, vEdges) {
  const clueBad = new Set();
  for (let r = 0; r < h; r++) {
    for (let c = 0; c < w; c++) {
      const clue = clues[r * w + c];
      if (clue == null) continue;
      const topE = hEdges[idxHEdge(r, c, w)] === 1;
      const botE = hEdges[idxHEdge(r + 1, c, w)] === 1;
      const leftE = vEdges[idxVEdge(r, c, w)] === 1;
      const rightE = vEdges[idxVEdge(r, c + 1, w)] === 1;
      const count = (topE ? 1 : 0) + (botE ? 1 : 0) + (leftE ? 1 : 0) + (rightE ? 1 : 0);
      if (count !== clue) clueBad.add(r * w + c);
    }
  }

  // Build vertex degrees
  const deg = new Array((h + 1) * (w + 1)).fill(0);
  const adj = Array.from({ length: (h + 1) * (w + 1) }, () => []);
  let edgeCount = 0;

  const vtx = (r, c) => r * (w + 1) + c;

  // horizontal edges
  for (let r = 0; r <= h; r++) {
    for (let c = 0; c < w; c++) {
      if (hEdges[idxHEdge(r, c, w)] !== 1) continue;
      const a = vtx(r, c);
      const b = vtx(r, c + 1);
      deg[a]++; deg[b]++;
      adj[a].push(b); adj[b].push(a);
      edgeCount++;
    }
  }
  // vertical edges
  for (let r = 0; r < h; r++) {
    for (let c = 0; c <= w; c++) {
      if (vEdges[idxVEdge(r, c, w)] !== 1) continue;
      const a = vtx(r, c);
      const b = vtx(r + 1, c);
      deg[a]++; deg[b]++;
      adj[a].push(b); adj[b].push(a);
      edgeCount++;
    }
  }

  const active = [];
  for (let i = 0; i < deg.length; i++) if (deg[i] > 0) active.push(i);

  let loopOk = false;
  if (active.length > 0) {
    // must all have degree 2
    const degreesOk = active.every((i) => deg[i] === 2);
    if (degreesOk) {
      // connectivity
      const seen = new Set();
      const stack = [active[0]];
      seen.add(active[0]);
      while (stack.length) {
        const u = stack.pop();
        for (const v of adj[u]) {
          if (!seen.has(v)) { seen.add(v); stack.push(v); }
        }
      }
      const connected = active.every((i) => seen.has(i));
      // A single cycle implies edges == vertices in the connected subgraph
      if (connected && edgeCount === active.length) loopOk = true;
    }
  }

  const solved = clueBad.size === 0 && loopOk;
  return { clueBad, loopOk, solved };
}

// Export helpers for testing
export {
  DIFFICULTIES,
  getAvailableSizes,
  idxHEdge,
  idxVEdge,
  solutionToEdges,
  analyze,
};

export default function Loopy() {
  const [difficulty, setDifficulty] = useState('easy');
  const [availableSizes, setAvailableSizes] = useState(() => getAvailableSizes('easy'));
  const [sizeKey, setSizeKey] = useState(() => {
    const sizes = getAvailableSizes('easy');
    return sizes[0] || '10×10';
  });

  const [puz, setPuz] = useState(null);
  const [hEdges, setHEdges] = useState([]);
  const [vEdges, setVEdges] = useState([]);

  const initGame = useCallback(() => {
    // Parse size from sizeKey
    const [rows, cols] = sizeKey.split('×').map(Number);

    // Filter puzzles by difficulty and size
    const matching = slitherlinkPuzzles.puzzles.filter(p =>
      p.difficulty === difficulty && p.rows === rows && p.cols === cols
    );

    if (matching.length === 0) {
      console.error('No puzzles found for', difficulty, sizeKey);
      return;
    }

    // Pick a random puzzle
    const puzzle = matching[Math.floor(Math.random() * matching.length)];

    // Convert 2D clues array to 1D array
    const clues = [];
    for (let r = 0; r < puzzle.rows; r++) {
      for (let c = 0; c < puzzle.cols; c++) {
        clues.push(puzzle.clues[r][c]);
      }
    }

    // Convert solution to edges
    const solutionEdges = solutionToEdges(puzzle.solutionRaw, puzzle.cols, puzzle.rows);

    setPuz({
      w: puzzle.cols,
      h: puzzle.rows,
      clues,
      solution: solutionEdges
    });
    setHEdges(new Array((puzzle.rows + 1) * puzzle.cols).fill(0));
    setVEdges(new Array(puzzle.rows * (puzzle.cols + 1)).fill(0));
  }, [difficulty, sizeKey]);

  useEffect(() => {
    initGame();
  }, [initGame]);

  // Update available sizes when difficulty changes
  useEffect(() => {
    const sizes = getAvailableSizes(difficulty);
    setAvailableSizes(sizes);
    if (!sizes.includes(sizeKey)) {
      setSizeKey(sizes[0] || '10×10');
    }
  }, [difficulty]);

  const { clueBad, loopOk, solved } = useMemo(
    () => {
      if (!puz) return { clueBad: new Set(), loopOk: false, solved: false };
      return analyze(puz.w, puz.h, puz.clues, hEdges, vEdges);
    },
    [puz, hEdges, vEdges],
  );

  const cell = 44;
  const pad = 26;

  const toggleEdge = (kind, r, c, dir) => {
    if (!puz) return;
    // dir: 'on' for left click, 'off' for right click
    if (kind === 'h') {
      const i = idxHEdge(r, c, puz.w);
      setHEdges((prev) => {
        const n = prev.slice();
        const cur = n[i];
        if (dir === 'on') n[i] = cur === 1 ? 0 : 1;
        else n[i] = cur === -1 ? 0 : -1;
        return n;
      });
    } else {
      const i = idxVEdge(r, c, puz.w);
      setVEdges((prev) => {
        const n = prev.slice();
        const cur = n[i];
        if (dir === 'on') n[i] = cur === 1 ? 0 : 1;
        else n[i] = cur === -1 ? 0 : -1;
        return n;
      });
    }
  };

  const strokeFor = (v) => {
    if (v === 1) return { stroke: 'rgba(0,0,0,0.95)', strokeWidth: 6, opacity: 1 };
    if (v === -1) return { stroke: 'rgba(255,255,255,0.22)', strokeWidth: 4, opacity: 1, strokeDasharray: '6 6' };
    return { stroke: 'rgba(245, 158, 11, 0.60)', strokeWidth: 4, opacity: 1 };
  };

  if (!puz) return null;

  const svgW = pad * 2 + puz.w * cell;
  const svgH = pad * 2 + puz.h * cell;

  return (
    <div className={styles.container}>
      <GameHeader
        title="Loopy"
        instructions="Draw a single loop using some of the grid edges. Left-click an edge to include it; right-click to exclude it. The numbers in cells (here we show all of them) must match how many loop edges surround that cell."
      />

      <div className={styles.toolbar}>
        <div className={styles.group}>
          <div className={styles.difficultySelector}>
            {DIFFICULTIES.map((d) => (
              <button
                key={d}
                className={`${styles.difficultyBtn} ${difficulty === d ? styles.active : ''}`}
                onClick={() => setDifficulty(d)}
              >
                {d.charAt(0).toUpperCase() + d.slice(1)}
              </button>
            ))}
          </div>
          <div className={styles.sizeSelector}>
            {availableSizes.map((key) => (
              <button
                key={key}
                className={`${styles.sizeBtn} ${sizeKey === key ? styles.active : ''}`}
                onClick={() => setSizeKey(key)}
              >
                {key}
              </button>
            ))}
          </div>
        </div>
        <div className={styles.group}>
          <button className={styles.button} onClick={initGame}>New</button>
          <button
            className={styles.button}
            onClick={() => {
              if (puz) {
                setHEdges(puz.solution.hEdges.slice());
                setVEdges(puz.solution.vEdges.slice());
              }
            }}
          >
            Reveal
          </button>
          <button
            className={styles.button}
            onClick={() => {
              if (puz) {
                setHEdges(new Array((puz.h + 1) * puz.w).fill(0));
                setVEdges(new Array(puz.h * (puz.w + 1)).fill(0));
              }
            }}
          >
            Clear
          </button>
        </div>

        <div className={styles.status}>
          {solved ? (
            <span className={styles.win}>Solved!</span>
          ) : (
            <span className={loopOk ? '' : styles.bad}>
              {loopOk ? 'Loop OK' : 'Not a single loop yet'}
            </span>
          )}
        </div>
      </div>

      <div className={styles.svgWrap}>
        <svg width={svgW} height={svgH} viewBox={`0 0 ${svgW} ${svgH}`}>
          {/* Clues */}
          {Array.from({ length: puz.h * puz.w }, (_, i) => {
            const r = Math.floor(i / puz.w);
            const c = i % puz.w;
            const clue = puz.clues[i];
            const x = pad + c * cell + cell / 2;
            const y = pad + r * cell + cell / 2 + 6;
            const bad = clueBad.has(i);
            return (
              <text
                key={`clue-${i}`}
                x={x}
                y={y}
                textAnchor="middle"
                fontSize="18"
                fontWeight="800"
                fill={bad ? 'rgba(251,113,133,0.95)' : 'rgba(255,255,255,0.82)'}
              >
                {clue}
              </text>
            );
          })}

          {/* Edges (clickable) */}
          {/* Horizontal */}
          {Array.from({ length: (puz.h + 1) * puz.w }, (_, i) => {
            const r = Math.floor(i / puz.w);
            const c = i % puz.w;
            const x1 = pad + c * cell;
            const y1 = pad + r * cell;
            const x2 = x1 + cell;
            const y2 = y1;
            const st = strokeFor(hEdges[i]);
            return (
              <g key={`h-${i}`}>
                <line x1={x1} y1={y1} x2={x2} y2={y2} {...st} strokeLinecap="round" />
                <line
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke="transparent"
                  strokeWidth="18"
                  onClick={() => toggleEdge('h', r, c, 'on')}
                  onContextMenu={(e) => { e.preventDefault(); toggleEdge('h', r, c, 'off'); }}
                  style={{ cursor: 'pointer' }}
                />
              </g>
            );
          })}
          {/* Vertical */}
          {Array.from({ length: puz.h * (puz.w + 1) }, (_, i) => {
            const r = Math.floor(i / (puz.w + 1));
            const c = i % (puz.w + 1);
            const x1 = pad + c * cell;
            const y1 = pad + r * cell;
            const x2 = x1;
            const y2 = y1 + cell;
            const st = strokeFor(vEdges[i]);
            return (
              <g key={`v-${i}`}>
                <line x1={x1} y1={y1} x2={x2} y2={y2} {...st} strokeLinecap="round" />
                <line
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke="transparent"
                  strokeWidth="18"
                  onClick={() => toggleEdge('v', r, c, 'on')}
                  onContextMenu={(e) => { e.preventDefault(); toggleEdge('v', r, c, 'off'); }}
                  style={{ cursor: 'pointer' }}
                />
              </g>
            );
          })}

          {/* Dots */}
          {Array.from({ length: (puz.h + 1) * (puz.w + 1) }, (_, i) => {
            const r = Math.floor(i / (puz.w + 1));
            const c = i % (puz.w + 1);
            const x = pad + c * cell;
            const y = pad + r * cell;
            return <circle key={`dot-${i}`} cx={x} cy={y} r="2.3" fill="rgba(255,255,255,0.55)" />;
          })}
        </svg>
      </div>

      <div className={styles.hint}>
        Tip: right-clicking an edge marks it as “definitely not part of the loop”.
      </div>
    </div>
  );
}
