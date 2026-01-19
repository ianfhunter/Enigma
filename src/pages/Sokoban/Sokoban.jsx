import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import GameHeader from '../../components/GameHeader';
import { usePersistedState } from '../../hooks/usePersistedState';
import styles from './Sokoban.module.css';

const GRID_SIZE = 10;

const PACKS = [
  {
    id: 'medium_valid_000',
    label: 'Medium (valid/000) — 1000 levels',
    path: '/datasets/boxoban/medium_valid_000.txt',
    difficulty: 'Medium',
  },
  {
    id: 'hard_000',
    label: 'Hard (000) — 1000 levels',
    path: '/datasets/boxoban/hard_000.txt',
    difficulty: 'Hard',
  },
  {
    id: 'unfiltered_test_000',
    label: 'Unfiltered (test/000) — 1000 levels',
    path: '/datasets/boxoban/unfiltered_test_000.txt',
    difficulty: 'Unfiltered',
  },
];

function keyOf(r, c) {
  return `${r},${c}`;
}

function parseBoxobanText(text) {
  // Format:
  // ; N
  // 10 lines of 10 chars
  // blank line
  const lines = text.replace(/\r\n/g, '\n').split('\n');
  const levels = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    if (!line || !line.startsWith(';')) {
      i++;
      continue;
    }

    const header = line;
    const idxMatch = header.match(/;\s*(\d+)/);
    const levelNumber = idxMatch ? Number(idxMatch[1]) : levels.length;

    const grid = [];
    for (let row = 0; row < GRID_SIZE; row++) {
      const raw = lines[i + 1 + row] ?? '';
      // Preserve spaces; enforce width.
      const padded = (raw + ' '.repeat(GRID_SIZE)).slice(0, GRID_SIZE);
      grid.push(padded);
    }

    levels.push({ levelNumber, grid });
    i = i + 1 + GRID_SIZE;
  }

  return levels;
}

function buildLevelState(grid) {
  const walls = new Set();
  const targets = new Set();
  const boxes = new Set();
  let player = null;

  for (let r = 0; r < GRID_SIZE; r++) {
    const row = grid[r] ?? ' '.repeat(GRID_SIZE);
    for (let c = 0; c < GRID_SIZE; c++) {
      const ch = row[c] ?? ' ';
      const k = keyOf(r, c);
      if (ch === '#') walls.add(k);
      if (ch === '.') targets.add(k);
      if (ch === '$') boxes.add(k);
      if (ch === '@') player = { r, c };
      // (Boxoban files don't use '+', '*', etc. but we support them anyway.)
      if (ch === '*') {
        boxes.add(k);
        targets.add(k);
      }
      if (ch === '+') {
        player = { r, c };
        targets.add(k);
      }
    }
  }

  if (!player) {
    // Fallback: place player on first non-wall cell (should never happen in Boxoban).
    outer: for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        const k = keyOf(r, c);
        if (!walls.has(k)) {
          player = { r, c };
          break outer;
        }
      }
    }
  }

  return {
    walls,
    targets,
    boxes,
    player,
    moves: 0,
    pushes: 0,
  };
}

function isSolved(targets, boxes) {
  for (const t of targets) {
    if (!boxes.has(t)) return false;
  }
  return targets.size > 0;
}

// Export helpers for testing
export {
  GRID_SIZE,
  PACKS,
  keyOf,
  parseBoxobanText,
  buildLevelState,
  isSolved,
};

