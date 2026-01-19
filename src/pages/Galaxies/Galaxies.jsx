import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import GameHeader from '../../components/GameHeader';
import SizeSelector from '../../components/SizeSelector';
import DifficultySelector from '../../components/DifficultySelector';
import GiveUpButton from '../../components/GiveUpButton';
import GameResult from '../../components/GameResult';
import puzzleDataset from '@datasets/galaxiesPuzzles_bundled.json';
import styles from './Galaxies.module.css';

// Simplified Galaxies: dots at cell centres only.
// Player assigns each cell to a dot/galaxy. A galaxy is valid if:
// - region is connected
// - region is 180° symmetric about its dot cell

// Generate 60 distinct colors using HSL
const COLORS = (() => {
  const colors = [];
  // Use golden angle to distribute hues evenly
  const goldenAngle = 137.508;
  for (let i = 0; i < 60; i++) {
    const hue = (i * goldenAngle) % 360;
    // Alternate saturation and lightness for more variety
    const saturation = 65 + (i % 3) * 15; // 65%, 80%, 95%
    const lightness = 50 + (i % 2) * 15; // 50%, 65%
    colors.push(`hsl(${hue}, ${saturation}%, ${lightness}%)`);
  }
  return colors;
})();

// Helper functions
function rcToIdx(r, c, w) {
  return r * w + c;
}
function idxToRC(i, w) {
  return { r: Math.floor(i / w), c: i % w };
}
function inBounds(r, c, h, w) {
  return r >= 0 && r < h && c >= 0 && c < w;
}

// Grid sizes available in dataset
const SIZES = [7, 10, 15];

// Difficulty levels
const DIFFICULTIES = [
  { code: 'e', label: 'Easy' },
  { code: 'm', label: 'Medium' },
  { code: 'h', label: 'Hard' },
  { code: 'x', label: 'Expert' },
];

// Load puzzle from dataset
function loadDatasetPuzzle(size, difficulty, usedIds) {
  // Filter by size and difficulty
  const availablePuzzles = puzzleDataset.filter(
    p => p.s === size && p.diff === difficulty && !usedIds.has(p.id)
  );

  if (availablePuzzles.length === 0) {
    // Try without the used filter first
    const allMatching = puzzleDataset.filter(p => p.s === size && p.diff === difficulty);
    if (allMatching.length > 0) {
      usedIds.clear();
      return allMatching[Math.floor(Math.random() * allMatching.length)];
    }
    // Fall back to any difficulty for this size
    const sizeMatching = puzzleDataset.filter(p => p.s === size && !usedIds.has(p.id));
    if (sizeMatching.length > 0) {
      return sizeMatching[Math.floor(Math.random() * sizeMatching.length)];
    }
    usedIds.clear();
    const anySize = puzzleDataset.filter(p => p.s === size);
    return anySize[Math.floor(Math.random() * anySize.length)];
  }

  return availablePuzzles[Math.floor(Math.random() * availablePuzzles.length)];
}

// Convert compact format to game format
// Dots are stored as [r, c, type] where type: 0=cell, 1=hedge, 2=vedge, 3=corner
const DOT_TYPES = ['cell', 'hedge', 'vedge', 'corner'];

function puzzleFromDataset(compactPuzzle) {
  const { id, s, d, sol, diff } = compactPuzzle;
  return {
    id,
    w: s,
    h: s,
    // Dots with position and type for rendering
    dots: d.map(([r, c, t]) => ({ r, c, type: DOT_TYPES[t] || 'cell' })),
    solution: sol,
    numRegions: new Set(sol).size,
    difficulty: diff === 'e' ? 'easy' : diff === 'm' ? 'medium' : diff === 'h' ? 'hard' : 'expert'
  };
}

function analyze(puz, assign) {
  const n = puz.w * puz.h;

  // Check if all cells are assigned
  const allAssigned = assign.every((x) => x >= 0);
  if (!allAssigned) {
    return { bad: new Set(), solved: false };
  }

  // Check if assignment matches solution
  // The solution uses region IDs, so we need to check if same cells
  // are grouped together, not that the IDs match exactly

  // Build mapping from solution region -> cells
  const solutionRegions = {};
  for (let i = 0; i < n; i++) {
    const g = puz.solution[i];
    if (!solutionRegions[g]) solutionRegions[g] = new Set();
    solutionRegions[g].add(i);
  }

  // Build mapping from assignment region -> cells
  const assignRegions = {};
  for (let i = 0; i < n; i++) {
    const g = assign[i];
    if (!assignRegions[g]) assignRegions[g] = new Set();
    assignRegions[g].add(i);
  }

  // Check that each assignment region exactly matches a solution region
  const bad = new Set();
  const usedSolutionRegions = new Set();

  for (const [assignId, assignCells] of Object.entries(assignRegions)) {
    let foundMatch = false;

    for (const [solId, solCells] of Object.entries(solutionRegions)) {
      if (usedSolutionRegions.has(solId)) continue;

      // Check if sets are equal
      if (assignCells.size === solCells.size) {
        let allMatch = true;
        for (const cell of assignCells) {
          if (!solCells.has(cell)) {
            allMatch = false;
            break;
          }
        }
        if (allMatch) {
          foundMatch = true;
          usedSolutionRegions.add(solId);
          break;
        }
      }
    }

    if (!foundMatch) {
      // Mark all cells in this region as bad
      for (const cell of assignCells) {
        bad.add(cell);
      }
    }
  }

  const solved = allAssigned && bad.size === 0;
  return { bad, solved };
}

// Export helpers for testing
export {
  COLORS,
  rcToIdx,
  idxToRC,
  inBounds,
  SIZES,
  DIFFICULTIES,
  loadDatasetPuzzle,
  puzzleFromDataset,
  analyze,
};

