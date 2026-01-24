import { useTranslation } from 'react-i18next';
import { useState, useEffect, useCallback, useRef } from 'react';
import GameHeader from '../../components/GameHeader';
import SizeSelector from '../../components/SizeSelector';
import Timer, { formatTime } from '../../components/Timer/Timer';
import GiveUpButton from '../../components/GiveUpButton';
import GameResult from '../../components/GameResult';
import { useGameState } from '../../hooks/useGameState';
import { useGameStats } from '../../hooks/useGameStats';
import styles from './ABCEndView.module.css';
import puzzleDataset from '../../../public/datasets/abcendviewPuzzles.json';

// Derive full edge clues from solution (for validation)
function deriveClues(solution, size) {
  const topClues = [];
  const bottomClues = [];
  const leftClues = [];
  const rightClues = [];

  // Top clues (looking down)
  for (let c = 0; c < size; c++) {
    let found = '';
    for (let r = 0; r < size; r++) {
      if (solution[r][c]) {
        found = solution[r][c].toUpperCase();
        break;
      }
    }
    topClues.push(found);
  }

  // Bottom clues (looking up)
  for (let c = 0; c < size; c++) {
    let found = '';
    for (let r = size - 1; r >= 0; r--) {
      if (solution[r][c]) {
        found = solution[r][c].toUpperCase();
        break;
      }
    }
    bottomClues.push(found);
  }

  // Left clues (looking right)
  for (let r = 0; r < size; r++) {
    let found = '';
    for (let c = 0; c < size; c++) {
      if (solution[r][c]) {
        found = solution[r][c].toUpperCase();
        break;
      }
    }
    leftClues.push(found);
  }

  // Right clues (looking left)
  for (let r = 0; r < size; r++) {
    let found = '';
    for (let c = size - 1; c >= 0; c--) {
      if (solution[r][c]) {
        found = solution[r][c].toUpperCase();
        break;
      }
    }
    rightClues.push(found);
  }

  return { topClues, bottomClues, leftClues, rightClues };
}

function checkValidity(grid, puzzleData) {
  const { size, numLetters, fullClues } = puzzleData;
  const errors = new Set();
  const letters = 'ABCDEFG'.slice(0, numLetters).split('');

  // Check row duplicates
  for (let r = 0; r < size; r++) {
    if (!grid[r]) continue; // Safety check
    const seen = {};
    for (let c = 0; c < size; c++) {
      const val = grid[r][c]?.toUpperCase();
      if (val && val !== '' && letters.includes(val)) {
        if (seen[val]) {
          errors.add(`${r},${c}`);
          errors.add(seen[val]);
        }
        seen[val] = `${r},${c}`;
      }
    }
  }

  // Check column duplicates
  for (let c = 0; c < size; c++) {
    const seen = {};
    for (let r = 0; r < size; r++) {
      if (!grid[r]) continue; // Safety check
      const val = grid[r][c]?.toUpperCase();
      if (val && val !== '' && letters.includes(val)) {
        if (seen[val]) {
          errors.add(`${r},${c}`);
          errors.add(seen[val]);
        }
        seen[val] = `${r},${c}`;
      }
    }
  }

  // Check clue constraints using full derived clues
  const { topClues, bottomClues, leftClues, rightClues } = fullClues;

  // Top clues (looking down)
  for (let c = 0; c < size; c++) {
    if (!topClues[c]) continue;
    let firstLetter = '';
    let foundEmpty = false;
    for (let r = 0; r < size; r++) {
      if (!grid[r]) continue; // Safety check
      const val = grid[r][c]?.toUpperCase();
      if (!val || val === '') {
        foundEmpty = true;
        break;
      }
      if (letters.includes(val)) {
        firstLetter = val;
        break;
      }
    }
    if (!foundEmpty && firstLetter && firstLetter !== topClues[c]) {
      for (let r = 0; r < size; r++) {
        if (!grid[r]) continue; // Safety check
        const val = grid[r][c]?.toUpperCase();
        if (letters.includes(val)) {
          errors.add(`${r},${c}`);
          break;
        }
      }
    }
  }

  // Bottom clues (looking up)
  for (let c = 0; c < size; c++) {
    if (!bottomClues[c]) continue;
    let firstLetter = '';
    let foundEmpty = false;
    for (let r = size - 1; r >= 0; r--) {
      if (!grid[r]) continue; // Safety check
      const val = grid[r][c]?.toUpperCase();
      if (!val || val === '') {
        foundEmpty = true;
        break;
      }
      if (letters.includes(val)) {
        firstLetter = val;
        break;
      }
    }
    if (!foundEmpty && firstLetter && firstLetter !== bottomClues[c]) {
      for (let r = size - 1; r >= 0; r--) {
        if (!grid[r]) continue; // Safety check
        const val = grid[r][c]?.toUpperCase();
        if (letters.includes(val)) {
          errors.add(`${r},${c}`);
          break;
        }
      }
    }
  }

  // Left clues (looking right)
  for (let r = 0; r < size; r++) {
    if (!leftClues[r]) continue;
    if (!grid[r]) continue; // Safety check
    let firstLetter = '';
    let foundEmpty = false;
    for (let c = 0; c < size; c++) {
      const val = grid[r][c]?.toUpperCase();
      if (!val || val === '') {
        foundEmpty = true;
        break;
      }
      if (letters.includes(val)) {
        firstLetter = val;
        break;
      }
    }
    if (!foundEmpty && firstLetter && firstLetter !== leftClues[r]) {
      for (let c = 0; c < size; c++) {
        const val = grid[r][c]?.toUpperCase();
        if (letters.includes(val)) {
          errors.add(`${r},${c}`);
          break;
        }
      }
    }
  }

  // Right clues (looking left)
  for (let r = 0; r < size; r++) {
    if (!rightClues[r]) continue;
    if (!grid[r]) continue; // Safety check
    let firstLetter = '';
    let foundEmpty = false;
    for (let c = size - 1; c >= 0; c--) {
      const val = grid[r][c]?.toUpperCase();
      if (!val || val === '') {
        foundEmpty = true;
        break;
      }
      if (letters.includes(val)) {
        firstLetter = val;
        break;
      }
    }
    if (!foundEmpty && firstLetter && firstLetter !== rightClues[r]) {
      for (let c = size - 1; c >= 0; c--) {
        const val = grid[r][c]?.toUpperCase();
        if (letters.includes(val)) {
          errors.add(`${r},${c}`);
          break;
        }
      }
    }
  }

  return errors;
}

