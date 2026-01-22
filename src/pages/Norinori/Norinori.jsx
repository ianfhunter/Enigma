import { useTranslation } from 'react-i18next';
import { useState, useEffect, useCallback } from 'react';
import GameHeader from '../../components/GameHeader';
import SizeSelector from '../../components/SizeSelector';
import DifficultySelector from '../../components/DifficultySelector';
import GiveUpButton from '../../components/GiveUpButton';
import GameResult from '../../components/GameResult';
import { useGameState } from '../../hooks/useGameState';
import styles from './Norinori.module.css';

// Load puzzles from dataset
import norinoriPuzzles from '../../../public/datasets/norinoriPuzzles.json';

const GRID_SIZES = {
  '6×6': 6,
  '8×8': 8,
  '10×10': 10,
  '12×12': 12,
};

const DIFFICULTIES = ['Easy', 'Medium', 'Hard'];

// Get unique color for each region
const REGION_COLORS = [
  'rgba(239, 68, 68, 0.25)',    // red
  'rgba(249, 115, 22, 0.25)',   // orange
  'rgba(234, 179, 8, 0.25)',    // yellow
  'rgba(34, 197, 94, 0.25)',    // green
  'rgba(6, 182, 212, 0.25)',    // cyan
  'rgba(59, 130, 246, 0.25)',   // blue
  'rgba(139, 92, 246, 0.25)',   // purple
  'rgba(236, 72, 153, 0.25)',   // pink
  'rgba(168, 85, 247, 0.25)',   // violet
  'rgba(20, 184, 166, 0.25)',   // teal
  'rgba(245, 158, 11, 0.25)',   // amber
  'rgba(132, 204, 22, 0.25)',   // lime
  'rgba(99, 102, 241, 0.25)',   // indigo
  'rgba(244, 63, 94, 0.25)',    // rose
  'rgba(14, 165, 233, 0.25)',   // sky
  'rgba(217, 70, 239, 0.25)',   // fuchsia
  'rgba(251, 191, 36, 0.25)',   // gold
  'rgba(5, 150, 105, 0.25)',    // emerald
  'rgba(79, 70, 229, 0.25)',    // indigo dark
  'rgba(190, 24, 93, 0.25)',    // pink dark
];

function checkValidity(playerGrid, regions) {
  const rows = playerGrid.length;
  const cols = playerGrid[0].length;
  const errors = new Set();

  // Rule 1: Each shaded cell must be adjacent to exactly one other shaded cell (form dominoes)
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (!playerGrid[r][c]) continue;

      let adjacentShaded = 0;
      const neighbors = [[r-1, c], [r+1, c], [r, c-1], [r, c+1]];
      for (const [nr, nc] of neighbors) {
        if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && playerGrid[nr][nc]) {
          adjacentShaded++;
        }
      }

      // Each shaded cell should be part of exactly one domino (adjacent to exactly 1 other shaded cell)
      if (adjacentShaded !== 1) {
        errors.add(`${r},${c}`);
      }
    }
  }

  // Rule 2: Each region must have exactly 2 shaded cells
  const regionCounts = {};
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const regionId = regions[r][c];
      if (!regionCounts[regionId]) {
        regionCounts[regionId] = { shaded: 0, cells: [] };
      }
      regionCounts[regionId].cells.push([r, c]);
      if (playerGrid[r][c]) {
        regionCounts[regionId].shaded++;
      }
    }
  }

  for (const regionId of Object.keys(regionCounts)) {
    const { shaded, cells } = regionCounts[regionId];

    if (shaded > 2) {
      // Too many shaded in this region: flag the shaded cells
      for (const [r, c] of cells) {
        if (playerGrid[r][c]) {
          errors.add(`${r},${c}`);
        }
      }
    } else if (shaded < 2) {
      // Too few shaded cells in this region: flag the whole region
      for (const [r, c] of cells) {
        errors.add(`${r},${c}`);
      }
    }
  }

  return errors;
}

function checkSolved(playerGrid, solution) {
  const rows = playerGrid.length;
  const cols = playerGrid[0].length;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (playerGrid[r][c] !== solution[r][c]) return false;
    }
  }

  return true;
}

// Export helpers for testing
export {
  GRID_SIZES,
  DIFFICULTIES,
  REGION_COLORS,
  checkValidity,
  checkSolved,
};

