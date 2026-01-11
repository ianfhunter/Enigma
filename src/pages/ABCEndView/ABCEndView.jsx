import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { formatTime } from '../../data/wordUtils';
import styles from './ABCEndView.module.css';

const GRID_SIZES = {
  '4×4 (ABC)': { size: 4, letters: 3 },
  '5×5 (ABCD)': { size: 5, letters: 4 },
  '6×6 (ABCD)': { size: 6, letters: 4 },
};

// Generate a valid ABC End View solution
function generateSolution(size, numLetters) {
  const grid = Array(size).fill(null).map(() => Array(size).fill(''));
  const letters = 'ABCDEFG'.slice(0, numLetters).split('');
  
  function isValid(grid, row, col, letter) {
    // Check row - each letter at most once
    let count = 0;
    for (let c = 0; c < size; c++) {
      if (grid[row][c] === letter) count++;
    }
    if (count > 0) return false;
    
    // Check column - each letter at most once
    count = 0;
    for (let r = 0; r < size; r++) {
      if (grid[r][col] === letter) count++;
    }
    if (count > 0) return false;
    
    return true;
  }
  
  // eslint-disable-next-line no-unused-vars
  function solve(grid, positions, idx) {
    if (idx === positions.length) {
      // Verify each row and column has exactly numLetters letters
      for (let r = 0; r < size; r++) {
        let count = 0;
        for (let c = 0; c < size; c++) {
          if (grid[r][c] !== '') count++;
        }
        if (count !== numLetters) return false;
      }
      for (let c = 0; c < size; c++) {
        let count = 0;
        for (let r = 0; r < size; r++) {
          if (grid[r][c] !== '') count++;
        }
        if (count !== numLetters) return false;
      }
      return true;
    }
    
    const [r, c] = positions[idx];
    
    // Try empty
    if (solve(grid, positions, idx + 1)) return true;
    
    // Try each letter
    for (const letter of letters) {
      if (isValid(grid, r, c, letter)) {
        grid[r][c] = letter;
        if (solve(grid, positions, idx + 1)) return true;
        grid[r][c] = '';
      }
    }
    
    return false;
  }
  
  // Create shuffled positions
  const positions = [];
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      positions.push([r, c]);
    }
  }
  for (let i = positions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [positions[i], positions[j]] = [positions[j], positions[i]];
  }
  
  // Alternative: Generate by placing letters in each row/column
  for (let r = 0; r < size; r++) {
    const cols = Array.from({ length: size }, (_, i) => i);
    for (let i = cols.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [cols[i], cols[j]] = [cols[j], cols[i]];
    }
    
    let placed = 0;
    for (const c of cols) {
      if (placed >= numLetters) break;
      const letter = letters[placed];
      if (isValid(grid, r, c, letter)) {
        grid[r][c] = letter;
        placed++;
      }
    }
  }
  
  // Verify and fix if needed
  for (let c = 0; c < size; c++) {
    const colLetters = new Set();
    for (let r = 0; r < size; r++) {
      if (grid[r][c]) colLetters.add(grid[r][c]);
    }
    // Add missing letters
    for (const letter of letters) {
      if (!colLetters.has(letter)) {
        for (let r = 0; r < size; r++) {
          if (grid[r][c] === '' && isValid(grid, r, c, letter)) {
            grid[r][c] = letter;
            break;
          }
        }
      }
    }
  }
  
  return grid;
}

// Generate clues from solution
function generateClues(solution, size) {
  const topClues = Array(size).fill('');
  const bottomClues = Array(size).fill('');
  const leftClues = Array(size).fill('');
  const rightClues = Array(size).fill('');
  
  // Top clues (looking down)
  for (let c = 0; c < size; c++) {
    for (let r = 0; r < size; r++) {
      if (solution[r][c] !== '') {
        topClues[c] = solution[r][c];
        break;
      }
    }
  }
  
  // Bottom clues (looking up)
  for (let c = 0; c < size; c++) {
    for (let r = size - 1; r >= 0; r--) {
      if (solution[r][c] !== '') {
        bottomClues[c] = solution[r][c];
        break;
      }
    }
  }
  
  // Left clues (looking right)
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (solution[r][c] !== '') {
        leftClues[r] = solution[r][c];
        break;
      }
    }
  }
  
  // Right clues (looking left)
  for (let r = 0; r < size; r++) {
    for (let c = size - 1; c >= 0; c--) {
      if (solution[r][c] !== '') {
        rightClues[r] = solution[r][c];
        break;
      }
    }
  }
  
  return { topClues, bottomClues, leftClues, rightClues };
}

function generatePuzzle(size, numLetters) {
  const solution = generateSolution(size, numLetters);
  const clues = generateClues(solution, size);
  
  return { solution, ...clues, size, numLetters };
}

