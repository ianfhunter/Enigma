import { useTranslation } from 'react-i18next';
import { useState, useEffect, useCallback } from 'react';
import GameHeader from '../../components/GameHeader';
import { usePersistedState } from '../../hooks/usePersistedState';
import SeedDisplay from '../../components/SeedDisplay';
import GiveUpButton from '../../components/GiveUpButton';
import GameResult from '../../components/GameResult';
import { useGameState } from '../../hooks/useGameState';
import { createSeededRandom, getTodayDateString, stringToSeed } from '../../data/wordUtils';
import styles from './Suko.module.css';

// Suko is a 3x3 grid where each cell contains 1-9 (each used once)
// There are 4 circle clues at intersections showing the sum of 4 adjacent cells
// Additionally, cells are colored green, orange, or yellow, and each color group has a target sum

const STORAGE_KEY = 'suko-game-state';

// Load puzzles from dataset
let puzzleDataset = null;
async function loadPuzzleDataset() {
  if (puzzleDataset) return puzzleDataset;
  try {
    const response = await fetch('/datasets/suko_dataset.json');
    puzzleDataset = await response.json();
    return puzzleDataset;
  } catch (e) {
    console.error('Failed to load Suko puzzles:', e);
    return null;
  }
}

// Select a puzzle based on seed
function selectPuzzle(puzzles, seed) {
  if (!puzzles || puzzles.length === 0) return null;
  const random = createSeededRandom(seed);
  return puzzles[Math.floor(random() * puzzles.length)];
}

// Convert flat grid (9 elements) to 3x3 array
function flatToGrid(flat) {
  return [
    [flat[0], flat[1], flat[2]],
    [flat[3], flat[4], flat[5]],
    [flat[6], flat[7], flat[8]],
  ];
}

// Convert 3x3 grid to flat array
function gridToFlat(grid) {
  return grid.flat();
}

// Calculate the 4 corner sums for a given grid
function calculateSums(grid) {
  return [
    grid[0][0] + grid[0][1] + grid[1][0] + grid[1][1], // top-left
    grid[0][1] + grid[0][2] + grid[1][1] + grid[1][2], // top-right
    grid[1][0] + grid[1][1] + grid[2][0] + grid[2][1], // bottom-left
    grid[1][1] + grid[1][2] + grid[2][1] + grid[2][2], // bottom-right
  ];
}

// Calculate color sums for current grid
function calculateColorSums(grid, colorPattern, colors) {
  const flat = gridToFlat(grid);
  const sortingNumber = colorPattern.map(String).join('');

  const greenSum = sumPositions(flat, sortingNumber, 0, colors.green);
  const orangeSum = sumPositions(flat, sortingNumber, colors.green, colors.green + colors.orange);
  const yellowSum = sumPositions(flat, sortingNumber, colors.green + colors.orange, 9);

  return [greenSum, orangeSum, yellowSum];
}

function sumPositions(flat, sortingNumber, start, end) {
  let sum = 0;
  for (let i = start; i < end; i++) {
    const pos = parseInt(sortingNumber[i]) - 1;
    sum += flat[pos];
  }
  return sum;
}

