import { useState, useEffect, useCallback, useRef } from 'react';
import GameHeader from '../../components/GameHeader';
import SeedDisplay from '../../components/SeedDisplay';
import GiveUpButton from '../../components/GiveUpButton';
import GameResult from '../../components/GameResult';
import { isValidWord, createSeededRandom, getTodayDateString, stringToSeed, seededShuffleArray } from '../../data/wordUtils';
import { wordCategories } from '@datasets/wordCategories';
import WordWithDefinition from '../../components/WordWithDefinition/WordWithDefinition';
import styles from './Threads.module.css';

const GRID_ROWS = 8;
const GRID_COLS = 6;
const TOTAL_CELLS = GRID_ROWS * GRID_COLS; // 48

// 8 directions for adjacency (including diagonals)
const DIRECTIONS = [
  [-1, -1], [-1, 0], [-1, 1],
  [0, -1],          [0, 1],
  [1, -1],  [1, 0], [1, 1]
];

// MegaThreads mapped to category keys for thematic consistency
const CATEGORY_MEGATHREADS = {
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

// Helper: Check if cell is within grid bounds
function isValidCell(r, c) {
  return r >= 0 && r < GRID_ROWS && c >= 0 && c < GRID_COLS;
}

// Helper: Get all adjacent cells (8 directions including diagonals)
function getAdjacentCells(r, c) {
  return DIRECTIONS
    .map(([dr, dc]) => [r + dr, c + dc])
    .filter(([nr, nc]) => isValidCell(nr, nc));
}

// Helper: Shuffle array in place using seeded random
function shuffleArrayInPlace(array, random) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

// Helper: Get all empty cells in the grid
function getEmptyCells(grid, usedCells) {
  const empty = [];
  for (let r = 0; r < GRID_ROWS; r++) {
    for (let c = 0; c < GRID_COLS; c++) {
      if (!usedCells.has(`${r},${c}`)) {
        empty.push([r, c]);
      }
    }
  }
  return empty;
}

// Helper: Find cells adjacent to used cells (for starting new words)
function getCellsAdjacentToUsed(usedCells) {
  const adjacent = new Set();
  for (const cellKey of usedCells) {
    const [r, c] = cellKey.split(',').map(Number);
    for (const [nr, nc] of getAdjacentCells(r, c)) {
      const key = `${nr},${nc}`;
      if (!usedCells.has(key)) {
        adjacent.add(key);
      }
    }
  }
  return Array.from(adjacent).map(key => key.split(',').map(Number));
}

// Place a word as a snake path using backtracking DFS
function placeWordAsSnake(grid, word, startR, startC, usedCells, random) {
  const path = [];

  function dfs(idx, r, c) {
    if (!isValidCell(r, c)) return false;
    const cellKey = `${r},${c}`;
    if (usedCells.has(cellKey)) return false;

    // Place this letter
    grid[r][c] = word[idx];
    path.push([r, c]);
    usedCells.add(cellKey);

    if (idx === word.length - 1) return true; // Successfully placed all letters

    // Get adjacent cells and shuffle for randomness
    const neighbors = getAdjacentCells(r, c)
      .filter(([nr, nc]) => !usedCells.has(`${nr},${nc}`));
    shuffleArrayInPlace(neighbors, random);

    for (const [nr, nc] of neighbors) {
      if (dfs(idx + 1, nr, nc)) return true;
    }

    // Backtrack
    grid[r][c] = '';
    path.pop();
    usedCells.delete(cellKey);
    return false;
  }

  if (dfs(0, startR, startC)) {
    return path;
  }
  return null;
}

// Check if a cell is on a specific edge
function isOnEdge(r, c, edge) {
  switch (edge) {
    case 'top': return r === 0;
    case 'bottom': return r === GRID_ROWS - 1;
    case 'left': return c === 0;
    case 'right': return c === GRID_COLS - 1;
    default: return false;
  }
}

// Get the opposite edge
function getOppositeEdge(edge) {
  const opposites = { top: 'bottom', bottom: 'top', left: 'right', right: 'left' };
  return opposites[edge];
}

// Place spangram to span from one edge to the opposite
function placeSpangram(grid, spangram, usedCells, random) {
  // Try starting from different edges
  const edgeStarts = [
    { edge: 'top', cells: Array.from({ length: GRID_COLS }, (_, c) => [0, c]) },
    { edge: 'left', cells: Array.from({ length: GRID_ROWS }, (_, r) => [r, 0]) },
  ];

  shuffleArrayInPlace(edgeStarts, random);

  for (const { edge, cells } of edgeStarts) {
    shuffleArrayInPlace(cells, random);
    const targetEdge = getOppositeEdge(edge);

    for (const [startR, startC] of cells) {
      const path = placeSpangramPath(grid, spangram, startR, startC, targetEdge, usedCells, random);
      if (path) return path;
    }
  }
  return null;
}

// Place spangram with constraint that it must reach the target edge
function placeSpangramPath(grid, word, startR, startC, targetEdge, usedCells, random) {
  const path = [];

  function dfs(idx, r, c) {
    if (!isValidCell(r, c)) return false;
    const cellKey = `${r},${c}`;
    if (usedCells.has(cellKey)) return false;

    // Place this letter
    grid[r][c] = word[idx];
    path.push([r, c]);
    usedCells.add(cellKey);

    // Last letter - must be on target edge
    if (idx === word.length - 1) {
      if (isOnEdge(r, c, targetEdge)) {
        return true;
      }
      // Not on target edge, backtrack
      grid[r][c] = '';
      path.pop();
      usedCells.delete(cellKey);
      return false;
    }

    // Get adjacent cells and prioritize cells closer to target edge
    const neighbors = getAdjacentCells(r, c)
      .filter(([nr, nc]) => !usedCells.has(`${nr},${nc}`));

    // Sort neighbors to prefer direction toward target edge, with some randomness
    neighbors.sort((a, b) => {
      const scoreA = getEdgeScore(a[0], a[1], targetEdge);
      const scoreB = getEdgeScore(b[0], b[1], targetEdge);
      // Add randomness but prefer direction toward target
      return (scoreB - scoreA) + (random() - 0.5) * 0.5;
    });

    for (const [nr, nc] of neighbors) {
      if (dfs(idx + 1, nr, nc)) return true;
    }

    // Backtrack
    grid[r][c] = '';
    path.pop();
    usedCells.delete(cellKey);
    return false;
  }

  if (dfs(0, startR, startC)) {
    return path;
  }
  return null;
}

// Score how close a cell is to target edge (higher = closer)
function getEdgeScore(r, c, targetEdge) {
  switch (targetEdge) {
    case 'bottom': return r;
    case 'top': return GRID_ROWS - 1 - r;
    case 'right': return c;
    case 'left': return GRID_COLS - 1 - c;
    default: return 0;
  }
}

// Try to place a theme word in any valid starting position
function tryPlaceThemeWord(grid, word, usedCells, random) {
  // Get potential starting cells - prefer cells adjacent to already placed words
  let startCells = getCellsAdjacentToUsed(usedCells);

  // If no adjacent cells (shouldn't happen after spangram), use any empty cell
  if (startCells.length === 0) {
    startCells = getEmptyCells(grid, usedCells);
  }

  shuffleArrayInPlace(startCells, random);

  for (const [r, c] of startCells) {
    const path = placeWordAsSnake(grid, word, r, c, usedCells, random);
    if (path) return path;
  }
  return null;
}

// Generate a grid with words placed using snake-path algorithm
function generatePuzzleGrid(puzzle, random, maxAttempts = 100) {
  const totalNeeded = puzzle.spangram.length + puzzle.themeWords.reduce((s, w) => s + w.length, 0);

  if (totalNeeded !== TOTAL_CELLS) {
    console.warn(`Threads: Word letters (${totalNeeded}) don't match grid cells (${TOTAL_CELLS}), will have gaps`);
  }

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const grid = Array(GRID_ROWS).fill(null).map(() => Array(GRID_COLS).fill(''));
    const usedCells = new Set();
    const wordPositions = {};
    let success = true;

    // 1. Place spangram first (edge-to-edge)
    const spangramPath = placeSpangram(grid, puzzle.spangram, usedCells, random);
    if (!spangramPath) {
      continue;
    }
    wordPositions[puzzle.spangram] = spangramPath;

    // 2. Sort theme words by length (longer first - they're harder to place)
    const sortedWords = [...puzzle.themeWords].sort((a, b) => b.length - a.length);

    // 3. Place theme words in remaining space
    for (const word of sortedWords) {
      const path = tryPlaceThemeWord(grid, word, usedCells, random);
      if (!path) {
        success = false;
        break;
      }
      wordPositions[word] = path;
    }

    if (!success) continue;

    // 4. Check if all cells are filled
    const emptyCellCount = TOTAL_CELLS - usedCells.size;
    if (emptyCellCount === 0) {
      console.log(`Threads: Successfully generated grid on attempt ${attempt + 1}`);
      return { grid, wordPositions };
    }
  }

  // Fallback: If we couldn't fill the grid perfectly, return best effort with random fill
  console.warn(`Threads: Could not generate perfect puzzle after ${maxAttempts} attempts, using fallback`);
  return generateFallbackGrid(puzzle, random);
}

