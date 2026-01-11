import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { isValidWord, createSeededRandom, getTodayDateString, stringToSeed, getWordsByLength } from '../../data/wordUtils';
import styles from './WordSearch.module.css';

const GRID_SIZE = 12;
const WORD_COUNT = 8;
const DIRECTIONS = [
  [0, 1],   // right
  [1, 0],   // down
  [1, 1],   // diagonal down-right
  [-1, 1],  // diagonal up-right
  [0, -1],  // left
  [-1, 0],  // up
  [-1, -1], // diagonal up-left
  [1, -1],  // diagonal down-left
];

function generatePuzzle(seed) {
  const random = createSeededRandom(seed);

  // Get words of varying lengths
  const allWords = [];
  for (let len = 4; len <= 8; len++) {
    const wordsOfLen = getWordsByLength(len);
    allWords.push(...wordsOfLen.slice(0, 500)); // Limit for performance
  }

  // Shuffle and pick words
  for (let i = allWords.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [allWords[i], allWords[j]] = [allWords[j], allWords[i]];
  }

  // Initialize grid
  const grid = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(''));
  const placedWords = [];
  const wordPositions = [];

  // Try to place words
  for (const word of allWords) {
    if (placedWords.length >= WORD_COUNT) break;
    if (word.length > GRID_SIZE) continue;

    // Try random positions and directions
    let placed = false;
    const shuffledDirs = [...DIRECTIONS].sort(() => random() - 0.5);

    for (let attempts = 0; attempts < 50 && !placed; attempts++) {
      const startRow = Math.floor(random() * GRID_SIZE);
      const startCol = Math.floor(random() * GRID_SIZE);

      for (const [dr, dc] of shuffledDirs) {
        const endRow = startRow + dr * (word.length - 1);
        const endCol = startCol + dc * (word.length - 1);

        // Check bounds
        if (endRow < 0 || endRow >= GRID_SIZE || endCol < 0 || endCol >= GRID_SIZE) {
          continue;
        }

        // Check if word fits
        let canPlace = true;
        for (let i = 0; i < word.length; i++) {
          const r = startRow + dr * i;
          const c = startCol + dc * i;
          const existing = grid[r][c];

          if (existing !== '' && existing !== word[i]) {
            canPlace = false;
            break;
          }
        }

        if (canPlace) {
          // Place the word
          const positions = [];
          for (let i = 0; i < word.length; i++) {
            const r = startRow + dr * i;
            const c = startCol + dc * i;
            grid[r][c] = word[i];
            positions.push([r, c]);
          }

          placedWords.push(word);
          wordPositions.push(positions);
          placed = true;
          break;
        }
      }
    }
  }

  // Fill empty cells with random letters
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (grid[r][c] === '') {
        grid[r][c] = letters[Math.floor(random() * letters.length)];
      }
    }
  }

  return { grid, words: placedWords, wordPositions };
}