export default function Sokoban() {
  const boardRef = useRef(null);

  const [packId, setPackId] = usePersistedState('sokoban.packId', PACKS[0].id);
  const [levels, setLevels] = useState([]);
  const [levelIndex, setLevelIndex] = usePersistedState('sokoban.levelIndex', 0);

  const [status, setStatus] = useState({ type: 'idle' }); // idle | loading | ready | error
  const [history, setHistory] = useState([]);
  const [state, setState] = useState(null);

  const pack = useMemo(() => PACKS.find(p => p.id === packId) || PACKS[0], [packId]);

  const loadPack = useCallback(async (p) => {
    setStatus({ type: 'loading' });
    try {
      const res = await fetch(p.path, { cache: 'force-cache' });
      if (!res.ok) throw new Error(`Failed to fetch pack (${res.status})`);
      const text = await res.text();
      const parsed = parseBoxobanText(text);
      if (!parsed.length) throw new Error('No levels found in pack');
      setLevels(parsed);
      setStatus({ type: 'ready' });
    } catch (e) {
      setLevels([]);
      setStatus({ type: 'error', message: e instanceof Error ? e.message : String(e) });
    }
  }, []);

  useEffect(() => {
    loadPack(pack);
  }, [packId, pack, loadPack]);

  // Clamp level index when pack changes.
  useEffect(() => {
    if (!levels.length) return;
    setLevelIndex((idx) => {
      const clamped = Math.max(0, Math.min(idx, levels.length - 1));
      return clamped;
    });
  }, [levels]);

  useEffect(() => {
    if (!levels.length) return;
    const lvl = levels[levelIndex];
    setHistory([]);
    setState(buildLevelState(lvl.grid));
  }, [levels, levelIndex]);

  const solved = useMemo(() => {
    if (!state) return false;
    return isSolved(state.targets, state.boxes);
  }, [state]);

  const resetLevel = useCallback(() => {
    if (!levels.length) return;
    const lvl = levels[levelIndex];
    setHistory([]);
    setState(buildLevelState(lvl.grid));
  }, [levels, levelIndex]);

  const undo = useCallback(() => {
    setHistory((h) => {
      if (!h.length) return h;
      const prev = h[h.length - 1];
      setState(prev);
      return h.slice(0, -1);
    });
  }, []);

  const tryMove = useCallback((dr, dc) => {
    setState((s) => {
      if (!s) return s;
      if (isSolved(s.targets, s.boxes)) return s;

      const from = s.player;
      const to = { r: from.r + dr, c: from.c + dc };
      const toKey = keyOf(to.r, to.c);
      if (s.walls.has(toKey)) return s;

      const boxes2 = new Set(s.boxes);
      let pushes = 0;

      if (boxes2.has(toKey)) {
        const beyond = { r: to.r + dr, c: to.c + dc };
        const beyondKey = keyOf(beyond.r, beyond.c);
        if (s.walls.has(beyondKey) || boxes2.has(beyondKey)) return s;
        boxes2.delete(toKey);
        boxes2.add(beyondKey);
        pushes = 1;
      }

      const next = {
        ...s,
        boxes: boxes2,
        player: to,
        moves: s.moves + 1,
        pushes: s.pushes + pushes,
      };

      setHistory((h) => [...h, s]);
      return next;
    });
  }, []);

  const goPrev = useCallback(() => setLevelIndex(i => Math.max(0, i - 1)), []);
  const goNext = useCallback(
    () => setLevelIndex(i => (levels.length ? Math.min(levels.length - 1, i + 1) : i)),
    [levels.length]
  );

  useEffect(() => {
    const onKeyDown = (e) => {
      const k = e.key;

      if (k === 'ArrowUp' || k === 'ArrowDown' || k === 'ArrowLeft' || k === 'ArrowRight') {
        e.preventDefault();
      }

      if (k === 'ArrowUp' || k === 'w' || k === 'W') return tryMove(-1, 0);
      if (k === 'ArrowDown' || k === 's' || k === 'S') return tryMove(1, 0);
      if (k === 'ArrowLeft' || k === 'a' || k === 'A') return tryMove(0, -1);
      if (k === 'ArrowRight' || k === 'd' || k === 'D') return tryMove(0, 1);

      if (k === 'r' || k === 'R') return resetLevel();
      if (k === 'u' || k === 'U' || ((k === 'z' || k === 'Z') && (e.ctrlKey || e.metaKey))) return undo();
      if (k === 'n' || k === 'N') return goNext();
      if (k === 'p' || k === 'P') return goPrev();

      return undefined;
    };

    window.addEventListener('keydown', onKeyDown, { passive: false });
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [goNext, goPrev, resetLevel, tryMove, undo]);

  // Focus board on mount so arrow keys feel immediate.
  useEffect(() => {
    boardRef.current?.focus?.();
  }, []);

  const levelLabel = useMemo(() => {
    if (!levels.length) return '';
    const n = levels[levelIndex]?.levelNumber ?? levelIndex;
    return `${pack.difficulty} #${n}`;
  }, [levels, levelIndex, pack.difficulty]);

  const instructions = (
    <>
      Move with <span className={styles.pill}>WASD</span> / <span className={styles.pill}>Arrow Keys</span>. Undo{' '}
      <span className={styles.pill}>U</span>, reset <span className={styles.pill}>R</span>, prev/next{' '}
      <span className={styles.pill}>P</span>/<span className={styles.pill}>N</span>.
    </>
  );

  return (
    <div className={styles.page}>
      <GameHeader title="Sokoban" instructions={instructions}>
        <div className={styles.subHeader}>
          <div className={styles.packRow}>
            <label className={styles.label}>
              Pack
              <select
                className={styles.select}
                value={packId}
                onChange={(e) => setPackId(e.target.value)}
                aria-label="Select Boxoban level pack"
              >
                {PACKS.map(p => (
                  <option key={p.id} value={p.id}>{p.label}</option>
                ))}
              </select>
            </label>

            <div className={styles.meta}>
              <span className={styles.badge}>{levelLabel}</span>
              {state && <span className={styles.badge}>Moves: {state.moves}</span>}
              {state && <span className={styles.badge}>Pushes: {state.pushes}</span>}
              {levels.length > 0 && <span className={styles.badge}>Level {levelIndex + 1}/{levels.length}</span>}
              {solved && <span className={`${styles.badge} ${styles.solved}`}>Solved</span>}
            </div>
          </div>
        </div>
      </GameHeader>

      <div className={styles.main}>
        <div className={styles.controls}>
          <button className={styles.button} onClick={goPrev} disabled={!levels.length || levelIndex === 0}>
            Prev
          </button>
          <button className={styles.button} onClick={goNext} disabled={!levels.length || levelIndex >= levels.length - 1}>
            Next
          </button>
          <button className={styles.button} onClick={resetLevel} disabled={!levels.length || !state}>
            Reset
          </button>
          <button className={styles.button} onClick={undo} disabled={!history.length || !state}>
            Undo
          </button>
        </div>

        <div className={styles.boardWrap}>
          {status.type === 'loading' && (
            <div className={styles.notice}>Loading levels…</div>
          )}
          {status.type === 'error' && (
            <div className={styles.noticeError}>
              Failed to load pack: {status.message}
            </div>
          )}

          {state && (
            <div
              ref={boardRef}
              className={styles.board}
              tabIndex={0}
              role="application"
              aria-label="Sokoban board"
            >
              {Array.from({ length: GRID_SIZE * GRID_SIZE }, (_, idx) => {
                const r = Math.floor(idx / GRID_SIZE);
                const c = idx % GRID_SIZE;
                const k = keyOf(r, c);

                const isWall = state.walls.has(k);
                const isTarget = state.targets.has(k);
                const hasBox = state.boxes.has(k);
                const isPlayer = state.player.r === r && state.player.c === c;

                const classes = [styles.cell];
                if (isWall) classes.push(styles.wall);
                else classes.push(styles.floor);
                if (isTarget) classes.push(styles.target);
                if (hasBox) classes.push(isTarget ? styles.boxOnTarget : styles.box);
                if (isPlayer) classes.push(isTarget ? styles.playerOnTarget : styles.player);

                let content = null;
                if (isPlayer) content = <span className={styles.playerGlyph} aria-hidden="true">🙂</span>;
                else if (hasBox) content = <span className={styles.boxGlyph} aria-hidden="true">📦</span>;
                else if (isTarget) content = <span className={styles.targetGlyph} aria-hidden="true">•</span>;

                return (
                  <div key={k} className={classes.join(' ')}>
                    {content}
                  </div>
                );
              })}
            </div>
          )}

          {/* Mobile D-Pad Controls */}
          <div className={styles.dpad}>
            <button
              className={`${styles.dpadBtn} ${styles.dpadUp}`}
              onClick={() => tryMove(-1, 0)}
              aria-label="Move up"
            >
              ▲
            </button>
            <div className={styles.dpadMiddle}>
              <button
                className={`${styles.dpadBtn} ${styles.dpadLeft}`}
                onClick={() => tryMove(0, -1)}
                aria-label="Move left"
              >
                ◀
              </button>
              <div className={styles.dpadCenter} />
              <button
                className={`${styles.dpadBtn} ${styles.dpadRight}`}
                onClick={() => tryMove(0, 1)}
                aria-label="Move right"
              >
                ▶
              </button>
            </div>
            <button
              className={`${styles.dpadBtn} ${styles.dpadDown}`}
              onClick={() => tryMove(1, 0)}
              aria-label="Move down"
            >
              ▼
            </button>
          </div>

          <div className={styles.attribution}>
            Levels from DeepMind’s Boxoban dataset (`google-deepmind/boxoban-levels`, Apache 2.0). See{' '}
            <a className={styles.link} href="/datasets/boxoban/BOXOBAN_README.md">dataset README</a> and{' '}
            <a className={styles.link} href="/datasets/boxoban/LICENSE.txt">license</a>.
          </div>
        </div>
      </div>
    </div>
  );
}
