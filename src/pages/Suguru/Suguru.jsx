import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { formatTime } from '../../data/wordUtils';
import GameHeader from '../../components/GameHeader';
import SizeSelector from '../../components/SizeSelector';
import GiveUpButton from '../../components/GiveUpButton';
import GameResult from '../../components/GameResult';
import Timer from '../../components/Timer';
import puzzleDataset from '@datasets/suguruPuzzles_bundled.json';
import styles from './Suguru.module.css';

const GRID_SIZES = {
  '6×6': 6,
  '7×7': 7,
  '8×8': 8,
  '9×9': 9,
  '10×10': 10,
};

// Load a puzzle from the curated dataset
function loadDatasetPuzzle(size, usedIds = new Set()) {
  // Filter puzzles by size, excluding already used ones
  const available = puzzleDataset.filter(p => p.size === size && !usedIds.has(p.id));

  // Fall back to all puzzles of this size if we've used them all
  const candidates = available.length > 0
    ? available
    : puzzleDataset.filter(p => p.size === size);

  if (candidates.length === 0) return null;

  // Pick a random puzzle
  const puzzleData = candidates[Math.floor(Math.random() * candidates.length)];

  // Convert to our internal format
  const regionGrid = puzzleData.regions;

  // Build regions array from regionCells
  const regions = Object.entries(puzzleData.regionCells).map(([id, cells]) => ({
    id: parseInt(id),
    cells,
    size: cells.length
  }));

  // Convert clues (null -> 0) for puzzle grid
  const puzzle = puzzleData.clues.map(row =>
    row.map(c => c === null ? 0 : c)
  );

  return {
    regionGrid,
    regions,
    solution: puzzleData.solution,
    puzzle,
    puzzleId: puzzleData.id,
    source: puzzleData.source,
    attribution: puzzleData.attribution
  };
}

function checkValidity(grid, regionGrid, regions, size) {
  const errors = new Set();

  // Check no touching same numbers (8 neighbors)
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (grid[r][c] === 0) continue;

      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue;
          const nr = r + dr;
          const nc = c + dc;
          if (nr >= 0 && nr < size && nc >= 0 && nc < size) {
            if (grid[nr][nc] === grid[r][c]) {
              errors.add(`${r},${c}`);
              errors.add(`${nr},${nc}`);
            }
          }
        }
      }
    }
  }

  // Check region constraints
  for (const region of regions) {
    const seen = new Set();
    for (const [r, c] of region.cells) {
      if (grid[r][c] === 0) continue;
      if (grid[r][c] > region.size) {
        errors.add(`${r},${c}`);
      }
      if (seen.has(grid[r][c])) {
        // Duplicate in region
        for (const [rr, cc] of region.cells) {
          if (grid[rr][cc] === grid[r][c]) {
            errors.add(`${rr},${cc}`);
          }
        }
      }
      seen.add(grid[r][c]);
    }
  }

  return errors;
}

function checkSolved(grid, solution, size) {
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (grid[r][c] !== solution[r][c]) return false;
    }
  }
  return true;
}

// Get border classes for region visualization
function getRegionBorders(r, c, regionGrid, size) {
  const regionId = regionGrid[r][c];
  const borders = [];

  if (r === 0 || regionGrid[r-1][c] !== regionId) borders.push('top');
  if (r === size - 1 || regionGrid[r+1][c] !== regionId) borders.push('bottom');
  if (c === 0 || regionGrid[r][c-1] !== regionId) borders.push('left');
  if (c === size - 1 || regionGrid[r][c+1] !== regionId) borders.push('right');

  return borders;
}

