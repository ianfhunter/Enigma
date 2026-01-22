import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { createSeededRandom, getTodayDateString, stringToSeed } from '../../data/wordUtils';
import { usePersistedState } from '../../hooks/usePersistedState';
import GameHeader from '../../components/GameHeader';
import DifficultySelector from '../../components/DifficultySelector';
import GiveUpButton from '../../components/GiveUpButton';
import GameResult from '../../components/GameResult';
import SeedDisplay from '../../components/SeedDisplay';
import styles from './Creek.module.css';

const DIFFICULTIES = ['easy', 'medium', 'hard'];
const STORAGE_KEY = 'creek-game-state';

// Load puzzles from dataset
let puzzleDataset = null;
async function loadPuzzleDataset() {
  if (puzzleDataset) return puzzleDataset;
  try {
    const response = await fetch('/datasets/creekPuzzles.json');
    puzzleDataset = await response.json();
    return puzzleDataset;
  } catch (e) {
    console.error('Failed to load Creek puzzles:', e);
    return null;
  }
}

// Select a puzzle based on difficulty and seed
function selectPuzzle(puzzles, difficulty, seed) {
  const random = createSeededRandom(seed);
  const filtered = puzzles.filter(p => p.difficulty === difficulty);
  if (filtered.length === 0) return puzzles[Math.floor(random() * puzzles.length)];
  return filtered[Math.floor(random() * filtered.length)];
}

// Convert dataset puzzle to game format
function convertPuzzle(datasetPuzzle) {
  const rows = datasetPuzzle.rows;
  const cols = datasetPuzzle.cols;

  // Dataset solution uses "x" for shaded, null for white
  // Convert to boolean: true = shaded, false = white
  const solution = datasetPuzzle.solution.map(row =>
    row.map(cell => cell === 'x')
  );

  // Clues are already in the right format (null or number)
  // Dataset clues are (rows+1) x (cols+1) for vertices
  const clues = datasetPuzzle.clues;

  return {
    solution,
    clues,
    size: rows, // Assuming square puzzles, or we can use rows/cols separately
    rows,
    cols,
    id: datasetPuzzle.id,
    difficulty: datasetPuzzle.difficulty,
  };
}


function areWhiteCellsConnected(grid, rows, cols) {
  // Find first white cell (false)
  let start = null;
  for (let r = 0; r < rows && !start; r++) {
    for (let c = 0; c < cols && !start; c++) {
      if (grid[r][c] === false) start = [r, c];
    }
  }

  if (!start) return true; // No white cells marked yet

  // BFS to count connected white cells
  const visited = new Set();
  const queue = [start];
  visited.add(`${start[0]},${start[1]}`);

  while (queue.length > 0) {
    const [r, c] = queue.shift();

    for (const [nr, nc] of [[r-1, c], [r+1, c], [r, c-1], [r, c+1]]) {
      if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
        const key = `${nr},${nc}`;
        // Can traverse through unmarked cells (null) to reach other white cells
        if (!visited.has(key) && (grid[nr][nc] === false || grid[nr][nc] === null)) {
          visited.add(key);
          if (grid[nr][nc] === false) queue.push([nr, nc]);
        }
      }
    }
  }

  // Count total white cells
  let totalWhite = 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (grid[r][c] === false) totalWhite++;
    }
  }

  return visited.size >= totalWhite;
}

function checkValidity(grid, clues, rows, cols) {
  const errors = new Set();

  // Check each clue
  for (let r = 0; r <= rows; r++) {
    for (let c = 0; c <= cols; c++) {
      if (clues[r]?.[c] === null || clues[r]?.[c] === undefined) continue;

      let count = 0;
      const cells = [
        [r - 1, c - 1],
        [r - 1, c],
        [r, c - 1],
        [r, c],
      ];

      for (const [cr, cc] of cells) {
        if (cr >= 0 && cr < rows && cc >= 0 && cc < cols) {
          if (grid[cr][cc] === true) {
            count++;
          }
        }
      }

      // Only show error if count exceeds clue
      if (count > clues[r][c]) {
        for (const [cr, cc] of cells) {
          if (cr >= 0 && cr < rows && cc >= 0 && cc < cols && grid[cr][cc] === true) {
            errors.add(`${cr},${cc}`);
          }
        }
      }
    }
  }

  // Check white cells are connected
  let hasAnyWhite = false;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (grid[r][c] === false) hasAnyWhite = true;
    }
  }

  if (hasAnyWhite && !areWhiteCellsConnected(grid, rows, cols)) {
    // Mark disconnected white cells as errors
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (grid[r][c] === false) {
          errors.add(`${r},${c}`);
        }
      }
    }
  }

  return errors;
}