export default function WordSearch() {
  const [puzzle, setPuzzle] = useState(null);
  const [foundWords, setFoundWords] = useState(new Set());
  const [selectedCells, setSelectedCells] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [highlightedCells, setHighlightedCells] = useState(new Set());
  const [gameState, setGameState] = useState('playing');

  const initGame = useCallback(() => {
    const today = getTodayDateString();
    const seed = stringToSeed(`wordsearch-${today}`);
    const newPuzzle = generatePuzzle(seed);

    setPuzzle(newPuzzle);
    setFoundWords(new Set());
    setSelectedCells([]);
    setHighlightedCells(new Set());
    setGameState('playing');
  }, []);

  useEffect(() => {
    initGame();
  }, [initGame]);

  useEffect(() => {
    if (puzzle && foundWords.size === puzzle.words.length) {
      setGameState('won');
    }
  }, [foundWords, puzzle]);

  const handleCellMouseDown = (row, col) => {
    if (gameState === 'won') return;
    setIsDragging(true);
    setSelectedCells([[row, col]]);
  };

  const handleCellMouseEnter = (row, col) => {
    if (!isDragging) return;

    const [startRow, startCol] = selectedCells[0];

    // Calculate direction
    const dr = Math.sign(row - startRow);
    const dc = Math.sign(col - startCol);

    // Only allow straight lines
    if (dr !== 0 && dc !== 0 && Math.abs(row - startRow) !== Math.abs(col - startCol)) {
      return;
    }

    // Build path
    const newPath = [[startRow, startCol]];
    let r = startRow, c = startCol;

    while (r !== row || c !== col) {
      r += dr;
      c += dc;
      if (r < 0 || r >= GRID_SIZE || c < 0 || c >= GRID_SIZE) break;
      newPath.push([r, c]);
    }

    setSelectedCells(newPath);
  };

  const handleMouseUp = () => {
    if (!isDragging) return;
    setIsDragging(false);

    // Get selected word
    const selectedWord = selectedCells.map(([r, c]) => puzzle.grid[r][c]).join('');
    const reversedWord = selectedWord.split('').reverse().join('');

    // Check if it matches any word
    if (puzzle.words.includes(selectedWord)) {
      setFoundWords(prev => new Set([...prev, selectedWord]));
      setHighlightedCells(prev => {
        const newSet = new Set(prev);
        selectedCells.forEach(([r, c]) => newSet.add(`${r},${c}`));
        return newSet;
      });
    } else if (puzzle.words.includes(reversedWord)) {
      setFoundWords(prev => new Set([...prev, reversedWord]));
      setHighlightedCells(prev => {
        const newSet = new Set(prev);
        selectedCells.forEach(([r, c]) => newSet.add(`${r},${c}`));
        return newSet;
      });
    }

    setSelectedCells([]);
  };

  const isSelected = (row, col) => {
    return selectedCells.some(([r, c]) => r === row && c === col);
  };

  const isHighlighted = (row, col) => {
    return highlightedCells.has(`${row},${col}`);
  };

  if (!puzzle) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading puzzle...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Link to="/" className={styles.backLink}>← Back to Games</Link>
        <h1 className={styles.title}>Word Search</h1>
        <p className={styles.instructions}>
          Find all {puzzle.words.length} hidden words! Drag to select.
        </p>
      </div>

      <div className={styles.gameArea}>
        <div className={styles.statsBar}>
          <div className={styles.stat}>
            <span className={styles.statLabel}>Found</span>
            <span className={styles.statValue}>{foundWords.size}/{puzzle.words.length}</span>
          </div>
        </div>

        <div
          className={styles.grid}
          onMouseLeave={() => {
            if (isDragging) {
              setIsDragging(false);
              setSelectedCells([]);
            }
          }}
          onMouseUp={handleMouseUp}
        >
          {puzzle.grid.map((row, rowIndex) =>
            row.map((letter, colIndex) => (
              <div
                key={`${rowIndex}-${colIndex}`}
                className={`${styles.cell}
                  ${isSelected(rowIndex, colIndex) ? styles.selected : ''}
                  ${isHighlighted(rowIndex, colIndex) ? styles.highlighted : ''}
                `}
                onMouseDown={() => handleCellMouseDown(rowIndex, colIndex)}
                onMouseEnter={() => handleCellMouseEnter(rowIndex, colIndex)}
              >
                {letter}
              </div>
            ))
          )}
        </div>

        <div className={styles.wordList}>
          <h3>Words to Find</h3>
          <div className={styles.words}>
            {puzzle.words.map(word => (
              <span
                key={word}
                className={`${styles.word} ${foundWords.has(word) ? styles.found : ''}`}
              >
                {word}
              </span>
            ))}
          </div>
        </div>

        {gameState === 'won' && (
          <div className={styles.winMessage}>
            🎉 You found all the words!
          </div>
        )}

        <button className={styles.newGameBtn} onClick={initGame}>
          New Puzzle
        </button>
      </div>
    </div>
  );
}