// Fallback grid generation if perfect placement fails
function generateFallbackGrid(puzzle, random) {
  const grid = Array(GRID_ROWS).fill(null).map(() => Array(GRID_COLS).fill(''));
  const usedCells = new Set();
  const wordPositions = {};

  // Place spangram
  const spangramPath = placeSpangram(grid, puzzle.spangram, usedCells, random);
  if (spangramPath) {
    wordPositions[puzzle.spangram] = spangramPath;
  }

  // Place as many theme words as possible
  for (const word of puzzle.themeWords) {
    const path = tryPlaceThemeWord(grid, word, usedCells, random);
    if (path) {
      wordPositions[word] = path;
    }
  }

  // Fill remaining empty cells with random letters
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

// Select words that sum to exactly TOTAL_CELLS letters using dynamic programming
function selectWordsForGrid(categoryWords, spangram, random) {
  const targetLetters = TOTAL_CELLS - spangram.length;

  // Allow words from 3-8 letters for more flexibility
  const suitableWords = categoryWords.filter(w => w.length >= 3 && w.length <= 8);

  // Shuffle words for variety
  const shuffled = [...suitableWords];
  shuffleArrayInPlace(shuffled, random);

  // Use subset sum with backtracking - try to find exact match
  function findExactSubset(words, target, minWords, maxWords) {
    const n = words.length;

    // Memoization won't work well here due to word tracking, use iterative deepening
    function backtrack(idx, remaining, selected) {
      if (remaining === 0 && selected.length >= minWords && selected.length <= maxWords) {
        return [...selected];
      }

      if (remaining < 0 || idx >= n || selected.length >= maxWords) {
        return null;
      }

      // Pruning: if remaining letters can't be filled with remaining words, skip
      const minPossible = (maxWords - selected.length) * 3;
      const maxPossible = (maxWords - selected.length) * 8;
      if (remaining > maxPossible || remaining < minPossible) {
        // Try without this word
        return backtrack(idx + 1, remaining, selected);
      }

      const word = words[idx];

      // Try including this word
      if (word.length <= remaining) {
        selected.push(word);
        const result = backtrack(idx + 1, remaining - word.length, selected);
        if (result) return result;
        selected.pop();
      }

      // Try without this word
      return backtrack(idx + 1, remaining, selected);
    }

    return backtrack(0, target, []);
  }

  // Try different word counts from 6 to 10 words (typical for Strands)
  for (let wordCount = 6; wordCount <= 10; wordCount++) {
    const result = findExactSubset(shuffled.slice(0, 30), targetLetters, wordCount, wordCount);
    if (result) {
      return result;
    }
  }

  // More flexible: try range of word counts
  const result = findExactSubset(shuffled.slice(0, 40), targetLetters, 5, 12);
  if (result) {
    return result;
  }

  // Last resort: greedy fill to get as close as possible
  console.warn(`Could not find exact word combination for ${targetLetters} letters, using greedy approach`);
  let sum = 0;
  const selected = [];

  // Sort by length descending, then fill
  const sortedByLen = [...shuffled].sort((a, b) => b.length - a.length);

  for (const word of sortedByLen) {
    if (sum + word.length <= targetLetters) {
      selected.push(word);
      sum += word.length;
    }
    if (sum === targetLetters) break;
  }

  // If we're short, try to find small words to fill gap
  const gap = targetLetters - sum;
  if (gap > 0 && gap <= 8) {
    const filler = shuffled.find(w => w.length === gap && !selected.includes(w));
    if (filler) {
      selected.push(filler);
    }
  }

  return selected;
}

// Generate a puzzle from word categories with proper letter count
function generatePuzzleFromCategories(seed) {
  const random = createSeededRandom(seed);

  // Get category keys that have MegaThreads defined and shuffle
  const categoryKeys = Object.keys(wordCategories).filter(key => CATEGORY_MEGATHREADS[key]);
  const shuffledKeys = seededShuffleArray(categoryKeys, random);

  // Try each category until we find one that works
  for (const categoryKey of shuffledKeys) {
    const category = wordCategories[categoryKey];
    const spangram = CATEGORY_MEGATHREADS[categoryKey];

    // Select words that sum to exactly TOTAL_CELLS
    const themeWords = selectWordsForGrid(category.words, spangram, random);
    const totalLetters = spangram.length + themeWords.reduce((sum, w) => sum + w.length, 0);

    if (totalLetters === TOTAL_CELLS) {
      console.log(`Threads: Selected ${themeWords.length} words for category "${category.name}": ${themeWords.join(', ')} (${totalLetters} letters)`);
      return {
        theme: category.name,
        hint: `Find the ${category.name.toLowerCase()}`,
        spangram: spangram,
        themeWords: themeWords,
      };
    } else {
      console.warn(`Threads: Category "${category.name}" - letters don't match: ${totalLetters} vs ${TOTAL_CELLS}`);
    }
  }

  // Fallback: try harder with combined categories
  console.warn('Threads: Primary selection failed, trying combined word pool');

  // Combine words from multiple categories
  const firstCategory = wordCategories[shuffledKeys[0]];
  const spangram = CATEGORY_MEGATHREADS[shuffledKeys[0]];
  const allWords = shuffledKeys.slice(0, 5).flatMap(key => wordCategories[key].words);
  const uniqueWords = [...new Set(allWords)];

  const themeWords = selectWordsForGrid(uniqueWords, spangram, random);
  const totalLetters = spangram.length + themeWords.reduce((sum, w) => sum + w.length, 0);

  console.log(`Threads fallback: ${themeWords.length} words, ${totalLetters} letters (need ${TOTAL_CELLS})`);

  return {
    theme: firstCategory.name,
    hint: `Find the ${firstCategory.name.toLowerCase()}`,
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
  const seed = stringToSeed(`threads-${dateStr}`);
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

// Export helpers for testing
export {
  GRID_ROWS,
  GRID_COLS,
  DIRECTIONS,
  isValidCell,
  getAdjacentCells,
  shuffleArrayInPlace,
  getEmptyCells,
  getCellsAdjacentToUsed,
  isOnEdge,
  getOppositeEdge,
  areAdjacent,
  getPuzzleForDate,
  generatePuzzleGrid,
  generatePuzzleFromCategories,
};

export default function Threads() {
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
  const [gaveUp, setGaveUp] = useState(false);
  const [seed, setSeed] = useState(null);
  const gridRef = useRef(null);

  const initGame = useCallback((customSeed = null) => {
    const today = getTodayDateString();
    const gameSeed = customSeed ?? stringToSeed(`threads-${today}`);
    const newPuzzle = getPuzzleForDate(today);
    setSeed(gameSeed);
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
    setGaveUp(false);
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

  const getCellFromEvent = (e, requireThreshold = false) => {
    if (!gridRef.current) return null;

    const touch = e.touches ? e.touches[0] : e;
    const rect = gridRef.current.getBoundingClientRect();
    const cellWidth = rect.width / GRID_COLS;
    const cellHeight = rect.height / GRID_ROWS;

    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    const col = Math.floor(x / cellWidth);
    const row = Math.floor(y / cellHeight);

    if (row >= 0 && row < GRID_ROWS && col >= 0 && col < GRID_COLS) {
      // For touch moves, add a threshold to prevent accidental diagonal selection
      // Only register the cell if touch is at least 25% into the cell from any edge
      if (requireThreshold) {
        const cellX = x - col * cellWidth;
        const cellY = y - row * cellHeight;
        const threshold = 0.25;
        const minX = cellWidth * threshold;
        const maxX = cellWidth * (1 - threshold);
        const minY = cellHeight * threshold;
        const maxY = cellHeight * (1 - threshold);

        // If touch is in the outer 25% edge zone, don't register the cell
        if (cellX < minX || cellX > maxX || cellY < minY || cellY > maxY) {
          return null;
        }
      }
      return [row, col];
    }
    return null;
  };

  const handleGiveUp = () => {
    if (!puzzle || gameWon || gaveUp) return;
    setGaveUp(true);
    setMessage('Solution revealed. Better luck next time!');
    setMessageType('giveup');
  };

  const handleStart = (row, col) => {
    if (gameWon || gaveUp) return;
    setIsDragging(true);
    setSelectedCells([[row, col]]);
  };

  const handleMove = (row, col) => {
    if (!isDragging || gameWon || gaveUp) return;

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
      showTemporaryMessage(`✨ MEGATHREAD! "${puzzle.spangram}"`, 'spangram', 3000);
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
    // Use threshold to prevent accidental diagonal selections on mobile
    const cell = getCellFromEvent(e, true);
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

    // If gave up, show all word positions
    if (gaveUp) {
      // Check spangram
      if (puzzle.wordPositions[puzzle.spangram]) {
        if (puzzle.wordPositions[puzzle.spangram].some(([r, c]) => r === row && c === col)) {
          return 'spangram';
        }
      }
      // Check all theme words
      for (const word of puzzle.themeWords) {
        if (puzzle.wordPositions[word]) {
          if (puzzle.wordPositions[word].some(([r, c]) => r === row && c === col)) {
            return 'theme';
          }
        }
      }
      return false;
    }

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
      <GameHeader
        title="Threads"
        instructions="Find the themed words by connecting adjacent letters"
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
            initGame(seedNum);
          }}
        />
      )}

      <div className={styles.gameArea}>
        {/* Theme hint */}
        <div className={styles.themeArea}>
          <div className={styles.themeLabel}>TODAY&apos;S THEME</div>
          <div className={styles.themeDisplay}>
            &ldquo;{puzzle.theme}&rdquo;
          </div>
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
            <span className={`${styles.spangramLabel} ${gaveUp ? styles.revealed : ''}`}>
              MegaThread: {(foundSpangram || gaveUp) ? puzzle.spangram : '_ '.repeat(puzzle.spangram.length)}
            </span>
          </div>
          <div className={styles.words}>
            {puzzle.themeWords.map((word, index) => (
              <span
                key={index}
                className={`${styles.word} ${(foundWords.has(word) || gaveUp) ? styles.found : ''} ${gaveUp && !foundWords.has(word) ? styles.revealed : ''}`}
              >
                {(foundWords.has(word) || gaveUp) ? (
                  <WordWithDefinition word={word} />
                ) : (
                  '?'.repeat(word.length)
                )}
              </span>
            ))}
          </div>
        </div>

        {/* Win/Give up messages */}
        {gameWon && (
          <GameResult
            state="won"
            title="You completed today's Threads!"
            message={`Theme: ${puzzle.theme}`}
          />
        )}
        {gaveUp && (
          <GameResult
            state="gaveup"
            title="Solution Revealed"
            message={`Theme: ${puzzle.theme}`}
          />
        )}

        <div className={styles.buttonRow}>
          {!gameWon && !gaveUp && (
            <GiveUpButton onGiveUp={handleGiveUp} />
          )}
          <button className={styles.newGameBtn} onClick={initGame}>
            New Puzzle
          </button>
        </div>
      </div>
    </div>
  );
}
