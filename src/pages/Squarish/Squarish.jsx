import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { createSeededRandom, getTodayDateString, stringToSeed, getCommonWordsByLength } from '../../data/wordUtils';
import GameHeader from '../../components/GameHeader';
import SeedDisplay from '../../components/SeedDisplay';
import SizeSelector from '../../components/SizeSelector';
import StatsPanel from '../../components/StatsPanel';
import GiveUpButton from '../../components/GiveUpButton';
import GameResult from '../../components/GameResult';
import { useGameState } from '../../hooks/useGameState';
import styles from './Squarish.module.css';

const CONFIGS = {
  5: { gridSize: 5, maxSwaps: 15, wordCount: 6 },
  7: { gridSize: 7, maxSwaps: 25, wordCount: 8 },
};

// Generate a waffle puzzle for given size
function generateWaffle(seed, size) {
  const random = createSeededRandom(seed);
  // Use common words for recognizable puzzles
  const words = getCommonWordsByLength(size);

  // Shuffle words
  for (let i = words.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [words[i], words[j]] = [words[j], words[i]];
  }

  const numWords = size === 5 ? 3 : 4; // 3 horizontal + 3 vertical for 5x5, 4+4 for 7x7
  let attempts = 0;
  const maxAttempts = size === 5 ? 1000 : 2000;

  while (attempts < maxAttempts) {
    attempts++;

    // Pick horizontal words
    const horizontals = [];
    for (let i = 0; i < numWords; i++) {
      horizontals.push(words[Math.floor(random() * words.length)]);
    }

    // Find vertical words that match intersections
    const verticals = [];
    let valid = true;

    for (let col = 0; col < numWords && valid; col++) {
      const colIndex = col * 2; // Columns at 0, 2, 4 (or 0, 2, 4, 6)
      const needed = horizontals.map(h => h[colIndex]);
      const vertical = words.find(w =>
        needed.every((letter, idx) => w[idx * 2] === letter)
      );
      if (vertical) {
        verticals.push(vertical);
      } else {
        valid = false;
      }
    }

    if (valid && verticals.length === numWords) {
      // Build the solution grid
      const solution = [];
      for (let r = 0; r < size; r++) {
        const row = [];
        for (let c = 0; c < size; c++) {
          if (r % 2 === 0) {
            // Horizontal word row
            row.push(horizontals[r / 2][c]);
          } else if (c % 2 === 0) {
            // Vertical word letter (odd row, even column)
            row.push(verticals[c / 2][r]);
          } else {
            // Gap
            row.push('');
          }
        }
        solution.push(row);
      }

      // Create scrambled version
      const letters = [];
      for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
          if (solution[r][c]) {
            letters.push({ letter: solution[r][c], row: r, col: c });
          }
        }
      }

      // Shuffle non-intersection letters
      const nonIntersection = letters.filter(l =>
        !(l.row % 2 === 0 && l.col % 2 === 0)
      );

      for (let i = nonIntersection.length - 1; i > 0; i--) {
        const j = Math.floor(random() * (i + 1));
        const tempLetter = nonIntersection[i].letter;
        nonIntersection[i].letter = nonIntersection[j].letter;
        nonIntersection[j].letter = tempLetter;
      }

      // Build scrambled grid
      const scrambled = solution.map(row => [...row]);
      for (const item of nonIntersection) {
        scrambled[item.row][item.col] = item.letter;
      }

      // Validate letter multisets match (sanity check)
      const getLetters = (grid) => {
        const letters = [];
        for (let r = 0; r < size; r++) {
          for (let c = 0; c < size; c++) {
            if (grid[r][c]) letters.push(grid[r][c]);
          }
        }
        return letters.sort().join('');
      };

      if (getLetters(scrambled) !== getLetters(solution)) {
        // Multiset mismatch - skip this attempt (shouldn't happen but safety check)
        continue;
      }

      const wordObj = {};
      horizontals.forEach((w, i) => wordObj[`h${i + 1}`] = w);
      verticals.forEach((w, i) => wordObj[`v${i + 1}`] = w);

      return { solution, scrambled, words: wordObj, size };
    }
  }

  // If we get here, generation failed - this shouldn't happen with enough attempts
  // Return null and let the component handle it
  return null;
}

