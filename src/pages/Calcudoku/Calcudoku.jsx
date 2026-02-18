import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { formatTime, createSeededRandom } from '../../data/wordUtils';
import { usePersistedState } from '../../hooks/usePersistedState';
import GameHeader from '../../components/GameHeader';
import DifficultySelector from '../../components/DifficultySelector';
import SizeSelector from '../../components/SizeSelector';
import GiveUpButton from '../../components/GiveUpButton';
import GameResult from '../../components/GameResult';
import { useGameState } from '../../hooks/useGameState';
import { useGameStats } from '../../hooks/useGameStats';
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

function parseCageLabel(cellValue) {
  if (typeof cellValue === 'number') {
    return { target: cellValue, operation: '' };
  }

  const match = String(cellValue).match(/^(\d+)([+\-*/])$/);
  if (match) {
    return { target: parseInt(match[1], 10), operation: OP_MAP[match[2]] || match[2] };
  }

  const target = parseInt(cellValue, 10);
  if (Number.isNaN(target)) return null;
  return { target, operation: '' };
}

function getCageValueBounds(cage, solution, allowSingleOperationCages = false) {
  const values = cage.cells.map(([r, c]) => solution[r][c]);

  if (cage.operation === '+') {
    const sum = values.reduce((acc, value) => acc + value, 0);
    const hasEnoughCells = allowSingleOperationCages ? values.length > 0 : values.length > 1;
    return { isPossible: sum <= cage.target, isSolved: hasEnoughCells && sum === cage.target };
  }

  if (cage.operation === '×') {
    const product = values.reduce((acc, value) => acc * value, 1);
    const hasEnoughCells = allowSingleOperationCages ? values.length > 0 : values.length > 1;
    return {
      isPossible: product <= cage.target && cage.target % product === 0,
      isSolved: hasEnoughCells && product === cage.target,
    };
  }

  if (cage.operation === '-') {
    if (values.length < 2) {
      return {
        isPossible: true,
        isSolved: allowSingleOperationCages && values.length === 1,
      };
    }
    const diff = Math.max(...values) - Math.min(...values);
    const hasEnoughCells = allowSingleOperationCages ? values.length > 0 : values.length > 1;
    return { isPossible: true, isSolved: hasEnoughCells && diff === cage.target };
  }

  if (cage.operation === '÷') {
    if (values.length < 2) {
      return {
        isPossible: true,
        isSolved: allowSingleOperationCages && values.length === 1,
      };
    }
    const max = Math.max(...values);
    const min = Math.min(...values);
    const quotient = min === 0 ? Infinity : max / min;
    const hasEnoughCells = allowSingleOperationCages ? values.length > 0 : values.length > 1;
    return { isPossible: true, isSolved: hasEnoughCells && quotient === cage.target };
  }

  const singleValue = values[0];
  const isSingle = values.length === 1;
  return {
    isPossible: isSingle && singleValue === cage.target,
    isSolved: isSingle && singleValue === cage.target,
  };
}


function sanitizeCages(cages, solution) {
  return cages.map((cage) => {
    const values = cage.cells.map(([r, c]) => solution[r][c]);

    if (cage.cells.length === 1) {
      return {
        ...cage,
        target: values[0],
        operation: '',
      };
    }

    if (cage.operation === '+') {
      return {
        ...cage,
        target: values.reduce((acc, value) => acc + value, 0),
      };
    }

    if (cage.operation === '×') {
      return {
        ...cage,
        target: values.reduce((acc, value) => acc * value, 1),
      };
    }

    if (cage.operation === '-') {
      if (cage.cells.length > 2) {
        return {
          ...cage,
          operation: '+',
          target: values.reduce((acc, value) => acc + value, 0),
        };
      }

      return {
        ...cage,
        target: Math.abs(values[0] - values[1]),
      };
    }

    if (cage.operation === '÷') {
      if (cage.cells.length > 2) {
        return {
          ...cage,
          operation: '+',
          target: values.reduce((acc, value) => acc + value, 0),
        };
      }

      const [a, b] = values;
      const [max, min] = a > b ? [a, b] : [b, a];
      return {
        ...cage,
        target: max / min,
      };
    }

    if (cage.cells.length > 1) {
      return {
        ...cage,
        target: values.reduce((acc, value) => acc + value, 0),
        operation: '+',
        anchor: cage.anchor,
      };
    }

    return {
      ...cage,
      target: values[0],
      operation: '',
      anchor: cage.anchor,
    };
  });
}

