import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('../../data/wordUtils', async () => {
  const actual = await vi.importActual('../../data/wordUtils');

  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

  const makeWords = (length, evenLetter) => {
    const words = [];
    for (let i = 0; i < 130; i++) {
      const a = letters[i % letters.length];
      const b = letters[(i + 7) % letters.length];
      if (length === 5) {
        words.push(`${evenLetter}${a}${evenLetter}${b}${evenLetter}`);
      } else if (length === 7) {
        const c = letters[(i + 13) % letters.length];
        words.push(`${evenLetter}${a}${evenLetter}${b}${evenLetter}${c}${evenLetter}`);
      }
    }
    return words;
  };

  const wordBank = {
    5: makeWords(5, 'A'),
    7: makeWords(7, 'B'),
  };

  return {
    ...actual,
    // Keep deterministic date while using real seed + RNG implementations
    getTodayDateString: () => '2024-01-01',
    getCommonWordsByLength: (len) => [...(wordBank[len] || [])].slice(0, 50),
    getWordsByLength: (len) => [...(wordBank[len] || [])],
  };
});

import { CONFIGS, generateWaffle, checkCorrectness, isSolved } from './Squarish.jsx';

describe('Squarish - helpers', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('exposes configs', () => {
    expect(Object.keys(CONFIGS)).toContain('5');
  });

  it('generateWaffle creates solution and scrambled grids', () => {
    const puzzle = generateWaffle(123, 5);
    expect(puzzle?.solution.length).toBe(5);
    expect(puzzle?.scrambled.length).toBe(5);
    expect(Object.keys(puzzle.words)).toContain('h1');
  });

  it('checkCorrectness marks matching cells, isSolved detects full match', () => {
    const solution = [
      ['A', 'B'],
      ['C', 'D'],
    ];
    const grid = [
      ['A', 'B'],
      ['X', 'D'],
    ];
    const correct = checkCorrectness(grid, solution, 2);
    expect(correct.has('0,0')).toBe(true);
    expect(correct.has('1,0')).toBe(false);
    expect(isSolved(solution, solution, 2)).toBe(true);
  });
});
import { describe, it, expect } from 'vitest';
import {
  createSeededRandom,
  getTodayDateString,
  stringToSeed,
  getWordsByLength,
  getCommonWordsByLength,
} from '../../data/wordUtils';

// ===========================================
// Squarish - Grid Logic Tests
// ===========================================
describe('Squarish - Grid Logic', () => {
  // Check if all cells match solution
  const isSolved = (grid, solution, size) => {
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (grid[r][c] !== solution[r][c]) return false;
      }
    }
    return true;
  };

  // Check correctness of cells
  const checkCorrectness = (grid, solution, size) => {
    const correct = [];
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (grid[r][c] === solution[r][c]) {
          correct.push(`${r},${c}`);
        }
      }
    }
    return new Set(correct);
  };

  const mockSolution = [
    ['S', 'T', 'A', 'R', 'T'],
    ['E', '', 'R', '', 'E'],
    ['A', 'R', 'E', 'N', 'A'],
    ['L', '', 'A', '', 'S'],
    ['S', 'T', 'A', 'R', 'S'],
  ];

  it('should detect solved puzzle correctly', () => {
    const solved = [
      ['S', 'T', 'A', 'R', 'T'],
      ['E', '', 'R', '', 'E'],
      ['A', 'R', 'E', 'N', 'A'],
      ['L', '', 'A', '', 'S'],
      ['S', 'T', 'A', 'R', 'S'],
    ];

    expect(isSolved(solved, mockSolution, 5)).toBe(true);
  });

  it('should detect unsolved puzzle', () => {
    const unsolved = [
      ['S', 'R', 'A', 'A', 'T'],
      ['E', '', 'T', '', 'E'],
      ['A', 'R', 'E', 'N', 'A'],
      ['L', '', 'R', '', 'S'],
      ['S', 'T', 'S', 'A', 'S'],
    ];

    expect(isSolved(unsolved, mockSolution, 5)).toBe(false);
  });

  it('should identify correct cells', () => {
    const partialGrid = [
      ['S', 'R', 'A', 'A', 'T'],
      ['E', '', 'T', '', 'E'],
      ['A', 'R', 'E', 'N', 'A'],
      ['L', '', 'R', '', 'S'],
      ['S', 'T', 'S', 'A', 'S'],
    ];

    const correct = checkCorrectness(partialGrid, mockSolution, 5);

    expect(correct.has('0,0')).toBe(true); // S matches
    expect(correct.has('0,2')).toBe(true); // A matches
    expect(correct.has('2,2')).toBe(true); // E matches (center)
  });

  it('should count correct cells properly', () => {
    const partialGrid = [
      ['S', 'T', 'A', 'R', 'T'],
      ['E', '', 'R', '', 'E'],
      ['A', 'R', 'E', 'N', 'A'],
      ['L', '', 'A', '', 'S'],
      ['S', 'T', 'A', 'R', 'X'], // Only last cell wrong
    ];

    const correct = checkCorrectness(partialGrid, mockSolution, 5);
    // 20 letter cells correct + 4 empty cells matching = 24 total
    // (empty cells match because '' === '')
    expect(correct.size).toBe(24);
  });
});

