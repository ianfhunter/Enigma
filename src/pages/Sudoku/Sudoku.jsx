import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { formatTime, createSeededRandom, seededShuffleArray, getTodayDateString, stringToSeed } from '../../data/wordUtils';
import styles from './Sudoku.module.css';

const STORAGE_KEY = 'sudoku-game-state';

// Sudoku generation and solving utilities
function createEmptyGrid() {
  return Array(9).fill(null).map(() => Array(9).fill(0));
}

function isValidPlacement(grid, row, col, num) {
  // Check row
  for (let x = 0; x < 9; x++) {
    if (grid[row][x] === num) return false;
  }

  // Check column
  for (let x = 0; x < 9; x++) {
    if (grid[x][col] === num) return false;
  }

  // Check 3x3 box
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
  const gridCopy = grid.map(row => [...row]);

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
  const grid = createEmptyGrid();

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
  const puzzle = solution.map(row => [...row]);

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

// Convert notes object to/from JSON-safe format
function notesToJSON(notes) {
  const result = {};
  for (const [key, value] of Object.entries(notes)) {
    result[key] = Array.from(value);
  }
  return result;
}

function notesFromJSON(json) {
  const result = {};
  for (const [key, value] of Object.entries(json || {})) {
    result[key] = new Set(value);
  }
  return result;
}

// Load game state from localStorage
function loadGameState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error('Failed to load game state:', e);
  }
  return null;
}

// Save game state to localStorage
function saveGameState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('Failed to save game state:', e);
  }
}

export default function Sudoku() {
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
  const initialCells = currentPuzzle ? new Set(
    currentPuzzle.puzzle.flatMap((row, r) =>
      row.map((cell, c) => cell !== 0 ? `${r}-${c}` : null)
    ).filter(Boolean)
  ) : new Set();

  // Generate or load puzzle for a difficulty
  const ensurePuzzleExists = useCallback((diff, forceNew = false, savedPuzzles = {}) => {
    const today = getTodayDateString();
    const existingPuzzle = savedPuzzles[diff] || puzzles[diff];

    // Check if we need a new puzzle
    const needsNewPuzzle = forceNew ||
      !existingPuzzle ||
      existingPuzzle.date !== today;

    if (needsNewPuzzle) {
      // Calculate puzzle number - if forcing new on same day, increment
      let puzzleNumber = 1;
      if (forceNew && existingPuzzle?.date === today) {
        puzzleNumber = (existingPuzzle.puzzleNumber || 1) + 1;
      }

      // Create seed from date + difficulty + puzzle number
      const seedString = `${today}-${diff}-${puzzleNumber}`;
      const seed = stringToSeed(seedString);

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
      isComplete: false
    };
  }, []);

  // Load saved state on mount
  useEffect(() => {
    const saved = loadGameState();
    const today = getTodayDateString();

    if (saved) {
      const loadedPuzzles = {};
      const loadedPlayerState = {};

      // Check each difficulty
      for (const diff of ['easy', 'medium', 'hard', 'expert']) {
        const savedPuzzle = saved.puzzles?.[diff];
        const savedPlayer = saved.playerState?.[diff];

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
      setDifficulty(saved.currentDifficulty || 'medium');
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

    saveGameState({
      puzzles,
      playerState: serializablePlayerState,
      currentDifficulty: difficulty
    });
  }, [puzzles, playerState, difficulty, isLoaded]);

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
    setHistory(prev => [...prev, { grid: grid.map(r => [...r]), notes: { ...notes } }]);

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
      const newGrid = grid.map(r => [...r]);
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

    setHistory(prev => [...prev, { grid: grid.map(r => [...r]), notes: { ...notes } }]);

    const newGrid = grid.map(r => [...r]);
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

    setHistory(prev => [...prev, { grid: grid.map(r => [...r]), notes: { ...notes } }]);

    const newGrid = grid.map(r => [...r]);
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
        <div className={styles.loading}>Loading puzzle...</div>
      </div>
    );
  }

  const progress = grid.flat().filter(v => v !== 0).length;
  const total = 81;
  const puzzleNumber = currentPuzzle?.puzzleNumber || 1;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Link to="/" className={styles.backLink}>
          ← Back to Games
        </Link>
        <h1 className={styles.title}>Sudoku</h1>
        <p className={styles.instructions}>
          Fill the grid so each row, column, and 3×3 box contains the numbers <strong>1-9</strong>.
        </p>
        <p className={styles.dailyInfo}>
          Daily Puzzle #{puzzleNumber} • {getTodayDateString()}
        </p>
      </div>

      <div className={styles.gameArea}>
        <div className={styles.boardSection}>
          <div className={styles.gameControls}>
            <div className={styles.difficultySelector}>
              {['easy', 'medium', 'hard', 'expert'].map((diff) => (
                <button
                  key={diff}
                  className={`${styles.difficultyBtn} ${difficulty === diff ? styles.active : ''} ${playerState[diff]?.isComplete ? styles.completed : ''}`}
                  onClick={() => handleDifficultyChange(diff)}
                >
                  {diff.charAt(0).toUpperCase() + diff.slice(1)}
                  {playerState[diff]?.isComplete && <span className={styles.checkmark}>✓</span>}
                </button>
              ))}
            </div>
            <div className={styles.timerDisplay}>
              <span className={styles.timerIcon}>⏱</span>
              <span className={styles.timerValue}>{formatTime(timer)}</span>
            </div>
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
              title="Toggle notes mode (N)"
            >
              <span className={styles.actionIcon}>✏️</span>
              Notes
            </button>
            <button
              className={styles.actionBtn}
              onClick={handleClear}
              title="Clear cell (Delete)"
            >
              <span className={styles.actionIcon}>⌫</span>
              Clear
            </button>
            <button
              className={styles.actionBtn}
              onClick={handleUndo}
              disabled={history.length === 0}
              title="Undo (Ctrl+Z)"
            >
              <span className={styles.actionIcon}>↩️</span>
              Undo
            </button>
            <button
              className={styles.actionBtn}
              onClick={handleHint}
              title="Get a hint"
            >
              <span className={styles.actionIcon}>💡</span>
              Hint
            </button>
          </div>
        </div>

        <div className={styles.infoSection}>
          <div className={styles.progressPanel}>
            <div className={styles.progressInfo}>
              <span className={styles.progressLabel}>Progress</span>
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
            <div className={styles.completeMessage}>
              <div className={styles.completeEmoji}>🎉</div>
              <h3>Congratulations!</h3>
              <p>You solved the {difficulty} puzzle in {formatTime(timer)}</p>
              <button
                className={styles.playAgainBtn}
                onClick={handleNewPuzzle}
              >
                New Puzzle
              </button>
            </div>
          )}

          <div className={styles.settingsPanel}>
            <h3>Settings</h3>
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

          <div className={styles.helpPanel}>
            <h3>Keyboard Shortcuts</h3>
            <ul className={styles.shortcutList}>
              <li><kbd>1-9</kbd> Enter number</li>
              <li><kbd>Delete</kbd> Clear cell</li>
              <li><kbd>N</kbd> Toggle notes</li>
              <li><kbd>Ctrl+Z</kbd> Undo</li>
              <li><kbd>Arrow keys</kbd> Navigate</li>
            </ul>
          </div>

          <button
            className={styles.newGameBtn}
            onClick={handleNewPuzzle}
          >
            New Puzzle
          </button>
        </div>
      </div>
    </div>
  );
}