function parseCluesIntoCagesFallback(clues, rows, cols) {
  const cages = [];
  const cageByCell = Array.from({ length: rows }, () => Array(cols).fill(-1));
  const queue = [];

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cellValue = clues[r][c];
      if (cellValue === '.' || cellValue === null) continue;

      const parsed = parseCageLabel(cellValue);
      if (!parsed) continue;

      const cageIndex = cages.length;
      cages.push({ cells: [[r, c]], anchor: [r, c], ...parsed });
      cageByCell[r][c] = cageIndex;
      queue.push([r, c, cageIndex]);
    }
  }

  let pointer = 0;
  while (pointer < queue.length) {
    const [row, col, cageIndex] = queue[pointer++];

    for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nr = row + dr;
      const nc = col + dc;

      if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;
      if (clues[nr][nc] !== '.' && clues[nr][nc] !== null) continue;
      if (cageByCell[nr][nc] !== -1) continue;

      const [anchorRow, anchorCol] = cages[cageIndex].anchor;
      if (nr < anchorRow || nc < anchorCol) continue;

      cageByCell[nr][nc] = cageIndex;
      cages[cageIndex].cells.push([nr, nc]);
      queue.push([nr, nc, cageIndex]);
    }
  }

  return cages;
}

// Parse the dataset clues grid into cages structure
export function parseCluesIntoCages(clues, rows, cols, solution, allowSingleOperationCages = false) {
  const cages = [];
  const cageByCell = Array.from({ length: rows }, () => Array(cols).fill(-1));
  const unassigned = new Set();

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cellValue = clues[r][c];
      if (cellValue === '.' || cellValue === null) {
        unassigned.add(`${r}-${c}`);
        continue;
      }

      const parsed = parseCageLabel(cellValue);
      if (!parsed) continue;

      const cageIndex = cages.length;
      cages.push({ cells: [[r, c]], anchor: [r, c], ...parsed });
      cageByCell[r][c] = cageIndex;
    }
  }

  const getCandidatesForCell = (row, col) => {
    const candidates = new Set();
    for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nr = row + dr;
      const nc = col + dc;
      if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;
      const cageIndex = cageByCell[nr][nc];
      if (cageIndex === -1) continue;
      const [anchorRow, anchorCol] = cages[cageIndex].anchor;
      if (row < anchorRow || col < anchorCol) continue;
      candidates.add(cageIndex);
    }
    return Array.from(candidates);
  };

  const pickNextCell = () => {
    let best = null;
    let bestCandidates = null;

    for (const key of unassigned) {
      const [row, col] = key.split('-').map(Number);
      const candidates = getCandidatesForCell(row, col);
      if (candidates.length === 0) continue;

      if (!best || candidates.length < bestCandidates.length) {
        best = [row, col, key];
        bestCandidates = candidates;
        if (candidates.length === 1) break;
      }
    }

    return { best, bestCandidates };
  };

  const assignCells = () => {
    if (unassigned.size === 0) {
      return cages.every((cage) => getCageValueBounds(cage, solution, allowSingleOperationCages).isSolved);
    }

    const { best, bestCandidates } = pickNextCell();
    if (!best) return false;

    const [row, col, key] = best;

    for (const cageIndex of bestCandidates) {
      const cage = cages[cageIndex];
      cage.cells.push([row, col]);
      cageByCell[row][col] = cageIndex;
      unassigned.delete(key);

      if (getCageValueBounds(cage, solution, allowSingleOperationCages).isPossible && assignCells()) {
        return true;
      }

      unassigned.add(key);
      cageByCell[row][col] = -1;
      cage.cells.pop();
    }

    return false;
  };

  if (!assignCells()) {
    if (!allowSingleOperationCages) {
      return parseCluesIntoCages(clues, rows, cols, solution, true);
    }

    return sanitizeCages(parseCluesIntoCagesFallback(clues, rows, cols), solution).map(({ anchor, ...cage }) => cage);
  }

  return sanitizeCages(cages, solution).map(({ anchor, ...cage }) => cage);
}


function buildCageLookup(cages, size) {
  const lookup = Array.from({ length: size }, () => Array(size).fill(null));

  cages.forEach((cage) => {
    cage.cells.forEach(([row, col]) => {
      lookup[row][col] = cage;
    });
  });

  return lookup;
}

function isCagePlacementValid(grid, cage, size) {
  const values = cage.cells.map(([row, col]) => grid[row][col]);
  const filled = values.filter((value) => value !== 0);
  const emptyCount = values.length - filled.length;

  if (filled.length === 0) return true;

  switch (cage.operation) {
    case '+': {
      const sum = filled.reduce((acc, value) => acc + value, 0);
      return sum <= cage.target && sum + emptyCount * size >= cage.target;
    }
    case '×': {
      const product = filled.reduce((acc, value) => acc * value, 1);
      if (product > cage.target || cage.target % product !== 0) return false;
      return true;
    }
    case '-': {
      if (filled.length < 2) return true;
      const [a, b] = filled;
      return Math.abs(a - b) === cage.target;
    }
    case '÷': {
      if (filled.length < 2) return true;
      const [a, b] = filled;
      const [max, min] = a > b ? [a, b] : [b, a];
      return min !== 0 && max / min === cage.target;
    }
    default:
      return filled.length === 1 && emptyCount === 0 && filled[0] === cage.target;
  }
}