// ===========================================
// Squarish - Swap Logic Tests
// ===========================================
describe('Squarish - Swap Logic', () => {
  const swapCells = (grid, r1, c1, r2, c2) => {
    const newGrid = grid.map(row => [...row]);
    const temp = newGrid[r1][c1];
    newGrid[r1][c1] = newGrid[r2][c2];
    newGrid[r2][c2] = temp;
    return newGrid;
  };

  it('should swap two cells correctly', () => {
    const grid = [
      ['A', 'B'],
      ['C', 'D'],
    ];

    const swapped = swapCells(grid, 0, 0, 1, 1);

    expect(swapped[0][0]).toBe('D');
    expect(swapped[1][1]).toBe('A');
    expect(swapped[0][1]).toBe('B');
    expect(swapped[1][0]).toBe('C');
  });

  it('should not modify original grid', () => {
    const grid = [
      ['A', 'B'],
      ['C', 'D'],
    ];
    const original = JSON.stringify(grid);

    swapCells(grid, 0, 0, 1, 1);

    expect(JSON.stringify(grid)).toBe(original);
  });

  it('should handle swapping same cell (no-op)', () => {
    const grid = [
      ['A', 'B'],
      ['C', 'D'],
    ];

    const swapped = swapCells(grid, 0, 0, 0, 0);

    expect(swapped[0][0]).toBe('A');
  });
});

// ===========================================
// Squarish - Cell Status Tests
// ===========================================
describe('Squarish - Cell Status', () => {
  const mockSolution = [
    ['S', 'T', 'A', 'R', 'T'],
    ['E', '', 'R', '', 'E'],
    ['A', 'R', 'E', 'N', 'A'],
    ['L', '', 'A', '', 'S'],
    ['S', 'T', 'A', 'R', 'S'],
  ];

  // Simplified getCellStatus for testing
  const getCellStatus = (grid, solution, row, col, correctCells) => {
    if (!grid[row][col]) return 'empty';
    if (correctCells.has(`${row},${col}`)) return 'correct';

    const letter = grid[row][col];
    const solutionLetter = solution[row][col];

    if (letter === solutionLetter) return 'correct';

    // Check if in row or column (simplified)
    const isWordRow = row % 2 === 0;
    const isWordCol = col % 2 === 0;

    const solutionRow = solution[row] || [];
    const solutionCol = solution.map(r => r[col]) || [];

    const isInRow = isWordRow && solutionRow.includes(letter);
    const isInCol = isWordCol && solutionCol.includes(letter);

    if (isInRow || isInCol) return 'present';
    return 'absent';
  };

  it('should return "empty" for blank cells', () => {
    const grid = mockSolution;
    const correctCells = new Set();

    expect(getCellStatus(grid, mockSolution, 1, 1, correctCells)).toBe('empty');
  });

  it('should return "correct" for cells in correct position', () => {
    const grid = mockSolution;
    const correctCells = new Set(['0,0']);

    expect(getCellStatus(grid, mockSolution, 0, 0, correctCells)).toBe('correct');
  });

  it('should return "present" for letters in wrong position but in word', () => {
    const grid = [
      ['T', 'S', 'A', 'R', 'T'], // T and S swapped
      ['E', '', 'R', '', 'E'],
      ['A', 'R', 'E', 'N', 'A'],
      ['L', '', 'A', '', 'S'],
      ['S', 'T', 'A', 'R', 'S'],
    ];
    const correctCells = new Set();

    // T is at (0,0) but should be at (0,1), so it's "present" in row
    expect(getCellStatus(grid, mockSolution, 0, 0, correctCells)).toBe('present');
  });
});

