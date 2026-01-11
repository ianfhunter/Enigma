import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { formatTime, createSeededRandom, getTodayDateString, stringToSeed } from '../../data/wordUtils';
import styles from './Kakuro.module.css';

const STORAGE_KEY = 'kakuro-game-state';

// Predefined Kakuro puzzles for different difficulties
// Each puzzle has: grid layout, clues (across/down sums), and solution
const PUZZLE_TEMPLATES = {
  easy: [
    {
      size: 6,
      // 0 = black, -1 = clue cell, positive = white cell ID
      layout: [
        [0, 0, -1, -1, 0, 0],
        [0, -1, 1, 2, -1, 0],
        [-1, 3, 4, 5, 6, -1],
        [-1, 7, 8, 9, 10, -1],
        [0, -1, 11, 12, -1, 0],
        [0, 0, -1, -1, 0, 0],
      ],
      clues: [
        { row: 0, col: 2, down: 20 },
        { row: 0, col: 3, down: 18 },
        { row: 1, col: 1, across: 3, down: 7 },
        { row: 1, col: 4, down: 11 },
        { row: 2, col: 0, across: 24 },
        { row: 3, col: 0, across: 14 },
        { row: 4, col: 1, across: 15 },
      ],
      solution: {
        1: 1, 2: 2, 3: 3, 4: 9, 5: 7, 6: 5, 7: 4, 8: 3, 9: 1, 10: 6, 11: 7, 12: 8
      }
    }
  ],
  medium: [
    {
      size: 6,
      layout: [
        [0, -1, -1, -1, -1, 0],
        [-1, 1, 2, 3, 4, -1],
        [-1, 5, 6, 7, 8, -1],
        [-1, 9, 10, 11, 12, -1],
        [-1, 13, 14, 15, 16, -1],
        [0, -1, -1, -1, -1, 0],
      ],
      clues: [
        { row: 0, col: 1, down: 15 },
        { row: 0, col: 2, down: 24 },
        { row: 0, col: 3, down: 16 },
        { row: 0, col: 4, down: 24 },
        { row: 1, col: 0, across: 18 },
        { row: 2, col: 0, across: 22 },
        { row: 3, col: 0, across: 17 },
        { row: 4, col: 0, across: 22 },
      ],
      solution: {
        1: 1, 2: 3, 3: 6, 4: 8,
        5: 2, 6: 4, 7: 7, 8: 9,
        9: 5, 10: 8, 11: 1, 12: 3,
        13: 7, 14: 9, 15: 2, 16: 4
      }
    }
  ]
};

