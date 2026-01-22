import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import GameHeader from '../../components/GameHeader/GameHeader';
import styles from './ColorCube.module.css';

const FACE_ORDER = /** @type {const} */ (['U', 'R', 'F', 'D', 'L', 'B']);
const FACE_OFFSETS = /** @type {const} */ ({
  U: 0,
  R: 9,
  F: 18,
  D: 27,
  L: 36,
  B: 45,
});

const FACE_COLORS = /** @type {const} */ ({
  U: '#f8fafc', // white
  D: '#facc15', // yellow
  F: '#22c55e', // green
  B: '#3b82f6', // blue
  R: '#ef4444', // red
  L: '#f97316', // orange
});

const MOVE_BUTTONS = /** @type {const} */ ([
  ['U', "U'", 'U2'],
  ['R', "R'", 'R2'],
  ['F', "F'", 'F2'],
  ['D', "D'", 'D2'],
  ['L', "L'", 'L2'],
  ['B', "B'", 'B2'],
]);

function clampInt(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function formatTime(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const tenths = Math.floor((ms % 1000) / 100);
  if (minutes <= 0) return `${seconds}.${tenths}s`;
  return `${minutes}:${String(seconds).padStart(2, '0')}.${tenths}`;
}

function parseMove(move) {
  const base = move[0];
  const suffix = move.slice(1);
  const times = suffix === '2' ? 2 : suffix === "'" ? 3 : 1;
  return { base, times };
}

function inverseMove(move) {
  if (move.endsWith('2')) return move;
  if (move.endsWith("'")) return move.slice(0, -1);
  return `${move}'`;
}

function rotY90(v) {
  return { x: v.z, y: v.y, z: -v.x };
}
function rotY_90(v) {
  return { x: -v.z, y: v.y, z: v.x };
}
function rotZ90(v) {
  return { x: -v.y, y: v.x, z: v.z };
}
function rotZ_90(v) {
  return { x: v.y, y: -v.x, z: v.z };
}
function rotX90(v) {
  return { x: v.x, y: -v.z, z: v.y };
}
function rotX_90(v) {
  return { x: v.x, y: v.z, z: -v.y };
}

function normalToFace(n) {
  if (n.y === 1) return 'U';
  if (n.y === -1) return 'D';
  if (n.z === 1) return 'F';
  if (n.z === -1) return 'B';
  if (n.x === 1) return 'R';
  return 'L';
}

function stickerToIndex(sticker) {
  const face = normalToFace(sticker.normal);
  const { x, y, z } = sticker.pos;
  let row = 0;
  let col = 0;

  switch (face) {
    case 'U':
      row = z + 1;
      col = x + 1;
      break;
    case 'D':
      row = 1 - z;
      col = x + 1;
      break;
    case 'F':
      row = 1 - y;
      col = x + 1;
      break;
    case 'B':
      row = 1 - y;
      col = 1 - x;
      break;
    case 'R':
      row = 1 - y;
      col = 1 - z;
      break;
    case 'L':
      row = 1 - y;
      col = z + 1;
      break;
    default:
      break;
  }

  row = clampInt(row, 0, 2);
  col = clampInt(col, 0, 2);
  return FACE_OFFSETS[face] + row * 3 + col;
}

function indexToSticker(index) {
  const faceIndex = Math.floor(index / 9);
  const face = FACE_ORDER[faceIndex];
  const within = index % 9;
  const row = Math.floor(within / 3);
  const col = within % 3;

  /** @type {{x:number,y:number,z:number}} */
  let pos;
  /** @type {{x:number,y:number,z:number}} */
  let normal;

  switch (face) {
    case 'F':
      pos = { x: col - 1, y: 1 - row, z: 1 };
      normal = { x: 0, y: 0, z: 1 };
      break;
    case 'B':
      pos = { x: 1 - col, y: 1 - row, z: -1 };
      normal = { x: 0, y: 0, z: -1 };
      break;
    case 'U':
      pos = { x: col - 1, y: 1, z: row - 1 };
      normal = { x: 0, y: 1, z: 0 };
      break;
    case 'D':
      pos = { x: col - 1, y: -1, z: 1 - row };
      normal = { x: 0, y: -1, z: 0 };
      break;
    case 'R':
      pos = { x: 1, y: 1 - row, z: 1 - col };
      normal = { x: 1, y: 0, z: 0 };
      break;
    case 'L':
      pos = { x: -1, y: 1 - row, z: col - 1 };
      normal = { x: -1, y: 0, z: 0 };
      break;
    default:
      pos = { x: 0, y: 0, z: 0 };
      normal = { x: 0, y: 0, z: 0 };
  }

  return {
    pos,
    normal,
    color: FACE_COLORS[face],
  };
}

function makeSolvedStickers() {
  return Array.from({ length: 54 }, (_, idx) => indexToSticker(idx));
}

function renderColorsFromStickers(stickers) {
  const colors = new Array(54);
  for (const s of stickers) {
    colors[stickerToIndex(s)] = s.color;
  }
  return colors;
}

function isSolved(colors) {
  for (const face of FACE_ORDER) {
    const off = FACE_OFFSETS[face];
    const c0 = colors[off];
    for (let i = 1; i < 9; i++) {
      if (colors[off + i] !== c0) return false;
    }
  }
  return true;
}

function applyBaseMoveOnce(stickers, base) {
  let layerSelector;
  let rot;

  switch (base) {
    case 'U':
      layerSelector = (p) => p.y === 1;
      rot = rotY90;
      break;
    case 'D':
      layerSelector = (p) => p.y === -1;
      rot = rotY_90;
      break;
    case 'F':
      layerSelector = (p) => p.z === 1;
      rot = rotZ90;
      break;
    case 'B':
      layerSelector = (p) => p.z === -1;
      rot = rotZ_90;
      break;
    case 'R':
      layerSelector = (p) => p.x === 1;
      rot = rotX90;
      break;
    case 'L':
      layerSelector = (p) => p.x === -1;
      rot = rotX_90;
      break;
    default:
      return stickers;
  }

  return stickers.map((s) => {
    if (!layerSelector(s.pos)) return s;
    return {
      ...s,
      pos: rot(s.pos),
      normal: rot(s.normal),
    };
  });
}

function applyMove(stickers, move) {
  const { base, times } = parseMove(move);
  let next = stickers;
  for (let i = 0; i < times; i++) {
    next = applyBaseMoveOnce(next, base);
  }
  return next;
}

function randomScramble(length = 25) {
  const bases = ['U', 'D', 'L', 'R', 'F', 'B'];
  const suffixes = ['', "'", '2'];
  /** @type {string[]} */
  const out = [];
  let lastBase = null;
  while (out.length < length) {
    const base = bases[Math.floor(Math.random() * bases.length)];
    if (base === lastBase) continue;
    lastBase = base;
    const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
    out.push(`${base}${suffix}`);
  }
  return out;
}

// Export helpers for testing
export {
  FACE_ORDER,
  FACE_OFFSETS,
  FACE_COLORS,
  parseMove,
  inverseMove,
  applyMove,
  randomScramble,
  makeSolvedStickers,
  renderColorsFromStickers,
  isSolved,
  stickerToIndex,
  indexToSticker,
};

function FaceGrid({ label, colors, faceClassName, stickerClassName }) {
  return (
    <div className={faceClassName} aria-label={`${label} face`}>
      {colors.map((c, i) => (
        <div
          key={i}
          className={stickerClassName}
          style={{ backgroundColor: c }}
        />
      ))}
    </div>
  );
}

export default function ColorCube() {
  const { t } = useTranslation();
  const [stickers, setStickers] = useState(() => makeSolvedStickers());
  const [moves, setMoves] = useState(0);
  const [moveHistory, setMoveHistory] = useState(() => /** @type {string[]} */ ([]));
  const [scrambleText, setScrambleText] = useState('');

  const [timerRunning, setTimerRunning] = useState(false);
  const startRef = useRef(0);
  const [elapsedMs, setElapsedMs] = useState(0);

  const colors = useMemo(() => renderColorsFromStickers(stickers), [stickers]);
  const solved = useMemo(() => isSolved(colors), [colors]);

  useEffect(() => {
    if (!timerRunning) return undefined;
    const id = window.setInterval(() => {
      setElapsedMs(Date.now() - startRef.current);
    }, 100);
    return () => window.clearInterval(id);
  }, [timerRunning]);

  useEffect(() => {
    if (solved && timerRunning) setTimerRunning(false);
  }, [solved, timerRunning]);

  const hardReset = useCallback(() => {
    setStickers(makeSolvedStickers());
    setMoves(0);
    setMoveHistory([]);
    setScrambleText('');
    setTimerRunning(false);
    startRef.current = 0;
    setElapsedMs(0);
  }, []);

  const beginTimerIfNeeded = useCallback(() => {
    if (timerRunning) return;
    startRef.current = Date.now();
    setElapsedMs(0);
    setTimerRunning(true);
  }, [timerRunning]);

  const doMove = useCallback((move) => {
    beginTimerIfNeeded();
    setStickers((prev) => applyMove(prev, move));
    setMoves((m) => m + 1);
    setMoveHistory((h) => [...h, move]);
  }, [beginTimerIfNeeded]);

  const undo = useCallback(() => {
    setMoveHistory((h) => {
      if (h.length === 0) return h;
      const last = h[h.length - 1];
      const inv = inverseMove(last);
      setStickers((prev) => applyMove(prev, inv));
      setMoves((m) => Math.max(0, m - 1));
      return h.slice(0, -1);
    });
  }, []);

  const scramble = useCallback(() => {
    const seq = randomScramble(25);
    const solvedStickers = makeSolvedStickers();
    const scrambled = seq.reduce((acc, mv) => applyMove(acc, mv), solvedStickers);
    setStickers(scrambled);
    setMoves(0);
    setMoveHistory([]);
    setScrambleText(seq.join(' '));
    startRef.current = Date.now();
    setElapsedMs(0);
    setTimerRunning(true);
  }, []);

  useEffect(() => {
    const onKeyDown = (e) => {
      const k = e.key;
      const lower = k.toLowerCase();
      const base = lower.toUpperCase();
      if (!['U', 'D', 'L', 'R', 'F', 'B'].includes(base)) return;
      e.preventDefault();
      const mv = k === base ? `${base}'` : base;
      doMove(mv);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [doMove]);

  const faceColors = useMemo(() => {
    /** @type {Record<string, string[]>} */
    const out = {};
    for (const face of FACE_ORDER) {
      const off = FACE_OFFSETS[face];
      out[face] = colors.slice(off, off + 9);
    }
    return out;
  }, [colors]);

  const [viewRot, setViewRot] = useState(() => ({ x: -28, y: 40 }));
  const dragRef = useRef({
    active: false,
    pointerId: /** @type {number|null} */ (null),
    lastX: 0,
    lastY: 0,
  });
  const [dragging, setDragging] = useState(false);

  const resetView = useCallback(() => {
    setViewRot({ x: -28, y: 40 });
  }, []);

  const onCubePointerDown = useCallback((e) => {
    // Only left mouse / primary touch
    if (e.button !== undefined && e.button !== 0) return;
    dragRef.current.active = true;
    dragRef.current.pointerId = e.pointerId ?? null;
    dragRef.current.lastX = e.clientX;
    dragRef.current.lastY = e.clientY;
    setDragging(true);
    if (e.currentTarget?.setPointerCapture && e.pointerId !== undefined) {
      e.currentTarget.setPointerCapture(e.pointerId);
    }
    e.preventDefault();
  }, []);

  const onCubePointerMove = useCallback((e) => {
    if (!dragRef.current.active) return;
    if (dragRef.current.pointerId !== null && e.pointerId !== undefined && e.pointerId !== dragRef.current.pointerId) return;

    const dx = e.clientX - dragRef.current.lastX;
    const dy = e.clientY - dragRef.current.lastY;
    dragRef.current.lastX = e.clientX;
    dragRef.current.lastY = e.clientY;

    setViewRot((r) => ({
      x: clampInt(r.x - dy * 0.35, -80, 80),
      y: r.y + dx * 0.35,
    }));
  }, []);

  const endDrag = useCallback((e) => {
    if (!dragRef.current.active) return;
    dragRef.current.active = false;
    dragRef.current.pointerId = null;
    setDragging(false);
    if (e?.currentTarget?.releasePointerCapture && e.pointerId !== undefined) {
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        // ignore
      }
    }
  }, []);

  return (
    <div className={styles.container}>
      <GameHeader
        title="3×3×3 Color Cube"
        instructions={(
          <>
            Scramble the cube, then solve it using standard moves. Drag to rotate the view. Keyboard: <strong>u d l r f b</strong> (Shift = prime).
          </>
        )}
      />

      <div className={styles.topBar}>
        <div className={styles.stat}>
          <div className={styles.statLabel}>Time</div>
          <div className={styles.statValue}>{formatTime(elapsedMs)}</div>
        </div>
        <div className={styles.stat}>
          <div className={styles.statLabel}>Moves</div>
          <div className={styles.statValue}>{moves}</div>
        </div>
        <div className={styles.actions}>
          <button className={styles.btn} onClick={scramble}>Scramble</button>
          <button className={styles.btn} onClick={undo} disabled={moveHistory.length === 0}>{t('common.undo')}</button>
          <button className={styles.btnSecondary} onClick={hardReset}>{t('common.reset')}</button>
        </div>
      </div>

      {scrambleText && (
        <div className={styles.scramble}>
          <span className={styles.scrambleLabel}>Scramble</span>
          <span className={styles.scrambleText}>{scrambleText}</span>
        </div>
      )}

      <div className={styles.main}>
        <div
          className={`${styles.cubeViewport} ${dragging ? styles.dragging : ''}`}
          onPointerDown={onCubePointerDown}
          onPointerMove={onCubePointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          onPointerLeave={endDrag}
          role="application"
          aria-label="3D cube view"
        >
          <div className={styles.cubeHud}>
            <div className={styles.cubeHint}>{t('common.dragToRotate')}</div>
            <button className={styles.cubeResetBtn} onClick={resetView} type="button">
              Reset view
            </button>
          </div>
          <div className={styles.scene}>
            <div
              className={styles.cube}
              style={{ transform: `rotateX(${viewRot.x}deg) rotateY(${viewRot.y}deg)` }}
            >
              <div className={`${styles.face3d} ${styles.faceFront}`}>
                <FaceGrid label="F" colors={faceColors.F} faceClassName={styles.faceGrid3d} stickerClassName={styles.sticker3d} />
              </div>
              <div className={`${styles.face3d} ${styles.faceBack}`}>
                <FaceGrid label="B" colors={faceColors.B} faceClassName={styles.faceGrid3d} stickerClassName={styles.sticker3d} />
              </div>
              <div className={`${styles.face3d} ${styles.faceRight}`}>
                <FaceGrid label="R" colors={faceColors.R} faceClassName={styles.faceGrid3d} stickerClassName={styles.sticker3d} />
              </div>
              <div className={`${styles.face3d} ${styles.faceLeft}`}>
                <FaceGrid label="L" colors={faceColors.L} faceClassName={styles.faceGrid3d} stickerClassName={styles.sticker3d} />
              </div>
              <div className={`${styles.face3d} ${styles.faceUp}`}>
                <FaceGrid label="U" colors={faceColors.U} faceClassName={styles.faceGrid3d} stickerClassName={styles.sticker3d} />
              </div>
              <div className={`${styles.face3d} ${styles.faceDown}`}>
                <FaceGrid label="D" colors={faceColors.D} faceClassName={styles.faceGrid3d} stickerClassName={styles.sticker3d} />
              </div>
            </div>
          </div>
        </div>

        <div className={styles.controls}>
          <div className={styles.controlsTitle}>Moves</div>
          {MOVE_BUTTONS.map((row) => (
            <div key={row[0]} className={styles.moveRow}>
              {row.map((mv) => (
                <button key={mv} className={styles.moveBtn} onClick={() => doMove(mv)}>
                  {mv}
                </button>
              ))}
            </div>
          ))}

          {solved && (
            <div className={styles.solvedBanner} role="status">
              Solved{moves ? ` in ${moves} moves` : ''}{elapsedMs ? ` · ${formatTime(elapsedMs)}` : ''}!
            </div>
          )}

          <div className={styles.hint}>
            Tip: try a beginner sequence like <code>R U R&apos; U&apos;</code> to start learning algorithms.
          </div>
        </div>
      </div>
    </div>
  );
}
