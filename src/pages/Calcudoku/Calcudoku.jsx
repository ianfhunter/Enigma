import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { formatTime } from '../../data/wordUtils';
import { usePersistedState } from '../../hooks/usePersistedState';
import GameHeader from '../../components/GameHeader';
import DifficultySelector from '../../components/DifficultySelector';
import SizeSelector from '../../components/SizeSelector';
import GiveUpButton from '../../components/GiveUpButton';
import GameResult from '../../components/GameResult';
import { useGameState } from '../../hooks/useGameState';
import styles from './Calcudoku.module.css';
import kenkenPuzzles from '../../../public/datasets/kenkenPuzzles.json';

const STORAGE_KEY = 'calcudoku-game-state';
const DIFFICULTIES = ['easy', 'medium'];

// Map dataset operations to display operations
const OP_MAP = {
  '+': '+',
  '-': '-',
  '*': '×',
  '/': '÷',
};

// Get available sizes from dataset for a given difficulty
function getAvailableSizes(difficulty) {
  const sizes = new Set();
  kenkenPuzzles.puzzles.forEach(p => {
    if (p.difficulty === difficulty) {
      sizes.add(p.rows); // Assuming square puzzles
    }
  });
  return Array.from(sizes).sort((a, b) => a - b);
}

// Parse the dataset clues grid into cages structure
function parseCluesIntoCages(clues, rows, cols) {
  const cages = [];
  const visited = Array(rows).fill(null).map(() => Array(cols).fill(false));

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (visited[r][c]) continue;

      const cellValue = clues[r][c];
      if (cellValue === '.' || cellValue === null) continue;

      // Parse the cage info from the cell
      let target, operation;

      if (typeof cellValue === 'number') {
        // Single-cell cage with just a number
        target = cellValue;
        operation = '';
        visited[r][c] = true;
        cages.push({
          cells: [[r, c]],
          target,
          operation,
        });
        continue;
      }

      // Parse string like '24*', '7+', '3-', '2/'
      const match = cellValue.match(/^(\d+)([+\-*/])$/);
      if (match) {
        target = parseInt(match[1]);
        operation = OP_MAP[match[2]] || match[2];
      } else {
        // Might be a single digit - treat as single-cell cage
        target = parseInt(cellValue);
        operation = '';
        if (isNaN(target)) continue;

        visited[r][c] = true;
        cages.push({
          cells: [[r, c]],
          target,
          operation,
        });
        continue;
      }

      // Flood fill to find all cells in this cage (all adjacent '.' cells)
      const cageCells = [[r, c]];
      visited[r][c] = true;

      const queue = [[r, c]];
      while (queue.length > 0) {
        const [cr, cc] = queue.shift();

        // Check all 4 neighbors
        for (const [dr, dc] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) {
          const nr = cr + dr;
          const nc = cc + dc;

          if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && !visited[nr][nc]) {
            const neighborValue = clues[nr][nc];
            if (neighborValue === '.') {
              visited[nr][nc] = true;
              cageCells.push([nr, nc]);
              queue.push([nr, nc]);
            }
          }
        }
      }

      cages.push({
        cells: cageCells,
        target,
        operation,
      });
    }
  }

  return cages;
}

