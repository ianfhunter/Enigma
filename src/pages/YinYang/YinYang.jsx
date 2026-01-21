import { useState, useEffect, useCallback, useMemo } from 'react';
import GameHeader from '../../components/GameHeader';
import DifficultySelector from '../../components/DifficultySelector';
import SizeSelector from '../../components/SizeSelector';
import GiveUpButton from '../../components/GiveUpButton';
import GameResult from '../../components/GameResult';
import styles from './YinYang.module.css';
import yinyangPuzzles from '../../../public/datasets/yinyangPuzzles.json';

const DIFFICULTIES = ['easy', 'medium', 'hard'];

// Get available sizes from dataset for a given difficulty
function getAvailableSizes(difficulty) {
  const sizes = new Set();
  yinyangPuzzles.puzzles.forEach(p => {
    if (p.difficulty === difficulty) {
      sizes.add(`${p.rows}x${p.cols}`);
    }
  });
  return Array.from(sizes).sort((a, b) => {
    const [ar, ac] = a.split('x').map(Number);
    const [br, bc] = b.split('x').map(Number);
    return (ar * ac) - (br * bc);
  });
}

// Parse dataset puzzle - converts 'w'/'b' to false/true (white=false, black=true)
function parseDatasetPuzzle(puzzle) {
  const { rows, cols, clues, solution } = puzzle;
  const parsedClues = clues.map(row =>
    row.map(cell => {
      if (cell === 'w') return false;
      if (cell === 'b') return true;
      return null;
    })
  );
  const parsedSolution = solution.map(row =>
    row.map(cell => cell === 'b')
  );
  return {
    puzzle: parsedClues,
    solution: parsedSolution,
    rows,
    cols
  };
}

function isColorConnected(grid, size, color) {
  // Find first cell of this color
  let start = null;
  for (let r = 0; r < size && !start; r++) {
    for (let c = 0; c < size && !start; c++) {
      if (grid[r][c] === color) start = [r, c];
    }
  }

  if (!start) return true; // No cells of this color

  const visited = new Set();
  const queue = [start];
  visited.add(`${start[0]},${start[1]}`);

  while (queue.length > 0) {
    const [r, c] = queue.shift();

    for (const [nr, nc] of [[r-1, c], [r+1, c], [r, c-1], [r, c+1]]) {
      if (nr >= 0 && nr < size && nc >= 0 && nc < size) {
        const key = `${nr},${nc}`;
        if (!visited.has(key) && grid[nr][nc] === color) {
          visited.add(key);
          queue.push([nr, nc]);
        }
      }
    }
  }

  // Count total cells of this color
  let total = 0;
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (grid[r][c] === color) total++;
    }
  }

  return visited.size === total;
}


function has2x2Square(grid, size, color) {
  for (let r = 0; r < size - 1; r++) {
    for (let c = 0; c < size - 1; c++) {
      if (grid[r][c] === color &&
          grid[r][c+1] === color &&
          grid[r+1][c] === color &&
          grid[r+1][c+1] === color) {
        return [[r, c], [r, c+1], [r+1, c], [r+1, c+1]];
      }
    }
  }
  return null;
}

function checkValidity(grid, size) {
  const errors = new Set();

  // Check for 2x2 squares of same color
  for (const color of [true, false]) {
    const square = has2x2Square(grid, size, color);
    if (square) {
      for (const [r, c] of square) {
        errors.add(`${r},${c}`);
      }
    }
  }

  // Check connectivity (only if all cells filled)
  let allFilled = true;
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (grid[r][c] === null) allFilled = false;
    }
  }

  if (allFilled) {
    if (!isColorConnected(grid, size, true)) {
      // Mark disconnected black cells
      for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
          if (grid[r][c] === true) errors.add(`${r},${c}`);
        }
      }
    }
    if (!isColorConnected(grid, size, false)) {
      for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
          if (grid[r][c] === false) errors.add(`${r},${c}`);
        }
      }
    }
  }

  return errors;
}

function checkSolved(grid, solution, size) {
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (grid[r][c] !== solution[r][c]) return false;
    }
  }
  return true;
}

// Export helpers for testing
export {
  DIFFICULTIES,
  getAvailableSizes,
  parseDatasetPuzzle,
  isColorConnected,
  has2x2Square,
  checkValidity,
  checkSolved,
};

