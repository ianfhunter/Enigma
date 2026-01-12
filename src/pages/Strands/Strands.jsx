import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { isValidWord, createSeededRandom, getTodayDateString, stringToSeed, seededShuffleArray } from '../../data/wordUtils';
import { wordCategories } from '@datasets/wordCategories';
import styles from './Strands.module.css';

const GRID_ROWS = 8;
const GRID_COLS = 6;

// Spangrams mapped to category keys for thematic consistency
const CATEGORY_SPANGRAMS = {
  fruits: "ORCHARD",
  vegetables: "GARDENER",
  desserts: "PASTRIES",
  drinks: "BEVERAGE",
  herbs: "SEASONAL",
  pasta: "ITALIAN",
  cheese: "CHEESERY",
  mammals: "WILDLIFE",
  birds: "FEATHERS",
  fish: "AQUARIUM",
  insects: "CREEPERS",
  reptiles: "SCALIEST",
  dinosaurs: "JURASSIC",
  flowers: "BOUQUETS",
  trees: "WOODLAND",
  weather: "FORECAST",
  gemstones: "TREASURE",
  metals: "MINERALS",
  planets: "SOLARSYS",
  space: "ASTRONAUT",
  elements: "PERIODIC",
  instruments: "SYMPHONY",
  genres: "PLAYLIST",
  sports: "ATHLETIC",
  olympicEvents: "OLYMPICS",
  colors: "SPECTRUM",
  artTerms: "ARTISTIC",
  dances: "BALLROOM",
  furniture: "INTERIOR",
  kitchenItems: "COOKWARE",
  clothing: "WARDROBE",
  tools: "HARDWARE",
  vehicles: "TRANSPORT",
  carBrands: "MOTORCAR",
  countries: "PASSPORT",
  capitals: "CITYLIFE",
  usStates: "AMERICAN",
  landforms: "GEOGRAPHY",
  professions: "CAREERS",
  greekGods: "OLYMPIAN",
  mythology: "FOLKLORE",
  emotions: "FEELINGS",
  bodyParts: "ANATOMIC",
  boardGames: "GAMEPLAY",
  cardGames: "DECKPLAY",
  movieGenres: "FILMSHOW",
  technology: "DIGITALS",
  months: "CALENDAR",
  weekdays: "WEEKLONG",
  seasons: "SEASONAL",
  holidays: "FESTIVES",
};

// Generate a grid with words placed (simplified placement algorithm)
function generatePuzzleGrid(puzzle, random) {
  const grid = Array(GRID_ROWS).fill(null).map(() => Array(GRID_COLS).fill(''));
  const wordPositions = {};

  // Place spangram across the top row(s)
  const spangram = puzzle.spangram;
  const spangramPositions = [];
  let col = 0;
  let row = 0;

  for (let i = 0; i < spangram.length; i++) {
    if (col >= GRID_COLS) {
      col = 0;
      row++;
    }
    grid[row][col] = spangram[i];
    spangramPositions.push([row, col]);
    col++;
  }
  wordPositions[spangram] = spangramPositions;

  // Place theme words in remaining rows
  let currentRow = Math.ceil(spangram.length / GRID_COLS);

  for (const word of puzzle.themeWords) {
    const positions = [];
    col = 0;

    // Try to fit word in current row
    if (col + word.length <= GRID_COLS && currentRow < GRID_ROWS) {
      for (let i = 0; i < word.length; i++) {
        grid[currentRow][col] = word[i];
        positions.push([currentRow, col]);
        col++;
      }
      wordPositions[word] = positions;

      // Move to next row if current row is full
      if (col >= GRID_COLS - 1) {
        currentRow++;
        col = 0;
      }
    } else {
      currentRow++;
      col = 0;
      if (currentRow < GRID_ROWS) {
        for (let i = 0; i < word.length && col < GRID_COLS; i++) {
          grid[currentRow][col] = word[i];
          positions.push([currentRow, col]);
          col++;
        }
        wordPositions[word] = positions;
      }
    }

    // Advance row for variety
    if (random() > 0.5 && currentRow < GRID_ROWS - 1) {
      currentRow++;
    }
  }

  // Fill empty cells with random letters
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  for (let r = 0; r < GRID_ROWS; r++) {
    for (let c = 0; c < GRID_COLS; c++) {
      if (grid[r][c] === '') {
        grid[r][c] = letters[Math.floor(random() * letters.length)];
      }
    }
  }

  return { grid, wordPositions };
}