export function countPuzzleSolutions(cages, size, limit = 2) {
  const grid = Array.from({ length: size }, () => Array(size).fill(0));
  const cageLookup = buildCageLookup(cages, size);
  let solutions = 0;

  const getCandidates = (row, col) => {
    const candidates = [];

    for (let value = 1; value <= size; value++) {
      let valid = true;

      for (let c = 0; c < size; c++) {
        if (grid[row][c] === value) {
          valid = false;
          break;
        }
      }
      if (!valid) continue;

      for (let r = 0; r < size; r++) {
        if (grid[r][col] === value) {
          valid = false;
          break;
        }
      }
      if (!valid) continue;

      grid[row][col] = value;
      const cage = cageLookup[row][col];
      if (cage && isCagePlacementValid(grid, cage, size)) {
        candidates.push(value);
      }
      grid[row][col] = 0;
    }

    return candidates;
  };

  const pickNextCell = () => {
    let best = null;
    let bestCandidates = null;

    for (let row = 0; row < size; row++) {
      for (let col = 0; col < size; col++) {
        if (grid[row][col] !== 0) continue;

        const candidates = getCandidates(row, col);
        if (candidates.length === 0) return { row, col, candidates };

        if (!best || candidates.length < bestCandidates.length) {
          best = { row, col, candidates };
          bestCandidates = candidates;
          if (candidates.length === 1) return best;
        }
      }
    }

    return best;
  };

  const search = () => {
    if (solutions >= limit) return;

    const next = pickNextCell();
    if (!next) {
      solutions += 1;
      return;
    }

    const { row, col, candidates } = next;
    if (candidates.length === 0) return;

    for (const value of candidates) {
      grid[row][col] = value;
      search();
      grid[row][col] = 0;

      if (solutions >= limit) return;
    }
  };

  search();
  return solutions;
}

function createSingletonCages(solution) {
  return solution.flatMap((row, rowIndex) =>
    row.map((value, colIndex) => ({
      cells: [[rowIndex, colIndex]],
      target: value,
      operation: '',
    }))
  );
}

// Parse dataset puzzle into our format
export function parseDatasetPuzzle(puzzle, enforceUnique = false) {
  const { rows, cols, clues, solution } = puzzle;
  let cages = parseCluesIntoCages(clues, rows, cols, solution);

  if (enforceUnique && countPuzzleSolutions(cages, rows, 2) !== 1) {
    cages = createSingletonCages(solution);
  }

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
  const { gameState, checkWin, giveUp, setGameState, reset: resetGameState, isPlaying, isWon, isGaveUp } = useGameState();
  const { recordWin, recordGiveUp } = useGameStats('calcudoku');
  const [showErrors, setShowErrors] = useState(false);
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
        const random = createSeededRandom(Date.now());
        const selected = fallback[Math.floor(random() * fallback.length)];
        const newPuzzle = parseDatasetPuzzle(selected, true);
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

    const random = createSeededRandom(Date.now());
    const selected = filtered[Math.floor(random() * filtered.length)];
    const newPuzzle = parseDatasetPuzzle(selected, true);

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
    if (isRunning && isPlaying) {
      timerRef.current = setInterval(() => {
        setTimer(prev => prev + 1);
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, isPlaying]);

  useEffect(() => {
    if (isLoaded && isPlaying) {
      setIsRunning(true);
    }
  }, [isLoaded, isPlaying]);

  // Check for win
  useEffect(() => {
    if (!puzzle || !playerGrid.length || !isPlaying) return;

    // Check if grid is complete
    const isComplete = playerGrid.every(row => row.every(cell => cell !== 0));
    if (!isComplete) return;

    // Check if solution matches
    const isCorrect = playerGrid.every((row, r) =>
      row.every((cell, c) => cell === puzzle.solution[r][c])
    );

    if (isCorrect) {
      checkWin(true);
      recordWin();
      setIsRunning(false);
    }
  }, [playerGrid, puzzle, isPlaying, checkWin, recordWin]);

  const handleCellClick = (row, col) => {
    if (isWon || isGaveUp) return;
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
    if (!puzzle || !isPlaying) return;
    setPlayerGrid(puzzle.solution.map(row => [...row]));
    giveUp();
    recordGiveUp();
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
            <span className={styles.toggleLabel}>{t('common.showErrors')}</span>
          </label>
        </div>

        <div
          className={styles.board}
          style={{
            gridTemplateColumns: `repeat(${size}, 1fr)`,
            gridTemplateRows: `repeat(${size}, 1fr)`,
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
            disabled={!isPlaying}
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
