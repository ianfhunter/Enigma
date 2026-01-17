import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { formatTime, createSeededRandom, getTodayDateString, stringToSeed } from '../../data/wordUtils';
import SeedDisplay from '../../components/SeedDisplay';
import styles from './Kakuro.module.css';

const STORAGE_KEY = 'kakuro-game-state';

// Load puzzles from dataset
let puzzleDataset = null;
async function loadPuzzleDataset() {
  if (puzzleDataset) return puzzleDataset;
  try {
    const response = await fetch('/datasets/kakuroPuzzles.json');
    puzzleDataset = await response.json();
    return puzzleDataset;
  } catch (e) {
    console.error('Failed to load Kakuro puzzles:', e);
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

// Export helpers for testing
export {
  selectPuzzle,
  notesToJSON,
  notesFromJSON,
};

function loadGameState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.error('Failed to load game state:', e);
  }
  return null;
}

function saveGameState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('Failed to save game state:', e);
  }
}

export default function Kakuro() {
  const [difficulty, setDifficulty] = useState('easy');
  const [puzzle, setPuzzle] = useState(null);
  const [playerValues, setPlayerValues] = useState({});
  const [notes, setNotes] = useState({});
  const [notesMode, setNotesMode] = useState(false);
  const [selectedCell, setSelectedCell] = useState(null);
  const [timer, setTimer] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [gameState, setGameState] = useState('playing');
  const [showErrors, setShowErrors] = useState(true);
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [seed, setSeed] = useState(null);

  const timerRef = useRef(null);

  const initPuzzle = useCallback(async (newDifficulty = difficulty, forceNew = false) => {
    const today = getTodayDateString();
    const saved = loadGameState();

    // Try to restore saved state
    if (!forceNew && saved && saved.date === today && saved.difficulty === newDifficulty && saved.puzzleId) {
      setPuzzle(saved.puzzle);
      setPlayerValues(saved.playerValues || {});
      setNotes(notesFromJSON(saved.notes));
      setTimer(saved.timer || 0);
      setGameState(saved.gameState || 'playing');
      setDifficulty(newDifficulty);
      setIsLoaded(true);
      // Restore seed from saved state or compute it
      if (saved.seed) {
        setSeed(saved.seed);
      } else {
        const seedString = `kakuro-${today}-${newDifficulty}`;
        setSeed(stringToSeed(seedString));
      }
      return;
    }

    // Load dataset and select new puzzle
    const dataset = await loadPuzzleDataset();
    if (!dataset || !dataset.puzzles) {
      setLoadError('Failed to load puzzle dataset');
      return;
    }

    const seedString = `kakuro-${today}-${newDifficulty}${forceNew ? '-' + Date.now() : ''}`;
    const gameSeed = stringToSeed(seedString);
    const selected = selectPuzzle(dataset.puzzles, newDifficulty, gameSeed);

    setSeed(gameSeed);
    setPuzzle(selected);
    setPlayerValues({});
    setNotes({});
    setTimer(0);
    setGameState('playing');
    setDifficulty(newDifficulty);
    setSelectedCell(null);
    setIsLoaded(true);
  }, [difficulty]);

  useEffect(() => {
    initPuzzle();
  }, []);

  // Save game state
  useEffect(() => {
    if (!isLoaded || !puzzle) return;

    const today = getTodayDateString();
    saveGameState({
      date: today,
      difficulty,
      puzzleId: puzzle.id,
      puzzle,
      playerValues,
      notes: notesToJSON(notes),
      timer,
      gameState,
    });
  }, [puzzle, playerValues, notes, timer, gameState, difficulty, isLoaded]);

  // Timer
  useEffect(() => {
    if (isRunning && gameState === 'playing') {
      timerRef.current = setInterval(() => {
        setTimer(prev => prev + 1);
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, gameState]);

  useEffect(() => {
    if (isLoaded && gameState === 'playing') {
      setIsRunning(true);
    }
  }, [isLoaded, gameState]);

  // Check for win
  useEffect(() => {
    if (!puzzle || gameState === 'won' || gameState === 'gaveUp') return;

    const { grid, solution } = puzzle;
    if (!solution) return;

    // Check all white cells are filled correctly
    for (let row = 0; row < grid.length; row++) {
      for (let col = 0; col < grid[row].length; col++) {
        const cell = grid[row][col];
        if (cell.type === 'white') {
          const key = `${row},${col}`;
          const playerVal = playerValues[key];
          const solutionVal = solution[row]?.[col];
          if (!playerVal || playerVal !== solutionVal) {
            return;
          }
        }
      }
    }

    setGameState('won');
    setIsRunning(false);
  }, [playerValues, puzzle, gameState]);

  const handleCellClick = (row, col) => {
    if (gameState === 'won' || gameState === 'gaveUp') return;
    if (!puzzle) return;

    const cell = puzzle.grid[row][col];
    if (cell.type === 'white') {
      setSelectedCell({ row, col });
    }
  };

  const handleNumberInput = useCallback((num) => {
    if (!selectedCell || gameState === 'won' || gameState === 'gaveUp') return;

    const key = `${selectedCell.row},${selectedCell.col}`;

    if (notesMode) {
      const cellNotes = notes[key] || new Set();
      const newNotes = new Set(cellNotes);
      if (newNotes.has(num)) {
        newNotes.delete(num);
      } else {
        newNotes.add(num);
      }
      setNotes(prev => ({ ...prev, [key]: newNotes }));
    } else {
      setPlayerValues(prev => ({ ...prev, [key]: num }));
      setNotes(prev => {
        const newNotes = { ...prev };
        delete newNotes[key];
        return newNotes;
      });
    }
  }, [selectedCell, gameState, notesMode, notes]);

  const handleClear = useCallback(() => {
    if (!selectedCell || gameState === 'won' || gameState === 'gaveUp') return;

    const key = `${selectedCell.row},${selectedCell.col}`;
    setPlayerValues(prev => {
      const newValues = { ...prev };
      delete newValues[key];
      return newValues;
    });
    setNotes(prev => {
      const newNotes = { ...prev };
      delete newNotes[key];
      return newNotes;
    });
  }, [selectedCell, gameState]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'n' || e.key === 'N') {
        setNotesMode(prev => !prev);
        return;
      }

      if (!selectedCell || gameState === 'won' || gameState === 'gaveUp' || !puzzle) return;

      const { row, col } = selectedCell;
      const { grid } = puzzle;

      if (e.key >= '1' && e.key <= '9') {
        handleNumberInput(parseInt(e.key));
      } else if (e.key === 'Backspace' || e.key === 'Delete' || e.key === '0') {
        handleClear();
      } else if (e.key === 'ArrowUp') {
        for (let r = row - 1; r >= 0; r--) {
          if (grid[r][col].type === 'white') {
            setSelectedCell({ row: r, col });
            break;
          }
        }
      } else if (e.key === 'ArrowDown') {
        for (let r = row + 1; r < grid.length; r++) {
          if (grid[r][col].type === 'white') {
            setSelectedCell({ row: r, col });
            break;
          }
        }
      } else if (e.key === 'ArrowLeft') {
        for (let c = col - 1; c >= 0; c--) {
          if (grid[row][c].type === 'white') {
            setSelectedCell({ row, col: c });
            break;
          }
        }
      } else if (e.key === 'ArrowRight') {
        for (let c = col + 1; c < grid[row].length; c++) {
          if (grid[row][c].type === 'white') {
            setSelectedCell({ row, col: c });
            break;
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedCell, gameState, puzzle, handleNumberInput, handleClear]);

  const hasError = (row, col) => {
    if (!showErrors || !puzzle?.solution) return false;
    const key = `${row},${col}`;
    const playerVal = playerValues[key];
    if (!playerVal) return false;
    return playerVal !== puzzle.solution[row]?.[col];
  };

  const handleGiveUp = () => {
    if (!puzzle || gameState !== 'playing') return;

    // Fill in all values from solution
    const newValues = {};
    for (let row = 0; row < puzzle.grid.length; row++) {
      for (let col = 0; col < puzzle.grid[row].length; col++) {
        if (puzzle.grid[row][col].type === 'white' && puzzle.solution?.[row]?.[col]) {
          newValues[`${row},${col}`] = puzzle.solution[row][col];
        }
      }
    }
    setPlayerValues(newValues);
    setGameState('gaveUp');
    setIsRunning(false);
  };

  if (loadError) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>{loadError}</div>
        <button onClick={() => window.location.reload()}>Retry</button>
      </div>
    );
  }

  if (!isLoaded || !puzzle) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading puzzle...</div>
      </div>
    );
  }

  const { grid, rows, cols } = puzzle;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Link to="/" className={styles.backLink}>← Back to Games</Link>
        <h1 className={styles.title}>Kakuro</h1>
        <p className={styles.instructions}>
          Fill white cells with 1-9. Numbers in a run must be unique and sum to the clue.
          <br />
          <small>Top-left number = sum down ↓ | Bottom-right number = sum across →</small>
        </p>
      </div>

      {seed !== null && (
        <SeedDisplay
          seed={seed}
          variant="compact"
          showNewButton={false}
          showShare={false}
        />
      )}

      <div className={styles.difficultySelector}>
        {['easy', 'medium', 'hard'].map((d) => (
          <button
            key={d}
            className={`${styles.difficultyBtn} ${difficulty === d ? styles.active : ''}`}
            onClick={() => initPuzzle(d, true)}
          >
            {d.charAt(0).toUpperCase() + d.slice(1)}
          </button>
        ))}
      </div>

      <div className={styles.gameArea}>
        <div className={styles.statsBar}>
          <div className={styles.stat}>
            <span className={styles.statLabel}>Time</span>
            <span className={styles.statValue}>{formatTime(timer)}</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statLabel}>Size</span>
            <span className={styles.statValue}>{rows}×{cols}</span>
          </div>
          <label className={styles.toggle}>
            <input
              type="checkbox"
              checked={showErrors}
              onChange={(e) => setShowErrors(e.target.checked)}
            />
            <span className={styles.toggleLabel}>Show Errors</span>
          </label>
        </div>

        <div
          className={styles.board}
          style={{
            gridTemplateColumns: `repeat(${cols}, 1fr)`,
          }}
        >
          {grid.map((row, rowIndex) =>
            row.map((cell, colIndex) => {
              if (cell.type === 'black') {
                return (
                  <div
                    key={`${rowIndex}-${colIndex}`}
                    className={`${styles.cell} ${styles.black}`}
                  />
                );
              }

              if (cell.type === 'clue') {
                return (
                  <div
                    key={`${rowIndex}-${colIndex}`}
                    className={`${styles.cell} ${styles.clue}`}
                  >
                    {cell.down && (
                      <span className={styles.clueDown}>{cell.down}</span>
                    )}
                    {cell.across && (
                      <span className={styles.clueAcross}>{cell.across}</span>
                    )}
                    <div className={styles.clueDiagonal} />
                  </div>
                );
              }

              // White cell (playable)
              const key = `${rowIndex},${colIndex}`;
              const value = playerValues[key];
              const error = hasError(rowIndex, colIndex);
              const cellNotes = notes[key];
              const isSelected = selectedCell?.row === rowIndex && selectedCell?.col === colIndex;

              return (
                <div
                  key={`${rowIndex}-${colIndex}`}
                  className={`${styles.cell} ${styles.white}
                    ${isSelected ? styles.selected : ''}
                    ${error ? styles.error : ''}
                  `}
                  onClick={() => handleCellClick(rowIndex, colIndex)}
                >
                  {value ? (
                    <span className={styles.cellValue}>{value}</span>
                  ) : cellNotes?.size > 0 ? (
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
            })
          )}
        </div>

        <div className={styles.numberPad}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
            <button
              key={num}
              className={styles.numBtn}
              onClick={() => handleNumberInput(num)}
            >
              {num}
            </button>
          ))}
          <button className={styles.numBtn} onClick={handleClear}>
            ⌫
          </button>
        </div>

        <div className={styles.actionButtons}>
          <button
            className={`${styles.actionBtn} ${notesMode ? styles.active : ''}`}
            onClick={() => setNotesMode(!notesMode)}
            title="Toggle notes mode (N)"
          >
            ✏️ Notes {notesMode ? 'ON' : 'OFF'}
          </button>
        </div>

        {gameState === 'won' && (
          <div className={styles.winMessage}>
            🎉 Solved in {formatTime(timer)}!
          </div>
        )}

        {gameState === 'gaveUp' && (
          <div className={styles.gaveUpMessage}>
            <span className={styles.gaveUpIcon}>📖</span>
            <span>Solution Revealed</span>
          </div>
        )}

        <div className={styles.buttonRow}>
          <button
            className={styles.giveUpBtn}
            onClick={handleGiveUp}
            disabled={gameState !== 'playing'}
          >
            Give Up
          </button>
          <button
            className={styles.newGameBtn}
            onClick={() => initPuzzle(difficulty, true)}
          >
            New Puzzle
          </button>
        </div>
      </div>
    </div>
  );
}
