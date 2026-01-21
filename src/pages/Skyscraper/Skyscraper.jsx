import { useState, useEffect, useCallback } from 'react';
import GameHeader from '../../components/GameHeader';
import SizeSelector from '../../components/SizeSelector';
import DifficultySelector from '../../components/DifficultySelector';
import GiveUpButton from '../../components/GiveUpButton';
import GameResult from '../../components/GameResult';
import { useGameState } from '../../hooks/useGameState';
import styles from './Skyscraper.module.css';

const GRID_SIZES = {
  '4×4': 4,
  '5×5': 5,
  '6×6': 6,
  '7×7': 7,
  '8×8': 8,
};

// Calculate how many buildings are visible from one direction
function countVisible(heights) {
  let max = 0;
  let count = 0;
  for (const h of heights) {
    if (h > max) {
      count++;
      max = h;
    }
  }
  return count;
}

function checkValidity(grid, clues) {
  const size = grid.length;
  const errors = new Set();

  // Check rows for duplicates
  for (let r = 0; r < size; r++) {
    const seen = new Map();
    for (let c = 0; c < size; c++) {
      const val = grid[r][c];
      if (val === 0) continue;
      if (seen.has(val)) {
        errors.add(`${r},${c}`);
        errors.add(`${r},${seen.get(val)}`);
      } else {
        seen.set(val, c);
      }
    }
  }

  // Check columns for duplicates
  for (let c = 0; c < size; c++) {
    const seen = new Map();
    for (let r = 0; r < size; r++) {
      const val = grid[r][c];
      if (val === 0) continue;
      if (seen.has(val)) {
        errors.add(`${r},${c}`);
        errors.add(`${seen.get(val)},${c}`);
      } else {
        seen.set(val, r);
      }
    }
  }

  // Check clues (only for complete rows/columns)
  // Top clues
  for (let c = 0; c < size; c++) {
    if (!clues.top[c]) continue;
    const col = [];
    let complete = true;
    for (let r = 0; r < size; r++) {
      if (grid[r][c] === 0) { complete = false; break; }
      col.push(grid[r][c]);
    }
    if (complete && countVisible(col) !== clues.top[c]) {
      for (let r = 0; r < size; r++) {
        errors.add(`${r},${c}`);
      }
    }
  }

  // Bottom clues
  for (let c = 0; c < size; c++) {
    if (!clues.bottom[c]) continue;
    const col = [];
    let complete = true;
    for (let r = size - 1; r >= 0; r--) {
      if (grid[r][c] === 0) { complete = false; break; }
      col.push(grid[r][c]);
    }
    if (complete && countVisible(col) !== clues.bottom[c]) {
      for (let r = 0; r < size; r++) {
        errors.add(`${r},${c}`);
      }
    }
  }

  // Left clues
  for (let r = 0; r < size; r++) {
    if (!clues.left[r]) continue;
    let complete = true;
    for (let c = 0; c < size; c++) {
      if (grid[r][c] === 0) { complete = false; break; }
    }
    if (complete && countVisible(grid[r]) !== clues.left[r]) {
      for (let c = 0; c < size; c++) {
        errors.add(`${r},${c}`);
      }
    }
  }

  // Right clues
  for (let r = 0; r < size; r++) {
    if (!clues.right[r]) continue;
    let complete = true;
    for (let c = 0; c < size; c++) {
      if (grid[r][c] === 0) { complete = false; break; }
    }
    if (complete && countVisible([...grid[r]].reverse()) !== clues.right[r]) {
      for (let c = 0; c < size; c++) {
        errors.add(`${r},${c}`);
      }
    }
  }

  return errors;
}

function checkSolved(grid, solution) {
  const size = grid.length;
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (grid[r][c] !== solution[r][c]) return false;
    }
  }
  return true;
}

// Export helpers for testing
export {
  GRID_SIZES,
  countVisible,
  checkValidity,
  checkSolved,
};

