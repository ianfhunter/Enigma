import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import styles from './Str8ts.module.css';

const GRID_SIZE = 9;

// Generate a valid Str8ts puzzle
function generatePuzzle(difficulty = 'medium') {
  // Create a solved grid first
  const grid = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(0));
  const isBlack = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(false));
  
  // Place black cells in a symmetric pattern
  const blackCount = difficulty === 'easy' ? 12 : difficulty === 'medium' ? 16 : 20;
  const placed = new Set();
  
  for (let i = 0; i < blackCount / 2; i++) {
    let r, c;
    do {
      r = Math.floor(Math.random() * GRID_SIZE);
      c = Math.floor(Math.random() * GRID_SIZE);
    } while (placed.has(`${r},${c}`) || placed.has(`${GRID_SIZE - 1 - r},${GRID_SIZE - 1 - c}`));
    
    placed.add(`${r},${c}`);
    placed.add(`${GRID_SIZE - 1 - r},${GRID_SIZE - 1 - c}`);
    isBlack[r][c] = true;
    isBlack[GRID_SIZE - 1 - r][GRID_SIZE - 1 - c] = true;
  }
  
  // Identify compartments (runs of white cells)
  const compartments = [];
  
  // Horizontal compartments
  for (let r = 0; r < GRID_SIZE; r++) {
    let start = -1;
    for (let c = 0; c <= GRID_SIZE; c++) {
      if (c < GRID_SIZE && !isBlack[r][c]) {
        if (start === -1) start = c;
      } else {
        if (start !== -1 && c - start > 1) {
          compartments.push({
            cells: Array.from({ length: c - start }, (_, i) => [r, start + i]),
            type: 'row'
          });
        }
        start = -1;
      }
    }
  }
  
  // Vertical compartments
  for (let c = 0; c < GRID_SIZE; c++) {
    let start = -1;
    for (let r = 0; r <= GRID_SIZE; r++) {
      if (r < GRID_SIZE && !isBlack[r][c]) {
        if (start === -1) start = r;
      } else {
        if (start !== -1 && r - start > 1) {
          compartments.push({
            cells: Array.from({ length: r - start }, (_, i) => [start + i, c]),
            type: 'col'
          });
        }
        start = -1;
      }
    }
  }
  
  // Fill grid with valid numbers using backtracking
  function isValid(r, c, num) {
    // Check row uniqueness
    for (let i = 0; i < GRID_SIZE; i++) {
      if (i !== c && grid[r][i] === num) return false;
    }
    
    // Check column uniqueness
    for (let i = 0; i < GRID_SIZE; i++) {
      if (i !== r && grid[i][c] === num) return false;
    }
    
    return true;
  }
  
  function checkCompartmentValid(comp) {
    const values = comp.cells.map(([r, c]) => grid[r][c]).filter(v => v > 0);
    if (values.length === 0) return true;
    
    // Check for duplicates
    if (new Set(values).size !== values.length) return false;
    
    // If all filled, check for consecutive sequence
    if (values.length === comp.cells.length) {
      values.sort((a, b) => a - b);
      for (let i = 1; i < values.length; i++) {
        if (values[i] !== values[i - 1] + 1) return false;
      }
    }
    
    return true;
  }
  
  function solve(idx) {
    // Find next white cell
    while (idx < GRID_SIZE * GRID_SIZE) {
      const r = Math.floor(idx / GRID_SIZE);
      const c = idx % GRID_SIZE;
      if (!isBlack[r][c]) break;
      idx++;
    }
    
    if (idx >= GRID_SIZE * GRID_SIZE) return true;
    
    const r = Math.floor(idx / GRID_SIZE);
    const c = idx % GRID_SIZE;
    
    // Try numbers 1-9 in random order
    const nums = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    for (let i = nums.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [nums[i], nums[j]] = [nums[j], nums[i]];
    }
    
    for (const num of nums) {
      if (isValid(r, c, num)) {
        grid[r][c] = num;
        
        // Check all compartments containing this cell
        const valid = compartments.every(comp => {
          const inComp = comp.cells.some(([cr, cc]) => cr === r && cc === c);
          return !inComp || checkCompartmentValid(comp);
        });
        
        if (valid && solve(idx + 1)) return true;
        grid[r][c] = 0;
      }
    }
    
    return false;
  }
  
  // Try to solve, regenerate if stuck
  if (!solve(0)) {
    return generatePuzzle(difficulty);
  }
  
  // Create solution copy
  const solution = grid.map(row => [...row]);
  
  // Create puzzle by removing cells
  const puzzle = grid.map(row => [...row]);
  const whiteCells = [];
  
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (!isBlack[r][c]) whiteCells.push([r, c]);
    }
  }
  
  // Shuffle and remove cells
  for (let i = whiteCells.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [whiteCells[i], whiteCells[j]] = [whiteCells[j], whiteCells[i]];
  }
  
  const cellsToRemove = Math.floor(whiteCells.length * (difficulty === 'easy' ? 0.4 : difficulty === 'medium' ? 0.55 : 0.7));
  
  for (let i = 0; i < cellsToRemove; i++) {
    const [r, c] = whiteCells[i];
    puzzle[r][c] = 0;
  }
  
  // Add some numbers to black cells as clues
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (isBlack[r][c] && Math.random() < 0.3) {
        // Put a number that's used in the row or column
        const used = new Set();
        for (let i = 0; i < GRID_SIZE; i++) {
          if (!isBlack[r][i] && solution[r][i]) used.add(solution[r][i]);
          if (!isBlack[i][c] && solution[i][c]) used.add(solution[i][c]);
        }
        const available = [1, 2, 3, 4, 5, 6, 7, 8, 9].filter(n => !used.has(n));
        if (available.length > 0) {
          puzzle[r][c] = available[Math.floor(Math.random() * available.length)];
          solution[r][c] = puzzle[r][c];
        }
      }
    }
  }
  
  return { puzzle, solution, isBlack, compartments };
}

