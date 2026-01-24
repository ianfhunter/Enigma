import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { formatTime } from '../../data/wordUtils';
import GameHeader from '../../components/GameHeader';
import SizeSelector from '../../components/SizeSelector';
import GiveUpButton from '../../components/GiveUpButton';
import GameResult from '../../components/GameResult';
import Timer from '../../components/Timer';
import SeedDisplay from '../../components/SeedDisplay';
import { useGameState } from '../../hooks/useGameState';
import { useGameStats } from '../../hooks/useGameStats';
import puzzleDataset from '@datasets/rippleEffectPuzzles.json';
import styles from './RippleEffect.module.css';

const GRID_SIZES = {
  '6×6': 6,
  '8×8': 8,
  '10×10': 10,
};

// Load a puzzle from the curated dataset
function loadDatasetPuzzle(size, usedIds = new Set()) {
  // Filter puzzles by size, excluding already used ones
  const available = puzzleDataset.puzzles.filter(p => p.rows === size && !usedIds.has(p.id));

  // Fall back to all puzzles of this size if we've used them all
  const candidates = available.length > 0
    ? available
    : puzzleDataset.puzzles.filter(p => p.rows === size);

  if (candidates.length === 0) return null;

  // Pick a random puzzle
  const puzzleData = candidates[Math.floor(Math.random() * candidates.length)];

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
    regionGrid: puzzleData.regions,
    regions,
    solution: puzzleData.solution,
    puzzle,
    puzzleId: puzzleData.id,
    seed: puzzleData.seed,
    difficulty: puzzleData.difficulty
  };
}

// Check for Ripple Effect constraint violations
function checkValidity(grid, regionGrid, regions, size) {
  const errors = new Set();

  // Check distance constraint: same number N in row/col must have at least N cells between
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const value = grid[r][c];
      if (value === 0) continue;

      // Check horizontal (same row)
      for (let c2 = c + 1; c2 < size; c2++) {
        if (grid[r][c2] === value) {
          const distance = c2 - c - 1; // cells between them
          if (distance < value) {
            errors.add(`${r},${c}`);
            errors.add(`${r},${c2}`);
          }
        }
      }

      // Check vertical (same column)
      for (let r2 = r + 1; r2 < size; r2++) {
        if (grid[r2][c] === value) {
          const distance = r2 - r - 1; // cells between them
          if (distance < value) {
            errors.add(`${r},${c}`);
            errors.add(`${r2},${c}`);
          }
        }
      }
    }
  }

  // Check region constraints: no duplicates in same region
  for (const region of regions) {
    const seen = new Map();
    for (const [r, c] of region.cells) {
      const value = grid[r][c];
      if (value === 0) continue;

      // Check if value exceeds room size
      if (value > region.size) {
        errors.add(`${r},${c}`);
      }

      // Check for duplicates
      if (seen.has(value)) {
        errors.add(`${r},${c}`);
        errors.add(seen.get(value));
      } else {
        seen.set(value, `${r},${c}`);
      }
    }
  }

  return errors;
}