// Get color for a cell position (0-8)
function getCellColor(position, colorPattern, colors) {
  const sortingNumber = colorPattern.map(String).join('');
  const index = sortingNumber.indexOf(String(position + 1));

  if (index < colors.green) return 'green';
  if (index < colors.green + colors.orange) return 'orange';
  return 'yellow';
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

// Check which color sums are satisfied
function checkColorSums(grid, colorPattern, colors, targetColorSums) {
  const currentColorSums = calculateColorSums(grid, colorPattern, colors);
  return [
    currentColorSums[0] === targetColorSums.green,
    currentColorSums[1] === targetColorSums.orange,
    currentColorSums[2] === targetColorSums.yellow,
  ];
}

// Export helpers for testing
export {
  selectPuzzle,
  flatToGrid,
  gridToFlat,
  calculateSums,
  calculateColorSums,
  getCellColor,
  checkValidity,
  checkSums,
  checkColorSums,
};

export default function Suko() {
  const [savedState, setSavedState] = usePersistedState(STORAGE_KEY, null);
  const [puzzleData, setPuzzleData] = useState(null);
  const [grid, setGrid] = useState([]);
  const [selectedCell, setSelectedCell] = useState(null);
  const { gameState, setGameState, checkWin, giveUp, reset: resetGameState, isPlaying } = useGameState();
  const [errors, setErrors] = useState(new Set());
  const [showErrors, setShowErrors] = useState(false);
  const [sumStatus, setSumStatus] = useState([false, false, false, false]);
  const [colorSumStatus, setColorSumStatus] = useState([false, false, false]);
  const [seed, setSeed] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);

  const initGame = useCallback(async (forceNew = false, customSeed = null) => {
    const today = getTodayDateString();

    // Try to restore saved state
    if (!forceNew && savedState && savedState.date === today && savedState.puzzleId) {
      setPuzzleData(savedState.puzzleData);
      setGrid(savedState.grid.map(row => [...row]));
      setSelectedCell(null);
      setGameState(savedState.gameState || 'playing');
      setErrors(new Set());
      setSumStatus(savedState.sumStatus || [false, false, false, false]);
      setColorSumStatus(savedState.colorSumStatus || [false, false, false]);
      setSeed(saved.seed);
      setIsLoaded(true);
      return;
    }

    // Load dataset and select new puzzle
    const dataset = await loadPuzzleDataset();
    if (!dataset || !dataset.puzzles) {
      console.error('Failed to load Suko dataset');
      setIsLoaded(true);
      return;
    }

    const seedString = customSeed === null
      ? `suko-${today}${forceNew ? '-' + Date.now() : ''}`
      : String(customSeed);
    const gameSeed = typeof seedString === 'number' ? seedString : stringToSeed(seedString);
    const selected = selectPuzzle(dataset.puzzles, gameSeed);

    if (!selected) {
      console.error('No puzzle selected');
      setIsLoaded(true);
      return;
    }

    // Convert puzzle data to game format
    const solution = flatToGrid(selected.solution);
    const puzzle = solution.map(row => row.map(() => 0)); // Start with empty grid

    const puzzleGameData = {
      id: selected.id,
      solution,
      sums: selected.sums,
      colorPattern: selected.color_pattern,
      colors: selected.colors,
      colorSums: selected.color_sums,
    };

    setPuzzleData(puzzleGameData);
    setGrid(puzzle.map(row => [...row]));
    setSelectedCell(null);
    resetGameState();
    setErrors(new Set());
    setSumStatus([false, false, false, false]);
    setColorSumStatus([false, false, false]);
    setSeed(gameSeed);
    setIsLoaded(true);

    // Save state
    setSavedState({
      date: today,
      puzzleId: selected.id,
      puzzleData: puzzleGameData,
      grid: puzzle,
      gameState: 'playing',
      sumStatus: [false, false, false, false],
      colorSumStatus: [false, false, false],
      seed: gameSeed,
    });
  }, [setSavedState]);

  useEffect(() => {
    initGame();
  }, [initGame]);

  useEffect(() => {
    if (!puzzleData || !isLoaded) return;

    const newErrors = showErrors ? checkValidity(grid, puzzleData.solution) : new Set();
    setErrors(newErrors);

    const newSumStatus = checkSums(grid, puzzleData.sums);
    setSumStatus(newSumStatus);

    const newColorSumStatus = checkColorSums(
      grid,
      puzzleData.colorPattern,
      puzzleData.colors,
      puzzleData.colorSums
    );
    setColorSumStatus(newColorSumStatus);

    // Check if solved
    // Don't check for win if game is not in playing state
    if (!isPlaying) return;

    let allFilled = true;
    let allCorrect = true;

    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        if (grid[r][c] === 0) allFilled = false;
        if (grid[r][c] !== puzzleData.solution[r][c]) allCorrect = false;
      }
    }

    if (allFilled && allCorrect && checkWin(true)) {
      setSavedState({
        date: getTodayDateString(),
        puzzleId: puzzleData.id,
        puzzleData,
        grid,
        gameState: 'won',
        sumStatus: newSumStatus,
        colorSumStatus: newColorSumStatus,
        seed,
      });
    } else {
      // Save current state
      setSavedState({
        date: getTodayDateString(),
        puzzleId: puzzleData.id,
        puzzleData,
        grid,
        gameState: 'playing',
        sumStatus: newSumStatus,
        colorSumStatus: newColorSumStatus,
        seed,
      });
    }
  }, [grid, puzzleData, showErrors, isLoaded, seed]);

  const handleCellClick = (r, c) => {
    if (!isPlaying || !puzzleData) return;

    setSelectedCell({ r, c });
  };

  const handleNumberInput = (num) => {
    if (!selectedCell || !isPlaying) return;

    const { r, c } = selectedCell;

    setGrid(prev => {
      const newGrid = prev.map(row => [...row]);
      newGrid[r][c] = num;
      return newGrid;
    });
  };

  const handleClear = () => {
    if (!selectedCell || !isPlaying) return;

    const { r, c } = selectedCell;

    setGrid(prev => {
      const newGrid = prev.map(row => [...row]);
      newGrid[r][c] = 0;
      return newGrid;
    });
  };

  // Keyboard handling
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!selectedCell || !isPlaying) return;

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
    const emptyGrid = puzzleData.solution.map(row => row.map(() => 0));
    setGrid(emptyGrid);
    setSelectedCell(null);
    resetGameState();
  };

  const handleGiveUp = () => {
    if (!puzzleData || !isPlaying) return;
    setGrid(puzzleData.solution.map(row => [...row]));
    giveUp();
  };

  // Get which numbers are still available
  const getAvailableNumbers = () => {
    const used = new Set(grid.flat().filter(n => n !== 0));
    return [1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => !used.has(n));
  };

  if (!isLoaded || !puzzleData) return null;

  const available = getAvailableNumbers();

  return (
    <div className={styles.container}>
      <GameHeader
        title="Suko"
        instructions="Fill the 3×3 grid with numbers 1-9 (each used once). The circles show the sum of their four surrounding cells. Additionally, colored cells must sum to their target values (green, orange, yellow)."
      />
      {seed !== null && <SeedDisplay seed={seed} />}

      <div className={styles.gameArea}>
        <div className={styles.puzzleContainer}>
          <div className={styles.grid}>
            {grid.map((row, r) =>
              row.map((cell, c) => {
                const position = r * 3 + c;
                const cellColor = getCellColor(position, puzzleData.colorPattern, puzzleData.colors);
                const isSelected = selectedCell?.r === r && selectedCell?.c === c;
                const hasError = errors.has(`${r},${c}`);

                return (
                  <button
                    key={`${r}-${c}`}
                    className={`
                      ${styles.cell}
                      ${styles[cellColor]}
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

        {/* Color sum indicators */}
        <div className={styles.colorSums}>
          <div className={`${styles.colorSum} ${colorSumStatus[0] ? styles.correct : ''}`}>
            <span className={styles.colorLabel}>Green:</span>
            <span className={styles.colorValue}>{puzzleData.colorSums.green}</span>
          </div>
          <div className={`${styles.colorSum} ${colorSumStatus[1] ? styles.correct : ''}`}>
            <span className={styles.colorLabel}>Orange:</span>
            <span className={styles.colorValue}>{puzzleData.colorSums.orange}</span>
          </div>
          <div className={`${styles.colorSum} ${colorSumStatus[2] ? styles.correct : ''}`}>
            <span className={styles.colorLabel}>Yellow:</span>
            <span className={styles.colorValue}>{puzzleData.colorSums.yellow}</span>
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
          <GameResult
            state="won"
            title="Perfect!"
            message="All sums are correct!"
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
            disabled={!isPlaying}
          />
          <button className={styles.newGameBtn} onClick={() => initGame(true)}>
            New Puzzle
          </button>
        </div>
      </div>
    </div>
  );
}