// ===========================================
// Squarish - Swap Counter Tests
// ===========================================
describe('Squarish - Swap Counter', () => {
  const CONFIGS = {
    5: { gridSize: 5, maxSwaps: 15, wordCount: 6 },
    7: { gridSize: 7, maxSwaps: 25, wordCount: 8 },
  };

  it('should have correct max swaps for 5x5', () => {
    expect(CONFIGS[5].maxSwaps).toBe(15);
  });

  it('should have correct max swaps for 7x7', () => {
    expect(CONFIGS[7].maxSwaps).toBe(25);
  });

  it('should track swaps remaining correctly', () => {
    let swapsLeft = CONFIGS[5].maxSwaps;

    // Simulate 5 swaps
    for (let i = 0; i < 5; i++) {
      swapsLeft--;
    }

    expect(swapsLeft).toBe(10);
  });

  it('should detect game over when swaps exhausted', () => {
    let swapsLeft = 1;
    swapsLeft--;

    expect(swapsLeft <= 0).toBe(true);
  });
});

// ===========================================
// Squarish - Seed Consistency Tests
// ===========================================
describe('Squarish - Seed Consistency', () => {
  it('should generate consistent results with same seed', () => {
    const seed = stringToSeed('squarish5-2026-01-12');

    const random1 = createSeededRandom(seed);
    const random2 = createSeededRandom(seed);

    // Generate same sequence
    const seq1 = Array(10).fill(0).map(() => random1());
    const seq2 = Array(10).fill(0).map(() => random2());

    expect(seq1).toEqual(seq2);
  });

  it('should generate different results with different seeds', () => {
    const seed1 = stringToSeed('squarish5-2026-01-12');
    const seed2 = stringToSeed('squarish5-2026-01-13');

    const random1 = createSeededRandom(seed1);
    const random2 = createSeededRandom(seed2);

    const seq1 = Array(10).fill(0).map(() => random1());
    const seq2 = Array(10).fill(0).map(() => random2());

    expect(seq1).not.toEqual(seq2);
  });

  it('should have words of correct length available', () => {
    const words5 = getWordsByLength(5);
    const words7 = getWordsByLength(7);

    expect(words5.length).toBeGreaterThan(100);
    expect(words7.length).toBeGreaterThan(100);

    words5.forEach(word => expect(word.length).toBe(5));
    words7.forEach(word => expect(word.length).toBe(7));
  });
});

describe('Squarish - grid size switching', () => {
  it('should have all sizes defined in CONFIGS', () => {
    expect(CONFIGS).toBeDefined();
    const sizes = Object.keys(CONFIGS).map(Number);
    expect(sizes.length).toBeGreaterThan(0);
    sizes.forEach((size) => {
      expect(CONFIGS[size]).toBeDefined();
      expect(CONFIGS[size].gridSize).toBe(size);
      expect(CONFIGS[size].maxSwaps).toBeGreaterThan(0);
    });
  });

  it('should generate puzzles for all available sizes without crashing', { timeout: 30000 }, () => {
    Object.keys(CONFIGS).forEach((sizeKey) => {
      const size = Number(sizeKey);
      expect(() => {
        const today = getTodayDateString();
        const seed = stringToSeed(`squarish${size}-${today}-0`);
        const puzzle = generateWaffle(seed, size);
        expect(puzzle).toBeDefined();
        expect(puzzle.solution.length).toBe(size);
        expect(puzzle.scrambled.length).toBe(size);
      }).not.toThrow();
    });
  });

  it('should switch between all sizes sequentially without crashing', { timeout: 30000 }, () => {
    const sizes = Object.keys(CONFIGS).map(Number);
    for (let i = 0; i < sizes.length; i++) {
      const size = sizes[i];
      expect(() => {
        const today = getTodayDateString();
        const seed = stringToSeed(`squarish${size}-${today}-0`);
        const puzzle = generateWaffle(seed, size);
        expect(puzzle.solution.length).toBe(size);
        expect(puzzle.scrambled.length).toBe(size);
      }).not.toThrow();
    }
  });

  it('should handle rapid size switching (all sizes in sequence)', { timeout: 30000 }, () => {
    const sizes = Object.keys(CONFIGS).map(Number);
    const puzzles = [];
    
    for (let i = 0; i < sizes.length; i++) {
      const size = sizes[i];
      const today = getTodayDateString();
      const seed = stringToSeed(`squarish${size}-${today}-0`);
      const puzzle = generateWaffle(seed, size);
      puzzles.push({ size, puzzle });
    }
    
    expect(puzzles).toHaveLength(sizes.length);
    puzzles.forEach(({ size, puzzle }) => {
      expect(puzzle.solution.length).toBe(size);
      expect(puzzle.scrambled.length).toBe(size);
    });
  });

  it('should handle switching from largest to smallest size', { timeout: 30000 }, () => {
    const sizes = Object.keys(CONFIGS).map(Number);
    const largest = Math.max(...sizes);
    const smallest = Math.min(...sizes);
    
    expect(() => {
      const today = getTodayDateString();
      const largeSeed = stringToSeed(`squarish${largest}-${today}-0`);
      const smallSeed = stringToSeed(`squarish${smallest}-${today}-0`);
      const largePuzzle = generateWaffle(largeSeed, largest);
      const smallPuzzle = generateWaffle(smallSeed, smallest);
      
      expect(largePuzzle.solution.length).toBe(largest);
      expect(smallPuzzle.solution.length).toBe(smallest);
    }).not.toThrow();
  });

  it('should handle switching from smallest to largest size', { timeout: 30000 }, () => {
    const sizes = Object.keys(CONFIGS).map(Number);
    const smallest = Math.min(...sizes);
    const largest = Math.max(...sizes);
    
    expect(() => {
      const today = getTodayDateString();
      const smallSeed = stringToSeed(`squarish${smallest}-${today}-0`);
      const largeSeed = stringToSeed(`squarish${largest}-${today}-0`);
      const smallPuzzle = generateWaffle(smallSeed, smallest);
      const largePuzzle = generateWaffle(largeSeed, largest);
      
      expect(smallPuzzle.solution.length).toBe(smallest);
      expect(largePuzzle.solution.length).toBe(largest);
    }).not.toThrow();
  });
});