function checkCorrectness(grid, solution, size) {
  const correct = [];
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (grid[r][c] === solution[r][c]) {
        correct.push(`${r},${c}`);
      }
    }
  }
  return new Set(correct);
}

function isSolved(grid, solution, size) {
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (grid[r][c] !== solution[r][c]) return false;
    }
  }
  return true;
}

// Export helpers for testing
export {
  CONFIGS,
  generateWaffle,
  checkCorrectness,
  isSolved,
};

export default function Squarish() {
  const { t } = useTranslation();
  const [size, setSize] = useState(5);
  const [puzzle, setPuzzle] = useState(null);
  const [grid, setGrid] = useState([]);
  const [selectedCell, setSelectedCell] = useState(null);
  const [swapsLeft, setSwapsLeft] = useState(CONFIGS[5].maxSwaps);
  const [correctCells, setCorrectCells] = useState(new Set());
  const { gameState, checkWin, giveUp, lose, reset: resetGameState, isPlaying } = useGameState();
  const [seed, setSeed] = useState(null);

  const initGame = useCallback((gameSize, customSeed = null) => {
    const config = CONFIGS[gameSize];
    const today = getTodayDateString();

    // Try multiple seeds if generation fails
    let newPuzzle = null;
    let gameSeed = null;
    if (customSeed !== null) {
      gameSeed = typeof customSeed === 'string'
        ? (isNaN(parseInt(customSeed, 10)) ? stringToSeed(customSeed) : parseInt(customSeed, 10))
        : customSeed;
      newPuzzle = generateWaffle(gameSeed, gameSize);
    } else {
      for (let attempt = 0; attempt < 10 && !newPuzzle; attempt++) {
        gameSeed = stringToSeed(`squarish${gameSize}-${today}-${attempt}`);
        newPuzzle = generateWaffle(gameSeed, gameSize);
      }
    }

    if (!newPuzzle) {
      console.error('Failed to generate Waffle puzzle');
      return;
    }

    setSeed(gameSeed);
    setPuzzle(newPuzzle);
    setGrid(newPuzzle.scrambled.map(row => [...row]));
    setSelectedCell(null);
    setSwapsLeft(config.maxSwaps);
    setCorrectCells(checkCorrectness(newPuzzle.scrambled, newPuzzle.solution, gameSize));
    resetGameState();
  }, [resetGameState]);

  useEffect(() => {
    initGame(size);
  }, [size, initGame]);

  useEffect(() => {
    if (puzzle && isPlaying) {
      checkWin(isSolved(grid, puzzle.solution, puzzle.size));
    }
  }, [grid, puzzle, isPlaying, checkWin]);

  const handleSizeChange = (newSize) => {
    setSize(newSize);
  };

  const handleGiveUp = () => {
    if (!puzzle || !isPlaying) return;
    setGrid(puzzle.solution.map(row => [...row]));
    giveUp();
  };

  const handleCellClick = (row, col) => {
    if (!isPlaying) return;
    if (!grid[row][col]) return;
    if (correctCells.has(`${row},${col}`)) return;

    if (selectedCell === null) {
      setSelectedCell({ row, col });
    } else if (selectedCell.row === row && selectedCell.col === col) {
      setSelectedCell(null);
    } else {
      if (correctCells.has(`${selectedCell.row},${selectedCell.col}`)) {
        setSelectedCell({ row, col });
        return;
      }

      const newGrid = grid.map(r => [...r]);
      const temp = newGrid[row][col];
      newGrid[row][col] = newGrid[selectedCell.row][selectedCell.col];
      newGrid[selectedCell.row][selectedCell.col] = temp;

      setGrid(newGrid);
      setSwapsLeft(prev => prev - 1);
      setCorrectCells(checkCorrectness(newGrid, puzzle.solution, puzzle.size));
      setSelectedCell(null);

      if (swapsLeft - 1 <= 0 && !isSolved(newGrid, puzzle.solution, puzzle.size)) {
        lose();
      }
    }
  };

  const getCellStatus = (row, col) => {
    if (!grid[row][col]) return 'empty';
    if (correctCells.has(`${row},${col}`)) return 'correct';

    const letter = grid[row][col];
    const solutionLetter = puzzle?.solution[row][col];

    if (letter === solutionLetter) return 'correct';

    // Only check row/col if they form actual words (even rows/cols)
    const isWordRow = row % 2 === 0;
    const isWordCol = col % 2 === 0;

    // Check if letter is present in row (accounting for already-correct letters)
    let isInRow = false;
    if (isWordRow) {
      const solutionRow = puzzle?.solution[row] || [];
      const gridRow = grid[row] || [];
      // Count how many of this letter are in the solution row
      const solutionCount = solutionRow.filter(l => l === letter).length;
      // Count how many are already correctly placed in the grid row
      const correctCount = solutionRow.filter((l, c) => l === letter && gridRow[c] === letter).length;
      // There's an unmatched instance if solution has more than are correctly placed
      isInRow = solutionCount > correctCount;
    }

    // Check if letter is present in column (accounting for already-correct letters)
    let isInCol = false;
    if (isWordCol) {
      const solutionCol = puzzle?.solution.map(r => r[col]) || [];
      const gridCol = grid.map(r => r[col]) || [];
      const solutionCount = solutionCol.filter(l => l === letter).length;
      const correctCount = solutionCol.filter((l, r) => l === letter && gridCol[r] === letter).length;
      isInCol = solutionCount > correctCount;
    }

    if (isInRow || isInCol) return 'present';
    return 'absent';
  };

  const config = CONFIGS[size];
  const warningThreshold = size === 5 ? 3 : 5;

  if (!puzzle) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>{t('common.loadingPuzzle')}</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <GameHeader
        title="Squar-ish"
        instructions={`Swap letters to form ${config.wordCount} valid words. Green = correct, yellow = wrong spot.`}
      />

      <SizeSelector
        sizes={[5, 7]}
        currentSize={size}
        onSizeChange={handleSizeChange}
      />

      {seed !== null && (
        <SeedDisplay
          seed={seed}
          variant="compact"
          showNewButton={false}
          showShare={false}
          onSeedChange={(newSeed) => {
            // Convert string seeds to numbers if needed
            const seedNum = typeof newSeed === 'string'
              ? (isNaN(parseInt(newSeed, 10)) ? stringToSeed(newSeed) : parseInt(newSeed, 10))
              : newSeed;
            initGame(size, seedNum);
          }}
        />
      )}

      <div className={styles.gameArea}>
        <StatsPanel
          stats={[
            { label: 'Swaps Left', value: swapsLeft, highlight: swapsLeft <= warningThreshold }
          ]}
          layout="row"
        />

        <div className={`${styles.board} ${size === 7 ? styles.board7 : ''}`}>
          {grid.map((row, rowIndex) =>
            row.map((letter, colIndex) => {
              const status = getCellStatus(rowIndex, colIndex);
              const isSelected = selectedCell?.row === rowIndex && selectedCell?.col === colIndex;

              return (
                <div
                  key={`${rowIndex}-${colIndex}`}
                  className={`${styles.cell}
                    ${styles[status]}
                    ${isSelected ? styles.selected : ''}
                    ${!letter ? styles.empty : ''}
                    ${size === 7 ? styles.cell7 : ''}
                  `}
                  onClick={() => handleCellClick(rowIndex, colIndex)}
                >
                  {letter}
                </div>
              );
            })
          )}
        </div>

        {gameState === 'won' && (
          <GameResult
            state="won"
            title={t('gameStatus.solved')}
            message={t('gameMessages.withSwapsRemaining', { count: swapsLeft })}
            actions={[{ label: t('common.newPuzzle'), onClick: () => initGame(size), primary: true }]}
          />
        )}

        {gameState === 'lost' && (
          <GameResult
            state="lost"
            title={t('gameStatus.outOfSwaps')}
            message={`${t('gameMessages.theWordsWere')}: ${Object.values(puzzle.words).join(', ')}`}
            actions={[{ label: t('common.newPuzzle'), onClick: () => initGame(size), primary: true }]}
          />
        )}

        {gameState === 'gaveUp' && (
          <GameResult
            state="gaveup"
            title={t('gameResult.solutionRevealed')}
            actions={[{ label: t('common.newPuzzle'), onClick: () => initGame(size), primary: true }]}
          />
        )}

        {gameState === 'playing' && (
          <div className={styles.buttons}>
            <GiveUpButton
              onGiveUp={handleGiveUp}
              disabled={!isPlaying}
            />
            <button className={styles.newGameBtn} onClick={() => initGame(size)}>
              New Puzzle
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