function checkSolved(grid, solution, size) {
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      // Must have all cells filled (no empty cells)
      if (grid[r][c] === 0) return false;
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

export default function RippleEffect() {
  const { t } = useTranslation();
  const [sizeKey, setSizeKey] = useState('8×8');
  const [puzzleData, setPuzzleData] = useState(null);
  const [grid, setGrid] = useState([]);
  const [selectedCell, setSelectedCell] = useState(null);
  const { gameState, checkWin, giveUp, reset: resetGameState, isPlaying } = useGameState();
  const [errors, setErrors] = useState(new Set());
  const [showErrors, setShowErrors] = useState(false);
  const [timer, setTimer] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const timerRef = useRef(null);
  const usedPuzzleIdsRef = useRef(new Set());

  const size = GRID_SIZES[sizeKey];

  // Count available puzzles per size
  const puzzleCounts = useMemo(() => {
    const counts = {};
    for (const s of Object.values(GRID_SIZES)) {
      counts[s] = puzzleDataset.puzzles.filter(p => p.rows === s).length;
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
      resetGameState();
      setErrors(new Set());
      setTimer(0);
      setIsRunning(true);
    }
  }, [size]);

  useEffect(() => {
    initGame();
  }, [initGame]);

  useEffect(() => {
    if (isRunning && isPlaying) {
      timerRef.current = setInterval(() => {
        setTimer(t => t + 1);
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [isRunning, isPlaying]);

  useEffect(() => {
    if (!puzzleData || !isPlaying) return;

    // Prevent validation when grid size doesn't match current size (during size transitions)
    if (grid.length !== size || puzzleData.regionGrid.length !== size) return;

    const newErrors = showErrors
      ? checkValidity(grid, puzzleData.regionGrid, puzzleData.regions, size)
      : new Set();
    setErrors(newErrors);

    // checkWin handles the guard internally - won't trigger if not playing
    if (checkWin(checkSolved(grid, puzzleData.solution, size))) {
      setIsRunning(false);
    }
  }, [grid, puzzleData, showErrors, size, isPlaying, checkWin]);

  const handleCellClick = (r, c) => {
    if (!isPlaying) return;
    if (puzzleData.puzzle[r][c] !== 0) return; // Can't edit given numbers
    setSelectedCell({ row: r, col: c });
  };

  const handleNumberInput = (num) => {
    if (!selectedCell || !isPlaying) return;
    const { row, col } = selectedCell;
    if (puzzleData.puzzle[row][col] !== 0) return;

    // Get the room this cell belongs to
    const regionId = puzzleData.regionGrid[row][col];
    const region = puzzleData.regions.find(r => r.id === regionId);
    if (num > region.size) return; // Can't exceed room size

    setGrid(prev => {
      const newGrid = prev.map(r => [...r]);
      newGrid[row][col] = num;
      return newGrid;
    });
  };

  const handleClear = () => {
    if (!selectedCell || !isPlaying) return;
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
      if (!selectedCell || !isPlaying) return;

      const num = parseInt(e.key);
      if (num >= 1 && num <= 9) {
        handleNumberInput(num);
      } else if (e.key === 'Backspace' || e.key === 'Delete' || e.key === '0') {
        handleClear();
      } else if (e.key === 'ArrowUp' && selectedCell.row > 0) {
        setSelectedCell(prev => ({ ...prev, row: prev.row - 1 }));
      } else if (e.key === 'ArrowDown' && selectedCell.row < size - 1) {
        setSelectedCell(prev => ({ ...prev, row: prev.row + 1 }));
      } else if (e.key === 'ArrowLeft' && selectedCell.col > 0) {
        setSelectedCell(prev => ({ ...prev, col: prev.col - 1 }));
      } else if (e.key === 'ArrowRight' && selectedCell.col < size - 1) {
        setSelectedCell(prev => ({ ...prev, col: prev.col + 1 }));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedCell, gameState, size]);

  if (!puzzleData) return null;

  // Prevent rendering when grid size doesn't match current size (during size transitions)
  if (grid.length !== size || puzzleData.regionGrid.length !== size) return null;

  // Color palette for regions - softer colors that work well together
  const colors = [
    'rgba(99, 179, 237, 0.25)',   // blue
    'rgba(154, 230, 180, 0.25)', // green
    'rgba(246, 173, 85, 0.25)',  // orange
    'rgba(183, 148, 244, 0.25)', // purple
    'rgba(252, 129, 129, 0.25)', // red
    'rgba(129, 230, 217, 0.25)', // teal
    'rgba(251, 207, 232, 0.25)', // pink
    'rgba(253, 230, 138, 0.25)', // yellow
    'rgba(165, 180, 252, 0.25)', // indigo
    'rgba(167, 243, 208, 0.25)', // emerald
  ];

  // Get max value for current room (for number pad)
  const getMaxForSelectedCell = () => {
    if (!selectedCell) return 5;
    const regionId = puzzleData.regionGrid[selectedCell.row][selectedCell.col];
    const region = puzzleData.regions.find(r => r.id === regionId);
    return region ? region.size : 5;
  };

  const maxNum = getMaxForSelectedCell();

  return (
    <div className={styles.container}>
      <GameHeader
        title="Ripple Effect"
        emoji="🌊"
        instructions="Fill each room with numbers 1 to N (room size). If the same number appears twice in a row or column, there must be at least that many cells between them."
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
          {puzzleData?.seed && (
            <SeedDisplay
              seed={puzzleData.seed}
              variant="compact"
              showShare={true}
            />
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

                // Highlight same number in row/col when selected
                const isHighlighted = selectedCell && value !== 0 &&
                  (selectedCell.row === r || selectedCell.col === c) &&
                  !(selectedCell.row === r && selectedCell.col === c);

                return (
                  <div
                    key={c}
                    className={`
                      ${styles.cell}
                      ${isGiven ? styles.given : ''}
                      ${isSelected ? styles.selected : ''}
                      ${hasError ? styles.error : ''}
                      ${isHighlighted ? styles.highlighted : ''}
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
          {Array.from({ length: Math.min(maxNum, 6) }, (_, i) => i + 1).map(num => (
            <button
              key={num}
              className={styles.numBtn}
              onClick={() => handleNumberInput(num)}
              disabled={!isPlaying}
            >
              {num}
            </button>
          ))}
          <button
            className={styles.numBtn}
            onClick={handleClear}
            disabled={!isPlaying}
          >
            ✕
          </button>
        </div>

        {gameState === 'won' && (
          <GameResult
            state="won"
            title="🎉 Puzzle Solved!"
            message={`Completed in ${formatTime(timer)}`}
          />
        )}

        {gameState === 'gaveUp' && (
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
            resetGameState();
            setTimer(0);
            setIsRunning(true);
          }}>
            Reset
          </button>
          <GiveUpButton
            onGiveUp={() => {
              setGrid(puzzleData.solution);
              giveUp();
              setIsRunning(false);
            }}
            disabled={!isPlaying}
          />
          <button className={styles.newGameBtn} onClick={initGame}>
            New Puzzle
          </button>
        </div>

        <div className={styles.ruleReminder}>
          <strong>Ripple Rule:</strong> If two identical numbers N appear in the same row or column,
          there must be at least N cells between them.
        </div>
      </div>
    </div>
  );
}
