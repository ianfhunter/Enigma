import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import GameHeader from '../../components/GameHeader';
import styles from './Mosaic.module.css';
import mosaicPuzzles from '../../../public/datasets/mosaicPuzzles.json';

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

// Get available sizes from dataset
function getAvailableSizes() {
  const sizes = new Set();
  mosaicPuzzles.puzzles.forEach(p => {
    sizes.add(`${p.cols}x${p.rows}`);
  });
  return Array.from(sizes).sort((a, b) => {
    const [aw, ah] = a.split('x').map(Number);
    const [bw, bh] = b.split('x').map(Number);
    return (aw * ah) - (bw * bh);
  });
}

// Parse a dataset puzzle into the format we need
function parseDatasetPuzzle(puzzle) {
  const { rows, cols, clues: clues2D, solution: solution2D } = puzzle;

  // Convert 2D arrays to 1D
  const clues = [];
  const solution = [];

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      clues.push(clues2D[r][c]);
      // solution: 'x' means black (1), null means white (0)
      solution.push(solution2D[r][c] === 'x' ? 1 : 0);
    }
  }

  return { w: cols, h: rows, clues, solution };
}

// Export helpers for testing
export {
  idx,
  inBounds,
  neighbors3x3,
  cycleCell,
  getAvailableSizes,
  parseDatasetPuzzle,
};

export default function Mosaic() {
  const { t } = useTranslation();
  const availableSizes = useMemo(() => getAvailableSizes(), []);
  const [sizeKey, setSizeKey] = useState(availableSizes[0] || '15x15');
  const [puzzleData, setPuzzleData] = useState(null);
  const [cells, setCells] = useState([]);
  const [showSolution, setShowSolution] = useState(false);
  const [gameState, setGameState] = useState('playing');

  const dragRef = useRef({ active: false, button: 'left', seen: new Set() });

  const initGame = useCallback(() => {
    const [w, h] = sizeKey.split('x').map(Number);

    // Find puzzles matching this size
    const filtered = mosaicPuzzles.puzzles.filter(
      p => p.cols === w && p.rows === h
    );

    if (filtered.length === 0) {
      console.warn(`No puzzles found for size ${sizeKey}`);
      return;
    }

    const selected = filtered[Math.floor(Math.random() * filtered.length)];
    const data = parseDatasetPuzzle(selected);

    setPuzzleData(data);
    setCells(Array(data.w * data.h).fill(null));
    setShowSolution(false);
    setGameState('playing');
  }, [sizeKey]);

  useEffect(() => {
    initGame();
  }, [initGame]);

  const size = puzzleData ? { w: puzzleData.w, h: puzzleData.h } : { w: 15, h: 15 };
  const clues = puzzleData?.clues || [];
  const solution = puzzleData?.solution || [];

  const analysis = useMemo(() => {
    if (!puzzleData) return { bad: new Set(), good: new Set(), solved: false };

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
  }, [cells, clues, puzzleData, size.h, size.w]);

  useEffect(() => {
    if (analysis.solved && gameState === 'playing') {
      setGameState('won');
    }
  }, [analysis.solved, gameState]);

  useEffect(() => {
    const onUp = () => {
      dragRef.current.active = false;
      dragRef.current.seen = new Set();
    };
    window.addEventListener('mouseup', onUp);
    return () => window.removeEventListener('mouseup', onUp);
  }, []);

  const applyAt = (i, button) => {
    if (gameState !== 'playing') return;
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

  const handleGiveUp = () => {
    if (!puzzleData) return;
    setCells([...solution]);
    setShowSolution(true);
    setGameState('gaveUp');
  };

  if (!puzzleData) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading puzzle...</div>
      </div>
    );
  }

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
              value={sizeKey}
              onChange={(e) => setSizeKey(e.target.value)}
            >
              {availableSizes.map(s => (
                <option key={s} value={s}>{s.replace('x', '×')}</option>
              ))}
            </select>
          </label>
          <button className={styles.button} onClick={initGame}>New Puzzle</button>
        </div>

        <div className={styles.group}>
          <button className={styles.button} onClick={() => setCells(Array(size.w * size.h).fill(null))}>Clear</button>
          <button
            className={styles.button}
            onClick={handleGiveUp}
            disabled={gameState !== 'playing'}
          >
            Give Up
          </button>
        </div>

        <div className={styles.status}>
          {gameState === 'won' && <span className={styles.win}>🎉 Solved!</span>}
          {gameState === 'gaveUp' && <span className={styles.gaveUp}>Solution revealed</span>}
          {gameState === 'playing' && <span>Clue errors: {analysis.bad.size}</span>}
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
