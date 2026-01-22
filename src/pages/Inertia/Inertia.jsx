import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import GameHeader from '../../components/GameHeader';
import styles from './Inertia.module.css';

// Simulate a move until the ball stops (wall/boundary) or hits stop/mine
function simulateMove(state, dr, dc, parsed) {
  const isWall = (r, c) => parsed.cells[rcToIdx(r, c, parsed.w)] === '#';
  const get = (r, c) => parsed.cells[rcToIdx(r, c, parsed.w)];

  let { r, c } = state.pos;
  const collected = new Set(state.collected);

  for (let steps = 0; steps < parsed.w * parsed.h * 4; steps++) {
    const nr = r + dr;
    const nc = c + dc;
    if (nr < 0 || nr >= parsed.h || nc < 0 || nc >= parsed.w) break;
    if (isWall(nr, nc)) break;

    r = nr; c = nc;
    const ch = get(r, c);
    if (ch === '*') collected.add(rcToIdx(r, c, parsed.w));
    if (ch === 'X') return { pos: { r, c }, collected, dead: true };
    if (ch === 'S') return { pos: { r, c }, collected, dead: false };
  }

  return { pos: { r, c }, collected, dead: false };
}

// Attempt to solve a level; returns solvable + uniqueness info
function solveLevel(parsed, requireUnique = false, maxStates = 50000) {
  if (!parsed?.start) return { solvable: false, unique: false };
  const key = (r, c, collected) => `${r},${c}:${[...collected].sort((a, b) => a - b).join('-')}`;

  const startState = { pos: parsed.start, collected: new Set(), dead: false };
  const queue = [startState];
  const seen = new Set([key(startState.pos.r, startState.pos.c, startState.collected)]);

  let solutions = 0;

  while (queue.length) {
    const state = queue.shift();
    if (state.dead) continue;
    if (state.collected.size === parsed.totalGems) {
      solutions++;
      if (!requireUnique || solutions >= 2) break;
      continue; // Do not explore beyond a solved state
    }

    for (const { dr, dc } of DIRS) {
      if (dr === 0 && dc === 0) continue;
      const next = simulateMove(state, dr, dc, parsed);
      if (!next || next.dead) continue;
      const k = key(next.pos.r, next.pos.c, next.collected);
      if (seen.has(k)) continue;
      seen.add(k);
      if (seen.size > maxStates) return { solvable: false, unique: false };
      queue.push(next);
    }
  }

  const solvable = solutions > 0;
  const unique = solutions === 1;
  return { solvable, unique };
}

// Generate a procedural level, ensuring it is solvable (and ideally unique)
function generateLevel(size, difficulty, randomFn = Math.random, requireUnique = true) {
  const w = size + 2; // Add border walls
  const h = size + 2;

  const gemCount = difficulty === 'easy' ? 2 : difficulty === 'medium' ? 4 : 6;
  const mineCount = difficulty === 'easy' ? 1 : difficulty === 'medium' ? 3 : 5;
  const stopCount = difficulty === 'easy' ? 3 : difficulty === 'medium' ? 4 : 5;
  const wallDensity = difficulty === 'easy' ? 0.1 : difficulty === 'medium' ? 0.15 : 0.2;

  for (let attempt = 0; attempt < 80; attempt++) {
    // Initialize grid with border walls
    const grid = [];
    for (let r = 0; r < h; r++) {
      let row = '';
      for (let c = 0; c < w; c++) {
        if (r === 0 || r === h - 1 || c === 0 || c === w - 1) {
          row += '#';
        } else {
          row += '.';
        }
      }
      grid.push(row.split(''));
    }

    // Add random internal walls
    const internalCells = [];
    for (let r = 1; r < h - 1; r++) {
      for (let c = 1; c < w - 1; c++) {
        internalCells.push([r, c]);
      }
    }

    // Shuffle
    for (let i = internalCells.length - 1; i > 0; i--) {
      const j = Math.floor(randomFn() * (i + 1));
      [internalCells[i], internalCells[j]] = [internalCells[j], internalCells[i]];
    }

    const wallCount = Math.floor(internalCells.length * wallDensity);
    for (let i = 0; i < wallCount; i++) {
      const [r, c] = internalCells[i];
      grid[r][c] = '#';
    }

    // Get remaining empty cells
    const emptyCells = internalCells.filter(([r, c]) => grid[r][c] === '.');
    if (emptyCells.length < gemCount + mineCount + stopCount + 2) continue;

    // Shuffle again
    for (let i = emptyCells.length - 1; i > 0; i--) {
      const j = Math.floor(randomFn() * (i + 1));
      [emptyCells[i], emptyCells[j]] = [emptyCells[j], emptyCells[i]];
    }

    let idx = 0;

    // Place start
    const [startR, startC] = emptyCells[idx++];
    grid[startR][startC] = 'O';

    // Place gems
    for (let g = 0; g < gemCount && idx < emptyCells.length; g++) {
      const [r, c] = emptyCells[idx++];
      grid[r][c] = '*';
    }

    // Place mines
    for (let m = 0; m < mineCount && idx < emptyCells.length; m++) {
      const [r, c] = emptyCells[idx++];
      grid[r][c] = 'X';
    }

    // Place stops
    for (let s = 0; s < stopCount && idx < emptyCells.length; s++) {
      const [r, c] = emptyCells[idx++];
      grid[r][c] = 'S';
    }

    const parsed = parseLevel({ grid });
    const { solvable, unique } = solveLevel(parsed, requireUnique);
    if (solvable && (!requireUnique || unique)) {
      return { name: 'Generated', grid };
    }
  }

  throw new Error('Unable to generate a solvable Inertia level after multiple attempts');
}

