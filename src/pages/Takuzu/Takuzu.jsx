import { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import GameHeader from '../../components/GameHeader';
import DifficultySelector from '../../components/DifficultySelector';
import SizeSelector from '../../components/SizeSelector';
import GiveUpButton from '../../components/GiveUpButton';
import GameResult from '../../components/GameResult';
import { useGameState } from '../../hooks/useGameState';
import styles from './Takuzu.module.css';
import binairoPuzzles from '../../../public/datasets/binairoPuzzles.json';

const DIFFICULTIES = ['easy', 'medium', 'hard'];

// Get available sizes from dataset for a given difficulty
function getAvailableSizes(difficulty) {
  const sizes = new Set();
  binairoPuzzles.puzzles.forEach(p => {
    if (p.difficulty === difficulty) {
      sizes.add(`${p.rows}x${p.cols}`);
    }
  });
  return Array.from(sizes).sort((a, b) => {
    const [ar, ac] = a.split('x').map(Number);
    const [br, bc] = b.split('x').map(Number);
    return (ar * ac) - (br * bc);
  });
}

// Parse dataset puzzle - converts 1,2 format to 0,1 format
function parseDatasetPuzzle(puzzle) {
  const { rows, cols, clues, solution } = puzzle;
  // Dataset uses 1,2 instead of 0,1 - convert them
  const parsedClues = clues.map(row =>
    row.map(cell => cell === null ? null : cell - 1)
  );
  const parsedSolution = solution.map(row =>
    row.map(cell => cell - 1)
  );
  return {
    puzzle: parsedClues,
    solution: parsedSolution,
    rows,
    cols
  };
}

// Check if current grid state is valid
function checkValidity(grid) {
  const size = grid.length;
  const errors = new Set();

  // Check rows for three in a row and counts
  for (let r = 0; r < size; r++) {
    let zeros = 0, ones = 0;
    for (let c = 0; c < size; c++) {
      if (grid[r][c] === 0) zeros++;
      if (grid[r][c] === 1) ones++;

      // Check three in a row
      if (c >= 2 && grid[r][c] !== null && grid[r][c] === grid[r][c-1] && grid[r][c] === grid[r][c-2]) {
        errors.add(`${r},${c}`);
        errors.add(`${r},${c-1}`);
        errors.add(`${r},${c-2}`);
      }
    }
    if (zeros > size / 2 || ones > size / 2) {
      for (let c = 0; c < size; c++) {
        if ((zeros > size / 2 && grid[r][c] === 0) || (ones > size / 2 && grid[r][c] === 1)) {
          errors.add(`${r},${c}`);
        }
      }
    }
  }

  // Check columns for three in a row and counts
  for (let c = 0; c < size; c++) {
    let zeros = 0, ones = 0;
    for (let r = 0; r < size; r++) {
      if (grid[r][c] === 0) zeros++;
      if (grid[r][c] === 1) ones++;

      // Check three in a row
      if (r >= 2 && grid[r][c] !== null && grid[r][c] === grid[r-1][c] && grid[r][c] === grid[r-2][c]) {
        errors.add(`${r},${c}`);
        errors.add(`${r-1},${c}`);
        errors.add(`${r-2},${c}`);
      }
    }
    if (zeros > size / 2 || ones > size / 2) {
      for (let r = 0; r < size; r++) {
        if ((zeros > size / 2 && grid[r][c] === 0) || (ones > size / 2 && grid[r][c] === 1)) {
          errors.add(`${r},${c}`);
        }
      }
    }
  }

  return errors;
}

// Check if puzzle is solved
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
  DIFFICULTIES,
  getAvailableSizes,
  parseDatasetPuzzle,
  checkValidity,
  checkSolved,
};

