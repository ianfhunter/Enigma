import { useState, useEffect, useCallback } from 'react';
import GameHeader from '../../components/GameHeader';
import SeedDisplay from '../../components/SeedDisplay';
import GameResult from '../../components/GameResult';
import { isValidWord, createSeededRandom, getTodayDateString, stringToSeed, getCommonWordsByLength } from '../../data/wordUtils';
import WordWithDefinition from '../../components/WordWithDefinition/WordWithDefinition';
import styles from './WordSearch.module.css';

// Parse seed from URL if present
function getSeedFromUrl() {
  if (typeof window === 'undefined') return null;
  const params = new URLSearchParams(window.location.search);
  const seedStr = params.get('seed');
  if (seedStr) {
    const parsed = parseInt(seedStr, 10);
    return isNaN(parsed) ? stringToSeed(seedStr) : parsed;
  }
  return null;
}

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

  // Get common words of varying lengths for recognizable puzzles
  const allWords = [];
  for (let len = 4; len <= 8; len++) {
    const wordsOfLen = getCommonWordsByLength(len);
    allWords.push(...wordsOfLen);
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

// Expose puzzle generation helpers for testing
export const WORD_SEARCH_GRID_SIZE = GRID_SIZE;
export const WORD_SEARCH_WORD_COUNT = WORD_COUNT;
export const WORD_SEARCH_DIRECTIONS = DIRECTIONS;
export { generatePuzzle };

export default function WordSearch() {
  const [puzzle, setPuzzle] = useState(null);
  const [seed, setSeed] = useState(null);
  const [foundWords, setFoundWords] = useState(new Set());
  const [selectedCells, setSelectedCells] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [highlightedCells, setHighlightedCells] = useState(new Set());
  const [gameState, setGameState] = useState('playing');
  const [puzzleIndex, setPuzzleIndex] = useState(0);

  const initGame = useCallback((customSeed = null) => {
    const today = getTodayDateString();
    const urlSeed = getSeedFromUrl();
    let gameSeed;

    if (customSeed !== null) {
      // Explicit seed provided (new game button)
      gameSeed = customSeed;
      setPuzzleIndex(prev => prev + 1);
    } else if (urlSeed !== null) {
      // Seed from URL
      gameSeed = urlSeed;
    } else {
      // Default daily seed
      gameSeed = stringToSeed(`wordsearch-${today}-${puzzleIndex}`);
    }

    const newPuzzleData = generatePuzzle(gameSeed);

    setSeed(gameSeed);
    setPuzzle(newPuzzleData);
    setFoundWords(new Set());
    setSelectedCells([]);
    setHighlightedCells(new Set());
    setGameState('playing');
  }, [puzzleIndex]);

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

  // Touch event handlers for mobile
  const handleTouchStart = (row, col, e) => {
    e.preventDefault();
    handleCellMouseDown(row, col);
  };

  const handleTouchMove = (e) => {
    if (!isDragging) return;
    e.preventDefault();

    const touch = e.touches[0];
    const element = document.elementFromPoint(touch.clientX, touch.clientY);
    if (element && element.dataset.row !== undefined) {
      const row = parseInt(element.dataset.row);
      const col = parseInt(element.dataset.col);
      handleCellMouseEnter(row, col);
    }
  };

  const handleTouchEnd = () => {
    handleMouseUp();
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
      <GameHeader
        title="Word Search"
        instructions={`Find all ${puzzle.words.length} hidden words! Drag to select.`}
      />

      {seed && (
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
            initGame(seedNum);
          }}
        />
      )}

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
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {puzzle.grid.map((row, rowIndex) =>
            row.map((letter, colIndex) => (
              <div
                key={`${rowIndex}-${colIndex}`}
                data-row={rowIndex}
                data-col={colIndex}
                className={`${styles.cell}
                  ${isSelected(rowIndex, colIndex) ? styles.selected : ''}
                  ${isHighlighted(rowIndex, colIndex) ? styles.highlighted : ''}
                `}
                onMouseDown={() => handleCellMouseDown(rowIndex, colIndex)}
                onMouseEnter={() => handleCellMouseEnter(rowIndex, colIndex)}
                onTouchStart={(e) => handleTouchStart(rowIndex, colIndex, e)}
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
              <WordWithDefinition
                key={word}
                word={word}
                className={`${styles.word} ${foundWords.has(word) ? styles.found : ''}`}
              />
            ))}
          </div>
        </div>

        <GameResult
          gameState={gameState}
          onNewGame={() => initGame(true)}
          winTitle="All Words Found!"
          winMessage="🎉 You found all the words!"
        />

        <button className={styles.newGameBtn} onClick={() => initGame(true)}>
          New Puzzle
        </button>
      </div>
    </div>
  );
}