function checkSolved(grid, solution, rows, cols) {
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const playerCell = grid[r][c] === true;
      const solutionCell = solution[r][c];
      if (playerCell !== solutionCell) return false;
    }
  }
  return true;
}

// Export helpers for testing
export {
  DIFFICULTIES,
  selectPuzzle,
  convertPuzzle,
  areWhiteCellsConnected,
  checkValidity,
  checkSolved,
};

export default function Creek() {
  const { t } = useTranslation();
  const [savedState, setSavedState] = usePersistedState(STORAGE_KEY, null);
  const [difficulty, setDifficulty] = useState('medium');
  const [puzzleData, setPuzzleData] = useState(null);
  const [grid, setGrid] = useState([]);
  const [gameState, setGameState] = useState('loading');
  const [errors, setErrors] = useState(new Set());
  const [showErrors, setShowErrors] = useState(false);
  const [whiteMode, setWhiteMode] = useState(false); // Mobile white mode
  const [seed, setSeed] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);

  const initGame = useCallback(async (newDifficulty = difficulty, forceNew = false, customSeed = null) => {
    const today = getTodayDateString();

    // Try to restore saved state
    if (!forceNew && savedState && savedState.date === today && savedState.difficulty === newDifficulty && savedState.puzzleId) {
      setPuzzleData(savedState.puzzleData);
      setGrid(savedState.grid.map(row => [...row]));
      setGameState(savedState.gameState || 'playing');
      setDifficulty(newDifficulty);
      setSeed(savedState.seed);
      setIsLoaded(true);
      return;
    }

    // Load dataset and select new puzzle
    const dataset = await loadPuzzleDataset();
    if (!dataset || !dataset.puzzles) {
      console.error('Failed to load Creek dataset');
      setGameState('error');
      setIsLoaded(true);
      return;
    }

    let gameSeed;
    if (customSeed !== null) {
      gameSeed = typeof customSeed === 'string'
        ? (isNaN(parseInt(customSeed, 10)) ? stringToSeed(customSeed) : parseInt(customSeed, 10))
        : customSeed;
    } else {
      const seedString = `creek-${today}-${newDifficulty}${forceNew ? '-' + Date.now() : ''}`;
      gameSeed = stringToSeed(seedString);
    }

    const selected = selectPuzzle(dataset.puzzles, newDifficulty, gameSeed);
    const converted = convertPuzzle(selected);

    setSeed(gameSeed);
    setPuzzleData(converted);
    setGrid(Array(converted.rows).fill(null).map(() => Array(converted.cols).fill(null)));
    setGameState('playing');
    setDifficulty(newDifficulty);
    setErrors(new Set());
    setIsLoaded(true);
  }, [difficulty]);

  useEffect(() => {
    initGame();
  }, []);

  // Save state when it changes
  useEffect(() => {
    if (!isLoaded || !puzzleData || gameState === 'loading' || gameState === 'error') return;

    setSavedState({
      date: getTodayDateString(),
      difficulty,
      puzzleId: puzzleData.id,
      puzzleData,
      grid,
      gameState,
      seed,
    });
  }, [grid, gameState, puzzleData, difficulty, seed, isLoaded, setSavedState]);

  // Check validity and solved state
  useEffect(() => {
    if (!puzzleData || gameState !== 'playing') return;

    const newErrors = showErrors
      ? checkValidity(grid, puzzleData.clues, puzzleData.rows, puzzleData.cols)
      : new Set();
    setErrors(newErrors);

    if (checkSolved(grid, puzzleData.solution, puzzleData.rows, puzzleData.cols)) {
      setGameState('won');
    }
  }, [grid, puzzleData, showErrors, gameState]);

  const handleCellClick = (r, c, e) => {
    if (gameState !== 'playing') return;

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
      // Mark as shaded
      setGrid(prev => {
        const newGrid = prev.map(row => [...row]);
        newGrid[r][c] = newGrid[r][c] === true ? null : true;
        return newGrid;
      });
    }
  };

  const handleReset = () => {
    if (!puzzleData) return;
    setGrid(Array(puzzleData.rows).fill(null).map(() => Array(puzzleData.cols).fill(null)));
    setGameState('playing');
  };

  const handleGiveUp = () => {
    if (!puzzleData || gameState !== 'playing') return;
    setGrid(puzzleData.solution.map(row => [...row]));
    setGameState('gaveUp');
  };

  const handleDifficultyChange = (newDiff) => {
    initGame(newDiff, true);
  };

  const handleSeedChange = (newSeed) => {
    initGame(difficulty, true, newSeed);
  };

  if (gameState === 'loading' || !puzzleData) {
    return (
      <div className={styles.container}>
        <GameHeader
          title="Creek"
          instructions="Loading puzzles..."
        />
        <div className={styles.loading}>{t('common.loadingPuzzle')}</div>
      </div>
    );
  }

  if (gameState === 'error') {
    return (
      <div className={styles.container}>
        <GameHeader
          title="Creek"
          instructions="Failed to load puzzles. Please refresh the page."
        />
      </div>
    );
  }

  const { rows, cols, clues } = puzzleData;

  return (
    <div className={styles.container}>
      <GameHeader
        title="Creek"
        instructions="Shade cells based on corner clues. Each number shows how many of the 4 adjacent cells are shaded. All white cells must be connected orthogonally."
      />

      <DifficultySelector
        options={DIFFICULTIES}
        value={difficulty}
        onChange={handleDifficultyChange}
      />

      <SeedDisplay seed={seed} onSeedChange={handleSeedChange} />

      <div className={styles.gameArea}>
        {/* Mobile White Toggle */}
        <button
          className={`${styles.whiteToggle} ${whiteMode ? styles.whiteModeActive : ''}`}
          onClick={() => setWhiteMode(!whiteMode)}
        >
          ○ {whiteMode ? 'White Mode ON' : 'White Mode'}
        </button>

        <div className={styles.gridWrapper}>
          {/* Grid with clues at vertices */}
          <div className={styles.board} style={{
            gridTemplateColumns: Array(cols * 2 + 1).fill(null).map((_, i) =>
              i % 2 === 0 ? 'min-content' : '1fr'
            ).join(' '),
            gridTemplateRows: Array(rows * 2 + 1).fill(null).map((_, i) =>
              i % 2 === 0 ? 'min-content' : '1fr'
            ).join(' ')
          }}>
            {Array(rows * 2 + 1).fill(null).map((_, row) =>
              Array(cols * 2 + 1).fill(null).map((_, col) => {
                const isVertex = row % 2 === 0 && col % 2 === 0;
                const isCell = row % 2 === 1 && col % 2 === 1;

                if (isVertex) {
                  const vr = row / 2;
                  const vc = col / 2;
                  const clue = clues[vr]?.[vc];

                  return (
                    <div key={`${row}-${col}`} className={styles.vertex}>
                      {clue !== null && clue !== undefined && <span className={styles.clue}>{clue}</span>}
                    </div>
                  );
                } else if (isCell) {
                  const cr = (row - 1) / 2;
                  const cc = (col - 1) / 2;
                  const value = grid[cr]?.[cc];
                  const hasError = errors.has(`${cr},${cc}`);

                  return (
                    <button
                      key={`${row}-${col}`}
                      className={`
                        ${styles.cell}
                        ${value === true ? styles.shaded : ''}
                        ${value === false ? styles.white : ''}
                        ${hasError ? styles.error : ''}
                      `}
                      onClick={(e) => handleCellClick(cr, cc, e)}
                      onContextMenu={(e) => handleCellClick(cr, cc, e)}
                    />
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
            title="🏞️ Puzzle Solved!"
            message="Creek perfectly mapped!"
            actions={[{ label: 'New Puzzle', onClick: () => initGame(difficulty, true), primary: true }]}
          />
        )}

        {gameState === 'gaveUp' && (
          <GameResult
            state="gaveup"
            message="Better luck next time!"
            actions={[{ label: 'New Puzzle', onClick: () => initGame(difficulty, true), primary: true }]}
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
            disabled={gameState !== 'playing'}
          />
          <button className={styles.newGameBtn} onClick={() => initGame(difficulty, true)}>
            New Puzzle
          </button>
        </div>

        <div className={styles.legend}>
          <span>Click: Shade cell</span>
          <span>Right-click: Mark white</span>
        </div>

        <div className={styles.attribution}>
          Puzzles from <a href="https://www.janko.at/Raetsel/" target="_blank" rel="noopener noreferrer">janko.at</a> via{' '}
          <a href="https://github.com/SmilingWayne/puzzlekit-dataset" target="_blank" rel="noopener noreferrer">puzzlekit-dataset</a> (MIT)
        </div>
      </div>
    </div>
  );
}
