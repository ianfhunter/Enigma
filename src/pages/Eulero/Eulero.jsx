import { useState, useEffect, useCallback, useMemo } from 'react';
import GameHeader from '../../components/GameHeader';
import SeedDisplay from '../../components/SeedDisplay';
import { generatePuzzle, isSolved } from './generator';
import { createSeededRandom, stringToSeed, getTodayDateString } from '../../data/wordUtils';
import styles from './Eulero.module.css';

const DIFFICULTIES = ['easy', 'medium', 'hard', 'expert'];
const SIZES = [4, 5, 6, 7];

export default function Eulero() {
  const [size, setSize] = useState(5);
  const [difficulty, setDifficulty] = useState('medium');
  const [puzzleData, setPuzzleData] = useState(null);
  const [grid, setGrid] = useState([]);
  const [gameState, setGameState] = useState('playing');
  const [seed, setSeed] = useState(null);
  const [showSolution, setShowSolution] = useState(false);

  const initGame = useCallback((newSize = size, newDifficulty = difficulty, customSeed = null) => {
    const today = getTodayDateString();
    const actualSeed = customSeed !== null 
      ? (typeof customSeed === 'string' ? stringToSeed(customSeed) : customSeed)
      : stringToSeed(`eulero-${today}-${newDifficulty}-${newSize}`);
    
    const data = generatePuzzle(newSize, newDifficulty, actualSeed);
    setPuzzleData(data);
    setGrid(data.puzzle.map(row => row.map(cell => cell ? { ...cell } : null)));
    setGameState('playing');
    setShowSolution(false);
    setSeed(actualSeed);
  }, []);

  useEffect(() => {
    initGame(size, difficulty);
  }, [size, difficulty, initGame]);

  // Check for win
  useEffect(() => {
    if (!puzzleData || gameState !== 'playing' || showSolution) return;
    
    // Check if all cells are filled and correct
    let allFilled = true;
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (!grid[r][c] || !grid[r][c].number || !grid[r][c].letter) {
          allFilled = false;
          break;
        }
      }
      if (!allFilled) break;
    }
    
    if (allFilled && isSolved(grid, puzzleData.solution)) {
      setGameState('won');
    }
  }, [grid, puzzleData, gameState, showSolution, size]);

  const handleCellClick = (r, c) => {
    if (gameState !== 'playing' || showSolution) return;
    
    setGrid(prev => {
      const newGrid = prev.map(row => row.map(cell => cell ? { ...cell } : null));
      
      if (!newGrid[r][c]) {
        newGrid[r][c] = { number: 1, letter: 'A' };
      } else {
        // Cycle: number -> letter -> both -> null
        const current = newGrid[r][c];
        if (current.number && current.letter) {
          // Has both, remove
          newGrid[r][c] = null;
        } else if (current.number) {
          // Has number, add letter
          newGrid[r][c] = { number: current.number, letter: 'A' };
        } else {
          // Has letter, remove
          newGrid[r][c] = null;
        }
      }
      
      return newGrid;
    });
  };

  const handleCellRightClick = (e, r, c) => {
    e.preventDefault();
    if (gameState !== 'playing' || showSolution) return;
    
    setGrid(prev => {
      const newGrid = prev.map(row => row.map(cell => cell ? { ...cell } : null));
      
      if (!newGrid[r][c]) {
        newGrid[r][c] = { number: null, letter: 'A' };
      } else {
        const current = newGrid[r][c];
        if (current.letter) {
          // Cycle letter
          const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.slice(0, size).split('');
          const currentIdx = letters.indexOf(current.letter);
          const nextIdx = (currentIdx + 1) % letters.length;
          newGrid[r][c] = { 
            number: current.number || null, 
            letter: letters[nextIdx] 
          };
        }
      }
      
      return newGrid;
    });
  };

  const handleNumberInput = (num) => {
    if (gameState !== 'playing' || showSolution) return;
    
    // Find selected cell (simplified - use last clicked)
    // In a more complete implementation, you'd track selected cell
    setGrid(prev => {
      const newGrid = prev.map(row => row.map(cell => cell ? { ...cell } : null));
      
      // Find first empty or partially filled cell
      for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
          if (!newGrid[r][c] || !newGrid[r][c].number) {
            if (!newGrid[r][c]) {
              newGrid[r][c] = { number: num, letter: null };
            } else {
              newGrid[r][c].number = num;
            }
            return newGrid;
          }
        }
      }
      
      return newGrid;
    });
  };

  const handleClear = () => {
    if (gameState !== 'playing' || showSolution) return;
    setGrid(puzzleData.puzzle.map(row => row.map(cell => cell ? { ...cell } : null)));
  };

  const handleGiveUp = () => {
    if (!puzzleData || gameState !== 'playing') return;
    setGrid(puzzleData.solution.map(row => row.map(cell => ({ ...cell }))));
    setShowSolution(true);
    setGameState('gaveUp');
  };

  const handleNewPuzzle = () => {
    initGame(size, difficulty, Date.now());
  };

  const handleSeedChange = (newSeed) => {
    const parsed = typeof newSeed === 'string' ? stringToSeed(newSeed) : newSeed;
    initGame(size, difficulty, parsed);
  };

  const currentGrid = showSolution && puzzleData 
    ? puzzleData.solution 
    : grid;

  return (
    <div className={styles.container}>
      <GameHeader
        title="Eulero"
        instructions="Fill each cell with a number and letter. Each row and column must have all numbers 1-n and all letters A-n exactly once. No (number, letter) pair may appear twice in the grid."
      />

      <div className={styles.toolbar}>
        <label className={styles.label}>
          Size:
          <select
            className={styles.select}
            value={size}
            onChange={(e) => setSize(parseInt(e.target.value))}
          >
            {SIZES.map(s => (
              <option key={s} value={s}>{s}×{s}</option>
            ))}
          </select>
        </label>

        <label className={styles.label}>
          Difficulty:
          <select
            className={styles.select}
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
          >
            {DIFFICULTIES.map(d => (
              <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>
            ))}
          </select>
        </label>

        <button className={styles.button} onClick={handleNewPuzzle}>New</button>
        <button className={styles.button} onClick={handleClear}>Clear</button>
        <button
          className={`${styles.button} ${styles.giveUpButton}`}
          onClick={handleGiveUp}
          disabled={gameState !== 'playing' || showSolution}
        >
          Give Up
        </button>

        <div className={styles.status}>
          {showSolution ? (
            <span className={styles.gaveUp}>Solution revealed</span>
          ) : gameState === 'won' ? (
            <span className={styles.win}>Solved!</span>
          ) : (
            <span>Playing...</span>
          )}
        </div>
      </div>

      {seed && (
        <div className={styles.seedContainer}>
          <SeedDisplay
            seed={seed}
            onSeedChange={handleSeedChange}
            showNewButton={false}
          />
        </div>
      )}

      <div className={styles.boardWrap}>
        <div
          className={styles.grid}
          style={{ gridTemplateColumns: `repeat(${size}, 1fr)` }}
        >
          {currentGrid.map((row, r) =>
            row.map((cell, c) => {
              const isShown = showSolution || (puzzleData && puzzleData.puzzle[r][c]);
              
              return (
                <div
                  key={`${r}-${c}`}
                  className={`${styles.cell} ${isShown ? styles.initial : ''} ${showSolution ? styles.solution : ''}`}
                  onClick={() => handleCellClick(r, c)}
                  onContextMenu={(e) => handleCellRightClick(e, r, c)}
                >
                  {cell && (
                    <>
                      {cell.number && (
                        <span className={styles.number}>{cell.number}</span>
                      )}
                      {cell.letter && (
                        <span className={styles.letter}>{cell.letter}</span>
                      )}
                    </>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      <div className={styles.numberPad}>
        <div className={styles.numberRow}>
          {Array.from({ length: size }, (_, i) => i + 1).map(num => (
            <button
              key={num}
              className={styles.numBtn}
              onClick={() => handleNumberInput(num)}
              disabled={gameState !== 'playing' || showSolution}
            >
              {num}
            </button>
          ))}
        </div>
        <div className={styles.letterRow}>
          {'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.slice(0, size).split('').map(letter => (
            <button
              key={letter}
              className={styles.letterBtn}
              onClick={() => {
                // Similar to number input but for letters
                setGrid(prev => {
                  const newGrid = prev.map(row => row.map(cell => cell ? { ...cell } : null));
                  for (let r = 0; r < size; r++) {
                    for (let c = 0; c < size; c++) {
                      if (!newGrid[r][c] || !newGrid[r][c].letter) {
                        if (!newGrid[r][c]) {
                          newGrid[r][c] = { number: null, letter };
                        } else {
                          newGrid[r][c].letter = letter;
                        }
                        return newGrid;
                      }
                    }
                  }
                  return newGrid;
                });
              }}
              disabled={gameState !== 'playing' || showSolution}
            >
              {letter}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}