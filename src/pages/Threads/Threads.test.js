import { describe, it, expect } from 'vitest';
import {
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
  getPuzzleForSeed,
} from './Threads.jsx';

describe('Threads - helpers', () => {
  it('has grid constants and directions', () => {
    expect(GRID_ROWS).toBe(8);
    expect(DIRECTIONS.length).toBe(8);
  });

  it('validates and gets adjacency', () => {
    expect(isValidCell(0, 0)).toBe(true);
    expect(isValidCell(-1, 0)).toBe(false);
    expect(getAdjacentCells(0, 0)).toContainEqual([0, 1]);
  });

  it('shuffleArrayInPlace permutes array', () => {
    const arr = [1, 2, 3];
    shuffleArrayInPlace(arr, () => 0.1);
    expect(arr.sort()).toEqual([1, 2, 3]);
  });

  it('getEmptyCells lists unused cells', () => {
    const used = new Set(['0,0']);
    const empty = getEmptyCells(Array(GRID_ROWS).fill(Array(GRID_COLS).fill('')), used);
    expect(empty).not.toContainEqual([0, 0]);
  });

  it('getCellsAdjacentToUsed finds border cells', () => {
    const used = new Set(['1,1']);
    const adj = getCellsAdjacentToUsed(used);
    expect(adj).toContainEqual([0, 0]);
  });

  it('edge helpers work', () => {
    expect(isOnEdge(0, 3, 'top')).toBe(true);
    expect(getOppositeEdge('left')).toBe('right');
    expect(areAdjacent([0, 0], [1, 1])).toBe(true);
  });

  it('getPuzzleForSeed returns deterministic puzzle', () => {
    const puz = getPuzzleForSeed(12345);
    expect(puz.grid.length).toBe(GRID_ROWS);

    expect(typeof puz.wordPositions).toBe('object');
    Object.entries(puz.wordPositions).forEach(([word, path]) => {
      expect(Array.isArray(path)).toBe(true);
      expect(path.length).toBe(word.length);
      path.forEach(cell => expect(cell.length).toBe(2));
    });

    const repeat = getPuzzleForSeed(12345);
    expect(repeat.grid).toEqual(puz.grid);
    expect(repeat.wordPositions).toEqual(puz.wordPositions);
  });

  it('different seeds produce different puzzles', () => {
    const puz1 = getPuzzleForSeed(11111);
    const puz2 = getPuzzleForSeed(22222);
    const puz3 = getPuzzleForSeed(33333);

    // Different seeds should produce different grids
    expect(puz1.grid).not.toEqual(puz2.grid);
    expect(puz2.grid).not.toEqual(puz3.grid);
    expect(puz1.grid).not.toEqual(puz3.grid);

    // Theme can be same or different, but at least words should differ
    const words1 = JSON.stringify(puz1.themeWords.sort());
    const words2 = JSON.stringify(puz2.themeWords.sort());
    const words3 = JSON.stringify(puz3.themeWords.sort());

    // At least one should be different (very unlikely all 3 are identical)
    expect(words1 === words2 && words2 === words3).toBe(false);
  });

  it('all theme words are placed and discoverable', () => {
    const puz = getPuzzleForSeed(54321);

    // Spangram must be placed
    expect(puz.wordPositions[puz.spangram]).toBeDefined();
    expect(Array.isArray(puz.wordPositions[puz.spangram])).toBe(true);

    // All theme words must be placed
    puz.themeWords.forEach(word => {
      expect(puz.wordPositions[word]).toBeDefined();
      expect(Array.isArray(puz.wordPositions[word])).toBe(true);
      expect(puz.wordPositions[word].length).toBe(word.length);
    });
  });

  it('word positions match grid letters', () => {
    const puz = getPuzzleForSeed(99999);

    // Check spangram
    const spangramPath = puz.wordPositions[puz.spangram];
    const spangramFromGrid = spangramPath.map(([r, c]) => puz.grid[r][c]).join('');
    expect(spangramFromGrid).toBe(puz.spangram);

    // Check theme words
    puz.themeWords.forEach(word => {
      const path = puz.wordPositions[word];
      const wordFromGrid = path.map(([r, c]) => puz.grid[r][c]).join('');
      expect(wordFromGrid).toBe(word);
    });
  });

  it('all word paths are connected (adjacent cells)', () => {
    const puz = getPuzzleForSeed(77777);

    // Helper to check if two cells are adjacent
    const checkPathConnectivity = (path) => {
      for (let i = 0; i < path.length - 1; i++) {
        const [r1, c1] = path[i];
        const [r2, c2] = path[i + 1];
        expect(areAdjacent([r1, c1], [r2, c2])).toBe(true);
      }
    };

    // Check spangram connectivity
    checkPathConnectivity(puz.wordPositions[puz.spangram]);

    // Check theme words connectivity
    puz.themeWords.forEach(word => {
      checkPathConnectivity(puz.wordPositions[word]);
    });
  });

  it('all cells are used (no random filler letters)', () => {
    const puz = getPuzzleForSeed(12345);

    // Count total letters in all words
    const totalWordLetters = puz.spangram.length +
      puz.themeWords.reduce((sum, w) => sum + w.length, 0);

    // Should be exactly 48 (6x8 grid)
    expect(totalWordLetters).toBe(GRID_ROWS * GRID_COLS);

    // Verify no empty cells in grid
    puz.grid.forEach((row, r) => {
      row.forEach((cell, c) => {
        expect(cell).not.toBe('');
        expect(cell.length).toBe(1);
      });
    });

    // Verify every cell belongs to exactly one word
    const cellToWord = new Map();
    Object.entries(puz.wordPositions).forEach(([word, path]) => {
      path.forEach(([r, c]) => {
        const key = `${r},${c}`;
        if (cellToWord.has(key)) {
          throw new Error(`Cell (${r},${c}) is used by both "${cellToWord.get(key)}" and "${word}"`);
        }
        cellToWord.set(key, word);
      });
    });

    // All 48 cells should be accounted for
    expect(cellToWord.size).toBe(GRID_ROWS * GRID_COLS);
  });
});