export default function Suguru() {
  const [sizeKey, setSizeKey] = useState('6×6');
  const [puzzleData, setPuzzleData] = useState(null);
  const [grid, setGrid] = useState([]);
  const [selectedCell, setSelectedCell] = useState(null);
  const [gameState, setGameState] = useState('playing'); // 'playing', 'won', 'gave_up'
  const [errors, setErrors] = useState(new Set());
  const [showErrors, setShowErrors] = useState(true);
  const [timer, setTimer] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const timerRef = useRef(null);
  const usedPuzzleIdsRef = useRef(new Set());

  const size = GRID_SIZES[sizeKey];

  // Count available puzzles per size
  const puzzleCounts = useMemo(() => {
    const counts = {};
    for (const s of Object.values(GRID_SIZES)) {
      counts[s] = puzzleDataset.filter(p => p.size === s).length;
    }
    return counts;
  }, []);

  const initGame = useCallback(() => {
    const data = loadDatasetPuzzle(size, usedPuzzleIdsRef.current);
    if (data) {
      usedPuzzleIdsRef.current.add(data.puzzleId);
      setPuzzleData(data);
      setGrid(data.puzzle.map(row => [...row]));
      setSelectedCell(null);
      setGameState('playing');
      setErrors(new Set());
      setTimer(0);
      setIsRunning(true);
    }
  }, [size]);

  useEffect(() => {
    initGame();
  }, [initGame]);

  useEffect(() => {
    if (isRunning && gameState === 'playing') {
      timerRef.current = setInterval(() => {
        setTimer(t => t + 1);
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [isRunning, gameState]);

  useEffect(() => {
    if (!puzzleData) return;

    // Prevent validation when grid size doesn't match current size (during size transitions)
    if (grid.length !== size || puzzleData.regionGrid.length !== size) return;

    const newErrors = showErrors
      ? checkValidity(grid, puzzleData.regionGrid, puzzleData.regions, size)
      : new Set();
    setErrors(newErrors);

    if (checkSolved(grid, puzzleData.solution, size)) {
      setGameState('won');
      setIsRunning(false);
    }
  }, [grid, puzzleData, showErrors, size]);

  const handleCellClick = (r, c) => {
    if (gameState !== 'playing') return;
    if (puzzleData.puzzle[r][c] !== 0) return; // Can't edit given numbers
    setSelectedCell({ row: r, col: c });
  };

  const handleNumberInput = (num) => {
    if (!selectedCell || gameState !== 'playing') return;
    const { row, col } = selectedCell;
    if (puzzleData.puzzle[row][col] !== 0) return;

    const regionId = puzzleData.regionGrid[row][col];
    const region = puzzleData.regions.find(r => r.id === regionId);
    if (num > region.size) return;

    setGrid(prev => {
      const newGrid = prev.map(r => [...r]);
      newGrid[row][col] = num;
      return newGrid;
    });
  };

  const handleClear = () => {
    if (!selectedCell || gameState !== 'playing') return;
    const { row, col } = selectedCell;
    if (puzzleData.puzzle[row][col] !== 0) return;

    setGrid(prev => {
      const newGrid = prev.map(r => [...r]);
      newGrid[row][col] = 0;
      return newGrid;
    });
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!selectedCell || gameState !== 'playing') return;

      const num = parseInt(e.key);
      if (num >= 1 && num <= 9) {
        handleNumberInput(num);
      } else if (e.key === 'Backspace' || e.key === 'Delete' || e.key === '0') {
        handleClear();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedCell, gameState]);

  if (!puzzleData) return null;

  // Prevent rendering when grid size doesn't match current size (during size transitions)
  if (grid.length !== size || puzzleData.regionGrid.length !== size) return null;

  // Color palette for regions
  const colors = [
    'rgba(239, 68, 68, 0.2)',
    'rgba(34, 197, 94, 0.2)',
    'rgba(59, 130, 246, 0.2)',
    'rgba(168, 85, 247, 0.2)',
    'rgba(234, 179, 8, 0.2)',
    'rgba(236, 72, 153, 0.2)',
    'rgba(20, 184, 166, 0.2)',
    'rgba(249, 115, 22, 0.2)',
    'rgba(99, 102, 241, 0.2)',
    'rgba(132, 204, 22, 0.2)',
  ];

  return (
    <div className={styles.container}>
      <GameHeader
        title="Suguru"
        instructions="Fill each region with numbers 1 to N (where N = region size). Same numbers cannot touch, even diagonally."
      />

      <SizeSelector
        sizes={Object.keys(GRID_SIZES)}
        selected={sizeKey}
        onSelect={(key) => {
          const count = puzzleCounts[GRID_SIZES[key]] || 0;
          if (count > 0) setSizeKey(key);
        }}
      />

      <div className={styles.gameArea}>
        <div className={styles.statusBar}>
          <Timer seconds={timer} />
          {puzzleData?.source && (
            <div className={styles.attribution}>
              Puzzle from {puzzleData.source}
            </div>
          )}
        </div>

        <div className={styles.board} style={{ '--grid-size': size }}>
          {Array(size).fill(null).map((_, r) => (
            <div key={r} className={styles.row}>
              {Array(size).fill(null).map((_, c) => {
                const value = grid[r][c];
                const isGiven = puzzleData.puzzle[r][c] !== 0;
                const isSelected = selectedCell?.row === r && selectedCell?.col === c;
                const hasError = errors.has(`${r},${c}`);
                const borders = getRegionBorders(r, c, puzzleData.regionGrid, size);
                const regionId = puzzleData.regionGrid[r][c];
                const bgColor = colors[regionId % colors.length];

                return (
                  <div
                    key={c}
                    className={`
                      ${styles.cell}
                      ${isGiven ? styles.given : ''}
                      ${isSelected ? styles.selected : ''}
                      ${hasError ? styles.error : ''}
                      ${borders.includes('top') ? styles.borderTop : ''}
                      ${borders.includes('bottom') ? styles.borderBottom : ''}
                      ${borders.includes('left') ? styles.borderLeft : ''}
                      ${borders.includes('right') ? styles.borderRight : ''}
                    `}
                    style={{ backgroundColor: bgColor }}
                    onClick={() => handleCellClick(r, c)}
                  >
                    {value !== 0 && <span className={styles.cellValue}>{value}</span>}
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        <div className={styles.numberPad}>
          {[1, 2, 3, 4, 5].map(num => (
            <button
              key={num}
              className={styles.numBtn}
              onClick={() => handleNumberInput(num)}
            >
              {num}
            </button>
          ))}
          <button className={styles.numBtn} onClick={handleClear}>✕</button>
        </div>

        {gameState === 'won' && (
          <GameResult
            state="won"
            title="🎉 Puzzle Solved!"
            message={`Completed in ${formatTime(timer)}`}
          />
        )}

        {gameState === 'gave_up' && (
          <GameResult
            state="gaveup"
            title="Solution Revealed"
            message="Try another puzzle!"
          />
        )}

        <div className={styles.controls}>
          <label className={styles.toggle}>
            <input
              type="checkbox"
              checked={showErrors}
              onChange={(e) => setShowErrors(e.target.checked)}
            />
            <span className={styles.toggleSlider}></span>
            Show errors
          </label>
        </div>

        <div className={styles.buttons}>
          <button className={styles.resetBtn} onClick={() => {
            setGrid(puzzleData.puzzle.map(row => [...row]));
            setGameState('playing');
            setTimer(0);
            setIsRunning(true);
          }}>
            Reset
          </button>
          <GiveUpButton
            onGiveUp={() => {
              setGrid(puzzleData.solution);
              setGameState('gave_up');
              setIsRunning(false);
            }}
            disabled={gameState !== 'playing'}
          />
          <button className={styles.newGameBtn} onClick={initGame}>
            New Puzzle
          </button>
        </div>
      </div>
    </div>
  );
}
