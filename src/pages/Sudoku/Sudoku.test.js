import { describe, it, expect } from 'vitest';
import {
  createSeededRandom,
  seededShuffleArray,
  getTodayDateString,
  stringToSeed,
  formatTime,
} from '../../data/wordUtils';

// ===========================================
// Sudoku - Grid Utilities Tests
// ===========================================
describe('Sudoku - Grid Utilities', () => {
  const createEmptyGrid = () => {
    return Array(9).fill(null).map(() => Array(9).fill(0));
  };

  it('should create 9x9 empty grid', () => {
    const grid = createEmptyGrid();

    expect(grid.length).toBe(9);
    grid.forEach(row => {
      expect(row.length).toBe(9);
      row.forEach(cell => {
        expect(cell).toBe(0);
      });
    });
  });
});

// ===========================================
// Sudoku - Validation Tests
// ===========================================
describe('Sudoku - Validation', () => {
  const isValidPlacement = (grid, row, col, num) => {
    // Check row
    for (let x = 0; x < 9; x++) {
      if (grid[row][x] === num) return false;
    }

    // Check column
    for (let x = 0; x < 9; x++) {
      if (grid[x][col] === num) return false;
    }

    // Check 3x3 box
    const boxRow = Math.floor(row / 3) * 3;
    const boxCol = Math.floor(col / 3) * 3;
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        if (grid[boxRow + i][boxCol + j] === num) return false;
      }
    }

    return true;
  };

  const emptyGrid = Array(9).fill(null).map(() => Array(9).fill(0));

  it('should allow valid placement in empty grid', () => {
    expect(isValidPlacement(emptyGrid, 0, 0, 5)).toBe(true);
    expect(isValidPlacement(emptyGrid, 4, 4, 9)).toBe(true);
  });

  it('should reject duplicate in row', () => {
    const grid = emptyGrid.map(row => [...row]);
    grid[0][0] = 5;

    expect(isValidPlacement(grid, 0, 5, 5)).toBe(false);
  });

  it('should reject duplicate in column', () => {
    const grid = emptyGrid.map(row => [...row]);
    grid[0][0] = 5;

    expect(isValidPlacement(grid, 5, 0, 5)).toBe(false);
  });

  it('should reject duplicate in 3x3 box', () => {
    const grid = emptyGrid.map(row => [...row]);
    grid[0][0] = 5;

    expect(isValidPlacement(grid, 1, 1, 5)).toBe(false);
    expect(isValidPlacement(grid, 2, 2, 5)).toBe(false);
  });

  it('should allow same number in different box', () => {
    const grid = emptyGrid.map(row => [...row]);
    grid[0][0] = 5;

    // Different box (row 3+, col 3+)
    expect(isValidPlacement(grid, 3, 3, 5)).toBe(true);
  });

  it('should validate complete row constraints', () => {
    const grid = emptyGrid.map(row => [...row]);
    // Fill row 0 with 1-8, leaving column 8 empty
    for (let i = 0; i < 8; i++) {
      grid[0][i] = i + 1;
    }

    // Only 9 should be valid at position (0, 8)
    expect(isValidPlacement(grid, 0, 8, 9)).toBe(true);
    expect(isValidPlacement(grid, 0, 8, 1)).toBe(false);
    expect(isValidPlacement(grid, 0, 8, 5)).toBe(false);
  });
});

