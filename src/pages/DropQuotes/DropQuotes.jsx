import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import GameHeader from '../../components/GameHeader';
import GiveUpButton from '../../components/GiveUpButton';
import GameResult from '../../components/GameResult';
import { useGameState } from '../../hooks/useGameState';
import { useGameStats } from '../../hooks/useGameStats';
import styles from './DropQuotes.module.css';

const QUOTES = [
  { quote: "BE THE CHANGE YOU WISH TO SEE", author: "Gandhi" },
  { quote: "JUST DO IT", author: "Nike" },
  { quote: "TO BE OR NOT TO BE", author: "Shakespeare" },
  { quote: "I THINK THEREFORE I AM", author: "Descartes" },
  { quote: "STAY HUNGRY STAY FOOLISH", author: "Steve Jobs" },
  { quote: "THE ONLY THING WE HAVE TO FEAR IS FEAR ITSELF", author: "FDR" },
  { quote: "LIFE IS WHAT HAPPENS WHEN YOU ARE MAKING OTHER PLANS", author: "Lennon" },
  { quote: "IN THE END WE ONLY REGRET THE CHANCES WE DID NOT TAKE", author: "Unknown" },
];

function generatePuzzle() {
  const { quote, author } = QUOTES[Math.floor(Math.random() * QUOTES.length)];

  // Calculate grid dimensions
  const words = quote.split(' ');
  let maxWidth = 0;
  let totalChars = 0;
  for (const word of words) {
    totalChars += word.length;
    maxWidth = Math.max(maxWidth, word.length);
  }

  // Create a row layout
  const width = Math.max(maxWidth, Math.min(12, Math.ceil(Math.sqrt(totalChars * 2))));

  // Build the solution grid (row by row)
  const rows = [];
  let currentRow = [];

  for (let i = 0; i < words.length; i++) {
    const word = words[i];

    // Check if word fits in current row
    if (currentRow.length + (currentRow.length > 0 ? 1 : 0) + word.length <= width) {
      if (currentRow.length > 0) currentRow.push(' ');
      for (const char of word) currentRow.push(char);
    } else {
      // Pad current row and start new one
      while (currentRow.length < width) currentRow.push(' ');
      rows.push(currentRow);
      currentRow = [];
      for (const char of word) currentRow.push(char);
    }
  }

  // Pad and add final row
  while (currentRow.length < width) currentRow.push(' ');
  rows.push(currentRow);

  const height = rows.length;

  // Create solution grid
  const solution = rows;

  // Create columns of letters (letters that drop down)
  const columns = [];
  for (let c = 0; c < width; c++) {
    const col = [];
    for (let r = 0; r < height; r++) {
      if (solution[r][c] !== ' ') {
        col.push(solution[r][c]);
      }
    }
    // Shuffle the column
    for (let i = col.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [col[i], col[j]] = [col[j], col[i]];
    }
    columns.push(col);
  }

  return { solution, columns, width, height, author, quote };
}

// Export helpers for testing
export { QUOTES, generatePuzzle };