export default function Skyscraper() {
  const { t } = useTranslation();
  const [sizeKey, setSizeKey] = useState('5×5');
  const [difficulty, setDifficulty] = useState('easy');
  const [allPuzzles, setAllPuzzles] = useState([]);
  const [puzzleData, setPuzzleData] = useState(null);
  const [grid, setGrid] = useState([]);
  const [selected, setSelected] = useState(null);
  const { gameState, checkWin, giveUp, reset: resetGameState, isPlaying } = useGameState();
  const [errors, setErrors] = useState(new Set());
  const [showErrors, setShowErrors] = useState(true);
  const [loading, setLoading] = useState(true);

  const size = GRID_SIZES[sizeKey];

  // Load puzzles from dataset
  useEffect(() => {
    fetch('/datasets/skyscraperPuzzles.json')
      .then(res => res.json())
      .then(data => {
        setAllPuzzles(data.puzzles || []);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load Skyscraper puzzles:', err);
        setLoading(false);
      });
  }, []);

  const initGame = useCallback(() => {
    if (allPuzzles.length === 0) return;

    let available = allPuzzles.filter(p =>
      p.rows === size && p.cols === size && p.difficulty === difficulty
    );

    if (available.length === 0) {
      available = allPuzzles.filter(p => p.rows === size && p.cols === size);
    }

    if (available.length === 0) {
      const sizes = [...new Set(allPuzzles.filter(p => p.rows === p.cols).map(p => p.rows))].sort((a,b) => a-b);
      const closest = sizes.reduce((prev, curr) => Math.abs(curr - size) < Math.abs(prev - size) ? curr : prev, sizes[0]);
      available = allPuzzles.filter(p => p.rows === closest && p.cols === closest);
    }

    if (available.length === 0) return;

    const puzzle = available[Math.floor(Math.random() * available.length)];
    const puzzleSize = puzzle.rows;

    setPuzzleData({
      clues: puzzle.clues,
      solution: puzzle.solution,
      size: puzzleSize
    });
    // Initialize empty grid
    setGrid(Array(puzzleSize).fill(null).map(() => Array(puzzleSize).fill(0)));
    setSelected(null);
    resetGameState();
    setErrors(new Set());
  }, [allPuzzles, size, difficulty]);

  useEffect(() => {
    if (!loading && allPuzzles.length > 0) {
      initGame();
    }
  }, [loading, allPuzzles, initGame]);

  useEffect(() => {
    if (!puzzleData || !isPlaying) return;

    const newErrors = showErrors ? checkValidity(grid, puzzleData.clues) : new Set();
    setErrors(newErrors);

    checkWin(checkSolved(grid, puzzleData.solution));
  }, [grid, puzzleData, showErrors, isPlaying, checkWin]);

  // Keyboard input
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!selected || !isPlaying) return;
      const [r, c] = selected;
      const gridSize = puzzleData?.size || size;

      if (e.key >= '1' && e.key <= String(gridSize)) {
        const num = parseInt(e.key, 10);
        setGrid(prev => {
          const newGrid = prev.map(row => [...row]);
          newGrid[r][c] = newGrid[r][c] === num ? 0 : num;
          return newGrid;
        });
      } else if (e.key === 'Backspace' || e.key === 'Delete' || e.key === '0') {
        setGrid(prev => {
          const newGrid = prev.map(row => [...row]);
          newGrid[r][c] = 0;
          return newGrid;
        });
      } else if (e.key.startsWith('Arrow')) {
        e.preventDefault();
        let [nr, nc] = selected;
        if (e.key === 'ArrowUp') nr = Math.max(0, nr - 1);
        else if (e.key === 'ArrowDown') nr = Math.min(gridSize - 1, nr + 1);
        else if (e.key === 'ArrowLeft') nc = Math.max(0, nc - 1);
        else if (e.key === 'ArrowRight') nc = Math.min(gridSize - 1, nc + 1);
        setSelected([nr, nc]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selected, gameState, puzzleData, size]);

  const handleCellClick = (r, c) => {
    if (!isPlaying) return;
    setSelected([r, c]);
  };

  const handleNumberClick = (num) => {
    if (!selected || !isPlaying) return;
    const [r, c] = selected;
    const gridSize = puzzleData?.size || size;
    if (num > gridSize) return;

    setGrid(prev => {
      const newGrid = prev.map(row => [...row]);
      newGrid[r][c] = newGrid[r][c] === num ? 0 : num;
      return newGrid;
    });
  };

  const handleReset = () => {
    const gridSize = puzzleData?.size || size;
    setGrid(Array(gridSize).fill(null).map(() => Array(gridSize).fill(0)));
    setSelected(null);
    resetGameState();
  };

  const handleGiveUp = () => {
    if (!puzzleData || !isPlaying) return;
    setGrid(puzzleData.solution.map(row => [...row]));
    setSelected(null);
    giveUp();
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <GameHeader
          title="Skyscraper"
          instructions="Loading puzzles..."
        />
        <div className={styles.loading}>{t('common.loadingPuzzles')}</div>
      </div>
    );
  }

  if (!puzzleData) return null;

  const gridSize = puzzleData.size || size;

  return (
    <div className={styles.container}>
      <GameHeader
        title="Skyscraper"
        instructions={`Fill each cell with a number from 1-${gridSize}. Each row and column must contain each number exactly once. The clues on the edges tell you how many skyscrapers are visible from that direction (taller buildings block shorter ones behind them).`}
      />

      <SizeSelector
        sizes={Object.keys(GRID_SIZES)}
        selected={sizeKey}
        onSelect={setSizeKey}
      />

      <DifficultySelector
        difficulties={['easy', 'medium', 'hard']}
        selected={difficulty}
        onSelect={setDifficulty}
      />

      <div className={styles.gameArea}>
        <div className={styles.puzzleContainer}>
          {/* Top clues */}
          <div className={styles.clueRow}>
            <div className={styles.corner}></div>
            {puzzleData.clues.top.map((clue, c) => (
              <div key={c} className={styles.clue}>
                {clue || ''}
              </div>
            ))}
            <div className={styles.corner}></div>
          </div>

          {/* Grid with left and right clues */}
          {grid.map((row, r) => (
            <div key={r} className={styles.gridRow}>
              <div className={styles.clue}>{puzzleData.clues.left[r] || ''}</div>
              {row.map((cell, c) => {
                const isSelected = selected && selected[0] === r && selected[1] === c;
                const hasError = errors.has(`${r},${c}`);

                return (
                  <button
                    key={c}
                    className={`
                      ${styles.cell}
                      ${isSelected ? styles.selected : ''}
                      ${hasError ? styles.error : ''}
                    `}
                    onClick={() => handleCellClick(r, c)}
                  >
                    {cell !== 0 && (
                      <div
                        className={styles.building}
                        style={{ height: `${(cell / gridSize) * 100}%` }}
                      >
                        {cell}
                      </div>
                    )}
                  </button>
                );
              })}
              <div className={styles.clue}>{puzzleData.clues.right[r] || ''}</div>
            </div>
          ))}

          {/* Bottom clues */}
          <div className={styles.clueRow}>
            <div className={styles.corner}></div>
            {puzzleData.clues.bottom.map((clue, c) => (
              <div key={c} className={styles.clue}>
                {clue || ''}
              </div>
            ))}
            <div className={styles.corner}></div>
          </div>
        </div>

        {gameState === 'won' && (
          <GameResult
            state="won"
            title={t('gameStatus.solved')}
            message={t('common.allSkyscrapersPlaced', 'All skyscrapers correctly placed!')}
          />
        )}

        {gameState === 'gaveUp' && (
          <GameResult
            state="gaveup"
            title="Solution Revealed"
            message="Study the pattern and try another puzzle!"
          />
        )}

        <div className={styles.numberPad}>
          {Array.from({ length: gridSize }, (_, i) => i + 1).map((num) => (
            <button
              key={num}
              className={styles.numberBtn}
              onClick={() => handleNumberClick(num)}
              disabled={!isPlaying}
            >
              {num}
            </button>
          ))}
          <button
            className={styles.numberBtn}
            onClick={() => selected && setGrid(prev => {
              const newGrid = prev.map(row => [...row]);
              newGrid[selected[0]][selected[1]] = 0;
              return newGrid;
            })}
            disabled={!isPlaying || !selected}
          >
            ✕
          </button>
        </div>

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
