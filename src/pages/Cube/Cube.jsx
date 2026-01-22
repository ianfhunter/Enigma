import { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import GameHeader from '../../components/GameHeader';
import styles from './Cube.module.css';

// Faces: U, D, N, S, W, E (relative to screen)
function roll(ori, dir) {
  const { U, D, N, S, W, E } = ori;
  if (dir === 'up') return { U: S, D: N, N: U, S: D, W, E };
  if (dir === 'down') return { U: N, D: S, N: D, S: U, W, E };
  if (dir === 'left') return { U: E, D: W, N, S, W: U, E: D };
  return { U: W, D: E, N, S, W: D, E: U }; // right
}

// 3D Cube component with CSS transforms
function Cube3D({ ori, lastMove }) {
  const [rotation, setRotation] = useState({ x: -25, y: 35 });

  useEffect(() => {
    if (!lastMove) return;
    const { dir } = lastMove;
    setRotation(prev => {
      if (dir === 'up') return { ...prev, x: prev.x - 90 };
      if (dir === 'down') return { ...prev, x: prev.x + 90 };
      if (dir === 'left') return { ...prev, y: prev.y + 90 };
      if (dir === 'right') return { ...prev, y: prev.y - 90 };
      return prev;
    });
  }, [lastMove]);

  return (
    <div className={styles.cube3dContainer}>
      <div className={styles.cube3dScene}>
        <div
          className={styles.cube3d}
          style={{ transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)` }}
        >
          <div className={`${styles.cube3dFace} ${styles.cube3dFront} ${ori.S ? styles.facePainted : ''}`}>
            <span>S</span>
          </div>
          <div className={`${styles.cube3dFace} ${styles.cube3dBack} ${ori.N ? styles.facePainted : ''}`}>
            <span>N</span>
          </div>
          <div className={`${styles.cube3dFace} ${styles.cube3dRight} ${ori.E ? styles.facePainted : ''}`}>
            <span>E</span>
          </div>
          <div className={`${styles.cube3dFace} ${styles.cube3dLeft} ${ori.W ? styles.facePainted : ''}`}>
            <span>W</span>
          </div>
          <div className={`${styles.cube3dFace} ${styles.cube3dTop} ${ori.U ? styles.facePainted : ''}`}>
            <span>U</span>
          </div>
          <div className={`${styles.cube3dFace} ${styles.cube3dBottom} ${ori.D ? styles.facePainted : ''}`}>
            <span>D</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Unfolded cube net showing all faces
function CubeNet({ ori }) {
  return (
    <div className={styles.cubeNet}>
      <div className={styles.netRow}>
        <div className={styles.netEmpty} />
        <div className={`${styles.netFace} ${ori.U ? styles.netPainted : ''}`}>
          <span>U</span>
        </div>
        <div className={styles.netEmpty} />
        <div className={styles.netEmpty} />
      </div>
      <div className={styles.netRow}>
        <div className={`${styles.netFace} ${ori.W ? styles.netPainted : ''}`}>
          <span>W</span>
        </div>
        <div className={`${styles.netFace} ${ori.S ? styles.netPainted : ''}`}>
          <span>S</span>
        </div>
        <div className={`${styles.netFace} ${ori.E ? styles.netPainted : ''}`}>
          <span>E</span>
        </div>
        <div className={`${styles.netFace} ${ori.N ? styles.netPainted : ''}`}>
          <span>N</span>
        </div>
      </div>
      <div className={styles.netRow}>
        <div className={styles.netEmpty} />
        <div className={`${styles.netFace} ${ori.D ? styles.netPainted : ''}`}>
          <span>D</span>
        </div>
        <div className={styles.netEmpty} />
        <div className={styles.netEmpty} />
      </div>
    </div>
  );
}

function makeGridBlues() {
  const idxs = Array.from({ length: 16 }, (_, i) => i);
  for (let i = idxs.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [idxs[i], idxs[j]] = [idxs[j], idxs[i]];
  }
  const blues = new Set(idxs.slice(0, 6));
  return blues;
}

export default function CubeGame() {
  const [blueSquares, setBlueSquares] = useState(() => makeGridBlues());
  const [pos, setPos] = useState(() => Math.floor(Math.random() * 16));
  const [ori, setOri] = useState(() => ({ U: false, D: false, N: false, S: false, W: false, E: false }));
  const [moves, setMoves] = useState(0);
  const [lastMove, setLastMove] = useState(null);
  const moveCounter = useRef(0);

  const blueFaces = useMemo(() => Object.values(ori).filter(Boolean).length, [ori]);
  const solved = blueFaces === 6;

  const newGame = useCallback(() => {
    setBlueSquares(makeGridBlues());
    setPos(Math.floor(Math.random() * 16));
    setOri({ U: false, D: false, N: false, S: false, W: false, E: false });
    setMoves(0);
    setLastMove(null);
    moveCounter.current = 0;
  }, []);

  const tryMove = useCallback((dir) => {
    if (solved) return;
    const r = Math.floor(pos / 4);
    const c = pos % 4;
    let nr = r;
    let nc = c;
    if (dir === 'up') nr--;
    if (dir === 'down') nr++;
    if (dir === 'left') nc--;
    if (dir === 'right') nc++;
    if (nr < 0 || nr >= 4 || nc < 0 || nc >= 4) return;
    const npos = nr * 4 + nc;

    // roll orientation
    const nextOri = roll(ori, dir);

    // swap bottom face colour with destination square colour
    const destBlue = blueSquares.has(npos);
    const bottomBlue = nextOri.D;
    const swappedOri = { ...nextOri, D: destBlue };
    const nextSquares = new Set(blueSquares);
    if (bottomBlue) nextSquares.add(npos);
    else nextSquares.delete(npos);

    setOri(swappedOri);
    setBlueSquares(nextSquares);
    setPos(npos);
    setMoves((m) => m + 1);
    moveCounter.current += 1;
    setLastMove({ dir, id: moveCounter.current });
  }, [blueSquares, ori, pos, solved]);

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') { e.preventDefault(); tryMove('up'); }
      if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') { e.preventDefault(); tryMove('down'); }
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') { e.preventDefault(); tryMove('left'); }
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') { e.preventDefault(); tryMove('right'); }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [tryMove]);

  return (
    <div className={styles.container}>
      <GameHeader
        title="Cube"
        instructions="Roll the cube with arrow keys. Landing on a blue square swaps the square’s blue with the cube’s bottom face. Goal: all 6 cube faces are blue."
      />

      <div className={styles.toolbar}>
        <button className={styles.button} onClick={newGame}>New</button>
        <div className={styles.stats}>
          <span><strong>Moves:</strong> {moves}</span>
          <span><strong>Blue faces:</strong> {blueFaces}/6</span>
          {solved && <span className={styles.win}>Solved!</span>}
        </div>
      </div>

      <div className={styles.grid}>
        {Array.from({ length: 16 }).map((_, i) => {
          const isBlue = blueSquares.has(i);
          const isPos = pos === i;
          return (
            <button
              key={i}
              className={`${styles.cell} ${isBlue ? styles.blue : ''} ${isPos ? styles.here : ''}`}
              onClick={() => {
                // click-to-move: pick best direction toward this cell if adjacent
                const r = Math.floor(pos / 4);
                const c = pos % 4;
                const tr = Math.floor(i / 4);
                const tc = i % 4;
                if (Math.abs(r - tr) + Math.abs(c - tc) !== 1) return;
                if (tr === r - 1) tryMove('up');
                else if (tr === r + 1) tryMove('down');
                else if (tc === c - 1) tryMove('left');
                else tryMove('right');
              }}
              aria-label={`cell ${i}`}
            >
              {isPos && <div className={styles.cube}>⬛</div>}
            </button>
          );
        })}
      </div>

      <div className={styles.visualizations}>
        <div className={styles.vizSection}>
          <div className={styles.vizLabel}>3D View</div>
          <Cube3D ori={ori} lastMove={lastMove} />
        </div>
        <div className={styles.vizSection}>
          <div className={styles.vizLabel}>Unfolded</div>
          <CubeNet ori={ori} />
        </div>
      </div>
    </div>
  );
}