const SIZES = [7, 9, 11];
const DIFFICULTIES = ['easy', 'medium', 'hard'];

function parseLevel(level) {
  const h = level.grid.length;
  const w = level.grid[0].length;
  let start = null;
  const cells = [];
  let gems = 0;
  for (let r = 0; r < h; r++) {
    for (let c = 0; c < w; c++) {
      const ch = level.grid[r][c];
      if (ch === 'O') start = { r, c };
      if (ch === '*') gems++;
      cells.push(ch);
    }
  }
  return { w, h, cells, start, totalGems: gems };
}

function rcToIdx(r, c, w) {
  return r * w + c;
}
function idxToRC(i, w) {
  return { r: Math.floor(i / w), c: i % w };
}

const DIRS = [
  { dr: -1, dc: -1, label: '↖' },
  { dr: -1, dc: 0, label: '↑' },
  { dr: -1, dc: 1, label: '↗' },
  { dr: 0, dc: -1, label: '←' },
  { dr: 0, dc: 0, label: '•' },
  { dr: 0, dc: 1, label: '→' },
  { dr: 1, dc: -1, label: '↙' },
  { dr: 1, dc: 0, label: '↓' },
  { dr: 1, dc: 1, label: '↘' },
];

// Export helpers for testing
export {
  generateLevel,
  parseLevel,
  rcToIdx,
  idxToRC,
  simulateMove,
  solveLevel,
  SIZES,
  DIFFICULTIES,
  DIRS,
};

