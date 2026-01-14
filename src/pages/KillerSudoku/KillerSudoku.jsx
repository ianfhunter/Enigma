import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { formatTime } from '../../data/wordUtils';
import styles from './KillerSudoku.module.css';

const GRID_SIZE = 9;

// Convert string puzzle/solution to 2D array
function stringToGrid(str, gridSize) {
  const grid = [];
  for (let r = 0; r < gridSize; r++) {
    const row = [];
    for (let c = 0; c < gridSize; c++) {
      const char = str[r * gridSize + c];
      row.push(char === '-' ? 0 : parseInt(char, 10));
    }
    grid.push(row);
  }
  return grid;
}

// Convert generator format to our component format
function convertGeneratorData(generatorData, gridSize) {
  const { puzzle, solution, areas } = generatorData;
  
  // Convert string puzzle/solution to 2D arrays
  const puzzleGrid = stringToGrid(puzzle, gridSize);
  const solutionGrid = stringToGrid(solution, gridSize);
  
  // Create cage grid: each cell gets its cage ID
  const processedGrid = Array(gridSize).fill(null).map(() => Array(gridSize).fill(null));
  const cages = [];
  
  // Process areas (cages) from generator
  areas.forEach((area, index) => {
    const cageId = index;
    const cells = area.cells.map(([r, c]) => [r, c]);
    
    // Mark all cells in this cage
    cells.forEach(([r, c]) => {
      processedGrid[r][c] = cageId;
    });
    
    cages.push({
      id: cageId,
      cells,
      sum: area.sum
    });
  });
  
  return {
    cages,
    processedCageGrid: processedGrid,
    puzzleGrid,
    solutionGrid
  };
}


function checkValidity(grid, cages, gridSize) {
  const errors = new Set();
  const boxSize = gridSize === 9 ? 3 : gridSize === 6 ? 2 : 2;

  // Check standard Sudoku rules
  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      if (grid[r][c] === 0) continue;

      // Check row
      for (let x = 0; x < gridSize; x++) {
        if (x !== c && grid[r][x] === grid[r][c]) {
          errors.add(`${r},${c}`);
          errors.add(`${r},${x}`);
        }
      }

      // Check column
      for (let x = 0; x < gridSize; x++) {
        if (x !== r && grid[x][c] === grid[r][c]) {
          errors.add(`${r},${c}`);
          errors.add(`${x},${c}`);
        }
      }

      // Check box
      const boxRow = Math.floor(r / boxSize) * boxSize;
      const boxCol = Math.floor(c / boxSize) * boxSize;
      for (let i = 0; i < boxSize; i++) {
        for (let j = 0; j < boxSize; j++) {
          const nr = boxRow + i;
          const nc = boxCol + j;
          if ((nr !== r || nc !== c) && grid[nr][nc] === grid[r][c]) {
            errors.add(`${r},${c}`);
            errors.add(`${nr},${nc}`);
          }
        }
      }
    }
  }

  // Check cage constraints
  for (const cage of cages) {
    let sum = 0;
    let allFilled = true;
    const values = new Set();
    let hasDuplicate = false;

    for (const [r, c] of cage.cells) {
      if (grid[r][c] === 0) {
        allFilled = false;
      } else {
        if (values.has(grid[r][c])) {
          hasDuplicate = true;
        }
        values.add(grid[r][c]);
        sum += grid[r][c];
      }
    }

    if (sum > cage.sum || hasDuplicate) {
      for (const [r, c] of cage.cells) {
        if (grid[r][c] !== 0) {
          errors.add(`${r},${c}`);
        }
      }
    }

    if (allFilled && sum !== cage.sum) {
      for (const [r, c] of cage.cells) {
        errors.add(`${r},${c}`);
      }
    }
  }

  return errors;
}

function checkSolved(grid, solution) {
  const gridSize = grid.length;
  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      // Use == instead of === to handle number/string comparison, but ensure both are numbers
      const gridVal = Number(grid[r][c]);
      const solVal = Number(solution[r][c]);
      if (gridVal !== solVal || isNaN(gridVal) || isNaN(solVal)) {
        return false;
      }
    }
  }
  return true;
}

function getCageBorders(r, c, cageGrid) {
  const cageId = cageGrid[r][c];
  const gridSize = cageGrid.length;
  const borders = [];

  if (r === 0 || cageGrid[r-1]?.[c] !== cageId) borders.push('top');
  if (r === gridSize - 1 || cageGrid[r+1]?.[c] !== cageId) borders.push('bottom');
  if (c === 0 || cageGrid[r][c-1] !== cageId) borders.push('left');
  if (c === gridSize - 1 || cageGrid[r][c+1] !== cageId) borders.push('right');

  return borders;
}

// Export helpers for testing
export {
  checkValidity,
  checkSolved,
  getCageBorders,
  convertGeneratorData,
  stringToGrid,
};

