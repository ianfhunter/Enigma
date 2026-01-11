/**
 * Crossword puzzle utilities
 * Generates crossword puzzles from NYT clues data
 */

// Parse the raw clue data
export function parseCluesData(rawData) {
  // Handle different line endings (Windows \r\n, Mac \r, Unix \n)
  const lines = rawData.trim().split(/\r?\n|\r/);
  const clues = [];

  for (const line of lines) {
    const parts = line.split('\t');
    if (parts.length >= 2) {
      let clue = parts[0];
      const answer = parts[1].toUpperCase().replace(/[^A-Z]/g, '');

      // Clean up clue text (remove extra quotes)
      if (clue.startsWith('"') && clue.endsWith('"')) {
        clue = clue.slice(1, -1);
      }
      clue = clue.replace(/""/g, '"');

      // Filter valid answers (3-12 characters, only letters)
      if (answer.length >= 3 && answer.length <= 12 && /^[A-Z]+$/.test(answer)) {
        clues.push({ clue, answer });
      }
    }
  }

  return clues;
}

// Seeded random number generator
function seededRandom(seed) {
  let s = Math.abs(seed) % 2147483647 || 1;
  return function() {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

// Shuffle array with seed
function shuffleArray(array, random) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Generate a crossword puzzle
export function generateCrossword(clues, options = {}) {
  const {
    gridSize = 20,  // Larger working grid for more placement options
    targetWords = 15,
    seed = Date.now(),
    difficulty = 'medium',
  } = options;

  const random = seededRandom(seed);

  // Filter clues by answer length based on difficulty
  let filteredClues;
  if (difficulty === 'easy') {
    filteredClues = clues.filter(c => c.answer.length >= 3 && c.answer.length <= 6);
  } else if (difficulty === 'hard') {
    filteredClues = clues.filter(c => c.answer.length >= 5 && c.answer.length <= 10);
  } else {
    filteredClues = clues.filter(c => c.answer.length >= 4 && c.answer.length <= 8);
  }

  // Shuffle and get more candidates for better variety
  const shuffled = shuffleArray(filteredClues, random);
  const candidates = shuffled.slice(0, 500);

  // Initialize grid with nulls
  const grid = [];
  for (let i = 0; i < gridSize; i++) {
    grid.push(new Array(gridSize).fill(null));
  }

  const placedWords = [];
  const usedAnswers = new Set();

  // Get cell value safely
  function getCell(r, c) {
    if (r < 0 || r >= gridSize || c < 0 || c >= gridSize) return undefined;
    return grid[r][c];
  }

  // Check if we can place a word at a position
  function canPlace(word, startRow, startCol, isAcross) {
    const len = word.length;
    const dr = isAcross ? 0 : 1;
    const dc = isAcross ? 1 : 0;

    // Check bounds
    const endRow = startRow + dr * (len - 1);
    const endCol = startCol + dc * (len - 1);
    if (endRow >= gridSize || endCol >= gridSize || startRow < 0 || startCol < 0) {
      return null;
    }

    // Check cell BEFORE word start (must be empty/out-of-bounds)
    const beforeVal = getCell(startRow - dr, startCol - dc);
    if (beforeVal !== null && beforeVal !== undefined) {
      return null;
    }

    // Check cell AFTER word end (must be empty/out-of-bounds)
    const afterVal = getCell(startRow + dr * len, startCol + dc * len);
    if (afterVal !== null && afterVal !== undefined) {
      return null;
    }

    let intersections = 0;

    for (let i = 0; i < len; i++) {
      const r = startRow + dr * i;
      const c = startCol + dc * i;
      const currentCell = grid[r][c];
      const letter = word[i];

      if (currentCell !== null) {
        // Cell already has a letter - must match for valid intersection
        if (currentCell !== letter) {
          return null;
        }
        intersections++;
      } else {
        // Cell is empty - check perpendicular neighbors
        // For a natural crossword, empty cells shouldn't touch other words
        if (isAcross) {
          // Check above and below for across words
          const above = getCell(r - 1, c);
          const below = getCell(r + 1, c);
          if ((above !== null && above !== undefined) ||
              (below !== null && below !== undefined)) {
            return null;
          }
        } else {
          // Check left and right for down words
          const left = getCell(r, c - 1);
          const right = getCell(r, c + 1);
          if ((left !== null && left !== undefined) ||
              (right !== null && right !== undefined)) {
            return null;
          }
        }
      }
    }

    // Must have at least one intersection (except for first word)
    return intersections;
  }

  // Place a word on the grid
  function placeWord(word, row, col, isAcross, clueText) {
    const dr = isAcross ? 0 : 1;
    const dc = isAcross ? 1 : 0;

    for (let i = 0; i < word.length; i++) {
      grid[row + dr * i][col + dc * i] = word[i];
    }

    placedWords.push({
      word,
      row,
      col,
      direction: isAcross ? 'across' : 'down',
      clue: clueText,
    });
    usedAnswers.add(word);
  }

  // Find all valid placements for a word
  function findAllPlacements(word) {
    const placements = [];

    // Scan the entire grid for existing letters
    for (let r = 0; r < gridSize; r++) {
      for (let c = 0; c < gridSize; c++) {
        const gridLetter = grid[r][c];
        if (gridLetter === null) continue;

        // Check if this letter appears in the word
        for (let i = 0; i < word.length; i++) {
          if (word[i] !== gridLetter) continue;

          // Try ACROSS placement: letter at index i aligns with column c
          const acrossStartCol = c - i;
          const acrossIntersections = canPlace(word, r, acrossStartCol, true);
          if (acrossIntersections !== null && acrossIntersections > 0) {
            placements.push({
              row: r,
              col: acrossStartCol,
              isAcross: true,
              intersections: acrossIntersections,
            });
          }

          // Try DOWN placement: letter at index i aligns with row r
          const downStartRow = r - i;
          const downIntersections = canPlace(word, downStartRow, c, false);
          if (downIntersections !== null && downIntersections > 0) {
            placements.push({
              row: downStartRow,
              col: c,
              isAcross: false,
              intersections: downIntersections,
            });
          }
        }
      }
    }

    return placements;
  }

  // STEP 1: Place the first word horizontally in the center
  const firstClue = candidates.find(c => c.answer.length >= 5 && c.answer.length <= 8) || candidates[0];
  if (firstClue) {
    const centerRow = Math.floor(gridSize / 2);
    const startCol = Math.floor((gridSize - firstClue.answer.length) / 2);
    placeWord(firstClue.answer, centerRow, startCol, true, firstClue.clue);
  }

  // STEP 2: Keep trying to add words until we reach target or exhaust attempts
  let passes = 0;
  const maxPasses = 30;

  while (placedWords.length < targetWords && passes < maxPasses) {
    let addedThisPass = 0;

    for (const candidate of candidates) {
      if (usedAnswers.has(candidate.answer)) continue;
      if (placedWords.length >= targetWords) break;

      const placements = findAllPlacements(candidate.answer);

      if (placements.length > 0) {
        // Sort by intersections descending (prefer more connections)
        placements.sort((a, b) => b.intersections - a.intersections);

        // Pick randomly from top placements for variety
        const topN = Math.min(3, placements.length);
        const chosen = placements[Math.floor(random() * topN)];

        placeWord(candidate.answer, chosen.row, chosen.col, chosen.isAcross, candidate.clue);
        addedThisPass++;
      }
    }

    // If we couldn't add any words this pass, we're stuck
    if (addedThisPass === 0) break;
    passes++;
  }

  // STEP 3: Compact the grid (find bounds)
  let minR = gridSize, maxR = -1, minC = gridSize, maxC = -1;
  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      if (grid[r][c] !== null) {
        minR = Math.min(minR, r);
        maxR = Math.max(maxR, r);
        minC = Math.min(minC, c);
        maxC = Math.max(maxC, c);
      }
    }
  }

  // Handle empty grid edge case
  if (maxR < 0) {
    return {
      grid: [],
      across: [],
      down: [],
      cellNumbers: {},
      size: { rows: 0, cols: 0 },
    };
  }

  // Create compact grid
  const compactGrid = [];
  for (let r = minR; r <= maxR; r++) {
    const row = [];
    for (let c = minC; c <= maxC; c++) {
      row.push(grid[r][c]);
    }
    compactGrid.push(row);
  }

  // Adjust word positions to compact coordinates
  const adjustedWords = placedWords.map(w => ({
    ...w,
    row: w.row - minR,
    col: w.col - minC,
  }));

  // STEP 4: Assign clue numbers (scan left-to-right, top-to-bottom)
  const cellNumbers = {};
  const across = [];
  const down = [];
  let clueNum = 1;

  for (let r = 0; r < compactGrid.length; r++) {
    for (let c = 0; c < compactGrid[r].length; c++) {
      if (compactGrid[r][c] === null) continue;

      const wordsStartingHere = adjustedWords.filter(w => w.row === r && w.col === c);

      if (wordsStartingHere.length > 0) {
        const key = `${r},${c}`;
        cellNumbers[key] = clueNum;

        for (const w of wordsStartingHere) {
          const entry = {
            number: clueNum,
            clue: w.clue,
            answer: w.word,
            row: r,
            col: c,
          };
          if (w.direction === 'across') {
            across.push(entry);
          } else {
            down.push(entry);
          }
        }
        clueNum++;
      }
    }
  }

  // Sort clues by number
  across.sort((a, b) => a.number - b.number);
  down.sort((a, b) => a.number - b.number);

  return {
    grid: compactGrid,
    across,
    down,
    cellNumbers,
    size: { rows: compactGrid.length, cols: compactGrid[0]?.length || 0 },
  };
}

