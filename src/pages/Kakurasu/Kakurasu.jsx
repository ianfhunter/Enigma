import { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import GameHeader from '../../components/GameHeader';
import SizeSelector from '../../components/SizeSelector';
import GiveUpButton from '../../components/GiveUpButton';
import GameResult from '../../components/GameResult';
import SeedDisplay, { useSeed } from '../../components/SeedDisplay/SeedDisplay';
import { useGameState } from '../../hooks/useGameState';
import { createSeededRandom } from '../../utils/generatorUtils';
import styles from './Kakurasu.module.css';

// Grid sizes
const GRID_SIZES = {
  '4×4': 4,
  '5×5': 5,
  '6×6': 6,
  '7×7': 7,
  '8×8': 8,
};

/**
 * Calculate row and column sums for a given solution grid
 */
function calculateSums(grid, size) {
  const rowSums = [];
  const colSums = [];

  for (let i = 0; i < size; i++) {
    let rowSum = 0;
    let colSum = 0;

    for (let j = 0; j < size; j++) {
      // Row i: each filled cell in column j adds (j+1) to the sum
      if (grid[i][j] === 1) {
        rowSum += j + 1;
      }
      // Column i: each filled cell in row j adds (j+1) to the sum
      if (grid[j][i] === 1) {
        colSum += j + 1;
      }
    }

    rowSums.push(rowSum);
    colSums.push(colSum);
  }

  return { rowSums, colSums };
}

/**
 * Check if a grid matches the target sums
 */
function checkSolution(grid, targetRowSums, targetColSums, size) {
  const { rowSums, colSums } = calculateSums(grid, size);

  for (let i = 0; i < size; i++) {
    if (rowSums[i] !== targetRowSums[i]) return false;
    if (colSums[i] !== targetColSums[i]) return false;
  }

  return true;
}

/**
 * Solve a Kakurasu puzzle using backtracking
 * Returns the number of solutions found (stops at maxSolutions)
 */
function countSolutions(targetRowSums, targetColSums, size, maxSolutions = 2) {
  const grid = Array(size).fill(null).map(() => Array(size).fill(0));
  let solutions = 0;

  function isPartialValid(row) {
    // Check if current partial row sum could possibly reach target
    let currentSum = 0;
    let maxPossibleSum = 0;

    for (let c = 0; c < size; c++) {
      if (grid[row][c] === 1) {
        currentSum += c + 1;
      }
    }

    // Check if we've exceeded the target
    if (currentSum > targetRowSums[row]) return false;

    // Check column constraints for filled cells
    for (let c = 0; c < size; c++) {
      let colSum = 0;
      for (let r = 0; r <= row; r++) {
        if (grid[r][c] === 1) {
          colSum += r + 1;
        }
      }
      if (colSum > targetColSums[c]) return false;
    }

    return true;
  }

  function solve(row, col) {
    if (solutions >= maxSolutions) return;

    if (row === size) {
      // Check if solution is valid
      if (checkSolution(grid, targetRowSums, targetColSums, size)) {
        solutions++;
      }
      return;
    }

    const nextRow = col === size - 1 ? row + 1 : row;
    const nextCol = col === size - 1 ? 0 : col + 1;

    // Try not filling this cell
    grid[row][col] = 0;
    if (col === size - 1 ? isPartialValid(row) : true) {
      solve(nextRow, nextCol);
    }

    // Try filling this cell
    grid[row][col] = 1;
    if (col === size - 1 ? isPartialValid(row) : true) {
      solve(nextRow, nextCol);
    }

    grid[row][col] = 0;
  }

  solve(0, 0);
  return solutions;
}

/**
 * Generate a uniquely solvable Kakurasu puzzle
 */
function generatePuzzle(seed, size) {
  const random = createSeededRandom(seed);

  // Try multiple times to find a unique puzzle
  for (let attempt = 0; attempt < 50; attempt++) {
    // Generate a random solution grid
    // Use moderate density (40-60% filled)
    const solution = [];
    for (let r = 0; r < size; r++) {
      const row = [];
      for (let c = 0; c < size; c++) {
        row.push(random() < 0.5 ? 1 : 0);
      }
      solution.push(row);
    }

    // Calculate target sums
    const { rowSums, colSums } = calculateSums(solution, size);

    // Check for uniqueness (for smaller grids only - larger ones are usually unique)
    if (size <= 5) {
      const numSolutions = countSolutions(rowSums, colSums, size, 2);
      if (numSolutions !== 1) {
        continue; // Try another puzzle
      }
    }

    return {
      solution,
      rowSums,
      colSums,
      size,
    };
  }

  // Fallback: return last generated puzzle (may have multiple solutions for small grids)
  const solution = [];
  const fallbackRandom = createSeededRandom(seed + 1000);
  for (let r = 0; r < size; r++) {
    const row = [];
    for (let c = 0; c < size; c++) {
      row.push(fallbackRandom() < 0.5 ? 1 : 0);
    }
    solution.push(row);
  }
  const { rowSums, colSums } = calculateSums(solution, size);
  return { solution, rowSums, colSums, size };
}

/**
 * Cell component
 */
function Cell({ value, onClick, isCorrect, showSolution, solutionValue }) {
  const displayValue = showSolution ? solutionValue : value;

  return (
    <button
      className={`${styles.cell} ${displayValue === 1 ? styles.filled : ''} ${showSolution ? styles.revealed : ''}`}
      onClick={onClick}
      disabled={showSolution}
    >
      {displayValue === 1 && <div className={styles.marker} />}
    </button>
  );
}

// Export helpers for testing
export { calculateSums, checkSolution, countSolutions, generatePuzzle };

export default function Kakurasu() {
  const { t } = useTranslation();
  const [sizeKey, setSizeKey] = useState('5×5');
  const { seed, setSeed, newSeed } = useSeed('kakurasu', () => Math.floor(Math.random() * 1000000));

  const [puzzleData, setPuzzleData] = useState(null);
  const [grid, setGrid] = useState([]);

  const { gameState, checkWin, giveUp, reset: resetGameState, isPlaying } = useGameState();

  const size = GRID_SIZES[sizeKey];

  // Initialize puzzle
  const initGame = useCallback((newSeedValue) => {
    const seedToUse = newSeedValue !== undefined ? newSeedValue : seed;
    const puzzle = generatePuzzle(seedToUse, size);
    setPuzzleData(puzzle);
    setGrid(Array(size).fill(null).map(() => Array(size).fill(0)));
    resetGameState();
  }, [size, seed, resetGameState]);

  useEffect(() => {
    initGame();
  }, [seed, size]); // eslint-disable-line react-hooks/exhaustive-deps

  // Calculate current sums for display
  const currentSums = useMemo(() => {
    if (!grid.length) return { rowSums: [], colSums: [] };
    return calculateSums(grid, size);
  }, [grid, size]);

  // Check win condition
  useEffect(() => {
    if (!puzzleData || !isPlaying || grid.length === 0) return;
    checkWin(checkSolution(grid, puzzleData.rowSums, puzzleData.colSums, size));
  }, [grid, puzzleData, size, isPlaying, checkWin]);

  const handleCellClick = (row, col) => {
    if (!isPlaying) return;

    setGrid(prev => {
      const newGrid = prev.map(r => [...r]);
      newGrid[row][col] = newGrid[row][col] === 1 ? 0 : 1;
      return newGrid;
    });
  };

  const handleNewGame = () => {
    const nextSeed = newSeed();
    initGame(nextSeed);
  };

  const handleGiveUp = () => {
    if (!puzzleData || !isPlaying) return;
    // Set grid to solution so sums display correctly
    setGrid(puzzleData.solution.map(row => [...row]));
    giveUp();
  };

  const handleSeedChange = (newSeedValue) => {
    setSeed(newSeedValue);
  };

  const handleReset = () => {
    setGrid(Array(size).fill(null).map(() => Array(size).fill(0)));
  };

  if (!puzzleData) return null;

  const showSolution = gameState === 'gaveUp';

  return (
    <div className={styles.container}>
      <GameHeader
        title={t('kakurasu.title', 'Kakurasu')}
        instructions={t('kakurasu.instructions', 'Fill cells so that the sum of column numbers for each row matches the row target, and vice versa. Column/row values are 1, 2, 3... from left/top.')}
      />

      <div className={styles.controls}>
        <SizeSelector
          options={Object.keys(GRID_SIZES)}
          value={sizeKey}
          onChange={setSizeKey}
        />
        <SeedDisplay
          seed={seed}
          onSeedChange={handleSeedChange}
          onNewSeed={handleNewGame}
          showNewButton
        />
      </div>

      <div className={styles.gameArea}>
        <div className={styles.gridWrapper}>
          {/* Column numbers header */}
          <div className={styles.headerRow}>
            <div className={styles.cornerCell} />
            {Array.from({ length: size }, (_, i) => (
              <div key={i} className={styles.colNumber}>
                {i + 1}
              </div>
            ))}
            <div className={styles.sumHeader}>{t('kakurasu.target', 'Target')}</div>
          </div>

          {/* Grid rows */}
          {grid.map((row, rowIdx) => (
            <div key={rowIdx} className={styles.gridRow}>
              {/* Row number */}
              <div className={styles.rowNumber}>
                {rowIdx + 1}
              </div>

              {/* Cells */}
              {row.map((cell, colIdx) => (
                <Cell
                  key={colIdx}
                  value={cell}
                  onClick={() => handleCellClick(rowIdx, colIdx)}
                  showSolution={showSolution}
                  solutionValue={puzzleData.solution[rowIdx][colIdx]}
                />
              ))}

              {/* Row sum */}
              <div className={`${styles.rowSum} ${currentSums.rowSums[rowIdx] === puzzleData.rowSums[rowIdx] ? styles.correct : ''}`}>
                <span className={styles.currentSum}>{currentSums.rowSums[rowIdx]}</span>
                <span className={styles.targetSum}>/{puzzleData.rowSums[rowIdx]}</span>
              </div>
            </div>
          ))}

          {/* Column sums footer */}
          <div className={styles.footerRow}>
            <div className={styles.rowNumber} style={{ visibility: 'hidden' }}>0</div>
            {puzzleData.colSums.map((target, i) => (
              <div
                key={i}
                className={`${styles.colSum} ${currentSums.colSums[i] === target ? styles.correct : ''}`}
              >
                <span className={styles.currentSum}>{currentSums.colSums[i]}</span>
                <span className={styles.targetSum}>/{target}</span>
              </div>
            ))}
            <div className={styles.sumHeader}>{t('kakurasu.target', 'Target')}</div>
          </div>
        </div>

        {gameState === 'won' && (
          <GameResult
            state="won"
            title={t('kakurasu.won', 'Puzzle Solved!')}
            message={t('kakurasu.wonMessage', 'All sums match perfectly!')}
            actions={[{ label: t('common.newGame'), onClick: handleNewGame, primary: true }]}
          />
        )}

        {gameState === 'gaveUp' && (
          <GameResult
            state="gaveup"
            title={t('kakurasu.gaveUp', 'Solution Revealed')}
            message={t('kakurasu.gaveUpMessage', 'Study the pattern and try another puzzle!')}
            actions={[{ label: t('common.newGame'), onClick: handleNewGame, primary: true }]}
          />
        )}
      </div>

      <div className={styles.buttons}>
        <button className={styles.resetBtn} onClick={handleReset} disabled={!isPlaying}>
          {t('common.clear', 'Clear')}
        </button>
        <GiveUpButton
          onGiveUp={handleGiveUp}
          disabled={!isPlaying}
        />
        <button className={styles.newGameBtn} onClick={handleNewGame}>
          {t('common.newGame')}
        </button>
      </div>

      <div className={styles.legend}>
        <h4>{t('kakurasu.howItWorks', 'How It Works')}</h4>
        <p>
          {t('kakurasu.explanation', 'Each column has a value (1, 2, 3... from left). When you fill a cell, its column value is added to that row\'s sum. Similarly, each row has a value that contributes to column sums. Match all targets to win!')}
        </p>
      </div>
    </div>
  );
}