export default function Norinori() {
  const [sizeKey, setSizeKey] = useState('10×10');
  const [difficulty, setDifficulty] = useState('Medium');
  const [puzzleData, setPuzzleData] = useState(null);
  const [playerGrid, setPlayerGrid] = useState([]);
  const { gameState, checkWin, giveUp, reset: resetGameState, isPlaying } = useGameState();
  const [errors, setErrors] = useState(new Set());
  const [showErrors, setShowErrors] = useState(true);

  const size = GRID_SIZES[sizeKey];

  const initGame = useCallback(() => {
    // Filter puzzles by size and difficulty
    const matchingPuzzles = norinoriPuzzles.puzzles.filter(p => {
      const matchSize = p.rows === size && p.cols === size;
      const matchDiff = p.difficulty?.toLowerCase() === difficulty.toLowerCase();
      return matchSize && matchDiff;
    });

    let availablePuzzles = matchingPuzzles.length > 0
      ? matchingPuzzles
      : norinoriPuzzles.puzzles.filter(p => p.rows === size && p.cols === size);

    if (availablePuzzles.length === 0) {
      const sizes = [...new Set(norinoriPuzzles.puzzles.map(p => p.rows))].sort((a, b) => Math.abs(a - size) - Math.abs(b - size));
      if (sizes.length > 0) {
        availablePuzzles = norinoriPuzzles.puzzles.filter(p => p.rows === sizes[0]);
      }
    }

    if (availablePuzzles.length === 0) {
      console.error('No puzzles available');
      return;
    }

    const puzzle = availablePuzzles[Math.floor(Math.random() * availablePuzzles.length)];
    const rows = puzzle.rows;
    const cols = puzzle.cols;

    setPuzzleData({
      regions: puzzle.regions,
      solution: puzzle.solution,
      rows,
      cols
    });
    setPlayerGrid(Array(rows).fill(null).map(() => Array(cols).fill(false)));
    resetGameState();
    setErrors(new Set());
  }, [size, difficulty, resetGameState]);

  useEffect(() => {
    initGame();
  }, [initGame]);

  useEffect(() => {
    if (!puzzleData || !isPlaying) return;

    const newErrors = showErrors ? checkValidity(playerGrid, puzzleData.regions) : new Set();
    setErrors(newErrors);

    checkWin(checkSolved(playerGrid, puzzleData.solution));
  }, [playerGrid, puzzleData, showErrors, isPlaying, checkWin]);

  const handleCellClick = (r, c) => {
    if (!isPlaying) return;

    setPlayerGrid(prev => {
      const newGrid = prev.map(row => [...row]);
      newGrid[r][c] = !newGrid[r][c];
      return newGrid;
    });
  };

  const handleReset = () => {
    if (!puzzleData) return;
    setPlayerGrid(Array(puzzleData.rows).fill(null).map(() => Array(puzzleData.cols).fill(false)));
    resetGameState();
  };

  const handleGiveUp = () => {
    if (!puzzleData || !isPlaying) return;
    setPlayerGrid(puzzleData.solution.map(row => [...row]));
    giveUp();
  };

  if (!puzzleData) return null;

  const getBorderStyles = (r, c) => {
    const regionId = puzzleData.regions[r][c];
    const borders = {};
    const borderColor = 'rgba(255, 255, 255, 0.5)';

    if (r === 0 || puzzleData.regions[r-1][c] !== regionId) {
      borders.borderTop = `2px solid ${borderColor}`;
    }
    if (r === puzzleData.rows - 1 || puzzleData.regions[r+1]?.[c] !== regionId) {
      borders.borderBottom = `2px solid ${borderColor}`;
    }
    if (c === 0 || puzzleData.regions[r][c-1] !== regionId) {
      borders.borderLeft = `2px solid ${borderColor}`;
    }
    if (c === puzzleData.cols - 1 || puzzleData.regions[r][c+1] !== regionId) {
      borders.borderRight = `2px solid ${borderColor}`;
    }

    return borders;
  };

  return (
    <div className={styles.container}>
      <GameHeader
        title="Norinori"
        instructions="Shade cells to form dominoes (pairs of adjacent cells). Each region must contain exactly 2 shaded cells. Dominoes can span multiple regions."
      />

      <SizeSelector
        sizes={Object.keys(GRID_SIZES)}
        selected={sizeKey}
        onSelect={setSizeKey}
      />

      <DifficultySelector
        difficulties={DIFFICULTIES}
        selected={difficulty}
        onSelect={setDifficulty}
      />

      <div className={styles.gameArea}>
        <div
          className={styles.grid}
          style={{
            gridTemplateColumns: `repeat(${puzzleData.cols}, 1fr)`,
            width: `${puzzleData.cols * 40}px`,
            height: `${puzzleData.rows * 40}px`,
          }}
        >
          {playerGrid.map((row, r) =>
            row.map((isShaded, c) => {
              const regionId = puzzleData.regions[r][c];
              const regionColor = REGION_COLORS[regionId % REGION_COLORS.length];
              const hasError = errors.has(`${r},${c}`);
              const borderStyles = getBorderStyles(r, c);

              return (
                <button
                  key={`${r}-${c}`}
                  className={`
                    ${styles.cell}
                    ${isShaded ? styles.shaded : ''}
                    ${hasError ? styles.error : ''}
                  `}
                  style={{
                    ...borderStyles,
                    backgroundColor: isShaded ? 'rgba(139, 92, 246, 0.8)' : regionColor,
                  }}
                  onClick={() => handleCellClick(r, c)}
                />
              );
            })
          )}
        </div>

        {gameState === 'won' && (
          <GameResult
            state="won"
            title="🎉 Puzzle Solved!"
            message="All dominoes correctly placed!"
          />
        )}

        {gameState === 'gaveUp' && (
          <GameResult
            state="gaveup"
            title="Solution Revealed"
            message="Here's how it should be solved."
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
          <button className={styles.resetBtn} onClick={handleReset}>
            Reset
          </button>
          <GiveUpButton
            onGiveUp={handleGiveUp}
            disabled={!isPlaying}
          />
          <button className={styles.newGameBtn} onClick={initGame}>
            New Puzzle
          </button>
        </div>
      </div>
    </div>
  );
}