// Generate a random puzzle based on difficulty
function generatePuzzle(difficulty, seed) {
  const random = createSeededRandom(seed);
  const templates = PUZZLE_TEMPLATES[difficulty] || PUZZLE_TEMPLATES.easy;
  const templateIndex = Math.floor(random() * templates.length);
  return JSON.parse(JSON.stringify(templates[templateIndex]));
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

  const timerRef = useRef(null);

  const initPuzzle = useCallback((newDifficulty = difficulty, forceNew = false) => {
    const today = getTodayDateString();
    const saved = loadGameState();

    if (!forceNew && saved && saved.date === today && saved.difficulty === newDifficulty) {
      setPuzzle(saved.puzzle);
      setPlayerValues(saved.playerValues);
      setNotes(notesFromJSON(saved.notes));
      setTimer(saved.timer || 0);
      setGameState(saved.gameState || 'playing');
      setDifficulty(newDifficulty);
      setIsLoaded(true);
      return;
    }

    const seedString = `kakuro-${today}-${newDifficulty}${forceNew ? '-' + Date.now() : ''}`;
    const seed = stringToSeed(seedString);
    const newPuzzle = generatePuzzle(newDifficulty, seed);

    setPuzzle(newPuzzle);
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

  useEffect(() => {
    if (!isLoaded || !puzzle) return;

    const today = getTodayDateString();
    saveGameState({
      date: today,
      difficulty,
      puzzle,
      playerValues,
      notes: notesToJSON(notes),
      timer,
      gameState,
    });
  }, [puzzle, playerValues, notes, timer, gameState, difficulty, isLoaded]);

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
    if (!puzzle || gameState === 'won') return;

    // Check if all cells are filled correctly
    const { layout, solution } = puzzle;

    for (let row = 0; row < layout.length; row++) {
      for (let col = 0; col < layout[row].length; col++) {
        const cellId = layout[row][col];
        if (cellId > 0) {
          if (playerValues[cellId] !== solution[cellId]) {
            return;
          }
        }
      }
    }

    setGameState('won');
    setIsRunning(false);
  }, [playerValues, puzzle, gameState]);

  const handleCellClick = (row, col) => {
    if (gameState === 'won') return;
    if (!puzzle) return;

    const cellId = puzzle.layout[row][col];
    if (cellId > 0) {
      setSelectedCell({ row, col, id: cellId });
    }
  };

  const handleNumberInput = useCallback((num) => {
    if (!selectedCell || gameState === 'won') return;

    const cellId = selectedCell.id;

    if (notesMode) {
      // Toggle note
      const cellNotes = notes[cellId] || new Set();
      const newNotes = new Set(cellNotes);
      if (newNotes.has(num)) {
        newNotes.delete(num);
      } else {
        newNotes.add(num);
      }
      setNotes(prev => ({ ...prev, [cellId]: newNotes }));
    } else {
      // Set cell value
      setPlayerValues(prev => ({
        ...prev,
        [cellId]: num,
      }));

      // Clear notes for this cell
      setNotes(prev => {
        const newNotes = { ...prev };
        delete newNotes[cellId];
        return newNotes;
      });
    }
  }, [selectedCell, gameState, notesMode, notes]);

  const handleClear = useCallback(() => {
    if (!selectedCell || gameState === 'won') return;

    const cellId = selectedCell.id;

    setPlayerValues(prev => {
      const newValues = { ...prev };
      delete newValues[cellId];
      return newValues;
    });

    // Also clear notes
    setNotes(prev => {
      const newNotes = { ...prev };
      delete newNotes[cellId];
      return newNotes;
    });
  }, [selectedCell, gameState]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Notes toggle works even without selection
      if (e.key === 'n' || e.key === 'N') {
        setNotesMode(prev => !prev);
        return;
      }

      if (!selectedCell || gameState === 'won' || !puzzle) return;

      const { row, col } = selectedCell;

      if (e.key >= '1' && e.key <= '9') {
        handleNumberInput(parseInt(e.key));
      } else if (e.key === 'Backspace' || e.key === 'Delete' || e.key === '0') {
        handleClear();
      } else if (e.key === 'ArrowUp') {
        for (let r = row - 1; r >= 0; r--) {
          if (puzzle.layout[r][col] > 0) {
            setSelectedCell({ row: r, col, id: puzzle.layout[r][col] });
            break;
          }
        }
      } else if (e.key === 'ArrowDown') {
        for (let r = row + 1; r < puzzle.size; r++) {
          if (puzzle.layout[r][col] > 0) {
            setSelectedCell({ row: r, col, id: puzzle.layout[r][col] });
            break;
          }
        }
      } else if (e.key === 'ArrowLeft') {
        for (let c = col - 1; c >= 0; c--) {
          if (puzzle.layout[row][c] > 0) {
            setSelectedCell({ row, col: c, id: puzzle.layout[row][c] });
            break;
          }
        }
      } else if (e.key === 'ArrowRight') {
        for (let c = col + 1; c < puzzle.size; c++) {
          if (puzzle.layout[row][c] > 0) {
            setSelectedCell({ row, col: c, id: puzzle.layout[row][c] });
            break;
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedCell, gameState, puzzle, handleNumberInput, handleClear]);

  const getClueForCell = (row, col) => {
    if (!puzzle) return null;
    return puzzle.clues.find(c => c.row === row && c.col === col);
  };

  const hasError = (cellId) => {
    if (!showErrors || !playerValues[cellId] || !puzzle) return false;
    return playerValues[cellId] !== puzzle.solution[cellId];
  };

  if (!isLoaded || !puzzle) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading puzzle...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Link to="/" className={styles.backLink}>← Back to Games</Link>
        <h1 className={styles.title}>Kakuro</h1>
        <p className={styles.instructions}>
          Fill white cells with 1-9. Numbers in a run must be unique and sum to the clue.
          <br />
          <small>Top-left number = sum across → | Bottom-right number = sum down ↓</small>
        </p>
      </div>

      <div className={styles.difficultySelector}>
        {['easy', 'medium'].map((d) => (
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
            gridTemplateColumns: `repeat(${puzzle.size}, 1fr)`,
          }}
        >
          {puzzle.layout.map((row, rowIndex) =>
            row.map((cellType, colIndex) => {
              const clue = getClueForCell(rowIndex, colIndex);

              if (cellType === 0) {
                // Black cell
                return (
                  <div
                    key={`${rowIndex}-${colIndex}`}
                    className={`${styles.cell} ${styles.black}`}
                  />
                );
              }

              if (cellType === -1) {
                // Clue cell
                return (
                  <div
                    key={`${rowIndex}-${colIndex}`}
                    className={`${styles.cell} ${styles.clue}`}
                  >
                    {clue?.down && (
                      <span className={styles.clueDown}>{clue.down}</span>
                    )}
                    {clue?.across && (
                      <span className={styles.clueAcross}>{clue.across}</span>
                    )}
                    <div className={styles.clueDiagonal} />
                  </div>
                );
              }

              // White cell (playable)
              const cellId = cellType;
              const value = playerValues[cellId];
              const error = hasError(cellId);
              const cellNotes = notes[cellId];

              return (
                <div
                  key={`${rowIndex}-${colIndex}`}
                  className={`${styles.cell} ${styles.white}
                    ${selectedCell?.id === cellId ? styles.selected : ''}
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

        <button
          className={styles.newGameBtn}
          onClick={() => initPuzzle(difficulty, true)}
        >
          New Puzzle
        </button>
      </div>
    </div>
  );
}
