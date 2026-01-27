import { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import GameHeader from '../../components/GameHeader';
import DifficultySelector from '../../components/DifficultySelector';
import SizeSelector from '../../components/SizeSelector';
import GiveUpButton from '../../components/GiveUpButton';
import GameResult from '../../components/GameResult';
import { useGameState } from '../../hooks/useGameState';
import { useGameStats } from '../../hooks/useGameStats';
import { createSeededRandom } from '../../data/wordUtils';
import styles from './GokigenNaname.module.css';
import gokigenPuzzles from '../../../public/datasets/gokigennanamePuzzles.json';

const DIFFICULTIES = ['easy', 'medium', 'hard'];

// Get available sizes from dataset for a given difficulty
function getAvailableSizes(difficulty) {
  const sizes = new Set();
  gokigenPuzzles.puzzles.forEach(p => {
    if (p.difficulty === difficulty) {
      sizes.add(`${p.cols}x${p.rows}`);
    }
  });
  return Array.from(sizes).sort((a, b) => {
    const [aw, ah] = a.split('x').map(Number);
    const [bw, bh] = b.split('x').map(Number);
    return (aw * ah) - (bw * bh);
  }).slice(0, 6); // Limit to 6 sizes for UI
}

// Calculate clue at vertex (count of slashes touching that vertex)
function calculateVertexClue(grid, r, c, rows, cols) {
  let count = 0;

  // Check the 4 cells around this vertex (if they exist)
  // Top-left cell (r-1, c-1): '\' touches bottom-right corner
  if (r > 0 && c > 0 && grid[r-1][c-1] === '\\') count++;
  // Top-right cell (r-1, c): '/' touches bottom-left corner
  if (r > 0 && c < cols && grid[r-1][c] === '/') count++;
  // Bottom-left cell (r, c-1): '/' touches top-right corner
  if (r < rows && c > 0 && grid[r][c-1] === '/') count++;
  // Bottom-right cell (r, c): '\' touches top-left corner
  if (r < rows && c < cols && grid[r][c] === '\\') count++;

  return count;
}

// Safe accessor for clues array (handles incomplete arrays)
function getClueValue(clues, r, c) {
  if (!clues || r >= clues.length) return null;
  if (c >= clues[r].length) return null;
  return clues[r][c];
}

function checkValidity(grid, clues, rows, cols) {
  const errors = new Set();

  // Check each clue
  for (let r = 0; r <= rows; r++) {
    for (let c = 0; c <= cols; c++) {
      const clue = getClueValue(clues, r, c);
      if (clue === null) continue;

      const currentCount = calculateVertexClue(grid, r, c, rows, cols);

      // Error if count exceeds clue
      if (currentCount > clue) {
        // Mark adjacent cells as errors
        if (r > 0 && c > 0 && grid[r-1][c-1] === '\\') errors.add(`${r-1},${c-1}`);
        if (r > 0 && c < cols && grid[r-1][c] === '/') errors.add(`${r-1},${c}`);
        if (r < rows && c > 0 && grid[r][c-1] === '/') errors.add(`${r},${c-1}`);
        if (r < rows && c < cols && grid[r][c] === '\\') errors.add(`${r},${c}`);
      }
    }
  }

  return errors;
}

function checkSolved(grid, clues, rows, cols) {
  // Check all cells are filled
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (!grid[r][c]) return false;
    }
  }

  // Check all clues are satisfied
  for (let r = 0; r <= rows; r++) {
    for (let c = 0; c <= cols; c++) {
      const clue = getClueValue(clues, r, c);
      if (clue === null) continue;
      if (calculateVertexClue(grid, r, c, rows, cols) !== clue) return false;
    }
  }

  return true;
}

// Export helpers for testing
export {
  DIFFICULTIES,
  getAvailableSizes,
  calculateVertexClue,
  getClueValue,
  checkValidity,
  checkSolved,
};