export default function Inertia() {
  const [size, setSize] = useState(9);
  const [difficulty, setDifficulty] = useState('medium');
  const [_level, setLevel] = useState(null);
  const [parsed, setParsed] = useState(null);
  const [history, setHistory] = useState([]);
  const [cursor, setCursor] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const state = history[cursor] || { pos: { r: 0, c: 0 }, collected: new Set(), dead: false };

  const generateNew = useCallback(() => {
    setLoading(true);
    setError(null);
    try {
      const newLevel = generateLevel(size, difficulty);
      setLevel(newLevel);
      const p = parseLevel(newLevel);
      setParsed(p);
      setHistory([{ pos: p.start, collected: new Set(), dead: false }]);
      setCursor(0);
    } catch (err) {
      console.error('Failed to generate Inertia level:', err);
      setError(err.message || 'Failed to generate level');
    } finally {
      setLoading(false);
    }
  }, [size, difficulty]);

  useEffect(() => {
    generateNew();
  }, [generateNew]);

  const reset = useCallback(() => {
    if (!parsed) return;
    setHistory([{ pos: parsed.start, collected: new Set(), dead: false }]);
    setCursor(0);
  }, [parsed]);

  const undo = () => setCursor((c) => Math.max(0, c - 1));
  const redo = () => setCursor((c) => Math.min(history.length - 1, c + 1));

  const { remaining, won } = useMemo(() => {
    if (!parsed) return { remaining: 0, won: false };
    const remaining = parsed.totalGems - state.collected.size;
    const won = remaining === 0 && !state.dead;
    return { remaining, won };
  }, [parsed, state.collected.size, state.dead]);

  const push = (next) => {
    setHistory((prev) => {
      const base = prev.slice(0, cursor + 1);
      base.push(next);
      return base;
    });
    setCursor((c) => c + 1);
  };

  const move = (dr, dc) => {
    if (state.dead || won || !parsed) return;
    if (dr === 0 && dc === 0) return;

    const isWall = (r, c) => parsed.cells[rcToIdx(r, c, parsed.w)] === '#';
    const get = (r, c) => parsed.cells[rcToIdx(r, c, parsed.w)];

    let { r, c } = state.pos;
    const collected = new Set(state.collected);

    for (let steps = 0; steps < parsed.w * parsed.h * 4; steps++) {
      const nr = r + dr;
      const nc = c + dc;
      if (nr < 0 || nr >= parsed.h || nc < 0 || nc >= parsed.w) break;
      if (isWall(nr, nc)) break;

      r = nr; c = nc;
      const ch = get(r, c);
      if (ch === '*') collected.add(rcToIdx(r, c, parsed.w));
      if (ch === 'X') {
        push({ pos: { r, c }, collected, dead: true });
        return;
      }
      if (ch === 'S') {
        push({ pos: { r, c }, collected, dead: false });
        return;
      }
    }

    // Stop because wall/boundary
    push({ pos: { r, c }, collected, dead: false });
  };

  const cellClass = (ch) => {
    if (ch === '#') return styles.wall;
    if (ch === 'S') return styles.stop;
    if (ch === '*') return styles.gem;
    if (ch === 'X') return styles.mine;
    return '';
  };

  return (
    <div className={styles.container}>
      <GameHeader
        title="Inertia"
        instructions="Move the ball in any of 8 directions. Once it starts moving, it keeps going until a wall stops it or it lands on a stop square (S). Collect all gems (*) and avoid mines (X)."
      />

      <div className={styles.toolbar}>
        <div className={styles.group}>
          <label>{t('common.size')}:</label>
          {SIZES.map((s) => (
            <button
              key={s}
              className={`${styles.button} ${size === s ? styles.active : ''}`}
              onClick={() => {
                setSize(s);
              }}
            >
              {s}×{s}
            </button>
          ))}
        </div>
        <div className={styles.group}>
          <label>{t('common.difficulty')}:</label>
          {DIFFICULTIES.map((d) => (
            <button
              key={d}
              className={`${styles.button} ${difficulty === d ? styles.active : ''}`}
              onClick={() => {
                setDifficulty(d);
              }}
            >
              {d.charAt(0).toUpperCase() + d.slice(1)}
            </button>
          ))}
        </div>
        <div className={styles.group}>
          <button className={styles.generateBtn} onClick={generateNew}>New Puzzle</button>
          <button className={styles.button} onClick={reset}>{t('common.reset')}</button>
          <button className={styles.button} onClick={undo} disabled={cursor === 0}>{t('common.undo')}</button>
          <button className={styles.button} onClick={redo} disabled={cursor === history.length - 1}>Redo</button>
        </div>

        <div className={styles.status}>
          {won && <span className={styles.win}>{t('gameStatus.solved')}</span>}
          {!won && state.dead && <span className={styles.dead}>Boom. (Undo to continue)</span>}
          {!won && !state.dead && <span>Gems remaining: {remaining}</span>}
        </div>
      </div>

      {loading && (
        <div className={styles.status}>{t('common.generatingPuzzle')}</div>
      )}

      {error && (
        <div className={styles.status} style={{ color: 'red' }}>
          {error}
          <button onClick={generateNew} style={{ marginLeft: '10px' }}>{t('common.retry')}</button>
        </div>
      )}

      {parsed && !loading && !error && (
        <>
          <div className={styles.grid} style={{ gridTemplateColumns: `repeat(${parsed.w}, 40px)` }}>
            {parsed.cells.map((ch, i) => {
              const { r, c } = idxToRC(i, parsed.w);
              const isBall = state.pos.r === r && state.pos.c === c;
              const isCollectedGem = state.collected.has(i);
              const show = ch === 'O' ? '.' : ch;
              const text = (show === '*' && isCollectedGem) ? '' : (show === '.' ? '' : show);
              return (
                <div
                  key={i}
                  className={[
                    styles.cell,
                    cellClass(show),
                    isBall ? styles.ball : '',
                  ].join(' ')}
                >
                  {isBall ? '●' : text}
                </div>
              );
            })}
          </div>

          <div className={styles.pad}>
            {DIRS.map((d, i) => (
              <button
                key={i}
                className={styles.dirBtn}
                onClick={() => move(d.dr, d.dc)}
                disabled={d.dr === 0 && d.dc === 0 || state.dead || won}
                title={d.label}
              >
                {d.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