function checkSolved(grid, solution, size) {
  for (let r = 0; r < size; r++) {
    if (!grid[r] || !solution[r]) return false; // Safety check
    for (let c = 0; c < size; c++) {
      const gridVal = (grid[r][c] || '').toUpperCase();
      const solVal = (solution[r][c] || '').toUpperCase();
      if (gridVal !== solVal) return false;
    }
  }
  return true;
}

// Pre-compute available sizes from dataset
const AVAILABLE_SIZES = [...new Set(puzzleDataset.puzzles.map(p => p.rows))].sort((a, b) => a - b);

export default function ABCEndView() {
  const { t } = useTranslation();
  const [size, setSize] = useState(AVAILABLE_SIZES[1] || 4); // Default to second smallest
  const [puzzleData, setPuzzleData] = useState(null);
  const [grid, setGrid] = useState([]);
  const [selectedCell, setSelectedCell] = useState(null);
  const { gameState, checkWin, giveUp, reset: resetGameState, isPlaying } = useGameState();
  const { recordWin, recordGiveUp } = useGameStats('abc-end-view');
  const [errors, setErrors] = useState(new Set());
  const [showErrors, setShowErrors] = useState(false);
  const [timer, setTimer] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const timerRef = useRef(null);
  const usedPuzzleIdsRef = useRef(new Set());

  // Determine number of letters based on size (N-1 letters for NxN grid typically)
  const numLetters = size - 1;
  const letterOptions = 'ABCDEFG'.slice(0, numLetters).split('');

  const initGame = useCallback(() => {
    // Always resize grid to match current size first
    setGrid(Array(size).fill(null).map(() => Array(size).fill('')));

    // Filter puzzles by size
    const candidates = puzzleDataset.puzzles.filter(p =>
      p.rows === size && !usedPuzzleIdsRef.current.has(p.id)
    );

    // Fall back to all puzzles of this size if we've used them all
    const pool = candidates.length > 0
      ? candidates
      : puzzleDataset.puzzles.filter(p => p.rows === size);

    if (pool.length === 0) {
      // No puzzles found for this size - clear puzzle data
      setPuzzleData(null);
      setSelectedCell(null);
      resetGameState();
      setErrors(new Set());
      setIsRunning(false);
      return;
    }

    // Pick random puzzle
    const puzzle = pool[Math.floor(Math.random() * pool.length)];
    usedPuzzleIdsRef.current.add(puzzle.id);

    // Convert solution to uppercase
    const solution = puzzle.solution.map(row =>
      row.map(cell => cell ? cell.toUpperCase() : '')
    );

    // Derive clues from solution (for display and validation)
    const fullClues = deriveClues(solution, size);

    setPuzzleData({
      solution,
      topClues: fullClues.topClues,
      bottomClues: fullClues.bottomClues,
      leftClues: fullClues.leftClues,
      rightClues: fullClues.rightClues,
      fullClues,
      size,
      numLetters
    });
    setSelectedCell(null);
    resetGameState();
    setErrors(new Set());
    setTimer(0);
    setIsRunning(true);
  }, [size, numLetters, resetGameState]);

  useEffect(() => {
    initGame();
  }, [initGame]);

  useEffect(() => {
    if (isRunning && isPlaying) {
      timerRef.current = setInterval(() => {
        setTimer(t => t + 1);
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [isRunning, isPlaying]);

  useEffect(() => {
    if (!puzzleData || !isPlaying) return;
    // Safety check: ensure puzzleData size matches current size
    if (puzzleData.size !== size) return;

    const newErrors = showErrors
      ? checkValidity(grid, puzzleData)
      : new Set();
    setErrors(newErrors);

    if (checkSolved(grid, puzzleData.solution, size)) {
      checkWin(true);
      recordWin();
      setIsRunning(false);
    }
  }, [grid, puzzleData, showErrors, size, isPlaying, checkWin, recordWin]);

  const handleCellClick = (r, c) => {
    if (!isPlaying) return;
    setSelectedCell({ row: r, col: c });
  };

  const handleLetterInput = (letter) => {
    if (!selectedCell || !isPlaying) return;
    const { row, col } = selectedCell;
    setGrid(prev => {
      const newGrid = prev.map(r => [...r]);
      newGrid[row][col] = letter;
      return newGrid;
    });
  };

  const handleClear = () => {
    if (!selectedCell || !isPlaying) return;
    const { row, col } = selectedCell;
    setGrid(prev => {
      const newGrid = prev.map(r => [...r]);
      newGrid[row][col] = '';
      return newGrid;
    });
  };

  const handleGiveUp = () => {
    if (!puzzleData || !isPlaying) return;
    setGrid(puzzleData.solution.map(row => [...row]));
    giveUp();
    recordGiveUp();
    setIsRunning(false);
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!selectedCell || !isPlaying) return;

      const key = e.key.toUpperCase();
      if (letterOptions.includes(key)) {
        handleLetterInput(key);
      } else if (e.key === 'Backspace' || e.key === 'Delete' || e.key === ' ') {
        handleClear();
      } else if (e.key === 'x' || e.key === 'X') {
        handleLetterInput('X'); // Mark as empty
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedCell, gameState, letterOptions]);

  if (!puzzleData) return null;

  return (
    <div className={styles.container}>
      <GameHeader
        title="ABC End View"
        instructions={`Place letters ${letterOptions.join(', ')} in the grid. Each row and column contains each letter exactly once (rest are empty). Clues around the edge show which letter is seen first from that direction.`}
      />

      <SizeSelector
        sizes={AVAILABLE_SIZES}
        selectedSize={size}
        onSizeChange={setSize}
      />

      <div className={styles.gameArea}>
        <Timer seconds={timer} />

        <div className={styles.boardWrapper}>
          {/* Top clues */}
          <div className={styles.clueRow}>
            <div className={styles.corner}></div>
            {puzzleData.topClues.map((clue, c) => (
              <div key={c} className={styles.clue}>{clue}</div>
            ))}
            <div className={styles.corner}></div>
          </div>

          <div className={styles.mainArea}>
            {/* Left clues */}
            <div className={styles.clueCol}>
              {puzzleData.leftClues.map((clue, r) => (
                <div key={r} className={styles.clue}>{clue}</div>
              ))}
            </div>

            {/* Grid */}
            <div className={styles.board} style={{ '--grid-size': size }}>
              {Array(size).fill(null).map((_, r) => (
                <div key={r} className={styles.row}>
                  {Array(size).fill(null).map((_, c) => {
                    const value = grid[r]?.[c];
                    const isSelected = selectedCell?.row === r && selectedCell?.col === c;
                    const hasError = errors.has(`${r},${c}`);

                    return (
                      <div
                        key={c}
                        className={`
                          ${styles.cell}
                          ${isSelected ? styles.selected : ''}
                          ${hasError ? styles.error : ''}
                        `}
                        onClick={() => handleCellClick(r, c)}
                      >
                        {value && <span className={styles.cellValue}>{value}</span>}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>

            {/* Right clues */}
            <div className={styles.clueCol}>
              {puzzleData.rightClues.map((clue, r) => (
                <div key={r} className={styles.clue}>{clue}</div>
              ))}
            </div>
          </div>

          {/* Bottom clues */}
          <div className={styles.clueRow}>
            <div className={styles.corner}></div>
            {puzzleData.bottomClues.map((clue, c) => (
              <div key={c} className={styles.clue}>{clue}</div>
            ))}
            <div className={styles.corner}></div>
          </div>
        </div>

        <div className={styles.letterPad}>
          {letterOptions.map(letter => (
            <button
              key={letter}
              className={styles.letterBtn}
              onClick={() => handleLetterInput(letter)}
            >
              {letter}
            </button>
          ))}
          <button className={styles.letterBtn} onClick={handleClear}>✕</button>
        </div>

        {gameState === 'won' && (
          <GameResult
            state="won"
            stats={[{ label: 'Time', value: formatTime(timer) }]}
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
          <button className={styles.resetBtn} onClick={() => {
            setGrid(Array(size).fill(null).map(() => Array(size).fill('')));
            resetGameState();
            setTimer(0);
            setIsRunning(true);
          }}>
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
      </div>
    </div>
  );
}