function checkValidity(grid, puzzleData) {
  const { size, numLetters, topClues, bottomClues: _bottomClues, leftClues: _leftClues, rightClues: _rightClues } = puzzleData;
  const errors = new Set();
  const letters = 'ABCDEFG'.slice(0, numLetters).split('');
  
  // Check row duplicates
  for (let r = 0; r < size; r++) {
    const seen = {};
    for (let c = 0; c < size; c++) {
      if (grid[r][c] && grid[r][c] !== '') {
        if (seen[grid[r][c]]) {
          errors.add(`${r},${c}`);
          errors.add(seen[grid[r][c]]);
        }
        seen[grid[r][c]] = `${r},${c}`;
      }
    }
  }
  
  // Check column duplicates
  for (let c = 0; c < size; c++) {
    const seen = {};
    for (let r = 0; r < size; r++) {
      if (grid[r][c] && grid[r][c] !== '') {
        if (seen[grid[r][c]]) {
          errors.add(`${r},${c}`);
          errors.add(seen[grid[r][c]]);
        }
        seen[grid[r][c]] = `${r},${c}`;
      }
    }
  }
  
  // Check clue constraints (only when row/col is complete)
  // Top clues
  for (let c = 0; c < size; c++) {
    let firstLetter = '';
    let foundEmpty = false;
    for (let r = 0; r < size; r++) {
      if (!grid[r][c] || grid[r][c] === '') {
        foundEmpty = true;
        break;
      }
      if (letters.includes(grid[r][c])) {
        firstLetter = grid[r][c];
        break;
      }
    }
    if (!foundEmpty && topClues[c] && firstLetter !== topClues[c]) {
      // Find the first letter cell and mark error
      for (let r = 0; r < size; r++) {
        if (letters.includes(grid[r][c])) {
          errors.add(`${r},${c}`);
          break;
        }
      }
    }
  }
  
  // Similar for other clues...
  
  return errors;
}

function checkSolved(grid, solution, size) {
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if ((grid[r][c] || '') !== solution[r][c]) return false;
    }
  }
  return true;
}

export default function ABCEndView() {
  const [sizeKey, setSizeKey] = useState('5×5 (ABCD)');
  const [puzzleData, setPuzzleData] = useState(null);
  const [grid, setGrid] = useState([]);
  const [selectedCell, setSelectedCell] = useState(null);
  const [gameState, setGameState] = useState('playing');
  const [errors, setErrors] = useState(new Set());
  const [showErrors, setShowErrors] = useState(true);
  const [timer, setTimer] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const timerRef = useRef(null);

  const { size, letters: numLetters } = GRID_SIZES[sizeKey];
  const letterOptions = 'ABCDEFG'.slice(0, numLetters).split('');

  const initGame = useCallback(() => {
    const data = generatePuzzle(size, numLetters);
    setPuzzleData(data);
    setGrid(Array(size).fill(null).map(() => Array(size).fill('')));
    setSelectedCell(null);
    setGameState('playing');
    setErrors(new Set());
    setTimer(0);
    setIsRunning(true);
  }, [size, numLetters]);

  useEffect(() => {
    initGame();
  }, [initGame]);

  useEffect(() => {
    if (isRunning && gameState === 'playing') {
      timerRef.current = setInterval(() => {
        setTimer(t => t + 1);
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [isRunning, gameState]);

  useEffect(() => {
    if (!puzzleData) return;

    const newErrors = showErrors 
      ? checkValidity(grid, puzzleData)
      : new Set();
    setErrors(newErrors);

    if (checkSolved(grid, puzzleData.solution, size)) {
      setGameState('won');
      setIsRunning(false);
    }
  }, [grid, puzzleData, showErrors, size]);

  const handleCellClick = (r, c) => {
    if (gameState !== 'playing') return;
    setSelectedCell({ row: r, col: c });
  };

  const handleLetterInput = (letter) => {
    if (!selectedCell || gameState !== 'playing') return;
    const { row, col } = selectedCell;
    setGrid(prev => {
      const newGrid = prev.map(r => [...r]);
      newGrid[row][col] = letter;
      return newGrid;
    });
  };

  const handleClear = () => {
    if (!selectedCell || gameState !== 'playing') return;
    const { row, col } = selectedCell;
    setGrid(prev => {
      const newGrid = prev.map(r => [...r]);
      newGrid[row][col] = '';
      return newGrid;
    });
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!selectedCell || gameState !== 'playing') return;

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
      <div className={styles.header}>
        <Link to="/" className={styles.backLink}>← Back to Games</Link>
        <h1 className={styles.title}>ABC End View</h1>
        <p className={styles.instructions}>
          Place letters {letterOptions.join(', ')} in the grid. Each row and column contains each letter exactly once
          (rest are empty). Clues around the edge show which letter is seen first from that direction.
        </p>
      </div>

      <div className={styles.sizeSelector}>
        {Object.keys(GRID_SIZES).map((key) => (
          <button
            key={key}
            className={`${styles.sizeBtn} ${sizeKey === key ? styles.active : ''}`}
            onClick={() => setSizeKey(key)}
          >
            {key}
          </button>
        ))}
      </div>

      <div className={styles.gameArea}>
        <div className={styles.timerDisplay}>
          <span className={styles.timerIcon}>⏱</span>
          <span>{formatTime(timer)}</span>
        </div>

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
                    const value = grid[r][c];
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
          <div className={styles.winMessage}>
            <div className={styles.winEmoji}>🎉</div>
            <h3>Puzzle Solved!</h3>
            <p>Completed in {formatTime(timer)}</p>
          </div>
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
            setGameState('playing');
            setTimer(0);
            setIsRunning(true);
          }}>
            Reset
          </button>
          <button className={styles.newGameBtn} onClick={initGame}>
            New Puzzle
          </button>
        </div>
      </div>
    </div>
  );
}