// ===========================================
// Sudoku - Solver Tests
// ===========================================
describe('Sudoku - Solver', () => {
  const isValidPlacement = (grid, row, col, num) => {
    for (let x = 0; x < 9; x++) {
      if (grid[row][x] === num) return false;
    }
    for (let x = 0; x < 9; x++) {
      if (grid[x][col] === num) return false;
    }
    const boxRow = Math.floor(row / 3) * 3;
    const boxCol = Math.floor(col / 3) * 3;
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        if (grid[boxRow + i][boxCol + j] === num) return false;
      }
    }
    return true;
  };

  const solveSudoku = (grid) => {
    const gridCopy = grid.map(row => [...row]);

    function solve() {
      for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
          if (gridCopy[row][col] === 0) {
            for (let num = 1; num <= 9; num++) {
              if (isValidPlacement(gridCopy, row, col, num)) {
                gridCopy[row][col] = num;
                if (solve()) return true;
                gridCopy[row][col] = 0;
              }
            }
            return false;
          }
        }
      }
      return true;
    }

    solve();
    return gridCopy;
  };

  it('should solve simple puzzle', () => {
    const puzzle = [
      [5, 3, 0, 0, 7, 0, 0, 0, 0],
      [6, 0, 0, 1, 9, 5, 0, 0, 0],
      [0, 9, 8, 0, 0, 0, 0, 6, 0],
      [8, 0, 0, 0, 6, 0, 0, 0, 3],
      [4, 0, 0, 8, 0, 3, 0, 0, 1],
      [7, 0, 0, 0, 2, 0, 0, 0, 6],
      [0, 6, 0, 0, 0, 0, 2, 8, 0],
      [0, 0, 0, 4, 1, 9, 0, 0, 5],
      [0, 0, 0, 0, 8, 0, 0, 7, 9],
    ];

    const solution = solveSudoku(puzzle);

    // Verify no zeros remain
    solution.forEach(row => {
      row.forEach(cell => {
        expect(cell).toBeGreaterThan(0);
        expect(cell).toBeLessThanOrEqual(9);
      });
    });
  });

  it('should not modify original puzzle', () => {
    const puzzle = [
      [0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0],
    ];
    const original = JSON.stringify(puzzle);

    solveSudoku(puzzle);

    expect(JSON.stringify(puzzle)).toBe(original);
  });
});

// ===========================================
// Sudoku - Difficulty Tests
// ===========================================
describe('Sudoku - Difficulty', () => {
  const DIFFICULTY_CELLS = {
    easy: 35,
    medium: 45,
    hard: 55,
    expert: 60,
  };

  it('should have more cells removed for harder difficulties', () => {
    expect(DIFFICULTY_CELLS.easy).toBeLessThan(DIFFICULTY_CELLS.medium);
    expect(DIFFICULTY_CELLS.medium).toBeLessThan(DIFFICULTY_CELLS.hard);
    expect(DIFFICULTY_CELLS.hard).toBeLessThan(DIFFICULTY_CELLS.expert);
  });

  it('should not remove more than 60 cells (leaving 21 clues minimum)', () => {
    Object.values(DIFFICULTY_CELLS).forEach(cells => {
      expect(cells).toBeLessThanOrEqual(60);
    });
  });

  it('should calculate filled cells correctly', () => {
    const totalCells = 81;
    const easyFilled = totalCells - DIFFICULTY_CELLS.easy;
    const expertFilled = totalCells - DIFFICULTY_CELLS.expert;

    expect(easyFilled).toBe(46);
    expect(expertFilled).toBe(21);
  });
});

// ===========================================
// Sudoku - Notes Tests
// ===========================================
describe('Sudoku - Notes', () => {
  const notesToJSON = (notes) => {
    const result = {};
    for (const [key, value] of Object.entries(notes)) {
      result[key] = Array.from(value);
    }
    return result;
  };

  const notesFromJSON = (json) => {
    const result = {};
    for (const [key, value] of Object.entries(json || {})) {
      result[key] = new Set(value);
    }
    return result;
  };

  it('should convert notes Set to JSON array', () => {
    const notes = {
      '0-0': new Set([1, 2, 3]),
      '1-1': new Set([4, 5]),
    };

    const json = notesToJSON(notes);

    expect(json['0-0']).toEqual([1, 2, 3]);
    expect(json['1-1']).toEqual([4, 5]);
  });

  it('should convert JSON array back to Set', () => {
    const json = {
      '0-0': [1, 2, 3],
      '1-1': [4, 5],
    };

    const notes = notesFromJSON(json);

    expect(notes['0-0']).toBeInstanceOf(Set);
    expect(notes['0-0'].has(1)).toBe(true);
    expect(notes['0-0'].has(2)).toBe(true);
    expect(notes['0-0'].has(3)).toBe(true);
    expect(notes['1-1'].has(4)).toBe(true);
  });

  it('should handle empty notes', () => {
    const notes = notesFromJSON(null);
    expect(notes).toEqual({});

    const notes2 = notesFromJSON({});
    expect(notes2).toEqual({});
  });

  it('should toggle notes correctly', () => {
    const cellNotes = new Set([1, 2, 3]);

    // Remove 2
    cellNotes.delete(2);
    expect(cellNotes.has(2)).toBe(false);
    expect(cellNotes.has(1)).toBe(true);

    // Add 4
    cellNotes.add(4);
    expect(cellNotes.has(4)).toBe(true);
  });
});