export default function KillerSudoku() {
  const [difficulty, setDifficulty] = useState('easy');
  const [puzzleData, setPuzzleData] = useState(null);
  const [grid, setGrid] = useState([]);
  const [notes, setNotes] = useState({});
  const [selectedCell, setSelectedCell] = useState(null);
  const [notesMode, setNotesMode] = useState(false);
  const [gameState, setGameState] = useState('playing');
  const [errors, setErrors] = useState(new Set());
  const [showErrors, setShowErrors] = useState(true);
  const [timer, setTimer] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef(null);

  const initGame = useCallback(async () => {
    setLoading(true);
    
    try {
      // Dynamic import for CommonJS package
      const killerSudokuModule = await import('killer-sudoku-generator');
      // The package exports generateKillerSudoku as a named export
      const generateKillerSudoku = killerSudokuModule.generateKillerSudoku || killerSudokuModule.default?.generateKillerSudoku;
      
      if (!generateKillerSudoku || typeof generateKillerSudoku !== 'function') {
        console.error('Module structure:', killerSudokuModule);
        throw new Error('Could not find generateKillerSudoku function in package');
      }
      
      // Generate puzzle using the package
      const generatorData = generateKillerSudoku(difficulty);
      
      // Convert to our format
      const { cages, processedCageGrid, puzzleGrid, solutionGrid } = convertGeneratorData(generatorData, GRID_SIZE);
      
      setPuzzleData({
        solution: solutionGrid,
        cages,
        cageGrid: processedCageGrid,
        size: GRID_SIZE,
        initialPuzzle: puzzleGrid.map(row => [...row])
      });
      setGrid(puzzleGrid.map(row => [...row]));
      setNotes({});
      setSelectedCell(null);
      setGameState('playing');
      setErrors(new Set());
      setTimer(0);
      setIsRunning(true);
    } catch (error) {
      console.error('Failed to generate puzzle:', error);
    } finally {
      setLoading(false);
    }
  }, [difficulty]);

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

    const gridSize = puzzleData.size;
    const newErrors = showErrors ? checkValidity(grid, puzzleData.cages, gridSize) : new Set();
    setErrors(newErrors);

    if (checkSolved(grid, puzzleData.solution)) {
      setGameState('won');
      setIsRunning(false);
    }
  }, [grid, puzzleData, showErrors]);

  // Keyboard input
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!selectedCell || gameState !== 'playing') return;
      const [r, c] = selectedCell;
      const gridSize = puzzleData?.size || GRID_SIZE;

      if (e.key >= '1' && e.key <= String(gridSize)) {
        const num = parseInt(e.key, 10);
        if (notesMode) {
          setNotes(prev => {
            const key = `${r},${c}`;
            const cellNotes = new Set(prev[key] || []);
            if (cellNotes.has(num)) cellNotes.delete(num);
            else cellNotes.add(num);
            return { ...prev, [key]: cellNotes };
          });
        } else {
          setGrid(prev => {
            const newGrid = prev.map(row => [...row]);
            newGrid[r][c] = newGrid[r][c] === num ? 0 : num;
            return newGrid;
          });
          setNotes(prev => ({ ...prev, [`${r},${c}`]: new Set() }));
        }
      } else if (e.key === 'Backspace' || e.key === 'Delete' || e.key === '0') {
        setGrid(prev => {
          const newGrid = prev.map(row => [...row]);
          newGrid[r][c] = 0;
          return newGrid;
        });
      } else if (e.key.startsWith('Arrow')) {
        e.preventDefault();
        let [nr, nc] = selectedCell;
        if (e.key === 'ArrowUp') nr = Math.max(0, nr - 1);
        else if (e.key === 'ArrowDown') nr = Math.min(GRID_SIZE - 1, nr + 1);
        else if (e.key === 'ArrowLeft') nc = Math.max(0, nc - 1);
        else if (e.key === 'ArrowRight') nc = Math.min(GRID_SIZE - 1, nc + 1);
        setSelectedCell([nr, nc]);
      } else if (e.key === 'n' || e.key === 'N') {
        setNotesMode(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedCell, gameState, notesMode, puzzleData]);

  const handleCellClick = (r, c) => {
    if (gameState !== 'playing') return;
    setSelectedCell([r, c]);
  };

  const handleNumberClick = (num) => {
    if (!selectedCell || gameState !== 'playing') return;
    const [r, c] = selectedCell;

    if (notesMode) {
      setNotes(prev => {
        const key = `${r},${c}`;
        const cellNotes = new Set(prev[key] || []);
        if (cellNotes.has(num)) cellNotes.delete(num);
        else cellNotes.add(num);
        return { ...prev, [key]: cellNotes };
      });
    } else {
      setGrid(prev => {
        const newGrid = prev.map(row => [...row]);
        newGrid[r][c] = newGrid[r][c] === num ? 0 : num;
        return newGrid;
      });
      setNotes(prev => ({ ...prev, [`${r},${c}`]: new Set() }));
    }
  };

  const handleReset = () => {
    if (!puzzleData) return;
    // Reset to initial puzzle state (with pre-filled cells)
    const initialGrid = puzzleData.initialPuzzle 
      ? puzzleData.initialPuzzle.map(row => [...row])
      : Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(0));
    setGrid(initialGrid);
    setNotes({});
    setSelectedCell(null);
    setGameState('playing');
    setTimer(0);
    setIsRunning(true);
  };

  const handleGiveUp = () => {
    if (!puzzleData || gameState !== 'playing') return;
    
    // Deep copy the solution
    const solution = puzzleData.solution.map(row => [...row]);
    setGrid(solution);
    setSelectedCell(null);
    setGameState('gave_up');
    setIsRunning(false);
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <Link to="/" className={styles.backLink}>← Back to Games</Link>
          <h1 className={styles.title}>Killer Sudoku</h1>
        </div>
        <div className={styles.loading}>Generating puzzle...</div>
      </div>
    );
  }

  if (!puzzleData) return null;

  const gridSize = puzzleData.size;

  // Find cage sums for display (show at top-left cell of each cage)
  const getCageSum = (r, c) => {
    const cageId = puzzleData.cageGrid[r][c];
    if (cageId === null || cageId === undefined) return null;
    
    const cage = puzzleData.cages.find(c => c.id === cageId);
    if (!cage) return null;
    
    // Show sum at the first (top-left) cell of the cage
    const [firstR, firstC] = cage.cells[0];
    if (r === firstR && c === firstC) {
      return cage.sum;
    }
    return null;
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Link to="/" className={styles.backLink}>← Back to Games</Link>
        <h1 className={styles.title}>Killer Sudoku</h1>
        <p className={styles.instructions}>
          Fill each cell with 1-9. Standard Sudoku rules apply, plus each
          dotted cage must sum to its target and contain no duplicates.
        </p>
      </div>

      <div className={styles.difficultySelector}>
        {['easy', 'medium', 'hard'].map((d) => (
          <button
            key={d}
            className={`${styles.difficultyBtn} ${difficulty === d ? styles.active : ''}`}
            onClick={() => setDifficulty(d)}
          >
            {d.charAt(0).toUpperCase() + d.slice(1)}
          </button>
        ))}
      </div>

      <div className={styles.timer}>{formatTime(timer)}</div>

      <div className={styles.gameArea}>
        <div
          className={styles.grid}
          style={{
            gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
            '--grid-max-size': `${Math.min(gridSize * 50, 450)}px`,
          }}
        >
          {grid.map((row, r) =>
            row.map((cell, c) => {
              const isSelected = selectedCell && selectedCell[0] === r && selectedCell[1] === c;
              const hasError = errors.has(`${r},${c}`);
              const borders = getCageBorders(r, c, puzzleData.cageGrid);
              const cageSum = getCageSum(r, c);
              const cellNotes = notes[`${r},${c}`] || new Set();

              return (
                <button
                  key={`${r}-${c}`}
                  className={`
                    ${styles.cell}
                    ${isSelected ? styles.selected : ''}
                    ${hasError ? styles.error : ''}
                    ${borders.includes('top') ? styles.cageBorderTop : ''}
                    ${borders.includes('bottom') ? styles.cageBorderBottom : ''}
                    ${borders.includes('left') ? styles.cageBorderLeft : ''}
                    ${borders.includes('right') ? styles.cageBorderRight : ''}
                  `}
                  onClick={() => handleCellClick(r, c)}
                >
                  {cageSum && <span className={styles.cageSum}>{cageSum}</span>}
                  {cell !== 0 ? (
                    <span className={styles.value}>{cell}</span>
                  ) : cellNotes.size > 0 ? (
                    <span className={styles.notes}>
                      {Array.from(cellNotes).sort().join('')}
                    </span>
                  ) : null}
                </button>
              );
            })
          )}
        </div>

        {gameState === 'won' && (
          <div className={styles.winMessage}>
            <div className={styles.winEmoji}>🎉</div>
            <h3>Puzzle Solved!</h3>
            <p>Time: {formatTime(timer)}</p>
          </div>
        )}

        <div className={styles.controls}>
          <button
            className={`${styles.notesBtn} ${notesMode ? styles.active : ''}`}
            onClick={() => setNotesMode(!notesMode)}
          >
            ✏️ Notes {notesMode ? 'ON' : 'OFF'}
          </button>
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

        <div className={styles.numberPad}>
          {Array.from({ length: gridSize }, (_, i) => i + 1).map((num) => (
            <button
              key={num}
              className={styles.numberBtn}
              onClick={() => handleNumberClick(num)}
              disabled={gameState !== 'playing'}
            >
              {num}
            </button>
          ))}
          <button
            className={styles.numberBtn}
            onClick={() => selectedCell && setGrid(prev => {
              const newGrid = prev.map(row => [...row]);
              newGrid[selectedCell[0]][selectedCell[1]] = 0;
              return newGrid;
            })}
            disabled={gameState !== 'playing' || !selectedCell}
          >
            ✕
          </button>
        </div>

        <div className={styles.buttons}>
          <button className={styles.resetBtn} onClick={handleReset}>
            Reset
          </button>
          {gameState === 'playing' && (
            <button className={styles.giveUpBtn} onClick={handleGiveUp}>
              Give Up
            </button>
          )}
          <button className={styles.newGameBtn} onClick={initGame}>
            New Puzzle
          </button>
        </div>
      </div>
    </div>
  );
}