export default function YinYang() {
  const [difficulty, setDifficulty] = useState('easy');
  const [sizeKey, setSizeKey] = useState('6x6');
  const [puzzleData, setPuzzleData] = useState(null);
  const [grid, setGrid] = useState([]);
  const [gameState, setGameState] = useState('playing');
  const [errors, setErrors] = useState(new Set());
  const [showErrors, setShowErrors] = useState(true);
  const [whiteMode, setWhiteMode] = useState(false); // Mobile white mode

  const availableSizes = useMemo(() => getAvailableSizes(difficulty), [difficulty]);

  // Update sizeKey when difficulty changes if current size not available
  useEffect(() => {
    if (availableSizes.length > 0 && !availableSizes.includes(sizeKey)) {
      setSizeKey(availableSizes[0]);
    }
  }, [availableSizes, sizeKey]);

  const initGame = useCallback(() => {
    const filtered = yinyangPuzzles.puzzles.filter(
      p => p.difficulty === difficulty && `${p.rows}x${p.cols}` === sizeKey
    );

    let selected;
    if (filtered.length === 0) {
      // Fallback to any puzzle of this difficulty
      const fallback = yinyangPuzzles.puzzles.filter(p => p.difficulty === difficulty);
      if (fallback.length > 0) {
        selected = fallback[Math.floor(Math.random() * fallback.length)];
      } else {
        selected = yinyangPuzzles.puzzles[Math.floor(Math.random() * yinyangPuzzles.puzzles.length)];
      }
    } else {
      selected = filtered[Math.floor(Math.random() * filtered.length)];
    }

    const data = parseDatasetPuzzle(selected);
    setPuzzleData(data);
    setGrid(data.puzzle.map(row => [...row]));
    setGameState('playing');
    setErrors(new Set());
  }, [difficulty, sizeKey]);

  useEffect(() => {
    initGame();
  }, [initGame]);

  const size = puzzleData?.rows || 6;

  useEffect(() => {
    if (!puzzleData || gameState !== 'playing') return;

    const newErrors = showErrors ? checkValidity(grid, size) : new Set();
    setErrors(newErrors);

    if (checkSolved(grid, puzzleData.solution, size)) {
      setGameState('won');
    }
  }, [grid, puzzleData, showErrors, size, gameState]);

  const handleCellClick = (r, c, e) => {
    if (gameState !== 'playing') return;
    if (puzzleData.puzzle[r][c] !== null) return; // Can't change given cells

    const isWhiteAction = e.type === 'contextmenu' || e.ctrlKey || whiteMode;

    if (isWhiteAction) {
      if (e.type === 'contextmenu') e.preventDefault();
      // Place white
      setGrid(prev => {
        const newGrid = prev.map(row => [...row]);
        newGrid[r][c] = newGrid[r][c] === false ? null : false;
        return newGrid;
      });
    } else {
      // Place black
      setGrid(prev => {
        const newGrid = prev.map(row => [...row]);
        newGrid[r][c] = newGrid[r][c] === true ? null : true;
        return newGrid;
      });
    }
  };

  const handleReset = () => {
    setGrid(puzzleData.puzzle.map(row => [...row]));
    setGameState('playing');
  };

  const handleGiveUp = () => {
    if (!puzzleData || gameState !== 'playing') return;
    setGrid(puzzleData.solution.map(row => [...row]));
    setGameState('gaveUp');
  };

  if (!puzzleData) return null;

  return (
    <div className={styles.container}>
      <GameHeader
        title="Yin-Yang"
        instructions="Fill cells black or white. Each color must be connected. No 2×2 squares of the same color allowed. Tap for black, use white mode for white."
      />

      <DifficultySelector
        options={DIFFICULTIES}
        value={difficulty}
        onChange={setDifficulty}
        className={styles.difficultySelector}
      />

      <SizeSelector
        options={availableSizes}
        value={sizeKey}
        onChange={setSizeKey}
        className={styles.sizeSelector}
      />

      <div className={styles.gameArea}>
        {/* Mobile White Toggle */}
        <button
          className={`${styles.whiteToggle} ${whiteMode ? styles.whiteModeActive : ''}`}
          onClick={() => setWhiteMode(!whiteMode)}
        >
          ○ {whiteMode ? 'White Mode ON' : 'White Mode'}
        </button>

        <div
          className={styles.grid}
          style={{ gridTemplateColumns: `repeat(${size}, 1fr)` }}
        >
          {grid.map((row, r) =>
            row.map((cell, c) => {
              const isGiven = puzzleData.puzzle[r][c] !== null;
              const hasError = errors.has(`${r},${c}`);

              return (
                <button
                  key={`${r}-${c}`}
                  className={`
                    ${styles.cell}
                    ${cell === true ? styles.black : ''}
                    ${cell === false ? styles.white : ''}
                    ${isGiven ? styles.given : ''}
                    ${hasError ? styles.error : ''}
                  `}
                  onClick={(e) => handleCellClick(r, c, e)}
                  onContextMenu={(e) => handleCellClick(r, c, e)}
                  disabled={isGiven}
                >
                  {cell === true && <span className={styles.yinYang}>☯</span>}
                </button>
              );
            })
          )}
        </div>

        {gameState === 'won' && (
          <GameResult
            state="won"
            title="☯️ Balance Achieved!"
            message="Yin and Yang in harmony!"
            actions={[{ label: 'New Puzzle', onClick: initGame, primary: true }]}
          />
        )}

        {gameState === 'gaveUp' && (
          <GameResult
            state="gaveup"
            message="Better luck next time!"
            actions={[{ label: 'New Puzzle', onClick: initGame, primary: true }]}
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
          <button className={styles.resetBtn} onClick={handleReset}>
            Reset
          </button>
          <GiveUpButton
            onGiveUp={handleGiveUp}
            disabled={gameState !== 'playing'}
          />
          <button className={styles.newGameBtn} onClick={initGame}>
            New Puzzle
          </button>
        </div>

        <div className={styles.legend}>
          <span>Click: Black</span>
          <span>Right-click: White</span>
        </div>
      </div>
    </div>
  );
}