// Generate a puzzle from word categories
function generatePuzzleFromCategories(seed) {
  const random = createSeededRandom(seed);

  // Get category keys that have spangrams defined and shuffle
  const categoryKeys = Object.keys(wordCategories).filter(key => CATEGORY_SPANGRAMS[key]);
  const shuffledKeys = seededShuffleArray(categoryKeys, random);

  // Pick a category
  const categoryKey = shuffledKeys[0];
  const category = wordCategories[categoryKey];

  // Get words that fit well (3-7 letters)
  const suitableWords = category.words.filter(w => w.length >= 3 && w.length <= 7);
  const shuffledWords = seededShuffleArray(suitableWords, random);

  // Pick 5 theme words
  const themeWords = shuffledWords.slice(0, 5);

  // Get the spangram for this category
  const spangram = CATEGORY_SPANGRAMS[categoryKey];

  return {
    theme: category.name,
    hint: `Find the ${category.name.toLowerCase()}`,
    spangram: spangram,
    themeWords: themeWords,
  };
}

// Check if two cells are adjacent (including diagonals)
function areAdjacent(cell1, cell2) {
  const rowDiff = Math.abs(cell1[0] - cell2[0]);
  const colDiff = Math.abs(cell1[1] - cell2[1]);
  return rowDiff <= 1 && colDiff <= 1 && !(rowDiff === 0 && colDiff === 0);
}

// Get puzzle for a specific date
function getPuzzleForDate(dateStr) {
  const seed = stringToSeed(`strands-${dateStr}`);
  const random = createSeededRandom(seed);

  // Always generate puzzle from categories
  const basePuzzle = generatePuzzleFromCategories(seed);

  // Generate the grid
  const { grid, wordPositions } = generatePuzzleGrid(basePuzzle, random);

  return {
    ...basePuzzle,
    grid,
    wordPositions
  };
}

