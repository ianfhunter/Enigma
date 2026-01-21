import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { createSeededRandom, seededShuffleArray, getTodayDateString, stringToSeed } from '../../data/wordUtils';
import { usePersistedState } from '../../hooks/usePersistedState';
import GameHeader from '../../components/GameHeader';
import DifficultySelector from '../../components/DifficultySelector';
import Timer, { formatTime } from '../../components/Timer/Timer';
import GiveUpButton from '../../components/GiveUpButton';
import GameResult from '../../components/GameResult';
import SeedDisplay from '../../components/SeedDisplay';
import { createGrid, cloneGrid, isValidInRow, isValidInColumn, notesToJSON, notesFromJSON } from '../../utils/generatorUtils';
import styles from './Sudoku.module.css';

const STORAGE_KEY = 'sudoku-game-state';

// Sudoku-specific validation (includes 3x3 box check)
function isValidPlacement(grid, row, col, num) {
  // Check row and column using shared utilities
  if (!isValidInRow(grid, row, col, num)) return false;
  if (!isValidInColumn(grid, row, col, num)) return false;

  // Check 3x3 box (Sudoku-specific)
  const boxRow = Math.floor(row / 3) * 3;
  const boxCol = Math.floor(col / 3) * 3;
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      if (grid[boxRow + i][boxCol + j] === num) return false;
    }
  }

  return true;
}

function solveSudoku(grid) {
  const gridCopy = cloneGrid(grid);

  function solve() {
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        if (gridCopy[row][col] === 0) {
          for (let num = 1; num <= 9; num++) {
            if (isValidPlacement(gridCopy, row, col, num)) {
              gridCopy[row][col] = num;
              if (solve()) return true;
              gridCopy[row][col] = 0;
            }
          }
          return false;
        }
      }
    }
    return true;
  }

  solve();
  return gridCopy;
}

function generateSolvedGrid(random) {
  const grid = createGrid(9, 9, 0);

  // Fill diagonal 3x3 boxes first (they are independent)
  for (let box = 0; box < 9; box += 3) {
    const nums = seededShuffleArray([1, 2, 3, 4, 5, 6, 7, 8, 9], random);
    let idx = 0;
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        grid[box + i][box + j] = nums[idx++];
      }
    }
  }

  // Solve the rest
  return solveSudoku(grid);
}

function generatePuzzle(difficulty = 'medium', seed = null) {
  // Create seeded random if seed provided, otherwise use Math.random
  const random = seed !== null
    ? createSeededRandom(seed)
    : () => Math.random();

  const solution = generateSolvedGrid(random);
  const puzzle = cloneGrid(solution);

  // Number of cells to remove based on difficulty
  const cellsToRemove = {
    easy: 35,
    medium: 45,
    hard: 55,
    expert: 60
  }[difficulty] || 45;

  // Get all positions and shuffle them with seeded random
  const positions = [];
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      positions.push([row, col]);
    }
  }
  const shuffledPositions = seededShuffleArray(positions, random);

  // Remove cells
  let removed = 0;
  for (const [row, col] of shuffledPositions) {
    if (removed >= cellsToRemove) break;
    puzzle[row][col] = 0;
    removed++;
  }

  return { puzzle, solution };
}


