import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import GameHeader from '../../components/GameHeader';
import SizeSelector from '../../components/SizeSelector';
import DifficultySelector from '../../components/DifficultySelector';
import GiveUpButton from '../../components/GiveUpButton';
import GameResult from '../../components/GameResult';
import { useGameState } from '../../hooks/useGameState';
import { useGameStats } from '../../hooks/useGameStats';
import styles from './Nurikabe.module.css';

const GRID_SIZES = {
  '5×5': 5,
  '7×7': 7,
  '10×10': 10,
  '12×12': 12,
  '15×15': 15,
};

// Validation functions
function checkValidity(grid, shaded) {
  const size = grid.length;
  const errors = new Set();

  // Check for 2x2 sea squares
  for (let r = 0; r < size - 1; r++) {
    for (let c = 0; c < size - 1; c++) {
      if (shaded[r][c] && shaded[r+1][c] && shaded[r][c+1] && shaded[r+1][c+1]) {
        errors.add(`${r},${c}`);
        errors.add(`${r+1},${c}`);
        errors.add(`${r},${c+1}`);
        errors.add(`${r+1},${c+1}`);
      }
    }
  }

  // Check all unshaded regions (islands)
  const visited = Array(size).fill(null).map(() => Array(size).fill(false));

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (visited[r][c] || shaded[r][c]) continue;

      // BFS to find island size
      const queue = [[r, c]];
      const islandCells = [];
      const numbersFound = [];

      while (queue.length > 0) {
        const [cr, cc] = queue.shift();
        if (visited[cr][cc] || shaded[cr][cc]) continue;
        visited[cr][cc] = true;
        islandCells.push([cr, cc]);

        if (grid[cr][cc] !== null) {
          numbersFound.push({ r: cr, c: cc, value: grid[cr][cc] });
        }

        for (const [nr, nc] of [[cr-1,cc], [cr+1,cc], [cr,cc-1], [cr,cc+1]]) {
          if (nr >= 0 && nr < size && nc >= 0 && nc < size &&
              !visited[nr][nc] && !shaded[nr][nc]) {
            queue.push([nr, nc]);
          }
        }
      }

      // Check for errors in this island
      if (numbersFound.length > 1) {
        // Two or more numbers in same island - error
        for (const [ir, ic] of islandCells) {
          errors.add(`${ir},${ic}`);
        }
      } else if (numbersFound.length === 1) {
        // Check if island size exceeds the number
        if (islandCells.length > numbersFound[0].value) {
          for (const [ir, ic] of islandCells) {
            errors.add(`${ir},${ic}`);
          }
        }
      }
    }
  }

  return errors;
}

function checkSolved(grid, shaded) {
  const size = grid.length;

  // Check for 2x2 sea squares
  for (let r = 0; r < size - 1; r++) {
    for (let c = 0; c < size - 1; c++) {
      if (shaded[r][c] && shaded[r+1][c] && shaded[r][c+1] && shaded[r+1][c+1]) {
        return false;
      }
    }
  }

  // Check all sea cells are connected
  let firstSea = null;
  for (let r = 0; r < size && !firstSea; r++) {
    for (let c = 0; c < size && !firstSea; c++) {
      if (shaded[r][c]) firstSea = [r, c];
    }
  }

  if (firstSea) {
    const visited = Array(size).fill(null).map(() => Array(size).fill(false));
    const queue = [firstSea];
    let seaCount = 0;

    while (queue.length > 0) {
      const [r, c] = queue.shift();
      if (visited[r][c] || !shaded[r][c]) continue;
      visited[r][c] = true;
      seaCount++;

      for (const [nr, nc] of [[r-1,c], [r+1,c], [r,c-1], [r,c+1]]) {
        if (nr >= 0 && nr < size && nc >= 0 && nc < size &&
            !visited[nr][nc] && shaded[nr][nc]) {
          queue.push([nr, nc]);
        }
      }
    }

    // Count total sea cells
    let totalSea = 0;
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (shaded[r][c]) totalSea++;
      }
    }

    if (seaCount !== totalSea) return false;
  }

  // Check each island has correct size and one number
  const visited = Array(size).fill(null).map(() => Array(size).fill(false));

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (visited[r][c] || shaded[r][c]) continue;

      const queue = [[r, c]];
      const islandCells = [];
      let numberCount = 0;
      let numberValue = null;

      while (queue.length > 0) {
        const [cr, cc] = queue.shift();
        if (visited[cr][cc] || shaded[cr][cc]) continue;
        visited[cr][cc] = true;
        islandCells.push([cr, cc]);

        if (grid[cr][cc] !== null) {
          numberCount++;
          numberValue = grid[cr][cc];
        }

        for (const [nr, nc] of [[cr-1,cc], [cr+1,cc], [cr,cc-1], [cr,cc+1]]) {
          if (nr >= 0 && nr < size && nc >= 0 && nc < size &&
              !visited[nr][nc] && !shaded[nr][nc]) {
            queue.push([nr, nc]);
          }
        }
      }

      if (numberCount !== 1) return false;
      if (islandCells.length !== numberValue) return false;
    }
  }

  return true;
}

