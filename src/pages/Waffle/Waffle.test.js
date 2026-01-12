import { describe, it, expect } from 'vitest';
import {
  createSeededRandom,
  getTodayDateString,
  stringToSeed,
  getWordsByLength,
} from '../../data/wordUtils';

// ===========================================
// Waffle - Grid Logic Tests
// ===========================================
describe('Waffle - Grid Logic', () => {
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
// Waffle - Swap Logic Tests
// ===========================================
describe('Waffle - Swap Logic', () => {
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
// Waffle - Cell Status Tests
// ===========================================
describe('Waffle - Cell Status', () => {
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
// Waffle - Swap Counter Tests
// ===========================================
describe('Waffle - Swap Counter', () => {
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
// Waffle - Seed Consistency Tests
// ===========================================
describe('Waffle - Seed Consistency', () => {
  it('should generate consistent results with same seed', () => {
    const seed = stringToSeed('waffle5-2026-01-12');

    const random1 = createSeededRandom(seed);
    const random2 = createSeededRandom(seed);

    // Generate same sequence
    const seq1 = Array(10).fill(0).map(() => random1());
    const seq2 = Array(10).fill(0).map(() => random2());

    expect(seq1).toEqual(seq2);
  });

  it('should generate different results with different seeds', () => {
    const seed1 = stringToSeed('waffle5-2026-01-12');
    const seed2 = stringToSeed('waffle5-2026-01-13');

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
