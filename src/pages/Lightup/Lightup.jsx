import { useCallback, useMemo, useState, useEffect } from 'react';
import GameHeader from '../../components/GameHeader';
import DifficultySelector from '../../components/DifficultySelector';
import SizeSelector from '../../components/SizeSelector';
import GiveUpButton from '../../components/GiveUpButton';
import GameResult from '../../components/GameResult';
import styles from './Lightup.module.css';
import akariPuzzles from '../../../public/datasets/akariPuzzles.json';

// Cell types:
// - null or '.' empty
// - 'x' or '#' black wall
// - 0-4 or '0'-'4' numbered black

function idx(r, c, w) {
  return r * w + c;
}

function inBounds(r, c, w, h) {
  return r >= 0 && r < h && c >= 0 && c < w;
}

function isWall(ch) {
  if (ch === '#' || ch === 'x') return true;
  if (typeof ch === 'number' && ch >= 0 && ch <= 4) return true;
  if (typeof ch === 'string' && ch >= '0' && ch <= '4') return true;
  return false;
}

function isNumberedWall(ch) {
  if (typeof ch === 'number' && ch >= 0 && ch <= 4) return true;
  if (typeof ch === 'string' && ch >= '0' && ch <= '4') return true;
  return false;
}

function getWallNumber(ch) {
  if (typeof ch === 'number') return ch;
  if (typeof ch === 'string' && ch >= '0' && ch <= '4') return Number(ch);
  return null;
}

const DIFFICULTIES = ['easy', 'medium', 'hard'];

// Get available sizes from dataset for a given difficulty
function getAvailableSizes(difficulty) {
  const sizes = new Set();
  akariPuzzles.puzzles.forEach(p => {
    if (p.difficulty === difficulty) {
      sizes.add(`${p.rows}x${p.cols}`);
    }
  });
  return Array.from(sizes).sort((a, b) => {
    const [ar, ac] = a.split('x').map(Number);
    const [br, bc] = b.split('x').map(Number);
    return (ar * ac) - (br * bc);
  }).slice(0, 8); // Limit to 8 sizes for UI
}

function parseDatasetPuzzle(puzzle) {
  const { rows, cols, clues, solution } = puzzle;
  const cells = [];
  const solutionBulbs = new Set();

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const clue = clues[r][c];
      cells.push(clue);

      // In the dataset, solution has `false` where bulbs should be placed
      if (solution && solution[r] && solution[r][c] === false) {
        solutionBulbs.add(idx(r, c, cols));
      }
    }
  }

  return { w: cols, h: rows, cells, solutionBulbs };
}

// Convert solution (inside cells marked with 'x') to loop edges
function solutionToEdges(solutionRaw, w, h) {
  const hEdges = new Array((h + 1) * w).fill(0);
  const vEdges = new Array(h * (w + 1)).fill(0);

  const inside = solutionRaw.map(rowStr => rowStr.split(' ').map(c => c === 'x'));

  for (let r = 0; r < h; r++) {
    for (let c = 0; c < w; c++) {
      if (!inside[r][c]) continue;

      if (r === 0 || !inside[r - 1][c]) hEdges[idx(r, c, w)] = 1;
      if (r === h - 1 || !inside[r + 1][c]) hEdges[idx(r + 1, c, w)] = 1;
      if (c === 0 || !inside[r][c - 1]) vEdges[idx(r, c, w + 1)] = 1;
      if (c === w - 1 || !inside[r][c + 1]) vEdges[idx(r, c + 1, w + 1)] = 1;
    }
  }

  return { hEdges, vEdges };
}