export default function Strands() {
  const [puzzle, setPuzzle] = useState(null);
  const [selectedCells, setSelectedCells] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [foundWords, setFoundWords] = useState(new Set());
  const [foundSpangram, setFoundSpangram] = useState(false);
  const [hintCount, setHintCount] = useState(0);
  const [nonThemeWordCount, setNonThemeWordCount] = useState(0);
  const [revealedCells, setRevealedCells] = useState(new Set());
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [gameWon, setGameWon] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const gridRef = useRef(null);

  const initGame = useCallback(() => {
    const today = getTodayDateString();
    const newPuzzle = getPuzzleForDate(today);
    setPuzzle(newPuzzle);
    setSelectedCells([]);
    setFoundWords(new Set());
    setFoundSpangram(false);
    setHintCount(0);
    setNonThemeWordCount(0);
    setRevealedCells(new Set());
    setMessage('');
    setMessageType('');
    setGameWon(false);
    setShowHint(false);
  }, []);

  useEffect(() => {
    initGame();
  }, [initGame]);

  // Check for win condition
  useEffect(() => {
    if (puzzle && foundSpangram && foundWords.size === puzzle.themeWords.length) {
      setGameWon(true);
      setMessage('Congratulations! You found all the words!');
      setMessageType('win');
    }
  }, [foundWords, foundSpangram, puzzle]);

  const showTemporaryMessage = (msg, type, duration = 2000) => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => {
      setMessage('');
      setMessageType('');
    }, duration);
  };

  const getCellFromEvent = (e) => {
    if (!gridRef.current) return null;

    const touch = e.touches ? e.touches[0] : e;
    const rect = gridRef.current.getBoundingClientRect();
    const cellWidth = rect.width / GRID_COLS;
    const cellHeight = rect.height / GRID_ROWS;

    const col = Math.floor((touch.clientX - rect.left) / cellWidth);
    const row = Math.floor((touch.clientY - rect.top) / cellHeight);

    if (row >= 0 && row < GRID_ROWS && col >= 0 && col < GRID_COLS) {
      return [row, col];
    }
    return null;
  };

  const handleStart = (row, col) => {
    if (gameWon) return;
    setIsDragging(true);
    setSelectedCells([[row, col]]);
  };

  const handleMove = (row, col) => {
    if (!isDragging || gameWon) return;

    const lastCell = selectedCells[selectedCells.length - 1];
    if (!lastCell) return;

    // Check if this cell is already selected (allow backtracking)
    const existingIndex = selectedCells.findIndex(
      c => c[0] === row && c[1] === col
    );

    if (existingIndex !== -1) {
      // Backtracking - remove cells after this one
      if (existingIndex < selectedCells.length - 1) {
        setSelectedCells(selectedCells.slice(0, existingIndex + 1));
      }
      return;
    }

    // Only add if adjacent to last cell
    if (areAdjacent(lastCell, [row, col])) {
      setSelectedCells([...selectedCells, [row, col]]);
    }
  };

  const handleEnd = () => {
    if (!isDragging || !puzzle) return;
    setIsDragging(false);

    // Get the selected word
    const selectedWord = selectedCells
      .map(([r, c]) => puzzle.grid[r][c])
      .join('');

    if (selectedWord.length < 3) {
      setSelectedCells([]);
      return;
    }

    // Check if it's the spangram
    if (selectedWord === puzzle.spangram && !foundSpangram) {
      setFoundSpangram(true);
      showTemporaryMessage(`✨ SPANGRAM! "${puzzle.spangram}"`, 'spangram', 3000);
    }
    // Check if it's a theme word
    else if (puzzle.themeWords.includes(selectedWord) && !foundWords.has(selectedWord)) {
      setFoundWords(new Set([...foundWords, selectedWord]));
      showTemporaryMessage(`🎯 Found "${selectedWord}"!`, 'found', 2000);
    }
    // Check if it's a valid non-theme word (4+ letters)
    else if (selectedWord.length >= 4 && isValidWord(selectedWord)) {
      if (!foundWords.has(selectedWord) && selectedWord !== puzzle.spangram &&
          !puzzle.themeWords.includes(selectedWord)) {
        const newCount = nonThemeWordCount + 1;
        setNonThemeWordCount(newCount);

        // Every 3 valid non-theme words, give a hint
        if (newCount % 3 === 0) {
          setHintCount(hintCount + 1);
          showTemporaryMessage(`💡 Valid word! Hint earned!`, 'hint', 2000);
        } else {
          const remaining = 3 - (newCount % 3);
          showTemporaryMessage(`✓ Valid word! ${remaining} more for a hint`, 'valid', 2000);
        }
      } else {
        showTemporaryMessage(`Already found "${selectedWord}"`, 'duplicate', 1500);
      }
    }
    // Not a valid word
    else if (selectedWord.length >= 4) {
      showTemporaryMessage(`"${selectedWord}" is not a valid word`, 'invalid', 1500);
    }

    setSelectedCells([]);
  };

  const handleMouseDown = (row, col) => {
    handleStart(row, col);
  };

  const handleMouseEnter = (row, col) => {
    handleMove(row, col);
  };

  const handleMouseUp = () => {
    handleEnd();
  };

  const handleTouchStart = (e) => {
    e.preventDefault();
    const cell = getCellFromEvent(e);
    if (cell) {
      handleStart(cell[0], cell[1]);
    }
  };

  const handleTouchMove = (e) => {
    e.preventDefault();
    const cell = getCellFromEvent(e);
    if (cell) {
      handleMove(cell[0], cell[1]);
    }
  };

  const handleTouchEnd = (e) => {
    e.preventDefault();
    handleEnd();
  };

  const useHint = () => {
    if (hintCount <= 0 || !puzzle) return;

    // Find an unfound theme word or the spangram
    let targetWord = null;
    let targetPositions = null;

    if (!foundSpangram) {
      targetWord = puzzle.spangram;
      targetPositions = puzzle.wordPositions[puzzle.spangram];
    } else {
      for (const word of puzzle.themeWords) {
        if (!foundWords.has(word)) {
          targetWord = word;
          targetPositions = puzzle.wordPositions[word];
          break;
        }
      }
    }

    if (!targetWord || !targetPositions) return;

    // Find an unrevealed cell in the target word
    for (const [r, c] of targetPositions) {
      const cellKey = `${r},${c}`;
      if (!revealedCells.has(cellKey)) {
        setRevealedCells(new Set([...revealedCells, cellKey]));
        setHintCount(hintCount - 1);
        showTemporaryMessage(`Hint: Look for "${targetWord}"`, 'hint', 2000);
        return;
      }
    }
  };

  const isSelected = (row, col) => {
    return selectedCells.some(([r, c]) => r === row && c === col);
  };

  const isFoundCell = (row, col) => {
    if (!puzzle) return false;

    // Check spangram
    if (foundSpangram && puzzle.wordPositions[puzzle.spangram]) {
      if (puzzle.wordPositions[puzzle.spangram].some(([r, c]) => r === row && c === col)) {
        return 'spangram';
      }
    }

    // Check theme words
    for (const word of foundWords) {
      if (puzzle.wordPositions[word]) {
        if (puzzle.wordPositions[word].some(([r, c]) => r === row && c === col)) {
          return 'theme';
        }
      }
    }

    return false;
  };

  const isRevealed = (row, col) => {
    return revealedCells.has(`${row},${col}`);
  };

  if (!puzzle) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading puzzle...</div>
      </div>
    );
  }

  const totalWords = puzzle.themeWords.length + 1; // +1 for spangram
  const foundCount = foundWords.size + (foundSpangram ? 1 : 0);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Link to="/" className={styles.backLink}>← Back to Games</Link>
        <h1 className={styles.title}>Strands</h1>
        <p className={styles.instructions}>
          Find the themed words by connecting adjacent letters
        </p>
      </div>

      <div className={styles.gameArea}>
        {/* Theme hint */}
        <div className={styles.themeArea}>
          <div className={styles.themeLabel}>TODAY&apos;S THEME</div>
          <button
            className={styles.themeButton}
            onClick={() => setShowHint(!showHint)}
          >
            {showHint ? puzzle.hint : `"${puzzle.theme}"`}
            <span className={styles.toggleHint}>{showHint ? '👁️' : '❓'}</span>
          </button>
        </div>

        {/* Stats bar */}
        <div className={styles.statsBar}>
          <div className={styles.stat}>
            <span className={styles.statLabel}>Found</span>
            <span className={styles.statValue}>{foundCount}/{totalWords}</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statLabel}>Hints</span>
            <button
              className={`${styles.hintButton} ${hintCount === 0 ? styles.disabled : ''}`}
              onClick={useHint}
              disabled={hintCount === 0}
            >
              💡 {hintCount}
            </button>
          </div>
          <div className={styles.stat}>
            <span className={styles.statLabel}>Progress</span>
            <span className={styles.statValue}>{nonThemeWordCount % 3}/3</span>
          </div>
        </div>

        {/* Message display */}
        {message && (
          <div className={`${styles.message} ${styles[messageType]}`}>
            {message}
          </div>
        )}

        {/* Grid */}
        <div
          className={styles.grid}
          ref={gridRef}
          onMouseUp={handleMouseUp}
          onMouseLeave={() => {
            if (isDragging) {
              setIsDragging(false);
              setSelectedCells([]);
            }
          }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {puzzle.grid.map((row, rowIndex) =>
            row.map((letter, colIndex) => {
              const foundType = isFoundCell(rowIndex, colIndex);
              return (
                <div
                  key={`${rowIndex}-${colIndex}`}
                  className={`${styles.cell}
                    ${isSelected(rowIndex, colIndex) ? styles.selected : ''}
                    ${foundType === 'spangram' ? styles.spangramFound : ''}
                    ${foundType === 'theme' ? styles.themeFound : ''}
                    ${isRevealed(rowIndex, colIndex) ? styles.revealed : ''}
                  `}
                  onMouseDown={() => handleMouseDown(rowIndex, colIndex)}
                  onMouseEnter={() => handleMouseEnter(rowIndex, colIndex)}
                >
                  {letter}
                </div>
              );
            })
          )}
        </div>

        {/* Current selection display */}
        <div className={styles.currentWord}>
          {selectedCells.map(([r, c]) => puzzle.grid[r][c]).join('')}
        </div>

        {/* Word list */}
        <div className={styles.wordList}>
          <div className={styles.wordListHeader}>
            <span className={styles.spangramLabel}>
              Spangram: {foundSpangram ? puzzle.spangram : '_ '.repeat(puzzle.spangram.length)}
            </span>
          </div>
          <div className={styles.words}>
            {puzzle.themeWords.map((word, index) => (
              <span
                key={index}
                className={`${styles.word} ${foundWords.has(word) ? styles.found : ''}`}
              >
                {foundWords.has(word) ? word : '?'.repeat(word.length)}
              </span>
            ))}
          </div>
        </div>

        {/* Win message */}
        {gameWon && (
          <div className={styles.winMessage}>
            <div className={styles.winEmoji}>🎉</div>
            <div className={styles.winText}>You completed today&apos;s Strands!</div>
            <div className={styles.winTheme}>Theme: {puzzle.theme}</div>
          </div>
        )}

        <button className={styles.newGameBtn} onClick={initGame}>
          New Puzzle
        </button>
      </div>
    </div>
  );
}