export default function Takuzu() {
  const { t } = useTranslation();
  const [difficulty, setDifficulty] = useState('medium');
  const [sizeKey, setSizeKey] = useState('10x10');
  const [puzzleData, setPuzzleData] = useState(null);
  const [grid, setGrid] = useState([]);
  const [fixed, setFixed] = useState([]);
  const { gameState, checkWin, giveUp, reset: resetGameState, isPlaying } = useGameState();
  const [errors, setErrors] = useState(new Set());
  const [showErrors, setShowErrors] = useState(false);

  const availableSizes = useMemo(() => getAvailableSizes(difficulty), [difficulty]);

  // Update sizeKey when difficulty changes if current size not available
  useEffect(() => {
    if (availableSizes.length > 0 && !availableSizes.includes(sizeKey)) {
      setSizeKey(availableSizes[0]);
    }
  }, [availableSizes, sizeKey]);

  const initGame = useCallback(() => {
    const filtered = binairoPuzzles.puzzles.filter(
      p => p.difficulty === difficulty && `${p.rows}x${p.cols}` === sizeKey
    );

    let selected;
    if (filtered.length === 0) {
      // Fallback to any puzzle of this difficulty
      const fallback = binairoPuzzles.puzzles.filter(p => p.difficulty === difficulty);
      if (fallback.length > 0) {
        selected = fallback[Math.floor(Math.random() * fallback.length)];
      } else {
        selected = binairoPuzzles.puzzles[Math.floor(Math.random() * binairoPuzzles.puzzles.length)];
      }
    } else {
      selected = filtered[Math.floor(Math.random() * filtered.length)];
    }

    const data = parseDatasetPuzzle(selected);
    setPuzzleData(data);
    setGrid(data.puzzle.map(row => [...row]));
    setFixed(data.puzzle.map(row => row.map(cell => cell !== null)));
    resetGameState();
    setErrors(new Set());
  }, [difficulty, sizeKey, resetGameState]);

  useEffect(() => {
    initGame();
  }, [initGame]);

  const size = puzzleData?.rows || 10;

  useEffect(() => {
    if (!puzzleData || !isPlaying) return;

    const newErrors = showErrors ? checkValidity(grid) : new Set();
    setErrors(newErrors);

    checkWin(checkSolved(grid, puzzleData.solution));
  }, [grid, puzzleData, showErrors, isPlaying, checkWin]);

  const handleCellClick = (r, c) => {
    if (!isPlaying || fixed[r][c]) return;

    setGrid(prev => {
      const newGrid = prev.map(row => [...row]);
      // Cycle: null -> 0 -> 1 -> null
      if (newGrid[r][c] === null) newGrid[r][c] = 0;
      else if (newGrid[r][c] === 0) newGrid[r][c] = 1;
      else newGrid[r][c] = null;
      return newGrid;
    });
  };

  const handleReset = () => {
    if (!puzzleData) return;
    setGrid(puzzleData.puzzle.map(row => [...row]));
    resetGameState();
  };

  const handleGiveUp = () => {
    if (!puzzleData || !isPlaying) return;
    setGrid(puzzleData.solution.map(row => [...row]));
    giveUp();
  };

  if (!puzzleData) return null;

  return (
    <div className={styles.container}>
      <GameHeader
        title="Takuzu"
        instructions="Fill the grid with 0s and 1s. No more than two consecutive same digits. Each row and column must have equal counts of 0s and 1s."
      />

      <DifficultySelector
        options={DIFFICULTIES}
        value={difficulty}
        onChange={setDifficulty}
        className={styles.difficultySelector}
      />

      <SizeSelector
        options={availableSizes}
        value={sizeKey}
        onChange={setSizeKey}
        className={styles.sizeSelector}
      />

      <div className={styles.gameArea}>
        <div
          className={styles.grid}
          style={{
            gridTemplateColumns: `repeat(${size}, 1fr)`,
            width: `${size * 45}px`,
            height: `${size * 45}px`,
          }}
        >
          {grid.map((row, r) =>
            row.map((cell, c) => {
              const isFixed = fixed[r][c];
              const hasError = errors.has(`${r},${c}`);

              return (
                <button
                  key={`${r}-${c}`}
                  className={`
                    ${styles.cell}
                    ${isFixed ? styles.fixed : ''}
                    ${hasError ? styles.error : ''}
                    ${cell === 1 ? styles.one : ''}
                    ${cell === 2 ? styles.two : ''}
                  `}
                  onClick={() => handleCellClick(r, c)}
                  disabled={isFixed}
                >
                  {cell !== null && <span className={styles.value}>{cell === 1 ? '0' : '1'}</span>}
                </button>
              );
            })
          )}
        </div>

        {gameState === 'won' && (
          <GameResult
            state="won"
            title={t('gameStatus.solved')}
            message={t('gameMessages.binaryBalanceAchieved')}
            actions={[{ label: 'New Puzzle', onClick: initGame, primary: true }]}
          />
        )}

        {gameState === 'gaveUp' && (
          <GameResult
            state="gaveup"
            message="Better luck next time!"
            actions={[{ label: 'New Puzzle', onClick: initGame, primary: true }]}
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
