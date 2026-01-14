import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import styles from './Hidato.module.css';
import hidokuPuzzles from '../../../public/datasets/hidokuPuzzles.json';

const DIFFICULTIES = ['easy', 'medium', 'hard'];

// Get available sizes for a difficulty
function getAvailableSizes(difficulty) {
  const sizes = new Set();
  hidokuPuzzles.puzzles.forEach(p => {
    if (p.difficulty === difficulty) {
      sizes.add(`${p.rows}×${p.cols}`);
    }
  });
  return Array.from(sizes).sort((a, b) => {
    const [aRows] = a.split('×').map(Number);
    const [bRows] = b.split('×').map(Number);
    return aRows - bRows;
  });
}

// Get all 8 neighbors (including diagonals)
function getNeighbors(r, c, size) {
  const neighbors = [];
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const nr = r + dr;
      const nc = c + dc;
      if (nr >= 0 && nr < size && nc >= 0 && nc < size) {
        neighbors.push([nr, nc]);
      }
    }
  }
  return neighbors;
}

// Check if puzzle is solved
function checkSolved(grid, solution) {
  for (let r = 0; r < grid.length; r++) {
    for (let c = 0; c < grid[r].length; c++) {
      if (solution[r][c] !== null && grid[r][c] !== solution[r][c]) {
        return false;
      }
    }
  }
  return true;
}

// Find errors in current grid
function findErrors(grid, maxNum) {
  const errors = new Set();
  const numPositions = new Map();
  const rows = grid.length;
  const cols = grid[0]?.length || 0;

  // Find duplicate numbers
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const num = grid[r][c];
      if (num > 0) {
        if (numPositions.has(num)) {
          errors.add(`${r},${c}`);
          errors.add(numPositions.get(num));
        } else {
          numPositions.set(num, `${r},${c}`);
        }
      }
    }
  }

  // Check consecutive number connectivity
  for (let num = 1; num < maxNum; num++) {
    let pos1 = null, pos2 = null;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (grid[r][c] === num) pos1 = [r, c];
        if (grid[r][c] === num + 1) pos2 = [r, c];
      }
    }

    if (pos1 && pos2) {
      const [r1, c1] = pos1;
      const [r2, c2] = pos2;
      const isAdjacent = Math.abs(r1 - r2) <= 1 && Math.abs(c1 - c2) <= 1;

      if (!isAdjacent) {
        errors.add(`${r1},${c1}`);
        errors.add(`${r2},${c2}`);
      }
    }
  }

  return errors;
}

// Export helpers for testing
export {
  DIFFICULTIES,
  getAvailableSizes,
  getNeighbors,
  checkSolved,
  findErrors,
};

