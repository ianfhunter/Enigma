import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import styles from './Sujiko.module.css';

// Sujiko is a 3x3 grid where each cell contains 1-9 (each used once)
// There are 4 circle clues at intersections showing the sum of 4 adjacent cells

// Generate a random permutation of 1-9 for the 3x3 grid
function shuffleArray(arr) {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

// Calculate the 4 sums for a given solution
// Circle positions: between cells (0,0)-(0,1)-(1,0)-(1,1), etc.
function calculateSums(solution) {
  // 4 circles at positions between 2x2 groups:
  // [0]: cells (0,0), (0,1), (1,0), (1,1)
  // [1]: cells (0,1), (0,2), (1,1), (1,2)
  // [2]: cells (1,0), (1,1), (2,0), (2,1)
  // [3]: cells (1,1), (1,2), (2,1), (2,2)
  return [
    solution[0][0] + solution[0][1] + solution[1][0] + solution[1][1],
    solution[0][1] + solution[0][2] + solution[1][1] + solution[1][2],
    solution[1][0] + solution[1][1] + solution[2][0] + solution[2][1],
    solution[1][1] + solution[1][2] + solution[2][1] + solution[2][2],
  ];
}

// Generate a puzzle with unique solution
function generatePuzzle(difficulty = 'medium') {
  // Create a random filled grid
  const numbers = shuffleArray([1, 2, 3, 4, 5, 6, 7, 8, 9]);
  const solution = [
    [numbers[0], numbers[1], numbers[2]],
    [numbers[3], numbers[4], numbers[5]],
    [numbers[6], numbers[7], numbers[8]],
  ];
  
  const sums = calculateSums(solution);
  
  // Create puzzle with some numbers revealed
  const puzzle = [
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 0],
  ];
  
  // Reveal some cells based on difficulty
  const cellsToReveal = difficulty === 'easy' ? 4 : difficulty === 'medium' ? 3 : 2;
  const positions = shuffleArray([
    [0, 0], [0, 1], [0, 2],
    [1, 0], [1, 1], [1, 2],
    [2, 0], [2, 1], [2, 2],
  ]);
  
  for (let i = 0; i < cellsToReveal; i++) {
    const [r, c] = positions[i];
    puzzle[r][c] = solution[r][c];
  }
  
  return { puzzle, solution, sums };
}

// Check if the current grid is valid (no duplicate numbers)
function checkValidity(grid, solution) {
  const errors = new Set();
  const used = new Map();
  
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      const val = grid[r][c];
      if (val !== 0) {
        // Check for duplicates
        if (used.has(val)) {
          errors.add(`${r},${c}`);
          errors.add(used.get(val));
        } else {
          used.set(val, `${r},${c}`);
        }
        
        // Check against solution
        if (val !== solution[r][c]) {
          errors.add(`${r},${c}`);
        }
      }
    }
  }
  
  return errors;
}

// Check which sums are currently satisfied
function checkSums(grid, sums) {
  const currentSums = calculateSums(grid);
  return sums.map((target, i) => currentSums[i] === target);
}

