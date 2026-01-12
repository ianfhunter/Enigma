import { describe, it, expect } from 'vitest';
import {
  parseCluesData,
  generateCrossword,
  getDailySeed,
  getTodayDateString,
  checkLetter,
  isPuzzleComplete,
  getEmptyCells,
} from './crosswordUtils';

// ===========================================
// Crossword - parseCluesData Tests
// ===========================================
describe('Crossword - parseCluesData', () => {
  it('should parse tab-separated clue data', () => {
    const rawData = 'What is 2+2?\tFOUR\nCapital of France\tPARIS';
    const clues = parseCluesData(rawData);

    expect(clues).toHaveLength(2);
    expect(clues[0]).toEqual({ clue: 'What is 2+2?', answer: 'FOUR' });
    expect(clues[1]).toEqual({ clue: 'Capital of France', answer: 'PARIS' });
  });

  it('should convert answers to uppercase', () => {
    const rawData = 'Test\tlower';
    const clues = parseCluesData(rawData);

    expect(clues[0].answer).toBe('LOWER');
  });

  it('should remove non-letter characters from answers', () => {
    const rawData = 'Test\tHEL-LO';
    const clues = parseCluesData(rawData);

    expect(clues[0].answer).toBe('HELLO');
  });

  it('should filter answers to 3-12 characters', () => {
    const rawData = 'Short\tAB\nGood\tCAT\nTooLong\tABCDEFGHIJKLM';
    const clues = parseCluesData(rawData);

    // Only 'CAT' (3 letters) should pass
    expect(clues).toHaveLength(1);
    expect(clues[0].answer).toBe('CAT');
  });

  it('should handle Windows line endings', () => {
    const rawData = 'Test1\tONE\r\nTest2\tTWO';
    const clues = parseCluesData(rawData);

    expect(clues).toHaveLength(2);
  });

  it('should handle Mac line endings', () => {
    const rawData = 'Test1\tONE\rTest2\tTWO';
    const clues = parseCluesData(rawData);

    expect(clues).toHaveLength(2);
  });

  it('should clean up quoted clues', () => {
    const rawData = '"This is a clue"\tANSWER';
    const clues = parseCluesData(rawData);

    expect(clues[0].clue).toBe('This is a clue');
  });

  it('should handle double quotes within clues', () => {
    const rawData = '"Say ""hello"""\tGREET';
    const clues = parseCluesData(rawData);

    expect(clues[0].clue).toBe('Say "hello"');
  });
});