// Export helpers for testing
export {
  GRID_SIZES,
  checkValidity,
  checkSolved,
};

export default function Nurikabe() {
  const { t } = useTranslation();
  const [sizeKey, setSizeKey] = useState('10×10');
  const [difficulty, setDifficulty] = useState('easy');
  const [allPuzzles, setAllPuzzles] = useState([]);
  const [puzzleData, setPuzzleData] = useState(null);
  const [shaded, setShaded] = useState([]);
  const [marked, setMarked] = useState([]);
  const { gameState, checkWin, giveUp, reset: resetGameState, isPlaying } = useGameState();
  const [errors, setErrors] = useState(new Set());
  const [showErrors, setShowErrors] = useState(false);
  const [showSolution, setShowSolution] = useState(false);
  const [islandMode, setIslandMode] = useState(false);
  const [loading, setLoading] = useState(true);

  const size = GRID_SIZES[sizeKey];

  // Load puzzles from dataset
  useEffect(() => {
    fetch('/datasets/nurikabePuzzles.json')
      .then(res => res.json())
      .then(data => {
        setAllPuzzles(data.puzzles || []);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load Nurikabe puzzles:', err);
        setLoading(false);
      });
  }, []);

  const initGame = useCallback(() => {
    if (allPuzzles.length === 0) return;

    // Filter by size and difficulty
    let available = allPuzzles.filter(p =>
      p.rows === size && p.cols === size && p.difficulty === difficulty
    );

    // Fallback to just size if no difficulty match
    if (available.length === 0) {
      available = allPuzzles.filter(p => p.rows === size && p.cols === size);
    }

    // Fallback to closest size
    if (available.length === 0) {
      const sizes = [...new Set(allPuzzles.filter(p => p.rows === p.cols).map(p => p.rows))].sort((a,b) => a-b);
      const closest = sizes.reduce((prev, curr) => Math.abs(curr - size) < Math.abs(prev - size) ? curr : prev, sizes[0]);
      available = allPuzzles.filter(p => p.rows === closest && p.cols === closest);
    }

    if (available.length === 0) {
      console.error('No puzzles available');
      return;
    }

    const puzzle = available[Math.floor(Math.random() * available.length)];
    const puzzleSize = puzzle.rows;

    setPuzzleData({
      grid: puzzle.clues,
      solution: puzzle.solution,
      size: puzzleSize
    });
    setShaded(Array(puzzleSize).fill(null).map(() => Array(puzzleSize).fill(false)));
    setMarked(Array(puzzleSize).fill(null).map(() => Array(puzzleSize).fill(false)));
    resetGameState();
    setErrors(new Set());
    setShowSolution(false);
  }, [allPuzzles, size, difficulty, resetGameState]);

  useEffect(() => {
    if (!loading && allPuzzles.length > 0) {
    initGame();
    }
  }, [loading, allPuzzles, initGame]);

  useEffect(() => {
    if (!puzzleData || !isPlaying) return;

    const newErrors = showErrors ? checkValidity(puzzleData.grid, shaded) : new Set();
    setErrors(newErrors);

    checkWin(checkSolved(puzzleData.grid, shaded));
  }, [shaded, puzzleData, showErrors, isPlaying, checkWin]);

  const handleCellClick = (r, c, e) => {
    if (!isPlaying || showSolution) return;
    if (puzzleData.grid[r][c] !== null) return;

    const isMarkAction = e.type === 'contextmenu' || e.ctrlKey || islandMode;

    if (isMarkAction) {
      if (e.type === 'contextmenu') e.preventDefault();
      setMarked(prev => {
        const newMarked = prev.map(row => [...row]);
        newMarked[r][c] = !newMarked[r][c];
        if (newMarked[r][c]) {
          setShaded(p => {
            const n = p.map(row => [...row]);
            n[r][c] = false;
            return n;
          });
        }
        return newMarked;
      });
    } else {
      setShaded(prev => {
        const newShaded = prev.map(row => [...row]);
        newShaded[r][c] = !newShaded[r][c];
        if (newShaded[r][c]) {
          setMarked(m => {
            const n = m.map(row => [...row]);
            n[r][c] = false;
            return n;
          });
        }
        return newShaded;
      });
    }
  };

  const handleReset = () => {
    const puzzleSize = puzzleData?.size || size;
    setShaded(Array(puzzleSize).fill(null).map(() => Array(puzzleSize).fill(false)));
    setMarked(Array(puzzleSize).fill(null).map(() => Array(puzzleSize).fill(false)));
    resetGameState();
    setShowSolution(false);
  };

  const handleGiveUp = () => {
    if (!isPlaying) return;
    setShowSolution(true);
    giveUp();
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <GameHeader title="Nurikabe" />
        <div className={styles.loading}>{t('common.loadingPuzzles')}</div>
      </div>
    );
  }

  if (!puzzleData) return null;

  const gridSize = puzzleData.size || size;

  return (
    <div className={styles.container}>
      <GameHeader
        title="Nurikabe"
        instructions="Shade cells to create a connected sea (dark) around islands (white). Each number indicates the total size of its island. All sea cells must connect, no 2×2 sea squares allowed, and islands cannot touch orthogonally."
      />

      <SizeSelector
        options={Object.keys(GRID_SIZES)}
        value={sizeKey}
        onChange={setSizeKey}
        className={styles.sizeSelector}
      />

      <DifficultySelector
        options={['easy', 'medium', 'hard']}
        value={difficulty}
        onChange={setDifficulty}
        className={styles.difficultySelector}
      />

      <div className={styles.gameArea}>
        <button
          className={`${styles.islandToggle} ${islandMode ? styles.islandModeActive : ''}`}
          onClick={() => setIslandMode(!islandMode)}
        >
          🏝️ {islandMode ? 'Island Mode ON' : 'Island Mode'}
        </button>

        <div
          className={styles.grid}
          style={{
            gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
            '--grid-size': gridSize,
          }}
        >
          {puzzleData.grid.map((row, r) =>
            row.map((cell, c) => {
              const isSolutionSea = showSolution && puzzleData.solution[r][c] === true;
              const isShaded = showSolution ? isSolutionSea : shaded[r][c];
              const isMarked = showSolution ? false : marked[r][c];
              const hasError = showSolution ? false : errors.has(`${r},${c}`);
              const hasNumber = cell !== null;

              return (
                <button
                  key={`${r}-${c}`}
                  className={`
                    ${styles.cell}
                    ${isShaded ? styles.shaded : ''}
                    ${isMarked ? styles.marked : ''}
                    ${hasError ? styles.error : ''}
                    ${hasNumber ? styles.number : ''}
                    ${showSolution ? styles.solution : ''}
                  `}
                  onClick={(e) => handleCellClick(r, c, e)}
                  onContextMenu={(e) => handleCellClick(r, c, e)}
                  disabled={showSolution}
                >
                  {hasNumber && <span className={styles.value}>{cell}</span>}
                </button>
              );
            })
          )}
        </div>

        {gameState === 'won' && (
          <GameResult
            state="won"
            title={t('gameStatus.solved')}
            message={t('common.seaAndIslandsBalanced', 'Sea and islands perfectly balanced!')}
            actions={[{ label: 'New Puzzle', onClick: initGame, primary: true }]}
          />
        )}

        {gameState === 'gaveUp' && (
          <GameResult
            state="gaveup"
            title="🗺️ Solution Revealed"
            message="Study the pattern and try another puzzle!"
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

        <div className={styles.legend}>
          <div className={styles.legendItem}>
            <div className={`${styles.legendBox} ${styles.seaLegend}`}></div>
            <span>Sea (click)</span>
          </div>
          <div className={styles.legendItem}>
            <div className={`${styles.legendBox} ${styles.islandLegend}`}></div>
            <span>Island (right-click)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