// Get a daily puzzle seed
export function getDailySeed(dateString) {
  let hash = 0;
  const str = `crossword-${dateString}`;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash) || 1;
}

// Get today's date string
export function getTodayDateString() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

// Check if a letter is correct at a position
export function checkLetter(puzzle, row, col, letter) {
  if (row < 0 || row >= puzzle.grid.length) return false;
  if (col < 0 || col >= puzzle.grid[row].length) return false;
  return puzzle.grid[row][col]?.toUpperCase() === letter?.toUpperCase();
}

// Check if the puzzle is complete
export function isPuzzleComplete(puzzle, userGrid) {
  for (let r = 0; r < puzzle.grid.length; r++) {
    for (let c = 0; c < puzzle.grid[r].length; c++) {
      if (puzzle.grid[r][c] !== null) {
        if (!userGrid[r]?.[c] || userGrid[r][c].toUpperCase() !== puzzle.grid[r][c]) {
          return false;
        }
      }
    }
  }
  return true;
}

// Get empty cells in the puzzle
export function getEmptyCells(puzzle, userGrid) {
  const emptyCells = [];
  for (let r = 0; r < puzzle.grid.length; r++) {
    for (let c = 0; c < puzzle.grid[r].length; c++) {
      if (puzzle.grid[r][c] !== null && (!userGrid[r]?.[c] || userGrid[r][c] === '')) {
        emptyCells.push({ row: r, col: c, answer: puzzle.grid[r][c] });
      }
    }
  }
  return emptyCells;
}

export default {
  parseCluesData,
  generateCrossword,
  getDailySeed,
  getTodayDateString,
  checkLetter,
  isPuzzleComplete,
  getEmptyCells,
};
