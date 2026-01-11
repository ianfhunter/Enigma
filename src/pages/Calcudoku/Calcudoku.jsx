import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { formatTime, createSeededRandom, getTodayDateString, stringToSeed } from '../../data/wordUtils';
import styles from './Calcudoku.module.css';

const STORAGE_KEY = 'calcudoku-game-state';

const OPERATIONS = {
  '+': (nums) => nums.reduce((a, b) => a + b, 0),
  '-': (nums) => Math.abs(nums[0] - nums[1]),
  '×': (nums) => nums.reduce((a, b) => a * b, 1),
  '÷': (nums) => Math.max(nums[0], nums[1]) / Math.min(nums[0], nums[1]),
};

// Generate a valid Calcudoku solution (Latin square)
function generateSolution(size, random) {
  const grid = Array(size).fill(null).map(() => Array(size).fill(0));

  // Simple approach: create a valid Latin square using shift pattern
  const baseRow = Array.from({ length: size }, (_, i) => i + 1);

  // Shuffle the base row
  for (let i = baseRow.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [baseRow[i], baseRow[j]] = [baseRow[j], baseRow[i]];
  }

  // Create shifted rows
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      grid[row][col] = baseRow[(col + row) % size];
    }
  }

  // Shuffle rows within row groups to add more randomness
  const shuffledRows = [...Array(size).keys()];
  for (let i = shuffledRows.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [shuffledRows[i], shuffledRows[j]] = [shuffledRows[j], shuffledRows[i]];
  }

  const tempGrid = shuffledRows.map(i => [...grid[i]]);

  // Shuffle columns too
  const shuffledCols = [...Array(size).keys()];
  for (let i = shuffledCols.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [shuffledCols[i], shuffledCols[j]] = [shuffledCols[j], shuffledCols[i]];
  }

  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      grid[row][col] = tempGrid[row][shuffledCols[col]];
    }
  }

  return grid;
}

// Generate cages for the puzzle
function generateCages(size, solution, random) {
  const cages = [];
  const assigned = Array(size).fill(null).map(() => Array(size).fill(false));

  const cells = [];
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      cells.push([row, col]);
    }
  }

  // Shuffle cells
  for (let i = cells.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [cells[i], cells[j]] = [cells[j], cells[i]];
  }

  for (const [row, col] of cells) {
    if (assigned[row][col]) continue;

    // Try to create a cage starting from this cell
    const cageCells = [[row, col]];
    assigned[row][col] = true;

    // Randomly grow the cage (1-4 cells typically)
    const maxSize = Math.min(4, Math.floor(random() * 3) + 2);

    while (cageCells.length < maxSize) {
      // Find unassigned neighbors
      const neighbors = [];
      for (const [r, c] of cageCells) {
        const dirs = [[0, 1], [0, -1], [1, 0], [-1, 0]];
        for (const [dr, dc] of dirs) {
          const nr = r + dr;
          const nc = c + dc;
          if (nr >= 0 && nr < size && nc >= 0 && nc < size && !assigned[nr][nc]) {
            // Check if already in neighbors
            if (!neighbors.some(([a, b]) => a === nr && b === nc)) {
              neighbors.push([nr, nc]);
            }
          }
        }
      }

      if (neighbors.length === 0) break;

      // Add a random neighbor
      const [nr, nc] = neighbors[Math.floor(random() * neighbors.length)];
      cageCells.push([nr, nc]);
      assigned[nr][nc] = true;
    }

    // Determine operation and target
    const values = cageCells.map(([r, c]) => solution[r][c]);

    let operation, target;

    if (cageCells.length === 1) {
      operation = '';
      target = values[0];
    } else if (cageCells.length === 2) {
      // Can use any operation
      const ops = ['+', '-', '×'];
      if (Math.max(...values) % Math.min(...values) === 0) {
        ops.push('÷');
      }
      operation = ops[Math.floor(random() * ops.length)];
      target = OPERATIONS[operation](values);
    } else {
      // Only + and × for larger cages
      operation = random() < 0.5 ? '+' : '×';
      target = OPERATIONS[operation](values);
    }

    cages.push({
      cells: cageCells,
      operation,
      target,
    });
  }

  return cages;
}