export default function Sudoku() {
  const { t } = useTranslation();
  const [savedState, setSavedState] = usePersistedState(STORAGE_KEY, null);
  const [puzzles, setPuzzles] = useState({}); // { difficulty: { puzzle, solution, date, puzzleNumber } }
  const [playerState, setPlayerState] = useState({}); // { difficulty: { grid, notes, timer, isComplete } }
  const [difficulty, setDifficulty] = useState('medium');
  const [selectedCell, setSelectedCell] = useState(null);
  const [notesMode, setNotesMode] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [showErrors, setShowErrors] = useState(true);
  const [errors, setErrors] = useState(new Set());
  const [history, setHistory] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);

  const timerRef = useRef(null);

  // Get current puzzle and player state for selected difficulty
  const currentPuzzle = puzzles[difficulty];
  const currentPlayerState = playerState[difficulty];
  const grid = currentPlayerState?.grid;
  const notes = currentPlayerState?.notes || {};
  const timer = currentPlayerState?.timer || 0;
  const isComplete = currentPlayerState?.isComplete || false;
  const gaveUp = currentPlayerState?.gaveUp || false;
  const initialCells = currentPuzzle ? new Set(
    currentPuzzle.puzzle.flatMap((row, r) =>
      row.map((cell, c) => cell !== 0 ? `${r}-${c}` : null)
    ).filter(Boolean)
  ) : new Set();

  // Generate or load puzzle for a difficulty
  const ensurePuzzleExists = useCallback((diff, forceNew = false, savedPuzzles = {}, customSeed = null) => {
    const today = getTodayDateString();
    const existingPuzzle = savedPuzzles[diff] || puzzles[diff];

    // Check if we need a new puzzle
    const needsNewPuzzle = forceNew ||
      !existingPuzzle ||
      existingPuzzle.date !== today ||
      customSeed !== null;

    if (needsNewPuzzle) {
      // Calculate puzzle number - if forcing new on same day, increment
      let puzzleNumber = 1;
      if (forceNew && existingPuzzle?.date === today) {
        puzzleNumber = (existingPuzzle.puzzleNumber || 1) + 1;
      }

      // Use custom seed or create seed from date + difficulty + puzzle number
      let seed;
      if (customSeed !== null) {
        seed = typeof customSeed === 'string'
          ? (isNaN(parseInt(customSeed, 10)) ? stringToSeed(customSeed) : parseInt(customSeed, 10))
          : customSeed;
      } else {
        const seedString = `${today}-${diff}-${puzzleNumber}`;
        seed = stringToSeed(seedString);
      }

      const { puzzle, solution } = generatePuzzle(diff, seed);

      return {
        puzzle,
        solution,
        date: today,
        puzzleNumber
      };
    }

    return existingPuzzle;
  }, [puzzles]);

  // Initialize player state for a puzzle
  const initializePlayerState = useCallback((puzzleData) => {
    return {
      grid: puzzleData.puzzle.map(row => [...row]),
      notes: {},
      timer: 0,
      isComplete: false,
      gaveUp: false
    };
  }, []);

  // Load saved state on mount
  useEffect(() => {
    const today = getTodayDateString();

    if (savedState) {
      const loadedPuzzles = {};
      const loadedPlayerState = {};

      // Check each difficulty
      for (const diff of ['easy', 'medium', 'hard', 'expert']) {
        const savedPuzzle = savedState.puzzles?.[diff];
        const savedPlayer = savedState.playerState?.[diff];

        if (savedPuzzle && savedPuzzle.date === today) {
          // Same day - restore puzzle and player state
          loadedPuzzles[diff] = savedPuzzle;
          if (savedPlayer) {
            loadedPlayerState[diff] = {
              ...savedPlayer,
              notes: notesFromJSON(savedPlayer.notes)
            };
          } else {
            loadedPlayerState[diff] = initializePlayerState(savedPuzzle);
          }
        } else {
          // New day - generate fresh puzzle
          const newPuzzle = ensurePuzzleExists(diff, false, {});
          loadedPuzzles[diff] = newPuzzle;
          loadedPlayerState[diff] = initializePlayerState(newPuzzle);
        }
      }

      setPuzzles(loadedPuzzles);
      setPlayerState(loadedPlayerState);
      setDifficulty(savedState.currentDifficulty || 'medium');
    } else {
      // First time - generate all puzzles
      const newPuzzles = {};
      const newPlayerState = {};

      for (const diff of ['easy', 'medium', 'hard', 'expert']) {
        const puzzle = ensurePuzzleExists(diff, false, {});
        newPuzzles[diff] = puzzle;
        newPlayerState[diff] = initializePlayerState(puzzle);
      }

      setPuzzles(newPuzzles);
      setPlayerState(newPlayerState);
    }

    setIsLoaded(true);
  }, []);

  // Save state whenever it changes
  useEffect(() => {
    if (!isLoaded) return;

    // Convert notes Sets to arrays for JSON serialization
    const serializablePlayerState = {};
    for (const [diff, state] of Object.entries(playerState)) {
      serializablePlayerState[diff] = {
        ...state,
        notes: notesToJSON(state.notes || {})
      };
    }

    setSavedState({
      puzzles,
      playerState: serializablePlayerState,
      currentDifficulty: difficulty
    });
  }, [puzzles, playerState, difficulty, isLoaded, setSavedState]);

  // Timer effect
  useEffect(() => {
    if (isRunning && !isComplete && isLoaded) {
      timerRef.current = setInterval(() => {
        setPlayerState(prev => ({
          ...prev,
          [difficulty]: {
            ...prev[difficulty],
            timer: (prev[difficulty]?.timer || 0) + 1
          }
        }));
      }, 1000);
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRunning, isComplete, difficulty, isLoaded]);

  // Start timer when loaded and not complete
  useEffect(() => {
    if (isLoaded && !isComplete && grid) {
      setIsRunning(true);
    }
  }, [isLoaded, isComplete, grid]);

  // Check for errors and completion
  useEffect(() => {
    if (!grid || !currentPuzzle?.solution) return;

    const newErrors = new Set();
    let allFilled = true;
    let allCorrect = true;

    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        const value = grid[row][col];
        if (value === 0) {
          allFilled = false;
        } else if (value !== currentPuzzle.solution[row][col]) {
          newErrors.add(`${row}-${col}`);
          allCorrect = false;
        }
      }
    }

    setErrors(newErrors);

    if (allFilled && allCorrect && !isComplete) {
      setPlayerState(prev => ({
        ...prev,
        [difficulty]: {
          ...prev[difficulty],
          isComplete: true
        }
      }));
      setIsRunning(false);
    }
  }, [grid, currentPuzzle?.solution, difficulty, isComplete, timer]);

  const handleCellClick = (row, col) => {
    if (isComplete) return;
    setSelectedCell({ row, col });
  };

  const updatePlayerState = useCallback((updates) => {
    setPlayerState(prev => ({
      ...prev,
      [difficulty]: {
        ...prev[difficulty],
        ...updates
      }
    }));
  }, [difficulty]);

  const handleNumberInput = useCallback((num) => {
    if (!selectedCell || isComplete || !grid) return;

    const { row, col } = selectedCell;
    const key = `${row}-${col}`;

    // Don't modify initial cells
    if (initialCells?.has(key)) return;

    // Save to history for undo
    setHistory(prev => [...prev, { grid: cloneGrid(grid), notes: { ...notes } }]);

    if (notesMode) {
      // Toggle note
      const cellNotes = notes[key] || new Set();
      const newNotes = new Set(cellNotes);
      if (newNotes.has(num)) {
        newNotes.delete(num);
      } else {
        newNotes.add(num);
      }
      updatePlayerState({
        notes: { ...notes, [key]: newNotes }
      });
    } else {
      // Set cell value
      const newGrid = cloneGrid(grid);
      newGrid[row][col] = num;

      // Clear notes for this cell
      const newNotes = { ...notes };
      delete newNotes[key];

      updatePlayerState({
        grid: newGrid,
        notes: newNotes
      });
    }
  }, [selectedCell, isComplete, initialCells, notesMode, grid, notes, updatePlayerState]);

  const handleClear = useCallback(() => {
    if (!selectedCell || isComplete || !grid) return;

    const { row, col } = selectedCell;
    const key = `${row}-${col}`;

    if (initialCells?.has(key)) return;

    setHistory(prev => [...prev, { grid: cloneGrid(grid), notes: { ...notes } }]);

    const newGrid = cloneGrid(grid);
    newGrid[row][col] = 0;

    const newNotes = { ...notes };
    delete newNotes[key];

    updatePlayerState({
      grid: newGrid,
      notes: newNotes
    });
  }, [selectedCell, isComplete, initialCells, grid, notes, updatePlayerState]);

  const handleUndo = useCallback(() => {
    if (history.length === 0) return;

    const lastState = history[history.length - 1];
    updatePlayerState({
      grid: lastState.grid,
      notes: lastState.notes
    });
    setHistory(prev => prev.slice(0, -1));
  }, [history, updatePlayerState]);

  const handleHint = useCallback(() => {
    if (!grid || !currentPuzzle?.solution || isComplete) return;

    // Find an empty cell
    const emptyCells = [];
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        if (grid[row][col] === 0) {
          emptyCells.push({ row, col });
        }
      }
    }

    if (emptyCells.length === 0) return;

    // Pick a random empty cell and fill it
    const randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
    const { row, col } = randomCell;

    setHistory(prev => [...prev, { grid: cloneGrid(grid), notes: { ...notes } }]);

    const newGrid = cloneGrid(grid);
    newGrid[row][col] = currentPuzzle.solution[row][col];

    // Clear notes for this cell
    const key = `${row}-${col}`;
    const newNotes = { ...notes };
    delete newNotes[key];

    updatePlayerState({
      grid: newGrid,
      notes: newNotes
    });

    setSelectedCell({ row, col });
  }, [grid, currentPuzzle?.solution, isComplete, notes, updatePlayerState]);

  const handleGiveUp = useCallback(() => {
    if (!currentPuzzle?.solution || isComplete || gaveUp) return;

    updatePlayerState({
      grid: currentPuzzle.solution.map(row => [...row]),
      gaveUp: true
    });
    setIsRunning(false);
  }, [currentPuzzle?.solution, isComplete, gaveUp, updatePlayerState]);

  // Handle new puzzle - only resets current difficulty
  const handleNewPuzzle = useCallback(() => {
    const newPuzzle = ensurePuzzleExists(difficulty, true, puzzles);

    setPuzzles(prev => ({
      ...prev,
      [difficulty]: newPuzzle
    }));

    setPlayerState(prev => ({
      ...prev,
      [difficulty]: initializePlayerState(newPuzzle)
    }));

    setSelectedCell(null);
    setHistory([]);
    setIsRunning(true);
  }, [difficulty, puzzles, ensurePuzzleExists, initializePlayerState]);

  // Handle difficulty change - just switch, don't reset
  const handleDifficultyChange = useCallback((newDifficulty) => {
    if (newDifficulty === difficulty) return;

    // Ensure puzzle exists for new difficulty
    if (!puzzles[newDifficulty]) {
      const newPuzzle = ensurePuzzleExists(newDifficulty, false, puzzles);
      setPuzzles(prev => ({
        ...prev,
        [newDifficulty]: newPuzzle
      }));

      if (!playerState[newDifficulty]) {
        setPlayerState(prev => ({
          ...prev,
          [newDifficulty]: initializePlayerState(newPuzzle)
        }));
      }
    }

    setDifficulty(newDifficulty);
    setSelectedCell(null);
    setHistory([]);
  }, [difficulty, puzzles, playerState, ensurePuzzleExists, initializePlayerState]);

  // Keyboard handling
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!selectedCell || isComplete) return;

      const { row, col } = selectedCell;

      if (e.key >= '1' && e.key <= '9') {
        handleNumberInput(parseInt(e.key));
      } else if (e.key === 'Backspace' || e.key === 'Delete' || e.key === '0') {
        handleClear();
      } else if (e.key === 'ArrowUp' && row > 0) {
        setSelectedCell({ row: row - 1, col });
      } else if (e.key === 'ArrowDown' && row < 8) {
        setSelectedCell({ row: row + 1, col });
      } else if (e.key === 'ArrowLeft' && col > 0) {
        setSelectedCell({ row, col: col - 1 });
      } else if (e.key === 'ArrowRight' && col < 8) {
        setSelectedCell({ row, col: col + 1 });
      } else if (e.key === 'n' || e.key === 'N') {
        setNotesMode(prev => !prev);
      } else if (e.key === 'z' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        handleUndo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedCell, isComplete, handleNumberInput, handleClear, handleUndo]);

  const getCellClassName = (row, col) => {
    const classes = [styles.cell];
    const key = `${row}-${col}`;

    // Initial cells
    if (initialCells?.has(key)) {
      classes.push(styles.initial);
    }

    // Selected cell
    if (selectedCell?.row === row && selectedCell?.col === col) {
      classes.push(styles.selected);
    }

    // Highlighted (same row, column, or box as selected)
    if (selectedCell) {
      const sameRow = selectedCell.row === row;
      const sameCol = selectedCell.col === col;
      const sameBox = Math.floor(selectedCell.row / 3) === Math.floor(row / 3) &&
                      Math.floor(selectedCell.col / 3) === Math.floor(col / 3);

      if ((sameRow || sameCol || sameBox) && !(sameRow && sameCol)) {
        classes.push(styles.highlighted);
      }
    }

    // Same value as selected cell
    if (selectedCell && grid) {
      const selectedValue = grid[selectedCell.row][selectedCell.col];
      if (selectedValue !== 0 && grid[row][col] === selectedValue) {
        classes.push(styles.sameValue);
      }
    }

    // Error
    if (showErrors && errors.has(key)) {
      classes.push(styles.error);
    }

    // Border classes for 3x3 boxes
    if (col % 3 === 2 && col !== 8) classes.push(styles.rightBorder);
    if (row % 3 === 2 && row !== 8) classes.push(styles.bottomBorder);

    return classes.join(' ');
  };

  if (!isLoaded || !grid) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>{t('common.loadingPuzzle')}</div>
      </div>
    );
  }

  const progress = grid.flat().filter(v => v !== 0).length;
  const total = 81;
  const puzzleNumber = currentPuzzle?.puzzleNumber || 1;
  const today = getTodayDateString();
  const seed = currentPuzzle ? stringToSeed(`${currentPuzzle.date || today}-${difficulty}-${puzzleNumber}`) : null;

  return (
    <div className={styles.container}>
      <GameHeader
        title="Sudoku"
        instructions={<span dangerouslySetInnerHTML={{ __html: t('common.sudokuInstructions', 'Fill the grid so each row, column, and 3×3 box contains the numbers <strong>1-9</strong>.') }} />}
      >
        <p className={styles.dailyInfo}>
          {t('common.dailyPuzzle', { number: puzzleNumber, date: today })}
        </p>
      </GameHeader>

      {seed !== null && (
        <SeedDisplay
          seed={seed}
          variant="compact"
          showNewButton={false}
          showShare={false}
          onSeedChange={(newSeed) => {
            // Convert string seeds to numbers if needed
            const seedNum = typeof newSeed === 'string'
              ? (isNaN(parseInt(newSeed, 10)) ? stringToSeed(newSeed) : parseInt(newSeed, 10))
              : newSeed;
            // Regenerate puzzle with custom seed
            const newPuzzle = ensurePuzzleExists(difficulty, false, {}, seedNum);
            if (newPuzzle) {
              setPuzzles(prev => ({ ...prev, [difficulty]: newPuzzle }));
              const newPlayerState = initializePlayerState(newPuzzle);
              setPlayerState(prev => ({ ...prev, [difficulty]: newPlayerState }));
              setHistory([]);
            }
          }}
        />
      )}

      <div className={styles.gameArea}>
        <div className={styles.boardSection}>
          <div className={styles.gameControls}>
            <DifficultySelector
              options={['easy', 'medium', 'hard', 'expert']}
              value={difficulty}
              onChange={handleDifficultyChange}
              completedStates={Object.fromEntries(
                ['easy', 'medium', 'hard', 'expert'].map(d => [d, playerState[d]?.isComplete])
              )}
              className={styles.difficultySelector}
            />
            <Timer seconds={timer} size="compact" running={isRunning} />
          </div>

          <div className={styles.board}>
            {grid.map((row, rowIndex) => (
              <div key={rowIndex} className={styles.row}>
                {row.map((cell, colIndex) => {
                  const key = `${rowIndex}-${colIndex}`;
                  const cellNotes = notes[key];

                  return (
                    <div
                      key={colIndex}
                      className={getCellClassName(rowIndex, colIndex)}
                      onClick={() => handleCellClick(rowIndex, colIndex)}
                    >
                      {cell !== 0 ? (
                        <span className={styles.cellValue}>{cell}</span>
                      ) : cellNotes && cellNotes.size > 0 ? (
                        <div className={styles.notes}>
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
                            <span key={n} className={styles.note}>
                              {cellNotes.has(n) ? n : ''}
                            </span>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          <div className={styles.numberPad}>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => {
              // Count how many of this number are placed
              const count = grid.flat().filter(v => v === num).length;
              const isDisabled = count >= 9;

              return (
                <button
                  key={num}
                  className={`${styles.numBtn} ${isDisabled ? styles.numDisabled : ''}`}
                  onClick={() => handleNumberInput(num)}
                  disabled={isDisabled}
                >
                  {num}
                  <span className={styles.numCount}>{9 - count}</span>
                </button>
              );
            })}
          </div>

          <div className={styles.actionButtons}>
            <button
              className={`${styles.actionBtn} ${notesMode ? styles.active : ''}`}
              onClick={() => setNotesMode(!notesMode)}
              title={t('common.toggleNotes')}
            >
              <span className={styles.actionIcon}>✏️</span>
              {t('common.notes')}
            </button>
            <button
              className={styles.actionBtn}
              onClick={handleClear}
              title={t('common.clearCell')}
            >
              <span className={styles.actionIcon}>⌫</span>
              {t('common.clear')}
            </button>
            <button
              className={styles.actionBtn}
              onClick={handleUndo}
              disabled={history.length === 0}
              title={t('common.undo')}
            >
              <span className={styles.actionIcon}>↩️</span>
              {t('common.undo')}
            </button>
            <button
              className={styles.actionBtn}
              onClick={handleHint}
              title={t('common.hint')}
            >
              <span className={styles.actionIcon}>💡</span>
              {t('common.hint')}
            </button>
            <GiveUpButton
              onGiveUp={handleGiveUp}
              disabled={isComplete || gaveUp}
              variant="compact"
            />
          </div>
        </div>

        <div className={styles.infoSection}>
          <div className={styles.progressPanel}>
            <div className={styles.progressInfo}>
              <span className={styles.progressLabel}>{t('common.progress')}</span>
              <span className={styles.progressValue}>{progress} / {total}</span>
            </div>
            <div className={styles.progressBar}>
              <div
                className={styles.progressFill}
                style={{ width: `${(progress / total) * 100}%` }}
              />
            </div>
          </div>

          {isComplete && (
            <GameResult
              state="won"
              message={t('common.solvedIn', { difficulty: t(`difficulties.${difficulty}`), time: formatTime(timer) })}
              actions={[{ label: t('common.newPuzzle'), onClick: handleNewPuzzle, primary: true }]}
            />
          )}

          {gaveUp && (
            <GameResult
              state="gaveup"
              message={t('common.betterLuckNextTime')}
              actions={[{ label: t('common.tryAgain'), onClick: handleNewPuzzle, primary: true }]}
            />
          )}

          <div className={styles.settingsPanel}>
            <h3>{t('common.settings')}</h3>
            <label className={styles.toggle}>
              <input
                type="checkbox"
                checked={showErrors}
                onChange={(e) => setShowErrors(e.target.checked)}
              />
              <span className={styles.toggleSlider}></span>
              {t('common.showErrors')}
            </label>
          </div>

          <div className={styles.helpPanel}>
            <h3>{t('common.keyboardShortcuts')}</h3>
            <ul className={styles.shortcutList}>
              <li><kbd>1-9</kbd> {t('common.enterNumber')}</li>
              <li><kbd>Delete</kbd> {t('common.clearCell')}</li>
              <li><kbd>N</kbd> {t('common.toggleNotes')}</li>
              <li><kbd>Ctrl+Z</kbd> {t('common.undo')}</li>
              <li><kbd>Arrow keys</kbd> {t('common.navigate')}</li>
            </ul>
          </div>

          <button
            className={styles.newGameBtn}
            onClick={handleNewPuzzle}
          >
            {t('common.newPuzzle')}
          </button>
        </div>
      </div>
    </div>
  );
}