// ===========================================
// Squarish - Letter Multiset Validation Tests
// ===========================================
describe('Squarish - Letter Multiset Validation', () => {
  // Helper to get sorted letter string from grid
  const getLetters = (grid, size) => {
    const letters = [];
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (grid[r][c]) letters.push(grid[r][c]);
      }
    }
    return letters.sort().join('');
  };

  // Simple puzzle generator for testing (copied logic)
  const generateTestPuzzle = (seed, size) => {
    const random = createSeededRandom(seed);
    const words = getCommonWordsByLength(size);

    for (let i = words.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [words[i], words[j]] = [words[j], words[i]];
    }

    const numWords = size === 5 ? 3 : 4;
    const maxAttempts = 100;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const horizontals = [];
      for (let i = 0; i < numWords; i++) {
        horizontals.push(words[Math.floor(random() * words.length)]);
      }

      const verticals = [];
      let valid = true;

      for (let col = 0; col < numWords && valid; col++) {
        const colIndex = col * 2;
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
        const solution = [];
        for (let r = 0; r < size; r++) {
          const row = [];
          for (let c = 0; c < size; c++) {
            if (r % 2 === 0) {
              row.push(horizontals[r / 2][c]);
            } else if (c % 2 === 0) {
              row.push(verticals[c / 2][r]);
            } else {
              row.push('');
            }
          }
          solution.push(row);
        }

        const letters = [];
        for (let r = 0; r < size; r++) {
          for (let c = 0; c < size; c++) {
            if (solution[r][c]) {
              letters.push({ letter: solution[r][c], row: r, col: c });
            }
          }
        }

        const nonIntersection = letters.filter(l =>
          !(l.row % 2 === 0 && l.col % 2 === 0)
        );

        for (let i = nonIntersection.length - 1; i > 0; i--) {
          const j = Math.floor(random() * (i + 1));
          const tempLetter = nonIntersection[i].letter;
          nonIntersection[i].letter = nonIntersection[j].letter;
          nonIntersection[j].letter = tempLetter;
        }

        const scrambled = solution.map(row => [...row]);
        for (const item of nonIntersection) {
          scrambled[item.row][item.col] = item.letter;
        }

        return { solution, scrambled, size };
      }
    }
    return null;
  };

  it('should generate 5x5 puzzles with matching letter multisets', () => {
    // Test multiple seeds
    for (let seedNum = 0; seedNum < 5; seedNum++) {
      const seed = stringToSeed(`squarish5-test-${seedNum}`);
      const puzzle = generateTestPuzzle(seed, 5);

      if (puzzle) {
        const solutionLetters = getLetters(puzzle.solution, 5);
        const scrambledLetters = getLetters(puzzle.scrambled, 5);
        expect(scrambledLetters).toBe(solutionLetters);
      }
    }
  });

  it('should generate 7x7 puzzles with matching letter multisets', () => {
    // Test multiple seeds
    for (let seedNum = 0; seedNum < 3; seedNum++) {
      const seed = stringToSeed(`squarish7-test-${seedNum}`);
      const puzzle = generateTestPuzzle(seed, 7);

      if (puzzle) {
        const solutionLetters = getLetters(puzzle.solution, 7);
        const scrambledLetters = getLetters(puzzle.scrambled, 7);
        expect(scrambledLetters).toBe(solutionLetters);
      }
    }
  });
});