// Parse dataset puzzle into our format
function parseDatasetPuzzle(puzzle) {
  const { rows, cols, clues, solution } = puzzle;
  const cages = parseCluesIntoCages(clues, rows, cols);

  return {
    solution,
    cages,
    size: rows,
  };
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


export default function Calcudoku() {
  const { t } = useTranslation();
  const [savedState, setSavedState] = usePersistedState(STORAGE_KEY, null);
  const [difficulty, setDifficulty] = useState('easy');
  const [size, setSize] = useState(4);
  const [puzzle, setPuzzle] = useState(null);
  const [playerGrid, setPlayerGrid] = useState([]);
  const [notes, setNotes] = useState({});
  const [notesMode, setNotesMode] = useState(false);
  const [selectedCell, setSelectedCell] = useState(null);
  const [timer, setTimer] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [gameState, setGameState] = useState('playing');
  const [showErrors, setShowErrors] = useState(true);
  const [isLoaded, setIsLoaded] = useState(false);

  const timerRef = useRef(null);

  const availableSizes = useMemo(() => getAvailableSizes(difficulty), [difficulty]);

  useEffect(() => {
    if (!size || !availableSizes.includes(size)) {
      if (availableSizes.length > 0) {
        setSize(availableSizes[0]);
      }
    }
  }, [size, availableSizes]);

  const initPuzzle = useCallback((newSize = size, newDifficulty = difficulty, forceNew = false) => {
    if (!forceNew && savedState && savedState.size === newSize && savedState.difficulty === newDifficulty && savedState.puzzle) {
      setPuzzle(savedState.puzzle);
      setPlayerGrid(savedState.playerGrid);
      setNotes(notesFromJSON(savedState.notes));
      setTimer(savedState.timer || 0);
      setGameState(savedState.gameState || 'playing');
      setSize(newSize);
      setDifficulty(newDifficulty);
      setIsLoaded(true);
      return;
    }

    // Find puzzles matching size and difficulty
    const filtered = kenkenPuzzles.puzzles.filter(
      p => p.rows === newSize && p.difficulty === newDifficulty
    );

    if (filtered.length === 0) {
      // Fallback to any puzzle of this size
      const fallback = kenkenPuzzles.puzzles.filter(p => p.rows === newSize);
      if (fallback.length > 0) {
        const selected = fallback[Math.floor(Math.random() * fallback.length)];
        const newPuzzle = parseDatasetPuzzle(selected);
        setPuzzle(newPuzzle);
        setPlayerGrid(Array(newSize).fill(null).map(() => Array(newSize).fill(0)));
        setNotes({});
        setTimer(0);
        setGameState('playing');
        setSize(newSize);
        setDifficulty(newDifficulty);
        setIsLoaded(true);
        return;
      }
    }

    const selected = filtered[Math.floor(Math.random() * filtered.length)];
    const newPuzzle = parseDatasetPuzzle(selected);

    setPuzzle(newPuzzle);
    setPlayerGrid(Array(newSize).fill(null).map(() => Array(newSize).fill(0)));
    setNotes({});
    setTimer(0);
    setGameState('playing');
    setSize(newSize);
    setDifficulty(newDifficulty);
    setIsLoaded(true);
  }, [size, difficulty]);

  useEffect(() => {
    initPuzzle();
  }, []);

  useEffect(() => {
    if (!isLoaded || !puzzle) return;

    setSavedState({
      size,
      difficulty,
      puzzle,
      playerGrid,
      notes: notesToJSON(notes),
      timer,
      gameState,
    });
  }, [puzzle, playerGrid, notes, timer, gameState, size, difficulty, isLoaded, setSavedState]);

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
    if (!puzzle || !playerGrid.length || gameState === 'won' || gameState === 'gaveUp') return;

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
    if (gameState === 'won' || gameState === 'gaveUp') return;
    setSelectedCell({ row, col });
  };

  const handleNumberInput = useCallback((num) => {
    if (!selectedCell || gameState === 'won' || gameState === 'gaveUp') return;
    if (num > size) return;

    const { row, col } = selectedCell;
    const key = `${row}-${col}`;

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
      const newGrid = playerGrid.map(r => [...r]);
      newGrid[row][col] = num;
      setPlayerGrid(newGrid);

      setNotes(prev => {
        const newNotes = { ...prev };
        delete newNotes[key];
        return newNotes;
      });
    }
  }, [selectedCell, gameState, playerGrid, size, notesMode, notes]);

  const handleClear = useCallback(() => {
    if (!selectedCell || gameState === 'won' || gameState === 'gaveUp') return;

    const { row, col } = selectedCell;
    const key = `${row}-${col}`;

    const newGrid = playerGrid.map(r => [...r]);
    newGrid[row][col] = 0;
    setPlayerGrid(newGrid);

    setNotes(prev => {
      const newNotes = { ...prev };
      delete newNotes[key];
      return newNotes;
    });
  }, [selectedCell, gameState, playerGrid]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'n' || e.key === 'N') {
        setNotesMode(prev => !prev);
        return;
      }

      if (!selectedCell || gameState === 'won' || gameState === 'gaveUp') return;

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

    for (let c = 0; c < size; c++) {
      if (c !== col && playerGrid[row][c] === value) return true;
    }

    for (let r = 0; r < size; r++) {
      if (r !== row && playerGrid[r][col] === value) return true;
    }

    return false;
  };

  const handleSizeChange = (newSize) => {
    initPuzzle(newSize, difficulty, true);
  };

  const handleDifficultyChange = (newDiff) => {
    setDifficulty(newDiff);
    initPuzzle(size, newDiff, true);
  };

  const handleGiveUp = () => {
    if (!puzzle || gameState !== 'playing') return;
    setPlayerGrid(puzzle.solution.map(row => [...row]));
    setGameState('gaveUp');
    setIsRunning(false);
  };

  if (!isLoaded || !puzzle) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>{t('common.loadingPuzzle')}</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <GameHeader
        title="Calcudoku"
        instructions={`Fill each row and column with 1-${size}. Cage numbers must equal the target using the operation.`}
      />

      <DifficultySelector
        difficulties={DIFFICULTIES}
        selected={difficulty}
        onSelect={handleDifficultyChange}
      />

      <SizeSelector
        sizes={availableSizes}
        selected={size}
        onSelect={handleSizeChange}
      />

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
          <GameResult
            state="won"
            title={t('gameStatus.solved')}
            message={t('common.completedIn', { time: formatTime(timer) })}
          />
        )}

        {gameState === 'gaveUp' && (
          <GameResult
            state="gaveup"
            title="Solution Revealed"
            message="Better luck next time!"
          />
        )}

        <div className={styles.buttons}>
          <GiveUpButton
            onGiveUp={handleGiveUp}
            disabled={gameState !== 'playing'}
          />
          <button
            className={styles.newGameBtn}
            onClick={() => initPuzzle(size, difficulty, true)}
          >
            New Puzzle
          </button>
        </div>
      </div>
    </div>
  );
}