// ===========================================
// Sudoku - Timer Tests
// ===========================================
describe('Sudoku - Timer', () => {
  it('should format time correctly', () => {
    expect(formatTime(0)).toBe('00:00');
    expect(formatTime(59)).toBe('00:59');
    expect(formatTime(60)).toBe('01:00');
    expect(formatTime(61)).toBe('01:01');
    expect(formatTime(3599)).toBe('59:59');
    expect(formatTime(3600)).toBe('60:00');
  });

  it('should pad single digits', () => {
    expect(formatTime(5)).toBe('00:05');
    expect(formatTime(65)).toBe('01:05');
  });
});

// ===========================================
// Sudoku - Daily Puzzle Tests
// ===========================================
describe('Sudoku - Daily Puzzle', () => {
  it('should generate consistent seed for same date and difficulty', () => {
    const date = '2026-01-12';
    const difficulty = 'medium';
    const puzzleNumber = 1;

    const seed1 = stringToSeed(`${date}-${difficulty}-${puzzleNumber}`);
    const seed2 = stringToSeed(`${date}-${difficulty}-${puzzleNumber}`);

    expect(seed1).toBe(seed2);
  });

  it('should generate different seeds for different difficulties', () => {
    const date = '2026-01-12';

    const seedMedium = stringToSeed(`${date}-medium-1`);
    const seedHard = stringToSeed(`${date}-hard-1`);

    expect(seedMedium).not.toBe(seedHard);
  });

  it('should generate different seeds for different dates', () => {
    const seed1 = stringToSeed('2026-01-12-medium-1');
    const seed2 = stringToSeed('2026-01-13-medium-1');

    expect(seed1).not.toBe(seed2);
  });

  it('should increment puzzle number for new puzzles on same day', () => {
    let puzzleNumber = 1;

    // Force new puzzle
    puzzleNumber++;

    expect(puzzleNumber).toBe(2);

    const seed1 = stringToSeed('2026-01-12-medium-1');
    const seed2 = stringToSeed('2026-01-12-medium-2');

    expect(seed1).not.toBe(seed2);
  });
});

// ===========================================
// Sudoku - Completion Detection Tests
// ===========================================
describe('Sudoku - Completion Detection', () => {
  const isComplete = (grid, solution) => {
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        if (grid[row][col] !== solution[row][col]) {
          return false;
        }
      }
    }
    return true;
  };

  const solution = [
    [5, 3, 4, 6, 7, 8, 9, 1, 2],
    [6, 7, 2, 1, 9, 5, 3, 4, 8],
    [1, 9, 8, 3, 4, 2, 5, 6, 7],
    [8, 5, 9, 7, 6, 1, 4, 2, 3],
    [4, 2, 6, 8, 5, 3, 7, 9, 1],
    [7, 1, 3, 9, 2, 4, 8, 5, 6],
    [9, 6, 1, 5, 3, 7, 2, 8, 4],
    [2, 8, 7, 4, 1, 9, 6, 3, 5],
    [3, 4, 5, 2, 8, 6, 1, 7, 9],
  ];

  it('should detect complete puzzle', () => {
    expect(isComplete(solution, solution)).toBe(true);
  });

  it('should detect incomplete puzzle', () => {
    const incomplete = solution.map(row => [...row]);
    incomplete[0][0] = 0;

    expect(isComplete(incomplete, solution)).toBe(false);
  });

  it('should detect wrong answer', () => {
    const wrong = solution.map(row => [...row]);
    wrong[0][0] = 1; // Should be 5

    expect(isComplete(wrong, solution)).toBe(false);
  });
});