// Find errors in current grid
function findErrors(grid, isBlack, solution) {
  const errors = new Set();
  
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (!isBlack[r][c] && grid[r][c] !== 0) {
        // Check row duplicates
        for (let i = 0; i < GRID_SIZE; i++) {
          if (i !== c && !isBlack[r][i] && grid[r][i] === grid[r][c]) {
            errors.add(`${r},${c}`);
            errors.add(`${r},${i}`);
          }
        }
        
        // Check column duplicates
        for (let i = 0; i < GRID_SIZE; i++) {
          if (i !== r && !isBlack[i][c] && grid[i][c] === grid[r][c]) {
            errors.add(`${r},${c}`);
            errors.add(`${i},${c}`);
          }
        }
        
        // Check against solution
        if (solution[r][c] !== grid[r][c]) {
          errors.add(`${r},${c}`);
        }
      }
    }
  }
  
  return errors;
}

export default function Str8ts() {
  const [difficulty, setDifficulty] = useState('medium');
  const [puzzleData, setPuzzleData] = useState(null);
  const [grid, setGrid] = useState([]);
  const [selectedCell, setSelectedCell] = useState(null);
  const [gameState, setGameState] = useState('playing');
  const [errors, setErrors] = useState(new Set());
  const [showErrors, setShowErrors] = useState(true);
  
  const initGame = useCallback(() => {
    const data = generatePuzzle(difficulty);
    setPuzzleData(data);
    setGrid(data.puzzle.map(row => [...row]));
    setSelectedCell(null);
    setGameState('playing');
    setErrors(new Set());
  }, [difficulty]);
  
  useEffect(() => {
    initGame();
  }, [initGame]);
  
  useEffect(() => {
    if (!puzzleData) return;
    
    const newErrors = showErrors ? findErrors(grid, puzzleData.isBlack, puzzleData.solution) : new Set();
    setErrors(newErrors);
    
    // Check if solved
    let allFilled = true;
    let allCorrect = true;
    
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        if (!puzzleData.isBlack[r][c]) {
          if (grid[r][c] === 0) allFilled = false;
          if (grid[r][c] !== puzzleData.solution[r][c]) allCorrect = false;
        }
      }
    }
    
    if (allFilled && allCorrect) {
      setGameState('won');
    }
  }, [grid, puzzleData, showErrors]);
  
  const handleCellClick = (r, c) => {
    if (gameState !== 'playing' || !puzzleData) return;
    if (puzzleData.isBlack[r][c]) return;
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
      } else if (e.key === 'ArrowUp') {
        for (let nr = r - 1; nr >= 0; nr--) {
          if (!puzzleData.isBlack[nr][c]) {
            setSelectedCell({ r: nr, c });
            break;
          }
        }
      } else if (e.key === 'ArrowDown') {
        for (let nr = r + 1; nr < GRID_SIZE; nr++) {
          if (!puzzleData.isBlack[nr][c]) {
            setSelectedCell({ r: nr, c });
            break;
          }
        }
      } else if (e.key === 'ArrowLeft') {
        for (let nc = c - 1; nc >= 0; nc--) {
          if (!puzzleData.isBlack[r][nc]) {
            setSelectedCell({ r, c: nc });
            break;
          }
        }
      } else if (e.key === 'ArrowRight') {
        for (let nc = c + 1; nc < GRID_SIZE; nc++) {
          if (!puzzleData.isBlack[r][nc]) {
            setSelectedCell({ r, c: nc });
            break;
          }
        }
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
  
  if (!puzzleData) return null;
  
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Link to="/" className={styles.backLink}>← Back to Games</Link>
        <h1 className={styles.title}>Str8ts</h1>
        <p className={styles.instructions}>
          Fill white cells with 1-9. No repeats in rows/columns. Each white compartment 
          must form a consecutive sequence (e.g., 3,4,5). Black cells with numbers block those digits.
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
        <div className={styles.grid}>
          {grid.map((row, r) =>
            row.map((cell, c) => {
              const isBlackCell = puzzleData.isBlack[r][c];
              const isGiven = !isBlackCell && puzzleData.puzzle[r][c] !== 0;
              const isSelected = selectedCell?.r === r && selectedCell?.c === c;
              const hasError = errors.has(`${r},${c}`);
              
              return (
                <button
                  key={`${r}-${c}`}
                  className={`
                    ${styles.cell}
                    ${isBlackCell ? styles.black : styles.white}
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
        
        {gameState === 'won' && (
          <div className={styles.winMessage}>
            <div className={styles.winEmoji}>🎉</div>
            <h3>Excellent!</h3>
            <p>You solved the Str8ts puzzle!</p>
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