export default function GokigenNaname() {
  const { t } = useTranslation();
  const [difficulty, setDifficulty] = useState('easy');
  const [sizeKey, setSizeKey] = useState('6x6');
  const [puzzleData, setPuzzleData] = useState(null);
  const [grid, setGrid] = useState([]);
  const { gameState, checkWin, giveUp, reset: resetGameState, isPlaying } = useGameState();
  const [errors, setErrors] = useState(new Set());
  const [showErrors, setShowErrors] = useState(false);

  const availableSizes = useMemo(() => getAvailableSizes(difficulty), [difficulty]);

  useEffect(() => {
    if (!sizeKey || !availableSizes.includes(sizeKey)) {
      if (availableSizes.length > 0) {
        setSizeKey(availableSizes[0]);
      }
    }
  }, [sizeKey, availableSizes]);

  const initGame = useCallback(() => {
    const [cols, rows] = sizeKey.split('x').map(Number);

    const filtered = gokigenPuzzles.puzzles.filter(
      p => p.difficulty === difficulty && p.cols === cols && p.rows === rows
    );

    if (filtered.length === 0) {
      // Fallback to any puzzle of this difficulty
      const fallback = gokigenPuzzles.puzzles.filter(p => p.difficulty === difficulty);
      if (fallback.length > 0) {
        const random = createSeededRandom(Date.now());
        const selected = fallback[Math.floor(random() * fallback.length)];
        setPuzzleData(selected);
        setGrid(Array(selected.rows).fill(null).map(() => Array(selected.cols).fill(null)));
        resetGameState();
        setErrors(new Set());
        return;
      }
    }

    const random = createSeededRandom(Date.now());
    const selected = filtered[Math.floor(random() * filtered.length)];
    setPuzzleData(selected);
    setGrid(Array(selected.rows).fill(null).map(() => Array(selected.cols).fill(null)));
    resetGameState();
    setErrors(new Set());
  }, [difficulty, sizeKey, resetGameState]);

  useEffect(() => {
    initGame();
  }, [initGame]);

  const rows = puzzleData?.rows || 6;
  const cols = puzzleData?.cols || 6;

  // Safe accessor for clues - handles dataset where clues array might be rows x (cols+1)
  // instead of (rows+1) x (cols+1)
  const getClue = (vr, vc) => {
    if (!puzzleData?.clues) return null;
    if (vr >= puzzleData.clues.length) return null;
    if (vc >= puzzleData.clues[vr].length) return null;
    return puzzleData.clues[vr][vc];
  };

  useEffect(() => {
    if (!puzzleData || !isPlaying) return;

    const newErrors = showErrors
      ? checkValidity(grid, puzzleData.clues, rows, cols)
      : new Set();
    setErrors(newErrors);

    checkWin(checkSolved(grid, puzzleData.clues, rows, cols));
  }, [grid, puzzleData, showErrors, rows, cols, isPlaying, checkWin]);

  const handleCellClick = (r, c) => {
    if (!isPlaying) return;

    // Cycle through: empty -> / -> \ -> empty
    setGrid(prev => {
      const newGrid = prev.map(row => [...row]);
      if (newGrid[r][c] === null) {
        newGrid[r][c] = '/';
      } else if (newGrid[r][c] === '/') {
        newGrid[r][c] = '\\';
      } else {
        newGrid[r][c] = null;
      }
      return newGrid;
    });
  };

  const handleReset = () => {
    if (!puzzleData) return;
    setGrid(Array(rows).fill(null).map(() => Array(cols).fill(null)));
    resetGameState();
  };

  const handleGiveUp = () => {
    if (!puzzleData || !isPlaying) return;
    setGrid(puzzleData.solution.map(row => [...row]));
    giveUp();
  };

  if (!puzzleData) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>{t('common.loadingPuzzle')}</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <GameHeader
        title="Gokigen Naname"
        instructions="Draw diagonal lines in each cell. Numbers at intersections show how many lines meet at that point. Click cells to cycle between / and \."
      />

      <DifficultySelector
        difficulties={DIFFICULTIES}
        selected={difficulty}
        onSelect={setDifficulty}
      />

      <SizeSelector
        sizes={availableSizes}
        selected={sizeKey}
        onSelect={setSizeKey}
      />

      <div className={styles.gameArea}>
        <div className={styles.gridWrapper}>
          {/* Render the grid with vertex clues */}
          <div
            className={styles.board}
            style={{
              gridTemplateColumns: `repeat(${cols * 2 + 1}, 1fr)`,
              gridTemplateRows: `repeat(${rows * 2 + 1}, 1fr)`
            }}
          >
            {Array(rows * 2 + 1).fill(null).map((_, row) =>
              Array(cols * 2 + 1).fill(null).map((_, col) => {
                const isVertex = row % 2 === 0 && col % 2 === 0;
                const isCell = row % 2 === 1 && col % 2 === 1;

                if (isVertex) {
                  const vr = row / 2;
                  const vc = col / 2;
                  const clue = getClue(vr, vc);

                  return (
                    <div key={`${row}-${col}`} className={styles.vertex}>
                      {clue !== null && <span className={styles.clue}>{clue}</span>}
                    </div>
                  );
                } else if (isCell) {
                  const cr = (row - 1) / 2;
                  const cc = (col - 1) / 2;
                  const value = grid[cr][cc];
                  const hasError = errors.has(`${cr},${cc}`);

                  return (
                    <button
                      key={`${row}-${col}`}
                      className={`
                        ${styles.cell}
                        ${hasError ? styles.error : ''}
                      `}
                      onClick={() => handleCellClick(cr, cc)}
                    >
                      {value && (
                        <div className={`${styles.slash} ${value === '/' ? styles.forward : styles.backward}`} />
                      )}
                    </button>
                  );
                } else {
                  return <div key={`${row}-${col}`} className={styles.edge} />;
                }
              })
            )}
          </div>
        </div>

        {gameState === 'won' && (
          <GameResult
            state="won"
            title={t('gameStatus.solved')}
            message={t('gameMessages.allSlashesInPlace')}
          />
        )}

        {gameState === 'gaveUp' && (
          <GameResult
            state="gaveup"
            title="Solution Revealed"
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