// Analyze loop validity and clue satisfaction (borrowed from Slitherlink rules)
function analyze(w, h, clues, hEdges, vEdges) {
  const idxHEdge = (r, c) => idx(r, c, w);
  const idxVEdge = (r, c) => idx(r, c, w + 1);
  const clueBad = new Set();

  for (let r = 0; r < h; r++) {
    for (let c = 0; c < w; c++) {
      const clue = clues[r * w + c];
      if (clue == null) continue;
      const topE = hEdges[idxHEdge(r, c)] === 1;
      const botE = hEdges[idxHEdge(r + 1, c)] === 1;
      const leftE = vEdges[idxVEdge(r, c)] === 1;
      const rightE = vEdges[idxVEdge(r, c + 1)] === 1;
      const count = (topE ? 1 : 0) + (botE ? 1 : 0) + (leftE ? 1 : 0) + (rightE ? 1 : 0);
      if (count !== clue) clueBad.add(r * w + c);
    }
  }

  const deg = new Array((h + 1) * (w + 1)).fill(0);
  const adj = Array.from({ length: (h + 1) * (w + 1) }, () => []);
  let edgeCount = 0;
  const vtx = (r, c) => r * (w + 1) + c;

  for (let r = 0; r <= h; r++) {
    for (let c = 0; c < w; c++) {
      if (hEdges[idxHEdge(r, c)] !== 1) continue;
      const a = vtx(r, c);
      const b = vtx(r, c + 1);
      deg[a]++; deg[b]++;
      adj[a].push(b); adj[b].push(a);
      edgeCount++;
    }
  }
  for (let r = 0; r < h; r++) {
    for (let c = 0; c <= w; c++) {
      if (vEdges[idxVEdge(r, c)] !== 1) continue;
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
    const degreesOk = active.every((i) => deg[i] === 2);
    if (degreesOk) {
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
      if (connected && edgeCount === active.length) loopOk = true;
    }
  }

  const solved = clueBad.size === 0 && loopOk;
  return { clueBad, loopOk, solved };
}

// Export helpers for testing
export {
  idx,
  inBounds,
  isWall,
  isNumberedWall,
  getWallNumber,
  DIFFICULTIES,
  getAvailableSizes,
  parseDatasetPuzzle,
  solutionToEdges,
  analyze,
};

export default function Lightup() {
  const [difficulty, setDifficulty] = useState('medium');
  const [sizeKey, setSizeKey] = useState('10x10');
  const [base, setBase] = useState({ w: 0, h: 0, cells: [], solutionBulbs: new Set() });
  const [bulbs, setBulbs] = useState(() => new Set());
  const [marks, setMarks] = useState(() => new Set());
  const [markMode, setMarkMode] = useState(false); // Mobile mark mode
  const [gameState, setGameState] = useState('playing');

  const availableSizes = useMemo(() => getAvailableSizes(difficulty), [difficulty]);

  // Update sizeKey when difficulty changes if current size not available
  useEffect(() => {
    if (availableSizes.length > 0 && !availableSizes.includes(sizeKey)) {
      setSizeKey(availableSizes[0]);
    }
  }, [availableSizes, sizeKey]);

  const loadPuzzle = useCallback(() => {
    const filtered = akariPuzzles.puzzles.filter(
      p => p.difficulty === difficulty && `${p.rows}x${p.cols}` === sizeKey
    );

    if (filtered.length === 0) {
      // Fallback to any puzzle of this difficulty
      const fallback = akariPuzzles.puzzles.filter(p => p.difficulty === difficulty);
      if (fallback.length > 0) {
        const puzzle = fallback[Math.floor(Math.random() * fallback.length)];
        setBase(parseDatasetPuzzle(puzzle));
      }
    } else {
      const puzzle = filtered[Math.floor(Math.random() * filtered.length)];
      setBase(parseDatasetPuzzle(puzzle));
    }

    setBulbs(new Set());
    setMarks(new Set());
    setGameState('playing');
  }, [difficulty, sizeKey]);

  useEffect(() => {
    loadPuzzle();
  }, [loadPuzzle]);

  const reset = () => {
    setBulbs(new Set());
    setMarks(new Set());
    setGameState('playing');
  };

  const handleGiveUp = () => {
    if (base.solutionBulbs.size > 0) {
      setBulbs(new Set(base.solutionBulbs));
      setGameState('gaveUp');
    }
  };

  const lit = useMemo(() => {
    const out = new Set();
    for (const b of bulbs) {
      out.add(b);
      const r0 = Math.floor(b / base.w);
      const c0 = b % base.w;
      for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        let r = r0 + dr;
        let c = c0 + dc;
        while (inBounds(r, c, base.w, base.h)) {
          const i = idx(r, c, base.w);
          const ch = base.cells[i];
          if (isWall(ch)) break;
          out.add(i);
          r += dr;
          c += dc;
        }
      }
    }
    return out;
  }, [base.cells, base.h, base.w, bulbs]);

  const bulbConflicts = useMemo(() => {
    const bad = new Set();
    for (const b of bulbs) {
      const r0 = Math.floor(b / base.w);
      const c0 = b % base.w;
      for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        let r = r0 + dr;
        let c = c0 + dc;
        while (inBounds(r, c, base.w, base.h)) {
          const i = idx(r, c, base.w);
          const ch = base.cells[i];
          if (isWall(ch)) break;
          if (bulbs.has(i)) {
            bad.add(b);
            bad.add(i);
          }
          r += dr;
          c += dc;
        }
      }
    }
    return bad;
  }, [base.cells, base.h, base.w, bulbs]);

  const numberedErrors = useMemo(() => {
    const bad = new Set();
    for (let i = 0; i < base.cells.length; i++) {
      const ch = base.cells[i];
      if (!isNumberedWall(ch)) continue;
      const target = getWallNumber(ch);
      const r0 = Math.floor(i / base.w);
      const c0 = i % base.w;
      let count = 0;
      let possible = 0;
      for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const r = r0 + dr;
        const c = c0 + dc;
        if (!inBounds(r, c, base.w, base.h)) continue;
        const j = idx(r, c, base.w);
        if (isWall(base.cells[j])) continue;
        possible++;
        if (bulbs.has(j)) count++;
      }
      if (count > target || count + (possible - count) < target) bad.add(i);
      if (count !== target) bad.add(i);
    }
    return bad;
  }, [base, bulbs]);

  const allLit = useMemo(() => {
    for (let i = 0; i < base.cells.length; i++) {
      if (isWall(base.cells[i])) continue;
      if (!lit.has(i)) return false;
    }
    return true;
  }, [base.cells, lit]);

  const solved = allLit && bulbConflicts.size === 0 && numberedErrors.size === 0;

  // Update game state when solved
  useEffect(() => {
    if (solved && gameState === 'playing') {
      setGameState('won');
    }
  }, [solved, gameState]);

  const toggleBulb = (i) => {
    if (isWall(base.cells[i])) return;
    if (marks.has(i)) return;
    setBulbs((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  };

  const toggleMark = (i) => {
    if (isWall(base.cells[i])) return;
    if (bulbs.has(i)) return;
    setMarks((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  };

  return (
    <div className={styles.container}>
      <GameHeader
        title="Light Up"
        instructions="Place bulbs to light all non-black squares. Bulbs must not see each other. Numbered black squares require exactly that many adjacent bulbs."
      />

      <div className={styles.toolbar}>
        <DifficultySelector
          difficulties={DIFFICULTIES}
          selected={difficulty}
          onSelect={setDifficulty}
        />
        <SizeSelector
          sizes={availableSizes}
          selected={sizeKey}
          onSelect={setSizeKey}
        />
        <div className={styles.actions}>
          <button className={styles.generateBtn} onClick={loadPuzzle}>New Puzzle</button>
          <button className={styles.button} onClick={reset}>Clear</button>
          <GiveUpButton
            onGiveUp={handleGiveUp}
            disabled={gameState !== 'playing'}
          />
        </div>
        <GameResult
          show={gameState === 'won'}
          type="won"
          title="🎉 Solved!"
          inline
        />
        <GameResult
          show={gameState === 'gaveUp'}
          type="gaveUp"
          title="Solution Revealed"
          inline
        />
        {gameState === 'playing' && (
          <div className={styles.status}>
            <span>Conflicts: {bulbConflicts.size} • Unlit: {allLit ? 0 : 'some'}</span>
          </div>
        )}

        {/* Mobile Mark Toggle */}
        <button
          className={`${styles.markToggle} ${markMode ? styles.markModeActive : ''}`}
          onClick={() => setMarkMode(!markMode)}
        >
          ✖ {markMode ? 'Mark Mode ON' : 'Mark Mode'}
        </button>
      </div>

      {base.w > 0 && (
        <div
          className={styles.grid}
          style={{ gridTemplateColumns: `repeat(${base.w}, 1fr)` }}
          onContextMenu={(e) => e.preventDefault()}
        >
          {base.cells.map((ch, i) => {
            const wall = isWall(ch);
            const numbered = isNumberedWall(ch);
            const isLit = lit.has(i);
            const hasBulb = bulbs.has(i);
            const hasMark = marks.has(i);
            const conflict = bulbConflicts.has(i);
            const numBad = numberedErrors.has(i);
            return (
              <button
                key={i}
                className={[
                  styles.cell,
                  wall ? styles.wall : styles.floor,
                  isLit ? styles.lit : '',
                  hasBulb ? styles.bulb : '',
                  conflict ? styles.bad : '',
                  hasMark ? styles.mark : '',
                  numBad ? styles.bad : '',
                ].join(' ')}
                onClick={() => {
                  if (wall || gameState !== 'playing') return;
                  if (markMode) {
                    toggleMark(i);
                  } else {
                    toggleBulb(i);
                  }
                }}
                onMouseDown={(e) => {
                  if (e.button === 2 && gameState === 'playing') toggleMark(i);
                }}
                aria-label={`cell ${i}`}
              >
                {wall && numbered ? <span className={styles.num}>{getWallNumber(ch)}</span> : null}
                {!wall && hasBulb ? <span className={styles.icon}>💡</span> : null}
                {!wall && !hasBulb && hasMark ? <span className={styles.icon}>✖</span> : null}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