export default function DropQuotes() {
  const { t } = useTranslation();
  const [puzzleData, setPuzzleData] = useState(null);
  const [grid, setGrid] = useState([]);
  const [selectedCell, setSelectedCell] = useState(null);
  const [usedFromColumns, setUsedFromColumns] = useState([]);
  const { gameState, checkWin, giveUp, reset: resetGameState, isPlaying } = useGameState();

  const initGame = useCallback(() => {
    const data = generatePuzzle();
    setPuzzleData(data);
    setGrid(Array(data.height).fill(null).map(() => Array(data.width).fill('')));
    setUsedFromColumns(Array(data.width).fill(null).map(() => []));
    setSelectedCell(null);
    resetGameState();
  }, [resetGameState]);

  useEffect(() => {
    initGame();
  }, [initGame]);

  useEffect(() => {
    if (!puzzleData || !isPlaying) return;

    // Check if solved - all non-space cells must be correctly filled
    let solved = true;
    let hasAnyFilled = false;

    for (let r = 0; r < puzzleData.height; r++) {
      for (let c = 0; c < puzzleData.width; c++) {
        if (puzzleData.solution[r][c] !== ' ') {
          if (grid[r][c] === '') {
            // Non-space cell is empty, not solved yet
            solved = false;
          } else if (grid[r][c] !== puzzleData.solution[r][c]) {
            // Non-space cell has wrong letter
            solved = false;
          } else {
            hasAnyFilled = true;
          }
        }
      }
    }

    // Only trigger win if solved AND at least one cell was filled (prevent empty grid win)
    if (solved && hasAnyFilled) {
      checkWin(true);
    }
  }, [grid, puzzleData, isPlaying, checkWin]);

  const handleCellClick = (r, c) => {
    if (!isPlaying) return;
    if (puzzleData.solution[r][c] === ' ') return; // Can't place in spaces
    setSelectedCell({ row: r, col: c });
  };

  const handleColumnLetterClick = (colIndex, letterIndex) => {
    if (!selectedCell || !isPlaying) return;
    if (selectedCell.col !== colIndex) return; // Can only use letters from same column

    const letter = puzzleData.columns[colIndex][letterIndex];
    if (usedFromColumns[colIndex].includes(letterIndex)) return; // Already used

    const { row, col } = selectedCell;

    // If cell already has a letter, return it to the column
    if (grid[row][col]) {
      // Find which letter index it was and unmark it
      const oldLetter = grid[row][col];
      const idx = puzzleData.columns[col].findIndex((l, i) =>
        l === oldLetter && usedFromColumns[col].includes(i)
      );
      if (idx !== -1) {
        setUsedFromColumns(prev => {
          const newUsed = prev.map(arr => [...arr]);
          newUsed[col] = newUsed[col].filter(i => i !== idx);
          return newUsed;
        });
      }
    }

    // Place the new letter
    setGrid(prev => {
      const newGrid = prev.map(row => [...row]);
      newGrid[row][col] = letter;
      return newGrid;
    });

    setUsedFromColumns(prev => {
      const newUsed = prev.map(arr => [...arr]);
      newUsed[colIndex] = [...newUsed[colIndex], letterIndex];
      return newUsed;
    });
  };

  const handleClear = () => {
    if (!selectedCell || !isPlaying) return;
    const { row, col } = selectedCell;

    if (grid[row][col]) {
      const oldLetter = grid[row][col];
      const idx = puzzleData.columns[col].findIndex((l, i) =>
        l === oldLetter && usedFromColumns[col].includes(i)
      );
      if (idx !== -1) {
        setUsedFromColumns(prev => {
          const newUsed = prev.map(arr => [...arr]);
          newUsed[col] = newUsed[col].filter(i => i !== idx);
          return newUsed;
        });
      }

      setGrid(prev => {
        const newGrid = prev.map(row => [...row]);
        newGrid[row][col] = '';
        return newGrid;
      });
    }
  };

  const handleReset = () => {
    setGrid(Array(puzzleData.height).fill(null).map(() => Array(puzzleData.width).fill('')));
    setUsedFromColumns(Array(puzzleData.width).fill(null).map(() => []));
    setSelectedCell(null);
    resetGameState();
  };

  const handleGiveUp = () => {
    if (!puzzleData || !isPlaying) return;
    setGrid(puzzleData.solution.map(row => [...row]));
    giveUp();
  };

  if (!puzzleData) return null;

  return (
    <div className={styles.container}>
      <GameHeader
        title="Drop Quotes"
        instructions="Letters drop down from each column to form a quote. Click a cell, then click a letter from that column to place it. Each letter can only be used once."
      />

      <div className={styles.gameArea}>
        {/* Columns of available letters */}
        <div className={styles.letterColumns} style={{ gridTemplateColumns: `repeat(${puzzleData.width}, 1fr)` }}>
          {puzzleData.columns.map((col, colIndex) => (
            <div key={colIndex} className={styles.column}>
              {col.map((letter, letterIndex) => {
                const isUsed = usedFromColumns[colIndex].includes(letterIndex);
                const isSelectable = selectedCell?.col === colIndex && !isUsed;

                return (
                  <button
                    key={letterIndex}
                    className={`
                      ${styles.columnLetter}
                      ${isUsed ? styles.used : ''}
                      ${isSelectable ? styles.selectable : ''}
                    `}
                    onClick={() => handleColumnLetterClick(colIndex, letterIndex)}
                    disabled={isUsed || selectedCell?.col !== colIndex}
                  >
                    {letter}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* Quote grid */}
        <div className={styles.grid} style={{ gridTemplateColumns: `repeat(${puzzleData.width}, 1fr)` }}>
          {Array(puzzleData.height).fill(null).map((_, r) =>
            Array(puzzleData.width).fill(null).map((_, c) => {
              const isSpace = puzzleData.solution[r][c] === ' ';
              const isSelected = selectedCell?.row === r && selectedCell?.col === c;
              const value = grid[r][c];

              return (
                <div
                  key={`${r}-${c}`}
                  className={`
                    ${styles.cell}
                    ${isSpace ? styles.space : ''}
                    ${isSelected ? styles.selected : ''}
                    ${value ? styles.filled : ''}
                  `}
                  onClick={() => handleCellClick(r, c)}
                >
                  {value}
                </div>
              );
            })
          )}
        </div>

        {gameState === 'won' && (
          <GameResult
            state="won"
            title="Quote Revealed!"
            message={`"${puzzleData.quote}" — ${puzzleData.author}`}
          />
        )}
        {gameState === 'gaveUp' && (
          <GameResult
            state="gaveup"
            title="Solution Revealed"
            message="Here's the quote."
          />
        )}

        <div className={styles.buttons}>
          <button className={styles.clearBtn} onClick={handleClear}>
            Clear Cell
          </button>
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
      </div>
    </div>
  );
}
