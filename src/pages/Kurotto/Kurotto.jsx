import { useTranslation } from 'react-i18next';
import { useState, useEffect, useCallback, useMemo } from 'react';
import GameHeader from '../../components/GameHeader';
import DifficultySelector from '../../components/DifficultySelector';
import SizeSelector from '../../components/SizeSelector';
import GiveUpButton from '../../components/GiveUpButton';
import GameResult from '../../components/GameResult';
import { useGameState } from '../../hooks/useGameState';
import { useGameStats } from '../../hooks/useGameStats';
import styles from './Kurotto.module.css';
import kurottoPuzzles from '../../../public/datasets/kurottoPuzzles.json';

const DIFFICULTIES = ['easy', 'medium', 'hard'];

// Get available sizes from dataset for a given difficulty
function getAvailableSizes(difficulty) {
  const sizes = new Set();
  kurottoPuzzles.puzzles.forEach(p => {
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

// Parse dataset puzzle
function parseDatasetPuzzle(puzzle) {
  const { rows, cols, clues, solution } = puzzle;
  // Solution uses 'x' for shaded cells
  const parsedSolution = solution.map(row =>
    row.map(cell => cell === 'x')
  );
  return {
    clues,
    solution: parsedSolution,
    rows,
    cols
  };
}

// Calculate clue value for a cell (sum of orthogonally adjacent shaded group sizes)
function calculateClueValue(solution, r, c, size) {
  const visited = new Set();
  let totalSum = 0;

  // Check each orthogonal neighbor
  for (const [nr, nc] of [[r-1, c], [r+1, c], [r, c-1], [r, c+1]]) {
    if (nr < 0 || nr >= size || nc < 0 || nc >= size) continue;
    if (!solution[nr][nc]) continue;

    const key = `${nr},${nc}`;
    if (visited.has(key)) continue;

    // BFS to find the shaded group containing this neighbor
    const groupCells = [];
    const queue = [[nr, nc]];
    visited.add(key);

    while (queue.length > 0) {
      const [cr, cc] = queue.shift();
      groupCells.push([cr, cc]);

      for (const [nnr, nnc] of [[cr-1, cc], [cr+1, cc], [cr, cc-1], [cr, cc+1]]) {
        if (nnr < 0 || nnr >= size || nnc < 0 || nnc >= size) continue;
        const nKey = `${nnr},${nnc}`;
        if (visited.has(nKey) || !solution[nnr][nnc]) continue;
        visited.add(nKey);
        queue.push([nnr, nnc]);
      }
    }

    totalSum += groupCells.length;
  }

  return totalSum;
}

function checkValidity(grid, clues, size) {
  const errors = new Set();

  // Check each clue
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (clues[r][c] === null) continue;
      if (grid[r][c] === true) {
        // Clue cell is shaded - error
        errors.add(`${r},${c}`);
        continue;
      }

      // Calculate current sum of adjacent shaded groups
      const currentSum = calculateClueValue(grid, r, c, size);

      // Only show error if sum exceeds clue
      if (currentSum > clues[r][c]) {
        errors.add(`${r},${c}`);
      }
    }
  }

  return errors;
}

function checkSolved(grid, solution, size) {
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if ((grid[r][c] === true) !== solution[r][c]) return false;
    }
  }
  return true;
}

// Export helpers for testing
export {
  DIFFICULTIES,
  getAvailableSizes,
  parseDatasetPuzzle,
  calculateClueValue,
  checkValidity,
  checkSolved,
};