export default function Galaxies() {
  const [size, setSize] = useState(7);
  const [difficulty, setDifficulty] = useState('e');
  const [puz, setPuz] = useState(null);
  const [sel, setSel] = useState(0);
  const [assign, setAssign] = useState([]);
  const [gameState, setGameState] = useState('playing'); // 'playing', 'solved', 'gaveUp'

  // Track used puzzle IDs to avoid repeats
  const usedPuzzleIdsRef = useRef(new Set());

  const generateNew = useCallback(() => {
    const compactPuzzle = loadDatasetPuzzle(size, difficulty, usedPuzzleIdsRef.current);
    if (compactPuzzle) {
      usedPuzzleIdsRef.current.add(compactPuzzle.id);
      const newPuz = puzzleFromDataset(compactPuzzle);
      setPuz(newPuz);
      setAssign(new Array(newPuz.w * newPuz.h).fill(-1));
      setSel(0);
      setGameState('playing');
    }
  }, [size, difficulty]);

  useEffect(() => {
    generateNew();
  }, [generateNew]);

  const { bad, solved } = useMemo(() => {
    if (!puz) return { bad: new Set(), solved: false };
    return analyze(puz, assign);
  }, [puz, assign]);

  // Update game state when solved
  useEffect(() => {
    if (solved && gameState === 'playing') {
      setGameState('solved');
    }
  }, [solved, gameState]);

  const paint = (i) => {
    if (gameState !== 'playing') return;
    setAssign((prev) => {
      const n = prev.slice();
      n[i] = n[i] === sel ? -1 : sel;
      return n;
    });
  };

  const handleGiveUp = () => {
    if (puz && gameState === 'playing') {
      setAssign(puz.solution.slice());
      setGameState('gaveUp');
    }
  };

  return (
    <div className={styles.container}>
      <GameHeader
        title="Galaxies"
        instructions="Partition the grid into galaxies. Each galaxy must be connected and 180° symmetric about its central planet. Select a galaxy color, then click cells to assign them to that galaxy."
      />

      <div className={styles.toolbar}>
        <SizeSelector
          sizes={SIZES}
          selected={size}
          onSelect={setSize}
        />
        <DifficultySelector
          difficulties={DIFFICULTIES.map(d => d.code)}
          selected={difficulty}
          onSelect={setDifficulty}
          labels={Object.fromEntries(DIFFICULTIES.map(d => [d.code, d.label]))}
        />
        <div className={styles.group}>
          <button className={styles.generateBtn} onClick={generateNew}>New Puzzle</button>
          {puz && gameState === 'playing' && (
            <button className={styles.button} onClick={() => setAssign(new Array(puz.w * puz.h).fill(-1))}>Clear</button>
          )}
          <GiveUpButton
            onGiveUp={handleGiveUp}
            disabled={gameState !== 'playing'}
          />
        </div>
        {puz && gameState === 'playing' && (
          <div className={styles.group}>
            <span className={styles.regionCount}>{puz.numRegions} regions</span>
            <div className={styles.palette}>
              {Array.from({ length: puz.numRegions }, (_, i) => (
                <div
                  key={i}
                  className={`${styles.swatch} ${sel === i ? styles.active : ''}`}
                  style={{ background: COLORS[i % COLORS.length] }}
                  onClick={() => setSel(i)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && setSel(i)}
                  title={`Region ${i + 1}`}
                />
              ))}
            </div>
          </div>
        )}
        <GameResult
          show={gameState === 'solved'}
          type="won"
          title="🎉 Solved!"
          inline
        />
        <GameResult
          show={gameState === 'gaveUp'}
          type="gaveUp"
          title="Solution revealed"
          inline
        />
        {gameState === 'playing' && (
          <div className={styles.status}>
            {bad.size > 0 ? (
              <span className={styles.bad}>Regions don't match solution</span>
            ) : (
              <span>OK</span>
            )}
          </div>
        )}
      </div>

      {puz && (
        <div className={styles.gridWrapper}>
          <div className={styles.grid} style={{ gridTemplateColumns: `repeat(${puz.w}, 44px)` }}>
            {Array.from({ length: puz.w * puz.h }, (_, i) => {
              const g = assign[i];
              const { r, c } = idxToRC(i, puz.w);
              const bg = g >= 0 ? COLORS[g % COLORS.length] : 'rgba(255,255,255,0.06)';
              const style = { background: bg };

              // Find cell-center dot at this position (r+0.5, c+0.5)
              const cellDot = puz.dots.find(d =>
                d.type === 'cell' &&
                Math.abs(d.r - (r + 0.5)) < 0.1 &&
                Math.abs(d.c - (c + 0.5)) < 0.1
              );

              return (
                <div
                  key={i}
                  className={`${styles.cell} ${g >= 0 ? styles.painted : ''} ${bad.has(i) ? styles.badCell : ''} ${gameState !== 'playing' ? styles.disabled : ''}`}
                  style={style}
                  onClick={() => paint(i)}
                  title={`(${r + 1},${c + 1})`}
                >
                  {cellDot && <div className={styles.dot}>🪐</div>}
                </div>
              );
            })}
          </div>
          {/* Render edge and corner dots as overlays */}
          <div className={styles.dotsOverlay} style={{
            width: puz.w * 50,
            height: puz.h * 50,
          }}>
            {puz.dots.filter(d => d.type !== 'cell').map((d, i) => {
              // Convert half-cell coords to pixel position
              // Cell size is 44px + 6px gap = 50px per cell
              const x = d.c * 50;
              const y = d.r * 50;
              return (
                <div
                  key={`dot-${i}`}
                  className={`${styles.edgeDot} ${styles[d.type]}`}
                  style={{ left: x, top: y }}
                >
                  🪐
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
