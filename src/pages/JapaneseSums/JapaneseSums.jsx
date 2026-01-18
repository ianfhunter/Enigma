import { useState, useEffect, useCallback } from 'react';
import GameHeader from '../../components/GameHeader';
import SeedDisplay from '../../components/SeedDisplay';
import { generatePuzzle, isSolved } from './generator';
import { stringToSeed, getTodayDateString } from '../../data/wordUtils';
import styles from './JapaneseSums.module.css';

const DIFFICULTIES = ['easy', 'medium', 'hard', 'expert'];
const SIZES = [5, 6, 7, 8, 9];

export default function JapaneseSums() {
  const [size, setSize] = useState(7);
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
      : stringToSeed(`japanese-sums-${today}-${newDifficulty}-${newSize}`);
    
    const data = generatePuzzle(newSize, newDifficulty, actualSeed);
    setPuzzleData(data);
    // Initialize grid with nulls, but show prefilled hints
    setGrid(data.puzzle.map(row => row.map(cell => cell !== null ? cell : null)));
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
    
    if (isSolved(grid, puzzleData.solution, puzzleData.pattern)) {
      setGameState('won');
    }
  }, [grid, puzzleData, gameState, showSolution]);

  const handleCellClick = (r, c) => {
    if (gameState !== 'playing' || showSolution) return;
    if (!puzzleData.pattern[r][c]) return; // Can't fill shaded cells
    
    setGrid(prev => {
      const newGrid = prev.map(row => [...row]);
      
      // Cycle through numbers 1..n
      if (newGrid[r][c] === null || newGrid[r][c] === 0) {
        newGrid[r][c] = 1;
      } else if (newGrid[r][c] < size) {
        newGrid[r][c] = newGrid[r][c] + 1;
      } else {
        newGrid[r][c] = null;
      }
      
      return newGrid;
    });
  };

  const handleCellRightClick = (e, r, c) => {
    e.preventDefault();
    if (gameState !== 'playing' || showSolution) return;
    if (!puzzleData.pattern[r][c]) return;
    
    setGrid(prev => {
      const newGrid = prev.map(row => [...row]);
      
      // Cycle backwards
      if (newGrid[r][c] === null || newGrid[r][c] === 0) {
        newGrid[r][c] = size;
      } else if (newGrid[r][c] > 1) {
        newGrid[r][c] = newGrid[r][c] - 1;
      } else {
        newGrid[r][c] = null;
      }
      
      return newGrid;
    });
  };

  const handleNumberInput = (num) => {
    if (gameState !== 'playing' || showSolution) return;
    
    setGrid(prev => {
      const newGrid = prev.map(row => [...row]);
      
      // Find first empty cell that should be filled
      for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
          if (puzzleData.pattern[r][c] && (newGrid[r][c] === null || newGrid[r][c] === 0)) {
            newGrid[r][c] = num;
            return newGrid;
          }
        }
      }
      
      return newGrid;
    });
  };

  const handleClear = () => {
    if (gameState !== 'playing' || showSolution) return;
    setGrid(puzzleData.puzzle.map(row => [...row]));
  };

  const handleGiveUp = () => {
    if (!puzzleData || gameState !== 'playing') return;
    setGrid(puzzleData.solution.map(row => [...row]));
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
        title="Japanese Sums"
        instructions="Fill cells with numbers 1-n so each row and column has unique numbers. The numbers outside show the sums of consecutive filled cell groups. Shaded cells separate the groups."
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
          className={styles.gridContainer}
          style={{ '--grid-size': size }}
        >
          {/* Column clues (top) */}
          <div className={styles.topClues}>
            <div className={styles.topLeftCorner}></div>
            <div className={styles.topClueSpacer}></div>
            {puzzleData && puzzleData.colClues.map((clues, c) => (
              <div key={c} className={styles.colClue}>
                {clues.length > 0 ? (
                  <div className={styles.clueGroup}>
                    {clues.map((sum, i) => (
                      <span key={i} className={styles.clueValue}>{sum}</span>
                    ))}
                  </div>
                ) : (
                  <div className={styles.clueEmpty}></div>
                )}
              </div>
            ))}
          </div>

          {/* Main grid */}
          <div className={styles.gridRow}>
            {/* Row clues (left) */}
            <div className={styles.leftClues}>
              {puzzleData && puzzleData.rowClues.map((clues, r) => (
                <div key={r} className={styles.rowClue}>
                  {clues.length > 0 ? (
                    <div className={styles.clueGroup}>
                      {clues.map((sum, i) => (
                        <span key={i} className={styles.clueValue}>{sum}</span>
                      ))}
                    </div>
                  ) : (
                    <div className={styles.clueEmpty}></div>
                  )}
                </div>
              ))}
            </div>

            {/* Grid */}
            <div
              className={styles.grid}
              style={{ '--grid-size': size }}
            >
              {puzzleData && currentGrid.map((row, r) =>
                row.map((cell, c) => {
                  const isShaded = !puzzleData.pattern[r][c];
                  const isInitial = puzzleData.puzzle[r][c] !== null;
                  const isSolution = showSolution;
                  
                  return (
                    <div
                      key={`${r}-${c}`}
                      className={`
                        ${styles.cell}
                        ${isShaded ? styles.shaded : ''}
                        ${isInitial ? styles.initial : ''}
                        ${isSolution ? styles.solution : ''}
                      `}
                      onClick={() => handleCellClick(r, c)}
                      onContextMenu={(e) => handleCellRightClick(e, r, c)}
                    >
                      {!isShaded && cell !== null && cell !== 0 && (
                        <span className={styles.number}>{cell}</span>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      <div className={styles.numberPad}>
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
        <button
          className={styles.clearBtn}
          onClick={handleClear}
          disabled={gameState !== 'playing' || showSolution}
        >
          Clear
        </button>
      </div>
    </div>
  );
}