function generatePuzzle(size, seed) {
  const random = createSeededRandom(seed);
  const solution = generateSolution(size, random);
  const cages = generateCages(size, solution, random);

  return { solution, cages };
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

export default function Calcudoku() {
  const [size, setSize] = useState(4);
  const [puzzle, setPuzzle] = useState(null);
  const [playerGrid, setPlayerGrid] = useState([]);
  const [notes, setNotes] = useState({});
  const [notesMode, setNotesMode] = useState(false);
  const [selectedCell, setSelectedCell] = useState(null);
  const [timer, setTimer] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [gameState, setGameState] = useState('playing'); // 'playing', 'won'
  const [showErrors, setShowErrors] = useState(true);
  const [isLoaded, setIsLoaded] = useState(false);

  const timerRef = useRef(null);

  const initPuzzle = useCallback((newSize = size, forceNew = false) => {
    const today = getTodayDateString();
    const saved = loadGameState();

    if (!forceNew && saved && saved.date === today && saved.size === newSize) {
      setPuzzle(saved.puzzle);
      setPlayerGrid(saved.playerGrid);
      setNotes(notesFromJSON(saved.notes));
      setTimer(saved.timer || 0);
      setGameState(saved.gameState || 'playing');
      setSize(newSize);
      setIsLoaded(true);
      return;
    }

    const seedString = `calcudoku-${today}-${newSize}${forceNew ? '-' + Date.now() : ''}`;
    const seed = stringToSeed(seedString);
    const newPuzzle = generatePuzzle(newSize, seed);

    setPuzzle(newPuzzle);
    setPlayerGrid(Array(newSize).fill(null).map(() => Array(newSize).fill(0)));
    setNotes({});
    setTimer(0);
    setGameState('playing');
    setSize(newSize);
    setIsLoaded(true);
  }, [size]);

  useEffect(() => {
    initPuzzle();
  }, []);

  useEffect(() => {
    if (!isLoaded || !puzzle) return;

    const today = getTodayDateString();
    saveGameState({
      date: today,
      size,
      puzzle,
      playerGrid,
      notes: notesToJSON(notes),
      timer,
      gameState,
    });
  }, [puzzle, playerGrid, notes, timer, gameState, size, isLoaded]);

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
    if (!puzzle || !playerGrid.length || gameState === 'won') return;

    // Check if grid is complete
    const isComplete = playerGrid.every(row => row.every(cell => cell !== 0));
    if (!isComplete) return;

    // Check if solution matches
    const isCorrect = playerGrid.every((row, r) =>
      row.every((cell, c) => cell === puzzle.solution[r][c])
    );

    if (isCorrect) {
      setGameState('won');
      setIsRunning(false);
    }
  }, [playerGrid, puzzle, gameState]);

  const handleCellClick = (row, col) => {
    if (gameState === 'won') return;
    setSelectedCell({ row, col });
  };

  const handleNumberInput = useCallback((num) => {
    if (!selectedCell || gameState === 'won') return;
    if (num > size) return;

    const { row, col } = selectedCell;
    const key = `${row}-${col}`;

    if (notesMode) {
      // Toggle note
      const cellNotes = notes[key] || new Set();
      const newNotes = new Set(cellNotes);
      if (newNotes.has(num)) {
        newNotes.delete(num);
      } else {
        newNotes.add(num);
      }
      setNotes(prev => ({ ...prev, [key]: newNotes }));
    } else {
      // Set cell value
      const newGrid = playerGrid.map(r => [...r]);
      newGrid[row][col] = num;
      setPlayerGrid(newGrid);

      // Clear notes for this cell
      setNotes(prev => {
        const newNotes = { ...prev };
        delete newNotes[key];
        return newNotes;
      });
    }
  }, [selectedCell, gameState, playerGrid, size, notesMode, notes]);

  const handleClear = useCallback(() => {
    if (!selectedCell || gameState === 'won') return;

    const { row, col } = selectedCell;
    const key = `${row}-${col}`;

    const newGrid = playerGrid.map(r => [...r]);
    newGrid[row][col] = 0;
    setPlayerGrid(newGrid);

    // Also clear notes
    setNotes(prev => {
      const newNotes = { ...prev };
      delete newNotes[key];
      return newNotes;
    });
  }, [selectedCell, gameState, playerGrid]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Notes toggle works even without selection
      if (e.key === 'n' || e.key === 'N') {
        setNotesMode(prev => !prev);
        return;
      }

      if (!selectedCell || gameState === 'won') return;

      const { row, col } = selectedCell;

      if (e.key >= '1' && e.key <= '9') {
        const num = parseInt(e.key);
        if (num <= size) handleNumberInput(num);
      } else if (e.key === 'Backspace' || e.key === 'Delete' || e.key === '0') {
        handleClear();
      } else if (e.key === 'ArrowUp' && row > 0) {
        setSelectedCell({ row: row - 1, col });
      } else if (e.key === 'ArrowDown' && row < size - 1) {
        setSelectedCell({ row: row + 1, col });
      } else if (e.key === 'ArrowLeft' && col > 0) {
        setSelectedCell({ row, col: col - 1 });
      } else if (e.key === 'ArrowRight' && col < size - 1) {
        setSelectedCell({ row, col: col + 1 });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedCell, gameState, size, handleNumberInput, handleClear]);

  const getCageForCell = (row, col) => {
    if (!puzzle) return null;
    return puzzle.cages.find(cage =>
      cage.cells.some(([r, c]) => r === row && c === col)
    );
  };

  const isCageTopLeft = (row, col, cage) => {
    if (!cage) return false;
    const minRow = Math.min(...cage.cells.map(([r]) => r));
    const minCol = Math.min(...cage.cells.filter(([r]) => r === minRow).map(([, c]) => c));
    return row === minRow && col === minCol;
  };

  const getCellBorders = (row, col) => {
    const cage = getCageForCell(row, col);
    if (!cage) return {};

    const inCage = (r, c) => cage.cells.some(([cr, cc]) => cr === r && cc === c);

    return {
      borderTop: row === 0 || !inCage(row - 1, col),
      borderBottom: row === size - 1 || !inCage(row + 1, col),
      borderLeft: col === 0 || !inCage(row, col - 1),
      borderRight: col === size - 1 || !inCage(row, col + 1),
    };
  };

  const hasError = (row, col) => {
    if (!showErrors || !playerGrid[row]?.[col]) return false;

    const value = playerGrid[row][col];

    // Check row duplicates
    for (let c = 0; c < size; c++) {
      if (c !== col && playerGrid[row][c] === value) return true;
    }

    // Check column duplicates
    for (let r = 0; r < size; r++) {
      if (r !== row && playerGrid[r][col] === value) return true;
    }

    return false;
  };

  const handleSizeChange = (newSize) => {
    initPuzzle(newSize, true);
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
        <h1 className={styles.title}>Calcudoku</h1>
        <p className={styles.instructions}>
          Fill each row and column with 1-{size}. Cage numbers must equal the target using the operation.
        </p>
      </div>

      <div className={styles.sizeSelector}>
        {[4, 5, 6].map((s) => (
          <button
            key={s}
            className={`${styles.sizeBtn} ${size === s ? styles.active : ''}`}
            onClick={() => handleSizeChange(s)}
          >
            {s}×{s}
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
            gridTemplateColumns: `repeat(${size}, 1fr)`,
          }}
        >
          {playerGrid.map((row, rowIndex) =>
            row.map((cell, colIndex) => {
              const cage = getCageForCell(rowIndex, colIndex);
              const borders = getCellBorders(rowIndex, colIndex);
              const isTopLeft = isCageTopLeft(rowIndex, colIndex, cage);
              const error = hasError(rowIndex, colIndex);

              return (
                <div
                  key={`${rowIndex}-${colIndex}`}
                  className={`${styles.cell}
                    ${selectedCell?.row === rowIndex && selectedCell?.col === colIndex ? styles.selected : ''}
                    ${borders.borderTop ? styles.cageTop : ''}
                    ${borders.borderBottom ? styles.cageBottom : ''}
                    ${borders.borderLeft ? styles.cageLeft : ''}
                    ${borders.borderRight ? styles.cageRight : ''}
                    ${error ? styles.error : ''}
                  `}
                  onClick={() => handleCellClick(rowIndex, colIndex)}
                >
                  {isTopLeft && cage && (
                    <span className={styles.cageLabel}>
                      {cage.target}{cage.operation}
                    </span>
                  )}
                  {cell !== 0 ? (
                    <span className={styles.cellValue}>{cell}</span>
                  ) : notes[`${rowIndex}-${colIndex}`]?.size > 0 ? (
                    <div className={styles.notes}>
                      {Array.from({ length: size }, (_, i) => i + 1).map(n => (
                        <span key={n} className={styles.note}>
                          {notes[`${rowIndex}-${colIndex}`]?.has(n) ? n : ''}
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
          {Array.from({ length: size }, (_, i) => i + 1).map(num => (
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
          onClick={() => initPuzzle(size, true)}
        >
          New Puzzle
        </button>
      </div>
    </div>
  );
}