describe('Threads - Hint Behavior', () => {
  // Test that hint animation should be cleared on user input
  const shouldClearRevealedCells = (revealedCellsCount, userStartedDragging) => {
    return userStartedDragging && revealedCellsCount > 0;
  };

  it('should clear revealed cells when user starts dragging and there are revealed cells', () => {
    expect(shouldClearRevealedCells(1, true)).toBe(true);
    expect(shouldClearRevealedCells(5, true)).toBe(true);
  });

  it('should not clear revealed cells when user has not started dragging', () => {
    expect(shouldClearRevealedCells(1, false)).toBe(false);
    expect(shouldClearRevealedCells(5, false)).toBe(false);
  });

  it('should not need to clear when there are no revealed cells', () => {
    expect(shouldClearRevealedCells(0, true)).toBe(false);
    expect(shouldClearRevealedCells(0, false)).toBe(false);
  });
});

// ===========================================
// Threads - Duplicate Word Prevention Tests
// ===========================================
describe('Threads - Duplicate Word Submission', () => {
  // Helper to simulate word validation logic
  const shouldAcceptWord = (word, foundWords, puzzle) => {
    // Word must be at least 4 letters
    if (word.length < 4) return { accept: false, reason: 'too_short' };

    // Check if already found
    if (foundWords.has(word)) {
      return { accept: false, reason: 'duplicate' };
    }

    // Check if it's the spangram
    if (word === puzzle.spangram) {
      return { accept: true, type: 'spangram' };
    }

    // Check if it's a theme word
    if (puzzle.themeWords.includes(word)) {
      return { accept: true, type: 'theme' };
    }

    // Otherwise it's a non-theme word (would need actual validation)
    return { accept: true, type: 'non-theme' };
  };

  it('should reject duplicate theme words', () => {
    const puzzle = {
      spangram: 'SPANGRAM',
      themeWords: ['THEME', 'WORDS'],
    };
    const foundWords = new Set(['THEME']);

    const result = shouldAcceptWord('THEME', foundWords, puzzle);
    expect(result.accept).toBe(false);
    expect(result.reason).toBe('duplicate');
  });

  it('should reject duplicate non-theme words', () => {
    const puzzle = {
      spangram: 'SPANGRAM',
      themeWords: ['THEME'],
    };
    const foundWords = new Set(['WORD']); // non-theme word already found

    const result = shouldAcceptWord('WORD', foundWords, puzzle);
    expect(result.accept).toBe(false);
    expect(result.reason).toBe('duplicate');
  });

  it('should reject duplicate spangram submission', () => {
    const puzzle = {
      spangram: 'SPANGRAM',
      themeWords: ['THEME'],
    };
    const foundWords = new Set(['SPANGRAM']);

    const result = shouldAcceptWord('SPANGRAM', foundWords, puzzle);
    expect(result.accept).toBe(false);
    expect(result.reason).toBe('duplicate');
  });

  it('should accept first submission of valid non-theme word', () => {
    const puzzle = {
      spangram: 'SPANGRAM',
      themeWords: ['THEME'],
    };
    const foundWords = new Set(['THEME']);

    const result = shouldAcceptWord('WORD', foundWords, puzzle);
    expect(result.accept).toBe(true);
    expect(result.type).toBe('non-theme');
  });

  it('should accept first submission of theme word', () => {
    const puzzle = {
      spangram: 'SPANGRAM',
      themeWords: ['THEME', 'WORDS'],
    };
    const foundWords = new Set(['THEME']);

    const result = shouldAcceptWord('WORDS', foundWords, puzzle);
    expect(result.accept).toBe(true);
    expect(result.type).toBe('theme');
  });

  it('should accept first submission of spangram', () => {
    const puzzle = {
      spangram: 'SPANGRAM',
      themeWords: ['THEME'],
    };
    const foundWords = new Set(['THEME']);

    const result = shouldAcceptWord('SPANGRAM', foundWords, puzzle);
    expect(result.accept).toBe(true);
    expect(result.type).toBe('spangram');
  });
});