// ===========================================
// Crossword - generateCrossword Tests
// ===========================================
describe('Crossword - generateCrossword', () => {
  const sampleClues = [
    { clue: 'Opposite of cold', answer: 'WARM' },
    { clue: 'A type of tree', answer: 'OAK' },
    { clue: 'To move quickly', answer: 'RUN' },
    { clue: 'A large body of water', answer: 'OCEAN' },
    { clue: 'Primary color', answer: 'RED' },
    { clue: 'Canine pet', answer: 'DOG' },
    { clue: 'Feline pet', answer: 'CAT' },
    { clue: 'Building material', answer: 'WOOD' },
    { clue: 'Liquid sustenance', answer: 'WATER' },
    { clue: 'Gas we breathe', answer: 'AIR' },
    { clue: 'Writing tool', answer: 'PEN' },
    { clue: 'Time period', answer: 'DAY' },
    { clue: 'Illumination source', answer: 'LAMP' },
    { clue: 'Reading material', answer: 'BOOK' },
    { clue: 'Place to sit', answer: 'CHAIR' },
    { clue: 'Walking surface', answer: 'FLOOR' },
    { clue: 'Weather phenomenon', answer: 'RAIN' },
    { clue: 'Sky color', answer: 'BLUE' },
    { clue: 'Grass color', answer: 'GREEN' },
    { clue: 'Night light', answer: 'MOON' },
  ];

  it('should generate a crossword with grid', () => {
    const crossword = generateCrossword(sampleClues, { seed: 12345, targetWords: 5 });

    expect(crossword.grid).toBeDefined();
    expect(Array.isArray(crossword.grid)).toBe(true);
  });

  it('should generate across and down clues', () => {
    const crossword = generateCrossword(sampleClues, { seed: 12345, targetWords: 5 });

    expect(crossword.across).toBeDefined();
    expect(crossword.down).toBeDefined();
    expect(Array.isArray(crossword.across)).toBe(true);
    expect(Array.isArray(crossword.down)).toBe(true);
  });

  it('should generate cell numbers', () => {
    const crossword = generateCrossword(sampleClues, { seed: 12345, targetWords: 5 });

    expect(crossword.cellNumbers).toBeDefined();
    expect(typeof crossword.cellNumbers).toBe('object');
  });

  it('should produce consistent results with same seed', () => {
    const crossword1 = generateCrossword(sampleClues, { seed: 12345, targetWords: 5 });
    const crossword2 = generateCrossword(sampleClues, { seed: 12345, targetWords: 5 });

    expect(crossword1.grid).toEqual(crossword2.grid);
    expect(crossword1.across.length).toBe(crossword2.across.length);
    expect(crossword1.down.length).toBe(crossword2.down.length);
  });

  it('should produce different results with different seeds', () => {
    const crossword1 = generateCrossword(sampleClues, { seed: 12345, targetWords: 5 });
    const crossword2 = generateCrossword(sampleClues, { seed: 54321, targetWords: 5 });

    // The grids should be different (highly likely with different seeds)
    const grid1String = JSON.stringify(crossword1.grid);
    const grid2String = JSON.stringify(crossword2.grid);

    // Not guaranteed but very likely to be different
    expect(grid1String !== grid2String || crossword1.across.length !== crossword2.across.length).toBe(true);
  });

  it('should include grid size information', () => {
    const crossword = generateCrossword(sampleClues, { seed: 12345, targetWords: 5 });

    expect(crossword.size).toBeDefined();
    expect(crossword.size.rows).toBeGreaterThan(0);
    expect(crossword.size.cols).toBeGreaterThan(0);
  });

  it('should generate clue entries with required fields', () => {
    const crossword = generateCrossword(sampleClues, { seed: 12345, targetWords: 5 });

    if (crossword.across.length > 0) {
      const clue = crossword.across[0];
      expect(clue.number).toBeDefined();
      expect(clue.clue).toBeDefined();
      expect(clue.answer).toBeDefined();
      expect(clue.row).toBeDefined();
      expect(clue.col).toBeDefined();
    }
  });
});

// ===========================================
// Crossword - getDailySeed Tests
// ===========================================
describe('Crossword - getDailySeed', () => {
  it('should return a number', () => {
    const seed = getDailySeed('2026-01-12');

    expect(typeof seed).toBe('number');
  });

  it('should return the same seed for the same date', () => {
    const seed1 = getDailySeed('2026-01-12');
    const seed2 = getDailySeed('2026-01-12');

    expect(seed1).toBe(seed2);
  });

  it('should return different seeds for different dates', () => {
    const seed1 = getDailySeed('2026-01-12');
    const seed2 = getDailySeed('2026-01-13');

    expect(seed1).not.toBe(seed2);
  });

  it('should return positive number', () => {
    const seed = getDailySeed('2026-01-12');

    expect(seed).toBeGreaterThan(0);
  });
});