export default function Hidato() {
  const [difficulty, setDifficulty] = useState('easy');
  const [availableSizes, setAvailableSizes] = useState(() => getAvailableSizes('easy'));
  const [sizeKey, setSizeKey] = useState(() => {
    const sizes = getAvailableSizes('easy');
    return sizes[0] || '7×7';
  });
  const [puzzleData, setPuzzleData] = useState(null);
  const [grid, setGrid] = useState([]);
  const [selectedCell, setSelectedCell] = useState(null);
  const [gameState, setGameState] = useState('playing');
  const [errors, setErrors] = useState(new Set());
  const [showErrors, setShowErrors] = useState(true);

  const initGame = useCallback(() => {
    // Parse size from sizeKey
    const [rows, cols] = sizeKey.split('×').map(Number);

    // Filter puzzles by difficulty and size
    const matching = hidokuPuzzles.puzzles.filter(p =>
      p.difficulty === difficulty && p.rows === rows && p.cols === cols
    );

    if (matching.length === 0) {
      console.error('No puzzles found for', difficulty, sizeKey);
      return;
    }

    // Pick a random puzzle
    const puzzle = matching[Math.floor(Math.random() * matching.length)];

    // Calculate maxNum from solution
    let maxNum = 0;
    for (let r = 0; r < puzzle.solution.length; r++) {
      for (let c = 0; c < puzzle.solution[r].length; c++) {
        if (puzzle.solution[r][c] !== null && puzzle.solution[r][c] > maxNum) {
          maxNum = puzzle.solution[r][c];
        }
      }
    }

    // Build given array and initial grid
    const given = puzzle.clues.map(row => row.map(cell => cell !== null));
    const initialGrid = puzzle.clues.map(row => row.map(cell => cell ?? 0));

    setPuzzleData({
      clues: puzzle.clues,
      solution: puzzle.solution,
      given,
      maxNum,
      rows: puzzle.rows,
      cols: puzzle.cols
    });
    setGrid(initialGrid);
    setSelectedCell(null);
    setGameState('playing');
    setErrors(new Set());
  }, [difficulty, sizeKey]);

  useEffect(() => {
    initGame();
  }, [initGame]);

  // Update available sizes when difficulty changes
  useEffect(() => {
    const sizes = getAvailableSizes(difficulty);
    setAvailableSizes(sizes);
    if (!sizes.includes(sizeKey)) {
      setSizeKey(sizes[0] || '7×7');
    }
  }, [difficulty]);

  useEffect(() => {
    if (!puzzleData) return;

    if (showErrors) {
      setErrors(findErrors(grid, puzzleData.maxNum));
    } else {
      setErrors(new Set());
    }

    if (checkSolved(grid, puzzleData.solution)) {
      setGameState('won');
    }
  }, [grid, puzzleData, showErrors]);

  const handleCellClick = (r, c) => {
    if (gameState !== 'playing') return;
    if (puzzleData.given[r][c]) return; // Can't modify given cells

    setSelectedCell([r, c]);
  };

  const rows = puzzleData?.rows || 7;
  const cols = puzzleData?.cols || 7;

  const handleKeyDown = useCallback((e) => {
    if (!selectedCell || gameState !== 'playing' || !puzzleData) return;

    const [r, c] = selectedCell;

    if (e.key === 'Backspace' || e.key === 'Delete') {
      if (!puzzleData.given[r][c]) {
        setGrid(prev => {
          const newGrid = prev.map(row => [...row]);
          newGrid[r][c] = 0;
          return newGrid;
        });
      }
      return;
    }

    if (e.key === 'Escape') {
      setSelectedCell(null);
      return;
    }

    // Arrow keys for navigation
    if (e.key === 'ArrowUp' && r > 0) {
      setSelectedCell([r - 1, c]);
      return;
    }
    if (e.key === 'ArrowDown' && r < rows - 1) {
      setSelectedCell([r + 1, c]);
      return;
    }
    if (e.key === 'ArrowLeft' && c > 0) {
      setSelectedCell([r, c - 1]);
      return;
    }
    if (e.key === 'ArrowRight' && c < cols - 1) {
      setSelectedCell([r, c + 1]);
      return;
    }

    // Number input
    const num = parseInt(e.key, 10);
    if (!isNaN(num)) {
      if (!puzzleData.given[r][c]) {
        setGrid(prev => {
          const newGrid = prev.map(row => [...row]);
          const currentVal = newGrid[r][c];
          // Allow multi-digit input - try building on current value first
          const newVal = currentVal > 0 ? currentVal * 10 + num : num;
          // Only check range validity, not duplicates (error highlighting handles that)
          if (newVal >= 1 && newVal <= puzzleData.maxNum) {
            newGrid[r][c] = newVal;
          } else if (num >= 1 && num <= puzzleData.maxNum) {
            // If multi-digit is out of range, try just the single digit
            newGrid[r][c] = num;
          }
          return newGrid;
        });
      }
    }
  }, [selectedCell, gameState, puzzleData, rows, cols]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const handleNumberPad = (num) => {
    if (!selectedCell || gameState !== 'playing') return;

    const [r, c] = selectedCell;
    if (puzzleData.given[r][c]) return;

    if (num === 'clear') {
      setGrid(prev => {
        const newGrid = prev.map(row => [...row]);
        newGrid[r][c] = 0;
        return newGrid;
      });
      return;
    }

    // Place the number directly
    setGrid(prev => {
      const newGrid = prev.map(row => [...row]);
      newGrid[r][c] = num;
      return newGrid;
    });
  };

  const handleReset = () => {
    if (!puzzleData) return;
    setGrid(puzzleData.clues.map(row => row.map(cell => cell ?? 0)));
    setSelectedCell(null);
    setGameState('playing');
  };

  const handleGiveUp = () => {
    if (!puzzleData || gameState !== 'playing') return;
    setGrid(puzzleData.solution.map(row => [...row]));
    setSelectedCell(null);
    setGameState('revealed');
  };

  // Compute which numbers are already used on the grid
  const usedNumbers = useMemo(() => {
    const used = new Set();
    for (let r = 0; r < grid.length; r++) {
      for (let c = 0; c < grid[r].length; c++) {
        if (grid[r][c] > 0) {
          used.add(grid[r][c]);
        }
      }
    }
    return used;
  }, [grid]);

  if (!puzzleData) return null;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Link to="/" className={styles.backLink}>← Back to Games</Link>
        <h1 className={styles.title}>Hidato</h1>
        <p className={styles.instructions}>
          Fill in the grid with consecutive numbers (1 to {puzzleData.maxNum}).
          Each number must be adjacent to the next (including diagonals).
        </p>
      </div>

      <div className={styles.selectors}>
        <div className={styles.difficultySelector}>
          {DIFFICULTIES.map((d) => (
            <button
              key={d}
              className={`${styles.difficultyBtn} ${difficulty === d ? styles.active : ''}`}
              onClick={() => setDifficulty(d)}
            >
              {d.charAt(0).toUpperCase() + d.slice(1)}
            </button>
          ))}
        </div>
        <div className={styles.sizeSelector}>
          {availableSizes.map((key) => (
            <button
              key={key}
              className={`${styles.sizeBtn} ${sizeKey === key ? styles.active : ''}`}
              onClick={() => setSizeKey(key)}
            >
              {key}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.gameArea}>
        <div
          className={styles.grid}
          style={{
            gridTemplateColumns: `repeat(${cols}, 1fr)`,
            width: `${cols * 52}px`,
            height: `${rows * 52}px`,
          }}
        >
          {grid.map((row, r) =>
            row.map((num, c) => {
              const isGiven = puzzleData.given[r][c];
              const isSelected = selectedCell && selectedCell[0] === r && selectedCell[1] === c;
              const hasError = errors.has(`${r},${c}`);
              const isEmpty = puzzleData.solution[r][c] === null;

              return (
                <button
                  key={`${r}-${c}`}
                  className={`
                    ${styles.cell}
                    ${isGiven ? styles.given : ''}
                    ${isSelected ? styles.selected : ''}
                    ${hasError ? styles.error : ''}
                    ${isEmpty ? styles.empty : ''}
                  `}
                  onClick={() => handleCellClick(r, c)}
                  disabled={isEmpty}
                >
                  {num > 0 && <span className={styles.number}>{num}</span>}
                </button>
              );
            })
          )}
        </div>

        {gameState === 'won' && (
          <div className={styles.winMessage}>
            <div className={styles.winEmoji}>🎉</div>
            <h3>Puzzle Solved!</h3>
            <p>Path complete from 1 to {puzzleData.maxNum}</p>
          </div>
        )}

        {gameState === 'revealed' && (
          <div className={styles.revealedMessage}>
            <div className={styles.revealedEmoji}>🔍</div>
            <h3>Solution Revealed</h3>
            <p>Better luck next time!</p>
          </div>
        )}

        <div className={styles.numberPad}>
          {Array.from({ length: puzzleData.maxNum }, (_, i) => i + 1).map(num => {
            const isUsed = usedNumbers.has(num);
            return (
              <button
                key={num}
                className={`${styles.numBtn} ${isUsed ? styles.numBtnUsed : ''}`}
                onClick={() => handleNumberPad(num)}
                disabled={isUsed}
              >
                {num}
              </button>
            );
          })}
          <button
            className={styles.numBtn}
            onClick={() => handleNumberPad('clear')}
          >
            ✕
          </button>
        </div>

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
          <button
            className={styles.giveUpBtn}
            onClick={handleGiveUp}
            disabled={gameState !== 'playing'}
          >
            Give Up
          </button>
          <button className={styles.newGameBtn} onClick={initGame}>
            New Puzzle
          </button>
        </div>

        <div className={styles.hint}>
          <p>Use keyboard: Arrow keys to move, numbers to enter, Backspace to clear</p>
        </div>
      </div>
    </div>
  );
}