describe('Threads - Hint System Integrity', () => {
  // Simulate hint counting logic
  const processNonThemeWord = (word, foundNonThemeWords, nonThemeWordCount) => {
    // If word is already found, don't count it
    if (foundNonThemeWords.has(word)) {
      return {
        counted: false,
        newCount: nonThemeWordCount,
        hintEarned: false
      };
    }

    // New word: increment count
    const newCount = nonThemeWordCount + 1;
    const hintEarned = newCount % 3 === 0;

    return {
      counted: true,
      newCount,
      hintEarned,
      newFoundNonThemeWords: new Set([...foundNonThemeWords, word])
    };
  };

  it('should not count duplicate submissions toward hint counter', () => {
    const foundNonThemeWords = new Set(['WORD']);
    const result = processNonThemeWord('WORD', foundNonThemeWords, 1);

    expect(result.counted).toBe(false);
    expect(result.newCount).toBe(1);
    expect(result.hintEarned).toBe(false);
  });

  it('should increment hint counter for first submission only', () => {
    const foundNonThemeWords = new Set();

    // First submission
    const result1 = processNonThemeWord('WORD', foundNonThemeWords, 0);
    expect(result1.counted).toBe(true);
    expect(result1.newCount).toBe(1);
    expect(result1.hintEarned).toBe(false);

    // Second submission (duplicate)
    const result2 = processNonThemeWord('WORD', result1.newFoundNonThemeWords, 1);
    expect(result2.counted).toBe(false);
    expect(result2.newCount).toBe(1);
    expect(result2.hintEarned).toBe(false);
  });

  it('should earn hint after 3 unique words, not 3 submissions', () => {
    let foundNonThemeWords = new Set();
    let count = 0;

    // Word 1
    let result = processNonThemeWord('WORD1', foundNonThemeWords, count);
    expect(result.hintEarned).toBe(false);
    foundNonThemeWords = result.newFoundNonThemeWords;
    count = result.newCount;

    // Word 2
    result = processNonThemeWord('WORD2', foundNonThemeWords, count);
    expect(result.hintEarned).toBe(false);
    foundNonThemeWords = result.newFoundNonThemeWords;
    count = result.newCount;

    // Duplicate of Word 1 (should NOT earn hint)
    result = processNonThemeWord('WORD1', foundNonThemeWords, count);
    expect(result.counted).toBe(false);
    expect(result.hintEarned).toBe(false);

    // Word 3 (third UNIQUE word - should earn hint)
    result = processNonThemeWord('WORD3', foundNonThemeWords, count);
    expect(result.counted).toBe(true);
    expect(result.hintEarned).toBe(true);
    expect(result.newCount).toBe(3);
  });

  it('should prevent hint farming via duplicate submissions', () => {
    let foundNonThemeWords = new Set(['WORD']);
    const count = 2; // 2 hints away from earning one

    // Try to submit same word 3 times
    const result1 = processNonThemeWord('WORD', foundNonThemeWords, count);
    const result2 = processNonThemeWord('WORD', foundNonThemeWords, count);
    const result3 = processNonThemeWord('WORD', foundNonThemeWords, count);

    // None should earn a hint
    expect(result1.hintEarned).toBe(false);
    expect(result2.hintEarned).toBe(false);
    expect(result3.hintEarned).toBe(false);

    // Counter should not increment
    expect(result1.newCount).toBe(2);
    expect(result2.newCount).toBe(2);
    expect(result3.newCount).toBe(2);
  });

  it('should track theme and non-theme words separately', () => {
    const foundWords = new Set(); // theme words only
    const foundNonThemeWords = new Set(); // non-theme words only

    // Add theme word
    foundWords.add('THEME');
    expect(foundWords.has('THEME')).toBe(true);
    expect(foundWords.size).toBe(1);

    // Add non-theme word (should be in separate set)
    foundNonThemeWords.add('VALID');
    expect(foundNonThemeWords.has('VALID')).toBe(true);
    expect(foundNonThemeWords.size).toBe(1);

    // Theme words set should not contain non-theme words
    expect(foundWords.has('VALID')).toBe(false);
    expect(foundWords.size).toBe(1);

    // Non-theme words set should not contain theme words
    expect(foundNonThemeWords.has('THEME')).toBe(false);
    expect(foundNonThemeWords.size).toBe(1);
  });
});