export default function Sujiko() {
  const [difficulty, setDifficulty] = useState('medium');
  const [puzzleData, setPuzzleData] = useState(null);
  const [grid, setGrid] = useState([]);
  const [selectedCell, setSelectedCell] = useState(null);
  const [gameState, setGameState] = useState('playing');
  const [errors, setErrors] = useState(new Set());
  const [showErrors, setShowErrors] = useState(true);
  const [sumStatus, setSumStatus] = useState([false, false, false, false]);
  
  const initGame = useCallback(() => {
    const data = generatePuzzle(difficulty);
    setPuzzleData(data);
    setGrid(data.puzzle.map(row => [...row]));
    setSelectedCell(null);
    setGameState('playing');
    setErrors(new Set());
    setSumStatus([false, false, false, false]);
  }, [difficulty]);
  
  useEffect(() => {
    initGame();
  }, [initGame]);
  
  useEffect(() => {
    if (!puzzleData) return;
    
    const newErrors = showErrors ? checkValidity(grid, puzzleData.solution) : new Set();
    setErrors(newErrors);
    
    const newSumStatus = checkSums(grid, puzzleData.sums);
    setSumStatus(newSumStatus);
    
    // Check if solved
    let allFilled = true;
    let allCorrect = true;
    
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        if (grid[r][c] === 0) allFilled = false;
        if (grid[r][c] !== puzzleData.solution[r][c]) allCorrect = false;
      }
    }
    
    if (allFilled && allCorrect) {
      setGameState('won');
    }
  }, [grid, puzzleData, showErrors]);
  
  const handleCellClick = (r, c) => {
    if (gameState !== 'playing' || !puzzleData) return;
    if (puzzleData.puzzle[r][c] !== 0) return; // Given cell
    
    setSelectedCell({ r, c });
  };
  
  const handleNumberInput = (num) => {
    if (!selectedCell || gameState !== 'playing') return;
    
    const { r, c } = selectedCell;
    if (puzzleData.puzzle[r][c] !== 0) return;
    
    setGrid(prev => {
      const newGrid = prev.map(row => [...row]);
      newGrid[r][c] = num;
      return newGrid;
    });
  };
  
  const handleClear = () => {
    if (!selectedCell || gameState !== 'playing') return;
    
    const { r, c } = selectedCell;
    if (puzzleData.puzzle[r][c] !== 0) return;
    
    setGrid(prev => {
      const newGrid = prev.map(row => [...row]);
      newGrid[r][c] = 0;
      return newGrid;
    });
  };
  
  // Keyboard handling
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!selectedCell || gameState !== 'playing') return;
      
      const { r, c } = selectedCell;
      
      if (e.key >= '1' && e.key <= '9') {
        handleNumberInput(parseInt(e.key));
      } else if (e.key === 'Backspace' || e.key === 'Delete' || e.key === '0') {
        handleClear();
      } else if (e.key === 'ArrowUp' && r > 0) {
        setSelectedCell({ r: r - 1, c });
      } else if (e.key === 'ArrowDown' && r < 2) {
        setSelectedCell({ r: r + 1, c });
      } else if (e.key === 'ArrowLeft' && c > 0) {
        setSelectedCell({ r, c: c - 1 });
      } else if (e.key === 'ArrowRight' && c < 2) {
        setSelectedCell({ r, c: c + 1 });
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedCell, gameState, puzzleData]);
  
  const handleReset = () => {
    if (!puzzleData) return;
    setGrid(puzzleData.puzzle.map(row => [...row]));
    setSelectedCell(null);
    setGameState('playing');
  };
  
  // Get which numbers are still available
  const getAvailableNumbers = () => {
    const used = new Set(grid.flat().filter(n => n !== 0));
    return [1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => !used.has(n));
  };
  
  if (!puzzleData) return null;
  
  const available = getAvailableNumbers();
  
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Link to="/" className={styles.backLink}>← Back to Games</Link>
        <h1 className={styles.title}>Sujiko</h1>
        <p className={styles.instructions}>
          Fill the 3×3 grid with numbers 1-9 (each used once). The circles show the 
          sum of their four surrounding cells.
        </p>
      </div>
      
      <div className={styles.difficultySelector}>
        {['easy', 'medium', 'hard'].map((diff) => (
          <button
            key={diff}
            className={`${styles.diffBtn} ${difficulty === diff ? styles.active : ''}`}
            onClick={() => setDifficulty(diff)}
          >
            {diff.charAt(0).toUpperCase() + diff.slice(1)}
          </button>
        ))}
      </div>
      
      <div className={styles.gameArea}>
        <div className={styles.puzzleContainer}>
          <div className={styles.grid}>
            {grid.map((row, r) =>
              row.map((cell, c) => {
                const isGiven = puzzleData.puzzle[r][c] !== 0;
                const isSelected = selectedCell?.r === r && selectedCell?.c === c;
                const hasError = errors.has(`${r},${c}`);
                
                return (
                  <button
                    key={`${r}-${c}`}
                    className={`
                      ${styles.cell}
                      ${isGiven ? styles.given : ''}
                      ${isSelected ? styles.selected : ''}
                      ${hasError ? styles.error : ''}
                    `}
                    onClick={() => handleCellClick(r, c)}
                  >
                    {cell !== 0 && (
                      <span className={styles.number}>{cell}</span>
                    )}
                  </button>
                );
              })
            )}
          </div>
          
          {/* Sum circles overlay */}
          <div className={styles.sumCircles}>
            {puzzleData.sums.map((sum, i) => (
              <div
                key={i}
                className={`${styles.sumCircle} ${sumStatus[i] ? styles.correct : ''}`}
                style={{
                  left: i % 2 === 0 ? '33.33%' : '66.66%',
                  top: i < 2 ? '33.33%' : '66.66%',
                }}
              >
                {sum}
              </div>
            ))}
          </div>
        </div>
        
        <div className={styles.numberPad}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num, idx) => (
            <button
              key={num}
              className={`${styles.numBtn} ${!available[idx] ? styles.used : ''}`}
              onClick={() => handleNumberInput(num)}
              disabled={!available[idx]}
            >
              {num}
            </button>
          ))}
          <button className={styles.numBtn} onClick={handleClear}>
            ⌫
          </button>
        </div>
        
        {gameState === 'won' && (
          <div className={styles.winMessage}>
            <div className={styles.winEmoji}>🎉</div>
            <h3>Perfect!</h3>
            <p>All sums are correct!</p>
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
          <button className={styles.resetBtn} onClick={handleReset}>
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