export default function Kurotto() {
  const { t } = useTranslation();
  const [difficulty, setDifficulty] = useState('medium');
  const [sizeKey, setSizeKey] = useState('10x10');
  const [puzzleData, setPuzzleData] = useState(null);
  const [grid, setGrid] = useState([]);
  const { gameState, checkWin, giveUp, reset: resetGameState, isPlaying } = useGameState();
  const [errors, setErrors] = useState(new Set());
  const [showErrors, setShowErrors] = useState(false);
  const [whiteMode, setWhiteMode] = useState(false); // Mobile white mode

  const availableSizes = useMemo(() => getAvailableSizes(difficulty), [difficulty]);

  // Update sizeKey when difficulty changes if current size not available
  useEffect(() => {
    if (availableSizes.length > 0 && !availableSizes.includes(sizeKey)) {
      setSizeKey(availableSizes[0]);
    }
  }, [availableSizes, sizeKey]);

  const initGame = useCallback(() => {
    const filtered = kurottoPuzzles.puzzles.filter(
      p => p.difficulty === difficulty && `${p.rows}x${p.cols}` === sizeKey
    );

    let selected;
    if (filtered.length === 0) {
      const fallback = kurottoPuzzles.puzzles.filter(p => p.difficulty === difficulty);
      if (fallback.length > 0) {
        selected = fallback[Math.floor(Math.random() * fallback.length)];
      } else {
        selected = kurottoPuzzles.puzzles[Math.floor(Math.random() * kurottoPuzzles.puzzles.length)];
      }
    } else {
      selected = filtered[Math.floor(Math.random() * filtered.length)];
    }

    const data = parseDatasetPuzzle(selected);
    setPuzzleData(data);
    setGrid(Array(data.rows).fill(null).map(() => Array(data.cols).fill(null)));
    resetGameState();
    setErrors(new Set());
  }, [difficulty, sizeKey, resetGameState]);

  useEffect(() => {
    initGame();
  }, [initGame]);

  const size = puzzleData?.rows || 10;

  useEffect(() => {
    if (!puzzleData || !isPlaying) return;

    const newErrors = showErrors
      ? checkValidity(grid, puzzleData.clues, size)
      : new Set();
    setErrors(newErrors);

    checkWin(checkSolved(grid, puzzleData.solution, size));
  }, [grid, puzzleData, showErrors, size, isPlaying, checkWin]);

  const handleCellClick = (r, c, e) => {
    if (!isPlaying) return;
    if (puzzleData.clues[r][c] !== null) return; // Can't shade clue cells

    const isWhiteAction = e.type === 'contextmenu' || e.ctrlKey || whiteMode;

    if (isWhiteAction) {
      if (e.type === 'contextmenu') e.preventDefault();
      // Mark as white
      setGrid(prev => {
        const newGrid = prev.map(row => [...row]);
        newGrid[r][c] = newGrid[r][c] === false ? null : false;
        return newGrid;
      });
    } else {
      // Shade
      setGrid(prev => {
        const newGrid = prev.map(row => [...row]);
        newGrid[r][c] = newGrid[r][c] === true ? null : true;
        return newGrid;
      });
    }
  };

  const handleReset = () => {
    setGrid(Array(size).fill(null).map(() => Array(size).fill(null)));
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
        title="Kurotto"
        instructions="Shade cells so each circled number equals the total size of all shaded groups orthogonally adjacent to that circle. Circled cells cannot be shaded."
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
        {/* Mobile White Toggle */}
        <button
          className={`${styles.whiteToggle} ${whiteMode ? styles.whiteModeActive : ''}`}
          onClick={() => setWhiteMode(!whiteMode)}
        >
          ○ {whiteMode ? 'White Mode ON' : 'White Mode'}
        </button>

        <div
          className={styles.grid}
          style={{ gridTemplateColumns: `repeat(${size}, 1fr)` }}
        >
          {Array(size).fill(null).map((_, r) =>
            Array(size).fill(null).map((_, c) => {
              const clue = puzzleData.clues[r][c];
              const hasClue = clue !== null;
              const isShaded = grid[r][c] === true;
              const isMarkedWhite = grid[r][c] === false;
              const hasError = errors.has(`${r},${c}`);

              return (
                <button
                  key={`${r}-${c}`}
                  className={`
                    ${styles.cell}
                    ${hasClue ? styles.clue : ''}
                    ${isShaded ? styles.shaded : ''}
                    ${isMarkedWhite ? styles.markedWhite : ''}
                    ${hasError ? styles.error : ''}
                  `}
                  onClick={(e) => handleCellClick(r, c, e)}
                  onContextMenu={(e) => handleCellClick(r, c, e)}
                  disabled={hasClue}
                >
                  {hasClue && <span className={styles.clueValue}>{clue}</span>}
                </button>
              );
            })
          )}
        </div>

        {gameState === 'won' && (
          <GameResult
            state="won"
            title="⭕ Puzzle Solved!"
            message="All clues satisfied!"
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

        <div className={styles.legend}>
          <span>Click: Shade cell</span>
          <span>Right-click: Mark white</span>
        </div>
      </div>
    </div>
  );
}