// ===========================================
// Crossword - getTodayDateString Tests
// ===========================================
describe('Crossword - getTodayDateString', () => {
  it('should return a string in YYYY-MM-DD format', () => {
    const dateStr = getTodayDateString();

    expect(dateStr).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('should return a valid date', () => {
    const dateStr = getTodayDateString();
    const date = new Date(dateStr);

    expect(date.toString()).not.toBe('Invalid Date');
  });
});

// ===========================================
// Crossword - checkLetter Tests
// ===========================================
describe('Crossword - checkLetter', () => {
  const mockPuzzle = {
    grid: [
      ['C', 'A', 'T'],
      ['A', null, null],
      ['R', null, null],
    ],
  };

  it('should return true for correct letter', () => {
    expect(checkLetter(mockPuzzle, 0, 0, 'C')).toBe(true);
    expect(checkLetter(mockPuzzle, 0, 1, 'A')).toBe(true);
  });

  it('should return false for incorrect letter', () => {
    expect(checkLetter(mockPuzzle, 0, 0, 'X')).toBe(false);
  });

  it('should be case insensitive', () => {
    expect(checkLetter(mockPuzzle, 0, 0, 'c')).toBe(true);
    expect(checkLetter(mockPuzzle, 0, 0, 'C')).toBe(true);
  });

  it('should return false for out of bounds', () => {
    expect(checkLetter(mockPuzzle, -1, 0, 'C')).toBe(false);
    expect(checkLetter(mockPuzzle, 10, 0, 'C')).toBe(false);
  });

  it('should handle null cells', () => {
    expect(checkLetter(mockPuzzle, 1, 1, 'X')).toBe(false);
  });
});

// ===========================================
// Crossword - isPuzzleComplete Tests
// ===========================================
describe('Crossword - isPuzzleComplete', () => {
  const mockPuzzle = {
    grid: [
      ['C', 'A', 'T'],
      ['A', null, null],
      ['R', null, null],
    ],
  };

  it('should return true when all letters are filled correctly', () => {
    const userGrid = [
      ['C', 'A', 'T'],
      ['A', '', ''],
      ['R', '', ''],
    ];

    expect(isPuzzleComplete(mockPuzzle, userGrid)).toBe(true);
  });

  it('should return false when letters are missing', () => {
    const userGrid = [
      ['C', 'A', ''],
      ['A', '', ''],
      ['R', '', ''],
    ];

    expect(isPuzzleComplete(mockPuzzle, userGrid)).toBe(false);
  });

  it('should return false when letters are wrong', () => {
    const userGrid = [
      ['C', 'A', 'X'],
      ['A', '', ''],
      ['R', '', ''],
    ];

    expect(isPuzzleComplete(mockPuzzle, userGrid)).toBe(false);
  });

  it('should be case insensitive', () => {
    const userGrid = [
      ['c', 'a', 't'],
      ['a', '', ''],
      ['r', '', ''],
    ];

    expect(isPuzzleComplete(mockPuzzle, userGrid)).toBe(true);
  });
});

// ===========================================
// Crossword - getEmptyCells Tests
// ===========================================
describe('Crossword - getEmptyCells', () => {
  const mockPuzzle = {
    grid: [
      ['C', 'A', 'T'],
      ['A', null, null],
      ['R', null, null],
    ],
  };

  it('should return all cells when grid is empty', () => {
    const userGrid = [
      ['', '', ''],
      ['', '', ''],
      ['', '', ''],
    ];

    const empty = getEmptyCells(mockPuzzle, userGrid);

    // Should return 5 empty cells (non-null in puzzle: C, A, T, A, R)
    expect(empty).toHaveLength(5);
  });

  it('should return no cells when all filled', () => {
    const userGrid = [
      ['C', 'A', 'T'],
      ['A', '', ''],
      ['R', '', ''],
    ];

    const empty = getEmptyCells(mockPuzzle, userGrid);

    expect(empty).toHaveLength(0);
  });

  it('should return remaining empty cells', () => {
    const userGrid = [
      ['C', 'A', ''],
      ['A', '', ''],
      ['', '', ''],
    ];

    const empty = getEmptyCells(mockPuzzle, userGrid);

    // T at (0,2) and R at (2,0) are empty
    expect(empty).toHaveLength(2);
  });

  it('should include answer in empty cell info', () => {
    const userGrid = [
      ['', '', ''],
      ['', '', ''],
      ['', '', ''],
    ];

    const empty = getEmptyCells(mockPuzzle, userGrid);

    expect(empty[0]).toHaveProperty('answer');
    expect(empty[0]).toHaveProperty('row');
    expect(empty[0]).toHaveProperty('col');
  });
});
